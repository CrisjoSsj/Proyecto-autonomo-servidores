import type {MenuCardProps} from '../../interface/MenuCardProps';

export default function MenuCard({ nombre, descripcion, precio}: MenuCardProps) {
  return (
    <div className="tarjeta-plato-menu">
      <h3 className="nombre-plato">{nombre}</h3>
      <p className="descripcion-plato">{descripcion}</p>
      <p className="precio-plato">{precio}</p>
      <button className="boton-agregar">Agregar al Pedido</button>
    </div>
  );
}
