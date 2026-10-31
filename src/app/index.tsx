import { Link } from 'expo-router'
import { useMemo, useState } from 'react'
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { MailRow } from '@/components/mail-row'
import { Avatar, IconButton, Screen } from '@/components/ui'
import { Spacing } from '@/constants/theme'
import { accounts, type Mail } from '@/data/mails'
import { useTheme } from '@/hooks/use-theme'
import { useMailStore } from '@/state/mail-store'

type FilterKey = 'all' | 'unread' | 'starred' | 'attachment'

const filters: { key: FilterKey, label: string }[] = [{
  key: 'all', label: 'すべて',
}, {
  key: 'unread', label: '未読',
}, {
  key: 'starred', label: 'スター付き',
}, {
  key: 'attachment', label: '添付ファイル',
}]

/**
 * 絞り込みタブの条件にメールが合うかを判定する。
 *
 * mail:: 判定するメール
 * filter:: 選択中のタブ
 * 戻り値:: 条件に合えば true
 */
const matchesFilter = (mail: Mail, filter: FilterKey) => {
  switch (filter) {
    case 'unread':
      return mail.unread
    case 'starred':
      return mail.starred
    case 'attachment':
      return mail.hasAttachment
    default:
      return true
  }
}

/**
 * 検索語がメールの送信者・件名・本文に含まれるかを判定する。
 *
 * mail:: 判定するメール
 * query:: 検索語（前後の空白は無視）
 * 戻り値:: 含まれていれば true（検索語が空なら常に true）
 */
const matchesQuery = (mail: Mail, query: string) => {
  const q = query.trim().toLowerCase()
  if (!q) {
    return true
  }
  return [mail.fromName, mail.fromAddress, mail.subject, mail.body].some((s) => s.toLowerCase().includes(q))
}

/**
 * 一覧が空のときの表示。状態と、次にできる操作を伝える。
 *
 * query:: 現在の検索語
 * filter:: 選択中のタブ
 * onReset:: 検索・絞り込みを解除する処理
 * 戻り値:: Empty State の要素
 */
const EmptyState = ({ query, filter, onReset }: { query: string, filter: FilterKey, onReset: () => void }) => {
  const theme = useTheme()
  const searching = query.trim() !== '' || filter !== 'all'
  const title = searching ? '該当するメールはありません' : '受信トレイは空です'
  const body = searching ? '検索語や絞り込みを変えてみてください。' : 'すべて片付きました。新しいメールが届くとここに表示されます。'

  return (
    <View style={styles.empty}>
      <Text style={styles.emptyGlyph} accessibilityElementsHidden importantForAccessibility="no">{searching ? '🔍' : '☕'}</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: theme.textSecondary }]}>{body}</Text>
      {searching && (
        <Pressable accessibilityRole="button" onPress={onReset} style={[styles.emptyButton, { borderColor: theme.border }]}>
          <Text style={{ color: theme.accent, fontWeight: '600' }}>検索と絞り込みを解除</Text>
        </Pressable>
      )}
    </View>
  )
}

/**
 * 受信トレイ画面。検索、絞り込みタブ、メール一覧、作成ボタンを持つ。
 *
 * 戻り値:: 画面要素
 */
const InboxScreen = () => {
  const theme = useTheme()
  const { mails, toggleStar, archive, showSnack } = useMailStore()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const visibleMails = useMemo(
    () => mails.filter((m) => matchesFilter(m, filter) && matchesQuery(m, query)),
    [mails, filter, query],
  )

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton glyph="≡" label="メニュー" onPress={() => showSnack('メニューはプロトタイプでは未実装です')} />
        <View style={[styles.search, { backgroundColor: theme.surface }]}>
          <Text style={{ color: theme.textMuted }} accessibilityElementsHidden importantForAccessibility="no">⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="メールを検索"
            placeholderTextColor={theme.textMuted}
            style={[styles.searchInput, { color: theme.text }]}
            accessibilityLabel="メールを検索"
            returnKeyType="search"
          />
          {query !== '' && <IconButton glyph="×" label="検索語を消す" size={18} color={theme.textMuted} onPress={() => setQuery('')} />}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`アカウント: ${accounts[0].address}`}
          onPress={() => showSnack(`表示中のアカウント: ${accounts[0].address}`)}
        >
          <Avatar name={accounts[0].label} size={36} />
        </Pressable>
      </View>

      <View style={[styles.tabs, { borderBottomColor: theme.border }]} accessibilityRole="tablist">
        {filters.map((f) => {
          const selected = f.key === filter
          return (
            <Pressable
              key={f.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => setFilter(f.key)}
              style={[styles.tab, selected && { borderBottomColor: theme.accent }]}
            >
              <Text style={{ color: selected ? theme.accent : theme.textSecondary, fontWeight: selected ? '700' : '400' }}>{f.label}</Text>
            </Pressable>
          )
        })}
      </View>

      <FlatList
        data={visibleMails}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => <MailRow mail={item} onToggleStar={toggleStar} onArchive={archive} />}
        ListEmptyComponent={<EmptyState query={query} filter={filter} onReset={() => {
          setQuery('')
          setFilter('all')
        }} />}
        contentContainerStyle={styles.listContent}
      />

      <Link href="/compose" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="メールを作成"
          // Link の asChild はスタイルの配列を受け付けないため、1 つのオブジェクトにまとめる
          style={StyleSheet.flatten([styles.fab, { backgroundColor: theme.surface, borderColor: theme.border }])}
        >
          <Text style={[styles.fabGlyph, { color: theme.text }]}>✎</Text>
          <Text style={[styles.fabLabel, { color: theme.text }]}>作成</Text>
        </Pressable>
      </Link>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: 24,
    paddingLeft: Spacing.lg,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.sm,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  listContent: {
    paddingBottom: 96,
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 28,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  fabGlyph: {
    fontSize: 20,
  },
  fabLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 64,
    gap: Spacing.sm,
  },
  emptyGlyph: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: Spacing.md,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
})

export default InboxScreen
