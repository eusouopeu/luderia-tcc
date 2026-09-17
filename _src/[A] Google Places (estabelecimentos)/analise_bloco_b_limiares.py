"""
Bloco A - análise de sensibilidade do recorte: quantos candidatos da planilha
de curadoria passam em cada limiar de volume de avaliações, por capital. A
curadoria já está no recorte da região metropolitana da capital (recorte_rm.py). Serve
para escolher o limiar pela distribuição, e não antes de ver os dados.

Também mede quantos estabelecimentos da lista manual do autor (Rio de Janeiro)
a busca automática encontrou: primeira estimativa de cobertura.

Saídas em _data/processed/[A] Estabelecimentos e cardapios/:
  bloco_b_limiares_avaliacoes.csv - capital (UF do endereço) x limiar (total e só ativos),
      com a coluna REGIC e as capitais agrupadas em Metrópoles e Capitais
      Regionais; a linha de cada grupo, acima das suas capitais, é a soma delas
  bloco_b_cobertura_lista_manual.csv - item da lista manual x encontrado

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/analise_bloco_b_limiares.py"
"""
import csv
import pathlib
import unicodedata
from collections import defaultdict

from recorte_rm import classifica, no_recorte

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios"
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
CURADORIA_PATH = PROCESSED / "bloco_b_planilha_curadoria.csv"
DESCARTADOS_PATH = PROCESSED / "bloco_b_descartados_por_filtro.csv"
CANDIDATOS_PATH = RAW / "bloco_b_candidatos.csv"
LISTA_MANUAL_PATH = RAW / "bloco_b_lista_manual_rj.csv"
REGIC_PATH = RAW / "Metrópoles.md"
OUT_LIMIARES = PROCESSED / "bloco_b_limiares_avaliacoes.csv"
OUT_COBERTURA = PROCESSED / "bloco_b_cobertura_lista_manual.csv"

LIMIARES = [0, 10, 20, 30, 50, 100]

# Grupos da pesquisa (REGIC 2018, IBGE), na ordem da tabela.
GRUPOS_REGIC = ["Metrópoles", "Capitais Regionais"]
# Metrópoles.md traz os níveis no plural; a coluna REGIC usa o singular.
NIVEL_SINGULAR = {
    "Grande Metrópole Nacional": "Grande Metrópole Nacional",
    "Metrópoles Nacionais": "Metrópole Nacional",
    "Metrópoles": "Metrópole",
    "Capitais Regionais A": "Capital Regional A",
    "Capitais Regionais B": "Capital Regional B",
    "Capitais Regionais C": "Capital Regional C",
}


def load_regic():
    """Lê Metrópoles.md (divisão extraída pelo autor da REGIC 2018): '# ' é o
    grupo, '## ' o nível, '- ' a capital. Devolve capital -> (grupo, nível)."""
    regic, grupo, nivel = {}, None, None
    for linha in REGIC_PATH.read_text(encoding="utf-8").splitlines():
        linha = linha.strip()
        if linha.startswith("## "):
            nivel = NIVEL_SINGULAR[linha[3:].strip()]
        elif linha.startswith("# "):
            grupo = linha[2:].strip()
            assert grupo in GRUPOS_REGIC, grupo
        elif linha.startswith("- "):
            regic[linha[2:].strip()] = (grupo, nivel)
    return regic


def normaliza(texto):
    sem_acento = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode("ascii")
    return "".join(ch for ch in sem_acento.lower() if ch.isalnum())


def capital_do_endereco(r):
    """Capital da UF do endereço (recorte_rm.py). A capital da busca não serve
    para contar: a busca por termo x capital devolve casas de outros estados,
    e 61 candidatos foram achados em mais de uma capital (um deles em 21), o
    que fazia a soma das capitais passar do total."""
    return classifica(r["endereco"])["capital_referencia"] or "sem_capital"


def limiares():
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))

    contagem = defaultdict(lambda: defaultdict(int))
    total = defaultdict(int)
    for r in linhas:
        # A curadoria já vem no recorte da RM (build_bloco_b_planilha.py).
        assert no_recorte(r["endereco"]), f"fora do recorte da RM: {r['nome']}"
        volume = int(float(r["volume_avaliacoes"] or 0))
        # Cada place_id conta uma vez, na capital da UF do seu endereço; assim
        # a soma das capitais fecha com o total.
        for alvo in (contagem[capital_do_endereco(r)], total):
            for lim in LIMIARES:
                if volume >= lim:
                    alvo[f"min_{lim}"] += 1
                    if r["ativo_6m"] == "sim":
                        alvo[f"min_{lim}_ativos"] += 1

    regic = load_regic()
    sem_regic = set(contagem) - set(regic)
    assert not sem_regic, f"capitais sem classificação REGIC: {sem_regic}"

    metricas = [c for lim in LIMIARES for c in (f"min_{lim}", f"min_{lim}_ativos")]
    colunas = ["capital", "REGIC"] + metricas
    saida = []
    for grupo in GRUPOS_REGIC:
        capitais = sorted(c for c, (g, _) in regic.items() if g == grupo)
        soma = {m: sum(contagem[c].get(m, 0) for c in capitais) for m in metricas}
        saida.append({"capital": grupo, "REGIC": "", **soma})
        saida += [
            {"capital": c, "REGIC": regic[c][1], **{m: contagem[c].get(m, 0) for m in metricas}}
            for c in capitais
        ]
    linha_total = {"capital": "TOTAL_UNICOS", "REGIC": "", **{m: total.get(m, 0) for m in metricas}}

    # Fechamento: a soma dos grupos tem de dar o total de únicos (CLAUDE.md).
    for m in metricas:
        soma_grupos = sum(r[m] for r in saida if r["capital"] in GRUPOS_REGIC)
        assert soma_grupos == linha_total[m], f"{m}: grupos {soma_grupos} != total {linha_total[m]}"

    with open(OUT_LIMIARES, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=colunas)
        writer.writeheader()
        writer.writerows(saida)
        writer.writerow(linha_total)
    print(f"OK: {OUT_LIMIARES.name} - soma dos grupos confere com o total")


def cobertura():
    """Compara a lista manual com o que a busca devolveu, por place_id e, na
    falta dele, por nome normalizado contido no nome do candidato."""
    with open(CANDIDATOS_PATH, newline="", encoding="utf-8") as f:
        candidatos = {r["place_id"]: r["nome"] for r in csv.DictReader(f)}
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        na_curadoria = {r["place_id"] for r in csv.DictReader(f) if r["origem"] != "lista_manual"}
    with open(LISTA_MANUAL_PATH, newline="", encoding="utf-8") as f:
        lista = list(csv.DictReader(f))

    saida = []
    for item in lista:
        pid = item["place_id"]
        if not pid:
            alvo = normaliza(item["nome"])
            pid = next((p for p, n in candidatos.items() if alvo and alvo in normaliza(n)), "")
        saida.append(
            {
                "nome": item["nome"],
                "municipio": item["municipio"],
                "encontrado_na_busca": "sim" if pid in candidatos else "nao",
                "aprovado_filtro_automatico": "sim" if pid in na_curadoria else "nao",
                "place_id": pid,
            }
        )

    with open(OUT_COBERTURA, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(saida[0]))
        writer.writeheader()
        writer.writerows(saida)
    achados = sum(s["encontrado_na_busca"] == "sim" for s in saida)
    aprovados = sum(s["aprovado_filtro_automatico"] == "sim" for s in saida)
    print(f"OK: {OUT_COBERTURA.name} - lista manual: {len(saida)}; achados na busca: {achados}; aprovados no filtro: {aprovados}")


if __name__ == "__main__":
    limiares()
    cobertura()
