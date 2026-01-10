import { ApolloServer } from "@apollo/server"
import { startServerAndCreateNextHandler } from "@as-integrations/next"
import { typeDefs } from "@/lib/graphql/schema"
import { resolvers } from "@/lib/graphql/resolvers"

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

const handler = startServerAndCreateNextHandler(server)

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // En producción, cambiar a dominio específico
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}

async function safeHandler(request: Request) {
  try {
    // Intentar clonar y leer el body para logging en dev
    if (request.method === 'POST') {
      try {
        const cloned = request.clone()
        const body = await cloned.json().catch(() => null)
        console.log('▶️ /api/graphql request body:', body)
      } catch (e) {
        console.warn('No se pudo parsear body para logging:', e)
      }
    }

    const res = await handler(request)
    
    // Agregar headers CORS a la respuesta
    const newHeaders = new Headers(res.headers)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value)
    })
    
    // Si la respuesta es un error HTTP, lo registramos
    if (!res.ok) {
      console.warn(`/api/graphql responded with status ${res.status}`)
    }
    
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    })
  } catch (err) {
    console.error('Error handling /api/graphql:', err)
    return new Response(JSON.stringify({ errors: [{ message: String(err) }] }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })
  }
}

// Manejar peticiones OPTIONS (preflight)
export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET(request: Request) {
  return safeHandler(request)
}

export async function POST(request: Request) {
  return safeHandler(request)
}
