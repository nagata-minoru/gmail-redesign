/** sessionStorage に置くときのキー */
export const TOKEN_KEY = 'gmail-redesign.gmail-token'

/** 期限ぎりぎりのトークンを使わないための余裕（ミリ秒） */
const EXPIRY_MARGIN_MS = 60 * 1000

/** 期限が分からないときに仮に置く有効期間（秒）。Google のアクセストークンは通常 1 時間 */
const DEFAULT_EXPIRES_IN_SEC = 3600

/** 使う部分だけの Storage の型（テストで差し替える） */
export type TokenStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

/** 保存する中身。トークンと、失効する時刻（エポックミリ秒） */
type StoredToken = { token: string, expiresAt: number }

/**
 * アクセストークンを、失効する時刻と一緒に保存する。ストレージが使えないときは何もしない。
 *
 * storage:: 保存先（ブラウザでは sessionStorage）
 * token:: アクセストークン
 * expiresIn:: 有効期間（秒）。不明なら 1 時間とみなす
 * now:: 現在時刻（エポックミリ秒）
 * 戻り値:: なし
 */
export const saveToken = (storage: TokenStorage | null, token: string, expiresIn: number | undefined, now: number) => {
  const seconds = expiresIn && expiresIn > 0 ? expiresIn : DEFAULT_EXPIRES_IN_SEC
  const value: StoredToken = { token, expiresAt: now + seconds * 1000 }
  try {
    storage?.setItem(TOKEN_KEY, JSON.stringify(value))
  } catch {
    // 保存できなくても、メモリのトークンで動き続ける
  }
}

/**
 * 保存したトークンを消す。ストレージが使えないときは何もしない。
 *
 * storage:: 保存先
 * 戻り値:: なし
 */
export const clearToken = (storage: TokenStorage | null) => {
  try {
    storage?.removeItem(TOKEN_KEY)
  } catch {
    // 消せなくても、期限が来れば使われなくなる
  }
}

/**
 * 保存したトークンを読み出す。期限切れ・期限間近・壊れた値は消して null を返す。
 *
 * storage:: 保存先
 * now:: 現在時刻（エポックミリ秒）
 * 戻り値:: 使えるトークン。なければ null
 */
export const loadToken = (storage: TokenStorage | null, now: number) => {
  let raw: string | null = null
  try {
    raw = storage?.getItem(TOKEN_KEY) ?? null
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<StoredToken>
    const valid = (
      typeof value.token === 'string' && value.token !== '' &&
      typeof value.expiresAt === 'number' && value.expiresAt - EXPIRY_MARGIN_MS > now
    )
    if (valid) return value.token as string
  } catch {
    // 壊れた値は下で消す
  }
  clearToken(storage)
  return null
}
