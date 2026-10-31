import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { restoreMail } from './mail-list.ts'
import { makeMail } from './test-helpers.ts'

/**
 * id の並びで一覧を表す。
 *
 * list:: メールの一覧
 * 戻り値:: id の配列
 */
const ids = (list: { id: string }[]) => list.map((m) => m.id)

describe('restoreMail', () => {
  const a = makeMail({ id: 'a' })
  const b = makeMail({ id: 'b' })
  const c = makeMail({ id: 'c' })

  it('取り除く前の位置に戻す', () => {
    assert.deepEqual(ids(restoreMail([a, c], b, 1)), ['a', 'b', 'c'])
  })

  it('先頭にも戻せる', () => {
    assert.deepEqual(ids(restoreMail([b, c], a, 0)), ['a', 'b', 'c'])
  })

  it('元の位置が一覧の長さを超えていれば末尾に戻す', () => {
    assert.deepEqual(ids(restoreMail([a], c, 5)), ['a', 'c'])
  })

  it('空の一覧にも戻せる', () => {
    assert.deepEqual(ids(restoreMail([], a, 0)), ['a'])
  })

  it('すでに一覧にあるメールは重ねて戻さず、元の一覧をそのまま返す', () => {
    const list = [a, b]
    assert.equal(restoreMail(list, b, 0), list)
  })

  it('元の一覧は書き換えない', () => {
    const list = [a, c]
    restoreMail(list, b, 1)
    assert.deepEqual(ids(list), ['a', 'c'])
  })
})
