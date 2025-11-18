import Navbar from "../../components/user/Navbar";
import ReservaForm from "../../components/user/ReservaForm";
import PiePagina from "../../components/user/PiePagina";
import "../../css/user/Reservas.css";
export default function Reservas() {
  return (
    <div>
      <Navbar />
      
      {/* Banner de reservas */}
      <section className="banner-reservas">
        <div className="contenedor-banner-reservas">
          <h1 className="titulo-reservas">Reserva tu Mesa</h1>
          <p className="subtitulo-reservas">Asegura tu lugar para fechas especiales y eventos importantes</p>
          <p className="descripcion-reservas">
            Perfecto para cumpleaños, aniversarios, citas románticas y celebraciones familiares
          </p>
        </div>
      </section>

      {/* ¿Por qué reservar con anticipación? */}
      <section className="seccion-ventajas-reserva">
        <div className="contenedor-ventajas">
          <h2 className="titulo-ventajas">¿Por qué reservar con anticipación?</h2>
          <div className="grilla-ventajas">
            <div className="tarjeta-ventaja">
              <div className="icono-ventaja garantia">
                <span className="material-symbols-outlined">table_restaurant</span>
              </div>
              <h3 className="titulo-ventaja">Mesa Garantizada</h3>
              <p className="descripcion-ventaja">
                Tu mesa estará lista exactamente a la hora que elijas, sin esperas
              </p>
            </div>
            <div className="tarjeta-ventaja">
              <div className="icono-ventaja fechas-especiales">
                <span className="material-symbols-outlined">calendar_today</span>
              </div>
              <h3 className="titulo-ventaja">Fechas Especiales</h3>
              <p className="descripcion-ventaja">
                Ideal para cumpleaños, aniversarios, Día de San Valentín y celebraciones
              </p>
            </div>
            <div className="tarjeta-ventaja">
              <div className="icono-ventaja atencion-preferencial">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <h3 className="titulo-ventaja">Atención Preferencial</h3>
              <p className="descripcion-ventaja">
                Servicio prioritario y posibilidad de solicitar decoraciones especiales
              </p>
            </div>
            <div className="tarjeta-ventaja">
              <div className="icono-ventaja horarios-premium">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <h3 className="titulo-ventaja">Mejores Horarios</h3>
              <p className="descripcion-ventaja">
                Acceso a horarios premium especialmente en fines de semana
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="contenedor-reservas">
        {/* Información importante para reservas */}
        <section className="seccion-informacion-reservas">
          <div className="tarjeta-informacion-reservas">
            <h2 className="titulo-informacion-reservas">Información Importante</h2>
            <div className="contenido-informacion">
              <div className="columna-informacion">
                <h3 className="subtitulo-informacion">Política de Reservas</h3>
                <ul className="lista-informacion-reservas">
                  <li className="item-informacion-reservas">
                    <span className="material-symbols-outlined">schedule</span> Reservas deben hacerse con <strong>mínimo 4 horas</strong> de anticipación
                  </li>
                  <li className="item-informacion-reservas">
                    <span className="material-symbols-outlined">calendar_month</span> Para fechas especiales (fines de semana, feriados): <strong>24 horas</strong> de anticipación
                  </li>
                  <li className="item-informacion-reservas">
                    <span className="material-symbols-outlined">groups</span> Grupos de más de 8 personas requieren <strong>confirmación telefónica</strong>
                  </li>
                  <li className="item-informacion-reservas">
                    <span className="material-symbols-outlined">timer</span> Tiempo máximo de reserva: <strong>2 horas</strong>
                  </li>
                </ul>
              </div>
              <div className="columna-informacion">
                <h3 className="subtitulo-informacion">Confirmación</h3>
                <ul className="lista-informacion-reservas">
                  <li className="item-informacion-reservas">
                    <span className="material-symbols-outlined">phone</span> Te llamaremos para <strong>confirmar</strong> en los próximos 30 minutos
                  </li>
                  <li className="item-informacion-reservas">
                    <span className="material-symbols-outlined">sms</span> Recibirás un <strong>SMS de recordatorio</strong> 2 horas antes
                  </li>
                  <li className="item-informacion-reservas">
                    <span className="material-symbols-outlined">schedule</span> Llega <strong>máximo 15 minutos tarde</strong> o perderás la reserva
                  </li>
                  <li className="item-informacion-reservas">
                    <span className="material-symbols-outlined">celebration</span> Podemos ayudarte con <strong>decoraciones especiales</strong> (consultar)
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Formulario de reserva */}
        <section className="seccion-formulario-reserva">
          <div className="contenedor-formulario">
            <h2 className="titulo-formulario">Completa tu Reserva</h2>
            <p className="descripcion-formulario">
              Llena todos los campos para garantizar tu mesa en la fecha y hora deseada
            </p>
            <ReservaForm />
          </div>
        </section>

        {/* Ocasiones especiales */}
        <section className="seccion-ocasiones-especiales">
          <div className="contenedor-ocasiones">
            <h2 className="titulo-ocasiones">Ocasiones Especiales</h2>
            <p className="descripcion-ocasiones">
              Hacemos que tus momentos especiales sean inolvidables
            </p>
            <div className="grilla-ocasiones">
              <div className="tarjeta-ocasion">
                <div className="icono-ocasion cumpleanos">
                  <span className="material-symbols-outlined">celebration</span>
                </div>
                <h3 className="titulo-ocasion">Cumpleaños</h3>
                <p className="descripcion-ocasion">
                  Globos, decoración especial y postre de cortesía para el cumpleañero
                </p>
              </div>
              <div className="tarjeta-ocasion">
                <div className="icono-ocasion aniversario">
                  <span className="material-symbols-outlined">favorite</span>
                </div>
                <h3 className="titulo-ocasion">Aniversarios</h3>
                <p className="descripcion-ocasion">
                  Mesa decorada con velas, pétalos de rosa y atención romántica
                </p>
              </div>
              <div className="tarjeta-ocasion">
                <div className="icono-ocasion cita">
                  <span className="material-symbols-outlined">dining</span>
                </div>
                <h3 className="titulo-ocasion">Citas Románticas</h3>
                <p className="descripcion-ocasion">
                  Mesas en ubicaciones especiales con ambiente íntimo y música suave
                </p>
              </div>
              <div className="tarjeta-ocasion">
                <div className="icono-ocasion celebracion">
                  <span className="material-symbols-outlined">celebration</span>
                </div>
                <h3 className="titulo-ocasion">Celebraciones</h3>
                <p className="descripcion-ocasion">
                  Graduaciones, promociones laborales y logros importantes
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Horarios disponibles para reservas */}
        <section className="seccion-horarios-reservas">
          <div className="contenedor-horarios-reservas">
            <h2 className="titulo-horarios-reservas">Horarios Disponibles para Reservas</h2>
            <div className="grilla-horarios-reservas">
              <div className="bloque-horario">
                <h3 className="dia-horario">Lunes a Jueves</h3>
                <div className="horarios-disponibles">
                  <span className="horario-item">11:30 AM</span>
                  <span className="horario-item">12:00 PM</span>
                  <span className="horario-item">12:30 PM</span>
                  <span className="horario-item">1:00 PM</span>
                  <span className="horario-item">1:30 PM</span>
                  <span className="horario-item">2:00 PM</span>
                  <span className="horario-item">6:30 PM</span>
                  <span className="horario-item">7:00 PM</span>
                  <span className="horario-item">7:30 PM</span>
                  <span className="horario-item">8:00 PM</span>
                  <span className="horario-item">8:30 PM</span>
                  <span className="horario-item">9:00 PM</span>
                </div>
              </div>
              
              <div className="bloque-horario">
                <h3 className="dia-horario">Viernes y Sábado</h3>
                <div className="horarios-disponibles">
                  <span className="horario-item">12:00 PM</span>
                  <span className="horario-item">12:30 PM</span>
                  <span className="horario-item">1:00 PM</span>
                  <span className="horario-item">1:30 PM</span>
                  <span className="horario-item">2:00 PM</span>
                  <span className="horario-item premium">7:00 PM <span className="material-symbols-outlined">star</span></span>
                  <span className="horario-item premium">7:30 PM <span className="material-symbols-outlined">star</span></span>
                  <span className="horario-item premium">8:00 PM <span className="material-symbols-outlined">star</span></span>
                  <span className="horario-item premium">8:30 PM <span className="material-symbols-outlined">star</span></span>
                  <span className="horario-item">9:00 PM</span>
                  <span className="horario-item">9:30 PM</span>
                </div>
                <p className="nota-horario"><span className="material-symbols-outlined" style={{fontSize: '16px', verticalAlign: 'middle'}}>star</span> Horarios premium - Mayor demanda</p>
              </div>
              
              <div className="bloque-horario">
                <h3 className="dia-horario">Domingo</h3>
                <div className="horarios-disponibles">
                  <span className="horario-item">12:00 PM</span>
                  <span className="horario-item">12:30 PM</span>
                  <span className="horario-item">1:00 PM</span>
                  <span className="horario-item">1:30 PM</span>
                  <span className="horario-item">2:00 PM</span>
                  <span className="horario-item">6:00 PM</span>
                  <span className="horario-item">6:30 PM</span>
                  <span className="horario-item">7:00 PM</span>
                  <span className="horario-item">7:30 PM</span>
                  <span className="horario-item">8:00 PM</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contacto para reservas especiales */}
        <section className="seccion-contacto-especial">
          <div className="tarjeta-contacto-especial">
            <h2 className="titulo-contacto-especial">Reservas Especiales y Eventos Privados</h2>
            <p className="descripcion-contacto-especial">
              Para grupos grandes, eventos corporativos o celebraciones que requieren atención especial
            </p>
            <div className="informacion-contacto-especial">
              <div className="metodo-contacto">
                <span className="icono-contacto telefono">
                  <span className="material-symbols-outlined">phone</span>
                </span>
                <div className="detalles-contacto">
                  <h3 className="titulo-metodo">Teléfono Directo</h3>
                  <p className="detalle-metodo">099-123-4567</p>
                  <p className="horario-contacto">Lun-Dom: 10:00 AM - 6:00 PM</p>
                </div>
              </div>
              
              <div className="metodo-contacto">
                <span className="icono-contacto whatsapp">
                  <span className="material-symbols-outlined">mail</span>
                </span>
                <div className="detalles-contacto">
                  <h3 className="titulo-metodo">WhatsApp</h3>
                  <p className="detalle-metodo">099-123-4567</p>
                  <p className="horario-contacto">Respuesta inmediata</p>
                </div>
              </div>
              
              <div className="metodo-contacto">
                <span className="icono-contacto email">
                  <span className="material-symbols-outlined">email</span>
                </span>
                <div className="detalles-contacto">
                  <h3 className="titulo-metodo">Email</h3>
                  <p className="detalle-metodo">reservas@chuguegrill.com</p>
                  <p className="horario-contacto">Respuesta en 2-4 horas</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <PiePagina />
    </div>
  );
}
