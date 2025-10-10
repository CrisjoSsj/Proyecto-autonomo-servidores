"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

interface Dish {
  id: string
  name: string
  description: string
  price: number
  available: boolean
  preparationTime: number
  category: {
    name: string
  }
}

interface Order {
  id: string
  status: string
  total: number
  table: {
    number: number
  }
  items: Array<{
    dish: {
      name: string
      price: number
    }
    quantity: number
    subtotal: number
  }>
}

interface Table {
  id: string
  number: number
  capacity: number
  status: string
}

export default function RestaurantGraphQL() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMenu = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetMenu {
              dishes {
                id
                name
                description
                price
                available
                preparationTime
                category {
                  name
                }
              }
            }
          `,
        }),
      })
      const { data } = await response.json()
      setDishes(data.dishes)
    } catch (error) {
      console.error("Error fetching menu:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveOrders = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetActiveOrders {
              activeOrders {
                id
                status
                total
                table {
                  number
                }
                items {
                  dish {
                    name
                    price
                  }
                  quantity
                  subtotal
                }
              }
            }
          `,
        }),
      })
      const { data } = await response.json()
      setOrders(data.activeOrders)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTables = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            query GetTables {
              tables {
                id
                number
                capacity
                status
              }
            }
          `,
        }),
      })
      const { data } = await response.json()
      setTables(data.tables)
    } catch (error) {
      console.error("Error fetching tables:", error)
    } finally {
      setLoading(false)
    }
  }

  const createSampleOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `
            mutation CreateOrder($tableId: ID!, $items: [OrderItemInput!]!) {
              createOrder(tableId: $tableId, items: $items) {
                id
                status
                total
                table {
                  number
                }
              }
            }
          `,
          variables: {
            tableId: "1",
            items: [
              { dishId: "1", quantity: 2 },
              { dishId: "3", quantity: 1, specialInstructions: "Término medio" },
            ],
          },
        }),
      })
      const result = await response.json()
      if (result.data) {
        alert(`Orden creada exitosamente! Total: $${result.data.createOrder.total}`)
        fetchActiveOrders()
        fetchTables()
      }
    } catch (error) {
      console.error("Error creating order:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Sistema de Restaurante</h1>
          <p className="mt-2 text-muted-foreground">API GraphQL con TypeScript para gestión completa de restaurante</p>
        </div>

        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="menu">Menú</TabsTrigger>
            <TabsTrigger value="orders">Órdenes</TabsTrigger>
            <TabsTrigger value="tables">Mesas</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Menú del Restaurante</CardTitle>
                <CardDescription>Consulta todos los platillos disponibles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={fetchMenu} disabled={loading} className="w-full">
                  {loading ? "Cargando..." : "Cargar Menú"}
                </Button>

                {dishes.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-2">
                    {dishes.map((dish) => (
                      <Card key={dish.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{dish.name}</CardTitle>
                              <CardDescription>{dish.category.name}</CardDescription>
                            </div>
                            <Badge variant={dish.available ? "default" : "secondary"}>
                              {dish.available ? "Disponible" : "No disponible"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <p className="text-sm text-muted-foreground">{dish.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">${dish.price.toFixed(2)}</span>
                            <span className="text-sm text-muted-foreground">{dish.preparationTime} min</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Órdenes Activas</CardTitle>
                <CardDescription>Gestiona las órdenes en proceso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={fetchActiveOrders} disabled={loading} className="flex-1">
                    {loading ? "Cargando..." : "Cargar Órdenes"}
                  </Button>
                  <Button onClick={createSampleOrder} disabled={loading} variant="outline">
                    Crear Orden de Prueba
                  </Button>
                </div>

                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <Card key={order.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                Orden #{order.id} - Mesa {order.table.number}
                              </CardTitle>
                              <CardDescription>Total: ${order.total.toFixed(2)}</CardDescription>
                            </div>
                            <Badge
                              variant={
                                order.status === "delivered"
                                  ? "default"
                                  : order.status === "preparing"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>
                                  {item.quantity}x {item.dish.name}
                                </span>
                                <span className="font-medium">${item.subtotal.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">No hay órdenes activas</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Estado de Mesas</CardTitle>
                <CardDescription>Visualiza la disponibilidad de las mesas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={fetchTables} disabled={loading} className="w-full">
                  {loading ? "Cargando..." : "Cargar Mesas"}
                </Button>

                {tables.length > 0 && (
                  <div className="grid gap-4 md:grid-cols-3">
                    {tables.map((table) => (
                      <Card key={table.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">Mesa {table.number}</CardTitle>
                            <Badge
                              variant={
                                table.status === "available"
                                  ? "default"
                                  : table.status === "occupied"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {table.status === "available"
                                ? "Disponible"
                                : table.status === "occupied"
                                  ? "Ocupada"
                                  : "Reservada"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Capacidad: {table.capacity} personas</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>API GraphQL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <strong>Endpoint:</strong> <code className="rounded bg-muted px-2 py-1">/api/graphql</code>
            </div>
            <div className="text-muted-foreground">
              Accede al endpoint para explorar el esquema completo con Apollo Studio. Incluye queries para menú,
              órdenes, mesas y reservaciones, además de mutations para gestionar todo el sistema.
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
