import type { Mail } from '../data/mails.ts'

/**
 * テスト用のメールを作る。指定しない項目は、目立たない既定値になる。
 *
 * overrides:: 既定値を上書きする項目
 * 戻り値:: テスト用のメール
 */
export const makeMail = (overrides: Partial<Mail> = {}): Mail => ({
  id: '1',
  fromName: '山田 太郎',
  fromAddress: 'yamada@example.jp',
  to: '自分',
  subject: '来週の打ち合わせ',
  preview: '日程のご相談です。',
  body: 'お世話になっております。',
  date: '10月31日',
  time: '10月31日 09:00',
  unread: false,
  starred: false,
  hasAttachment: false,
  alert: false,
  ...overrides,
})
