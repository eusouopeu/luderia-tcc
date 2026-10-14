"""
Log de execução comum a todos os scripts dos blocos.

Cada script chama `registrar_execucao(__file__)` no início. A partir daí, tudo o
que ele escreve no terminal (stdout e stderr) também vai para
`_src/[Bn] Fonte/logs/<script>_AAAA-MM-DD_HHMM.log`, com cabeçalho (comando e
início) e rodapé (fim e duração). Os logs ficam fora do git (`.gitignore`).
"""

from __future__ import annotations

import atexit
import sys
from datetime import datetime
from pathlib import Path


class _Duplicador:
    """Escreve no terminal e no arquivo de log ao mesmo tempo."""

    def __init__(self, original, arquivo):
        self._original = original
        self._arquivo = arquivo

    def write(self, texto):
        self._original.write(texto)
        self._arquivo.write(texto)
        return len(texto)

    def flush(self):
        self._original.flush()
        self._arquivo.flush()

    def __getattr__(self, nome):
        return getattr(self._original, nome)


def registrar_execucao(script: str) -> Path:
    """Liga o log do script; devolve o caminho do arquivo de log."""
    caminho_script = Path(script).resolve()
    inicio = datetime.now()
    pasta = caminho_script.parents[1] / "logs"
    pasta.mkdir(exist_ok=True)
    log = pasta / f"{caminho_script.stem}_{inicio:%Y-%m-%d_%H%M}.log"
    arquivo = open(log, "a", encoding="utf-8")
    arquivo.write(f"# {caminho_script.name} {' '.join(sys.argv[1:])}\n# início: {inicio:%Y-%m-%d %H:%M:%S}\n\n")
    sys.stdout = _Duplicador(sys.stdout, arquivo)
    sys.stderr = _Duplicador(sys.stderr, arquivo)

    def fechar():
        fim = datetime.now()
        sys.stdout.flush()
        arquivo.write(f"\n# fim: {fim:%Y-%m-%d %H:%M:%S} (duração: {fim - inicio})\n")
        arquivo.close()
        sys.stdout = sys.stdout._original
        sys.stderr = sys.stderr._original

    atexit.register(fechar)
    return log
