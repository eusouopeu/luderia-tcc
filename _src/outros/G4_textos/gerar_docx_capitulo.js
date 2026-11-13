// Gera o .docx de um capítulo a partir do .md (textos/capitulos/).
//
// Mesmo formato ABNT de gerar_docx_projeto.js (A4, margens 3/2 cm, Arial 12,
// espaçamento 1,5, recuo de 1,00 cm). Diferenças: legenda acima de Quadro,
// Tabela e Figura; tabela com número (alguma célula numérica fora da 1ª coluna)
// só com bordas horizontais no cabeçalho e no fim, números à direita (skill
// formatacao-tabelas-xlsx, seções 4 e 5); quadro (legenda "Quadro") sempre com
// grade completa, preta e de mesma espessura (ABNT), mesmo com números;
// imagem em linha própria no formato ![texto](caminho relativo ao .md);
// linhas de citação (>) e comentários HTML de rascunho são omitidos.
// Larguras de coluna pelo conteúdo e <br> na célula para linhas separadas. Regras suplementares de _docs/_instrucoes/1d_formatacao.md: título 1 à
// esquerda; título 2 em caixa alta sem negrito; nenhum espaço antes ou depois dos títulos (04/11/2026);
// espaços entre blocos feitos com linhas em branco de espaçamento simples, e não com o espaçamento do
// parágrafo (13/11/2026): 6 pt depois do parágrafo do corpo, 12 pt antes da legenda, depois da fonte
// (ou da nota) e entre as referências; referências à esquerda, em espaço simples, sob o título
// REFERÊNCIAS centralizado e em negrito (manual da UFBA), reunidas no fim no trabalho inteiro; células
// centradas na vertical; coluna de quadro só com palavras únicas centrada; legenda e fonte centralizadas;
// nota justificada, em Arial 10.
//
// Versões (_docs/_instrucoes/1c_versoes.md): o TMin é o padrão, com os .md e os
// .docx dos capítulos em textos/capitulos/ e o trabalho inteiro em textos/; o TMax fica em
// textos/capitulos/TMax/ (.md em TMax/_md/, só dos capítulos que diferem). A saída
// leva o texto só quando o capítulo difere entre as versões (<nome>_<TMin|TMax>_v<n>;
// senão, <nome>_v<n>), com n = maior versão já existente + 1; a anterior vai para
// a pasta _arquivo/ ao lado.
//
// Uso: node "_src/outros/G4_textos/gerar_docx_capitulo.js" textos/capitulos/6_plano_de_marketing.md
// Trabalho inteiro (cada capítulo começa em página nova), com PDF:
//   node "_src/outros/G4_textos/gerar_docx_capitulo.js" --trabalho TMin --pdf
//   node "_src/outros/G4_textos/gerar_docx_capitulo.js" --trabalho TMax --pdf
// --vermelho "COHEN|WILSON": frases do corpo que citam esses autores saem em vermelho
// (revisão das referências; regex sem diferenciar maiúsculas).
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ImageRun,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, ShadingType, PageNumber, Header, VerticalAlign,
} = require("docx");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const CAP = path.join(ROOT, "textos", "capitulos");
const MD_TMIN = CAP, MD_TMAX = path.join(CAP, "TMax", "_md");
const ARGS = process.argv.slice(2);
const opcao = (nome) => { const i = ARGS.indexOf(nome); return i < 0 ? null : ARGS[i + 1]; };
const PDF = ARGS.includes("--pdf");
const TRABALHO = opcao("--trabalho");
const VERMELHO = opcao("--vermelho") ? new RegExp(opcao("--vermelho"), "i") : null;
const numero = (f) => Number(path.basename(f).match(/^\d+/)?.[0] ?? 99);

let MDS, TEXTO, BASE;
if (TRABALHO) {
  // TMin: todos os .md de textos/capitulos/; TMax: os mesmos, trocados pelos de TMax/_md/ quando houver.
  MDS = fs.readdirSync(MD_TMIN).filter((f) => /^\d+_.*\.md$/.test(f)).sort((a, b) => numero(a) - numero(b))
    .map((f) => (TRABALHO === "TMax" && fs.existsSync(path.join(MD_TMAX, f)) ? path.join(MD_TMAX, f) : path.join(MD_TMIN, f)));
  TEXTO = TRABALHO === "TMin" ? "" : TRABALHO; // desde 13/11/2026 o TMin sai sem a sigla: TCC_luderia_v<n>
  BASE = path.join(TRABALHO === "TMax" ? path.join(CAP, "TMax") : path.dirname(CAP), "TCC_luderia");
} else {
  MDS = ARGS.filter((a, i) => a.endsWith(".md") && !["--saida", "--texto"].includes(ARGS[i - 1]))
    .map((a) => path.resolve(ROOT, a));
  if (!MDS.length || !MDS.every((m) => fs.existsSync(m))) { console.error("Informe o .md do capítulo ou --trabalho TMin|TMax."); process.exit(1); }
  const md = MDS[0], dir = path.dirname(md), nome = path.basename(md, ".md");
  const tmax = dir === MD_TMAX, tmin = dir === MD_TMIN;
  TEXTO = opcao("--texto") ?? (tmax ? "TMax" : "");
  BASE = opcao("--saida") ? path.resolve(ROOT, opcao("--saida"))
    : path.join(path.basename(dir) === "_md" ? path.dirname(dir) : dir, nome);
}

// Próxima versão de <BASE>[_<TEXTO>]: procura na pasta e em _arquivo/ e arquiva as atuais.
function versionar(base, texto) {
  const dir = path.dirname(base), arq = path.join(dir, "_arquivo");
  const sufixo = texto ? `_${texto}` : "";
  // sem sufixo, os nomes antigos com _TMin contam na numeração (TCC_luderia_TMin_v32 → TCC_luderia_v33)
  const re = new RegExp(`^${path.basename(base).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}${sufixo || "(?:_TMin)?"}_v(\\d+)\\.(docx|pdf)$`);
  const achados = [dir, arq].filter(fs.existsSync).flatMap((d) => fs.readdirSync(d).map((f) => [d, f, f.match(re)]))
    .filter(([, , m]) => m);
  const n = Math.max(0, ...achados.map(([, , m]) => Number(m[1]))) + 1;
  fs.mkdirSync(arq, { recursive: true });
  for (const [d, f] of achados) if (d === dir) fs.renameSync(path.join(d, f), path.join(arq, f));
  return `${base}${sufixo}_v${n}`;
}
const OUT = versionar(BASE, TEXTO) + ".docx";

const FONTE = "Arial";
const TAM = 24;        // 12 pt
const TAM_QUADRO = 20; // 10 pt
const CM = 567;        // DXA por centímetro
const LARGURA = 11906 - 3 * CM - 2 * CM; // A4 menos margens esquerda e direita
const ENTRELINHA = 360; // 1,5
const SIMPLES = 240;

// Linha em branco de espaçamento simples, com a altura dada pelo corpo da fonte (pt): é o que separa
// os blocos, no lugar do espaçamento antes e depois do parágrafo (_docs/_instrucoes/1d_formatacao.md).
function branco(pt = 12, keepNext = false) {
  return new Paragraph({ keepNext, spacing: { line: SIMPLES, before: 0, after: 0 }, indent: { firstLine: 0 },
    run: { size: pt * 2 }, children: [new TextRun({ text: "", font: FONTE, size: pt * 2 })] });
}

// Divide o texto em trechos com **negrito**, *itálico* e `código`.
function runs(texto, base = {}) {
  const partes = texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return partes.map((p) => {
    let t = p, bold = base.bold, italics = base.italics;
    if (p.startsWith("**") && p.endsWith("**")) { t = p.slice(2, -2); bold = true; }
    else if (p.startsWith("*") && p.endsWith("*") && p.length > 2) { t = p.slice(1, -1); italics = true; }
    else if (p.startsWith("`") && p.endsWith("`")) { t = p.slice(1, -1); }
    return new TextRun({ text: t, bold, italics, color: base.color, font: FONTE, size: base.size || TAM });
  });
}

// Com --vermelho, as frases que citam os autores indicados saem em vermelho.
function runsCorpo(texto) {
  if (!VERMELHO || !VERMELHO.test(texto)) return runs(texto);
  // Frase termina em . ! ? fora de parênteses, para "p. 13" e "et al." não cortarem a citação.
  const frases = [];
  let ini = 0, nivel = 0;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (c === "(") nivel++;
    else if (c === ")") nivel = Math.max(0, nivel - 1);
    else if (".!?".includes(c) && !nivel && texto[i + 1] === " ") { frases.push(texto.slice(ini, i + 1)); ini = i + 1; }
  }
  frases.push(texto.slice(ini));
  return frases.filter(Boolean).flatMap((f) => runs(f, VERMELHO.test(f) ? { color: "FF0000" } : {}));
}

function corpo(texto) {
  return new Paragraph({
    children: runsCorpo(texto),
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: Math.round(1.0 * CM) },
    spacing: { line: ENTRELINHA, before: 0, after: 0 },
  });
}

// Legenda (título acima) ou fonte (abaixo): Arial 10, centralizada, espaço simples.
function legenda(texto, fonte = false) {
  return new Paragraph({
    children: runs(texto, { size: TAM_QUADRO }),
    alignment: AlignmentType.CENTER,
    keepNext: !fonte,
    spacing: { line: SIMPLES, before: 0, after: 0 },
  });
}

// Nota abaixo da fonte: Arial 10, justificada, espaço simples.
function nota(texto) {
  return new Paragraph({ children: runs(texto, { size: TAM_QUADRO }), alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 0 }, spacing: { line: SIMPLES, before: 0, after: 0 } });
}

const NUM = /^[-−]?(R\$ ?)?[\d.]+(,\d+)?%?$/;

// Larguras das colunas pelo conteúdo: cada coluna recebe, no mínimo, o espaço da maior
// palavra; o que sobra vai para as colunas de mais texto, na proporção do que falta
// para caberem em uma linha. Colunas de pouco texto ficam estreitas, e as de muito
// texto ganham largura e ocupam menos linhas.
const CHAR = 105, CHAR_NEGRITO = 115, MARGEM = 170; // DXA por caractere (Arial 10) e margens da célula
function largurasAuto(linhas) {
  const n = linhas[0].length;
  const minimo = [], preferido = [];
  for (let j = 0; j < n; j++) {
    let maior = 0, palavra = 0;
    linhas.forEach((l, i) => {
      const cw = i === 0 ? CHAR_NEGRITO : CHAR;
      String(l[j] || "").replace(/[*`]/g, "").split("<br>").forEach((trecho) => {
        maior = Math.max(maior, trecho.length * cw);
        trecho.split(/\s+/).forEach((w) => { palavra = Math.max(palavra, w.length * cw); });
      });
    });
    minimo.push(palavra + MARGEM);
    preferido.push(Math.max(maior, palavra) + MARGEM);
  }
  const somaMin = minimo.reduce((a, b) => a + b, 0), somaPref = preferido.reduce((a, b) => a + b, 0);
  let larg;
  if (somaMin >= LARGURA) larg = minimo.map((m) => (m / somaMin) * LARGURA);
  else if (somaPref <= LARGURA) larg = preferido.map((p) => (p / somaPref) * LARGURA);
  else {
    const falta = preferido.map((p, j) => p - minimo[j]), somaFalta = falta.reduce((a, b) => a + b, 0);
    larg = minimo.map((m, j) => m + ((LARGURA - somaMin) * falta[j]) / somaFalta);
  }
  const inteiras = larg.map(Math.floor);
  inteiras[n - 1] += LARGURA - inteiras.reduce((a, b) => a + b, 0);
  return inteiras;
}

function quadro(linhas, tipo) {
  const cab = linhas[0];
  const numerica = linhas.slice(1).some((l) => l.slice(1).some((c) => NUM.test(c)));
  // Quadro: coluna em que toda célula tem uma só palavra fica centrada.
  const palavra = (c) => /^\S+$/.test(c.replace(/\*/g, ""));
  const centrada = cab.map((_, j) => !numerica && linhas.slice(1).every((l) => !l[j] || palavra(l[j]))
    && linhas.slice(1).some((l) => l[j]));
  const alinha = (celula, i, j) => {
    if (i === 0 || centrada[j]) return AlignmentType.CENTER;
    return numerica && NUM.test(celula) ? AlignmentType.RIGHT : AlignmentType.LEFT;
  };
  const larguras = largurasAuto(linhas);
  const borda = { style: BorderStyle.SINGLE, size: 6, color: "000000" }; // 0,75 pt
  const nada = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const grade = { top: borda, bottom: borda, left: borda, right: borda };
  // Quadro: grade completa sempre; tabela numérica: só bordas horizontais.
  const bordas = (i) => (!numerica || tipo === "Quadro") ? grade : {
    top: i === 0 ? borda : nada, left: nada, right: nada,
    bottom: (i === 0 || i === linhas.length - 1) ? borda : nada,
  };
  return new Table({
    width: { size: LARGURA, type: WidthType.DXA },
    columnWidths: larguras,
    rows: linhas.map((linha, i) => new TableRow({
      tableHeader: i === 0,
      cantSplit: true,
      children: linha.map((celula, j) => new TableCell({
        width: { size: larguras[j], type: WidthType.DXA },
        borders: bordas(i),
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        verticalAlign: VerticalAlign.CENTER,
        shading: { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
        children: celula.split("<br>").map((trecho) => new Paragraph({
          children: runs(trecho.trim(), { bold: i === 0, size: TAM_QUADRO }),
          alignment: alinha(celula, i, j),
          spacing: { line: SIMPLES, after: 0 },
        })),
      })),
    })),
  });
}

// Título 1 (capítulo): caixa alta, negrito, à esquerda, sem recuo. Título sem número (REFERÊNCIAS):
// igual, mas centralizado (manual da UFBA).
function titulo1(texto, quebra, centro = false) {
  return new Paragraph({ heading: HeadingLevel.TITLE, alignment: centro ? AlignmentType.CENTER : AlignmentType.LEFT, indent: { firstLine: 0 },
    pageBreakBefore: quebra, keepNext: true, children: runs(texto.toUpperCase(), { bold: true }),
    spacing: { line: ENTRELINHA, before: 0, after: 0 } });
}

// Referências: só à margem esquerda, espaço simples, sem recuo, e uma linha em branco de 12 pt
// entre uma e outra (NBR 6023 e manual da UFBA; _docs/_instrucoes/1d_formatacao.md).
function referencia(texto) {
  return [new Paragraph({ children: runs(texto), alignment: AlignmentType.LEFT,
    indent: { firstLine: 0 }, spacing: { line: SIMPLES, before: 0, after: 0 } }), branco(12)];
}

// No trabalho inteiro, as listas de cada capítulo viram uma só, no fim, em ordem alfabética e sem repetição.
const REFS = new Set();

let instancia = 0; // contínua entre capítulos, para cada lista numerada recomeçar em 1
function converte(md, MD, blocos = []) {
  const linhas = md.split("\n");
  let referencias = false;
  let anteriorNumerada = false;
  let tipoLegenda = null;
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (l.trim().startsWith("<!--")) { while (i < linhas.length && !linhas[i].includes("-->")) i++; continue; }
    if (!l.trim() || /^-{3,}$/.test(l.trim()) || l.startsWith(">")) continue;
    const numerada = /^\d+\. /.test(l);
    if (numerada && !anteriorNumerada) instancia++;
    anteriorNumerada = numerada;

    if (l.startsWith("# ")) {
      blocos.push(titulo1(l.slice(2), blocos.length > 0));
    } else if (l.startsWith("## ")) {
      blocos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true,
        children: runs(l.slice(3).toUpperCase(), { bold: false }), spacing: { line: ENTRELINHA, before: 0, after: 0 } }));
    } else if (l.startsWith("### ")) {
      blocos.push(new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true,
        children: runs(l.slice(4), { bold: true }), spacing: { line: ENTRELINHA, before: 0, after: 0 } }));
    } else if (/^\*\*Refer[êe]ncias[^*]*\*\*/.test(l.trim())) {
      // "Referências citadas neste capítulo": como o título 1, sem número (só no capítulo avulso).
      referencias = true;
      if (!TRABALHO) blocos.push(titulo1(l.trim().replace(/\*\*/g, "").toUpperCase(), true, true));
    } else if (/^\*\*(Quadro|Tabela|Figura) [\d.]+/.test(l)) {
      tipoLegenda = l.match(/^\*\*(Quadro|Tabela|Figura)/)[1];
      blocos.push(branco(12, true), legenda(l));
    } else if (/^!\[[^\]]*\]\([^)]+\)/.test(l.trim())) {
      const arq = path.resolve(path.dirname(MD), l.trim().match(/\(([^)]+)\)/)[1]);
      const buf = fs.readFileSync(arq);
      const larg = buf.readUInt32BE(16), alt = buf.readUInt32BE(20); // cabeçalho PNG
      const w = Math.round((LARGURA / 1440) * 96);
      blocos.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { after: 0 },
        children: [new ImageRun({ type: "png", data: buf, transformation: { width: w, height: Math.round(w * alt / larg) } })] }));
    } else if (l.startsWith("Fonte:")) {
      blocos.push(legenda(l, true));
      // nota logo abaixo da fonte; depois, a linha em branco que fecha a tabela, o quadro ou a figura
      let j = i + 1;
      while (j < linhas.length && !linhas[j].trim()) j++;
      if (j < linhas.length && linhas[j].startsWith("Nota:")) { blocos.push(nota(linhas[j])); i = j; }
      blocos.push(branco(12));
    } else if (l.startsWith("|")) {
      const tab = [];
      while (i < linhas.length && linhas[i].startsWith("|")) {
        const cels = linhas[i].slice(1, -1).split("|").map((c) => c.trim());
        if (!cels.every((c) => /^-+$/.test(c))) tab.push(cels);
        i++;
      }
      i--;
      blocos.push(quadro(tab, tipoLegenda));
      tipoLegenda = null;
    } else if (/^\s*- /.test(l)) {
      blocos.push(new Paragraph({ children: runsCorpo(l.replace(/^\s*- /, "")),
        alignment: AlignmentType.JUSTIFIED,
        numbering: { reference: "topicos", level: 0 }, spacing: { line: ENTRELINHA, after: 0 } }));
    } else if (numerada) {
      blocos.push(new Paragraph({ children: runsCorpo(l.replace(/^\d+\. /, "")),
        alignment: AlignmentType.JUSTIFIED,
        numbering: { reference: "numerada", level: 0, instance: instancia }, spacing: { line: ENTRELINHA, after: 0 } }));
    } else if (referencias) {
      if (TRABALHO) REFS.add(l.trim()); else blocos.push(...referencia(l));
    } else {
      blocos.push(corpo(l), branco(6));
    }
  }
  return blocos;
}

function trabalho() {
  const blocos = MDS.reduce((b, md) => converte(fs.readFileSync(md, "utf-8"), md, b), []);
  if (!TRABALHO || !REFS.size) return blocos;
  const chave = (r) => r.replace(/[*`]/g, "").normalize("NFD").replace(/[̀-ͯ]/g, "");
  // Comparação por caractere: o "." do autor sozinho vem antes do ";" da coautoria.
  const ordem = [...REFS].sort((a, b) => (chave(a).toUpperCase() < chave(b).toUpperCase() ? -1 : 1));
  return [...blocos, titulo1("REFERÊNCIAS", true, true), ...ordem.flatMap(referencia)];
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONTE, size: TAM } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", run: { font: FONTE, size: TAM, bold: true, color: "000000" } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONTE, size: TAM, bold: false, color: "000000" }, paragraph: { outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONTE, size: TAM, bold: true, color: "000000" }, paragraph: { outlineLevel: 1 } },
    ],
  },
  numbering: {
    config: [
      { reference: "topicos", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 709, hanging: 284 } } } },
      ] },
      { reference: "numerada", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 709, hanging: 360 } } } },
      ] },
    ],
  },
  sections: [{
    properties: { page: {
      size: { width: 11906, height: 16838 },
      margin: { top: 3 * CM, left: 3 * CM, bottom: 2 * CM, right: 2 * CM },
    } },
    // número da página no canto superior direito (NBR 14724 e manual da UFBA)
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: FONTE, size: TAM_QUADRO })] })] }) },
    children: trabalho(),
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log(`OK: ${path.relative(ROOT, OUT)}`);
  if (PDF) {
    const soffice = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
    require("child_process").execFileSync(soffice, ["--headless", "--convert-to", "pdf", "--outdir", path.dirname(OUT), OUT],
      { stdio: "ignore" });
    console.log(`OK: ${path.relative(ROOT, OUT.replace(/\.docx$/, ".pdf"))}`);
  }
});
