#!/bin/bash
# Instala (ou reinstala) o vigia do launchd que roda verificar_conceitos.py
# sempre que algo muda numa pasta bibliografia/leituras-*.
# Rodar de novo quando surgir uma leva nova (leituras-P3 etc.).
# Uso: _src/extras/conceitos/instalar_vigia.sh [--remover]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ROTULO="br.ufba.tcc-luderia.verificar-conceitos"
PLIST="$HOME/Library/LaunchAgents/$ROTULO.plist"
PYTHON="$(command -v python3)"
SCRIPT="$ROOT/_src/extras/conceitos/verificar_conceitos.py"

launchctl bootout "gui/$(id -u)/$ROTULO" 2>/dev/null || true
if [[ "${1:-}" == "--remover" ]]; then
  rm -f "$PLIST"
  echo "Vigia removido."
  exit 0
fi

PASTAS=""
for pasta in "$ROOT"/bibliografia/leituras-*/; do
  PASTAS+="    <string>${pasta%/}</string>"$'\n'
done

mkdir -p "$HOME/Library/LaunchAgents" "$ROOT/_src/extras/logs"
cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>$ROTULO</string>
  <key>ProgramArguments</key>
  <array>
    <string>$PYTHON</string>
    <string>$SCRIPT</string>
  </array>
  <key>WatchPaths</key>
  <array>
$PASTAS  </array>
  <key>ThrottleInterval</key>
  <integer>5</integer>
  <key>StandardErrorPath</key>
  <string>$ROOT/_src/extras/logs/vigia_conceitos_erros.log</string>
</dict>
</plist>
EOF

launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "Vigia instalado: $PLIST"
echo "Pastas vigiadas:"
printf '%s' "$PASTAS" | sed -E 's#</?string>##g'
