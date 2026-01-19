from rest_framework import serializers
from .. import models


class DocumentSerializer(serializers.ModelSerializer):
    owner = serializers.PrimaryKeyRelatedField(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(queryset=models.Cliente.objects.all(), source="owner", write_only=True, required=False)

    class Meta:
        model = models.Document
        fields = '__all__'
        read_only_fields = ('processed', 'created_at', 'updated_at')
