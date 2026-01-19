from django.db import models
from .cliente import Cliente


class Document(models.Model):
    owner = models.ForeignKey(Cliente, on_delete=models.SET_NULL, null=True, blank=True, related_name="documents")
    title = models.CharField(max_length=255, blank=True, null=True)
    file = models.FileField(upload_to="documents/")
    mime = models.CharField(max_length=100, blank=True, null=True)
    size = models.BigIntegerField(blank=True, null=True)
    processed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title or str(self.file.name)
