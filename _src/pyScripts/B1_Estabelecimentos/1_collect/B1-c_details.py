"""
Bloco B1 - etapa 2: para cada place_id único listado por B1-c_places.py,
busca o detalhe (Place Details: avaliação média, volume de avaliações,
categorias, status, site/rede social declarado, telefone, link do Maps).

O campo websiteUri é o mais importante para a etapa manual seguinte: para a
maioria dos pequenos estabelecimentos, é o link do Instagram/Linktree
cadastrado no perfil do Google Maps, não necessariamente um site próprio.

Dois modos:

  padrão          -> com o campo `reviews` (até 5 avaliações por casa).
                     Saída: B1_detalhes.jsonl. Pula os place_ids já presentes
                     nesse arquivo.
  --sem-reviews   -> sem o campo `reviews` (etapa 2b). Saída:
                     B1_detalhes_sem_reviews.jsonl. Pula os place_ids
                     presentes em qualquer um dos dois arquivos, então rodar
                     de novo não paga nada duas vezes.

Motivo do modo --sem-reviews: o campo `reviews` promove a chamada ao SKU
"Place Details Enterprise + Atmosphere", cuja franquia mensal gratuita já foi
consumida (1.161 chamadas em setembro de 2026, R$ 23,63 cobrados). Sem ele, a
chamada cai no SKU "Place Details Enterprise", que no mesmo mês registrava
219 chamadas e R$ 0,00. Só o texto das avaliações fica de fora.

Consequência para o filtro (B1-b_planilha.py): registros sem reviews só
podem ser aprovados pela palavra-chave no NOME. Quem não bate no nome não é
descartado, e sim mandado para `dados/B1_estabelecimentos/_dados-agregados/1_busca/B1_triagem.csv`, porque a evidência que
decidiria o caso não foi comprada. Ausência de evidência não é evidência de
ausência.

Cada registro recebe a coluna `data_coleta` (data UTC da chamada à API), que
é o que datam os dados do Bloco B1: a coleta é incremental, então o arquivo
tem registros de datas diferentes e a data de modificação do arquivo não
serve como referência. Registros anteriores à criação dessa coluna foram
preenchidos com a data de modificação do arquivo (2026-09-01).

Uso:
    python3 "_src/pyScripts/B1_Estabelecimentos/1_collect/B1-c_details.py"
    python3 "_src/pyScripts/B1_Estabelecimentos/1_collect/B1-c_details.py" --sem-reviews
    python3 "_src/pyScripts/B1_Estabelecimentos/1_collect/B1-c_details.py" --horarios

Modo --horarios (15/10/2026): só `regularOpeningHours`, para as casas que
seguem no estudo (aprovadas da triagem manual mais as luderias novas do
acervodejogos). Mesmo SKU "Place Details Enterprise" do modo --sem-reviews.
Saída: B1_horarios.jsonl; pula os place_ids já presentes nele. Tabela em
B1-b_horarios.py.

Modo --repaginadas (12/11/2026): detalhes (sem `reviews`, SKU "Place Details
Enterprise") das luderias aprovadas na triagem manual da repaginação
(dados/B1_estabelecimentos/_dados-agregados/3_triagem/B1_repaginacao_triagem.csv) que estão no recorte
(inclusive Campinas, 15ª metrópole, decisão do autor em 12/11/2026). Saída
separada, B1_detalhes_repaginacao.jsonl, para não entrar no funil do
B1-b_planilha.py; quem monta a planilha de aprovadas
(B1-b_triagem_manual.py) lê dele.
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [*map(str, (_AQUI.parents[3] / "outros").glob("G[0-9]_*")), str(_AQUI.parents[1] / "5_outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import argparse
import json
import pathlib
from csv import DictReader
from datetime import datetime, timezone

from tqdm import tqdm

from places_client import PlacesClient

ROOT = pathlib.Path(__file__).resolve().parents[4]
CANDIDATOS_PATH = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos" / "B1_candidatos.csv"
DETALHES_PATH = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos" / "B1_detalhes.jsonl"
SEM_REVIEWS_PATH = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos" / "B1_detalhes_sem_reviews.jsonl"
HORARIOS_PATH = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos" / "B1_horarios.jsonl"
REPAGINADAS_PATH = ROOT / "dados" / "B1_estabelecimentos" / "_dados-brutos" / "B1_detalhes_repaginacao.jsonl"
APROVADAS_PATH = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "3_triagem" / "B1_aprovadas_metro_av100.xlsx"
NOVAS_PATH = ROOT / "dados" / "B1_acervo_jogos" / "_dados-agregados" / "B1_acervodejogos_luderias_novas.csv"
REPAGINACAO_TRIAGEM_PATH = ROOT / "dados" / "B1_estabelecimentos" / "_dados-agregados" / "3_triagem" / "B1_repaginacao_triagem.csv"


def load_unique_place_ids():
    with open(CANDIDATOS_PATH, newline="", encoding="utf-8") as f:
        return sorted({row["place_id"] for row in DictReader(f) if row["place_id"]})


def load_casas_do_estudo():
    """place_ids das aprovadas na triagem manual e das luderias novas."""
    import pandas as pd

    ids = list(pd.read_excel(APROVADAS_PATH)["place_id"]) + list(pd.read_csv(NOVAS_PATH)["place_id"])
    return sorted(set(ids))


def load_repaginadas_aprovadas():
    """place_ids aprovados na triagem da repaginação (todos estão no recorte, Campinas incluída)."""
    with open(REPAGINACAO_TRIAGEM_PATH, newline="", encoding="utf-8") as f:
        return sorted({r["place_id"] for r in DictReader(f)
                       if r["resultado_triagem"] == "aprovado"})


def load_done_ids(paths):
    """Ids já coletados nos arquivos de detalhes indicados."""
    done = set()
    for path in paths:
        if not path.exists():
            continue
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    done.add(json.loads(line)["id"])
                except (json.JSONDecodeError, KeyError):
                    continue
    return done


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sem-reviews", action="store_true",
                        help="coleta sem o campo reviews (SKU sem custo)")
    parser.add_argument("--horarios", action="store_true",
                        help="só horários de funcionamento das casas do estudo")
    parser.add_argument("--repaginadas", action="store_true",
                        help="detalhes das luderias aprovadas na triagem da repaginação")
    args = parser.parse_args()

    if args.repaginadas:
        out_path, ja_feitos = REPAGINADAS_PATH, (REPAGINADAS_PATH,)
    elif args.horarios:
        out_path, ja_feitos = HORARIOS_PATH, (HORARIOS_PATH,)
    elif args.sem_reviews:
        out_path, ja_feitos = SEM_REVIEWS_PATH, (DETALHES_PATH, SEM_REVIEWS_PATH)
    else:
        out_path, ja_feitos = DETALHES_PATH, (DETALHES_PATH,)

    client = PlacesClient()
    if args.repaginadas:
        buscar = client.place_details_sem_reviews
    elif args.horarios:
        buscar = client.place_horarios
    else:
        buscar = client.place_details_sem_reviews if args.sem_reviews else client.place_details
    if args.repaginadas:
        place_ids = load_repaginadas_aprovadas()
    else:
        place_ids = load_casas_do_estudo() if args.horarios else load_unique_place_ids()
    done = load_done_ids(ja_feitos)
    pendentes = [p for p in place_ids if p not in done]
    print(f"{len(place_ids)} place_ids únicos, {len(done)} já coletados, {len(pendentes)} pendentes")

    n_ok = 0
    with open(out_path, "a", encoding="utf-8") as f:
        for place_id in tqdm(pendentes, desc="Buscando detalhes"):
            try:
                detalhe = buscar(place_id)
            except RuntimeError as exc:
                print(f"Erro em {place_id}: {exc}")
                continue
            detalhe["data_coleta"] = datetime.now(timezone.utc).date().isoformat()
            f.write(json.dumps(detalhe, ensure_ascii=False) + "\n")
            f.flush()
            n_ok += 1

    print(f"OK: {n_ok} detalhes salvos em {out_path.name}")


if __name__ == "__main__":
    main()
