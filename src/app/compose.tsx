import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { IconButton, Screen } from '@/components/ui'
import { Spacing } from '@/constants/theme'
import { accounts, type Mail } from '@/data/mails'
import { useTheme } from '@/hooks/use-theme'
import { useMailStore } from '@/state/mail-store'

type ComposeMode = 'new' | 'reply' | 'replyAll' | 'forward'

/** 簡易的なメールアドレス形式チェック（プロトタイプ用） */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 返信・転送のときに、宛先・件名・本文の初期値を作る。
 *
 * mode:: 作成の種類
 * source:: 返信・転送の元メール（新規なら undefined）
 * 戻り値:: 初期値（to, subject, body）
 */
const initialDraft = (mode: ComposeMode, source: Mail | undefined) => {
  if (!source || mode === 'new') {
    return { to: [] as string[], subject: '', body: '' }
  }
  const quoted = `\n\n---- ${source.time} ${source.fromName} <${source.fromAddress}> ----\n${source.body}`
  if (mode === 'forward') {
    return { to: [] as string[], subject: `Fwd: ${source.subject}`, body: quoted }
  }
  return { to: [source.fromAddress], subject: `Re: ${source.subject}`, body: quoted }
}

const modeTitle: Record<ComposeMode, string> = {
  new: '新規メッセージ',
  reply: '返信',
  replyAll: '全員に返信',
  forward: '転送',
}

/**
 * ラベルと入力欄を並べた 1 行。
 *
 * label:: 左側のラベル
 * children:: 入力欄など
 * 戻り値:: 行要素
 */
const FieldRow = ({ label, children }: { label: string, children: ReactNode }) => {
  const theme = useTheme()
  return (
    <View style={[styles.fieldRow, { borderBottomColor: theme.border }]}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={styles.fieldBody}>{children}</View>
    </View>
  )
}

/**
 * メール作成画面。宛先（チップ）、差出人（アカウント切り替え）、件名、本文を入力する。
 * 送信はデモで、実際には送信しない。
 *
 * 戻り値:: 画面要素
 */
const ComposeScreen = () => {
  const theme = useTheme()
  const params = useLocalSearchParams<{ mode?: ComposeMode, source?: string }>()
  const mode: ComposeMode = params.mode ?? 'new'
  const { findMail, showSnack } = useMailStore()
  const source = params.source ? findMail(params.source) : undefined
  const draft = useMemo(() => initialDraft(mode, source), [mode, source])

  const [to, setTo] = useState<string[]>(draft.to)
  const [toInput, setToInput] = useState('')
  const [toError, setToError] = useState<string | null>(null)
  const [from, setFrom] = useState(accounts[0])
  const [fromOpen, setFromOpen] = useState(false)
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const dirty = (
    toInput !== '' ||
    to.join(',') !== draft.to.join(',') ||
    subject !== draft.subject ||
    body !== draft.body
  )

  const close = () => {
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace('/')
    }
  }

  /**
   * 入力中の宛先をチップとして確定する。
   *
   * raw:: 確定する入力文字列（省略時は入力欄の現在値）
   * 戻り値:: 確定後の宛先一覧。形式が正しくなければ null
   */
  const commitToInput = (raw: string = toInput) => {
    const value = raw.trim().replace(/[,、]+$/, '').trim()
    if (!value) {
      setToInput('')
      return to
    }
    if (!EMAIL_PATTERN.test(value)) {
      setToInput(value)
      setToError(`「${value}」はメールアドレスの形式ではありません`)
      return null
    }
    const next = to.includes(value) ? to : [...to, value]
    setTo(next)
    setToInput('')
    setToError(null)
    return next
  }

  const send = () => {
    const recipients = commitToInput()
    if (!recipients) {
      return
    }
    if (recipients.length === 0) {
      setToError('宛先を入力してください')
      return
    }
    showSnack(`${from.address} から ${recipients.join('、')} へ送信しました（デモのため実際には送信されません）`)
    close()
  }

  const notImplemented = (name: string) => showSnack(`${name}はプロトタイプでは未実装です`)

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <IconButton glyph="×" label="閉じる" size={26} onPress={() => (dirty ? setConfirmDiscard(true) : close())} />
        <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">{modeTitle[mode]}</Text>
        <IconButton glyph="⋮" label="その他" onPress={() => notImplemented('その他の操作')} />
      </View>

      {confirmDiscard && (
        <View style={[styles.confirm, { backgroundColor: theme.alertBackground, borderColor: theme.alertBorder }]} accessibilityRole="alert">
          <Text style={{ color: theme.alertText, flex: 1 }}>入力中の内容を破棄して閉じますか？</Text>
          <Pressable accessibilityRole="button" onPress={() => setConfirmDiscard(false)} hitSlop={8}>
            <Text style={{ color: theme.text, fontWeight: '600' }}>編集を続ける</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={close} hitSlop={8}>
            <Text style={{ color: theme.danger, fontWeight: '700' }}>破棄</Text>
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          <FieldRow label="宛先">
            <View style={styles.chips}>
              {to.map((address) => (
                <View key={address} style={[styles.chip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={{ color: theme.text }}>{address}</Text>
                  <IconButton
                    glyph="×"
                    label={`${address} を宛先から外す`}
                    size={14}
                    color={theme.textSecondary}
                    onPress={() => setTo(to.filter((a) => a !== address))}
                    style={styles.chipRemove}
                  />
                </View>
              ))}
              <TextInput
                value={toInput}
                onChangeText={(text) => {
                  setToError(null)
                  // 区切り文字（カンマ・読点・空白）を打ったら、そこまでを宛先として確定する
                  if (/[,、\s]$/.test(text) && text.trim()) {
                    commitToInput(text)
                  } else {
                    setToInput(text)
                  }
                }}
                onSubmitEditing={() => commitToInput()}
                onBlur={() => {
                  if (toInput.trim()) {
                    commitToInput()
                  }
                }}
                placeholder={to.length === 0 ? 'name@example.jp' : ''}
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="宛先を追加"
                style={[styles.toInput, { color: theme.text }]}
              />
            </View>
            <IconButton glyph="⊕" label="宛先を追加" color={theme.textSecondary} onPress={() => commitToInput()} />
          </FieldRow>
          {toError && <Text style={[styles.error, { color: theme.danger }]} accessibilityRole="alert">{toError}</Text>}

          <FieldRow label="差出人">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`差出人: ${from.label} ${from.address}。押すと切り替え`}
              accessibilityState={{ expanded: fromOpen }}
              onPress={() => setFromOpen((v) => !v)}
              style={styles.fromButton}
            >
              <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>{from.label} &lt;{from.address}&gt;</Text>
              <Text style={{ color: theme.textSecondary }}>{fromOpen ? '︿' : '﹀'}</Text>
            </Pressable>
          </FieldRow>
          {fromOpen && (
            <View style={[styles.fromMenu, { borderBottomColor: theme.border }]}>
              {accounts.map((account) => {
                const selected = account.address === from.address
                return (
                  <Pressable
                    key={account.address}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setFrom(account)
                      setFromOpen(false)
                    }}
                    style={[styles.fromOption, selected && { backgroundColor: theme.surface }]}
                  >
                    <Text style={{ color: theme.text }}>{selected ? '✓ ' : '　'}{account.label} &lt;{account.address}&gt;</Text>
                  </Pressable>
                )
              })}
            </View>
          )}

          <FieldRow label="件名">
            <TextInput
              value={subject}
              onChangeText={setSubject}
              accessibilityLabel="件名"
              style={[styles.input, { color: theme.text }]}
            />
          </FieldRow>

          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            placeholder="本文を入力"
            placeholderTextColor={theme.textMuted}
            accessibilityLabel="本文"
            style={[styles.body, { color: theme.text }]}
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={[styles.toolbar, { borderTopColor: theme.border }]}>
          <IconButton glyph="📎" label="ファイルを添付" size={20} onPress={() => notImplemented('ファイルの添付')} />
          <IconButton glyph="🖼" label="画像を挿入" size={20} onPress={() => notImplemented('画像の挿入')} />
          <IconButton glyph="☺" label="絵文字" onPress={() => notImplemented('絵文字の入力')} />
          <IconButton glyph="A" label="書式" onPress={() => notImplemented('書式の設定')} />
          <View style={styles.flex} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${from.address} から送信`}
            onPress={send}
            style={({ pressed }) => [styles.send, { backgroundColor: pressed ? theme.surfaceSelected : theme.accent }]}
          >
            <Text style={[styles.sendGlyph, { color: theme.onAccent }]}>➤</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  confirm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    margin: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: 8,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldLabel: {
    width: 48,
    fontSize: 14,
  },
  fieldBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chips: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingLeft: Spacing.md,
  },
  chipRemove: {
    minWidth: 28,
    minHeight: 28,
  },
  toInput: {
    flexGrow: 1,
    minWidth: 120,
    fontSize: 16,
    paddingVertical: Spacing.xs,
  },
  error: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    fontSize: 13,
  },
  fromButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  fromMenu: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fromOption: {
    paddingHorizontal: Spacing.lg + 48 + Spacing.md,
    paddingVertical: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.md,
  },
  body: {
    minHeight: 200,
    fontSize: 16,
    lineHeight: 26,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  send: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGlyph: {
    fontSize: 22,
  },
})

export default ComposeScreen
