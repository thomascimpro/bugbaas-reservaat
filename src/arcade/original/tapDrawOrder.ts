// Presentation only (GM-01). The simulation's tap input picks the FIRST target in
// `originalTapTargets` whose hitbox contains the tap. A renderer draws later children on top,
// so drawing the list as-is made the visible top bug differ from the bug a tap hits when two overlap.
// Drawing in reverse puts the input-priority target on top; scoring and selection stay untouched.
export function tapDrawOrder<T>(targets:readonly T[]):T[]{return [...targets].reverse();}

type Box={motion:{x:number;y:number};size:number};
/** The target a player sees on top at logical field point (x 0..360, y 0..640), given the draw order above. */
export function topVisibleTarget<T extends Box>(targets:readonly T[],x:number,y:number):T|undefined{
 const drawn=tapDrawOrder(targets);
 for(let i=drawn.length-1;i>=0;i--){const t=drawn[i];if(x>=t.motion.x*3.6&&x<=t.motion.x*3.6+t.size&&y>=t.motion.y*6.4&&y<=t.motion.y*6.4+t.size)return t;}
 return undefined;
}
