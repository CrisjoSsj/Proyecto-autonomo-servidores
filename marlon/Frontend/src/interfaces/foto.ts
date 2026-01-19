import type { Iservicio } from "./servicio";

export interface Ifoto {
  id?: number;          // Opcional, para cuando la foto ya existe
  servicio_id: number;  // ID del servicio al que pertenece
  url_foto: string;     // URL de la foto
  descripcion?: string; // Opcional
}