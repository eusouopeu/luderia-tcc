"""Extrai o texto dos cardápios baixados (PDF com camada de texto ou OCR; imagens por OCR).

Entrada: dados/[B1] Estabelecimentos e cardapios/cardapios/<Estabelecimento>/*.{pdf,png,jpg,webp}
Saída:   .../cardapios/transcricao/<Estabelecimento>.txt (texto bruto por arquivo)
         .../cardapios/B1_cardapios_ocr_linhas.csv (estabelecimento;arquivo;linha;texto;preco_rs)
O idioma português vem de _src/[B1] Estabelecimentos e cardapios/Cardápios/outros/tessdata (tessdata_fast); sem ele, cai para inglês.
Preço = último número no formato 12,90 ou 12 ao fim da linha; a classificação por categoria é manual.
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import csv
import os
import re
import subprocess
import tempfile
from pathlib import Path

import pytesseract
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[4]
BASE = ROOT / "dados/[B1] Estabelecimentos e cardapios/cardapios"
TRANSCRICAO = BASE / "transcricao"
TESSDATA = Path(__file__).resolve().parents[1] / "outros" / "tessdata"
LANG = "por" if (TESSDATA / "por.traineddata").exists() else "eng"
os.environ["TESSDATA_PREFIX"] = str(TESSDATA) if LANG == "por" else os.environ.get("TESSDATA_PREFIX", "")
Image.MAX_IMAGE_PIXELS = None
PRECO = re.compile(r"(?:R\$\s*)?(\d{1,3}(?:[.,]\d{2})?)\s*$")


def ocr_imagem(img):
    img = ImageOps.exif_transpose(img).convert("L")
    largura = img.width
    if largura < 1800:  # amplia imagens pequenas para o OCR
        fator = 1800 / largura
        img = img.resize((1800, int(img.height * fator)), Image.LANCZOS)
    elif largura > 3500:
        img = img.resize((3500, int(img.height * 3500 / largura)), Image.LANCZOS)
    return pytesseract.image_to_string(img, lang=LANG, config="--psm 6")


def texto_pdf(pdf):
    t = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], capture_output=True, text=True).stdout
    if len(t.strip()) > 200:
        return t, "camada de texto"
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["pdftoppm", "-r", "150", "-png", str(pdf), f"{tmp}/p"], check=True)
        paginas = sorted(Path(tmp).glob("p*.png"))
        return "\n".join(ocr_imagem(Image.open(p)) for p in paginas), "OCR"


def main():
    TRANSCRICAO.mkdir(exist_ok=True)
    linhas = []
    for pasta in sorted(p for p in BASE.iterdir() if p.is_dir() and p.name != "transcricao" and not p.name.startswith("Cardápio ")):
        saida = []
        for arq in sorted(pasta.iterdir()):
            if arq.suffix.lower() == ".pdf":
                texto, metodo = texto_pdf(arq)
            elif arq.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}:
                texto, metodo = ocr_imagem(Image.open(arq)), "OCR"
            else:
                continue
            print(f"{pasta.name}/{arq.name}: {metodo}, {len(texto)} caracteres")
            saida.append(f"===== {arq.name} ({metodo}) =====\n{texto}")
            for n, linha in enumerate(texto.splitlines(), 1):
                linha = linha.strip()
                if len(linha) < 3:
                    continue
                m = PRECO.search(linha)
                linhas.append([pasta.name, arq.name, n, linha, m.group(1).replace(",", ".") if m else ""])
        (TRANSCRICAO / f"{pasta.name}.txt").write_text("\n\n".join(saida), encoding="utf-8")
    with open(BASE / "B1_cardapios_ocr_linhas.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["estabelecimento", "arquivo", "linha", "texto", "preco_rs"])
        w.writerows(linhas)


if __name__ == "__main__":
    main()
