from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi import BackgroundTasks
from typing import Any
from pathlib import Path
import tempfile
import logging

from app.ingest import extract_text_from_pdf, extract_text_from_image, ingest_document

logger = logging.getLogger(__name__)

router = APIRouter()


# Extensiones permitidas para cada tipo de archivo
ALLOWED_PDF_EXTENSIONS = {'.pdf'}
ALLOWED_IMAGE_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.gif', '.webp'}
ALLOWED_TEXT_EXTENSIONS = {'.txt', '.md', '.csv'}


@router.post("/")
async def ingest_file(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    """Ingest a file: save, extract text, create embeddings and persist to vector DB.

    Supports PDF, images (with OCR), and plain text files.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file")

    ext = Path(file.filename).suffix.lower()
    all_allowed = ALLOWED_PDF_EXTENSIONS | ALLOWED_IMAGE_EXTENSIONS | ALLOWED_TEXT_EXTENSIONS
    
    if ext not in all_allowed:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de archivo no soportado. Use: {sorted(all_allowed)}"
        )

    # Guardar temporalmente el archivo
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    try:
        # Procesar según el tipo de archivo
        if ext in ALLOWED_PDF_EXTENSIONS:
            result = await ingest_document(tmp_path)
            return {
                "status": "success",
                "type": "pdf",
                "filename": file.filename,
                **result
            }
        elif ext in ALLOWED_IMAGE_EXTENSIONS:
            extracted_text = extract_text_from_image(tmp_path)
            return {
                "status": "success",
                "type": "image",
                "filename": file.filename,
                "extracted_text": extracted_text,
                "characters": len(extracted_text)
            }
        else:
            # Texto plano
            result = await ingest_document(tmp_path)
            return {
                "status": "success",
                "type": "text",
                "filename": file.filename,
                **result
            }
    except RuntimeError as e:
        logger.error("Error processing file %s: %s", file.filename, str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        tmp_path.unlink(missing_ok=True)


@router.post("/image")
async def ingest_image(file: UploadFile = File(...)):
    """Procesar imagen con OCR y extraer texto.
    
    Soporta: PNG, JPG, JPEG, BMP, TIFF, GIF, WEBP
    Requiere Tesseract instalado en el sistema.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Tipo de imagen no soportado. Use: {sorted(ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # Guardar temporalmente y procesar
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)
    
    try:
        extracted_text = extract_text_from_image(tmp_path)
        return {
            "status": "success",
            "filename": file.filename,
            "extracted_text": extracted_text,
            "characters": len(extracted_text),
            "words": len(extracted_text.split()) if extracted_text else 0
        }
    except RuntimeError as e:
        logger.error("OCR failed for %s: %s", file.filename, str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        tmp_path.unlink(missing_ok=True)


@router.post("/pdf")
async def ingest_pdf(file: UploadFile = File(...)):
    """Procesar PDF y extraer texto con embeddings para RAG.
    
    Extrae texto de todas las páginas, genera embeddings y los almacena
    en la base de datos vectorial para búsqueda semántica.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_PDF_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Solo archivos PDF permitidos. Extensión recibida: {ext}"
        )
    
    # Guardar temporalmente y procesar
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)
    
    try:
        # Extraer texto para preview
        raw_text = extract_text_from_pdf(tmp_path)
        
        # Ingestión completa con embeddings
        result = await ingest_document(tmp_path)
        
        return {
            "status": "success",
            "filename": file.filename,
            "text_preview": raw_text[:500] + "..." if len(raw_text) > 500 else raw_text,
            "total_characters": len(raw_text),
            **result
        }
    except Exception as e:
        logger.error("PDF processing failed for %s: %s", file.filename, str(e))
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        tmp_path.unlink(missing_ok=True)
