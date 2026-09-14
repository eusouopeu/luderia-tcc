"""
Bloco A - base de sorteio para a amostra que define os limiares do recorte
(mínimo de avaliações no Maps e de publicações no Instagram).

bloco_b_candidatos.csv tem uma linha por combinação capital x termo de busca:
a mesma casa aparece várias vezes. Sortear linhas daria mais chance às casas
encontradas por mais termos. Esta base tem uma linha por place_id.

Decisões:
  - Só endereços no Brasil.
  - Município e UF extraídos do endereço, não da capital da busca (a busca
    "board game em Boa Vista" também devolve casas do Rio de Janeiro).
  - O volume de avaliações NÃO entra na base: a checagem das fotos deve ser
    feita sem saber quantas avaliações a casa tem, para não enviesar o juízo.
  - Número aleatório com semente fixa: ordenar por ele dentro de cada estrato
    dá a ordem do sorteio, reproduzível.

Saída: _data/processed/[A] Estabelecimentos e cardapios/bloco_b_base_amostragem.xlsx

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/build_bloco_b_base_amostragem.py"
"""
import csv
import pathlib
import random
import re
import unicodedata
from collections import defaultdict
from urllib.parse import quote

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, Side
from openpyxl.utils import get_column_letter

ROOT = pathlib.Path(__file__).resolve().parents[2]
CANDIDATOS_PATH = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios" / "bloco_b_candidatos.csv"
RESUMO_CAPITAIS_PATH = ROOT / "_data" / "processed" / "[E] Bases publicas" / "bases_ibge_resumo_capitais.csv"
OUT_PATH = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios" / "bloco_b_base_amostragem.xlsx"

SEMENTE = 20260914

# "..., Rio de Janeiro - RJ, 22271-041, Brazil" ou "..., Goiânia, GO, 74595-331, Brasil"
RE_MUNICIPIO = [
    re.compile(r",\s*([^,]+?)\s+-\s+([A-Z]{2})(?:,|\s*$)"),
    re.compile(r"(?:^|[,-])\s*([^,\-]+?),\s*([A-Z]{2}),\s*\d{5}-?\d{3}"),
]

COLUNAS = [
    ("numero_aleatorio", "Número aleatório", 14),
    ("place_id", "place_id", 30),
    ("nome", "Nome", 40),
    ("municipio", "Município", 22),
    ("uf", "UF", 6),
    ("capital", "É capital?", 10),
    ("endereco", "Endereço", 60),
    ("capitais_busca", "Capitais da busca", 28),
    ("n_termos", "Nº de termos que acharam", 12),
    ("link_maps", "Link do Google Maps", 40),
    # Colunas de registro, preenchidas à mão durante a amostragem.
    ("fotos_jogo", "Fotos de jogo (sim/não/inconclusivo)", 18),
    ("avaliacoes_maps", "Avaliações no Maps", 12),
    ("instagram", "Instagram (usuário)", 22),
    ("publicacoes_instagram", "Publicações no Instagram", 12),
    ("ultima_publicacao", "Data da última publicação", 14),
    ("observacao", "Observação", 40),
]


def normaliza(texto):
    sem_acento = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode("ascii")
    return sem_acento.lower().strip()


def municipio_uf(endereco):
    for regex in RE_MUNICIPIO:
        achados = regex.findall(endereco or "")
        if achados:
            municipio, uf = achados[-1]
            return municipio.strip(), uf
    return "", ""


def load_capitais():
    with open(RESUMO_CAPITAIS_PATH, newline="", encoding="utf-8") as f:
        return {(normaliza(r["capital"]), r["uf"]) for r in csv.DictReader(f)}


def main():
    capitais = load_capitais()
    casas = {}
    capitais_busca = defaultdict(set)
    termos = defaultdict(set)
    with open(CANDIDATOS_PATH, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            pid = r["place_id"]
            if not pid:
                continue
            casas.setdefault(pid, r)
            capitais_busca[pid].add(r["capital_busca"])
            termos[pid].add(r["termo_busca"])

    rng = random.Random(SEMENTE)
    linhas = []
    # Ordem estável antes de sortear: o número aleatório de cada casa não
    # depende da ordem das linhas no CSV.
    for pid in sorted(casas):
        r = casas[pid]
        endereco = (r["endereco"] or "").strip()
        numero = rng.random()
        if not normaliza(endereco).endswith(("brazil", "brasil")):
            continue
        municipio, uf = municipio_uf(endereco)
        linhas.append(
            {
                "numero_aleatorio": round(numero, 6),
                "place_id": pid,
                "nome": r["nome"],
                "municipio": municipio,
                "uf": uf,
                "capital": "sim" if (normaliza(municipio), uf) in capitais else "não",
                "endereco": endereco,
                "capitais_busca": "; ".join(sorted(capitais_busca[pid])),
                "n_termos": len(termos[pid]),
                "link_maps": (
                    "https://www.google.com/maps/search/?api=1"
                    f"&query={quote(r['nome'] or '')}&query_place_id={pid}"
                ),
            }
        )
    linhas.sort(key=lambda x: (x["uf"], x["municipio"], x["nome"] or ""))

    wb = Workbook()
    ws = wb.active
    ws.title = "Base de sorteio"
    fonte = Font(name="Arial", size=10, color="000000")
    negrito = Font(name="Arial", size=10, color="000000", bold=True)
    fina = Side(style="thin", color="000000")

    ws.cell(row=1, column=1, value="Base de sorteio do Bloco A: uma linha por estabelecimento candidato").font = negrito
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(COLUNAS))
    ws.cell(row=1, column=1).alignment = Alignment(horizontal="center")

    for j, (_, rotulo, largura) in enumerate(COLUNAS, start=1):
        c = ws.cell(row=2, column=j, value=rotulo)
        c.font = negrito
        c.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        c.border = Border(top=fina, bottom=fina)
        ws.column_dimensions[get_column_letter(j)].width = largura

    numericas = {"numero_aleatorio", "n_termos", "avaliacoes_maps", "publicacoes_instagram"}
    for i, linha in enumerate(linhas, start=3):
        ultima = i == len(linhas) + 2
        for j, (chave, _, _) in enumerate(COLUNAS, start=1):
            c = ws.cell(row=i, column=j, value=linha.get(chave))
            c.font = fonte
            c.alignment = Alignment(horizontal="right" if chave in numericas else "left")
            if chave == "numero_aleatorio":
                c.number_format = "0.000000"
            if chave == "link_maps":
                c.hyperlink = linha["link_maps"]
            if ultima:
                c.border = Border(bottom=fina)

    ws.freeze_panes = "C3"
    ws.auto_filter.ref = f"A2:{get_column_letter(len(COLUNAS))}{len(linhas) + 2}"
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT_PATH)

    sem_municipio = sum(not l["municipio"] for l in linhas)
    n_capital = sum(l["capital"] == "sim" for l in linhas)
    print(f"OK: {len(linhas)} estabelecimentos únicos no Brasil ({n_capital} em capitais) em {OUT_PATH.name}")
    print(f"    {len(casas) - len(linhas)} fora do Brasil excluídos; {sem_municipio} sem município identificado")


if __name__ == "__main__":
    main()
