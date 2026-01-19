from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
from qdrant_client.http import exceptions as qdrant_exceptions
from app.config import settings
from typing import List, Dict, Any


def get_qdrant_client() -> QdrantClient:
    if settings.QDRANT_URL:
        # If QDRANT_URL is e.g. http://localhost:6333
        return QdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
    # default local
    return QdrantClient()


def ensure_collection(collection_name: str, vector_size: int = 768, distance: str = "Cosine"):
    client = get_qdrant_client()
    try:
        if not client.get_collection(collection_name):
            schema = rest.CreateCollection(name=collection_name, vectors=rest.VectorParams(size=vector_size, distance=distance))
            client.create_collection(collection_name=collection_name, vectors=rest.VectorParams(size=vector_size, distance=distance))
    except qdrant_exceptions.ResponseHandlingException:
        # if the get_collection call fails (collection doesn't exist) try to create
        client.create_collection(collection_name=collection_name, vectors=rest.VectorParams(size=vector_size, distance=distance))


def upsert_embeddings(collection_name: str, ids: List[str], vectors: List[List[float]], payloads: List[Dict[str, Any]]):
    client = get_qdrant_client()
    # ensure collection exists with vector size of first vector
    if vectors and len(vectors[0]) > 0:
        ensure_collection(collection_name, vector_size=len(vectors[0]))
    points = [rest.PointStruct(id=i, vector=v, payload=p) for i, v, p in zip(ids, vectors, payloads)]
    client.upsert(collection_name=collection_name, points=points)


def search(collection_name: str, vector: List[float], limit: int = 5):
    client = get_qdrant_client()
    res = client.search(collection_name=collection_name, query_vector=vector, limit=limit)
    return res
