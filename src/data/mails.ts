/**
 * プロトタイプ用のダミーデータ。
 * 人名・メールアドレス・本文はすべて架空で、実在のメールや個人情報は含めない。
 */

export type Mail = {
  id: string
  fromName: string
  fromAddress: string
  to: string
  subject: string
  preview: string
  body: string
  /** 一覧に表示する日付 */
  date: string
  /** 詳細に表示する時刻 */
  time: string
  unread: boolean
  starred: boolean
  hasAttachment: boolean
  /** セキュリティ通知など、目立たせて表示するメール */
  alert: boolean
}

export type Account = {
  label: string
  address: string
}

/** 送信元として選べるアカウント（ダミー） */
export const accounts: Account[] = [{
  label: '自分', address: 'me@example.jp',
}, {
  label: '仕事用', address: 'work@example.jp',
}]

export const initialMails: Mail[] = [{
  id: '1',
  fromName: 'アカウント セキュリティ',
  fromAddress: 'security@example.jp',
  to: '自分',
  subject: '重要: 不審なログインを確認してください',
  preview: '安全のためアカウントを確認してください。',
  body: [
    '新しい端末からのログインがありました。',
    '',
    '心当たりがない場合は、パスワードを変更してください。',
    '',
    '※ これはプロトタイプ用のダミー通知です。',
  ].join('\n'),
  date: '10月31日',
  time: '10月31日 9:12',
  unread: true,
  starred: false,
  hasAttachment: false,
  alert: true,
}, {
  id: '2',
  fromName: '山田 太郎',
  fromAddress: 'taro@example.jp',
  to: '自分',
  subject: '来週の打ち合わせについて',
  preview: '日程のご相談です。',
  body: [
    'お疲れさまです。',
    '',
    '来週の打ち合わせの日程について、ご都合をお聞かせください。',
    '候補日は火曜または木曜を考えています。',
    '',
    'よろしくお願いします。',
  ].join('\n'),
  date: '10月31日',
  time: '10月31日 10:30',
  unread: true,
  starred: false,
  hasAttachment: false,
  alert: false,
}, {
  id: '3',
  fromName: '佐藤 美咲',
  fromAddress: 'misaki@example.jp',
  to: '自分',
  subject: 'デザインレビューのお願い',
  preview: 'ご都合はいかがでしょうか。',
  body: [
    'お疲れさまです。',
    '',
    '受信トレイのワイヤーフレームについて、レビューをお願いできますか。',
    'ご都合はいかがでしょうか。',
  ].join('\n'),
  date: '10月30日',
  time: '10月30日 16:05',
  unread: true,
  starred: true,
  hasAttachment: false,
  alert: false,
}, {
  id: '4',
  fromName: '株式会社アカウント',
  fromAddress: 'billing@example.jp',
  to: '自分',
  subject: 'ご請求書をお送りします',
  preview: '添付ファイルをご確認ください。',
  body: [
    'いつもお世話になっております。',
    '',
    '今月分のご請求書をお送りします。',
    '添付ファイルをご確認ください。',
  ].join('\n'),
  date: '10月30日',
  time: '10月30日 11:20',
  unread: false,
  starred: false,
  hasAttachment: true,
  alert: false,
}, {
  id: '5',
  fromName: 'チーム開発',
  fromAddress: 'team@example.jp',
  to: '自分',
  subject: 'Sprint 12 のまとめ',
  preview: '今週の進捗共有です。',
  body: [
    '今週の進捗共有です。',
    '',
    '・受信トレイの一覧を実装',
    '・メール詳細の操作を整理',
    '・メール作成画面のレイアウトを検討',
  ].join('\n'),
  date: '10月29日',
  time: '10月29日 18:40',
  unread: false,
  starred: false,
  hasAttachment: false,
  alert: false,
}, {
  id: '6',
  fromName: 'ニュースレター',
  fromAddress: 'news@example.jp',
  to: '自分',
  subject: '今月のおすすめ',
  preview: '新しい機能をご紹介します。',
  body: [
    '今月のおすすめをお届けします。',
    '',
    '新しい機能をご紹介します。',
  ].join('\n'),
  date: '10月28日',
  time: '10月28日 8:00',
  unread: false,
  starred: false,
  hasAttachment: false,
  alert: false,
}, {
  id: '7',
  fromName: '鈴木 健',
  fromAddress: 'suzuki@example.jp',
  to: '自分',
  subject: '見積書をお送りします',
  preview: '添付ファイルをご確認ください。',
  body: [
    'お世話になっております。',
    '',
    'ご依頼の見積書をお送りします。',
    '添付ファイルをご確認ください。',
  ].join('\n'),
  date: '10月27日',
  time: '10月27日 14:15',
  unread: true,
  starred: false,
  hasAttachment: true,
  alert: false,
}]
