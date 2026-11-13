"""Conferidor de citações e referências marcadas [AV] nos capítulos do TMin.

Transforma a conferência numa fila de cartões, um por linha com [AV] (a mesma
referência repetida em vários capítulos vira um cartão só). Para cada cartão,
a pré-triagem acha o PDF da obra em bibliografia/ (autor e ano, ou número da
lei), localiza as páginas com mais palavras da frase citada (e o cabeçalho do
artigo, quando a frase cita um) e testa os links da referência. A fila vem
agrupada por obra, do grupo mais fácil (trecho achado com coincidência alta)
para o mais difícil; sem PDF, vai para o fim, agrupada pela obra citada. O
autor pode trocar a obra de um cartão por qualquer PDF do acervo, e a escolha
fica guardada. O app só aponta o trecho: quem confere é o autor.

Uso:
    python3 _src/outros/G4_textos/conferidor_av/conferidor.py            # abre a fila em http://127.0.0.1:8765
    python3 _src/outros/G4_textos/conferidor_av/conferidor.py aplicar    # grava os vereditos nos .md
    python3 _src/outros/G4_textos/conferidor_av/conferidor.py faltam     # obras citadas sem PDF no acervo
    python3 _src/outros/G4_textos/conferidor_av/conferidor.py relatorio  # "não confere" e "sem acesso"
    (--sem-navegador: não abre o navegador sozinho)

Vereditos ficam em bibliografia/conferencia_av.csv. "aplicar" troca, nos .md,
a linha original pelo texto revisado dos cartões "confere" (arquivando antes a
versão anterior com arquivar_md.py), registra as citações do texto (não as
linhas de referência) em bibliografia/citacoes_conferidas.md, com a página
impressa (ou a do PDF, se ela faltar), e marca o veredito como aplicado.
"não confere" e "sem acesso" só ficam registrados e saem no relatório.
"""
from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import ssl
import subprocess
import sys
import unicodedata
import urllib.parse
import urllib.request
import webbrowser
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
AQUI = Path(__file__).resolve().parent
CAP = ROOT / "textos" / "capitulos"
BIB = ROOT / "bibliografia"
CACHE = AQUI / "_cache"
ESCOLHAS = CACHE / "escolhas.json"
VEREDITOS = BIB / "conferencia_av.csv"
CONFERIDAS = BIB / "citacoes_conferidas.md"
PORTA = 8765

sys.path.insert(0, str(ROOT / "_src" / "outros" / "G4_textos"))
sys.path.insert(0, str(ROOT / "_src" / "outros" / "G5_outros"))

# [AV], [AV: ...], [AV – ...], `[AV ano de cada edição]`
MARCA = re.compile(r"`?\[AV(?:[^\]A-Za-z][^\]]*)?\]`?")
# remoção leva junto a vírgula de "(PORTER, 2004, [AV])" ou o espaço antes
MARCA_REMOVER = re.compile(r"(?:,\s*|\s)?`?\[AV(?:[^\]A-Za-z][^\]]*)?\]`?")
REFERENCIA = re.compile(r"^[A-ZÀ-Ü][A-ZÀ-Ü ()\-]{2,}[.,;] ")
URL = re.compile(r"https?://[^\s)\]>`]+")
NUM_NORMA = re.compile(
    r"(?:\bLei(?: Complementar| estadual| municipal)?|\bLC|\bEC|Emenda Constitucional|"
    r"Portaria(?: MTP)?|Resolução|RDC)\s*(?:n[º°.o]?\s*)?(\d{1,3}(?:\.\d{3})?)\b"
)
CIT_AUTOR = re.compile(r"\(([A-ZÀ-Ü][A-ZÀ-Ü\-]+(?:;\s*[A-ZÀ-Ü][A-ZÀ-Ü\-]+)*)(?: et al\.)?,\s*(\d{4})")
# "art. 1.052", "art. 18-A", "arts. 71, 73, 386 e 457"
ARTIGO = re.compile(r"\barts?\.\s*((?:\d{1,3}(?:\.\d{3})?\s*[º°o]?(?:-[A-Z])?(?:\s*(?:,|e)\s*(?=\d))?)+)")
ART_NUM = re.compile(r"(\d{1,3}(?:\.\d{3})?)\s*[º°o]?(?:-([A-Z]))?")
PAGINA_CITADA = re.compile(r"\bp\.\s*(\d+(?:\s*[–-]\s*\d+)?)")
SIGLA = re.compile(r"\(([A-Z]{3,}[A-Z0-9\-]*)\)")
NORMA_NOMEADA = re.compile(r"\b(LOUOS|C[óo]digo de Obras|RICMS|CLT|NR-\d+|C[óo]digo Civil)\b")
AUTORES_GENERICOS = {"brasil", "bahia", "salvador", "instituto", "comissao", "conselho", "ministerio"}
VEREDITOS_VALIDOS = {"confere", "nao_confere", "sem_acesso"}
PARADAS = set(
    "sobre entre quando cada para pelos pelas pelo pela como mais menos essas esses estas estes "
    "outro outra outros outras ainda tambem desde porque seja sejam deve devem podem pode fica "
    "ficam muito muita depois antes nesta neste nessa nesse qualquer todas todos toda todo "
    "sendo sido estao esta essa esse isso aquilo onde cujo cuja numa disponivel acesso".split()
)


# ----------------------------------------------------------------- texto
def normalizar(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    return "".join(c for c in s if not unicodedata.combining(c)).lower()


def palavras(s: str) -> list[str]:
    vistas, saida = set(), []
    for p in re.findall(r"[a-z]{5,}", normalizar(s)):
        if p not in PARADAS and p not in vistas:
            vistas.add(p)
            saida.append(p)
    return saida


def remover_marcas(s: str) -> str:
    return MARCA_REMOVER.sub("", s)


def limpar_md(s: str) -> str:
    return re.sub(r"[*_`|]", " ", MARCA.sub(" ", s))


def _frase_antes(texto: str, inicio: int, fim: int) -> int:
    """Início da frase (ou célula de tabela) que termina em `fim`."""
    partes = re.split(r"(?<=[.;])\s+(?=[A-ZÀ-Ü])|\|", texto[inicio:fim])
    pos = fim - len(partes[-1])
    while pos < fim and texto[pos] == " ":
        pos += 1
    return pos


def marcas_do_texto(texto: str) -> list[dict]:
    """Posição de cada marca, o início da frase que ela confere e a tarefa escrita nela."""
    referencia = bool(REFERENCIA.match(texto))
    saida, inicio = [], 0
    for m in MARCA.finditer(texto):
        dentro = re.match(r"`?\[AV(.*)\]`?$", m.group(0)).group(1)
        saida.append({
            "ini": m.start(), "fim": m.end(),
            "frase": m.start() if referencia else _frase_antes(texto, inicio, m.start()),
            "tarefa": dentro.strip(" :–-"),
        })
        inicio = m.end()
    return saida


def artigos_citados(texto: str) -> list[tuple[str | None, str, str]]:
    """(número da norma logo antes, artigo, letra) de cada artigo citado na frase."""
    normas = [(m.end(), m.group(1)) for m in NUM_NORMA.finditer(texto)]
    saida = []
    for m in ARTIGO.finditer(texto):
        antes = [num for fim, num in normas if 0 <= m.start() - fim <= 25]
        norma = antes[-1] if antes else None
        for n, letra in ART_NUM.findall(m.group(1)):
            saida.append((norma, n, letra.upper()))
    return saida


# ----------------------------------------------------------------- acervo
def acervo() -> list[dict]:
    """PDFs de bibliografia/F*/ (os trechos_citados e o _arquivo ficam de fora)."""
    itens = []
    for pdf in sorted(BIB.glob("F*/**/*.pdf")):
        nome = pdf.stem
        m = re.match(r"(.+?)\s*\((?:[^)]*?)?(\d{4}|s\.d\.)\)\s*-\s*(.*)", nome)
        autor, ano, titulo = (m.group(1), m.group(2), m.group(3)) if m else (nome, "", "")
        itens.append({
            "arquivo": str(pdf.relative_to(BIB)),
            "autor": normalizar(autor),
            "ano": ano,
            "titulo": titulo,
            "numeros": set(re.findall(r"\b\d{1,3}(?:\.\d{3})?\b", titulo)),
        })
    return itens


def pdf_seguro(rel: str) -> Path | None:
    """Caminho do PDF só se ele estiver dentro de bibliografia/."""
    alvo = (BIB / rel).resolve()
    if BIB.resolve() not in alvo.parents or not alvo.is_file() or alvo.suffix.lower() != ".pdf":
        return None
    return alvo


def paginas_pdf(rel: str) -> list[str]:
    """Texto de cada página (pdftotext), em cache por arquivo e data de modificação."""
    pdf = BIB / rel
    chave = hashlib.sha1(f"{rel}{pdf.stat().st_mtime}".encode()).hexdigest()[:16]
    destino = CACHE / "paginas" / f"{chave}.json"
    if destino.exists():
        return json.loads(destino.read_text())
    try:
        saida = subprocess.run(["pdftotext", "-enc", "UTF-8", str(pdf), "-"],
                               capture_output=True, text=True, timeout=180).stdout
    except (OSError, subprocess.TimeoutExpired):
        saida = ""
    paginas = saida.split("\f")
    if paginas and not paginas[-1].strip():
        paginas.pop()
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(paginas, ensure_ascii=False))
    return paginas


def candidatos(texto: str, livros: list[dict]) -> list[dict]:
    """Obras do acervo que a linha cita: número da norma, ou sobrenome e ano."""
    numeros = set(NUM_NORMA.findall(texto))
    autores: list[tuple[str, str]] = []
    for grupo, ano in CIT_AUTOR.findall(texto):
        for nome in grupo.split(";"):
            autores.append((normalizar(nome.strip()), ano))
    if REFERENCIA.match(texto):
        primeiro = normalizar(re.split(r"[.,;]", texto, maxsplit=1)[0]).strip()
        anos = re.findall(r"\b(19\d{2}|20\d{2})\b", texto)
        autores.append((primeiro, anos[0] if anos else ""))
        if primeiro in AUTORES_GENERICOS:  # BRASIL. Lei nº 8.069 → só o número da própria norma
            proprio = re.search(r"nº\s*(\d{1,3}(?:\.\d{3})?)", texto)
            numeros = {proprio.group(1)} if proprio else set()
    def do_autor(nome: str, livro: dict) -> bool:
        return bool(re.search(rf"\b{re.escape(nome)}\b", livro["autor"]))

    saida = []
    for livro in livros:
        pontos = 0
        if numeros & livro["numeros"]:
            pontos += 3
        for nome, ano in autores:
            if nome in AUTORES_GENERICOS or len(nome) < 3 or not do_autor(nome, livro):
                continue
            if ano and ano == livro["ano"]:
                pontos += 3
            elif sum(do_autor(nome, l) for l in livros) == 1:  # obra única do autor, outra edição
                pontos += 2
        if pontos:
            saida.append({**livro, "pontos": pontos})
    saida.sort(key=lambda c: -c["pontos"])
    return saida[:4]


def trechos_busca(texto: str) -> list[str]:
    """Um trecho por marca: a frase que a antecede. Numa referência, título e ementa."""
    if REFERENCIA.match(texto):  # sem link, veículo e datas de acesso
        return [re.split(r"\*Di[áa]rio Oficial|Dispon[íi]vel em|Acesso em", URL.sub(" ", texto))[0]]
    trechos = []
    for m in marcas_do_texto(texto):
        frase = texto[m["frase"]:m["ini"]]
        trechos.append(frase if len(frase) > 40 else texto[max(0, m["ini"] - 300):m["ini"]])
    return trechos or [texto]


def localizar(busca: str, rel: str, referencia: bool = False, numeros_pdf: set | None = None) -> dict:
    """As 3 páginas do PDF com mais palavras do trecho e, se a frase cita artigo da
    norma deste PDF, com o cabeçalho do artigo ("Art. 73."), que pesa mais que a menção."""
    paginas = paginas_pdf(rel)
    if not paginas:
        return {"pagina": 1, "coincidencia": 0.0, "termos": [], "sem_texto": True, "achados": []}
    termos = palavras(limpar_md(busca))[:30]
    artigos = [(n, letra) for norma, n, letra in artigos_citados(busca)
               if norma is None or numeros_pdf is None or norma in numeros_pdf]
    padroes = []
    for n, letra in artigos:
        sufixo = rf"\s*-\s*{letra.lower()}\b" if letra else r"(?!\s*-\s*[a-z]\b)"
        alvo = rf"art\.?\s*{re.escape(n)}(?!\d|\.\d)\s*[o°]?\.?{sufixo}"
        padroes.append((re.compile(rf"(?m)^\s*{alvo}"), re.compile(rf"\b{alvo}")))
    limite = 3 if referencia else len(paginas)
    notas = []
    for i, pagina in enumerate(paginas[:limite]):
        norm = normalizar(pagina)
        nota = sum(1 for t in termos if t in norm) / len(termos) if termos else 0.0
        for cabecalho, mencao in padroes:
            if cabecalho.search(norm):
                nota += 1.0
            elif mencao.search(norm):
                nota += 0.3
        notas.append((nota, i))
    notas.sort(key=lambda x: (-x[0], x[1]))
    achados = [{"pagina": i + 1, "coincidencia": round(min(n, 1.0), 2)} for n, i in notas[:3] if n > 0]
    melhor = achados[0] if achados else {"pagina": 1, "coincidencia": 0.0}
    sem_texto = sum(len(p.strip()) for p in paginas) < 50 * len(paginas)
    return {**melhor, "achados": achados, "sem_texto": sem_texto,
            "termos": termos + [f"art. {n}" for n, _ in artigos]}


# ----------------------------------------------------------------- obras
def siglas_das_referencias(textos: list[str]) -> set[str]:
    """Siglas que as referências definem entre parênteses, ex.: (LOUOS), (CONCLA)."""
    return {s for t in textos if REFERENCIA.match(t) for s in SIGLA.findall(t.split("*")[0])}


def obra_citada(texto: str, siglas: set[str]) -> str:
    """Rótulo da obra que a linha cita, para agrupar os cartões sem PDF no acervo."""
    referencia = bool(REFERENCIA.match(texto))
    alvo = texto if referencia else " ".join(trechos_busca(texto))
    for s in sorted(siglas):
        if re.search(rf"\b{re.escape(s)}\b", alvo):
            return s
    if m := NORMA_NOMEADA.search(alvo):
        return m.group(1).replace("Codigo", "Código")
    if referencia:
        cabeca = texto.split("*")[0]
        primeiro = re.split(r"[.,;]", texto, maxsplit=1)[0].strip()
        anos = re.findall(r"\b(19\d{2}|20\d{2})\b", texto)
        ano = f" ({anos[0]})" if anos else ""
        if normalizar(primeiro) in AUTORES_GENERICOS:
            num = re.search(r"nº\s*(\d{1,3}(?:\.\d{3})?)", texto)
            return f"{primeiro}, nº {num.group(1)}" if num else primeiro + ano
        nomes = [n for n in re.findall(r"\b([A-ZÀ-Ü][A-ZÀ-Ü\-]{2,}),", cabeca)]
        return ("; ".join(nomes) if nomes else primeiro) + ano
    if m := CIT_AUTOR.search(alvo):
        return f"{m.group(1)} ({m.group(2)})"
    if num := NUM_NORMA.findall(alvo):
        return f"Lei nº {num[0]}"
    return "sem obra na linha"


def obras_faltando(fila: list[dict]) -> list[dict]:
    """Obras citadas sem PDF no acervo, da que destrava mais cartões para a que destrava menos."""
    grupos: dict[str, list[dict]] = {}
    for c in fila:
        if not c["fontes"]:
            grupos.setdefault(c["obra"], []).append(c)
    saida = [{"obra": k, "cartoes": len(cs), "ids": [c["id"] for c in cs],
              "onde": [f"{o['arquivo'].removesuffix('.md')}:{o['linha']}" for c in cs for o in c["ocorrencias"]]}
             for k, cs in grupos.items()]
    return sorted(saida, key=lambda g: (g["obra"] == "sem obra na linha", -g["cartoes"], g["obra"]))


# ----------------------------------------------------------------- links
def testar_links(urls: list[str], rede: bool = True) -> dict:
    arquivo = CACHE / "links.json"
    cache = json.loads(arquivo.read_text()) if arquivo.exists() else {}
    if not rede:
        return {u: cache[u]["estado"] if u in cache else "não testado" for u in urls}
    ontem = (datetime.now() - timedelta(days=1)).isoformat()
    pendentes = [u for u in urls  # falha não fica em cache: testa de novo a cada abertura
                 if u not in cache or cache[u]["quando"] < ontem or cache[u]["estado"][:1] not in "23"]

    def abrir(url: str, contexto=None) -> str:
        pedido = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (conferidor-av)"})
        try:
            with urllib.request.urlopen(pedido, timeout=20, context=contexto) as r:
                return str(r.status)
        except urllib.error.HTTPError as e:
            return str(e.code)

    def testar(url: str) -> tuple[str, dict]:
        try:
            estado = abrir(url)
        except urllib.error.URLError as e:
            if isinstance(e.reason, ssl.SSLCertVerificationError):
                # cadeia de certificados não reconhecida pelo Python desta máquina: o teste
                # só quer saber se a página responde, então repete sem verificar o certificado
                try:
                    estado = abrir(url, ssl._create_unverified_context())
                except Exception as e2:  # noqa: BLE001
                    estado = f"sem resposta ({type(e2).__name__})"
            else:
                estado = f"sem resposta ({type(e.reason).__name__})"
        except Exception as e:  # noqa: BLE001 — qualquer falha de rede vira o estado
            estado = f"sem resposta ({type(e).__name__})"
        return url, {"estado": estado, "quando": datetime.now().isoformat()}

    if pendentes:
        with ThreadPoolExecutor(8) as ex:
            cache.update(dict(ex.map(testar, pendentes)))
        CACHE.mkdir(exist_ok=True)
        arquivo.write_text(json.dumps(cache, ensure_ascii=False, indent=1))
    return {u: cache[u]["estado"] for u in urls}


# ----------------------------------------------------------------- fila
def capitulos() -> list[Path]:
    return sorted(CAP.glob("[0-9]*.md"), key=lambda p: int(p.name.split("_")[0]))


def ler_escolhas() -> dict[str, str]:
    return json.loads(ESCOLHAS.read_text()) if ESCOLHAS.exists() else {}


def gravar_escolha(cid: str, arquivo: str) -> None:
    dados = ler_escolhas()
    dados[cid] = arquivo
    CACHE.mkdir(exist_ok=True)
    ESCOLHAS.write_text(json.dumps(dados, ensure_ascii=False, indent=1))


def fonte_para(c: dict, arquivo: str, livros: list[dict], pontos: int = 0) -> dict:
    livro = next((l for l in livros if l["arquivo"] == arquivo), None)
    achado = localizar(c["busca"], arquivo, c["referencia"], livro["numeros"] if livro else None)
    return {"arquivo": arquivo, "pontos": pontos, **achado}


def escolher_fonte(c: dict, arquivo: str, livros: list[dict]) -> None:
    """Põe a obra escolhida pelo autor no topo das fontes do cartão."""
    atual = next((f for f in c["fontes"] if f["arquivo"] == arquivo), None)
    fonte = atual or fonte_para(c, arquivo, livros)
    c["fontes"] = [{**fonte, "escolhida": True}] + [f for f in c["fontes"] if f["arquivo"] != arquivo]
    c["nota"] = c["fontes"][0]["coincidencia"]


def ordenar(cartoes: list[dict]) -> list[dict]:
    """Agrupa por obra (a primeira fonte, ou a obra citada quando não há PDF): grupos do
    mais fácil para o mais difícil; dentro do grupo, a referência e depois as citações."""
    grupos: dict[str, list[dict]] = {}
    for c in cartoes:
        chave = c["fontes"][0]["arquivo"] if c["fontes"] else "~" + c["obra"]
        c["grupo"] = Path(c["fontes"][0]["arquivo"]).stem if c["fontes"] else c["obra"]
        grupos.setdefault(chave, []).append(c)
    ordem = sorted(grupos.values(), key=lambda cs: (-max(c["nota"] for c in cs),
                                                    cs[0]["grupo"] == "sem obra na linha",
                                                    -len(cs), cs[0]["grupo"]))
    saida = []
    for cs in ordem:
        saida += sorted(cs, key=lambda c: (not c["referencia"], -c["nota"], c["ocorrencias"][0]["arquivo"]))
    return saida


def montar_fila(rede: bool = True) -> list[dict]:
    cartoes: dict[str, dict] = {}
    for md in capitulos():
        for n, linha in enumerate(md.read_text(encoding="utf-8").splitlines(), 1):
            if not MARCA.search(linha):
                continue
            texto = linha.strip()
            cid = hashlib.sha1(texto.encode()).hexdigest()[:10]
            c = cartoes.setdefault(cid, {"id": cid, "texto": texto, "ocorrencias": [],
                                         "referencia": bool(REFERENCIA.match(texto)),
                                         "marcas": len(MARCA.findall(texto))})
            c["ocorrencias"].append({"arquivo": md.name, "linha": n})
    livros = acervo()
    siglas = siglas_das_referencias([c["texto"] for c in cartoes.values()])
    escolhas = ler_escolhas()
    urls = sorted({u.rstrip(".,;") for c in cartoes.values() for u in URL.findall(c["texto"])})
    estados = testar_links(urls, rede)
    for c in cartoes.values():
        c["sugerido"] = remover_marcas(c["texto"])
        c["posicoes"] = marcas_do_texto(c["texto"])
        c["pagina_citada"] = (m.group(1) if (m := PAGINA_CITADA.search(c["texto"])) else "")
        c["obra"] = obra_citada(c["texto"], siglas)
        c["links"] = [{"url": u, "estado": estados[u.rstrip(".,;")]}
                      for u in dict.fromkeys(x.rstrip(".,;") for x in URL.findall(c["texto"]))]
        # obras citadas na frase de cada marca, na ordem das marcas; sem nenhuma, as da linha toda
        trechos = trechos_busca(c["texto"])
        c["busca"] = trechos[0] if c["referencia"] else " ".join(trechos)
        pares = [(t, cand) for t in trechos
                 for cand in candidatos(c["texto"] if c["referencia"] else t, livros)]
        if not pares:
            pares = [(trechos[0], cand) for cand in candidatos(c["texto"], livros)]
        c["fontes"], vistos = [], set()
        for trecho, cand in pares:
            if cand["arquivo"] in vistos:
                continue
            vistos.add(cand["arquivo"])
            achado = localizar(trecho, cand["arquivo"], c["referencia"], cand["numeros"])
            c["fontes"].append({"arquivo": cand["arquivo"], "pontos": cand["pontos"], **achado})
        c["fontes"].sort(key=lambda f: (-f["pontos"], -f["coincidencia"]))
        c["nota"] = c["fontes"][0]["coincidencia"] if c["fontes"] else -1
        if (escolha := escolhas.get(c["id"])) and pdf_seguro(escolha):
            escolher_fonte(c, escolha, livros)
    return ordenar(list(cartoes.values()))


# ----------------------------------------------------------------- vereditos
CAMPOS = ["id", "veredito", "texto_original", "texto_novo", "nota", "fonte", "pagina",
          "pagina_impressa", "ocorrencias", "data", "aplicado"]


def ler_vereditos() -> dict[str, dict]:
    if not VEREDITOS.exists():
        return {}
    with VEREDITOS.open(encoding="utf-8", newline="") as f:
        return {r["id"]: r for r in csv.DictReader(f)}


def gravar_vereditos(dados: dict[str, dict]) -> None:
    temporario = VEREDITOS.with_suffix(".csv.tmp")
    with temporario.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        for r in dados.values():
            w.writerow({k: r.get(k, "") for k in CAMPOS})
    os.replace(temporario, VEREDITOS)


def validar_veredito(corpo: dict) -> str | None:
    """Motivo para recusar o veredito, ou None. "confere" troca a linha inteira no .md."""
    if corpo.get("veredito") not in VEREDITOS_VALIDOS:
        return "veredito desconhecido"
    if corpo["veredito"] == "confere":
        novo = (corpo.get("texto_novo") or "").strip()
        if not novo:
            return "texto revisado vazio: com \"confere\" ele substitui a linha inteira no .md"
        if MARCA.search(novo) and not corpo.get("manter_av"):
            return "o texto revisado ainda tem [AV]"
    return None


def relatorio(fila: list[dict]) -> list[dict]:
    """Cartões com "não confere" ou "sem acesso": a lista do que reescrever ou buscar."""
    atuais = {c["id"]: c for c in fila}
    saida = []
    for r in ler_vereditos().values():
        if r["veredito"] not in ("nao_confere", "sem_acesso"):
            continue
        c = atuais.get(r["id"])
        saida.append({"id": r["id"], "veredito": r["veredito"], "nota": r.get("nota", ""),
                      "onde": r.get("ocorrencias", ""), "obra": c["grupo"] if c else "",
                      "texto": r["texto_original"],
                      "atual": bool(c and c["texto"] == r["texto_original"])})
    return sorted(saida, key=lambda x: (x["veredito"], x["obra"], x["onde"]))


def versao_tmin() -> str:
    nums = [int(m.group(1)) for p in (ROOT / "textos").glob("TCC_luderia_v*.docx")
            if (m := re.search(r"_v(\d+)", p.name))]
    return f"v{max(nums)}" if nums else "?"


def aplicar() -> dict:
    from arquivar_md import arquivar  # noqa: E402 — vizinho em G4_textos

    dados = ler_vereditos()
    fila = [r for r in dados.values() if r["veredito"] == "confere" and r.get("aplicado") != "sim"]
    if not fila:
        return {"aplicados": 0, "falhas": [], "arquivos": []}
    carimbo = datetime.now().strftime("%Y-%m-%d_%H%M")
    textos = {md.name: md.read_text(encoding="utf-8") for md in capitulos()}
    alterados, falhas, conferidas = set(), [], []
    for r in fila:
        if not r.get("texto_novo", "").strip():  # trava: nunca apaga a linha
            falhas.append("texto revisado vazio: " + r["texto_original"][:70])
            continue
        achou = False
        for nome, conteudo in textos.items():
            linhas = conteudo.split("\n")
            for i, linha in enumerate(linhas):
                if linha.strip() == r["texto_original"]:
                    linhas[i] = linha[: len(linha) - len(linha.lstrip())] + r["texto_novo"]
                    achou = True
                    alterados.add(nome)
                    if not REFERENCIA.match(r["texto_original"]):
                        conferidas.append((nome, r))
            textos[nome] = "\n".join(linhas)
        if achou:
            r["aplicado"] = "sim"
        else:
            falhas.append(r["texto_original"][:90])
    for nome in sorted(alterados):
        arquivar(CAP / nome, carimbo)
        (CAP / nome).write_text(textos[nome], encoding="utf-8")
    if conferidas:
        registrar_conferidas(conferidas)
    gravar_vereditos(dados)
    return {"aplicados": sum(1 for r in fila if r.get("aplicado") == "sim"),
            "falhas": falhas, "arquivos": sorted(alterados)}


def registrar_conferidas(conferidas: list[tuple[str, dict]]) -> None:
    versao = versao_tmin()
    linhas_novas = []
    for nome, r in conferidas:
        cap = nome.split("_")[0]
        obra = Path(r["fonte"]).stem if r["fonte"] else "—"
        pagina = r.get("pagina_impressa") or (f"PDF p. {r['pagina']}" if r.get("pagina") else "—")
        trecho = limpar_md(r["texto_novo"]).strip()[:70].replace("|", "/")
        linhas_novas.append(f"| {versao} | {cap} | {obra} | {pagina} | {trecho}… |")
    texto = CONFERIDAS.read_text(encoding="utf-8").split("\n")
    sep = next(i for i, l in enumerate(texto) if l.startswith("|---"))
    texto[sep + 1:sep + 1] = linhas_novas
    CONFERIDAS.write_text("\n".join(texto), encoding="utf-8")


# ----------------------------------------------------------------- servidor
class Servidor(BaseHTTPRequestHandler):
    fila: list[dict] = []
    livros: list[dict] = []

    def log_message(self, *args):  # silencia o log de cada pedido
        pass

    def _enviar(self, corpo: bytes, tipo: str, codigo: int = 200):
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.end_headers()
        self.wfile.write(corpo)

    def _json(self, obj, codigo: int = 200):
        self._enviar(json.dumps(obj, ensure_ascii=False).encode(), "application/json; charset=utf-8", codigo)

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(url.query)
        if url.path == "/":
            self._enviar((AQUI / "conferidor.html").read_bytes(), "text/html; charset=utf-8")
        elif url.path == "/api/fila":
            self._json({"cartoes": self.fila, "vereditos": ler_vereditos(), "versao": versao_tmin(),
                        "acervo": [l["arquivo"] for l in self.livros]})
        elif url.path == "/api/faltam":
            self._json(obras_faltando(self.fila))
        elif url.path == "/api/relatorio":
            self._json(relatorio(self.fila))
        elif url.path == "/api/pagina":
            rel, p = q["f"][0], int(q["p"][0])
            if not pdf_seguro(rel):
                return self._json({"erro": "fora da bibliografia"}, 404)
            paginas = paginas_pdf(rel)
            self._json({"texto": paginas[p - 1] if 0 < p <= len(paginas) else "", "total": len(paginas)})
        elif url.path.startswith("/pdf/"):
            alvo = pdf_seguro(urllib.parse.unquote(url.path[5:]))
            if not alvo:
                return self._json({"erro": "fora da bibliografia"}, 404)
            self._enviar(alvo.read_bytes(), "application/pdf")
        else:
            self._json({"erro": "não encontrado"}, 404)

    def do_POST(self):
        origem = self.headers.get("Origin")
        if origem and urllib.parse.urlparse(origem).hostname not in ("127.0.0.1", "localhost"):
            return self._json({"erro": "origem recusada"}, 403)
        corpo = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        if self.path == "/api/veredito":
            dados = ler_vereditos()
            cartao = next((c for c in self.fila if c["id"] == corpo.get("id")), None)
            if not cartao:
                return self._json({"erro": "cartão desconhecido"}, 400)
            if erro := validar_veredito(corpo):
                return self._json({"erro": erro}, 400)
            dados[corpo["id"]] = {
                "id": corpo["id"], "veredito": corpo["veredito"],
                "texto_original": cartao["texto"], "texto_novo": corpo.get("texto_novo", "").strip(),
                "nota": corpo.get("nota", ""), "fonte": corpo.get("fonte", ""),
                "pagina": corpo.get("pagina", ""), "pagina_impressa": corpo.get("pagina_impressa", ""),
                "ocorrencias": "; ".join(f"{o['arquivo']}:{o['linha']}" for o in cartao["ocorrencias"]),
                "data": datetime.now().strftime("%Y-%m-%d %H:%M"), "aplicado": "",
            }
            gravar_vereditos(dados)
            self._json({"ok": True, "registro": dados[corpo["id"]]})
        elif self.path == "/api/fonte":
            cartao = next((c for c in self.fila if c["id"] == corpo.get("id")), None)
            arquivo = corpo.get("arquivo", "")
            if not cartao or not pdf_seguro(arquivo):
                return self._json({"erro": "cartão ou PDF desconhecido"}, 400)
            escolher_fonte(cartao, arquivo, self.livros)
            gravar_escolha(cartao["id"], arquivo)
            self._json({"fontes": cartao["fontes"], "nota": cartao["nota"]})
        elif self.path == "/api/aplicar":
            resultado = aplicar()
            Servidor.fila = montar_fila()
            self._json(resultado)
        else:
            self._json({"erro": "não encontrado"}, 404)


def imprimir_faltam() -> None:
    grupos = obras_faltando(montar_fila(rede=False))
    print(f"{sum(g['cartoes'] for g in grupos)} cartões sem PDF no acervo, em {len(grupos)} obras:\n")
    for g in grupos:
        print(f"- {g['obra']}: {g['cartoes']} cartão(ões) — {', '.join(g['onde'])}")


def imprimir_relatorio() -> None:
    itens = relatorio(montar_fila(rede=False))
    if not itens:
        print("Nenhum cartão com \"não confere\" ou \"sem acesso\".")
        return
    rotulo = {"nao_confere": "Não confere", "sem_acesso": "Sem acesso"}
    for veredito in ("nao_confere", "sem_acesso"):
        grupo = [x for x in itens if x["veredito"] == veredito]
        if grupo:
            print(f"## {rotulo[veredito]} ({len(grupo)})\n")
            for x in grupo:
                mudou = "" if x["atual"] else " (a linha mudou no .md)"
                print(f"- {x['onde']}{mudou} — {x['obra'] or 'sem obra'}: {x['nota'] or 'sem nota'}\n"
                      f"  > {x['texto'][:160]}")
            print()


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    comando = args[0] if args else ""
    if comando == "aplicar":
        print(json.dumps(aplicar(), ensure_ascii=False, indent=1))
        return
    if comando == "faltam":
        return imprimir_faltam()
    if comando == "relatorio":
        return imprimir_relatorio()
    abrir_navegador = "--sem-navegador" not in sys.argv
    endereco = f"http://127.0.0.1:{PORTA}"
    try:  # reserva a porta antes de montar a fila, para não esperar à toa
        servidor = ThreadingHTTPServer(("127.0.0.1", PORTA), Servidor)
    except OSError:
        print(f"A porta {PORTA} já está em uso: o conferidor provavelmente já está aberto em {endereco}.\n"
              f"Para reiniciar, encerre o outro (Ctrl+C no terminal dele, ou: kill $(lsof -ti tcp:{PORTA})).")
        if abrir_navegador:
            webbrowser.open(endereco)
        sys.exit(1)
    print("Montando a fila (PDFs e links)…", flush=True)
    Servidor.livros = acervo()
    Servidor.fila = montar_fila()
    com_fonte = sum(1 for c in Servidor.fila if c["fontes"])
    print(f"{len(Servidor.fila)} cartões, {com_fonte} com PDF no acervo.")
    print(f"Fila em {endereco}  (Ctrl+C encerra)", flush=True)
    if abrir_navegador:
        webbrowser.open(endereco)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nConferidor encerrado.")


if __name__ == "__main__":
    main()
