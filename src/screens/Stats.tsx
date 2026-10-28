import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput, tr } from '../i18n';
import { askConfirm } from '../dialog';
import { Calendar } from './Calendar';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SText } from 'react-native-svg';
import { c, f, onTheme, textGlow } from '../theme';
import { addDays, dayKey, fmt, fmtDay, parseKey, sum, targets, weekDays } from '../domain';
import { useStore } from '../store';
import { useSteps } from '../steps';
import { Frame, Icon, KbView, P, Screen } from '../ui';

const FAT = '#F5B83D', CARB = '#2F9BFF', PROT = '#A36BFF';
const BAR_H = 112; // height of the bar area
const BUDGET = 'rgba(245,184,61,0.75)';

type Day = ReturnType<typeof weekDays>[number];

/** Vertical gradient bar. */
function GradBar({ id, h, a, b }: { id: string; h: number; a: string; b: string }) {
  return (
    <Svg width={26} height={h}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor={a} />
          <Stop offset="1" stopColor={b} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={26} height={h} rx={2} fill={`url(#${id})`} />
    </Svg>
  );
}

/** One column per weekday: value above, bar (or stacked shares), day letter below, optional dashed budget line. */
function Cols({ id, days, values, scale, budget, stacks, over, showVals }: { id: string; days: Day[]; values?: number[]; scale?: number; budget?: number; stacks?: ({ f: number; c: number; p: number } | null)[]; over?: (i: number) => boolean; showVals?: boolean }) {
  return (
    <View style={s.cols}>
      {days.map((d, i) => {
        const v = values?.[i] ?? 0, st = stacks?.[i];
        const h = Math.max(values ? Math.min(v / (scale ?? 1), 1) * BAR_H : st ? BAR_H : 0, 0);
        return (
          <View key={d.key} style={s.col}>
            {showVals ? <Text style={s.colV}>{v > 0 ? fmt(v) : ' '}</Text> : null}
            <View style={s.colBar}>
              {st ? (
                <View style={[s.stack, { height: BAR_H }]}>
                  <View style={{ flex: st.f, backgroundColor: FAT }} />
                  <View style={{ flex: st.c, backgroundColor: CARB }} />
                  <View style={{ flex: st.p, backgroundColor: PROT }} />
                </View>
              ) : v > 0 ? <GradBar id={`${id}${i}`} h={Math.max(h, 6)} a={over?.(i) ? '#F5A000' : '#8B4DFF'} b={over?.(i) ? '#FFD04A' : '#B98CFF'} /> : <View style={s.colZero} />}
            </View>
            <Text style={[s.colL, d.isToday && { color: '#fff' }]}>{d.letter}</Text>
          </View>
        );
      })}
      {budget != null && scale ? (
        <Svg style={[s.budget, { bottom: 18 + (budget / scale) * BAR_H }]} width="100%" height={2} pointerEvents="none">
          <Line x1={0} x2="100%" y1={1} y2={1} stroke={BUDGET} strokeWidth={1.5} strokeDasharray="4 3" />
        </Svg>
      ) : null}
    </View>
  );
}

function CardHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <View style={s.cardHead}>
      <Text style={s.cardT}>{title}</Text>
      {sub ? <Text style={s.cardSub}>{sub}</Text> : null}
      {right}
    </View>
  );
}

const RANGES: [string, string, number][] = [['1W', '1 week', 7], ['1M', '1 month', 30], ['3M', '3 months', 91], ['6M', '6 months', 182], ['1Y', '1 year', 365], ['All', 'Since inception', Infinity]];
const shortDate = (k: string) => { const d = parseKey(k); return `${d.getDate()} ${tr(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()])}`; };

function WeightChart({ pts, goal }: { pts: [string, number][]; goal: number }) {
  const [w, setW] = useState(300);
  const H = 160, padL = 34, padR = 8, padT = 10, padB = 22;
  if (!pts.length) return <Text style={s.empty}>No weigh-in in this period. Tap + to log your weight.</Text>;
  const t0 = parseKey(pts[0][0]).getTime(), t1 = parseKey(pts[pts.length - 1][0]).getTime();
  const vals = pts.map((p) => p[1]);
  let lo = Math.min(...vals, goal), hi = Math.max(...vals, goal);
  if (hi - lo < 2) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.1; lo -= pad; hi += pad;
  const X = (k: string) => (t1 === t0 ? padL + (w - padL - padR) / 2 : padL + ((parseKey(k).getTime() - t0) / (t1 - t0)) * (w - padL - padR));
  const Y = (v: number) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0])} ${Y(p[1])}`).join(' ');
  const ticks = [hi - pad, (hi + lo) / 2, lo + pad];
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <Svg width={w} height={H}>
        <Defs>
          <LinearGradient id="wArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#8B4DFF" stopOpacity={0.5} />
            <Stop offset="1" stopColor="#8B4DFF" stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {ticks.map((v, i) => (
          <React.Fragment key={i}>
            <Line x1={padL} x2={w - padR} y1={Y(v)} y2={Y(v)} stroke={c.line} strokeWidth={1} />
            <SText x={0} y={Y(v) + 4} fontSize={11} fill={c.muted}>{v.toFixed(1)}</SText>
          </React.Fragment>
        ))}
        {goal >= lo && goal <= hi && <Line x1={padL} x2={w - padR} y1={Y(goal)} y2={Y(goal)} stroke={c.glowText} strokeWidth={1.5} strokeDasharray="5 4" />}
        {pts.length > 1 && <Path d={`${path} L${X(pts[pts.length - 1][0])} ${H - padB} L${X(pts[0][0])} ${H - padB} Z`} fill="url(#wArea)" />}
        {pts.length > 1 && <Path d={path} stroke="#C3A0FF" strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
        {pts.map((p) => <Circle key={p[0]} cx={X(p[0])} cy={Y(p[1])} r={pts.length > 40 ? 0 : 4} fill={c.glow} stroke={c.ink} strokeWidth={2} />)}
        <SText x={padL} y={H - 4} fontSize={11} fill={c.muted}>{shortDate(pts[0][0])}</SText>
        {pts.length > 1 && <SText x={w - padR} y={H - 4} fontSize={11} fill={c.muted} textAnchor="end">{shortDate(pts[pts.length - 1][0])}</SText>}
      </Svg>
    </View>
  );
}

/** History of weigh-ins: edit (value and date) or delete each one. */
function WeightLogs({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, setWeight, removeWeight } = useStore();
  const [ed, setEd] = useState<{ day: string; to: string; kg: string } | null>(null);
  const [cal, setCal] = useState(false);
  const rows = Object.entries(state.weights).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  const kgNum = ed ? parseFloat(ed.kg.replace(',', '.')) : NaN;
  const ok = Number.isFinite(kgNum) && kgNum >= 20 && kgNum <= 400;
  const save = () => {
    if (!ed || !ok) return;
    if (ed.to !== ed.day) removeWeight(ed.day);
    setWeight(ed.to, Math.round(kgNum * 10) / 10);
    setEd(null);
  };
  const del = (day: string) => askConfirm({ title: 'Delete this weigh-in?', message: fmtDay(day), confirmText: tr('Delete'), danger: true }).then((o) => { if (o) removeWeight(day); });
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.lWrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={s.lBox}>
          <View style={s.lHead}>
            <Text style={s.cardT}>Weight logs</Text>
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close logs"><Icon d={P.x} size={20} color={c.muted} /></Pressable>
          </View>
          {rows.length === 0 ? <Text style={s.empty}>No weigh-in yet.</Text> : (
            <ScrollView style={{ maxHeight: 420 }}>
              {rows.map(([d, kg], i) => (
                <View key={d} style={[s.lRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
                  <Pressable onPress={() => setEd({ day: d, to: d, kg: String(kg) })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} accessibilityRole="button" accessibilityLabel={`Edit ${d}`}>
                    <Text style={s.lDate}>{fmtDay(d)}</Text>
                    <Text style={s.lKg}>{`${kg} kg`}</Text>
                  </Pressable>
                  <Pressable onPress={() => del(d)} hitSlop={8} style={{ paddingLeft: 14 }} accessibilityRole="button" accessibilityLabel={`Delete ${d}`}><Icon d={P.trash} size={18} color={c.red} /></Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
      <Modal visible={!!ed} transparent animationType="fade" onRequestClose={() => setEd(null)} statusBarTranslucent>
        <KbView style={s.lWrap}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEd(null)} accessibilityLabel="Close" />
          {ed && (
            <View style={s.lBox}>
              <Text style={s.cardT}>Edit weigh-in</Text>
              <Pressable onPress={() => setCal(true)} style={s.lDateBtn} accessibilityRole="button" accessibilityLabel="Choose the date">
                <Icon d={P.calendar} size={16} color={c.glowText} sw={2.2} /><Text style={s.lDateT}>{fmtDay(ed.to)}</Text>
              </Pressable>
              <View style={s.lKgBox}>
                <TextInput style={s.lKgIn} value={ed.kg} onChangeText={(v) => setEd({ ...ed, kg: v })} keyboardType="decimal-pad" maxLength={6} selectTextOnFocus selectionColor={c.glow} accessibilityLabel="Weight in kilograms" />
                <Text style={s.lUnit}>kg</Text>
              </View>
              <Pressable onPress={save} disabled={!ok} style={[s.lCta, !ok && { opacity: 0.35 }]} accessibilityRole="button"><Text style={s.lCtaT}>Save</Text></Pressable>
            </View>
          )}
          <Calendar visible={cal} selected={ed?.to ?? dayKey()} marks={new Set(Object.keys(state.weights))} title="Date of the weigh-in" onPick={(k) => setEd((e) => e && { ...e, to: k })} onClose={() => setCal(false)} />
        </KbView>
      </Modal>
    </Modal>
  );
}

/** Stats: this week's calories, macros and steps, plus weight over time. */
export function Stats({ onLogWeight }: { onLogWeight: () => void }) {
  const { state } = useStore();
  const [logs, setLogs] = useState(false);
  const t = targets(state.profile!);
  const days = useMemo(() => weekDays(), []);
  const today = dayKey();
  const [range, setRange] = useState(1);

  const per = days.map((d) => {
    const es = state.entries.filter((e) => e.day === d.key);
    return { kcal: sum(es, 'kcal'), p: sum(es, 'p'), c: sum(es, 'c'), f: sum(es, 'f'), n: es.length };
  });
  const iToday = days.findIndex((d) => d.isToday);
  const kT = per[iToday]?.kcal ?? 0;
  const left = t.kcal - kT;
  const elapsed = days.map((d, i) => d.key <= today && per[i].n > 0);
  const diff = per.reduce((a, x, i) => a + (elapsed[i] ? t.kcal - x.kcal : 0), 0);

  // macro shares, by energy
  const share = (x: { p: number; c: number; f: number }) => {
    const e = x.f * 9 + x.c * 4 + x.p * 4;
    return e > 0 ? { f: (x.f * 9) / e, c: (x.c * 4) / e, p: (x.p * 4) / e } : null;
  };
  const tot = per.reduce((a, x) => ({ p: a.p + x.p, c: a.c + x.c, f: a.f + x.f }), { p: 0, c: 0, f: 0 });
  const wk = share(tot);
  const shares = per.map(share);
  const used = shares.filter((x): x is NonNullable<typeof x> => !!x);
  const avg = used.length ? { f: used.reduce((a, x) => a + x.f, 0) / used.length, c: used.reduce((a, x) => a + x.c, 0) / used.length, p: used.reduce((a, x) => a + x.p, 0) / used.length } : null;
  const pc = (v?: number) => (v == null ? '—' : `${Math.round(v * 100)}%`);

  // steps
  const steps = useSteps(days.map((d) => d.key), state.settings.fit, state.settings.stepSource);
  const goal = state.settings.stepGoal;
  const sv = steps ?? days.map(() => 0);
  const stepsToday = iToday >= 0 ? sv[iToday] : 0;
  const stepsTotal = sv.reduce((a, b) => a + b, 0);
  const stepDays = sv.filter((x, i) => x > 0 && days[i].key <= today).length;

  // weight
  const all = useMemo(() => {
    const e = Object.entries(state.weights).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    return e.length ? e : ([[today, state.profile!.weightKg]] as [string, number][]);
  }, [state.weights, state.profile, today]);
  const n = RANGES[range][2];
  const pts = all.filter(([k]) => n === Infinity || k >= addDays(today, -(n - 1)));
  const first = pts[0]?.[1], last = pts[pts.length - 1]?.[1];
  const change = pts.length > 1 ? last - first : null;

  return (
    <Screen>
      <Text style={s.pageT}>Statistics</Text>

      <Frame style={s.card} contentStyle={s.cardIn}>
        <CardHead title="Calories" sub="this week" />
        <Cols id="kc" days={days} values={per.map((x) => x.kcal)} scale={Math.max(t.kcal * 1.3, ...per.map((x) => x.kcal))} budget={t.kcal} over={(i) => per[i].kcal > t.kcal} showVals />
        <Text style={s.note}>
          {elapsed.some(Boolean) ? <><Text style={s.noteB}>{fmt(Math.abs(diff))} calories</Text>{` ${diff >= 0 ? 'under' : 'over'} budget for week`}</> : 'Log meals to see your week against your budget'}
        </Text>
      </Frame>

      <Frame style={s.card} contentStyle={s.cardIn}>
        <CardHead title="Macronutrients" sub="% of calories" />
        <Cols id="mc" days={days} stacks={shares} />
        <View style={s.leg}>
          {([['Protein', PROT], ['Carbs', CARB], ['Fat', FAT]] as const).map(([l, col]) => (
            <View key={l} style={s.legI}><View style={[s.dot, { backgroundColor: col }]} /><Text style={s.legL}>{l}</Text></View>
          ))}
        </View>
        <View style={s.avgRow}>
          <Text style={s.avgL}>Average</Text>
          {([[avg?.p, PROT], [avg?.c, CARB], [avg?.f, FAT]] as const).map(([v, col], i) => (
            <View key={i} style={[s.chip, { backgroundColor: col + '40' }]}><Text style={s.chipT}>{pc(v)}</Text></View>
          ))}
        </View>
      </Frame>

      <Frame style={s.card} contentStyle={s.cardIn}>
        <CardHead title="Steps" sub="this week" />
        {state.settings.fit ? (
          <>
            <Cols id="sc" days={days} values={sv} scale={Math.max(goal * 1.1, ...sv)} showVals />
            <Text style={s.note}><Text style={s.noteB}>{fmt(stepsTotal)} steps</Text> this week{stepDays > 0 ? ` · ${fmt(stepsTotal / stepDays)} a day` : ''}</Text>
          </>
        ) : (
          <Text style={s.empty}>Turn on “Sync steps” in Profile to see your steps here.</Text>
        )}
      </Frame>

      <Frame style={s.card} contentStyle={s.cardIn}>
        <CardHead
          title="Weight"
          right={(
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={() => setLogs(true)} style={s.logsBtn} accessibilityRole="button" accessibilityLabel="Weight logs"><Icon d={P.list} size={13} sw={2.4} color={c.ink} /><Text style={s.logsT}>Logs</Text></Pressable>
              <Pressable onPress={onLogWeight} style={s.plus} accessibilityRole="button" accessibilityLabel="Log weight"><Icon d={P.plus} size={16} sw={2.8} color={c.glow} /></Pressable>
            </View>
          )}
        />
        <Text style={s.wBig}>{last != null ? last : '—'}<Text style={s.wUnit}> kg</Text></Text>
        {change != null && <Text style={[s.wDelta, { color: change <= 0 ? '#C3A0FF' : c.orange }]}>{change > 0 ? '+' : ''}{change.toFixed(1)} kg · {RANGES[range][1].toLowerCase()}</Text>}
        <WeightChart pts={pts} goal={state.profile!.goalKg} />
        <View style={s.ranges}>
          {RANGES.map(([k], i) => (
            <Pressable key={k} onPress={() => setRange(i)} style={[s.range, range === i && s.rangeOn]} accessibilityRole="button" accessibilityLabel={RANGES[i][1]}>
              <Text style={[s.rangeT, range === i && { color: '#C3A0FF' }]}>{k}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.rangeName}>{RANGES[range][1]} · dashed line = goal {state.profile!.goalKg} kg</Text>
      </Frame>
      <WeightLogs visible={logs} onClose={() => setLogs(false)} />
    </Screen>
  );
}

const mkStyles = () => StyleSheet.create({
  logsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 28, borderRadius: 3, paddingHorizontal: 9, borderWidth: 1, borderColor: '#3A2C80' },
  logsT: { fontFamily: f.semi, fontSize: 11, color: '#E7E1FF' },
  lWrap: { flex: 1, backgroundColor: 'rgba(2,4,14,0.8)', justifyContent: 'center', paddingHorizontal: 20 },
  lBox: { backgroundColor: c.card, borderRadius: 6, padding: 18, gap: 10, borderWidth: 1, borderColor: c.panelLine },
  lHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  lDate: { flex: 1, fontFamily: f.medium, fontSize: 15, color: c.ink },
  lKg: { fontFamily: f.medium, fontSize: 15, color: c.ink },
  lDateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center', backgroundColor: c.tint, borderRadius: 6, paddingHorizontal: 16, height: 38 },
  lDateT: { fontFamily: f.bold, fontSize: 14, color: c.glowText },
  lKgBox: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', backgroundColor: c.page, borderRadius: 6, paddingVertical: 8, gap: 6 },
  lKgIn: { fontFamily: f.extra, fontSize: 34, color: c.ink, minWidth: 100, textAlign: 'right', paddingVertical: 0 },
  lUnit: { fontFamily: f.bold, fontSize: 16, color: c.muted },
  lCta: { height: 50, borderRadius: 6, backgroundColor: c.btn, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.glow},
  lCtaT: { fontFamily: f.bold, fontSize: 16, color: '#fff', letterSpacing: 1.6, textTransform: 'uppercase' },
  card: { marginHorizontal: 10, marginBottom: 8 },
  cardIn: { paddingHorizontal: 6, paddingVertical: 2 },
  pageT: { fontFamily: f.extra, fontSize: 22, color: '#fff', letterSpacing: 2.4, textAlign: 'center', textTransform: 'uppercase', marginBottom: 10, ...textGlow('#8B4DFF', 14) },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, minHeight: 28 },
  cardT: { fontFamily: f.extra, fontSize: 12.5, color: '#fff', letterSpacing: 1.25, textTransform: 'uppercase' },
  cardSub: { fontFamily: f.semi, fontSize: 11, color: '#C3A0FF' },
  cols: { flexDirection: 'row', gap: 8, position: 'relative' },
  col: { flex: 1, alignItems: 'center' },
  colV: { fontFamily: f.medium, fontSize: 9.5, color: '#B9AEE8', marginBottom: 3 },
  colBar: { height: BAR_H, width: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  colZero: { width: 26, height: 1, backgroundColor: '#3A2C80' },
  stack: { width: 26, borderRadius: 2, overflow: 'hidden' },
  colL: { fontFamily: f.semi, fontSize: 10, color: '#8A80C8', marginTop: 5, textTransform: 'uppercase' },
  budget: { position: 'absolute', left: -5, right: -5 },
  note: { fontFamily: f.medium, fontSize: 12, color: '#B9AEE8', marginTop: 8 },
  noteB: { fontFamily: f.bold, color: '#fff' },
  leg: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  legI: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legL: { fontFamily: f.medium, fontSize: 11, color: '#B9AEE8' },
  dot: { width: 8, height: 8, borderRadius: 2 },
  avgRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  avgL: { fontFamily: f.semi, fontSize: 11, color: '#8A80C8', marginRight: 2 },
  chip: { borderRadius: 3, paddingHorizontal: 9, paddingVertical: 3 },
  chipT: { fontFamily: f.bold, fontSize: 11, color: '#fff' },
  empty: { fontFamily: f.regular, fontSize: 14, color: c.muted, lineHeight: 21 },
  plus: { width: 28, height: 28, borderRadius: 4, backgroundColor: c.btn, alignItems: 'center', justifyContent: 'center' },
  wBig: { fontFamily: f.bold, fontSize: 26, color: '#fff' },
  wUnit: { fontFamily: f.medium, fontSize: 13, color: '#8A80C8' },
  wDelta: { fontFamily: f.semi, fontSize: 12, marginBottom: 4 },
  ranges: { flexDirection: 'row', gap: 6, marginTop: 8 },
  range: { flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: 3, borderWidth: 1, borderColor: '#2A2160' },
  rangeOn: { borderColor: '#7A3FE0', backgroundColor: '#1D1245' },
  rangeT: { fontFamily: f.semi, fontSize: 11, color: '#8A80C8' },
  rangeName: { fontFamily: f.medium, fontSize: 11, color: '#8A80C8', textAlign: 'center', marginTop: 6 },
});
let s = mkStyles();
onTheme(() => { s = mkStyles(); });
