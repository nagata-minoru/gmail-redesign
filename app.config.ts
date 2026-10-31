import type { ConfigContext, ExpoConfig } from 'expo/config'

/**
 * app.json の設定に、公開先に応じた Web の baseUrl を加える。
 * GitHub Pages ではサブパス（/gmail-redesign）の下で配信するため、
 * ビルド時に環境変数 WEB_BASE_URL で指定する。未指定ならルート（Cloudflare など）で配信する。
 *
 * config:: app.json から読み込んだ設定
 * 戻り値:: Expo の設定
 */
const appConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'gmail-redesign',
  slug: config.slug ?? 'gmail-redesign',
  experiments: {
    ...config.experiments,
    baseUrl: process.env.WEB_BASE_URL || undefined,
  },
})

export default appConfig
