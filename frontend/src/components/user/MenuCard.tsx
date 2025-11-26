export default function MenuCard({ nombre, descripcion, precio}: any) {
  return (
    <div className="tarjeta-plato-menu">
      <h3 className="nombre-plato">{nombre}</h3>
      <p className="descripcion-plato">{descripcion}</p>
      <p className="precio-plato">{precio}</p>
    </div>
  );
}
