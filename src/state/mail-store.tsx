import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

import { initialMails, type Mail } from '@/data/mails'
import { describeError, fetchAddress, fetchInbox } from '@/lib/gmail-api'
import { connect, disconnect, isGmailSupported } from '@/lib/gmail-auth'
import { restoreMail } from '@/lib/mail-list'

/** 画面下部に一時表示するお知らせ（取り消し操作付きにできる） */
export type Snack = {
  id: number
  message: string
  undo?: () => void
}

/** メールの出どころ。demo はダミーデータ、gmail は読み取り専用で接続した実際の受信トレイ */
export type MailSource = 'demo' | 'gmail'

/** Gmail への接続の状態 */
export type GmailStatus = 'idle' | 'loading' | 'error'

/** Gmail が読み取り専用のとき、変更しようとした操作に出すお知らせ */
const READ_ONLY_MESSAGE = 'Gmail には読み取り専用で接続しているため、この操作は Gmail に反映されません'

type MailStore = {
  source: MailSource
  gmailAddress: string | null
  gmailStatus: GmailStatus
  gmailError: string | null
  connectGmail: () => Promise<void>
  disconnectGmail: () => Promise<void>
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
  const [source, setSource] = useState<MailSource>('demo')
  const [gmailAddress, setGmailAddress] = useState<string | null>(null)
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>('idle')
  const [gmailError, setGmailError] = useState<string | null>(null)
  const snackSeq = useRef(0)

  const showSnack = useCallback((message: string, undo?: () => void) => {
    snackSeq.current += 1
    setSnack({ id: snackSeq.current, message, undo })
  }, [])

  const dismissSnack = useCallback(() => setSnack(null), [])

  /**
   * Gmail の受信トレイを読み取り専用で取得して表示する。トークンはメモリにだけ保持する。
   * 失敗したときはダミーデータのまま、理由を gmailError に入れる。
   */
  const connectGmail = useCallback(async () => {
    if (!isGmailSupported()) return
    setGmailStatus('loading')
    setGmailError(null)
    try {
      const token = await connect()
      const [address, inbox] = await Promise.all([fetchAddress(token), fetchInbox(token)])
      setMails(inbox)
      setGmailAddress(address)
      setSource('gmail')
      setGmailStatus('idle')
    } catch (error) {
      await disconnect()
      setGmailError(describeError(error))
      setGmailStatus('error')
    }
  }, [])

  /** 接続を解除する。メモリのトークンを捨てて Google 側でも失効させ、読み込んだメールを消してダミーに戻す */
  const disconnectGmail = useCallback(async () => {
    await disconnect()
    setMails(initialMails)
    setReactions({})
    setGmailAddress(null)
    setGmailError(null)
    setGmailStatus('idle')
    setSource('demo')
  }, [])

  const readOnly = source === 'gmail'

  const updateMail = useCallback((id: string, patch: Partial<Mail>) => {
    if (readOnly) return showSnack(READ_ONLY_MESSAGE)
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }, [readOnly, showSnack])

  const findMail = useCallback((id: string) => mails.find((m) => m.id === id), [mails])

  const toggleStar = useCallback((id: string) => {
    if (readOnly) return showSnack(READ_ONLY_MESSAGE)
    setMails((prev) => prev.map((m) => (m.id === id ? { ...m, starred: !m.starred } : m)))
  }, [readOnly, showSnack])

  const setUnread = useCallback((id: string, unread: boolean) => updateMail(id, { unread }), [updateMail])

  /**
   * メールを一覧から取り除き、取り消し可能なお知らせを出す。
   * アーカイブと削除で共通の処理。
   */
  const takeOut = useCallback((id: string, action: string) => {
    if (readOnly) return showSnack(READ_ONLY_MESSAGE)
    const index = mails.findIndex((m) => m.id === id)
    if (index < 0) return
    const mail = mails[index]
    setMails((prev) => prev.filter((m) => m.id !== id))
    showSnack(`「${mail.subject}」を${action}`, () => {
      setMails((prev) => restoreMail(prev, mail, index))
    })
  }, [mails, readOnly, showSnack])

  const archive = useCallback((id: string) => takeOut(id, 'アーカイブしました'), [takeOut])

  const remove = useCallback((id: string) => takeOut(id, 'ゴミ箱に移動しました'), [takeOut])

  const setReaction = useCallback((id: string, emoji: string | null) => {
    if (readOnly) return showSnack(READ_ONLY_MESSAGE)
    setReactions((prev) => {
      const next = { ...prev }
      if (emoji) {
        next[id] = emoji
      } else {
        delete next[id]
      }
      return next
    })
  }, [readOnly, showSnack])

  const value = useMemo<MailStore>(() => ({
    source,
    gmailAddress,
    gmailStatus,
    gmailError,
    connectGmail,
    disconnectGmail,
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
  }), [
    source, gmailAddress, gmailStatus, gmailError, connectGmail, disconnectGmail, mails, snack, findMail,
    toggleStar, setUnread, archive, remove, setReaction, reactions, showSnack, dismissSnack,
  ])

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
