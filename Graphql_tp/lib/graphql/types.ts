export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

export interface Analytics {
  totalUsers: number
  activeUsers: number
  usersByRole: RoleCount[]
}

export interface RoleCount {
  role: Role
  count: number
}

export interface CreateUserInput {
  name: string
  email: string
  role: Role
}

export interface UpdateUserInput {
  id: string
  name?: string
  email?: string
  role?: Role
}
