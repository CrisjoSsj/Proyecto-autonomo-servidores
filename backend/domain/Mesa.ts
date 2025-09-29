export interface IMesa {
  id_mesa: number;
  numero: string; 
  capacidad: number; 
  estado: 'libre' | 'ocupada' | 'reservada';
}