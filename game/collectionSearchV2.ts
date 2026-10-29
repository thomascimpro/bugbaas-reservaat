import {species} from './catalogV2';
import {dexNumber} from './dexV2';
import {appraisal,stats} from './goV2';
import type {Specimen} from './typesV2';

export const COLLECTION_SEARCH_HELP='Soortnaam, bijnaam of dexnummer: bosmier of #002. CP: cp1500 (precies), cp-1500 (maximaal), cp100-1500 (bereik), cp1500- (minimaal). IV: 0* t/m 4*; 4* is perfect. Ook: shiny, favoriet, buddy en team. Combineer met &: shiny&cp-1500. Sluit uit met !: !favoriet&!team. Snelkeuzes voegen een filter toe; tik nogmaals om het weg te halen.';

export function collectionSearch(query:string,context:{buddy:string;team:readonly string[]}){
 const terms=query.toLowerCase().split('&').map(t=>t.trim()).filter(Boolean);
 return (bug:Specimen)=>!!bug.go&&terms.every(raw=>{
  let term=raw,exclude=false;while(term.startsWith('!')){exclude=!exclude;term=term.slice(1).trim();}
  if(!term)return false;
  let matches=false;
  if(term==='shiny')matches=bug.shiny;
  else if(['favoriet','favorite','favourite'].includes(term))matches=bug.favorite;
  else if(term==='buddy')matches=bug.id===context.buddy;
  else if(term==='team')matches=context.team.includes(bug.id);
  else if(/^[0-4][*★]$/.test(term))matches=appraisal(bug)===Number(term[0]);
  else if(/^cp/.test(term)){
   const exact=/^cp(\d+)$/.exec(term),range=/^cp(\d*)-(\d*)$/.exec(term),cp=stats(bug).cp;
   if(exact)matches=cp===Number(exact[1]);
   else if(range&&(range[1]||range[2]))matches=cp>=(range[1]?Number(range[1]):0)&&cp<=(range[2]?Number(range[2]):Infinity);
  }else if(/^#?\d+$/.test(term))matches=dexNumber(bug.species)===Number(term.replace('#',''));
  else matches=species(bug.species).name.toLowerCase().includes(term)||!!bug.nickname?.toLowerCase().includes(term);
  return exclude?!matches:matches;
 });
}

export function powerUpLeagueWarning(currentCP:number,nextCP:number){
 const crossed=[{cap:1500,name:'Kleine Arena'},{cap:2500,name:'Grote Arena'}].filter(l=>currentCP<=l.cap&&nextCP>l.cap);
 return crossed.length?'Let op: deze power-up overschrijdt '+crossed.map(l=>l.name+' ('+l.cap+' CP)').join(' en ')+'. Deze bug kan daarna niet meer in '+(crossed.length===1?'die arena':"deze arena's")+' meedoen. Een power-up kun je niet terugdraaien.':'';
}
