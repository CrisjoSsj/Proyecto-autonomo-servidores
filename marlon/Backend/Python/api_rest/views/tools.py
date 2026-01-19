from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from api_rest.models import Servicio, Reserva, Cliente, Pago, ReservaServicio
from api_rest.serializers import ServicioSerializer, ReservaSerializer, ClienteSerializer, PagoSerializer
import logging

logger = logging.getLogger(__name__)


def create_reserva_with_servicio(serializer, servicio_id, fecha, hora):
    """Helper para crear reserva y asociar servicio si se proporciona."""
    reserva = serializer.save()
    
    # Si se proporcionó un servicio_id, crear la relación ReservaServicio
    if servicio_id:
        try:
            servicio = Servicio.objects.get(id=servicio_id)
            ReservaServicio.objects.create(
                reserva=reserva,
                servicio=servicio,
                fecha_servicio=fecha,
                hora_servicio=hora,
                estado='pendiente'
            )
            # Actualizar el total_estimado de la reserva con el precio del servicio
            from decimal import Decimal
            reserva.total_estimado = Decimal(str(servicio.precio))
            reserva.save(update_fields=['total_estimado'])
            logger.info(f"Created ReservaServicio for reserva={reserva.id}, servicio={servicio_id}, total_estimado={reserva.total_estimado}")
        except Servicio.DoesNotExist:
            logger.warning(f"Servicio {servicio_id} not found, skipping ReservaServicio creation")
        except Exception as e:
            logger.error(f"Error creating ReservaServicio: {e}")
    
    return reserva


class BuscarProductosView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.query_params.get('q', '')
        categoria = request.query_params.get('categoria', '')
        precio_min = request.query_params.get('precio_min')
        precio_max = request.query_params.get('precio_max')
        
        servicios = Servicio.objects.all()
        
        # Filtro por texto (búsqueda en nombre y descripción)
        if query:
            servicios = servicios.filter(
                Q(nombre_servicio__icontains=query) | Q(descripcion__icontains=query)
            )
        
        # Filtro por categoría
        if categoria:
            servicios = servicios.filter(categoria__nombre__icontains=categoria)
        
        # Filtro por precio mínimo
        if precio_min:
            try:
                servicios = servicios.filter(precio__gte=float(precio_min))
            except ValueError:
                pass
        
        # Filtro por precio máximo
        if precio_max:
            try:
                servicios = servicios.filter(precio__lte=float(precio_max))
            except ValueError:
                pass
        
        serializer = ServicioSerializer(servicios, many=True)
        return Response(serializer.data)


class VerReservaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, reserva_id):
        reserva = get_object_or_404(Reserva, id=reserva_id)
        serializer = ReservaSerializer(reserva)
        data = serializer.data
        
        # Agregar los servicios asociados a la reserva
        servicios = []
        for rs in reserva.detalles.all():
            servicios.append({
                'id': rs.servicio.id,
                'nombre': rs.servicio.nombre_servicio,
                'precio': str(rs.servicio.precio),
                'estado': rs.estado,
            })
        data['servicios'] = servicios
        
        return Response(data)


class ObtenerClienteView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'error': 'user_id required'}, status=status.HTTP_400_BAD_REQUEST)
        cliente = get_object_or_404(Cliente, user_id=user_id)
        serializer = ClienteSerializer(cliente)
        return Response(serializer.data)


class CrearReservaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Create a reservation or return a proposal preview.

        Query param `confirm=true` will persist the reservation. Without it, the endpoint
        validates the input and returns a `proposal` object describing the would-be reservation.
        Supports idempotency via `Idempotency-Key` header to avoid duplicate side-effects.
        """
        # Accept either 'cliente' (id) or 'cliente_id' to make the tools API ergonomic
        data = request.data.copy()
        if 'cliente' in data and 'cliente_id' not in data:
            data['cliente_id'] = data.pop('cliente')
        
        # Extraer servicio_id antes de pasarlo al serializer (no es parte del modelo Reserva)
        servicio_id = data.pop('servicio_id', None)

        idempotency_key = request.headers.get('Idempotency-Key') or request.data.get('idempotency_key')
        actor = getattr(request, 'jwt_payload', {}).get('sub') or getattr(request, 'user', None) and getattr(request.user, 'username', None) or getattr(request, 'api_key', None)

        # allow confirmation via query param or explicit body field
        confirm = str(request.query_params.get('confirm', request.data.get('confirm', 'false'))).lower() in ('1', 'true', 'yes')

        # Idempotency: if key exists and action recorded, return recorded result
        if idempotency_key and not confirm:
            from api_rest.models import ToolActionLog
            existing = ToolActionLog.objects.filter(action='crear_reserva', idempotency_key=idempotency_key).order_by('-created_at').first()
            if existing:
                # return stored response; if proposal, return proposal; if confirmed, return actual data
                if existing.status == 'proposal':
                    return Response({'proposal': existing.response_payload}, status=status.HTTP_200_OK)
                return Response(existing.response_payload, status=status.HTTP_200_OK)

        serializer = ReservaSerializer(data=data)
        if serializer.is_valid():
            validated = serializer.validated_data
            # Build proposal preview
            if not confirm:
                proposal_instance = Reserva(**validated)
                proposal_data = ReservaSerializer(proposal_instance).data
                # log proposal
                from api_rest.models import ToolActionLog
                ToolActionLog.objects.create(action='crear_reserva', actor=actor, idempotency_key=idempotency_key, request_payload=data, response_payload=proposal_data, status='proposal')
                return Response({'proposal': proposal_data}, status=status.HTTP_200_OK)

            # confirmed: try atomic idempotency-safe creation
            from django.db import transaction, IntegrityError
            from api_rest.models import ToolActionLog

            if idempotency_key:
                try:
                    with transaction.atomic():
                        # Reserve the idempotency slot (status=processing) so only one worker proceeds
                        slot, created = ToolActionLog.objects.get_or_create(
                            action='crear_reserva',
                            idempotency_key=idempotency_key,
                            defaults={
                                'actor': actor,
                                'request_payload': data,
                                'status': 'processing'
                            }
                        )
                        if not created:
                            # Someone else already has a slot - if confirmed, return result; if proposal/processing, return best-available info
                            logger.info("Idempotency slot already exists for crear_reserva key=%s status=%s", idempotency_key, slot.status)
                            if slot.status == 'confirmed':
                                return Response(slot.response_payload, status=status.HTTP_200_OK)
                            if slot.status == 'proposal':
                                return Response({'proposal': slot.response_payload}, status=status.HTTP_200_OK)
                            # already processing -> return 200 with small hint
                            return Response({'status': 'processing'}, status=status.HTTP_200_OK)

                        # We own the slot; create the resource
                        logger.info("Acquired idempotency slot for crear_reserva key=%s", idempotency_key)
                        reserva = create_reserva_with_servicio(
                            serializer, 
                            servicio_id, 
                            validated.get('fecha'), 
                            validated.get('hora')
                        )
                        payload = ReservaSerializer(reserva).data
                        # Agregar información del servicio en la respuesta
                        if servicio_id:
                            payload['servicio_id'] = servicio_id
                            try:
                                servicio = Servicio.objects.get(id=servicio_id)
                                payload['servicio_nombre'] = servicio.nombre_servicio
                            except Servicio.DoesNotExist:
                                pass
                        slot.response_payload = payload
                        slot.status = 'confirmed'
                        slot.save()
                        logger.info("Created reserva id=%s for idempotency_key=%s", payload.get('id'), idempotency_key)
                        return Response(payload, status=status.HTTP_201_CREATED)
                except IntegrityError:
                    # Unique constraint raced and another process likely confirmed first
                    existing = ToolActionLog.objects.filter(action='crear_reserva', idempotency_key=idempotency_key, status='confirmed').order_by('-created_at').first()
                    if existing:
                        return Response(existing.response_payload, status=status.HTTP_200_OK)
                    return Response({'error': 'Idempotency conflict, retry'}, status=status.HTTP_409_CONFLICT)

            # no idempotency key - normal persist
            reserva = create_reserva_with_servicio(
                serializer, 
                servicio_id, 
                validated.get('fecha'), 
                validated.get('hora')
            )
            payload = ReservaSerializer(reserva).data
            # Agregar información del servicio en la respuesta
            if servicio_id:
                payload['servicio_id'] = servicio_id
                try:
                    servicio = Servicio.objects.get(id=servicio_id)
                    payload['servicio_nombre'] = servicio.nombre_servicio
                except Servicio.DoesNotExist:
                    pass
            ToolActionLog.objects.create(action='crear_reserva', actor=actor, idempotency_key=idempotency_key, request_payload=data, response_payload=payload, status='confirmed')
            return Response(payload, status=status.HTTP_201_CREATED)

        import logging
        logging.getLogger(__name__).error('CrearReserva validation errors: %s', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RegistrarClienteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # For tests and tool calls we expect a 10-digit telefono; ensure it's provided
        data = request.data.copy()
        telefono = data.get('telefono')
        if telefono and len(telefono) < 10:
            # pad or reject; here we reject with a clear message
            return Response({'telefono': ['El número de teléfono debe tener 10 dígitos.']}, status=status.HTTP_400_BAD_REQUEST)

        idempotency_key = request.headers.get('Idempotency-Key') or request.data.get('idempotency_key')
        actor = getattr(request, 'jwt_payload', {}).get('sub') or getattr(request, 'user', None) and getattr(request.user, 'username', None) or getattr(request, 'api_key', None)

        # Idempotency: return previous result if same key (proposal path not applicable here)
        if idempotency_key:
            from api_rest.models import ToolActionLog
            existing = ToolActionLog.objects.filter(action='registrar_cliente', idempotency_key=idempotency_key).order_by('-created_at').first()
            if existing:
                if existing.status == 'confirmed':
                    return Response(existing.response_payload, status=status.HTTP_200_OK)
                # If processing or other status, reply with a helpful message
                return Response(existing.response_payload or {'status': existing.status}, status=status.HTTP_200_OK)

        serializer = ClienteSerializer(data=data)
        if serializer.is_valid():
            from django.db import transaction, IntegrityError
            from api_rest.models import ToolActionLog

            if idempotency_key:
                try:
                    with transaction.atomic():
                        slot, created = ToolActionLog.objects.get_or_create(
                            action='registrar_cliente',
                            idempotency_key=idempotency_key,
                            defaults={
                                'actor': actor,
                                'request_payload': data,
                                'status': 'processing'
                            }
                        )
                        if not created:
                            logger.info("Idempotency slot already exists for registrar_cliente key=%s status=%s", idempotency_key, slot.status)
                            if slot.status == 'confirmed':
                                return Response(slot.response_payload, status=status.HTTP_200_OK)
                            return Response(slot.response_payload or {'status': slot.status}, status=status.HTTP_200_OK)

                        logger.info("Acquired idempotency slot for registrar_cliente key=%s", idempotency_key)
                        cliente = serializer.save()
                        payload = ClienteSerializer(cliente).data
                        slot.response_payload = payload
                        slot.status = 'confirmed'
                        slot.save()
                        logger.info("Created cliente id=%s for idempotency_key=%s", payload.get('id'), idempotency_key)
                        return Response(payload, status=status.HTTP_201_CREATED)
                except IntegrityError:
                    existing = ToolActionLog.objects.filter(action='registrar_cliente', idempotency_key=idempotency_key, status='confirmed').order_by('-created_at').first()
                    if existing:
                        return Response(existing.response_payload, status=status.HTTP_200_OK)
                    return Response({'error': 'Idempotency conflict, retry'}, status=status.HTTP_409_CONFLICT)

            cliente = serializer.save()
            from api_rest.models import ToolActionLog
            ToolActionLog.objects.create(action='registrar_cliente', actor=actor, idempotency_key=idempotency_key, request_payload=data, response_payload=ClienteSerializer(cliente).data, status='confirmed')
            return Response(ClienteSerializer(cliente).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


from django.utils import timezone


class ProcesarPagoView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Register a payment or return a proposal preview.

        Query param `confirm=true` will persist the payment. Otherwise a proposal preview
        is returned so the caller can confirm before taking mutative action.
        Supports idempotency via `Idempotency-Key` header to avoid duplicate side-effects.
        """
        data = request.data.copy()
        # Accept 'reserva' (id) or 'reserva_id'
        if 'reserva' in data and 'reserva_id' not in data:
            data['reserva_id'] = data.pop('reserva')

        # Provide defaults: estado -> 'pagado', fecha_pago -> now
        if 'estado' not in data:
            data['estado'] = 'pagado'
        if 'fecha_pago' not in data:
            data['fecha_pago'] = timezone.now().isoformat()

        idempotency_key = request.headers.get('Idempotency-Key') or request.data.get('idempotency_key')
        actor = getattr(request, 'jwt_payload', {}).get('sub') or getattr(request, 'user', None) and getattr(request.user, 'username', None) or getattr(request, 'api_key', None)

        confirm = str(request.query_params.get('confirm', request.data.get('confirm', 'false'))).lower() in ('1', 'true', 'yes')

        # Idempotency check (proposal path handled earlier)
        if idempotency_key and not confirm:
            from api_rest.models import ToolActionLog
            existing = ToolActionLog.objects.filter(action='procesar_pago', idempotency_key=idempotency_key).order_by('-created_at').first()
            if existing:
                if existing.status == 'proposal':
                    return Response({'proposal': existing.response_payload}, status=status.HTTP_200_OK)
                return Response(existing.response_payload, status=status.HTTP_200_OK)

        serializer = PagoSerializer(data=data)
        if serializer.is_valid():
            validated = serializer.validated_data
            if not confirm:
                proposal_instance = Pago(**validated)
                proposal_data = PagoSerializer(proposal_instance).data
                from api_rest.models import ToolActionLog
                ToolActionLog.objects.create(action='procesar_pago', actor=actor, idempotency_key=idempotency_key, request_payload=data, response_payload=proposal_data, status='proposal')
                return Response({'proposal': proposal_data}, status=status.HTTP_200_OK)

            # confirmed: idempotency-safe create
            from django.db import transaction, IntegrityError
            from api_rest.models import ToolActionLog

            if idempotency_key:
                try:
                    with transaction.atomic():
                        slot, created = ToolActionLog.objects.get_or_create(
                            action='procesar_pago',
                            idempotency_key=idempotency_key,
                            defaults={
                                'actor': actor,
                                'request_payload': data,
                                'status': 'processing'
                            }
                        )
                        if not created:
                            logger.info("Idempotency slot already exists for procesar_pago key=%s status=%s", idempotency_key, slot.status)
                            if slot.status == 'confirmed':
                                return Response(slot.response_payload, status=status.HTTP_200_OK)
                            if slot.status == 'proposal':
                                return Response({'proposal': slot.response_payload}, status=status.HTTP_200_OK)
                            return Response({'status': 'processing'}, status=status.HTTP_200_OK)

                        logger.info("Acquired idempotency slot for procesar_pago key=%s", idempotency_key)
                        pago = serializer.save()
                        payload = PagoSerializer(pago).data
                        slot.response_payload = payload
                        slot.status = 'confirmed'
                        slot.save()
                        logger.info("Created pago id=%s for idempotency_key=%s", payload.get('id'), idempotency_key)
                        return Response(payload, status=status.HTTP_201_CREATED)
                except IntegrityError:
                    existing = ToolActionLog.objects.filter(action='procesar_pago', idempotency_key=idempotency_key, status='confirmed').order_by('-created_at').first()
                    if existing:
                        return Response(existing.response_payload, status=status.HTTP_200_OK)
                    return Response({'error': 'Idempotency conflict, retry'}, status=status.HTTP_409_CONFLICT)

            pago = serializer.save()
            from api_rest.models import ToolActionLog
            ToolActionLog.objects.create(action='procesar_pago', actor=actor, idempotency_key=idempotency_key, request_payload=data, response_payload=PagoSerializer(pago).data, status='confirmed')
            return Response(PagoSerializer(pago).data, status=status.HTTP_201_CREATED)

        import logging
        logging.getLogger(__name__).error('ProcesarPago validation errors: %s', serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResumenVentasView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return sales summary for a date range (YYYY-MM-DD). Defaults to last 30 days."""
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')

        from datetime import datetime, timedelta
        from collections import defaultdict
        from decimal import Decimal

        if not end:
            end_date = datetime.utcnow().date()
        else:
            end_date = datetime.strptime(end, '%Y-%m-%d').date()

        if not start:
            start_date = end_date - timedelta(days=30)
        else:
            start_date = datetime.strptime(start, '%Y-%m-%d').date()

        pagos = Pago.objects.filter(estado='pagado', fecha_pago__date__gte=start_date, fecha_pago__date__lte=end_date)

        total = Decimal('0.00')
        by_day = defaultdict(lambda: {'total': Decimal('0.00'), 'count': 0})

        for p in pagos:
            monto = p.monto or Decimal('0.00')
            total += monto
            day = p.fecha_pago.date().isoformat() if p.fecha_pago else 'unknown'
            by_day[day]['total'] += monto
            by_day[day]['count'] += 1

        summary = {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'total_amount': str(total),
            'count': pagos.count(),
            'by_day': [{'date': d, 'total': str(info['total']), 'count': info['count']} for d, info in sorted(by_day.items())]
        }

        return Response(summary)
