export type Stats = { hp: number; power: number; armor: number; speed: number };
export type BiomeId = 'meadow' | 'soil' | 'pond' | 'night';
export type Ability = 'strike' | 'heal' | 'protect' | 'pierce' | 'slow' | 'teamHeal' | 'teamArmor' | 'weaken' | 'teamPower';
export type Bug = {
  id: string; name: string; short: string; role: string; trait: string;
  biome: BiomeId; stats: Stats; ability: Ability; move: string; moveText: string; color: string;
};
export const BUGS: Bug[] = [
  { id: 'ladybug', name: 'Zevenstippelig lieveheersbeestje', short: 'Lieveheersbeestje', role: 'Allrounder', trait: 'Samen sterk: +2 pantser voor je hele team.', biome: 'meadow', stats: { hp: 86, power: 19, armor: 12, speed: 19 }, ability: 'strike', move: 'Stippenstorm', moveText: 'Een sterke aanval: 1,6x kracht. Herstelt na 2 rondes.', color: '#cc644d' },
  { id: 'bumblebee', name: 'Aardhommel', short: 'Hommel', role: 'Verzorger', trait: 'Bestuiver: +6 extra leven bij een genezing.', biome: 'meadow', stats: { hp: 82, power: 13, armor: 10, speed: 20 }, ability: 'heal', move: 'Nectarzorg', moveText: 'Genees een teamgenoot voor 24 leven (+6 door Bestuiver).', color: '#bd942d' },
  { id: 'ant', name: 'Gele weidemier', short: 'Weidemier', role: 'Beschermer', trait: 'Samen sterk: +2 kracht voor je hele team.', biome: 'soil', stats: { hp: 98, power: 16, armor: 18, speed: 13 }, ability: 'protect', move: 'Bladschild', moveText: 'Geef een teamgenoot 65% dekking tegen de komende vijandactie. Heeft voorrang.', color: '#a8734d' },
  { id: 'dragonfly', name: 'Gewone oeverlibel', short: 'Oeverlibel', role: 'Snelle aanvaller', trait: 'Vlieger: +6 tempo in de Vijverrand.', biome: 'pond', stats: { hp: 72, power: 22, armor: 7, speed: 29 }, ability: 'pierce', move: 'Duikvlucht', moveText: '1,4x kracht en negeert de helft van het pantser.', color: '#568a93' },
  { id: 'beetle', name: 'Bosmestkever', short: 'Mestkever', role: 'Tank', trait: 'Graver: +4 pantser in de Bodemwereld.', biome: 'soil', stats: { hp: 112, power: 17, armor: 22, speed: 9 }, ability: 'slow', move: 'Duwkracht', moveText: '1,2x kracht en vertraag je doel 6 tempo gedurende 2 rondes.', color: '#675c83' },
  { id: 'glowworm', name: 'Glimworm', short: 'Glimworm', role: 'Teamverzorger', trait: 'Nachtlicht: +4 genezing in de Nachttuin.', biome: 'night', stats: { hp: 78, power: 12, armor: 11, speed: 17 }, ability: 'teamHeal', move: 'Lichtkring', moveText: 'Herstel 14 leven bij alle levende teamgenoten.', color: '#8b9a46' },
  { id: 'mantis', name: 'Bidsprinkhaan', short: 'Bidsprinkhaan', role: 'Afmaker', trait: 'Jager: +4 kracht tegen een doel onder half leven.', biome: 'meadow', stats: { hp: 75, power: 24, armor: 9, speed: 23 }, ability: 'strike', move: 'Sikkelslag', moveText: 'Een sterke aanval: 1,6x kracht. Sterk tegen een gewond doel.', color: '#648745' },
  { id: 'butterfly', name: 'Citroenvlinder', short: 'Citroenvlinder', role: 'Teamsteun', trait: 'Vlieger: +6 tempo in de Vijverrand.', biome: 'meadow', stats: { hp: 79, power: 13, armor: 8, speed: 25 }, ability: 'teamArmor', move: 'Vleugeldek', moveText: 'Geef het hele team +5 pantser gedurende 2 rondes.', color: '#b7a947' },
  { id: 'earwig', name: 'Gewone oorworm', short: 'Oorworm', role: 'Pantserbreker', trait: 'Graver: +4 pantser in de Bodemwereld.', biome: 'soil', stats: { hp: 92, power: 21, armor: 15, speed: 16 }, ability: 'pierce', move: 'Tangengreep', moveText: '1,4x kracht en negeert de helft van het pantser.', color: '#8f6853' },
  { id: 'streamfly', name: 'Beekoeverlibel', short: 'Beekoeverlibel', role: 'Verzwakker', trait: 'Vlieger: +6 tempo in de Vijverrand.', biome: 'pond', stats: { hp: 73, power: 19, armor: 8, speed: 28 }, ability: 'weaken', move: 'Waterflits', moveText: 'Raak je doel en verlaag zijn kracht 6 gedurende 2 rondes.', color: '#66829e' },
  { id: 'moth', name: 'Atlasmot', short: 'Atlasmot', role: 'Teamsteun', trait: 'Nachtrust: +4 extra pantser in de Nachttuin.', biome: 'night', stats: { hp: 96, power: 15, armor: 12, speed: 14 }, ability: 'teamArmor', move: 'Nachtmantel', moveText: 'Geef het hele team +5 pantser gedurende 2 rondes.', color: '#a96e4a' },
  { id: 'firebug', name: 'Vuurwants', short: 'Vuurwants', role: 'Aanvalssteun', trait: 'Samen sterk: +2 kracht voor je hele team.', biome: 'soil', stats: { hp: 83, power: 18, armor: 13, speed: 18 }, ability: 'teamPower', move: 'Zonnesignaal', moveText: 'Geef het hele team +5 kracht gedurende 2 rondes.', color: '#b85c43' },
];
export const ITEMS = [
  { id: 'none', name: 'Geen voorwerp', icon: '·', text: 'Basisstats. Een vrije plek voor je eigen keuze.', stats: { hp: 0, power: 0, armor: 0, speed: 0 } },
  { id: 'leaf', name: 'Pantserblad', icon: '▰', text: '+7 pantser, -5 tempo. Goed om druk op te vangen.', stats: { hp: 0, power: 0, armor: 7, speed: -5 } },
  { id: 'pollen', name: 'Stuifmeel', icon: '✦', text: '+6 kracht, -4 pantser. Meer aanval, kwetsbaarder.', stats: { hp: 0, power: 6, armor: -4, speed: 0 } },
  { id: 'wing', name: 'Licht veertje', icon: '↗', text: '+7 tempo, -12 leven. Eerder handelen met een risico.', stats: { hp: -12, power: 0, armor: 0, speed: 7 } },
  { id: 'dew', name: 'Dauwdruppel', icon: '◈', text: '+18 leven, -3 kracht. Meer tijd om te ondersteunen.', stats: { hp: 18, power: -3, armor: 0, speed: 0 } },
] as const;
export type ItemId = typeof ITEMS[number]['id'];
export const BIOMES = [
  { id: 'meadow' as const, name: 'Bloemenweide', subtitle: 'Een snelle eerste safari', color: '#6e8b4c', icon: '✿', rule: 'Weidesoorten krijgen +3 kracht.', tip: 'Een snelle aanvaller met een verzorger is een fijn begin. Bekijk de vijandintent voordat je kiest.', enemies: ['ladybug', 'bumblebee', 'mantis'], targets: ['butterfly', 'mantis', 'ladybug', 'bumblebee'], level: 1 },
  { id: 'soil' as const, name: 'Bodemwereld', subtitle: 'Breek door het pantser', color: '#9d7859', icon: '▱', rule: 'Bodemsoorten krijgen +4 pantser.', tip: 'Pantserbrekende acties maken hier verschil. Een team met alleen veel kracht is niet altijd de beste keuze.', enemies: ['beetle', 'ant', 'earwig'], targets: ['earwig', 'firebug', 'ant', 'beetle'], level: 2 },
  { id: 'pond' as const, name: 'Vijverrand', subtitle: 'Tempo maakt het verschil', color: '#568c98', icon: '≈', rule: 'Vijversoorten krijgen +5 tempo. Vliegers krijgen daarnaast +6.', tip: 'Eerder handelen kan een vijandactie voorkomen. Je snelle bugs hebben wel bescherming nodig.', enemies: ['dragonfly', 'streamfly', 'bumblebee'], targets: ['streamfly', 'dragonfly'], level: 2 },
  { id: 'night' as const, name: 'Nachttuin', subtitle: 'Houd je team op de been', color: '#72668c', icon: '☾', rule: 'Nachtsoorten krijgen +12 leven en +3 pantser.', tip: 'Ondersteuning en teamgenezing helpen tegen een lange ontmoeting. Blijf ook genoeg schade doen.', enemies: ['moth', 'glowworm', 'firebug'], targets: ['moth', 'glowworm'], level: 2 },
];
export function bugById(id: string): Bug { const b = BUGS.find(x => x.id === id); if (!b) throw new Error('Onbekende bug.'); return b; }
export function biomeById(id: string) { const b = BIOMES.find(x => x.id === id); if (!b) throw new Error('Onbekend gebied.'); return b; }
export function itemById(id: string) { const i = ITEMS.find(x => x.id === id); if (!i) throw new Error('Onbekend voorwerp.'); return i; }
export const STARTERS = ['ladybug', 'bumblebee', 'ant', 'dragonfly', 'beetle', 'glowworm'];
export const allyAbility = (ability: Ability) => ['heal', 'protect', 'teamHeal', 'teamArmor', 'teamPower'].includes(ability);
