"""
Bloco A - etapa 2b: detalhes dos place_ids que ainda não têm detalhe, SEM o
campo `reviews`.

Motivo: o campo `reviews` promove a chamada ao SKU "Place Details Enterprise
+ Atmosphere", cuja franquia mensal gratuita já foi consumida (1.161 chamadas
em setembro de 2026, R$ 23,63 cobrados). Sem ele, a chamada cai no SKU "Place
Details Enterprise", que no mesmo mês registrava 219 chamadas e R$ 0,00.
Coletar assim traz nota, volume de avaliações, categorias, status, site e
telefone a custo zero; só o texto das avaliações fica de fora.

Consequência para o filtro (build_bloco_b_planilha.py): estes registros só
podem ser aprovados pela palavra-chave no NOME. Quem não bate no nome não é
descartado, e sim mandado para `bloco_b_triagem.csv`, porque a evidência que
decidiria o caso não foi comprada. Ausência de evidência não é evidência de
ausência.

Saída: _data/raw/[A] Estabelecimentos e cardapios/bloco_b_detalhes_sem_reviews.jsonl
Cada registro leva `data_coleta` (data UTC da chamada).

Resumível: place_ids já presentes em qualquer um dos dois arquivos de
detalhes são pulados, então rodar de novo não paga nada duas vezes.

Uso:
    python3 "_src/[A] Google Places (estabelecimentos)/collect_bloco_b_details_sem_reviews.py"
"""
import json
import pathlib
from csv import DictReader
from datetime import datetime, timezone

from tqdm import tqdm

from places_client import PlacesClient

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = ROOT / "_data" / "raw" / "[A] Estabelecimentos e cardapios"
CANDIDATOS_PATH = RAW / "bloco_b_candidatos.csv"
DETALHES_PATH = RAW / "bloco_b_detalhes.jsonl"
OUT_PATH = RAW / "bloco_b_detalhes_sem_reviews.jsonl"


def load_unique_place_ids():
    with open(CANDIDATOS_PATH, newline="", encoding="utf-8") as f:
        return sorted({row["place_id"] for row in DictReader(f) if row["place_id"]})


def load_done_ids():
    """Ids já coletados em qualquer um dos dois arquivos de detalhes."""
    done = set()
    for path in (DETALHES_PATH, OUT_PATH):
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
    client = PlacesClient()
    place_ids = load_unique_place_ids()
    done = load_done_ids()
    pendentes = [p for p in place_ids if p not in done]
    print(f"{len(place_ids)} place_ids únicos, {len(done)} já coletados, {len(pendentes)} pendentes")

    n_ok = 0
    with open(OUT_PATH, "a", encoding="utf-8") as f:
        for place_id in tqdm(pendentes, desc="Detalhes sem reviews"):
            try:
                detalhe = client.place_details_sem_reviews(place_id)
            except RuntimeError as exc:
                print(f"Erro em {place_id}: {exc}")
                continue
            detalhe["data_coleta"] = datetime.now(timezone.utc).date().isoformat()
            f.write(json.dumps(detalhe, ensure_ascii=False) + "\n")
            n_ok += 1
            f.flush()

    print(f"OK: {n_ok} detalhes salvos em {OUT_PATH.name}")


if __name__ == "__main__":
    main()
