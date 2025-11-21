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
  platos {
    id
    nombre
    descripcion
    precio
    categoria
  }
}`,
  },
  {
    name: 'Obtener plato por ID',
    query: `query PlatoPorId {
  plato(id: "1") {
    id
    nombre
    descripcion
    precio
    categoria
  }
}`,
  },
  {
    name: 'Buscar platos por categoría (bebidas)',
    query: `query PlatosPorCategoriaBebidas {
  platosByCategoria(categoria: "bebidas") {
    id
    nombre
    descripcion
    precio
    categoria
  }
}`,
  },
  {
    name: 'Buscar platos por categoría (postres)',
    query: `query PlatosPorCategoriaPostres {
  platosByCategoria(categoria: "postres") {
    id
    nombre
    descripcion
    precio
    categoria
  }
}`,
  },
  {
    name: 'Obtener todos los pedidos del día',
    query: `query PedidosDelDia {
  pedidos {
    id
    fecha
    total
    items {
      cantidad
      plato {
        id
        nombre
        precio
        categoria
      }
    }
  }
}`,
  },
  {
    name: 'Obtener pedido por ID',
    query: `query PedidoPorId {
  pedido(id: "1") {
    id
    fecha
    total
    items {
      cantidad
      plato {
        id
        nombre
        precio
      }
    }
  }
}`,
  },
  {
    name: 'Obtener todas las mesas',
    query: `query TodasLasMesas {
  mesas {
    id_mesa
    numero
    capacidad
    estado
  }
}`,
  },
  {
    name: 'Obtener mesas disponibles',
    query: `query MesasDisponibles {
  mesasDisponibles {
    id_mesa
    numero
    capacidad
    estado
  }
}`,
  },
  {
    name: 'Obtener reservas',
    query: `query Reservas {
  reservas {
    id
    id_cliente
    mesa_id
    fecha_hora
  }
}`,
  },
  {
    name: 'Obtener información del restaurante',
    query: `query InfoRestaurante {
  restaurante {
    id
    nombre
    direccion
    telefono
  }
}`,
  },
  {
    name: 'Obtener estadísticas de ventas',
    query: `query EstadisticasVentas {
  estadisticasVentas(periodo: "hoy") {
    periodo
    totalVentas
    pedidos
  }
}`,
  },
  {
    name: 'Obtener todos los precios y platos',
    query: `query PreciosYPlatos {
  preciosYPlatos {
    id_plato
    nombre
    precio
  }
}`,
  },
  {
    name: 'Buscar platos por categoría (entradas)',
    query: `query PlatosPorCategoriaEntradas {
  platosByCategoria(categoria: "entradas") {
    id
    nombre
    descripcion
    precio
    categoria
  }
}`,
  },
  {
    name: 'Obtener analíticas',
    query: `query Analiticas {
  analytics {
    totalUsers
    activeUsers
  }
}`,
  },
]
