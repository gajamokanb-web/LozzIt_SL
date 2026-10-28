import React, { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { askConfirm } from '../dialog';
import { Text, tr } from '../i18n';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { c, f, glow, onTheme, textGlow } from '../theme';
import { addDays, entryBase, fmt, fmtDay, MEALS, parseKey, scaleEntry, sum, targets, weekDays, type Entry, type MealKey } from '../domain';
import { useStore } from '../store';
import { FoodIcon } from '../foodIcons';
import { FactorModal } from './Factor';
import { BlockMenu, MealPick, MealSummary } from './BlockMenu';
import { Calendar } from './Calendar';
import { useSteps } from '../steps';
import { card, Frame, Icon, P, Screen } from '../ui';
import type { Recipe } from '../recipes';
import type { Food } from '../foods';

const DROP_L = 0.25; // litres per drop (250 mL)
const MACRO_COLOR = ['#A06BFF', '#35D4FF', '#F5B83D']; // protein / carbs / fat
const MACRO_GRAD = [['#8B4DFF', '#B98CFF'], ['#1F8BFF', '#3DB8FF'], ['#F5A000', '#FFD04A']];
const WATER_GOAL = 2.5; // litres (10 drops)
const STEPS_ART = require('../../assets/home/steps_art.jpg');
const WATER_ART = require('../../assets/home/water_art.jpg');
const ADD_BTN = require('../../assets/add_btn.png');
const FADE = '#0B0A20'; // dark of the frame's centre, used to fade the tile art

/** Calorie ring: grows and glows with the day's progress; the emblem sits above the figures. */
function KcalRing({ eaten, target }: { eaten: number; target: number }) {
  const pct = Math.max(0, Math.min(eaten / target, 1)), over = eaten > target;
  const R = 64, C = 2 * Math.PI * R, dash = `${C * pct} ${C}`;
  const a = over ? c.red : '#A36BFF', b = over ? '#FF9AAE' : '#CBA8FF';
  return (
    <View style={{ width: 120, height: 120 }}>
      <Svg width={120} height={120} viewBox="0 0 150 150">
        <Defs>
          <LinearGradient id="kg" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={a} />
            <Stop offset="1" stopColor={b} />
          </LinearGradient>
        </Defs>
        <Circle cx={75} cy={75} r={R} fill="none" stroke="#9691C8" strokeOpacity={pct >= 1 ? 0 : 0.28} strokeWidth={11} />
        {pct > 0 && (
          <>
            <Circle cx={75} cy={75} r={R} fill="none" stroke={a} strokeOpacity={0.05 + 0.15 * pct} strokeWidth={28} strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90 75 75)" />
            <Circle cx={75} cy={75} r={R} fill="none" stroke={a} strokeOpacity={0.12 + 0.28 * pct} strokeWidth={19} strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90 75 75)" />
            <Circle cx={75} cy={75} r={R} fill="none" stroke="url(#kg)" strokeWidth={11} strokeLinecap="round" strokeDasharray={dash} transform="rotate(-90 75 75)" />
          </>
        )}
      </Svg>
      <View style={s.ringCenter} pointerEvents="none">
        <Svg width={18} height={21} viewBox="0 0 40 46">
          <G fill={a}>
            <Path d="M20 0 L23 8 L23 36 L20 46 L17 36 L17 8Z" />
            <Path d="M17 26 C9 26 4 20 2 8 C6 14 10 16 15 16Z M23 26 C31 26 36 20 38 8 C34 14 30 16 25 16Z" />
            <Path d="M15 38 C8 36 6 30 8 24 C10 30 13 32 16 32Z M25 38 C32 36 34 30 32 24 C30 30 27 32 24 32Z" opacity={0.8} />
          </G>
        </Svg>
        <Text style={[s.ringBig, over && { color: c.red }]}>{fmt(eaten)}</Text>
        <Text style={s.ringSmall}>{`/ ${fmt(target)} kcal`}</Text>
        <Text style={s.ringPct}>{`${Math.round((eaten / target) * 100)}%`}</Text>
      </View>
    </View>
  );
}

const MACRO_ICON = [
  <G key="p"><Path d="M12 2c.6 3.6 5 5.6 5 10.6A5 5 0 0 1 7 13c0-1.8.9-3.2 2-4.2.2 1.4.8 2.1 1.6 2.4C10.2 8 10.8 4.6 12 2z" fill="#A36BFF" /><Path d="M12 22a3.2 3.2 0 0 0 3.2-3.2c0-1.6-1.2-2.4-2-3.4-.4 1-1.2 1.4-1.8 1.8-.8.6-1.4 1.4-1.4 2.2A2.8 2.8 0 0 0 12 22z" fill="#D2B6FF" /></G>,
  <G key="c"><Path d="M12 22V8M12 8c-1.5-2-1.5-4 0-6 1.5 2 1.5 4 0 6zM12 13c-3 0-4.5-1.5-5-4 2.8 0 4.8 1 5 4zM12 13c3 0 4.5-1.5 5-4-2.8 0-4.8 1-5 4zM12 18c-3 0-4.5-1.5-5-4 2.8 0 4.8 1 5 4zM12 18c3 0 4.5-1.5 5-4-2.8 0-4.8 1-5 4z" fill="none" stroke="#2F9BFF" strokeWidth={1.7} strokeLinecap="round" /></G>,
  <G key="f"><Path d="M12 2.5C9 7 5.5 10.5 5.5 15a6.5 6.5 0 0 0 13 0C18.5 10.5 15 7 12 2.5z" fill="none" stroke="#FFB81F" strokeWidth={1.8} strokeLinejoin="round" /><Path d="M12 9c-1.8 3-3.2 4.6-3.2 6.8a3.2 3.2 0 0 0 6.4 0C15.2 13.6 13.8 12 12 9z" fill="#FFB81F" /></G>,
];

/** Glowing gradient bar (track + fill). */
function GlowBar({ pct, i, h = 8 }: { pct: number; i: number; h?: number }) {
  const [a, b] = MACRO_GRAD[i];
  return (
    <Svg width="100%" height={h}>
      <Defs>
        <LinearGradient id={`mb${i}${h}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={a} />
          <Stop offset="1" stopColor={b} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width="100%" height={h} rx={h / 2} fill="#1A1640" />
      {pct > 0 && <Rect x={0} y={0} width={`${Math.min(pct, 1) * 100}%`} height={h} rx={h / 2} fill={`url(#mb${i}${h})`} />}
    </Svg>
  );
}

/** Illustrated stat tile (steps / water): framed, art fading in from the right, accent bar, round buttons. */
function StatTile({ id, art, accent, icon, label, value, unit, pct, buttons, onPress }: { id: string; art: number; accent: string; icon: React.ReactNode; label: string; value: string; unit: string; pct: number; buttons?: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable style={s.stile} onPress={onPress} disabled={!onPress} accessibilityLabel={label}>
      <Frame bw={8} style={{ height: 86 }} contentStyle={{ flex: 1, overflow: 'hidden' }}>
        <Image source={art} style={s.stileArt} resizeMode="cover" />
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
          <Defs>
            <LinearGradient id={`${id}h`} x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={FADE} stopOpacity={1} />
              <Stop offset="0.28" stopColor={FADE} stopOpacity={1} />
              <Stop offset="0.6" stopColor={FADE} stopOpacity={0} />
            </LinearGradient>
            <LinearGradient id={`${id}v`} x1="0" y1="1" x2="0" y2="0">
              <Stop offset="0" stopColor={FADE} stopOpacity={0.95} />
              <Stop offset="0.5" stopColor={FADE} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id}h)`} />
          <Rect x={0} y={0} width="100%" height="100%" fill={`url(#${id}v)`} />
        </Svg>
        <View style={s.stileIn}>
          <View style={{ width: 24, alignItems: 'center' }}>{icon}</View>
          <View style={{ flex: 1 }}>
            <Text style={s.stileLabel}>{label}</Text>
            <Text style={s.stileVal} numberOfLines={1} adjustsFontSizeToFit>{value}<Text style={[s.stileUnit, { color: accent }]}>{unit}</Text></Text>
            <View style={s.stileBar}>
              <View style={{ flex: 1 }}><GlowBar pct={pct} i={accent === '#A36BFF' ? 0 : 1} h={5} /></View>
              <Text style={[s.stilePct, { color: accent }]}>{`${Math.round(pct * 100)}%`}</Text>
            </View>
          </View>
        </View>
        {buttons ? <View style={s.stileBtns}>{buttons}</View> : null}
      </Frame>
    </Pressable>
  );
}

const REC_GRAD = [['#5A2FC0', '#2A1070'], ['#1F6FD0', '#0C2A66'], ['#C07A12', '#4A2A08']];

/** Home shortcut to the latest recipes: three tinted cards and a link to the Recipes tab. */
function RecipesBlock({ recipes, foods, onAll }: { recipes: Recipe[]; foods: Record<string, Food>; onAll: () => void }) {
  const shown = recipes.filter((x) => x.cat !== 'Draft').slice(0, 3);
  const kcalOf = (x: Recipe) => {
    let k = 0;
    for (const i of x.ingredients) { const fd = i.fk ? foods[i.fk] : undefined; if (fd) k += (fd.per.kcal * i.g) / 100; }
    return Math.round(k / Math.max(1, x.servings ?? 1));
  };
  return (
    <Frame style={s.block} contentStyle={{ paddingHorizontal: 6 }}>
      <Pressable onPress={onAll} style={s.recHead} accessibilityRole="button" accessibilityLabel="See all recipes">
        <Text style={s.blockName}>Recipes</Text>
        <Text style={s.recAll}>{'See all ›'}</Text>
      </Pressable>
      <View style={s.recRow}>
        {shown.length === 0 ? (
          <Pressable onPress={onAll} style={[s.recCard, { backgroundColor: '#1A1240' }]}><Text style={s.recName}>No recipes yet</Text><Text style={s.recSub}>Tap to add one</Text></Pressable>
        ) : shown.map((x, i) => {
          const k = kcalOf(x), [a, b] = REC_GRAD[i % REC_GRAD.length];
          return (
            <Pressable key={x.id} onPress={onAll} style={s.recCard} accessibilityRole="button" accessibilityLabel={x.title}>
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                <Defs>
                  <LinearGradient id={`rc${i}`} x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={a} />
                    <Stop offset="1" stopColor={b} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width="100%" height="100%" fill={`url(#rc${i})`} />
              </Svg>
              <View style={s.recChef}><Icon d={P.chef} size={24} color="rgba(255,255,255,0.75)" sw={1.6} /></View>
              <Text style={s.recName} numberOfLines={2}>{x.title}</Text>
              <Text style={s.recSub} numberOfLines={1}>{k > 0 ? `${fmt(k)} kcal · ` : ''}{`${x.ingredients.length} ingredients`}</Text>
            </Pressable>
          );
        })}
      </View>
    </Frame>
  );
}

function DateBar({ selected, onSelect, onOpen }: { selected: string; onSelect: (k: string) => void; onOpen: () => void }) {
  return (
    <View style={s.dateBar}>
      <Pressable onPress={() => onSelect(addDays(selected, -1))} style={s.arrow} hitSlop={8} accessibilityLabel="Previous day">
        <Icon d={P.back} size={22} />
      </Pressable>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel="Open calendar" style={s.dateBtn}>
        <Text style={s.dateText}>{fmtDay(selected)}</Text>
      </Pressable>
      <Pressable onPress={() => onSelect(addDays(selected, 1))} style={s.arrow} hitSlop={8} accessibilityLabel="Next day">
        <Icon d={P.next} size={22} />
      </Pressable>
    </View>
  );
}

function WeekStrip({ days, selected, onSelect }: { days: ReturnType<typeof weekDays>; selected: string; onSelect: (k: string) => void }) {
  return (
    <View style={s.week}>
      {days.map((d) => {
        const on = d.key === selected;
        return (
          <Pressable key={d.key} onPress={() => onSelect(d.key)} style={[s.day, on && s.dayOn]} accessibilityLabel={`Day ${d.date}`}>
            <Text style={[s.dayL, on && { color: c.glowText }]}>{d.letter}</Text>
            <Text style={[s.dayN, on && { color: '#fff', ...textGlow(c.glow, 8) }]}>{d.date}</Text>
            <View style={[s.todayDot, { opacity: d.isToday && !on ? 1 : 0 }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

function MealBlock({ label, entries, icons, open, onToggle, onAdd, onMenu, onEdit }: { label: string; entries: Entry[]; icons: Record<string, string | undefined>; open: boolean; onToggle: () => void; onAdd: () => void; onMenu: (y: number) => void; onEdit: (id: string) => void }) {
  const dots = React.useRef<View>(null);
  const total = sum(entries, 'kcal');
  return (
    <Frame style={s.block} contentStyle={{ paddingHorizontal: 6 }}>
      <Pressable onPress={onToggle} style={s.blockHead} accessibilityRole="button" accessibilityLabel={`${label}, ${open ? 'collapse' : 'expand'}`}>
        <Icon d={open ? P.chevDown : P.next} size={20} color={c.muted} />
        <View style={{ flex: 1 }}>
          <Text style={s.blockName}>{label}</Text>
        </View>
        <Text style={s.blockKcal}>{fmt(total)} kcal</Text>
        <Pressable ref={dots} onPress={() => dots.current?.measureInWindow((_x, y, _w, h) => onMenu(y + h))} style={s.dots} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Options ${label}`}>
          <Icon d={P.more} size={22} color={c.muted} sw={3} />
        </Pressable>
      </Pressable>
      {open && (
        <>
          {entries.map((e) => {
            const { base, qty } = entryBase(e);
            const amount = base.unit === 'srv' ? (qty === 1 ? '1 serving' : `${qty} servings`) : `${qty} ${base.unit}`;
            const macros = [amount, e.brand].filter(Boolean).join(' · ');
            return (
              <Pressable key={e.id} onPress={() => onEdit(e.id)} style={s.item} accessibilityLabel={`Edit ${e.name}`}>
                <FoodIcon name={e.name} icon={e.fk ? icons[e.fk] : undefined} size={32} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.itemName} numberOfLines={1}>{e.name}</Text>
                  {macros ? <Text style={s.itemSub}>{macros}</Text> : null}
                </View>
                <Text style={s.itemKcal}>{fmt(e.kcal)}</Text>
              </Pressable>
            );
          })}
          <View style={s.btnRow}>
            <Pressable onPress={onAdd} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Add food to ${label}`}>
              <Image source={ADD_BTN} style={{ width: 118, height: 37 }} resizeMode="contain" />
            </Pressable>
          </View>
        </>
      )}
    </Frame>
  );
}

export function Home({ selected, onSelect, onOpenCalendar, onAdd, onEdit, onGoSettings, onGoRecipes }: {
  selected: string;
  onSelect: (k: string) => void;
  onOpenCalendar: () => void;
  onAdd: (meal: MealKey, day: string, scan?: boolean) => void;
  onEdit: (entry: Entry) => void;
  onGoSettings: () => void;
  onGoRecipes: () => void;
}) {
  const { state, setWater, updateEntry, addEntry, removeEntry } = useStore();
  const [factory, setFactory] = useState<{ label: string; entries: Entry[] } | null>(null);
  type Blk = { key: MealKey; label: string; entries: Entry[] };
  const [menu, setMenu] = useState<{ blk: Blk; y: number } | null>(null);
  const [summary, setSummary] = useState<Blk | null>(null);
  const [copyBlk, setCopyBlk] = useState<Blk | null>(null);
  const [copyDay, setCopyDay] = useState<string | null>(null);
  const copyPicked = React.useRef(false);
  const icons = useMemo(() => Object.fromEntries(Object.values(state.foods).map((x) => [x.key, x.icon])), [state.foods]);
  const profile = state.profile!;
  const t = useMemo(() => targets(profile), [profile]);
  const [closed, setClosed] = useState<Partial<Record<MealKey, boolean>>>({});

  const days = useMemo(() => weekDays(parseKey(selected)), [selected]);
  const steps = useSteps(days.map((d) => d.key), state.settings.fit, state.settings.stepSource);
  const selIdx = days.findIndex((d) => d.key === selected);
  const maxSteps = steps ? Math.max(1, ...steps) : 1;

  const entries = state.entries.filter((e) => e.day === selected);
  const confirmClear = (b: { label: string; entries: Entry[] }) => {
    askConfirm({ title: 'Clear Meal Entry', message: tr(`Remove all ${b.entries.length} items from ${b.label}?`), confirmText: tr('Clear Meal Entry'), danger: true })
      .then((ok) => { if (ok) b.entries.forEach((e) => removeEntry(e.id)); });
  };
  const eaten = sum(entries, 'kcal');
  const left = t.kcal - eaten;
  const pct = Math.min(eaten / t.kcal, 1);
  const R = 58, C = 2 * Math.PI * R;
  const count = state.water[selected] ?? 0;
  const litres = Number((count * DROP_L).toFixed(2));
  const setCount = (n: number) => setWater(selected, Math.max(0, Math.min(40, n)));

  const st = state.settings;
  type Sub = { name: string; v: number; goal: number };
  const macros: { name: string; v: number; goal: number; subs: Sub[] }[] = [
    { name: 'Protein', v: sum(entries, 'p'), goal: t.protein, subs: [] },
    { name: 'Carbs', v: sum(entries, 'c'), goal: t.carbs, subs: st.showSugar ? [{ name: 'Sugar', v: sum(entries, 'sg'), goal: t.sugar }] : [] },
    {
      name: 'Fat', v: sum(entries, 'f'), goal: t.fat,
      subs: [
        ...(st.showSalt ? [{ name: 'Salt', v: sum(entries, 'sl'), goal: t.salt }] : []),
        ...(st.showFiber ? [{ name: 'Fiber', v: sum(entries, 'fi'), goal: t.fiber }] : []),
        ...(st.showSat ? [{ name: 'Sat. fat', v: sum(entries, 'sf'), goal: t.sat }] : []),
      ],
    },
  ];
  const nSubs = macros.reduce((a, m) => a + m.subs.length, 0);
  const shown = MEALS.filter((m) => st.meals.includes(m.key) || state.entries.some((e) => e.day === selected && e.meal === m.key));

  return (
    <Screen>
      <DateBar selected={selected} onSelect={onSelect} onOpen={onOpenCalendar} />
      <WeekStrip days={days} selected={selected} onSelect={onSelect} />

      <Frame style={s.hero} contentStyle={s.heroIn}>
        <KcalRing eaten={eaten} target={t.kcal} />
        <View style={{ flex: 1, gap: nSubs > 1 ? 7 : 11 }}>
          {macros.map((m, i) => (
            <View key={m.name} style={s.mRow}>
              <View style={{ marginTop: 1 }}>
                <Svg width={22} height={22} viewBox="0 0 24 24">{MACRO_ICON[i]}</Svg>
              </View>
              <View style={{ flex: 1 }}>
                <View style={s.macroTop}>
                  <Text style={s.macroName}>{m.name}</Text>
                  <Text style={s.macroVal}>{Math.round(m.v)}<Text style={s.macroGoal}> / {m.goal} g</Text></Text>
                </View>
                <View style={s.mBar}>
                  <View style={{ flex: 1 }}><GlowBar pct={m.v / m.goal} i={i} /></View>
                </View>
                {m.subs.map((x) => (
                  <View key={x.name} style={{ marginTop: 5 }}>
                    <View style={s.macroTop}>
                      <Text style={s.subName}>{x.name}</Text>
                      <Text style={s.subVal}>{Math.round(x.v * 10) / 10}<Text style={s.macroGoal}>/{x.goal}g</Text></Text>
                    </View>
                    <View style={s.trackS}><View style={[s.fillS, { width: `${Math.min(x.v / x.goal, 1) * 100}%`, backgroundColor: MACRO_COLOR[i] }]} /></View>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </Frame>

      <View style={s.tiles}>
        <StatTile
          id="st" art={STEPS_ART} accent="#A36BFF" label="Steps today"
          icon={<Icon d={P.steps} size={24} color="#A36BFF" sw={2} />}
          value={state.settings.fit ? (steps && selIdx >= 0 ? fmt(steps[selIdx]) : '…') : '0'} unit={` / ${fmt(state.settings.stepGoal)}`}
          pct={state.settings.fit && steps && selIdx >= 0 ? steps[selIdx] / state.settings.stepGoal : 0}
          onPress={state.settings.fit ? undefined : onGoSettings}
          buttons={state.settings.fit ? null : <View style={s.rbtn}><Icon d={P.next} size={14} sw={2.8} color="#fff" /></View>}
        />
        <StatTile
          id="wt" art={WATER_ART} accent="#2F9BFF" label="Water"
          icon={<Icon d={P.drop} size={24} color="#2F9BFF" fill="#2F9BFF" sw={0} />}
          value={String(litres).replace('.', ',')} unit={` / ${String(WATER_GOAL).replace('.', ',')} L`} pct={litres / WATER_GOAL}
          buttons={
            <>
              <Pressable onPress={() => setCount(count - 1)} style={s.rbtn} hitSlop={6} accessibilityLabel="Remove 250 mL"><Icon d={P.minus} size={14} sw={2.8} color="#fff" /></Pressable>
              <Pressable onPress={() => setCount(count + 1)} style={s.rbtn} hitSlop={6} accessibilityLabel="Add 250 mL"><Icon d={P.plus} size={14} sw={2.8} color="#fff" /></Pressable>
            </>
          }
        />
      </View>

      <View style={{ marginTop: 10, gap: 8 }}>
        {shown.map((m) => (
          <MealBlock
            key={m.key}
            label={m.label}
            icons={icons}
            entries={entries.filter((e) => e.meal === m.key)}
            onMenu={(y) => setMenu({ blk: { key: m.key, label: m.label, entries: entries.filter((e) => e.meal === m.key) }, y })}
            open={!closed[m.key]}
            onToggle={() => setClosed((x) => ({ ...x, [m.key]: !x[m.key] }))}
            onAdd={() => onAdd(m.key, selected)}
            onEdit={(id) => onEdit(entries.find((x) => x.id === id)!)}
          />
        ))}
      </View>
      <View style={{ marginTop: 8 }}>
        <RecipesBlock recipes={state.recipes} foods={state.foods} onAll={onGoRecipes} />
      </View>
      <BlockMenu
        anchorY={menu ? menu.y : null}
        onClose={() => setMenu(null)}
        items={menu ? [
          { label: 'Clear Meal Entry', icon: P.trash, danger: true, onPress: () => confirmClear(menu.blk) },
          { label: 'Factor', icon: P.factor, onPress: () => setFactory({ label: menu.blk.label, entries: menu.blk.entries }) },
          { label: 'Copy', icon: P.copy, onPress: () => setCopyBlk(menu.blk) },
          { label: 'Scan It', icon: P.scan, onPress: () => onAdd(menu.blk.key, selected, true) },
          { label: 'Meal Summary', icon: P.stats, onPress: () => setSummary(menu.blk) },
        ].filter((it) => menu.blk.entries.length > 0 || it.label === 'Scan It') : []}
      />
      <MealSummary visible={!!summary} label={summary?.label ?? ''} entries={summary?.entries ?? []} budget={t.kcal} onClose={() => setSummary(null)} />
      <Calendar
        visible={!!copyBlk && !copyDay}
        selected={selected}
        marks={new Set(state.entries.map((e) => e.day))}
        title={copyBlk ? `Copy ${copyBlk.label} to…` : undefined}
        onPick={(k) => { copyPicked.current = true; setCopyDay(k); }}
        onClose={() => { if (copyPicked.current) copyPicked.current = false; else setCopyBlk(null); }}
      />
      <MealPick
        visible={!!copyBlk && !!copyDay}
        title="Copy into which meal?"
        meals={shown.map((m) => ({ key: m.key, label: m.label }))}
        initial={copyBlk?.key}
        onClose={() => { setCopyBlk(null); setCopyDay(null); }}
        onPick={(meal) => {
          if (copyBlk && copyDay) { copyBlk.entries.forEach(({ id: _id, ...e }) => addEntry({ ...e, day: copyDay, meal })); onSelect(copyDay); }
          setCopyBlk(null); setCopyDay(null);
        }}
      />
      <FactorModal
        visible={!!factory}
        title={`Factor · ${factory?.label ?? ''}`}
        confirm="Apply"
        kcal={factory ? sum(factory.entries, 'kcal') : 0}
        onClose={() => setFactory(null)}
        onApply={(k) => { factory?.entries.forEach((e) => updateEntry(e.id, scaleEntry(e, k))); setFactory(null); }}
      />
    </Screen>
  );
}

const mkStyles = () => StyleSheet.create({
  dateBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46 },
  arrow: { width: 42, height: 42, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  dateBtn: { paddingVertical: 8, paddingHorizontal: 8 },
  dateText: { fontFamily: f.extra, fontSize: 18, color: c.ink, letterSpacing: 1.4, minWidth: 150, textAlign: 'center', ...textGlow(c.glow, 12) },

  week: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 10, marginTop: 8 },
  day: { width: 45, height: 64, borderRadius: 4, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', gap: 4 },
  dayOn: { backgroundColor: c.btn, borderColor: c.glow, ...glow(c.glow, 12, 0.7) },
  dayL: { fontFamily: f.semi, fontSize: 11, color: c.soft, letterSpacing: 1, textTransform: 'uppercase' },
  dayN: { fontFamily: f.bold, fontSize: 16, color: c.ink },
  todayDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: c.glow, ...glow(c.glow, 6, 1) },

  hero: { marginHorizontal: 10, marginTop: 12 },
  heroIn: { minHeight: 132, paddingVertical: 8, paddingLeft: 8, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 14 },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringBig: { fontFamily: f.extra, fontSize: 22, color: c.ink, letterSpacing: 0.5, ...textGlow(c.glow, 14) },
  ringPct: { fontFamily: f.bold, fontSize: 11.5, color: '#fff', marginTop: 2 },
  ringSmall: { fontFamily: f.medium, fontSize: 9.5, color: '#8A80C8', marginTop: 1 },
  mRow: { flexDirection: 'row', gap: 8 },
  mBar: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  stile: { flex: 1 },
  stileArt: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '78%' },
  stileIn: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 4 },
  stileLabel: { fontFamily: f.medium, fontSize: 11, color: '#E7E1FF' },
  stileVal: { fontFamily: f.bold, fontSize: 17, color: '#fff' },
  stileUnit: { fontFamily: f.medium, fontSize: 10.5 },
  stileBar: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  stilePct: { fontFamily: f.medium, fontSize: 10, width: 28, textAlign: 'right' },
  stileBtns: { position: 'absolute', top: 0, right: 0, flexDirection: 'row', gap: 6 },
  rbtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(10,8,28,0.85)', borderWidth: 1, borderColor: 'rgba(190,180,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  macroName: { fontFamily: f.medium, fontSize: 12.5, color: c.ink },
  macroVal: { fontFamily: f.bold, fontSize: 12.5, color: c.ink },
  macroGoal: { fontFamily: f.medium, color: c.muted },
  subName: { fontFamily: f.semi, fontSize: 10.5, color: c.soft, letterSpacing: 1, textTransform: 'uppercase' },
  subVal: { fontFamily: f.bold, fontSize: 11, color: c.muted },
  trackS: { height: 3, borderRadius: 1, backgroundColor: c.line, overflow: 'hidden' },
  fillS: { height: 3, borderRadius: 1, backgroundColor: c.glow, opacity: 0.8 },
  track: { height: 6, borderRadius: 1, backgroundColor: c.line, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 1, backgroundColor: c.glow },

  tiles: { flexDirection: 'row', gap: 8, marginHorizontal: 10, marginTop: 10 },
  tile: { ...card, flex: 1, height: 142, borderRadius: 4, padding: 14 },
  tileRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  ico: { width: 32, height: 32, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  tileLabel: { fontFamily: f.semi, fontSize: 12, color: c.muted, letterSpacing: 1.2, textTransform: 'uppercase' },
  big: { fontFamily: f.extra, fontSize: 22, color: c.ink, letterSpacing: 0.6, lineHeight: 32, paddingVertical: 2, marginTop: 8, marginBottom: 8 },
  bigUnit: { fontFamily: f.semi, fontSize: 13, color: c.muted, letterSpacing: 0 },
  connect: { fontFamily: f.bold, fontSize: 13, color: c.orange, lineHeight: 32, marginTop: 8, marginBottom: 8, letterSpacing: 0.6 },
  bars: { height: 28, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  pm: { width: 26, height: 26, borderRadius: 3, marginLeft: 4, backgroundColor: c.blueTint, borderWidth: 1, borderColor: c.blueSoft, alignItems: 'center', justifyContent: 'center' },
  drops: { height: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  block: { marginHorizontal: 10 },
  recHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  recAll: { fontFamily: f.semi, fontSize: 12.5, color: c.glowText },
  recRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  recCard: { flex: 1, height: 100, borderRadius: 4, padding: 8, justifyContent: 'flex-end', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(190,170,255,0.28)' },
  recChef: { position: 'absolute', top: 8, right: 8 },
  recName: { fontFamily: f.semi, fontSize: 12, lineHeight: 14, color: '#fff' },
  recSub: { fontFamily: f.medium, fontSize: 10, color: '#D9CCFF', marginTop: 2 },
  dots: { width: 32, height: 36, alignItems: 'center', justifyContent: 'center' },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  blockName: { fontFamily: f.extra, fontSize: 14, color: c.ink, letterSpacing: 1.2 },
  blockKcal: { fontFamily: f.bold, fontSize: 14, color: c.glowText, marginRight: -4 },
  blockSub: { fontFamily: f.medium, fontSize: 13, color: c.muted, marginTop: 2 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, marginTop: 2 },
  itemName: { fontFamily: f.semi, fontSize: 14, color: c.ink },
  itemSub: { fontFamily: f.regular, fontSize: 12, color: c.muted, marginTop: 1 },
  itemKcal: { fontFamily: f.medium, fontSize: 14, color: c.ink, marginLeft: 10 },
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  addBtn: { backgroundColor: c.tint, borderRadius: 4, borderWidth: 1, borderColor: c.panelLine, paddingVertical: 9, paddingHorizontal: 22 },
  addText: { fontFamily: f.bold, fontSize: 12.5, color: c.glowText, letterSpacing: 1.6, textTransform: 'uppercase' },
});
let s = mkStyles();
onTheme(() => { s = mkStyles(); });
