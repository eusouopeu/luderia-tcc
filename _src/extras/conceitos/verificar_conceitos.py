"""
Verificação de conceitos a partir dos checklists das leituras.

Lê todos os `bibliografia/leituras-*/checklist-conceitos.md`. Uma linha conta
como conferida quando a coluna "Referência" não tem mais `[AV]` e termina na
página exata do conceito (`p. 34`, `p. 34–35`). Para cada linha conferida:

1. troca o marcador `[AV-<ID>]` pela página em todos os `.md` do projeto;
2. nas listas de referências, tira o `[AV]` da obra (linha que começa pelo
   sobrenome do primeiro autor e traz o ano) e, se a linha não tiver páginas e a
   referência do checklist tiver intervalo (`p. 32–39`), acrescenta o intervalo;
3. quando todos os conceitos de uma obra `Rnn` estão conferidos, muda VM para
   VT na `docs/bibliografia/matriz-fundamentacao.md` e grava as páginas.

Também regrava `bibliografia/relatorio-conceitos.md`: pendências por leva e
conceitos cuja definição real diverge da atual (o texto não é reescrito; o
autor decide). Cada execução que muda arquivos acrescenta um registro em
`docs/registro-de-alteracoes.md`.

Uso: python3 verificar_conceitos.py [--simular]
Roda sozinho pelo vigia do launchd (instalar_vigia.sh) a cada salvamento.
"""

from __future__ import annotations

import re
import sys
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

# Pastas e arquivos que o script não altera (histórico datado ou fora do texto)
IGNORAR = ("arquivados", ".git", ".tcc-historico", "node_modules", "dados", "_src")
IGNORAR_ARQUIVOS = ("registro-de-alteracoes.md", "checklist-conceitos.md", "relatorio-conceitos.md")

RE_PAGINA_FINAL = re.compile(r"(p\.\s*\d+(?:\s*[–-]\s*\d+)?)\.?\s*$")
RE_INTERVALO = re.compile(r"p\.\s*\d+\s*[–-]\s*\d+")
RE_ID = re.compile(r"^\s*([A-Z]\d{2}-[a-z])\b")
RE_ANO = re.compile(r"\b(1[89]\d{2}|20\d{2})\b")


@dataclass
class Conceito:
    id: str
    termo: str
    atual: str
    real: str
    autores: str
    referencia: str
    leva: str

    @property
    def conferido(self) -> bool:
        return "[AV]" not in self.referencia and bool(RE_PAGINA_FINAL.search(self.referencia))

    @property
    def pagina(self) -> str:
        m = RE_PAGINA_FINAL.search(self.referencia)
        return re.sub(r"\s+", " ", m.group(1)).replace("-", "–") if m else ""

    @property
    def obra(self) -> str:
        """Referência ABNT sem a página do conceito (e sem o [AV])."""
        ref = self.referencia.replace("[AV]", "").strip()
        if self.conferido:
            ref = RE_PAGINA_FINAL.sub("", ref).strip()
        return ref

    @property
    def codigo_obra(self) -> str:
        return self.id.split("-")[0]

    @property
    def diverge(self) -> bool:
        return bool(self.real.strip()) and _normalizar(self.real) != "igual"


@dataclass
class Resultado:
    mudancas: dict[Path, list[str]] = field(default_factory=dict)

    def anotar(self, arquivo: Path, descricao: str) -> None:
        self.mudancas.setdefault(arquivo, []).append(descricao)


def _normalizar(texto: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", sem_acento.lower()).strip()


def _celulas(linha: str) -> list[str]:
    return [c.strip() for c in linha.strip().strip("|").split("|")]


def ler_checklists(root: Path) -> list[Conceito]:
    conceitos = []
    for arquivo in sorted(root.glob("bibliografia/leituras-*/checklist-conceitos.md")):
        leva = arquivo.parent.name
        for linha in arquivo.read_text(encoding="utf-8").splitlines():
            if not linha.startswith("|"):
                continue
            cel = _celulas(linha)
            if len(cel) < 5:
                continue
            m = RE_ID.match(cel[0])
            if not m:
                continue
            conceitos.append(Conceito(m.group(1), cel[0], cel[1], cel[2], cel[3], cel[4], leva))
    return conceitos


def arquivos_do_projeto(root: Path) -> list[Path]:
    saida = []
    for p in root.rglob("*.md"):
        rel = p.relative_to(root).parts
        if any(parte in IGNORAR for parte in rel[:-1]) or p.name in IGNORAR_ARQUIVOS:
            continue
        saida.append(p)
    return sorted(saida)


def _primeiro_sobrenome(conceito: Conceito) -> str:
    return re.split(r"[,;.]", conceito.autores.strip())[0].strip().upper()


def _corpo(texto: str) -> str:
    """Parte da referência antes do link e do DOI, onde fica o ano da obra."""
    return re.split(r"Disponível em|DOI", texto)[0]


def _ano(conceito: Conceito) -> str:
    anos = RE_ANO.findall(_corpo(conceito.obra))
    return anos[-1] if anos else ""


def _atualizar_referencia(linha: str, conceito: Conceito) -> str:
    """Tira o [AV] de uma linha da lista de referências e completa as páginas."""
    nova = re.sub(r"\s*\[AV\]", "", linha)
    intervalo = RE_INTERVALO.search(conceito.obra)
    ano = _ano(conceito)
    if intervalo and not re.search(r"p\.\s*\d", nova) and ano:
        # insere o intervalo antes da última ocorrência do ano
        pos = _corpo(nova).rfind(ano)
        if pos > 0:
            nova = nova[:pos].rstrip(" ,") + f", {intervalo.group(0)}, " + nova[pos:]
    return nova


def aplicar(root: Path, conceitos: list[Conceito], resultado: Resultado, simular: bool) -> None:
    conferidos = [c for c in conceitos if c.conferido]
    obras_conferidas = {}
    for c in conferidos:
        obras_conferidas.setdefault((_primeiro_sobrenome(c), _ano(c)), c)

    for arquivo in arquivos_do_projeto(root):
        texto = arquivo.read_text(encoding="utf-8")
        novo = texto
        for c in conferidos:
            marcador = f"[AV-{c.id}]"
            n = novo.count(marcador)
            if n:
                novo = novo.replace(marcador, c.pagina)
                resultado.anotar(arquivo, f"`{marcador}` → `{c.pagina}` ({n}x)")
        linhas = novo.split("\n")
        for i, linha in enumerate(linhas):
            if "[AV]" not in linha:
                continue
            for (sobrenome, ano), c in obras_conferidas.items():
                if sobrenome and ano and linha.lstrip().upper().startswith(sobrenome) and ano in _corpo(linha):
                    atualizada = _atualizar_referencia(linha, c)
                    if atualizada != linha:
                        linhas[i] = atualizada
                        resultado.anotar(arquivo, f"referência {sobrenome} ({ano}) sem [AV]")
                    break
        novo = "\n".join(linhas)
        if novo != texto and not simular:
            arquivo.write_text(novo, encoding="utf-8")

    _atualizar_matriz(root, conceitos, resultado, simular)


def _atualizar_matriz(root: Path, conceitos: list[Conceito], resultado: Resultado, simular: bool) -> None:
    matriz = root / "docs" / "bibliografia" / "matriz-fundamentacao.md"
    if not matriz.exists():
        return
    por_obra: dict[str, list[Conceito]] = {}
    for c in conceitos:
        if c.codigo_obra.startswith("R"):
            por_obra.setdefault(c.codigo_obra, []).append(c)
    completas = {
        cod: "pp. " + "; ".join(sorted({c.pagina.removeprefix("p. ") for c in lista}))
        for cod, lista in por_obra.items()
        if all(c.conferido for c in lista)
    }
    if not completas:
        return
    texto = matriz.read_text(encoding="utf-8")
    linhas = texto.split("\n")
    for i, linha in enumerate(linhas):
        cel = _celulas(linha) if linha.startswith("|") else []
        if len(cel) < 7:
            continue
        m = re.match(r"(R\d{2}) — ", cel[3])
        if m and m.group(1) in completas and cel[5] == "VM":
            cel[4], cel[5] = completas[m.group(1)], "VT"
            linhas[i] = "| " + " | ".join(cel) + " |"
            resultado.anotar(matriz, f"{m.group(1)}: VM → VT ({cel[4]})")
    novo = "\n".join(linhas)
    if novo != texto and not simular:
        matriz.write_text(novo, encoding="utf-8")


def gerar_relatorio(root: Path, conceitos: list[Conceito], simular: bool) -> None:
    linhas = [
        "# Relatório de conceitos",
        "",
        "Gerado por `_src/extras/conceitos/verificar_conceitos.py` a cada mudança nos checklists. Não editar à mão.",
        "",
        "## Situação por leva",
        "",
        "| Leva | Conceitos | Conferidos | Pendentes |",
        "|---|---|---|---|",
    ]
    levas: dict[str, list[Conceito]] = {}
    for c in conceitos:
        levas.setdefault(c.leva, []).append(c)
    for leva, lista in sorted(levas.items()):
        ok = sum(c.conferido for c in lista)
        linhas.append(f"| {leva} | {len(lista)} | {ok} | {len(lista) - ok} |")
    total_ok = sum(c.conferido for c in conceitos)
    linhas.append(f"| **Total** | {len(conceitos)} | {total_ok} | {len(conceitos) - total_ok} |")
    linhas += ["", "## Definições divergentes", ""]
    divergentes = [c for c in conceitos if c.diverge]
    if not divergentes:
        linhas.append("Nenhuma.")
    else:
        linhas.append("O texto do TCC ainda usa a definição atual. Revisar os trechos indicados.")
        arquivos = arquivos_do_projeto(root)
        for c in divergentes:
            termo = re.sub(r"^[A-Z]\d{2}-[a-z]\s*—\s*", "", c.termo).strip("* ")
            chave = _normalizar(termo.split("(")[0])
            onde = []
            for arquivo in arquivos:
                for n, linha in enumerate(arquivo.read_text(encoding="utf-8").splitlines(), 1):
                    if chave and chave in _normalizar(linha):
                        onde.append(f"`{arquivo.relative_to(root)}:{n}`")
            linhas += [
                "",
                f"### {c.id} — {termo}",
                f"- **Atual:** {c.atual}",
                f"- **Real:** {c.real}",
                f"- **Onde aparece:** {', '.join(onde[:15]) or 'termo não encontrado nos textos'}",
            ]
    relatorio = root / "bibliografia" / "relatorio-conceitos.md"
    novo = "\n".join(linhas) + "\n"
    if not simular and (not relatorio.exists() or relatorio.read_text(encoding="utf-8") != novo):
        relatorio.write_text(novo, encoding="utf-8")


def registrar_alteracao(root: Path, resultado: Resultado, agora: datetime) -> None:
    registro = root / "docs" / "registro-de-alteracoes.md"
    if not resultado.mudancas or not registro.exists():
        return
    texto = registro.read_text(encoding="utf-8").rstrip("\n")
    cabecalho = f"## {agora:%Y/%m/%d}"
    objetos = ", ".join(f"`{p.relative_to(root)}`" for p in resultado.mudancas)
    detalhes = "; ".join(
        f"{p.relative_to(root)}: {', '.join(d)}" for p, d in resultado.mudancas.items()
    )
    bloco = (
        f"### {agora:%H:%M}\n"
        f"**Objeto**: {objetos}\n"
        f"**Antes**: marcadores `[AV]` de conceitos e obras ainda não conferidos.\n"
        f"**Depois**: {detalhes}.\n"
        f"**Justificativa**: página conferida pelo autor no checklist de conceitos; "
        f"troca feita pelo `_src/extras/conceitos/verificar_conceitos.py`."
    )
    if cabecalho not in texto.split("\n"):
        texto += f"\n\n{cabecalho}"
    registro.write_text(texto + "\n\n" + bloco + "\n", encoding="utf-8")


def main(root: Path = ROOT, simular: bool = False, agora: datetime | None = None) -> Resultado:
    conceitos = ler_checklists(root)
    resultado = Resultado()
    aplicar(root, conceitos, resultado, simular)
    gerar_relatorio(root, conceitos, simular)
    if not simular:
        registrar_alteracao(root, resultado, agora or datetime.now())
    for arquivo, descricoes in resultado.mudancas.items():
        print(f"{arquivo.relative_to(root)}: {'; '.join(descricoes)}")
    print(f"{len(conceitos)} conceitos, {sum(c.conferido for c in conceitos)} conferidos, "
          f"{len(resultado.mudancas)} arquivos {'a mudar' if simular else 'mudados'}.")
    return resultado


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
    from log_execucao import registrar_execucao

    registrar_execucao(__file__)
    main(simular="--simular" in sys.argv)
