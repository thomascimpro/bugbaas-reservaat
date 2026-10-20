import React, { useEffect, useRef, useState } from 'react';
import GameV2 from './src/GameV2';
import { ActivityIndicator, AppState, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { BiomeId } from './game/catalog';
import type { Action, GameView } from './game/types';
import { accountEmail, accountLogin, connectGame, refreshGame, sendAction } from './src/client';
import { ArenaScreen, CollectionScreen, ReserveScreen, SafariScreen, TeamScreen } from './src/screens';
import { Badge, Button, C, PageEnter, ui, GamePanel } from './src/ui';
import { ArtImage, GameCrest, Icon } from './src/icons';
import type { IconName } from './src/icons';

const TABS: { name: string; icon: IconName }[] = [{ name: 'Reservaat', icon: 'meadow' }, { name: 'Safari', icon: 'compass' }, { name: 'Team', icon: 'team' }, { name: 'Collectie', icon: 'book' }, { name: 'Arena', icon: 'arena' }];
export default function App() {
  return <GameV2 />;
}
function GameApp() {
  const [view, setView] = useState<GameView | null>(null), [tab, setTab] = useState('Reservaat'), [biomeId, setBiome] = useState<BiomeId>('meadow');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [account, setAccount] = useState(false), [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const lock = useRef(false), timeBase = useRef({ server: Date.now(), received: performance.now() }), [now, setNow] = useState(Date.now());
  const latestView = useRef<GameView | null>(null);
  const scroll = useRef<ScrollView>(null);
  const scrollTop = () => scroll.current?.scrollTo({ y: 0, animated: false });
  useEffect(() => { if (tab === 'Safari') scrollTop(); }, [tab, view?.player.battle?.id, view?.player.battle?.status]);
  function accept(v: GameView) {
    const current = latestView.current;
    if (current?.player.uid === v.player.uid && current.player.revision > v.player.revision) return;
    latestView.current = v; setView(v); timeBase.current = { server: v.now, received: performance.now() }; setNow(v.now);
  }
  async function boot() { setBusy(true); setError(''); try { accept(await connectGame()); } catch (e) { setError(e instanceof Error ? e.message : 'De app kon niet verbinden.'); } finally { setBusy(false); } }
  useEffect(() => { void boot(); const timer = setInterval(() => setNow(timeBase.current.server + performance.now() - timeBase.current.received), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    const event = AppState.addEventListener('change', state => {
      if (state === 'active' && latestView.current && !lock.current) void refreshGame().then(accept).catch(e => setError(e instanceof Error ? e.message : 'Vernieuw je voortgang.'));
    });
    return () => event.remove();
  }, []);
  async function run(action: Action): Promise<boolean> {
    if (lock.current || !view) return false; lock.current = true; setBusy(true); setError('');
    try { accept(await sendAction(action, view.player.revision)); return true; }
    catch (e) { setError(e instanceof Error ? e.message : 'De actie is niet verwerkt.'); try { accept(await refreshGame()); } catch {} return false; }
    finally { lock.current = false; setBusy(false); }
  }
  async function login(link: boolean) {
    setBusy(true); setError(''); try { accept(await accountLogin(email, password, link)); setPassword(''); setAccount(false); } catch (e) { setError(e instanceof Error ? e.message : 'Inloggen niet gelukt.'); } finally { setBusy(false); }
  }
  const props = view ? { view, busy, run, biomeId, setBiome, now, go: setTab, scrollTop } : null;
  return <SafeAreaView style={s.root}><StatusBar style="light" />
    <View style={s.header}><View style={s.headerInner}><GameCrest size={50} /><View style={{ flex: 1 }}><ArtImage asset="wordmark" width={140} height={34} label="BugBaas" /><Text style={s.brandSub}>RESERVAAT</Text></View>{view && <View accessibilityLabel={`${view.player.nectar} nectar`} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 24, backgroundColor: '#06291f', borderWidth: 1, borderColor: '#716b3e', paddingVertical: 7, paddingHorizontal: 11 }}><Icon name="nectar" size={22} /><Text style={{ color: '#e4d599', fontWeight: '800', fontSize: 16 }}>{view.player.nectar}</Text></View>}<Pressable accessibilityRole="button" accessibilityLabel="Open account" onPress={() => setAccount(true)} style={{ padding: 10 }}><Icon name="account" color="#e7e8ce" size={23} /></Pressable></View></View>
    {error ? <View style={s.error}><Text style={{ ...ui.small, color: C.red, flex: 1 }}>{error}</Text><Button compact secondary disabled={busy} onPress={() => void boot()}>Vernieuw</Button></View> : null}
    {!props ? <View style={{ flex: 1, backgroundColor: C.paper, justifyContent: 'center', alignItems: 'center', padding: 30, gap: 16 }}><GameCrest size={110} /><Text style={ui.h1}>Je reservaat openen</Text>{busy ? <ActivityIndicator color={C.forest} size="large" /> : <Button onPress={() => void boot()}>Probeer opnieuw</Button>}</View> : <ScrollView ref={scroll} key={tab} style={{ flex: 1, backgroundColor: C.paper }} contentContainerStyle={{ flexGrow: 1 }}><PageEnter>
      {tab === 'Reservaat' ? <ReserveScreen {...props} /> : tab === 'Safari' ? <SafariScreen {...props} /> : tab === 'Team' ? <TeamScreen {...props} /> : tab === 'Collectie' ? <CollectionScreen {...props} /> : <ArenaScreen {...props} />}
      </PageEnter><View style={{ alignItems: 'center', paddingBottom: 16 }}><Text style={ui.small}>Preview 0.1 · {view!.mode === 'cloud' ? 'online voortgang' : 'lokale ontwikkelvoortgang'}</Text></View>
    </ScrollView>}
    <View style={s.tabs}>{TABS.map(t => <Pressable key={t.name} accessibilityRole="tab" accessibilityLabel={t.name} accessibilityState={{ selected: tab === t.name }} onPress={() => { setTab(t.name); if (view) void refreshGame().then(accept).catch(() => {}); }} style={{ flex: 1, minHeight: 73, alignItems: 'center', justifyContent: 'center', gap: 4, borderTopWidth: 2, borderTopColor: tab === t.name ? '#d6b86a' : 'transparent', backgroundColor: tab === t.name ? '#234939' : 'transparent' }}><View style={{ backgroundColor: tab === t.name ? '#123729' : 'transparent', borderRadius: 13, padding: 5 }}><Icon name={t.icon} size={32} color={tab === t.name ? '#e7ce83' : '#a3b799'} /></View><Text style={{ color: tab === t.name ? '#fff0c0' : '#b4c2a8', fontSize: 10, fontWeight: tab === t.name ? '800' : '500' }}>{t.name}</Text></Pressable>)}</View>
    <Modal visible={account} transparent animationType="fade" onRequestClose={() => setAccount(false)}><View style={s.modalShade}><GamePanel style={s.modal}><Text style={ui.h2}>Bewaar je reservaat</Text><Text style={ui.body}>{view?.mode === 'cloud' ? accountEmail() ? `Verbonden als ${accountEmail()}` : 'Je speelt als gast. Koppel je collectie aan e-mail om op een ander apparaat verder te spelen.' : 'Deze lokale ontwikkelsessie blijft in de aparte previewdatabase. Online accounts komen uit het nieuwe Firebase-project.'}</Text>{view?.mode === 'cloud' && <><TextInput accessibilityLabel="E-mailadres" placeholder="E-mailadres" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={ui.input} /><TextInput accessibilityLabel="Wachtwoord" placeholder="Wachtwoord (minimaal 6 tekens)" value={password} onChangeText={setPassword} secureTextEntry style={ui.input} /><Button disabled={busy || !email.includes('@') || password.length < 6} onPress={() => void login(true)}>Koppel mijn gastcollectie</Button><Button secondary disabled={busy || !email.includes('@') || password.length < 6} onPress={() => void login(false)}>Log in met een bestaand account</Button></>}{error && <Text style={{ ...ui.small, color: C.red }}>{error}</Text>}<Button secondary onPress={() => setAccount(false)}>Terug naar mijn reservaat</Button></GamePanel></View></Modal>
  </SafeAreaView>;
}
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.forest },
  header: { backgroundColor: C.forest, borderBottomWidth: 2, borderColor: '#a29158' }, headerInner: { width: '100%', maxWidth: 944, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  brand: { color: C.white, fontFamily: 'serif', fontSize: 23, fontWeight: '700' }, brandSub: { color: '#b8c7a6', fontSize: 9, letterSpacing: 3, marginTop: 2 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff0e7', padding: 12 },
  tabs: { flexDirection: 'row', backgroundColor: C.forest, borderTopWidth: 2, borderColor: '#a29158' },
  modalShade: { flex: 1, backgroundColor: '#12382e88', justifyContent: 'center', padding: 24 },
  modal: { alignSelf: 'center', width: '100%', maxWidth: 430, backgroundColor: C.paper, borderRadius: 22, padding: 24, gap: 15 },
});
