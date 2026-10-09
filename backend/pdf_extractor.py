
import io
import fitz
import pytesseract
from PIL import Image

pytesseract.pytesseract.tesseract_cmd = (
    r"D:\Tesseract-OCR\tesseract.exe"
)


def extract_pdf_text(pdf_bytes: bytes) -> str:
    pages_text = []

    with fitz.open(
        stream=pdf_bytes,
        filetype="pdf"
    ) as document:

        for page_number, page in enumerate(document, start=1):
            text = page.get_text("text").strip()

            # Use OCR when the page has no readable text
            if len(text) < 20:
                print(f"Running OCR on page {page_number}...")

                pixmap = page.get_pixmap(
                    matrix=fitz.Matrix(2, 2),
                    alpha=False
                )

                image = Image.open(
                    io.BytesIO(pixmap.tobytes("png"))
                ).convert("RGB")

                text = pytesseract.image_to_string(
                    image,
                    lang="eng"
                ).strip()

            if text:
                pages_text.append(text)

    return "\n\n".join(pages_text)
