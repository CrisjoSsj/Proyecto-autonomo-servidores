"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Activity, Shield, ArrowRight, Code2, Database } from "lucide-react"

interface Analytics {
  totalUsers: number
  activeUsers: number
  usersByRole: Array<{ role: string; count: number }>
}

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function Home() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const analyticsQuery = `
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
        `

        const usersQuery = `
          query GetUsers {
            users {
              id
              name
              email
              role
            }
          }
        `

        const [analyticsRes, usersRes] = await Promise.all([
          fetch("/api/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: analyticsQuery }),
          }),
          fetch("/api/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: usersQuery }),
          }),
        ])

        const analyticsData = await analyticsRes.json()
        const usersData = await usersRes.json()

        setAnalytics(analyticsData.data.analytics)
        setUsers(usersData.data.users)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "default"
      case "USER":
        return "secondary"
      case "GUEST":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">GraphQL + TypeScript</h1>
              <p className="text-muted-foreground">API tipada con consultas complejas y reportes analíticos</p>
            </div>
            <Link href="/graphql-playground">
              <Button size="lg">
                Abrir Playground
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : analytics?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Registrados en el sistema</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? "..." : analytics?.activeUsers || 0}</div>
                <p className="text-xs text-muted-foreground">Con permisos de usuario o admin</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Administradores</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? "..." : analytics?.usersByRole.find((r) => r.role === "ADMIN")?.count || 0}
                </div>
                <p className="text-xs text-muted-foreground">Con permisos completos</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios Registrados</CardTitle>
                <CardDescription>Lista de usuarios obtenida mediante GraphQL</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Cargando usuarios...</p>
                ) : (
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-1">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución por Rol</CardTitle>
                <CardDescription>Análisis de usuarios por tipo de cuenta</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Cargando estadísticas...</p>
                ) : (
                  <div className="space-y-4">
                    {analytics?.usersByRole.map((roleData) => (
                      <div key={roleData.role} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{roleData.role}</span>
                          <span className="text-sm text-muted-foreground">{roleData.count} usuarios</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{
                              width: `${(roleData.count / (analytics?.totalUsers || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code2 className="h-5 w-5" />
                  Tipado Fuerte con TypeScript
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Todos los tipos están definidos y validados en tiempo de compilación
                </p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Autocompletado inteligente
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Detección de errores temprana
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Refactorización segura
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Consultas GraphQL Optimizadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Obtén exactamente los datos que necesitas con una sola petición
                </p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Sin over-fetching de datos
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Consultas anidadas eficientes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Mutaciones con validación
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
