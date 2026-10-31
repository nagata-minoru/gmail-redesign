import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { Snackbar } from '@/components/snackbar'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { MailStoreProvider } from '@/state/mail-store'

/**
 * アプリ全体のレイアウト。
 * ジェスチャー（スワイプ）、テーマ、メールの状態、画面遷移のスタックをまとめて用意する。
 *
 * 戻り値:: ルートのレイアウト要素
 */
const RootLayout = () => {
  const colorScheme = useColorScheme()
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <MailStoreProvider>
          <Stack screenOptions={{ headerShown: false }} />
          <Snackbar />
          <StatusBar style="auto" />
        </MailStoreProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
})

export default RootLayout
