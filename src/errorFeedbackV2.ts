export type FeedbackToneV2='error'|'notice';
export function temporaryFailureV2(error:unknown){const status=(error as {status?:number}|null)?.status;return status===0||status===408||status===429||typeof status==='number'&&status>=500&&status<600;}
/** Only sign-in problems stay red; a refused or late action is a calm notice that fades by itself. */
export function commandFeedbackV2(error:unknown){const status=(error as {status?:number}|null)?.status;return status===401||status===403?'error' as const:'notice' as const;}
/** A revision conflict only means the screen was a moment behind: refresh quietly, no message. */
export const quietCommandFailureV2=(error:unknown)=>(error as {status?:number}|null)?.status===409;
/** One missed refresh must not interrupt a game that already has confirmed state. */
export function pollFeedbackV2(error:unknown,failures:number,elapsed:number){if(!temporaryFailureV2(error))return {tone:'error' as const,message:error instanceof Error?error.message:'Verbinden is niet gelukt.'};return failures>=3&&elapsed>=8000?{tone:'notice' as const,message:'Verbinding herstellen…'}:null;}
