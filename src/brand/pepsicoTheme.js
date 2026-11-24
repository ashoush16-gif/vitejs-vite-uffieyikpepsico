// PepsiCo brand tokens for the Execution Control Tower.
// Colours come from the PepsiCo Universal PPT template (Blue / Yellow / Green stories).
// Import with:  import { B, FONT, stColor, stBg, stBorder } from './brand/pepsicoTheme'

export const B = {
  // Blue story (primary)
  navy: '#02355A',      // Blue 500  - header, primary buttons, headings
  blue400: '#155798',   // Blue 400  - links, secondary text
  blue300: '#3680CE',   // Blue 300  - highlights, active tab underline
  blue100: '#A6CBF0',   // Blue 100  - chips, light accents on navy
  // Yellow story (amber status / attention)
  yellow500: '#954F09',
  yellow300: '#EB9F0A',
  yellow100: '#FFE8AD',
  // Green story (green status / success)
  green500: '#0F440E',
  green300: '#5D910D',
  green100: '#BFDE7D',
  // Neutrals
  offWhite: '#F6F4F1',  // page background (template "Off White")
  white: '#FFFFFF',
  ink: '#02355A',       // body text = Blue 500 (template uses navy, not black)
  muted: '#5B6B7B',
  line: '#E3E6EA',
  // Status red - not part of the brand palettes; use ONLY for "off target"
  red: '#C8102E',
  redTint: '#FCE8EB',
}

export const FONT = {
  // GT Pressura & Gilroy are licensed PepsiCo brand fonts - add the files under /public/fonts
  // (see pepsico.css). The fallbacks keep the layout stable if they are missing.
  head: '"GT Pressura", "Arial Narrow", Arial, sans-serif',
  body: 'Gilroy, Arial, Helvetica, sans-serif',
}

// Drop-in replacements for the existing stColor / stBg / stBorder in Board.jsx
export function stColor(s) {
  return s === 'red' ? B.red : s === 'amber' ? B.yellow300 : s === 'green' ? B.green300 : '#9AA5B1'
}
export function stBg(s) {
  return s === 'red' ? B.redTint : s === 'amber' ? '#FFF6DE' : s === 'green' ? '#EEF6E0' : '#F7F8FA'
}
export function stBorder(s) {
  return s === 'red' ? '#F3B3BE' : s === 'amber' ? B.yellow100 : s === 'green' ? B.green100 : B.line
}
export function stText(s) {
  return s === 'red' ? B.red : s === 'amber' ? B.yellow500 : s === 'green' ? B.green500 : B.muted
}

// Reusable inline-style fragments (the app uses inline styles everywhere)
export const S = {
  page: { background: B.offWhite, minHeight: '100vh', fontFamily: FONT.body, color: B.ink },
  header: { background: B.navy, color: B.white },
  h1: { fontFamily: FONT.head, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, color: B.navy },
  h2: { fontFamily: FONT.head, fontWeight: 900, textTransform: 'uppercase', fontSize: 15, color: B.navy, margin: 0 },
  card: { background: B.white, borderRadius: 14, border: `1px solid ${B.line}`, boxShadow: '0 1px 2px rgba(2,53,90,.06)' },
  groupHeader: { background: B.navy, color: B.white, fontFamily: FONT.head, textTransform: 'uppercase', letterSpacing: 0.5 },
  btnPrimary: { background: B.navy, color: B.white, border: 'none', borderRadius: 999, padding: '9px 18px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT.body },
  btnSecondary: { background: B.white, color: B.navy, border: `1.5px solid ${B.navy}`, borderRadius: 999, padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontFamily: FONT.body },
  pill: (bg, fg) => ({ background: bg, color: fg, borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800, fontFamily: FONT.head, textTransform: 'uppercase', letterSpacing: 0.4 }),
}
