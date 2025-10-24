export const queryExamples = [
  {
    name: "Obtener todos los usuarios",
    query: `query GetAllUsers {
  users {
    id
    name
    email
    role
  }
}`,
  },
  {
    name: "Obtener usuario por ID",
    query: `query GetUser {
  user(id: "1") {
    id
    name
    email
    role
  }
}`,
  },
  {
    name: "Obtener analíticas",
    query: `query GetAnalytics {
  analytics {
    totalUsers
    activeUsers
    usersByRole {
      role
      count
    }
  }
}`,
  },
  {
    name: "Crear nuevo usuario",
    query: `mutation CreateUser {
  createUser(
    name: "Pedro Sánchez"
    email: "pedro@example.com"
    role: USER
  ) {
    id
    name
    email
    role
  }
}`,
  },
  {
    name: "Actualizar usuario",
    query: `mutation UpdateUser {
  updateUser(
    id: "1"
    name: "Juan Pérez Actualizado"
    role: ADMIN
  ) {
    id
    name
    email
    role
  }
}`,
  },
  {
    name: "Eliminar usuario",
    query: `mutation DeleteUser {
  deleteUser(id: "4")
}`,
  },
]
