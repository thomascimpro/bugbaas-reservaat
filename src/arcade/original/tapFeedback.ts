import type {OriginalTapEffect,OriginalTapTarget} from '../../../game/arcade/original/tapDuel';

export function tapHitFeedback(target:OriginalTapTarget,effects:readonly OriginalTapEffect[],now:number){
 return effects.find(e=>e.kind==='hit'&&e.targetId===target.bugId&&now-e.at>=0&&now-e.at<140);
}
