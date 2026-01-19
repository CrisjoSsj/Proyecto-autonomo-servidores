package graph

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"time"

	"github.com/MarlonX-a/5toA_Proyecto_Autonomo_Apps_Ser_web/Golang/graph/model"
	"github.com/shopspring/decimal"
)

// RestClient defines the interface for REST calls to the Django API
type RestClient interface {

	// ServicioUbicacion
	GetServicioUbicacion(ctx context.Context, id string) (*model.ServicioUbicacion, error)
	ListServicioUbicaciones(ctx context.Context, pagination *model.Pagination) ([]*model.ServicioUbicacion, error)

	// Servicio
	GetServicio(ctx context.Context, id string) (*model.Servicio, error)
	ListServicios(ctx context.Context, filter *model.ServicioFilterInput, pagination *model.Pagination) ([]*model.Servicio, error)

	// Proveedor
	GetProveedor(ctx context.Context, id string) (*model.Proveedor, error)
	ListProveedores(ctx context.Context, pagination *model.Pagination) ([]*model.Proveedor, error)

	// Reserva
	GetReserva(ctx context.Context, id string) (*model.Reserva, error)
	ListReservas(ctx context.Context, filter *model.ReservaFilterInput, pagination *model.Pagination) ([]*model.Reserva, error)

	// Cliente
	GetCliente(ctx context.Context, id string) (*model.Cliente, error)
	ListClientes(ctx context.Context, pagination *model.Pagination) ([]*model.Cliente, error)

	// Ubicacion
	GetUbicacion(ctx context.Context, id string) (*model.Ubicacion, error)
	ListUbicaciones(ctx context.Context, pagination *model.Pagination) ([]*model.Ubicacion, error)

	// Categoria
	GetCategoria(ctx context.Context, id string) (*model.Categoria, error)
	ListCategorias(ctx context.Context, pagination *model.Pagination) ([]*model.Categoria, error)

	// Calificacion
	ListCalificaciones(ctx context.Context, pagination *model.Pagination) ([]*model.Calificacion, error)

	// Comentario
	ListComentarios(ctx context.Context, pagination *model.Pagination) ([]*model.Comentario, error)

	// Pago
	GetPago(ctx context.Context, id string) (*model.Pago, error)
	ListPagos(ctx context.Context, pagination *model.Pagination) ([]*model.Pago, error)

	// =====================================
	// REPORTES / MÉTRICAS
	// =====================================

	// Reportes generales
	ReporteVentas(ctx context.Context, pagination *model.Pagination) (*model.ReporteVentas, error)
	ReporteSatisfaccion(ctx context.Context, pagination *model.Pagination) ([]*model.ReporteSatisfaccion, error)
	ReporteProveedores(ctx context.Context, pagination *model.Pagination) ([]*model.ReporteProveedor, error)
	ReporteClientes(ctx context.Context, pagination *model.Pagination) ([]*model.ReporteCliente, error)
	MetricasGenerales(ctx context.Context, pagination *model.Pagination) (*model.MetricasGenerales, error)

	// Listados para reportes específicos
	ServiciosMasPopulares(ctx context.Context, limit *int32) ([]*model.ServicioVendido, error)
	ProveedoresMejorCalificados(ctx context.Context, limit *int32) ([]*model.ReporteProveedor, error)
	ClientesMasActivos(ctx context.Context, limit *int32) ([]*model.ReporteCliente, error)

	// Datos para gráficos de tendencias
	TendenciasVentas(ctx context.Context, filter *model.TendenciasFilter, pagination *model.Pagination) ([]*model.PuntoTendencia, error)
	TendenciasSatisfaccion(ctx context.Context, filter *model.TendenciasFilter, pagination *model.Pagination) ([]*model.PuntoTendencia, error)
}

// DummyRestClient is a minimal implementation that can be replaced by a real HTTP client.
type DummyRestClient struct {
	HTTP    *http.Client
	BaseURL string
}

func NewDummyRestClient(baseURL string) *DummyRestClient {
	return &DummyRestClient{HTTP: &http.Client{}, BaseURL: baseURL}
}

// buildServiciosURL builds a URL for the servicios endpoint with query params
func (c *DummyRestClient) buildServiciosURL(filter *model.ServicioFilterInput, pagination *model.Pagination) string {
	u, _ := url.Parse(c.BaseURL)

	// Path adecuado para tu API
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/servicio"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/servicio"
	}

	q := u.Query()

	// ==== FILTROS REALES QUE EXISTEN EN DJANGO ====

	if filter != nil {
		// solo_mios
		if filter.SoloMios != nil {
			if *filter.SoloMios {
				q.Set("solo_mios", "true")
			}
		}

		// proveedor_id
		if filter.ProveedorID != nil {
			q.Set("proveedor_id", strconv.Itoa(int(*filter.ProveedorID)))
		}

		// categoria_id
		if filter.CategoriaID != nil {
			q.Set("categoria_id", strconv.Itoa(int(*filter.CategoriaID)))
		}
	}

	// ==== PAGINACIÓN ====
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}

	u.RawQuery = q.Encode()
	return u.String()
}

// Funcion para llamar a un servicio específico a través de la API REST
func (c *DummyRestClient) GetServicio(ctx context.Context, id string) (*model.Servicio, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api_rest/api/v1/servicio/%s/", c.BaseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var s model.Servicio
	if err := json.NewDecoder(resp.Body).Decode(&s); err != nil {
		return nil, err
	}
	return &s, nil
}

// Funcion para llamar a todos los servicios a través de la API REST con filtros y paginación
func (c *DummyRestClient) ListServicios(ctx context.Context, filter *model.ServicioFilterInput, pagination *model.Pagination) ([]*model.Servicio, error) {
	url := c.buildServiciosURL(filter, pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	// Pasar el token JWT a Django para que pueda identificar al usuario
	if ctx != nil {
		if httpReq, ok := ctx.Value("httpRequest").(*http.Request); ok && httpReq != nil {
			if auth := httpReq.Header.Get("Authorization"); auth != "" {
				req.Header.Set("Authorization", auth)
			}
		}
	}

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}

	var list []*model.Servicio
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Función para llamar a un proveedor específico a través de la API REST
func (c *DummyRestClient) GetProveedor(ctx context.Context, id string) (*model.Proveedor, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api_rest/api/v1/proveedor/%s/", c.BaseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var p model.Proveedor
	if err := json.NewDecoder(resp.Body).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

// Función para llamar a todos los proveedores a través de la API REST
func (c *DummyRestClient) ListProveedores(ctx context.Context, pagination *model.Pagination) ([]*model.Proveedor, error) {
	u, _ := url.Parse(c.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/proveedor"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/proveedor"
	}
	q := u.Query()
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var list []*model.Proveedor
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Función para llamar a todas las reservas a través de la API REST
func (c *DummyRestClient) ListReservas(ctx context.Context, filter *model.ReservaFilterInput, pagination *model.Pagination) ([]*model.Reserva, error) {
	u, _ := url.Parse(c.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/reserva"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/reserva"
	}
	q := u.Query()
	if filter != nil {
		if filter.ClienteID != nil {
			q.Set("clienteId", strconv.Itoa(int(*filter.ClienteID)))
		}
		if filter.Estado != nil {
			q.Set("estado", *filter.Estado)
		}
		if filter.FechaDesde != nil {
			q.Set("fechaDesde", *filter.FechaDesde)
		}
		if filter.FechaHasta != nil {
			q.Set("fechaHasta", *filter.FechaHasta)
		}
	}
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var list []*model.Reserva
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Función para llamar a una reserva específica a través de la API REST
func (c *DummyRestClient) GetReserva(ctx context.Context, id string) (*model.Reserva, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api_rest/api/v1/reserva/%s/", c.BaseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var r model.Reserva
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, err
	}
	return &r, nil
}

// Función para llamar a todos los clientes a través de la API REST
func (c *DummyRestClient) ListClientes(ctx context.Context, pagination *model.Pagination) ([]*model.Cliente, error) {
	u, _ := url.Parse(c.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/cliente"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/cliente"
	}
	q := u.Query()
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var list []*model.Cliente
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Función para llamar a un cliente específico a través de la API REST
func (c *DummyRestClient) GetCliente(ctx context.Context, id string) (*model.Cliente, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api_rest/api/v1/cliente/%s/", c.BaseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var cobj model.Cliente
	if err := json.NewDecoder(resp.Body).Decode(&cobj); err != nil {
		return nil, err
	}
	return &cobj, nil
}

// Función para llamar a todas las ubicaciones a través de la API REST
func (c *DummyRestClient) ListUbicaciones(ctx context.Context, pagination *model.Pagination) ([]*model.Ubicacion, error) {
	u, _ := url.Parse(c.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/ubicacion"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/ubicacion"
	}
	q := u.Query()
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var list []*model.Ubicacion
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Función para llamar a una ubicación específica a través de la API REST
func (c *DummyRestClient) GetUbicacion(ctx context.Context, id string) (*model.Ubicacion, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api_rest/api/v1/ubicacion/%s/", c.BaseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var ub model.Ubicacion
	if err := json.NewDecoder(resp.Body).Decode(&ub); err != nil {
		return nil, err
	}
	return &ub, nil
}

// Función para llamar a todas las categorías a través de la API REST
func (c *DummyRestClient) ListCategorias(ctx context.Context, pagination *model.Pagination) ([]*model.Categoria, error) {
	u, _ := url.Parse(c.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/categoria"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/categoria"
	}
	q := u.Query()
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var list []*model.Categoria
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Función para llamar a una categoría específica a través de la API REST
func (c *DummyRestClient) GetCategoria(ctx context.Context, id string) (*model.Categoria, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api_rest/api/v1/categoria/%s/", c.BaseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var cat model.Categoria
	if err := json.NewDecoder(resp.Body).Decode(&cat); err != nil {
		return nil, err
	}
	return &cat, nil
}

// Función para llamar a todas las calificaciones a través de la API REST
func (c *DummyRestClient) ListCalificaciones(ctx context.Context, pagination *model.Pagination) ([]*model.Calificacion, error) {
	u, _ := url.Parse(c.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/calificacion"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/calificacion"
	}
	q := u.Query()
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var list []*model.Calificacion
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Función para llamar a todos los comentarios a través de la API REST
func (c *DummyRestClient) ListComentarios(ctx context.Context, pagination *model.Pagination) ([]*model.Comentario, error) {
	u, _ := url.Parse(c.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/comentario"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/comentario"
	}
	q := u.Query()
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var list []*model.Comentario
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Función para llamar a todos los pagos a través de la API REST
func (c *DummyRestClient) ListPagos(ctx context.Context, pagination *model.Pagination) ([]*model.Pago, error) {
	u, _ := url.Parse(c.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/pago"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/pago"
	}
	q := u.Query()
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}
	u.RawQuery = q.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var list []*model.Pago
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Función para llamar a un pago específico a través de la API REST
func (c *DummyRestClient) GetPago(ctx context.Context, id string) (*model.Pago, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api_rest/api/v1/pago/%s/", c.BaseURL, id), nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}
	var pago model.Pago
	if err := json.NewDecoder(resp.Body).Decode(&pago); err != nil {
		return nil, err
	}
	return &pago, nil
}

// Funcion para llamar a un servicioUbicacion a través de la API REST
func (c *DummyRestClient) GetServicioUbicacion(ctx context.Context, id string) (*model.ServicioUbicacion, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api_rest/api/v1/servicioUbicacion/%s/", c.BaseURL, id), nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}

	var servicioUb model.ServicioUbicacion
	if err := json.NewDecoder(resp.Body).Decode(&servicioUb); err != nil {
		return nil, err
	}
	return &servicioUb, nil
}

// Función para llamar a todos los servicioUbicaciones a través de la API REST
func (c *DummyRestClient) ListServicioUbicaciones(ctx context.Context, pagination *model.Pagination) ([]*model.ServicioUbicacion, error) {
	u, _ := url.Parse(c.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "/api_rest/api/v1/servicioUbicacion"
	} else {
		u.Path = u.Path + "/api_rest/api/v1/servicioUbicacion"
	}
	q := u.Query()
	if pagination != nil {
		if pagination.Limit != nil {
			q.Set("limit", strconv.Itoa(int(*pagination.Limit)))
		}
		if pagination.Offset != nil {
			q.Set("offset", strconv.Itoa(int(*pagination.Offset)))
		}
	}
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %s", resp.Status)
	}

	var list []*model.ServicioUbicacion
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// Reportes / Métricas para carga de reportes en el Frontend
// =====================================
// Función para llamar al reporte de ventas a través de la API REST
func (c *DummyRestClient) ReporteVentas(ctx context.Context, pagination *model.Pagination) (*model.ReporteVentas, error) {
	// 1️⃣ Traer todas las reservas
	reservas, err := c.ListReservas(ctx, nil, pagination)
	if err != nil {
		return nil, err
	}

	totalVentas := decimal.Zero
	cantidadReservas := int32(len(reservas))

	// Mapa para calcular servicios más vendidos
	serviciosMap := make(map[int32]*model.ServicioVendido)

	for _, r := range reservas {
		// TotalEstimado ya es decimal.Decimal
		totalVentas = totalVentas.Add(r.TotalEstimado)

		for _, detalle := range r.Detalles {
			if detalle == nil || detalle.Servicio == nil {
				continue
			}

			sid := detalle.Servicio.ID
			subtotal := detalle.Subtotal // subtotal ya es decimal.Decimal

			if sv, ok := serviciosMap[sid]; ok {
				sv.CantidadVendida += detalle.Cantidad
				sv.IngresosGenerados = sv.IngresosGenerados.Add(subtotal)
			} else {
				serviciosMap[sid] = &model.ServicioVendido{
					Servicio:          detalle.Servicio,
					CantidadVendida:   detalle.Cantidad,
					IngresosGenerados: subtotal,
				}
			}
		}
	}

	// Promedio por reserva
	promedioPorReserva := decimal.Zero
	if cantidadReservas > 0 {
		promedioPorReserva = totalVentas.Div(decimal.NewFromInt(int64(cantidadReservas)))
	}

	// Convertir el mapa de servicios a slice
	serviciosMasVendidos := make([]*model.ServicioVendido, 0, len(serviciosMap))
	for _, sv := range serviciosMap {
		serviciosMasVendidos = append(serviciosMasVendidos, sv)
	}

	// Ordenar por cantidad vendida (desc)
	sort.Slice(serviciosMasVendidos, func(i, j int) bool {
		return serviciosMasVendidos[i].CantidadVendida > serviciosMasVendidos[j].CantidadVendida
	})

	// 2️⃣ Construir ReporteVentas
	reporte := &model.ReporteVentas{
		Periodo:              "Estimado",
		TotalVentas:          totalVentas,
		CantidadReservas:     cantidadReservas,
		PromedioPorReserva:   promedioPorReserva,
		ServiciosMasVendidos: serviciosMasVendidos,
	}

	return reporte, nil
}

// Función para llamar al reporte de satisfacción a través de la API REST
func (c *DummyRestClient) ReporteSatisfaccion(ctx context.Context, pagination *model.Pagination) ([]*model.ReporteSatisfaccion, error) {
	// 1️⃣ Traer todas las calificaciones
	calificaciones, err := c.ListCalificaciones(ctx, pagination)
	if err != nil {
		return nil, err
	}

	// Mapa para agrupar por servicio (ahora con int32)
	serviciosMap := make(map[int32]*model.ReporteSatisfaccion)

	for _, cal := range calificaciones {
		if cal.Servicio == nil {
			continue
		}

		sid := cal.Servicio.ID // int32

		if rs, ok := serviciosMap[sid]; ok {
			rs.TotalCalificaciones++
			rs.PromedioCalificacion += float64(cal.Puntuacion)

			// Distribución por puntuación
			found := false
			for i := range rs.DistribucionCalificaciones {
				if rs.DistribucionCalificaciones[i].Puntuacion == cal.Puntuacion {
					rs.DistribucionCalificaciones[i].Cantidad++
					found = true
					break
				}
			}
			if !found {
				rs.DistribucionCalificaciones = append(
					rs.DistribucionCalificaciones,
					&model.DistribucionCalificacion{
						Puntuacion: cal.Puntuacion,
						Cantidad:   1,
					},
				)
			}

		} else {
			// Nuevo servicio
			serviciosMap[sid] = &model.ReporteSatisfaccion{
				Servicio:             cal.Servicio,
				TotalCalificaciones:  1,
				PromedioCalificacion: float64(cal.Puntuacion),
				DistribucionCalificaciones: []*model.DistribucionCalificacion{
					{
						Puntuacion: cal.Puntuacion,
						Cantidad:   1,
					},
				},
			}
		}
	}

	// Calcular promedio y porcentajes
	result := make([]*model.ReporteSatisfaccion, 0, len(serviciosMap))
	for _, rs := range serviciosMap {
		if rs.TotalCalificaciones > 0 {
			rs.PromedioCalificacion = rs.PromedioCalificacion / float64(rs.TotalCalificaciones)
		}

		for _, d := range rs.DistribucionCalificaciones {
			d.Porcentaje = (float64(d.Cantidad) / float64(rs.TotalCalificaciones)) * 100
		}

		result = append(result, rs)
	}

	return result, nil
}

// Función para llamar al reporte de proveedores a través de la API REST
func (c *DummyRestClient) ReporteProveedores(ctx context.Context, pagination *model.Pagination) ([]*model.ReporteProveedor, error) {
	// 1️⃣ Traer todos los proveedores
	proveedores, err := c.ListProveedores(ctx, pagination)
	if err != nil {
		return nil, err
	}

	// 2️⃣ Traer todos los servicios y calificaciones
	servicios, err := c.ListServicios(ctx, nil, nil)
	if err != nil {
		return nil, err
	}
	calificaciones, err := c.ListCalificaciones(ctx, nil)
	if err != nil {
		return nil, err
	}

	result := make([]*model.ReporteProveedor, 0, len(proveedores))

	for _, p := range proveedores {
		rp := &model.ReporteProveedor{
			Proveedor:            p,
			TotalServicios:       0,
			IngresosTotales:      decimal.Zero,
			PromedioCalificacion: 0,
			ServiciosActivos:     0,
		}

		var sumaCalificaciones float64
		var totalCalificaciones int

		for _, s := range servicios {
			if s.Proveedor.ID != p.ID {
				continue
			}

			rp.TotalServicios++
			rp.ServiciosActivos++ // ajustar según tu modelo si hay campo "activo"

			// sumar ingresos de todas las reservas usando decimal
			for _, rs := range s.DetallesReserva {
				rp.IngresosTotales = rp.IngresosTotales.Add(rs.Subtotal)
			}

			// calificaciones del servicio
			for _, cal := range calificaciones {
				if cal.Servicio.ID == s.ID {
					sumaCalificaciones += float64(cal.Puntuacion)
					totalCalificaciones++
				}
			}
		}

		if totalCalificaciones > 0 {
			rp.PromedioCalificacion = sumaCalificaciones / float64(totalCalificaciones)
		}

		result = append(result, rp)
	}

	return result, nil
}

// Función para llamar al reporte de clientes a través de la API REST
func (c *DummyRestClient) ReporteClientes(ctx context.Context, pagination *model.Pagination) ([]*model.ReporteCliente, error) {
	clientes, err := c.ListClientes(ctx, pagination)
	if err != nil {
		return nil, err
	}

	reservas, err := c.ListReservas(ctx, nil, nil)
	if err != nil {
		return nil, err
	}

	result := make([]*model.ReporteCliente, 0, len(clientes))
	for _, cl := range clientes {
		rc := &model.ReporteCliente{
			Cliente:            cl,
			TotalReservas:      0,
			GastoTotal:         decimal.Zero,
			PromedioPorReserva: decimal.Zero,
			UltimaReserva:      nil,
		}

		var ultima time.Time

		for _, r := range reservas {
			if r.Cliente.ID != cl.ID {
				continue
			}

			rc.TotalReservas++
			rc.GastoTotal = rc.GastoTotal.Add(r.TotalEstimado) // TotalEstimado es decimal.Decimal

			// r.Fecha ya es time.Time, solo comparamos
			if r.Fecha.After(ultima) {
				ultima = r.Fecha
			}
		}

		if rc.TotalReservas > 0 {
			rc.PromedioPorReserva = rc.GastoTotal.Div(decimal.NewFromInt(int64(rc.TotalReservas)))
			rc.UltimaReserva = &ultima // *time.Time
		}

		result = append(result, rc)
	}

	return result, nil
}

// Función para llamar a las métricas generales a través de la API REST
func (c *DummyRestClient) MetricasGenerales(ctx context.Context, pagination *model.Pagination) (*model.MetricasGenerales, error) {
	// 1️⃣ Traer clientes y proveedores
	clientes, err := c.ListClientes(ctx, pagination)
	if err != nil {
		return nil, err
	}
	proveedores, err := c.ListProveedores(ctx, pagination)
	if err != nil {
		return nil, err
	}

	// 2️⃣ Traer todos los servicios y reservas
	servicios, err := c.ListServicios(ctx, nil, pagination)
	if err != nil {
		return nil, err
	}
	reservas, err := c.ListReservas(ctx, nil, pagination)
	if err != nil {
		return nil, err
	}

	// 3️⃣ Calcular métricas
	ingresosTotales := decimal.Zero
	totalSatisfaccion := decimal.Zero
	totalCalificaciones := int32(0)

	for _, r := range reservas {
		ingresosTotales = ingresosTotales.Add(r.TotalEstimado)

		for _, detalle := range r.Detalles {
			for _, cal := range detalle.Servicio.Calificaciones {
				// sumar puntuación como decimal
				totalSatisfaccion = totalSatisfaccion.Add(
					decimal.NewFromInt32(int32(cal.Puntuacion)),
				)
				totalCalificaciones++
			}
		}
	}

	// promedioDecimal = totalSatisfaccion / totalCalificaciones
	promedioSatisfaccion := decimal.Zero
	if totalCalificaciones > 0 {
		divisor := decimal.NewFromInt32(totalCalificaciones)
		promedioSatisfaccion = totalSatisfaccion.Div(divisor)
	}

	// totalUsuarios = clientes + proveedores (no hay endpoint /user/)
	totalUsuarios := int32(len(clientes)) + int32(len(proveedores))

	metricas := &model.MetricasGenerales{
		TotalUsuarios:        totalUsuarios,
		TotalClientes:        int32(len(clientes)),
		TotalProveedores:     int32(len(proveedores)),
		TotalServicios:       int32(len(servicios)),
		TotalReservas:        int32(len(reservas)),
		IngresosTotales:      ingresosTotales,
		PromedioSatisfaccion: promedioSatisfaccion,
	}

	return metricas, nil
}

// Funciones para reportes específicos
// =====================================
// Funcion para mostrar los servicios más populares
func (c *DummyRestClient) ServiciosMasPopulares(ctx context.Context, limit *int32) ([]*model.ServicioVendido, error) {
	// Traer todas las reservas con sus detalles
	reservas, err := c.ListReservas(ctx, nil, nil)
	if err != nil {
		return nil, err
	}

	type stats struct {
		cantidad int32
		ingresos decimal.Decimal
		servicio *model.Servicio
	}
	servicioMap := make(map[int32]*stats)

	for _, r := range reservas {
		for _, detalle := range r.Detalles {
			if detalle == nil || detalle.Servicio == nil {
				continue
			}
			sID := detalle.Servicio.ID
			if _, ok := servicioMap[sID]; !ok {
				servicioMap[sID] = &stats{
					cantidad: 0,
					ingresos: decimal.Zero,
					servicio: detalle.Servicio,
				}
			}
			servicioMap[sID].cantidad += detalle.Cantidad
			servicioMap[sID].ingresos = servicioMap[sID].ingresos.Add(detalle.Subtotal)
		}
	}

	list := make([]*model.ServicioVendido, 0, len(servicioMap))
	for _, v := range servicioMap {
		list = append(list, &model.ServicioVendido{
			Servicio:          v.servicio,
			CantidadVendida:   v.cantidad,
			IngresosGenerados: v.ingresos,
		})
	}

	// Ordenar por cantidad vendida (desc)
	sort.Slice(list, func(i, j int) bool {
		return list[i].CantidadVendida > list[j].CantidadVendida
	})

	if limit != nil && int(*limit) < len(list) {
		list = list[:*limit]
	}

	return list, nil
}

// Función para obtener los proveedores mejor calificados
func (c *DummyRestClient) ProveedoresMejorCalificados(ctx context.Context, limit *int32) ([]*model.ReporteProveedor, error) {
	// 1️⃣ Traer todos los proveedores
	proveedores, err := c.ListProveedores(ctx, nil)
	if err != nil {
		return nil, err
	}

	// 2️⃣ Inicializar slice de resultados
	result := make([]*model.ReporteProveedor, 0, len(proveedores))

	// 3️⃣ Calcular promedio de calificación, total de servicios, ingresos y servicios activos
	for _, p := range proveedores {
		totalServicios := int32(len(p.Servicios))
		numCalif := 0
		var sumaCalif float64
		ingresosTotales := decimal.Zero
		serviciosActivos := int32(0)

		for _, s := range p.Servicios {
			if s.RatingPromedio > 0 {
				sumaCalif += s.RatingPromedio
				numCalif++
			}
			// Ingresos estimados sumando subtotal de reservas (decimal)
			for _, detalle := range s.DetallesReserva {
				ingresosTotales = ingresosTotales.Add(detalle.Subtotal)
			}
			// Contar servicios activos
			serviciosActivos++
		}

		promedioCalif := 0.0
		if numCalif > 0 {
			promedioCalif = sumaCalif / float64(numCalif)
		}

		result = append(result, &model.ReporteProveedor{
			Proveedor:            p,
			TotalServicios:       totalServicios,
			IngresosTotales:      ingresosTotales,
			PromedioCalificacion: promedioCalif,
			ServiciosActivos:     serviciosActivos,
		})
	}

	// 4️⃣ Ordenar por promedio de calificación descendente
	sort.Slice(result, func(i, j int) bool {
		return result[i].PromedioCalificacion > result[j].PromedioCalificacion
	})

	// 5️⃣ Aplicar el límite si existe
	if limit != nil && int(*limit) < len(result) {
		result = result[:*limit]
	}

	return result, nil
}

// Función para obtener los clientes más activos
func (c *DummyRestClient) ClientesMasActivos(ctx context.Context, limit *int32) ([]*model.ReporteCliente, error) {
	// 1️⃣ Traer todos los clientes
	clientes, err := c.ListClientes(ctx, nil)
	if err != nil {
		return nil, err
	}

	// 2️⃣ Inicializar slice de resultados
	result := make([]*model.ReporteCliente, 0, len(clientes))

	// 3️⃣ Calcular total de reservas, gasto total y promedio por reserva
	for _, cl := range clientes {
		totalReservas := int32(len(cl.Reservas))
		gastoTotal := decimal.Zero
		var ultimaReserva time.Time

		for _, r := range cl.Reservas {
			gastoTotal = gastoTotal.Add(r.TotalEstimado) // TotalEstimado es decimal.Decimal
			if r.Fecha.After(ultimaReserva) {
				ultimaReserva = r.Fecha
			}
		}

		promedioPorReserva := decimal.Zero
		if totalReservas > 0 {
			promedioPorReserva = gastoTotal.Div(decimal.NewFromInt(int64(totalReservas)))
		}

		// Crear un puntero a la fecha
		var ultimaPtr *time.Time
		if !ultimaReserva.IsZero() {
			ultimaPtr = &ultimaReserva
		}

		result = append(result, &model.ReporteCliente{
			Cliente:            cl,
			TotalReservas:      totalReservas,
			GastoTotal:         gastoTotal,
			PromedioPorReserva: promedioPorReserva,
			UltimaReserva:      ultimaPtr,
		})
	}

	// 4️⃣ Ordenar por total de reservas descendente
	sort.Slice(result, func(i, j int) bool {
		return result[i].TotalReservas > result[j].TotalReservas
	})

	// 5️⃣ Aplicar el límite si existe
	if limit != nil && int(*limit) < len(result) {
		result = result[:*limit]
	}

	return result, nil
}

// Funciones para gráficos de tendencias
// =====================================
// Función para obtener las tendencias de ventas
func (c *DummyRestClient) TendenciasVentas(ctx context.Context, filter *model.TendenciasFilter) ([]*model.PuntoTendencia, error) {
	// 1️⃣ Traer reservas
	reservas, err := c.ListReservas(ctx, nil, nil)
	if err != nil {
		return nil, err
	}

	var fechaDesde, fechaHasta time.Time
	if filter != nil {
		if filter.FechaDesde != nil {
			fechaDesde = *filter.FechaDesde
		}
		if filter.FechaHasta != nil {
			fechaHasta = *filter.FechaHasta
		}
	}

	ventasPorFecha := make(map[string]decimal.Decimal)

	for _, r := range reservas {
		if !fechaDesde.IsZero() && r.Fecha.Before(fechaDesde) {
			continue
		}
		if !fechaHasta.IsZero() && r.Fecha.After(fechaHasta) {
			continue
		}

		fechaStr := r.Fecha.Format("2006-01-02")

		// Sumamos usando .Add()
		if v, ok := ventasPorFecha[fechaStr]; ok {
			ventasPorFecha[fechaStr] = v.Add(r.TotalEstimado)
		} else {
			ventasPorFecha[fechaStr] = r.TotalEstimado
		}
	}

	// Ordenar claves (fechas)
	var fechas []string
	for f := range ventasPorFecha {
		fechas = append(fechas, f)
	}
	sort.Strings(fechas)

	// Construir puntos
	tendencias := make([]*model.PuntoTendencia, 0, len(fechas))
	for _, f := range fechas {
		etiqueta := fmt.Sprintf("Ventas del %s", f)

		tendencias = append(tendencias, &model.PuntoTendencia{
			Fecha:    f,
			Valor:    ventasPorFecha[f], // AHORA ES decimal.Decimal
			Etiqueta: &etiqueta,
		})
	}

	return tendencias, nil
}

// Función para obtener las tendencias de satisfacción
func (c *DummyRestClient) TendenciasSatisfaccion(ctx context.Context, filter *model.TendenciasFilter) ([]*model.PuntoTendencia, error) {

	calificaciones, err := c.ListCalificaciones(ctx, nil)
	if err != nil {
		return nil, err
	}

	var fechaDesde, fechaHasta time.Time
	if filter != nil {
		if filter.FechaDesde != nil {
			fechaDesde = *filter.FechaDesde
		}
		if filter.FechaHasta != nil {
			fechaHasta = *filter.FechaHasta
		}
	}

	calificacionesPorFecha := map[string][]int32{}

	for _, c := range calificaciones {
		if !fechaDesde.IsZero() && c.Fecha.Before(fechaDesde) {
			continue
		}
		if !fechaHasta.IsZero() && c.Fecha.After(fechaHasta) {
			continue
		}

		fechaStr := c.Fecha.Format("2006-01-02")
		calificacionesPorFecha[fechaStr] = append(calificacionesPorFecha[fechaStr], c.Puntuacion)
	}

	var fechas []string
	for f := range calificacionesPorFecha {
		fechas = append(fechas, f)
	}
	sort.Strings(fechas)

	tendencias := make([]*model.PuntoTendencia, 0, len(fechas))

	for _, f := range fechas {

		lista := calificacionesPorFecha[f]

		// SUMA CON DECIMAL
		suma := decimal.NewFromInt(0)
		for _, p := range lista {
			suma = suma.Add(decimal.NewFromInt(int64(p)))
		}

		// PROMEDIO = suma / cantidad
		promedio := suma.Div(decimal.NewFromInt(int64(len(lista))))

		etiqueta := fmt.Sprintf("Promedio de satisfacción del %s", f)

		tendencias = append(tendencias, &model.PuntoTendencia{
			Fecha:    f,
			Valor:    promedio, // decimal.Decimal
			Etiqueta: &etiqueta,
		})
	}

	return tendencias, nil
}
