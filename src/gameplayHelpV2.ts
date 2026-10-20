import type {Skill} from '../game/tacticsV2';
import type {Gear} from '../game/equipmentV2';
export const SKILL_TIP:Record<Skill,string>={
 sting:'Handig om goedkoop druk te zetten. Minder krachtig dan Doorbraak.',
 burst:'Sterk tegen een vijand zonder schild. Duur als de vijand deze beurt beschermt.',
 venom:'Gif gaat door pantser heen en blijft op reservebugs tikken. Een teamschild voorkomt nieuw gif; Zuiveren haalt het weg.',
 crush:'Breek eerst pantser en volg op met directe schade. Weinig voordeel tegen een vijand met weinig pantser.',
 heal:'Genees als je veel leven mist en de volgende klap nog kunt overleven. Bij bijna vol leven verspil je de genezing.',
 cleanse:'Goed tegen gif en pantserbreuk. Voor alleen veel leven teruggeven is Herstel meestal beter.',
 fortify:'Beschermt deze en de volgende beurt tegen directe schade. Stopt gif niet en levert geen aanvalsenergie op.',
};
export function buildAdvice(skills:readonly Skill[],gear:Gear){
 if(gear==='thorn')return {warning:!skills.includes('venom'),text:skills.includes('venom')?'Gifbeet + Gifdoorn: sterker gif':'Gifdoorn heeft Gifbeet nodig'};
 if(gear==='dew')return {warning:!skills.some(s=>s==='heal'||s==='cleanse'),text:skills.some(s=>s==='heal'||s==='cleanse')?'Dauwparel versterkt je genezing':'Dauwparel: kies Herstel of Zuiveren'};
 if(gear==='sun')return {warning:!skills.some(s=>['sting','burst','venom','crush'].includes(s)),text:skills.some(s=>['sting','burst','venom','crush'].includes(s))?'Zonnekern versterkt directe vaardigheidsschade':'Zonnekern helpt deze vaardigheden niet'};
 if(gear==='wing')return {warning:false,text:'Sneller energie, maar 10% minder leven'};
 if(gear==='moon')return {warning:false,text:'Goedkopere vaardigheden, maar 5% minder leven'};
 if(gear==='leaf')return {warning:false,text:'Pantser beschermt tegen klappen, niet tegen gif'};
 if(gear==='bark')return {warning:false,text:'Beschermt één keer tegen een schadelijke vaardigheid'};
 return {warning:false,text:'Extra leven: een veilige keuze'};
}
