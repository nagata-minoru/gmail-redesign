// Gmail を読める公開版（npm run build:web:gmail）の書き出し結果を、デプロイ前に確かめる。
// - クライアント ID が埋め込まれていること（入っていないと接続の帯が出ない）
// - dist/_headers に CSP があること
// - 各 HTML のインラインスクリプトのハッシュが、CSP の script-src に入っていること
//   （Expo の更新でインラインスクリプトが変わると、CSP でアプリが動かなくなるため）
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
/** Google の OAuth クライアント ID の形（数字-英数字.apps.googleusercontent.com） */
const CLIENT_ID_PATTERN = /\b\d+-[a-z0-9]+\.apps\.googleusercontent\.com\b/

/**
 * ディレクトリ以下のファイルを再帰的に列挙する。
 *
 * @param {string} dir 探し始めるディレクトリ
 * @returns {string[]} ファイルのパスの一覧
 */
const listFiles = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const path = join(dir, entry.name)
  return entry.isDirectory() ? listFiles(path) : [path]
})

/**
 * 確認に失敗したことを表示して終了する。
 *
 * @param {string} message 失敗の説明
 * @returns {never}
 */
const fail = (message) => {
  console.error(`check-public-build: ${message}`)
  process.exit(1)
}

const files = listFiles(DIST)
const scripts = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(f, 'utf8'))
if (!scripts.some((s) => CLIENT_ID_PATTERN.test(s))) {
  fail('クライアント ID が埋め込まれていません。.env.local に EXPO_PUBLIC_GOOGLE_CLIENT_ID を設定してください。')
}

let headers
try {
  headers = readFileSync(join(DIST, '_headers'), 'utf8')
} catch {
  fail('dist/_headers がありません。public/_headers を確認してください。')
}
const csp = headers.match(/Content-Security-Policy: (.*)/)?.[1]
if (!csp) fail('dist/_headers に Content-Security-Policy がありません。')

const hashes = new Set()
for (const html of files.filter((f) => f.endsWith('.html'))) {
  for (const [, body] of readFileSync(html, 'utf8').matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    hashes.add(`'sha256-${createHash('sha256').update(body).digest('base64')}'`)
  }
}
const missing = [...hashes].filter((hash) => !csp.includes(hash))
if (missing.length > 0) {
  fail(`CSP の script-src に次のハッシュがありません。public/_headers に足してください: ${missing.join(' ')}`)
}

console.log(`check-public-build: OK（インラインスクリプトのハッシュ ${hashes.size} 種類）`)
