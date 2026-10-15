"""
Bloco B1 - lista de estabelecimentos do coletor de entorno (maps_entorno.user.js),
usada nas duas coletas do painel: Google Maps e OpenStreetMap.

Objeto da fila: as luderias do B1 hoje, ou seja,
  - aprovadas na triagem manual das metrópoles (B1_triagem_manual_metro_av100.xlsx,
    resultado "aprovado"), menos as que saíram do objeto (EXCLUIDAS);
  - mais as "nova luderia" achadas pelo acervo de jogos
    (B1_acervodejogos_triagem.csv, decisão "nova luderia").
A lista traz o objeto inteiro, já coletado ou não: o próprio coletor pula,
em cada fonte, quem já está guardado no navegador (desde 15/10/2026; antes,
este script tirava da fila quem já tinha resumo do Maps). Cada place_id
aparece uma vez.

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


def main():
    todos = alvos()
    loc = coordenadas()
    completar_coordenadas(list(todos), loc)

    linhas, sem_coord = [], []
    for pid, (nome, capital) in todos.items():
        if pid not in loc:
            sem_coord.append(nome)
        else:
            linhas.append([pid, nome, capital, loc[pid]["latitude"], loc[pid]["longitude"]])
    linhas.sort(key=lambda r: (r[2], r[1]))

    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["place_id", "nome", "capital_endereco", "lat", "lng"])
        w.writerows(linhas)

    # conferência: objeto = lista + sem coordenada
    print(f"objeto: {len(todos)} | na lista: {len(linhas)} | sem coordenada: {len(sem_coord)} {sem_coord}")
    assert len(linhas) + len(sem_coord) == len(todos), "soma não fecha"
    print(f"OK: {SAIDA}")


if __name__ == "__main__":
    main()
