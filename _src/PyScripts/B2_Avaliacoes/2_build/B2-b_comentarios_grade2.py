"""
Bloco B2 - base final da análise de conteúdo: os 1.628 comentários do banco
"2 - Comentários" do Notion com a codificação da grade 2 (22 temas,
02/11/2026), já conferida pela recodificação cega (rodadas 1 e 2, 03/11/2026).

Por que três fontes: o índice SQL do Notion e o cache do app desktop ainda
devolvem os temas de antes da grade 2. A base sai, então, de:
  - temas, Contexto, "Costuma ir" e "Voltará": o retrato tirado antes da
    grade 2 (`dados/B2_avaliacoes/_dados-brutos/analise_conteudo/2026-11-02_B2_notion_antes_grade2.json`,
    1.628 páginas) com o plano da grade 2 por cima
    (`dados/B2_avaliacoes/_dados-agregados/analise_conteudo/B2_plano_grade2.json`, 652 páginas; cada propriedade do
    plano substitui a do retrato). Páginas lidas uma a uma no Notion em
    03/11/2026 batem com essa soma;
  - demais campos (notas por aspecto, preço por pessoa, espera, barulho, grupo,
    datas), que a grade 2 não tocou: o cache local do app do Notion
    (`_src/extras/ler_notion_offline.py`). As 16 páginas do cache fora das
    1.628 (casas fora da curadoria) não entram.
A metrópole sai do B1 pelo nome do estabelecimento (a fórmula "Capital do
endereço" não vem no cache).

Variáveis encerradas em 03/11/2026 (decisões do autor): "Costuma ir" fica na
base, mas sai da análise (kappa 0,52 na rodada 2); Contexto entra como
exploratória (kappa 0,52).

Saída (fora do git: tem o texto dos comentários):
  dados/B2_avaliacoes/_dados-brutos/analise_conteudo/2026-11-03_2_comentarios_grade2.csv
no formato da exportação do Notion (listas separadas por vírgula), lido por
`_src/extras/gerar_planilha_comentarios.py` e por `../analise/B2-a_temas_grade2.py`.

Conferência (o script para se falhar): 1.628 linhas, ids únicos, todo tema na
lista da grade 2, todo estabelecimento com metrópole no B1.

Uso:
    python3 "_src/PyScripts/B2_Avaliacoes/2_build/B2-b_comentarios_grade2.py"
"""
# Caminhos: _src/extras/ (log comum e leitor do cache do Notion); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "Extras").glob("G[0-9]_*"))]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import json  # noqa: E402

import pandas as pd  # noqa: E402

import ler_notion_offline as lno  # noqa: E402

ROOT = Path(__file__).resolve().parents[4]
B2 = ROOT / "dados" / "B2_avaliacoes" / "_dados-agregados"
RETRATO = ROOT / "dados" / "B2_avaliacoes" / "_dados-brutos" / "analise_conteudo" / "2026-11-02_B2_notion_antes_grade2.json"
PLANO = B2 / "analise_conteudo" / "B2_plano_grade2.json"
SAIDA = ROOT / "dados" / "B2_avaliacoes" / "_dados-brutos" / "analise_conteudo" / "2026-11-03_2_comentarios_grade2.csv"
RESUMO_B1 = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "B1_resumo_estabelecimentos.xlsx"

TEMAS = ["ambiente e decoração", "atendimento online", "atendimento presencial", "bebidas", "comemorações e grupos",
         "comida", "conforto e barulho", "curadoria e conservação do acervo", "espaço e lotação",
         "eventos e comunidade", "explicação de jogos", "indicações de jogos", "limpeza", "localização e acesso",
         "porções", "preço da entrada", "preço do cardápio", "preço de outros itens", "rapidez do serviço",
         "regras da casa", "variedade do acervo", "variedade do cardápio"]
CONTEXTOS = ["amigos", "família", "casal", "aniversário", "aluguel", "loja", "apenas loja"]
DO_RETRATO = {"Itens positivos": "pos", "Itens negativos": "neg", "Contexto": "ctx", "Costuma ir": "costuma",
              "Voltará": "volta", "Análise de temas": "analise"}
LISTAS = ("Itens positivos", "Itens negativos", "Contexto")


def codificacao_atual() -> pd.DataFrame:
    retrato = json.loads(RETRATO.read_text())
    plano = {p["id"]: p["props"] for p in json.loads(PLANO.read_text())}
    linhas = []
    for r in retrato:
        lin = {"id": r["id"]}
        for prop, chave in DO_RETRATO.items():
            lin[prop] = r[chave]
        for prop, v in plano.get(r["id"], {}).items():
            lin[prop] = json.loads(v) if prop in LISTAS else v
        linhas.append(lin)
    return pd.DataFrame(linhas)


def cache_notion() -> pd.DataFrame:
    con = lno.copiar_snapshot(lno.BANCO_PADRAO)
    tmp = SAIDA.with_suffix(".cache.csv")
    lno.exportar_banco(con, "2 - Comentários", tmp)
    con.close()
    d = pd.read_csv(tmp, dtype=str)
    tmp.unlink()
    d["id"] = d["id"].str.replace("-", "")
    return d


def main():
    cod = codificacao_atual()
    assert len(cod) == 1628 and cod["id"].is_unique, "retrato do Notion fora das 1.628 páginas"
    cache = cache_notion()
    fora = sorted(set(cache["id"]) - set(cod["id"]))
    falta = sorted(set(cod["id"]) - set(cache["id"]))
    assert not falta, f"{len(falta)} páginas da base fora do cache do Notion"
    d = cache.drop(columns=list(DO_RETRATO)).merge(cod, on="id", how="inner", validate="1:1")

    for col in ("Itens positivos", "Itens negativos"):
        estranhos = {t for v in d[col] for t in v} - set(TEMAS)
        assert not estranhos, f"{col}: temas fora da grade 2 {estranhos}"
    estranhos = {t for v in d["Contexto"] for t in v} - set(CONTEXTOS)
    assert not estranhos, f"Contexto fora da lista: {estranhos}"
    for col in LISTAS:
        d[col] = d[col].map(lambda v: ", ".join(v) if len(v) else pd.NA)

    res = pd.read_excel(RESUMO_B1, sheet_name="estabelecimentos")
    norm = lambda s: str(s).replace(",", "").strip().lower()
    cap = {norm(n): c for n, c in zip(res["nome"], res["capital_endereco"])}
    d["Capital do endereço"] = d["Estabelecimento"].map(lambda n: cap.get(norm(n)))
    sem = d.loc[d["Capital do endereço"].isna(), "Estabelecimento"].unique()
    assert not len(sem), f"estabelecimentos sem metrópole no B1: {sem}"

    d.to_csv(SAIDA, index=False, encoding="utf-8")
    print(f"{len(d)} comentários de {d['Estabelecimento'].nunique()} estabelecimentos; "
          f"{(d['Itens positivos'].notna() | d['Itens negativos'].notna()).sum()} com tema; "
          f"{len(fora)} páginas do cache fora da base")
    print(f"OK: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
