import { ICategoriaMenu } from "../dominio/CategoriaMenu";

export class CategoriaService {
    private categorias: ICategoriaMenu[] = []
    private nextId: number = 1;

    agregarCategoria(categoria: Omit<ICategoriaMenu, 'id_categoria'>): ICategoriaMenu {
        const nuevaCategoria: ICategoriaMenu = { id_categoria: this.nextId++, ...categoria };
        this.categorias.push(nuevaCategoria);
        return nuevaCategoria;
    }   

    obtenerCategorias(): ICategoriaMenu[] {
        return this.categorias;
    }
    buscarCategoriaPorId(id: number): ICategoriaMenu | undefined {
        return this.categorias.find(categoria => categoria.id_categoria === id);
    }
    eliminarCategoria(id: number): void {
        this.categorias = this.categorias.filter(categoria => categoria.id_categoria !== id);
    }
    actualizarCategoria(id: number, datosActualizados: Partial<ICategoriaMenu>): void {
        const categoria = this.buscarCategoriaPorId(id);
        if (categoria) {
            Object.assign(categoria, datosActualizados);
        }
    }
}