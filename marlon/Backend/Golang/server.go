package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/99designs/gqlgen/graphql/handler"
	"github.com/99designs/gqlgen/graphql/handler/transport"
	"github.com/99designs/gqlgen/graphql/playground"

	"github.com/MarlonX-a/5toA_Proyecto_Autonomo_Apps_Ser_web/Golang/graph"
)

const defaultPort = "9090"

func main() {
	// Obtener puerto desde variable de entorno
	port := os.Getenv("PORT")
	if port == "" {
		port = defaultPort
	}

	// Crear el RestClient que usará la API REST
	restClient := graph.NewRestClient("http://127.0.0.1:8000/api_rest/api/v1/")

	// Crear el resolver inyectando el RestClient
	resolver := &graph.Resolver{
		RESTClient: restClient,
	}

	// Crear servidor gqlgen
	srv := handler.NewDefaultServer(
		graph.NewExecutableSchema(graph.Config{Resolvers: resolver}),
	)

	// Transportes HTTP
	srv.AddTransport(transport.Options{})
	srv.AddTransport(transport.GET{})
	srv.AddTransport(transport.POST{})

	// Handlers HTTP
	http.Handle("/", playground.Handler("GraphQL Playground", "/query"))
	// Agregar CORS y pasar *http.Request en el contexto a los resolvers
	http.Handle("/query", withCORS(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), "httpRequest", r)
		srv.ServeHTTP(w, r.WithContext(ctx))
	})))

	// Iniciar servidor
	log.Printf("Servidor corriendo en http://localhost:%s/ para GraphQL playground", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// withCORS agrega cabeceras CORS simples para permitir requests desde el frontend
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
