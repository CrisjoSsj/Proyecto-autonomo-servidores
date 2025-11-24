import { useEffect, useState } from 'react';
import { wsService } from '../services/WebSocketService';
import '../css/GlobalNotifications.css';

interface Notification {
  id: string;
  tipo: string;
  mensaje: string;
  timestamp: Date;
  recurso?: string;
  formato?: string;
  filename?: string;
}

export default function GlobalNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Conectar al WebSocket
    wsService.connect();

    // Suscribirse al canal de reportes
    const unsubscribe = wsService.subscribe('reportes', (msg) => {
      if (msg.event === 'reporte_generado' && msg.data) {
        const newNotif: Notification = {
          id: Date.now().toString(),
          tipo: 'reporte',
          mensaje: `Reporte ${msg.data.formato?.toUpperCase()} disponible`,
          timestamp: new Date(),
          recurso: msg.data.recurso,
          formato: msg.data.formato,
          filename: msg.data.filename,
        };

        setNotifications((prev) => [...prev, newNotif]);

        // Auto-remover después de 15 segundos
        setTimeout(() => {
          setNotifications((prev) => prev.filter((n) => n.id !== newNotif.id));
        }, 15000);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleDownload = async (notif: Notification) => {
    if (!notif.recurso || !notif.formato) return;

    try {
      const url = `http://localhost:3000/api/report/${notif.formato}/${notif.recurso}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = notif.filename || `reporte.${notif.formato}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        // Remover notificación después de descargar
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }
    } catch (error) {
      console.error('Error al descargar reporte:', error);
    }
  };

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="global-notifications-container">
      {notifications.map((notif) => (
        <div key={notif.id} className="notification-toast">
          <div className="notification-icon">📄</div>
          <div className="notification-content">
            <div className="notification-title">{notif.mensaje}</div>
            <div className="notification-details">
              {notif.recurso && <span>Recurso: {notif.recurso}</span>}
              {notif.filename && <span className="notification-filename">{notif.filename}</span>}
            </div>
            <div className="notification-time">
              {notif.timestamp.toLocaleTimeString('es-ES')}
            </div>
          </div>
          <div className="notification-actions">
            <button
              className="notification-btn download"
              onClick={() => handleDownload(notif)}
              title="Descargar reporte"
            >
              ⬇️ Descargar
            </button>
            <button
              className="notification-btn dismiss"
              onClick={() => handleDismiss(notif.id)}
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
