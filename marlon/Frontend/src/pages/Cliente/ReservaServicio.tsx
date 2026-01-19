import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { getUsers } from "../../api/usersApi";
import { getReservasByCliente } from "../../api/reserva";
import { createReservaServicio, updateReservaServicio, getReservaServicioById } from "../../api/reservaServicio";
import type { Ireserva } from "../../interfaces/reserva";
import type { IreservaServicio } from "../../interfaces/reservaServicio";

export function ReservaServicio() {
  const [reservas, setReservas] = useState<Ireserva[]>([]);
  const token = useState<string | null>(localStorage.getItem("token"))[0];
  const [initialData, setInitialData] = useState<Partial<IreservaServicio>>({});
  const navigate = useNavigate();

  const params = useParams<{ reserva_id?: string; id?: string; servicio_id?: string }>();

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<IreservaServicio>();

  // Cargar reservas pendientes del cliente
  useEffect(() => {
    async function loadReservas() {
      if (!token) return;
      try {
        const perfilRes = await getUsers(token);
        const clienteId = perfilRes.data.id;
        const reservasRes = await getReservasByCliente(clienteId, token);
        const pendientes = reservasRes.data.filter((r: Ireserva) => r.estado === "pendiente");
        setReservas(pendientes);
      } catch (err) {
        console.error("Error al cargar reservas:", err);
      }
    }
    loadReservas();
  }, [token]);

  // Cargar datos si es edición o prellenar servicio_id si es creación
  useEffect(() => {
    async function loadReservaServicio() {
      if (!token) return;

      if (params.id) { // edición
        try {
          const res = await getReservaServicioById(Number(params.id), token);
          const data = res.data;
          setInitialData(data);

          // Prellenar formulario
          reset({
            reserva_id: data.reserva.id,
            servicio_id: data.servicio.id,
            fecha_servicio: data.fecha_servicio,
            hora_servicio: data.hora_servicio.slice(0,5), // "HH:MM"
          });
        } catch (err) {
          console.error("Error cargando reserva de servicio:", err);
        }
      } else if (params.servicio_id) { // creación desde servicio
        setValue("servicio_id", Number(params.servicio_id));
      }
    }
    loadReservaServicio();
  }, [params.id, params.servicio_id, token, reset, setValue]);

  const onSubmit = handleSubmit(async (data) => {
    if (!token) {
      alert("No hay token disponible");
      return;
    }

    // Formatear hora a HH:mm:ss
    let hora = data.hora_servicio ?? "";
    if (hora.length === 5) hora += ":00";

    // Construir payload dinámico con campos modificados
    const modifiedData: Partial<IreservaServicio> = {};
    if (params.id) {
      if (data.reserva_id && Number(data.reserva_id) !== initialData.reserva?.id) modifiedData.reserva_id = Number(data.reserva_id);
      if (data.servicio_id && Number(data.servicio_id) !== initialData.servicio?.id) modifiedData.servicio_id = Number(data.servicio_id);
      if (data.fecha_servicio && data.fecha_servicio !== initialData.fecha_servicio) modifiedData.fecha_servicio = data.fecha_servicio;
      if (hora && hora !== initialData.hora_servicio) modifiedData.hora_servicio = hora;
    } else { // creación
      modifiedData.reserva_id = Number(data.reserva_id);
      modifiedData.servicio_id = Number(data.servicio_id);
      modifiedData.fecha_servicio = data.fecha_servicio;
      modifiedData.hora_servicio = hora;
    }

    try {
      if (params.id) {
        if (Object.keys(modifiedData).length === 0) {
          alert("No se modificó ningún campo");
          return;
        }
        await updateReservaServicio(Number(params.id), modifiedData, token);
        alert("✅ Reserva de servicio actualizada correctamente");
        navigate(`/servicios/reserva-list/reservados/${params.id}`);
      } else {
        const response = await createReservaServicio(modifiedData as IreservaServicio, token);
        alert("✅ Reserva de servicio creada correctamente");
        const reservaServicioId = response.data.id;
        navigate(`/servicios/reserva-list/reservados/${reservaServicioId+1}`);
      }
    } catch (err) {
      console.error("Error al guardar reserva de servicio:", err);
      alert("❌ No se pudo guardar la reserva de servicio");
    }
  });

  return (
    <div style={{ maxWidth: "500px", margin: "2rem auto" }}>
      <h2>{params.id ? "Editar Reserva de Servicio" : "Nueva Reserva de Servicio"}</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Reserva:</label>
          <select {...register("reserva_id", { required: true })}>
            <option value="">Seleccione una reserva</option>
            {reservas.map(r => (
              <option key={r.id} value={r.id}>
                {r.fecha} - {r.servicio?.nombre_servicio || "Reserva"}
              </option>
            ))}
          </select>
          {errors.reserva_id && <span>Debe seleccionar una reserva</span>}
        </div>

        <div>
          <label>Fecha del servicio:</label>
          <input type="date" {...register("fecha_servicio", { required: true })} />
          {errors.fecha_servicio && <span>Debe ingresar la fecha del servicio</span>}
        </div>

        <div>
          <label>Hora del servicio:</label>
          <input type="time" {...register("hora_servicio", { required: true })} />
          {errors.hora_servicio && <span>Debe ingresar la hora del servicio</span>}
        </div>

        <button type="submit" style={{ marginTop: "1rem" }}>
          {params.id ? "Actualizar Reserva de Servicio" : "Crear Reserva de Servicio"}
        </button>
      </form>
    </div>
  );
}
