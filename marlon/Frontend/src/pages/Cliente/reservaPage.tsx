import { useEffect, useState } from "react";
import { getUsers } from "../../api/usersApi";
import type { Ireserva } from "../../interfaces/reserva";
import { createReserva } from "../../api/reserva";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

export function ReservaPage() {
  const [token, setToken] = useState<string | null>(null);
  const [cliente, setCliente] = useState<any>(null);
  const [total, setTotal] = useState<number>(0);
  const Navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<Partial<Ireserva>>();

  useEffect(() => {
    const saveToken = localStorage.getItem("token");
    if (!saveToken) return;
    setToken(saveToken);

    async function loadCliente() {
      try {
        const res = await getUsers(saveToken);
        console.log("Respuesta de getUsers:", res.data);
        // El auth-service devuelve el ID del cliente Django directamente en res.data.id
        setCliente(res.data);
      } catch (err) {
        console.error("Error cargando cliente:", err);
      }
    }

    loadCliente();

    // Inicializa el campo total_estimado con 0 (solo lectura)
    setValue("total_estimado", 0);
  }, [setValue]);

  const onSubmit = async (data: Partial<Ireserva>) => {
    if (!token) return alert("No hay token guardado");
    if (!cliente) return alert("No se pudo obtener el cliente autenticado");
    
    // Validar que el cliente_id sea un número válido
    const clienteId = Number(cliente.id);
    if (isNaN(clienteId) || clienteId <= 0) {
      console.error("cliente.id no es un número válido:", cliente.id);
      return alert("Error: No se pudo obtener el ID del cliente. Por favor, cierra sesión e inicia de nuevo.");
    }

    let horaFormateada = data.hora || "";
    if (horaFormateada.length === 5) {
      horaFormateada = horaFormateada + ":00";
    }

    const reservaData = {
      cliente_id: clienteId,
      fecha: new Date(data.fecha as string).toISOString().split("T")[0],
      hora: horaFormateada,
      total_estimado: Number(total) || 0,
      estado: "pendiente" as const,
    };

    console.log("Datos de reserva a enviar:", reservaData);

    try {
      await createReserva(reservaData, token);
      alert("Reserva creada correctamente ✅");
      Navigate("/servicios/reserva-list")
    } catch (error: any) {
      console.error("Error creando reserva:", error);
      if (error.response?.data) {
        console.error("Detalles backend:", error.response.data);
      }
      alert("No se pudo crear la reserva ❌ — usando total 0 por defecto");
      // fuerza el total a 0 si falla
      setTotal(1);
    }
  };

  return (
    <div>
      <h2>Crear Reserva</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Fecha:</label>
          <input
            type="date"
            {...register("fecha", { required: "La fecha es obligatoria" })}
          />
          {errors.fecha && <span>{errors.fecha.message}</span>}
        </div>

        <div>
          <label>Hora:</label>
          <input
            type="time"
            {...register("hora", { required: "La hora es obligatoria" })}
          />
          {errors.hora && <span>{errors.hora.message}</span>}
        </div>


        <button type="submit">Crear Reserva</button>
      </form>
    </div>
  );
}
