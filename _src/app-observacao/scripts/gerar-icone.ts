/*
 * Gera o ícone do app a partir do Heroicons `puzzle-piece` (24/outline), em
 * purple-600 (#9333ea) sobre fundo branco — regra de _shared/design-standards.md.
 *
 * Saídas: drawable vetorial do ícone adaptativo, PNGs legados (mipmap-*),
 * splash (drawable-*), favicon e ícone web em public/.
 * Requer `rsvg-convert` (brew install librsvg). Uso: npx tsx scripts/gerar-icone.ts
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PATH =
  'M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58v0Z'
const COLOR = '#9333EA'
const RES = 'android/app/src/main/res'
const tmp = mkdtempSync(join(tmpdir(), 'icone-'))

/** Glifo de 24×24 escalado para ocupar `glyph` px, centralizado num quadro `size`. */
function glyph(size: number, glyphSize: number): string {
  const s = glyphSize / 24
  const off = (size - glyphSize) / 2
  return `<g transform="translate(${off} ${off}) scale(${s})"><path d="${PATH}" fill="none" stroke="${COLOR}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`
}

function png(svg: string, w: number, h: number, out: string) {
  const file = join(tmp, 'i.svg')
  writeFileSync(file, svg)
  execFileSync('rsvg-convert', ['-w', String(w), '-h', String(h), '-o', out, file])
}

const svg = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`

// 1) ícone adaptativo: glifo de 66dp (zona segura) num quadro de 108dp
writeFileSync(
  `${RES}/drawable/ic_observacao.xml`,
  `<?xml version="1.0" encoding="utf-8"?>
<!-- Heroicons puzzle-piece (outline) em purple-600 sobre fundo branco (_shared/design-standards.md).
     Gerado por scripts/gerar-icone.ts. -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
    <group android:translateX="21" android:translateY="21" android:scaleX="2.75" android:scaleY="2.75">
        <path
            android:strokeColor="${COLOR}"
            android:strokeWidth="1.5"
            android:strokeLineCap="round"
            android:strokeLineJoin="round"
            android:pathData="${PATH}"/>
    </group>
</vector>
`,
)
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_observacao"/>
</adaptive-icon>
`
writeFileSync(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`, adaptive)
writeFileSync(`${RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptive)

// 2) PNGs legados (Android < 8) e foreground em PNG, do mesmo desenho
const DENSITIES: Record<string, number> = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
for (const [d, k] of Object.entries(DENSITIES)) {
  const n = Math.round(48 * k)
  const r = n * 0.22
  png(svg(n, n, `<rect width="${n}" height="${n}" rx="${r}" fill="#fff"/>${glyph(n, n * 0.66)}`), n, n, `${RES}/mipmap-${d}/ic_launcher.png`)
  png(svg(n, n, `<circle cx="${n / 2}" cy="${n / 2}" r="${n / 2}" fill="#fff"/>${glyph(n, n * 0.6)}`), n, n, `${RES}/mipmap-${d}/ic_launcher_round.png`)
  const f = Math.round(108 * k)
  png(svg(f, f, glyph(f, (f * 66) / 108)), f, f, `${RES}/mipmap-${d}/ic_launcher_foreground.png`)
}

// 3) splash: fundo branco com o glifo no centro, nas mesmas dimensões das existentes
for (const dir of readdirSync(RES).filter((x) => x.startsWith('drawable'))) {
  const file = `${RES}/${dir}/splash.png`
  let w: number
  let h: number
  try {
    const info = execFileSync('file', [file]).toString()
    const m = info.match(/(\d+) x (\d+)/)
    if (!m) continue
    w = Number(m[1])
    h = Number(m[2])
  } catch {
    continue
  }
  const g = Math.min(w, h) * 0.28
  png(svg(w, h, `<rect width="${w}" height="${h}" fill="#fff"/><g transform="translate(${(w - g) / 2} ${(h - g) / 2}) scale(${g / 24})"><path d="${PATH}" fill="none" stroke="${COLOR}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g>`), w, h, file)
}

// 4) web: favicon vetorial e ícone PNG
writeFileSync(
  'public/favicon.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect width="24" height="24" rx="5" fill="#fff"/><g transform="translate(2.4 2.4) scale(0.8)"><path d="${PATH}" fill="none" stroke="${COLOR}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>\n`,
)
png(svg(512, 512, `<rect width="512" height="512" fill="#fff"/>${glyph(512, 340)}`), 512, 512, 'public/icon-512.png')
console.log('Ícone gerado: adaptativo, mipmaps, splash, favicon.')
