// Gera o .docx de um capítulo a partir do .md (textos/capitulos/).
//
// Mesmo formato ABNT de gerar_docx_projeto.js (A4, margens 3/2 cm, Arial 12,
// espaçamento 1,5, recuo de 1,25 cm). Diferenças: legenda acima de Quadro,
// Tabela e Figura; tabela com número (alguma célula numérica fora da 1ª coluna)
// só com bordas horizontais no cabeçalho e no fim, números à direita (skill
// formatacao-tabelas-xlsx, seções 4 e 5); quadro de texto com grade completa;
// imagem em linha própria no formato ![texto](caminho relativo ao .md);
// linhas de citação (>) e comentários HTML de rascunho são omitidos.
// Regras suplementares de _instrucoes/1d_formatacao.md: título 1 e título de
// referências à esquerda; título 2 em caixa alta sem negrito; 0,5 cm depois do
// parágrafo no corpo e nas referências; células centradas na vertical; coluna de
// quadro só com palavras únicas centrada; legenda e fonte centralizadas.
//
// Versões (_instrucoes/1c_versoes.md): a saída leva o texto
// (TMax, ou TMin quando o .md está em textos/capitulos/TMin/) e o número da versão,
// <nome>_<TMax|TMin>_v<n>.docx, com n = maior versão já existente + 1; a versão
// anterior vai para a pasta _arquivo/ ao lado.
//
// Uso: node "_src/extras/gerar_docx_capitulo.js" textos/capitulos/9_plano_financeiro.md
// Vários capítulos num só arquivo (cada um começa em página nova), com PDF:
//   node "_src/extras/gerar_docx_capitulo.js" cap1.md cap2.md ... --saida textos/capitulos/TCC_luderia --texto TMin --pdf
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ImageRun,
  AlignmentType, HeadingLevel, LevelFormat, BorderStyle, ShadingType, PageNumber, Footer, VerticalAlign,
} = require("docx");

const ROOT = path.resolve(__dirname, "..", "..");
const ARGS = process.argv.slice(2);
const opcao = (nome) => { const i = ARGS.indexOf(nome); return i < 0 ? null : ARGS[i + 1]; };
const PDF = ARGS.includes("--pdf");
const MDS = ARGS.filter((a, i) => a.endsWith(".md") && !["--saida", "--texto"].includes(ARGS[i - 1]))
  .map((a) => path.resolve(ROOT, a));
if (!MDS.length || !MDS.every((m) => fs.existsSync(m))) { console.error("Informe o .md do capítulo."); process.exit(1); }
const TEXTO = opcao("--texto") || (MDS[0].split(path.sep).includes("TMin") ? "TMin" : "TMax");
const BASE = opcao("--saida") ? path.resolve(ROOT, opcao("--saida")) : MDS[0].replace(/\.md$/, "");

// Próxima versão de <BASE>_<TEXTO>: procura na pasta e em _arquivo/ e arquiva as atuais.
function versionar(base, texto) {
  const dir = path.dirname(base), arq = path.join(dir, "_arquivo");
  const re = new RegExp(`^${path.basename(base).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}_${texto}_v(\\d+)\\.(docx|pdf)$`);
  const achados = [dir, arq].filter(fs.existsSync).flatMap((d) => fs.readdirSync(d).map((f) => [d, f, f.match(re)]))
    .filter(([, , m]) => m);
  const n = Math.max(0, ...achados.map(([, , m]) => Number(m[1]))) + 1;
  fs.mkdirSync(arq, { recursive: true });
  for (const [d, f] of achados) if (d === dir) fs.renameSync(path.join(d, f), path.join(arq, f));
  return `${base}_${texto}_v${n}`;
}
const OUT = versionar(BASE, TEXTO) + ".docx";

const FONTE = "Arial";
const TAM = 24;        // 12 pt
const TAM_QUADRO = 20; // 10 pt
const CM = 567;        // DXA por centímetro
const LARGURA = 11906 - 3 * CM - 2 * CM; // A4 menos margens esquerda e direita
const ENTRELINHA = 360; // 1,5
const SIMPLES = 240;
const DEPOIS = Math.round(0.5 * CM); // 0,5 cm depois do parágrafo

// Larguras relativas por cabeçalho de quadro.
const PESOS = {
  "Termo": 18, "Definição adotada": 52, "Fonte": 30,
  "Bloco": 23, "Instrumento": 22, "Procedimento": 36, "Situação": 20,
  "Código": 8, "Item": 22, "Variável ou categoria": 18, "Fundamentação": 20, "Mensuração ou codificação": 32,
  "Objetivo específico": 26, "Dimensão": 18, "Variáveis ou categorias": 36, "Itens": 20,
  "Técnicas": 74,
  "Posição": 9, "Bairro": 24, "Concorrente": 30, "Capital": 18, "Dia útil": 14, "Fim de semana": 16, "Nota": 9,
  "ID": 7, "Premissa": 30, "Nível": 10, "Conta": 34, "Indicador": 34, "Direcionador": 20, "Cálculo": 52, "Premissas": 18, "Faixa testada": 16,
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
    spacing: { line: ENTRELINHA, after: DEPOIS },
  });
}

function legenda(texto, depois = 0) {
  return new Paragraph({
    children: runs(texto, { size: TAM_QUADRO }),
    alignment: AlignmentType.CENTER,
    keepNext: depois === 0,
    spacing: { line: SIMPLES, before: depois ? 0 : 240, after: depois },
  });
}

const NUM = /^[-−]?(R\$ ?)?[\d.]+(,\d+)?%?$/;

function quadro(linhas) {
  const cab = linhas[0];
  const numerica = linhas.slice(1).some((l) => l.slice(1).some((c) => NUM.test(c)));
  const pesos = cab.map((c, j) => PESOS[c] || (j === 0 ? 34 : (numerica ? 14 : 20)));
  // Quadro: coluna em que toda célula tem uma só palavra fica centrada.
  const palavra = (c) => /^\S+$/.test(c.replace(/\*/g, ""));
  const centrada = cab.map((_, j) => !numerica && linhas.slice(1).every((l) => !l[j] || palavra(l[j]))
    && linhas.slice(1).some((l) => l[j]));
  const alinha = (celula, i, j) => {
    if (i === 0 || centrada[j]) return AlignmentType.CENTER;
    return numerica && NUM.test(celula) ? AlignmentType.RIGHT : AlignmentType.LEFT;
  };
  const soma = pesos.reduce((a, b) => a + b, 0);
  const larguras = pesos.map((p) => Math.floor((p / soma) * LARGURA));
  larguras[larguras.length - 1] += LARGURA - larguras.reduce((a, b) => a + b, 0);
  const borda = { style: BorderStyle.SINGLE, size: 6, color: "000000" }; // 0,75 pt
  const nada = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const grade = { top: borda, bottom: borda, left: borda, right: borda };
  const bordas = (i) => !numerica ? grade : {
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
        children: [new Paragraph({
          children: runs(celula, { bold: i === 0, size: TAM_QUADRO }),
          alignment: alinha(celula, i, j),
          spacing: { line: SIMPLES, after: 0 },
        })],
      })),
    })),
  });
}

// Título 1 (capítulo) e título de referências: caixa alta, negrito, à esquerda, sem recuo.
function titulo1(texto, quebra) {
  return new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.LEFT, indent: { firstLine: 0 },
    pageBreakBefore: quebra, keepNext: true, children: runs(texto.toUpperCase(), { bold: true }),
    spacing: { line: ENTRELINHA, after: 480 } });
}

let instancia = 0; // contínua entre capítulos, para cada lista numerada recomeçar em 1
function converte(md, MD, blocos = []) {
  const linhas = md.split("\n");
  let referencias = false;
  let anteriorNumerada = false;
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
        children: runs(l.slice(3).toUpperCase(), { bold: false }), spacing: { line: ENTRELINHA, before: 360, after: 240 } }));
    } else if (l.startsWith("### ")) {
      blocos.push(new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true,
        children: runs(l.slice(4), { bold: true }), spacing: { line: ENTRELINHA, before: 240, after: 120 } }));
    } else if (/^\*\*Refer[êe]ncias[^*]*\*\*/.test(l.trim())) {
      // "Referências citadas neste capítulo": como o título 1, sem número.
      referencias = true;
      blocos.push(titulo1(l.trim().replace(/\*\*/g, "").toUpperCase(), true));
    } else if (/^\*\*(Quadro|Tabela|Figura) [\d.]+/.test(l)) {
      blocos.push(legenda(l));
    } else if (/^!\[[^\]]*\]\([^)]+\)/.test(l.trim())) {
      const arq = path.resolve(path.dirname(MD), l.trim().match(/\(([^)]+)\)/)[1]);
      const buf = fs.readFileSync(arq);
      const larg = buf.readUInt32BE(16), alt = buf.readUInt32BE(20); // cabeçalho PNG
      const w = Math.round((LARGURA / 1440) * 96);
      blocos.push(new Paragraph({ alignment: AlignmentType.CENTER, keepNext: true, spacing: { after: 0 },
        children: [new ImageRun({ type: "png", data: buf, transformation: { width: w, height: Math.round(w * alt / larg) } })] }));
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
        indent: { firstLine: 0 }, spacing: { line: SIMPLES, after: DEPOIS } }));
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
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: FONTE, size: TAM_QUADRO })] })] }) },
    children: MDS.reduce((blocos, md) => converte(fs.readFileSync(md, "utf-8"), md, blocos), []),
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
