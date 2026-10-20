from pathlib import Path
from playwright.sync_api import sync_playwright
import base64,json,sys

destination=Path('assets/v2/portraits/v1');destination.mkdir(parents=True,exist_ok=True)
manifest=json.loads((destination/'manifest.json').read_text(encoding='utf-8'))['species'] if sys.argv[1:] and (destination/'manifest.json').exists() else {}
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':1024,'height':1024});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8094');page.wait_for_function('!!window.renderBug')
 for species in (sys.argv[1:] or page.evaluate('window.species')):
  for shiny in [False,True]:
   result=page.evaluate('async ({id,shiny})=>await window.renderBug(id,shiny)',{'id':species,'shiny':shiny})
   name=species+('-shiny' if shiny else '')+'.png';(destination/name).write_bytes(base64.b64decode(result['png'].split(',')[1]))
   manifest[species]={'model':result['model'],'palette':result['palette'],'size':1024,'normal':species+'.png','shiny':species+'-shiny.png'}
  print(species,flush=True)
 assert not errors,errors
 browser.close()
(destination/'manifest.json').write_text(json.dumps({'version':1,'source':'Gobkit CC0 models and original BugBaas HawkCaterpillar; rendered using src/bugModelV2.ts materials','species':manifest},indent=2),encoding='utf-8')
