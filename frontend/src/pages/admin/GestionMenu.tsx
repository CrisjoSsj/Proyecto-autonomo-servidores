import NavbarAdmin from "../../components/admin/NavbarAdmin";
import "../../css/admin/GestionMenu.css";

export default function GestionMenu() {
  return (
    <div className="gestion-menu-admin">
      <NavbarAdmin />
      
      {/* Header de gestión del menú */}
      <section className="header-gestion-menu">
        <div className="contenedor-header-menu">
          <h1 className="titulo-gestion-menu">Gestión del Menú</h1>
          <p className="subtitulo-gestion-menu">Administra platos, precios y disponibilidad</p>
          <div className="acciones-menu-header">
            <button className="boton-agregar-plato">+ Agregar Nuevo Plato</button>
            <button className="boton-categorias">Gestionar Categorías</button>
            <button className="boton-exportar-menu">📄 Exportar Menú</button>
          </div>
        </div>
      </section>

      {/* Estadísticas del menú */}
      <section className="seccion-estadisticas-menu">
        <div className="contenedor-estadisticas-menu">
          <div className="grilla-estadisticas-menu">
            <div className="tarjeta-estadistica-menu">
              <h3 className="titulo-estadistica-menu">Total de Platos</h3>
              <p className="numero-estadistica-menu">35</p>
              <span className="detalle-estadistica-menu">6 categorías</span>
            </div>
            <div className="tarjeta-estadistica-menu">
              <h3 className="titulo-estadistica-menu">Más Vendido Hoy</h3>
              <p className="numero-estadistica-menu">Alitas BBQ</p>
              <span className="detalle-estadistica-menu">23 órdenes</span>
            </div>
            <div className="tarjeta-estadistica-menu">
              <h3 className="titulo-estadistica-menu">Bajo Inventario</h3>
              <p className="numero-estadistica-menu">3 platos</p>
              <span className="detalle-estadistica-menu">Requieren atención</span>
            </div>
            <div className="tarjeta-estadistica-menu">
              <h3 className="titulo-estadistica-menu">Platos Inactivos</h3>
              <p className="numero-estadistica-menu">2</p>
              <span className="detalle-estadistica-menu">Temporalmente no disponibles</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros y búsqueda */}
      <section className="seccion-filtros-menu">
        <div className="contenedor-filtros-menu">
          <div className="barra-filtros">
            <select className="filtro-categoria">
              <option value="todas">Todas las categorías</option>
              <option value="alitas">Alitas</option>
              <option value="hamburguesas">Hamburguesas</option>
              <option value="parrilladas">Parrilladas</option>
              <option value="entradas">Entradas</option>
              <option value="bebidas">Bebidas</option>
              <option value="postres">Postres</option>
            </select>
            <select className="filtro-estado">
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="agotado">Agotado</option>
              <option value="inactivo">Inactivo</option>
            </select>
            <input type="text" className="buscar-plato" placeholder="Buscar plato..." />
            <button className="boton-filtrar">Filtrar</button>
          </div>
        </div>
      </section>

      {/* Gestión por categorías */}
      <div className="contenedor-categorias-menu">
        
        {/* Categoría: Alitas (Plato estrella) */}
        <section className="categoria-menu-admin alitas">
          <div className="header-categoria-admin">
            <h2 className="titulo-categoria-admin">🔥 Alitas - Plato Estrella</h2>
            <div className="acciones-categoria">
              <button className="boton-agregar-categoria">+ Agregar Alitas</button>
              <button className="boton-reordenar">↕️ Reordenar</button>
            </div>
          </div>
          
          <div className="lista-platos-admin">
            
            <div className="tarjeta-plato-admin disponible popular">
              <div className="imagen-plato-admin alitas-bbq"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">Alitas BBQ Clásicas</h3>
                <p className="descripcion-plato-admin">Nuestras famosas alitas con salsa BBQ casera, cocidas a la parrilla</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$8.99</span>
                  <span className="badge-popular">🔥 Más vendido</span>
                  <span className="inventario-plato">Stock: 15 porciones</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-disponible">Disponible</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
                <button className="boton-estadisticas">📊 Stats</button>
                <button className="boton-desactivar">❌ Desactivar</button>
              </div>
            </div>

            <div className="tarjeta-plato-admin disponible">
              <div className="imagen-plato-admin alitas-buffalo"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">Alitas Buffalo Picantes</h3>
                <p className="descripcion-plato-admin">Alitas con salsa buffalo picante y un toque de limón</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$9.50</span>
                  <span className="inventario-plato">Stock: 12 porciones</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-disponible">Disponible</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
                <button className="boton-estadisticas">📊 Stats</button>
                <button className="boton-desactivar">❌ Desactivar</button>
              </div>
            </div>

            <div className="tarjeta-plato-admin bajo-inventario">
              <div className="imagen-plato-admin alitas-honey"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">Alitas Honey Mustard</h3>
                <p className="descripcion-plato-admin">Alitas glaseadas con miel y mostaza, sabor agridulce</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$9.99</span>
                  <span className="inventario-plato alerta">Stock: 3 porciones ⚠️</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-bajo-inventario">Bajo Inventario</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-reabastecer urgente">🔄 Reabastecer</button>
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
              </div>
            </div>
          </div>
        </section>

        {/* Categoría: Hamburguesas */}
        <section className="categoria-menu-admin hamburguesas">
          <div className="header-categoria-admin">
            <h2 className="titulo-categoria-admin">🍔 Hamburguesas Gourmet</h2>
            <div className="acciones-categoria">
              <button className="boton-agregar-categoria">+ Agregar Hamburguesa</button>
              <button className="boton-reordenar">↕️ Reordenar</button>
            </div>
          </div>
          
          <div className="lista-platos-admin">
            
            <div className="tarjeta-plato-admin disponible">
              <div className="imagen-plato-admin hamburguesa-clasica"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">Chuwue Clásica</h3>
                <p className="descripcion-plato-admin">Carne de res, queso cheddar, lechuga, tomate, cebolla y salsa especial</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$10.50</span>
                  <span className="inventario-plato">Stock: 20 porciones</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-disponible">Disponible</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
                <button className="boton-estadisticas">📊 Stats</button>
                <button className="boton-desactivar">❌ Desactivar</button>
              </div>
            </div>

            <div className="tarjeta-plato-admin disponible">
              <div className="imagen-plato-admin hamburguesa-bbq"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">BBQ Bacon Burger</h3>
                <p className="descripcion-plato-admin">Carne de res, tocino crujiente, queso, cebolla caramelizada y salsa BBQ</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$12.99</span>
                  <span className="inventario-plato">Stock: 15 porciones</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-disponible">Disponible</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
                <button className="boton-estadisticas">📊 Stats</button>
                <button className="boton-desactivar">❌ Desactivar</button>
              </div>
            </div>

            <div className="tarjeta-plato-admin agotado">
              <div className="imagen-plato-admin hamburguesa-jalapeno"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">Jalapeño Fire</h3>
                <p className="descripcion-plato-admin">Carne de res, queso pepper jack, jalapeños, aguacate y salsa picante</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$13.50</span>
                  <span className="inventario-plato agotado">Stock: 0 porciones</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-agotado">Agotado</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-reabastecer urgente">🔄 Reabastecer</button>
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
              </div>
            </div>
          </div>
        </section>

        {/* Categoría: Parrilladas */}
        <section className="categoria-menu-admin parrilladas">
          <div className="header-categoria-admin">
            <h2 className="titulo-categoria-admin">🥩 Parrilladas</h2>
            <div className="acciones-categoria">
              <button className="boton-agregar-categoria">+ Agregar Parrillada</button>
              <button className="boton-reordenar">↕️ Reordenar</button>
            </div>
          </div>
          
          <div className="lista-platos-admin">
            
            <div className="tarjeta-plato-admin disponible">
              <div className="imagen-plato-admin parrillada-individual"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">Parrillada Individual</h3>
                <p className="descripcion-plato-admin">Bife de chorizo, pollo, chorizo criollo y vegetales asados</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$15.99</span>
                  <span className="inventario-plato">Stock: 10 porciones</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-disponible">Disponible</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
                <button className="boton-estadisticas">📊 Stats</button>
                <button className="boton-desactivar">❌ Desactivar</button>
              </div>
            </div>

            <div className="tarjeta-plato-admin bajo-inventario">
              <div className="imagen-plato-admin costillas"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">Costillas BBQ</h3>
                <p className="descripcion-plato-admin">Costillas de cerdo glaseadas con salsa BBQ, cocción lenta</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$18.50</span>
                  <span className="inventario-plato alerta">Stock: 4 porciones ⚠️</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-bajo-inventario">Bajo Inventario</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-reabastecer urgente">🔄 Reabastecer</button>
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
              </div>
            </div>
          </div>
        </section>

        {/* Categoría: Bebidas */}
        <section className="categoria-menu-admin bebidas">
          <div className="header-categoria-admin">
            <h2 className="titulo-categoria-admin">🍺 Bebidas</h2>
            <div className="acciones-categoria">
              <button className="boton-agregar-categoria">+ Agregar Bebida</button>
              <button className="boton-reordenar">↕️ Reordenar</button>
            </div>
          </div>
          
          <div className="lista-platos-admin">
            
            <div className="tarjeta-plato-admin disponible">
              <div className="imagen-plato-admin cerveza-artesanal"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">Cerveza Artesanal</h3>
                <p className="descripcion-plato-admin">Selección de cervezas locales: IPA, Lager, Stout</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$4.50</span>
                  <span className="inventario-plato">Stock: 50 unidades</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-disponible">Disponible</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
                <button className="boton-estadisticas">📊 Stats</button>
                <button className="boton-desactivar">❌ Desactivar</button>
              </div>
            </div>

            <div className="tarjeta-plato-admin inactivo">
              <div className="imagen-plato-admin vino-tinto"></div>
              <div className="info-plato-admin">
                <h3 className="nombre-plato-admin">Vino Tinto de la Casa</h3>
                <p className="descripcion-plato-admin">Vino tinto argentino seleccionado especialmente</p>
                <div className="detalles-plato">
                  <span className="precio-plato-admin">$6.50</span>
                  <span className="inventario-plato">Stock: 12 botellas</span>
                </div>
              </div>
              <div className="estado-plato-admin">
                <span className="indicador-inactivo">Temporalmente Inactivo</span>
              </div>
              <div className="acciones-plato-admin">
                <button className="boton-activar">✅ Activar</button>
                <button className="boton-editar-plato">✏️ Editar</button>
                <button className="boton-inventario">📦 Inventario</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}