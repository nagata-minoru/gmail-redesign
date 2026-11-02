import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { clearToken, loadToken, saveToken, TOKEN_KEY } from './token-storage.ts'
import type { TokenStorage } from './token-storage.ts'

/**
 * テスト用の、メモリだけで動くストレージを作る。
 *
 * 戻り値:: Storage の一部と、中身を覗くための Map
 */
const memoryStorage = () => {
  const data = new Map<string, string>()
  const storage: TokenStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value) },
    removeItem: (key) => { data.delete(key) },
  }
  return { storage, data }
}

/** テスト用の、使うと必ず例外を投げるストレージ（プライベートモードなど） */
const brokenStorage: TokenStorage = {
  getItem: () => { throw new Error('blocked') },
  setItem: () => { throw new Error('blocked') },
  removeItem: () => { throw new Error('blocked') },
}

const NOW = 1_800_000_000_000

describe('token-storage', () => {
  it('保存したトークンを期限内なら読み出せる', () => {
    const { storage } = memoryStorage()
    saveToken(storage, 'dummy-token', 3599, NOW)
    assert.equal(loadToken(storage, NOW + 30 * 60 * 1000), 'dummy-token')
  })

  it('期限切れと期限間近（1 分以内）のトークンは捨てる', () => {
    const { storage, data } = memoryStorage()
    saveToken(storage, 'dummy-token', 3600, NOW)
    assert.equal(loadToken(storage, NOW + 3600 * 1000 - 30 * 1000), null)
    assert.equal(data.has(TOKEN_KEY), false)
  })

  it('期限が分からないときは 1 時間とみなす', () => {
    const { storage } = memoryStorage()
    saveToken(storage, 'dummy-token', undefined, NOW)
    assert.equal(loadToken(storage, NOW + 50 * 60 * 1000), 'dummy-token')
    assert.equal(loadToken(storage, NOW + 60 * 60 * 1000), null)
  })

  it('壊れた値は捨てる', () => {
    const { storage, data } = memoryStorage()
    data.set(TOKEN_KEY, '{not json')
    assert.equal(loadToken(storage, NOW), null)
    assert.equal(data.has(TOKEN_KEY), false)
    data.set(TOKEN_KEY, JSON.stringify({ token: '', expiresAt: NOW + 3600 * 1000 }))
    assert.equal(loadToken(storage, NOW), null)
  })

  it('消したトークンは読み出せない', () => {
    const { storage } = memoryStorage()
    saveToken(storage, 'dummy-token', 3600, NOW)
    clearToken(storage)
    assert.equal(loadToken(storage, NOW), null)
  })

  it('ストレージが使えなくても例外を出さない', () => {
    assert.doesNotThrow(() => saveToken(brokenStorage, 'dummy-token', 3600, NOW))
    assert.doesNotThrow(() => clearToken(brokenStorage))
    assert.equal(loadToken(brokenStorage, NOW), null)
    assert.equal(loadToken(null, NOW), null)
  })
})
