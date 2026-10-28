import type {Element} from './goV2';

/** Charged-attack mini-games. Each success becomes one of the server's eight charge hits, so damage rules stay server-side. */
export type ChargeGameKind='swarm'|'rub'|'rhythm'|'swipe';
export const CHARGE_GAMES:Record<Element,{kind:ChargeGameKind;title:string;hint:string;motion?:'orbit'|'rise'|'drift'|'flash'}>={
 bug:{kind:'swarm',motion:'orbit',title:'Zwermjacht',hint:'Tik de zoemende bugs'},
 poison:{kind:'swarm',motion:'drift',title:'Gifbellen',hint:'Tik de zwevende gifbellen'},
 water:{kind:'swarm',motion:'rise',title:'Bellenstroom',hint:'Tik de bellen voor ze wegdrijven'},
 dark:{kind:'swarm',motion:'flash',title:'Schaduwjacht',hint:'Tik de schaduwen als ze opduiken'},
 fire:{kind:'rub',title:'Vonkenvuur',hint:'Wrijf snel heen en weer'},
 normal:{kind:'rub',title:'Kracht opladen',hint:'Wrijf snel heen en weer'},
 steel:{kind:'rhythm',title:'Smeedritme',hint:'Tik als de ring het doel raakt'},
 rock:{kind:'rhythm',title:'Rotsritme',hint:'Tik als de ring het doel raakt'},
 ground:{kind:'rhythm',title:'Aardstamp',hint:'Tik als de ring het doel raakt'},
 flying:{kind:'swipe',title:'Windstoten',hint:'Veeg in de richting van de pijl'},
 grass:{kind:'swipe',title:'Bladsnede',hint:'Veeg in de richting van de pijl'},
};
export const CHARGE_W=280,CHARGE_H=230,CHARGE_BEAT=650;
const W=CHARGE_W,H=CHARGE_H,BEAT=CHARGE_BEAT;
export const CHARGE_DIRS=[{dx:0,dy:-1,arrow:'↑'},{dx:1,dy:0,arrow:'→'},{dx:0,dy:1,arrow:'↓'},{dx:-1,dy:0,arrow:'←'}] as const;

/** Pure scoring helpers (exported for tests). */
export function rhythmHit(elapsed:number){const phase=(elapsed%BEAT)/BEAT;return phase>=.78||phase<=.06;}
export function swipeMatches(dx:number,dy:number,dir:number){const d=CHARGE_DIRS[dir];if(Math.hypot(dx,dy)<36)return false;return Math.abs(dx)>Math.abs(dy)?Math.sign(dx)===d.dx&&d.dy===0:Math.sign(dy)===d.dy&&d.dx===0;}
export function swarmPosition(motion:'orbit'|'rise'|'drift'|'flash',i:number,t:number){
 const k=i/8*Math.PI*2,s=t/1000;
 if(motion==='orbit'){const r=55+(i%3)*22;return {x:W/2+Math.cos(k+s*(1.1+i%2*.5))*r,y:H/2+Math.sin(k*1.3+s*(1.3+i%3*.3))*r*.7,visible:true};}
 if(motion==='rise'){const p=((s*.38+i/8)%1);return {x:30+((i*53)%(W-60))+Math.sin(s*2+i)*14,y:H-20-p*(H-40),visible:true};}
 if(motion==='drift'){return {x:W/2+Math.sin(s*.9+k)*(W/2-30),y:H/2+Math.cos(s*.7+k*1.7)*(H/2-30),visible:true};}
 const cycle=(t+i*347)%1300;return {x:30+((i*97)%(W-60)),y:30+((i*61)%(H-60)),visible:cycle<720};
}

