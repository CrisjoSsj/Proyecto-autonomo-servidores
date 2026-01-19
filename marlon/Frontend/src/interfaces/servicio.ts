import type { Icategoria } from "./categoria";
import type { Iubicacion } from "./ubicacion";
import type { Ifoto } from "./foto";

export interface Iservicio {
    id?: number;
    categoria?: Icategoria;
    categoria_id?: number;
    proveedor_id?: number;
    nombre_servicio: string;
    descripcion?: string | null;
    duracion?: string | null;
    ubicaciones?: Iubicacion[];
    rating_promedio?: number;
    precio: number;
    fotos?: Ifoto[];
}