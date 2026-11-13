"""Arquiva a versão atual de capítulos .md antes de uma nova versão (_docs/_instrucoes/1c_versoes.md).

Quando um dado do trabalho muda, os capítulos afetados ganham versão nova no
próprio .md de textos/capitulos/ (o .docx só é regerado no fechamento de uma
versão para a orientação). Antes de editar, este script copia cada .md para
textos/capitulos/_arquivo/<nome>_AAAA-MM-DD_HHmm.md, com a data e a hora da
cópia; o .md da pasta continua com o mesmo nome e passa a ser a versão nova.

Uso:
    python3 _src/Extras/G4_textos/arquivar_md.py textos/capitulos/6_plano_de_marketing.md [outros .md]
"""
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CAP = ROOT / "textos" / "capitulos"
ARQ = CAP / "_arquivo"


def arquivar(md: Path, carimbo: str) -> Path:
    md = md if md.is_absolute() else (Path.cwd() / md)
    md = md.resolve()
    if md.parent != CAP or md.suffix != ".md":
        raise SystemExit(f"Não é um capítulo de textos/capitulos/: {md}")
    ARQ.mkdir(exist_ok=True)
    destino = ARQ / f"{md.stem}_{carimbo}.md"
    if destino.exists():  # duas cópias no mesmo minuto: a primeira vale
        return destino
    shutil.copy2(md, destino)
    return destino


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    carimbo = datetime.now().strftime("%Y-%m-%d_%H%M")
    for arg in sys.argv[1:]:
        print(f"arquivado: {arquivar(Path(arg), carimbo).relative_to(ROOT)}")


if __name__ == "__main__":
    main()
