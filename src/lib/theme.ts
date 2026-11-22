// Design tokens matching the reference design: white canvas, black type,
// light-weight oversized headlines, pill buttons in a single bright blue.
export const colors = {
  bg: '#FFFFFF',
  text: '#000000',
  muted: '#595959',
  subtle: '#868AA5',
  border: '#E5E5E5',
  soft: '#F5F6F8',
  primary: '#116DFF',
  primaryPressed: '#0F5FDD',
  danger: '#E62E2E',
  success: '#1A9E5C',
  heroGradient: ['#F3EFFF', '#E9F0FF', '#FFFFFF'] as const,
  bannerGradient: ['#116DFF', '#3D4BFF', '#5A3CF0'] as const,
  closingGradient: ['#FFFFFF', '#F1ECFF', '#E3E9FF'] as const,
};

export const font = {
  // Oversized, thin headlines like the reference.
  display: { fontSize: 56, lineHeight: 62, fontWeight: '300' as const, letterSpacing: -1.5 },
  displaySm: { fontSize: 36, lineHeight: 42, fontWeight: '300' as const, letterSpacing: -0.8 },
  h2: { fontSize: 32, lineHeight: 38, fontWeight: '300' as const, letterSpacing: -0.6 },
  h2Sm: { fontSize: 26, lineHeight: 32, fontWeight: '300' as const, letterSpacing: -0.4 },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '500' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  eyebrow: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const, letterSpacing: 1.2 },
};

export const layout = {
  maxWidth: 1200,
  gutter: 16,
  wideBreakpoint: 900,
  radius: 16,
};
