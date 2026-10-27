import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Keyboard, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from './i18n';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { alpha, c, f, glow, onTheme, r, textGlow } from './theme';
import type { MealKey } from './domain';

export const P = {
  bell: ['M10.268 21a2 2 0 0 0 3.464 0', 'M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326'],
  steps: ['M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z', 'M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z', 'M16 17h4', 'M4 13h4'],
  drop: ['M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z'],
  home: ['M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'],
  stats: ['M5 21v-6', 'M12 21V3', 'M19 21V9'],
  meals: ['M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2', 'M7 2v20', 'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7'],
  user: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M12 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0-8 0'],
  scan: ['M3 7V5a2 2 0 0 1 2-2h2', 'M17 3h2a2 2 0 0 1 2 2v2', 'M21 17v2a2 2 0 0 1-2 2h-2', 'M7 21H5a2 2 0 0 1-2-2v-2', 'M7 12h10'],
  flame: ['M12 3q1 4 4 6.5t3 5.5a7 7 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4'],
  calendar: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z'],
  list: ['M8 6h13', 'M8 12h13', 'M8 18h13', 'M3 6h.01', 'M3 12h.01', 'M3 18h.01'],
  search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.3-4.3'],
  x: ['M18 6 6 18', 'm6 6 12 12'],
  plus: ['M5 12h14', 'M12 5v14'],
  back: ['m15 18-6-6 6-6'],
  next: ['m9 18 6-6-6-6'],
  chevDown: ['m6 9 6 6 6-6'],
  chevUp: ['m18 15-6-6-6 6'],
  minus: ['M5 12h14'],
  coffee: ['M10 2v2', 'M14 2v2', 'M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1', 'M6 2v2'],
  apple: ['M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z', 'M10 2c1 .5 2 2 2 5'],
  cookie: ['M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5', 'M8.5 8.5v.01', 'M16 15.5v.01', 'M12 12v.01', 'M11 17v.01', 'M7 14v.01'],
  moonStar: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9', 'M20 3v4', 'M22 5h-4'],
  popcorn: ['M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4', 'M10 22 9 8', 'm14 22 1-14', 'M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.4-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z'],
  zap: ['M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z'],
  camera: ['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z', 'M12 13m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0'],
  book: ['M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20'],
  chef: ['M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z', 'M6 17h12'],
  more: ['M12 5.5v.01', 'M12 12v.01', 'M12 18.5v.01'],
  trash: ['M3 6h18', 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2', 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6', 'M10 11v6', 'M14 11v6'],
  copy: ['M9 9h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'],
  factor: ['M6 6l12 12', 'M18 6L6 18', 'M4 12h2', 'M18 12h2'],
  image: ['M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M8.5 8.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0', 'M21 15l-5-5L5 21'],
  edit: ['M12 20h9', 'M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z'],
  weight: ['M12 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', 'M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z'],
};

export function Icon({ d, size = 24, color = c.ink, fill = 'none', sw = 2 }: { d: string[]; size?: number; color?: string; fill?: string; sw?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {d.map((p, i) => <Path key={i} d={p} />)}
    </Svg>
  );
}

/** Rune medallion: a dark disc with a glowing ring and glyph in the given colour (meals, water, weight). */
export function Disc({ d, bg, size = 44, fill = 'none', sw = 2 }: { d: string[]; bg: string; size?: number; fill?: string; sw?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: alpha(bg, 0.14), borderWidth: 1.5, borderColor: bg, alignItems: 'center', justifyContent: 'center', ...glow(bg, 9, 0.55) }}>
      <Icon d={d} size={size * 0.5} color={bg} fill={fill === 'none' ? 'none' : bg} sw={sw} />
    </View>
  );
}
export const MEAL_STYLE: Record<MealKey, { d: string[]; bg: string }> = {
  breakfast: { d: P.coffee, bg: '#F5B83D' },
  snack_am: { d: P.apple, bg: '#3DDC97' },
  lunch: { d: P.meals, bg: '#35D4FF' },
  snack_pm: { d: P.cookie, bg: '#FF5C8A' },
  dinner: { d: P.moonStar, bg: '#7C8CFF' },
  snack_eve: { d: P.popcorn, bg: '#B26BFF' },
};
export const MealIcon = ({ k, size = 44 }: { k: MealKey; size?: number }) => <Disc d={MEAL_STYLE[k].d} bg={MEAL_STYLE[k].bg} size={size} />;

export const card: { backgroundColor: string; borderWidth: number; borderColor: string } = { backgroundColor: c.card, borderWidth: 1, borderColor: c.line };
onTheme(() => { card.backgroundColor = c.card; card.borderColor = c.line; });

/** Four bright L-shaped brackets on the corners of a "System window". The parent must be position: relative (the default). */
export function Corners({ color = c.glow, size = 11, thick = 2 }: { color?: string; size?: number; thick?: number }) {
  const base = { position: 'absolute' as const, width: size, height: size, borderColor: color };
  return (
    <>
      <View pointerEvents="none" style={[base, { top: -1, left: -1, borderTopWidth: thick, borderLeftWidth: thick }]} />
      <View pointerEvents="none" style={[base, { top: -1, right: -1, borderTopWidth: thick, borderRightWidth: thick }]} />
      <View pointerEvents="none" style={[base, { bottom: -1, left: -1, borderBottomWidth: thick, borderLeftWidth: thick }]} />
      <View pointerEvents="none" style={[base, { bottom: -1, right: -1, borderBottomWidth: thick, borderRightWidth: thick }]} />
    </>
  );
}

/** Void background: a cold glow from the top, a violet haze from the bottom and a few drifting motes of mana. */
export function Backdrop() {
  const { width, height } = useWindowDimensions();
  const motes = React.useMemo(() => {
    let seed = 7;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    return Array.from({ length: 34 }, () => ({ x: rnd() * width, y: rnd() * height, r: 0.6 + rnd() * 1.4, o: 0.12 + rnd() * 0.35, hue: rnd() > 0.72 ? 1 : 0 }));
  }, [width, height]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="topGlow" gradientUnits="userSpaceOnUse" cx={width / 2} cy={0} rx={width * 1.0} ry={height * 0.5} fx={width / 2} fy={0}>
            <Stop offset="0" stopColor={c.glow} stopOpacity={0.2} />
            <Stop offset="1" stopColor={c.glow} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="lowHaze" gradientUnits="userSpaceOnUse" cx={width} cy={height} rx={width * 1.1} ry={height * 0.42} fx={width} fy={height}>
            <Stop offset="0" stopColor={c.violet} stopOpacity={0.16} />
            <Stop offset="1" stopColor={c.violet} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#topGlow)" />
        <Rect x={0} y={0} width={width} height={height} fill="url(#lowHaze)" />
        {motes.map((m, i) => <Circle key={i} cx={m.x} cy={m.y} r={m.r} fill={m.hue ? c.violet : c.glow} opacity={m.o} />)}
      </Svg>
    </View>
  );
}

export type Tab = 'home' | 'stats' | 'recipes' | 'profile';

/** Scrolling page that leaves room for the status bar and the floating nav. */
/** How far the soft keyboard covers the bottom of the referenced view (0 when the window already resizes). */
export function useKbOverlap() {
  const ref = useRef<View>(null);
  const [pad, setPad] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      ref.current?.measureInWindow((_x, y, _w, h) => setPad(Math.max(0, Math.round(y + h - e.endCoordinates.screenY))));
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setPad(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return { ref, pad };
}

/** Container that keeps its content above the keyboard (replacement for KeyboardAvoidingView, which does nothing on Android here). */
export function KbView({ style, children }: { style?: any; children: React.ReactNode }) {
  const { ref, pad } = useKbOverlap();
  const fl = StyleSheet.flatten(style) ?? {};
  const base = Number(fl.paddingBottom ?? fl.padding ?? 0);
  return <View ref={ref} collapsable={false} style={[style, { paddingBottom: base + pad }]}>{children}</View>;
}

export function Screen({ children }: { children: React.ReactNode }) {
  const { top } = useSafeAreaInsets();
  const { ref, pad } = useKbOverlap();
  return (
    <View ref={ref} collapsable={false} style={{ flex: 1, paddingBottom: pad }}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: top + 12, paddingBottom: pad ? 24 : 170 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
    </View>
  );
}

export function Title({ children }: { children: string }) {
  return (
    <View style={s.titleWrap}>
      <Text style={s.title}>{children}</Text>
      <View style={s.rule}>
        <View style={s.ruleBright} />
      </View>
    </View>
  );
}

/* ---------- Bottom bar ----------
 * Drawn from the design sheet: a dark bar with pointed ends and a round notch for the "+" gate, violet outline,
 * one accent colour per tab, and a violet gate button with an aura and licking flames. The bar keeps its own
 * violet palette in both themes. */
const NAV = {
  line: '#8B4DFF',
  lineSoft: '#6A3BE0',
  fillTop: '#180E3A',
  fillBot: '#0A0619',
  idle: '#8F87CC',
  idleLabel: '#A9A1D8',
  btnIn: '#4A25BE',
  btnOut: '#190A52',
  ring: '#BC96FF',
  plus: '#F3E9FF',
};
const TAB_STYLE: Record<Tab, { d: string[]; color: string; fill?: boolean }> = {
  home: { d: P.home, color: '#D78BFF', fill: true },
  stats: { d: P.stats, color: '#3DB8FF' },
  recipes: { d: P.chef, color: '#FF9272' },
  profile: { d: P.user, color: '#2CE6C4' },
};
const LABELS: Record<Tab, string> = { home: 'Dashboard', stats: 'Stats', recipes: 'Recipes', profile: 'Profile' };

const BAR_H = 68; // the bar itself
const OVER = 92; // room above the bar for the gate button, its aura and its flames
const MARGIN = 12;
const BTN_R = 33; // gate button radius
const CANVAS = 140; // square canvas holding the aura / flames, centred on the button
const CC = { x: 70, y: 86 }; // button centre inside that canvas

function barPath(w: number) {
  const p = 3, tip = 26, h = BAR_H, cx = w / 2, nr = BTN_R + 9;
  const dx = Math.sqrt(nr * nr - 16); // the notch is a circle centred 4px above the top edge
  return `M ${p + tip} ${p} L ${cx - dx} ${p} A ${nr} ${nr} 0 0 0 ${cx + dx} ${p} L ${w - p - tip} ${p} L ${w - p} ${h / 2} L ${w - p - tip} ${h - p} L ${p + tip} ${h - p} L ${p} ${h / 2} Z`;
}
const diamond = (x: number, y: number, rx: number, ry: number) => `M ${x} ${y - ry} L ${x + rx} ${y} L ${x} ${y + ry} L ${x - rx} ${y} Z`;

function BarShape({ w }: { w: number }) {
  const d = barPath(w);
  return (
    <Svg width={w} height={BAR_H} style={{ position: 'absolute', left: 0, top: OVER }}>
      <Defs>
        <LinearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={NAV.fillTop} stopOpacity={1} />
          <Stop offset="1" stopColor={NAV.fillBot} stopOpacity={1} />
        </LinearGradient>
      </Defs>
      <Path d={d} fill="url(#barFill)" />
      {/* soft outer glow, then the crisp outline */}
      <Path d={d} fill="none" stroke={NAV.line} strokeOpacity={0.12} strokeWidth={9} strokeLinejoin="round" />
      <Path d={d} fill="none" stroke={NAV.line} strokeOpacity={0.28} strokeWidth={4.5} strokeLinejoin="round" />
      <Path d={d} fill="none" stroke={NAV.line} strokeWidth={1.6} strokeLinejoin="round" />
      {/* ornaments: the two tips and the foot of the notch */}
      <Path d={diamond(10, BAR_H / 2, 5.5, 7.5)} fill={NAV.fillBot} stroke={NAV.ring} strokeWidth={1.4} />
      <Path d={diamond(w - 10, BAR_H / 2, 5.5, 7.5)} fill={NAV.fillBot} stroke={NAV.ring} strokeWidth={1.4} />
      <Path d={diamond(w / 2, 3 + BTN_R + 9 - 4 - 1, 4.5, 6)} fill={NAV.ring} />
    </Svg>
  );
}

const TAB_IMG: Record<Tab, { on: number; off: number }> = {
  home: { on: require('../assets/tabs/home_on.png'), off: require('../assets/tabs/home_off.png') },
  stats: { on: require('../assets/tabs/stats_on.png'), off: require('../assets/tabs/stats_off.png') },
  recipes: { on: require('../assets/tabs/recipes_on.png'), off: require('../assets/tabs/recipes_off.png') },
  profile: { on: require('../assets/tabs/profile_on.png'), off: require('../assets/tabs/profile_off.png') },
};
const TAB_W = 62, TAB_H = 60;

/** Tab tile: ornate framed button (icon + label baked into the artwork), accent-coloured when selected. */
function TabItem({ t, on, onPress }: { t: Tab; on: boolean; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [s.tab, pressed && { opacity: 0.65 }]} onPress={onPress} hitSlop={3} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={LABELS[t]}>
      <Image source={on ? TAB_IMG[t].on : TAB_IMG[t].off} style={{ width: TAB_W, height: TAB_H }} resizeMode="contain" fadeDuration={0} />
    </Pressable>
  );
}

const GATE_FRAMES = [
  require('../assets/gate/f00.png'), require('../assets/gate/f01.png'), require('../assets/gate/f02.png'), require('../assets/gate/f03.png'),
  require('../assets/gate/f04.png'), require('../assets/gate/f05.png'), require('../assets/gate/f06.png'), require('../assets/gate/f07.png'),
  require('../assets/gate/f08.png'), require('../assets/gate/f09.png'), require('../assets/gate/f10.png'), require('../assets/gate/f11.png'),
];
const GATE_FRAME_MS = 120; // 12 frames, looping (idle pulse / breathing)
const GATE_SIZE = 116; // sprite is 137px with the ring about 80px wide: scaled so the ring is about the notch size
const GATE_CX = 58, GATE_CY = 66; // ring centre inside the scaled sprite

/** The "+" gate: a 12-frame looping sprite (violet ring breathing with flames). Pressed = shrinks and dims. */
function GateButton({ onPress }: { onPress: () => void }) {
  const [frame, setFrame] = useState(0);
  const press = React.useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const id = setInterval(() => setFrame((n) => (n + 1) % GATE_FRAMES.length), GATE_FRAME_MS);
    return () => clearInterval(id);
  }, []);
  const to = (v: number) => Animated.timing(press, { toValue: v, duration: 90, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const op = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] });
  return (
    <Pressable style={s.gate} onPress={onPress} onPressIn={() => to(1)} onPressOut={() => to(0)} accessibilityRole="button" accessibilityLabel="Add">
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: BTN_R - GATE_CX, top: BTN_R - GATE_CY, width: GATE_SIZE, height: GATE_SIZE, opacity: op, transform: [{ scale }] }}>
        <Image source={GATE_FRAMES[frame]} style={{ width: GATE_SIZE, height: GATE_SIZE }} fadeDuration={0} />
      </Animated.View>
    </Pressable>
  );
}

export function BottomNav({ tab, onTab, onAdd }: { tab: Tab; onTab: (t: Tab) => void; onAdd: () => void }) {
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const w = width - MARGIN * 2;
  return (
    <View style={[s.navWrap, { bottom: Math.max(bottom, 12) + 4, left: MARGIN, right: MARGIN }]} pointerEvents="box-none">
      <BarShape w={w} />
      <View style={s.tabs} pointerEvents="box-none">
        <TabItem t="home" on={tab === 'home'} onPress={() => onTab('home')} />
        <TabItem t="stats" on={tab === 'stats'} onPress={() => onTab('stats')} />
        <View style={{ width: 2 * (BTN_R + 9) }} />
        <TabItem t="recipes" on={tab === 'recipes'} onPress={() => onTab('recipes')} />
        <TabItem t="profile" on={tab === 'profile'} onPress={() => onTab('profile')} />
      </View>
      <View style={[s.gateSlot, { left: w / 2 - BTN_R }]} pointerEvents="box-none">
        <GateButton onPress={onAdd} />
      </View>
    </View>
  );
}

const mkStyles = () => StyleSheet.create({
  titleWrap: { marginHorizontal: 10, marginBottom: 16 },
  title: { fontFamily: f.extra, fontSize: 24, color: c.ink, letterSpacing: 3, textTransform: 'uppercase', ...textGlow(c.glow, 14) },
  rule: { height: 1, backgroundColor: c.line, marginTop: 8 },
  ruleBright: { width: 54, height: 2, marginTop: -0.5, backgroundColor: c.glow, ...glow(c.glow, 8, 0.9) },
  navWrap: { position: 'absolute', height: OVER + BAR_H },
  tabs: { position: 'absolute', left: 16, right: 16, top: OVER, height: BAR_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tab: { width: TAB_W, height: BAR_H, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { width: 64, height: 34, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontFamily: f.medium, fontSize: 11.5, marginTop: 1 },
  tabBar: { width: 42, height: 3, borderRadius: 2, marginTop: 4 },
  gateSlot: { position: 'absolute', top: OVER - 1 - BTN_R, width: BTN_R * 2, height: BTN_R * 2 },
  gate: { width: BTN_R * 2, height: BTN_R * 2, borderRadius: BTN_R },
});
export let s = mkStyles();
onTheme(() => { s = mkStyles(); });
