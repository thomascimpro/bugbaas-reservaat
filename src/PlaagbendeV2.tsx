import React,{useState} from 'react';
import {Modal,ScrollView,Text,View} from 'react-native';
import {PLAAG_EMOJI,PLAAG_REWARD,plaagName,plaagTeam} from '../game/plaagbendeV2';
import type {PlaagView} from '../game/plaagbendeV2';
import {recommendTeam} from '../game/recommendV2';
import {species} from '../game/catalogV2';
import {distance} from '../game/walkingV2';
import type {Fix} from '../game/walkingV2';
import {POST_RADIUS} from '../game/worldSitesV2';
import type {GameViewV2} from '../game/typesV2';
import type {RunV2} from './ShopViewV2';
import {SpriteView} from './artV2';
import {GoTeamPickerV2} from './GoTeamPickerV2';
import {GO_TYPES,GoTypeBadge} from './GoTypeV2';
import {useGoBack} from './GoBackV2';
import {Button,Counter,Help,IconButton,Label,Title,V,font} from './uiV2';

/** The Plaagbende screen: who took over the post (or balloon), their three bugs as silhouettes, 👍 recommended team, then the fight. */
export function PlaagbendeV2({view,run,busy,now,target,fix,ensureGPS,onClose,onBattle,onPost}:{view:GameViewV2;run:RunV2;busy:boolean;now:number;target:string;fix:Fix;ensureGPS:()=>Promise<boolean>;onClose:()=>void;onBattle:()=>void;onPost?:()=>void}){
 const [choosing,setChoosing]=useState(false),p=view.player,g=p.go!,balloon=g.plaagbende?.balloon,isBalloon=target==='balloon';
 useGoBack(!choosing,()=>{onClose();return true;},35);
 const inv:Pick<PlaagView,'id'|'type'|'team'|'endsAt'>|undefined=isBalloon?(balloon&&balloon.until>now?{id:balloon.id,type:balloon.type,team:plaagTeam(balloon.id,balloon.type),endsAt:balloon.until}:undefined):view.plaagbende?.find(v=>v.postId===target&&!v.far);
 const post=isBalloon?undefined:p.walking?.posts?.find(s=>s.id===target),meters=post?Math.round(distance(fix,post)):0,far=!!post&&meters>POST_RADIUS;
 const pool=p.specimens.filter(s=>s.go&&!g.gyms?.deployed.some(d=>d.specimen===s.id)),lead=inv?.team[0],recommended=lead?recommendTeam(pool,lead):[],enough=recommended.length===3;
 const left=inv?Math.max(0,Math.ceil((inv.endsAt-now)/60000)):0,clock=Math.floor(left/60)+':'+String(left%60).padStart(2,'0');
 async function fight(ids:string[]){if(!isBalloon&&!await ensureGPS())return false;const ok=await run('plaagFight',{target,ids});if(ok){setChoosing(false);onBattle();}return ok;}
 return <Modal visible transparent animationType={p.settings.reducedMotion?'none':'slide'} onRequestClose={onClose}><View style={{flex:1,backgroundColor:'#1A0B2BAA',justifyContent:'flex-end',alignItems:'center'}}><View testID="plaagbende-sheet" style={{width:'100%',maxWidth:560,maxHeight:'92%',backgroundColor:'#2A1740',borderTopLeftRadius:28,borderTopRightRadius:28,borderWidth:2,borderColor:'#8E5BD0',padding:17,gap:12}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:10}}><View style={{width:62,height:62,borderRadius:31,backgroundColor:'#4B2A6E',borderWidth:3,borderColor:'#B98AF0',alignItems:'center',justifyContent:'center'}}><Text style={{fontSize:36}}>{isBalloon?'🎈':'🦝'}</Text></View><View style={{flex:1,minWidth:0}}><Title>{inv?plaagName(inv.type):'Plaagbende'}</Title><Label small color="#E3D2FA">{isBalloon?'🎈 Ballon · overal te spelen':post?.name??'Post'}{inv?' · ⏱ '+clock:''}</Label></View><Help title="Plaagbende" body="De Plaagbende pakt bugs af. Versla ze en je redt een bug! Hun teken laat zien welk type ze gebruiken. Kies bugs die daar sterk tegen zijn (👍). Verliezen kost niets: probeer het gewoon opnieuw. De ballon kun je overal spelen."/><IconButton name="close" label="Sluit Plaagbende" onPress={onClose}/></View>
  <ScrollView contentContainerStyle={{gap:12,paddingBottom:18}}>{!inv?<View style={{alignItems:'center',gap:8,padding:18}}><Text style={{fontSize:46}}>✅</Text><Label bold center>Verslagen!</Label>{onPost&&<Button small secondary icon="compass" onPress={onPost}>Post</Button>}</View>:<>
   <View testID="plaagbende-type" accessibilityLabel={'Ze gebruiken '+GO_TYPES[inv.type].name} style={{flexDirection:'row',alignItems:'center',gap:8,padding:10,borderRadius:18,backgroundColor:GO_TYPES[inv.type].color+'33',borderWidth:1,borderColor:GO_TYPES[inv.type].color}}><Text style={{fontSize:30}}>{PLAAG_EMOJI[inv.type]}</Text><View style={{flex:1}}><Label bold>Ze gebruiken</Label></View><GoTypeBadge type={inv.type}/></View>
   <View style={{flexDirection:'row',gap:8}}>{inv.team.map((kind,i)=><View key={kind} testID={'plaag-bug-'+i} accessibilityLabel={'Plaagbende-bug '+(i+1)} style={{flex:1,alignItems:'center',gap:4,padding:8,borderRadius:18,backgroundColor:'#3A2257',borderWidth:1,borderColor:'#8E5BD077'}}><SpriteView id={kind} silhouette size={66}/><Text style={{fontSize:18}}>{PLAAG_EMOJI[inv.type]}</Text></View>)}</View>
   <View style={{flexDirection:'row',justifyContent:'space-around',alignItems:'center'}}><Counter icon="nectar" value={'+'+PLAAG_REWARD.dust} label="✨ Stof"/><View accessibilityLabel="Je redt een bug" style={{alignItems:'center'}}><Text style={{fontSize:24}}>🎁</Text><Text style={{fontFamily:font,fontSize:11,fontWeight:'700',color:V.ink}}>+1 bug</Text></View><Counter icon="star" value={'+'+PLAAG_REWARD.xp} label="XP"/></View>
   {far&&<Label small center color="#F3D6A4">🚶 Loop dichterbij · {meters} m</Label>}
   {!enough&&<Label small center color="#F3D6A4">Vang eerst 3 verschillende bugs.</Label>}
   {enough&&<View style={{flexDirection:'row',justifyContent:'center',gap:6}}>{recommended.map(id=>{const s=pool.find(b=>b.id===id)!;return <View key={id} accessibilityLabel={'Aanbevolen: '+species(s.species).name}><SpriteView id={s.species} shiny={s.shiny} size={46}/></View>;})}</View>}
   <Button icon="star" disabled={busy||far||!enough} accessibilityLabel="Kies aanbevolen team en vecht" onPress={()=>void fight(recommended)}>👍 Kies aanbevolen</Button>
   <View style={{flexDirection:'row',gap:8}}><View style={{flex:1}}><Button small secondary icon="team" disabled={busy||far||!enough} onPress={()=>setChoosing(true)}>Zelf kiezen</Button></View>{onPost&&<View style={{flex:1}}><Button small secondary icon="compass" onPress={onPost}>Post</Button></View>}</View>
  </>}<Label small center color="#CDB8EA">🦝 Verslagen: {g.plaagbende?.wins??0}</Label></ScrollView>
 </View></View>{choosing&&lead&&<GoTeamPickerV2 raid title="Team tegen Plaagbende" against={lead} player={p} {...{run,busy}} onClose={()=>setChoosing(false)} onConfirm={fight}/>}</Modal>;
}
