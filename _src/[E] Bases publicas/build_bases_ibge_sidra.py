"""
Trata os JSON do SIDRA coletados por collect_bases_ibge_sidra.py.

Saídas em _data/processed/[E] Bases publicas/<uso>/, no padrão "[E] {dado} {período} ({fonte}).csv":
  uma saída por consulta, em formato longo (uma linha por valor), com uso e nome definidos em SAIDAS
  "[E] Resumo de População e Renda por Capital ... (IBGE).csv": uma linha por capital, com
  população, faixa de 20 a 39 anos e renda
"""

import pandas as pd

from bases_comum import (CAPITAIS, PROCESSED_DIR, RAW_DIR, caminho_saida, conferir_capitais, ler_json,
                         rotulo_periodo, sidra_para_df)

IN_DIR = RAW_DIR / "ibge_sidra"

# Consulta (nome do JSON bruto) -> (uso, dado principal, fonte). O período sai dos próprios dados.
SAIDAS = {
    "ipca_alimentacao_fora": ("Multiuso", "IPCA Alimentação Fora do Domicílio", "IBGE"),
    "pas_2024_dados_gerais": ("Financeiro", "Serviços Dados Gerais", "IBGE PAS"),
    "pas_familias_custos": ("Financeiro", "Serviços às Famílias Custos", "IBGE PAS"),
    "pas_familias_empresas": ("Financeiro", "Serviços às Famílias Empresas", "IBGE PAS"),
    "pas_familias_pessoal": ("Financeiro", "Serviços às Famílias Pessoal", "IBGE PAS"),
    "pas_familias_receita": ("Financeiro", "Serviços às Famílias Receita", "IBGE PAS"),
    "pof_alimentacao_fora_renda_uf": ("Multiuso", "Despesa com Alimentação por Renda", "IBGE POF"),
    "pof_despesas_renda_uf": ("Multiuso", "Despesa Total por Renda", "IBGE POF"),
    "populacao_censo_2022": ("Mercado e demanda", "População Residente", "IBGE Censo"),
    "populacao_estimada": ("Mercado e demanda", "População Estimada", "IBGE"),
    "populacao_idade_censo_2022": ("Mercado e demanda", "População por Idade", "IBGE Censo"),
    "renda_censo_2022_idade": ("Mercado e demanda", "Renda por Idade", "IBGE Censo"),
    "renda_pnadc_per_capita_rm_uf": ("Mercado e demanda", "Renda Domiciliar per Capita", "IBGE PNADC"),
    "renda_pnadc_trabalho_capitais": ("Mercado e demanda", "Renda do Trabalho por Capital", "IBGE PNADC"),
}
FAIXAS_20_39 = ["20 a 24 anos", "25 a 29 anos", "30 a 34 anos", "35 a 39 anos"]
PADRAO_PNADC = "habitualmente recebido no trabalho principal"  # variável de referência da tabela 5436


def por_capital(df: pd.DataFrame, nome: str) -> pd.Series:
    df = df[df["localidade_id"].isin(CAPITAIS)]
    return df.groupby("localidade_id")["valor"].sum(min_count=1).rename(nome)


def resumo_capitais(t: dict[str, pd.DataFrame]) -> pd.DataFrame:
    out = pd.DataFrame(
        [{"codigo_ibge": k, "capital": v[0], "uf": v[1]} for k, v in CAPITAIS.items()]
    ).set_index("codigo_ibge")

    out = out.join(por_capital(t["populacao_censo_2022"], "pop_censo_2022"))
    est = t["populacao_estimada"]
    ano = est["periodo"].max()
    out = out.join(por_capital(est[est["periodo"] == ano], f"pop_estimada_{ano}"))

    idade = t["populacao_idade_censo_2022"]
    out = out.join(por_capital(idade[idade["Idade"].isin(FAIXAS_20_39)], "pop_20_39_censo_2022"))
    out["pct_pop_20_39"] = (out["pop_20_39_censo_2022"] / out["pop_censo_2022"] * 100).round(1)

    renda = t["renda_censo_2022_idade"]
    renda = renda[renda["Grupo de idade"] == "Total"]
    out = out.join(por_capital(renda[renda["variavel_id"] == 13502], "renda_media_14mais_censo_2022"))
    out = out.join(por_capital(renda[renda["variavel_id"] == 13503], "renda_mediana_14mais_censo_2022"))

    pnad = t["renda_pnadc_trabalho_capitais"]
    alvo = pnad[pnad["variavel"].str.contains(PADRAO_PNADC) & ~pnad["variavel"].str.startswith("Coeficiente")]
    if alvo["variavel_id"].nunique() != 1:
        raise ValueError(f"Variável da PNAD Contínua ambígua: {alvo['variavel'].unique()}")
    tri = alvo["periodo"].max()
    out = out.join(por_capital(alvo[alvo["periodo"] == tri], f"renda_trabalho_habitual_pnadc_{tri}"))
    return out.reset_index()


def main() -> None:
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    tabelas = {}
    for arq in sorted(IN_DIR.glob("*.json")):
        df = sidra_para_df(ler_json(arq))
        conferir_capitais(df)
        if arq.stem not in SAIDAS:
            raise KeyError(f"Consulta sem nome de saída em SAIDAS: {arq.stem}")
        uso, dado, fonte = SAIDAS[arq.stem]
        df.to_csv(caminho_saida(uso, dado, rotulo_periodo(df["periodo"]), fonte), index=False)
        tabelas[arq.stem] = df
        print(f"{arq.stem:34s} {len(df):>6} linhas")
    resumo = resumo_capitais(tabelas)
    periodo = f"{tabelas['populacao_censo_2022']['periodo'].max()}-{tabelas['populacao_estimada']['periodo'].max()}"
    resumo.to_csv(caminho_saida("Mercado e demanda", "Resumo de População e Renda por Capital", periodo, "IBGE"), index=False)
    print(resumo.to_string(index=False))


if __name__ == "__main__":
    main()
