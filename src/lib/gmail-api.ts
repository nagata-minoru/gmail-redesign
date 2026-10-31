import type { Mail } from '@/data/mails'

/** Gmail API のメッセージのヘッダー */
export type GmailHeader = { name: string, value: string }

/** Gmail API のメッセージの本文の部品（入れ子になる）。使う項目だけ定義している */
export type GmailPart = {
  mimeType?: string
  filename?: string
  headers?: GmailHeader[]
  body?: { data?: string, attachmentId?: string }
  parts?: GmailPart[]
}

/** Gmail API の users.messages.get の応答。使う項目だけ定義している */
export type GmailMessage = {
  id: string
  labelIds?: string[]
  snippet?: string
  internalDate?: string
  payload?: GmailPart
}

/** Gmail API が成功以外を返したときの例外。応答の本文は含めない（メールの内容を持ち回らないため） */
export class GmailError extends Error {
  status: number

  /**
   * status:: HTTP ステータス（通信自体に失敗したときは 0）
   */
  constructor(status: number) {
    super(`Gmail API error: ${status}`)
    this.status = status
  }
}

const API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me'
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
}

/**
 * HTML の文字参照（&amp; や &#39; など）を元の文字に戻す。
 *
 * text:: 変換する文字列
 * 戻り値:: 文字参照を戻した文字列
 */
export const decodeEntities = (text: string) => text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, body: string) => {
  if (!body.startsWith('#')) return NAMED_ENTITIES[body.toLowerCase()] ?? whole
  const hex = body[1] === 'x' || body[1] === 'X'
  const code = hex ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
  // 範囲外の値は String.fromCodePoint が例外を投げるため、元の表記のまま残す
  if (code > 0x10ffff) return whole
  return String.fromCodePoint(code)
})

/**
 * パターンに合う部分を、取り除いた結果に新しく合う部分が現れなくなるまで繰り返し取り除く。
 * 「<scr<script>ipt>」のように、1 回の置換では消えきらない入れ子の書き方に備える。
 *
 * text:: 対象の文字列
 * pattern:: 取り除くパターン（g フラグ付き）
 * 戻り値:: 合う部分が残っていない文字列
 */
const removeAll = (text: string, pattern: RegExp) => {
  let current = text
  let previous
  do {
    previous = current
    current = current.replace(pattern, '')
  } while (current !== previous)
  return current
}

/**
 * HTML メールを、タグのない読みやすい文字列にする。画面には文字列だけを出し、HTML は描画しない。
 *
 * html:: HTML の文字列
 * 戻り値:: 改行を残したプレーンテキスト
 */
export const htmlToText = (html: string) => {
  const withBreaks = removeAll(html, /<(style|script)[\s\S]*?<\/\1>/gi)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
  return decodeEntities(removeAll(withBreaks, /<[^>]*>/g))
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Gmail API の本文データ（base64url）を文字列にする。文字コードは Content-Type の charset に従い、
 * 不明なときは UTF-8 とする。
 *
 * data:: base64url の文字列
 * charset:: 文字コード名（省略時は UTF-8）
 * 戻り値:: デコードした文字列
 */
export const decodeBase64Url = (data: string, charset = 'utf-8') => {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  try {
    return new TextDecoder(charset).decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

/**
 * ヘッダーの値を、名前の大文字小文字を区別せずに探す。
 *
 * headers:: ヘッダーの一覧
 * name:: 探すヘッダー名
 * 戻り値:: 値。なければ空文字
 */
export const headerValue = (headers: GmailHeader[] | undefined, name: string) => {
  const found = headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())
  return found?.value ?? ''
}

/**
 * From ヘッダー（「名前 <アドレス>」の形）を、名前とアドレスに分ける。
 *
 * value:: From ヘッダーの値
 * 戻り値:: 名前（なければアドレス）とアドレス
 */
export const parseFrom = (value: string) => {
  const match = value.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/)
  if (!match) return { name: value.trim(), address: value.trim() }
  return { name: match[1].trim() || match[2], address: match[2] }
}

/**
 * 本文の部品から、表示する本文を取り出す。text/plain を優先し、なければ text/html を文字列にする。
 *
 * part:: メッセージの本文の部品
 * 戻り値:: 本文の文字列。見つからなければ空文字
 */
export const extractBody = (part: GmailPart | undefined): string => {
  const plain = findPart(part, 'text/plain')
  if (plain) return decodePart(plain).trim()
  const html = findPart(part, 'text/html')
  if (html) return htmlToText(decodePart(html))
  return ''
}

/**
 * 入れ子の部品から、指定した種類で本文データを持つものを深さ優先で探す。
 *
 * part:: 探し始める部品
 * mimeType:: 探す MIME タイプ
 * 戻り値:: 見つかった部品。なければ undefined
 */
const findPart = (part: GmailPart | undefined, mimeType: string): GmailPart | undefined => {
  if (!part) return undefined
  if (part.mimeType === mimeType && part.body?.data) return part
  for (const child of part.parts ?? []) {
    const found = findPart(child, mimeType)
    if (found) return found
  }
  return undefined
}

/**
 * 部品の本文データを、Content-Type の charset に従って文字列にする。
 *
 * part:: 本文データを持つ部品
 * 戻り値:: 文字列
 */
const decodePart = (part: GmailPart) => {
  const contentType = headerValue(part.headers, 'Content-Type')
  const charset = contentType.match(/charset="?([\w-]+)"?/i)?.[1]
  return decodeBase64Url(part.body?.data ?? '', charset)
}

/**
 * 添付ファイルがあるかどうか。入れ子の部品も調べる。
 *
 * part:: 調べ始める部品
 * 戻り値:: 添付ファイルがあれば true
 */
export const hasAttachment = (part: GmailPart | undefined): boolean => {
  if (!part) return false
  if (part.filename && part.body?.attachmentId) return true
  return (part.parts ?? []).some(hasAttachment)
}

/**
 * 時刻を、一覧用の日付と詳細用の時刻の文字列にする（端末のタイムゾーン）。
 *
 * ms:: エポックからのミリ秒
 * 戻り値:: 日付（10月31日）と時刻（10月31日 9:05）
 */
export const formatDates = (ms: number) => {
  const d = new Date(ms)
  const date = `${d.getMonth() + 1}月${d.getDate()}日`
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return { date, time: `${date} ${d.getHours()}:${minutes}` }
}

/**
 * Gmail API のメッセージを、画面で使う Mail に変換する。
 *
 * raw:: users.messages.get（format=full）の応答
 * 戻り値:: Mail
 */
export const toMail = (raw: GmailMessage): Mail => {
  const headers = raw.payload?.headers
  const from = parseFrom(headerValue(headers, 'From'))
  const labels = raw.labelIds ?? []
  const received = Number(raw.internalDate) || Date.parse(headerValue(headers, 'Date')) || 0
  return {
    id: raw.id,
    fromName: from.name,
    fromAddress: from.address,
    to: headerValue(headers, 'To') || '自分',
    subject: headerValue(headers, 'Subject') || '（件名なし）',
    preview: decodeEntities(raw.snippet ?? ''),
    body: extractBody(raw.payload),
    ...formatDates(received),
    unread: labels.includes('UNREAD'),
    starred: labels.includes('STARRED'),
    hasAttachment: hasAttachment(raw.payload),
    alert: false,
  }
}

/**
 * Gmail API の失敗を、画面に出す日本語の説明にする。応答の本文は使わない。
 *
 * error:: 発生した例外
 * 戻り値:: ユーザー向けの説明
 */
export const describeError = (error: unknown) => {
  const status = error instanceof GmailError ? error.status : 0
  if (status === 401) return '認可の有効期限が切れました。もう一度接続してください。'
  if (status === 403) return 'Gmail の読み取りが許可されていません。接続し直して、読み取りを許可してください。'
  if (status === 429) return 'Gmail への問い合わせが多すぎます。しばらくしてからもう一度お試しください。'
  return 'Gmail に接続できませんでした。通信を確認して、もう一度お試しください。'
}

/**
 * Gmail API に GET する。アクセストークンは Authorization ヘッダーだけに載せ、URL には入れない。
 *
 * token:: アクセストークン
 * path:: API_BASE 以降のパス
 * fetchImpl:: 通信に使う関数（テストで差し替える）
 * 戻り値:: 応答の JSON
 */
const get = async <T>(token: string, path: string, fetchImpl: typeof fetch): Promise<T> => {
  let res: Response
  try {
    res = await fetchImpl(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  } catch {
    throw new GmailError(0)
  }
  if (!res.ok) throw new GmailError(res.status)
  return res.json() as Promise<T>
}

/**
 * 接続したアカウントのメールアドレスを取得する。
 *
 * token:: アクセストークン
 * fetchImpl:: 通信に使う関数
 * 戻り値:: メールアドレス
 */
export const fetchAddress = async (token: string, fetchImpl: typeof fetch = fetch) => {
  const profile = await get<{ emailAddress: string }>(token, '/profile', fetchImpl)
  return profile.emailAddress
}

/**
 * 受信トレイの新しいメールを取得する。読み取りだけで、Gmail 側は何も変更しない。
 *
 * token:: アクセストークン
 * fetchImpl:: 通信に使う関数
 * limit:: 取得する件数の上限
 * 戻り値:: 新しい順の Mail の一覧
 */
export const fetchInbox = async (token: string, fetchImpl: typeof fetch = fetch, limit = 20) => {
  const list = await get<{ messages?: { id: string }[] }>(
    token, `/messages?labelIds=INBOX&maxResults=${limit}`, fetchImpl,
  )
  const messages = await Promise.all(
    (list.messages ?? []).map((m) => get<GmailMessage>(token, `/messages/${m.id}?format=full`, fetchImpl)),
  )
  return messages.map(toMail)
}
