import React, { useState, useRef, useEffect } from 'react';
import '../styles/AiChat.css';

// Lee URL del entorno (configurado en .env con prefijo VITE_)
const ORCHESTRATOR_URL = import.meta.env.VITE_ORCHESTRATOR_URL || 'http://localhost:8081';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

export default function AiChat() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show toast notification
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const submit = async () => {
    if (!message.trim() || isStreaming) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setProposal(null);
    setIsStreaming(true);
    controllerRef.current = new AbortController();

    // Add empty assistant message for streaming
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      
      // Usar JWT del usuario autenticado (Bearer token)
      const userToken = localStorage.getItem('token');
      if (userToken) {
        headers['Authorization'] = `Bearer ${userToken}`;
      } else {
        // Si no hay token, mostrar mensaje de error
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: '⚠️ Debes iniciar sesión para usar el asistente.', isError: true }
            : m
        ));
        setIsStreaming(false);
        return;
      }

      const res = await fetch(`${ORCHESTRATOR_URL}/api/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: userMessage.content }),
        signal: controllerRef.current.signal,
      });

      if (!res.ok) {
        const txt = await res.text();
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: `Error: ${res.status} ${txt}`, isError: true }
            : m
        ));
        setIsStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: 'No stream available', isError: true }
            : m
        ));
        setIsStreaming(false);
        return;
      }

      const decoder = new TextDecoder();
      let done = false;
      let fullContent = '';
      let messageBuffer = ''; // Buffer para acumular líneas de un mensaje
      
      while (!done) {
        const { value, done: rdone } = await reader.read();
        done = rdone;
        if (value) {
          const chunk = decoder.decode(value);
          
          // SSE envía múltiples "data:" seguidas para formar un mensaje
          // Una línea vacía doble (\n\n) separa mensajes completos
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6); // Remover "data: "
              messageBuffer += (messageBuffer ? '\n' : '') + data;
            } else if (line === '' && messageBuffer) {
              // Línea vacía = fin de mensaje SSE, procesar el buffer
              const data = messageBuffer;
              messageBuffer = '';
              
              if (data.startsWith('PROPOSE:')) {
                try {
                  const json = JSON.parse(data.replace(/^PROPOSE:/, ''));
                  setProposal(json);
                } catch (e) {
                  console.warn('Malformed proposal', e);
                }
              } else if (data && data !== '[DONE]' && !data.startsWith('event:')) {
                // Si es un resultado de herramienta, reemplazar todo
                if (data.startsWith('✅') || data.startsWith('📭') || data.startsWith('🔍') || data.startsWith('❌')) {
                  fullContent = data;
                } else {
                  fullContent += (fullContent ? ' ' : '') + data;
                }
                setMessages(prev => prev.map(m => 
                  m.id === assistantId ? { ...m, content: fullContent } : m
                ));
              }
            } else if (line.startsWith('event:')) {
              // Ignorar líneas de eventos
              messageBuffer = '';
            }
          }
        }
      }

      setIsStreaming(false);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: m.content || 'Cancelado por el usuario' }
            : m
        ));
      } else {
        setMessages(prev => prev.map(m => 
          m.id === assistantId 
            ? { ...m, content: `Error: ${err?.message}`, isError: true }
            : m
        ));
      }
      setIsStreaming(false);
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    
    showToast(`Subiendo ${f.name}...`);
    
    const fd = new FormData();
    fd.append('file', f);
    
    try {
      const r = await fetch(`${ORCHESTRATOR_URL}/ingest/`, { method: 'POST', body: fd });
      const json = await r.json();
      
      // Verificar el tipo de archivo procesado
      if (json.type === 'image') {
        // Para imágenes, mostrar el texto extraído por OCR
        showToast(`✓ Imagen procesada: ${json.characters || 0} caracteres extraídos`);
        if (json.extracted_text) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: `📷 **Texto extraído de ${f.name}:**\n\n${json.extracted_text}`
          }]);
        }
      } else {
        // Para PDFs y texto, mostrar fragmentos indexados
        showToast(`✓ Archivo procesado: ${json.chunks || 0} fragmentos indexados`);
      }
    } catch (err: any) {
      showToast(`✗ Error al subir: ${err.message}`);
    }
    
    // Reset input
    e.target.value = '';
  };

  const confirmProposal = async () => {
    if (!proposal?.proposal_id) return;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ORCHESTRATOR_API_KEY) {
      headers['Authorization'] = `ApiKey ${ORCHESTRATOR_API_KEY}`;
    }
    
    try {
      const resp = await fetch(`${ORCHESTRATOR_URL}/api/tools/confirm`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ proposal_id: proposal.proposal_id }),
      });
      const j = await resp.json();
      showToast('✓ Acción confirmada exitosamente');
      setProposal(null);
      
      // Add confirmation as assistant message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✓ Acción ejecutada: ${JSON.stringify(j.result || j, null, 2)}`
      }]);
    } catch (err: any) {
      showToast(`✗ Error: ${err.message}`);
    }
  };

  const rejectProposal = () => {
    setProposal(null);
    showToast('Propuesta rechazada');
  };

  const clearChat = () => {
    setMessages([]);
    setProposal(null);
  };

  return (
    <div className="ai-chat-container">
      {/* Header */}
      <div className="ai-chat-header">
        <h2>Asistente IA</h2>
        <div className="header-actions">
          <label className="upload-btn">
            📎 Subir documento
            <input type="file" onChange={uploadFile} accept=".pdf,.txt,.md,.doc,.docx,.png,.jpg,.jpeg,.bmp,.tiff,.gif,.webp" />
          </label>
          {messages.length > 0 && (
            <button className="upload-btn" onClick={clearChat}>
              🗑️ Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <h3>¡Hola! Soy tu asistente IA</h3>
            <p>Escribe un mensaje para comenzar o sube un documento para analizarlo</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.role} ${msg.isError ? 'error' : ''} ${isStreaming && msg.role === 'assistant' && msg === messages[messages.length - 1] ? 'streaming' : ''}`}
            >
              {msg.content ? (
                <div className="message-content" dangerouslySetInnerHTML={{ 
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>')
                }} />
              ) : (
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Proposal Card */}
        {proposal && (
          <div className="proposal-card">
            <h4>Acción pendiente de confirmación</h4>
            <div className="proposal-content">
              <strong>Herramienta:</strong> {proposal.tool_name}<br />
              <strong>Argumentos:</strong>
              <pre>{JSON.stringify(proposal.arguments || proposal.args, null, 2)}</pre>
            </div>
            <div className="proposal-actions">
              <button className="confirm-btn" onClick={confirmProposal}>
                ✓ Confirmar y ejecutar
              </button>
              <button className="reject-btn" onClick={rejectProposal}>
                ✗ Rechazar
              </button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
            disabled={isStreaming}
          />
        </div>
        {isStreaming ? (
          <button className="cancel-btn" onClick={cancel} title="Cancelar">
            ⏹
          </button>
        ) : (
          <button 
            className="send-btn" 
            onClick={submit} 
            disabled={!message.trim()}
            title="Enviar mensaje"
          >
            ➤
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
