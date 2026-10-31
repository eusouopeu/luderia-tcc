"""
Bloco B2 - completude dos campos extras das avaliações (preço, notas de comida,
serviço e ambiente, nível de barulho etc.), para estimar quantos comentários
perderam campos escondidos atrás do botão "Mais" do Google Maps.

Base: a mesma do corpus do Bardin (B2-a_conteudo_bardin.py): um arquivo de coleta
por estabelecimento (escolhido = sim em B2_bardin_arquivos_coleta.csv) e as
avaliações com texto até "3 meses atrás".

Campo extra = cada rótulo do bloco de detalhes do cartão ("Preço por pessoa",
"Comida", "Nível de barulho", "Adequado para crianças"…), mais as notas por
aspecto lidas fora do bloco (coluna notas_por_aspecto). Ficam de fora nota geral,
data da coleta, data relativa e texto.

Só entram os estabelecimentos com ao menos uma avaliação com campo extra. Em cada
um, contam-se as avaliações:
  sem_campos        nenhum campo extra;
  abaixo_do_maximo  menos campos que a avaliação do estabelecimento com mais campos;
  falta_campo_visto ao menos um campo vazio que outra avaliação do estabelecimento preenche.
As três são aninhadas (sem_campos ⊆ abaixo_do_maximo ⊆ falta_campo_visto) e são teto
do corte pelo "Mais": o avaliador pode simplesmente não ter preenchido o campo.

Saída: dados/[B2] Avaliacoes recentes/B2_completude_campos.csv (uma linha por
estabelecimento, com a linha TOTAL; a soma das linhas fecha com o total).

Uso:
    python3 "_src/[B2] Avaliacoes recentes/Google Places (Comentários)/analise/B2-a_completude_campos.py"
"""
# Caminhos: _src/extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
B2 = ROOT / "dados" / "[B2] Avaliacoes recentes"
COLETAS = B2 / "_dados-brutos" / "coletas"
ARQUIVOS = B2 / "analise_conteudo" / "B2_bardin_arquivos_coleta.csv"
SAIDA = B2 / "B2_completude_campos.csv"

PERIODO_ATE_DIAS = 90  # rótulo até "3 meses atrás", inclusive (igual ao Bardin)
ASPECTOS = {"comida": "Comida", "serviço": "Serviço", "ambiente": "Ambiente"}
# Os 7 campos com coluna própria no Notion ("2 - Comentários"); os demais rótulos
# ("Adequado para crianças", "Opções vegetarianas"…) são raros e opcionais.
PRINCIPAIS = frozenset({"Comida", "Serviço", "Ambiente", "Preço por pessoa", "Nível de barulho",
                        "Tamanho do grupo", "Tempo de espera"})


def campos(linha):
    """Rótulos preenchidos: 'Preço por pessoa: R$ 60–80 | Comida: 5' -> {'Preço por pessoa', 'Comida'}."""
    achados = {p.split(":", 1)[0].strip() for p in linha["detalhes"].split(" | ") if ":" in p}
    for parte in linha["notas_por_aspecto"].split(";"):
        nome = parte.strip().split(" ")[0]
        if nome in ASPECTOS:
            achados.add(ASPECTOS[nome])
    return frozenset(achados)


def carrega():
    arquivos = pd.read_csv(ARQUIVOS, sep=";", dtype=str)
    partes = []
    for _, a in arquivos[arquivos["escolhido"] == "sim"].iterrows():
        df = pd.read_csv(COLETAS / a["arquivo"], sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
        df = df.drop_duplicates("review_id")
        idade = pd.to_numeric(df["idade_dias_aprox"], errors="coerce")
        df = df[(idade <= PERIODO_ATE_DIAS) & (df["tem_texto"] == "sim")].copy()
        df["sigla"] = a["sigla"]
        partes.append(df)
    base = pd.concat(partes, ignore_index=True)
    base["campos"] = base.apply(campos, axis=1)
    base["n_campos"] = base["campos"].map(len)
    return base


def contagens(campos_por_avaliacao, sufixo=""):
    vistos = frozenset().union(*campos_por_avaliacao)
    n = campos_por_avaliacao.map(len)
    return {
        f"campos_vistos{sufixo}": len(vistos), f"max_campos{sufixo}": n.max(),
        f"sem_campos{sufixo}": int((n == 0).sum()),
        f"abaixo_do_maximo{sufixo}": int((n < n.max()).sum()),
        f"falta_campo_visto{sufixo}": int((campos_por_avaliacao != vistos).sum()),
    }


def main():
    base = carrega()
    linhas = []
    for (sigla, nome), g in base.groupby(["sigla", "nome_estabelecimento"]):
        vistos = frozenset().union(*g["campos"])
        if not vistos:
            continue
        linhas.append({
            "sigla": sigla, "nome_estabelecimento": nome, "avaliacoes": len(g),
            **contagens(g["campos"]),
            **contagens(g["campos"].map(lambda c: c & PRINCIPAIS), "_principais"),
            "lista_campos": "; ".join(sorted(vistos)),
        })
    tab = pd.DataFrame(linhas).sort_values("avaliacoes", ascending=False)
    conta = ["avaliacoes", "sem_campos", "abaixo_do_maximo", "falta_campo_visto",
             "sem_campos_principais", "abaixo_do_maximo_principais", "falta_campo_visto_principais"]
    total = {"sigla": "TOTAL", "nome_estabelecimento": f"{len(tab)} estabelecimentos", **tab[conta].sum().to_dict()}
    # Conferência: total = avaliações da base nos estabelecimentos com campo extra.
    esperado = int(base["sigla"].isin(tab["sigla"]).sum())
    assert total["avaliacoes"] == esperado, f"soma {total['avaliacoes']} != base {esperado}"
    for s in ("", "_principais"):
        assert (tab[f"sem_campos{s}"] <= tab[f"abaixo_do_maximo{s}"]).all()
        assert (tab[f"abaixo_do_maximo{s}"] <= tab[f"falta_campo_visto{s}"]).all()
    tab = pd.concat([tab, pd.DataFrame([total])], ignore_index=True)
    tab.to_csv(SAIDA, sep=";", index=False, encoding="utf-8-sig")
    fora = sorted(set(base["sigla"]) - set(tab["sigla"]))
    print(f"Base: {len(base)} avaliações com texto de {base['sigla'].nunique()} estabelecimentos; "
          f"{len(fora)} sem nenhum campo extra ({', '.join(fora)}), com {len(base) - esperado} avaliações.")
    print(tab[["sigla"] + conta + ["campos_vistos", "max_campos", "max_campos_principais"]].to_string(index=False))


if __name__ == "__main__":
    main()
