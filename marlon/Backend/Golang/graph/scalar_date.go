package graph

import (
	"fmt"
	"time"

	"github.com/99designs/gqlgen/graphql"
)

func MarshalDate(t time.Time) graphql.Marshaler {
	return graphql.MarshalString(t.Format("2006-01-02"))
}

func UnmarshalDate(v interface{}) (time.Time, error) {
	str, ok := v.(string)
	if !ok {
		return time.Time{}, fmt.Errorf("date must be a string")
	}

	// Intentar parsear con formato solo fecha primero
	t, err := time.Parse("2006-01-02", str)
	if err == nil {
		return t, nil
	}

	// Si falla, intentar con formato ISO 8601 completo
	t, err = time.Parse(time.RFC3339, str)
	if err == nil {
		return t, nil
	}

	return time.Time{}, fmt.Errorf("unable to parse date %q", str)
}
