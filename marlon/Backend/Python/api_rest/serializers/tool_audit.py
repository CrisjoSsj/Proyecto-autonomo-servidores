from rest_framework import serializers
from ..models import ToolActionLog


class ToolActionLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ToolActionLog
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')
