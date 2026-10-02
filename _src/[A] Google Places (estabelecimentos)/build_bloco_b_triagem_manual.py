"""
Bloco A - separa a curadoria manual das metrópoles (mais de 100 avaliações) em
duas planilhas: o registro da triagem e os estabelecimentos aprovados.

Protocolo da triagem (feito pelo autor, um estabelecimento por vez):
  1. fotos do Google Maps: confirmam se mostram ao menos uma estante completa
     de jogos de caixa e ao menos duas mesas com cadeiras;
  2. se as fotos não bastam e o nome não indica outra atividade (ex.: "game"
     costuma ser videogame), busca do perfil no Instagram e mesma conferência
     na bio e nas fotos;
  3. sem confirmação em nenhum dos dois, o caso é marcado como inconclusivo.

O resultado foi anotado na coluna "Comentário 1". Este script traduz a
anotação para as colunas da triagem pelas regras abaixo:
  - "luderia autentica" ou comentário de avaliação já coletado (formato
    "nota :: texto") -> aprovado pelas fotos do Google Maps;
  - "fotos google, X" / "google fotos, X" / texto livre -> reprovado pelas
    fotos do Google Maps; X é a atividade identificada;
  - "instagram, X" -> fotos insuficientes; reprovado pelo Instagram;
  - "inconclusivo" / "indefinivel" -> fotos insuficientes e sem confirmação
    no Instagram (a anotação não diz se o perfil foi encontrado);
  - vazio -> triagem pendente.

Cada place_id recebe um único resultado; a soma dos resultados fecha com o
total de linhas da entrada (conferido no terminal).

Entrada (anotada à mão pelo autor):
  _data/raw/[A] Estabelecimentos e cardapios/
      bloco_b_curadoria_manual_metropoles_mais_100_avaliacoes.xlsx
Saídas em _data/processed/[A] Estabelecimentos e cardapios/:
  bloco_b_triagem_manual_metropoles_mais_100_avaliacoes.xlsx
  bloco_b_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/build_bloco_b_triagem_manual.py"
"""
import pathlib
import re

import pandas as pd
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios"
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
ENTRADA = RAW / "bloco_b_curadoria_manual_metropoles_mais_100_avaliacoes.xlsx"
SAIDA_TRIAGEM = PROCESSED / "bloco_b_triagem_manual_metropoles_mais_100_avaliacoes.xlsx"
SAIDA_APROVADAS = PROCESSED / "bloco_b_luderias_aprovadas_metropoles_mais_100_avaliacoes.xlsx"

COL_FOTOS = "possui fotos no google maps?"
COL_FOTOS_OK = "fotos do google maps comprovam?"
COL_INSTA = "possui instagram?"
COL_INSTA_OK = "bio ou fotos do instagram comprovam?"
NA = "não se aplica"

# Comentário de avaliação coletado: começa por nota ou por idade ("1s ::", "5 ::").
PADRAO_AVALIACAO = re.compile(r"^\s*(\d+[hdsm]\s*::|\d)")
PREFIXO_FOTOS = re.compile(r"^\s*(fotos google|google fotos)\s*,\s*", re.I)
PREFIXO_INSTA = re.compile(r"^\s*instagram\s*,\s*", re.I)


def classifica(anotacao):
    """Devolve (fotos, fotos_ok, insta, insta_ok, atividade, resultado)."""
    texto = "" if pd.isna(anotacao) else str(anotacao).strip()
    minusculo = texto.lower()
    if not texto:
        return ("não registrado",) * 4 + ("", "pendente")
    if minusculo == "luderia autentica" or PADRAO_AVALIACAO.match(texto):
        return ("sim", "sim", NA, NA, "luderia", "aprovado")
    if PREFIXO_INSTA.match(texto):
        atividade = PREFIXO_INSTA.sub("", texto)
        return ("insuficientes", "não", "sim", "não", atividade, "reprovado")
    if minusculo in ("inconclusivo", "indefinivel"):
        return ("insuficientes", "não", "não registrado", "não", "", "inconclusivo")
    atividade = PREFIXO_FOTOS.sub("", texto)
    return ("sim", "não", NA, NA, atividade, "reprovado")


def formata(caminho, larguras):
    """Cabeçalho em negrito, filtro, painel congelado e larguras fixas."""
    from openpyxl import load_workbook

    wb = load_workbook(caminho)
    ws = wb.active
    for celula in ws[1]:
        celula.font = Font(bold=True)
        celula.alignment = Alignment(wrap_text=True, vertical="top")
    ws.freeze_panes = "C2"
    ws.auto_filter.ref = ws.dimensions
    for i, celula in enumerate(ws[1], start=1):
        ws.column_dimensions[get_column_letter(i)].width = larguras.get(celula.value, 18)
    wb.save(caminho)


def main():
    df = pd.read_excel(ENTRADA)
    df = df[df["place_id"].notna()].copy()
    # Colunas extras sem nome que receberam comentários viram Comentário 31, 32...
    extras = [c for c in df.columns if str(c).startswith("Column ")]
    df = df.drop(columns=[c for c in extras if df[c].isna().all()])
    extras = [c for c in extras if c in df.columns]
    df = df.rename(columns={c: f"Comentário {30 + i}" for i, c in enumerate(extras, start=1)})

    colunas = [COL_FOTOS, COL_FOTOS_OK, COL_INSTA, COL_INSTA_OK, "atividade identificada", "resultado da triagem"]
    df[colunas] = pd.DataFrame(df["Comentário 1"].map(classifica).tolist(), index=df.index)

    triagem = df[[
        "place_id", "nome", "capital_endereco", "endereco", "grupo_categoria",
        "volume_avaliacoes", "link_google_maps", "site_ou_rede_social", "instagram_usuario",
        *colunas,
    ]].copy()
    eh_avaliacao = df["Comentário 1"].astype(str).str.match(PADRAO_AVALIACAO)
    triagem["anotação original"] = df["Comentário 1"].where(~eh_avaliacao, "(comentário de avaliação coletado)")
    triagem.to_excel(SAIDA_TRIAGEM, index=False, sheet_name="triagem")

    aprovadas = df[df["resultado da triagem"] == "aprovado"].drop(columns=colunas)
    # "luderia autentica" é marcação da triagem, não comentário de avaliação.
    aprovadas["Comentário 1"] = aprovadas["Comentário 1"].where(
        aprovadas["Comentário 1"].astype(str).str.strip().str.lower() != "luderia autentica"
    )
    aprovadas.to_excel(SAIDA_APROVADAS, index=False, sheet_name="aprovadas")

    larguras = {"nome": 34, "endereco": 40, "link_google_maps": 30, "site_ou_rede_social": 30,
                "atividade identificada": 34, "anotação original": 40}
    formata(SAIDA_TRIAGEM, larguras)
    formata(SAIDA_APROVADAS, {**larguras, **{f"Comentário {i}": 50 for i in range(1, 41)}})

    contagem = df["resultado da triagem"].value_counts()
    print(contagem.to_string())
    print(f"soma: {contagem.sum()} | total de linhas: {len(df)} | diferença: {len(df) - contagem.sum()}")
    print("\npor capital (aprovados):")
    print(aprovadas["capital_endereco"].value_counts().to_string())
    print(f"\n{SAIDA_TRIAGEM.relative_to(ROOT)}\n{SAIDA_APROVADAS.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
