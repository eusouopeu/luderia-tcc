"""
Constantes e funções comuns aos scripts do Bloco E (bases públicas).

Estrutura de pastas:
  _data/raw/[E] Bases publicas/<fonte>/   respostas brutas das APIs e arquivos originais
  _data/processed/[E] Bases publicas/     tabelas tratadas, prefixo bases_

A consulta ao SIDRA usa a API de agregados do IBGE, versão 3:
https://servicodados.ibge.gov.br/api/docs/agregados?versao=3
"""

from __future__ import annotations

import json
import pathlib
import re
import time

import pandas as pd
import requests

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW_DIR = ROOT / "_data" / "raw" / "[E] Bases publicas"
PROCESSED_DIR = ROOT / "_data" / "processed" / "[E] Bases publicas"
DATA_COLETA = time.strftime("%Y-%m-%d")
HEADERS = {"User-Agent": "Mozilla/5.0 (pesquisa academica UFBA - TCC Luderia)"}

# Código IBGE do município (7 dígitos) -> (capital, UF)
CAPITAIS = {
    "1200401": ("Rio Branco", "AC"),
    "2704302": ("Maceió", "AL"),
    "1600303": ("Macapá", "AP"),
    "1302603": ("Manaus", "AM"),
    "2927408": ("Salvador", "BA"),
    "2304400": ("Fortaleza", "CE"),
    "5300108": ("Brasília", "DF"),
    "3205309": ("Vitória", "ES"),
    "5208707": ("Goiânia", "GO"),
    "2111300": ("São Luís", "MA"),
    "5103403": ("Cuiabá", "MT"),
    "5002704": ("Campo Grande", "MS"),
    "3106200": ("Belo Horizonte", "MG"),
    "1501402": ("Belém", "PA"),
    "2507507": ("João Pessoa", "PB"),
    "4106902": ("Curitiba", "PR"),
    "2611606": ("Recife", "PE"),
    "2211001": ("Teresina", "PI"),
    "3304557": ("Rio de Janeiro", "RJ"),
    "2408102": ("Natal", "RN"),
    "4314902": ("Porto Alegre", "RS"),
    "1100205": ("Porto Velho", "RO"),
    "1400100": ("Boa Vista", "RR"),
    "4205407": ("Florianópolis", "SC"),
    "3550308": ("São Paulo", "SP"),
    "2800308": ("Aracaju", "SE"),
    "1721000": ("Palmas", "TO"),
}
IDS_CAPITAIS = ",".join(CAPITAIS)

SIDRA_API = "https://servicodados.ibge.gov.br/api/v3/agregados"
_cache_metadados: dict[int, dict] = {}


def baixar(url: str, params: dict | None = None, tentativas: int = 4, timeout: int = 180) -> requests.Response:
    """GET com novas tentativas e espera exponencial."""
    erro = ""
    for i in range(tentativas):
        try:
            r = requests.get(url, params=params, headers=HEADERS, timeout=timeout)
            if r.status_code == 200:
                return r
            erro = f"HTTP {r.status_code}: {r.text[:200]}"
        except requests.RequestException as e:
            erro = str(e)
        time.sleep(2**i)
    raise RuntimeError(f"Falha ao baixar {url}: {erro}")


def baixar_json(url: str, params: dict | None = None, tentativas: int = 4):
    """Como baixar(), mas repete também quando a resposta vem com status 200 e corpo inválido."""
    for i in range(tentativas):
        r = baixar(url, params=params)
        try:
            return r, r.json()
        except ValueError:
            time.sleep(2**i)
    raise RuntimeError(f"Resposta sem JSON válido em {url}")


def salvar_json(obj, caminho: pathlib.Path) -> None:
    caminho.parent.mkdir(parents=True, exist_ok=True)
    caminho.write_text(json.dumps(obj, ensure_ascii=False, indent=1), encoding="utf-8")


def ler_json(caminho: pathlib.Path):
    return json.loads(caminho.read_text(encoding="utf-8"))


def metadados(tabela: int) -> dict:
    if tabela not in _cache_metadados:
        _cache_metadados[tabela] = baixar(f"{SIDRA_API}/{tabela}/metadados").json()
    return _cache_metadados[tabela]


def categorias(tabela: int, classificacao: int, padrao: str) -> str:
    """Ids, separados por vírgula, das categorias cujo nome casa com a expressão regular."""
    for c in metadados(tabela)["classificacoes"]:
        if c["id"] == classificacao:
            ids = [str(k["id"]) for k in c["categorias"] if re.search(padrao, k["nome"])]
            if not ids:
                raise ValueError(f"Nenhuma categoria de {classificacao} casa com {padrao!r} na tabela {tabela}")
            return ",".join(ids)
    raise ValueError(f"Classificação {classificacao} não existe na tabela {tabela}")


def variaveis_absolutas(tabela: int) -> list[int]:
    """Variáveis da tabela, sem as de percentual do total (ids a partir de 1.000.000)."""
    return [v["id"] for v in metadados(tabela)["variaveis"] if v["id"] < 1_000_000]


def sidra(tabela: int, variaveis: list[int], periodos: str, localidades: str, classificacao: str | None = None) -> dict:
    """Consulta o SIDRA e devolve a resposta integral com a URL e a data da coleta."""
    url = f"{SIDRA_API}/{tabela}/periodos/{periodos}/variaveis/{'|'.join(map(str, variaveis))}"
    params = {"localidades": localidades}
    if classificacao:
        params["classificacao"] = classificacao
    r = baixar(url, params=params)
    return {
        "tabela": tabela,
        "nome_tabela": metadados(tabela)["nome"],
        "url": r.url,
        "data_coleta": DATA_COLETA,
        "resposta": r.json(),
    }


def _numero(valor):
    # Sinais do SIDRA: "-" zero absoluto; ".." não se aplica; "..." não disponível; "X" sigilo
    if valor == "-":
        return 0.0
    try:
        return float(valor)
    except (TypeError, ValueError):
        return None


def sidra_para_df(bruto: dict) -> pd.DataFrame:
    """Converte a resposta do SIDRA em formato longo: uma linha por valor."""
    linhas = []
    for var in bruto["resposta"]:
        for res in var["resultados"]:
            cls = {c["nome"]: next(iter(c["categoria"].values())) for c in res["classificacoes"]}
            for s in res["series"]:
                loc = s["localidade"]
                for periodo, valor in s["serie"].items():
                    linhas.append({
                        "tabela": bruto["tabela"],
                        "variavel_id": int(var["id"]),
                        "variavel": var["variavel"],
                        "unidade": var["unidade"],
                        "nivel": loc["nivel"]["nome"],
                        "localidade_id": loc["id"],
                        "localidade": loc["nome"],
                        "periodo": periodo,
                        **cls,
                        "valor_original": valor,
                        "valor": _numero(valor),
                    })
    return pd.DataFrame(linhas)


def conferir_capitais(df: pd.DataFrame) -> None:
    """Confere se o nome devolvido pelo IBGE bate com o código de cada capital."""
    mun = df[df["localidade_id"].isin(CAPITAIS)][["localidade_id", "localidade"]].drop_duplicates()
    for cod, nome in mun.itertuples(index=False):
        if not nome.startswith(CAPITAIS[cod][0]):
            raise ValueError(f"Código {cod}: esperado {CAPITAIS[cod][0]}, IBGE devolveu {nome}")
