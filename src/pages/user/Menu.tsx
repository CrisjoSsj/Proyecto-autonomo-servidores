import { useEffect } from "react";
import Navbar from "../../components/user/Navbar";
import MenuCard from "../../components/user/MenuCard";
import PiePagina from "../../components/user/PiePagina";
import "../../css/user/Menu.css";

// Categoría: Alitas (Nuestro plato estrella)
const alitas = [
  { nombre: "Alitas BBQ Clásicas", descripcion: "Nuestras famosas alitas con salsa BBQ casera, cocidas a la parrilla", precio: "$8.99"},
  { nombre: "Alitas Buffalo Picantes", descripcion: "Alitas con salsa buffalo picante y un toque de limón", precio: "$9.50"},
  { nombre: "Alitas Honey Mustard", descripcion: "Alitas glaseadas con miel y mostaza, sabor agridulce", precio: "$9.99"},
  { nombre: "Alitas Teriyaki", descripcion: "Alitas marinadas en salsa teriyaki con sésamo", precio: "$10.50"},
  { nombre: "Alitas Cajún", descripcion: "Alitas con especias cajún, para los amantes del picante", precio: "$10.99"},
  { nombre: "Combo Alitas Mixtas", descripcion: "Prueba 3 sabores diferentes: BBQ, Buffalo y Honey Mustard", precio: "$14.99"},
];

// Categoría: Hamburguesas Gourmet
const hamburguesas = [
  { nombre: "Chuwue Clásica", descripcion: "Carne de res, queso cheddar, lechuga, tomate, cebolla y salsa especial", precio: "$10.50"},
  { nombre: "BBQ Bacon Burger", descripcion: "Carne de res, tocino crujiente, queso, cebolla caramelizada y salsa BBQ", precio: "$12.99"},
  { nombre: "Mushroom Swiss", descripcion: "Carne de res, queso suizo, champiñones salteados y mayonesa de ajo", precio: "$11.99"},
  { nombre: "Jalapeño Fire", descripcion: "Carne de res, queso pepper jack, jalapeños, aguacate y salsa picante", precio: "$13.50"},
  { nombre: "Pollo Crispy", descripcion: "Pechuga de pollo empanizada, lechuga, tomate y salsa ranch", precio: "$11.50"},
  { nombre: "Veggie Deluxe", descripcion: "Hamburguesa de vegetales, queso, aguacate, sprouts y salsa tahini", precio: "$10.99"},
];

// Categoría: Parrilladas
const parrilladas = [
  { nombre: "Parrillada Individual", descripcion: "Bife de chorizo, pollo, chorizo criollo y vegetales asados", precio: "$15.99"},
  { nombre: "Parrillada para Dos", descripcion: "Variedad de carnes para compartir: bife, pollo, chorizo y morcilla", precio: "$28.99"},
  { nombre: "Parrillada Familiar", descripcion: "La más completa: múltiples cortes, embutidos y guarniciones", precio: "$45.99"},
  { nombre: "Bife de Chorizo Premium", descripcion: "Corte premium de 300g con papas rústicas y ensalada", precio: "$22.00"},
  { nombre: "Costillas BBQ", descripcion: "Costillas de cerdo glaseadas con salsa BBQ, cocción lenta", precio: "$18.50"},
  { nombre: "Pollo a la Parrilla", descripcion: "Pollo entero marinado con hierbas, acompañado de vegetales", precio: "$16.99"},
];

// Categoría: Entradas para Compartir
const entradas = [
  { nombre: "Nachos Supremos", descripcion: "Nachos con queso fundido, guacamole, pico de gallo y jalapeños", precio: "$7.99"},
  { nombre: "Dedos de Mozzarella", descripcion: "Bastones de queso mozzarella empanizados con salsa marinara", precio: "$6.50"},
  { nombre: "Anillos de Cebolla", descripcion: "Aros de cebolla crujientes con salsa ranch para dipear", precio: "$5.99"},
  { nombre: "Papas Cargadas", descripcion: "Papas fritas con queso cheddar, tocino y cebollín", precio: "$8.50"},
  { nombre: "Combo Entrada", descripcion: "Alitas, nachos y dedos de mozzarella para compartir", precio: "$12.99"},
];

// Categoría: Bebidas
const bebidas = [
  { nombre: "Cerveza Artesanal", descripcion: "Selección de cervezas locales: IPA, Lager, Stout", precio: "$4.50"},
  { nombre: "Cerveza Importada", descripcion: "Corona, Heineken, Stella Artois", precio: "$5.50"},
  { nombre: "Refrescos", descripcion: "Coca Cola, Pepsi, Sprite, Fanta", precio: "$2.99"},
  { nombre: "Jugos Naturales", descripcion: "Naranja, manzana, piña, limonada", precio: "$3.50"},
  { nombre: "Agua Mineral", descripcion: "Con gas o sin gas", precio: "$1.99"},
  { nombre: "Café Americano", descripcion: "Café recién molido", precio: "$2.50"},
];

// Categoría: Postres
const postres = [
  { nombre: "Brownie con Helado", descripcion: "Brownie tibio con helado de vainilla y salsa de chocolate", precio: "$5.99"},
  { nombre: "Cheesecake de Frutos Rojos", descripcion: "Cheesecake cremoso con compota de frutos del bosque", precio: "$6.50"},
  { nombre: "Flan Casero", descripcion: "Flan tradicional con dulce de leche y crema chantilly", precio: "$4.99"},
  { nombre: "Helado Artesanal", descripcion: "Tres bochas: vainilla, chocolate y dulce de leche", precio: "$4.50"},
  { nombre: "Tiramisú", descripcion: "Postre italiano con café, mascarpone y cacao", precio: "$7.50"},
];

export default function Menu() {
  useEffect(() => {
    const navegacionCategorias = document.querySelector('.navegacion-categorias');
    const enlaces = document.querySelectorAll('.enlace-categoria');
    const secciones = document.querySelectorAll('.seccion-categoria');
    const navbar = document.querySelector('.navbar');

    // Función para obtener la altura dinámica del navbar
    const getNavbarHeight = () => {
      return navbar ? navbar.getBoundingClientRect().height : 60;
    };

    // Función para manejar el scroll
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const navbarHeight = getNavbarHeight();
      
      // Agregar clase 'scrolled' cuando se hace scroll
      if (scrollTop > 100) {
        navegacionCategorias?.classList.add('scrolled');
      } else {
        navegacionCategorias?.classList.remove('scrolled');
      }

      // Detectar qué sección está visible
      let currentSection = '';
      secciones.forEach((seccion) => {
        const rect = seccion.getBoundingClientRect();
        const offset = navbarHeight + 80; // Altura del navbar + margen adicional
        
        if (rect.top <= offset && rect.bottom >= offset) {
          currentSection = seccion.getAttribute('id') || '';
        }
      });

      // Actualizar enlaces activos
      enlaces.forEach((enlace) => {
        enlace.classList.remove('activo');
        const href = enlace.getAttribute('href');
        if (href === `#${currentSection}`) {
          enlace.classList.add('activo');
        }
      });
    };

    // Smooth scroll para los enlaces
    enlaces.forEach((enlace) => {
      enlace.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = enlace.getAttribute('href')?.substring(1);
        const targetElement = document.getElementById(targetId || '');
        
        if (targetElement) {
          const navbarHeight = getNavbarHeight();
          const navegacionHeight = navegacionCategorias ? navegacionCategorias.getBoundingClientRect().height : 60;
          const offsetTop = targetElement.offsetTop - navbarHeight - navegacionHeight - 10;
          
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
      });
    });

    // Agregar event listener para scroll
    window.addEventListener('scroll', handleScroll);
    
    // Llamar una vez para inicializar
    handleScroll();

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div>
      <Navbar />
      
      {/* Banner del menú */}
      <section className="banner-menu">
        <div className="contenedor-banner-menu">
          <h1 className="titulo-menu">Nuestro Menú Completo</h1>
          <p className="subtitulo-menu">Descubre todos nuestros sabores organizados por categorías</p>
          <p className="nota-menu">Todos los precios incluyen IVA • Aceptamos efectivo y tarjetas</p>
        </div>
      </section>

      {/* Navegación por categorías */}
      <section className="navegacion-categorias">
        <div className="contenedor-categorias">
          <a href="#alitas" className="enlace-categoria">Alitas</a>
          <a href="#hamburguesas" className="enlace-categoria">Hamburguesas</a>
          <a href="#parrilladas" className="enlace-categoria">Parrilladas</a>
          <a href="#entradas" className="enlace-categoria">Entradas</a>
          <a href="#bebidas" className="enlace-categoria">Bebidas</a>
          <a href="#postres" className="enlace-categoria">Postres</a>
        </div>
      </section>

      <div className="contenedor-menu">
        {/* Categoría: Alitas - Nuestro plato estrella */}
        <section id="alitas" className="seccion-categoria destacada">
          <div className="cabecera-categoria">
            <h2 className="titulo-categoria">🔥 Alitas - Nuestro Plato Estrella</h2>
            <p className="descripcion-categoria">Las mejores alitas de la ciudad con salsas caseras</p>
          </div>
          <div className="grilla-menu">
            {alitas.map((plato, index) => (
              <MenuCard key={index} {...plato} />
            ))}
          </div>
        </section>

        {/* Categoría: Hamburguesas */}
        <section id="hamburguesas" className="seccion-categoria">
          <div className="cabecera-categoria">
            <h2 className="titulo-categoria">🍔 Hamburguesas Gourmet</h2>
            <p className="descripcion-categoria">Hamburguesas artesanales con ingredientes premium</p>
          </div>
          <div className="grilla-menu">
            {hamburguesas.map((plato, index) => (
              <MenuCard key={index} {...plato} />
            ))}
          </div>
        </section>

        {/* Categoría: Parrilladas */}
        <section id="parrilladas" className="seccion-categoria">
          <div className="cabecera-categoria">
            <h2 className="titulo-categoria">🥩 Parrilladas</h2>
            <p className="descripcion-categoria">Cortes selectos cocinados a la parrilla al carbón</p>
          </div>
          <div className="grilla-menu">
            {parrilladas.map((plato, index) => (
              <MenuCard key={index} {...plato} />
            ))}
          </div>
        </section>

        {/* Categoría: Entradas */}
        <section id="entradas" className="seccion-categoria">
          <div className="cabecera-categoria">
            <h2 className="titulo-categoria">🥨 Entradas para Compartir</h2>
            <p className="descripcion-categoria">Perfectas para comenzar o acompañar tu comida</p>
          </div>
          <div className="grilla-menu">
            {entradas.map((plato, index) => (
              <MenuCard key={index} {...plato} />
            ))}
          </div>
        </section>

        {/* Categoría: Bebidas */}
        <section id="bebidas" className="seccion-categoria">
          <div className="cabecera-categoria">
            <h2 className="titulo-categoria">🍺 Bebidas</h2>
            <p className="descripcion-categoria">Refréscate con nuestra selección de bebidas</p>
          </div>
          <div className="grilla-menu">
            {bebidas.map((plato, index) => (
              <MenuCard key={index} {...plato} />
            ))}
          </div>
        </section>

        {/* Categoría: Postres */}
        <section id="postres" className="seccion-categoria">
          <div className="cabecera-categoria">
            <h2 className="titulo-categoria">🍰 Postres</h2>
            <p className="descripcion-categoria">El final perfecto para tu comida</p>
          </div>
          <div className="grilla-menu">
            {postres.map((plato, index) => (
              <MenuCard key={index} {...plato} />
            ))}
          </div>
        </section>
      </div>

      <PiePagina />
    </div>
  );
}
