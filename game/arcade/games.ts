import {originalPorts,originalPort,isOriginalRules,validateOriginalInputs,ORIGINAL_MAX_INPUTS} from './original';
import type {OriginalState} from './original/types';
import {FAST} from '../goV2';
import type {Element} from '../goV2';
import {checkV2 as check} from '../shopV2';
import {arcadeDamage,arcadeSeed,createTapState,replayTap,stepTap,tapTarget,TARGETS,validateTapInputs} from './tapDuel';
import type {ArcadeTicket,ArcadeTap,TapState} from './tapDuel';

export type ArcadeGameId='tap_duel'|'web_runner'|'nest_defense'|'bug_glide'|'butterfly_catch'|'bug_tower'|'bubble_swarm';
export const ARCADE_GAMES:readonly {id:ArcadeGameId;name:string;durationSeconds:number;gesture:string;help:string;survival?:boolean}[]=[
 {id:'tap_duel',name:'Tikduel',durationSeconds:30,gesture:'targetTap',help:originalPorts['tap_duel'].help},
 {id:'web_runner',name:'Webrenner',durationSeconds:600,gesture:'swipeJump',help:originalPorts['web_runner'].help,survival:true},
 {id:'nest_defense',name:'Nestwacht',durationSeconds:150,gesture:'towerDefense',help:originalPorts['nest_defense'].help},
 {id:'bug_glide',name:'Windvlucht',durationSeconds:600,gesture:'tapFlight',help:originalPorts['bug_glide'].help,survival:true},
 {id:'butterfly_catch',name:'Vlinderjacht',durationSeconds:60,gesture:'lookCatch',help:originalPorts['butterfly_catch'].help},
 {id:'bug_tower',name:'Bladtoren',durationSeconds:600,gesture:'holdRelease',help:originalPorts['bug_tower'].help,survival:true},
 {id:'bubble_swarm',name:'Bubbelzwerm',durationSeconds:600,gesture:'aimRelease',help:originalPorts['bubble_swarm'].help,survival:true},
];
export const legacyGameRules=(id:ArcadeGameId)=>id==='tap_duel'?'tap-1':id+'-1';
export const gameRules=(id:ArcadeGameId)=>id+'-2';
export const supportsArcadeRules=(ticket:ArcadeTicket)=>isOriginalRules(ticket)||ticket.rules===legacyGameRules(ticket.game??'tap_duel');
export const LEGACY_DURATIONS:Record<ArcadeGameId,number>={tap_duel:45,web_runner:45,nest_defense:60,bug_glide:45,butterfly_catch:45,bug_tower:60,bubble_swarm:60};
export type ArcadeEndReason='time'|'hearts'|'squad_defeated'|'board_clear'|'lower_bound'|'target_score'|'original_end'|'input_limit'|null;
export type SquadHelpers={a:number;d:number;h:number;pickupPct:number;graceTicks:number;gateExtra:number;netPct:number;platformPct:number;coyoteTicks:number;aimLength:number;secondPreview:boolean;poisonWarning:boolean};
type RunnerThing={id:number;lane:number;y:number;kind:'web'|'nectar';forgiven?:boolean};
type NestEnemy={id:number;lane:number;kind:number;y:number;hp:number;maxHP:number;defense:number;types:Element[]};
type NestShot={id:number;target:number;lane:number;y:number;damage:number;shooter:number};
type GlideGate={id:number;x:number;center:number;scored:boolean;nectar:boolean;hit:boolean};
type CatchBug={id:number;kind:'butterfly'|'wasp';born:number;x:number;y:number;overlap:number;phase:number;vx:number;shiny:boolean};
type TowerLeaf={floor:number;x:number;y:number;nectar:boolean};
export type BubbleType='grass'|'fire'|'water';
export type BubbleCell={id:number;row:number;col:number;type:BubbleType};
export type BubbleShot={x:number;y:number;vx:number;vy:number;type:BubbleType;bounces:number};
export type ArcadeState=TapState&{
 original?:OriginalState;game:ArcadeGameId;durationTicks:number;endReason:ArcadeEndReason;hearts:number;helpers:SquadHelpers;acceptedInputs:ArcadeTap[];acceptedShots:number;
 runner?:{lane:number;previousLane:number;lastMove:number;invulnerable:number;nextPattern:number;things:RunnerThing[]};
 nest?:{enemies:NestEnemy[];shots:NestShot[];nextSpawn:number;nextShooter:number;shotId:number};
 glide?:{y:number;held:boolean;gates:GlideGate[];nextGate:number;lastCenter:number;invulnerable:number};
 catch?:{x:number;y:number;targetX:number;targetY:number;bugs:CatchBug[];nextButterfly:number;nextWasp:number;invulnerable:number};
 tower?:{x:number;y:number;vy:number;direction:number;camera:number;leaves:TowerLeaf[];maxFloor:number;safeFloor:number;pickups:number[];lastLanding:number;invulnerable:number};
 bubble?:{cells:BubbleCell[];shot:BubbleShot|null;current:BubbleType;next:BubbleType;second:BubbleType;sequence:number;aim:number;ready:number;misses:number;offset:number;nextId:number;removed:number;fallen:number};
};
const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const hash=(seed:number,label:string,id:number)=>arcadeSeed(seed+':'+label+':'+id);
const hasType=(ticket:Pick<ArcadeTicket,'squad'>,type:Element)=>ticket.squad.some(b=>b.types.includes(type));
export function squadHelpers(ticket:Pick<ArcadeTicket,'squad'|'league'>):SquadHelpers{
 const refs=ticket.league==='great'?[160,130,150]:ticket.league==='ultra'?[190,160,180]:[230,200,220];
 const norm=(key:'attack'|'defense'|'hp',i:number)=>clamp(Math.floor(ticket.squad.reduce((n,b)=>n+b[key],0)*1000/(3*refs[i])),0,1000);
 const a=norm('attack',0),d=norm('defense',1),h=norm('hp',2);
 return {a,d,h,pickupPct:Math.min(14,Math.floor(12*h/1000)+(hasType(ticket,'flying')?2:0)),graceTicks:Math.floor(Math.floor(120*d/1000)/20),gateExtra:Math.floor(12*d/1000),netPct:Math.min(14,Math.floor(8*d/1000)+Math.floor(6*a/1000)),platformPct:Math.min(14,Math.floor(12*d/1000)+(hasType(ticket,'grass')?2:0)),coyoteTicks:Math.floor(Math.min(180,60+Math.floor(120*h/1000))/20),aimLength:90+Math.floor(60*a/1000),secondPreview:a>=600,poisonWarning:hasType(ticket,'poison')};
}
export function arcadeHelp(game:ArcadeGameId,squad:ArcadeTicket['squad'],league:ArcadeTicket['league']){
 const normal='Hulp komt uit de echte aanval, verdediging, HP en types van je squad. De drie teamplekken tellen mee; één bug is minder hulp dan drie. CP bepaalt de klasse. Je krijgt geen gratis scorevermenigvuldiger.';
 const effects:Record<ArcadeGameId,[string,string]>={
 tap_duel:['Je squad tikt mee','Je bugs helpen met hun eigen aanvalstype. Verdediging maakt tikdoelen iets ruimer en HP geeft meer richttijd.'],
 nest_defense:['Je squad versterkt het nest','Aanval versterkt torens en geeft wat extra bouwmunten. Verdediging helpt vuursnelheid en webvertraging; HP helpt het nest en herladen.'],
 web_runner:['Je squad helpt je overleven','HP geeft wat extra botsmarge, aanval verlengt magneten en een volle squad met voldoende verdediging begint met een schild.'],
 bug_glide:['Je squad helpt je vliegen','Aanval geeft iets meer lift. HP helpt pickups en kan een extra hart geven; verdediging verlengt schilden.'],
 butterfly_catch:['Je squad helpt je richten','Verdediging en HP maken de vangzone maximaal14% ruimer. Je blijft zelf volgen en het net op tijd gebruiken.'],
 bug_tower:['Je squad helpt je landen','Verdediging geeft extra landingsmarge; planttype helpt ook, samen maximaal14%. HP geeft maximaal60ms extra springmarge.'],
 bubble_swarm:['Je squad geeft meer denktijd','Verdediging vertraagt de druk, HP verlengt Freeze en aanval verlengt de richtlijn. Iedere hulp maximaal14%.']
 };
 return {summary:effects[game][0],details:effects[game][1]+'\n\n'+normal};
}

function finish(s:ArcadeState,reason:Exclude<ArcadeEndReason,null>){s.finished=true;s.endReason=reason;}
function hurt(s:ArcadeState){s.hearts=Math.max(0,s.hearts-1);if(!s.hearts)finish(s,'hearts');}
function accept(s:ArcadeState,input:ArcadeTap){s.acceptedInputs.push({...input});return true;}
export function createArcadeState(ticket:ArcadeTicket):ArcadeState{
 if(isOriginalRules(ticket)){const port=originalPort(ticket),original=port.create(ticket);return {...createTapState(ticket.squad,ticket.seed,ticket.league),game:ticket.game!,original,durationTicks:Math.ceil(port.durationMs/20),endReason:null,hearts:original.hearts,helpers:squadHelpers(ticket),acceptedInputs:[],acceptedShots:0,targets:[],nextSpawn:0};}
 const game=ticket.game??'tap_duel';check(ARCADE_GAMES.some(g=>g.id===game),'Onbekend arcadespel.');
 const s:ArcadeState={...createTapState(ticket.squad,ticket.seed,ticket.league),game,durationTicks:LEGACY_DURATIONS[game]*50,endReason:null,hearts:3,helpers:squadHelpers(ticket),acceptedInputs:[],acceptedShots:0};
 if(game!=='tap_duel'){s.targets=[];s.nextSpawn=0;}
 if(game==='web_runner')s.runner={lane:1,previousLane:1,lastMove:-8,invulnerable:0,nextPattern:0,things:[]};
 if(game==='nest_defense')s.nest={enemies:[],shots:[],nextSpawn:0,nextShooter:0,shotId:0};
 if(game==='bug_glide')s.glide={y:320,held:false,gates:[],nextGate:0,lastCenter:320,invulnerable:0};
 if(game==='butterfly_catch')s.catch={x:180,y:420,targetX:180,targetY:420,bugs:[],nextButterfly:0,nextWasp:0,invulnerable:0};
 if(game==='bug_tower'){s.tower={x:180,y:526,vy:-420,direction:0,camera:0,leaves:[{floor:0,x:180,y:540,nectar:false}],maxFloor:0,safeFloor:0,pickups:[],lastLanding:0,invulnerable:0};ensureLeaves(s,ticket);}
 if(game==='bubble_swarm'){
  const cells=createBubbleBoard(ticket.seed),first=cells.find(c=>c.row===4&&c.col===0)!.type;
  s.bubble={cells,shot:null,current:first,next:'grass',second:'grass',sequence:0,aim:90,ready:0,misses:0,offset:0,nextId:40,removed:0,fallen:0};refreshBubblePreview(s,ticket);
 }
 return s;
}
export function stepArcadeState(s:ArcadeState,ticket:ArcadeTicket){
 if(s.original){if(s.finished)return;s.tick++;originalPort(ticket).step(s.original,ticket,20);syncOriginal(s,ticket);if(!s.finished&&s.tick>=s.durationTicks){s.finished=true;s.endReason='time';s.original.finished=true;s.original.reason='time';}return;}
 if(s.finished)return;
 if(s.game==='tap_duel'){stepTap(s,ticket.seed,ticket.league);if(s.finished)s.endReason=s.tick>=s.durationTicks?'time':'squad_defeated';crewGoal(s,ticket);return;}
 s.tick++;
 switch(s.game){case 'web_runner':stepRunner(s,ticket);break;case 'nest_defense':stepNest(s,ticket);break;case 'bug_glide':stepGlide(s,ticket);break;case 'butterfly_catch':stepCatch(s,ticket);break;case 'bug_tower':stepTower(s,ticket);break;case 'bubble_swarm':stepBubble(s,ticket);break;}
 crewGoal(s,ticket);if(!s.finished&&s.tick>=s.durationTicks)finish(s,'time');
}
function crewGoal(s:ArcadeState,ticket:ArcadeTicket){if(ticket.crew&&s.score>=ticket.crew.targetScore&&ticket.crew.targetScore>0)finish(s,'target_score');}
export function applyArcadeInput(s:ArcadeState,ticket:ArcadeTicket,input:ArcadeTap){
 if(s.original){if(s.finished)return false;const accepted=originalPort(ticket).input(s.original,ticket,input);s.acceptedInputs.push({...input});syncOriginal(s,ticket);if(s.acceptedInputs.length>=ORIGINAL_MAX_INPUTS){s.finished=true;s.endReason='input_limit';}return accepted;}const hit=applyInput(s,ticket,input);crewGoal(s,ticket);return hit;}
function applyInput(s:ArcadeState,ticket:ArcadeTicket,input:ArcadeTap){
 if(s.finished||input.tick!==s.tick||!Number.isInteger(input.x)||!Number.isInteger(input.y)||input.x<0||input.x>1000||input.y<0||input.y>1000)return false;
 const action=input.action??'down';
 if(s.game==='tap_duel'){if(action!=='down')return false;const hit=tapTarget(s,ticket.seed,input);if(hit)accept(s,input);return hit;}
 if(s.runner){const r=s.runner;if(action!=='down'||s.tick-r.lastMove<8)return false;const lane=clamp(r.lane+(input.x<500?-1:1),0,2);if(lane===r.lane)return false;r.previousLane=r.lane;r.lane=lane;r.lastMove=s.tick;return accept(s,input);}
 if(s.nest){
  if(action!=='down')return false;const n=s.nest,lane=Math.min(2,Math.floor(input.x*3/1001)),enemy=n.enemies.filter(e=>e.lane===lane).sort((a,b)=>b.y-a.y||a.id-b.id)[0];if(!enemy)return false;
  let shooter=-1;for(let i=0;i<s.squad.length;i++){const idx=(n.nextShooter+i)%s.squad.length;if(s.squad[idx].ready<=s.tick){shooter=idx;break;}}if(shooter<0)return false;
  const bug=s.squad[shooter],move=FAST[bug.fast];bug.ready=s.tick+move.turns*20;n.nextShooter=(shooter+1)%s.squad.length;
  n.shots.push({id:n.shotId++,target:enemy.id,lane,y:560,damage:arcadeDamage(bug,enemy,move.type,move.power),shooter});s.hits++;return accept(s,input);
 }
 if(s.glide){if(action==='move')return false;const held=action==='down';if(held===s.glide.held)return false;s.glide.held=held;return accept(s,input);}
 if(s.catch){if(action==='up')return false;const x=input.x*.36,y=input.y*.64;if(x===s.catch.targetX&&y===s.catch.targetY)return false;s.catch.targetX=x;s.catch.targetY=y;return accept(s,input);}
 if(s.tower){const direction=action==='up'?0:input.x<500?-1:1;if(direction===s.tower.direction)return false;s.tower.direction=direction;return accept(s,input);}
 if(s.bubble){
  const b=s.bubble,dx=input.x*.36-180,dy=570-input.y*.64;b.aim=clamp(Math.atan2(Math.max(0,dy),dx)*180/Math.PI,20,160);
  if(action!=='up')return false;if(b.shot||s.tick<b.ready||!b.cells.length)return false;
  const angle=b.aim*Math.PI/180;b.shot={x:180,y:570,vx:Math.cos(angle)*600,vy:-Math.sin(angle)*600,type:b.current,bounces:0};s.acceptedShots++;return accept(s,input);
 }
 return false;
}
function stepRunner(s:ArcadeState,ticket:ArcadeTicket){
 const r=s.runner!;
 while(r.nextPattern*60<=s.tick){const id=r.nextPattern++,n=hash(ticket.seed,'runner',id),lane=n%3,pickup=(lane+1+Math.floor(n/3)%2)%3;r.things.push({id:id*4,lane,y:-36,kind:'web'});for(let j=0;j<3;j++)r.things.push({id:id*4+j+1,lane:pickup,y:-36-j*36,kind:'nectar'});}
 const pickupRadius=14*(1+s.helpers.pickupPct/100)+10;
 r.things=r.things.filter(o=>{
  o.y+=4.2;
  if(o.kind==='nectar'&&o.lane===r.lane&&Math.abs(o.y-520)<=pickupRadius){s.score+=10;s.hits++;return false;}
  if(o.kind==='web'&&o.lane===r.lane&&Math.abs(o.y-520)<=30){
   if(!o.forgiven&&r.previousLane!==o.lane&&s.tick-r.lastMove<=s.helpers.graceTicks){o.forgiven=true;return false;}
   if(s.tick>=r.invulnerable){hurt(s);r.invulnerable=s.tick+40;}return false;
  }
  return o.y<680;
 });
}
function stepNest(s:ArcadeState,ticket:ArcadeTicket){
 const n=s.nest!;
 while(50+n.nextSpawn*75<=s.tick){const id=n.nextSpawn++,h=hash(ticket.seed,'nest',id),lane=h%3,kind=Math.floor(h/3)%4,t=TARGETS[kind],scale=ticket.league==='great'?1:ticket.league==='ultra'?1.25:1.5;if(n.enemies.filter(e=>e.lane===lane).length<3)n.enemies.push({id,lane,kind,y:60,hp:Math.ceil(Math.floor(t.hp*scale)*.6),maxHP:Math.ceil(Math.floor(t.hp*scale)*.6),defense:Math.floor(t.defense*scale),types:[...t.types]});}
 for(const e of n.enemies)e.y+=1.6;
 n.shots=n.shots.filter(p=>{const enemy=n.enemies.find(e=>e.id===p.target&&e.hp>0);if(!enemy)return false;p.y-=8.4;if(p.y<=enemy.y+18){enemy.hp=Math.max(0,enemy.hp-p.damage);s.effects.push({tick:s.tick,kind:enemy.hp?'hit':'defeat',target:enemy.id,shooter:p.shooter,amount:p.damage,x:60+enemy.lane*120,y:enemy.y});if(!enemy.hp)s.score+=enemy.kind===2?30:20;return false;}return true;});
 n.enemies=n.enemies.filter(e=>{if(e.hp<=0)return false;if(e.y>=540){hurt(s);return false;}return true;});s.effects=s.effects.filter(e=>s.tick-e.tick<25).slice(-8);
}
function stepGlide(s:ArcadeState,ticket:ArcadeTicket){
 const g=s.glide!;g.y+=g.held?-3:2.6;
 while(g.nextGate*110<=s.tick){const id=g.nextGate++,h=hash(ticket.seed,'glide',id),center=clamp(170+h%301,g.lastCenter-120,g.lastCenter+120);g.lastCenter=center;g.gates.push({id,x:396,center,scored:false,nectar:true,hit:false});}
 const gap=(190+s.helpers.gateExtra)/2;
 for(const gate of g.gates){gate.x-=3;
  if(gate.nectar&&Math.hypot(gate.x-90,gate.center-g.y)<=16*(1+s.helpers.pickupPct/100)+10){gate.nectar=false;s.score+=15;s.hits++;}
  if(Math.abs(gate.x-90)<34&&Math.abs(gate.center-g.y)+16>gap&&!gate.hit&&s.tick>=g.invulnerable){gate.hit=true;hurt(s);g.invulnerable=s.tick+40;g.y=gate.center;}
  if(!gate.scored&&gate.x<74){gate.scored=true;s.score+=10;}
 }
 if((g.y<16||g.y>624)&&s.tick>=g.invulnerable){hurt(s);g.invulnerable=s.tick+40;g.y=g.gates.find(p=>p.x>=56)?.center??320;}
 g.y=clamp(g.y,16,624);g.gates=g.gates.filter(p=>p.x>-40);
}
// Bounded seeded sine trajectories: phase and base speed never depend on rendering.
export function catchBugPosition(b:CatchBug,tick:number){const phase=b.phase+(tick-b.born)*.02*b.vx/135;return {x:Math.round((180+Math.sin(phase)*135)*1000)/1000,y:Math.round(clamp(b.y+Math.cos(phase)*42,30,560)*1000)/1000};}
function stepCatch(s:ArcadeState,ticket:ArcadeTicket){
 const c=s.catch!,dx=c.targetX-c.x,dy=c.targetY-c.y,len=Math.hypot(dx,dy),f=len?Math.min(1,18/len):0;c.x+=dx*f;c.y+=dy*f;
 const spawn=(id:number,kind:'butterfly'|'wasp')=>{const h=hash(ticket.seed,kind,id);c.bugs.push({id:kind==='wasp'?10000+id:id,kind,born:s.tick,x:180,y:90+(h%420),overlap:0,phase:(Math.floor(h/420)%6283)/1000,vx:kind==='wasp'?100:80,shiny:h%17===0});};
 while(c.nextButterfly*50<=s.tick){const id=c.nextButterfly++;if(c.bugs.filter(b=>b.kind==='butterfly').length<6)spawn(id,'butterfly');}
 while(250+c.nextWasp*250<=s.tick){const id=c.nextWasp++;if(c.bugs.filter(b=>b.kind==='wasp').length<2)spawn(id,'wasp');}
 const a=32*(1+s.helpers.netPct/100),b=24*(1+s.helpers.netPct/100);
 c.bugs=c.bugs.filter(bug=>{if(s.tick-bug.born>=200)return false;const p=catchBugPosition(bug,s.tick),overlap=((p.x-c.x)/(a+14))**2+((p.y-c.y)/(b+14))**2<=1;
  if(bug.kind==='wasp'){if(overlap&&s.tick>=c.invulnerable){hurt(s);c.invulnerable=s.tick+40;return false;}}
  else{bug.overlap=overlap?bug.overlap+1:0;if(bug.overlap>=5){s.score+=10;s.hits++;return false;}}return true;
 });
}
function ensureLeaves(s:ArcadeState,ticket:ArcadeTicket){
 const t=s.tower!,last=t.leaves.at(-1)!;let next=last;
 while(next.y-t.camera>-100){const floor=next.floor+1,h=hash(ticket.seed,'tower',floor),x=clamp(70+h%221,next.x-100,next.x+100);next={floor,x,y:540-floor*70,nectar:floor%3===0};t.leaves.push(next);}
}
function stepTower(s:ArcadeState,ticket:ArcadeTicket){
 const t=s.tower!,before=t.y;t.x=clamp(t.x+t.direction*3.6,14,346);t.vy+=18;t.y+=t.vy*.02;
 const half=55*(1+s.helpers.platformPct/100),landing=t.vy>0?t.leaves.filter(l=>before+14<=l.y&&t.y+14>=l.y&&Math.abs(t.x-l.x)<=half+14).sort((a,b)=>a.y-b.y)[0]:undefined;
 if(landing){t.y=landing.y-14;t.vy=-420;t.safeFloor=landing.floor;t.lastLanding=s.tick;
  if(landing.floor>t.maxFloor){s.score+=(landing.floor-t.maxFloor)*20;t.maxFloor=landing.floor;}
  if(landing.nectar&&!t.pickups.includes(landing.floor)){s.score+=10;t.pickups.push(landing.floor);s.hits++;}
 }else if(t.vy>0){
  // A near missed edge can still land during the squad's bounded coyote window.
  const late=t.leaves.find(l=>t.y+14>l.y&&t.y+14-l.y<=Math.max(0,t.vy)*s.helpers.coyoteTicks*.02&&before+14-l.y<=Math.max(0,t.vy)*s.helpers.coyoteTicks*.02&&Math.abs(t.x-l.x)<=half+14&&l.floor>t.safeFloor);
  if(late){t.y=late.y-14;t.vy=-420;t.safeFloor=late.floor;t.lastLanding=s.tick;if(late.floor>t.maxFloor){s.score+=(late.floor-t.maxFloor)*20;t.maxFloor=late.floor;}if(late.nectar&&!t.pickups.includes(late.floor)){s.score+=10;t.pickups.push(late.floor);}}
 }
 if(t.y-t.camera<260)t.camera=t.y-260;
 if(t.y-t.camera>654){hurt(s);const safe=t.leaves.find(l=>l.floor===t.safeFloor)!;t.x=safe.x;t.y=safe.y-14;t.vy=-420;t.camera=Math.min(t.camera,t.y-400);}
 ensureLeaves(s,ticket);
}
const BUBBLE_TYPES:BubbleType[]=['grass','fire','water'];
export function bubbleCellPosition(cell:Pick<BubbleCell,'row'|'col'>,offset=0){return {x:45+cell.col*36+(cell.row%2?18:0),y:42+cell.row*31+offset};}
export function bubbleNeighbors(row:number,col:number):[number,number][]{const shift=row%2?1:-1;return ([[row,col-1],[row,col+1],[row-1,col],[row-1,col+shift],[row+1,col],[row+1,col+shift]] as [number,number][]).filter(([r,c])=>r>=0&&c>=0&&c<8);}
function bubbleGroup(cells:BubbleCell[],cell:BubbleCell,sameType=true){const found=new Set<number>([cell.id]),queue=[cell];while(queue.length){const current=queue.shift()!;for(const [r,c]of bubbleNeighbors(current.row,current.col)){const next=cells.find(n=>n.row===r&&n.col===c&&(!sameType||n.type===cell.type));if(next&&!found.has(next.id)){found.add(next.id);queue.push(next);}}}return found;}
export function createBubbleBoard(seed:number):BubbleCell[]{
 // Build from the exposed bottom row, whose adjacent pairs guarantee a first match.
 for(let attempt=0;attempt<200;attempt++){
  const cells:BubbleCell[]=[];let valid=true;
  for(let row=4;row>=0&&valid;row--)for(let col=0;col<8;col++){
   const h=hash(seed,'bubble-board-'+attempt,row*8+col),choices=row===4?[BUBBLE_TYPES[(Math.floor(col/2)+seed%3)%3]]:[0,1,2].map(n=>BUBBLE_TYPES[(n+h%3)%3]);let placed=false;
   for(const type of choices){const cell={id:row*8+col,row,col,type};if(bubbleGroup([...cells,cell],cell).size<3){cells.push(cell);placed=true;break;}}
   if(!placed){valid=false;break;}
  }
  if(valid)return cells.sort((a,b)=>a.id-b.id);
 }
 // A checked legal board is the bounded fallback; rotating colours preserves its groups.
 const fallback=[0,1,2,0,1,2,2,0,2,0,1,2,1,0,1,0,2,1,0,1,0,2,0,2,1,2,2,0,1,1,2,1,0,0,1,1,2,2,0,0];
 return fallback.map((type,id)=>({id,row:Math.floor(id/8),col:id%8,type:BUBBLE_TYPES[(type+seed%3)%3]}));
}
function bubbleColor(s:ArcadeState,ticket:ArcadeTicket,index:number){const types=BUBBLE_TYPES.filter(t=>s.bubble!.cells.some(c=>c.type===t));return types[hash(ticket.seed,'bubble-color',index)%types.length]??'grass';}
function refreshBubblePreview(s:ArcadeState,ticket:ArcadeTicket){const b=s.bubble!;b.next=bubbleColor(s,ticket,b.sequence+1);b.second=bubbleColor(s,ticket,b.sequence+2);}
function settleBubble(s:ArcadeState,ticket:ArcadeTicket){
 const b=s.bubble!,shot=b.shot!;
 let options:[number,number][]=[];
 const hit=b.cells.filter(c=>{const p=bubbleCellPosition(c,b.offset);return Math.hypot(shot.x-p.x,shot.y-p.y)<=36.01;}).sort((a,c)=>{const p=bubbleCellPosition(a,b.offset),q=bubbleCellPosition(c,b.offset);return Math.hypot(shot.x-p.x,shot.y-p.y)-Math.hypot(shot.x-q.x,shot.y-q.y)||a.row-c.row||a.col-c.col;})[0];
 if(hit)options=bubbleNeighbors(hit.row,hit.col);else options=Array.from({length:8},(_,col)=>[0,col]);
 options=options.filter(([row,col])=>!b.cells.some(c=>c.row===row&&c.col===col));
 options.sort(([r,c],[u,v])=>{const p=bubbleCellPosition({row:r,col:c},b.offset),q=bubbleCellPosition({row:u,col:v},b.offset);return (p.x-shot.x)**2+(p.y-shot.y)**2-((q.x-shot.x)**2+(q.y-shot.y)**2)||r-u||c-v;});
 if(!options.length){b.shot=null;finish(s,'lower_bound');return;}
 const [row,col]=options[0],cell:BubbleCell={id:b.nextId++,row,col,type:shot.type};b.cells.push(cell);const group=bubbleGroup(b.cells,cell);let removed=0;
 if(group.size>=3){removed=group.size;b.cells=b.cells.filter(c=>!group.has(c.id));b.removed+=removed;s.score+=removed*10;
  const anchored=new Set<number>();for(const root of b.cells.filter(c=>c.row===0))for(const id of bubbleGroup(b.cells,root,false))anchored.add(id);
  const fallen=b.cells.filter(c=>!anchored.has(c.id)).length;b.fallen+=fallen;s.score+=fallen*5;b.cells=b.cells.filter(c=>anchored.has(c.id));s.hits+=removed+fallen;
 }
 b.misses=removed?0:b.misses+1;if(b.misses>=5){b.offset+=31;b.misses=0;}
 b.shot=null;b.ready=s.tick+9;b.sequence++;
 if(!b.cells.length){finish(s,'board_clear');return;}
 if(b.cells.some(c=>bubbleCellPosition(c,b.offset).y+18>=470)){finish(s,'lower_bound');return;}
 b.current=b.next;if(!b.cells.some(c=>c.type===b.current))b.current=bubbleColor(s,ticket,b.sequence);refreshBubblePreview(s,ticket);
}
function stepBubble(s:ArcadeState,ticket:ArcadeTicket){
 const b=s.bubble!,p=b.shot;if(!p)return;
 // 3px substeps prevent a fast projectile passing through a bubble between ticks.
 for(let i=0;i<4&&b.shot&&!s.finished;i++){
  p.x+=p.vx*.005;p.y+=p.vy*.005;
  if(p.x<18||p.x>342){if(p.bounces>=1){b.shot=null;b.ready=s.tick+9;b.misses++;if(b.misses>=5){b.offset+=31;b.misses=0;}b.sequence++;b.current=b.next;refreshBubblePreview(s,ticket);if(b.cells.some(c=>bubbleCellPosition(c,b.offset).y+18>=470))finish(s,'lower_bound');break;}p.x=p.x<18?36-p.x:684-p.x;p.vx=-p.vx;p.bounces++;}
  if(p.y<=42+b.offset||b.cells.some(c=>{const pos=bubbleCellPosition(c,b.offset);return Math.hypot(p.x-pos.x,p.y-pos.y)<=36;}))settleBubble(s,ticket);
 }
}
export function validateArcadeInputs(ticket:ArcadeTicket,raw:unknown):ArcadeTap[]{
 check(Array.isArray(raw)&&raw.length<=1200,'Deze invoer is te groot.');check(JSON.stringify(raw).length<=65536,'Deze invoer is te groot.');let previous=-1,sameTick=0;
 const duration=LEGACY_DURATIONS[ticket.game??'tap_duel']*50;
 for(const i of raw){check(i&&typeof i==='object'&&!Array.isArray(i)&&Object.keys(i).every(k=>['tick','x','y','action'].includes(k))&&Number.isInteger(i.tick)&&i.tick>=0&&i.tick<duration&&i.tick>=previous&&Number.isInteger(i.x)&&Number.isInteger(i.y)&&i.x>=0&&i.x<=1000&&i.y>=0&&i.y<=1000&&(i.action===undefined||['down','up','move'].includes(i.action)),'Ongeldige spelinvoer.');sameTick=i.tick===previous?sameTick+1:1;check(sameTick<=3,'Te veel gelijktijdige invoer.');previous=i.tick;}
 return raw as ArcadeTap[];
}
export function replayArcade(ticket:ArcadeTicket,raw:unknown):{state:ArcadeState;qualified:boolean}{
 if(isOriginalRules(ticket)){const inputs=validateOriginalInputs(ticket,raw),s=createArcadeState(ticket);let index=0;for(;;){while(index<inputs.length&&inputs[index].tick===s.tick){check(!s.finished,'De ronde was al afgelopen.');applyArcadeInput(s,ticket,inputs[index++]);}if(s.finished)break;stepArcadeState(s,ticket);}check(index===inputs.length,'De ronde was al afgelopen.');const distinct=new Set(inputs.map(i=>[i.x,i.y,i.action??'down',i.control??'',i.tick].join(':'))).size,span=inputs.length?inputs.at(-1)!.tick-inputs[0].tick:0,crewWin=!!ticket.crew&&s.endReason==='target_score'&&inputs.length>0;return {state:s,qualified:crewWin||s.tick>=400&&s.score>0&&distinct>=3&&span>=100};}
 if((ticket.game??'tap_duel')==='tap_duel'&&!ticket.crew){
  const inputs=ticket.game?validateArcadeInputs(ticket,raw):raw;
  if(ticket.game)check((inputs as ArcadeTap[]).every(i=>i.action===undefined||i.action==='down'),'Tik alleen op de doelen.');
  const legacy=replayTap(ticket,ticket.game?(inputs as ArcadeTap[]).map(({tick,x,y})=>({tick,x,y})):inputs),state={...createArcadeState(ticket),...legacy.state};state.endReason=state.tick>=state.durationTicks?'time':'squad_defeated';return {state,qualified:legacy.qualified};
 }
 check(ticket.rules===legacyGameRules(ticket.game!),'Deze spelregels zijn niet beschikbaar.');
 const inputs=validateArcadeInputs(ticket,raw),s=createArcadeState(ticket);let next=0;
 if(s.game==='tap_duel'){check(inputs.every(i=>i.action===undefined||i.action==='down'),'Tik alleen op de doelen.');validateTapInputs(inputs.map(({tick,x,y})=>({tick,x,y})));}
 for(;;){while(next<inputs.length&&inputs[next].tick===s.tick){check(!s.finished,'De ronde was al afgelopen.');applyArcadeInput(s,ticket,inputs[next++]);}if(s.finished)break;stepArcadeState(s,ticket);}
 check(next===inputs.length,'De ronde was al afgelopen.');
 const accepted=s.acceptedInputs,distinct=new Set(accepted.map(i=>['bug_glide','web_runner','bug_tower'].includes(s.game)?i.action+':'+i.x+':'+i.tick:i.x+':'+i.y+':'+(i.action??'down'))).size,span=accepted.length?accepted.at(-1)!.tick-accepted[0].tick:0;
 const objective=s.game==='bubble_swarm'&&s.endReason==='board_clear'&&s.acceptedShots>=1;
 const crewWin=!!ticket.crew&&s.endReason==='target_score'&&accepted.length>0;
 return {state:s,qualified:crewWin||objective||s.tick>=400&&s.score>0&&distinct>=3&&span>=100};
}

function syncOriginal(s:ArcadeState,ticket:ArcadeTicket){const o=s.original!;s.score=Math.max(0,Math.round(o.score));s.hearts=o.hearts;s.finished=o.finished;s.endReason=o.finished?(o.reason==='time'?'time':o.reason==='hearts'?'hearts':'original_end'):null;if(ticket.crew&&s.score>=ticket.crew.targetScore){s.finished=true;s.endReason='target_score';o.finished=true;o.reason='target_score';}}
