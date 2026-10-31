import type { Mail } from '@/data/mails'

/**
 * 取り除いたメールを、元の位置に戻した一覧を作る（「元に戻す」用）。
 * すでに一覧にあれば何もしない。元の位置が一覧の長さを超えていれば末尾に戻す。
 *
 * list:: 現在の一覧
 * mail:: 戻すメール
 * index:: 取り除く前の位置
 * 戻り値:: 戻したあとの一覧（変更が不要なら元の一覧そのもの）
 */
export const restoreMail = (list: Mail[], mail: Mail, index: number) => {
  if (list.some((m) => m.id === mail.id)) return list
  const next = [...list]
  next.splice(Math.min(index, next.length), 0, mail)
  return next
}
