import { Colors, type ThemeColors } from '@/constants/theme'
import { useColorScheme } from '@/hooks/use-color-scheme'

/** 現在のカラースキーム（ライト／ダーク）に応じた色の一覧を返す */
export const useTheme = (): ThemeColors => {
  const scheme = useColorScheme()
  return scheme === 'dark' ? Colors.dark : Colors.light
}
