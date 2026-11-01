# Saves 256px WebP portraits for the Kenney Mini Characters trainers into assets/v2/trainers/.
# Needs: node scripts/render-trainer-portraits.mjs running (PORTRAIT_PORT, default 8097).
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import base64,io,os

IDS=['female-a','female-b','female-c','female-d','female-e','female-f','male-a','male-b','male-c','male-d','male-e','male-f']
destination=Path('assets/v2/trainers');destination.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page(viewport={'width':512,'height':512});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:'+os.environ.get('PORTRAIT_PORT','8097'));page.wait_for_function('!!window.renderTrainer')
 for id in IDS:
  png=page.evaluate('async m=>await window.renderTrainer(m)','trainers/character-'+id)
  image=Image.open(io.BytesIO(base64.b64decode(png.split(',')[1]))).convert('RGB').resize((256,256),Image.LANCZOS)
  image.save(destination/('mini-'+id+'-v1.webp'),'WEBP',quality=88,method=6);print(id,flush=True)
 assert not errors,errors
 browser.close()
