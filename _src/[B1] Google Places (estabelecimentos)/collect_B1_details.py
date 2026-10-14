"""
Bloco B1 - etapa 2: para cada place_id único listado por collect_B1_places.py,
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

Consequência para o filtro (build_B1_planilha.py): registros sem reviews só
podem ser aprovados pela palavra-chave no NOME. Quem não bate no nome não é
descartado, e sim mandado para `B1_triagem.csv`, porque a evidência que
decidiria o caso não foi comprada. Ausência de evidência não é evidência de
ausência.

Cada registro recebe a coluna `data_coleta` (data UTC da chamada à API), que
é o que datam os dados do Bloco B1: a coleta é incremental, então o arquivo
tem registros de datas diferentes e a data de modificação do arquivo não
serve como referência. Registros anteriores à criação dessa coluna foram
preenchidos com a data de modificação do arquivo (2026-09-01).

Uso:
    python3 "_src/[B1] Google Places (estabelecimentos)/collect_B1_details.py"
    python3 "_src/[B1] Google Places (estabelecimentos)/collect_B1_details.py" --sem-reviews
"""
import argparse
import json
import pathlib
from csv import DictReader
from datetime import datetime, timezone

from tqdm import tqdm

from places_client import PlacesClient

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "dados" / "[B1] Estabelecimentos e cardapios" / "dados-brutos"
CANDIDATOS_PATH = RAW / "B1_candidatos.csv"
DETALHES_PATH = RAW / "B1_detalhes.jsonl"
SEM_REVIEWS_PATH = RAW / "B1_detalhes_sem_reviews.jsonl"


def load_unique_place_ids():
    with open(CANDIDATOS_PATH, newline="", encoding="utf-8") as f:
        return sorted({row["place_id"] for row in DictReader(f) if row["place_id"]})


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
    args = parser.parse_args()

    if args.sem_reviews:
        out_path, ja_feitos = SEM_REVIEWS_PATH, (DETALHES_PATH, SEM_REVIEWS_PATH)
    else:
        out_path, ja_feitos = DETALHES_PATH, (DETALHES_PATH,)

    client = PlacesClient()
    buscar = client.place_details_sem_reviews if args.sem_reviews else client.place_details
    place_ids = load_unique_place_ids()
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
