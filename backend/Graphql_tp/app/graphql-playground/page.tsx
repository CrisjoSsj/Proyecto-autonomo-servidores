"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { queryExamples } from "@/components/query-examples"
import { Play, Copy, Check, Download } from "lucide-react"
import { ReportButtons } from "@/components/report-buttons"
import { exportPdfFromResult, exportExcelFromResult } from '@/lib/client-export'

export default function GraphQLPlayground() {
  const [query, setQuery] = useState(queryExamples[0].query)
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const executeQuery = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      const data = await response.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (error) {
      setResult(JSON.stringify({ error: "Error al ejecutar la consulta" }, null, 2))
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">GraphQL Playground</h1>
          <p className="text-muted-foreground">Prueba consultas y mutaciones GraphQL con tipado fuerte de TypeScript</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Editor de Consultas</CardTitle>
                  <CardDescription>Escribe tu consulta GraphQL aquí</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={copyToClipboard}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button onClick={executeQuery} disabled={loading} size="sm">
                    <Play className="mr-2 h-4 w-4" />
                    {loading ? "Ejecutando..." : "Ejecutar"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                placeholder="Escribe tu consulta GraphQL..."
              />

              {result && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Resultado:</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => exportPdfFromResult(result)}
                        title="Exportar PDF del resultado"
                      >
                        <Download className="mr-1 h-4 w-4" /> PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportExcelFromResult(result)}
                        title="Exportar Excel del resultado"
                      >
                        <Download className="mr-1 h-4 w-4" /> Excel
                      </Button>
                    </div>
                  </div>
                  <pre className="rounded-lg bg-muted p-4 overflow-x-auto max-h-[380px]">
                    <code className="text-sm">{result}</code>
                  </pre>
                  <p className="text-xs text-muted-foreground">Exportación local: genera el archivo directamente en tu navegador sin pasar por la ruta /api/report.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ejemplos</CardTitle>
              <CardDescription>Consultas predefinidas para probar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {queryExamples.map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left bg-transparent"
                    onClick={() => setQuery(example.query)}
                  >
                    <span className="truncate">{example.name}</span>
                  </Button>
                ))}
              </div>
              <div className="mt-6 border-t pt-4">
                <h3 className="text-sm font-semibold mb-2">Reportes</h3>
                <ReportButtons />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Esquema GraphQL</CardTitle>
            <CardDescription>Tipos y operaciones disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
              <code className="text-sm">{`type User {
  id: ID!
  name: String!
  email: String!
  role: Role!
}

enum Role {
  ADMIN
  USER
  GUEST
}

type Analytics {
  totalUsers: Int!
  activeUsers: Int!
  usersByRole: [RoleCount!]!
}

type Query {
  users: [User!]!
  user(id: ID!): User
  analytics: Analytics!
}

type Mutation {
  createUser(name: String!, email: String!, role: Role!): User!
  updateUser(id: ID!, name: String, email: String, role: Role): User!
  deleteUser(id: ID!): Boolean!
}`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
