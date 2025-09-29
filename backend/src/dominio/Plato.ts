import { ICategoriaMenu } from "./CategoriaMenu";
export interface IPlato {
  id_plato: number;
  nombre: string;
  descripcion: string;
  precio: number;
  disponible: boolean; 
  categoria: ICategoriaMenu;
}