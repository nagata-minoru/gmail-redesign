import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { initialDraft, isValidAddress, normalizeAddress } from './draft.ts'
import { makeMail } from './test-helpers.ts'

describe('isValidAddress', () => {
  it('ふつうのメールアドレスを受け付ける', () => {
    assert.equal(isValidAddress('me@example.jp'), true)
    assert.equal(isValidAddress('first.last+tag@sub.example.co.jp'), true)
  })

  it('形式の崩れたものを断る', () => {
    const invalid = ['', 'me', 'me@', '@example.jp', 'me@example', 'me @example.jp', 'me@@example.jp']
    for (const value of invalid) {
      assert.equal(isValidAddress(value), false, `「${value}」は断る`)
    }
  })
})

describe('normalizeAddress', () => {
  it('前後の空白を取り除く', () => {
    assert.equal(normalizeAddress('  me@example.jp  '), 'me@example.jp')
  })

  it('末尾のカンマと読点を取り除く', () => {
    assert.equal(normalizeAddress('me@example.jp,'), 'me@example.jp')
    assert.equal(normalizeAddress('me@example.jp、'), 'me@example.jp')
    assert.equal(normalizeAddress('me@example.jp, '), 'me@example.jp')
  })

  it('途中の文字は変えない', () => {
    assert.equal(normalizeAddress('a,b@example.jp'), 'a,b@example.jp')
  })
})

describe('initialDraft', () => {
  const source = makeMail({
    subject: '来週の打ち合わせ', fromName: '山田 太郎', fromAddress: 'yamada@example.jp',
    time: '10月31日 09:00', body: '日程のご相談です。',
  })

  it('新規なら空の下書きになる', () => {
    assert.deepEqual(initialDraft('new', source), { to: [], subject: '', body: '' })
  })

  it('元のメールがなければ、種類にかかわらず空の下書きになる', () => {
    assert.deepEqual(initialDraft('reply', undefined), { to: [], subject: '', body: '' })
  })

  it('返信は、送信者を宛先にして「Re:」を付ける', () => {
    const draft = initialDraft('reply', source)
    assert.deepEqual(draft.to, ['yamada@example.jp'])
    assert.equal(draft.subject, 'Re: 来週の打ち合わせ')
  })

  it('全員に返信も、送信者を宛先にして「Re:」を付ける', () => {
    const draft = initialDraft('replyAll', source)
    assert.deepEqual(draft.to, ['yamada@example.jp'])
    assert.equal(draft.subject, 'Re: 来週の打ち合わせ')
  })

  it('転送は、宛先を空にして「Fwd:」を付ける', () => {
    const draft = initialDraft('forward', source)
    assert.deepEqual(draft.to, [])
    assert.equal(draft.subject, 'Fwd: 来週の打ち合わせ')
  })

  it('本文に、元のメールの送信者・時刻・本文を引用する', () => {
    const { body } = initialDraft('reply', source)
    assert.equal(body, '\n\n---- 10月31日 09:00 山田 太郎 <yamada@example.jp> ----\n日程のご相談です。')
  })
})
