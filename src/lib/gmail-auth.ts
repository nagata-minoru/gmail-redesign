import { Platform } from 'react-native'

/** Gmail の読み取りだけを求める権限（最小権限）。送信・変更・削除はできない */
export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'

const GIS_SRC = 'https://accounts.google.com/gsi/client'

/** Google Identity Services のうち、使う部分だけの型 */
type TokenResponse = { access_token?: string, error?: string }
type TokenClient = { requestAccessToken: (options?: { prompt?: string }) => void }
type Gis = {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string, scope: string,
        callback: (res: TokenResponse) => void, error_callback: () => void,
      }) => TokenClient
      revoke: (token: string, done: () => void) => void
    }
  }
}

/**
 * 公開してよい OAuth クライアント ID（秘密ではない）。.env.local の EXPO_PUBLIC_GOOGLE_CLIENT_ID から読む。
 * クライアントシークレットとリフレッシュトークンは使わない。
 *
 * 戻り値:: クライアント ID。未設定なら空文字
 */
export const clientId = () => process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? ''

/**
 * この環境で Gmail に接続できるか。ブラウザ（Web）でのみ対応する。
 *
 * 戻り値:: 接続できれば true
 */
export const isGmailSupported = () => Platform.OS === 'web' && typeof document !== 'undefined'

/** アクセストークン。モジュール内の変数（メモリ）にだけ置き、ページを閉じれば消える。ディスクには書かない */
let accessToken: string | null = null

/**
 * 現在のアクセストークンを返す。
 *
 * 戻り値:: トークン。未接続なら null
 */
export const currentToken = () => accessToken

/**
 * Google Identity Services のスクリプトを読み込む。
 *
 * 戻り値:: 読み込んだ後の google オブジェクト
 */
const loadGis = () => new Promise<Gis>((resolve, reject) => {
  const existing = (window as unknown as { google?: Gis }).google
  if (existing?.accounts?.oauth2) return resolve(existing)
  const script = document.createElement('script')
  script.src = GIS_SRC
  script.async = true
  script.onload = () => resolve((window as unknown as { google: Gis }).google)
  script.onerror = () => reject(new Error('gis-load-failed'))
  document.head.appendChild(script)
})

/**
 * Google のポップアップを開き、読み取り専用のアクセストークンを得る。トークンはメモリにだけ保持する。
 * prompt を空にして、同意画面は初回（または権限を取り消した後）だけ出す。2 回目以降はポップアップがすぐ閉じる。
 *
 * 戻り値:: アクセストークン
 */
export const connect = async () => {
  const id = clientId()
  if (!id) throw new Error('no-client-id')
  const gis = await loadGis()
  accessToken = await new Promise<string>((resolve, reject) => {
    const client = gis.accounts.oauth2.initTokenClient({
      client_id: id,
      scope: GMAIL_SCOPE,
      callback: (res) => (res.access_token ? resolve(res.access_token) : reject(new Error('denied'))),
      error_callback: () => reject(new Error('denied')),
    })
    client.requestAccessToken({ prompt: '' })
  })
  return accessToken
}

/**
 * 接続を解除する。メモリのトークンを捨て、Google 側でも失効させる。
 *
 * 戻り値:: 失効の要求が終わると解決する Promise
 */
export const disconnect = async () => {
  const token = accessToken
  accessToken = null
  if (!token || !isGmailSupported()) return
  const gis = await loadGis().catch(() => null)
  if (gis) await new Promise<void>((done) => gis.accounts.oauth2.revoke(token, done))
}
