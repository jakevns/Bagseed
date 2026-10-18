"""Publish validation only after the clean full suite has actually passed."""
from pathlib import Path
import json, re, hashlib, datetime, argparse
repo=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--log',default='.cache/alignment-npm-test-clean.txt')
args=parser.parse_args()
log=(repo/args.log).read_text(encoding='utf-8-sig')
def count(label):
    found=re.findall(r'^.*?'+label+r' (\d+)\s*$',log,re.M)
    if not found:raise RuntimeError('The full test run has not finished: '+label)
    return int(found[-1])
tests,passed,failed=count('tests'),count('pass'),count('fail')
assert failed==0 and passed==tests, 'The full suite has not passed'
out=repo/'review/custom-alignment'
matrix=json.loads((out/'measured-checks.json').read_text(encoding='utf-8-sig'))
assert matrix['cases']==7560 and not matrix['failures']
assert matrix['maxRasterShoulderDelta']<=1
build=json.loads((repo/'graphics/production/build.json').read_text(encoding='utf-8-sig'))
report={'createdUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'revision':build['characterRevision'],'status':'Technical checks passed; user visual approval pending','npmCommand':'npm test -- --test-concurrency=4','tests':tests,'passed':passed,'failed':failed,'matrix':matrix,'wardrobeSheets':len(list((out/'after').glob('*.png'))),'hairSheets':len(list((out/'hair-on-body').glob('*.png'))),'comparisonSheets':len(list((out/'comparisons').glob('*.png'))),'builtHTMLSHA256':hashlib.sha256((repo/'public/index.html').read_bytes()).hexdigest(),'characterSourcesSHA256':build['characterSourcesSHA256']}
report['openSourceArtFollowups']=['wardrobe redraw remains unapproved for all 15 garment front/rear cycles','garden and labcoat side source-art matching','genuine overalls up/1 redraw (rejected donor experiment withdrawn)','original mannequin guide sequence repeats a leading foot in three of four frames']
assert report['wardrobeSheets']==270 and report['hairSheets']==122 and report['comparisonSheets']==15
(out/'validation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8',newline='\n')
(out/'npm-test.txt').write_text(log,encoding='utf-8',newline='\n')
print(json.dumps({'tests':tests,'passed':passed,'failed':failed,'wardrobeSheets':270,'hairSheets':122,'comparisons':15}))
