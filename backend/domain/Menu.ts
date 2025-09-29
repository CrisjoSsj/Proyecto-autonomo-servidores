import type {IPlato} from './Plato';
export interface IMenu {
  id_menu: number;
  fecha: Date; 
  platos: IPlato[];
}