"""
Coleta séries do Banco Central: SGS (observado) e relatório Focus (projeções).

Uso no plano: taxa mínima de atratividade, inflação do modelo e salário mínimo (cap. 9).

Saídas em _data/raw/[E] Bases publicas/bcb/:
  sgs_<codigo>_<nome>.json   séries do SGS
  focus_anuais.json          expectativas anuais dos últimos 120 dias
"""

import datetime as dt
from urllib.parse import quote, urlencode

from bases_comum import DATA_COLETA, RAW_DIR, baixar_json, salvar_json

OUT_DIR = RAW_DIR / "bcb"
SGS_API = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.{}/dados"
FOCUS_API = "https://olinda.bcb.gov.br/olinda/servico/Expectativas/versao/v1/odata/ExpectativasMercadoAnuais"

SERIES = {
    433: "ipca_variacao_mensal",
    13522: "ipca_acumulado_12_meses",
    432: "selic_meta",
    4390: "selic_acumulada_no_mes",
    4189: "selic_anualizada_base_252",
    1619: "salario_minimo",
}
INDICADORES_FOCUS = ["IPCA", "Selic", "PIB Total", "Câmbio", "IGP-M"]


def main() -> None:
    hoje = dt.date.today()
    inicio = hoje.replace(year=hoje.year - 9)  # séries diárias aceitam no máximo 10 anos por consulta
    for codigo, nome in SERIES.items():
        params = {"formato": "json", "dataInicial": inicio.strftime("%d/%m/%Y"), "dataFinal": hoje.strftime("%d/%m/%Y")}
        r, dados = baixar_json(SGS_API.format(codigo), params=params)
        salvar_json({"codigo_sgs": codigo, "nome": nome, "url": r.url, "data_coleta": DATA_COLETA, "dados": dados},
                    OUT_DIR / f"sgs_{codigo}_{nome}.json")
        print(f"SGS {codigo:>5} {nome:28s} {len(dados):>5} observações")

    desde = (hoje - dt.timedelta(days=120)).isoformat()
    filtro = " or ".join(f"Indicador eq '{i}'" for i in INDICADORES_FOCUS)
    # O OData do Olinda rejeita "+" como espaço: a query é montada com %20
    consulta = urlencode({"$filter": f"({filtro}) and Data ge '{desde}'", "$format": "json", "$top": "100000"},
                         quote_via=quote, safe="$'(),")
    r, resposta = baixar_json(f"{FOCUS_API}?{consulta}")
    dados = resposta["value"]
    salvar_json({"url": r.url, "data_coleta": DATA_COLETA, "dados": dados}, OUT_DIR / "focus_anuais.json")
    print(f"Focus: {len(dados)} registros desde {desde}")


if __name__ == "__main__":
    main()
