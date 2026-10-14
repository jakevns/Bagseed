"""Package retained final evidence; assemble GIFs from browser-rendered frames."""
from pathlib import Path
import json,zipfile,hashlib,html
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'review/final'
for motion in ['walk','idle']:
    frames=[Image.open(p).convert('RGB') for p in sorted((OUT/'frames').glob(motion+'-*.png'))]
    if len(frames)!=12:raise ValueError('Missing final animation frames')
    frames[0].save(OUT/(motion+'.gif'),save_all=True,append_images=frames[1:],duration=150 if motion=='walk'else 180,loop=0)

report=json.loads((OUT/'capture-report.json').read_text())
build=json.loads((ROOT/'graphics/production/build.json').read_text())
roster=json.loads((OUT/'roster-coverage.json').read_text())
boards=''.join(f'<li><a href="{name}">{html.escape(name)}</a></li>' for name in report['rosterBoards'])
scenes=''.join(f'<figure><figcaption>{scene}: original / integrated</figcaption><a href="{scene}-before.png"><img src="{scene}-before.png" alt="Original {scene}"></a><a href="{scene}-after.png"><img src="{scene}-after.png" alt="Updated {scene}"></a></figure>' for scene in ['bedroom','park','street'])
page=f'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bagseed — final character review</title>
<style>body{{max-width:1100px;margin:24px auto;padding:0 18px;background:#f4eddc;color:#263b2e;font:16px/1.5 system-ui}}a{{color:#285d56}}img{{max-width:100%;height:auto}}figure{{margin:30px 0}}figure img{{width:49%;vertical-align:top}}code{{overflow-wrap:anywhere}}li{{margin:5px 0}}</style>
<h1>Bagseed · integrated character graphics</h1><p>The approved illustrated direction, integrated into the supplied flashlight game. <a href="../../public/index.html">Play the complete updated HTML</a>. The full source, artwork and manifests are retained in the repository.</p>
<p>{len(roster)} authored appearance variants, including aliases and alternate looks; 60 distinct haircuts and the existing customization choices. The gameplay source remains the supplied baseline. <a href="validation.md">Read the validation and limits</a>.</p>
<h2>Before and after</h2><img src="before-after.png" alt="Five original and integrated characters, portraits, views and poses">
<h2>Integrated motion</h2><p>The five approved characters retain illustrated walk frames. Additional named cast use standing drawings animated with a limb rig.</p><img src="walk.gif" alt="Integrated walking preview"><img src="idle.gif" alt="Integrated idle and blink preview">
<h2>Inside the game</h2>{scenes}<p><a href="smell-encounter.png">Live smell encounter</a> · <a href="trellis-video.png">Trellis video frame</a> · <a href="phone-390x844.png">Phone portrait emulation</a> · <a href="phone-844x390.png">Phone landscape emulation</a></p>
<h2>Complete roster inspection</h2><p>Each board shows native world size, all four enlarged views and the matching dialogue portrait. <a href="roster-coverage.json">Roster and aliases</a> · <a href="../characters-v2/index.html">Approved samples and reference evidence</a>.</p><ul>{boards}</ul>
<p>Build SHA-256: <code>{build['updatedSHA']}</code>. Browser capture: {report['capturedAt']}. This review does not establish physical-device performance or complete long-duration gameplay.</p></html>'''
(OUT/'index.html').write_text(page)

dist=ROOT/'dist';dist.mkdir(exist_ok=True)
target=dist/'Bagseed_Illustrated_Character_Update_Handoff.zip'
with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for name in ['README.md','package.json','package-lock.json','netlify.toml','.gitignore']:
        z.write(ROOT/name,name)
    for folder in ['public','src','baselines','graphics','docs','checkpoints','tests','tools','review/characters-v2','review/final']:
        for p in sorted((ROOT/folder).rglob('*')):
            if not p.is_file()or 'encoded' in p.parts or '__pycache__' in p.parts:continue
            z.write(p,p.relative_to(ROOT))
    z.writestr('HANDOFF.txt','Open public/index.html for the complete game. Open review/final/index.html for evidence. The user-provided reference DOCX remains in the GitHub repository and is omitted from this ZIP to avoid duplicating it. Rebuild instructions are in README.md. No manual deployment was performed.\n')
with zipfile.ZipFile(target) as z:
    assert z.testzip()is None
    assert hashlib.sha256(z.read('public/index.html')).hexdigest()==build['updatedSHA']
print(f'{target}: {target.stat().st_size:,} bytes; ZIP integrity and playable HTML SHA verified')
