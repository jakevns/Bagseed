'use strict';
const DATA=window.STUDY,DIRS=['down','right','up','left'];
const state={motion:'walk',background:'grass',display:'desktop',paused:false,frame:0};
const cards=[],oldNightCache=new Map();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function z(){return state.display==='detail'?6:DATA.displays[state.display].scale;}
function canvas(w,h){const cv=document.createElement('canvas');cv.width=w;cv.height=h;return cv;}
function prepare(cv,w,h){cv.width=Math.ceil(w*2);cv.height=Math.ceil(h*2);cv.style.width=w+'px';cv.style.height=h+'px';const c=cv.getContext('2d');c.scale(2,2);c.imageSmoothingEnabled=false;return c;}
function oldSprite(person,dir){
  const i=state.motion==='walk'?state.frame%4:state.motion==='idle'&&[2,3,4].includes(state.frame%8)?5:4;
  let source=person.oldFrames[dir][i].image;
  if(state.background==='night')source=BagseedIllustrated.tinted(source,'old|'+person.id+'|'+dir+'|'+i,DATA.nightChannels);
  return source;
}
function drawPanel(cv,person,dir,old=false){
  const scale=z(),w=32*scale,h=36*scale+8,c=prepare(cv,w,h),bg=DATA.backgrounds[state.background].image;
  c.drawImage(bg,0,0,bg.width,bg.height,0,0,bg.width*scale,bg.height*scale);
  const x=w/2,y=h-4;c.fillStyle='rgba(20,10,10,.24)';c.fillRect(x-5*scale,y-scale,10*scale,scale);
  if(old){const image=oldSprite(person,dir);c.imageSmoothingEnabled=false;c.drawImage(image,x-12*scale,y-36*scale,24*scale,36*scale);}
  else BagseedIllustrated.draw(c,person,x,y,scale,{dir,frame:state.frame,motion:state.motion,night:state.background==='night',nightColors:DATA.nightChannels});
}
function addPerson(person){
  const el=document.createElement('article');el.className='card';el.dataset.person=person.id;el.innerHTML=`<div class="person"><h2>${esc(person.name)}</h2><span>${esc(person.description)}</span></div><div class="art-grid"><div class="pair"><figure><canvas data-old></canvas><figcaption>Approved baseline</figcaption><img class="face-small" src="${person.oldPortrait.src}" alt="${esc(person.name)} original portrait"></figure><figure><canvas data-new></canvas><figcaption>Revision 02</figcaption><img class="face-small" src="${person.art.portraits.neutral}" alt="${esc(person.name)} revised portrait"></figure></div><div class="turns">${DIRS.map((dir,i)=>`<figure><canvas data-dir="${dir}"></canvas><figcaption>${['Front','Right','Back','Left'][i]}</figcaption></figure>`).join('')}</div><div class="faces">${['neutral','friendly','concerned'].map(expression=>`<figure><img src="${person.art.portraits[expression]}" alt="${esc(person.name)} ${expression}"><figcaption>${expression[0].toUpperCase()+expression.slice(1)}</figcaption></figure>`).join('')}<div class="portrait-note">Expression details enlarged · small pair at dialogue size</div></div></div>`;document.querySelector('#cast').append(el);cards.push({person,el});
}
function draw(){
  document.body.classList.toggle('zoom-detail',state.display==='detail');
  for(const {person,el}of cards){drawPanel(el.querySelector('[data-old]'),person,'down',true);drawPanel(el.querySelector('[data-new]'),person,'down');for(const cv of el.querySelectorAll('[data-dir]'))drawPanel(cv,person,cv.dataset.dir);}
  const label=state.display==='detail'?'Enlarged inspection: sprites shown at 2× their native raster; portrait details at native 192 × 192. These are not actual phone sizes.':`${DATA.displays[state.display].label} · ${z()} CSS px/world px. Existing feet position retained. Small portraits: 64 × 64 CSS pixels.`;
  document.querySelector('#measurement').textContent=label;
}
window.captureFrame=(frame=0,background='grass',display='desktop',motion='still')=>{Object.assign(state,{frame,background,display,motion,paused:true});for(const k of ['background','display','motion'])document.querySelector('#'+k).value=state[k];draw();};
window.animationStrip=(frame=0,motion='walk',background='grass')=>{
  captureFrame(frame,background,'desktop',motion);const out=canvas(1050,180),c=out.getContext('2d');c.fillStyle='#f6f1e6';c.fillRect(0,0,1050,180);c.textAlign='center';
  for(const [i,person]of DATA.people.entries()){const x=i*210;c.fillStyle='#344c3c';c.font='bold 12px system-ui';c.fillText(person.shortName,x+105,17);for(const [old,dx]of [[true,5],[false,109]]){const pane=canvas(1,1);drawPanel(pane,person,'down',old);c.imageSmoothingEnabled=true;c.drawImage(pane,0,0,pane.width,pane.height,x+dx,27,96,116);c.font='10px system-ui';c.fillStyle='#65715e';c.fillText(old?'Baseline':'Revision 02',x+dx+48,161);}}
  return out.toDataURL();
};
window.reviewReady=(async()=>{
  await BagseedIllustrated.prepare(DATA);
  for(const bg of Object.values(DATA.backgrounds))bg.image=await BagseedIllustrated.load(bg.src);
  for(const person of DATA.people){for(const dir of DIRS)for(const frame of person.oldFrames[dir])frame.image=await BagseedIllustrated.load(frame.src);addPerson(person);}
  for(const source of DATA.evidence){const el=document.createElement('article');el.className='source';el.innerHTML=`<img src="${source.embedded}" alt="${esc(source.game+' '+source.id)}"><h4>${esc(source.id)} · ${esc(source.game)}</h4><small>${esc(source.kind)} · ${esc(source.caption)}</small><p>${esc(source.study)}</p><a href="${esc(source.source)}" target="_blank" rel="noopener">Original source</a> · <a href="${esc(source.source_page)}" target="_blank" rel="noopener">Source page</a>`;document.querySelector('#sources').append(el);}
  for(const key of ['motion','background','display'])document.querySelector('#'+key).addEventListener('change',e=>{state[key]=e.target.value;draw();});document.querySelector('#pause').addEventListener('click',e=>{state.paused=!state.paused;e.target.textContent=state.paused?'Resume':'Pause';});
  if(new URLSearchParams(location.search).has('capture')){document.body.classList.add('capture');state.paused=true;state.motion='still';document.querySelector('#motion').value='still';}
  draw();let last=0;function tick(t){if(!state.paused&&t-last>=170){state.frame++;last=t;draw();}requestAnimationFrame(tick);}requestAnimationFrame(tick);
  return {people:cards.length,directions:4,portraitExpressions:3,evidence:DATA.evidence.length};
})();
