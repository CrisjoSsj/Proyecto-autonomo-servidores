# Guía Completa: React con GraphQL para Restaurante

Esta guía te muestra paso a paso cómo usar GraphQL con React en tu proyecto de restaurante.

---

## 1. DEPENDENCIAS NECESARIAS

## (instala esto)
//npm install react@18 react-dom@18

### Para el Backend (Node.js/Express)

\`\`\`bash
npm install @apollo/server graphql express cors
npm install -D @types/node typescript ts-node
\`\`\`

### Para el Frontend (React)

\`\`\`bash
npm install @apollo/client graphql
\`\`\`

**¿Qué hace cada dependencia?**
- `@apollo/server`: Servidor GraphQL para Node.js
- `graphql`: Motor de GraphQL
- `@apollo/client`: Cliente para consumir GraphQL desde React
- `express`: Framework web para Node.js
- `cors`: Permite conexiones entre frontend y backend

---

## 2. INICIAR EL SERVIDOR GRAPHQL

### Opción A: Servidor Standalone (Recomendado para empezar)

Crea un archivo `server.js` en tu backend:

\`\`\`javascript
// server.js
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
  });

  console.log(`🚀 Servidor GraphQL listo en ${url}`);
}

startServer();
\`\`\`

**Iniciar el servidor:**
\`\`\`bash
node server.js
\`\`\`

### Opción B: Integrar con Express Existente

Si ya tienes un servidor Express:

\`\`\`javascript
// app.js o server.js
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const { typeDefs } = require('./graphql/schema');
const { resolvers } = require('./graphql/resolvers');

const app = express();

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(cors());
  app.use(express.json());
  
  // Ruta de GraphQL
  app.use('/graphql', expressMiddleware(server));

  // Tus otras rutas aquí
  app.get('/', (req, res) => {
    res.send('API funcionando');
  });

  app.listen(4000, () => {
    console.log('🚀 Servidor en http://localhost:4000');
    console.log('📊 GraphQL en http://localhost:4000/graphql');
  });
}

startServer();
\`\`\`

**Iniciar el servidor:**
\`\`\`bash
node app.js
\`\`\`

---

## 3. ESTRUCTURA DE ARCHIVOS

Copia la carpeta `graphql/` a tu proyecto backend:

\`\`\`
tu-proyecto-backend/
├── graphql/
│   ├── types.ts          # Tipos TypeScript
│   ├── schema.ts         # Esquema GraphQL
│   ├── resolvers.ts      # Lógica de negocio
│   └── data.ts           # Datos (temporal)
├── server.js             # Servidor GraphQL
└── package.json
\`\`\`

---

## 4. CONECTAR REACT CON GRAPHQL

### Paso 1: Configurar Apollo Client

Crea un archivo `apollo-client.js` en tu proyecto React:

\`\`\`javascript
// src/apollo-client.js
import { ApolloClient, InMemoryCache } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql', // URL de tu servidor GraphQL
  cache: new InMemoryCache(),
});

export default client;
\`\`\`

### Paso 2: Envolver tu App con ApolloProvider

\`\`\`javascript
// src/index.js o src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ApolloProvider } from '@apollo/client';
import client from './apollo-client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
\`\`\`

---

## 5. EJEMPLOS DE COMPONENTES REACT

### Ejemplo 1: Mostrar el Menú

\`\`\`javascript
// src/components/Menu.jsx
import { useQuery, gql } from '@apollo/client';

const GET_MENU = gql`
  query GetMenu {
    dishes {
      id
      name
      description
      price
      category {
        name
      }
    }
  }
`;

function Menu() {
  const { loading, error, data } = useQuery(GET_MENU);

  if (loading) return <p>Cargando menú...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>Menú del Restaurante</h2>
      <div className="menu-grid">
        {data.dishes.map((dish) => (
          <div key={dish.id} className="dish-card">
            <h3>{dish.name}</h3>
            <p>{dish.description}</p>
            <p className="category">{dish.category.name}</p>
            <p className="price">${dish.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Menu;
\`\`\`

### Ejemplo 2: Crear una Orden

\`\`\`javascript
// src/components/CreateOrder.jsx
import { useMutation, gql } from '@apollo/client';
import { useState } from 'react';

const CREATE_ORDER = gql`
  mutation CreateOrder($tableId: ID!, $items: [OrderItemInput!]!) {
    createOrder(tableId: $tableId, items: $items) {
      id
      total
      status
    }
  }
`;

function CreateOrder() {
  const [tableId, setTableId] = useState('1');
  const [createOrder, { loading, error, data }] = useMutation(CREATE_ORDER);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    createOrder({
      variables: {
        tableId: tableId,
        items: [
          { dishId: '1', quantity: 2 },
          { dishId: '3', quantity: 1, specialInstructions: 'Sin cebolla' }
        ]
      }
    });
  };

  return (
    <div>
      <h2>Crear Orden</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Mesa:
          <input 
            type="text" 
            value={tableId} 
            onChange={(e) => setTableId(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Creando...' : 'Crear Orden'}
        </button>
      </form>

      {error && <p>Error: {error.message}</p>}
      {data && (
        <div>
          <p>✅ Orden creada exitosamente!</p>
          <p>ID: {data.createOrder.id}</p>
          <p>Total: ${data.createOrder.total}</p>
        </div>
      )}
    </div>
  );
}

export default CreateOrder;
\`\`\`

### Ejemplo 3: Ver Mesas Disponibles

\`\`\`javascript
// src/components/Tables.jsx
import { useQuery, gql } from '@apollo/client';

const GET_AVAILABLE_TABLES = gql`
  query GetAvailableTables {
    availableTables {
      id
      number
      capacity
      status
    }
  }
`;

function Tables() {
  const { loading, error, data, refetch } = useQuery(GET_AVAILABLE_TABLES);

  if (loading) return <p>Cargando mesas...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h2>Mesas Disponibles</h2>
      <button onClick={() => refetch()}>Actualizar</button>
      
      <div className="tables-grid">
        {data.availableTables.map((table) => (
          <div key={table.id} className="table-card">
            <h3>Mesa {table.number}</h3>
            <p>Capacidad: {table.capacity} personas</p>
            <span className={`status ${table.status}`}>
              {table.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tables;
\`\`\`

---

## 6. QUERIES Y MUTATIONS DISPONIBLES

### Queries (Consultas)

```graphql
# Obtener todos los platillos
query {
  dishes {
    id
    name
    price
    category { name }
  }
}

# Obtener platillos por categoría
query {
  dishesByCategory(categoryId: "1") {
    id
    name
    price
  }
}

# Obtener órdenes activas
query {
  activeOrders {
    id
    total
    status
    table { number }
  }
}

# Obtener mesas disponibles
query {
  availableTables {
    id
    number
    capacity
  }
}
