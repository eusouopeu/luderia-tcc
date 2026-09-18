"""
Bloco A - conta, nas planilhas de curadoria e de descartados de cada grupo
REGIC (build_bloco_b_planilhas_regic.py), quantos estabelecimentos têm sinais
de que não são espaço de jogo: categoria do Google `department_store` (loja
de departamento) ou termo suspeito no nome. Serve para decidir quais termos
viram regra de exclusão no filtro automático.

Os termos são buscados só no nome, sem diferenciar maiúsculas nem acentos, e
como trecho do nome (ex.: "eletronico" acha "Eletrônicos"; "fisio" acha
"Fisioterapia"). A contagem por termo não é exclusiva: um nome com dois
termos conta nos dois. A linha "qualquer condição" conta cada place_id uma vez.

Saída: _data/processed/[A] Estabelecimentos e cardapios/bloco_b_termos_suspeitos.csv

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/analise_bloco_b_termos_suspeitos.py"
"""
import csv
import pathlib
import unicodedata

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
OUT_PATH = PROCESSED / "bloco_b_termos_suspeitos.csv"

PLANILHAS = {
    "curadoria_metropoles": "bloco_b_planilha_curadoria_metropoles.csv",
    "curadoria_capitais_regionais": "bloco_b_planilha_curadoria_capitais_regionais.csv",
    "descartados_metropoles": "bloco_b_descartados_por_filtro_metropoles.csv",
    "descartados_capitais_regionais": "bloco_b_descartados_por_filtro_capitais_regionais.csv",
}
TERMOS = [
    "assistência", "técnica", "eletrônico", "aluguel", "brinquedo", "locação",
    "TCG", "Trading Cards", "store", "video games", "informática", "imports",
    "fisio", "fisioterapia", "atacado",
]
TIPO_LOJA_DEPARTAMENTO = "department_store"


def normaliza(texto):
    sem_acento = unicodedata.normalize("NFKD", texto or "").encode("ascii", "ignore").decode("ascii")
    return " ".join(sem_acento.lower().split())


def condicoes(r):
    """Lista das condições que a linha cumpre."""
    achadas = []
    if TIPO_LOJA_DEPARTAMENTO in r["categorias_google"].split(";"):
        achadas.append("tipo: loja de departamento")
    nome = normaliza(r["nome"])
    achadas += [f"termo: {t}" for t in TERMOS if normaliza(t) in nome]
    return achadas


def main():
    rotulos = ["tipo: loja de departamento"] + [f"termo: {t}" for t in TERMOS]
    contagem = {p: dict.fromkeys(rotulos + ["qualquer condição", "total_da_planilha"], 0) for p in PLANILHAS}
    for chave, arquivo in PLANILHAS.items():
        with open(PROCESSED / arquivo, newline="", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                achadas = condicoes(r)
                for c in achadas:
                    contagem[chave][c] += 1
                contagem[chave]["qualquer condição"] += bool(achadas)
                contagem[chave]["total_da_planilha"] += 1

    with open(OUT_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["condicao"] + list(PLANILHAS))
        for rotulo in rotulos + ["qualquer condição", "total_da_planilha"]:
            writer.writerow([rotulo] + [contagem[p][rotulo] for p in PLANILHAS])
    print(f"OK: {OUT_PATH.name}")


if __name__ == "__main__":
    main()
