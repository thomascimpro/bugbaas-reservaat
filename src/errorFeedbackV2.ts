export type FeedbackToneV2='error'|'notice';
export function temporaryFailureV2(error:unknown){const status=(error as {status?:number}|null)?.status;return status===0||status===408||status===429||typeof status==='number'&&status>=500&&status<600;}
export function commandFeedbackV2(error:unknown){return temporaryFailureV2(error)||(error as {status?:number}|null)?.status===409?'notice' as const:'error' as const;}
/** One missed refresh must not interrupt a game that already has confirmed state. */
export function pollFeedbackV2(error:unknown,failures:number,elapsed:number){if(!temporaryFailureV2(error))return {tone:'error' as const,message:error instanceof Error?error.message:'Verbinden is niet gelukt.'};return failures>=3&&elapsed>=8000?{tone:'notice' as const,message:'Verbinding herstellen…'}:null;}
