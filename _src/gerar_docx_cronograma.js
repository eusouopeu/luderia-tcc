// Gera textos/cronograma_luderia.docx a partir de textos/cronograma_luderia.md.
//
// Converte títulos, parágrafos, listas e tabelas. Dentro das células, itens
// separados por "; " viram tópicos (bullets). **negrito** e `código` são
// mantidos como negrito e texto simples.
//
// Uso: node "_src/gerar_docx_cronograma.js"
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, ShadingType, PageOrientation,
} = require("docx");

const ROOT = path.resolve(__dirname, "..");
const MD = path.join(ROOT, "textos", "cronograma_luderia.md");
const OUT = path.join(ROOT, "textos", "cronograma_luderia.docx");

const FONTE = "Arial";
const TAM = 20; // 10 pt
const LARGURA = 15398 - 2 * 1134; // A4 paisagem menos margens de 2 cm (DXA)

// Larguras relativas por cabeçalho de tabela.
const PESOS = {
  "Semana": 8, "Período": 10, "Coleta e análise": 44, "Escrita": 24, "Entrega": 16,
  "Data": 14, "Dia": 10, "Etapa": 45, "Situação": 55, "Capítulo": 40, "Rascunho": 30,
  "Versão completa": 30,
};

function runs(texto, extra = {}) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return partes.map((p) => {
    const negrito = p.startsWith("**") && p.endsWith("**");
    const t = (negrito ? p.slice(2, -2) : p).replace(/`/g, "");
    return new TextRun({ text: t, bold: negrito || extra.bold, font: FONTE, size: extra.size || TAM });
  });
}

function paragrafo(texto, opts = {}) {
  return new Paragraph({ children: runs(texto, opts), spacing: { after: 120 }, ...opts.par });
}

function itensCelula(texto, cabecalho) {
  const itens = cabecalho ? [texto] : texto.split(/;\s+/).map((s) => s.trim()).filter(Boolean);
  if (itens.length <= 1 || texto === "-") {
    return [new Paragraph({ children: runs(texto, { bold: cabecalho }), spacing: { after: 40 } })];
  }
  // Cada tópico começa com maiúscula, como item de lista.
  const maiuscula = (t) => t.replace(/^(\*\*)?(.)/, (m, b, c) => (b || "") + c.toUpperCase());
  return itens.map((item) => new Paragraph({
    children: runs(maiuscula(item)),
    numbering: { reference: "topicos", level: 0 },
    spacing: { after: 40 },
  }));
}

function tabela(linhas) {
  const cab = linhas[0];
  const pesos = cab.map((c) => PESOS[c] || 20);
  const soma = pesos.reduce((a, b) => a + b, 0);
  const larguras = pesos.map((p) => Math.floor((p / soma) * LARGURA));
  larguras[larguras.length - 1] += LARGURA - larguras.reduce((a, b) => a + b, 0);
  const borda = { style: BorderStyle.SINGLE, size: 4, color: "000000" };
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
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        shading: i === 0 ? { type: ShadingType.CLEAR, fill: "E7E6E6", color: "auto" } : undefined,
        children: itensCelula(celula, i === 0),
      })),
    })),
  });
}

function converte(md) {
  const blocos = [];
  const linhas = md.split("\n");
  let i = 0;
  // Cada lista numerada recomeça do 1: nova instância a cada bloco.
  let instancia = 0;
  let anteriorNumerada = false;
  while (i < linhas.length) {
    const l = linhas[i];
    if (!l.trim()) { i++; continue; }
    const numerada = /^\d+\. /.test(l);
    if (numerada && !anteriorNumerada) instancia++;
    anteriorNumerada = numerada;
    if (l.startsWith("# ")) {
      blocos.push(new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER,
        children: runs(l.slice(2), { bold: true, size: 28 }), spacing: { after: 240 } }));
    } else if (l.startsWith("## ")) {
      blocos.push(new Paragraph({ heading: HeadingLevel.HEADING_1,
        children: runs(l.slice(3), { bold: true, size: 24 }), spacing: { before: 240, after: 120 } }));
    } else if (l.startsWith("|")) {
      const tab = [];
      while (i < linhas.length && linhas[i].startsWith("|")) {
        const cels = linhas[i].slice(1, -1).split("|").map((c) => c.trim());
        if (!cels.every((c) => /^-+$/.test(c))) tab.push(cels);
        i++;
      }
      blocos.push(tabela(tab));
      blocos.push(new Paragraph({ children: [], spacing: { after: 120 } }));
      continue;
    } else if (/^\s*- /.test(l)) {
      const nivel = l.startsWith("  ") ? 1 : 0;
      blocos.push(new Paragraph({ children: runs(l.replace(/^\s*- /, "")),
        numbering: { reference: "topicos", level: nivel }, spacing: { after: 60 } }));
    } else if (/^\d+\. /.test(l)) {
      blocos.push(new Paragraph({ children: runs(l.replace(/^\d+\. /, "")),
        numbering: { reference: "numerada", level: 0, instance: instancia }, spacing: { after: 60 } }));
    } else {
      blocos.push(paragrafo(l));
    }
    i++;
  }
  return blocos;
}

const doc = new Document({
  styles: { default: { document: { run: { font: FONTE, size: TAM } } } },
  numbering: {
    config: [
      { reference: "topicos", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 240, hanging: 180 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 180 } } } },
      ] },
      { reference: "numerada", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 360, hanging: 360 } } } },
      ] },
    ],
  },
  sections: [{
    properties: { page: {
      size: { width: 11906, height: 16838, orientation: PageOrientation.LANDSCAPE },
      margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 },
    } },
    children: converte(fs.readFileSync(MD, "utf-8")),
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(OUT, buf);
  console.log(`OK: ${path.relative(ROOT, OUT)}`);
});
