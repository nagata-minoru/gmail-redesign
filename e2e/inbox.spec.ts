import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test.describe('受信トレイ', () => {
  test('非公式のコンセプトであることを示す注記が出る', async ({ page }) => {
    await expect(page.getByText('非公式のデザインコンセプト')).toBeVisible()
  })

  test('「未読」タブで未読のメールだけに絞り込める', async ({ page }) => {
    await page.getByRole('tab', { name: '未読' }).click()
    await expect(page.getByRole('link', { name: /来週の打ち合わせについて/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /ご請求書をお送りします/ })).toHaveCount(0)
  })

  test('検索で絞り込め、結果がなければ解除ボタン付きの Empty State が出る', async ({ page }) => {
    const search = page.getByRole('textbox', { name: 'メールを検索' })
    await search.fill('請求書')
    await expect(page.getByRole('link', { name: /ご請求書をお送りします/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /来週の打ち合わせについて/ })).toHaveCount(0)

    await search.fill('存在しない語')
    await expect(page.getByRole('link', { name: /来週の打ち合わせについて/ })).toHaveCount(0)
    await expect(page.getByText('検索と絞り込みを解除')).toBeVisible()
    await page.getByRole('button', { name: '検索と絞り込みを解除' }).click()
    await expect(page.getByRole('link', { name: /来週の打ち合わせについて/ })).toBeVisible()
  })
})

test.describe('メール詳細', () => {
  test('開くと件名が表示され、戻ると一覧に戻る', async ({ page }) => {
    await page.getByRole('link', { name: /来週の打ち合わせについて/ }).click()
    await expect(page.getByRole('heading', { name: '来週の打ち合わせについて' })).toBeVisible()
    await page.getByRole('button', { name: '戻る' }).first().click()
    await expect(page.getByRole('textbox', { name: 'メールを検索' })).toBeVisible()
  })

  test('アーカイブすると一覧から消え、「元に戻す」で戻る', async ({ page }) => {
    const row = page.getByRole('link', { name: /来週の打ち合わせについて/ })
    await row.click()
    await page.getByRole('button', { name: 'アーカイブ' }).click()
    await expect(page.getByText('「来週の打ち合わせについて」をアーカイブしました')).toBeVisible()
    await expect(row).toHaveCount(0)

    await page.getByRole('button', { name: '元に戻す' }).click()
    await expect(row).toBeVisible()
  })

  test('スターを付けられる', async ({ page }) => {
    await page.getByRole('link', { name: /来週の打ち合わせについて/ }).click()
    await expect(page.getByRole('heading', { name: '来週の打ち合わせについて' })).toBeVisible()
    // 詳細を開いても下に受信トレイが残っているので、あとから描画された詳細側のボタンを選ぶ
    await page.getByRole('button', { name: 'スターを付ける' }).last().click()
    await expect(page.getByRole('button', { name: 'スターを外す' }).last()).toBeVisible()
  })
})
