import { ApolloServer } from "@apollo/server"
import { startServerAndCreateNextHandler } from "@as-integrations/next"
import { typeDefs } from "@/lib/graphql/schema"
import { resolvers } from "@/lib/graphql/resolvers"
import type { GraphQLContext } from "@/lib/graphql/types"

const server = new ApolloServer<GraphQLContext>({
  typeDefs,
  resolvers,
  introspection: true, // Habilita GraphQL Playground en desarrollo
})

const handler = startServerAndCreateNextHandler(server, {
  context: async (req): Promise<GraphQLContext> => {
    // Aquí puedes agregar lógica de autenticación, etc.
    return {
      userId: req.headers.get("x-user-id") || undefined,
    }
  },
})

export { handler as GET, handler as POST }
