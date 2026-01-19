package graph

import (
	"fmt"
	"github.com/99designs/gqlgen/graphql"
	"github.com/shopspring/decimal"
)

func MarshalDecimal(d decimal.Decimal) graphql.Marshaler {
	return graphql.MarshalString(d.String())
}

func UnmarshalDecimal(v interface{}) (decimal.Decimal, error) {
	str, ok := v.(string)
	if !ok {
		return decimal.Decimal{}, fmt.Errorf("Decimal must be a string")
	}
	return decimal.NewFromString(str)
}
