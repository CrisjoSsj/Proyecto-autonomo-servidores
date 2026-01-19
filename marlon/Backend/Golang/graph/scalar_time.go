package graph

import (
	"github.com/99designs/gqlgen/graphql"
	"time"
)

func MarshalTime(t time.Time) graphql.Marshaler {
	return graphql.MarshalString(t.Format("15:04:05"))
}

func UnmarshalTime(v interface{}) (time.Time, error) {
	str, _ := v.(string)
	return time.Parse("15:04:05", str)
}
