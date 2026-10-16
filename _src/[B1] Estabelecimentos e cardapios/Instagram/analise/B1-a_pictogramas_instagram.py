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

Estilo editorial (`graficos_comum`): fileiras em cinza, Salvador em vermelho,
título com a comparação de Salvador contra a mediana de todas as casas.

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

import pandas as pd  # noqa: E402

from dados_graficos import casas  # noqa: E402
from graficos_comum import BASE, ORDEM_REGIAO, TINTA, VERMELHO, br, pictograma_linhas, salvar  # noqa: E402

ROOT = _AQUI.parents[4]
PASTA = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "estabelecimentos" / "5_graficos" / "pictogramas"
FONTE = ("Fonte: elaboração própria com perfis e posts do Instagram coletados de 11 a 15/10/2026; "
         "posts de 01/09 a 01/10/2026 (B1).")

# chave -> (coluna, ícone, valor por ícone, ícones na fileira, o que a casa "faz" no título,
#           subtítulo, legenda do ícone, casas decimais)
FIGURAS = {
    "comentarios_post": ("comentarios_por_post", "balao", 1, 10, "recebe {v} comentários por post",
                         "Comentários por post no Instagram, mediana das casas de cada região",
                         "1 comentário por post", 1),
    "curtidas_post": ("curtidas_por_post", "coracao", 25, 14, "recebe {v} curtidas por post",
                      "Curtidas por post no Instagram, mediana das casas de cada região",
                      "25 curtidas por post", 0),
    "seguidores": ("seguidores", "pessoa", 2500, 16, "tem {v} seguidores no Instagram",
                   "Seguidores no Instagram, mediana das casas de cada região",
                   "2.500 seguidores", 0),
    "engajamento": ("interacoes_mil_seguidores", "pessoa", 1, 20,
                    "soma {v} interações por post a cada mil seguidores",
                    "Interações (curtidas + comentários) por post a cada 1.000 seguidores, mediana das casas de cada região",
                    "1 interação por post a cada 1.000 seguidores", 1),
}


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


def fmt(v, casas_dec):
    return "sem dado" if pd.isna(v) else br(v, casas_dec)


def comparacao(sv, todas, dec):
    """Trecho do título que compara Salvador com a mediana de todas as casas."""
    r = sv / todas
    if r <= 0.87:
        return f"abaixo da mediana das casas ({br(todas, dec)})"
    if r < 1.15:
        return f"perto da mediana das casas ({br(todas, dec)})"
    vezes = {2: "o dobro", 3: "o triplo", 4: "o quádruplo"}.get(round(r)) if abs(r - round(r)) < 0.2 else None
    quanto = f"{vezes} da" if vezes else f"{br(r, 1)} vezes a"
    return f"{quanto} mediana das casas ({br(todas, dec)})"


def desenhar(d, chave):
    col, icone, por, total, faz, sub, leg, dec = FIGURAS[chave]
    t = tabela(d, col)
    sv = t.iloc[-1]
    todas = t.loc[t.grupo == "Todas as casas", "mediana"].iloc[0]
    casa = sv.grupo.split("(")[-1].rstrip(")")
    if pd.notna(sv.mediana):
        titulo = f"A {casa}, em Salvador, {faz.format(v=fmt(sv.mediana, dec))}: {comparacao(sv.mediana, todas, dec)}"
    else:
        titulo = f"{sub.split(',')[0]}: mediana de {fmt(todas, dec)} nas casas do estudo"
    linhas = []
    for r in t.itertuples():
        sal = r.grupo.startswith("Salvador")
        linhas.append({
            "rotulo": r.grupo, "icones": 0 if pd.isna(r.mediana) else r.mediana / por,
            "valor": fmt(r.mediana, dec), "extra": f"{r.casas_com_dado} casa" + ("s" if r.casas_com_dado != 1 else ""),
            "cor": VERMELHO if sal else (TINTA if r.grupo == "Todas as casas" else BASE),
            "destaque": sal or r.grupo == "Todas as casas", "espaco": r.grupo == "Todas as casas",
        })
    fig, _ = pictograma_linhas(linhas, total, icone, titulo, sub + ".", FONTE,
                               nota=f"Cada ícone = {leg}. Salvador repete a casa já contada no Nordeste.")
    salvar(fig, PASTA, f"B1_pict_{chave}", t.assign(valor_por_icone=por).round(3))


def main():
    d = base()
    for k in FIGURAS:
        desenhar(d, k)


if __name__ == "__main__":
    main()
