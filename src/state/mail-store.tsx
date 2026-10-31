import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

import { initialMails, type Mail } from '@/data/mails'

/** 画面下部に一時表示するお知らせ（取り消し操作付きにできる） */
export type Snack = {
  id: number
  message: string
  undo?: () => void
}

type MailStore = {
  mails: Mail[]
  snack: Snack | null
  findMail: (id: string) => Mail | undefined
  toggleStar: (id: string) => void
  setUnread: (id: string, unread: boolean) => void
  archive: (id: string) => void
  remove: (id: string) => void
  setReaction: (id: string, emoji: string | null) => void
  reactions: Record<string, string>
  showSnack: (message: string, undo?: () => void) => void
  dismissSnack: () => void
}

const MailStoreContext = createContext<MailStore | null>(null)

/**
 * ダミーメールの状態を保持するプロバイダ。
 * データはメモリ上だけにあり、ページを再読み込みすると初期状態に戻る。
 *
 * children:: プロバイダの配下に描画する要素
 * 戻り値:: Context を提供する要素
 */
export const MailStoreProvider = ({ children }: { children: ReactNode }) => {
  const [mails, setMails] = useState<Mail[]>(initialMails)
  const [snack, setSnack] = useState<Snack | null>(null)
  const [reactions, setReactions] = useState<Record<string, string>>({})
  const snackSeq = useRef(0)

  const showSnack = useCallback((message: string, undo?: () => void) => {
    snackSeq.current += 1
    setSnack({ id: snackSeq.current, message, undo })
  }, [])

  const dismissSnack = useCallback(() => setSnack(null), [])

  const updateMail = useCallback((id: string, patch: Partial<Mail>) => {
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [])

  const findMail = useCallback((id: string) => mails.find((m) => m.id === id), [mails])

  const toggleStar = useCallback((id: string) => {
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)))
  }, [])

  const setUnread = useCallback((id: string, unread: boolean) => updateMail(id, { unread }), [updateMail])

  /**
   * メールを一覧から取り除き、取り消し可能なお知らせを出す。
   * アーカイブと削除で共通の処理。
   */
  const takeOut = useCallback((id: string, action: string) => {
    const index = mails.findIndex((m) => m.id === id)
    if (index < 0) {
      return
    }
    const mail = mails[index]
    setMails((prev) => prev.filter((m) => m.id !== id))
    showSnack(`「${mail.subject}」を${action}`, () => {
      setMails((prev) => {
        if (prev.some((m) => m.id === mail.id)) {
          return prev
        }
        const next = [...prev]
        next.splice(Math.min(index, next.length), 0, mail)
        return next
      })
    })
  }, [mails, showSnack])

  const archive = useCallback((id: string) => takeOut(id, 'アーカイブしました'), [takeOut])

  const remove = useCallback((id: string) => takeOut(id, 'ゴミ箱に移動しました'), [takeOut])

  const setReaction = useCallback((id: string, emoji: string | null) => {
    setReactions((prev) => {
      const next = { ...prev }
      if (emoji) {
        next[id] = emoji
      } else {
        delete next[id]
      }
      return next
    })
  }, [])

  const value = useMemo<MailStore>(() => ({
    mails,
    snack,
    findMail,
    toggleStar,
    setUnread,
    archive,
    remove,
    setReaction,
    reactions,
    showSnack,
    dismissSnack,
  }), [mails, snack, findMail, toggleStar, setUnread, archive, remove, setReaction, reactions, showSnack, dismissSnack])

  return <MailStoreContext.Provider value={value}>{children}</MailStoreContext.Provider>
}

/**
 * メールの状態と操作を取得する。
 *
 * 戻り値:: MailStore（MailStoreProvider の外で呼ぶと例外）
 */
export const useMailStore = () => {
  const store = useContext(MailStoreContext)
  if (!store) {
    throw new Error('useMailStore は MailStoreProvider の内側で使ってください')
  }
  return store
}
