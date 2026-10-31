/**
 * ライト／ダーク両テーマの色と余白の定義。
 * 警告色（alert）は両テーマで本文とのコントラストを確保するよう、背景・文字・枠を分けて持つ。
 */
export const Colors = {
  light: {
    text: '#1B1C1F',
    textSecondary: '#5D6068',
    textMuted: '#80838B',
    background: '#FFFFFF',
    surface: '#F2F3F5',
    surfaceSelected: '#E2E4E8',
    border: '#E2E4E8',
    accent: '#2F5BD3',
    onAccent: '#FFFFFF',
    unread: '#1B1C1F',
    star: '#C98A00',
    alertBackground: '#FFF1EC',
    alertText: '#A3270C',
    alertBorder: '#F2B8A6',
    swipeArchive: '#2E7D4F',
    onSwipe: '#FFFFFF',
    danger: '#B3261E',
    snackbar: '#2B2D31',
    onSnackbar: '#F2F3F5',
    snackbarAction: '#9DB8FF',
  },
  dark: {
    text: '#E8E9EC',
    textSecondary: '#B0B3BA',
    textMuted: '#8C8F97',
    background: '#121316',
    surface: '#1E2024',
    surfaceSelected: '#2C2F34',
    border: '#2C2F34',
    accent: '#9DB8FF',
    onAccent: '#0E1A3D',
    unread: '#E8E9EC',
    star: '#F2C14E',
    alertBackground: '#3A1E17',
    alertText: '#FFB59E',
    alertBorder: '#6E3426',
    swipeArchive: '#3F9D66',
    onSwipe: '#FFFFFF',
    danger: '#FFB4AB',
    snackbar: '#E8E9EC',
    onSnackbar: '#1B1C1F',
    snackbarAction: '#2F5BD3',
  },
} as const

export type ThemeColors = { [K in keyof typeof Colors.light]: string }

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const

/** Web で広い画面に表示したときも、スマホ幅に収めるための最大幅 */
export const MaxContentWidth = 480
