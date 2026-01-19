import pytest
from pathlib import Path
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw, ImageFont

from app.ingest import extract_text_from_pdf, extract_text_from_image


def test_extract_text_from_pdf(tmp_path):
    p = tmp_path / "doc.pdf"
    c = canvas.Canvas(str(p))
    c.drawString(100, 750, "Hello PDF World")
    c.save()

    text = extract_text_from_pdf(p)
    assert "Hello PDF World" in text


def test_extract_text_from_image_mock(monkeypatch, tmp_path):
    # create a simple image
    p = tmp_path / "img.png"
    img = Image.new("RGB", (200, 80), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 10), "Hello Img", fill=(0, 0, 0))
    img.save(str(p))

    # mock pytesseract
    monkeypatch.setattr("app.ingest.pytesseract", type("T", (), {"image_to_string": lambda img: "Hello Img"}))

    text = extract_text_from_image(p)
    assert "Hello Img" in text


@pytest.mark.skipif(True, reason="Skip OCR integration test if Tesseract not installed on CI")
def test_extract_text_from_image_integration(tmp_path):
    # Integration test that actually uses pytesseract tool. Skipped by default.
    p = tmp_path / "img2.png"
    img = Image.new("RGB", (200, 80), color=(255, 255, 255))
    d = ImageDraw.Draw(img)
    d.text((10, 10), "Hello Img2", fill=(0, 0, 0))
    img.save(str(p))

    text = extract_text_from_image(p)
    assert "Hello Img2" in text
