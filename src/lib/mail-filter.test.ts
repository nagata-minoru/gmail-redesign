import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { matchesFilter, matchesQuery } from './mail-filter.ts'
import { makeMail } from './test-helpers.ts'

describe('matchesFilter', () => {
  it('「すべて」はどのメールも通す', () => {
    assert.equal(matchesFilter(makeMail(), 'all'), true)
  })

  it('「未読」は未読のメールだけ通す', () => {
    assert.equal(matchesFilter(makeMail({ unread: true }), 'unread'), true)
    assert.equal(matchesFilter(makeMail({ unread: false }), 'unread'), false)
  })

  it('「スター付き」はスターのあるメールだけ通す', () => {
    assert.equal(matchesFilter(makeMail({ starred: true }), 'starred'), true)
    assert.equal(matchesFilter(makeMail({ starred: false }), 'starred'), false)
  })

  it('「添付ファイル」は添付のあるメールだけ通す', () => {
    assert.equal(matchesFilter(makeMail({ hasAttachment: true }), 'attachment'), true)
    assert.equal(matchesFilter(makeMail({ hasAttachment: false }), 'attachment'), false)
  })
})

describe('matchesQuery', () => {
  const mail = makeMail({
    fromName: '佐藤 美咲',
    fromAddress: 'Sato@example.jp',
    subject: 'デザインレビューのお願い',
    body: 'ご都合はいかがでしょうか。',
  })

  it('検索語が空なら常に通す', () => {
    assert.equal(matchesQuery(mail, ''), true)
  })

  it('空白だけの検索語は空として扱う', () => {
    assert.equal(matchesQuery(mail, '   '), true)
  })

  it('送信者名・アドレス・件名・本文のどれに含まれても通す', () => {
    assert.equal(matchesQuery(mail, '佐藤'), true)
    assert.equal(matchesQuery(mail, 'example.jp'), true)
    assert.equal(matchesQuery(mail, 'レビュー'), true)
    assert.equal(matchesQuery(mail, 'いかが'), true)
  })

  it('大文字と小文字を区別しない', () => {
    assert.equal(matchesQuery(mail, 'SATO@'), true)
  })

  it('前後の空白は無視する', () => {
    assert.equal(matchesQuery(mail, '  レビュー  '), true)
  })

  it('どこにも含まれなければ通さない', () => {
    assert.equal(matchesQuery(mail, '請求書'), false)
  })
})
