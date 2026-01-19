from api_rest.authentication import JWTAuthentication
from api_rest.permissions import IsAuthenticatedOrDashboard
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.conf import settings
import requests

from .. import models, serializers


class DocumentView(viewsets.ModelViewSet):
    serializer_class = serializers.DocumentSerializer
    queryset = models.Document.objects.all()
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticatedOrDashboard]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        doc = serializer.save()
        # Trigger orchestrator ingest if configured
        ingest_url = getattr(settings, "ORCHESTRATOR_INGEST_URL", None)
        api_key = getattr(settings, "ORCHESTRATOR_API_KEY", None)
        if ingest_url:
            try:
                with open(doc.file.path, 'rb') as f:
                    headers = {}
                    if api_key:
                        headers['Authorization'] = f"Bearer {api_key}"
                    resp = requests.post(ingest_url, files={'file': f}, headers=headers, timeout=30)
                    # optionally handle resp status
            except Exception:
                # log exception in production
                pass

    def get_queryset(self):
        queryset = super().get_queryset()
        owner_id = self.request.query_params.get('owner_id')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)
        return queryset
