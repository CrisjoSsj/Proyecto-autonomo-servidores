import { IMenu } from "../domain/Menu";

export class MenuService {
    private menus: IMenu[] = [];
    private nextId: number = 1;

    agregarMenu(menu: Omit<IMenu, 'id_menu'>): IMenu {
        const nuevoMenu: IMenu = { id_menu: this.nextId++, ...menu };
        this.menus.push(nuevoMenu);
        return nuevoMenu;
    }   
    obtenerMenus(): IMenu[] {
        return this.menus;
    }   
    buscarMenuPorId(id: number): IMenu | undefined {
        return this.menus.find(menu => menu.id_menu === id);
    }
    eliminarMenu(id: number): void {
        this.menus = this.menus.filter(menu => menu.id_menu !== id);
    }
    actualizarMenu(id: number, datosActualizados: Partial<IMenu>): void {
        const menu = this.buscarMenuPorId(id);
        if (menu) {
            Object.assign(menu, datosActualizados);
        }
    }
}