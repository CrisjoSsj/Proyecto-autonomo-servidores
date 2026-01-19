# FindyourWork - GraphQL Service (Golang)

## Descripción
Este servicio implementa una API GraphQL en Golang utilizando gqlgen. Proporciona consultas optimizadas y un sistema de caché para mejorar el rendimiento de las operaciones de lectura en FindyourWork.

## Características Principales

- Implementación GraphQL con gqlgen
- Sistema de caché integrado
- Resolvers optimizados
- Integración con servicio REST
- Queries y mutaciones eficientes
- Manejo de tipos personalizados
- Sistema de middleware para autenticación

## Estructura del Proyecto

```
Golang/
├── graph/
│   ├── model/              # Modelos GraphQL
│   ├── cache_service.go    # Servicio de caché
│   ├── database.go         # Configuración de base de datos
│   ├── db_models.go        # Modelos de base de datos
│   ├── generated.go        # Código autogenerado por gqlgen
│   ├── resolver.go         # Resolver principal
│   ├── resolver_helpers.go # Funciones auxiliares
│   ├── restclient.go      # Interface del cliente REST
│   ├── restclient_impl.go # Implementación del cliente REST
│   ├── schema.graphqls    # Schema GraphQL
│   └── schema.resolvers.go # Implementación de resolvers
├── go.mod                  # Dependencias del módulo
├── go.sum                  # Checksums de dependencias
├── gqlgen.yml             # Configuración de gqlgen
├── server.go              # Punto de entrada principal
└── server_optimized.go    # Versión optimizada del servidor
```

## Requisitos Previos

- Go 1.16 o superior
- Make (opcional, para scripts de construcción)
- Docker (opcional, para contenedorización)

## Instalación

1. Clonar el repositorio y navegar al directorio:
```bash
cd Backend/Golang
```

2. Instalar dependencias:
```bash
go mod download
```

3. Generar código GraphQL (si se realizan cambios en el schema):
```bash
go run github.com/99designs/gqlgen generate
```

## Ejecución del Servidor

### Desarrollo
```bash
go run server.go
```
El servidor GraphQL estará disponible en `http://localhost:8080/query`

### Producción
```bash
go run server_optimized.go
```

## Schema GraphQL

### Queries Principales
```graphql
type Query {
  servicios(filter: ServicioFilter): [Servicio!]!
  servicio(id: ID!): Servicio
  proveedores: [Proveedor!]!
  proveedor(id: ID!): Proveedor
  reservas(filter: ReservaFilter): [Reserva!]!
  reserva(id: ID!): Reserva
}
```

### Mutaciones Principales
```graphql
type Mutation {
  crearServicio(input: ServicioInput!): Servicio!
  actualizarServicio(id: ID!, input: ServicioInput!): Servicio!
  eliminarServicio(id: ID!): Boolean!
  crearReserva(input: ReservaInput!): Reserva!
  actualizarEstadoReserva(id: ID!, estado: EstadoReserva!): Reserva!
}
```

## Sistema de Caché

El servicio implementa un sistema de caché para optimizar las consultas frecuentes:

```go
type CacheService interface {
    Get(key string) (interface{}, bool)
    Set(key string, value interface{}, duration time.Duration)
    Delete(key string)
    Clear()
}
```

## Integración con REST API

El servicio se integra con la API REST de Django mediante un cliente HTTP personalizado:

```go
type RestClient interface {
    GetServicio(id string) (*Servicio, error)
    ListServicios(filter *ServicioFilter) ([]*Servicio, error)
    // ... más métodos
}
```

## Middleware y Autenticación

El servidor incluye middleware para:
- Autenticación de JWT
- Logging
- Recuperación de pánico
- CORS
- Compresión

## Monitoreo y Métricas

El servidor expone métricas en `/metrics` para:
- Latencia de resolvers
- Tasa de aciertos de caché
- Errores por tipo
- Queries por cliente

## Optimización de Rendimiento

- Implementación de DataLoader para N+1 queries
- Caché en memoria para consultas frecuentes
- Batch de consultas relacionadas
- Timeouts configurables por operación

## Pruebas

Ejecutar pruebas unitarias:
```bash
go test ./...
```

Pruebas de integración:
```bash
go test -tags=integration ./...
```

## Documentación GraphQL

La documentación interactiva está disponible en:
- GraphQL Playground: `http://localhost:8080`
- Schema documentation: `http://localhost:8080/schema`

## Despliegue

### Docker
```bash
docker build -t findyourwork-graphql .
docker run -p 8080:8080 findyourwork-graphql
```

### Kubernetes
Los manifiestos de Kubernetes están disponibles en `k8s/`.

## Solución de Problemas Comunes

1. Errores de generación de código:
```bash
rm -rf graph/generated
go run github.com/99designs/gqlgen generate
```

2. Problemas de caché:
```bash
curl -X POST http://localhost:8080/cache/clear
```

3. Verificación de schema:
```bash
go run github.com/99designs/gqlgen validate
```

## Referencias

- [Documentación de gqlgen](https://gqlgen.com/)
- [Guía de Resolvers](./RESOLVERS_GUIDE.md)
- [Implementación de GraphQL](./GRAPHQL_REPORTS_IMPLEMENTATION.md)
- [Guía de Linting](./LINTING_FIX_GUIDE.md)

## Mantenimiento

- Actualizar dependencias regularmente
- Monitorear métricas de rendimiento
- Revisar logs de errores
- Mantener la documentación actualizada
- Ejecutar pruebas de carga periódicamente