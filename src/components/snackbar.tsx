import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { MaxContentWidth, Spacing } from '@/constants/theme'
import { useTheme } from '@/hooks/use-theme'
import { useMailStore } from '@/state/mail-store'

/** お知らせを自動で消すまでの時間（ミリ秒） */
const AUTO_DISMISS_MS = 5000

/**
 * 画面下部に操作結果を表示し、取り消しを提供するスナックバー。
 * アーカイブ・削除など元に戻しにくい操作の対象と結果を伝える。
 *
 * 戻り値:: スナックバー要素（表示するお知らせがなければ null）
 */
export const Snackbar = () => {
  const theme = useTheme()
  const { snack, dismissSnack } = useMailStore()

  useEffect(() => {
    if (!snack) {
      return
    }
    const timer = setTimeout(dismissSnack, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [snack, dismissSnack])

  if (!snack) {
    return null
  }

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View
        style={[styles.bar, { backgroundColor: theme.snackbar }]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Text style={[styles.message, { color: theme.onSnackbar }]} numberOfLines={2}>{snack.message}</Text>
        {snack.undo && (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              snack.undo?.()
              dismissSnack()
            }}
            hitSlop={8}
          >
            <Text style={[styles.action, { color: theme.snackbarAction }]}>元に戻す</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.xl,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth - Spacing.lg * 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
  },
  action: {
    fontSize: 14,
    fontWeight: '700',
  },
})
