export type ThemeMode = 'light' | 'dark';

/*
 * LozzIt SL: dark fantasy skin, in the spirit of Solo Leveling.
 * Both palettes are dark. The two stored theme values are kept for compatibility with saved settings:
 *   'light' -> MONARCH: the blue "System" window glow over a void-navy page.
 *   'dark'  -> SHADOW:  shadow-monarch violet over an ink-black page.
 * Token roles: glow = primary accent (rings, borders, CTAs), panel/panelLine = the "status window" surfaces,
 * orange = gold (steps, warnings), blue = ice cyan (water), violet = secondary mana accent.
 */
const MONARCH = {
  glow: '#4DA3FF',
  glowText: '#7DBBFF',
  tint: '#0F2250',
  ink: '#E6EEFF',
  onGlow: '#031029',
  btn: '#1B3F8F',
  page: '#04060E',
  card: '#091022',
  panel: '#0B1838',
  panelLine: '#2F66D6',
  line: '#172A5A',
  muted: '#8798C2',
  soft: '#566694',
  orange: '#F5B83D',
  orangeTint: '#2A2110',
  orangeSoft: '#6B4F14',
  blue: '#35D4FF',
  blueTint: '#082533',
  blueSoft: '#12495C',
  red: '#FF4D6D',
  violet: '#A06BFF',
  violetTint: '#1D1240',
};

const SHADOW: typeof MONARCH = {
  glow: '#A36BFF',
  glowText: '#C3A0FF',
  tint: '#1F1146',
  ink: '#EFE8FF',
  onGlow: '#12062E',
  btn: '#4A2394',
  page: '#06040D',
  card: '#0E0A1E',
  panel: '#170C36',
  panelLine: '#7A3FE0',
  line: '#26194F',
  muted: '#9C8FC4',
  soft: '#645A92',
  orange: '#F5B83D',
  orangeTint: '#2A2110',
  orangeSoft: '#6B4F14',
  blue: '#35D4FF',
  blueTint: '#082533',
  blueSoft: '#12495C',
  red: '#FF4D6D',
  violet: '#4DA3FF',
  violetTint: '#0F2250',
};

/** Live palette: the values are swapped in place when the theme changes. */
export const c: typeof MONARCH = { ...MONARCH };

let current: ThemeMode = 'light';
const listeners: (() => void)[] = [];

/** Modules register a callback to rebuild their StyleSheet after a theme change. */
export const onTheme = (fn: () => void) => { listeners.push(fn); };
export const themeMode = () => current;
export function applyTheme(mode: ThemeMode) {
  if (mode === current) return;
  current = mode;
  Object.assign(c, mode === 'dark' ? SHADOW : MONARCH);
  listeners.forEach((fn) => fn());
}

/** '#RRGGBB' + opacity (0..1) -> '#RRGGBBAA'. Only for 6-digit hex colours. */
export const alpha = (hex: string, a: number) => hex + Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0');

/** Glow: a soft coloured halo (iOS/web shadow; on Android only `elevation` applies). */
export const glow = (color: string, radius = 14, opacity = 0.55) => ({
  shadowColor: color,
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: 0 },
});

/** Glowing text. */
export const textGlow = (color: string, radius = 10) => ({
  textShadowColor: color,
  textShadowRadius: radius,
  textShadowOffset: { width: 0, height: 0 },
});

/** Corner radii: the System UI is angular. */
export const r = { sm: 3, md: 4, lg: 6 };

/** Chakra Petch (angular HUD sans) for UI text, Cinzel (engraved serif) for titles and big numbers. */
export const f = {
  regular: 'ChakraPetch_400Regular',
  medium: 'ChakraPetch_500Medium',
  semi: 'ChakraPetch_600SemiBold',
  bold: 'ChakraPetch_700Bold',
  extra: 'Cinzel_700Bold',
  display: 'Cinzel_900Black',
};
