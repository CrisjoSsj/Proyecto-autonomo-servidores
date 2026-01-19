package graph

import (
	"context"
	"fmt"

	"github.com/99designs/gqlgen/graphql"
	"github.com/shopspring/decimal"
	"github.com/vektah/gqlparser/v2/ast"
)

// unmarshalInputDecimal deserializes a Decimal scalar from input
func (ec *executionContext) unmarshalInputDecimal(ctx context.Context, v interface{}) (decimal.Decimal, error) {
	str, ok := v.(string)
	if !ok {
		return decimal.Decimal{}, fmt.Errorf("Decimal must be a string")
	}
	return decimal.NewFromString(str)
}

// _Decimal marshals a Decimal scalar for output
func (ec *executionContext) _Decimal(ctx context.Context, sel ast.SelectionSet, v *decimal.Decimal) graphql.Marshaler {
	if v == nil {
		return graphql.Null
	}
	return graphql.MarshalString(v.String())
}
