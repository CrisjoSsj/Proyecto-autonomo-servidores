FROM python:3.11-slim

WORKDIR /app

# system deps (add common libs needed for Pillow / cryptography / wheels)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential \
       ca-certificates \
       curl \
       libjpeg62-turbo-dev \
       zlib1g-dev \
       libffi-dev \
       libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Ensure pip, setuptools and wheel are recent and prefer binary wheels to avoid long builds
ENV PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

COPY requirements.txt ./
RUN python -m pip install --upgrade pip setuptools wheel \
    && pip install --prefer-binary -r requirements.txt

COPY ./app ./app
COPY ./README.md ./README.md

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
