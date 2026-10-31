// E2E テスト用の静的ファイルサーバ。npm run build:web で書き出した dist/ を配信する。
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../dist', import.meta.url))
const port = Number(process.env.PORT ?? 4173)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.svg': 'image/svg+xml',
}

/**
 * dist/ 内のファイルを読む。見つからなければ null を返す。
 *
 * path:: dist/ からの相対パス
 * 戻り値:: ファイルの内容と拡張子、または null
 */
const load = async (path) => {
  try {
    return { data: await readFile(join(root, path)), ext: extname(path) }
  } catch {
    return null
  }
}

createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  const candidates = [safe, `${safe}.html`, join(safe, 'index.html')]
  let hit = null
  for (const candidate of candidates) {
    hit = extname(candidate) === '' ? null : await load(candidate)
    if (hit) break
  }
  // 見つからない URL は、静的書き出しの 404 ページ（アプリ側のルーターが画面を決める）を返す
  const found = hit ?? { ...(await load('404.html')), status: 404 }
  res.writeHead(found.status ?? 200, { 'content-type': types[found.ext] ?? 'application/octet-stream' })
  res.end(found.data)
}).listen(port, () => console.log(`E2E server: http://localhost:${port}`))
