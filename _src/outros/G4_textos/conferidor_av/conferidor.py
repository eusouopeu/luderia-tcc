"""Conferidor de citações e referências marcadas [AV] nos capítulos do TMin.

Transforma a conferência numa fila de cartões, um por linha com [AV] (a mesma
referência repetida em vários capítulos vira um cartão só). Para cada cartão,
a pré-triagem acha o PDF da obra em bibliografia/ (autor e ano, ou número da
lei), localiza a página com mais palavras da frase citada (e o artigo, quando a
frase cita um) e testa os links da referência. A fila sai do cartão mais fácil
(trecho achado com coincidência alta) para o mais difícil; sem PDF, vai para o
fim. O app só aponta o trecho: quem confere é o autor.

Uso:
    python3 _src/outros/G4_textos/conferidor_av/conferidor.py            # abre a fila em http://127.0.0.1:8765
    python3 _src/outros/G4_textos/conferidor_av/conferidor.py aplicar    # grava os vereditos nos .md

Vereditos ficam em bibliografia/conferencia_av.csv. "aplicar" troca, nos .md,
a linha original pelo texto revisado dos cartões "confere" (arquivando antes a
versão anterior com arquivar_md.py), registra as citações do texto (não as
linhas de referência) em bibliografia/citacoes_conferidas.md e marca o
veredito como aplicado. "não confere" e "sem acesso" só ficam registrados.
"""
from __future__ import annotations

import csv
import hashlib
import json
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
ARTIGO = re.compile(r"\bart(?:s)?\.\s*(\d+)(?:[º°o])?(?:-([A-Z]))?", re.I)
AUTORES_GENERICOS = {"brasil", "bahia", "salvador", "instituto", "comissao", "conselho", "ministerio"}
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
    trechos, inicio = [], 0
    for m in MARCA.finditer(texto):
        antes = texto[inicio:m.start()]
        frase = re.split(r"(?<=[.;])\s+(?=[A-ZÀ-Ü])|\|", antes)[-1]
        trechos.append(frase if len(frase) > 40 else texto[max(0, m.start() - 300):m.start()])
        inicio = m.end()
    return trechos or [texto]


def localizar(busca: str, rel: str, referencia: bool = False) -> dict:
    """Página do PDF com mais palavras do trecho (e o artigo citado, se houver)."""
    paginas = paginas_pdf(rel)
    if not paginas:
        return {"pagina": 1, "coincidencia": 0.0, "termos": [], "sem_texto": True}
    termos = palavras(limpar_md(busca))[:30]
    artigos = [(n, l) for n, l in ARTIGO.findall(busca)]
    limite = 3 if referencia else len(paginas)
    melhor = (0.0, 0)
    for i, pagina in enumerate(paginas[:limite]):
        norm = normalizar(pagina)
        achadas = sum(1 for t in termos if t in norm)
        nota = achadas / len(termos) if termos else 0.0
        for n, letra in artigos:
            sufixo = rf"\s*-\s*{letra.lower()}" if letra else ""
            if re.search(rf"\bart\.?\s*{n}\s*[º°o]?{sufixo}\b", norm):
                nota += 0.5
        if nota > melhor[0]:
            melhor = (nota, i)
    sem_texto = sum(len(p.strip()) for p in paginas) < 50 * len(paginas)
    return {"pagina": melhor[1] + 1, "coincidencia": round(min(melhor[0], 1.0), 2),
            "termos": termos + [f"art. {n}" for n, _ in artigos], "sem_texto": sem_texto}


# ----------------------------------------------------------------- links
def testar_links(urls: list[str]) -> dict:
    arquivo = CACHE / "links.json"
    cache = json.loads(arquivo.read_text()) if arquivo.exists() else {}
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


def montar_fila() -> list[dict]:
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
    urls = sorted({u.rstrip(".,;") for c in cartoes.values() for u in URL.findall(c["texto"])})
    estados = testar_links(urls)
    for c in cartoes.values():
        c["sugerido"] = remover_marcas(c["texto"])
        c["links"] = [{"url": u, "estado": estados[u.rstrip(".,;")]}
                      for u in dict.fromkeys(x.rstrip(".,;") for x in URL.findall(c["texto"]))]
        # obras citadas na frase de cada marca, na ordem das marcas; sem nenhuma, as da linha toda
        trechos = trechos_busca(c["texto"])
        pares = [(t, cand) for t in trechos
                 for cand in candidatos(c["texto"] if c["referencia"] else t, livros)]
        if not pares:
            pares = [(trechos[0], cand) for cand in candidatos(c["texto"], livros)]
        c["fontes"], vistos = [], set()
        for trecho, cand in pares:
            if cand["arquivo"] in vistos:
                continue
            vistos.add(cand["arquivo"])
            achado = localizar(trecho, cand["arquivo"], c["referencia"])
            c["fontes"].append({"arquivo": cand["arquivo"], "pontos": cand["pontos"], **achado})
        c["nota"] = c["fontes"][0]["coincidencia"] if c["fontes"] else -1
    return sorted(cartoes.values(), key=lambda c: (-c["nota"], c["ocorrencias"][0]["arquivo"]))


# ----------------------------------------------------------------- vereditos
CAMPOS = ["id", "veredito", "texto_original", "texto_novo", "nota", "fonte", "pagina",
          "ocorrencias", "data", "aplicado"]


def ler_vereditos() -> dict[str, dict]:
    if not VEREDITOS.exists():
        return {}
    with VEREDITOS.open(encoding="utf-8", newline="") as f:
        return {r["id"]: r for r in csv.DictReader(f)}


def gravar_vereditos(dados: dict[str, dict]) -> None:
    with VEREDITOS.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        for r in dados.values():
            w.writerow({k: r.get(k, "") for k in CAMPOS})


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
        trecho = limpar_md(r["texto_novo"]).strip()[:70].replace("|", "/")
        linhas_novas.append(f"| {versao} | {cap} | {obra} | {r['pagina'] or '—'} | {trecho}… |")
    texto = CONFERIDAS.read_text(encoding="utf-8").split("\n")
    sep = next(i for i, l in enumerate(texto) if l.startswith("|---"))
    texto[sep + 1:sep + 1] = linhas_novas
    CONFERIDAS.write_text("\n".join(texto), encoding="utf-8")


# ----------------------------------------------------------------- servidor
class Servidor(BaseHTTPRequestHandler):
    fila: list[dict] = []

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
            self._json({"cartoes": self.fila, "vereditos": ler_vereditos(), "versao": versao_tmin()})
        elif url.path == "/api/pagina":
            rel, p = q["f"][0], int(q["p"][0])
            paginas = paginas_pdf(rel)
            self._json({"texto": paginas[p - 1] if 0 < p <= len(paginas) else "", "total": len(paginas)})
        elif url.path.startswith("/pdf/"):
            alvo = (BIB / urllib.parse.unquote(url.path[5:])).resolve()
            if BIB.resolve() not in alvo.parents or not alvo.is_file():
                return self._json({"erro": "fora da bibliografia"}, 404)
            self._enviar(alvo.read_bytes(), "application/pdf")
        else:
            self._json({"erro": "não encontrado"}, 404)

    def do_POST(self):
        corpo = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
        if self.path == "/api/veredito":
            dados = ler_vereditos()
            cartao = next((c for c in self.fila if c["id"] == corpo["id"]), None)
            if not cartao:
                return self._json({"erro": "cartão desconhecido"}, 400)
            dados[corpo["id"]] = {
                "id": corpo["id"], "veredito": corpo["veredito"],
                "texto_original": cartao["texto"], "texto_novo": corpo.get("texto_novo", ""),
                "nota": corpo.get("nota", ""), "fonte": corpo.get("fonte", ""),
                "pagina": corpo.get("pagina", ""),
                "ocorrencias": "; ".join(f"{o['arquivo']}:{o['linha']}" for o in cartao["ocorrencias"]),
                "data": datetime.now().strftime("%Y-%m-%d %H:%M"), "aplicado": "",
            }
            gravar_vereditos(dados)
            self._json({"ok": True})
        elif self.path == "/api/aplicar":
            resultado = aplicar()
            Servidor.fila = montar_fila()
            self._json(resultado)
        else:
            self._json({"erro": "não encontrado"}, 404)


def main() -> None:
    if len(sys.argv) > 1 and sys.argv[1] == "aplicar":
        print(json.dumps(aplicar(), ensure_ascii=False, indent=1))
        return
    endereco = f"http://127.0.0.1:{PORTA}"
    try:  # reserva a porta antes de montar a fila, para não esperar à toa
        servidor = ThreadingHTTPServer(("127.0.0.1", PORTA), Servidor)
    except OSError:
        print(f"A porta {PORTA} já está em uso: o conferidor provavelmente já está aberto em {endereco}.\n"
              f"Para reiniciar, encerre o outro (Ctrl+C no terminal dele, ou: kill $(lsof -ti tcp:{PORTA})).")
        webbrowser.open(endereco)
        sys.exit(1)
    print("Montando a fila (PDFs e links)…", flush=True)
    Servidor.fila = montar_fila()
    com_fonte = sum(1 for c in Servidor.fila if c["fontes"])
    print(f"{len(Servidor.fila)} cartões, {com_fonte} com PDF no acervo.")
    print(f"Fila em {endereco}  (Ctrl+C encerra)", flush=True)
    webbrowser.open(endereco)
    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\nConferidor encerrado.")


if __name__ == "__main__":
    main()
