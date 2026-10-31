import type { Mail } from '@/data/mails'

export type FilterKey = 'all' | 'unread' | 'starred' | 'attachment'

/**
 * 絞り込みタブの条件にメールが合うかを判定する。
 *
 * mail:: 判定するメール
 * filter:: 選択中のタブ
 * 戻り値:: 条件に合えば true
 */
export const matchesFilter = (mail: Mail, filter: FilterKey) => {
  switch (filter) {
    case 'unread':
      return mail.unread
    case 'starred':
      return mail.starred
    case 'attachment':
      return mail.hasAttachment
    default:
      return true
  }
}

/**
 * 検索語がメールの送信者・件名・本文に含まれるかを判定する。
 *
 * mail:: 判定するメール
 * query:: 検索語（前後の空白は無視）
 * 戻り値:: 含まれていれば true（検索語が空なら常に true）
 */
export const matchesQuery = (mail: Mail, query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [mail.fromName, mail.fromAddress, mail.subject, mail.body].some((s) => s.toLowerCase().includes(q))
}
