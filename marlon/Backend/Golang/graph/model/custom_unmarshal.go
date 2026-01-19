package model

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/shopspring/decimal"
)

// UnmarshalJSON implementa json.Unmarshaler para manejar el campo fecha en formato "2006-01-02"
func (r *Reserva) UnmarshalJSON(data []byte) error {
	// Crear un alias para evitar recursión infinita
	type Alias Reserva

	// Estructura auxiliar con fecha como string
	aux := &struct {
		Fecha string `json:"fecha"`
		*Alias
	}{
		Alias: (*Alias)(r),
	}

	// Unmarshal los datos
	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Mapeo adicional para claves snake_case frecuentes
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(data, &raw); err == nil {
		if v, ok := raw["total_estimado"]; ok {
			var dec decimal.Decimal
			if err := json.Unmarshal(v, &dec); err == nil {
				r.TotalEstimado = dec
			}
		}
	}

	// Parsear la fecha si existe
	if aux.Fecha != "" {
		// Intentar formato solo fecha primero
		t, err := time.Parse("2006-01-02", aux.Fecha)
		if err != nil {
			// Si falla, intentar con ISO 8601
			t, err = time.Parse(time.RFC3339, aux.Fecha)
			if err != nil {
				return fmt.Errorf("error parsing fecha %q: %w", aux.Fecha, err)
			}
		}
		r.Fecha = t
	}

	return nil
}

// UnmarshalJSON implementa json.Unmarshaler para User para manejar snake_case de Django
func (u *User) UnmarshalJSON(data []byte) error {
	type Alias User

	aux := &struct {
		FirstName *string `json:"first_name"`
		LastName  *string `json:"last_name"`
		*Alias
	}{
		Alias: (*Alias)(u),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Mapear snake_case a camelCase
	if aux.FirstName != nil {
		u.FirstName = aux.FirstName
	}
	if aux.LastName != nil {
		u.LastName = aux.LastName
	}

	return nil
}

// UnmarshalJSON implementa json.Unmarshaler para Cliente para asegurar que user se decodifica correctamente
func (c *Cliente) UnmarshalJSON(data []byte) error {
	type Alias Cliente

	aux := &struct {
		CreatedAt string `json:"created_at"`
		UpdatedAt string `json:"updated_at"`
		*Alias
	}{
		Alias: (*Alias)(c),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Parsear timestamps si están en snake_case
	if aux.CreatedAt != "" {
		if t, err := time.Parse(time.RFC3339, aux.CreatedAt); err == nil {
			c.CreatedAt = t
		}
	}
	if aux.UpdatedAt != "" {
		if t, err := time.Parse(time.RFC3339, aux.UpdatedAt); err == nil {
			c.UpdatedAt = t
		}
	}

	return nil
}

// UnmarshalJSON implementa json.Unmarshaler para Servicio para manejar snake_case de Django
func (s *Servicio) UnmarshalJSON(data []byte) error {
	type Alias Servicio

	aux := &struct {
		NombreServicio *string  `json:"nombre_servicio"`
		RatingPromedio *float64 `json:"rating_promedio"`
		CreatedAt      string   `json:"created_at"`
		UpdatedAt      string   `json:"updated_at"`
		*Alias
	}{
		Alias: (*Alias)(s),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// Mapear snake_case a camelCase
	if aux.NombreServicio != nil && *aux.NombreServicio != "" {
		s.NombreServicio = *aux.NombreServicio
	}
	if aux.RatingPromedio != nil {
		s.RatingPromedio = *aux.RatingPromedio
	}

	// Parsear timestamps si están en snake_case
	if aux.CreatedAt != "" {
		if t, err := time.Parse(time.RFC3339, aux.CreatedAt); err == nil {
			s.CreatedAt = t
		}
	}
	if aux.UpdatedAt != "" {
		if t, err := time.Parse(time.RFC3339, aux.UpdatedAt); err == nil {
			s.UpdatedAt = t
		}
	}

	return nil
}
