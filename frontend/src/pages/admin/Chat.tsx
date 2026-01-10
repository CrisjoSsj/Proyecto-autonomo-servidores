/**
 * AdminChat - Panel de gestión del chatbot IA
 * Ver historial de conversaciones y estadísticas
 */
import { useState, useEffect } from 'react';
import { FaComments, FaUser, FaRobot, FaSync, FaSearch } from 'react-icons/fa';
import NavbarAdmin from '../../components/admin/NavbarAdmin';
import '../../css/AdminPanel.css';

interface Conversation {
  conversation_id: string;
  channel: string;
  user_id: number | null;
  created_at: string;
  updated_at: string | null;
}

interface Message {
  role: string;
  content: string;
  tool_name: string | null;
  timestamp: string;
}

export default function AdminChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = 'http://localhost:8003';

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/chat/conversations`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error cargando conversaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_URL}/chat/history/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setSelectedConversation(conversationId);
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-EC');
  };

  const filteredConversations = conversations.filter(c =>
    c.conversation_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="admin-layout">
      <NavbarAdmin />
      <main className="admin-content">
        <div className="admin-header">
          <div className="admin-header-title">
            <FaComments className="admin-header-icon" />
            <div>
              <h1>Chat IA</h1>
              <p>Historial de conversaciones con el asistente</p>
            </div>
          </div>
          <button className="admin-btn-primary" onClick={loadConversations}>
            <FaSync className={loading ? 'spinning' : ''} /> Actualizar
          </button>
        </div>

        <div className="admin-chat-layout">
          {/* Lista de conversaciones */}
          <div className="admin-chat-sidebar">
            <div className="admin-search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Buscar conversación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="admin-conversations-list">
              {filteredConversations.length === 0 ? (
                <div className="admin-empty-state">
                  No hay conversaciones aún
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.conversation_id}
                    className={`admin-conversation-item ${selectedConversation === conv.conversation_id ? 'active' : ''}`}
                    onClick={() => loadMessages(conv.conversation_id)}
                  >
                    <div className="admin-conversation-info">
                      <span className="admin-conversation-id">
                        {conv.conversation_id.substring(0, 15)}...
                      </span>
                      <span className={`admin-channel-badge ${conv.channel}`}>
                        {conv.channel}
                      </span>
                    </div>
                    <span className="admin-conversation-date">
                      {formatDate(conv.created_at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Detalle de conversación */}
          <div className="admin-chat-detail">
            {selectedConversation ? (
              <>
                <div className="admin-chat-header">
                  <h3>Conversación: {selectedConversation}</h3>
                </div>
                <div className="admin-messages-container">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`admin-message ${msg.role}`}>
                      <div className="admin-message-icon">
                        {msg.role === 'user' ? <FaUser /> : <FaRobot />}
                      </div>
                      <div className="admin-message-content">
                        <div className="admin-message-header">
                          <span className="admin-message-role">
                            {msg.role === 'user' ? 'Usuario' : 'Asistente'}
                          </span>
                          <span className="admin-message-time">
                            {formatDate(msg.timestamp)}
                          </span>
                        </div>
                        <p>{msg.content}</p>
                        {msg.tool_name && (
                          <span className="admin-tool-used">
                            🔧 Herramienta: {msg.tool_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="admin-empty-state">
                <FaComments size={48} />
                <p>Selecciona una conversación para ver los mensajes</p>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="admin-stats-row">
          <div className="admin-stat-card">
            <h4>Total Conversaciones</h4>
            <span className="admin-stat-value">{conversations.length}</span>
          </div>
          <div className="admin-stat-card">
            <h4>Desde Web</h4>
            <span className="admin-stat-value">
              {conversations.filter(c => c.channel === 'web').length}
            </span>
          </div>
          <div className="admin-stat-card">
            <h4>Desde WhatsApp</h4>
            <span className="admin-stat-value">
              {conversations.filter(c => c.channel === 'whatsapp').length}
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
