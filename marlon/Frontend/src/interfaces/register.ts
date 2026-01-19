import type { IclienteRegister } from './cliente';
import type { IproveedorRegister } from './proveedor';

export type RegisterRequest = IclienteRegister | IproveedorRegister;