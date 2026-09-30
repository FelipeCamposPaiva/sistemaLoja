from pathlib import Path
from pypdf import PdfReader

ROOT = Path(r"d:\ITENS_AREA_TRABALHO\Downloads\RH")
OUT = Path(r"C:\Projetos\ERP-TemDeTudo\ops\rh-extract.txt")

PRIORITY = [
    "895 (6)/895 Ficha de Empregado NADIA CRISTINA LOPES DO CARMO CORDEIRO.pdf",
    "895 (1)/895 ADMISSIONAIS LEONAM RAFAEL DE FREITAS BEZERRA.pdf",
    "895 (1)/895 Admissionais NADIA CRISTINA.pdf",
    "895 (1)/895 - GABRIEL IVAN CAMPOS DIAS - 11.07.26.pdf",
    "895 (1)/895 - GABRIELA FERREIRA DE PAULA - 01.06.26.pdf",
    "895 (1)/895 - MARIA ANTONIA DOS SANTOS ZORGDRAGER - 02.06.26.pdf",
    "895 (12)/895 TRCT NADIA.pdf",
    "895 (9)/895 GRRF RELAT NADIA.pdf",
    "895 (11)/895 Recibo - 07•2026.pdf",
    "895 (11)/Recibo - 08•2025.pdf",
    "895 (11)/895 Recibo - 13•2025.pdf",
    "895 (11)/895 Recibo 1ª parc 13 2025.pdf",
    "895 (11)/07•2026 Elen Retificado-07-2026-1.pdf",
    "895 (8)/895-TEM DE TUDO PAPELARIA, PRESENTES E PERSONALIZADOS LTDA-072026.pdf",
    "895 (8)/895 - TEM DE TUDO PAPELARIA, PRESENTES E PERSONALIZADOS LTDA - 082025.pdf",
    "895 (3)/1073448-895-072026-Guia.pdf",
    "895 (3)/895 DARF PREV 11 2025.pdf",
    "895 (3)/895  - DARF PREVIDENCIARIO 12-2025.pdf",
    "895 (5)/1073447-895-072026-GuiaFGTS.pdf",
    "895 (5)/895 GUIA FGTS 04 2026.pdf",
    "895 (2)/Avisos de 15•07•2026 até 22•07•2026.pdf",
    "895 (2)/Avisos de 19•08•2026 até 26•08•2026.pdf",
    "895 (2)/Avisos de 26•08•2026 até 02•09•2026.pdf",
    "895 (13)/CNPJ ATUALIZADO.pdf",
    "895 (13)/IE.pdf",
    "895 (10)/Atualizado em 23.07.2026.pdf",
    "895 (7)/895 Folha de Ponto 08.2026.pdf",
]


def text_of(path: Path, max_pages=3, limit=3500):
    try:
        reader = PdfReader(str(path))
        parts = []
        for i, page in enumerate(reader.pages[:max_pages]):
            parts.append(page.extract_text() or "")
        txt = "\n".join(parts)
        return f"PAGES={len(reader.pages)}\n{txt[:limit]}"
    except Exception as e:
        return f"ERR {e}"


lines = []
for rel in PRIORITY:
    p = ROOT / rel
    lines.append("=" * 80)
    lines.append(rel)
    lines.append("EXISTS " + str(p.exists()))
    if p.exists():
        lines.append(text_of(p))
    lines.append("")

# filename catalog with sizes
lines.append("=" * 80)
lines.append("CATALOG")
for p in sorted(ROOT.rglob("*.pdf")):
    rel = p.relative_to(ROOT).as_posix()
    lines.append(f"{p.stat().st_size:8d}  {rel}")

OUT.write_text("\n".join(lines), encoding="utf-8", errors="replace")
print("wrote", OUT, "chars", OUT.stat().st_size)
