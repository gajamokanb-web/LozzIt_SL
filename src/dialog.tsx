import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text, tr } from './i18n';
import { c, f, glow, onTheme, textGlow } from './theme';
import { Corners } from './ui';

type Opts = { title: string; message?: string; confirmText?: string; cancelText?: string; danger?: boolean; single?: boolean };
type Pending = Opts & { done: (ok: boolean) => void };

let show: ((p: Pending) => void) | null = null;

/** Themed replacement for Alert.alert: resolves true when the user confirms. */
export function askConfirm(o: Opts): Promise<boolean> {
  return new Promise((res) => {
    if (!show) return res(true);
    show({ ...o, done: res });
  });
}
/** Themed info box with a single OK button. */
export const notify = (title: string, message?: string) => askConfirm({ title, message, single: true, confirmText: 'OK' });

export function ConfirmHost() {
  const [p, setP] = useState<Pending | null>(null);
  useEffect(() => { show = setP; return () => { show = null; }; }, []);
  const close = (ok: boolean) => { const cur = p; setP(null); cur?.done(ok); };
  return (
    <Modal visible={!!p} transparent animationType="fade" onRequestClose={() => close(false)} statusBarTranslucent>
      <View style={s.wrap}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => close(false)} accessibilityLabel="Close" />
        {p && (
          <View style={s.box}>
            <Corners />
            <Text style={s.title}>{tr(p.title)}</Text>
            {p.message ? <Text style={s.msg}>{tr(p.message)}</Text> : null}
            <View style={s.row}>
              {!p.single && (
                <Pressable onPress={() => close(false)} style={[s.btn, { backgroundColor: c.page, borderColor: c.line }]} accessibilityRole="button">
                  <Text style={[s.btnT, { color: c.ink }]}>{p.cancelText ?? 'Cancel'}</Text>
                </Pressable>
              )}
              <Pressable onPress={() => close(true)} style={[s.btn, p.danger ? { backgroundColor: '#7A1230', borderColor: c.red } : { backgroundColor: c.btn, borderColor: c.glow }]} accessibilityRole="button">
                <Text style={[s.btnT, { color: '#fff' }]}>{p.confirmText ?? 'OK'}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const mkStyles = () => StyleSheet.create({
  wrap: { flex: 1, backgroundColor: 'rgba(2,4,14,0.8)', justifyContent: 'center', paddingHorizontal: 24 },
  box: { backgroundColor: c.card, borderRadius: 4, padding: 22, borderWidth: 1, borderColor: c.panelLine, ...glow(c.glow, 22, 0.45) },
  title: { fontFamily: f.extra, fontSize: 17, color: c.ink, letterSpacing: 1.6, textTransform: 'uppercase', ...textGlow(c.glow, 10) },
  msg: { fontFamily: f.medium, fontSize: 15, color: c.muted, lineHeight: 21, marginTop: 8 },
  row: { flexDirection: 'row', gap: 10, marginTop: 20 },
  btn: { flex: 1, minHeight: 48, paddingVertical: 8, paddingHorizontal: 8, borderRadius: 4, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnT: { fontFamily: f.bold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },
});
let s = mkStyles();
onTheme(() => { s = mkStyles(); });
