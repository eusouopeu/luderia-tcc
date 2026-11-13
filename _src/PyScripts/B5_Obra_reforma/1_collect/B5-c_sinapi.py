"""
Baixa o SINAPI (Caixa) do mês e extrai os custos de composições e os preços de
insumos da Bahia (localidade Salvador), para orçar a reforma (premissa I01).

Fonte: Caixa Econômica Federal e IBGE, Sistema Nacional de Pesquisa de Custos e
Índices da Construção Civil (SINAPI), relatórios mensais em xlsx
(https://www.caixa.gov.br/Downloads/sinapi-relatorios-mensais/SINAPI-AAAA-MM-formato-xlsx.zip).

Uso: python B5-c_sinapi.py [AAAA-MM]
     Sem mês, tenta o mês anterior ao atual e volta até achar um publicado
     (a Caixa publica o mês M por volta do dia 10 de M+1).

Entrada: nenhuma (download). O zip fica em
         dados/B5_obra_reforma/_dados-brutos/sinapi/ (fora do git).
Saídas em dados/B5_obra_reforma/_dados-agregados/:
  "[B5] SINAPI Composições BA {AAAA-MM} (Caixa).csv"  grupo, código, descrição, unidade, custo, %AS
  "[B5] SINAPI Insumos BA {AAAA-MM} (Caixa).csv"      classificação, código, descrição, unidade, origem, preço

Regras:
  - Encargos sociais sem desoneração (abas CSD e ISD): a construtora contratada para a obra
    não é necessariamente desonerada; é o custo mais alto dos dois, a favor da prudência.
  - %AS é a parte do custo da composição calculada com preços de São Paulo, por falta de
    preço coletado na Bahia; acima de 0 o custo é menos local.
  - Composição com custo zerado (hífen) fica de fora: falta preço de algum item.
  - Custos do SINAPI não têm BDI (benefícios e despesas indiretas da construtora): o BDI
    entra no build da lista de itens.
"""

# Caminhos: _src/Extras/ (log comum); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "Extras").glob("Gerar_*"))]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import io
import re
import zipfile
from datetime import date

import openpyxl
import pandas as pd
import requests

ROOT = Path(__file__).resolve().parents[4]
RAW_DIR = ROOT / "dados" / "B5_obra_reforma" / "_dados-brutos" / "sinapi"
OUT_DIR = ROOT / "dados" / "B5_obra_reforma" / "_dados-agregados"
URL = "https://www.caixa.gov.br/Downloads/sinapi-relatorios-mensais/SINAPI-{mes}-formato-xlsx.zip"
UF = "BA"
MESES_PARA_TRAS = 4
RE_CODIGO = re.compile(r",\s*(\d+)\)\s*$")


def meses_candidatos(pedido: str | None) -> list[str]:
    if pedido:
        return [pedido]
    hoje = date.today()
    ano, mes = hoje.year, hoje.month
    saida = []
    for _ in range(MESES_PARA_TRAS):
        mes -= 1
        if mes == 0:
            ano, mes = ano - 1, 12
        saida.append(f"{ano}-{mes:02d}")
    return saida


def baixar(meses: list[str]) -> tuple[str, Path]:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    sessao = None
    for mes in meses:
        destino = RAW_DIR / f"SINAPI-{mes}-formato-xlsx.zip"
        if destino.exists():
            print(f"já baixado: {destino.name}")
            return mes, destino
        if sessao is None:
            # O site da Caixa redireciona em loop até gravar o cookie de sessão: uma visita
            # à página de downloads grava o cookie antes do primeiro zip.
            sessao = requests.Session()
            sessao.headers["User-Agent"] = "Mozilla/5.0 (Macintosh)"
            sessao.get("https://www.caixa.gov.br/site/Paginas/downloads.aspx", timeout=60)
        try:
            resp = sessao.get(URL.format(mes=mes), timeout=300)
        except requests.TooManyRedirects:
            print(f"{mes}: não publicado (redirecionamento em loop)")
            continue
        if resp.status_code == 200 and resp.content[:2] == b"PK":
            destino.write_bytes(resp.content)
            print(f"baixado: {destino.name} ({len(resp.content) / 1e6:.1f} MB)")
            return mes, destino
        print(f"{mes}: não publicado (HTTP {resp.status_code})")
    raise RuntimeError(f"Nenhum SINAPI publicado entre {meses[-1]} e {meses[0]}")


def abrir_referencia(zip_path: Path) -> openpyxl.Workbook:
    with zipfile.ZipFile(zip_path) as z:
        # O nome interno vem com acento em codificação variável: busca por trecho sem acento.
        nome = next(n for n in z.namelist() if "Refer" in n)
        return openpyxl.load_workbook(io.BytesIO(z.read(nome)), read_only=True)


def linhas_da_aba(ws) -> tuple[list, list[tuple]]:
    """Cabeçalho (linha que começa em 'Grupo' ou 'Classificação') e linhas seguintes."""
    linhas = ws.iter_rows(values_only=True)
    for linha in linhas:
        if linha[0] in ("Grupo", "Classificação"):
            return list(linha), list(linhas)
    raise ValueError(f"cabeçalho não encontrado na aba {ws.title}")


def coluna_da_uf(ws, uf: str) -> int:
    """Índice da coluna de custo da UF: a linha 9 (composições) ou 10 (insumos) traz as siglas."""
    for linha in ws.iter_rows(min_row=4, max_row=10, values_only=True):
        if uf in linha:
            return linha.index(uf)
    raise ValueError(f"UF {uf} não encontrada na aba {ws.title}")


def codigo(valor) -> int | None:
    # Nas composições o código vem dentro de um HYPERLINK; nos insumos, como número.
    if isinstance(valor, (int, float)):
        return int(valor)
    achado = RE_CODIGO.search(str(valor or ""))
    return int(achado.group(1)) if achado else None


def numero(valor) -> float | None:
    return float(valor) if isinstance(valor, (int, float)) else None


def composicoes(wb) -> pd.DataFrame:
    ws = wb["CSD"]
    col = coluna_da_uf(ws, UF)
    _, linhas = linhas_da_aba(ws)
    df = pd.DataFrame([{
        "grupo": l[0], "codigo": codigo(l[1]), "descricao": l[2], "unidade": l[3],
        "custo_rs": numero(l[col]), "pct_as": numero(l[col + 1]),
    } for l in linhas if l[2]])
    n0 = len(df)
    df = df[df["codigo"].notna() & df["custo_rs"].gt(0)].astype({"codigo": int})
    print(f"composições: {n0} -> {len(df)} com custo na {UF}")
    return df


def insumos(wb) -> pd.DataFrame:
    ws = wb["ISD"]
    col = coluna_da_uf(ws, UF)
    _, linhas = linhas_da_aba(ws)
    df = pd.DataFrame([{
        "classificacao": l[0], "codigo": codigo(l[1]), "descricao": l[2], "unidade": l[3],
        "origem_preco": l[4], "preco_rs": numero(l[col]),
    } for l in linhas if l[2]])
    n0 = len(df)
    df = df[df["codigo"].notna() & df["preco_rs"].gt(0)].astype({"codigo": int})
    print(f"insumos: {n0} -> {len(df)} com preço na {UF}")
    return df


def main() -> None:
    mes, zip_path = baixar(meses_candidatos(sys.argv[1] if len(sys.argv) > 1 else None))
    wb = abrir_referencia(zip_path)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for dado, tabela in [("Composições", composicoes(wb)), ("Insumos", insumos(wb))]:
        destino = OUT_DIR / f"[B5] SINAPI {dado} {UF} {mes} (Caixa).csv"
        tabela.to_csv(destino, sep=";", decimal=",", index=False, encoding="utf-8-sig")
        print(f"gravado: {destino.name} ({len(tabela)} linhas)")


if __name__ == "__main__":
    main()
