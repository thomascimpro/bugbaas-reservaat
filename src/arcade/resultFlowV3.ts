import type {ArcadeReceipt} from '../../game/arcade/tapDuel';
/** Later polls or a second game must not erase the result being reviewed. */
export function receiptForRunV3(run:string|undefined,live:ArcadeReceipt|undefined,saved:ArcadeReceipt|undefined){return run?(live?.runId===run?live:saved?.runId===run?saved:undefined):undefined;}
export function resultActionV3(receipt:ArcadeReceipt|undefined){return receipt?.crew?receipt.won?'done':'retry':'again';}
