/**
 * ChatBot - Componente de Chat con IA
 * Widget flotante para interactuar con el asistente de Chuwue Grill
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaComments, FaTimes, FaPaperPlane, FaImage, FaSpinner, FaFilePdf } from 'react-icons/fa';
import '../css/ChatBot.css';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolUsed?: string;
}

interface ChatBotProps {
  apiUrl?: string;
}

export default function ChatBot({ apiUrl = 'http://localhost:8003' }: ChatBotProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isInQueue, setIsInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '¡Bienvenido a Chuwue Grill! 🍗\n\n¿En qué puedo ayudarte hoy?\n\n1. Ver menú del día 🍽️\n2. Hacer una reserva 📅\n3. Unirme a la fila virtual 🎫\n4. Ver promociones actuales 🎉\n5. Hablar con un asistente 💬\n\nEscribe el número o tu pregunta.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage && !selectedPdf) return;

    // Manejar opciones del menú
    let messageToSend = inputValue;
    
    // Opción 1: Redirigir a Menú
    if (inputValue === '1') {
      setIsOpen(false);
      navigate('/menu');
      return;
    }
    
    // Opción 3: Redirigir a Fila Virtual
    if (inputValue === '3') {
      setIsOpen(false);
      navigate('/fila-virtual');
      return;
    }
    
    // Opción 5: Activar cola de espera
    if (inputValue === '5') {
      setIsInQueue(true);
      const randomPosition = Math.floor(Math.random() * 5) + 1;
      setQueuePosition(randomPosition);
      
      const queueMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Has sido agregado a la cola de atención.\n\n👥 Posición: ${randomPosition}\n⏱️ Tiempo estimado: ${randomPosition * 3} minutos\n\n💬 Un asistente te atenderá pronto. Gracias por tu paciencia.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, queueMessage]);
      setInputValue('');
      return;
    }
    
    // Opciones con mensajes predefinidos
    if (inputValue === '2') {
      messageToSend = 'Quiero hacer una reserva. ¿Qué información necesitas?';
    } else if (inputValue === '4') {
      messageToSend = '¿Qué promociones tienen disponibles actualmente?';
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue + (selectedImage ? ' [Imagen adjunta]' : '') + (selectedPdf ? ` [PDF adjunto: ${selectedPdf.name}]` : ''),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let response;

      if (selectedPdf) {
        // Enviar con PDF
        const formData = new FormData();
        formData.append('message', messageToSend || 'Analiza este PDF');
        formData.append('pdf', selectedPdf);
        if (conversationId) {
          formData.append('conversation_id', conversationId);
        }
        formData.append('channel', 'web');

        response = await fetch(`${apiUrl}/chat/message/with-pdf`, {
          method: 'POST',
          body: formData
        });
      } else if (selectedImage) {
        // Enviar con imagen
        const formData = new FormData();
        formData.append('message', messageToSend);
        formData.append('image', selectedImage);
        if (conversationId) {
          formData.append('conversation_id', conversationId);
        }
        formData.append('channel', 'web');

        response = await fetch(`${apiUrl}/chat/message/with-image`, {
          method: 'POST',
          body: formData
        });
      } else {
        // Enviar solo texto
        response = await fetch(`${apiUrl}/chat/message`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: messageToSend,
            conversation_id: conversationId,
            channel: 'web'
          })
        });
      }

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();

      // Guardar conversation_id para mensajes futuros
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = {
        id: Date.now().toString() + '_response',
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        toolUsed: data.tool_used
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedPdf(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limpiar PDF si hay imagen seleccionada
      setSelectedPdf(null);
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      // Limpiar imagen si hay PDF seleccionado
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedPdf(file);
    } else {
      alert('Por favor selecciona un archivo PDF válido');
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePdf = () => {
    setSelectedPdf(null);
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chatbot-container">
      {/* Botón flotante */}
      {!isOpen && (
        <button 
          className="chatbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat"
        >
          <FaComments size={24} />
          <span className="chatbot-badge">•</span>
        </button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-info">
              <div className="chatbot-avatar">🍗</div>
              <div>
                <h3>Asistente Chuwue Grill</h3>
                <span className="chatbot-status">
                  {isInQueue ? `⏳ En cola - Posición: ${queuePosition}` : 'En línea'}
                </span>
              </div>
            </div>
            <button 
              className="chatbot-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
            >
              <FaTimes />
            </button>
          </div>

          {/* Mensajes */}
          <div className="chatbot-messages">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`chatbot-message ${message.role}`}
              >
                <div className="chatbot-message-content">
                  {message.content}
                  {message.toolUsed && (
                    <span className="chatbot-tool-badge">
                      🔧 {message.toolUsed}
                    </span>
                  )}
                </div>
                <span className="chatbot-message-time">
                  {formatTime(message.timestamp)}
                </span>
              </div>
            ))}
            
            {isLoading && (
              <div className="chatbot-message assistant">
                <div className="chatbot-message-content chatbot-typing">
                  <FaSpinner className="chatbot-spinner" />
                  Escribiendo...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Preview de imagen */}
          {imagePreview && (
            <div className="chatbot-image-preview">
              <img src={imagePreview} alt="Preview" />
              <button onClick={removeImage} className="chatbot-remove-image">
                <FaTimes />
              </button>
            </div>
          )}

          {/* Preview de PDF */}
          {selectedPdf && (
            <div className="chatbot-pdf-preview">
              <div className="chatbot-pdf-info">
                <FaFilePdf size={24} />
                <span>{selectedPdf.name}</span>
                <span className="chatbot-pdf-size">
                  ({(selectedPdf.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button onClick={removePdf} className="chatbot-remove-pdf">
                <FaTimes />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="chatbot-input-container">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageSelect}
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={pdfInputRef}
              accept="application/pdf"
              onChange={handlePdfSelect}
              style={{ display: 'none' }}
            />
            
            <div className="chatbot-attach-buttons">
              <button 
                className="chatbot-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Adjuntar imagen"
                title="Adjuntar imagen"
              >
                <FaImage />
              </button>
              <button 
                className="chatbot-attach-btn"
                onClick={() => pdfInputRef.current?.click()}
                aria-label="Adjuntar PDF"
                title="Adjuntar PDF"
              >
                <FaFilePdf />
              </button>
            </div>
            
            <input
              type="text"
              className="chatbot-input"
              placeholder={isInQueue ? "⏳ Esperando tu turno en la cola..." : "Escribe tu mensaje aquí..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isInQueue}
            />
            
            <button 
              className="chatbot-send-btn"
              onClick={handleSendMessage}
              disabled={isLoading || isInQueue || (!inputValue.trim() && !selectedImage && !selectedPdf)}
              aria-label="Enviar mensaje"
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
