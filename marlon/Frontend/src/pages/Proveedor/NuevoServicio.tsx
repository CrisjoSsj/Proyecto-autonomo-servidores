import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import {
  getAllCategorias,
} from "../../api/categoria";
import {
  createServicio,
  getServicioById,
  updateServicio,
} from "../../api/servicio";
import type { Icategoria } from "../../interfaces/categoria";
import type { Iservicio } from "../../interfaces/servicio";
import { useNavigate, useParams } from "react-router-dom";
import { getUsers } from "../../api/usersApi";

export default function NuevoServicio() {
  const [categorias, setCategorias] = useState<Icategoria[]>([]);
  const [proveedorId, setProveedorId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<Partial<Iservicio>>({});
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<Iservicio>();

  // Cargar categorías
  useEffect(() => {
    async function loadCategorias() {
      try {
        const respuesta = await getAllCategorias();
        setCategorias(respuesta.data);
      } catch (err) {
        console.error("Error cargando categorías:", err);
      }
    }
    loadCategorias();
  }, []);

  // Obtener proveedor autenticado
  useEffect(() => {
    const saveToken = localStorage.getItem("token");
    if (!saveToken) return;
    setToken(saveToken);

    async function loadProveedor() {
      try {
        const res = await getUsers(saveToken);
        const data = res.data;
        if (data.rol === "proveedor") {
          setProveedorId(data.id);
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error obteniendo perfil:", error);
      }
    }

    loadProveedor();
  }, [navigate]);

  // Si hay id, cargar los datos del servicio
  useEffect(() => {
    async function loadServicio() {
      if (params.id && token) {
        try {
          const res = await getServicioById(Number(params.id), token);
          const servicio = res.data;
          setInitialData(servicio);
          setValue("nombre_servicio", servicio.nombre_servicio);
          setValue("descripcion", servicio.descripcion);
          setValue("duracion", servicio.duracion);
          setValue("precio", servicio.precio);
          setValue("categoria", servicio.categoria_id);
        } catch (error) {
          console.error("Error cargando servicio:", error);
        }
      }
    }

    loadServicio();
  }, [params.id, token, setValue]);

  // Manejo del submit
  const onSubmit = handleSubmit(async (data) => {
    if (!proveedorId || !token) {
      alert("No se pudo obtener el proveedor autenticado o el token.");
      return;
    }

    // ⚡ Solo enviar campos modificados
    const modifiedData: Partial<Iservicio> = {};
    Object.keys(data).forEach((key) => {
      const k = key as keyof Iservicio;
      if (data[k] !== initialData[k]) {
        modifiedData[k] = k === "precio" ? Number(data[k]) : data[k];
      }
    });

    // Agregar categoria si se está creando
    // No enviar proveedor_id, Django lo asigna automáticamente desde el JWT
    if (!params.id) {
      modifiedData.categoria_id = Number(data.categoria);
      // Eliminar `categoria` (campo de solo lectura en el serializer) para evitar confusiones
      if ((modifiedData as any).categoria !== undefined) delete (modifiedData as any).categoria;
      modifiedData.rating_promedio = 0;
    }

    // Normalizar 'duracion' de "HH:MM" a "HH:MM:SS" porque el backend espera segundos
    if (modifiedData.duracion && typeof modifiedData.duracion === "string") {
      if (/^\d{1,2}:\d{2}$/.test(modifiedData.duracion)) {
        modifiedData.duracion = `${modifiedData.duracion}:00`;
      }
    }

    // Mostrar payload en consola para depuración
    console.log("Payload que se va a enviar:", modifiedData);

    try {
      if (params.id) {
        await updateServicio(Number(params.id), modifiedData, token);
        alert("✅ Servicio actualizado correctamente");
      } else {
        const res = await createServicio(modifiedData, token);
        alert("✅ Servicio creado correctamente");
        navigate(`/crear-nuevo-servicio/ubicaciones/${res.data.id}`);
        return;
      }

      navigate("/mis-servicios");
    } catch (error: any) {
      console.error("Error al guardar servicio:", error);
      console.error("Detalles de la respuesta del servidor:", error?.response?.data);
      alert(`❌ No se pudo guardar el servicio: ${error?.response?.data ? JSON.stringify(error.response.data) : error.message}`);
    }
  });

  return (
    <div style={{ maxWidth: "500px", margin: "2rem auto" }}>
      <h2>{params.id ? "Editar Servicio" : "Nuevo Servicio"}</h2>
      <form onSubmit={onSubmit}>
        <div>
          <input
            type="text"
            placeholder="Nombre del servicio"
            {...register("nombre_servicio", { required: true, minLength: 5 })}
          />
          {errors.nombre_servicio && (
            <span>Es obligatorio ingresar el nombre (mínimo 5 caracteres)</span>
          )}
        </div>

        <div>
          <textarea
            placeholder="Descripción"
            {...register("descripcion", { required: true, minLength: 10 })}
          />
          {errors.descripcion && (
            <span>
              Es obligatorio ingresar la descripción (mínimo 10 caracteres)
            </span>
          )}
        </div>

        <div>
          <input
            type="time"
            placeholder="Duración"
            {...register("duracion", { required: true })}
          />
          {errors.duracion && <span>Es obligatorio ingresar la duración</span>}
        </div>

        <div>
          <input
            type="number"
            placeholder="Precio del servicio"
            step="0.01"
            {...register("precio", {
              required: true,
              min: 0,
            })}
          />
          {errors.precio && (
            <span>Debe ingresar un precio válido mayor o igual a 0</span>
          )}  
        </div>

        <div>
          <select {...register("categoria", { required: true })}>
            <option value="">Seleccione una categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
          {errors.categoria && <span>Debe seleccionar una categoría</span>}
        </div>

        <button type="submit" style={{ marginTop: "1rem" }}>
          {params.id ? "Actualizar Servicio" : "Guardar y Agregar Ubicaciones"}
        </button>
      </form>
    </div>
  );
}
