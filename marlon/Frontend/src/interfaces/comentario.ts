export interface Icomentario {
  id?: number;
  cliente_id: number;
  servicio_id: number;
  titulo: string;
  texto: string;
  respuesta?: string | null;
  fecha?: string;
  created_at?: string;
  updated_at?: string;
}
