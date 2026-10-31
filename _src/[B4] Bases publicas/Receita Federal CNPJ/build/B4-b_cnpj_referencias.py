"""
Monta a tabela de CNPJ de referência (São Jogue) a partir dos JSON da Receita
Federal (BrasilAPI): natureza jurídica, CNAE principal e secundários, opção
pelo Simples, porte, início de atividade e capital social. Uma linha por CNAE
de cada CNPJ (tipo = principal ou secundário).

Entrada: dados/[B4] Bases publicas/_dados-brutos/receita_cnpj/cnpj_*.json
Saída: dados/[B4] Bases publicas/juridico_tributario/[B4] CNPJ de Referência 2026-10 (Receita Federal).csv
"""

# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros"), str(_AQUI.parents[2] / "Comum")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

from bases_comum import PROCESSED_DIR, RAW_DIR, ler_json

SAIDA = PROCESSED_DIR / "juridico_tributario" / "[B4] CNPJ de Referência 2026-10 (Receita Federal).csv"


def main() -> None:
    linhas = []
    for arq in sorted((RAW_DIR / "receita_cnpj").glob("cnpj_*.json")):
        d = ler_json(arq)
        base = {k: d.get(k) for k in ("cnpj", "razao_social", "natureza_juridica", "opcao_pelo_simples",
                                      "data_opcao_pelo_simples", "porte", "data_inicio_atividade", "capital_social")}
        base["origem_no_tcc"] = d.get("_origem_no_tcc")
        cnaes = [("principal", d["cnae_fiscal"], d["cnae_fiscal_descricao"])]
        cnaes += [("secundario", s["codigo"], s["descricao"]) for s in d.get("cnaes_secundarios", []) if s.get("codigo")]
        for tipo, cod, desc in cnaes:
            c = f"{cod:07d}"
            linhas.append({**base, "tipo_cnae": tipo, "cnae": f"{c[:4]}-{c[4]}/{c[5:]}", "cnae_descricao": desc})
    df = pd.DataFrame(linhas)
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(SAIDA, index=False)
    print(df.groupby(["razao_social", "tipo_cnae"]).size().to_string())
    print(f"{len(df)} linhas -> {SAIDA.relative_to(PROCESSED_DIR.parents[1])}")


if __name__ == "__main__":
    main()
