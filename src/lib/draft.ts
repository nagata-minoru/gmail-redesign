import type { Mail } from '@/data/mails'

export type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward'

/** 簡易的なメールアドレス形式チェック（プロトタイプ用） */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * メールアドレスの形式が正しいかを判定する。
 *
 * value:: 判定する文字列
 * 戻り値:: 形式が正しければ true
 */
export const isValidAddress = (value: string) => EMAIL_PATTERN.test(value)

/**
 * 入力された宛先から、前後の空白と末尾の区切り（カンマ・読点）を取り除く。
 *
 * raw:: 入力された文字列
 * 戻り値:: 整えた文字列
 */
export const normalizeAddress = (raw: string) => raw.trim().replace(/[,、]+$/, '').trim()

/**
 * 返信・転送のときに、宛先・件名・本文の初期値を作る。
 *
 * mode:: 作成の種類
 * source:: 返信・転送の元メール（新規なら undefined）
 * 戻り値:: 初期値（to, subject, body）
 */
export const initialDraft = (mode: ComposeMode, source: Mail | undefined) => {
  if (!source || mode === 'new') return { to: [] as string[], subject: '', body: '' }
  const quoted = `\n\n---- ${source.time} ${source.fromName} <${source.fromAddress}> ----\n${source.body}`
  if (mode === 'forward') return { to: [] as string[], subject: `Fwd: ${source.subject}`, body: quoted }
  return { to: [source.fromAddress], subject: `Re: ${source.subject}`, body: quoted }
}
