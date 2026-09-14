"""
Coleta, na API de agregados do IBGE (SIDRA), as tabelas do Bloco E usadas no plano.

Cada consulta gera _data/raw/[E] Bases publicas/ibge_sidra/<nome>.json com a URL,
a data da coleta, o uso no plano e a resposta integral da API.
O tratamento fica em build_bases_ibge_sidra.py.
"""

from bases_comum import IDS_CAPITAIS, RAW_DIR, categorias, salvar_json, sidra, variaveis_absolutas

OUT_DIR = RAW_DIR / "ibge_sidra"
CAP = f"N6[{IDS_CAPITAIS}]"


def consultas() -> list[dict]:
    return [
        # População
        {"nome": "populacao_censo_2022", "tabela": 4709, "variaveis": [93], "periodos": "2022",
         "localidades": f"N1[all]|{CAP}",
         "uso": "Tamanho do público por capital; avaliações por 100 mil habitantes (5.2, 6.4, 6.6)"},
        {"nome": "populacao_estimada", "tabela": 6579, "variaveis": [9324], "periodos": "-3",
         "localidades": f"N1[all]|{CAP}",
         "uso": "Atualização da população do Censo (5.2, 6.6)"},
        {"nome": "populacao_idade_censo_2022", "tabela": 9514, "variaveis": [93], "periodos": "2022",
         "localidades": CAP,
         "classificacao": f"2[6794]|286[113635]|287[{categorias(9514, 287, r'^(Total|\d+ a \d+ anos|100 anos ou mais)$')}]",
         "uso": "Público-alvo por faixa etária (5.2, 6.6)"},
        # Renda
        {"nome": "renda_censo_2022_idade", "tabela": 10299, "variaveis": [1641, 13502, 13503], "periodos": "2022",
         "localidades": f"N1[all]|{CAP}",
         "classificacao": f"2[{categorias(10299, 2, '^Total$')}]|629[{categorias(10299, 629, '^Total$')}]|58[all]",
         "uso": "Renda por capital e faixa etária (5.2, 6.4)"},
        {"nome": "renda_pnadc_trabalho_capitais", "tabela": 5436, "variaveis": variaveis_absolutas(5436),
         "periodos": "-8", "localidades": f"N1[all]|{CAP}", "classificacao": "2[6794]",
         "uso": "Atualização trimestral da renda do trabalho por capital (5.2, 6.4)"},
        {"nome": "renda_pnadc_per_capita_rm_uf", "tabela": 7395, "variaveis": variaveis_absolutas(7395),
         "periodos": "-3", "localidades": "N1[all]|N3[all]|N7[all]",
         "uso": "Renda domiciliar per capita por região metropolitana e UF (5.2, 6.4)"},
        # Gasto das famílias (POF 2017-2018)
        {"nome": "pof_despesas_renda_uf", "tabela": 6715, "variaveis": [1201, 1204], "periodos": "2018",
         "localidades": "N1[all]|N3[all]", "classificacao": "339[all]|12190[103536,103538,103539,103592,8016]",
         "uso": "Checagem do ticket médio: despesa com alimentação e recreação por faixa de renda (cap. 9, 6.3)"},
        {"nome": "pof_alimentacao_fora_renda_uf", "tabela": 6972, "variaveis": [1201, 1204], "periodos": "2018",
         "localidades": "N1[all]|N3[all]",
         "classificacao": f"339[all]|12190[{categorias(6972, 12190, r'^(1 Despesas com alimentação|3 |3\.\d+ )')}]",
         "uso": "Checagem do ticket médio: alimentação fora do domicílio por faixa de renda (cap. 9, 6.3)"},
        # Inflação de alimentação fora do domicílio
        {"nome": "ipca_alimentacao_fora", "tabela": 7060, "variaveis": [63, 2265], "periodos": "-36",
         "localidades": "N1[all]|N6[all]|N7[all]", "classificacao": "315[7169,7432,7433]",
         "uso": "Correção de preços de cardápio e da POF (cap. 9)"},
        # Pesquisa Anual de Serviços
        {"nome": "pas_2024_dados_gerais", "tabela": 10758, "variaveis": variaveis_absolutas(10758), "periodos": "-1",
         "localidades": "N1[all]", "classificacao": f"12355[{categorias(10758, 12355, r'^(1\. Total|2\.2|2\.3)')}]",
         "uso": "Coerência de margem, CMV e custo de pessoal em serviços de alimentação (9.8)"},
    ] + [
        {"nome": f"pas_familias_{sufixo}", "tabela": t, "variaveis": variaveis_absolutas(t), "periodos": "-5",
         "localidades": "N1[all]",
         "classificacao": f"12356[{categorias(t, 12356, r'^1\. Total|aliment|Restaurantes|recreativas')}]",
         "uso": "Coerência de margem, CMV e custo de pessoal em serviços de alimentação (9.8)"}
        for t, sufixo in [(2611, "receita"), (2613, "custos"), (2618, "pessoal"), (2619, "empresas")]
    ]


def main() -> None:
    for c in consultas():
        bruto = sidra(c["tabela"], c["variaveis"], c["periodos"], c["localidades"], c.get("classificacao"))
        bruto["uso_no_plano"] = c["uso"]
        salvar_json(bruto, OUT_DIR / f"{c['nome']}.json")
        n = sum(len(s["serie"]) for v in bruto["resposta"] for r in v["resultados"] for s in r["series"])
        print(f"{c['nome']:34s} tabela {c['tabela']:>5}  {n:>6} valores")


if __name__ == "__main__":
    main()
