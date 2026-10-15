"""
Sorteio das amostras de auditoria da coleta, comum aos scripts `Bn-a_auditoria_*`
(_instrucoes/4_metodologia.md §3.4, "Validação da coleta").

Regras do sorteio:
- chave aleatória de cada unidade = SHA-256 de "<semente>:<id>", lida como
  número de 0 a 1. Depende só da semente e do id: rodar de novo, com a base
  ampliada ou em outra ordem, mantém as unidades já sorteadas na frente;
- estratos com mínimo por estrato (ou todas as unidades, se forem menos) e o
  restante dividido na proporção do tamanho do estrato descontado o mínimo,
  arredondado pelos maiores restos, para a soma fechar com n (diferença zero);
- dentro do estrato, entram as unidades de menor chave.

Cada amostra vai para `dados/[Bn]…/_dados-brutos/<pasta>/auditoria/`, com as
colunas de conferência em branco, e ganha uma linha em
`auditoria/auditoria_registro.csv` (data, script, semente, hash SHA-256 da base
de origem, população, n e limite superior de Wilson com zero erros).
"""

from __future__ import annotations

import csv
import hashlib
import math
from datetime import datetime
from pathlib import Path

import pandas as pd

Z_95 = 1.96


def chave(semente: int, ident) -> float:
    """Número de 0 a 1, fixo para cada par (semente, id)."""
    h = hashlib.sha256(f"{semente}:{ident}".encode("utf-8")).hexdigest()
    return int(h[:13], 16) / 16**13


def hash_arquivo(*caminhos: Path) -> str:
    """SHA-256 dos arquivos de origem, na ordem dada (um hash para o conjunto)."""
    h = hashlib.sha256()
    for c in caminhos:
        h.update(Path(c).read_bytes())
    return h.hexdigest()


def wilson_superior(erros: int, n: int, z: float = Z_95) -> float:
    """Limite superior do intervalo de Wilson (95%) para a taxa de erro."""
    if n == 0:
        return 1.0
    p = erros / n
    centro = p + z * z / (2 * n)
    margem = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (centro + margem) / (1 + z * z / n)


def alocar(tamanhos: dict, n: int, minimo: int = 0) -> dict:
    """Tamanho da amostra por estrato: mínimo (ou o estrato inteiro) e o resto
    na proporção de (tamanho - mínimo), pelos maiores restos. A soma fecha com
    n, salvo quando a população inteira é menor que n."""
    n = min(n, sum(tamanhos.values()))
    base = {e: min(minimo, t) for e, t in tamanhos.items()}
    if sum(base.values()) > n:
        raise ValueError(f"mínimo de {minimo} por estrato soma {sum(base.values())}, acima de n = {n}")
    aloc = dict(base)
    # Repete enquanto algum estrato receber mais do que tem (o excedente volta ao sorteio).
    while sum(aloc.values()) < n:
        falta = n - sum(aloc.values())
        sobra = {e: tamanhos[e] - aloc[e] for e in tamanhos if tamanhos[e] > aloc[e]}
        peso = {e: tamanhos[e] - base[e] for e in sobra}
        total = sum(peso.values()) or len(sobra)
        cota = {e: falta * (peso[e] if sum(peso.values()) else 1) / total for e in sobra}
        inteiro = {e: min(int(math.floor(c)), sobra[e]) for e, c in cota.items()}
        resto = falta - sum(inteiro.values())
        # Maiores restos; empate decidido pelo nome do estrato (reprodutível).
        ordem = sorted(sobra, key=lambda e: (-(cota[e] - math.floor(cota[e])), str(e)))
        for e in ordem:
            if resto <= 0:
                break
            if inteiro[e] < sobra[e]:
                inteiro[e] += 1
                resto -= 1
        for e, k in inteiro.items():
            aloc[e] += k
        if not any(inteiro.values()):
            break
    return aloc


def sortear(df: pd.DataFrame, id_col: str, n: int, semente: int, estrato: str | None = None,
            minimo: int = 0) -> pd.DataFrame:
    """Amostra estratificada pela menor chave dentro de cada estrato.
    Devolve as linhas sorteadas com as colunas `chave_sorteio` e `estrato_sorteio`."""
    d = df.copy()
    if d[id_col].duplicated().any():
        raise ValueError(f"{id_col} repetido na população: cada unidade deve aparecer uma vez")
    d["chave_sorteio"] = [round(chave(semente, i), 10) for i in d[id_col]]
    d["estrato_sorteio"] = d[estrato].fillna("(sem estrato)").astype(str) if estrato else "único"
    tamanhos = d.groupby("estrato_sorteio").size().to_dict()
    aloc = alocar(tamanhos, n, minimo)
    partes = [g.nsmallest(aloc[e], "chave_sorteio") for e, g in d.groupby("estrato_sorteio")]
    amostra = pd.concat(partes).sort_values(["estrato_sorteio", "chave_sorteio"])
    assert len(amostra) == sum(aloc.values()), "amostra não fecha com a alocação"
    return amostra


def gravar(amostra: pd.DataFrame, pasta: Path, nome: str, conferir: list[str], *, script: str,
           semente: int, populacao: int, origem: list[Path], desenho: str) -> Path:
    """Grava a amostra com as colunas de conferência em branco e registra o sorteio."""
    pasta.mkdir(parents=True, exist_ok=True)
    saida = amostra.copy()
    for c in ["conferido_em", "conferente", *conferir, "observacao"]:
        saida[c] = ""
    caminho = pasta / nome
    saida.to_csv(caminho, sep=";", index=False, encoding="utf-8-sig")
    registrar(pasta, script=script, arquivo=nome, semente=semente, populacao=populacao,
              n=len(amostra), origem=origem, desenho=desenho)
    return caminho


def registrar(pasta: Path, *, script: str, arquivo: str, semente: int | str, populacao: int, n: int,
              origem: list[Path], desenho: str) -> None:
    """Acrescenta uma linha a auditoria_registro.csv da pasta."""
    reg = pasta / "auditoria_registro.csv"
    novo = not reg.exists()
    with reg.open("a", newline="", encoding="utf-8-sig" if novo else "utf-8") as f:
        w = csv.writer(f, delimiter=";")
        if novo:
            w.writerow(["gerado_em", "script", "arquivo", "semente", "populacao", "n",
                        "wilson_sup_zero_erros_pct", "desenho", "origem", "sha256_origem"])
        w.writerow([datetime.now().strftime("%Y-%m-%d %H:%M"), Path(script).name, arquivo, semente,
                    populacao, n, round(100 * wilson_superior(0, n), 1) if n else "", desenho,
                    " | ".join(Path(o).name for o in origem), hash_arquivo(*origem) if origem else ""])


def resumo(nome: str, populacao: int, amostra: pd.DataFrame) -> None:
    """Imprime o tamanho, a cobertura dos estratos e o limite de Wilson com zero erros."""
    n = len(amostra)
    estratos = amostra["estrato_sorteio"].nunique() if "estrato_sorteio" in amostra else 1
    print(f"{nome}: {n} de {populacao} unidades, {estratos} estratos; "
          f"com zero erros, limite superior de Wilson = {100 * wilson_superior(0, n):.1f}%")
