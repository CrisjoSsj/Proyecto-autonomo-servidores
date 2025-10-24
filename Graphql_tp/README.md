# GraphQL + TypeScript - Proyecto Completo

Implementación completa de GraphQL con TypeScript en Next.js, incluyendo esquemas tipados, consultas complejas y reportes analíticos con interfaz visual.

## Solución al Error de Tailwind CSS

Si ves el error `Cannot find module '@tailwindcss/postcss'`, ejecuta:

\`\`\`bash
# Elimina node_modules y package-lock.json
rm -rf node_modules package-lock.json

# Reinstala todas las dependencias
npm install

# Inicia el servidor de desarrollo
npm run dev
\`\`\`

## Instalación Rápida

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Abrir en el navegador
# http://localhost:3000
\`\`\`

## Características de la Interfaz

### Página Principal (/)
- Dashboard con estadísticas en tiempo real
- Visualización de usuarios registrados
- Gráficos de distribución por roles
- Tarjetas informativas sobre las ventajas de GraphQL + TypeScript

### Playground GraphQL (/graphql-playground)
- Editor de consultas interactivo
- Ejemplos predefinidos de queries y mutations
- Visualización de resultados en formato JSON
- Documentación del esquema GraphQL
- Botón para copiar consultas
- Ejecución en tiempo real

## Estructura del Proyecto

\`\`\`
├── app/
│   ├── api/
│   │   └── graphql/
│   │       └── route.ts          # Endpoint GraphQL
│   ├── graphql-playground/
│   │   └── page.tsx               # Interfaz del playground
│   ├── page.tsx                   # Dashboard principal
│   ├── layout.tsx                 # Layout de la app
│   └── globals.css                # Estilos globales
├── lib/
│   └── graphql/
│       ├── schema.ts              # Definición del esquema GraphQL
│       ├── types.ts               # Tipos TypeScript
│       └── resolvers.ts           # Lógica de resolvers
├── components/
│   ├── ui/                        # Componentes de UI (shadcn)
│   └── query-examples.tsx         # Ejemplos de consultas
└── README.md
\`\`\`

## Dependencias Instaladas

\`\`\`json
{
  "@apollo/server": "^4.11.0",
  "@as-integrations/next": "^3.1.0",
  "graphql": "^16.9.0",
  "lucide-react": "^0.468.0"
}
\`\`\`

## Ejemplos de Uso

### Desde la Interfaz Web

1. Abre http://localhost:3000 para ver el dashboard
2. Haz clic en "Abrir Playground" para acceder al editor
3. Selecciona un ejemplo predefinido o escribe tu propia consulta
4. Haz clic en "Ejecutar" para ver los resultados

### Consultas Disponibles

**Obtener todos los usuarios:**
\`\`\`graphql
query GetAllUsers {
  users {
    id
    name
    email
    role
  }
}
\`\`\`

**Obtener analíticas:**
\`\`\`graphql
query GetAnalytics {
  analytics {
    totalUsers
    activeUsers
    usersByRole {
      role
      count
    }
  }
}
\`\`\`

**Crear un usuario:**
\`\`\`graphql
mutation CreateUser {
  createUser(
    name: "Nuevo Usuario"
    email: "nuevo@example.com"
    role: USER
  ) {
    id
    name
    email
    role
  }
}
\`\`\`

## Ventajas del Tipado Fuerte

1. **Consistencia**: Los tipos garantizan que los datos fluyan correctamente entre cliente y servidor
2. **Menos errores**: TypeScript detecta errores en tiempo de compilación antes de ejecutar
3. **Autocompletado**: IntelliSense muestra todas las propiedades y métodos disponibles
4. **Refactorización segura**: Los cambios en el esquema se propagan automáticamente
5. **Documentación automática**: Los tipos sirven como documentación viva del código

## Personalización

### Agregar nuevos tipos

Edita `lib/graphql/schema.ts` y `lib/graphql/types.ts`:

\`\`\`typescript
// En schema.ts
type Product {
  id: ID!
  name: String!
  price: Float!
}

// En types.ts
export interface Product {
  id: string
  name: string
  price: number
}
\`\`\`

### Agregar nuevas consultas

Edita `lib/graphql/resolvers.ts`:

\`\`\`typescript
Query: {
  products: (): Product[] => {
    return []
  }
}
\`\`\`

## Solución de Problemas

### El servidor no inicia

\`\`\`bash
# Verifica que todas las dependencias estén instaladas
npm install

# Limpia la caché de Next.js
rm -rf .next
npm run dev
\`\`\`

### Error en las consultas GraphQL

Verifica que:
1. El servidor esté corriendo en http://localhost:3000
2. La consulta tenga la sintaxis correcta
3. Los tipos coincidan con el esquema definido

### Problemas con TypeScript

\`\`\`bash
# Verifica los tipos
npx tsc --noEmit
\`\`\`

## Recursos Adicionales

- [Documentación de Apollo Server](https://www.apollographql.com/docs/apollo-server/)
- [GraphQL Official Docs](https://graphql.org/learn/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)

## Licencia

MIT License
