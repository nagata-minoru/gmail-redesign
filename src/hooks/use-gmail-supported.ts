import { useSyncExternalStore } from 'react'

import { isGmailSupported } from '@/lib/gmail-auth'

/** 購読するものがないため、何もしない購読関数 */
const subscribe = () => () => {}

/**
 * この環境で Gmail に接続できるかを、描画に使える形で返す。
 * 静的書き出し（static rendering）のサーバ側では document がなく false になるため、
 * クライアントでも読み込み（hydration）が終わるまでは false とし、HTML との食い違いを防ぐ。
 *
 * 戻り値:: 接続できれば true
 */
export const useGmailSupported = () => useSyncExternalStore(subscribe, isGmailSupported, () => false)
