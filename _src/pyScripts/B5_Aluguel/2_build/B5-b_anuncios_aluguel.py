"""
Junta os CSVs do coletor de anúncios (webscripts/portais_aluguel.user.js) num
cadastro único de anúncios de aluguel e em resumos do preço pedido por bairro e
pelas áreas candidatas do 6.4.

Entrada: dados/B5_aluguel/_dados-brutos/AAAA-MM-DD_HHmm_<portal>_anuncios_aluguel.csv
         (os CSVs baixados pelo coletor, um por portal e data; o nome antigo, sem a hora,
         também vale). CSV da pasta fora desse padrão (ex.: "... (1).csv") gera aviso.
         Bairros oficiais: dados/B4_operacional/_dados-agregados/[B4] População por
         Bairro 2022 (IBGE Censo).csv; apelidos dos portais em outros/bairros_apelidos.csv.
Saídas em dados/B5_aluguel/_dados-agregados/, no padrão "[B5] {dado} {período} ({fonte}).csv":
  "Anúncios de Aluguel"              um anúncio por linha: subtipo, porte, aluguel, encargos, R$/m², bairro
  "Aluguel Pedido por Bairro"        por segmento, subtipo e bairro: anúncios, quartis do R$/m², encargos
  "Aluguel Pedido por Área do 6.4"   lojas e pontos no porte do plano, por área candidata: C04 e C05
  "Possíveis Duplicatas de Aluguel"  pares com área e aluguel a até 5%, para conferir à mão (não saem)
  "Cobertura das Buscas de Aluguel"  por busca: total que o portal diz ter e anúncios lidos

Regras:
  - Fica só o que é aluguel em Salvador, com preço entre R$ 300 e R$ 100 mil e área informada.
  - ZAP e Viva Real publicam o mesmo anúncio com o mesmo id: conta uma vez (coluna portais).
  - IPTU é gravado como o anunciante digitou, às vezes anual. Vira mensal (÷ 12, coluna
    iptu_ajuste) quando o título traz o total mensal ("por R$ 20.875,00/mês") e ele fecha com
    o IPTU anual, ou, sem essa conferência, quando o IPTU passa de 50% do aluguel (mensal
    nessa altura não ocorre; 12/11/2026: o título confirmou anual a 52% do aluguel e mensal
    a 31%). O valor digitado fica em iptu_informado.
  - Anúncio repetido com outro id (mesmo segmento, bairro, área, aluguel, condomínio e IPTU)
    conta uma vez; a coleta mais recente de cada anúncio prevalece. Condomínio e IPTU entram
    na chave porque lojas distintas de um mesmo shopping repetem área e aluguel e só se
    distinguem pelos encargos (12/11/2026, Shopping Itaigara: cinco lojas de 219 m² a
    R$ 10.000); encargo vazio conta como 0 (a OLX deixa vazio o que o ZAP diz isento). Pares quase iguais (área e aluguel a até 5%) não saem: vão para "Possíveis
    Duplicatas", para conferência.
  - Segmento: primeiro pela categoria da busca (busca_url: loja-salao, conjunto-comercial,
    comercio-e-industria, ponto-comercial → comercial; apartamento, casa, QuintoAndar →
    residencial); busca sem categoria, pelo tipo e título com termos só comerciais ("sala
    comercial", não "sala"). A coluna segmento_origem diz qual dos dois decidiu.
  - Subtipo do comercial: loja_ponto (loja de rua, ponto, salão, box), sala (sala ou conjunto
    em prédio, escritório, consultório), galpao, predio ou outro; pela busca e, sem ela, pelo
    texto. A luderia precisa de loja térrea: a área do 6.4 usa só loja_ponto.
  - Porte do plano: área de 100 a 200 m² (cobre a C03, de 110 a 150 m² nos cenários; faixa do autor, N6).
  - Encargos: condomínio + IPTU por m² e em % do aluguel (unidade da C05), quando o anúncio
    informa os dois; custo de ocupação = aluguel + encargos por m².
  - Bairro: casado com os 170 bairros de Salvador do Censo 2022 sem acento, caixa e
    pontuação, ou pelo arquivo de apelidos; sem correspondência, fica a grafia mais
    frequente do portal (bairro_no_censo = "não") e o print lista os casos.
  - Área do 6.4: Pituba/Itaigara, Barra/Graça e Rio Vermelho; os demais bairros numa linha só.
  - R$/m² fora de [Q1 − 3·IQR, Q3 + 3·IQR] do segmento sai (área ou preço digitado errado);
    o print mostra quantos saíram em cada segmento.
  - Resumos: grupo com menos de 5 anúncios fica com amostra_suficiente = "não" e sem quartis.
  - É preço pedido, não preço fechado: o FipeZap (também preço de anúncio) e as cotações
    no ponto completam as premissas C04 (aluguel por m²) e C05 (condomínio e IPTU, % do aluguel)
    do modelo (_src/outros/G3_modelo_financeiro/gerar_modelo_financeiro.py).
"""

# Caminhos: _src/outros/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "outros").glob("G[0-9]_*")), str(_AQUI.parents[1] / "5_outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import re
import unicodedata
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit, unquote

import pandas as pd

ROOT = Path(__file__).resolve().parents[4]
IN_DIR = ROOT / "dados" / "B5_aluguel" / "_dados-brutos"
OUT_DIR = ROOT / "dados" / "B5_aluguel" / "_dados-agregados"
CENSO = ROOT / "dados" / "B4_operacional" / "_dados-agregados" / "[B4] População por Bairro 2022 (IBGE Censo).csv"
APELIDOS = _AQUI.parents[1] / "5_outros" / "bairros_apelidos.csv"
CD_SALVADOR = 2927408
FONTE = {"olx": "OLX", "zap": "ZAP", "vivareal": "Viva Real", "quintoandar": "QuintoAndar"}
ALUGUEL_MIN, ALUGUEL_MAX = 300, 100_000
PORTE_MIN, PORTE_MAX = 100, 200
AREAS_6_4 = {"Pituba": "Pituba/Itaigara", "Itaigara": "Pituba/Itaigara", "Barra": "Barra/Graça",
             "Graça": "Barra/Graça", "Rio Vermelho": "Rio Vermelho"}
DEMAIS = "demais bairros"
TOLERANCIA_DUPLICATA = 0.05
RE_ARQUIVO = re.compile(r"^\d{4}-\d{2}-\d{2}(_\d{4})?_[a-z]+_anuncios_aluguel\.csv$")
# Categoria da busca (busca_url): decide o segmento quando a busca já filtrou o tipo. O comercial vem
# primeiro: "/casa-comercial/" casaria com o "/casa-" do residencial.
RE_BUSCA_COMERCIAL = re.compile(r"loja-salao|conjunto-comercial|comercio-e-industria|ponto-comercial|casa-comercial|imovel-comercial|galpao|predio-inteiro|imoveis-comerciais|consultorio")
RE_BUSCA_RESIDENCIAL = re.compile(r"quintoandar\.com\.br|/apartamentos?[/_-]|/casas?[/_-]|kitnet|flat|cobertura")
# Busca sem categoria: termos que só aparecem em imóvel comercial ("sala comercial", não "sala";
# "box comercial", não "box", que também é o do banheiro).
RE_COMERCIAL = re.compile(
    r"\b(lojas?|(?:salao|saloes|salas?|pontos?|imove(?:l|is)|predios?|conjuntos?|box) comercia(?:l|is)"
    r"|galpao|galpoes|depositos?|armazem|escritorios?|consultorios?|andar corporativo"
    r"|sala para escritorio|sala empresarial|centro empresarial)\b"
)
# Subtipo do comercial, na ordem: o primeiro que casar vale.
SUBTIPO_BUSCA = [("loja_ponto", r"loja-salao|ponto-comercial"), ("sala", r"conjunto-comercial|consultorio"),
                 ("galpao", r"galpao"), ("predio", r"predio-inteiro")]
SUBTIPO_TEXTO = [
    ("galpao", r"\b(galpao|galpoes|depositos?|armazem)\b"),
    ("predio", r"\b(predios? comercia(?:l|is)|predio inteiro)\b"),
    ("sala", r"\b(salas? comercia(?:l|is)|conjuntos? comercia(?:l|is)|escritorios?|consultorios?|andar corporativo"
             r"|sala para escritorio|sala empresarial|centro empresarial)\b"),
    ("loja_ponto", r"\b(lojas?|pontos? comercia(?:l|is)|salao comercial|saloes comerciais|box comercial)\b"),
]
NUMERICAS = ["aluguel", "condominio", "iptu", "condominio_iptu", "area_m2", "quartos", "banheiros", "vagas",
             "pagina", "total_busca"]
IQR_FATOR = 3
MIN_AMOSTRA = 5
IPTU_ANUAL_RAZAO = 0.5  # IPTU acima desta fração do aluguel é anual
RE_TOTAL_TITULO = re.compile(r"por R\$\s*([\d.]+(?:,\d{1,2})?)\s*/\s*m[eê]s", re.IGNORECASE)


def sem_acento(texto) -> str:
    t = unicodedata.normalize("NFD", str(texto or ""))
    return "".join(c for c in t if unicodedata.category(c) != "Mn").lower().strip()


def chave_bairro(texto) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]", " ", sem_acento(texto))).strip()


def segmento_de(busca_url, tipo, titulo) -> tuple[str, str]:
    """Devolve (segmento, origem): pela categoria da busca ou, sem ela, pelo tipo e título."""
    url = str(busca_url or "").lower()
    if RE_BUSCA_COMERCIAL.search(url):
        return "comercial", "busca"
    if RE_BUSCA_RESIDENCIAL.search(url):
        return "residencial", "busca"
    texto = sem_acento(f"{tipo} {titulo}")
    return ("comercial" if RE_COMERCIAL.search(texto) else "residencial"), "texto"


def tipos_da_busca(url):
    """Parte da busca que diz o tipo: o parâmetro tipos= do ZAP e do Viva Real, se houver, ou a URL
    toda. Com mais de um tipo ("tipos=imovel-comercial_comercial,ponto-comercial_comercial"), None:
    a busca não decide o subtipo, e vale o tipo e o título do anúncio."""
    u = unquote(url)
    m = re.search(r"[?&]tipos=([^&]*)", u)
    if not m:
        return u
    return None if "," in m.group(1) else m.group(1)


def subtipo_de(segmento, busca_url, tipo, titulo) -> str:
    if segmento != "comercial":
        return "residencial"
    tipos = tipos_da_busca(str(busca_url or "").lower())
    for nome, padrao in SUBTIPO_BUSCA:
        if tipos is not None and re.search(padrao, tipos):
            return nome
    texto = sem_acento(f"{tipo} {titulo}")
    for nome, padrao in SUBTIPO_TEXTO:
        if re.search(padrao, texto):
            return nome
    return "outro"


def busca_base(url) -> str:
    """URL da busca sem o parâmetro de página (?o= no OLX, ?pagina= nos demais)."""
    p = urlsplit(str(url or ""))
    q = [(k, v) for k, v in parse_qsl(p.query) if k not in ("o", "pagina")]
    return urlunsplit((p.scheme, p.netloc, p.path, urlencode(q), ""))


def bairros_oficiais() -> dict[str, str]:
    """Chave sem acento → nome do bairro no Censo 2022 (Salvador), mais os apelidos dos portais."""
    if not CENSO.exists():
        print(f"AVISO: {CENSO.name} não encontrado; bairros ficam com a grafia do portal.")
        return {}
    censo = pd.read_csv(CENSO, usecols=["cd_mun", "nm_bairro"])
    nomes = censo.loc[censo["cd_mun"].eq(CD_SALVADOR), "nm_bairro"]
    mapa = {chave_bairro(n): n for n in nomes}
    for parte in [n for n in nomes if "/" in n]:  # "Beiru / Tancredo Neves" casa com cada metade
        for metade in parte.split("/"):
            mapa.setdefault(chave_bairro(metade), parte)
    if APELIDOS.exists():
        ap = pd.read_csv(APELIDOS, sep=";", dtype=str)
        for portal, oficial in zip(ap["bairro_portal"], ap["bairro_oficial"]):
            mapa[chave_bairro(portal)] = oficial
    return mapa


def ler_coletas() -> pd.DataFrame:
    fora = sorted(a.name for a in IN_DIR.glob("*.csv") if not RE_ARQUIVO.match(a.name))
    for nome in fora:
        print(f"AVISO: {nome} fora do padrão AAAA-MM-DD_HHmm_<portal>_anuncios_aluguel.csv; não foi lido. Renomeie se for do coletor.")
    arquivos = sorted(a for a in IN_DIR.glob("*.csv") if RE_ARQUIVO.match(a.name))
    if not arquivos:
        raise FileNotFoundError(f"Nenhum CSV do coletor em {IN_DIR}")
    partes = []
    for arq in arquivos:
        df = pd.read_csv(arq, sep=";", dtype=str, encoding="utf-8-sig", keep_default_na=False)
        df["arquivo"] = arq.name
        partes.append(df)
        print(f"lido: {arq.name} ({len(df)} anúncios)")
    df = pd.concat(partes, ignore_index=True).fillna("")
    for c in NUMERICAS:
        if c not in df.columns:  # CSV de versão anterior do coletor (ex.: sem total_busca)
            df[c] = ""
        # O coletor grava sem separador de milhar e com vírgula decimal.
        df[c] = pd.to_numeric(df[c].str.replace(",", ".", regex=False), errors="coerce")
    return df


def cobertura(bruto: pd.DataFrame) -> pd.DataFrame:
    """Por busca (sem o parâmetro de página): total que o portal diz ter e anúncios distintos lidos."""
    d = bruto.assign(busca=bruto["busca_url"].map(busca_base))
    g = d.groupby(["portal", "busca"])
    res = pd.DataFrame({
        "total_busca": g["total_busca"].max(),
        "anuncios_lidos": g["id"].nunique(),
        "paginas_lidas": g["pagina"].nunique(),
        "data_coleta": g["data_coleta"].max(),
    }).reset_index()
    res["cobertura"] = (res["anuncios_lidos"] / res["total_busca"]).round(3)
    for r in res.itertuples():
        total = "total não lido na página" if pd.isna(r.total_busca) else f"{r.cobertura:.0%} de {r.total_busca:.0f}"
        print(f"cobertura {FONTE.get(r.portal, r.portal)}: {r.anuncios_lidos} anúncios ({total}) em {r.busca}")
    return res


def total_do_titulo(titulo) -> float | None:
    """Total mensal que o título anuncia ("por R$ 28.460,20/mês"), ou None."""
    m = RE_TOTAL_TITULO.search(str(titulo or ""))
    return float(m.group(1).replace(".", "").replace(",", ".")) if m else None


def ajustar_iptu(df: pd.DataFrame) -> pd.DataFrame:
    """IPTU anual vira mensal: pelo total mensal do título, ou por passar de IPTU_ANUAL_RAZAO do aluguel."""
    iptu, cond = df["iptu"], df["condominio"].fillna(0)
    total = df["titulo"].map(total_do_titulo)
    perto = lambda a, b: (a - b).abs() <= 1  # noqa: E731  (centavos do arredondamento do portal)
    titulo_anual = total.notna() & perto(df["aluguel"] + cond + iptu / 12, total)
    titulo_mensal = total.notna() & perto(df["aluguel"] + cond + iptu, total)
    razao_anual = ~titulo_mensal & ~titulo_anual & (iptu > IPTU_ANUAL_RAZAO * df["aluguel"])
    anual = iptu.gt(0) & (titulo_anual | razao_anual)
    ajuste = pd.Series("", index=df.index).mask(titulo_anual & anual, "anual pelo título")
    ajuste = ajuste.mask(razao_anual & anual, f"anual por passar de {IPTU_ANUAL_RAZAO:.0%} do aluguel")
    novo = iptu.where(~anual, (iptu / 12).round(2))
    print(f"IPTU anual convertido em mensal: {anual.sum()} anúncios ({(titulo_anual & anual).sum()} pelo título)")
    return df.assign(iptu_informado=iptu, iptu=novo, iptu_ajuste=ajuste,
                     condominio_iptu=df["condominio_iptu"].where(~anual, df["condominio"] + novo))


def tratar(df: pd.DataFrame) -> pd.DataFrame:
    n0 = len(df)
    df = df[df["operacao"].eq("aluguel")]
    df = df[df["cidade"].map(sem_acento).eq("salvador")]
    df = df[df["aluguel"].between(ALUGUEL_MIN, ALUGUEL_MAX) & df["area_m2"].gt(0)]
    print(f"filtro (aluguel em Salvador, preço e área válidos): {n0} -> {len(df)}")
    df = ajustar_iptu(df)

    # ZAP e Viva Real dividem os ids; a coleta mais recente de cada anúncio prevalece.
    df = df.assign(chave=df["portal"].where(~df["portal"].isin(["zap", "vivareal"]), "grupo_olx") + ":" + df["id"])
    df = df.sort_values(["data_coleta", "pagina"])
    portais = df.groupby("chave")["portal"].agg(lambda s: ", ".join(sorted({FONTE[p] for p in s})))
    n1 = len(df)
    df = df.drop_duplicates("chave", keep="last").assign(portais=lambda d: d["chave"].map(portais))
    print(f"mesmo id em mais de um portal ou coleta: {n1} -> {len(df)}")

    segmentos = [segmento_de(u, t, ti) for u, t, ti in zip(df["busca_url"], df["tipo"], df["titulo"])]
    df = df.assign(segmento=[s for s, _ in segmentos], segmento_origem=[o for _, o in segmentos])
    df = df.assign(
        subtipo=[subtipo_de(s, u, t, ti) for s, u, t, ti in zip(df["segmento"], df["busca_url"], df["tipo"], df["titulo"])],
        porte_plano=df["area_m2"].between(PORTE_MIN, PORTE_MAX).map({True: "sim", False: "não"}),
        aluguel_m2=(df["aluguel"] / df["area_m2"]).round(2),
        encargos_m2=(df["condominio_iptu"] / df["area_m2"]).round(2),
        encargos_pct_aluguel=(df["condominio_iptu"] / df["aluguel"]).round(3),
    )
    df = df.assign(custo_ocupacao_m2=(df["aluguel_m2"] + df["encargos_m2"]).round(2))
    print(f"segmento pela busca: {df['segmento_origem'].eq('busca').sum()}; pelo texto: {df['segmento_origem'].eq('texto').sum()}")

    df = com_bairro(df)

    # Vazio e zero valem o mesmo: a OLX deixa vazio o encargo que o ZAP mostra como "isento"
    # (12/11/2026: a mesma loja de 580 m² na Pituba, com condomínio vazio num e 0 no outro).
    repeticao = df[["segmento", "bairro_chave", "area_m2", "aluguel", "condominio", "iptu"]].fillna({"condominio": 0, "iptu": 0})
    n2 = len(df)
    df = df[~repeticao.duplicated(keep="last")]
    print(f"mesmo segmento, bairro, área, aluguel, condomínio e IPTU com outro id: {n2} -> {len(df)}")

    df = sem_extremos(df)

    colunas = ["portais", "id", "url", "segmento", "segmento_origem", "subtipo", "porte_plano", "tipo", "titulo",
               "bairro", "bairro_no_censo", "bairro_portal", "area_6_4", "endereco", "aluguel", "condominio", "iptu",
               "iptu_informado", "iptu_ajuste", "condominio_iptu", "area_m2", "aluguel_m2", "encargos_m2", "encargos_pct_aluguel", "custo_ocupacao_m2", "quartos", "banheiros",
               "vagas", "anunciante", "publicado", "data_coleta"]
    return df[colunas + ["bairro_chave"]].sort_values(["segmento", "subtipo", "bairro", "aluguel_m2"]).reset_index(drop=True)


def com_bairro(df: pd.DataFrame) -> pd.DataFrame:
    """Bairro oficial do Censo quando casa; senão, a grafia mais frequente do portal."""
    chave = df["bairro"].map(chave_bairro)
    # Grafia do portal: a mais frequente de cada chave (empate: a primeira em ordem alfabética).
    grafia = (df.assign(b=df["bairro"].str.strip(), k=chave).groupby("k")["b"]
              .agg(lambda s: s.value_counts().sort_index().sort_values(ascending=False, kind="stable").index[0]))
    oficiais = bairros_oficiais()
    oficial = chave.map(oficiais)
    df = df.assign(bairro_portal=chave.map(grafia), bairro_no_censo=oficial.notna().map({True: "sim", False: "não"}))
    df = df.assign(bairro=oficial.fillna(df["bairro_portal"]))
    df = df.assign(bairro_chave=df["bairro"].map(chave_bairro), area_6_4=df["bairro"].map(AREAS_6_4).fillna(DEMAIS))
    sem = df.loc[df["bairro_no_censo"].eq("não"), "bairro_portal"].value_counts()
    if oficiais and len(sem):
        print(f"bairros sem correspondência no Censo ({sem.sum()} anúncios); inclua em {APELIDOS.name} se for apelido:")
        for b, n in sem.items():
            print(f"  {b or '(vazio)'}: {n}")
    return df


def sem_extremos(df: pd.DataFrame) -> pd.DataFrame:
    """Tira o R$/m² fora de [Q1 − 3·IQR, Q3 + 3·IQR] de cada segmento (área ou preço digitado errado)."""
    g = df.groupby("segmento")["aluguel_m2"]
    q1, q3 = g.transform(lambda s: s.quantile(0.25)), g.transform(lambda s: s.quantile(0.75))
    iqr = q3 - q1
    dentro = df["aluguel_m2"].between(q1 - IQR_FATOR * iqr, q3 + IQR_FATOR * iqr)
    for seg, n in df.loc[~dentro, "segmento"].value_counts().items():
        print(f"R$/m² extremo ({seg}): {n} anúncios fora de Q1 − {IQR_FATOR}·IQR a Q3 + {IQR_FATOR}·IQR")
    print(f"sem extremos de R$/m²: {len(df)} -> {dentro.sum()}")
    return df[dentro]


def quase_duplicatas(df: pd.DataFrame) -> pd.DataFrame:
    """Pares de anúncios do mesmo segmento e bairro com área e aluguel a até 5% (não saem da base)."""
    campos = ["portais", "id", "url", "area_m2", "aluguel", "titulo"]
    d = df.reset_index(drop=True).reset_index(names="i")
    pares = d.merge(d, on=["segmento", "bairro_chave"], suffixes=("_a", "_b"))
    pares = pares[pares["i_a"] < pares["i_b"]]
    perto = lambda a, b: (a - b).abs() <= TOLERANCIA_DUPLICATA * pd.concat([a, b], axis=1).max(axis=1)  # noqa: E731
    pares = pares[perto(pares["area_m2_a"], pares["area_m2_b"]) & perto(pares["aluguel_a"], pares["aluguel_b"])]
    pares = pares.assign(bairro=pares["bairro_a"])
    colunas = ["segmento", "bairro"] + [f"{c}_{s}" for s in ("a", "b") for c in campos]
    print(f"possíveis duplicatas (área e aluguel a até {TOLERANCIA_DUPLICATA:.0%}): {len(pares)} pares, para conferir")
    return pares[colunas].reset_index(drop=True)


def _quartis(g, coluna: str, nome: str) -> dict:
    return {f"{nome}_p25": g[coluna].quantile(0.25), f"{nome}_mediana": g[coluna].median(),
            f"{nome}_p75": g[coluna].quantile(0.75)}


def _marcar_amostra(res: pd.DataFrame, n: str, quartis: list[str], pos: int) -> None:
    """Com menos de MIN_AMOSTRA, os quartis não dizem nada: ficam vazios e a linha é marcada."""
    pouca = res[n] < MIN_AMOSTRA
    res.loc[pouca, quartis] = float("nan")
    if "amostra_suficiente" not in res:
        res.insert(pos, "amostra_suficiente", (~pouca).map({True: "sim", False: "não"}))


def resumo_por_bairro(df: pd.DataFrame) -> pd.DataFrame:
    g = df.groupby(["segmento", "subtipo", "bairro"])
    res = pd.DataFrame({
        "anuncios": g.size(),
        **_quartis(g, "aluguel_m2", "aluguel_m2"),
        "aluguel_mediana": g["aluguel"].median(),
        "area_m2_mediana": g["area_m2"].median(),
        "anuncios_com_encargos": g["encargos_m2"].count(),
        "encargos_m2_mediana": g["encargos_m2"].median(),
        "custo_ocupacao_m2_mediana": g["custo_ocupacao_m2"].median(),
    }).round(2).reset_index()
    _marcar_amostra(res, "anuncios", ["aluguel_m2_p25", "aluguel_m2_p75"], 4)
    # Cada anúncio está num único segmento, subtipo e bairro: a soma das linhas fecha com o total.
    assert res["anuncios"].sum() == len(df), "resumo por bairro não fecha com o total de anúncios"
    return res.sort_values(["segmento", "subtipo", "anuncios"], ascending=[True, True, False])


def resumo_area_6_4(df: pd.DataFrame) -> pd.DataFrame:
    """Lojas e pontos no porte do plano, por área candidata do 6.4: insumo de C04 e C05."""
    base = df[df["subtipo"].eq("loja_ponto") & df["porte_plano"].eq("sim")]
    g = base.groupby("area_6_4")
    res = pd.DataFrame({
        "anuncios": g.size(),
        **_quartis(g, "aluguel_m2", "aluguel_m2"),
        "anuncios_com_encargos": g["encargos_m2"].count(),
        **_quartis(g, "encargos_m2", "encargos_m2"),
        **_quartis(g, "encargos_pct_aluguel", "encargos_pct_aluguel"),
        "custo_ocupacao_m2_mediana": g["custo_ocupacao_m2"].median(),
        "area_m2_mediana": g["area_m2"].median(),
    }).round(2).reset_index()
    _marcar_amostra(res, "anuncios", ["aluguel_m2_p25", "aluguel_m2_p75"], 2)
    _marcar_amostra(res, "anuncios_com_encargos", ["encargos_m2_p25", "encargos_m2_p75",
                                                   "encargos_pct_aluguel_p25", "encargos_pct_aluguel_p75"], 2)
    # Cada anúncio está numa única área (ou em "demais bairros"): a soma fecha com o total do recorte.
    assert res["anuncios"].sum() == len(base), "resumo por área do 6.4 não fecha com o total do recorte"
    ordem = {a: i for i, a in enumerate(dict.fromkeys(AREAS_6_4.values()))}
    return res.sort_values("area_6_4", key=lambda s: s.map(ordem).fillna(len(ordem))).reset_index(drop=True)


def montar(bruto: pd.DataFrame) -> dict[str, pd.DataFrame]:
    cob = cobertura(bruto)
    df = tratar(bruto)
    return {
        "Anúncios de Aluguel": df.drop(columns="bairro_chave"),
        "Aluguel Pedido por Bairro": resumo_por_bairro(df),
        "Aluguel Pedido por Área do 6.4": resumo_area_6_4(df),
        "Possíveis Duplicatas de Aluguel": quase_duplicatas(df),
        "Cobertura das Buscas de Aluguel": cob,
    }


def main() -> None:
    tabelas = montar(ler_coletas())
    df = tabelas["Anúncios de Aluguel"]
    meses = sorted({d[:7] for d in df["data_coleta"]})
    periodo = meses[0] if len(meses) == 1 else f"{meses[0]} a {meses[-1]}"
    fonte = ", ".join(FONTE[p] for p in FONTE if any(FONTE[p] in s for s in df["portais"]))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for dado, tabela in tabelas.items():
        destino = OUT_DIR / f"[B5] {dado} {periodo} ({fonte}).csv"
        tabela.to_csv(destino, sep=";", decimal=",", index=False, encoding="utf-8-sig")
        print(f"gravado: {destino.name} ({len(tabela)} linhas)")
    for (seg, sub), n in df.groupby(["segmento", "subtipo"]).size().items():
        mediana = df.loc[df["segmento"].eq(seg) & df["subtipo"].eq(sub), "aluguel_m2"].median()
        print(f"  {seg}, {sub}: {n} anúncios, mediana de R$ {mediana:.2f}/m²")


if __name__ == "__main__":
    main()
