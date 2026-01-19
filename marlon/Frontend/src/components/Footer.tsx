import { Mail, Phone, MapPin, Github, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Información general */}
        <div className="footer-info">
          <h2>Proyecto de Servicios</h2>
          <p>
            Plataforma desarrollada para conectar proveedores y clientes de manera fácil, rápida y segura.
          </p>
        </div>

        {/* Integrantes */}
        <div className="footer-team">
          <h3>Equipo de Desarrollo</h3>
          <ul>
            <li>
              <strong>Anderson Marlon Alvia Mero</strong>
              <div className="contact">
                <Mail size={16} /> anderson.alvia@example.com
              </div>
              <div className="contact">
                <Phone size={16} /> +593 987 654 321
              </div>
            </li>
            <li>
              <strong>Choez Suares Johan Franklin</strong>
              <div className="contact">
                <Mail size={16} /> johan.choez@example.com
              </div>
              <div className="contact">
                <Phone size={16} /> +593 985 112 233
              </div>
            </li>
            <li>
              <strong>Vinces Reyes Josue Alexander</strong>
              <div className="contact">
                <Mail size={16} /> josue.vinces@example.com
              </div>
              <div className="contact">
                <Phone size={16} /> +593 982 776 554
              </div>
            </li>
          </ul>
        </div>


        <div className="footer-social">
          <h3>Contáctanos</h3>
          <div className="contact">
            <MapPin size={16} /> Manta, Ecuador
          </div>
          <div className="social-icons">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
              <Github size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Proyecto de Servicios | Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
