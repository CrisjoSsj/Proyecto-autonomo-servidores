#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mi_proyecto.settings')
django.setup()

from api_rest.models import Pago, Reserva

print("=" * 60)
print("VERIFICACIÓN DE PAGOS EN LA BASE DE DATOS")
print("=" * 60)

pagos = Pago.objects.all().order_by('-created_at')
print(f"\nTotal de pagos: {pagos.count()}\n")

if pagos.exists():
    for pago in pagos:
        print(f"Pago ID: {pago.id}")
        print(f"  Reserva ID: {pago.reserva.id}")
        print(f"  Estado: {pago.estado}")
        print(f"  Monto: {pago.monto}")
        print(f"  Método: {pago.metodo_pago}")
        print(f"  Fecha Pago: {pago.fecha_pago}")
        print(f"  Created: {pago.created_at}")
        print(f"  Updated: {pago.updated_at}")
        print()
else:
    print("No hay pagos registrados\n")

print("=" * 60)
print("VERIFICACIÓN DE RESERVAS Y SUS PAGOS")
print("=" * 60)

reservas = Reserva.objects.all().order_by('-created_at')[:5]
print(f"\nÚltimas 5 reservas:\n")

for reserva in reservas:
    print(f"Reserva ID: {reserva.id}")
    print(f"  Estado: {reserva.estado}")
    print(f"  Total Estimado: {reserva.total_estimado}")
    pagos_reserva = Pago.objects.filter(reserva=reserva)
    if pagos_reserva.exists():
        for pago in pagos_reserva:
            print(f"  - Pago {pago.id}: estado={pago.estado}")
    else:
        print(f"  - Sin pagos")
    print()
