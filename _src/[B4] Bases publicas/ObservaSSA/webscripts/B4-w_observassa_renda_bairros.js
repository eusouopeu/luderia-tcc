// Bloco B4 - coleta da renda média dos responsáveis por domicílio por bairro de Salvador
// (Censo 2010) nas páginas do ObservaSSA (Observatório de Bairros de Salvador, UFBA).
//
// Rodar no console do navegador, numa página de https://observatoriobairrossalvador.ufba.br
// (o site não aceita a cadeia de certificados do Python). `slugs` vem dos nomes de bairro
// do Censo 2022 (ponto_operacoes/[B4] População por Bairro 2022), sem acento, com "-".
// O resultado (JSON) vai para dados/[B4] Bases publicas/_dados-brutos/observassa/
// AAAA-MM-DD_observassa_renda_bairros.csv. Coleta de 04/11/2026: 154 de 170 bairros
// (os 16 restantes não têm página ou não existiam em 2010).
async function coletar(slugs) {
  const ok = {}, falha = [];
  await Promise.all(slugs.map(async s => {
    const r = await fetch('/bairros/' + s);
    if (!r.ok) { falha.push(s + ':' + r.status); return; }
    const t = (await r.text()).replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
    const m = t.match(/em (\d{4}),? o bairro[^.]*?([\d.]+) habitantes.*?renda m[ée]dia dos respons[áa]veis por domic[íi]lio[^R]*R\$ ?([\d.]+(?:,\d+)?)/);
    if (m) ok[s] = [+m[1], +m[2].replace(/\./g, ''), +m[3].replace(/\./g, '').replace(',', '.')];
    else falha.push(s + ':sem');
  }));
  return JSON.stringify({ ok, falha });
}
