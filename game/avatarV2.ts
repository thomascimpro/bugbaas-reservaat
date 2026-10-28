export const TRAINER_AVATARS=['fern','amber','tidal'] as const;
export type TrainerAvatar=typeof TRAINER_AVATARS[number];
export const TRAINER_PALETTES={
 fern:{name:'Bos',jacket:'#6C9C64',trim:'#C9D7A4',cap:'#3D664A',pack:'#B5A26F'},
 amber:{name:'Zon',jacket:'#D29A43',trim:'#F1D393',cap:'#80643B',pack:'#8A9C68'},
 tidal:{name:'Water',jacket:'#518DA8',trim:'#B4D7DF',cap:'#335F77',pack:'#B7A77A'},
} as const;
/** Outfit colour on top of the chosen ranger: shown on the map avatar and as the portrait ring. */
export const OUTFITS={
 moss:{name:'Mos',jacket:'#6C9C64',trim:'#C9D7A4'},sun:{name:'Zon',jacket:'#D29A43',trim:'#F1D393'},sea:{name:'Zee',jacket:'#518DA8',trim:'#B4D7DF'},
 berry:{name:'Bes',jacket:'#A3546F',trim:'#EDB8C8'},violet:{name:'Paars',jacket:'#7A66B0',trim:'#CFC3F0'},coral:{name:'Koraal',jacket:'#D96B4F',trim:'#F6C0A8'},
} as const;
export type OutfitId=keyof typeof OUTFITS;
export const isOutfit=(id:unknown):id is OutfitId=>typeof id==='string'&&Object.hasOwn(OUTFITS,id);
export function trainerPalette(avatar?:string,outfit?:string){const base=TRAINER_PALETTES[TRAINER_AVATARS.includes(avatar as TrainerAvatar)?avatar as TrainerAvatar:'fern'];return isOutfit(outfit)?{...base,jacket:OUTFITS[outfit].jacket,trim:OUTFITS[outfit].trim}:base;}
/** First partner, PoGO style: one fire, one water, one grass bug. It becomes your first buddy. */
export const STARTER_PARTNERS=['firefly_1','waterstrider','leafhopper'] as const;
export const STARTER_INFO:Record<typeof STARTER_PARTNERS[number],string>={firefly_1:'Gloeit in het donker. Vuur is sterk tegen gras- en insectbugs.',waterstrider:'Schaatst over het water. Water is sterk tegen vuur en steen.',leafhopper:'Springt van blad naar blad. Gras is sterk tegen water en grond.'};
export const NAME_IDEAS=['Kever','Mier','Libel','Vlinder','Krekel','Bij','Glimworm','Hommel','Spin','Sprinkhaan','Rups','Mot'];
export const NAME_ENDINGS=['Jager','Vriend','Ster','Held','Speurder','Ranger','Kapitein','Baas'];
