import { type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { MaxContentWidth, Spacing } from '@/constants/theme'
import { useTheme } from '@/hooks/use-theme'

/**
 * 画面全体の入れ物。セーフエリアを避け、Web の広い画面ではスマホ幅に収める。
 *
 * children:: 画面の中身
 * 戻り値:: 画面の入れ物となる要素
 */
export const Screen = ({ children }: { children: ReactNode }) => {
  const theme = useTheme()
  return (
    <View style={[styles.outer, { backgroundColor: theme.surface }]}>
      <SafeAreaView style={[styles.inner, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        {children}
      </SafeAreaView>
    </View>
  )
}

type IconButtonProps = {
  /** アイコンとして表示する文字（Unicode の記号） */
  glyph: string
  /** 読み上げ・ツールチップ用の名前 */
  label: string
  onPress: () => void
  color?: string
  size?: number
  style?: StyleProp<ViewStyle>
}

/**
 * 記号 1 文字で表すアイコンボタン。
 * 公式アイコンを使わず、独自のプレースホルダーとして記号を使う。
 *
 * glyph:: 表示する記号
 * label:: アクセシビリティ用のラベル
 * onPress:: 押したときの処理
 * color:: 記号の色（省略時は本文色）
 * size:: 記号の大きさ（省略時は 22）
 * style:: 追加のスタイル
 * 戻り値:: ボタン要素
 */
export const IconButton = ({ glyph, label, onPress, color, size = 22, style }: IconButtonProps) => {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: theme.surfaceSelected }, style]}
    >
      <Text style={{ color: color ?? theme.text, fontSize: size, lineHeight: size + 4 }}>{glyph}</Text>
    </Pressable>
  )
}

/**
 * 送信者の頭文字を丸の中に表示するアバター。
 *
 * name:: 送信者名
 * size:: 直径（省略時は 40）
 * 戻り値:: アバター要素
 */
export const Avatar = ({ name, size = 40 }: { name: string, size?: number }) => {
  const theme = useTheme()
  const shape = { width: size, height: size, borderRadius: size / 2 }
  return (
    <View
      style={[styles.avatar, shape, { backgroundColor: theme.surfaceSelected }]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Text style={{ color: theme.textSecondary, fontSize: size * 0.42, fontWeight: '600' }}>{name.slice(0, 1)}</Text>
    </View>
  )
}

/**
 * 非公式のコンセプトであることを伝える 1 行の注記。
 * 公開中のプロトタイプを Google の公式機能と誤解されないよう、受信トレイの上端に置く。
 * 画面の外側（surface）と同じ色だと帯として見えないため、一段濃い surfaceSelected を背景にする。
 *
 * 戻り値:: 注記の要素
 */
export const ConceptNotice = () => {
  const theme = useTheme()
  return (
    <View style={[styles.notice, { backgroundColor: theme.surfaceSelected }]} accessibilityRole="text">
      <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
        非公式のデザインコンセプト・Google とは無関係・データはダミー
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  notice: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  noticeText: {
    fontSize: 12,
    textAlign: 'center',
  },
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  iconButton: {
    minWidth: 40,
    minHeight: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
