"""
Bloco B1 - fila do coletor de entorno do Google Maps (maps_entorno.user.js).

Objeto da fila: as luderias do B1 hoje, ou seja,
  - aprovadas na triagem manual das metrópoles (B1_triagem_manual_metro_av100.xlsx,
    resultado "aprovado"), menos as que saíram do objeto (EXCLUIDAS);
  - mais as "nova luderia" achadas pelo acervo de jogos
    (B1_acervodejogos_triagem.csv, decisão "nova luderia").
Fora da fila ficam os estabelecimentos que já têm resumo de entorno coletado
no Maps (maps_entorno_resumo_*.csv em _dados-brutos/estabelecimentos/), para
não coletar duas vezes. Cada place_id aparece uma vez.

Coordenadas: B1_localizacoes.jsonl. Os place_ids que ainda não estão lá são
buscados na Places API (Place Details, só o campo location) e acrescentados ao
jsonl, que é o repositório bruto das coordenadas.

Saída: dados/[B1] Estabelecimentos e cardapios/entorno/B1_entorno_maps_fila.csv
(";" e UTF-8 com BOM; place_id, nome, capital_endereco, lat, lng), o formato
que o botão "Carregar CSV" do coletor lê.

Uso:
    python3 "_src/[B1] Estabelecimentos e cardapios/Google Places (Negócios)/build/B1-b_entorno_maps_fila.py"
"""
# Caminhos: _src/extras/ (log comum) e outros/ do objeto (auxiliares); log em ../logs/
import sys
from pathlib import Path
_AQUI = Path(__file__).resolve()
sys.path[:0] = [str(_AQUI.parents[3] / "extras"), str(_AQUI.parents[1] / "outros")]
from log_execucao import registrar_execucao  # noqa: E402
if __name__ == "__main__":
    registrar_execucao(__file__)

import csv
import json

import pandas as pd

ROOT = _AQUI.parents[4]
PROCESSED = ROOT / "dados" / "[B1] Estabelecimentos e cardapios"
BRUTOS = PROCESSED / "_dados-brutos" / "estabelecimentos"
TRIAGEM = PROCESSED / "estabelecimentos/3_triagem/B1_triagem_manual_metro_av100.xlsx"
ACERVO = PROCESSED / "acervo_jogos/B1_acervodejogos_triagem.csv"
LOCALIZACOES = BRUTOS / "B1_localizacoes.jsonl"
SAIDA = PROCESSED / "entorno/B1_entorno_maps_fila.csv"

# Saíram do objeto em 14/10/2026 (docs/decisoes.md): loja de videogame e loja de TCG.
EXCLUIDAS = {"Machado Games", "Ilusões Industriais"}


def alvos():
    """Dicionário place_id -> (nome, capital_endereco) do objeto da fila."""
    tri = pd.read_excel(TRIAGEM)
    aprov = tri[tri["resultado da triagem"] == "aprovado"]
    out = {r.place_id: (r.nome, r.capital_endereco) for r in aprov.itertuples() if r.nome not in EXCLUIDAS}
    ac = pd.read_csv(ACERVO)
    for r in ac[ac["decisao"] == "nova luderia"].itertuples():
        out.setdefault(r.place_id, (r.nome_google, r.capital_google))
    return out


def coordenadas():
    loc = {}
    if LOCALIZACOES.exists():
        for linha in LOCALIZACOES.read_text(encoding="utf-8").splitlines():
            if linha.strip():
                j = json.loads(linha)
                loc[j["id"]] = j["location"]
    return loc


def completar_coordenadas(ids, loc):
    faltam = [i for i in ids if i not in loc]
    if not faltam:
        return
    from places_client import PlacesClient

    cliente = PlacesClient()
    print(f"buscando coordenada de {len(faltam)} place_ids na Places API")
    with open(LOCALIZACOES, "a", encoding="utf-8") as f:
        for pid in faltam:
            try:
                det = cliente.place_location(pid)
            except RuntimeError as exc:
                print(f"erro em {pid}: {exc}")
                continue
            f.write(json.dumps(det, ensure_ascii=False) + "\n")
            loc[det["id"]] = det["location"]


def ja_coletados():
    nomes = set()
    for caminho in BRUTOS.glob("maps_entorno_resumo_*.csv"):
        with open(caminho, newline="", encoding="utf-8-sig") as f:
            nomes |= {r["nome"] for r in csv.DictReader(f, delimiter=";")}
    return nomes


def main():
    todos = alvos()
    loc = coordenadas()
    completar_coordenadas(list(todos), loc)
    feitos = ja_coletados()

    linhas, sem_coord, pulados = [], [], []
    for pid, (nome, capital) in todos.items():
        if nome in feitos:
            pulados.append(nome)
        elif pid not in loc:
            sem_coord.append(nome)
        else:
            linhas.append([pid, nome, capital, loc[pid]["latitude"], loc[pid]["longitude"]])
    linhas.sort(key=lambda r: (r[2], r[1]))

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["place_id", "nome", "capital_endereco", "lat", "lng"])
        w.writerows(linhas)

    # conferência: objeto = fila + já coletados + sem coordenada
    print(f"objeto: {len(todos)} | na fila: {len(linhas)} | já coletados: {len(pulados)} {pulados} | sem coordenada: {len(sem_coord)} {sem_coord}")
    assert len(linhas) + len(pulados) + len(sem_coord) == len(todos), "soma não fecha"
    print(f"OK: {SAIDA}")


if __name__ == "__main__":
    main()
