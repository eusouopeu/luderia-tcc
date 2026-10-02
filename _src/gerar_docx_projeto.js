// Gera textos/projeto_pesquisa_luderia.docx a partir de textos/projeto_pesquisa_luderia.md.
//
// Formato acadêmico (ABNT): A4 retrato, margens de 3 cm (superior e esquerda) e
// 2 cm (inferior e direita), Arial 12, espaçamento 1,5, texto justificado com
// recuo de 1,25 cm. Quadros em Arial 10, espaçamento simples, grade completa
// preta de 0,75 pt, fundo branco, cabeçalho em negrito e centralizado (padrão
// da skill formatacao-tabelas-xlsx, seções 4 e 5). Referências alinhadas à
// esquerda, em espaçamento simples.
//
// Converte títulos (#, ##, ###), parágrafos, listas, tabelas, **negrito**,
// *itálico* e `código` (como texto simples).
//
// Uso: node "_src/gerar_docx_projeto.js"
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, ShadingType, PageNumber, Footer,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const MD = path.join(ROOT, "textos", "projeto_pesquisa_luderia.md");
const OUT = path.join(ROOT, "textos", "projeto_pesquisa_luderia.docx");

const FONTE = "Arial";
const TAM = 24;        // 12 pt
const TAM_QUADRO = 20; // 10 pt
const CM = 567;        // DXA por centímetro
const LARGURA = 11906 - 3 * CM - 2 * CM; // A4 menos margens esquerda e direita
const ENTRELINHA = 360; // 1,5
const SIMPLES = 240;

// Larguras relativas por cabeçalho de quadro.
const PESOS = {
  "Termo": 18, "Definição adotada": 52, "Fonte": 30,
  "Bloco": 23, "Instrumento": 22, "Procedimento": 36, "Situação": 20,
  "Código": 8, "Item": 22, "Variável ou categoria": 18, "Fundamentação": 20, "Mensuração ou codificação": 32,
  "Objetivo específico": 26, "Dimensão": 18, "Variáveis ou categorias": 36, "Itens": 20,
  "Técnicas": 74,
};

// Divide o texto em trechos com **negrito**, *itálico* e `código`.
function runs(texto, base = {}) {
  const partes = texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return partes.map((p) => {
    let t = p, bold = base.bold, italics = base.italics;
    if (p.startsWith("**") && p.endsWith("**")) { t = p.slice(2, -2); bold = true; }
    else if (p.startsWith("*") && p.endsWith("*") && p.length > 2) { t = p.slice(1, -1); italics = true; }
    else if (p.startsWith("`") && p.endsWith("`")) { t = p.slice(1, -1); }
    return new TextRun({ text: t, bold, italics, font: FONTE, size: base.size || TAM });
  });
}

function corpo(texto) {
  return new Paragraph({
    children: runs(texto),
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: Math.round(1.25 * CM) },
    spacing: { line: ENTRELINHA, after: 0 },
  });
}

function legenda(texto, depois = 0) {
  return new Paragraph({
    children: runs(texto, { size: TAM_QUADRO }),
    alignment: AlignmentType.LEFT,
    keepNext: depois === 0,
    spacing: { line: SIMPLES, before: depois ? 0 : 240, after: depois },
  });
}

function quadro(linhas) {
  const cab = linhas[0];
  const pesos = cab.map((c) => PESOS[c] || 20);
  const soma = pesos.reduce((a, b) => a + b, 0);
  const larguras = pesos.map((p) => Math.floor((p / soma) * LARGURA));
  larguras[larguras.length - 1] += LARGURA - larguras.reduce((a, b) => a + b, 0);
  const borda = { style: BorderStyle.SINGLE, size: 6, color: "000000" }; // 0,75 pt
  const bordas = { top: borda, bottom: borda, left: borda, right: borda };
  return new Table({
    width: { size: LARGURA, type: WidthType.DXA },
    columnWidths: larguras,
    rows: linhas.map((linha, i) => new TableRow({
      tableHeader: i === 0,
      cantSplit: true,
      children: linha.map((celula, j) => new TableCell({
        width: { size: larguras[j], type: WidthType.DXA },
        borders: bordas,
        margins: { top: 40, bottom: 40, left: 80, right: 80 },
        shading: { type: ShadingType.CLEAR, fill: "FFFFFF", color: "auto" },
        children: [new Paragraph({
          children: runs(celula, { bold: i === 0, size: TAM_QUADRO }),
          alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing: { line: SIMPLES, after: 0 },
        })],
      })),
    })),
  });
}

function converte(md) {
  const blocos = [];
  const linhas = md.split("\n");
  let referencias = false;
  let instancia = 0;
  let anteriorNumerada = false;
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (!l.trim() || /^-{3,}$/.test(l.trim())) continue;
    const numerada = /^\d+\. /.test(l);
    if (numerada && !anteriorNumerada) instancia++;
    anteriorNumerada = numerada;

    if (l.startsWith("# ")) {
      blocos.push(new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER,
        children: runs(l.slice(2), { bold: true }), spacing: { line: ENTRELINHA, after: 480 } }));
    } else if (l.startsWith("## ")) {
      blocos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, keepNext: true,
        children: runs(l.slice(3).toUpperCase(), { bold: true }), spacing: { line: ENTRELINHA, before: 360, after: 240 } }));
    } else if (l.startsWith("### ")) {
      blocos.push(new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true,
        children: runs(l.slice(4), { bold: true }), spacing: { line: ENTRELINHA, before: 240, after: 120 } }));
    } else if (/^\*\*Refer[êe]ncias\*\*$/.test(l.trim())) {
      referencias = true;
      blocos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
        pageBreakBefore: true, children: runs("REFERÊNCIAS", { bold: true }), spacing: { after: 240 } }));
    } else if (/^\*\*Quadro \d+/.test(l)) {
      blocos.push(legenda(l));
    } else if (l.startsWith("Fonte:")) {
      blocos.push(legenda(l, 240));
    } else if (l.startsWith("|")) {
      const tab = [];
      while (i < linhas.length && linhas[i].startsWith("|")) {
        const cels = linhas[i].slice(1, -1).split("|").map((c) => c.trim());
        if (!cels.every((c) => /^-+$/.test(c))) tab.push(cels);
        i++;
      }
      i--;
      blocos.push(quadro(tab));
    } else if (/^\s*- /.test(l)) {
      blocos.push(new Paragraph({ children: runs(l.replace(/^\s*- /, "")),
        alignment: AlignmentType.JUSTIFIED,
        numbering: { reference: "topicos", level: 0 }, spacing: { line: ENTRELINHA, after: 0 } }));
    } else if (numerada) {
      blocos.push(new Paragraph({ children: runs(l.replace(/^\d+\. /, "")),
        alignment: AlignmentType.JUSTIFIED,
        numbering: { reference: "numerada", level: 0, instance: instancia }, spacing: { line: ENTRELINHA, after: 0 } }));
    } else if (referencias) {
      blocos.push(new Paragraph({ children: runs(l), alignment: AlignmentType.LEFT,
        spacing: { line: SIMPLES, after: 240 } }));
    } else {
      blocos.push(corpo(l));
    }
  }
  return blocos;
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONTE, size: TAM } } },
    paragraphStyles: [
      { id: "Title", name: "Title", basedOn: "Normal", run: { font: FONTE, size: TAM, bold: true, color: "000000" } },
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONTE, size: TAM, bold: true, color: "000000" }, paragraph: { outlineLevel: 0 } },
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
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: FONTE, size: TAM_QUADRO })] })] }) },
    children: converte(fs.readFileSync(MD, "utf-8")),
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log(`OK: ${path.relative(ROOT, OUT)}`);
});
