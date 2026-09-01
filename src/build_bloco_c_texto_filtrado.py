"""
Bloco C - gera uma cópia da tabela de análise (build_bloco_c_analise.py)
com duas colunas novas:

  num_caracteres_texto     - len(texto_avaliacao)
  texto_avaliacao_filtrado - texto_avaliacao reduzido a substantivos e
                              adjetivos, via POS tagging (spaCy,
                              pt_core_news_sm). Preposições, artigos,
                              verbos, advérbios, pronomes e conjunções são
                              descartados.

Locuções adjetivas / expressões idiomáticas (ex.: "em conta" = bom
custo-benefício) são tratadas como exceção: se uma expressão da lista
IDIOMS aparece no texto, ela é preservada inteira no resultado, e suas
palavras não são analisadas isoladamente pelo POS tagger (o que faria
"em conta" virar só "conta", perdendo o sentido idiomático). A lista é um
ponto de partida, não exaustiva - mesma lógica dos dicionários de termos
de build_bloco_c_analise.py.

Requer o modelo pt_core_news_sm do spaCy:
    python3 -m spacy download pt_core_news_sm

Saída: data/processed/bloco_c_avaliacoes_texto_filtrado.csv

Uso:
    python3 src/build_bloco_c_texto_filtrado.py
"""
import pathlib
import re

import pandas as pd
import spacy

ROOT = pathlib.Path(__file__).resolve().parent.parent
IN_PATH = ROOT / "data" / "processed" / "bloco_c_avaliacoes_analise.csv"
OUT_PATH = ROOT / "data" / "processed" / "bloco_c_avaliacoes_texto_filtrado.csv"

# Locuções adjetivas/expressões idiomáticas preservadas como unidade.
# Case-insensitive; não trata variação de acentuação.
IDIOMS = [
    "em conta",
    "bom custo-benefício",
    "boa pedida",
    "custo-benefício",
    "de qualidade",
    "em alta",
    "cheio de vida",
]

POS_MANTIDOS = {"NOUN", "PROPN", "ADJ"}


def find_idiom_spans(texto):
    """Retorna spans (start, end, texto_original) das expressões da lista IDIOMS encontradas."""
    spans = []
    ocupado = [False] * len(texto)
    for idioma in sorted(IDIOMS, key=len, reverse=True):
        for m in re.finditer(re.escape(idioma), texto, flags=re.IGNORECASE):
            inicio, fim = m.start(), m.end()
            if any(ocupado[inicio:fim]):
                continue
            spans.append((inicio, fim, texto[inicio:fim]))
            for i in range(inicio, fim):
                ocupado[i] = True
    return spans


def filtra_texto(nlp, texto):
    if not texto or not isinstance(texto, str):
        return ""

    idiom_spans = find_idiom_spans(texto)

    def em_algum_idiom(char_idx):
        return any(inicio <= char_idx < fim for inicio, fim, _ in idiom_spans)

    doc = nlp(texto)
    itens = [(inicio, txt) for inicio, _, txt in idiom_spans]
    for token in doc:
        if token.pos_ in POS_MANTIDOS and not em_algum_idiom(token.idx):
            itens.append((token.idx, token.text))

    itens.sort(key=lambda x: x[0])
    return " ".join(txt for _, txt in itens)


def main():
    df = pd.read_csv(IN_PATH)
    print(f"{len(df)} avaliações carregadas de {IN_PATH}")

    nlp = spacy.load("pt_core_news_sm")

    df["num_caracteres_texto"] = df["texto_avaliacao"].fillna("").str.len()
    df["texto_avaliacao_filtrado"] = [
        filtra_texto(nlp, t) for t in df["texto_avaliacao"]
    ]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_PATH, index=False)
    print(f"OK: salvo em {OUT_PATH}")
    print(f"Média de caracteres por avaliação: {df['num_caracteres_texto'].mean():.0f}")


if __name__ == "__main__":
    main()
