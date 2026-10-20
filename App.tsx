import GameV2 from './src/GameV2';
import BridgeFieldV2,{isNativeField} from './src/BridgeFieldV2';
export default function App(){return isNativeField()?<BridgeFieldV2/>:<GameV2/>;}
