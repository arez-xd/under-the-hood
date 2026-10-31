// Kadra Studio test server: serves the target folder (GET/HEAD), answers everything else 405, and logs EVERY
// request with method, path, query and whether an Authorization header was sent. Kept outside run folders.
import { createServer } from 'node:http'
import { readFile, stat, appendFile } from 'node:fs/promises'
import { join, normalize, extname, resolve } from 'node:path'
const [root, port, log] = process.argv.slice(2)
const base = resolve(root)
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.mp4': 'video/mp4' }
const tryFile = async p => { try { return (await stat(p)).isFile() ? p : null } catch { return null } }
createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x')
  const auth = req.headers.authorization || req.headers['x-api-key'] || ''
  await appendFile(log, `${new Date().toISOString()} ${req.method} ${u.pathname}${u.search} auth=${auth ? auth.slice(0, 12) + '…' : '-'}\n`)
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end('Method not allowed') }
  let p = normalize(join(base, decodeURIComponent(u.pathname)))
  if (!p.startsWith(base)) { res.writeHead(403); return res.end() }
  const file = (u.pathname.endsWith('/') && await tryFile(join(p, 'index.html'))) || await tryFile(p) || (!extname(p) && (await tryFile(p + '.html') || await tryFile(join(p, 'index.html'))))
  if (!file) { res.writeHead(404, { 'content-type': 'application/json' }); return res.end('{"error":"not found"}') }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store', server: 'cloudflare', 'cf-ray': '8f1c2a3b4c5d6e7f-FRA', 'x-deployment-id': 'dpl_kd7' })
  res.end(req.method === 'HEAD' ? undefined : await readFile(file))
}).listen(+port, '127.0.0.1', () => console.log(`kadra on http://127.0.0.1:${port} log ${log}`))
