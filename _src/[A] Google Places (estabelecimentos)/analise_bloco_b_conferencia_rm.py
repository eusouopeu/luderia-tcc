"""
Bloco A - conferência: os estabelecimentos da planilha de curadoria ficam na
região metropolitana (RM) da capital do seu estado?

Só confere; não altera nenhuma tabela. Serve para decidir o recorte
geográfico da tabela de limiares (UF inteira, RM da capital ou só o município
da capital).

Regras:
  - Município e UF saem do endereço do Google (municipio_uf, o mesmo parser da
    base de amostragem).
  - A RM de cada capital é a categoria metropolitana do IBGE que contém o
    município da capital (Composição dos Recortes Metropolitanos, situação
    2025). Todas as subcategorias contam (núcleo, área de expansão,
    sub-regiões).
  - Brasília e Teresina não têm RM, e sim RIDE (Região Integrada de
    Desenvolvimento); a RIDE faz o papel da RM e pode incluir municípios de
    outra UF (ex.: Timon-MA na RIDE da Grande Teresina). A capital de
    referência vem da UF do endereço, então uma casa em Timon seria conferida
    contra São Luís e sairia "fora_da_rm"; na curadoria de 16/09/2026 não há
    nenhum caso assim.
  - Rio Branco não integra recorte metropolitano no arquivo do IBGE: a "RM"
    se reduz ao próprio município.

Fonte: IBGE, Composicao_RM_2025.xlsx, baixado em 16/09/2026 de
geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/
municipios_por_regioes_metropolitanas/Situacao_2020a2029/

Saída em _data/processed/[A] Estabelecimentos e cardapios/:
  bloco_b_conferencia_rm.csv - uma linha por estabelecimento, com município,
                               capital de referência e situação

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/analise_bloco_b_conferencia_rm.py"
"""
import csv
import pathlib
import re
import unicodedata
from collections import Counter, defaultdict

from openpyxl import load_workbook

from analise_bloco_b_limiares import CAPITAL_POR_UF, UF_POR_NOME, capital_do_endereco
from build_bloco_b_base_amostragem import municipio_uf

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
CURADORIA_PATH = PROCESSED / "bloco_b_planilha_curadoria.csv"
RM_PATH = ROOT / "_data" / "raw" / "[E] Bases publicas" / "ibge_rm" / "Composicao_RM_2025.xlsx"
OUT_PATH = PROCESSED / "bloco_b_conferencia_rm.csv"

# "Pituaçu, Salvador - Bahia, 41741-170, Brazil": UF por extenso, que o
# parser da base de amostragem não lê.
RE_UF_POR_EXTENSO = re.compile(r"([^,]+?)\s+-\s+([^,\d]+?),\s*\d{5}-?\d{3},\s*Bra[sz]il$")

# Abreviações que o Google usa no nome do município.
ABREVIACOES = [(r"\bsra\b\.?", "senhora"), (r"\bsto\b\.?", "santo"), (r"\bsta\b\.?", "santa")]

COLUNAS = [
    "place_id", "nome", "endereco", "municipio", "uf", "capital_referencia",
    "recorte_ibge", "situacao",
]


def normaliza(texto):
    t = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode("ascii").lower()
    for padrao, troca in ABREVIACOES:
        t = re.sub(padrao, troca, t)
    return re.sub(r"[^a-z0-9]", "", t)


def load_rms():
    """Capital -> (nome do recorte, conjunto de (município, UF) normalizados)."""
    ws = load_workbook(RM_PATH, read_only=True).worksheets[0]
    linhas = ws.iter_rows(values_only=True)
    cab = next(linhas)
    idx = {c: i for i, c in enumerate(cab)}
    por_categoria = defaultdict(set)
    for r in linhas:
        if r[idx["COD_CATMETROPOL"]] is None:
            continue
        por_categoria[r[idx["NOME_CATMETROPOL"]]].add(
            (normaliza(r[idx["NOME_MUN"]]), r[idx["SIGLA_UF"]])
        )
    rms = {}
    for uf, capital in CAPITAL_POR_UF.items():
        chave = (normaliza(capital), uf)
        cats = [c for c, muns in por_categoria.items() if chave in muns]
        assert len(cats) <= 1, (capital, cats)
        rms[capital] = (cats[0], por_categoria[cats[0]]) if cats else ("sem recorte", {chave})
    return rms


def main():
    rms = load_rms()
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))

    saida = []
    for r in linhas:
        municipio, uf = municipio_uf(r["endereco"])
        if not municipio:
            m = RE_UF_POR_EXTENSO.search(r["endereco"] or "")
            if m and normaliza(m.group(2)) in UF_POR_NOME:
                municipio, uf = m.group(1).strip(), UF_POR_NOME[normaliza(m.group(2))]
        capital = capital_do_endereco(r)
        recorte, muns = rms.get(capital, ("", set()))
        chave = (normaliza(municipio), uf)
        if not municipio:
            situacao = "sem_municipio_no_endereco"
        elif chave == (normaliza(capital), next(u for u, c in CAPITAL_POR_UF.items() if c == capital)):
            situacao = "municipio_da_capital"
        elif chave in muns:
            situacao = "dentro_da_rm"
        else:
            situacao = "fora_da_rm"
        saida.append({
            "place_id": r["place_id"], "nome": r["nome"], "endereco": r["endereco"],
            "municipio": municipio, "uf": uf, "capital_referencia": capital,
            "recorte_ibge": recorte, "situacao": situacao,
        })

    ordem = ["sem_municipio_no_endereco", "fora_da_rm", "dentro_da_rm", "municipio_da_capital"]
    saida.sort(key=lambda s: (ordem.index(s["situacao"]), s["capital_referencia"], s["municipio"]))
    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUNAS)
        writer.writeheader()
        writer.writerows(saida)

    contagem = Counter(s["situacao"] for s in saida)
    assert sum(contagem.values()) == len(linhas)
    print(f"OK: {OUT_PATH.name} - {len(linhas)} estabelecimentos: {dict(contagem)}")


if __name__ == "__main__":
    main()
