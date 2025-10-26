import "../../css/user/PiePagina.css";
import { FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';

export default function PiePagina() {
    return( 
        <footer className="pie-pagina">
            <div className="contenedor-pie-pagina">
                {/* Información del restaurante */}
                <div className="seccion-informacion-footer">
                    <h3 className="titulo-footer">Chuwue Grill</h3>
                    <p className="descripcion-footer">Las mejores alitas y parrilladas de la ciudad, donde cada plato cuenta una historia de sabor auténtico</p>
                </div>

                {/* Información de contacto */}
                <div className="seccion-contacto-footer">
                    <h4 className="titulo-seccion-footer">Contacto</h4>
                    <p className="dato-contacto">📞 099-123-4567</p>
                    <p className="dato-contacto">📧 info@chuguegrill.com</p>
                    <p className="dato-contacto">📍 Av. Principal 123, Montevideo</p>
                </div>

                {/* Horarios */}
                <div className="seccion-horarios-footer">
                    <h4 className="titulo-seccion-footer">Horarios</h4>
                    <p className="horario-footer">Lun - Jue: 11:00 AM - 10:00 PM</p>
                    <p className="horario-footer">Vie - Sáb: 11:00 AM - 11:00 PM</p>
                    <p className="horario-footer">Dom: 12:00 PM - 9:00 PM</p>
                </div>

                {/* Redes sociales */}
                <div className="seccion-redes-footer">
                    <h4 className="titulo-seccion-footer">Síguenos</h4>
                    <div className="enlaces-redes">
                        <a href="#" className="enlace-red-social" aria-label="Facebook">
                            <FaFacebookF className="icono-red-social" />
                        </a>
                        <a href="#" className="enlace-red-social" aria-label="Instagram">
                            <FaInstagram className="icono-red-social" />
                        </a>
                        <a href="#" className="enlace-red-social" aria-label="Twitter">
                            <FaTwitter className="icono-red-social" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="copyright">
                <p className="texto-copyright">© 2025 Chuwue Grill - Todos los derechos reservados</p>
            </div>
        </footer>
    );
}