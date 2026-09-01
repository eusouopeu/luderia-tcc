"""
Bloco C - extrai as avaliações individuais em português (campo `reviews`,
até 5 por estabelecimento, já coletadas na etapa de detalhes do Bloco B -
avaliações em outros idiomas são descartadas, pois o dicionário de análise
de conteúdo e o filtro de POS de build_bloco_c_texto_filtrado.py são
específicos do português), aplica a
análise de conteúdo por dicionário de termos-chave (menção a preço e
menção a fricção de complexidade) e calcula os três agrupamentos
descritivos: nota média do estabelecimento e volume de avaliações do
estabelecimento em maiores/menores/outliers pela regra do IQR; nota
individual da avaliação em promotor/neutro/detrator por corte fixo de
estrelas, aproximando o NPS (a regra do IQR degenera nessa variável - ver
grupo_nota_individual_nps).

Roda sobre TODOS os estabelecimentos aprovados no filtro do Bloco B
(data/processed/bloco_b_planilha_curadoria.csv), independentemente da
curadoria manual de relevância ainda não concluída - reexecutar após a
curadoria automaticamente restringe a base, pois esta etapa faz o join
pela lista de place_id daquele arquivo.

O dicionário de termos-chave é um ponto de partida (BARDIN, 2011): a
metodologia prevê validação manual em subamostra de 10% das avaliações
codificadas - ver mencao_preco e mencao_friccao na saída.

Saída: data/processed/bloco_c_avaliacoes_analise.csv

Uso:
    python3 src/build_bloco_c_analise.py
"""
import json
import pathlib
import unicodedata

import pandas as pd

ROOT = pathlib.Path(__file__).resolve().parent.parent
DETALHES_PATH = ROOT / "data" / "raw" / "bloco_b_detalhes.jsonl"
CURADORIA_PATH = ROOT / "data" / "processed" / "bloco_b_planilha_curadoria.csv"
OUT_PATH = ROOT / "data" / "processed" / "bloco_c_avaliacoes_analise.csv"

# Dicionário de termos-chave para análise de conteúdo (BARDIN, 2011).
# Substring, case/acento-insensitive. Ponto de partida para validação manual.
TERMOS_PRECO = [
    "caro", "cara", "caros", "caras",
    "preco alto", "precos altos", "preco elevado",
    "salgado", "puxado", "cobra caro", "nao vale o preco",
    "custoso", "pouco em conta",
]

TERMOS_FRICCAO = [
    "complicado", "complexo", "confuso", "confusas", "confusos",
    "dificil de entender", "dificil aprender", "dificil pra iniciante",
    "regras confusas", "intimidador", "intimidante",
    "nao entendi as regras", "curva de aprendizado", "dificuldade pra iniciante",
]


def normaliza(texto):
    if not texto:
        return ""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    return sem_acento.lower()


def contem_termo(texto, termos):
    texto_norm = normaliza(texto)
    return any(t in texto_norm for t in termos)


def grupo_iqr(serie):
    """Classifica cada valor de `serie` em outlier / maior / menor pela regra do IQR."""
    q1, q3 = serie.quantile(0.25), serie.quantile(0.75)
    iqr = q3 - q1
    limite_inf, limite_sup = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    mediana = serie.median()

    def classifica(v):
        if v < limite_inf or v > limite_sup:
            return "outlier"
        return "maior" if v >= mediana else "menor"

    return serie.apply(classifica)


def grupo_nota_individual_nps(serie):
    """
    A regra do IQR degenera na nota individual da avaliação: é discreta
    (1-5) e concentrada em 5 estrelas (Q1=Q3=mediana=5 na base observada),
    o que zeraria o IQR e jogaria toda nota abaixo de 5 no grupo
    "outlier". Usa-se corte fixo por estrelas, aproximando a lógica do
    NPS: 5 = promotor; 4 = neutro; 1-3 = detrator.
    """

    def classifica(v):
        if v >= 5:
            return "promotor"
        if v == 4:
            return "neutro"
        return "detrator"

    return serie.apply(classifica)


def load_curadoria_place_ids():
    df = pd.read_csv(CURADORIA_PATH)
    return set(df["place_id"])


def load_reviews(place_ids):
    linhas = []
    with open(DETALHES_PATH, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            d = json.loads(line)
            place_id = d["id"]
            if place_id not in place_ids:
                continue
            nome = (d.get("displayName") or {}).get("text")
            avaliacao_media_estab = d.get("rating")
            volume_avaliacoes_estab = d.get("userRatingCount")
            for i, r in enumerate(d.get("reviews", [])):
                idioma = (r.get("text") or {}).get("languageCode", "")
                if not idioma.startswith("pt"):
                    continue
                texto = (r.get("text") or {}).get("text", "")
                linhas.append(
                    {
                        "place_id": place_id,
                        "nome_estabelecimento": nome,
                        "avaliacao_media_estabelecimento": avaliacao_media_estab,
                        "volume_avaliacoes_estabelecimento": volume_avaliacoes_estab,
                        "review_index": i,
                        "nota_avaliacao": r.get("rating"),
                        "idioma": idioma,
                        "data_relativa": r.get("relativePublishTimeDescription"),
                        "texto_avaliacao": texto,
                        "mencao_preco": contem_termo(texto, TERMOS_PRECO),
                        "mencao_friccao": contem_termo(texto, TERMOS_FRICCAO),
                    }
                )
    return pd.DataFrame(linhas)


def main():
    place_ids = load_curadoria_place_ids()
    df = load_reviews(place_ids)
    print(f"{len(df)} avaliações extraídas de {df['place_id'].nunique()} estabelecimentos")

    df = df.dropna(subset=["nota_avaliacao", "avaliacao_media_estabelecimento", "volume_avaliacoes_estabelecimento"])

    df["grupo_nota_estabelecimento"] = grupo_iqr(df["avaliacao_media_estabelecimento"])
    df["grupo_nota_individual"] = grupo_nota_individual_nps(df["nota_avaliacao"])
    df["grupo_volume_avaliacoes"] = grupo_iqr(df["volume_avaliacoes_estabelecimento"])

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUT_PATH, index=False)

    print(f"OK: salvo em {OUT_PATH}")
    print("\nDistribuição dos agrupamentos:")
    for col in ["grupo_nota_estabelecimento", "grupo_nota_individual", "grupo_volume_avaliacoes"]:
        print(f"  {col}: {df[col].value_counts().to_dict()}")
    print(f"\nMenção a preço: {df['mencao_preco'].sum()} avaliações")
    print(f"Menção a fricção: {df['mencao_friccao'].sum()} avaliações")


if __name__ == "__main__":
    main()
