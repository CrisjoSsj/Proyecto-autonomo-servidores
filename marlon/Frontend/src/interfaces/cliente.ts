import type { Iuser } from './user';
import type { Iubicacion } from './ubicacion';

export interface Icliente {
    id?: number;
    user: Iuser;
    telefono: string;
    ubicacion?: Iubicacion | null;
}

export interface IclienteRegister{
    rol: "cliente";
    user: Iuser;
    telefono: string;
    ubicacion: Iubicacion | null;
}
