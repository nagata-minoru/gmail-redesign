import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  decodeBase64Url, decodeEntities, describeError, extractBody, fetchAddress, fetchInbox, GmailError,
  hasAttachment, htmlToText, parseFrom, toMail,
} from './gmail-api.ts'
import type { GmailMessage } from './gmail-api.ts'

/**
 * テスト用に、文字列を base64url にする。
 *
 * text:: 元の文字列
 * 戻り値:: base64url の文字列
 */
const b64 = (text: string) => Buffer.from(text, 'utf-8').toString('base64url')

/**
 * テスト用の、作り物のメッセージを作る（実在のメールは使わない）。
 *
 * overrides:: 上書きする項目
 * 戻り値:: Gmail API の応答の形のメッセージ
 */
const makeRaw = (overrides: Partial<GmailMessage> = {}): GmailMessage => ({
  id: 'm1',
  labelIds: ['INBOX', 'UNREAD'],
  snippet: 'Tom &amp; Jerry',
  internalDate: String(new Date(2026, 9, 31, 9, 5).getTime()),
  payload: {
    mimeType: 'text/plain',
    headers: [
      { name: 'From', value: '"山田 太郎" <taro@example.jp>' },
      { name: 'To', value: 'me@example.jp' },
      { name: 'Subject', value: 'テスト件名' },
    ],
    body: { data: b64('こんにちは\n本文です') },
  },
  ...overrides,
})

describe('decodeBase64Url', () => {
  it('日本語を含む base64url を戻す', () => {
    assert.equal(decodeBase64Url(b64('日本語 OK?>')), '日本語 OK?>')
  })

  it('知らない文字コードは UTF-8 として読む', () => {
    assert.equal(decodeBase64Url(b64('abc'), 'no-such-charset'), 'abc')
  })
})

describe('decodeEntities / htmlToText', () => {
  it('文字参照を戻し、知らないものはそのままにする', () => {
    assert.equal(decodeEntities('a &amp; b &#39;c&#x3042; &unknown;'), "a & b 'cあ &unknown;")
  })

  it('タグ・style・script を取り除き、改行を残す', () => {
    const html = '<style>p{}</style><p>1行目</p><script>x()</script><div>2行目<br>3行目</div>'
    assert.equal(htmlToText(html), '1行目\n2行目\n3行目')
  })
})

describe('parseFrom', () => {
  it('名前とアドレスに分ける', () => {
    assert.deepEqual(parseFrom('"山田 太郎" <taro@example.jp>'), { name: '山田 太郎', address: 'taro@example.jp' })
    assert.deepEqual(parseFrom('Taro <taro@example.jp>'), { name: 'Taro', address: 'taro@example.jp' })
  })

  it('名前がないときはアドレスを名前にする', () => {
    assert.deepEqual(parseFrom('<taro@example.jp>'), { name: 'taro@example.jp', address: 'taro@example.jp' })
    assert.deepEqual(parseFrom('taro@example.jp'), { name: 'taro@example.jp', address: 'taro@example.jp' })
  })
})

describe('extractBody / hasAttachment', () => {
  it('multipart では text/plain を優先する', () => {
    const part = {
      mimeType: 'multipart/alternative',
      parts: [
        { mimeType: 'text/html', body: { data: b64('<p>HTML</p>') } },
        { mimeType: 'text/plain', body: { data: b64('PLAIN') } },
      ],
    }
    assert.equal(extractBody(part), 'PLAIN')
  })

  it('text/plain がなければ HTML を文字列にする', () => {
    const html = { mimeType: 'text/html', body: { data: b64('<b>強調</b>') } }
    const part = { mimeType: 'multipart/alternative', parts: [html] }
    assert.equal(extractBody(part), '強調')
  })

  it('本文がなければ空文字', () => {
    assert.equal(extractBody(undefined), '')
  })

  it('入れ子の添付ファイルを見つける', () => {
    const part = { parts: [{ parts: [{ filename: 'a.pdf', body: { attachmentId: 'x' } }] }] }
    assert.equal(hasAttachment(part), true)
    assert.equal(hasAttachment({ parts: [{ mimeType: 'text/plain', body: { data: 'x' } }] }), false)
  })
})

describe('toMail', () => {
  it('メッセージを Mail に変換する', () => {
    const mail = toMail(makeRaw())
    assert.equal(mail.id, 'm1')
    assert.equal(mail.fromName, '山田 太郎')
    assert.equal(mail.fromAddress, 'taro@example.jp')
    assert.equal(mail.subject, 'テスト件名')
    assert.equal(mail.preview, 'Tom & Jerry')
    assert.equal(mail.body, 'こんにちは\n本文です')
    assert.equal(mail.date, '10月31日')
    assert.equal(mail.time, '10月31日 9:05')
    assert.equal(mail.unread, true)
    assert.equal(mail.starred, false)
    assert.equal(mail.alert, false)
  })

  it('ラベルから既読・スターを判定し、件名がなければ補う', () => {
    const raw = makeRaw({ labelIds: ['INBOX', 'STARRED'] })
    raw.payload!.headers = [{ name: 'From', value: 'a@example.jp' }]
    const mail = toMail(raw)
    assert.equal(mail.unread, false)
    assert.equal(mail.starred, true)
    assert.equal(mail.subject, '（件名なし）')
  })
})

describe('describeError', () => {
  it('ステータスごとの説明を返し、応答の中身は含めない', () => {
    assert.match(describeError(new GmailError(401)), /有効期限/)
    assert.match(describeError(new GmailError(403)), /許可/)
    assert.match(describeError(new GmailError(429)), /多すぎ/)
    assert.match(describeError(new GmailError(0)), /接続できません/)
    assert.match(describeError(new Error('x')), /接続できません/)
  })
})

describe('fetchInbox / fetchAddress', () => {
  /**
   * 呼ばれた URL と認可ヘッダーを記録する、作り物の fetch を作る。
   *
   * routes:: URL の部分文字列ごとの応答
   * calls:: 記録先
   * 戻り値:: fetch の代わりの関数
   */
  const fakeFetch = (routes: Record<string, unknown>, calls: { url: string, auth: string }[]) =>
    (async (url: string, init: { headers: Record<string, string> }) => {
      calls.push({ url, auth: init.headers.Authorization })
      const key = Object.keys(routes).find((k) => url.includes(k))
      if (!key) return { ok: false, status: 404, json: async () => ({}) }
      return { ok: true, status: 200, json: async () => routes[key] }
    }) as unknown as typeof fetch

  it('トークンは URL に載せず、ヘッダーだけに載せる。読み取りの GET だけを使う', async () => {
    const calls: { url: string, auth: string }[] = []
    const f = fakeFetch({ '/messages?': { messages: [{ id: 'm1' }] }, '/messages/m1': makeRaw() }, calls)
    const mails = await fetchInbox('SECRET-TOKEN', f)
    assert.equal(mails.length, 1)
    assert.ok(calls.every((c) => !c.url.includes('SECRET-TOKEN')))
    assert.ok(calls.every((c) => c.auth === 'Bearer SECRET-TOKEN'))
  })

  it('メールがないときは空の一覧', async () => {
    assert.deepEqual(await fetchInbox('t', fakeFetch({ '/messages?': {} }, [])), [])
  })

  it('アドレスを取得する', async () => {
    const f = fakeFetch({ '/profile': { emailAddress: 'me@example.jp' } }, [])
    assert.equal(await fetchAddress('t', f), 'me@example.jp')
  })

  it('失敗は GmailError にする', async () => {
    await assert.rejects(fetchAddress('t', fakeFetch({}, [])), (e: GmailError) => e.status === 404)
    const broken = (async () => { throw new Error('network') }) as unknown as typeof fetch
    await assert.rejects(fetchAddress('t', broken), (e: GmailError) => e.status === 0)
  })
})
