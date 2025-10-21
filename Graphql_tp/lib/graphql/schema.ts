export const typeDefs = `#graphql
  """
  ===============================
  Tipos principales del sistema
  ===============================
  """

  # Representa a un usuario del sistema
  type User {
    id: ID!
    name: String!
    email: String!
    role: Role!
  }

  # Roles disponibles en el sistema
  enum Role {
    ADMIN
    USER
    GUEST
  }

  """
  ===============================
  Tipos relacionados con analíticas
  ===============================
  """

  # Métricas generales del sistema
  type Analytics {
    totalUsers: Int!           # Total de usuarios registrados
    activeUsers: Int!          # Usuarios activos actualmente
    usersByRole: [RoleCount!]! # Distribución de usuarios por rol
  }

  # Relación entre un rol y la cantidad de usuarios que lo tienen
  type RoleCount {
    role: Role!
    count: Int!
  }

  """
  ===============================
  Consultas (Queries)
  ===============================
  """

  type Query {
    # Obtiene todos los usuarios
    users: [User!]!

    # Obtiene un usuario por su ID
    user(id: ID!): User

    # Obtiene las métricas generales del sistema
    analytics: Analytics!
  }

  """
  ===============================
  Mutaciones (Mutations)
  ===============================
  """

  type Mutation {
    # Crea un nuevo usuario
    createUser(
      name: String!,
      email: String!,
      role: Role!
    ): User!

    # Actualiza un usuario existente
    updateUser(
      id: ID!,
      name: String,
      email: String,
      role: Role
    ): User!

    # Elimina un usuario por ID
    deleteUser(id: ID!): Boolean!
  }
`
