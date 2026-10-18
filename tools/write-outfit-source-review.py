"""Write a same-scale idle/walk review. Preview tiles are never art sources."""
from pathlib import Path
import argparse, importlib.util, json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('audit',ROOT/'tools/audit-walk-rerender-v6.py')
audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
p=argparse.ArgumentParser();p.add_argument('--garment',required=True);p.add_argument('--attempt',required=True);p.add_argument('--version',required=True)
a=p.parse_args();out=ROOT/f'review/{a.garment}-proportions-v{a.version}'
for d in ['down','up']:
    paths={'old':ROOT/f'graphics/production/customization/top/{a.garment}/{d}.png',
           'idle':ROOT/f'graphics/production/walk/registered/{a.garment}-idle-v{a.version}/{d}.png'}
    paths.update({str(f):ROOT/f'graphics/production/walk/sources/rerender-v6/registered/{a.attempt}/top-{a.garment}/{d}-{f}.png' for f in range(4)})
    for key,path in paths.items():
        audit.tile(Image.open(path).convert('RGBA'),(240,270)).save(out/f'{d}-{key}-preview.png')
html='''<!doctype html><meta charset="utf-8"><title>OUTFIT idle and walk review</title>
<style>body{font:17px system-ui;background:#eee9dd;color:#352d28;margin:24px}button,input{font:inherit}button{padding:8px;margin:4px}section{display:flex;gap:12px;flex-wrap:wrap}figure{margin:0;text-align:center}img.pose{width:240px;height:270px}#comparison{max-width:100%;height:auto}a{color:#214c83}</style>
<h1>OUTFIT: walking first, idle matched afterward</h1><p>Front and rear source-art review only. These candidates are not installed in the game. Each body is uniformly scaled to the same height; widths are never stretched.</p>
<button id="play">Pause</button><button id="step">Next frame</button><button id="toggle">Show idle in cycle</button><label>Phase <input id="phase" type="range" min="0" max="3" step="1" value="0"></label><span id="caption"></span>
<h2>Front</h2><section><figure><figcaption>Old idle</figcaption><img class="pose" src="down-old-preview.png"></figure><figure><figcaption>Revised idle</figcaption><img class="pose" src="down-idle-preview.png"></figure><figure><figcaption>New cycle</figcaption><img class="pose" id="down" src="down-0-preview.png"></figure></section>
<h2>Back</h2><section><figure><figcaption>Old idle</figcaption><img class="pose" src="up-old-preview.png"></figure><figure><figcaption>Revised idle</figcaption><img class="pose" src="up-idle-preview.png"></figure><figure><figcaption>New cycle</figcaption><img class="pose" id="up" src="up-0-preview.png"></figure></section>
<h2>All poses</h2><a href="comparison.png"><img id="comparison" src="comparison.png"></a><p><a href="measurements.json">Proportions, color measurements and raw-image hashes</a></p>
<script>
let phase=0,playing=true,idle=false;const names=['right contact','right support / left passing','left contact','left support / right passing'];
for(const d of ['down','up'])for(const f of ['idle',0,1,2,3]){const im=new Image();im.src=`${d}-${f}-preview.png`;}
function draw(){for(const d of ['down','up'])document.getElementById(d).src=`${d}-${idle?'idle':phase}-preview.png`;document.getElementById('phase').value=phase;document.getElementById('caption').textContent=idle?'Idle':`${phase}: ${names[phase]}`;}
document.getElementById('play').onclick=()=>{playing=!playing;document.getElementById('play').textContent=playing?'Pause':'Play';};
document.getElementById('step').onclick=()=>{idle=false;phase=(phase+1)%4;draw();};
document.getElementById('toggle').onclick=()=>{idle=!idle;draw();};
document.getElementById('phase').oninput=e=>{idle=false;phase=+e.target.value;draw();};
setInterval(()=>{if(playing&&!idle){phase=(phase+1)%4;draw();}},190);draw();
</script>'''
(out/'index.html').write_text(html.replace('OUTFIT',a.garment.title()),encoding='utf-8',newline='\n')
print(out/'index.html')
