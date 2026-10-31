import { useSyncExternalStore } from 'react'
import { useColorScheme as useRNColorScheme } from 'react-native'

/** 購読するものがないため、何もしない購読関数 */
const subscribe = () => () => {}

/**
 * Web 用のカラースキーム取得。
 * 静的書き出し（static rendering）ではサーバ側で値が分からないため、
 * クライアントで読み込みが終わるまではライトとして扱う。
 *
 * 戻り値:: 'light' | 'dark' | null など、現在のカラースキーム
 */
export const useColorScheme = () => {
  const hasHydrated = useSyncExternalStore(subscribe, () => true, () => false)
  const colorScheme = useRNColorScheme()
  return hasHydrated ? colorScheme : 'light'
}
