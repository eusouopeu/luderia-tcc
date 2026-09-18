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

Saídas em _data/processed/[A] Estabelecimentos e cardapios/:
  bloco_b_termos_suspeitos.csv - condição x planilha
  bloco_b_planilha_curadoria_metropoles_filtrada.csv e
  bloco_b_planilha_curadoria_capitais_regionais_filtrada.csv - curadoria do
      grupo sem as linhas com algum termo suspeito no nome ("store" e loja de
      departamento não tiram a linha). A coluna capital_busca é trocada por
      capital_endereco: a capital da UF do endereço.
  bloco_b_planilha_curadoria_metropoles_filtrada_mais_100_avaliacoes.csv -
      curadoria filtrada das metrópoles só com volume de avaliações > 100.

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/analise_bloco_b_termos_suspeitos.py"
"""
import csv
import pathlib
import unicodedata

from recorte_rm import classifica

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
OUT_PATH = PROCESSED / "bloco_b_termos_suspeitos.csv"
# Grupo REGIC -> planilha filtrada gerada a partir da curadoria dele.
FILTRADAS = {
    "metropoles": PROCESSED / "bloco_b_planilha_curadoria_metropoles_filtrada.csv",
    "capitais_regionais": PROCESSED / "bloco_b_planilha_curadoria_capitais_regionais_filtrada.csv",
}
OUT_METROPOLES_100_PATH = PROCESSED / "bloco_b_planilha_curadoria_metropoles_filtrada_mais_100_avaliacoes.csv"
MINIMO_AVALIACOES = 100  # estritamente maior que

PLANILHAS = {
    "curadoria_metropoles": "bloco_b_planilha_curadoria_metropoles.csv",
    "curadoria_capitais_regionais": "bloco_b_planilha_curadoria_capitais_regionais.csv",
    "descartados_metropoles": "bloco_b_descartados_por_filtro_metropoles.csv",
    "descartados_capitais_regionais": "bloco_b_descartados_por_filtro_capitais_regionais.csv",
}
# Termo -> grafias que contam para ele. Grafias que já contêm o termo (ex.:
# "brinquedos" contém "brinquedo") entram por clareza, sem mudar a contagem.
TERMOS = {
    "assistência": ["assistência"],
    "técnica": ["técnica"],
    "eletrônico": ["eletrônico"],
    "aluguel": ["aluguel"],
    "brinquedo": ["brinquedo", "brinquedos", "brinquedoteca", "brinquedoteka"],
    "locação": ["locação"],
    "TCG": ["TCG"],
    "Trading Cards": ["Trading Cards"],
    "store": ["store"],
    "video games": ["video games"],
    "informática": ["informática"],
    "imports": ["imports"],
    "fisio": ["fisio"],
    "fisioterapia": ["fisioterapia"],
    "atacado": ["atacado", "atacadista", "atacadão"],
}
# Condições que não tiram a linha das planilhas filtradas.
MANTIDAS_NO_FILTRO = {"tipo: loja de departamento", "termo: store"}
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
    achadas += [
        f"termo: {t}" for t, grafias in TERMOS.items()
        if any(normaliza(g) in nome for g in grafias)
    ]
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
    for grupo, out_path in FILTRADAS.items():
        filtra(PROCESSED / PLANILHAS[f"curadoria_{grupo}"], out_path)
    filtra_volume(FILTRADAS["metropoles"], OUT_METROPOLES_100_PATH)


def filtra_volume(entrada, out_path):
    with open(entrada, newline="", encoding="utf-8") as f:
        leitor = csv.DictReader(f)
        colunas, linhas = leitor.fieldnames, list(leitor)
    mantidas = [r for r in linhas if int(float(r["volume_avaliacoes"] or 0)) > MINIMO_AVALIACOES]
    mantidas.sort(key=lambda r: (r["capital_endereco"], -int(float(r["volume_avaliacoes"]))))
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=colunas)
        writer.writeheader()
        writer.writerows(mantidas)
    print(f"OK: {out_path.name} - {len(mantidas)} de {len(linhas)} com mais de {MINIMO_AVALIACOES} avaliações")


def filtra(entrada, out_path):
    with open(entrada, newline="", encoding="utf-8") as f:
        leitor = csv.DictReader(f)
        colunas, linhas = leitor.fieldnames, list(leitor)
    colunas = ["capital_endereco" if c == "capital_busca" else c for c in colunas]
    mantidas, retiradas = [], 0
    for r in linhas:
        if set(condicoes(r)) - MANTIDAS_NO_FILTRO:
            retiradas += 1
            continue
        r = {("capital_endereco" if c == "capital_busca" else c): v for c, v in r.items()}
        r["capital_endereco"] = classifica(r["endereco"])["capital_referencia"]
        mantidas.append(r)
    assert len(mantidas) + retiradas == len(linhas)
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=colunas)
        writer.writeheader()
        writer.writerows(mantidas)
    print(f"OK: {out_path.name} - {len(mantidas)} mantidas, {retiradas} retiradas de {len(linhas)}")


if __name__ == "__main__":
    main()
