// Official PepsiCo logo (from the PepsiCo Universal PPT template).
// variant="white": white wordmark for navy/blue backgrounds (headers, login).
// variant="navy":  navy wordmark for white/off-white backgrounds.
export default function PepsiCoLogo({ variant = 'white', height = 40, style }) {
  const src = variant === 'navy' ? '/pepsico-logo.svg' : '/pepsico-logo-white.svg'
  return <img src={src} alt="PepsiCo. Food. Drinks. Smiles." height={height} style={{ display: 'block', height, width: 'auto', ...style }} />
}
