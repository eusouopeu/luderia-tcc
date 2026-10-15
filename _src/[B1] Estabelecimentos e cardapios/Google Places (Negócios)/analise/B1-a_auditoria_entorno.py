"""
Bloco B1 - amostra de auditoria do entorno (coletor maps_entorno.user.js, Google
Maps e OpenStreetMap): fidelidade e completude das estações e shoppings contados
a até 1000 m (_instrucoes/4_metodologia.md §3.4, etapa 1 do B1).

Desenho: unidade = estabelecimento da fila do entorno; 20% (arredondado para
cima), estratificado pela capital do endereço, alocação proporcional pelos
maiores restos e, dentro do estrato, as menores chaves da semente
(_src/extras/amostrar_auditoria.py). A chave depende só do place_id: depois de
uma recoleta, rodar de novo sorteia os mesmos estabelecimentos e atualiza os
valores coletados.

Entradas (a coleta mais recente de cada estabelecimento, pela data no nome do
arquivo; parciais ficam de fora):
  entorno/B1_entorno_maps_fila.csv                         população (54 casas em 15/10/2026)
  _dados-brutos/entornos/*_entorno_resumo.csv e *_entorno_resultados.csv          (Maps)
  _dados-brutos/entornos/*_entorno_osm_resumo.csv e *_entorno_osm_resultados.csv  (OSM)

Saídas em _dados-brutos/entornos/auditoria/:
  B1_auditoria_entorno_estabelecimentos.csv  um estabelecimento por linha: contagens do
      Maps e do OSM e colunas para a contagem manual e os itens que faltaram
  B1_auditoria_entorno_itens.csv  cada estação, shopping, praia ou parque contado a até
      1000 m nos estabelecimentos sorteados, mais a estação mais próxima de cada fonte,
      com colunas para conferir existência, grupo e distância em linha reta (e, opcional,
      a distância a pé, para medir o quanto a linha reta subestima o trajeto)
  auditoria_registro.csv  uma linha por sorteio

Passo a passo da conferência: textos/instrumentos/roteiro_auditoria_entorno_B1.md.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/analise/B1-a_auditoria_entorno.py"
"""
# Caminhos: _src/extras/ (log comum e sorteio); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import math
import re
from urllib.parse import quote

import pandas as pd

import amostrar_auditoria as aa

ROOT = Path(__file__).resolve().parents[4]
PROCESSADOS = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
BRUTOS = PROCESSADOS / "_dados-brutos"
FILA = PROCESSADOS / "entorno/B1_entorno_maps_fila.csv"
ENTORNOS = BRUTOS / "entornos"
SAIDA = ENTORNOS / "auditoria"

SEMENTE = 20261015
FRACAO = 0.20
RAIO_M = 1000
GRUPOS = ["metro", "trem", "vlt_brt", "shopping", "praia_parque"]
COL_GRUPO = {"metro": "estacoes_metro", "trem": "estacoes_trem", "vlt_brt": "estacoes_vlt_brt",
             "shopping": "shoppings", "praia_parque": "praias_parques"}
TRANSPORTE = ["metro", "trem", "vlt_brt"]
CONFERIR_ESTAB = [f"qt_{COL_GRUPO[g]}_1000m_manual" for g in GRUPOS] + [
    "estacao_mais_proxima_manual", "dist_estacao_mais_proxima_manual_m", "faltantes"]
CONFERIR_ITENS = ["existe", "grupo_confere", "distancia_medida_m", "distancia_a_pe_m"]


def ler(caminho: Path) -> pd.DataFrame:
    return pd.read_csv(caminho, sep=";", dtype=str, encoding="utf-8-sig")


def data_do_nome(caminho: Path) -> str:
    m = re.search(r"\d{4}-\d{2}-\d{2}", caminho.name)
    return m.group(0) if m else ""


def mais_recentes(tipo: str) -> pd.DataFrame:
    """Linha mais recente de cada place_id entre os resumos do tipo dado
    ('entorno_resumo' ou 'entorno_osm_resumo'), com o arquivo de origem."""
    partes = []
    for f in ENTORNOS.glob(f"*_{tipo}*.csv"):
        if "parcial" in f.name or (tipo == "entorno_resumo" and "_osm_" in f.name):
            continue
        d = ler(f)
        d["arquivo"] = f.name
        d["_ordem"] = data_do_nome(f) + f"{f.stat().st_mtime:015.3f}"
        partes.append(d)
    if not partes:
        return pd.DataFrame(columns=["place_id", "arquivo"])
    todos = pd.concat(partes)
    # Linha sem coleta (situação "não coletado") não substitui uma coleta anterior.
    todos = todos[~todos["situacao"].fillna("").str.startswith(("não coletado", "erro"))]
    return todos.sort_values("_ordem").drop_duplicates("place_id", keep="last").drop(columns="_ordem")


def itens(resumos: pd.DataFrame, sufixo_resumo: str, sufixo_resultados: str, fonte: str,
          sorteados: set) -> pd.DataFrame:
    """Itens contados a até 1000 m (sem duplicatas) e a estação mais próxima, por estabelecimento
    sorteado, tirados do arquivo de resultados que acompanha o resumo usado."""
    linhas = []
    for arquivo, g in resumos[resumos.place_id.isin(sorteados)].groupby("arquivo"):
        res = ler(ENTORNOS / arquivo.replace(sufixo_resumo, sufixo_resultados))
        res = res[res.origem_place_id.isin(g.place_id)].copy()
        res["dist"] = pd.to_numeric(res.distancia_m, errors="coerce")
        res = res[res.duplicata_de.isna() & res.grupo.isin(GRUPOS)]
        if "fora_da_regiao" in res:
            res = res[res.fora_da_regiao.fillna("") != "sim"]
        else:
            # Coletas anteriores à versão 2026.10.15-1 não marcavam resultado de outra cidade.
            res = res[res.dist <= 50000]
        no_raio = res[res.dist <= RAIO_M].assign(motivo="contado a até 1000 m")
        prox = (res[res.grupo.isin(TRANSPORTE) & (res.dist > RAIO_M)].sort_values("dist")
                .drop_duplicates("origem_place_id").assign(motivo="estação mais próxima, fora do raio"))
        # A mais próxima só entra se nenhuma estação ficou no raio.
        com_estacao = set(no_raio[no_raio.grupo.isin(TRANSPORTE)].origem_place_id)
        prox = prox[~prox.origem_place_id.isin(com_estacao)]
        d = pd.concat([no_raio, prox])
        d["fonte"] = fonte
        d["arquivo"] = arquivo.replace(sufixo_resumo, sufixo_resultados)
        linhas.append(d)
    if not linhas:
        return pd.DataFrame()
    d = pd.concat(linhas)
    d["link_ponto"] = [f"https://www.google.com/maps/search/?api=1&query={a},{b}" for a, b in zip(d.lat, d.lng)]
    d["link_busca_nome"] = ["https://www.google.com/maps/search/?api=1&query=" + quote(str(n)) for n in d.nome]
    d["link_osm"] = ("https://www.openstreetmap.org/" + d.osm_id) if "osm_id" in d else ""
    cols = ["origem_place_id", "origem_nome", "fonte", "motivo", "nome", "grupo", "distancia_m", "lat", "lng",
            "link_ponto", "link_busca_nome", "link_osm", "arquivo"]
    extra = [c for c in ["categoria_maps", "n_avaliacoes", "osm_id", "tags_osm", "area_m2"] if c in d]
    return d[cols[:6] + extra + cols[6:]]


def main():
    fila = ler(FILA)
    maps = mais_recentes("entorno_resumo")
    osm = mais_recentes("entorno_osm_resumo")

    n = math.ceil(FRACAO * len(fila))
    amostra = aa.sortear(fila, "place_id", n, SEMENTE, estrato="capital_endereco")
    sorteados = set(amostra.place_id)

    # Contagens já coletadas, lado a lado (Maps sem praia/parque: o coletor do Maps não busca).
    def contagens(df, prefixo, dist_col):
        cols = {f"qt_{COL_GRUPO[g]}_{r}m": f"{prefixo}_qt_{COL_GRUPO[g]}_{r}m"
                for g in GRUPOS for r in (500, 1000) if f"qt_{COL_GRUPO[g]}_{r}m" in df}
        cols.update({dist_col: f"{prefixo}_dist_estacao_mais_proxima_m", "estacao_mais_proxima":
                     f"{prefixo}_estacao_mais_proxima", "arquivo": f"{prefixo}_arquivo"})
        data = "coletado_em" if "coletado_em" in df else "consultado_em"
        cols[data] = f"{prefixo}_coletado_em"
        return df[["place_id", *cols]].rename(columns=cols)

    base = amostra[["estrato_sorteio", "chave_sorteio", "place_id", "nome", "capital_endereco", "lat", "lng"]].copy()
    base["link_google_maps"] = "https://www.google.com/maps/place/?q=place_id:" + base.place_id
    base = (base.merge(contagens(maps, "maps", "dist_estacao_mais_proxima_lida_m"), on="place_id", how="left")
                .merge(contagens(osm, "osm", "dist_estacao_mais_proxima_m"), on="place_id", how="left"))
    sem_maps = base.maps_arquivo.isna().sum()
    sem_osm = base.osm_arquivo.isna().sum()

    it = pd.concat([itens(maps, "_entorno_resumo", "_entorno_resultados", "maps", sorteados),
                    itens(osm, "_entorno_osm_resumo", "_entorno_osm_resultados", "osm", sorteados)])
    it = it.sort_values(["origem_nome", "grupo", "fonte", "distancia_m"], key=lambda s: pd.to_numeric(s, errors="coerce")
                        if s.name == "distancia_m" else s)

    desenho = f"{FRACAO:.0%} da fila, estratificado por capital, maiores restos"
    aa.gravar(base, SAIDA, "B1_auditoria_entorno_estabelecimentos.csv", CONFERIR_ESTAB, script=__file__,
              semente=SEMENTE, populacao=len(fila), origem=[FILA], desenho=desenho)
    aa.gravar(it, SAIDA, "B1_auditoria_entorno_itens.csv", CONFERIR_ITENS, script=__file__, semente=SEMENTE,
              populacao=len(it), origem=[ENTORNOS / a for a in sorted(set(it.arquivo))],
              desenho="todos os itens contados a até 1000 m nos estabelecimentos sorteados + estação mais próxima")

    aa.resumo("B1 entorno (estabelecimentos)", len(fila), amostra)
    print(amostra.groupby("capital_endereco").size().to_string())
    print(f"itens a conferir: {len(it)} ({it.fonte.value_counts().to_dict()}; {it.grupo.value_counts().to_dict()})")
    if sem_maps or sem_osm:
        print(f"AVISO: {sem_maps} sorteados sem coleta do Maps e {sem_osm} sem coleta do OSM")
    print(f"gravado em: {SAIDA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
