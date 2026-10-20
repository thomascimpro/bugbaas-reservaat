import {rng,SPECIES} from './catalogV2';
import type {Gear} from './equipmentV2';

const BOSSES:Record<number,{team:[string,string,string];item:Gear|null;tip:string}>={
 5:{team:['shieldbug','earwig','dragonfly'],item:'thorn',tip:'Doorbreek het pantser of gebruik gif. Bewaar een schild voor de Libelle.'},
 10:{team:['scorpionfly','beetle','moth'],item:'dew',tip:'Neem Zuiveren mee tegen gif. Pantser alleen is niet genoeg.'},
 15:{team:['dragonfly','ladybug','ant'],item:'bark',tip:'Bewaar bescherming voor zware klappen. Zet daarna druk op de verzorger.'},
 20:{team:['crystalstag','cometmoth','ambermantis'],item:'moon',tip:'Breek het pantser en voorkom een lang gevecht tegen de verzorger.'},
 25:{team:['glasswing','scorpionfly','ambermantis'],item:'sun',tip:'Snel laden, gif en pantserbreuk. Wissel op tijd en houd Zuiveren achter de hand.'},
 30:{team:['crystalstag','glasswing','cometmoth'],item:null,tip:'Je eindproef: doorbreek verdediging, vang de zware klap op en win vóór de beurtlimiet.'},
};
export function encounterFor(stage:number){
 if(stage===1)return {boss:false,team:['ant','cricket','bee'] as [string,string,string],item:null,tip:'Begin met basisaanvallen om energie te laden. Bewaar Doorbraak voor een vijand zonder schild.'};
 const boss=BOSSES[stage];if(boss)return {boss:true,...boss};
 const random=rng('bugbaas-world-4:'+stage),pool=SPECIES.filter(s=>s.tier<=(stage<8?5:stage<18?6:7)),team:string[]=[];
 for(let i=0;i<3;i++){const options=pool.filter(s=>!team.includes(s.id));team.push(options[Math.floor(random()*options.length)].id);}
 return {boss:false,team:team as [string,string,string],item:null,tip:'Bekijk de drie rollen en pas je team aan. Dezelfde locatie heeft steeds dezelfde tegenstanders.'};
}
export const masteryStars=(won:boolean,round:number,alive:number)=>won?1+Number(round<=18)+Number(alive===3):0;
