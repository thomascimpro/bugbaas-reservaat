/** Loading/compilation time must never consume a player's round. Start exactly once. */
export class ArcadePlayClock {
 private origin:number|null=null;
 get ready(){return this.origin!==null;}
 start(now:number){if(this.origin===null)this.origin=now;}
 ticks(now:number,max:number){return this.origin===null?0:Math.min(max,Math.max(0,Math.floor((now-this.origin)/20)));}
}
