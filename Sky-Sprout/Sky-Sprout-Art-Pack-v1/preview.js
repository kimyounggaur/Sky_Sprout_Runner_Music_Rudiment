const canvas=document.querySelector('#scene'),ctx=canvas.getContext('2d');
const names=['background-sky','background-islands','platform-meadow','platform-cloud','tile-meadow','tile-rune','light-seed','drift-bug','thorn-pod','breeze-orb','growth-bud','checkpoint-lantern','sprout-idle','sprout-run-a','sprout-run-b','sprout-jump','sprout-fall','sprout-land'];
const images={},effects={};let loaded=0,paused=false,view='play',frame=0,jumpAt=-9999,collectAt=-9999,seedCount=8,heroX=340,pose='sprout-idle';
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
const motion=document.querySelector('#motion');motion.checked=!reduced;
for(const n of names){const im=new Image;im.src='assets/raster/'+n+'.png';images[n]=im;im.onload=()=>loaded++;}
for(const n of ['fx-land','fx-collect','fx-wind']){effects[n]=new Image;effects[n].src='assets/svg/'+n+'.svg';}
function drawImage(name,x,y,w,h,alpha=1){let im=images[name]||effects[name];if(!im||!im.complete)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(im,x,y,w,h);ctx.restore();}
function render(t=0){
 const dpr=Math.min(devicePixelRatio||1,2),rect=canvas.getBoundingClientRect();
 if(canvas.width!==Math.round(rect.width*dpr)||canvas.height!==Math.round(rect.height*dpr)){canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);}
 const portrait=rect.width<600&&rect.height>rect.width;const worldWidth=portrait?800:1280;
 const scale=canvas.width/worldWidth;ctx.setTransform(scale,0,0,scale,0,0);
 const worldH=canvas.height/scale,offset=portrait?110:0;
 ctx.clearRect(0,0,worldWidth,worldH);
 drawImage('background-sky',0,0,worldWidth,worldH);
 ctx.save();ctx.translate(-offset,portrait?(worldH-720)*.25:0);
 const tm=(!paused&&motion.checked)?t:0;const drift=Math.sin(tm/9000)*12;
 drawImage('background-islands',60+drift,85,1150,580,.38);
 // Three walkable platforms; their painted upper surfaces line up with the character feet.
 drawImage('platform-meadow',-90,448,650,303);
 drawImage('platform-cloud',535,405,255,144);
 drawImage('platform-meadow',862,395,590,275);
 drawImage('tile-rune',770,262,78,78);
 drawImage('tile-meadow',846,262,78,78);
 drawImage('checkpoint-lantern',1040,387,83,83);
 drawImage('drift-bug',940,398,76,76);
 drawImage('thorn-pod',1181,374,62,62);
 drawImage('growth-bud',1210,289,50,50);
 drawImage('breeze-orb',690,237,52,52);
 const seeds=[[467,339],[526,288],[588,256],[654,288],[720,339]];
 seeds.forEach((p,i)=>{const bob=motion.checked&&!paused?Math.sin(tm/600+i)*5:0;if(!(seedCount>8&&i===1))drawImage('light-seed',p[0],p[1]+bob,35,44);});
 let elapsed=t-jumpAt,dy=0,nowPose=pose;
 if(elapsed<680){const f=elapsed/680;dy=-Math.sin(f*Math.PI)*145;nowPose=f<.5?'sprout-jump':'sprout-fall';}
 else if(elapsed<850){nowPose='sprout-land';drawImage('fx-land',heroX-26,479,150,60,1-(elapsed-680)/170);}
 else if(pose==='sprout-run-a'&&motion.checked&&!paused)nowPose=Math.floor(t/140)%2?'sprout-run-b':'sprout-run-a';
 const idleBob=motion.checked&&!paused&&nowPose==='sprout-idle'?Math.sin(t/450)*1.6:0;
 const heroSize=portrait?115:100;
 ctx.save();ctx.fillStyle='#19553f38';ctx.beginPath();ctx.ellipse(heroX+heroSize*.5,525,31,7,0,0,Math.PI*2);ctx.fill();ctx.restore();
 drawImage(nowPose,heroX,529-heroSize+dy+idleBob,heroSize,heroSize);
 if(t-collectAt<550){let f=(t-collectAt)/550;drawImage('fx-collect',501-f*18,265-f*22,90+f*36,90+f*36,1-f);}
 if(motion.checked){drawImage('fx-wind',800+Math.sin(tm/2500)*14,176,100,38,.55);}
 ctx.restore();frame=requestAnimationFrame(render);
}
function jump(){if(view!=='play'||paused)return;jumpAt=performance.now();document.querySelector('#callout').innerHTML='가볍게, 더 높이!';showCallout();}
function collect(){if(view!=='play'||paused)return;collectAt=performance.now();seedCount=Math.min(14,seedCount+1);document.querySelector('#seed-count').textContent=String(seedCount).padStart(2,'0');document.querySelector('#score').textContent=(1250+(seedCount-8)*100).toLocaleString('en');document.querySelector('#callout').innerHTML='빛의 씨앗 <b>+100</b>';showCallout();}
let timer;function showCallout(){clearTimeout(timer);document.querySelector('#callout').classList.add('show');timer=setTimeout(()=>document.querySelector('#callout').classList.remove('show'),900);}
document.querySelector('#jump').onclick=jump;document.querySelector('#collect').onclick=collect;
document.querySelector('#left').onclick=()=>{heroX=Math.max(270,heroX-20);pose='sprout-run-a';};document.querySelector('#right').onclick=()=>{heroX=Math.min(420,heroX+20);pose='sprout-run-a';};
document.querySelector('#pause').onclick=()=>{paused=!paused;setView(paused?'pause':'play')};
document.querySelector('#reset').onclick=()=>{heroX=340;pose='sprout-idle';seedCount=8;document.querySelector('#seed-count').textContent='08';document.querySelector('#score').textContent='1,250';setView('play');};
function setView(v){view=v;const overlay=document.querySelector('#overlay');overlay.classList.toggle('hidden',v==='play');document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('selected',b.dataset.view===v));
 if(v==='play'){paused=false;return;}paused=true;
 if(v==='start')overlay.innerHTML='<div class="card start-card"><span class="eyebrow">WIND ISLAND ASCENT</span><h1>SKY SPROUT<br>RUNNER</h1><img class="hero" src="assets/raster/sprout-idle.png" alt="새싹"><p>바람을 타고, 빛의 씨앗을 찾아.<br>작은 새싹의 커다란 모험이 시작됩니다.</p><button class="primary" data-go="play">모험 시작하기 →</button><button class="secondary" data-go="play">조작 방법 · 화살표와 SPACE</button></div>';
 if(v==='result')overlay.innerHTML='<div class="card"><span class="eyebrow">WIND GATE REACHED</span><h1>바람의 문에 도착!</h1><img class="hero" src="assets/raster/sprout-land.png" alt="기뻐하는 새싹"><p>작은 씨앗들이 새로운 길을 밝혔어요.</p><div class="results"><div><strong>1,850</strong><small>획득 점수</small></div><div><strong>14 / 14</strong><small>빛의 씨앗</small></div><div><strong>01:24</strong><small>모험 시간</small></div></div><button class="primary" data-go="play">다음 섬으로 →</button><button class="secondary" data-go="play">다시 도전</button><button class="secondary" data-go="start">시작 화면</button></div>';
 if(v==='pause')overlay.innerHTML='<div class="card"><span class="eyebrow">TAKE A BREATH</span><h1>잠시, 쉬어가요.</h1><p>새싹이 다음 바람을 기다리고 있어요.</p><button class="primary" data-go="play">계속하기 →</button><button class="secondary" data-go="start">시작 화면</button></div>';
 overlay.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>setView(b.dataset.go));}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();jump();}if(e.code==='ArrowRight')document.querySelector('#right').click();if(e.code==='ArrowLeft')document.querySelector('#left').click();if(e.code==='Escape')setView(view==='pause'?'play':'pause');});
window.preview={setView,jump,collect,images,get loaded(){return loaded},get state(){return{view,paused,seedCount,heroX}}};requestAnimationFrame(render);
