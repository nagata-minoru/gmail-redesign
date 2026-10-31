import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Spacing } from '@/constants/theme'
import { useTheme } from '@/hooks/use-theme'
import { clientId, isGmailSupported } from '@/lib/gmail-auth'
import { useMailStore } from '@/state/mail-store'

/**
 * アカウントの状態と、Gmail への読み取り専用の接続・解除を扱うパネル。
 * 接続前に、求める権限と保存しないものを説明する。
 *
 * onClose:: パネルを閉じる処理
 * 戻り値:: パネルの要素
 */
export const GmailPanel = ({ onClose }: { onClose: () => void }) => {
  const theme = useTheme()
  const { source, gmailAddress, gmailStatus, gmailError, connectGmail, disconnectGmail } = useMailStore()
  const loading = gmailStatus === 'loading'
  const connected = source === 'gmail'
  const textColor = { color: theme.text }
  const mutedColor = { color: theme.textSecondary }

  /**
   * 解除ボタン・接続ボタンの共通の見た目で、ボタンを描く。
   *
   * label:: ボタンの文言
   * onPress:: 押したときの処理
   * disabled:: 押せないときは true
   * 戻り値:: ボタンの要素
   */
  const button = (label: string, onPress: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { borderColor: theme.border, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={[styles.buttonLabel, { color: theme.accent }]}>{label}</Text>
    </Pressable>
  )

  return (
    <View style={[styles.panel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.title, textColor]}>
        {connected ? `Gmail に接続中: ${gmailAddress}` : 'ダミーデータを表示中'}
      </Text>
      <Text style={[styles.body, mutedColor]}>
        読み取り専用（gmail.readonly）で受信トレイの新しい 20 件だけを読みます。送信・削除・アーカイブ・スター・
        既読の変更は Gmail に反映されません。アクセストークンはこのタブのメモリにだけ置き、ディスクには保存しません。
        タブを閉じるか接続を解除すると消えます。
      </Text>
      {gmailError && (
        <Text style={[styles.body, { color: theme.alertText }]} accessibilityRole="alert">{gmailError}</Text>
      )}
      {!isGmailSupported() && (
        <Text style={[styles.body, mutedColor]}>Gmail への接続は Web 版のみ対応しています。</Text>
      )}
      {isGmailSupported() && !clientId() && (
        <Text style={[styles.body, mutedColor]}>
          クライアント ID が未設定です。README の手順で .env.local に EXPO_PUBLIC_GOOGLE_CLIENT_ID を設定してください。
        </Text>
      )}
      <View style={styles.actions}>
        {isGmailSupported() && !!clientId() && !connected &&
          button(loading ? '接続中…' : 'Gmail に接続（読み取り専用）', connectGmail, loading)}
        {connected && button('接続を解除してダミーに戻す', disconnectGmail)}
        {button('閉じる', onClose)}
      </View>
    </View>
  )
}

/**
 * 受信トレイの上に常に出す、Gmail 接続の帯。どこを押せば接続できるかを示し、1 回押すだけで接続する。
 * クライアント ID が未設定の環境（公開中のダミー版など）や Web 以外では何も出さない。
 *
 * onDetails:: 説明・解除のパネルを開く処理
 * 戻り値:: 帯の要素。表示しない環境では null
 */
export const GmailConnectBar = ({ onDetails }: { onDetails: () => void }) => {
  const theme = useTheme()
  const { source, gmailAddress, gmailStatus, connectGmail } = useMailStore()
  if (!isGmailSupported() || !clientId()) return null
  const connected = source === 'gmail'
  const loading = gmailStatus === 'loading'
  const label = connected ? `Gmail: ${gmailAddress}（読み取り専用）` : 'ダミーデータを表示中'

  /**
   * 帯の中の小さなボタンを描く。
   *
   * text:: ボタンの文言
   * onPress:: 押したときの処理
   * disabled:: 押せないときは true
   * 戻り値:: ボタンの要素
   */
  const barButton = (text: string, onPress: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.barButton, { borderColor: theme.border, opacity: disabled ? 0.5 : 1 }]}
    >
      <Text style={[styles.barButtonLabel, { color: theme.accent }]}>{text}</Text>
    </Pressable>
  )

  return (
    <View style={[styles.bar, { borderBottomColor: theme.border }]}>
      <Text style={[styles.barText, { color: theme.textSecondary }]} numberOfLines={1}>{label}</Text>
      {!connected && barButton(loading ? '接続中…' : 'Gmail を読む', connectGmail, loading)}
      {barButton('詳細', onDetails)}
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barText: {
    flex: 1,
    fontSize: 13,
  },
  barButton: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  barButtonLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  panel: {
    marginHorizontal: Spacing.sm,
    padding: Spacing.lg,
    borderWidth: 1,
    borderRadius: 16,
    gap: Spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  button: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
})
