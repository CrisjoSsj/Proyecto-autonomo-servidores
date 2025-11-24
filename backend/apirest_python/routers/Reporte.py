from fastapi import APIRouter, HTTPException, Response
from datetime import datetime
from fpdf import FPDF
from typing import List

# Importar listas desde otros routers
from . import Restaurante as RestauranteRouter
from . import Cliente as ClienteRouter
from . import Mesa as MesaRouter
from . import Reserva as ReservaRouter
from . import Plato as PlatoRouter
from . import CategoriaMenu as CategoriaRouter
from . import Menu as MenuRouter

from websocket_broadcast import broadcast_reportes

router = APIRouter(tags=["Reportes"])

RESOURCES = {
    "restaurantes": ("Restaurantes", getattr(RestauranteRouter, "lista_restaurantes", []), ["id_restaurante", "nombre", "direccion", "telefono"]),
    "clientes": ("Clientes", getattr(ClienteRouter, "clientes_list", []), ["id_cliente", "nombre", "correo", "telefono"]),
    "mesas": ("Mesas", getattr(MesaRouter, "mesas_list", []), ["id_mesa", "numero", "capacidad", "estado"]),
    "reservas": ("Reservas", getattr(ReservaRouter, "reservas_list", []), ["id_reserva", "id_cliente", "id_mesa", "fecha", "hora_inicio", "estado"]),
    "platos": ("Platos", getattr(PlatoRouter, "platos_list", []), ["id_plato", "nombre", "precio", "estado"]),
    "categorias": ("Categorías", getattr(CategoriaRouter, "categorias_list", []), ["id_categoria", "nombre"]),
    "menus": ("Menús", getattr(MenuRouter, "menus_list", []), ["id_menu", "fecha"]),
}

class PDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 14)
        self.cell(0, 10, self.title, ln=1, align="C")
        self.set_draw_color(60, 60, 60)
        self.set_line_width(0.4)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", size=8)
        self.set_text_color(120)
        self.cell(0, 8, f"Generado {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')} - Chuwue Grill", 0, 0, "R")

@router.get("/reportes/recursos", summary="Listar recursos disponibles para reporte")
async def listar_recursos():
    return {"recursos": list(RESOURCES.keys())}

@router.get("/reportes/{recurso}.pdf", summary="Generar PDF de un recurso")
async def generar_pdf(recurso: str):
    recurso = recurso.lower()
    if recurso not in RESOURCES:
        raise HTTPException(status_code=404, detail="Recurso no soportado")

    titulo, lista, columnas = RESOURCES[recurso]

    pdf = PDF(orientation="P", unit="mm", format="A4")
    pdf.set_title(f"Reporte de {titulo}")
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.set_font("Helvetica", size=11)
    pdf.set_text_color(30)
    pdf.cell(0, 6, f"Total registros: {len(lista)}", ln=1)
    pdf.ln(2)

    pdf.set_font("Helvetica", "B", 9)
    col_width = 190 / len(columnas)
    for col in columnas:
        pdf.cell(col_width, 7, col.upper(), border=1, align="C")
    pdf.ln(7)

    pdf.set_font("Helvetica", size=8)
    for item in lista:
        data = item.dict() if hasattr(item, "dict") else dict(item)
        for col in columnas:
            value = data.get(col, "")
            if col == "precio" and isinstance(value, (int, float)):
                value = f"{value:.2f}"
            text = str(value)
            if len(text) > 26:
                text = text[:23] + "..."
            pdf.cell(col_width, 6, text, border=1)
        pdf.ln(6)
        if pdf.get_y() > 265:
            pdf.add_page()
            pdf.set_font("Helvetica", "B", 9)
            for col in columnas:
                pdf.cell(col_width, 7, col.upper(), border=1, align="C")
            pdf.ln(7)
            pdf.set_font("Helvetica", size=8)

    # fpdf2 devuelve bytes/bytearray directamente con dest='S'
    pdf_bytes_raw = pdf.output(dest='S')
    pdf_bytes = bytes(pdf_bytes_raw)

    # Broadcast evento de reporte generado (no bloquea si falla)
    try:
        await broadcast_reportes("reporte_generado", {
            "recurso": recurso,
            "registros": len(lista),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })
    except Exception:
        pass

    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": f"inline; filename=reporte_{recurso}.pdf"})
