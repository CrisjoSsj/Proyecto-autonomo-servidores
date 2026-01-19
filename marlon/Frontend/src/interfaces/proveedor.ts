import type { Iuser } from "./user";
import type { Iubicacion } from "./ubicacion";

export interface Iproveedor{
    id?: number;
    user: Iuser;
    telefono: string;
    descripcion?: string | null;
    ubicacion?: Iubicacion | null;
}

export interface IproveedorRegister{
    rol: "proveedor";
    user: Iuser;
    telefono: string;
    descripcion?: string;
    ubicacion?: Iubicacion | null;
}