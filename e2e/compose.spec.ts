import { expect, test } from '@playwright/test'

test.describe('メール作成', () => {
  test('新規作成で不正な宛先はエラー、正しい宛先ならデモの送信結果が出る', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'メールを作成' }).click()
    await expect(page.getByRole('heading', { name: '新規メッセージ' })).toBeVisible()

    const to = page.getByRole('textbox', { name: '宛先を追加' })
    await to.fill('abc')
    await page.getByRole('button', { name: /から送信/ }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'メールアドレスの形式ではありません' })).toBeVisible()

    await to.fill('friend@example.jp')
    await page.getByRole('button', { name: /から送信/ }).click()
    await expect(page.getByText('デモのため実際には送信されません')).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'メールを検索' })).toBeVisible()
  })

  test('差出人のアカウントを切り替えられ、送信ボタンにも反映される', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'メールを作成' }).click()
    await page.getByRole('button', { name: /差出人/ }).click()
    await page.getByRole('radio', { name: /work@example.jp/ }).click()
    await expect(page.getByRole('button', { name: 'work@example.jp から送信' })).toBeVisible()
  })

  test('入力中に閉じようとすると破棄の確認が出る', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'メールを作成' }).click()
    await page.getByRole('textbox', { name: '件名' }).fill('下書き')
    await page.getByRole('button', { name: '閉じる' }).click()
    await expect(page.getByText('入力中の内容を破棄して閉じますか？')).toBeVisible()
    await page.getByRole('button', { name: '破棄' }).click()
    await expect(page.getByRole('textbox', { name: 'メールを検索' })).toBeVisible()
  })

  test('返信すると宛先と件名が引き継がれる', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: /来週の打ち合わせについて/ }).click()
    await page.getByRole('button', { name: '↩ 返信', exact: true }).click()
    await expect(page.getByRole('heading', { name: '返信' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'taro@example.jp を宛先から外す' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: '件名' })).toHaveValue('Re: 来週の打ち合わせについて')
  })
})
