#!/usr/bin/env node
// Copia o kit dos painéis (kit_painel.js) para dentro de cada webscript, entre as linhas
// "// >>> kit_painel" e "// <<< kit_painel". Os scripts continuam autossuficientes: o
// carregador do Tampermonkey (gerar_carregadores.py) e os testes leem um arquivo só.
//
// Uso (da raiz do repositório):
//   node _src/webScripts/_kit_painel/embutir.js            # atualiza as cópias
//   node _src/webScripts/_kit_painel/embutir.js --conferir # só confere; sai com erro se alguma estiver velha
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.resolve(__dirname, '..', '..');
const ALVOS = [
  'webScripts/B1_estabelecimentos/instagram.user.js',
  'webScripts/B1_estabelecimentos/instagram_snowball.user.js',
  'webScripts/B1_estabelecimentos/cardapio.user.js',
  'webScripts/B1_estabelecimentos/acervo.user.js',
  'webScripts/B1_estabelecimentos/maps_entorno.user.js',
  'webScripts/B5_ativos_fixos/aluguel.user.js',
];
const INICIO = '// >>> kit_painel';
const FIM = '// <<< kit_painel';

function blocoIndentado() {
  const kit = fs.readFileSync(path.join(__dirname, 'kit_painel.js'), 'utf8').replace(/\r\n/g, '\n').trimEnd();
  return kit.split('\n').map((l) => (l ? `  ${l}` : '')).join('\n');
}

function embutir(texto, bloco) {
  const ini = texto.indexOf(INICIO);
  const fim = texto.indexOf(FIM, ini);
  if (ini < 0 || fim < 0) return null;
  const comecoLinha = texto.lastIndexOf('\n', ini) + 1;
  const fimLinha = texto.indexOf('\n', fim);
  return texto.slice(0, comecoLinha) + bloco + texto.slice(fimLinha < 0 ? texto.length : fimLinha);
}

function main() {
  const conferir = process.argv.includes('--conferir');
  const bloco = blocoIndentado();
  let velhos = 0;
  for (const rel of ALVOS) {
    const arq = path.join(SRC, rel);
    if (!fs.existsSync(arq)) { console.error(`não existe: ${rel}`); process.exitCode = 1; continue; }
    const texto = fs.readFileSync(arq, 'utf8');
    const novo = embutir(texto, bloco);
    if (novo == null) { console.error(`sem marcadores do kit: ${rel}`); process.exitCode = 1; continue; }
    if (novo === texto) continue;
    velhos++;
    if (conferir) console.error(`kit desatualizado: ${rel}`);
    else { fs.writeFileSync(arq, novo); console.log(`kit atualizado: ${rel}`); }
  }
  if (conferir && velhos) process.exitCode = 1;
  if (!velhos) console.log('kit em dia nos webscripts.');
}

if (require.main === module) main();
module.exports = { ALVOS, SRC, blocoIndentado, embutir };
