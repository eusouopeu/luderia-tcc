"""
Bloco B3 - texto das fotos de apoio (cardápio, estante) tiradas no app de observação.

Entrada: as fotos exportadas pelo app (Ajustes › Exportar › Fotos, ou copiadas de
Documentos/ObservacaoLuderia/fotos no celular) em
`dados/[B3] Contagem direta de ocupacao/dados-brutos/app/fotos/`, e o
`contagem_fotos.csv` em `.../app/` (liga cada arquivo à unidade, categoria e hora).
As fotos não são publicadas (.gitignore): cardápio e estante são material de terceiros.

Saída: `dados/[B3] Contagem direta de ocupacao/contagem_fotos_texto.csv`,
uma linha por foto com o texto lido (Tesseract). O texto é insumo para transcrever
preços e jogos à mão, como no Bloco B1: OCR de cardápio erra valores, então não
entra em análise sem conferência.

Requer: tesseract (brew install tesseract tesseract-lang, para o idioma "por").
Uso: python3 "_src/[B3] Contagem direta de ocupacao/build_B3_ocr_fotos.py"
"""
from pathlib import Path

import pandas as pd
import pytesseract
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[2]
ENTRADA = ROOT / "dados" / "[B3] Contagem direta de ocupacao" / "dados-brutos" / "app"
SAIDA = ROOT / "dados" / "[B3] Contagem direta de ocupacao"


def idioma() -> str:
    langs = set(pytesseract.get_languages(config=""))
    if "por" in langs:
        return "por"
    print("Aviso: idioma 'por' do Tesseract ausente (brew install tesseract-lang); usando 'eng'.")
    return "eng"


def ler(arquivo: Path, lang: str) -> str:
    img = ImageOps.exif_transpose(Image.open(arquivo)).convert("L")
    # cardápio costuma ter texto pequeno: amplia fotos menores antes do OCR
    if max(img.size) < 2500:
        k = 2500 / max(img.size)
        img = img.resize((round(img.width * k), round(img.height * k)))
    texto = pytesseract.image_to_string(img, lang=lang, config="--psm 4")
    return "\n".join(l.strip() for l in texto.splitlines() if l.strip())


def main():
    pasta = ENTRADA / "fotos"
    fotos = sorted(pasta.glob("*.jpg")) if pasta.exists() else []
    if not fotos:
        raise SystemExit(f"Sem fotos em {pasta}")
    meta = pd.DataFrame()
    if (ENTRADA / "contagem_fotos.csv").exists():
        meta = pd.read_csv(ENTRADA / "contagem_fotos.csv", sep=";", encoding="utf-8-sig", dtype=str).fillna("")
    lang = idioma()
    linhas = []
    for f in fotos:
        m = meta[meta["arquivo"] == f.name].iloc[0] if not meta.empty and (meta["arquivo"] == f.name).any() else None
        if m is not None and m["categoria"] == "Medida":
            continue  # fotos de medida não têm texto útil
        texto = ler(f, lang)
        linhas.append({
            "arquivo": f.name,
            "unidade": m["unidade"] if m is not None else "",
            "categoria": m["categoria"] if m is not None else "",
            "hora": m["hora"] if m is not None else "",
            "idioma_ocr": lang,
            "texto": texto,
        })
        print(f"{f.name}: {len(texto)} caracteres")
    SAIDA.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(linhas).to_csv(SAIDA / "contagem_fotos_texto.csv", index=False, sep=";", encoding="utf-8-sig")


if __name__ == "__main__":
    main()
