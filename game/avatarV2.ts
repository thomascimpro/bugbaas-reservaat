/** fern/amber/tidal are the original Ranger body (existing players keep them); the rest are Kenney Mini Characters (CC0). */
export const MINI_TRAINERS=['female_a','female_b','female_c','female_d','female_e','female_f','male_a','male_b','male_c','male_d','male_e','male_f'] as const;
export const TRAINER_AVATARS=['fern','amber','tidal',...MINI_TRAINERS] as const;
export type TrainerAvatar=typeof TRAINER_AVATARS[number];
export const TRAINER_PALETTES:Record<TrainerAvatar,{name:string;jacket:string;trim:string;cap:string;pack:string}>={
 fern:{name:'Bos',jacket:'#6C9C64',trim:'#C9D7A4',cap:'#3D664A',pack:'#B5A26F'},
 amber:{name:'Zon',jacket:'#D29A43',trim:'#F1D393',cap:'#80643B',pack:'#8A9C68'},
 tidal:{name:'Water',jacket:'#518DA8',trim:'#B4D7DF',cap:'#335F77',pack:'#B7A77A'},
 female_a:{name:'Noor',jacket:'#9B6BC9',trim:'#D9C2F0',cap:'#3B2E2A',pack:'#5B7FC0'},
 female_b:{name:'Lotte',jacket:'#E2B840',trim:'#F6E3A0',cap:'#D9824A',pack:'#9A5FB8'},
 female_c:{name:'Fenna',jacket:'#5A86C8',trim:'#BFD3F0',cap:'#7D838C',pack:'#E57D4A'},
 female_d:{name:'Isa',jacket:'#8E949C',trim:'#D5D9DE',cap:'#D9824A',pack:'#3A3A42'},
 female_e:{name:'Mila',jacket:'#C9CED3',trim:'#F4F5F6',cap:'#2E2E33',pack:'#6F86C9'},
 female_f:{name:'Roos',jacket:'#3A3A42',trim:'#E8C04A',cap:'#D9824A',pack:'#8E63C9'},
 male_a:{name:'Daan',jacket:'#4FB878',trim:'#BDE8C9',cap:'#2E2E33',pack:'#E8C04A'},
 male_b:{name:'Bram',jacket:'#E07A3E',trim:'#F6C3A0',cap:'#E9C29A',pack:'#6F8FC9'},
 male_c:{name:'Tim',jacket:'#4A6FB5',trim:'#B9C9EC',cap:'#3D5A99',pack:'#2E2E33'},
 male_d:{name:'Luuk',jacket:'#34363C',trim:'#E0603C',cap:'#D9824A',pack:'#2E2E33'},
 male_e:{name:'Finn',jacket:'#D6D9DC',trim:'#F2CF52',cap:'#C8683A',pack:'#3A3A42'},
 male_f:{name:'Sem',jacket:'#5FB57A',trim:'#C9A57A',cap:'#2E2E33',pack:'#8A6A4A'},
};
export const isTrainerAvatar=(id:unknown):id is TrainerAvatar=>typeof id==='string'&&(TRAINER_AVATARS as readonly string[]).includes(id);
/** Map model (path under public/models, without .glb) for an avatar; unknown/old ids fall back to the Ranger. */
export function trainerModel(avatar?:string){return isTrainerAvatar(avatar)&&(MINI_TRAINERS as readonly string[]).includes(avatar)?'trainers/character-'+avatar.replace('_','-'):'Ranger';}
/** Outfit colour on top of the chosen ranger: shown on the map avatar and as the portrait ring. */
export const OUTFITS={
 moss:{name:'Mos',jacket:'#6C9C64',trim:'#C9D7A4'},sun:{name:'Zon',jacket:'#D29A43',trim:'#F1D393'},sea:{name:'Zee',jacket:'#518DA8',trim:'#B4D7DF'},
 berry:{name:'Bes',jacket:'#A3546F',trim:'#EDB8C8'},violet:{name:'Paars',jacket:'#7A66B0',trim:'#CFC3F0'},coral:{name:'Koraal',jacket:'#D96B4F',trim:'#F6C0A8'},
} as const;
export type OutfitId=keyof typeof OUTFITS;
export const isOutfit=(id:unknown):id is OutfitId=>typeof id==='string'&&Object.hasOwn(OUTFITS,id);
export function trainerPalette(avatar?:string,outfit?:string){const base=TRAINER_PALETTES[isTrainerAvatar(avatar)?avatar:'fern'];return isOutfit(outfit)?{...base,jacket:OUTFITS[outfit].jacket,trim:OUTFITS[outfit].trim}:base;}
/** First partner, PoGO style: one fire, one water, one grass bug. It becomes your first buddy. */
export const STARTER_PARTNERS=['firefly_1','waterstrider','leafhopper'] as const;
export const STARTER_INFO:Record<typeof STARTER_PARTNERS[number],string>={firefly_1:'Gloeit in het donker. Vuur is sterk tegen gras- en insectbugs.',waterstrider:'Schaatst over het water. Water is sterk tegen vuur en steen.',leafhopper:'Springt van blad naar blad. Gras is sterk tegen water en grond.'};
export const NAME_IDEAS=['Kever','Mier','Libel','Vlinder','Krekel','Bij','Glimworm','Hommel','Spin','Sprinkhaan','Rups','Mot'];
export const NAME_ENDINGS=['Jager','Vriend','Ster','Held','Speurder','Ranger','Kapitein','Baas'];
