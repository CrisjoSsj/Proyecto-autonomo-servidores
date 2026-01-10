interface MenuCardProps {
  nombre: string;
  descripcion: string;
  precio: string;
}

export default function MenuCard({ nombre, descripcion, precio }: MenuCardProps) {
  return (
    <article className="menu-card">
      <div className="menu-card-content">
        <div className="menu-card-header">
          <h3 className="menu-card-name">{nombre}</h3>
          <span className="menu-card-dots"></span>
          <span className="menu-card-price">{precio}</span>
        </div>
        <p className="menu-card-description">{descripcion}</p>
      </div>
    </article>
  );
}
