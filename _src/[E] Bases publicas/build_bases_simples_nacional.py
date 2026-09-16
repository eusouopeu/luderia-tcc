"""
Extrai do HTML compilado da LC nº 123/2006 as tabelas dos Anexos I a V do Simples
Nacional na redação da LC nº 155/2016 (vigente).

Entrada: _data/raw/[E] Bases publicas/legislacao/lcp123_compilada_planalto_<data>.htm
Saídas em _data/processed/[E] Bases publicas/:
Saídas no padrão "[E] {dado} {período} ({fonte}).csv", com o ano de vigência conferida:
  "Faixas e Alíquotas por Anexo"      anexo, faixa, receita bruta em 12 meses (mín., máx.),
                                      alíquota nominal e parcela a deduzir
  "Repartição de Tributos por Anexo"  percentual de repartição de cada tributo por faixa

Alíquota efetiva (art. 18, § 1º-A): (RBT12 × alíquota nominal − parcela a deduzir) ÷ RBT12.
"""

import re

import pandas as pd
from bs4 import BeautifulSoup

from bases_comum import DATA_COLETA, PROCESSED_DIR, RAW_DIR, caminho_saida

IN_DIR = RAW_DIR / "legislacao"


def texto(celula) -> str:
    return re.sub(r"\s+", " ", celula.get_text(" ")).strip()


def valor_br(s: str) -> float | None:
    m = re.search(r"\d[\d.]*,\d+", s)
    return float(m.group().replace(".", "").replace(",", ".")) if m else None


def linhas(tabela) -> list[list[str]]:
    return [[texto(c) for c in tr.find_all(["td", "th"])] for tr in tabela.find_all("tr")]


def main() -> None:
    arquivo = sorted(IN_DIR.glob("lcp123_compilada_planalto_*.htm"))[-1]
    html = arquivo.read_bytes().decode("cp1252", errors="replace")
    marcas = [(m.group(1), m.start()) for m in re.finditer(r"ANEXO\s+(I|II|III|IV|V)\s+DA\s+LEI", html)]

    faixas, reparticao = [], []
    for i, (anexo, inicio) in enumerate(marcas):
        fim = marcas[i + 1][1] if i + 1 < len(marcas) else len(html)
        soup = BeautifulSoup(html[inicio:fim], "html.parser")
        if not re.search(r"Complementar n.{0,3}155", soup.get_text(" ")[:600]):
            continue  # redação anterior à LC 155/2016
        tabelas = soup.find_all("table")

        for linha in linhas(tabelas[0]):
            if len(linha) < 4 or not re.match(r"^\d", linha[0]):
                continue
            limites = re.findall(r"\d[\d.]*,\d{2}", linha[1])
            minimo, maximo = (0.0, valor_br(limites[0])) if linha[1].startswith("Até") else (valor_br(limites[0]), valor_br(limites[1]))
            faixas.append({
                "anexo": anexo, "faixa": int(linha[0][0]), "rbt12_min": minimo, "rbt12_max": maximo,
                "aliquota_nominal_pct": valor_br(linha[2]), "parcela_deduzir": valor_br(linha[3]) or 0.0,
            })

        cab = None
        for linha in linhas(tabelas[1]):
            if cab is None and any(t in linha for t in ("IRPJ", "CPP")):
                cab = [c for c in linha if c]
                continue
            if cab and linha and re.match(r"^\d", linha[0]):
                valores = linha[1:]
                for tributo, bruto in zip(cab, valores):
                    reparticao.append({"anexo": anexo, "faixa": int(linha[0][0]), "rotulo_faixa": linha[0],
                                       "tributo": tributo, "percentual": valor_br(bruto), "valor_original": bruto})

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df_faixas = pd.DataFrame(faixas)
    df_faixas.to_csv(caminho_saida("Faixas e Alíquotas por Anexo", DATA_COLETA[:4], "Simples Nacional"), index=False)
    pd.DataFrame(reparticao).to_csv(
        caminho_saida("Repartição de Tributos por Anexo", DATA_COLETA[:4], "Simples Nacional"), index=False)
    contagem = df_faixas.groupby("anexo").size()
    if not (set(contagem.index) == {"I", "II", "III", "IV", "V"} and (contagem == 6).all()):
        raise ValueError(f"Esperadas 6 faixas em cada um dos 5 anexos; obtido: {contagem.to_dict()}")
    print(df_faixas.to_string(index=False))
    print(f"{len(reparticao)} percentuais de repartição")


if __name__ == "__main__":
    main()
