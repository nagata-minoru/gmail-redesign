import { expect, test } from '@playwright/test'

test.describe('Gmail 接続パネル（実際の Google には接続しない）', () => {
  test('アカウントを押すと、読み取り専用・トークン非保存の説明が出る', async ({ page }) => {
    const googleRequests: string[] = []
    page.on('request', (req) => {
      if (/google|gmail/.test(new URL(req.url()).hostname)) googleRequests.push(req.url())
    })
    await page.goto('/')
    await page.getByRole('button', { name: /^アカウント:/ }).click()

    await expect(page.getByText('ダミーデータを表示中')).toBeVisible()
    await expect(page.getByText(/ディスクには保存しません/)).toBeVisible()
    await expect(page.getByText(/クライアント ID が未設定です/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Gmail に接続/ })).toHaveCount(0)

    await page.getByRole('button', { name: '閉じる' }).click()
    await expect(page.getByText('ダミーデータを表示中')).toHaveCount(0)
    expect(googleRequests).toEqual([])
  })
})
