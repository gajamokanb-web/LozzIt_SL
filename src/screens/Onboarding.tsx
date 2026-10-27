import React, { useState } from 'react';
import {  Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '../i18n';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { c, f, glow, onTheme, textGlow } from '../theme';
import { ACTIVITY, fmt, targets, type Profile, type Sex } from '../domain';
import { card, Icon, P, KbView } from '../ui';

const num = (t: string) => parseFloat(t.replace(',', '.'));
const inRange = (t: string, lo: number, hi: number) => {
  const n = num(t);
  return Number.isFinite(n) && n >= lo && n <= hi;
};

function Field({ label, unit, value, onChange, placeholder }: { label: string; unit: string; value: string; onChange: (t: string) => void; placeholder: string }) {
  return (
    <View style={[s.field, card]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.fieldRow}>
        <TextInput
          style={s.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={c.soft}
          keyboardType="decimal-pad"
          maxLength={5}
          selectionColor={c.glow}
        />
        <Text style={s.unit}>{unit}</Text>
      </View>
    </View>
  );
}

function Choice({ on, label, hint, onPress }: { on: boolean; label: string; hint?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.choice, card, on && { backgroundColor: c.tint, borderColor: c.glow }]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
      <View style={{ flex: 1 }}>
        <Text style={s.choiceLabel}>{label}</Text>
        {hint ? <Text style={s.choiceHint}>{hint}</Text> : null}
      </View>
      <View style={[s.radio, on && { backgroundColor: c.btn, borderColor: c.btn }]}>{on && <View style={s.radioDot} />}</View>
    </Pressable>
  );
}

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const { top, bottom } = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [sex, setSex] = useState<Sex>('f');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('');
  const [activity, setActivity] = useState(1.375);

  const valid = [
    name.trim().length > 0,
    inRange(age, 14, 99),
    inRange(height, 120, 230) && inRange(weight, 30, 250) && inRange(goal, 30, 250),
    true,
  ];
  const profile = (): Profile => ({ name: name.trim(), sex, age: num(age), heightCm: num(height), weightKg: num(weight), goalKg: num(goal), activity });
  const preview = valid[0] && valid[1] && valid[2] ? targets(profile()) : null;

  const next = () => (step < 3 ? setStep(step + 1) : onDone(profile()));

  const titles = ['What should we call you?', 'About you', 'Your numbers', 'How active are you?'];

  return (
    <KbView style={{ flex: 1 }}>
      <View style={{ paddingTop: top + 12, paddingHorizontal: 20 }}>
        <View style={s.topRow}>
          <Pressable onPress={() => setStep(Math.max(0, step - 1))} style={[s.back, step === 0 && { opacity: 0 }]} disabled={step === 0} accessibilityLabel="Back">
            <Icon d={P.back} size={20} />
          </Pressable>
          <View style={s.progress}>
            {[0, 1, 2, 3].map((i) => <View key={i} style={[s.seg, i <= step && { backgroundColor: c.glow }]} />)}
          </View>
        </View>
        <Text style={s.kicker}>{step === 0 ? 'The System has chosen you' : `Step ${step + 1} of 4`}</Text>
        <Text style={s.h1}>{titles[step]}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 12 }} keyboardShouldPersistTaps="handled">
        {step === 0 && (
          <View style={[s.field, card]}>
            <Text style={s.fieldLabel}>First name</Text>
            <TextInput style={[s.input, { fontSize: 26 }]} value={name} onChangeText={setName} placeholder="Tega" placeholderTextColor={c.soft} autoFocus maxLength={24} autoCapitalize="words" selectionColor={c.glow} onSubmitEditing={() => valid[0] && next()} returnKeyType="next" />
          </View>
        )}
        {step === 1 && (
          <>
            <Choice on={sex === 'f'} label="Female" onPress={() => setSex('f')} />
            <Choice on={sex === 'm'} label="Male" onPress={() => setSex('m')} />
            <Field label="Age" unit="years" value={age} onChange={setAge} placeholder="28" />
          </>
        )}
        {step === 2 && (
          <>
            <Field label="Height" unit="cm" value={height} onChange={setHeight} placeholder="170" />
            <Field label="Current weight" unit="kg" value={weight} onChange={setWeight} placeholder="68" />
            <Field label="Goal weight" unit="kg" value={goal} onChange={setGoal} placeholder="63" />
          </>
        )}
        {step === 3 && (
          <>
            {ACTIVITY.map((a) => <Choice key={a.v} on={activity === a.v} label={a.label} hint={a.hint} onPress={() => setActivity(a.v)} />)}
            {preview && (
              <View style={s.summary}>
                <Text style={s.sumLabel}>Your daily budget</Text>
                <Text style={s.sumBig}>{fmt(preview.kcal)}<Text style={s.sumUnit}> kcal</Text></Text>
                <Text style={s.sumMacros}>{preview.protein}g protein · {preview.carbs}g carbs · {preview.fat}g fat</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingBottom: Math.max(bottom, 16) + 8 }}>
        <Pressable onPress={next} disabled={!valid[step]} style={[s.cta, !valid[step] && { opacity: 0.35 }]} accessibilityRole="button">
          <Text style={s.ctaText}>{step === 3 ? 'Awaken' : 'Continue'}</Text>
        </Pressable>
      </View>
    </KbView>
  );
}

const mkStyles = () => StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 26 },
  back: { width: 40, height: 40, borderRadius: 6, ...card, alignItems: 'center', justifyContent: 'center' },
  progress: { flex: 1, flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 1, backgroundColor: c.line },
  kicker: { fontFamily: f.semi, fontSize: 12.5, color: c.glowText, marginBottom: 8, letterSpacing: 2.2, textTransform: 'uppercase', ...textGlow(c.glow, 8) },
  h1: { fontFamily: f.extra, fontSize: 26, color: c.ink, letterSpacing: 0.6, lineHeight: 34, ...textGlow(c.glow, 14) },
  field: { borderRadius: 6, paddingHorizontal: 18, paddingVertical: 14 },
  fieldLabel: { fontFamily: f.semi, fontSize: 12, color: c.muted, letterSpacing: 1.4, textTransform: 'uppercase' },
  fieldRow: { flexDirection: 'row', alignItems: 'baseline' },
  input: { flex: 1, fontFamily: f.extra, fontSize: 28, color: c.ink, paddingVertical: 4, letterSpacing: 0.4 },
  unit: { fontFamily: f.semi, fontSize: 15, color: c.muted },
  choice: { borderRadius: 6, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', alignItems: 'center' },
  choiceLabel: { fontFamily: f.bold, fontSize: 16, color: c.ink },
  choiceHint: { fontFamily: f.regular, fontSize: 13, color: c.muted, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: c.line, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.glow },
  summary: { backgroundColor: c.panel, borderWidth: 1, borderColor: c.panelLine, borderRadius: 4, padding: 20, marginTop: 6, ...glow(c.glow, 16, 0.35) },
  sumLabel: { fontFamily: f.semi, fontSize: 12.5, color: c.glowText, letterSpacing: 1.6, textTransform: 'uppercase' },
  sumBig: { fontFamily: f.extra, fontSize: 36, color: c.ink, letterSpacing: 0.5, marginTop: 2, ...textGlow(c.glow, 16) },
  sumUnit: { fontFamily: f.bold, fontSize: 16, letterSpacing: 0 },
  sumMacros: { fontFamily: f.semi, fontSize: 13, color: c.muted, marginTop: 6 },
  cta: { height: 58, borderRadius: 6, backgroundColor: c.btn, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.glow},
  ctaText: { fontFamily: f.bold, fontSize: 16, color: '#fff', letterSpacing: 1.6, textTransform: 'uppercase' },
});
let s = mkStyles();
onTheme(() => { s = mkStyles(); });
