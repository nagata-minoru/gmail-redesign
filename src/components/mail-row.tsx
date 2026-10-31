import { Link } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'

import { IconButton, Avatar } from '@/components/ui'
import { Spacing } from '@/constants/theme'
import type { Mail } from '@/data/mails'
import { useTheme } from '@/hooks/use-theme'

type MailRowProps = {
  mail: Mail
  onToggleStar: (id: string) => void
  onArchive: (id: string) => void
}

/**
 * スワイプした行の下から現れるアーカイブ操作。
 *
 * 戻り値:: 操作の表示要素
 */
const ArchiveAction = () => {
  const theme = useTheme()
  return (
    <View style={[styles.swipeAction, { backgroundColor: theme.swipeArchive }]}>
      <Text style={[styles.swipeGlyph, { color: theme.onSwipe }]}>▤</Text>
      <Text style={[styles.swipeLabel, { color: theme.onSwipe }]}>アーカイブ</Text>
    </View>
  )
}

/**
 * 受信トレイの 1 行。
 * 左にスワイプするとアーカイブ、スターは行を開かずに切り替えられる。
 * アラート（セキュリティ通知など）と未読は、色だけに頼らず記号と文字でも区別する。
 *
 * mail:: 表示するメール
 * onToggleStar:: スターを切り替える処理
 * onArchive:: アーカイブする処理
 * 戻り値:: 行要素
 */
export const MailRow = ({ mail, onToggleStar, onArchive }: MailRowProps) => {
  const theme = useTheme()
  const weight = mail.unread ? '700' : '400'
  const rowBackground = mail.alert ? theme.alertBackground : theme.background

  return (
    <ReanimatedSwipeable
      friction={1.5}
      rightThreshold={72}
      overshootRight={false}
      renderRightActions={() => <ArchiveAction />}
      onSwipeableOpen={() => onArchive(mail.id)}
    >
      <View style={[styles.row, { backgroundColor: rowBackground, borderBottomColor: theme.border }]}>
        <Link href={{ pathname: '/mail/[id]', params: { id: mail.id } }} asChild>
          <Pressable
            style={styles.main}
            accessibilityRole="link"
            accessibilityLabel={`${mail.unread ? '未読、' : ''}${mail.alert ? '重要な通知、' : ''}${mail.fromName}、${mail.subject}、${mail.date}`}
          >
            {mail.alert ? (
              <View style={[styles.alertIcon, { borderColor: theme.alertText }]}>
                <Text style={[styles.alertGlyph, { color: theme.alertText }]}>!</Text>
              </View>
            ) : (
              <Avatar name={mail.fromName} />
            )}
            <View style={styles.texts}>
              <View style={styles.firstLine}>
                {mail.unread && <View style={[styles.unreadDot, { backgroundColor: theme.unread }]} />}
                <Text style={[styles.from, { color: theme.text, fontWeight: weight }]} numberOfLines={1}>
                  {mail.fromName}
                </Text>
                <Text style={[styles.date, { color: mail.unread ? theme.text : theme.textMuted }]}>{mail.date}</Text>
              </View>
              <Text style={[styles.subject, { color: mail.alert ? theme.alertText : theme.text, fontWeight: weight }]} numberOfLines={1}>
                {mail.subject}
              </Text>
              <Text style={[styles.preview, { color: theme.textSecondary }]} numberOfLines={1}>
                {mail.hasAttachment ? '📎 ' : ''}{mail.preview}
              </Text>
              {mail.alert && (
                <View style={[styles.alertChip, { borderColor: theme.alertBorder }]}>
                  <Text style={[styles.alertChipText, { color: theme.alertText }]}>アラート</Text>
                </View>
              )}
            </View>
          </Pressable>
        </Link>
        <IconButton
          glyph={mail.starred ? '★' : '☆'}
          label={mail.starred ? 'スターを外す' : 'スターを付ける'}
          color={mail.starred ? theme.star : theme.textMuted}
          onPress={() => onToggleStar(mail.id)}
          style={styles.star}
        />
      </View>
    </ReanimatedSwipeable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingRight: Spacing.sm,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.lg,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  firstLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  from: {
    flex: 1,
    fontSize: 15,
  },
  date: {
    fontSize: 12,
  },
  subject: {
    fontSize: 15,
  },
  preview: {
    fontSize: 14,
  },
  star: {
    marginTop: Spacing.xl,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertGlyph: {
    fontSize: 20,
    fontWeight: '800',
  },
  alertChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  alertChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  swipeAction: {
    width: 104,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  swipeGlyph: {
    fontSize: 22,
  },
  swipeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
})
