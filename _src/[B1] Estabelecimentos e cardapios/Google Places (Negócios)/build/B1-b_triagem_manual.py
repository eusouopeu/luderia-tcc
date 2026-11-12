"""
Bloco B1 - separa a curadoria manual das metrópoles (mais de 100 avaliações) em
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

Revisões posteriores à anotação ficam em REVISOES (place_id -> nova anotação,
com data e motivo) e substituem a anotação original antes da classificação.


Cada place_id recebe um único resultado; a soma dos resultados fecha com o
total de linhas da entrada (conferido no terminal).

Luderias da repaginação (12/11/2026). A busca de setembro não paginava (ver
B1-c_places.py --repaginar); as casas novas aprovadas na triagem manual da
repaginação (3_triagem/B1_repaginacao_triagem.csv) e dentro do recorte entram
na planilha de aprovadas, com `origem` = "repaginacao", a partir dos detalhes
de _dados-brutos/estabelecimentos/B1_detalhes_repaginacao.jsonl
(B1-c_details.py --repaginadas). Campinas fica de fora até a decisão L24 (RM
que não é a de uma capital). A planilha de triagem original não muda.

Entrada (anotada à mão pelo autor):
  dados/[B1] Estabelecimentos e cardapios/_dados-brutos/
      B1_curadoria_manual_metropoles_mais_100_avaliacoes.xlsx
Saídas em dados/[B1] Estabelecimentos e cardapios/:
  estabelecimentos/3_triagem/B1_triagem_manual_metro_av100.xlsx
  estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/build/B1-b_triagem_manual.py"
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
import datetime
import importlib.util
import json
import pathlib
import re

import pandas as pd
from openpyxl.styles import Alignment, Font
from openpyxl.utils import get_column_letter

ROOT = pathlib.Path(__file__).resolve().parents[4]
RAW = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "_dados-brutos"
PROCESSED = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
ENTRADA = RAW / "B1_curadoria_manual_metropoles_mais_100_avaliacoes.xlsx"
CURADORIA = PROCESSED / "estabelecimentos/2_recorte/B1_curadoria_metro_f_av100.csv"
REPAGINACAO_TRIAGEM = PROCESSED / "estabelecimentos/3_triagem/B1_repaginacao_triagem.csv"
REPAGINACAO_DETALHES = RAW / "estabelecimentos/B1_detalhes_repaginacao.jsonl"
SAIDA_TRIAGEM = PROCESSED / "estabelecimentos/3_triagem/B1_triagem_manual_metro_av100.xlsx"
SAIDA_APROVADAS = PROCESSED / "estabelecimentos/3_triagem/B1_aprovadas_metro_av100.xlsx"

COL_FOTOS = "possui fotos no google maps?"
COL_FOTOS_OK = "fotos do google maps comprovam?"
COL_INSTA = "possui instagram?"
COL_INSTA_OK = "bio ou fotos do instagram comprovam?"
NA = "não se aplica"

# Comentário de avaliação coletado: começa por nota ou por idade ("1s ::", "5 ::").
PADRAO_AVALIACAO = re.compile(r"^\s*(\d+[hdsm]\s*::|\d)")
PREFIXO_FOTOS = re.compile(r"^\s*(fotos google|google fotos)\s*,\s*", re.I)
PREFIXO_INSTA = re.compile(r"^\s*instagram\s*,\s*", re.I)

# 10/10/2026: aprovados pelas fotos na primeira triagem; nova conferência das
# fotos deixou dúvida e o Instagram mostrou lojas de TCG, sem acervo para jogar.
LOJA_TCG = "instagram, loja de TCG"
REVISOES = {
    "ChIJA7jlA899mQARAEFLCN4b2oI": LOJA_TCG,  # Bolsa do Infinito (Rio de Janeiro)
    "ChIJO7xc2qZbzpQRfyZR6yK538I": LOJA_TCG,  # Polar Jogos (São Paulo)
    "ChIJRwi-IMcEFgcR2QL8OciGdQ0": LOJA_TCG,  # PlayGround Game Store (Salvador)
}


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


def corrige_nota(df):
    """Nota média vinda da curadoria em CSV, não da planilha anotada.

    Na planilha anotada à mão o Excel leu "4,6" como data (04/06/2026, formato
    "d.m"); só notas inteiras ficaram como número. A nota volta da curadoria
    (B1_curadoria_metro_f_av100.csv) pelo place_id; sem par, a data é desfeita
    em dia + mês/10.
    """
    curadoria = pd.read_csv(CURADORIA, usecols=["place_id", "avaliacao_media"])
    nota = df["place_id"].map(curadoria.drop_duplicates("place_id").set_index("place_id")["avaliacao_media"])

    def desfaz_data(valor):
        if isinstance(valor, (pd.Timestamp, datetime.datetime)):
            return valor.day + valor.month / 10
        return pd.to_numeric(valor, errors="coerce")

    sem_par = nota.isna()
    nota[sem_par] = df.loc[sem_par, "avaliacao_media"].map(desfaz_data)
    print(f"nota média: {int((~sem_par).sum())} da curadoria em CSV, {int(sem_par.sum())} desfeitas da data")
    return nota.astype(float).round(1)


def linhas_repaginadas():
    """Aprovadas da repaginação no recorte, nas colunas da planilha de aprovadas."""
    from recorte_rm import classifica

    # Regras de grupo de categoria e de @ do Instagram: as mesmas do B1-b_planilha.py.
    spec = importlib.util.spec_from_file_location("planilha", pathlib.Path(__file__).with_name("B1-b_planilha.py"))
    planilha = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(planilha)

    with open(REPAGINACAO_TRIAGEM, newline="", encoding="utf-8") as f:
        ids = [r["place_id"] for r in csv.DictReader(f)
               if r["resultado_triagem"] == "aprovado" and r["grupo"] != "Campinas"]
    detalhes = {}
    with open(REPAGINACAO_DETALHES, encoding="utf-8") as f:
        for linha in f:
            if linha.strip():
                d = json.loads(linha)
                detalhes[d["id"]] = d
    faltam = [i for i in ids if i not in detalhes]
    assert not faltam, f"sem detalhes (rodar B1-c_details.py --repaginadas): {faltam}"
    linhas = []
    for pid in ids:
        d = detalhes[pid]
        c = classifica(d["formattedAddress"])
        assert c["situacao"] in ("municipio_da_capital", "dentro_da_rm"), (pid, c)
        linhas.append({
            "place_id": pid, "nome": d["displayName"]["text"], "endereco": d["formattedAddress"],
            "capital_endereco": c["capital_referencia"], "origem": "repaginacao", "match_tipo": "",
            "grupo_categoria": planilha.grupo_categoria(d), "categorias_google": ";".join(d.get("types", [])),
            "avaliacao_media": d.get("rating"), "volume_avaliacoes": d.get("userRatingCount") or 0,
            "status_google": d.get("businessStatus", ""), "site_ou_rede_social": d.get("websiteUri"),
            "instagram_usuario": planilha.instagram_usuario(d.get("websiteUri")),
            "telefone": d.get("internationalPhoneNumber"), "link_google_maps": d.get("googleMapsUri"),
            "data_coleta": d.get("data_coleta", ""),
        })
    return pd.DataFrame(linhas)


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
    df["avaliacao_media"] = corrige_nota(df)
    # Colunas extras sem nome que receberam comentários viram Comentário 31, 32...
    extras = [c for c in df.columns if str(c).startswith("Column ")]
    df = df.drop(columns=[c for c in extras if df[c].isna().all()])
    extras = [c for c in extras if c in df.columns]
    df = df.rename(columns={c: f"Comentário {30 + i}" for i, c in enumerate(extras, start=1)})
    revisados = df["place_id"].isin(REVISOES)
    df.loc[revisados, "Comentário 1"] = df.loc[revisados, "place_id"].map(REVISOES)
    print(f"anotações revisadas: {int(revisados.sum())} de {len(REVISOES)}")

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
    n_triagem = len(aprovadas)
    aprovadas = pd.concat([aprovadas, linhas_repaginadas()], ignore_index=True)
    assert aprovadas["place_id"].is_unique
    print(f"aprovadas: {n_triagem} da triagem original + {len(aprovadas) - n_triagem} da repaginação = {len(aprovadas)}")
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
