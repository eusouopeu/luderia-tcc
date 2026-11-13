"""
Bloco B1 - mede o que a busca sem paginação deixou de fora.

A coleta de setembro de 2026 parou em 20 resultados por busca (faltava o campo
nextPageToken na máscara; ver B1-c_places.py --repaginar). Este script compara
a repaginação (B1_candidatos_repaginacao.csv: as 101 buscas truncadas, agora
com até 60 resultados, mais as 15 buscas de Campinas) com os candidatos
originais (B1_candidatos.csv) e passa os place_id novos pelo mesmo funil
automático do B1-b_planilha.py, até a porta da triagem manual:

  1. endereço no Brasil;
  2. não fechado definitivamente;
  3. palavra-chave no nome (KEYWORDS_NOME). Sem ela: quem veio só de "quiz
     bar" ou "ludoteca" é descartado; os demais ficam "indefinido" (iriam para
     a triagem manual, porque o texto das avaliações não foi coletado);
  4. recorte: município da capital ou da RM dela, numa das 14 capitais
     metrópoles da REGIC 2018; ou RM de Campinas, medida à parte;
  5. mais de 100 avaliações (mínimo de 101 em B1_curadoria_metro_f_av100.csv).

Cada place_id novo recebe uma única situação (a primeira etapa em que cai), e
a soma das situações fecha com o total de novos. Para Campinas, entram também
os place_id que a coleta original já tinha achado e descartado por estarem
fora da RM de uma capital: novos ou não, nenhum estava no estudo.

O resultado NÃO decide quem é luderia: os que chegam ao fim são candidatos à
triagem manual do autor (fotos do Maps, Instagram), a mesma que levou de 164
para 51 aprovadas na coleta original.

Saídas em dados/B1_estabelecimentos/_dados-agregados/1_busca/:
  B1_repaginacao_funil.csv        grupo x situação, com totais
  B1_repaginacao_candidatos.csv   quem chegou à porta da triagem manual

Uso:
    python3 "_src/pyScripts/B1_Estabelecimentos/3_analise/B1-a_repaginacao.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "outros").glob("G[0-9]_*")), str(_AQUI.parents[1] / "5_outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import csv
import importlib.util
from collections import Counter, defaultdict

from openpyxl import load_workbook

import recorte_rm
from regic import load_regic

ROOT = Path(__file__).resolve().parents[4]
RAW = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos"
SAIDA = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "1_busca"
CANDIDATOS = RAW / "B1_candidatos.csv"
REPAGINACAO = RAW / "B1_candidatos_repaginacao.csv"

MINIMO_AVALIACOES = 101

# Regras do filtro automático: as mesmas do B1-b_planilha.py, lidas de lá.
_spec = importlib.util.spec_from_file_location("planilha", _AQUI.parents[1] / "2_build" / "B1-b_planilha.py")
planilha = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(planilha)

SITUACOES = [
    "fora_do_brasil", "fechado_definitivamente", "so_termo_baixa_precisao",
    "fora_do_recorte", "ate_100_avaliacoes", "triagem_nome", "triagem_indefinido",
]


def rm_campinas():
    """Municípios (chave, UF) da Região Metropolitana de Campinas (IBGE, 2025)."""
    ws = load_workbook(recorte_rm.RM_PATH, read_only=True).worksheets[0]
    linhas = ws.iter_rows(values_only=True)
    idx = {c: i for i, c in enumerate(next(linhas))}
    return {
        (recorte_rm.chave(r[idx["NOME_MUN"]]), r[idx["SIGLA_UF"]])
        for r in linhas
        if r[idx["NOME_CATMETROPOL"]] == "Região Metropolitana de Campinas"
    }


def grupo_do_endereco(endereco, regic, campinas):
    """'Campinas', a capital metrópole de referência, ou '' (fora do recorte)."""
    c = recorte_rm.classifica(endereco)
    if (recorte_rm.chave(c["municipio"]), c["uf"]) in campinas:
        return "Campinas"
    capital = c["capital_referencia"]
    if c["situacao"] in recorte_rm.SITUACOES_NO_RECORTE and regic.get(capital, ("",))[0] == "Metrópoles":
        return capital
    return ""


def situacao(r, termos, grupo):
    if not planilha.bate_pais({"formattedAddress": r["endereco"]}):
        return "fora_do_brasil"
    if r["status_google"] == "CLOSED_PERMANENTLY":
        return "fechado_definitivamente"
    no_nome = planilha.contem_keyword(r["nome"], planilha.KEYWORDS_NOME)
    if not no_nome and not (termos - planilha.TERMOS_BAIXA_PRECISAO):
        return "so_termo_baixa_precisao"
    if not grupo:
        return "fora_do_recorte"
    if int(r["volume_avaliacoes"] or 0) < MINIMO_AVALIACOES:
        return "ate_100_avaliacoes"
    return "triagem_nome" if no_nome else "triagem_indefinido"


def main():
    regic, campinas = load_regic(), rm_campinas()
    with open(CANDIDATOS, newline="", encoding="utf-8") as f:
        antigos = {r["place_id"] for r in csv.DictReader(f)}

    por_id, termos, pagina = {}, defaultdict(set), {}
    with open(REPAGINACAO, newline="", encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))
    for r in linhas:
        pid = r["place_id"]
        por_id.setdefault(pid, r)
        termos[pid].add(r["termo_busca"])
        pagina[pid] = min(pagina.get(pid, 9), int(r["pagina"]))
    n_buscas = len({(r["capital_busca"], r["termo_busca"]) for r in linhas})
    print(f"{len(linhas)} ocorrências em {n_buscas} buscas; {len(por_id)} place_id únicos, "
          f"{len(set(por_id) - antigos)} novos (fora do B1_candidatos.csv)")

    # População medida: os novos, mais os antigos que caem na RM de Campinas.
    funil, candidatos = defaultdict(Counter), []
    medidos = 0
    for pid, r in por_id.items():
        grupo = grupo_do_endereco(r["endereco"], regic, campinas)
        novo = pid not in antigos
        if not novo and grupo != "Campinas":
            continue
        medidos += 1
        s = situacao(r, termos[pid], grupo)
        coluna = "Campinas" if grupo == "Campinas" else "14 capitais metrópoles" if grupo else "fora do recorte"
        funil[s][coluna] += 1
        if s.startswith("triagem"):
            candidatos.append({
                "grupo": grupo, "place_id": pid, "nome": r["nome"], "endereco": r["endereco"],
                "volume_avaliacoes": r["volume_avaliacoes"], "avaliacao_media": r["avaliacao_media"],
                "situacao": s, "novo_place_id": "sim" if novo else "não",
                "menor_pagina": pagina[pid], "termos_busca": ";".join(sorted(termos[pid])),
                "categorias_google": r["categorias_google"], "status_google": r["status_google"],
                "link_google_maps": r["link_google_maps"], "data_coleta": r["data_coleta"],
            })

    colunas = ["14 capitais metrópoles", "Campinas", "fora do recorte"]
    SAIDA.mkdir(parents=True, exist_ok=True)
    with open(SAIDA / "B1_repaginacao_funil.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["situacao", *colunas, "total"])
        for s in SITUACOES:
            w.writerow([s, *(funil[s][c] for c in colunas), sum(funil[s].values())])
        totais = [sum(funil[s][c] for s in SITUACOES) for c in colunas]
        w.writerow(["total", *totais, sum(totais)])
    # Fechamento: cada place_id medido em uma única situação e um único grupo.
    assert sum(totais) == medidos, f"funil {sum(totais)} != medidos {medidos}"
    assert set(funil) <= set(SITUACOES), set(funil) - set(SITUACOES)

    candidatos.sort(key=lambda c: (c["grupo"] != "Campinas", c["grupo"], -int(c["volume_avaliacoes"])))
    with open(SAIDA / "B1_repaginacao_candidatos.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(candidatos[0]) if candidatos else ["place_id"])
        w.writeheader()
        w.writerows(candidatos)

    print(f"\n{medidos} place_id medidos (soma do funil confere, diferença 0)")
    print(f"{'situação':28s}" + "".join(f"{c:>24s}" for c in colunas))
    for s in SITUACOES:
        print(f"{s:28s}" + "".join(f"{funil[s][c]:>24d}" for c in colunas))
    print(f"{'total':28s}" + "".join(f"{t:>24d}" for t in totais))
    por_grupo = Counter((c["grupo"], c["situacao"]) for c in candidatos)
    print(f"\nÀ porta da triagem manual: {len(candidatos)}")
    for (g, s), n in sorted(por_grupo.items()):
        print(f"  {g:16s} {s:20s} {n}")
    print("Por página em que apareceram:", dict(sorted(Counter(c["menor_pagina"] for c in candidatos).items())))


if __name__ == "__main__":
    main()
