export const queryExamples = [
  {
    name: 'Obtener todos los usuarios',
    query: `query TodosLosUsuarios {
  users {
    id
    name
    email
    role
  }
}`,
  },
  {
    name: 'Obtener todos los platos del menú',
    query: `query TodosLosPlatos {
  todosPlatos {
    id
    nombre
    precio
    categoria
  }
}`,
  },
  {
    name: 'Obtener plato por ID',
    query: `query PlatoPorId {
  plato(id: "p1") {
    id
    nombre
    precio
    categoria
  }
}`,
  },
  {
    name: 'Buscar platos por categoría (bebidas)',
    query: `query PlatosPorCategoriaBebidas {
  platosPorCategoria(categoria: "bebidas") {
    id
    nombre
    precio
  }
}`,
  },
  {
    name: 'Buscar platos por categoría (postres)',
    query: `query PlatosPorCategoriaPostres {
  platosPorCategoria(categoria: "postres") {
    id
    nombre
    precio
  }
}`,
  },
  {
    name: 'Obtener todos los pedidos del día',
    query: `query PedidosDelDia {
  pedidosDelDia {
    id
    fecha
    total
    platos { nombre precio }
  }
}`,
  },
  {
    name: 'Obtener pedido por ID',
    query: `query PedidoPorId {
  pedido(id: "o1") {
    id
    fecha
    total
    platos { nombre precio }
  }
}`,
  },
  {
    name: 'Obtener mesas disponibles',
    query: `query MesasDisponibles {
  mesasDisponibles {
    id
    numero
    disponible
  }
}`,
  },
  {
    name: 'Obtener reservas del día',
    query: `query ReservasDelDia {
  reservasDelDia {
    id
    fecha
    hora
    mesaId
    nombreCliente
    personas
  }
}`,
  },
  {
    name: 'Obtener información del restaurante',
    query: `query InfoRestaurante {
  restauranteInfo {
    nombre
    ubicacion
    horarios
  }
}`,
  },
  {
    name: 'Obtener estadísticas de ventas',
    query: `query EstadisticasVentas {
  estadisticasVentas {
    totalPedidos
    totalIngresos
    platosMasVendidos { nombre precio }
    ventasPorCategoria { categoria cantidad ingresos }
  }
}`,
  },
  {
    name: 'Obtener todos los precios y platos',
    query: `query PreciosYPlatos {
  preciosYPlatos {
    id
    nombre
    precio
  }
}`,
  },
  {
    name: 'Buscar platos por categoría (entradas)',
    query: `query PlatosPorCategoriaEntradas {
  platosPorCategoria(categoria: "entradas") {
    id
    nombre
    precio
  }
}`,
  },
]
