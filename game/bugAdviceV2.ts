import {appraisal,family,powerCost,stats} from './goV2';
import {EVOLUTIONS} from './dexV2';
import {species} from './catalogV2';
import type {PlayerV2,Specimen} from './typesV2';

/** Plain words for the IV appraisal, readable for a ten-year-old. */
export const GRADE_NAMES=['Zwak','Oké','Goed','Super','Perfect!'] as const;
const score=(b:Specimen)=>b.go!.iv.reduce((a,n)=>a+n,0)*100000+stats(b).cp;

/** The strongest bug (aanleg first, then CP) of every species you own more than once. */
export function bestOfSpecies(specimens:readonly Specimen[]){
 const top=new Map<string,Specimen>(),count=new Map<string,number>();
 for(const b of specimens){if(!b.go)continue;count.set(b.species,(count.get(b.species)??0)+1);const old=top.get(b.species);if(!old||score(b)>score(old))top.set(b.species,b);}
 return new Set([...top.values()].filter(b=>count.get(b.species)!>1).map(b=>b.id));
}

export type BugTip={good:boolean;text:string};
/** How good is this bug, how far can it grow, and what is the smart next step. Only advice: the server still checks every action. */
export function bugAdvice(p:PlayerV2,s:Specimen){
 const g=p.go!,st=stats(s),grade=appraisal(s),maxCp=stats(s,{...s.go!,level:50}).cp,name=species(s.species).name,key=family(s.species);
 const same=p.specimens.filter(b=>b.go&&b.species===s.species),better=same.filter(b=>b.id!==s.id&&score(b)>score(s)).sort((a,b)=>score(b)-score(a))[0],only=same.length<=1,best=!better;
 const evo=EVOLUTIONS[s.species],candy=g.candy[key]??0,cost=powerCost(s.go!.level),canPower=!!cost&&g.dust>=cost.dust&&candy>=cost.candy&&(g.xl[key]??0)>=cost.xl,tips:BugTip[]=[];
 if(evo&&candy>=evo.candy)tips.push({good:true,text:'Je kunt evolueren! CP '+st.cp+' → '+stats({...s,species:evo.to}).cp+'.'});
 if(best&&canPower)tips.push({good:true,text:only?'Sterker maken geeft meer CP. Dit is je enige '+name+'.':'Slim om sterker te maken: dit is je beste '+name+'.'});
 if(better)tips.push({good:false,text:'Je hebt een betere '+name+' (CP '+stats(better).cp+', '+GRADE_NAMES[appraisal(better)].toLowerCase()+'). Geef je stof liever aan die.'});
 if(evo&&candy<evo.candy)tips.push({good:false,text:'Nog '+(evo.candy-candy)+' nectar om te evolueren. Vang meer '+name+' of kies hem als buddy.'});
 if(!cost)tips.push({good:true,text:'Maximaal sterk: hoger kan niet meer.'});
 return {grade,gradeName:GRADE_NAMES[grade],cp:st.cp,maxCp,best,only,better,tips:tips.slice(0,3)};
}
