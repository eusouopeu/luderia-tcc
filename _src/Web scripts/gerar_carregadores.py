"""
Gera um "carregador" do Tampermonkey para cada script desta pasta, para que o
navegador rode sempre a versão do disco, sem reinstalar a cada mudança.

Como funciona:
  - o carregador copia o cabeçalho do script (@name, @namespace, @match,
    @grant, @run-at...) e acrescenta um @require file:/// apontando para o
    arquivo do repositório; não tem código próprio;
  - @name e @namespace iguais aos do script fazem o Tampermonkey tratar o
    carregador como atualização do script já instalado: ele o substitui e
    mantém o armazenamento (o sal do maps_avaliacoes, por exemplo);
  - mudança só no corpo do script vale no próximo recarregar da página;
  - mudança no cabeçalho (novo @match, @grant, @run-at...) exige instalar o
    carregador de novo. O script guarda a impressão dos cabeçalhos em
    carregadores/cabecalhos.json e lista os carregadores que mudaram; com
    --abrir, abre esses no navegador (Vivaldi) para instalar com um clique.

Configuração única no Vivaldi (feita pelo autor):
  1. vivaldi://extensions → Tampermonkey → Detalhes → ligar "Permitir acesso a
     URLs de arquivo";
  2. instalar cada carregador uma vez: python3 gerar_carregadores.py --abrir --todos
  3. se uma mudança no corpo não aparecer ao recarregar a página:
     Tampermonkey → Configurações (modo Avançado) → Externos → Intervalo de
     atualização → "Sempre".

Os carregadores têm o caminho absoluto desta máquina e ficam fora do git.

Uso:
    python3 "_src/Web scripts/gerar_carregadores.py"            # gera e lista o que mudou
    python3 "_src/Web scripts/gerar_carregadores.py" --abrir    # e abre no navegador os que mudaram
    python3 "_src/Web scripts/gerar_carregadores.py" --abrir --todos
"""
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path

PASTA = Path(__file__).resolve().parent
SAIDA = PASTA / "carregadores"
IMPRESSOES = SAIDA / "cabecalhos.json"
# Navegador com o Tampermonkey em que os carregadores funcionam. O Firefox não
# serve: lá o Tampermonkey não lê @require file:///.
NAVEGADOR = "Vivaldi"
RE_CABECALHO = re.compile(r"// ==UserScript==\n(.*?)// ==/UserScript==", re.S)


def cabecalho(script):
    m = RE_CABECALHO.search(script.read_text(encoding="utf-8"))
    if not m:
        raise ValueError(f"{script.name}: sem bloco ==UserScript==")
    return [l for l in m.group(1).splitlines() if l.strip()]


def carregador(script, linhas):
    saida = ["// ==UserScript=="]
    for l in linhas:
        if l.startswith("// @description"):
            l = l.replace("@description  ", "@description  [carregador local] ", 1)
        if l.startswith(("// @require", "// @updateURL", "// @downloadURL")):
            continue
        saida.append(l)
    saida.append(f"// @require      {script.resolve().as_uri()}")
    saida.append("// ==/UserScript==")
    saida.append(f"// Gerado por gerar_carregadores.py. O código está em {script.name}, lido do disco a cada página.")
    return "\n".join(saida) + "\n"


def impressao(linhas):
    """Cabeçalho sem @version e @description: só o que exige reinstalar."""
    relevantes = [l for l in linhas if not l.startswith(("// @version", "// @description"))]
    return hashlib.sha256("\n".join(relevantes).encode()).hexdigest()[:16]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--abrir", action="store_true", help="abre no navegador os carregadores a instalar")
    ap.add_argument("--navegador", default=NAVEGADOR, help=f"aplicativo do macOS (padrão: {NAVEGADOR})")
    ap.add_argument("--todos", action="store_true", help="com --abrir, abre todos, não só os que mudaram")
    args = ap.parse_args()

    SAIDA.mkdir(exist_ok=True)
    antigas = json.loads(IMPRESSOES.read_text()) if IMPRESSOES.exists() else {}
    novas, mudaram = {}, []
    for script in sorted(PASTA.glob("*.user.js")):
        linhas = cabecalho(script)
        destino = SAIDA / script.name
        destino.write_text(carregador(script, linhas), encoding="utf-8")
        novas[script.name] = impressao(linhas)
        situacao = "sem mudança no cabeçalho"
        if antigas.get(script.name) != novas[script.name]:
            mudaram.append(destino)
            situacao = "NOVO: instalar" if script.name not in antigas else "cabeçalho mudou: reinstalar"
        print(f"{script.name}: {situacao}")
    for nome in set(antigas) - set(novas):
        (SAIDA / nome).unlink(missing_ok=True)
        print(f"{nome}: script apagado; remova-o também no Tampermonkey")
    abrir = sorted(SAIDA.glob("*.user.js")) if args.todos else mudaram
    # A impressão só é gravada para o que foi aberto para instalar; o resto
    # continua pendente até a próxima execução com --abrir.
    gravar = {n: v for n, v in antigas.items() if n in novas}
    if args.abrir and abrir:
        abertos = 0
        for f in abrir:
            r = subprocess.run(["open", "-a", args.navegador, str(f)], capture_output=True, text=True)
            if r.returncode != 0:
                print(f"falha ao abrir {f.name} no {args.navegador}: {r.stderr.strip()}")
                continue
            gravar[f.name] = novas[f.name]
            abertos += 1
        print(f"\nabertos no {args.navegador}: {abertos} de {len(abrir)}. Clique em Instalar/Atualizar em cada aba.")
    elif mudaram:
        print("\nrode com --abrir para instalar os que mudaram.")
    IMPRESSOES.write_text(json.dumps(gravar, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
