#!/usr/bin/env python
"""
Script para limpiar todas las reservas, pagos y detalles de reserva de la BD.
Útil para tests y desarrollo limpio.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings')
django.setup()

from api_rest import models

def clean_all():
    """Eliminar todas las reservas, pagos y ReservaServicio."""
    print("🧹 Limpiando base de datos...")
    
    pago_count = models.Pago.objects.count()
    reserva_servicio_count = models.ReservaServicio.objects.count()
    reserva_count = models.Reserva.objects.count()
    
    if pago_count > 0:
        models.Pago.objects.all().delete()
        print(f"  ✅ Eliminados {pago_count} pagos")
    
    if reserva_servicio_count > 0:
        models.ReservaServicio.objects.all().delete()
        print(f"  ✅ Eliminados {reserva_servicio_count} ReservaServicio")
    
    if reserva_count > 0:
        models.Reserva.objects.all().delete()
        print(f"  ✅ Eliminadas {reserva_count} reservas")
    
    if pago_count + reserva_servicio_count + reserva_count == 0:
        print("  ℹ️ No había datos para limpiar.")
    
    print("\n✨ Base de datos limpia!")
    print(f"Estado actual:")
    print(f"  - Reservas: {models.Reserva.objects.count()}")
    print(f"  - ReservaServicio: {models.ReservaServicio.objects.count()}")
    print(f"  - Pagos: {models.Pago.objects.count()}")

if __name__ == '__main__':
    clean_all()