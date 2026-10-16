"""
Lê os bancos do Notion a partir do cache local do app desktop, sem internet.

O app do Notion (Electron) guarda uma cópia SQLite do que já foi aberto em
`~/Library/Application Support/Notion/notion.db`. As tabelas que importam:

- `collection`: um banco do Notion. `name` é rich text (`[["Nome"]]`) e
  `schema` mapeia o id curto de cada propriedade para `{"name", "type"}`.
- `block`: páginas e blocos. As linhas de um banco têm `parent_table =
  'collection'` e `parent_id = <id do banco>`; `properties` guarda os valores
  por id curto, no mesmo formato rich text. `alive = 0` é linha apagada.
- `collection_view`: as visões (tabela, quadro...) de cada banco.

O cache só tem o que o app já baixou: linhas nunca abertas podem faltar, e
algumas páginas novas guardam o título só em `crdt_data` (ficam com o campo
vazio e são contadas no aviso do fim). Fórmulas e rollups são calculados pelo
servidor e quase sempre vêm vazios (ex.: "Capital do endereço" em
B - Comentários); recalcular a partir das colunas de origem. Não serve como fonte de verdade; serve
para consulta e conferência offline.

Uso:
    python _src/extras/ler_notion_offline.py                      # lista os bancos
    python _src/extras/ler_notion_offline.py "A - Estabelecimentos" --saida a.csv
"""

from __future__ import annotations

import argparse
import csv
import json
import sqlite3
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

BANCO_PADRAO = Path.home() / "Library/Application Support/Notion/notion.db"


def copiar_snapshot(origem: Path) -> sqlite3.Connection:
    """Copia o cache aberto pelo app para um arquivo temporário (API de backup)."""
    fonte = sqlite3.connect(f"file:{origem}?mode=ro", uri=True)
    destino_path = Path(tempfile.mkdtemp()) / "notion.db"
    destino = sqlite3.connect(destino_path)
    fonte.backup(destino)
    fonte.close()
    return destino


def texto_rico(valor, tipo: str, nomes_paginas: dict[str, str]) -> str:
    """Converte o rich text do Notion em texto simples, conforme o tipo."""
    if not valor:
        return ""
    partes = []
    for trecho in valor:
        texto = trecho[0]
        marcas = trecho[1] if len(trecho) > 1 else []
        if texto == "‣":  # menção: página, pessoa ou data
            for marca in marcas:
                if marca[0] == "p":
                    texto = nomes_paginas.get(marca[1], marca[1])
                elif marca[0] == "u":
                    texto = marca[1]
                elif marca[0] == "d":
                    data = marca[1]
                    texto = data.get("start_date", "")
                    if data.get("end_date"):
                        texto += "/" + data["end_date"]
        partes.append(texto)
    juntado = "".join(partes)
    if tipo == "relation":
        return "; ".join(p for p in partes if p != ",")
    return juntado


def listar_bancos(con: sqlite3.Connection) -> None:
    sql = """
        select json_extract(c.name, '$[0][0]'), c.id,
               (select count(*) from block b
                 where b.parent_id = c.id and b.parent_table = 'collection'
                   and b.alive = 1)
          from collection c
         where c.alive = 1
         order by 3 desc
    """
    for nome, ident, linhas in con.execute(sql):
        print(f"{linhas:>5}  {nome or '(sem nome)'}  [{ident}]")


def exportar_banco(con: sqlite3.Connection, nome: str, saida: Path | None) -> None:
    achados = con.execute(
        "select id, schema from collection"
        " where alive = 1 and json_extract(name, '$[0][0]') = ?",
        (nome,),
    ).fetchall()
    if len(achados) != 1:
        sys.exit(f"Esperado 1 banco chamado {nome!r}; achados {len(achados)}.")
    ident, schema_txt = achados[0]
    schema = json.loads(schema_txt or "{}")
    # título primeiro, depois as demais colunas em ordem alfabética
    colunas = sorted(schema, key=lambda k: (schema[k]["type"] != "title", schema[k]["name"]))

    nomes_paginas = {
        i: texto_rico(json.loads(p).get("title"), "title", {}) or i
        for i, p in con.execute(
            "select id, properties from block where properties like '%\"title\"%'"
        )
    }

    linhas = con.execute(
        "select id, properties, created_time, last_edited_time from block"
        " where parent_table = 'collection' and parent_id = ? and alive = 1"
        " order by created_time",
        (ident,),
    ).fetchall()

    def data(ms):
        return datetime.fromtimestamp(ms / 1000, timezone.utc).isoformat() if ms else ""

    sem_propriedades = 0
    destino = open(saida, "w", newline="", encoding="utf-8") if saida else sys.stdout
    escritor = csv.writer(destino)
    escritor.writerow(["id"] + [schema[c]["name"] for c in colunas])
    for bloco_id, props_txt, criado, editado in linhas:
        props = json.loads(props_txt or "{}")
        if not props:
            sem_propriedades += 1
        valores = []
        for c in colunas:
            tipo = schema[c]["type"]
            if tipo == "created_time":
                valores.append(data(criado))
            elif tipo == "last_edited_time":
                valores.append(data(editado))
            else:
                valores.append(texto_rico(props.get(c), tipo, nomes_paginas))
        escritor.writerow([bloco_id] + valores)
    if saida:
        destino.close()

    print(f"{nome}: {len(linhas)} linhas, {len(colunas)} colunas.", file=sys.stderr)
    if sem_propriedades:
        print(
            f"Aviso: {sem_propriedades} linhas sem `properties` no cache"
            " (só em crdt_data); abra o banco no app para sincronizar.",
            file=sys.stderr,
        )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("banco", nargs="?", help="nome exato do banco no Notion")
    parser.add_argument("--saida", type=Path, help="CSV de saída (padrão: terminal)")
    parser.add_argument("--cache", type=Path, default=BANCO_PADRAO)
    args = parser.parse_args()

    con = copiar_snapshot(args.cache)
    if args.banco:
        exportar_banco(con, args.banco, args.saida)
    else:
        listar_bancos(con)


if __name__ == "__main__":
    main()
