export const TRAINER_AVATARS=['fern','amber','tidal'] as const;
export type TrainerAvatar=typeof TRAINER_AVATARS[number];
export const TRAINER_PALETTES={
 fern:{name:'Bos',jacket:'#6C9C64',trim:'#C9D7A4',cap:'#3D664A',pack:'#B5A26F'},
 amber:{name:'Zon',jacket:'#D29A43',trim:'#F1D393',cap:'#80643B',pack:'#8A9C68'},
 tidal:{name:'Water',jacket:'#518DA8',trim:'#B4D7DF',cap:'#335F77',pack:'#B7A77A'},
} as const;
export function trainerPalette(avatar?:string){return TRAINER_PALETTES[TRAINER_AVATARS.includes(avatar as TrainerAvatar)?avatar as TrainerAvatar:'fern'];}
