import {writeFileSync} from 'node:fs';
import {RULES,SPECIES,ITEMS} from '../game/catalogV2';
writeFileSync('game/catalog-v2.json',JSON.stringify({version:RULES,species:SPECIES,items:ITEMS},null,2)+'\n');
writeFileSync('game/reference-map.json',JSON.stringify({version:RULES,reference:'Original BugBaas content using common auto-battler mechanics. This is not a verified copy of a specific Super Auto Pets pack.',mapping:SPECIES.map(s=>({id:s.id,role:s.ability.trigger+'-'+s.ability.effect+'-'+s.ability.target}))},null,2)+'\n');
