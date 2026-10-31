import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { accounts, initialMails } from './mails.ts'

/** ダミーデータの約束事（AGENTS.md：実メール・個人情報を含めない）を守っているかを確かめる */
describe('ダミーデータ', () => {
  it('メールの id が重複しない', () => {
    const ids = initialMails.map((m) => m.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('メールのアドレスはすべて example.jp（架空のドメイン）', () => {
    for (const mail of initialMails) {
      assert.match(mail.fromAddress, /@example\.jp$/, `${mail.id}: ${mail.fromAddress}`)
    }
  })

  it('アカウントのアドレスはすべて example.jp（架空のドメイン）', () => {
    for (const account of accounts) {
      assert.match(account.address, /@example\.jp$/, account.address)
    }
  })

  it('件名・本文・日付が空のメールがない', () => {
    for (const mail of initialMails) {
      assert.notEqual(mail.subject.trim(), '', `${mail.id}: 件名`)
      assert.notEqual(mail.body.trim(), '', `${mail.id}: 本文`)
      assert.notEqual(mail.date.trim(), '', `${mail.id}: 日付`)
    }
  })

  it('差出人に選べるアカウントが 1 つ以上ある', () => {
    assert.ok(accounts.length >= 1)
  })
})
