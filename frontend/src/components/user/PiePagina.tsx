import "../../css/user/PiePagina.css";

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
                    <p className="dato-contacto">
                        <span className="material-symbols-outlined">phone</span>
                        099-123-4567
                    </p>
                    <p className="dato-contacto">
                        <span className="material-symbols-outlined">mail</span>
                        info@chuguegrill.com
                    </p>
                    <p className="dato-contacto">
                        <span className="material-symbols-outlined">location_on</span>
                        Av. Principal 123, Montevideo
                    </p>
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
                        <a href="https://facebook.com/chuguegrill" target="_blank" rel="noopener noreferrer" className="enlace-red-social facebook-icon" title="Facebook">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                            </svg>
                        </a>
                        <a href="https://github.com/chuguegrill" target="_blank" rel="noopener noreferrer" className="enlace-red-social github-icon" title="GitHub">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                        </a>
                        <a href="https://twitter.com/chuguegrill" target="_blank" rel="noopener noreferrer" className="enlace-red-social twitter-icon" title="Twitter">
                            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.1-6.72-5.85 6.72h-3.306l7.73-8.835L.26 2.25h6.734l4.888 6.48L17.04 2.25h.204zm-1.161 17.52h1.833L7.084 4.126H5.117l12.926 15.644z"/>
                            </svg>
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