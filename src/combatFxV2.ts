import type {TacticEvent,TacticRun} from '../game/tacticsV2';

export type EffectKind='hit'|'sting'|'burst'|'venom'|'crush'|'heal'|'cleanse'|'shield'|'fortify'|'switch';
export type CombatCue={kind:EffectKind;damage:number;healing:number;poison:number};
export const turnStamp=(run:TacticRun)=>run.id+':'+run.round+':'+run.phase;
const attackKind:Record<string,EffectKind>={Aanval:'hit',Prik:'sting',Doorbraak:'burst',Gifbeet:'venom',Pantserbreker:'crush'};

// Presentation consumes confirmed events only. It never computes game damage or rewards.
export function combatCue(events:TacticEvent[],target:string):CombatCue|null{
 const own=events.filter(e=>e.target===target),direct=own.find(e=>e.kind==='damage'&&e.text!=='Gif'),heal=own.find(e=>e.kind==='heal'),shield=own.find(e=>e.kind==='shield');
 const kind:EffectKind|undefined=shield?(shield.text==='Verschansen'?'fortify':'shield'):heal?(heal.text==='Gezuiverd'?'cleanse':'heal'):direct?(attackKind[direct.text]??'hit'):own.some(e=>e.kind==='poison'||e.kind==='damage'&&e.text==='Gif')?'venom':own.some(e=>e.kind==='switch')?'switch':undefined;
 if(!kind)return null;
 return {kind,damage:own.filter(e=>e.kind==='damage'&&e.text!=='Gif').reduce((n,e)=>n+e.amount,0),healing:own.filter(e=>e.kind==='heal').reduce((n,e)=>n+e.amount,0),poison:own.filter(e=>e.kind==='damage'&&e.text==='Gif').reduce((n,e)=>n+e.amount,0)};
}
