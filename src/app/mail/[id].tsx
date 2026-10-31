import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { Avatar, IconButton, Screen } from '@/components/ui'
import { Spacing } from '@/constants/theme'
import { initialMails, type Mail } from '@/data/mails'
import { useTheme } from '@/hooks/use-theme'
import { useMailStore } from '@/state/mail-store'

/** 絵文字リアクション（探索的な案）で選べる絵文字 */
const reactionChoices = ['👍', '🙏', '😊', '🎉', '👀']

/**
 * Web 向けの静的書き出しで、メールごとの HTML を生成するための ID 一覧。
 *
 * 戻り値:: ルートのパラメータの配列
 */
export const generateStaticParams = async () => initialMails.map((m) => ({ id: m.id }))

/**
 * 一覧へ戻る。履歴がなければ（URL を直接開いた場合）受信トレイへ移動する。
 */
const goBack = () => {
  if (router.canGoBack()) {
    router.back()
  } else {
    router.replace('/')
  }
}

/**
 * メールが見つからないとき（アーカイブ・削除済み、不正な URL）の画面。
 *
 * 戻り値:: 画面要素
 */
const MissingMail = () => {
  const theme = useTheme()
  return (
    <Screen>
      <View style={styles.toolbar}>
        <IconButton glyph="←" label="戻る" onPress={goBack} />
      </View>
      <View style={styles.missing}>
        <Text style={[styles.missingTitle, { color: theme.text }]}>メールが見つかりません</Text>
        <Text style={{ color: theme.textSecondary }}>アーカイブまたは削除された可能性があります。</Text>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/')}>
          <Text style={{ color: theme.accent, fontWeight: '600' }}>受信トレイへ戻る</Text>
        </Pressable>
      </View>
    </Screen>
  )
}

/**
 * 上部のツールバー（戻る・アーカイブ・削除・未読にする・その他）。
 * アーカイブ・削除・未読にするは、操作のあと一覧へ戻る。
 *
 * mail:: 表示中のメール
 * 戻り値:: ツールバーの要素
 */
const DetailToolbar = ({ mail }: { mail: Mail }) => {
  const { archive, remove, setUnread, showSnack, source } = useMailStore()

  /**
   * 操作を実行してから一覧へ戻る処理を作る。
   *
   * action:: 実行する操作
   * 戻り値:: ボタンの onPress に渡す関数
   */
  const thenBack = (action: () => void) => () => {
    action()
    goBack()
  }

  return (
    <View style={styles.toolbar}>
      <IconButton glyph="←" label="戻る" onPress={goBack} />
      <View style={styles.toolbarActions}>
        <IconButton glyph="▤" label="アーカイブ" onPress={thenBack(() => archive(mail.id))} />
        <IconButton glyph="🗑" label="削除" size={20} onPress={thenBack(() => remove(mail.id))} />
        <IconButton glyph="✉" label="未読にする" onPress={thenBack(() => {
          setUnread(mail.id, true)
          if (source !== 'gmail') showSnack(`「${mail.subject}」を未読にしました`)
        })} />
        <IconButton glyph="⋮" label="その他" onPress={() => showSnack('その他の操作はプロトタイプでは未実装です')} />
      </View>
    </View>
  )
}

/**
 * 送信者の欄（アバター、名前、受信日時、アドレス、宛先）。
 *
 * mail:: 表示中のメール
 * 戻り値:: 送信者の欄の要素
 */
const SenderInfo = ({ mail }: { mail: Mail }) => {
  const theme = useTheme()
  return (
    <View style={[styles.sender, { borderBottomColor: theme.border }]}>
      <Avatar name={mail.fromName} />
      <View style={styles.senderTexts}>
        <View style={styles.senderLine}>
          <Text style={[styles.senderName, { color: theme.text }]} numberOfLines={1}>{mail.fromName}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>{mail.time}</Text>
        </View>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{mail.fromAddress}</Text>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>宛先：{mail.to}</Text>
      </View>
    </View>
  )
}

/**
 * 絵文字リアクションの選択欄（試作の機能）。
 *
 * onPick:: 絵文字を選んだときの処理（引数は選んだ絵文字）
 * 戻り値:: 選択欄の要素
 */
const ReactionPicker = ({ onPick }: { onPick: (emoji: string) => void }) => {
  const theme = useTheme()
  return (
    <View style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={{ color: theme.textSecondary, fontSize: 12 }}>絵文字で反応（試作の機能です）</Text>
      <View style={styles.pickerRow}>
        {reactionChoices.map((emoji) => (
          <Pressable
            key={emoji}
            accessibilityRole="button"
            accessibilityLabel={`${emoji} で反応`}
            onPress={() => onPick(emoji)}
            style={styles.pickerItem}
          >
            <Text style={{ fontSize: 26 }}>{emoji}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

type ReplyButtonProps = {
  glyph: string
  label: string
  onPress: () => void
}

/**
 * 画面下部の返信・転送ボタン。
 *
 * glyph:: アイコンとして表示する記号
 * label:: ボタンの文字
 * onPress:: 押したときの処理
 * 戻り値:: ボタン要素
 */
const ReplyButton = ({ glyph, label, onPress }: ReplyButtonProps) => {
  const theme = useTheme()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.replyButton,
        { borderColor: theme.border, backgroundColor: pressed ? theme.surfaceSelected : theme.background },
      ]}
    >
      <Text style={{ color: theme.text }}>{glyph}</Text>
      <Text style={[styles.replyLabel, { color: theme.text }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  )
}

type ReplyBarProps = {
  mailId: string
  pickerOpen: boolean
  onTogglePicker: () => void
}

/**
 * 画面下部の返信バー（返信・全員に返信・転送と、絵文字リアクションの開閉）。
 *
 * mailId:: 返信・転送の元にするメールの ID
 * pickerOpen:: 絵文字の選択欄が開いているか
 * onTogglePicker:: 絵文字の選択欄を開閉する処理
 * 戻り値:: 返信バーの要素
 */
const ReplyBar = ({ mailId, pickerOpen, onTogglePicker }: ReplyBarProps) => {
  const theme = useTheme()
  const openCompose = (mode: 'reply' | 'replyAll' | 'forward') => {
    router.push({ pathname: '/compose', params: { mode, source: mailId } })
  }
  return (
    <View style={[styles.replyBar, { borderTopColor: theme.border }]}>
      <ReplyButton glyph="↩" label="返信" onPress={() => openCompose('reply')} />
      <ReplyButton glyph="⇇" label="全員に返信" onPress={() => openCompose('replyAll')} />
      <ReplyButton glyph="↪" label="転送" onPress={() => openCompose('forward')} />
      <IconButton
        glyph="☺"
        label={pickerOpen ? '絵文字の選択を閉じる' : '絵文字で反応'}
        onPress={onTogglePicker}
        style={[styles.emojiButton, { borderColor: theme.border }]}
      />
    </View>
  )
}

/**
 * メール詳細画面。件名・送信者・本文と、アーカイブ・削除・返信などの操作を持つ。
 *
 * 戻り値:: 画面要素
 */
const MailDetailScreen = () => {
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const { findMail, toggleStar, setUnread, reactions, setReaction, source } = useMailStore()
  const [pickerOpen, setPickerOpen] = useState(false)
  const mail = findMail(id)
  const reaction = reactions[id]

  // 開いたメールは既読にする
  useEffect(() => {
    // Gmail は読み取り専用なので、開いても Gmail 側の既読は変わらない。画面だけ既読にして食い違わせない
    if (mail?.unread && source !== 'gmail') {
      setUnread(mail.id, false)
    }
    // 開いた時点で 1 回だけ既読にする（あとで「未読にする」を押した状態を上書きしない）
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!mail) return <MissingMail />
  const subjectColor = mail.alert ? theme.alertText : theme.text

  return (
    <Screen>
      <DetailToolbar mail={mail} />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.subjectLine}>
          <Text style={[styles.subject, { color: subjectColor }]} accessibilityRole="header">
            {mail.subject}
          </Text>
          <IconButton
            glyph={mail.starred ? '★' : '☆'}
            label={mail.starred ? 'スターを外す' : 'スターを付ける'}
            color={mail.starred ? theme.star : theme.textMuted}
            onPress={() => toggleStar(mail.id)}
          />
        </View>

        {mail.alert && (
          <View
            style={[styles.alertBanner, { backgroundColor: theme.alertBackground, borderColor: theme.alertBorder }]}
          >
            <Text style={{ color: theme.alertText, fontWeight: '700' }}>⚠ 重要な通知</Text>
            <Text style={{ color: theme.alertText }}>リンクを開く前に、送信元のアドレスを確認してください。</Text>
          </View>
        )}

        <SenderInfo mail={mail} />

        <Text style={[styles.body, { color: theme.text }]} selectable>{mail.body}</Text>

        {mail.hasAttachment && (
          <View style={[styles.attachment, { borderColor: theme.border }]}>
            <Text style={{ color: theme.text }}>📎 添付ファイル（ダミー）.pdf</Text>
          </View>
        )}

        {reaction && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`あなたのリアクション ${reaction}。押すと取り消します`}
            onPress={() => setReaction(mail.id, null)}
            style={[styles.reactionChip, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={{ fontSize: 18 }}>{reaction}</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>あなた（試作）</Text>
          </Pressable>
        )}
      </ScrollView>

      {pickerOpen && (
        <ReactionPicker onPick={(emoji) => {
          setReaction(mail.id, emoji)
          setPickerOpen(false)
        }} />
      )}
      <ReplyBar mailId={mail.id} pickerOpen={pickerOpen} onTogglePicker={() => setPickerOpen((v) => !v)} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  subjectLine: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  subject: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
  },
  alertBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  sender: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingBottom: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  senderTexts: {
    flex: 1,
    gap: 2,
  },
  senderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  senderName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    fontSize: 16,
    lineHeight: 28,
    paddingTop: Spacing.lg,
  },
  attachment: {
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.md,
  },
  reactionChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  picker: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pickerItem: {
    padding: Spacing.xs,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  replyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
  },
  replyLabel: {
    fontSize: 13,
  },
  emojiButton: {
    borderWidth: 1,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  missingTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
})

export default MailDetailScreen
