import { type User, Role, type Analytics, type CreateUserInput, type UpdateUserInput } from "./types"

// Base de datos simulada en memoria
let users: User[] = [
  {
    id: "1",
    name: "Juan Pérez",
    email: "juan@example.com",
    role: Role.ADMIN,
  },
  {
    id: "2",
    name: "María García",
    email: "maria@example.com",
    role: Role.USER,
  },
  {
    id: "3",
    name: "Carlos López",
    email: "carlos@example.com",
    role: Role.USER,
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana@example.com",
    role: Role.GUEST,
  },
]

export const resolvers = {
  Query: {
    users: (): User[] => {
      return users
    },
    user: (_: unknown, { id }: { id: string }): User | undefined => {
      return users.find((user) => user.id === id)
    },
    analytics: (): Analytics => {
      const totalUsers = users.length
      const activeUsers = users.filter((u) => u.role !== Role.GUEST).length

      const usersByRole = Object.values(Role).map((role) => ({
        role,
        count: users.filter((u) => u.role === role).length,
      }))

      return {
        totalUsers,
        activeUsers,
        usersByRole,
      }
    },
  },
  Mutation: {
    createUser: (_: unknown, input: CreateUserInput): User => {
      const newUser: User = {
        id: String(users.length + 1),
        name: input.name,
        email: input.email,
        role: input.role,
      }
      users.push(newUser)
      return newUser
    },
    updateUser: (_: unknown, input: UpdateUserInput): User | null => {
      const userIndex = users.findIndex((u) => u.id === input.id)
      if (userIndex === -1) return null

      users[userIndex] = {
        ...users[userIndex],
        ...(input.name && { name: input.name }),
        ...(input.email && { email: input.email }),
        ...(input.role && { role: input.role }),
      }

      return users[userIndex]
    },
    deleteUser: (_: unknown, { id }: { id: string }): boolean => {
      const initialLength = users.length
      users = users.filter((u) => u.id !== id)
      return users.length < initialLength
    },
  },
}
