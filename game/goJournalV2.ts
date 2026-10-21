import type {PlayerV2} from './typesV2';

export const GO_JOURNAL_LIMIT=50;
const KINDS=['catch','autoMiss','hatch','battle','boss','echo','evolve','power','trade','transfer','move','equip'] as const;
export type GoJournalEntry={
 id:string;kind:typeof KINDS[number];at:number;
 species?:string;specimenId?:string;shiny?:boolean;cp?:number;dust?:number;xp?:number;
 result?:'win'|'loss'|'draw';opponent?:string;fromSpecies?:string;
 method?:'manual'|'auto'|'ranked'|'casual'|'training';
};

/** An explicit public snapshot: never copy GPS, cocoon rolls or arbitrary server fields. */
function publicEntry(raw:GoJournalEntry):GoJournalEntry|null{
 if(!raw||typeof raw.id!=='string'||!raw.id.length||raw.id.length>240||!KINDS.includes(raw.kind)||!Number.isSafeInteger(raw.at)||raw.at<0||raw.at>8640000000000000)return null;
 const e:GoJournalEntry={id:raw.id,kind:raw.kind,at:raw.at};
 for(const key of ['species','specimenId','opponent','fromSpecies'] as const)if(typeof raw[key]==='string'&&raw[key].length&&raw[key].length<=160)e[key]=raw[key];
 if(typeof raw.shiny==='boolean')e.shiny=raw.shiny;
 if(Number.isSafeInteger(raw.cp)&&raw.cp!>=0)e.cp=raw.cp;
 if(Number.isSafeInteger(raw.dust))e.dust=raw.dust;
 if(Number.isSafeInteger(raw.xp)&&raw.xp!>=0)e.xp=raw.xp;
 if(raw.result&&['win','loss','draw'].includes(raw.result))e.result=raw.result;
 if(raw.method&&['manual','auto','ranked','casual','training'].includes(raw.method))e.method=raw.method;
 return e;
}

/** Newest first, bounded and detached from persisted data. Reading never creates history. */
export function publicGoJournal(entries?:readonly GoJournalEntry[]):GoJournalEntry[]{
 const ids=new Set<string>();
 return (entries??[]).map(publicEntry).filter((e):e is GoJournalEntry=>!!e).sort((a,b)=>b.at-a.at).filter(e=>{
  if(ids.has(e.id))return false;ids.add(e.id);return true;
 }).slice(0,GO_JOURNAL_LIMIT);
}

/** Call only with a confirmed server event, using its stable event/receipt identity. */
export function appendGoJournal(p:PlayerV2,entry:GoJournalEntry):boolean{
 const g=p.go,e=publicEntry(entry);if(!g||!e)return false;
 if(g.journal?.some(previous=>previous.id===e.id))return false;
 g.journal=publicGoJournal([e,...(g.journal??[])]);return true;
}
