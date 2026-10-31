// Renders the logo and the banners.
//   logo:    logo-source.png → ../logo.png and ../logo@2x.png (rounded tile, radius 21.875% as across the
//            series) and ../logo-square.png and ../logo-square@2x.png (the square backdrop, no rounding)
//   banners: ../banner.html → ../banner.png (1280×640 at 2×), ../banner-square.html → ../banner-square.png
//            (1080×1080 at 2×)
//   node render.mjs [--src folder]        (needs Playwright: npm i playwright)
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
const i = process.argv.indexOf('--src')
const here = i > 0 ? process.argv[i + 1] : dirname(fileURLToPath(import.meta.url)), out = join(here, '..')
const source = 'data:image/png;base64,' + readFileSync(join(here, 'logo-source.png')).toString('base64')
const browser = await chromium.launch()
async function shoot({ html, url, w, h, scale = 1, file }) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale })
  if (url) await page.goto(url, { waitUntil: 'networkidle' })
  else await page.setContent(html, { waitUntil: 'load' })
  await page.waitForTimeout(200)
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } })
  await page.close()
}
const tile = (size, rounded) => `<html><body style="margin:0;background:transparent"><img src="${source}" style="display:block;width:${size}px;height:${size}px;border-radius:${rounded ? size * 0.21875 : 0}px"></body></html>`
for (const [size, suffix] of [[512, ''], [1024, '@2x']]) {
  await shoot({ html: tile(size, true), w: size, h: size, file: join(out, `logo${suffix}.png`) })
  await shoot({ html: tile(size, false), w: size, h: size, file: join(out, `logo-square${suffix}.png`) })
}
await shoot({ url: pathToFileURL(join(out, 'banner.html')).href, w: 1280, h: 640, scale: 2, file: join(out, 'banner.png') })
await shoot({ url: pathToFileURL(join(out, 'banner-square.html')).href, w: 1080, h: 1080, scale: 2, file: join(out, 'banner-square.png') })
await browser.close()
console.log('Rendered logo.png, logo@2x.png, logo-square.png, logo-square@2x.png, banner.png, banner-square.png')
