import io

from app.common.exceptions import AppError


def extract_text(filename: str, data: bytes) -> str:
    """Extract plain text from a PDF, DOCX, or TXT resume."""
    name = (filename or "").lower()

    if name.endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(data))
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    if name.endswith(".docx"):
        import docx

        document = docx.Document(io.BytesIO(data))
        return "\n".join(p.text for p in document.paragraphs)

    if name.endswith(".txt"):
        return data.decode("utf-8", errors="ignore")

    raise AppError("Unsupported file type. Please upload a PDF, DOCX, or TXT.")
