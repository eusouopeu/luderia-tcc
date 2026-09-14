"""
Bloco A - análise de sensibilidade do recorte: quantos candidatos da planilha
de curadoria passam em cada limiar de volume de avaliações, por capital. Serve
para escolher o limiar pela distribuição, e não antes de ver os dados.

Também mede quantos estabelecimentos da lista manual do autor (Rio de Janeiro)
a busca automática encontrou: primeira estimativa de cobertura.

Saídas em _data/processed/[A] Estabelecimentos e cardapios/:
  bloco_b_limiares_avaliacoes.csv - capital x limiar (total e só ativos)
  bloco_b_cobertura_lista_manual.csv - item da lista manual x encontrado

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/analise_bloco_b_limiares.py"
"""
import csv
import pathlib
import unicodedata
from collections import defaultdict

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios"
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
CURADORIA_PATH = PROCESSED / "bloco_b_planilha_curadoria.csv"
DESCARTADOS_PATH = PROCESSED / "bloco_b_descartados_por_filtro.csv"
CANDIDATOS_PATH = RAW / "bloco_b_candidatos.csv"
LISTA_MANUAL_PATH = RAW / "bloco_b_lista_manual_rj.csv"
OUT_LIMIARES = PROCESSED / "bloco_b_limiares_avaliacoes.csv"
OUT_COBERTURA = PROCESSED / "bloco_b_cobertura_lista_manual.csv"

LIMIARES = [0, 10, 20, 30, 50, 100]


def normaliza(texto):
    sem_acento = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode("ascii")
    return "".join(ch for ch in sem_acento.lower() if ch.isalnum())


def limiares():
    with open(CURADORIA_PATH, newline="", encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))

    contagem = defaultdict(lambda: defaultdict(int))
    total = defaultdict(int)
    for r in linhas:
        volume = int(float(r["volume_avaliacoes"] or 0))
        # Candidato achado por buscas em várias capitais conta em cada uma;
        # o TOTAL conta cada place_id uma vez só.
        for alvo in [contagem[c] for c in (r["capital_busca"] or "sem_capital").split(";")] + [total]:
            for lim in LIMIARES:
                if volume >= lim:
                    alvo[f"min_{lim}"] += 1
                    if r["ativo_6m"] == "sim":
                        alvo[f"min_{lim}_ativos"] += 1

    colunas = ["capital"] + [c for lim in LIMIARES for c in (f"min_{lim}", f"min_{lim}_ativos")]
    with open(OUT_LIMIARES, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=colunas)
        writer.writeheader()
        for capital in sorted(contagem):
            writer.writerow({"capital": capital, **{c: contagem[capital].get(c, 0) for c in colunas[1:]}})
        writer.writerow({"capital": "TOTAL_UNICOS", **{c: total.get(c, 0) for c in colunas[1:]}})
    print(f"OK: {OUT_LIMIARES.name}")


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
