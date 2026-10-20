import type {GameViewV2} from '../game/typesV2';
export function isNewerV2(current:GameViewV2|null,next:GameViewV2):boolean {
 if(!current||current.player.uid!==next.player.uid)return true;
 if(next.player.revision<current.player.revision)return false;
 const sameGo=!!current.goBattle&&current.goBattle.id===next.goBattle?.id;if(sameGo&&next.goBattle!.revision<current.goBattle!.revision)return false;
 const sameMatch=!!current.match&&current.match.id===next.match?.id;
 if(sameMatch&&next.match!.revision<current.match!.revision)return false;
 if(next.player.revision>current.player.revision||sameMatch&&next.match!.revision>current.match!.revision)return true;
 return next.now>=current.now;
}
