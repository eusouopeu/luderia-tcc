"""
Achata o JSON das subclasses CNAE coletado por collect_bases_concla_cnae.py.

Saída: "[E] Subclasses CNAE {ano da coleta} (CONCLA).csv"
  uma linha por subclasse: código formatado, hierarquia, papel no plano, atividades
  compreendidas e observações (o que a subclasse compreende e não compreende).
"""

import pandas as pd

from bases_comum import DATA_COLETA, PROCESSED_DIR, RAW_DIR, caminho_saida, ler_json

IN_PATH = RAW_DIR / "concla" / "cnae_subclasses.json"
OUT_PATH = caminho_saida("Subclasses CNAE", DATA_COLETA[:4], "CONCLA")


def main() -> None:
    bruto = ler_json(IN_PATH)
    linhas = []
    for sub, reg in bruto["subclasses"].items():
        item = reg["resposta"][0] if isinstance(reg["resposta"], list) else reg["resposta"]
        classe = item["classe"]
        grupo = classe["grupo"]
        divisao = grupo["divisao"]
        linhas.append({
            "subclasse": f"{sub[:4]}-{sub[4]}/{sub[5:]}",
            "descricao": item["descricao"].strip(),
            "papel_no_plano": reg["papel_no_plano"],
            "classe": f"{classe['id']} {classe['descricao']}",
            "grupo": f"{grupo['id']} {grupo['descricao']}",
            "divisao": f"{divisao['id']} {divisao['descricao']}",
            "secao": f"{divisao['secao']['id']} {divisao['secao']['descricao']}",
            "atividades": " | ".join(a.strip() for a in item.get("atividades", [])),
            "observacoes": " | ".join(o.replace("\r\n", " ").strip() for o in item.get("observacoes", [])),
            "data_coleta": bruto["data_coleta"],
        })
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(linhas).to_csv(OUT_PATH, index=False)
    print(f"{len(linhas)} subclasses -> {OUT_PATH.name}")


if __name__ == "__main__":
    main()
