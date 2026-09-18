"""
Bloco A - divide a planilha de curadoria e a de descartados pelos dois grupos
da REGIC 2018 (IBGE): Metrópoles (14 capitais) e Capitais Regionais (13).
Divisão extraída pelo autor em Metrópoles.md.

Cada place_id vai para um único grupo, pela capital da UF do seu endereço
(recorte_rm.py), nunca pela capital da busca que o encontrou. Quem não tem UF
identificável no endereço não entra em nenhum grupo e é listado no terminal;
a soma dos grupos mais esses casos tem de fechar com o total de cada arquivo.

Rodar depois de build_bloco_b_planilha.py. As saídas são derivadas: rodar de
novo sobrescreve as colunas manuais preenchidas nelas.

Saídas em _data/processed/[A] Estabelecimentos e cardapios/:
  bloco_b_planilha_curadoria_metropoles.csv
  bloco_b_planilha_curadoria_capitais_regionais.csv
  bloco_b_descartados_por_filtro_metropoles.csv
  bloco_b_descartados_por_filtro_capitais_regionais.csv

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/build_bloco_b_planilhas_regic.py"
"""
import csv
import pathlib

from analise_bloco_b_limiares import load_regic
from recorte_rm import classifica

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROCESSED = ROOT / "_data" / "processed" / "[A] Estabelecimentos e cardapios"
ENTRADAS = ["bloco_b_planilha_curadoria", "bloco_b_descartados_por_filtro"]
SUFIXO_GRUPO = {"Metrópoles": "metropoles", "Capitais Regionais": "capitais_regionais"}


def grupo_regic(endereco, regic):
    capital = classifica(endereco)["capital_referencia"]
    return regic[capital][0] if capital in regic else None


def main():
    regic = load_regic()
    for nome in ENTRADAS:
        with open(PROCESSED / f"{nome}.csv", newline="", encoding="utf-8") as f:
            leitor = csv.DictReader(f)
            colunas, linhas = leitor.fieldnames, list(leitor)

        por_grupo = {g: [] for g in SUFIXO_GRUPO}
        sem_grupo = []
        for r in linhas:
            g = grupo_regic(r["endereco"], regic)
            (por_grupo[g] if g else sem_grupo).append(r)

        # Fechamento: cada linha em um único grupo (CLAUDE.md).
        soma = sum(len(v) for v in por_grupo.values()) + len(sem_grupo)
        assert soma == len(linhas), f"{nome}: grupos {soma} != total {len(linhas)}"

        for g, sufixo in SUFIXO_GRUPO.items():
            out = PROCESSED / f"{nome}_{sufixo}.csv"
            with open(out, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=colunas)
                writer.writeheader()
                writer.writerows(por_grupo[g])
            print(f"OK: {len(por_grupo[g])} linhas em {out.name}")
        print(f"    {nome}: {len(sem_grupo)} sem UF no endereço, fora dos dois grupos")
        for r in sem_grupo:
            print(f"      - {r['nome']} | {r['endereco']}")


if __name__ == "__main__":
    main()
