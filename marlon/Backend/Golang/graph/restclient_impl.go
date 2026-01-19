package graph

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"time"

	"github.com/MarlonX-a/5toA_Proyecto_Autonomo_Apps_Ser_web/Golang/graph/model"
	"github.com/shopspring/decimal"
)

// restClientImpl implementa la interfaz RestClient
type restClientImpl struct {
	BaseURL string
}

// Constructor
func NewRestClient(baseURL string) RestClient {
	return &restClientImpl{
		BaseURL: baseURL,
	}
}

// helper: http client with timeout
func (r *restClientImpl) httpClient() *http.Client {
	return &http.Client{Timeout: 10 * time.Second}
}

// authHeaderFromCtx devuelve el header Authorization si el request HTTP original está en el contexto
func authHeaderFromCtx(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if req, ok := ctx.Value("httpRequest").(*http.Request); ok && req != nil {
		return req.Header.Get("Authorization")
	}
	return ""
}

// doWithAuth añade Authorization del contexto si existe y ejecuta la request
func (r *restClientImpl) doWithAuth(ctx context.Context, req *http.Request) (*http.Response, error) {
	if req == nil {
		return nil, fmt.Errorf("nil request")
	}

	// Agregar cabecera Authorization si está en el contexto
	if auth := authHeaderFromCtx(ctx); auth != "" {
		req.Header.Set("Authorization", auth)
	}

	// Crear cliente HTTP y ejecutar la solicitud
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error al ejecutar request: %w", err)
	}

	return resp, nil
}

// helper: build list URL with optional pagination params
func (r *restClientImpl) buildListURL(path string, pagination *model.Pagination) string {
	u, _ := url.Parse(r.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = path
	} else {
		u.Path = u.Path + path
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
	return u.String()
}

// ------------------ ServicioUbicacion ------------------
func (r *restClientImpl) GetServicioUbicacion(ctx context.Context, id string) (*model.ServicioUbicacion, error) {
	url := fmt.Sprintf("%sservicioUbicacion/%s/", r.BaseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", url, resp.StatusCode)
	}
	var su model.ServicioUbicacion
	if err := json.NewDecoder(resp.Body).Decode(&su); err != nil {
		return nil, err
	}
	return &su, nil
}

func (r *restClientImpl) ListServicioUbicaciones(ctx context.Context, pagination *model.Pagination) ([]*model.ServicioUbicacion, error) {
	u := r.buildListURL("servicioUbicacion/", pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u, resp.StatusCode)
	}
	var list []*model.ServicioUbicacion
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// ------------------ Cliente ------------------
func (r *restClientImpl) ListClientes(ctx context.Context, pagination *model.Pagination) ([]*model.Cliente, error) {
	u := r.buildListURL("cliente/", pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u, resp.StatusCode)
	}
	var list []*model.Cliente
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *restClientImpl) GetCliente(ctx context.Context, id string) (*model.Cliente, error) {
	url := fmt.Sprintf("%scliente/%s/", r.BaseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", url, resp.StatusCode)
	}
	var c model.Cliente
	if err := json.NewDecoder(resp.Body).Decode(&c); err != nil {
		return nil, err
	}
	return &c, nil
}

// ------------------ Proveedor ------------------
func (r *restClientImpl) ListProveedores(ctx context.Context, pagination *model.Pagination) ([]*model.Proveedor, error) {
	u := r.buildListURL("proveedor/", pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u, resp.StatusCode)
	}
	var list []*model.Proveedor
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *restClientImpl) GetProveedor(ctx context.Context, id string) (*model.Proveedor, error) {
	url := fmt.Sprintf("%sproveedor/%s/", r.BaseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", url, resp.StatusCode)
	}
	var p model.Proveedor
	if err := json.NewDecoder(resp.Body).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

// ------------------ Servicio ------------------
func (r *restClientImpl) GetServicio(ctx context.Context, id string) (*model.Servicio, error) {
	url := fmt.Sprintf("%sservicio/%s/", r.BaseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", url, resp.StatusCode)
	}
	var s model.Servicio
	if err := json.NewDecoder(resp.Body).Decode(&s); err != nil {
		return nil, err
	}
	return &s, nil
}

// ListServicios with simple filter mapping (categoriaId, proveedorId, ciudad, q, minRating, precioMin, precioMax)
func (r *restClientImpl) ListServicios(ctx context.Context, filter *model.ServicioFilterInput, pagination *model.Pagination) ([]*model.Servicio, error) {
	u, _ := url.Parse(r.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "servicio/"
	} else {
		u.Path = u.Path + "servicio/"
	}
	q := u.Query()
	if filter != nil {
		// Filtro solo_mios para obtener solo los servicios del proveedor autenticado
		if filter.SoloMios != nil && *filter.SoloMios {
			q.Set("solo_mios", "true")
		}
		if filter.CategoriaID != nil {
			q.Set("categoria_id", strconv.Itoa(int(*filter.CategoriaID)))
		}
		if filter.ProveedorID != nil {
			q.Set("proveedor_id", strconv.Itoa(int(*filter.ProveedorID)))
		}
		if filter.Ciudad != nil {
			q.Set("ciudad", *filter.Ciudad)
		}
		if filter.MinRating != nil {
			q.Set("minRating", fmt.Sprintf("%f", *filter.MinRating))
		}
		if filter.PrecioMin != nil {
			q.Set("precioMin", fmt.Sprintf("%f", *filter.PrecioMin))
		}
		if filter.PrecioMax != nil {
			q.Set("precioMax", fmt.Sprintf("%f", *filter.PrecioMax))
		}
		if filter.Q != nil {
			q.Set("q", *filter.Q)
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
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u.String(), resp.StatusCode)
	}
	var list []*model.Servicio
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// ------------------ Reserva ------------------
func (r *restClientImpl) ListReservas(ctx context.Context, filter *model.ReservaFilterInput, pagination *model.Pagination) ([]*model.Reserva, error) {
	u, _ := url.Parse(r.BaseURL)
	if u.Path == "/" || u.Path == "" {
		u.Path = "reserva/"
	} else {
		u.Path = u.Path + "reserva/"
	}
	q := u.Query()
	if filter != nil {
		if filter.ClienteID != nil {
			q.Set("cliente_id", strconv.Itoa(int(*filter.ClienteID)))
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
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u.String(), resp.StatusCode)
	}
	var list []*model.Reserva
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *restClientImpl) GetReserva(ctx context.Context, id string) (*model.Reserva, error) {
	url := fmt.Sprintf("%sreserva/%s/", r.BaseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", url, resp.StatusCode)
	}
	var rs model.Reserva
	if err := json.NewDecoder(resp.Body).Decode(&rs); err != nil {
		return nil, err
	}
	return &rs, nil
}

// ------------------ Pagos ------------------
func (r *restClientImpl) ListPagos(ctx context.Context, pagination *model.Pagination) ([]*model.Pago, error) {
	u := r.buildListURL("pago/", pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u, resp.StatusCode)
	}
	var list []*model.Pago
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *restClientImpl) GetPago(ctx context.Context, id string) (*model.Pago, error) {
	url := fmt.Sprintf("%spago/%s/", r.BaseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", url, resp.StatusCode)
	}
	var p model.Pago
	if err := json.NewDecoder(resp.Body).Decode(&p); err != nil {
		return nil, err
	}
	return &p, nil
}

// ------------------ ReservaServicio ------------------
func (r *restClientImpl) ListReservaServicios(ctx context.Context, pagination *model.Pagination) ([]*model.ReservaServicio, error) {
	u := r.buildListURL("reservaServicio/", pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u, resp.StatusCode)
	}
	// Read body once; handle both bare list and paginated {results: []}
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	// Decode into raw messages to handle mixed shapes and snake_case
	var rawList []map[string]json.RawMessage
	if err := json.Unmarshal(body, &rawList); err != nil {
		var wrapper struct {
			Results []map[string]json.RawMessage `json:"results"`
		}
		if err2 := json.Unmarshal(body, &wrapper); err2 != nil {
			return nil, err
		}
		rawList = wrapper.Results
	}

	out := make([]*model.ReservaServicio, 0, len(rawList))
	for _, item := range rawList {
		var rs model.ReservaServicio

		if v, ok := item["id"]; ok {
			if err := json.Unmarshal(v, &rs.ID); err != nil {
				var sidStr string
				if err2 := json.Unmarshal(v, &sidStr); err2 == nil {
					if n, e := strconv.Atoi(sidStr); e == nil {
						rs.ID = int32(n)
					}
				}
			}
		}
		if v, ok := item["cantidad"]; ok {
			if err := json.Unmarshal(v, &rs.Cantidad); err != nil {
				var s string
				if err2 := json.Unmarshal(v, &s); err2 == nil {
					if n, e := strconv.Atoi(s); e == nil {
						rs.Cantidad = int32(n)
					}
				}
			}
		}
		// precio_unitario or precioUnitario
		if v, ok := item["precio_unitario"]; ok {
			_ = json.Unmarshal(v, &rs.PrecioUnitario)
		} else if v, ok := item["precioUnitario"]; ok {
			_ = json.Unmarshal(v, &rs.PrecioUnitario)
		}
		// subtotal
		if v, ok := item["subtotal"]; ok {
			_ = json.Unmarshal(v, &rs.Subtotal)
		}
		// servicio: can be object or id
		if v, ok := item["servicio"]; ok {
			// try object first
			var svcObj map[string]json.RawMessage
			if err := json.Unmarshal(v, &svcObj); err == nil && len(svcObj) > 0 {
				var svc model.Servicio
				// basic fields
				if idRaw, ok := svcObj["id"]; ok {
					_ = json.Unmarshal(idRaw, &svc.ID)
				}
				if nRaw, ok := svcObj["nombreServicio"]; ok {
					_ = json.Unmarshal(nRaw, &svc.NombreServicio)
				} else if nRaw, ok := svcObj["nombre_servicio"]; ok {
					_ = json.Unmarshal(nRaw, &svc.NombreServicio)
				}
				if pRaw, ok := svcObj["precio"]; ok {
					_ = json.Unmarshal(pRaw, &svc.Precio)
				}
				rs.Servicio = &svc
			} else {
				// maybe it's an id
				var sid int32
				if err := json.Unmarshal(v, &sid); err == nil {
					// lazy fetch
					svc, err := r.GetServicio(ctx, strconv.Itoa(int(sid)))
					if err == nil {
						rs.Servicio = svc
					} else {
						// at least set an empty with id
						rs.Servicio = &model.Servicio{ID: sid}
					}
				} else {
					var sidStr string
					if err2 := json.Unmarshal(v, &sidStr); err2 == nil {
						if n, e := strconv.Atoi(sidStr); e == nil {
							sid = int32(n)
							svc, err := r.GetServicio(ctx, strconv.Itoa(int(sid)))
							if err == nil {
								rs.Servicio = svc
							} else {
								rs.Servicio = &model.Servicio{ID: sid}
							}
						}
					}
				}
			}
		} else if v, ok := item["servicio_id"]; ok { // alternative key
			var sid int32
			if err := json.Unmarshal(v, &sid); err == nil {
				svc, err := r.GetServicio(ctx, strconv.Itoa(int(sid)))
				if err == nil {
					rs.Servicio = svc
				} else {
					rs.Servicio = &model.Servicio{ID: sid}
				}
			} else {
				var sidStr string
				if err2 := json.Unmarshal(v, &sidStr); err2 == nil {
					if n, e := strconv.Atoi(sidStr); e == nil {
						sid = int32(n)
						svc, err := r.GetServicio(ctx, strconv.Itoa(int(sid)))
						if err == nil {
							rs.Servicio = svc
						} else {
							rs.Servicio = &model.Servicio{ID: sid}
						}
					}
				}
			}
		}

		out = append(out, &rs)
	}
	return out, nil
}

// ------------------ Ubicacion ------------------
func (r *restClientImpl) GetUbicacion(ctx context.Context, id string) (*model.Ubicacion, error) {
	url := fmt.Sprintf("%subicacion/%s/", r.BaseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", url, resp.StatusCode)
	}
	var ubicacion model.Ubicacion
	if err := json.NewDecoder(resp.Body).Decode(&ubicacion); err != nil {
		return nil, err
	}
	return &ubicacion, nil
}

func (r *restClientImpl) ListUbicaciones(ctx context.Context, pagination *model.Pagination) ([]*model.Ubicacion, error) {
	u := r.buildListURL("/ubicacion/", pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u, resp.StatusCode)
	}
	var list []*model.Ubicacion
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// ------------------ Categoria ------------------
func (r *restClientImpl) ListCategorias(ctx context.Context, pagination *model.Pagination) ([]*model.Categoria, error) {
	u := r.buildListURL("categoria/", pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u, resp.StatusCode)
	}
	var list []*model.Categoria
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

func (r *restClientImpl) GetCategoria(ctx context.Context, id string) (*model.Categoria, error) {
	url := fmt.Sprintf("%scategoria/%s/", r.BaseURL, id)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", url, resp.StatusCode)
	}
	var c model.Categoria
	if err := json.NewDecoder(resp.Body).Decode(&c); err != nil {
		return nil, err
	}
	return &c, nil
}

// ------------------ Comentario ------------------
func (r *restClientImpl) ListComentarios(ctx context.Context, pagination *model.Pagination) ([]*model.Comentario, error) {
	u := r.buildListURL("comentario/", pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u, resp.StatusCode)
	}
	var list []*model.Comentario
	if err := json.NewDecoder(resp.Body).Decode(&list); err != nil {
		return nil, err
	}
	return list, nil
}

// ------------------ Calificacion ------------------
func (r *restClientImpl) ListCalificaciones(ctx context.Context, pagination *model.Pagination) ([]*model.Calificacion, error) {
	u := r.buildListURL("calificacion/", pagination)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u, nil)
	if err != nil {
		return nil, err
	}
	resp, err := r.doWithAuth(ctx, req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("error GET %s: status %d", u, resp.StatusCode)
	}

	// Leer body una vez para manejar ambos formatos
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var list []*model.Calificacion
	// Intentar decodificar como array directo
	if err := json.Unmarshal(body, &list); err != nil {
		// Si falla, intentar formato paginado {results: [...]}
		var wrapper struct {
			Results []*model.Calificacion `json:"results"`
		}
		if err2 := json.Unmarshal(body, &wrapper); err2 != nil {
			return nil, err
		}
		list = wrapper.Results
	}
	return list, nil
}

// ------------------ Reportes Generales ------------------
// ReporteVentas genera un reporte de ventas basado en las reservas, esto sin llamar a un endpoint específico en Django sino con la misma data de reservas
func (r *restClientImpl) ReporteVentas(ctx context.Context, pagination *model.Pagination) (*model.ReporteVentas, error) {
	// 1️⃣ Traer todas las reservas desde Django
	reservas, err := r.ListReservas(ctx, nil, pagination)
	if err != nil {
		// Retornar estructura vacía en lugar de nil
		return &model.ReporteVentas{
			Periodo:              "Sin datos",
			TotalVentas:          decimal.Zero,
			CantidadReservas:     0,
			PromedioPorReserva:   decimal.Zero,
			ServiciosMasVendidos: []*model.ServicioVendido{},
		}, nil
	}

	totalVentas := decimal.NewFromInt(0)
	cantidadReservas := int32(len(reservas))

	// Mapa para calcular servicios más vendidos
	serviciosMap := make(map[int32]*model.ServicioVendido)

	for _, res := range reservas {

		// TotalEstimado: decimal.Decimal → suma
		totalVentas = totalVentas.Add(res.TotalEstimado)

		for _, detalle := range res.Detalles {
			sid := detalle.Servicio.ID

			if _, ok := serviciosMap[sid]; !ok {
				serviciosMap[sid] = &model.ServicioVendido{
					Servicio:          detalle.Servicio,
					CantidadVendida:   detalle.Cantidad,
					IngresosGenerados: detalle.Subtotal,
				}
			} else {
				serviciosMap[sid].CantidadVendida += detalle.Cantidad
				serviciosMap[sid].IngresosGenerados = serviciosMap[sid].IngresosGenerados.Add(detalle.Subtotal)
			}
		}
	}

	// Fallback: si no hay detalles en reservas, usar lista de reservaServicio
	if len(serviciosMap) == 0 {
		rsList, err := r.ListReservaServicios(ctx, nil)
		if err == nil {
			for _, rs := range rsList {
				if rs == nil || rs.Servicio == nil {
					continue
				}
				sid := rs.Servicio.ID
				if _, ok := serviciosMap[sid]; !ok {
					serviciosMap[sid] = &model.ServicioVendido{
						Servicio:          rs.Servicio,
						CantidadVendida:   0,
						IngresosGenerados: decimal.Zero,
					}
				}
				qty := rs.Cantidad
				if qty <= 0 {
					qty = 1
				}
				serviciosMap[sid].CantidadVendida += qty
				ingreso := rs.Subtotal
				if ingreso.Equal(decimal.Zero) {
					if !rs.PrecioUnitario.Equal(decimal.Zero) && qty > 0 {
						ingreso = rs.PrecioUnitario.Mul(decimal.NewFromInt32(qty))
					} else if rs.Servicio != nil && !rs.Servicio.Precio.Equal(decimal.Zero) && qty > 0 {
						ingreso = rs.Servicio.Precio.Mul(decimal.NewFromInt32(qty))
					}
				}
				serviciosMap[sid].IngresosGenerados = serviciosMap[sid].IngresosGenerados.Add(ingreso)
			}
			// Backfill datos del servicio si faltan
			cache := make(map[int32]*model.Servicio)
			for _, sv := range serviciosMap {
				if sv.Servicio == nil {
					continue
				}
				sid := sv.Servicio.ID
				needs := sv.Servicio.NombreServicio == "" || sv.Servicio.Precio.Equal(decimal.Zero)
				if needs {
					if cached, ok := cache[sid]; ok {
						sv.Servicio = cached
					} else {
						svc, err := r.GetServicio(ctx, strconv.Itoa(int(sid)))
						if err == nil && svc != nil {
							cache[sid] = svc
							sv.Servicio = svc
						}
					}
				}
			}
		}
	}

	// Promedio por reserva
	promedioPorReserva := decimal.NewFromInt(0)
	if cantidadReservas > 0 {
		promedioPorReserva = totalVentas.Div(decimal.NewFromInt(int64(cantidadReservas)))
	}

	// Convertir mapa a slice
	serviciosMasVendidos := make([]*model.ServicioVendido, 0, len(serviciosMap))
	for _, sv := range serviciosMap {
		serviciosMasVendidos = append(serviciosMasVendidos, sv)
	}

	// Ordenar por cantidad vendida
	sort.Slice(serviciosMasVendidos, func(i, j int) bool {
		return serviciosMasVendidos[i].CantidadVendida > serviciosMasVendidos[j].CantidadVendida
	})

	// Respuesta final
	reporte := &model.ReporteVentas{
		Periodo:              "Estimado",
		TotalVentas:          totalVentas,
		CantidadReservas:     cantidadReservas,
		PromedioPorReserva:   promedioPorReserva,
		ServiciosMasVendidos: serviciosMasVendidos,
	}

	return reporte, nil
}

// ReporteSatisfaccion genera un reporte de satisfacción basado en las calificaciones de los servicios, sin llamar a un endpoint específico en Django sino con la misma data de calificaciones
func (r *restClientImpl) ReporteSatisfaccion(ctx context.Context, pagination *model.Pagination) ([]*model.ReporteSatisfaccion, error) {

	// 1️⃣ Traer todas las calificaciones
	calificaciones, err := r.ListCalificaciones(ctx, pagination)
	if err != nil {
		log.Printf("Error getting calificaciones: %v", err)
		// Retornar slice vacío en lugar de nil
		return []*model.ReporteSatisfaccion{}, nil
	}

	log.Printf("ReporteSatisfaccion: recibidas %d calificaciones", len(calificaciones))

	// Mapa para agrupar por servicio
	serviciosMap := make(map[int32]*model.ReporteSatisfaccion)
	servicioCache := make(map[int32]*model.Servicio)

	for _, cal := range calificaciones {
		if cal == nil || cal.Servicio == nil {
			continue
		}

		sid := cal.Servicio.ID // int32

		// Backfill servicio si faltan datos
		if cal.Servicio.NombreServicio == "" {
			if cached, ok := servicioCache[sid]; ok {
				cal.Servicio = cached
			} else {
				svc, err := r.GetServicio(ctx, strconv.Itoa(int(sid)))
				if err == nil && svc != nil {
					servicioCache[sid] = svc
					cal.Servicio = svc
				}
			}
		}

		if rs, ok := serviciosMap[sid]; ok {

			rs.TotalCalificaciones++

			// Convertimos Puntuacion (int32) a float64
			rs.PromedioCalificacion += float64(cal.Puntuacion)

			// Buscar si ya existe la puntuación en la distribución
			found := false
			for _, d := range rs.DistribucionCalificaciones {
				if d.Puntuacion == cal.Puntuacion {
					d.Cantidad++
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

	// 2️⃣ Calcular el promedio y el porcentaje
	result := make([]*model.ReporteSatisfaccion, 0, len(serviciosMap))

	for _, rs := range serviciosMap {

		// Promedio
		if rs.TotalCalificaciones > 0 {
			rs.PromedioCalificacion /= float64(rs.TotalCalificaciones)
		}

		// Porcentaje por puntuación
		for _, d := range rs.DistribucionCalificaciones {
			d.Porcentaje = (float64(d.Cantidad) / float64(rs.TotalCalificaciones)) * 100
		}

		result = append(result, rs)
	}

	return result, nil
}

// ReporteProveedores genera un reporte detallado por proveedor basado en sus servicios, reservas y calificaciones, sin llamar a un endpoint específico en Django sino con la misma data de proveedores, servicios y calificaciones
func (r *restClientImpl) ReporteProveedores(ctx context.Context, pagination *model.Pagination) ([]*model.ReporteProveedor, error) {

	proveedores, err := r.ListProveedores(ctx, pagination)
	if err != nil {
		proveedores = []*model.Proveedor{}
	}

	servicios, err := r.ListServicios(ctx, nil, nil)
	if err != nil {
		servicios = []*model.Servicio{}
	}

	calificaciones, err := r.ListCalificaciones(ctx, nil)
	if err != nil {
		calificaciones = []*model.Calificacion{}
	}

	// Preindexar calificaciones por servicio
	calPorServicio := make(map[int][]*model.Calificacion)
	for _, cal := range calificaciones {
		sid := int(cal.Servicio.ID)
		calPorServicio[sid] = append(calPorServicio[sid], cal)
	}

	// Preindexar servicios por proveedor
	servPorProveedor := make(map[int][]*model.Servicio)
	for _, s := range servicios {
		pid := int(s.Proveedor.ID)
		servPorProveedor[pid] = append(servPorProveedor[pid], s)
	}

	// Obtener reservaServicio para calcular ingresos
	reservaServicios, err := r.ListReservaServicios(ctx, nil)
	if err != nil {
		reservaServicios = []*model.ReservaServicio{}
	}

	// Indexar reservaServicios por servicio para calcular ingresos
	ingresosPorServicio := make(map[int]decimal.Decimal)
	for _, rs := range reservaServicios {
		if rs.Servicio == nil {
			continue
		}
		sid := int(rs.Servicio.ID)

		// Calcular ingreso de este reservaServicio
		var ingreso decimal.Decimal
		if !rs.Subtotal.IsZero() {
			ingreso = rs.Subtotal
		} else {
			qty := rs.Cantidad
			if qty == 0 {
				qty = 1
			}
			if !rs.PrecioUnitario.IsZero() {
				ingreso = rs.PrecioUnitario.Mul(decimal.NewFromInt32(qty))
			} else if rs.Servicio != nil && !rs.Servicio.Precio.IsZero() {
				ingreso = rs.Servicio.Precio.Mul(decimal.NewFromInt32(qty))
			}
		}

		ingresosPorServicio[sid] = ingresosPorServicio[sid].Add(ingreso)
	}

	// Construir reporte
	result := make([]*model.ReporteProveedor, 0, len(proveedores))

	for _, p := range proveedores {
		servs := servPorProveedor[int(p.ID)]

		rp := &model.ReporteProveedor{
			Proveedor:            p,
			TotalServicios:       int32(len(servs)),
			IngresosTotales:      decimal.Zero,
			PromedioCalificacion: 0,
			ServiciosActivos:     0,
		}

		var sumaCal float64
		var totalCal int

		for _, s := range servs {
			// Contar como activo (ajusta si tienes campo Activo)
			rp.ServiciosActivos += 1

			// Sumar ingresos desde el mapa calculado de reservaServicios
			if ingreso, ok := ingresosPorServicio[int(s.ID)]; ok {
				rp.IngresosTotales = rp.IngresosTotales.Add(ingreso)
			}

			// Sumar calificaciones del servicio
			for _, cal := range calPorServicio[int(s.ID)] {
				sumaCal += float64(cal.Puntuacion)
				totalCal++
			}
		}

		if totalCal > 0 {
			rp.PromedioCalificacion = sumaCal / float64(totalCal)
		}

		result = append(result, rp)
	}

	return result, nil
}

// ReporteClientes genera un reporte detallado por cliente basado en sus reservas y gastos, sin llamar a un endpoint específico en Django sino con la misma data de clientes y reservas
func (r *restClientImpl) ReporteClientes(ctx context.Context, pagination *model.Pagination) ([]*model.ReporteCliente, error) {
	// 1️⃣ Traer clientes
	clientes, err := r.ListClientes(ctx, pagination)
	if err != nil {
		clientes = []*model.Cliente{}
	}

	// 2️⃣ Traer reservas
	reservas, err := r.ListReservas(ctx, nil, nil)
	if err != nil {
		reservas = []*model.Reserva{}
	}

	result := make([]*model.ReporteCliente, 0, len(clientes))

	for _, cl := range clientes {
		rc := &model.ReporteCliente{
			Cliente:            cl,
			TotalReservas:      0,
			GastoTotal:         decimal.Zero,
			PromedioPorReserva: decimal.Zero,
			UltimaReserva:      nil, // es *time.Time
		}

		var ultima time.Time
		totalReservas := int32(0)

		for _, r := range reservas {
			if r.Cliente.ID != cl.ID {
				continue
			}

			totalReservas++
			rc.GastoTotal = rc.GastoTotal.Add(r.TotalEstimado)

			// r.Fecha debe ser time.Time
			fechaReserva := r.Fecha

			if fechaReserva.After(ultima) {
				ultima = fechaReserva
			}
		}

		rc.TotalReservas = totalReservas

		if totalReservas > 0 {
			// Promedio
			divisor := decimal.NewFromInt32(totalReservas)
			rc.PromedioPorReserva = rc.GastoTotal.Div(divisor)

			// Asignar puntero
			rc.UltimaReserva = &ultima
		}

		result = append(result, rc)
	}

	return result, nil
}

// MetricasGenerales genera métricas generales del sistema basado en usuarios, proveedores, servicios y reservas, sin llamar a un endpoint específico en Django sino con la misma data de usuarios, proveedores, servicios y reservas
func (r *restClientImpl) MetricasGenerales(ctx context.Context, pagination *model.Pagination) (*model.MetricasGenerales, error) {

	// 1️⃣ Clientes y proveedores (no hay endpoint de usuarios)
	// Si hay error, usar valores vacíos en lugar de retornar nil
	clientes, err := r.ListClientes(ctx, nil)
	if err != nil {
		clientes = []*model.Cliente{}
	}

	proveedores, err := r.ListProveedores(ctx, nil)
	if err != nil {
		proveedores = []*model.Proveedor{}
	}

	// 2️⃣ Servicios y reservas
	servicios, err := r.ListServicios(ctx, nil, nil)
	if err != nil {
		servicios = []*model.Servicio{}
	}

	reservas, err := r.ListReservas(ctx, nil, nil)
	if err != nil {
		reservas = []*model.Reserva{}
	}

	// 3️⃣ Variables para acumulación
	ingresosTotales := decimal.Zero
	totalSatisfaccion := decimal.Zero
	totalCalificaciones := int32(0)

	// Recorrer todas las reservas
	for _, res := range reservas {

		// TotalEstimado es decimal.Decimal → perfecto
		ingresosTotales = ingresosTotales.Add(res.TotalEstimado)

		// Detalles
		for _, det := range res.Detalles {

			if det.Servicio == nil {
				continue
			}

			// Calificaciones del servicio
			for _, cal := range det.Servicio.Calificaciones {
				totalSatisfaccion = totalSatisfaccion.Add(
					decimal.NewFromInt32(cal.Puntuacion),
				)
				totalCalificaciones++
			}
		}
	}

	// promedio de satisfacción
	promedioSatisfaccion := decimal.Zero
	if totalCalificaciones > 0 {
		divisor := decimal.NewFromInt32(totalCalificaciones)
		promedioSatisfaccion = totalSatisfaccion.Div(divisor)
	}

	// 4️⃣ Construcción final
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

// ------------------ Reportes específicos ------------------
// ServiciosMasPopulares genera un reporte de los servicios más populares basado en la cantidad vendida y los ingresos generados, sin llamar a un endpoint específico en Django sino con la misma data de reservas
func (r *restClientImpl) ServiciosMasPopulares(ctx context.Context, limit *int32) ([]*model.ServicioVendido, error) {
	// 1️⃣ Traer todos los servicios con sus detalles de reserva
	servicios, err := r.ListServicios(ctx, nil, nil)
	if err != nil {
		servicios = []*model.Servicio{}
	}

	// 2️⃣ Contar cantidad vendida y sumar ingresos desde DetallesReserva
	type stats struct {
		cantidad int32
		ingresos decimal.Decimal
		servicio *model.Servicio
	}

	servicioMap := make(map[int32]*stats)

	for _, s := range servicios {
		if s == nil {
			continue
		}
		for _, det := range s.DetallesReserva {
			if det == nil {
				continue
			}
			sid := s.ID
			if _, ok := servicioMap[sid]; !ok {
				servicioMap[sid] = &stats{
					cantidad: 0,
					ingresos: decimal.Zero,
					servicio: s,
				}
			}
			servicioMap[sid].cantidad += det.Cantidad
			servicioMap[sid].ingresos = servicioMap[sid].ingresos.Add(det.Subtotal)
		}
	}

	// 2b️⃣ Calcular agregación completa desde reservaServicio/ y luego fusionar
	rsList, err := r.ListReservaServicios(ctx, nil)
	if err == nil {
		type rsStats struct {
			cantidad int32
			ingresos decimal.Decimal
			servicio *model.Servicio
		}
		rsAgg := make(map[int32]*rsStats)
		for _, rs := range rsList {
			if rs == nil || rs.Servicio == nil {
				continue
			}
			sid := rs.Servicio.ID
			if _, ok := rsAgg[sid]; !ok {
				rsAgg[sid] = &rsStats{cantidad: 0, ingresos: decimal.Zero, servicio: rs.Servicio}
			} else if rsAgg[sid].servicio != nil && rsAgg[sid].servicio.NombreServicio == "" {
				rsAgg[sid].servicio = rs.Servicio
			}

			// cantidad por defecto: si no existe o es 0, contar 1
			qty := rs.Cantidad
			if qty <= 0 {
				qty = 1
			}
			rsAgg[sid].cantidad += qty
			ingreso := rs.Subtotal
			if ingreso.Equal(decimal.Zero) {
				if !rs.PrecioUnitario.Equal(decimal.Zero) && qty > 0 {
					ingreso = rs.PrecioUnitario.Mul(decimal.NewFromInt32(qty))
				} else if rs.Servicio != nil && !rs.Servicio.Precio.Equal(decimal.Zero) && qty > 0 {
					ingreso = rs.Servicio.Precio.Mul(decimal.NewFromInt32(qty))
				}
			}
			rsAgg[sid].ingresos = rsAgg[sid].ingresos.Add(ingreso)
		}

		// Fusionar: si ya hay métricas de DetallesReserva, priorizarlas y solo usar rsAgg para completar
		for sid, st := range rsAgg {
			if current, ok := servicioMap[sid]; ok {
				if current.cantidad == 0 && current.ingresos.Equal(decimal.Zero) {
					current.cantidad = st.cantidad
					current.ingresos = st.ingresos
				}
				if (current.servicio == nil || current.servicio.NombreServicio == "") && st.servicio != nil {
					current.servicio = st.servicio
				}
			} else {
				servicioMap[sid] = &stats{cantidad: st.cantidad, ingresos: st.ingresos, servicio: st.servicio}
			}
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

	// Backfill: asegurar que cada servicio tenga nombre/precio completos
	// Evita que el front muestre celdas vacías si el serializer no incluyó campos
	cache := make(map[int32]*model.Servicio)
	for _, it := range list {
		if it.Servicio == nil {
			continue
		}
		sid := it.Servicio.ID
		needsFetch := it.Servicio.NombreServicio == "" || it.Servicio.Precio.Equal(decimal.Zero)
		if needsFetch {
			if cached, ok := cache[sid]; ok {
				it.Servicio = cached
				continue
			}
			svc, err := r.GetServicio(ctx, strconv.Itoa(int(sid)))
			if err == nil && svc != nil {
				cache[sid] = svc
				it.Servicio = svc
			}
		}
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

// ProveedoresMejorCalificados genera un reporte de los proveedores mejor calificados basado en el promedio de calificaciones de sus servicios, sin llamar a un endpoint específico en Django sino con la misma data de proveedores y servicios
func (r *restClientImpl) ProveedoresMejorCalificados(ctx context.Context, limit *int32) ([]*model.ReporteProveedor, error) {
	// 1️⃣ Traer proveedores, servicios y calificaciones
	proveedores, err := r.ListProveedores(ctx, nil)
	if err != nil {
		proveedores = []*model.Proveedor{}
	}

	servicios, err := r.ListServicios(ctx, nil, nil)
	if err != nil {
		servicios = []*model.Servicio{}
	}

	calificaciones, err := r.ListCalificaciones(ctx, nil)
	if err != nil {
		calificaciones = []*model.Calificacion{}
	}

	// 2️⃣ Índices auxiliares
	// calificaciones por servicio
	calPorServicio := make(map[int][]*model.Calificacion)
	for _, cal := range calificaciones {
		sid := int(cal.Servicio.ID)
		calPorServicio[sid] = append(calPorServicio[sid], cal)
	}

	// servicios por proveedor y mapa de servicio
	servPorProveedor := make(map[int][]*model.Servicio)
	servicioIndex := make(map[int32]*model.Servicio)
	for _, s := range servicios {
		servicioIndex[s.ID] = s
		if s.Proveedor != nil {
			pid := int(s.Proveedor.ID)
			servPorProveedor[pid] = append(servPorProveedor[pid], s)
		}
	}

	// 3️⃣ Ingresos por proveedor desde reservaServicio (fallback si detallesReserva está vacío)
	ingresosPorProveedor := make(map[int32]decimal.Decimal)
	rsList, err := r.ListReservaServicios(ctx, nil)
	if err == nil {
		for _, rs := range rsList {
			if rs == nil || rs.Servicio == nil {
				continue
			}
			// Resolver proveedor ID
			var pid int32
			if rs.Servicio.Proveedor != nil {
				pid = rs.Servicio.Proveedor.ID
			} else if s, ok := servicioIndex[rs.Servicio.ID]; ok && s.Proveedor != nil {
				pid = s.Proveedor.ID
			} else {
				// Intento de backfill
				if svc, e := r.GetServicio(ctx, strconv.Itoa(int(rs.Servicio.ID))); e == nil && svc != nil && svc.Proveedor != nil {
					pid = svc.Proveedor.ID
				} else {
					continue
				}
			}

			// Cantidad por defecto 1 si no existe
			qty := rs.Cantidad
			if qty <= 0 {
				qty = 1
			}
			ingreso := rs.Subtotal
			if ingreso.Equal(decimal.Zero) {
				if !rs.PrecioUnitario.Equal(decimal.Zero) && qty > 0 {
					ingreso = rs.PrecioUnitario.Mul(decimal.NewFromInt32(qty))
				} else if s, ok := servicioIndex[rs.Servicio.ID]; ok && !s.Precio.Equal(decimal.Zero) && qty > 0 {
					ingreso = s.Precio.Mul(decimal.NewFromInt32(qty))
				}
			}
			ingresosPorProveedor[pid] = ingresosPorProveedor[pid].Add(ingreso)
		}
	}

	// 4️⃣ Construir resultados
	result := make([]*model.ReporteProveedor, 0, len(proveedores))

	for _, p := range proveedores {
		pid := int(p.ID)
		servs := servPorProveedor[pid]

		// Total y activos por servicios indexados
		totalServicios := int32(len(servs))
		serviciosActivos := int32(len(servs))

		// Ingresos: primero intentar sumar a partir de detallesReserva; si queda en cero, usar fallback de ingresosPorProveedor
		ingresosTotales := decimal.Zero
		for _, s := range servs {
			for _, det := range s.DetallesReserva {
				ingresosTotales = ingresosTotales.Add(det.Subtotal)
			}
		}
		if ingresosTotales.Equal(decimal.Zero) {
			ingresosTotales = ingresosPorProveedor[p.ID]
		}

		// Promedio de calificación basado en calificaciones reales
		var suma float64
		var n int
		for _, s := range servs {
			for _, cal := range calPorServicio[int(s.ID)] {
				suma += float64(cal.Puntuacion)
				n++
			}
		}
		promedio := 0.0
		if n > 0 {
			promedio = suma / float64(n)
		}

		result = append(result, &model.ReporteProveedor{
			Proveedor:            p,
			TotalServicios:       totalServicios,
			IngresosTotales:      ingresosTotales,
			PromedioCalificacion: promedio,
			ServiciosActivos:     serviciosActivos,
		})
	}

	// 5️⃣ Ordenar por calificación descendente
	sort.Slice(result, func(i, j int) bool {
		return result[i].PromedioCalificacion > result[j].PromedioCalificacion
	})

	// 6️⃣ Límite
	if limit != nil && int(*limit) < len(result) {
		result = result[:int(*limit)]
	}

	return result, nil
}

// ClientesMasActivos genera un reporte de los clientes más activos basado en la cantidad de reservas y gasto total, sin llamar a un endpoint específico en Django sino con la misma data de clientes y reservas
func (r *restClientImpl) ClientesMasActivos(ctx context.Context, limit *int32) ([]*model.ReporteCliente, error) {
	// Construir reporte como en ReporteClientes pero ordenado por actividad
	clientes, err := r.ListClientes(ctx, nil)
	if err != nil {
		clientes = []*model.Cliente{}
	}

	reservas, err := r.ListReservas(ctx, nil, nil)
	if err != nil {
		reservas = []*model.Reserva{}
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
		var total int32

		for _, rsv := range reservas {
			if rsv.Cliente == nil || rsv.Cliente.ID != cl.ID {
				continue
			}
			total++
			rc.GastoTotal = rc.GastoTotal.Add(rsv.TotalEstimado)
			if rsv.Fecha.After(ultima) {
				ultima = rsv.Fecha
			}
		}

		rc.TotalReservas = total
		if total > 0 {
			rc.PromedioPorReserva = rc.GastoTotal.Div(decimal.NewFromInt32(total))
			rc.UltimaReserva = &ultima
		}

		result = append(result, rc)
	}

	// Ordenar por TotalReservas desc, luego por GastoTotal desc
	sort.Slice(result, func(i, j int) bool {
		if result[i].TotalReservas == result[j].TotalReservas {
			return result[i].GastoTotal.GreaterThan(result[j].GastoTotal)
		}
		return result[i].TotalReservas > result[j].TotalReservas
	})

	if limit != nil && int(*limit) < len(result) {
		result = result[:int(*limit)]
	}

	return result, nil
}

// ------------------ Tendencias ------------------
// TendenciasVentas genera puntos de tendencia de ventas basado en las reservas, sin llamar a un endpoint específico en Django sino con la misma data de reservas
func (r *restClientImpl) TendenciasVentas(ctx context.Context, filter *model.TendenciasFilter, pagination *model.Pagination) ([]*model.PuntoTendencia, error) {
	// 1️⃣ Traer reservas
	reservas, err := r.ListReservas(ctx, nil, nil)
	if err != nil {
		return nil, err
	}

	// 2️⃣ Parseo de fechas desde el filtro (Date en GraphQL llega como string)
	var fechaDesde, fechaHasta time.Time

	if filter != nil {
		if filter.FechaDesde != nil {
			fechaDesde = *filter.FechaDesde
		}
		if filter.FechaHasta != nil {
			fechaHasta = *filter.FechaHasta
		}
	}

	// 3️⃣ Map de ventas por fecha usando DECIMAL
	ventasPorFecha := make(map[string]decimal.Decimal)

	for _, res := range reservas {

		if !fechaDesde.IsZero() && res.Fecha.Before(fechaDesde) {
			continue
		}
		if !fechaHasta.IsZero() && res.Fecha.After(fechaHasta) {
			continue
		}

		fechaStr := res.Fecha.Format("2006-01-02")

		if _, ok := ventasPorFecha[fechaStr]; !ok {
			ventasPorFecha[fechaStr] = decimal.Zero
		}

		ventasPorFecha[fechaStr] = ventasPorFecha[fechaStr].Add(res.TotalEstimado)
	}

	// 4️⃣ Ordenar fechas
	var fechas []string
	for f := range ventasPorFecha {
		fechas = append(fechas, f)
	}
	sort.Strings(fechas)

	// 5️⃣ Construir respuesta
	tendencias := make([]*model.PuntoTendencia, 0, len(fechas))

	for _, f := range fechas {
		etiqueta := fmt.Sprintf("Ventas del %s", f)

		tendencias = append(tendencias, &model.PuntoTendencia{
			Fecha:    f,
			Valor:    ventasPorFecha[f],
			Etiqueta: &etiqueta, // puntero correcto
		})
	}

	return tendencias, nil
}

// TendenciasSatisfaccion genera puntos de tendencia de satisfacción basado en las calificaciones, sin llamar a un endpoint específico en Django sino con la misma data de calificaciones
func (r *restClientImpl) TendenciasSatisfaccion(ctx context.Context, filter *model.TendenciasFilter, pagination *model.Pagination) ([]*model.PuntoTendencia, error) {
	// 1️⃣ Traer todas las calificaciones
	calificaciones, err := r.ListCalificaciones(ctx, nil)
	if err != nil {
		return nil, err
	}

	// 2️⃣ Filtrar según fechas
	var fechaDesde, fechaHasta time.Time
	if filter != nil {
		if filter.FechaDesde != nil {
			fechaDesde = *filter.FechaDesde
		}
		if filter.FechaHasta != nil {
			fechaHasta = *filter.FechaHasta
		}
	}

	// 3️⃣ Agrupar calificaciones por fecha
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

	// 4️⃣ Ordenar fechas
	var fechas []string
	for f := range calificacionesPorFecha {
		fechas = append(fechas, f)
	}
	sort.Strings(fechas)

	// 5️⃣ Construir puntos de tendencia
	tendencias := make([]*model.PuntoTendencia, 0, len(fechas))
	for _, f := range fechas {

		lista := calificacionesPorFecha[f]

		var suma int32
		for _, p := range lista {
			suma += p
		}

		promedio := float64(suma) / float64(len(lista))

		// Convertir promedio (float64) a decimal.Decimal
		valorDecimal := decimal.NewFromFloat(promedio)

		etiqueta := fmt.Sprintf("Promedio de satisfacción del %s", f)

		tendencias = append(tendencias, &model.PuntoTendencia{
			Fecha:    f,
			Valor:    valorDecimal, // ahora sí: decimal.Decimal
			Etiqueta: &etiqueta,
		})
	}

	return tendencias, nil
}
