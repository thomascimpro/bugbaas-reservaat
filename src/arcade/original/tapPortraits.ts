// Presentation only: which existing BugBaas HD portrait shows an original Tikduel catalogue identity.
// The 1000 identities, their rarity, taps and points stay in game/arcade/original/tapCatalog.ts.
// The copied catalogue reused one beetle image for 490 entries (36 images in total). This picks the
// closest current portrait line by Dutch name, then the stage by rarity (rarer = later stage), and spreads
// names without a match deterministically over a group that fits the original sprite.
import {originalTapCatalog,type OriginalRarity} from '../../../game/arcade/original/tapCatalog';

type Line=readonly string[];
const L=(base:string):Line=>[base,base+'_elite',base+'_ultimate'],N=(base:string):Line=>[base+'_1',base+'_2',base+'_3'];
const RULES:[RegExp,Line][]=[
 [/lieveheer/,['ladybird28','asianladybeetle','asianladybeetle']],[/hommel|houtbij|armabij/,N('armabee')],[/bij($|-)|bijen/,L('bee')],
 [/hoornaar|goudwesp|juweelwesp/,['wasp_2','wasp_3','wasp_3']],[/wesp/,N('wasp')],
 [/libel|juffer|glazenmaker/,N('dragonfly')],[/mierenleeuw/,L('antlion')],[/mier/,L('ant')],
 [/bidsprinkhaan|mantis|orchidee/,L('mantis')],[/veenmol|krekel/,L('cricket')],[/sprinkhaan/,L('grasshopper')],
 [/eikelboorder/,['acornweevil','acornweevil','acornweevil']],[/bladroller/,['leafrollingweevil','leafrollingweevil','leafrollingweevil']],[/snuit/,L('weevil')],[/luis/,L('aphid')],
 [/springstaart|(^|-)vlo($|-)|vlooi/,L('flea')],[/zweefvlieg|roofvlieg/,L('hoverfly')],[/vuurvlieg|glimworm/,N('firefly')],[/gaasvlieg|schorpioenvlieg/,L('lacewing')],
 [/langpoot/,L('cranefly')],[/eendags|haft/,L('mayfly')],[/mug|knut/,N('mosquito')],
 [/morpho|vlinder|atalanta|mantel|aurelia|witje|zandoog|parelmoer|blauwtje|vos($|-)|dikkopje|zwaluwstaart|page|monarch|dambord|weerschijn|ijsvogel/,L('butterfly')],
 [/mot($|-)|uil($|-)|spanner|beer($|-)|pijlstaart|pauwoog|motje/,['moth','moth_elite','moth_elite']],[/rups/,['caterpillar','caterpillar','caterpillar']],
 [/engerling|larve/,['beetlegrub','beetlegrub','beetlegrub']],[/oorworm/,L('earwig')],
 [/schuimcicade|dwergcicade|helmcicade|doorncicade|lantaarn/,L('leafhopper')],[/cicade/,N('cicada')],
 [/reuzenwaterwants|waterwants|waterschorpioen/,L('giantwaterbug')],[/schaatsen/,L('waterstrider')],[/water|duiker/,L('divingbeetle')],
 [/harlekijn/,['harlequinbeetle','harlequinbeetle','harlequinbeetle']],[/kardinaal/,['cardinalbeetle','cardinalbeetle','cardinalbeetle']],
 [/schildpad/,L('tortoisebeetle')],[/wants/,L('tortoisebeetle')],
 [/duizendpoot|miljoenpoot/,N('centipede')],[/schorpioen/,N('scorpion')],[/spin|hooiwagen|tarantula/,N('spider')],[/slak/,N('snail')],
 [/giraffe/,['giraffestag','giraffestag','giraffestag']],[/hert/,['lesserstag','goldenstag','giraffestag']],[/goliath/,['golofabeetle','golofabeetle','golofabeetle']],
 [/hercules/,['hercules','hercules_elite','hercules_elite']],[/neushoorn|vijfhoorn/,['fivehornbeetle','caucasusbeetle','atlasbeetle']],[/olifant/,['elephantbeetle','elephantbeetle','elephantbeetle']],
 [/titan/,['titanbeetle','titanbeetle','titanbeetle']],[/minotaur/,['minotaurbeetle','minotaurbeetle','minotaurbeetle']],
 [/regenboog/,['rainbowscarab','rainbowscarab','rainbowscarab']],[/scarabee|mest|pillendraaier|doodgraver/,['dungbeetle','dungbeetle_elite','sacredscarab']],
 [/kniptor/,['eyedclickbeetle','eyedclickbeetle','eyedclickbeetle']],[/boktor|longhorn/,['asianlonghorn','rosalialonghorn','rosalialonghorn']],
 [/rozekever|meikever|junikever|bloemkever/,['flowerchafer','rosechafer','rosechafer']],[/prachtkever|goud|glorieuz|juweel/,['jewelchafer','jewelchafer','goldenstag']],
 [/bladkever/,['leafbeetle','leafbeetle','leafbeetle']],[/komkommer/,['cucumberbeetle','cucumberbeetle','cucumberbeetle']],
 [/zandloop|tijgerkever/,L('tigerbeetle')],[/wandelende|spookinsect|tak($|-)/,L('stick')],[/blad($|-)/,L('leaf')],
 [/zilvervis|ovenvis/,L('silverfish')],[/kakkerlak/,L('cockroach')],[/termiet/,L('termite')],[/pissebed/,['woodlouse','woodlouse','woodlouse']],
 [/vlieg/,L('hoverfly')],
];
// Names without a rule: a matching group for the original (generic) sprite, spread by a stable hash.
const GROUPS:Record<string,Line[]>={
 beetle:[L('beetle'),L('tigerbeetle'),L('tortoisebeetle'),L('cockroach'),['leafbeetle','harlequinbeetle','cardinalbeetle'],['lesserstag','goldenstag','giraffestag'],['flowerchafer','rosechafer','jewelchafer'],['eyedclickbeetle','neptunebeetle','moonhornedbeetle'],L('weevil'),L('dungbeetle')],
 springtail:[L('flea'),L('aphid'),L('silverfish'),L('termite'),L('leafhopper')],
 midge:[N('mosquito'),L('hoverfly'),L('cranefly'),L('mayfly'),L('lacewing')],
 butterfly:[L('butterfly')],moth:[['moth','moth_elite','moth_elite'],L('butterfly')],bee:[L('bee'),N('armabee')],wasp:[N('wasp')],dragonfly:[N('dragonfly')],
 caterpillar:[['caterpillar','caterpillar','caterpillar'],['beetlegrub','beetlegrub','beetlegrub']],grasshopper:[L('grasshopper'),L('cricket')],ant:[L('ant'),L('antlion')],
};
const STAGE:Record<OriginalRarity,number>={Gewoon:0,Zeldzaam:1,Episch:1,Legendarisch:2,Mythisch:2};
const hash=(s:string)=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
export function tapPortrait(e:{id:string;name:string;rarity:OriginalRarity;sprite:string}):string{
 const keys=[e.id,e.name.toLowerCase().replace(/\s+/g,'-')],rule=RULES.find(([re])=>keys.some(k=>re.test(k)))?.[1],group=GROUPS[e.sprite],line=rule??group?.[hash(e.id)%group.length];
 return line?line[STAGE[e.rarity]]:e.sprite;
}
export const TAP_PORTRAITS:ReadonlyMap<string,string>=new Map(originalTapCatalog.map(e=>[e.id,tapPortrait(e)]));
