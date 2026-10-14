#!/bin/bash
# Copia docs/, textos/ e bibliografia/ para o vault do Obsidian, só para leitura no celular.
# Sentido único: projeto -> vault. Edições feitas no vault são sobrescritas na próxima cópia.
# Uso: _src/extras/sincronizar_vault.sh [--simular]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DESTINO="$HOME/Documents/2oCerebro/1-Graduação/12-TCC/Luderia"
OPCOES=(-a --delete --exclude=.DS_Store)
[[ "${1:-}" == "--simular" ]] && OPCOES+=(--dry-run --itemize-changes)

mkdir -p "$DESTINO"
for pasta in docs textos bibliografia; do
  rsync "${OPCOES[@]}" "$ROOT/$pasta/" "$DESTINO/$pasta/"
done
echo "Copiado para: $DESTINO"
