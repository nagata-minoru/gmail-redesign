import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useState, type ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

import { IconButton, Screen } from '@/components/ui'
import { Spacing } from '@/constants/theme'
import { accounts, type Account } from '@/data/mails'
import { useTheme } from '@/hooks/use-theme'
import { initialDraft, isValidAddress, normalizeAddress, type ComposeMode } from '@/lib/draft'
import { useMailStore } from '@/state/mail-store'

const modeTitle: Record<ComposeMode, string> = {
  new: '新規メッセージ',
  reply: '返信',
  replyAll: '全員に返信',
  forward: '転送',
}

/**
 * 作成画面を閉じる。履歴がなければ（URL を直接開いた場合）受信トレイへ移動する。
 */
const close = () => {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace('/')
  }
}

/**
 * 宛先（チップ）の入力状態と、その操作をまとめたフック。
 *
 * initial:: 宛先の初期値
 * 戻り値:: 宛先一覧（to）、入力中の文字列（input）、エラー（error）と、それらを操作する関数
 */
const useRecipients = (initial: string[]) => {
  const [to, setTo] = useState(initial)
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  /**
   * 入力中の宛先をチップとして確定する。
   *
   * raw:: 確定する入力文字列（省略時は入力欄の現在値）
   * 戻り値:: 確定後の宛先一覧。形式が正しくなければ null
   */
  const commit = (raw: string = input) => {
    const value = normalizeAddress(raw)
    if (!value) {
      setInput('')
      return to
    }
    if (!isValidAddress(value)) {
      setInput(value)
      setError(`「${value}」はメールアドレスの形式ではありません`)
      return null
    }
    const next = to.includes(value) ? to : [...to, value]
    setTo(next)
    setInput('')
    setError(null)
    return next
  }

  /**
   * 入力欄の変更を受け取る。区切り文字（カンマ・読点・空白）を打ったら、そこまでを宛先として確定する。
   *
   * text:: 入力欄の新しい値
   */
  const changeText = (text: string) => {
    setError(null)
    if (/[,、\s]$/.test(text) && text.trim()) {
      commit(text)
    } else {
      setInput(text)
    }
  }

  /**
   * 入力欄からフォーカスが外れたとき、入力途中の宛先があれば確定する。
   */
  const blur = () => {
    if (input.trim()) {
      commit()
    }
  }

  /**
   * 宛先をチップから外す。
   *
   * address:: 外すメールアドレス
   */
  const removeAddress = (address: string) => setTo(to.filter((a) => a !== address))

  return { to, input, error, setError, commit, changeText, blur, removeAddress }
}

type Recipients = ReturnType<typeof useRecipients>

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
 * 宛先欄。確定した宛先をチップで並べ、その後ろで次の宛先を入力する。
 *
 * recipients:: useRecipients の戻り値
 * 戻り値:: 宛先欄とエラー表示の要素
 */
const RecipientField = ({ recipients }: { recipients: Recipients }) => {
  const theme = useTheme()
  const { to, input, error, commit, changeText, blur, removeAddress } = recipients
  return (
    <>
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
                onPress={() => removeAddress(address)}
                style={styles.chipRemove}
              />
            </View>
          ))}
          <TextInput
            value={input}
            onChangeText={changeText}
            onSubmitEditing={() => commit()}
            onBlur={blur}
            placeholder={to.length === 0 ? 'name@example.jp' : ''}
            placeholderTextColor={theme.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="宛先を追加"
            style={[styles.toInput, { color: theme.text }]}
          />
        </View>
        <IconButton glyph="⊕" label="宛先を追加" color={theme.textSecondary} onPress={() => commit()} />
      </FieldRow>
      {error && <Text style={[styles.error, { color: theme.danger }]} accessibilityRole="alert">{error}</Text>}
    </>
  )
}

/**
 * 差出人欄。送信元アカウントを常に表示し、押すとアカウントの一覧を開いて切り替えられる。
 *
 * from:: 選択中のアカウント
 * onSelect:: アカウントを選んだときの処理
 * 戻り値:: 差出人欄の要素
 */
const FromField = ({ from, onSelect }: { from: Account, onSelect: (account: Account) => void }) => {
  const theme = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <>
      <FieldRow label="差出人">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`差出人: ${from.label} ${from.address}。押すと切り替え`}
          accessibilityState={{ expanded: open }}
          onPress={() => setOpen((v) => !v)}
          style={styles.fromButton}
        >
          <Text style={{ color: theme.text, flex: 1 }} numberOfLines={1}>{from.label} &lt;{from.address}&gt;</Text>
          <Text style={{ color: theme.textSecondary }}>{open ? '︿' : '﹀'}</Text>
        </Pressable>
      </FieldRow>
      {open && (
        <View style={[styles.fromMenu, { borderBottomColor: theme.border }]}>
          {accounts.map((account) => {
            const selected = account.address === from.address
            return (
              <Pressable
                key={account.address}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  onSelect(account)
                  setOpen(false)
                }}
                style={[styles.fromOption, selected && { backgroundColor: theme.surface }]}
              >
                <Text style={{ color: theme.text }}>
                  {selected ? '✓ ' : '　'}{account.label} &lt;{account.address}&gt;
                </Text>
              </Pressable>
            )
          })}
        </View>
      )}
    </>
  )
}

/**
 * 入力中に閉じようとしたときの、破棄の確認バー。
 *
 * onCancel:: 編集を続ける処理
 * onDiscard:: 破棄して閉じる処理
 * 戻り値:: 確認バーの要素
 */
const DiscardConfirm = ({ onCancel, onDiscard }: { onCancel: () => void, onDiscard: () => void }) => {
  const theme = useTheme()
  return (
    <View
      style={[styles.confirm, { backgroundColor: theme.alertBackground, borderColor: theme.alertBorder }]}
      accessibilityRole="alert"
    >
      <Text style={{ color: theme.alertText, flex: 1 }}>入力中の内容を破棄して閉じますか？</Text>
      <Pressable accessibilityRole="button" onPress={onCancel} hitSlop={8}>
        <Text style={{ color: theme.text, fontWeight: '600' }}>編集を続ける</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onDiscard} hitSlop={8}>
        <Text style={{ color: theme.danger, fontWeight: '700' }}>破棄</Text>
      </Pressable>
    </View>
  )
}

/** 下部ツールバーの、プロトタイプでは未実装の操作 */
const pendingTools = [{
  glyph: '📎', label: 'ファイルを添付', feature: 'ファイルの添付', size: 20,
}, {
  glyph: '🖼', label: '画像を挿入', feature: '画像の挿入', size: 20,
}, {
  glyph: '☺', label: '絵文字', feature: '絵文字の入力', size: undefined,
}, {
  glyph: 'A', label: '書式', feature: '書式の設定', size: undefined,
}]

type ComposeToolbarProps = {
  fromAddress: string
  onSend: () => void
  onNotImplemented: (feature: string) => void
}

/**
 * キーボードのすぐ上に置く下部ツールバー（添付・画像・絵文字・書式と送信）。
 *
 * fromAddress:: 送信元のメールアドレス（送信ボタンの読み上げに使う）
 * onSend:: 送信ボタンを押したときの処理
 * onNotImplemented:: 未実装の操作を押したときの処理（引数は操作の名前）
 * 戻り値:: ツールバーの要素
 */
const ComposeToolbar = ({ fromAddress, onSend, onNotImplemented }: ComposeToolbarProps) => {
  const theme = useTheme()
  return (
    <View style={[styles.toolbar, { borderTopColor: theme.border }]}>
      {pendingTools.map((tool) => (
        <IconButton
          key={tool.glyph}
          glyph={tool.glyph}
          label={tool.label}
          size={tool.size}
          onPress={() => onNotImplemented(tool.feature)}
        />
      ))}
      <View style={styles.flex} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${fromAddress} から送信`}
        onPress={onSend}
        style={({ pressed }) => [styles.send, { backgroundColor: pressed ? theme.surfaceSelected : theme.accent }]}
      >
        <Text style={[styles.sendGlyph, { color: theme.onAccent }]}>➤</Text>
      </Pressable>
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

  const recipients = useRecipients(draft.to)
  const [from, setFrom] = useState(accounts[0])
  const [subject, setSubject] = useState(draft.subject)
  const [body, setBody] = useState(draft.body)
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  const dirty = (
    recipients.input !== '' ||
    recipients.to.join(',') !== draft.to.join(',') ||
    subject !== draft.subject ||
    body !== draft.body
  )

  const send = () => {
    const to = recipients.commit()
    if (!to) return
    if (to.length === 0) {
      recipients.setError('宛先を入力してください')
      return
    }
    showSnack(`${from.address} から ${to.join('、')} へ送信しました（デモのため実際には送信されません）`)
    close()
  }

  const notImplemented = (feature: string) => showSnack(`${feature}はプロトタイプでは未実装です`)

  return (
    <Screen>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <IconButton glyph="×" label="閉じる" size={26} onPress={() => (dirty ? setConfirmDiscard(true) : close())} />
        <Text style={[styles.title, { color: theme.text }]} accessibilityRole="header">{modeTitle[mode]}</Text>
        <IconButton glyph="⋮" label="その他" onPress={() => notImplemented('その他の操作')} />
      </View>

      {confirmDiscard && <DiscardConfirm onCancel={() => setConfirmDiscard(false)} onDiscard={close} />}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
          <RecipientField recipients={recipients} />
          <FromField from={from} onSelect={setFrom} />
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
        <ComposeToolbar fromAddress={from.address} onSend={send} onNotImplemented={notImplemented} />
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
