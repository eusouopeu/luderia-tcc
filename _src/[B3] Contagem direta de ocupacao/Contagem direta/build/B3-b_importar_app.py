"""
Bloco B3 - consolida as exportações do app de observação (_src/app-observacao/)
de cada observador numa tabela única por conteúdo, entrada do B3-a_contagem.py.

Cada visita tem dois observadores simultâneos (POV1 e POV2), para que um cubra
as lacunas do outro. Os CSVs exportados pelo app ficam intactos em:
  dados/[B3] Contagem direta de ocupacao/_dados-brutos/app/originais/<visita_id>/<observador>/
    AAAA-MM-DD_SJ<unidade>_<observador>_contagem_<conteúdo>.csv
com <visita_id> = AAAA-MM-DD_SJ<unidade> (ex.: 2026-10-10_SJBV).

Saída em `_dados-brutos/app/`: um contagem_<conteúdo>.csv por conteúdo, com as
colunas `visita_id` e `observador` à frente das do app.

Regras:
  - `unidade` vem do nome da pasta da visita (SJBV → BV), não do campo digitado
    no app (o POV2 de 10/10 digitou "BV 10.10").
  - Tabelas de um observador listadas em outros/B3_descartes_app.csv saem da
    consolidação, com o motivo registrado ali; os originais continuam guardados.
  - Nenhum valor é editado. A média entre observadores é feita na análise.
Uso: python3 "_src/[B3] Contagem direta de ocupacao/Contagem direta/build/B3-b_importar_app.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
APP = ROOT / "dados" / "[B3] Contagem direta de ocupacao" / "_dados-brutos" / "app"
ORIGINAIS = APP / "originais"
DESCARTES = _AQUI.parents[1] / "outros" / "B3_descartes_app.csv"
PADRAO = re.compile(r"^\d{4}-\d{2}-\d{2}_SJ(?P<unidade>[A-Z]+)_(?P<obs>POV\d)_contagem_(?P<conteudo>\w+)\.csv$")


def main():
    descartes = pd.read_csv(DESCARTES, sep=";", encoding="utf-8-sig", dtype=str)
    descartar = set(zip(descartes["visita_id"], descartes["observador"], descartes["tabela"]))

    tabelas: dict[str, list[pd.DataFrame]] = {}
    for arq in sorted(ORIGINAIS.glob("*/POV*/*.csv")):
        m = PADRAO.match(arq.name)
        if not m:
            print(f"Ignorado (nome fora do padrão): {arq.relative_to(APP)}")
            continue
        visita_id, obs, conteudo = arq.parents[1].name, m["obs"], m["conteudo"]
        if obs != arq.parent.name:
            raise SystemExit(f"Observador do nome difere da pasta: {arq}")
        df = pd.read_csv(arq, sep=";", encoding="utf-8-sig", dtype=str, keep_default_na=False)
        if (visita_id, obs, conteudo) in descartar:
            print(f"Descartado: {visita_id} {obs} {conteudo} ({len(df)} linhas)")
            continue
        df["unidade"] = m["unidade"]
        df.insert(0, "observador", obs)
        df.insert(0, "visita_id", visita_id)
        tabelas.setdefault(conteudo, []).append(df)

    for conteudo, partes in sorted(tabelas.items()):
        df = pd.concat(partes, ignore_index=True)
        # conferência: linhas consolidadas = soma das linhas dos arquivos
        assert len(df) == sum(len(p) for p in partes)
        df.to_csv(APP / f"contagem_{conteudo}.csv", index=False, sep=";", encoding="utf-8-sig")
        por_obs = df.groupby(["visita_id", "observador"]).size().to_dict()
        print(f"contagem_{conteudo}.csv: {len(df)} linhas {por_obs}")


if __name__ == "__main__":
    main()
