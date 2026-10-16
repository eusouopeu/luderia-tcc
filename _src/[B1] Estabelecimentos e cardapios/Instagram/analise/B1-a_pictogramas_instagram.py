"""
Bloco B1 - pictogramas do público das luderias no Instagram, por região do
Brasil, com a casa de Salvador em linha própria e a linha de todas as casas.

Quatro figuras (mediana das casas de cada grupo, só casas com o dado):
- comentários por post (balão; 1 ícone = 1 comentário);
- curtidas por post (coração; 1 ícone = 25 curtidas);
- seguidores (pessoa; 1 ícone = 2.500 seguidores);
- interações por post a cada 1.000 seguidores (pessoa; 1 ícone = 1 interação).

Entrada: base por casa do B1 (Google Places (Negócios)/outros/dados_graficos.py),
com as colunas do Instagram de B1_instagram_resumo_notion.csv; posts de
01/09 a 01/10/2026. Instagram de LudoCafé e Dominaria fica vazio (perfil
errado coletado).

Regras:
- cada casa entra numa única região (UF da capital da metrópole do endereço);
  a soma das casas com dado nas linhas de região é conferida contra a linha
  "Todas as casas" (diferença zero); a linha de Salvador repete uma casa do
  Nordeste e fica fora da conferência;
- comentários e curtidas por post = total do período ÷ posts do período
  (casas sem post no período ficam fora).

Saídas (dados/[B1] Estabelecimentos e cardapios/estabelecimentos/5_graficos/pictogramas/):
  png/, svg/ (texto editável) e valores/ (B1_pict_*). Para atualizar depois
  de corrigir uma coleta, rodar o script de novo.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Instagram/analise/B1-a_pictogramas_instagram.py"
"""
# Caminhos: _src/extras/ (log e padrão visual) e outros/ do Google Places (base por casa); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[2] / "Google Places (Negócios)" / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402

from dados_graficos import casas  # noqa: E402
from graficos_comum import COR_REGIAO, CORES, ICONES, ORDEM_REGIAO, fileira, fonte_rodape, salvar  # noqa: E402

ROOT = _AQUI.parents[4]
PASTA = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos" / "5_graficos" / "pictogramas"
FONTE = "Fonte: Instagram, perfis e posts coletados de 11 a 15/10/2026; posts de 01/09 a 01/10/2026 (B1)."

# chave -> (coluna, ícone, valor por ícone, ícones na linha, título, legenda do ícone, formato)
FIGURAS = {
    "comentarios_post": ("comentarios_por_post", "balao", 1, 10,
                         "Comentários por post no Instagram (mediana das casas)", "1 comentário por post", "{:.1f}"),
    "curtidas_post": ("curtidas_por_post", "coracao", 25, 14,
                      "Curtidas por post no Instagram (mediana das casas)", "25 curtidas por post", "{:.0f}"),
    "seguidores": ("seguidores", "pessoa", 2500, 16,
                   "Seguidores no Instagram (mediana das casas)", "2.500 seguidores", "{:,.0f}"),
    "engajamento": ("interacoes_mil_seguidores", "pessoa", 1, 20,
                    "Interações (curtidas + comentários) por post a cada 1.000 seguidores (mediana das casas)",
                    "1 interação por post a cada 1.000 seguidores", "{:.1f}"),
}


def br(txt):
    return txt.replace(",", "X").replace(".", ",").replace("X", ".")


def base():
    d = casas()
    ok = d.n_posts_periodo > 0
    d["comentarios_por_post"] = (d.comentarios_periodo / d.n_posts_periodo).where(ok)
    d["curtidas_por_post"] = (d.curtidas_periodo / d.n_posts_periodo).where(ok)
    d["interacoes_mil_seguidores"] = 1000 * d.engajamento_pct
    return d


def tabela(d, col):
    linhas = []
    for reg in ORDEM_REGIAO:
        v = d.loc[d.regiao == reg, col].dropna()
        linhas.append({"grupo": reg, "casas_com_dado": len(v), "mediana": v.median() if len(v) else None})
    v = d[col].dropna()
    soma = sum(r["casas_com_dado"] for r in linhas)
    assert soma == len(v), f"{col}: regiões somam {soma}, total {len(v)}"
    linhas.append({"grupo": "Todas as casas", "casas_com_dado": len(v), "mediana": v.median()})
    s = d.loc[d.metropole == "Salvador"]
    sv = s[col].dropna()
    nome = s.nome.iloc[0].split(" - ")[0] if len(s) else "Salvador"
    linhas.append({"grupo": f"Salvador ({nome})", "casas_com_dado": len(sv),
                   "mediana": sv.median() if len(sv) else None})
    print(f"  {col}: casas com dado nas regiões = {soma} = total (diferença 0)")
    return pd.DataFrame(linhas)


def figura(d, chave):
    col, icone, por, total, titulo, leg, fmt = FIGURAS[chave]
    t = tabela(d, col)
    fig, ax = plt.subplots(figsize=(5.5 + 0.32 * total, 0.62 * len(t) + 1.6))
    passo = 1.1
    for i, r in enumerate(t.iloc[::-1].itertuples()):
        y = i * 1.45
        if r.grupo.startswith("Salvador"):
            cor = CORES["destaque"]
        elif r.grupo == "Todas as casas":
            cor = "#333333"
        else:
            cor = COR_REGIAO[r.grupo]
        if pd.isna(r.mediana):
            fileira(ax, y, 0, total, cor, icone=icone, passo=passo)
            txt = "sem dado"
        else:
            fileira(ax, y, min(r.mediana / por, total), total, cor, icone=icone, passo=passo)
            txt = br(fmt.format(r.mediana))
        ax.text(-0.4, y + 0.5, r.grupo, ha="right", va="center", fontsize=10,
                fontweight="bold" if not r.grupo in ORDEM_REGIAO else "normal",
                color=CORES["destaque"] if r.grupo.startswith("Salvador") else "#222222")
        ax.text(total * passo + 0.3, y + 0.5, f"{txt}  (n = {r.casas_com_dado})", ha="left", va="center",
                fontsize=9.5, color="#333333")
    leg_y = -1.6
    ICONES[icone](ax, 0, leg_y, "#555555", s=0.8)
    ax.text(1.0, leg_y + 0.4, f"= {leg}", va="center", fontsize=9)
    ax.set_xlim(-0.2, total * passo + 0.2)
    ax.set_ylim(leg_y - 0.3, len(t) * 1.45)
    ax.set_aspect("equal")
    ax.set_axis_off()
    fig.suptitle(titulo, fontsize=12, fontweight="bold", x=0.02, ha="left")
    fonte_rodape(fig, FONTE + " n = casas com o dado. Salvador repete a casa já contada no Nordeste.", y=0.0)
    salvar(fig, PASTA, f"B1_pict_{chave}", t.assign(valor_por_icone=por).round(3))


def main():
    d = base()
    for k in FIGURAS:
        figura(d, k)


if __name__ == "__main__":
    main()
