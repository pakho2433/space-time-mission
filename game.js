// 太空時間任務 v4 —— P3「秒」課後鞏固遊戲：動手任務為主 + 玩家親自駕駛往下一站
import * as THREE from 'three';
const $=s=>document.querySelector(s);
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const pick=a=>a[Math.random()*a.length|0];
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const wait=ms=>new Promise(r=>setTimeout(r,ms));

// ---------------- sound (WebAudio, generated) ----------------
let AC=null,muted=false;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC;}
function tone(f,d=.12,type='sine',v=.18,when=0,slide=0){const a=ac();if(!a||muted)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(f*slide,t+d);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.05);}
const SFX={click:()=>tone(660,.06,'triangle',.12),snap:()=>tone(880,.05,'square',.06),
 ok:()=>{tone(784,.12,'triangle');tone(1047,.18,'triangle',.18,.1);tone(1319,.25,'triangle',.15,.2);},
 no:()=>{tone(330,.18,'sine',.16,0,.8);tone(262,.25,'sine',.14,.15,.8);},
 tick:()=>tone(1500,.03,'square',.05),fuel:()=>{[392,494,587,784].forEach((f,i)=>tone(f,.12,'sine',.13,i*.07));tone(1175,.25,'triangle',.08,.32);},
 gem:()=>{tone(1568,.08,'triangle',.12);tone(2093,.15,'triangle',.12,.06);},
 star:()=>{[1047,1319,1568,2093].forEach((f,i)=>tone(f,.15,'triangle',.13,i*.07));},
 call:()=>{tone(523,.15,'square',.12);tone(784,.3,'square',.12,.15);},go:()=>tone(220,.9,'sawtooth',.06,0,3),
 win:()=>{[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,.22,'triangle',.15,i*.13));}};

// ---------------- clock SVG (hands are <g> so they can be rotated live) ----------------
function clockSVG({sec=0,min=10,hr=2,showSec=true,showMin=true,showHr=true,arc=0,tap=false,cls='',lit=false}={}){
 let t='';for(let i=0;i<60;i++){const big=i%5==0;t+=`<line class="tk" data-i="${i}" x1="0" y1="${big?-96:-100}" x2="0" y2="-108" stroke="${big?'#3b4a6b':'#9aa7bd'}" stroke-width="${big?3.4:1.8}" transform="rotate(${i*6})"/>`;}
 let n='';for(let i=1;i<=12;i++){const a=i*Math.PI/6;n+=`<text x="${(Math.sin(a)*79).toFixed(1)}" y="${(-Math.cos(a)*79+7).toFixed(1)}" text-anchor="middle" font-size="21" font-weight="700" fill="#3b4a6b">${i}</text>`;}
 const H=(id,a,len,w,col,tail,show)=>show?`<g class="hand" data-hand="${id}" transform="rotate(${a})"><line x1="0" y1="${tail}" x2="0" y2="${-len}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>${tap?`<line x1="0" y1="0" x2="0" y2="${-len}" stroke="transparent" stroke-width="34"/>`:''}</g>`:'';
 return `<svg class="clock ${cls}" viewBox="-120 -120 240 240"><circle r="114" fill="#fffaf0" stroke="#ffb347" stroke-width="8"/>${t}<path class="arc" d="" fill="none" stroke="#ffb020" stroke-width="13" stroke-opacity=".6" stroke-linecap="round"/>${n}
 ${H('hr',hr*30+min*.5,50,10,'#3b4a6b',8,showHr)}${H('min',min*6,76,6.5,'#2f80ed',10,showMin)}${H('sec',sec*6,98,2.8,'#ff3b5c',20,showSec)}<circle r="7" fill="#ff3b5c"/><circle r="3" fill="#fff"/></svg>`;}
function setArc(svg,ticks){const p=svg.querySelector('.arc');const k=Math.max(0,Math.min(60,ticks));
 if(k<=0){p.setAttribute('d','');}else if(k>=60){p.setAttribute('d','M0,-90 A90,90 0 1 1 -0.01,-90');}else{const a=k*6*Math.PI/180;p.setAttribute('d',`M0,-90 A90,90 0 ${k>30?1:0} 1 ${(Math.sin(a)*90).toFixed(2)},${(-Math.cos(a)*90).toFixed(2)}`);}
 svg.querySelectorAll('.tk').forEach(l=>{const i=+l.dataset.i;l.setAttribute('stroke',(i>0&&i<=k)||(k>=60)?'#ff8a00':(i%5==0?'#3b4a6b':'#9aa7bd'));});}
const rot=(g,deg)=>g&&g.setAttribute('transform',`rotate(${deg})`);

// generic pointer drag (touch + mouse). onDrop(x,y,el) returns true to keep, false to snap back
function draggable(el,onDrop,onStart){let sx=0,sy=0,id=null;el.style.touchAction='none';
 el.addEventListener('pointerdown',e=>{if(el.classList.contains('placed'))return;id=e.pointerId;el.setPointerCapture(id);sx=e.clientX;sy=e.clientY;el.classList.add('dragging');onStart&&onStart(el);e.preventDefault();});
 el.addEventListener('pointermove',e=>{if(e.pointerId!==id)return;el.style.transform=`translate(${e.clientX-sx}px,${e.clientY-sy}px) scale(1.08)`;});
 const up=e=>{if(e.pointerId!==id)return;id=null;el.classList.remove('dragging');const keep=onDrop(e.clientX,e.clientY,el);if(!keep){el.style.transition='transform .25s';el.style.transform='';setTimeout(()=>el.style.transition='',260);}};
 el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);}
const inside=(el,x,y)=>{const r=el.getBoundingClientRect();return x>=r.left-10&&x<=r.right+10&&y>=r.top-10&&y<=r.bottom+10;};
// number picker 「約 N 秒」
function picker(init,max=60){return `<div class="pick"><button class="btn pm" data-d="-1">－</button><div class="pv">約 <b id="pv">${init}</b> 秒</div><button class="btn pm" data-d="1">＋</button></div>`;}
function bindPicker(root,get,set,max=60){root.querySelectorAll('.pm').forEach(b=>b.onclick=()=>{SFX.click();set(Math.max(0,Math.min(max,get()+ +b.dataset.d)));root.querySelector('#pv').textContent=get();});}

// ---------------- content pools ----------------
const SEC_ACTS=[['眨一下眼','👁️'],['拍手 10 下','👏'],['穿好外套','🧥'],['跑 50 米','🏃'],['綁鞋帶','👟'],['跳繩 20 下','🤸'],['打一個噴嚏','🤧'],['寫自己的名字','✏️']];
const MIN_ACTS=[['吃午餐','🍱'],['刷牙洗臉','🪥'],['上一節課','📚'],['由家步行上學','🚶'],['看一套卡通片','📺'],['做功課','📝'],['踢一場足球','⚽']];
const MC={hand:[['時鐘上哪一支針走得<b>最快</b>？',['秒針','分針','時針'],'<b>秒針走得最快</b>，它走 1 小格只需 1 秒。'],['時鐘上<b>最幼、最長</b>的針是甚麼針？',['秒針','時針','分針'],'最幼、最長、走得最快的是<b>秒針</b>。'],['<b>秒</b>和<b>分鐘</b>比較，哪個是較小的時間單位？',['秒','分鐘','一樣'],'<b>秒是比分鐘小的時間單位</b>，用來量度較短的時間。']],
 rel:[['秒針走<b>一圈</b>，是多少秒？',['60 秒','12 秒','100 秒'],'秒針走一圈是 <b>60 小格</b>，即 <b>60 秒</b>。'],['<b>1 分鐘</b> 和 <b>50 秒</b>，哪個時間較長？',['1 分鐘','50 秒','一樣長'],'1 分鐘 = 60 秒，比 50 秒長。'],['<b>2 分鐘</b> 等於多少秒？',['120 秒','20 秒','200 秒'],'1 分鐘 = 60 秒，2 分鐘 = <b>120 秒</b>。']],
 hon:[['小明實際跑了 <b>10 秒</b>，秒錶只記錄了 <b>8 秒</b>。這個成績可信嗎？',['不可信，秒錶提早按停了','可信，秒錶顯示 8 秒','可信，因為小美是好朋友'],'小美在小明<b>未到終點就按停</b>，記錄不真實，所以<b>不可信</b>，對其他同學也不公平。'],['如果你是計時員，你應該怎樣做？',['到終點才按停，誠實記錄','幫好朋友少計幾秒','隨便寫一個時間'],'計時員要<b>誠實</b>：完成動作才按停，如實記錄。'],['計時員忘記按停秒錶，最好怎樣做？',['誠實說出來，請同學再跑一次','隨便寫一個時間','寫一個最快的時間'],'出錯不要緊，要<b>誠實說出來</b>，重新量度才公平。']],
 bd:[['<b>北斗衛星導航系統</b>是由哪個國家自主建設的？',['中國','美國','日本'],'北斗衛星導航系統由<b>中國自主建設、獨立運行</b>。'],['為甚麼國家要自己建設北斗系統？',['科技安全是國家安全的重要部分','因為衛星很好看','因為想放煙花'],'<b>科技安全是國家安全的重要領域</b>，自己建設就不用依賴別人。'],['以下哪一項<b>是</b>北斗衛星提供的服務？',['定位、導航和授時','煮飯','打機'],'北斗提供<b>定位、導航和授時（準確時間）</b>服務。']]};
const mcTask=(skill,pool)=>{const [p,o,e]=pick(MC[pool]);return {kind:'mc',skill,title:'快問快答',prompt:p,opts:o,explain:e};};

const STATIONS=[{name:'秒針星',emoji:'🪐',task:'認識秒針',key:'venus'},{name:'讀秒星',emoji:'🔴',task:'看鐘讀秒',key:'mars'},{name:'秒錶站',emoji:'⏱️',task:'秒錶計時',key:'jupiter'},
 {name:'誠信星',emoji:'🤝',task:'誠實計時',key:'saturn'},{name:'計時星',emoji:'🔵',task:'計算用了多少秒',key:'neptune'},{name:'北斗站',emoji:'🛰️',task:'北斗衛星與時間',key:'beidou'}];
function stationTasks(i){
 // difficulty rises through the journey (1 easiest → 5 hardest)
 if(i===0)return [{kind:'find',skill:'hand',title:'時鐘內找秒針',lv:1},{kind:'fix',skill:'hand',title:'修理太空鐘',lv:1},{kind:'rock',skill:'unit',title:'隕石分類',lv:2}];
 if(i===1){const a=ri(2,11)*5,b=pick([3,7,13,18,22,28,33,41,47,52,56]);return [{kind:'track',skill:'read',title:'秒針追蹤',lv:2},{kind:'drag',skill:'read',title:'撥秒針',target:a,lv:2},{kind:'match',skill:'relation',title:'記憶翻牌',lv:2},{kind:'drag',skill:'read',title:'撥秒針（挑戰）',target:b,lv:3},{kind:'spin',skill:'relation',title:'一分鐘燃料',lv:3}];}
 if(i===2)return [{kind:'watch',skill:'watch',title:'引擎點火',mode:'look',target:ri(5,8),lv:3},{kind:'suit',skill:'watch',title:'太空人穿太空衣',lv:3},{kind:'beat',skill:'estimate',title:'拍拍節拍',lv:3},{kind:'record',skill:'watch',title:'記錄成績',lv:4}];
 if(i===3)return [{kind:'race',skill:'honest',title:'誠實計時員',lv:4},{kind:'board',skill:'honest',title:'記分牌',lv:4},{kind:'judge',skill:'honest',title:'公平裁判',lv:4}];
 if(i===4)return [{kind:'lcd',skill:'calc',title:'秒錶讀數',lv:4},{kind:'replay',skill:'calc',title:'秒針重播',lv:4},{kind:'endpos',skill:'calc',title:'找結束時間',lv:5},{kind:'podium',skill:'calc',title:'頒獎台',lv:5}];
 return [{kind:'orbit',skill:'beidou',title:'北斗衛星上軌道',lv:3},{kind:'navi',skill:'beidou',title:'北斗導航',lv:4},{kind:'sync',skill:'beidou',title:'北斗授時',lv:5}];}
const SKILL={hand:'① 辨認秒針',unit:'① 選擇時間單位',read:'② 看鐘讀秒',relation:'② 秒和分鐘的關係',watch:'③ 秒錶計時',estimate:'③ 估計與實測',honest:'④ 誠實計時',calc:'⑤ 計算用了多少秒',beidou:'⑥ 北斗衛星（國安）'};
const TIP={hand:'秒針是最幼、最長、走得最快的紅色針。',read:'由 12 開始數小格，1 小格就是 1 秒；每個數字之間有 5 小格。',relation:'60 秒 = 1 分鐘，秒針走一圈就是 60 秒。',
 unit:'很短的事情（眨眼、拍手）用「秒」；較長的事情（吃飯、上課）用「分鐘」。',watch:'聽到「開始」才按開始，完成動作才按停止，記錄「約＿秒」。',estimate:'估計的時間和實際量度可能不同，要用秒錶量度才準確。',calc:'由開始到結束，數秒針走了多少小格；秒錶就用結束減開始。用的秒數越少越快。',honest:'計時要誠實，提早按停會令成績不可信，對別人不公平。',beidou:'北斗由中國自主建設，提供定位、導航和授時（準確時間）。'};

// =====================================================================
export function initGame(api){
const {ship,targets,S}=api;
// ---- Beidou satellites around Earth
const rad=o=>o.geometry.parameters.radius;const bdPiv=new THREE.Object3D();targets.earthPiv.add(bdPiv);bdPiv.position.copy(targets.earth.position);
const gold=new THREE.MeshStandardMaterial({color:0xd8a640,metalness:1,roughness:.3}),pan=new THREE.MeshStandardMaterial({color:0x1a3a8a,metalness:.5,roughness:.3,emissive:0x0a1a40});
const sats=[];for(let i=0;i<3;i++){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.BoxGeometry(3,3,4),gold));for(const sx of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(8,.2,3),pan);p.position.x=sx*6;g.add(p);}
 const a=i/3*Math.PI*2;{const R0=rad(targets.earth)*1.8;g.position.set(Math.cos(a)*R0,(i-1)*18,Math.sin(a)*R0);};g.lookAt(0,0,0);g.scale.setScalar(1.4);bdPiv.add(g);sats.push(g);}
const tgtObj={neptune:targets.neptune,earth:targets.earth,venus:targets.venus,mars:targets.mars,jupiter:targets.jupiter,saturn:targets.saturn,beidou:sats[0]};
const tgtR={neptune:rad(targets.neptune),earth:rad(targets.earth),venus:rad(targets.venus),mars:rad(targets.mars),jupiter:rad(targets.jupiter),saturn:rad(targets.saturn),beidou:7};
const up=new THREE.Vector3(0,1,0),m4=new THREE.Matrix4(),qT=new THREE.Quaternion(),BP=new THREE.Vector3(),tP=new THREE.Vector3(),tL=new THREE.Vector3(),v1=new THREE.Vector3();
function standoff(key,outP,outL){const o=tgtObj[key],r=tgtR[key];o.getWorldPosition(BP);const toSun=v1.copy(BP).multiplyScalar(-1).normalize().applyAxisAngle(up,.7);
 const portrait=innerWidth<innerHeight*.9,pf=portrait?1.7:1;outP.copy(BP).addScaledVector(toSun,(key==='beidou'?30:r*2.7)*pf).addScaledVector(up,key==='beidou'?6:r*.5);
 const f=BP.clone().sub(outP).normalize(),right=f.clone().cross(up).normalize();
 // put the body on the left (landscape) or top (portrait) so the mission panel never hides it
 outL.copy(BP).addScaledVector(right,portrait?0:r*(key==='beidou'?1.9:1.25)).addScaledVector(up,-r*(portrait?(key==='beidou'?1.8:1.15):.3));}
const lookQ=(p,l,out)=>{m4.lookAt(p,l,up);return out.setFromRotationMatrix(m4);};

// ---- target ring, guide line, time crystals
const ringMat=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,1.8,2.6),transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
const ring=new THREE.Group();const RR=38;ring.add(new THREE.Mesh(new THREE.TorusGeometry(RR,2.2,10,64),ringMat));
const ring2=new THREE.Mesh(new THREE.TorusGeometry(RR*1.25,.8,6,64),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,1.4,.4),transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));ring.add(ring2);
const disc=new THREE.Mesh(new THREE.CircleGeometry(RR,48),new THREE.MeshBasicMaterial({color:0x66ccff,transparent:true,opacity:.08,depthWrite:false,side:THREE.DoubleSide}));ring.add(disc);
ring.visible=false;S.add(ring);
const lineG=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(6),3));
const guide=new THREE.Line(lineG,new THREE.LineDashedMaterial({color:0x8fdcff,dashSize:14,gapSize:10,transparent:true,opacity:.7}));guide.frustumCulled=false;guide.visible=false;S.add(guide);
const gemGeo=new THREE.OctahedronGeometry(5),gemMat=new THREE.MeshBasicMaterial({color:new THREE.Color(.6,2.2,2.6)});const gems=[];

// ---- state
let G=null,speed=0;const mode={m:'idle'};
const fly={on:false,t:0,dur:2,p0:new THREE.Vector3(),q0:new THREE.Quaternion(),key:null,docked:null,last:new THREE.Vector3()};
const nav={key:null,t:0,start:new THREE.Vector3(),dist0:1,lastUi:0};
function glideTo(key,dur){fly.on=true;fly.t=0;fly.key=key;fly.docked=null;fly.dur=dur;fly.p0.copy(ship.position);fly.q0.copy(ship.quaternion);}
const arrow=$('#navarrow'),mark=$('#navmark'),flyhint=$('#flyhint'),autoBtn=$('#autonav');
function update(dt){
 if(mode.m!=='fly'&&fireBtn.style.display!=='none'){fireBtn.style.display='none';firing=false;}
 gems.forEach(g=>{g.rotation.y+=dt*2;g.rotation.x+=dt;});
 if(fly.on){fly.t+=dt;const u=Math.min(1,fly.t/fly.dur),e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;standoff(fly.key,tP,tL);
  const mid=fly.p0.clone().lerp(tP,.5).addScaledVector(up,fly.p0.distanceTo(tP)*.1);
  const p=fly.p0.clone().multiplyScalar((1-e)*(1-e)).addScaledVector(mid,2*(1-e)*e).addScaledVector(tP,e*e);
  fly.last.copy(ship.position);ship.position.copy(p);speed=fly.last.distanceTo(p)/Math.max(dt,1e-3);
  lookQ(ship.position,u<.8?tP.clone().lerp(tL,u/.8):tL,qT);ship.quaternion.copy(fly.q0).slerp(qT,Math.min(1,u*1.5));
  if(u>=1){fly.on=false;fly.docked=fly.key;speed=0;fly.key==='earth'?homeArrive():arrive();}return true;}
 if(fly.docked){standoff(fly.docked,tP,tL);ship.position.copy(tP);lookQ(tP,tL,qT);ship.quaternion.slerp(qT,Math.min(1,dt*4));speed=0;return true;}
 if(mode.m==='rescue'){rescueUpdate(dt);return true;}
 if(AL.on||(alObj&&alObj.g.visible))alienUpdate(dt);if(mode.m==='alien')return true;
 if(mode.m==='fly')navUpdate(dt);else if(mode.m==='explore')exploreUpdate(dt);
 return false;}
// manual flight: ring at next station, arrow, distance, assist
function startFlight(){const s=STATIONS[G.si];mode.m='fly';nav.warned=false;nav.key=s.key;nav.name=s.name;nav.t=0;nav.start.copy(ship.position);standoff(s.key,tP,tL);nav.dist0=ship.position.distanceTo(tP);
 api.setSpeedMul(Math.max(1,Math.min(12,nav.dist0/1600)));ring.visible=guide.visible=true;
 spawnRocks(nav.start,tP);if(G&&!G.rockHint){G.rockHint=true;setTimeout(()=>toast('🪨 小心石頭！撞到會扣燃料'),1200);}gems.forEach(g=>S.remove(g));gems.length=0;for(let i=1;i<=5;i++){const g=new THREE.Mesh(gemGeo,gemMat);g.position.copy(nav.start).lerp(tP,i/6.5).add(new THREE.Vector3((Math.random()-.5)*40,(Math.random()-.5)*30,(Math.random()-.5)*40));S.add(g);gems.push(g);}
 hidePanel();flyhint.style.display='block';api.setFree(true,true);SFX.go();autoBtn.style.display='none';
 flyhint.innerHTML=`🚀 飛往 <b>第 ${G.si+1} 站 ${s.emoji} ${s.name}</b>：跟着<span class="y">黃色箭咀</span>，飛進<span class="c">光圈</span>！<span class="ctl">${api.touch?'左邊搖桿：前進／轉彎・右下「加速」':'W／↑ 前進・A D／← → 轉彎・Shift 加速'}</span>`;}
const proj=new THREE.Vector3();
function navUpdate(dt){nav.t+=dt;rocksUpdate(dt);combatUpdate(dt);if(G&&(G.si===1||G.si===5)&&!G['wave'+G.si]&&nav.t>4&&!dbgNoRescue)startWave();if(G&&G.si===2&&!G.rescued&&nav.t>5&&!dbgNoRescue){startRescue();return;}if(G&&G.si===4&&!G.alienMet&&nav.t>5&&!dbgNoRescue){startAlien();return;}
 if(G){const moving=api.vel.length()>2;G.fuel-=dt*(moving?1.6:.4);if(G.fuel<22){G.fuel=Math.min(30,G.fuel+dt*(moving?6:4));if(!nav.warned){nav.warned=true;toast('⛽ 燃料有點少，自動補給中！繼續飛向光圈吧 😊');}}drawFuel();}standoff(nav.key,tP,tL);ring.position.copy(tP);ring.lookAt(ship.position);const pul=1+Math.sin(nav.t*4)*.05;ring.scale.setScalar(pul);ring2.rotation.z+=dt;
 const pa=lineG.attributes.position.array;v1.set(0,-6,-20).applyQuaternion(ship.quaternion).add(ship.position);pa[0]=v1.x;pa[1]=v1.y;pa[2]=v1.z;pa[3]=tP.x;pa[4]=tP.y;pa[5]=tP.z;lineG.attributes.position.needsUpdate=true;guide.computeLineDistances();
 // gentle steering assist toward the ring
 lookQ(ship.position,tP,qT);ship.quaternion.slerp(qT,1-Math.exp(-.45*dt));
 const d=ship.position.distanceTo(tP);
 for(let i=gems.length-1;i>=0;i--)if(gems[i].position.distanceTo(ship.position)<30){S.remove(gems[i]);gems.splice(i,1);if(G){G.gems++;G.fuel=Math.min(100,G.fuel+5);toast('💎 +1　⛽ +5');}SFX.gem();renderHud();}
 if(d<RR*1.3){mode.m='dock';ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';api.setFree(false);api.setSpeedMul(1);gems.forEach(g=>S.remove(g));gems.length=0;clearRocks();SFX.star();glideTo(nav.key,1.6);return;}
 if(nav.t>45&&autoBtn.style.display==='none')autoBtn.style.display='block';
 // screen marker / edge arrow
 proj.copy(tP).project(api.cam);const behind=v1.copy(tP).applyMatrix4(api.cam.matrixWorldInverse).z>0;const W=innerWidth,H=innerHeight;
 let x=(proj.x*.5+.5)*W,y=(-proj.y*.5+.5)*H;const on=!behind&&x>40&&x<W-40&&y>70&&y<H-40;
 if(on){mark.style.display='block';arrow.style.display='none';mark.style.left=x+'px';mark.style.top=y+'px';mark.querySelector('span').textContent=`${nav.name} ${Math.round(d)}`;}
 else{mark.style.display='none';arrow.style.display='block';let dx=x-W/2,dy=y-H/2;if(behind){dx=-dx;dy=-dy;if(Math.abs(dx)<1&&Math.abs(dy)<1)dy=1;}
  const ang=Math.atan2(dy,dx),k=Math.min((W/2-60)/Math.abs(Math.cos(ang)||1e-3),(H/2-80)/Math.abs(Math.sin(ang)||1e-3));
  arrow.style.left=(W/2+Math.cos(ang)*k)+'px';arrow.style.top=(H/2+Math.sin(ang)*k)+'px';arrow.querySelector('i').style.transform=`rotate(${ang}rad)`;arrow.querySelector('span').textContent=Math.round(d);}
 if(nav.t-nav.lastUi>.4){nav.lastUi=nav.t;api.setMission(`往 ${nav.name} 還有 ${Math.round(d)}　⛽${G?Math.round(G.fuel):100}%`);}}
autoBtn.onclick=()=>{SFX.click();if(mode.m!=='fly')return;mode.m='dock';ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';autoBtn.style.display='none';api.setFree(false);api.setSpeedMul(1);gems.forEach(g=>S.remove(g));gems.length=0;clearRocks();
 glideTo(nav.key,Math.min(7,Math.max(3,ship.position.distanceTo(tP)/900)));};

// ---------------- UI shell ----------------
const panel=$('#panel'),hud=$('#ghud');
function showPanel(html,cls=''){panel.className='show '+cls;panel.innerHTML=html;panel.scrollTop=0;}
function hidePanel(){panel.className='';panel.innerHTML='';}
function renderHud(){drawFuel();if(!G){hud.style.display='none';return;}hud.style.display='flex';$('#gstars').innerHTML=`⭐ ${G.stars}<small> 💎 ${G.gems}</small>`;
 $('#gsteps').innerHTML=STATIONS.map((s,i)=>`<span class="dot ${i<G.si?'done':i===G.si?'now':''}">${i<G.si?'✓':s.emoji}<em>${s.name}</em></span>`).join('<b class="ln"></b>');}
// ---- fuel
const fuelEl=document.createElement('div');fuelEl.id='fuel';fuelEl.innerHTML='<div class="fi">⛽</div><div class="ft"><i></i><b></b></div><div class="fp">0%</div>';document.body.appendChild(fuelEl);
const fBar=fuelEl.querySelector('i'),fPct=fuelEl.querySelector('.fp');let fShown=-1;
function drawFuel(){if(!G){fuelEl.style.display='none';return;}fuelEl.style.display='flex';const v=Math.round(G.fuel);if(v===fShown)return;fShown=v;fBar.style.height=v+'%';fPct.textContent=v+'%';
 fuelEl.classList.toggle('low',v<25);fuelEl.classList.toggle('full',v>=100);}
function addFuel(n,fromEl){if(!G)return;G.fuel=Math.min(100,G.fuel+n);SFX.fuel();
 const f=document.createElement('div');f.className='fdrop';f.textContent=`+${Math.round(n)} ⛽`;const r=(fromEl||$('#panel')).getBoundingClientRect(),g=fuelEl.getBoundingClientRect();
 f.style.left=r.left+r.width/2+'px';f.style.top=r.top+20+'px';document.body.appendChild(f);requestAnimationFrame(()=>requestAnimationFrame(()=>{f.style.transform=`translate(${g.left+g.width/2-(r.left+r.width/2)}px,${g.top+g.height/2-(r.top+20)}px) scale(.6)`;f.style.opacity='.2';}));
 setTimeout(()=>{f.remove();drawFuel();fuelEl.classList.remove('glug');void fuelEl.offsetWidth;fuelEl.classList.add('glug');},750);}
function newGame(nm){G={fuel:100,name:nm,si:0,stars:0,max:0,gems:0,stat:{},ti:0,tasks:[],self:{},rec:{}};}
function start(){ac();SFX.click();newGame(($('#gname')?.value||'').trim().slice(0,12));$('#start').style.display='none';renderHud();briefing();}
function briefing(){const s=STATIONS[G.si];api.setMission(`飛往 ${s.name}`);
 showPanel(`<div class="intro"><div class="badge">第 ${G.si+1} 站</div><h2>${s.emoji} ${s.name}</h2><p>任務：<b>${s.task}</b></p><p class="sub">${G.si===0?'你是太空小隊長！親自駕駛飛船，飛進光圈就到站。':'下一站在等你！'}</p><button class="btn go" id="b_go">出發 🚀</button></div>`,'small');
 $('#b_go').onclick=()=>{SFX.click();startFlight();};}
function arrive(){mode.m='mission';const s=STATIONS[G.si];G.tasks=stationTasks(G.si);G.ti=0;api.setMission(`第${G.si+1}站 ${s.name}`);G.f0=G.fuel;
 showPanel(`<div class="intro"><div class="badge">到站了！</div><h2>${s.emoji} 歡迎來到${s.name}</h2><p>今次有 <b>${G.tasks.length}</b> 個任務，完成就有 ⭐！</p><button class="btn go" id="b_go">開始任務 ▶</button></div>`,'small');
 $('#b_go').onclick=()=>{SFX.click();runTask();};}
const TITLE={mc:'快問快答',fix:'修理太空鐘',find:'時鐘內找秒針',rock:'隕石分類',drag:'撥秒針',track:'秒針追蹤',spin:'一分鐘燃料',match:'記憶翻牌',watch:'引擎點火',suit:'太空人穿太空衣',record:'記錄成績',beat:'拍拍節拍',replay:'秒針重播',lcd:'秒錶讀數',endpos:'找結束時間',podium:'頒獎台',race:'誠實計時員',board:'記分牌',judge:'公平裁判',orbit:'北斗衛星上軌道',sync:'北斗授時',navi:'北斗導航'};
function head(t){const s=STATIONS[G.si];return `<div class="qhead"><span>${s.emoji} ${/^[\x00-\x7f]*$/.test(t.title||'')?(TITLE[t.kind]||'太空任務'):t.title}</span><span>${t.lv?'<i class="lvst">'+'★'.repeat(t.lv)+'</i> ':''}${G.ti+1} / ${G.tasks.length}</span></div>`;}
// task harness: render(t, done) ; done(firstTryOk) ; mistakes tracked with t.miss
function runTask(){if(G.ti>=G.tasks.length)return stationDone();const t=G.tasks[G.ti];t.miss=0;t.finished=false;(R[t.kind])(t);}
function miss(t,msg){t.miss++;SFX.no();fb(`<div class="fb bad"><b>再試一次 🤔</b><p>${msg}</p></div>`);}
function fb(h){const f=$('#fb');if(f){f.innerHTML=h;if(h)requestAnimationFrame(()=>{try{f.scrollIntoView({block:'nearest',behavior:'smooth'});}catch(_){}});}}
function finish(t,msg,ok=true){if(t.finished)return;t.finished=true;const st=G.stat[t.skill]||(G.stat[t.skill]=[0,0]);st[1]++;G.max++;const star=ok&&t.miss===0;if(star){st[0]++;G.stars++;}
 SFX[star?'ok':'click']();renderHud();setTimeout(()=>burst($('#fb'),star?['⭐','✨','🎉','💫']:['👍','✨']),30);const per=(100-(G.f0??G.fuel))/G.tasks.length,lastT=G.ti>=G.tasks.length-1,gain=Math.round(lastT?Math.max(4,100-G.fuel):Math.max(4,per*(star?1.15:.8)));setTimeout(()=>addFuel(gain,$('#fb')),250);
 fb(`<div class="fb good"><b>${star?'完成！⭐ +1':'完成了！👍'}</b><span class="fadd">⛽ +${gain}</span><p>${msg}</p><button class="btn go" id="b_n">下一個任務 ▶</button></div>`);
 $('#b_n').onclick=()=>{SFX.click();G.ti++;runTask();};$('#fb').scrollIntoView({block:'nearest'});}
function stationDone(){G.fuel=100;drawFuel();G.si++;renderHud();SFX.win();const last=G.si>=STATIONS.length;
 showPanel(`<div class="intro"><div class="big">🎉</div><h2>本站任務完成！</h2><p>⭐ <b>${G.stars}</b>　💎 <b>${G.gems}</b></p>${last?'<button class="btn go" id="b_go">看看我的成績 🏆</button>':`<div class="launch"><div class="tankbig"><i></i><span>⛽ 100%</span></div><p>下一站：${STATIONS[G.si].emoji} <b>${STATIONS[G.si].name}</b><br><span class="sub">這次由你親自駕駛！</span></p></div><button class="btn go launchbtn" id="b_go">⛽ 燃料已滿！出發 🚀</button>`}</div>`,'small');
 $('#b_go').onclick=()=>{SFX.click();if(last)return result();fly.docked=null;startFlight();};}

// ---------------- task renderers ----------------
const R={};
R.mc=t=>{const opts=shuffle(t.opts.map((x,i)=>({x,ok:i===0})));showPanel(`${head(t)}<p class="prompt">${t.prompt}</p><div class="opts">${opts.map((o,i)=>`<button class="btn opt" data-i="${i}">${o.x}</button>`).join('')}</div><div id="fb"></div>`);
 panel.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(t.finished)return;const o=opts[+b.dataset.i];if(o.ok){b.classList.add('right');finish(t,t.explain);}else{b.classList.add('wrong');b.disabled=true;miss(t,t.miss>=1?t.explain:'想一想，再選一次！');}});};
// 修理太空鐘: drag 3 hands into named slots
R.fix=t=>{const H=[['sec','<line x1="10" y1="60" x2="10" y2="2" stroke="#ff3b5c" stroke-width="2.5" stroke-linecap="round"/>','最幼、最長'],['min','<line x1="10" y1="60" x2="10" y2="14" stroke="#2f80ed" stroke-width="6" stroke-linecap="round"/>','較長、較粗'],['hr','<line x1="10" y1="60" x2="10" y2="28" stroke="#3b4a6b" stroke-width="10" stroke-linecap="round"/>','最短、最粗']];
 const slots=shuffle([['sec','秒針','走得最快'],['min','分針',''],['hr','時針','走得最慢']]);
 showPanel(`${head(t)}<p class="prompt">太空鐘壞了！把三支針<b>拖到</b>正確的名稱上。</p><div class="slots">${slots.map(s=>`<div class="slot" data-k="${s[0]}"><b>${s[1]}</b><small>${s[2]}</small></div>`).join('')}</div>
 <div class="tray">${shuffle(H).map(h=>`<div class="piece" data-k="${h[0]}"><svg viewBox="0 0 20 64">${h[1]}</svg></div>`).join('')}</div><div id="fb"></div>`);let n=0;
 panel.querySelectorAll('.piece').forEach(p=>draggable(p,(x,y)=>{const sl=[...panel.querySelectorAll('.slot')].find(s=>inside(s,x,y));if(!sl)return false;
  if(sl.dataset.k!==p.dataset.k){miss(t,sl.dataset.k==='sec'?'秒針是<b>最幼、最長</b>的針。':sl.dataset.k==='hr'?'時針是<b>最短、最粗</b>的針。':'分針比秒針粗，比時針長。');return false;}
  SFX.snap();p.classList.add('placed');p.style.transform='';sl.appendChild(p);sl.classList.add('ok');if(++n===3)finish(t,'太空鐘修好了！<b>秒針是最幼、最長、走得最快的針</b>。');return true;}));};
// 捉住最快的針: running clock, tap the fastest hand
R.catch=t=>{showPanel(`${head(t)}<p class="prompt">時鐘在快速轉動！<b>按住走得最快的針</b>。</p><div class="cbox">${clockSVG({tap:true,sec:0,min:ri(0,59),hr:ri(1,12)})}</div><div id="fb"></div>`);
 const svg=panel.querySelector('.clock');let a0=performance.now(),run=true;const m0=ri(0,59)*6,h0=ri(0,11)*30;const sh=svg.querySelector('[data-hand=sec]'),mh=svg.querySelector('[data-hand=min]'),hh=svg.querySelector('[data-hand=hr]');
 const loop=()=>{if(!run||!svg.isConnected)return;const e=(performance.now()-a0)/1000;rot(sh,e*60);rot(mh,m0+e*5);rot(hh,h0+e*.4);requestAnimationFrame(loop);};loop();
 svg.querySelectorAll('.hand').forEach(h=>h.addEventListener('pointerdown',()=>{if(t.finished)return;if(h.dataset.hand==='sec'){run=false;finish(t,'捉到了！<b>秒針走得最快</b>，它是最幼、最長的紅色針。');}else miss(t,h.dataset.hand==='min'?'這是分針，它走得比較慢。看看哪一支針轉得最快？':'這是時針，它幾乎不動！看看哪一支針轉得最快？');}));};
// 分類卡: drag cards to 秒 / 分鐘 buckets (tap card then bucket also works)
R.sort=t=>{const cards=shuffle([...shuffle(SEC_ACTS).slice(0,3).map(a=>[...a,'s']),...shuffle(MIN_ACTS).slice(0,2).map(a=>[...a,'m'])]);
 showPanel(`${head(t)}<p class="prompt">這些事情大約需要多久？把卡<b>拖進</b>「秒」或「分鐘」。</p><div class="buckets"><div class="bucket" data-k="s"><b>秒</b><small>很短的時間</small></div><div class="bucket" data-k="m"><b>分鐘</b><small>較長的時間</small></div></div>
 <div class="tray cards">${cards.map(c=>`<div class="card" data-k="${c[2]}">${c[1]} ${c[0]}</div>`).join('')}</div><div id="fb"></div>`);let n=0,sel=null;
 const place=(c,b)=>{if(b.dataset.k!==c.dataset.k){miss(t,c.dataset.k==='s'?`「${c.textContent.slice(2).trim()}」只需要很短時間，用<b>秒</b>。`:`「${c.textContent.slice(2).trim()}」需要較長時間，用<b>分鐘</b>。`);return false;}
  SFX.snap();c.classList.add('placed');c.style.transform='';b.appendChild(c);if(++n===cards.length)finish(t,'分得好！很短的時間用 <b>秒</b>，較長的時間用 <b>分鐘</b>。');return true;};
 panel.querySelectorAll('.card').forEach(c=>{draggable(c,(x,y)=>{const b=[...panel.querySelectorAll('.bucket')].find(b=>inside(b,x,y));return b?place(c,b):false;},()=>{});c.addEventListener('click',()=>{if(c.classList.contains('placed'))return;panel.querySelectorAll('.card').forEach(z=>z.classList.remove('sel'));sel=c;c.classList.add('sel');});});
 panel.querySelectorAll('.bucket').forEach(b=>b.addEventListener('click',()=>{if(sel&&!sel.classList.contains('placed')){place(sel,b);sel.classList.remove('sel');sel=null;}}));};
// helper: make a clock's seconds hand draggable with tick snapping; cb(tick, cumulative)
function dragHand(svg,cb,st=0){const sh=svg.querySelector('[data-hand=sec]');let cur=st,cum=0,act=false;svg.style.touchAction='none';
 const ang=e=>{const r=svg.getBoundingClientRect();const a=Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2)));return ((a*180/Math.PI)+360)%360;};
 const mv=e=>{const k=Math.round(ang(e)/6)%60;if(k===cur)return;let d=k-cur;if(d>30)d-=60;if(d<-30)d+=60;cum=Math.max(0,cum+d);cur=k;rot(sh,k*6);SFX.tick();cb(k,cum);};
 svg.addEventListener('pointerdown',e=>{act=true;svg.setPointerCapture(e.pointerId);mv(e);e.preventDefault();});svg.addEventListener('pointermove',e=>{if(act)mv(e);});
 const end=()=>{act=false;};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);return {get:()=>cur};}
// 撥秒針到目標
R.drag=t=>{showPanel(`${head(t)}<p class="prompt">把<b>秒針</b>撥到 <b>${t.target} 秒</b>！<br><span class="sub">用手指拖動紅色秒針</span></p><div class="cbox">${clockSVG({sec:0,showMin:false,showHr:false,cls:'big'})}</div>
 <div class="readout">秒針走了 <b id="ro">0</b> 小格 = <b id="ro2">0</b> 秒</div><button class="btn go" id="b_ok">確定 ✔</button><div id="fb"></div>`);
 const svg=panel.querySelector('.clock');const h=dragHand(svg,k=>{setArc(svg,k);$('#ro').textContent=k;$('#ro2').textContent=k;});
 $('#b_ok').onclick=()=>{if(t.finished)return;const k=h.get();if(k===t.target)finish(t,`對了！由 12 走 ${t.target} 小格，就是 <b>${t.target} 秒</b>。秒針走 1 小格是 1 秒。`);
  else miss(t,`現在是 ${k} 秒。${k<t.target?'再多走一點':'走多了，退後一點'}。${t.target%5===0?`提示：每個數字之間有 5 小格，數字 ${t.target/5} 就是 ${t.target} 秒。`:'提示：一小格一小格地數。'}`);};};
// 燃料裝載: drag a full lap, then pick the equal unit
R.fuel=t=>{showPanel(`${head(t)}<p class="prompt">把秒針<b>拖動一整圈</b>，為飛船裝滿燃料！</p><div class="fuelrow"><div class="cbox">${clockSVG({sec:0,showMin:false,showHr:false,cls:'big'})}</div><div class="tank"><i id="fuel"></i><span id="fuelt">0 秒</span></div></div><div id="q2"></div><div id="fb"></div>`);
 const svg=panel.querySelector('.clock');let done=false;dragHand(svg,(k,cum)=>{if(done)return;const c=Math.min(60,cum);setArc(svg,c);$('#fuel').style.height=(c/60*100)+'%';$('#fuelt').textContent=c+' 秒';
  if(c>=60){done=true;SFX.star();$('#q2').innerHTML=`<p class="prompt">燃料滿了！秒針走一圈 = 60 秒 = ？</p><div class="opts row3">${shuffle(['1 分鐘','10 分鐘','6 秒']).map(o=>`<button class="btn opt">${o}</button>`).join('')}</div>`;
   $('#q2').querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(t.finished)return;if(b.textContent==='1 分鐘'){b.classList.add('right');finish(t,'秒針走一圈是 60 小格，<b>60 秒 = 1 分鐘</b>！');}else{b.classList.add('wrong');b.disabled=true;miss(t,'秒針走一圈，分針就走 1 小格，即 1 分鐘。');}});}});};
// 配對: tap left then right
R.match=t=>{const P=shuffle([['60 秒','1 分鐘'],['120 秒','2 分鐘'],['秒針走 5 小格','5 秒'],['秒針走 1 小格','1 秒'],['秒針走一圈','60 秒']]).slice(0,3);
 const L=shuffle(P.map((p,i)=>[p[0],i])),Rt=shuffle(P.map((p,i)=>[p[1],i]));let sel=null,n=0;
 showPanel(`${head(t)}<p class="prompt">把<b>一樣長</b>的時間配成一對！先按左邊，再按右邊。</p><div class="match"><div>${L.map(l=>`<button class="btn mt" data-s="L" data-i="${l[1]}">${l[0]}</button>`).join('')}</div><div>${Rt.map(r=>`<button class="btn mt" data-s="R" data-i="${r[1]}">${r[0]}</button>`).join('')}</div></div><div id="fb"></div>`);
 panel.querySelectorAll('.mt').forEach(b=>b.onclick=()=>{if(b.classList.contains('right'))return;SFX.click();if(b.dataset.s==='L'){panel.querySelectorAll('.mt[data-s=L]').forEach(x=>x.classList.remove('sel'));sel=b;b.classList.add('sel');return;}
  if(!sel){fb('<p class="sub">先按左邊一張卡。</p>');return;}if(sel.dataset.i===b.dataset.i){sel.classList.remove('sel');sel.classList.add('right');b.classList.add('right');SFX.snap();sel=null;if(++n===3)finish(t,'全對！記住：<b>60 秒 = 1 分鐘</b>，秒針走 1 小格是 1 秒。');}
  else{b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),450);miss(t,'這兩個不一樣長。提示：1 分鐘 = 60 秒。');}});};
// stopwatch (engine ignition / blind estimate)
R.watch=t=>{t.att=t.att||0;const blind=t.mode==='blind';
 showPanel(`${head(t)}<p class="prompt">${blind?`🙈 看不到秒錶！按「開始」，心裏數到 <b>${t.target} 秒</b>就按「停止」。`:`🚀 引擎點火！按「開始」，看着秒針，到 <b>${t.target} 秒</b>就按「停止」。`}</p>
 <div class="sw"><div class="swdial ${blind?'blind':''}">${clockSVG({sec:0,showMin:false,showHr:false})}<div class="cover">🙈<br>心裏數</div></div><div class="swnum ${blind?'blind':''}" id="swn">0.0 秒</div>${blind?'':'<div class="lpad" id="lpad"><span class="rkt">🚀</span><span class="flm">🔥</span><span class="smk">💨</span></div>'}</div>
 <div class="opts two"><button class="btn start" id="sw_s">開始</button><button class="btn stop" id="sw_p" disabled>停止</button></div><div id="fb"><p class="sub">機會：${3-t.att} 次</p></div>`);
 const svg=panel.querySelector('.clock'),sh=svg.querySelector('[data-hand=sec]');let t0=0,raf=0,lastS=-1;const num=$('#swn');
 const tick=()=>{const e=(performance.now()-t0)/1000;num.textContent=e.toFixed(1)+' 秒';rot(sh,e*6);const s=Math.floor(e);if(s!==lastS){lastS=s;if(!blind)SFX.tick();}raf=requestAnimationFrame(tick);};
 $('#sw_s').onclick=()=>{ac();SFX.click();$('#lpad')?.classList.add('rev');t0=performance.now();lastS=-1;$('#sw_s').disabled=true;$('#sw_p').disabled=false;raf=requestAnimationFrame(tick);};
 $('#sw_p').onclick=()=>{cancelAnimationFrame(raf);const e=(performance.now()-t0)/1000;$('#sw_p').disabled=true;num.textContent=e.toFixed(1)+' 秒';num.classList.remove('blind');panel.querySelector('.swdial').classList.remove('blind');rot(sh,e*6);
  const ok=Math.abs(e-t.target)<=(blind?1:.5);t.att++;
  if(ok||t.att>=3){if(ok){if(!blind){$('#lpad').classList.add('launch');tone(120,1.4,'sawtooth',.08,0,4);}}else t.miss++;finish(t,`秒錶顯示 <b>${e.toFixed(1)} 秒</b>，目標 ${t.target} 秒。${blind?'<br>估計和實際量度<b>可能不同</b>，多練習會越來越準！':ok?'引擎點火成功！🔥':''}`,true);}
  else{t.miss++;SFX.no();fb(`<div class="fb bad"><b>${e<t.target?'太快了！':'太慢了！'}</b><p>秒錶顯示 <b>${e.toFixed(1)} 秒</b>，目標 ${t.target} 秒。${blind?'心裏慢慢數：「1 秒、2 秒…」':'看着秒針走到第 '+t.target+' 小格就按停。'}</p><button class="btn go" id="b_r">再試一次</button></div>`);$('#b_r').onclick=()=>{SFX.click();R.watch(t);};}};};
// 太空人穿太空衣: start at the call, stop when fully dressed
R.suit=t=>{const T=ri(6,9);const parts=['👕 太空衣','🧤 手套','👢 靴子','🪖 頭盔'];
 showPanel(`${head(t)}<p class="prompt">太空人要穿好太空衣。你做計時員：<br>聽到「<b>開始</b>」才按開始，<b>穿好</b>才按停止！</p>
 <div class="suit"><div class="astro" id="astro">🧍</div><div class="parts">${parts.map(p=>`<span>${p}</span>`).join('')}</div><div class="call" id="call">準備…</div></div>
 <div class="sw small"><div class="swnum" id="swn">0.0 秒</div></div><div class="opts two"><button class="btn start" id="sw_s">開始</button><button class="btn stop" id="sw_p" disabled>停止</button></div><div id="fb"><button class="btn alt" id="b_ready">我準備好了 👍</button></div>`);
 let called=false,dressed=false,tCall=0,tDone=0,t0=0,raf=0,timers=[];const num=$('#swn'),call=$('#call');
 const reset=msg=>{timers.forEach(clearTimeout);cancelAnimationFrame(raf);miss(t,msg);setTimeout(()=>{if(!t.finished)R.suit(t);},2200);};
 let readied=false;$('#b_ready').onclick=()=>{if(readied)return;readied=true;SFX.click();fb('');const pre=ri(1500,2800);timers.push(setTimeout(()=>{called=true;tCall=performance.now();call.textContent='開始！';call.classList.add('go');SFX.call();
  parts.forEach((p,i)=>timers.push(setTimeout(()=>{panel.querySelectorAll('.parts span')[i]?.classList.add('on');SFX.snap();},T*1000*(i+1)/parts.length-250)));
  timers.push(setTimeout(()=>{dressed=true;tDone=performance.now();const a=$('#astro');if(a)a.textContent='👨‍🚀';call.textContent='穿好了！✅';call.classList.remove('go');call.classList.add('done');},T*1000));},pre));};
 $('#sw_s').onclick=()=>{if(!called)return reset('太早了！要<b>聽到「開始」才按開始</b>，這樣才公平。');t0=performance.now();$('#sw_s').disabled=true;$('#sw_p').disabled=false;const tk=()=>{num.textContent=((performance.now()-t0)/1000).toFixed(1)+' 秒';raf=requestAnimationFrame(tk);};tk();SFX.click();};
 $('#sw_p').onclick=()=>{if(!dressed)return reset('還未穿好！要<b>完成動作才按停止</b>。');cancelAnimationFrame(raf);const e=(performance.now()-t0)/1000;num.textContent=e.toFixed(1)+' 秒';$('#sw_p').disabled=true;
  const late=(performance.now()-tDone)/1000;G.rec.suit=e;if(late>2)t.miss++;finish(t,`秒錶顯示 <b>${e.toFixed(1)} 秒</b>。${late>2?'下次穿好就要立即按停啊！':'你在對的時候開始和停止，做得好！'}`);};};
// 記錄成績 約 N 秒
R.record=t=>{const e=G.rec.suit??7.4,n=Math.round(e);let v=ri(0,1)?n+ri(2,4):Math.max(1,n-ri(2,4));
 showPanel(`${head(t)}<p class="prompt">剛才秒錶顯示 <b>${e.toFixed(1)} 秒</b>。<br>在記錄表寫上「約＿秒」吧！</p><div class="sheet">📋 太空人穿太空衣：${picker(v)}</div><button class="btn go" id="b_ok">寫好了 ✔</button><div id="fb"></div>`);
 bindPicker(panel,()=>v,x=>v=x);$('#b_ok').onclick=()=>{if(t.finished)return;if(v===n||v===Math.floor(e))finish(t,`${e.toFixed(1)} 秒最接近 ${n} 秒，所以記錄「<b>約 ${n} 秒</b>」。`);else miss(t,`${e.toFixed(1)} 秒最接近哪個整數？用 ＋／－ 調整。`);};};
// 誠實計時員: alien race + temptation
R.race=t=>{const T=ri(7,10)+Math.random()*.5;panel.dataset.racedone='';const lanes=[['👽','小藍',1],['🐙','小八',T/(T-1.2)],['🤖','機機',T/(T+1.5)]];G.rec.race=null;
 showPanel(`${head(t)}<p class="prompt">你是 <b>👽 小藍</b> 的計時員！聽到「開始」按開始，小藍<b>衝過終點</b>才按停止。</p>
 <div class="track">${lanes.map((l,i)=>`<div class="lane"><span class="nm">${l[1]}</span><span class="runner" id="rn${i}">${l[0]}</span><span class="fin">🏁</span></div>`).join('')}<div class="call" id="call">準備…</div></div>
 <div class="sw small"><div class="swnum" id="swn">0.0 秒</div></div><div class="opts two"><button class="btn start" id="sw_s">開始</button><button class="btn stop" id="sw_p" disabled>停止</button></div><div id="fb"><button class="btn alt" id="b_ready">我準備好了 👍</button></div><div class="tempt" id="tempt"></div>`);
 let called=false,tCall=0,raceT=0,paused=false,last=0,t0=0,swT=0,running=false,raf=0,tempted=false,honest=true,finishedRace=false;const num=$('#swn');
 const loop=now=>{if(!panel.contains(num))return;const dt=(now-last)/1000;last=now;if(!paused){raceT+=dt;if(running)swT+=dt;}
  lanes.forEach((l,i)=>{const f=Math.min(1,raceT/(T/l[2]));const el=$('#rn'+i);if(el)el.style.left=`calc(${f*100}% * .82 + 8%)`;});
  if(running)num.textContent=swT.toFixed(1)+' 秒';
  if(!tempted&&raceT>T*.55){tempted=true;paused=true;$('#tempt').innerHTML=`<div class="tbox"><div class="who">🐙 小八悄悄說：</div><p>「小藍是我的好朋友！<b>幫我提早按停啦</b>，他就可以入隊！」</p><div class="opts"><button class="btn opt" id="t_no">不可以！我要誠實計時 🙅</button><button class="btn opt" id="t_yes">好吧…</button></div></div>`;
   $('#t_no').onclick=()=>{SFX.ok();$('#tempt').innerHTML='';paused=false;};$('#t_yes').onclick=()=>{honest=false;SFX.no();$('#tempt').innerHTML=`<div class="tbox"><p>⚠️ 提早按停，成績就<b>不可信</b>，對其他參賽者<b>不公平</b>！我們還是要誠實計時。</p><button class="btn go" id="t_ok">明白了，繼續</button></div>`;const tok0=performance.now();$('#t_ok').onclick=()=>{if(performance.now()-tok0<600)return;$('#tempt').innerHTML='';paused=false;};};}
  if(raceT>=T&&!finishedRace){finishedRace=true;panel.dataset.racedone='1';}
  if(finishedRace&&!running&&!$('#sw_s').disabled&&raceT>T+1.2&&!t.finished){fb(`<div class="fb bad"><b>忘了按「開始」？</b><p>聽到「開始」要立即按開始，小藍衝線才按停止。</p><button class="btn go" id="b_again">再跑一次 🔁</button></div>`);$('#b_again').onclick=()=>{t.miss++;R.race(t);};return;}
  raf=requestAnimationFrame(loop);};
 $('#b_ready').onclick=()=>{SFX.click();fb('');setTimeout(()=>{called=true;const c=$('#call');if(!c)return;c.textContent='開始！';c.classList.add('go');SFX.call();last=performance.now();raf=requestAnimationFrame(loop);},ri(1200,2400));};
 $('#sw_s').onclick=()=>{if(!called){miss(t,'太早了！要<b>聽到「開始」</b>才按。');return;}if(running||t.finished)return;running=true;swT=raceT;$('#sw_s').disabled=true;$('#sw_p').disabled=false;SFX.click();};
 $('#sw_p').onclick=()=>{if(paused||!running||t.finished)return;if(!finishedRace){miss(t,'小藍<b>還未到終點</b>！不可以提早按停，要等他衝過終點。');return;}running=false;$('#sw_p').disabled=true;cancelAnimationFrame(raf);
  const late=raceT-T;G.rec.race=swT;if(!honest)t.miss++;if(late>1.5)t.miss++;finish(t,`秒錶顯示 <b>${swT.toFixed(1)} 秒</b>。${honest?'你拒絕了不公平的要求，是誠實的計時員！👏':'記住：要誠實，不可以幫朋友提早按停。'}`);};};
// 記分牌: record the true time
R.board=t=>{const e=G.rec.race??8.6,n=Math.round(e);let v=Math.max(1,n-2);const others=[['🐙 小八',n-1],['🤖 機機',n+2]];
 showPanel(`${head(t)}<p class="prompt">把小藍的<b>真實時間</b>寫上記分牌。<br><span class="sub">（剛才秒錶顯示 ${e.toFixed(1)} 秒）</span></p>
 <div class="board"><div>🏆 50 米太空賽跑</div>${others.map(o=>`<div class="row"><span>${o[0]}</span><span>約 ${o[1]} 秒</span></div>`).join('')}<div class="row me"><span>👽 小藍</span>${picker(v)}</div></div><button class="btn go" id="b_ok">寫好了 ✔</button><div id="fb"></div>`);
 bindPicker(panel,()=>v,x=>v=x);$('#b_ok').onclick=()=>{if(t.finished)return;if(v===n)finish(t,`誠實記錄「<b>約 ${n} 秒</b>」。如實記錄，比賽才公平！`);else if(v<n)miss(t,'這比真實時間少了！少記時間對其他參賽者不公平。要寫秒錶真正量到的時間。');else miss(t,`${e.toFixed(1)} 秒最接近幾秒？`);};};
// 找出不公平的行為
R.spot=t=>{const C=[['🏃‍♂️','小明聽到「開始」，起跑！',0],['⏱️👧','小美同時按下「開始」。',0],['✋⏱️','小明<b>還未到終點</b>，小美就按停了秒錶。',1],['📋','秒錶記錄 8 秒，但小明其實跑了 10 秒。',0]];
 showPanel(`${head(t)}<p class="prompt">小美和小明的故事。<b>哪一幕</b>是不公平的？按一按！</p><div class="story4">${C.map((c,i)=>`<button class="scard" data-b="${c[2]}"><span class="em">${c[0]}</span><span class="n">${i+1}</span><span>${c[1]}</span></button>`).join('')}</div><div id="fb"></div>`);
 panel.querySelectorAll('.scard').forEach(b=>b.onclick=()=>{if(t.finished)return;if(b.dataset.b==='1'){b.classList.add('right');finish(t,'對！小美為了幫小明入隊，<b>提早按停</b>秒錶。這個成績<b>不可信</b>，對其他參賽者不公平。應該誠實記錄。');}else{b.classList.add('wrong');setTimeout(()=>b.classList.remove('wrong'),450);miss(t,'這一幕沒有問題。找找誰沒有等小明完成就按停？');}});};
// 北斗衛星上軌道: drag satellites into orbit slots
R.orbit=t=>{const slots=[[50,8],[88,62],[14,66]];
 showPanel(`${head(t)}<p class="prompt">把 3 粒<b>北斗衛星</b>拖到軌道的光點上，建立衛星網絡！</p><div class="orbit"><div class="orb-ring"></div><div class="earth">🌏</div>
 <svg class="links" viewBox="0 0 100 100" preserveAspectRatio="none">${slots.map((s,i)=>`<line id="ln${i}" x1="50" y1="50" x2="${s[0]}" y2="${s[1]}"/>`).join('')}<polyline id="net" points="${slots.map(s=>s.join(',')).join(' ')} ${slots[0].join(',')}"/></svg>
 ${slots.map((s,i)=>`<div class="oslot" data-i="${i}" style="left:${s[0]}%;top:${s[1]}%"></div>`).join('')}</div><div class="tray">${[0,1,2].map(i=>`<div class="sat">🛰️</div>`).join('')}</div><div id="fb"></div>`);let n=0;
 panel.querySelectorAll('.sat').forEach(p=>draggable(p,(x,y)=>{const sl=[...panel.querySelectorAll('.oslot:not(.full)')].find(s=>inside(s,x,y));if(!sl)return false;SFX.snap();sl.classList.add('full');p.classList.add('placed');p.style.transform='';sl.appendChild(p);
  $('#ln'+sl.dataset.i).classList.add('on');if(++n===3){$('#net').classList.add('on');finish(t,'北斗網絡上線！🛰️ 北斗衛星導航系統由<b>中國自主建設、獨立運行</b>，提供定位、導航和<b>授時</b>服務。');}return true;}));};
// 北斗授時: sync ship clock to the Beidou time signal
R.sync=t=>{let off=pick([-1,1])*ri(4,17);const base=Date.now();const fmt=ms=>{const d=new Date(ms);return [d.getHours(),d.getMinutes(),d.getSeconds()].map(x=>String(x).padStart(2,'0')).join(':');};
 showPanel(`${head(t)}<p class="prompt">飛船時鐘<b>不準</b>了！用北斗的<b>授時信號</b>把它校準。</p>
 <div class="sync"><div class="clk bd"><small>🛰️ 北斗授時信號</small><b id="tb">--</b></div><div class="clk sh"><small>🚀 飛船時鐘</small><b id="ts">--</b><span id="dif"></span></div></div>
 <div class="opts four"><button class="btn pm" data-d="-5">－5 秒</button><button class="btn pm" data-d="-1">－1 秒</button><button class="btn pm" data-d="1">＋1 秒</button><button class="btn pm" data-d="5">＋5 秒</button></div><div id="fb"></div>`);
 const draw=()=>{if(!panel.contains($('#tb')))return clearInterval(iv);const now=Date.now();$('#tb').textContent=fmt(now);$('#ts').textContent=fmt(now+off*1000);const ok=off===0;$('.clk.sh').classList.toggle('ok',ok);
  $('#dif').textContent=ok?'✅ 一樣了！':(off>0?`快了 ${off} 秒`:`慢了 ${-off} 秒`);};const iv=setInterval(draw,250);draw();
 panel.querySelectorAll('.pm').forEach(b=>b.onclick=()=>{if(t.finished)return;SFX.click();off+= +b.dataset.d;if(Math.abs(off)>40)t.miss++;draw();if(off===0)finish(t,'校準成功！⏰ 北斗衛星提供「<b>授時</b>」服務，即是<b>提供準確的時間</b>。');});};

// ================= v6 playful mini-games =================
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function burst(el,em=['✨','⭐','💥','🎉']){if(!el)return;const r=el.getBoundingClientRect();for(let i=0;i<10;i++){const s=document.createElement('div');s.className='spark';s.textContent=em[i%em.length];
 s.style.left=r.left+r.width/2+'px';s.style.top=r.top+r.height/2+'px';document.body.appendChild(s);const a=Math.random()*Math.PI*2,d=50+Math.random()*70;
 requestAnimationFrame(()=>requestAnimationFrame(()=>{s.style.transform=`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) scale(.4)`;s.style.opacity='0';}));setTimeout(()=>s.remove(),750);}}
const live=el=>el&&el.isConnected;
const NEEDLE={sec:['#ff3b5c',3,100],min:['#2f80ed',8,74],hr:['#3b4a6b',13,48]};
const needleSVG=k=>{const [c,w,l]=NEEDLE[k];return `<svg viewBox="0 0 30 110"><line x1="15" y1="${105}" x2="15" y2="${105-l}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/><circle cx="15" cy="105" r="4" fill="${c}"/></svg>`;};
// 秒針射擊
R.shoot=t=>{const GOAL=5;showPanel(`${head(t)}<p class="prompt">🎯 只射<b>秒針</b>！（最幼、最長、最快）</p><div class="arena" id="ar"><div class="hudl">🎯 <b id="hit">0</b> / ${GOAL}　<span id="cmb"></span></div></div><div id="fb"></div>`);
 const ar=$('#ar');let hit=0,last=performance.now(),spawnT=0,combo=0,wrong=0;const items=[];
 const spawn=()=>{const k=Math.random()<.5?'sec':pick(['min','hr']);const d=document.createElement('div');d.className='ndl '+k;d.innerHTML=needleSVG(k);const H=ar.clientHeight;
  const o={d,k,x:spawn.x0??-60,y:20+Math.random()*(H-140),v:k==='sec'?170+Math.random()*40:k==='min'?70:45,r:Math.random()*360,vr:k==='sec'?360:k==='min'?90:30};ar.appendChild(d);items.push(o);
  d.addEventListener('pointerdown',e=>{e.preventDefault();if(t.finished||o.dead)return;o.dead=true;
   if(k==='sec'){hit++;combo++;SFX.snap();tone(1200+combo*120,.08,'square',.06);burst(d,['💥','✨','⭐']);d.classList.add('pop');$('#hit').textContent=hit;$('#cmb').textContent=combo>1?`連擊 x${combo} 🔥`:'';
    if(hit>=GOAL){t.miss=wrong>1?1:0;finish(t,'神射手！<b>秒針</b>是最幼、最長、走得最快的針。');}}
   else{combo=0;wrong++;SFX.no();d.classList.add('bad');$('#cmb').textContent='';fb(`<div class="fb bad"><b>不是秒針！</b><p>${k==='min'?'藍色的是<b>分針</b>，比較粗。':'短短粗粗的是<b>時針</b>。'}秒針是最幼、最長的紅色針。</p></div>`);}
   setTimeout(()=>d.remove(),400);});};
 [.15,.45,.75].forEach(f=>{spawn.x0=ar.clientWidth*f;spawn();});spawn.x0=null;items.forEach(o=>o.d.style.transform=`translate(${o.x}px,${o.y}px)`);
 const loop=now=>{if(!live(ar))return;const dt=Math.max(0,Math.min(.1,(now-last)/1000));last=now;spawnT-=dt;if(spawnT<=0&&!t.finished){spawn();spawnT=.75+Math.random()*.5;}
  const W=ar.clientWidth;for(let i=items.length-1;i>=0;i--){const o=items[i];o.x+=o.v*dt;o.r+=o.vr*dt;o.d.style.transform=`translate(${o.x}px,${o.y}px) rotate(${o.r}deg)`;if(o.x>W+40){o.d.remove();items.splice(i,1);}}
  requestAnimationFrame(loop);};requestAnimationFrame(loop);};
// 隕石分類 (falling asteroids into 秒 / 分鐘 portals)
R.rock=t=>{const list=shuffle([...shuffle(SEC_ACTS).slice(0,3).map(a=>[...a,'s']),...shuffle(MIN_ACTS).slice(0,2).map(a=>[...a,'m'])]);let idx=0,cur=null,wrong=0;
 showPanel(`${head(t)}<p class="prompt">☄️ 隕石飛來了！把它<b>拖進</b>對的傳送門（或按傳送門）。</p><div class="arena rockar" id="ar"><div class="hudl">☄️ <b id="rk">0</b> / ${list.length}</div>
 <div class="portal ps" data-k="s"><b>秒</b><small>很短</small></div><div class="portal pm2" data-k="m"><b>分鐘</b><small>較長</small></div></div><div id="fb"></div>`);
 const ar=$('#ar');let last=performance.now();
 const next=()=>{if(idx>=list.length){t.miss=wrong>1?1:0;return finish(t,'全部送走！很短的事情用 <b>秒</b>，較長的事情用 <b>分鐘</b>。');}
  const [txt,em,k]=list[idx];const d=document.createElement('div');d.className='rock';d.innerHTML=`<span>${em}</span>${txt}`;ar.appendChild(d);cur={d,k,txt,y:20,x:ar.clientWidth/2,drag:false};
  draggable(d,(x,y)=>{cur.drag=false;const p=[...ar.querySelectorAll('.portal')].find(p=>inside(p,x,y));if(!p)return false;send(p);return true;},()=>{cur.drag=true;});};
 const send=p=>{if(!cur||cur.sent)return;const c=cur;if(p.dataset.k!==c.k){wrong++;SFX.no();c.d.classList.add('shake2');setTimeout(()=>c.d.classList.remove('shake2'),400);c.d.style.transform='';
   fb(`<div class="fb bad"><b>再想想 🤔</b><p>「${c.txt}」${c.k==='s'?'很快就做完，用<b>秒</b>。':'要較長時間，用<b>分鐘</b>。'}</p></div>`);return;}
  c.sent=true;SFX.snap();tone(500,.3,'sine',.1,0,3);const pr=p.getBoundingClientRect(),ra=ar.getBoundingClientRect();c.d.style.transition='all .4s';c.d.style.left=(pr.left-ra.left+pr.width/2)+'px';c.d.style.top=(pr.top-ra.top+pr.height/2)+'px';c.d.style.transform='translate(-50%,-50%) scale(.1) rotate(360deg)';
  p.classList.add('flash');setTimeout(()=>p.classList.remove('flash'),400);burst(p);fb('');idx++;$('#rk').textContent=idx;setTimeout(()=>{c.d.remove();cur=null;next();},450);};
 ar.querySelectorAll('.portal').forEach(p=>p.addEventListener('click',()=>send(p)));
 const loop=now=>{if(!live(ar))return;const dt=Math.min(.05,(now-last)/1000);last=now;if(cur&&!cur.drag&&!cur.sent){cur.y+=26*dt;if(cur.y>ar.clientHeight-40)cur.y=-60;cur.d.style.left=cur.x+'px';cur.d.style.top=cur.y+'px';}requestAnimationFrame(loop);};
 next();requestAnimationFrame(loop);};
// 秒針追蹤 (tap when the seconds hand reaches the target)
R.track=t=>{const tg=[ri(2,11)*5,ri(2,11)*5,ri(1,58)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,3);while(tg.length<3)tg.push(ri(1,59));let ti=0,off=0,last=performance.now(),tick=0;const SP=4;
 showPanel(`${head(t)}<p class="prompt">⚡ 快速時鐘！秒針到 <b id="tgv">${tg[0]} 秒</b> 時，按「停！」</p><div class="cbox trk">${clockSVG({sec:0,showMin:false,showHr:false,cls:'big'})}<div class="tgt" id="tgl">🎯 ${tg[0]}</div></div>
 <div class="dots3">${tg.map((_,i)=>`<i id="d${i}"></i>`).join('')}</div><button class="btn go bigtap" id="tap">停！✋</button><div id="fb"></div>`);
 const svg=panel.querySelector('.clock'),sh=svg.querySelector('[data-hand=sec]');const mk=document.createElementNS('http://www.w3.org/2000/svg','circle');mk.setAttribute('r','9');mk.setAttribute('fill','#ffb020');mk.setAttribute('class','tmark');svg.appendChild(mk);
 const place=()=>{const a=tg[ti]*6*Math.PI/180;mk.setAttribute('cx',(Math.sin(a)*92).toFixed(1));mk.setAttribute('cy',(-Math.cos(a)*92).toFixed(1));$('#tgv').textContent=tg[ti]+' 秒';$('#tgl').textContent='🎯 '+tg[ti];};place();
 let lastK=-1;const loop=now=>{if(!live(svg)||t.finished)return;const dt=Math.min(.05,(now-last)/1000);last=now;tick=(tick+dt*SP)%60;rot(sh,tick*6);const k=Math.floor(tick);if(k!==lastK){lastK=k;tone(k%5?1400:1000,.02,'square',.03);}requestAnimationFrame(loop);};requestAnimationFrame(loop);
 $('#tap').onclick=()=>{if(t.finished)return;const k=Math.round(tick)%60,d=((k-tg[ti])+90)%60-30;
  if(Math.abs(d)<=1){SFX.ok();burst($('#tap'),['🎯','✨','⭐']);$('#d'+ti).classList.add('on');fb(`<div class="fb good"><b>${d===0?'完美！🎯':'好！👍'}</b><p>秒針走了 ${tg[ti]} 小格 = ${tg[ti]} 秒</p></div>`);ti++;
   if(ti>=3){t.miss=off>2?1:0;finish(t,'節奏大師！秒針走 <b>1 小格就是 1 秒</b>。');}else place();}
  else{off++;SFX.no();fb(`<div class="fb bad"><b>${d<0?'早了':'遲了'} ${Math.abs(d)} 秒</b><p>秒針在 ${k} 秒。等它走到 ${tg[ti]} 秒再按！</p></div>`);}};};
// 一分鐘燃料 (spin a full lap against the clock; minute hand moves 1 small tick)
R.spin=t=>{const LIM=15;const m0=ri(5,50);showPanel(`${head(t)}<p class="prompt">🌀 用手指<b>轉秒針一整圈</b>，${LIM} 秒內裝滿燃料！</p><div class="fuelrow"><div class="cbox">${clockSVG({sec:0,min:m0,showHr:false,cls:'big'})}</div><div class="tank"><i id="fuel2"></i><span id="fuelt">0 秒</span></div></div>
 <div class="tbar"><i id="tbar"></i></div><div id="eq" class="eq"></div><div id="fb"></div>`);
 const svg=panel.querySelector('.clock'),mh=svg.querySelector('[data-hand=min]');let done=false,t0=0,raf=0;
 const timer=()=>{if(!live(svg)||done)return;const e=(performance.now()-t0)/1000;$('#tbar').style.width=Math.max(0,100-e/LIM*100)+'%';raf=requestAnimationFrame(timer);};
 dragHand(svg,(k,cum)=>{if(done)return;if(!t0){t0=performance.now();timer();}const c=Math.min(60,cum);setArc(svg,c);$('#fuel2').style.height=(c/60*100)+'%';$('#fuelt').textContent=c+' 秒';if(c%5===0&&c)tone(300+c*12,.06,'sawtooth',.05);
  if(c>=60){done=true;const e=(performance.now()-t0)/1000;SFX.star();burst(panel.querySelector('.tank'),['⛽','✨','🔥']);mh.style.transition='transform .8s';rot(mh,(m0+1)*6);
   $('#eq').innerHTML=`<span>60 小格</span><b>=</b><span>60 秒</span><b>=</b><span class="hl">1 分鐘</span>`;
   setTimeout(()=>{if(e>LIM)t.miss=1;finish(t,`燃料滿了！${e<=LIM?`只用了 ${e.toFixed(1)} 秒 ⚡`:''}<br>秒針走一圈，<b>分針走 1 小格</b>：<b>60 秒 = 1 分鐘</b>！`);},900);}});};
// 記憶翻牌
R.match=t=>{const P=shuffle([['60 秒','1 分鐘'],['120 秒','2 分鐘'],['秒針走 5 小格','5 秒'],['秒針走 1 小格','1 秒'],['秒針走一圈','60 秒'],['12 走到 1','5 秒']]);const used=[];for(const p of P){if(used.length<3&&!used.some(u=>u[1]===p[1]))used.push(p);}
 const cards=shuffle(used.flatMap((p,i)=>[[p[0],i],[p[1],i]]));let open=[],n=0,wrong=0,lock=false;
 showPanel(`${head(t)}<p class="prompt">🃏 翻牌！找出<b>一樣長</b>的時間。</p><div class="memo">${cards.map((c,j)=>`<button class="mcard" data-i="${c[1]}" data-j="${j}"><span class="bk">🚀</span><span class="fr">${c[0]}</span></button>`).join('')}</div><div id="fb"></div>`);
 panel.querySelectorAll('.mcard').forEach(b=>b.onclick=()=>{if(lock||b.classList.contains('flip'))return;b.classList.add('flip');tone(700,.05,'triangle',.08);open.push(b);
  if(open.length===2){const [a,c]=open;open=[];if(a.dataset.i===c.dataset.i){setTimeout(()=>{a.classList.add('right');c.classList.add('right');SFX.snap();burst(c);},300);if(++n===3){t.miss=wrong>3?1:0;setTimeout(()=>finish(t,'全部配對！<b>60 秒 = 1 分鐘</b>，秒針走 1 小格是 1 秒。'),600);}}
   else{wrong++;lock=true;setTimeout(()=>{a.classList.remove('flip');c.classList.remove('flip');lock=false;},900);}}});};
// 拍拍節拍 (feel 1 second, then estimate 5 seconds)
R.beat=t=>{showPanel(`${head(t)}<p class="prompt" id="bp">🥁 跟着節拍<b>拍 5 下</b>，感受「1 秒」有多長！</p><div class="beatbox"><div class="beat" id="bt">1 秒</div><div class="bdots">${[0,1,2,3,4].map(i=>`<i id="b${i}"></i>`).join('')}</div></div>
 <button class="btn go bigtap" id="tap">拍！👏</button><div id="fb"></div>`);
 let phase=0,beats=[],good=0,t0=0;const bt=$('#bt');
 const run=async()=>{await sleep(900);for(let i=0;i<5;i++){if(!live(bt))return;beats.push(performance.now());bt.classList.remove('on');void bt.offsetWidth;bt.classList.add('on');tone(880,.08,'square',.1);$('#b'+i).classList.add('on');await sleep(1000);}
  if(!live(bt))return;phase=1;$('#bp').innerHTML=`🙈 沒有節拍了！按「開始」，<b>心裏數 5 秒</b>，再按「停」。`;bt.textContent='？秒';bt.classList.add('dark');$('#tap').textContent='開始 ▶';fb(`<div class="fb good"><b>${good>=3?'節奏很準！':'好！'}</b><p>剛才每一拍相隔 1 秒。</p></div>`);};
 $('#tap').onclick=e=>{const now=performance.now();if(phase===0){const near=beats.some(b=>Math.abs(now-b)<300);if(near){good++;burst(e.currentTarget,['👏','✨']);}tone(near?1200:400,.05,'triangle',.08);return;}
  if(phase===1){phase=2;t0=now;$('#tap').textContent='停 ✋';SFX.click();bt.textContent='🤫';return;}
  if(phase===2){phase=3;const el=(now-t0)/1000;const ok=Math.abs(el-5)<=1;bt.textContent=el.toFixed(1)+' 秒';bt.classList.remove('dark');$('#tap').disabled=true;if(!ok)t.miss=1;
   finish(t,`你<b>估計</b> 5 秒，<b>實際量度</b>是 <b>${el.toFixed(1)} 秒</b>。<div class="cmpbar"><span style="width:${Math.min(100,el/10*100)}%">實測</span><span class="g" style="width:50%">估計 5 秒</span></div>${ok?'很接近！':'差了一點！'}<b>估計</b>和<b>實際量度</b>可能不同，所以要用秒錶量度。`,true);}};run();};
// 公平裁判 (watch 3 scenes, stamp ✅ / ❌)
const SCENES=[{k:'ok',txt:'聽到「開始」才按，衝線才按停。',why:'計時正確，成績可信。'},{k:'early',txt:'',why:'還未到終點就按停，成績<b>不可信</b>，對別人不公平。'},{k:'jump',txt:'',why:'還未叫「開始」就按開始，<b>不公平</b>！'},{k:'less',txt:'',why:'秒錶顯示 10 秒，卻寫 8 秒，<b>不誠實</b>！'}];
R.judge=t=>{const list=shuffle([SCENES[0],...shuffle(SCENES.slice(1)).slice(0,2)]);let si=0,wrong=0;
 const show=()=>{const s=list[si];showPanel(`${head(t)}<p class="prompt">⚖️ 你是<b>公平裁判</b>！看片段，蓋上 ✅ 公平 或 ❌ 不公平。</p><div class="scene" id="sc"><div class="lane2"><span class="rnr" id="rr">🏃</span><span class="fin">🏁</span></div>
  <div class="sbar"><span class="bub" id="bub">準備…</span><span class="swn2" id="sw2">⏱️ 0.0</span><span class="note" id="nt"></span></div><div class="stamp" id="stp"></div></div><div class="sdots">${list.map((_,i)=>`<i class="${i<si?'on':''}"></i>`).join('')}</div>
  <div class="opts two" id="sb" style="visibility:hidden"><button class="btn stampb ok" data-v="ok">✅ 公平</button><button class="btn stampb no" data-v="no">❌ 不公平</button></div><div id="fb"></div>`);
  const rr=$('#rr'),sw=$('#sw2'),bub=$('#bub');let t0=performance.now(),swOn=false,swV=0,stopAt=s.k==='early'?.62:1,startEarly=s.k==='jump',runStart=1.0,dur=2.6,last=t0;
  if(startEarly){swOn=true;}
  const loop=now=>{if(!live(rr))return;const e=(now-t0)/1000,dt=(now-last)/1000;last=now;if(e>runStart&&bub.textContent!=='開始！'){bub.textContent='開始！';bub.classList.add('go');tone(784,.12,'square',.08);swOn=true;}
   const f=Math.max(0,Math.min(1,(e-runStart)/dur));rr.style.left=`calc(${f*82}% + 2%)`;if(swOn)swV+=dt*3.8;if(swOn&&f>=stopAt){swOn=false;tone(500,.08,'square',.08);sw.classList.add('stop');}
   sw.textContent='⏱️ '+swV.toFixed(1);if(f>=1&&e>runStart+dur+.5){if(s.k==='less'){$('#nt').innerHTML='📋 記錄：<b>'+Math.max(1,Math.round(swV)-2)+' 秒</b>';}$('#sb').style.visibility='visible';return;}requestAnimationFrame(loop);};requestAnimationFrame(loop);
  let judged=false;panel.querySelectorAll('.stampb').forEach(b=>b.onclick=()=>{if(t.finished||judged)return;const fair=s.k==='ok',v=b.dataset.v==='ok';const st=$('#stp');st.textContent=v?'✅':'❌';st.className='stamp '+(v?'g':'r')+' in';tone(160,.15,'square',.12);
   if(v===fair){judged=true;panel.querySelectorAll('.stampb').forEach(x=>x.disabled=true);SFX.ok();fb(`<div class="fb good"><b>判得好！</b><p>${s.why}</p><button class="btn go" id="nx">下一段 ▶</button></div>`);let nxd=false;$('#nx').onclick=()=>{if(nxd)return;nxd=true;si++;if(si>=list.length){showPanel(`${head(t)}<div class="intro"><div class="big">⚖️</div></div><div id="fb"></div>`);t.miss=wrong?1:0;finish(t,'你是公平的裁判！計時要<b>誠實、公平</b>，成績才可信。');}else show();};}
   else{wrong++;SFX.no();setTimeout(()=>{st.className='stamp';},700);fb(`<div class="fb bad"><b>再看看 🤔</b><p>${fair?'這次計時員有等「開始」和衝線，是公平的。':'留意：計時員是不是太早按、或者寫錯時間？'}</p></div>`);}});};show();};
// 北斗授時 timing game: tap 同步 when the ship hand overlaps the Beidou hand
R.sync=t=>{let n=0,off=0,last=performance.now(),ga=0,ra=ri(120,240);const VG=150,VR=70;
 showPanel(`${head(t)}<p class="prompt">⏰ 飛船時鐘不準！紅針和<b>北斗金針</b>重疊時，按「同步」！</p><div class="cbox syncc"><svg class="clock big" viewBox="-120 -120 240 240"><circle r="114" fill="#0d1838" stroke="#ffd86b" stroke-width="6"/>
 ${Array.from({length:12},(_,i)=>`<line x1="0" y1="-100" x2="0" y2="-110" stroke="#8fd3ff" stroke-width="3" transform="rotate(${i*30})"/>`).join('')}<g id="gh"><line x1="0" y1="15" x2="0" y2="-100" stroke="#ffd23f" stroke-width="6" stroke-linecap="round"/><text y="-104" text-anchor="middle" font-size="18">🛰️</text></g>
 <g id="rh"><line x1="0" y1="15" x2="0" y2="-92" stroke="#ff3b5c" stroke-width="4" stroke-linecap="round"/><text y="-92" text-anchor="middle" font-size="16">🚀</text></g><circle r="7" fill="#fff"/></svg></div>
 <div class="dots3">${[0,1,2].map(i=>`<i id="d${i}"></i>`).join('')}</div><button class="btn go bigtap" id="tap">同步！📡</button><div id="fb"><p class="sub">🛰️ 北斗衛星「授時」：提供準確的時間。</p></div>`);
 const gh=$('#gh'),rh=$('#rh');let lock=0;
 const loop=now=>{if(!live(gh)||t.finished)return;const dt=Math.min(.05,(now-last)/1000);last=now;ga=(ga+VG*dt)%360;if(lock>0){lock-=dt;ra=ga;}else ra=(ra+VR*dt)%360;rot(gh,ga);rot(rh,ra);requestAnimationFrame(loop);};requestAnimationFrame(loop);
 $('#tap').onclick=()=>{if(t.finished||lock>0)return;const d=Math.abs(((ga-ra)+540)%360-180);
  if(d<=16){n++;SFX.ok();burst($('#tap'),['📡','✨','⏰']);$('#d'+(n-1)).classList.add('on');lock=1.2;setTimeout(()=>{ra=(ga+ri(120,240))%360;},1200);fb(`<div class="fb good"><b>同步成功 ${n}/3！</b></div>`);
   if(n>=3){t.miss=off>3?1:0;finish(t,'時間校準了！⏰ 北斗衛星提供「<b>授時</b>」服務，即是<b>提供準確的時間</b>。');}}
  else{off++;SFX.no();fb(`<div class="fb bad"><b>還未重疊！</b><p>等紅針 🚀 追上金針 🛰️ 再按。</p></div>`);}};};
// 北斗導航 (follow the Beidou beacon to steer a rover)
R.navi=t=>{const C=6,Rw=4;let path=[[0,Rw-1]];let [x,y]=[0,Rw-1];while(x<C-1||y>0){if(y>0&&(x===C-1||Math.random()<.45))y--;else x++;path.push([x,y]);}
 const key=(a,b)=>a+','+b,onP=new Set(path.map(p=>key(...p)));const rocks=new Set();for(let i=0;i<5;i++){const c=[ri(0,C-1),ri(0,Rw-1)];if(!onP.has(key(...c)))rocks.add(key(...c));}
 let step=0,wrong=0;
 showPanel(`${head(t)}<p class="prompt">🛰️ 跟着<b>北斗光點</b>，把月球車開到 🏁！</p><div class="bdinfo"><span id="i1" class="on">📍 定位</span><span id="i2">🧭 導航</span><span id="i3">⏰ 授時</span></div>
 <div class="grid" id="gd" style="grid-template-columns:repeat(${C},1fr)">${Array.from({length:C*Rw},(_,i)=>{const cx=i%C,cy=Math.floor(i/C);const k=key(cx,cy);return `<div class="cell" data-k="${k}">${rocks.has(k)?'🪨':(cx===C-1&&cy===0?'🏁':'')}</div>`;}).join('')}<div class="rover" id="rv">🚙</div></div>
 <div class="pad"><button class="btn pk" data-d="0,-1">⬆️</button><div><button class="btn pk" data-d="-1,0">⬅️</button><button class="btn pk" data-d="1,0">➡️</button></div><button class="btn pk" data-d="0,1">⬇️</button></div><div id="fb"></div>`);
 const gd=$('#gd'),rv=$('#rv');const pos=()=>{const [px,py]=path[step];rv.style.left=(px+.5)/C*100+'%';rv.style.top=(py+.5)/Rw*100+'%';gd.querySelectorAll('.cell').forEach(c=>c.classList.remove('beam'));const nx=path[step+1];if(nx)gd.querySelector(`[data-k="${key(...nx)}"]`).classList.add('beam');};pos();
 panel.querySelectorAll('.pk').forEach(b=>b.onclick=()=>{if(t.finished)return;const [dx,dy]=b.dataset.d.split(',').map(Number),[px,py]=path[step],nx=path[step+1];$('#i2').classList.add('on');
  if(nx&&nx[0]===px+dx&&nx[1]===py+dy){step++;tone(600+step*40,.06,'triangle',.08);pos();if(step===path.length-1){$('#i3').classList.add('on');SFX.star();burst(rv,['🏁','✨','⭐']);t.miss=wrong>2?1:0;
    setTimeout(()=>finish(t,'到達了！🛰️ 北斗為我們提供<b>定位、導航和授時</b>。北斗由<b>中國自主建設</b>，科技安全是國家安全的重要部分。'),500);}}
  else{wrong++;SFX.no();rv.classList.add('shake2');setTimeout(()=>rv.classList.remove('shake2'),400);fb(`<div class="fb bad"><b>跟着發光的格子 ✨</b><p>北斗會告訴你下一步去哪裏。</p></div>`);setTimeout(()=>fb(''),1800);}});};

// ================= rescue story event (EVA rope throw) =================
const cam=api.cam;
const RS={on:false};
const evaPad=document.createElement('div');evaPad.id='evapad';document.body.appendChild(evaPad);
const evaUI=document.createElement('div');evaUI.id='evaui';document.body.appendChild(evaUI);
const fade=document.createElement('div');fade.id='fade';document.body.appendChild(fade);
const sosMark=document.createElement('div');sosMark.id='sosmark';sosMark.innerHTML='<span>🆘 救命呀！</span>';document.body.appendChild(sosMark);
const aim=document.createElement('div');aim.id='aim';document.body.appendChild(aim);
function mkAstro(accent){const g=new THREE.Group();const white=new THREE.MeshStandardMaterial({color:0xf4f6fb,roughness:.55,emissive:0x303848});const acc=new THREE.MeshStandardMaterial({color:accent,roughness:.5,emissive:accent,emissiveIntensity:.25});
 const visor=new THREE.MeshStandardMaterial({color:0x1a2340,metalness:.9,roughness:.15,emissive:0x2a4a9a,emissiveIntensity:.4});
 const add=(geo,m,p,s)=>{const o=new THREE.Mesh(geo,m);o.position.set(...p);if(s)o.scale.set(...s);g.add(o);return o;};
 add(new THREE.CapsuleGeometry(1,1.2,6,14),white,[0,0,0]);add(new THREE.SphereGeometry(1.15,20,14),white,[0,1.9,0]);add(new THREE.SphereGeometry(.85,20,14),visor,[0,1.95,.55],[1,.8,.6]);
 add(new THREE.BoxGeometry(1.6,1.8,.8),white,[0,.3,-1]);add(new THREE.BoxGeometry(1.7,.35,1.9),acc,[0,.2,.05]);
 for(const sx of[-1,1]){const a=add(new THREE.CapsuleGeometry(.36,.9,4,8),white,[sx*1.25,.4,0]);a.rotation.z=sx*.5;add(new THREE.CapsuleGeometry(.42,.8,4,8),white,[sx*.5,-1.6,0]);add(new THREE.SphereGeometry(.4,10,8),acc,[sx*1.55,-.15,0]);}
 add(new THREE.CylinderGeometry(.05,.05,1,6),acc,[.6,3.2,-.3]);add(new THREE.SphereGeometry(.18,8,6),acc,[.6,3.75,-.3]);g.scale.setScalar(1.3);return g;}
let rsObjs=null;
function buildRescue(){const hullM=new THREE.MeshStandardMaterial({color:0xcfd6e6,metalness:.6,roughness:.35,emissive:0x1a2030});const dark=new THREE.MeshStandardMaterial({color:0x22324f,metalness:.7,roughness:.3,emissive:0x0a1a3a});
 const hull=new THREE.Group();const body=new THREE.Mesh(new THREE.CapsuleGeometry(3.2,12,8,20),hullM);body.rotation.x=Math.PI/2;hull.add(body);
 const win=new THREE.Mesh(new THREE.SphereGeometry(2.6,20,12,0,Math.PI*2,0,Math.PI/2.4),new THREE.MeshStandardMaterial({color:0x6fc8ff,metalness:.9,roughness:.1,emissive:0x2a6aaa,emissiveIntensity:.5}));win.position.set(0,1.6,-6);win.rotation.x=-.6;hull.add(win);
 for(const sx of[-1,1]){const w=new THREE.Mesh(new THREE.BoxGeometry(9,.4,4),dark);w.position.set(sx*6,-.5,3);w.rotation.z=sx*-.12;hull.add(w);}
 const door=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.6,.3),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,1.3,.4)}));door.position.set(0,3.1,-1);door.rotation.x=-Math.PI/2;hull.add(door);
 hull.position.set(0,-4,-2);const me=mkAstro(0x2f80ed);me.position.set(0,1.2,-4);const lost=mkAstro(0xff7a2f);lost.scale.setScalar(2.4);
 const tether=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-.8,-3),new THREE.Vector3(0,1.2,-4)]),new THREE.LineBasicMaterial({color:0xffd86b}));
 const ropeM=new THREE.MeshBasicMaterial({color:new THREE.Color(2,1.6,.5)});const rope=new THREE.Mesh(new THREE.BufferGeometry(),ropeM);rope.frustumCulled=false;
 const hook=new THREE.Mesh(new THREE.TorusGeometry(.7,.2,6,14),ropeM);
 const g=new THREE.Group();g.add(hull,me,lost,tether,rope,hook);ship.add(g);return {g,hull,me,lost,rope,hook};}
const RV={a:new THREE.Vector3(),b:new THREE.Vector3(),c:new THREE.Vector3(),hand:new THREE.Vector3(1.6,1.6,-4.4)};
function ropeTo(p){const o=rsObjs;o.rope.geometry.dispose();const mid=RV.c.copy(RV.hand).lerp(p,.5);mid.y-=Math.min(4,RV.hand.distanceTo(p)*.08);
 o.rope.geometry=new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(RV.hand.clone(),mid.clone(),p.clone()),20,.14,5,false);o.hook.position.copy(p);}
function startRescue(){if(RS.on)return;RS.on=true;G.rescued=true;mode.m='rescue';api.setFree(false);ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';autoBtn.style.display='none';
 if(!rsObjs)rsObjs=buildRescue();rsObjs.g.visible=true;rsObjs.hull.visible=rsObjs.me.visible=false;rsObjs.rope.visible=rsObjs.hook.visible=false;
 RS.lp=new THREE.Vector3(14,3,-55);rsObjs.lost.position.copy(RS.lp);RS.phase='alert';RS.t=0;RS.ox=30;RS.ox0=30;RS.pull=0;RS.miss=0;RS.hold=false;RS.aiming=false;
 [0,.5,1,1.5].forEach(d=>tone(880,.25,'square',.08,d));tone(660,.25,'square',.08,.25);tone(660,.25,'square',.08,.75);
 showPanel(`<div class="intro sos"><div class="big">🆘</div><h2>有太空人飄走了！</h2><p>📻「救命呀！我的安全繩斷了！」</p><p class="sub">快出去，用繩把他拉回來！</p><button class="btn go" id="b_eva">出去救他！🧑‍🚀</button></div>`,'small');
 $('#b_eva').onclick=()=>{SFX.click();goEva();};}
function goEva(){hidePanel();fade.textContent='🚪 氣閘門打開…';fade.classList.add('on');tone(200,.8,'sawtooth',.05,0,.4);
 setTimeout(()=>{api.cockpit.group.visible=false;rsObjs.hull.visible=rsObjs.me.visible=true;RS.cam0=new THREE.Vector3(0,1,-3);RS.cam1=new THREE.Vector3(10,7,20);RS.ct=0;RS.phase='enter';api.eva=true;cam.position.copy(RS.cam0);fade.classList.remove('on');},700);}
function evaHud(){const s=Math.max(0,Math.ceil(RS.ox));evaUI.innerHTML=`<div class="oxy ${s<=8?'low':''}">${clockSVG({sec:60-s,showMin:false,showHr:false,cls:'oxc'})}<div><small>氧氣還有</small><b>${s} 秒</b></div></div>
 <div class="evatip">${RS.phase==='aim'?'👆 按住拖動瞄準，放手就拋繩！':RS.phase==='throw'?'🪢 拋繩中…':RS.phase==='pull'?'💪 勾住了！快按「拉！」':''}</div>${RS.phase==='pull'?`<div class="pullbar"><i style="width:${RS.pull*100}%"></i></div>`:''}`;
 pullBtn.style.display=RS.phase==='pull'?'block':'none';}
const pullBtn=document.createElement('button');pullBtn.className='btn go bigtap';pullBtn.id='b_pull';pullBtn.innerHTML='拉！💪';pullBtn.style.cssText='display:none;position:fixed;left:50%;bottom:calc(14vh + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:40;min-width:200px;min-height:84px;font-size:30px;touch-action:none';document.body.appendChild(pullBtn);
RS.hold=false;pullBtn.addEventListener('pointerdown',e=>{e.preventDefault();try{pullBtn.setPointerCapture(e.pointerId);}catch(_){}RS.hold=true;RS.holdT=0;pullOnce();});
['pointerup','pointercancel','lostpointercapture','pointerleave'].forEach(n=>pullBtn.addEventListener(n,()=>{RS.hold=false;}));
pullBtn.addEventListener('click',e=>e.preventDefault());
function pullOnce(){if(RS.phase!=='pull')return;RS.pull=Math.min(1,RS.pull+.12);tone(300+RS.pull*500,.06,'triangle',.1);const bar=evaUI.querySelector('.pullbar i');if(bar)bar.style.width=RS.pull*100+'%';if(RS.pull>=1)saved();}
addEventListener('keydown',e=>{if(RS.on&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();if(RS.phase==='pull')pullOnce();else if(RS.phase==='aim')autoThrow();}});
let lastSec=-1;
function rescueUpdate(dt){const o=rsObjs;if(fireBtn.style.display!=='none'){fireBtn.style.display='none';firing=false;}RS.t+=dt;o.lost.rotation.x+=dt*.4;o.lost.rotation.z+=dt*.25;
 if(RS.phase==='alert'||RS.phase==='enter'||RS.phase==='aim'||RS.phase==='throw'){if((RS.miss||0)>=1){RV.c.set(6,2,-26);RS.lp.lerp(RV.c,Math.min(1,dt*.5*(RS.miss||0)));}else{RS.lp.x+=dt*.6;RS.lp.z-=dt*.4;if(RS.lp.z<-60){RS.lp.z=-60;}if(RS.lp.x>20)RS.lp.x=20;}}
 if(RS.phase==='enter'){RS.ct+=dt/1.4;const u=Math.min(1,RS.ct),e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2;cam.position.lerpVectors(RS.cam0,RS.cam1,e);if(u>=1){RS.phase='aim';evaPad.style.display=evaUI.style.display='block';evaHud();}}
 if(api.eva){ship.localToWorld(RV.a.set(2,0,-28));cam.lookAt(RV.a);}
 if(RS.phase==='pull'&&RS.hold){RS.holdT+=dt;if(RS.holdT>.22){RS.holdT=0;pullOnce();}}
 if(['aim','throw'].includes(RS.phase)){RS.ox-=dt;const s=Math.ceil(RS.ox);if(s!==lastSec){lastSec=s;evaHud();if(s<=5&&s>0)tone(1000,.05,'square',.05);}
  if(RS.ox<=0){RS.phase='retry';o.rope.visible=o.hook.visible=false;tone(330,.3,'sine',.1);
   evaUI.innerHTML=`<div class="evacard"><h3>差一點點！😅</h3><p>不要緊，氧氣補充了！給你 <b>40 秒</b>再試一次。</p><button class="btn go" id="b_rt">再試一次 💪</button></div>`;pullBtn.style.display='none';RS.aiming=false;aim.style.display='none';RS.miss=Math.max(RS.miss||0,2);$('#b_rt').onclick=()=>{RS.lp.set(8,2,-32);RS.ox=40;RS.ox0=70;RS.pull=0;RS.phase='aim';evaHud();};}}
 if(RS.phase==='throw'){RS.th+=dt/0.6;const u=Math.min(1,RS.th);RV.b.copy(RV.hand).lerp(RS.tgt,u);ropeTo(RV.b);
  if(u>=1){if(RS.near||RS.tgt.distanceTo(RS.lp)<20||(RS.miss||0)>=2){RS.phase='pull';RS.grab=RS.lp.clone();SFX.snap();evaHud();}else{RS.phase='back';RS.th=1;SFX.no();RS.miss=(RS.miss||0)+1;const tp=evaUI.querySelector('.evatip');if(tp)tp.textContent=RS.miss>=2?'他飄近了！下一次一定勾到 🎯':'差少少！瞄準 🆘 再拋一次 🎯';}}}
 if(RS.phase==='back'){RS.th-=dt/0.4;RV.b.copy(RV.hand).lerp(RS.tgt,Math.max(0,RS.th));ropeTo(RV.b);if(RS.th<=0){o.rope.visible=o.hook.visible=false;RS.phase='aim';}}
 if(RS.phase==='pull'){RS.lp.lerpVectors(RS.grab,RV.c.set(2.5,1.4,-6.5),RS.pull);ropeTo(RS.lp);}
 o.lost.position.copy(RS.lp);
 // SOS marker
 if(RS.phase!=='done'){o.lost.getWorldPosition(RV.a);RV.a.project(cam);const W=innerWidth,H=innerHeight;sosMark.style.display=RV.a.z<1&&RS.phase!=='pull'?'block':'none';sosMark.style.left=(RV.a.x*.5+.5)*W+'px';sosMark.style.top=(-RV.a.y*.5+.5)*H+'px';}}
evaPad.addEventListener('pointerdown',e=>{if(RS.phase!=='aim')return;evaPad.setPointerCapture(e.pointerId);RS.aiming=true;aim.style.display='block';aim.style.left=e.clientX+'px';aim.style.top=e.clientY+'px';});
evaPad.addEventListener('pointermove',e=>{if(!RS.aiming)return;aim.style.left=e.clientX+'px';aim.style.top=e.clientY+'px';});
evaPad.addEventListener('pointercancel',e=>{if(!RS.aiming)return;RS.aiming=false;aim.style.display='none';throwAt(RS.ax??e.clientX,RS.ay??e.clientY);});
evaPad.addEventListener('pointerdown',e=>{if(RS.phase==='pull'){RS.dy=e.clientY;RS.dragging=true;pullOnce();}});
evaPad.addEventListener('pointermove',e=>{if(RS.aiming){RS.ax=e.clientX;RS.ay=e.clientY;}if(RS.phase==='pull'&&RS.dragging&&Math.abs(e.clientY-RS.dy)>40){RS.dy=e.clientY;pullOnce();}});
addEventListener('pointerup',()=>{RS.dragging=false;});
evaPad.addEventListener('pointerup',e=>{if(!RS.aiming)return;RS.aiming=false;aim.style.display='none';throwAt(e.clientX,e.clientY);});
function autoThrow(){rsObjs.lost.getWorldPosition(RV.a);RV.a.project(cam);throwAt((RV.a.x*.5+.5)*innerWidth,(-RV.a.y*.5+.5)*innerHeight);}
function throwAt(x,y){if(RS.phase!=='aim')return;const rc=new THREE.Raycaster();rc.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,-(y/innerHeight)*2+1),cam);
 rsObjs.lost.getWorldPosition(RV.a);const n=cam.getWorldDirection(new THREE.Vector3());const pl=new THREE.Plane().setFromNormalAndCoplanarPoint(n,RV.a);const hit=new THREE.Vector3();if(!rc.ray.intersectPlane(pl,hit))return;
 RV.b.copy(RV.a).project(cam);const sx=(RV.b.x*.5+.5)*innerWidth,sy=(-RV.b.y*.5+.5)*innerHeight;RS.near=Math.hypot(sx-x,sy-y)<Math.max(130,Math.min(innerWidth,innerHeight)*.22)*(1+(RS.miss||0)*.8);
 RS.tgt=RS.near?RS.lp.clone():ship.worldToLocal(hit);RS.th=0;RS.phase='throw';rsObjs.rope.visible=rsObjs.hook.visible=true;tone(500,.3,'sawtooth',.05,0,2.5);evaHud();}
function saved(){RS.phase='done';RS.hold=false;pullBtn.style.display='none';evaPad.style.display=evaUI.style.display='none';sosMark.style.display='none';SFX.win();burst(evaUI,['⭐','🎉','✨']);
 setTimeout(()=>{fade.textContent='🚪 返回飛船…';fade.classList.add('on');setTimeout(()=>{rsObjs.g.visible=false;api.cockpit.group.visible=true;api.eva=false;cam.position.set(0,0,0);cam.rotation.set(0,0,0);fade.classList.remove('on');
  G.stars++;G.max++;G.fuel=Math.min(100,G.fuel+20);renderHud();
  showPanel(`<div class="intro thanks"><div class="big">🧑‍🚀💖</div><h2>謝謝你救了我！</h2><p>你在 <b>${Math.max(1,Math.round((RS.ox0||30)-RS.ox))} 秒</b>內完成救援！</p><p class="bonus">⭐ +1　⛽ +20</p><button class="btn go" id="b_cont">繼續飛行 🚀</button></div>`,'small');
  $('#b_cont').onclick=()=>{SFX.click();RS.on=false;mode.m='fly';hidePanel();ring.visible=guide.visible=true;flyhint.style.display='block';api.setFree(true,true);};},700);},900);}

// 時鐘內找秒針: observe a real running clock, tap the 秒針 (3 rounds, harder each time)
R.find=t=>{let round=0,wrong=0;const LBL={min:'這是分針：較粗、走得很慢',hr:'這是時針：最短、最粗'};
 const styles=[['wall','🕰️ 掛牆鐘'],['alarm','⏰ 鬧鐘'],['watch','⌚ 手錶']];
 const render=()=>{const r=round,n=r===2?3:1;const tip=['秒針是<b>紅色</b>的嗎？看看哪支針一格一格地跳！','三支針一樣顏色！看看哪支<b>最幼、最長</b>，<b>走得最快</b>？','三個不同的鐘，<b>每個</b>都找出秒针！'][r].replace('针','針');
  showPanel(`${head(t)}<p class="prompt">🔍 第 ${r+1} / 3 關：在鐘上找出<b>秒針</b>，按一按！</p><p class="sub">${tip}</p>
  <div class="fclocks n${n}">${Array.from({length:n},(_,i)=>{const st=r===2?styles[i]:['wall',''];const m=ri(0,59),h=ri(1,12);return `<div class="fclk ${st[0]}" data-i="${i}">${st[1]?`<div class="fcl">${st[1]}</div>`:''}${clockSVG({tap:true,sec:ri(0,59),min:m,hr:h,cls:'fc'})}<div class="fbadge"></div></div>`;}).join('')}</div>
  <div class="dots3">${[0,1,2].map(i=>`<i class="${i<r?'on':''}"></i>`).join('')}</div><div id="fb"></div>`);
  const boxes=[...panel.querySelectorAll('.fclk')];let found=0;
  boxes.forEach(bx=>{const svg=bx.querySelector('svg');if(r>=1)svg.querySelectorAll('.hand line:first-child').forEach(l=>l.setAttribute('stroke','#33415f'));if(r>=1)svg.querySelectorAll('circle[r="7"]').forEach(c=>c.setAttribute('fill','#33415f'));
   const H={};svg.querySelectorAll('.hand').forEach(g=>{H[g.dataset.hand]=g;const m=g.getAttribute('transform').match(/-?[\d.]+/);g._a=+m[0];});bx._H=H;bx._sec=Math.round(H.sec._a/6);
   svg.querySelectorAll('.hand').forEach(g=>g.addEventListener('pointerdown',e=>{e.preventDefault();if(t.finished||bx.classList.contains('done'))return;const k=g.dataset.hand,bd=bx.querySelector('.fbadge');
    if(k==='sec'){bx.classList.add('done');g.classList.add('glow');bd.textContent='最幼、最長、走得最快 ✔';bd.className='fbadge ok in';SFX.ok();burst(bd,['⭐','✨']);found++;
     if(found===boxes.length){round++;if(round>=3){t.miss=wrong>2?1:0;setTimeout(()=>finish(t,'你是觀察高手！<b>秒針最幼、最長、走得最快</b>，每秒走 1 小格。'),500);}else{fb(`<div class="fb good"><b>找到了！👍</b><p>準備下一關…</p></div>`);setTimeout(render,1500);}}}
    else{wrong++;SFX.no();g.classList.remove('wrongh');void g.offsetWidth;g.classList.add('wrongh');bd.textContent=LBL[k];bd.className='fbadge bad in';setTimeout(()=>{g.classList.remove('wrongh');if(!bx.classList.contains('done'))bd.className='fbadge';},1800);}}));});
  let t0=performance.now();const loop=now=>{if(!boxes[0].isConnected)return;const e=(now-t0)/1000,s=Math.floor(e);
   boxes.forEach(bx=>{const H=bx._H;rot(H.sec,(bx._sec+s)*6);rot(H.min,H.min._a+e*.1);rot(H.hr,H.hr._a+e*.008);});requestAnimationFrame(loop);};requestAnimationFrame(loop);};
 render();};

// ================= flight obstacles: asteroids to dodge =================
const rockGeo=new THREE.IcosahedronGeometry(1,1);{const p=rockGeo.attributes.position;for(let i=0;i<p.count;i++){const k=.8+Math.sin(p.getX(i)*5.1+p.getY(i)*3.7)*.15+Math.cos(p.getZ(i)*4.3)*.1;p.setXYZ(i,p.getX(i)*k,p.getY(i)*k,p.getZ(i)*k);}rockGeo.computeVertexNormals();}
const rocks=[],frags=[];let invul=0,shakeT=0;
const hitFlash=document.createElement('div');hitFlash.id='hitflash';document.body.appendChild(hitFlash);
function clearRocks(){if(typeof clearCombat==='function'&&bolts)clearCombat();rocks.forEach(r=>S.remove(r.m));rocks.length=0;frags.forEach(f=>S.remove(f.m));frags.length=0;}
function spawnRocks(a,b){clearRocks();if(!G)return;const n=5+G.si*3,dir=RV.a.copy(b).sub(a),L=dir.length();dir.normalize();const side=RV.b.copy(dir).cross(up).normalize();
 for(let i=0;i<n;i++){const f=.18+.7*(i+Math.random()*.6)/n;const m=new THREE.Mesh(rockGeo,new THREE.MeshStandardMaterial({color:0x8a7a6a,roughness:.95,emissive:0x000000}));const s=7+Math.random()*7;m.scale.set(s,s*(.75+Math.random()*.3),s);
  m.position.copy(a).addScaledVector(dir,L*f).addScaledVector(side,(Math.random()-.5)*60).addScaledVector(up,(Math.random()-.5)*10);m.rotation.set(Math.random()*6,Math.random()*6,0);S.add(m);
  rocks.push({m,r:s,big:false,v:dir.clone().multiplyScalar(-(4+Math.random()*6)).addScaledVector(side,(Math.random()-.5)*4),spin:new THREE.Vector3(Math.random(),Math.random(),Math.random()),front:true});}
 const nb=G.si>=1?2:1;for(let i=0;i<nb;i++){const f=nb===1?.5:.35+i*.3;const mat=new THREE.MeshStandardMaterial({color:0x8a6a58,roughness:1,emissive:0x501008});const m=new THREE.Mesh(rockGeo,mat);const s=24;m.scale.setScalar(s);
  m.position.copy(a).addScaledVector(dir,L*f);const gl=new THREE.Mesh(rockGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,.4,.2),side:THREE.BackSide,transparent:true,opacity:.85,depthWrite:false}));gl.scale.setScalar(1.12);m.add(gl);
  const cr=new THREE.Mesh(new THREE.IcosahedronGeometry(1.01,1),new THREE.MeshBasicMaterial({color:new THREE.Color(2,.8,.2),wireframe:true,transparent:true,opacity:.35}));m.add(cr);S.add(m);
  rocks.push({m,r:s,big:true,hp:3,v:dir.clone().multiplyScalar(-3),spin:new THREE.Vector3(.2,.3,.1),front:true,track:true});}}
const fwdV=new THREE.Vector3(),relV=new THREE.Vector3();
function rocksUpdate(dt){invul=Math.max(0,invul-dt);fwdV.set(0,0,-1).applyQuaternion(ship.quaternion);
 for(let i=rocks.length-1;i>=0;i--){const k=rocks[i];k.m.position.addScaledVector(k.v,dt);if(k.big&&k.track){relV.subVectors(k.m.position,ship.position);const dd=relV.length();if(dd<450&&relV.dot(fwdV)>0){k.m.position.lerp(RV.c.copy(fwdV).multiplyScalar(dd).add(ship.position),1-Math.exp(-dt*1.2));}}k.m.rotation.x+=k.spin.x*dt;k.m.rotation.y+=k.spin.y*dt;relV.subVectors(k.m.position,ship.position);const d=relV.length();
  const near=d<160&&relV.dot(fwdV)>0;k.m.material.emissive.setRGB(near?.5+.3*Math.sin(nav.t*12):0,near?.05:0,0);
  if(d<k.r+6&&invul<=0){if(k.big){rocks.splice(i,1);S.remove(k.m);hurtFuel(8);tone(90,.35,'sawtooth',.18,0,.4);continue;}rockHit(k,i);continue;}
  const front=relV.dot(fwdV)>0;if(k.front&&!front&&d<k.r+70&&G){G.dodge=(G.dodge||0)+1;}k.front=front;}
 for(let i=frags.length-1;i>=0;i--){const f=frags[i];f.t+=dt;f.m.position.addScaledVector(f.v,dt);f.m.rotation.x+=dt*4;f.m.scale.multiplyScalar(1-dt*.9);if(f.t>1){S.remove(f.m);frags.splice(i,1);}}}
function rockHit(k,i){invul=1.5;shakeT=.45;S.remove(k.m);rocks.splice(i,1);
 for(let j=0;j<6;j++){const m=new THREE.Mesh(rockGeo,k.m.material);m.scale.setScalar(k.r*.3);m.position.copy(k.m.position);S.add(m);frags.push({m,t:0,v:new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(60)});}
 if(G){G.fuel=Math.max(5,G.fuel-8);G.hits=(G.hits||0)+1;drawFuel();}tone(90,.35,'sawtooth',.18,0,.4);tone(140,.2,'square',.12,.05,.5);
 hitFlash.classList.remove('on');void hitFlash.offsetWidth;hitFlash.classList.add('on');
 const p=document.createElement('div');p.className='minus';p.textContent='⛽ -8';const g=fuelEl.getBoundingClientRect();p.style.left=g.right+8+'px';p.style.top=g.top+g.height/2+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),1100);}

// ================= v8: shooting, monsters, big rocks =================
const boltM=new THREE.MeshBasicMaterial({color:new THREE.Color(.6,2.6,3),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});const boltG=new THREE.CylinderGeometry(.35,.35,9,6);boltG.rotateX(Math.PI/2);
const bolts=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(boltG,boltM);m.visible=false;S.add(m);bolts.push({m,life:0,v:new THREE.Vector3()});}
let fireCd=0,fireSide=1,firing=false;const fireBtn=document.createElement('div');fireBtn.className='tb';fireBtn.id='bFire';fireBtn.innerHTML='🔫<b>發射</b>';document.body.appendChild(fireBtn);
if(api.touch)document.body.classList.add('touchdev');
fireBtn.addEventListener('touchstart',e=>{e.preventDefault();firing=true;fire();},{passive:false});fireBtn.addEventListener('touchend',()=>firing=false);fireBtn.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'){firing=true;fire();}});addEventListener('pointerup',()=>{if(!api.touch)firing=false;});
addEventListener('keydown',e=>{if(mode.m!=='fly')return;if(e.code==='Space'||e.code==='KeyJ'){e.preventDefault();firing=true;fire();}});addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='KeyJ')firing=false;});
addEventListener('mousedown',e=>{if(mode.m==='fly'&&e.button===0&&e.target.tagName==='CANVAS'){firing=true;fire();}});
const aimV=new THREE.Vector3(),tmpT=new THREE.Vector3();
function targetsList(){const L=[];monsters.forEach(m=>{if(m.alive)L.push({o:m,p:m.g.position,r:m.r});});rocks.forEach(k=>{if(k.big)L.push({o:k,p:k.m.position,r:k.r});});return L;}
function fire(){if(mode.m!=='fly'||fireCd>0)return;fireCd=.18;const b=bolts.find(b=>b.life<=0);if(!b)return;fwdV.set(0,0,-1).applyQuaternion(ship.quaternion);
 aimV.copy(fwdV);let best=null,bd=1e9;for(const t of targetsList()){tmpT.subVectors(t.p,ship.position);const d=tmpT.length();if(d>900)continue;const c=tmpT.dot(fwdV)/d;if(c>.94&&d<bd){bd=d;best=t;}}if(best)aimV.subVectors(best.p,ship.position).normalize();
 fireSide=-fireSide;b.m.position.set(fireSide*1.4,-1.2,-4).applyQuaternion(ship.quaternion).add(ship.position);b.v.copy(aimV).multiplyScalar(700).addScaledVector(api.vel,1);b.m.quaternion.setFromUnitVectors(RV.c.set(0,0,-1),aimV);b.m.visible=true;b.life=1.3;
 tone(1500,.09,'square',.05,0,.25);muzzle.classList.remove('on');void muzzle.offsetWidth;muzzle.classList.add('on');}
const muzzle=document.createElement('div');muzzle.id='muzzle';document.body.appendChild(muzzle);
// monsters
const MCOL=[0xff7ac8,0x7ad6ff,0xffc94d,0x9b7bff,0x6ef08a];const monsters=[];const goos=[];const gooM=new THREE.MeshBasicMaterial({color:new THREE.Color(.6,2,.4)});const gooG=new THREE.SphereGeometry(1.6,10,8);
for(let i=0;i<10;i++){const m=new THREE.Mesh(gooG,gooM);m.visible=false;S.add(m);goos.push({m,life:0,v:new THREE.Vector3()});}
function mkMonster(col){const g=new THREE.Group();const body=new THREE.MeshStandardMaterial({color:col,roughness:.4,emissive:col,emissiveIntensity:.35});
 const b=new THREE.Mesh(new THREE.SphereGeometry(4,20,14),body);b.scale.set(1,.9,1);g.add(b);const w=new THREE.MeshBasicMaterial({color:0xffffff}),k=new THREE.MeshBasicMaterial({color:0x111122});
 const eyes=Math.random()<.5?1:2;for(let i=0;i<eyes;i++){const sx=eyes===1?0:(i?1.4:-1.4);const e=new THREE.Mesh(new THREE.SphereGeometry(eyes===1?1.8:1.2,12,10),w);e.position.set(sx,1,3.3);g.add(e);const p=new THREE.Mesh(new THREE.SphereGeometry(eyes===1?.8:.55,8,6),k);p.position.set(sx,1,eyes===1?5:4.4);g.add(p);}
 const mo=new THREE.Mesh(new THREE.TorusGeometry(1,.25,6,12,Math.PI),k);mo.position.set(0,-1,3.7);mo.rotation.z=Math.PI;g.add(mo);
 const tents=[];for(let i=0;i<4;i++){const t=new THREE.Mesh(new THREE.CapsuleGeometry(.6,3,4,8),body);const a=i/4*Math.PI*2;t.position.set(Math.cos(a)*2.3,-4,Math.sin(a)*2.3);g.add(t);tents.push(t);}
 for(const sx of[-1,1]){const h=new THREE.Mesh(new THREE.ConeGeometry(.7,2,8),new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:.3}));h.position.set(sx*2,3.8,0);h.rotation.z=-sx*.4;g.add(h);}
 g.visible=false;S.add(g);return {g,tents,body,alive:false,hp:3,r:6,ph:0,off:new THREE.Vector3(),shootT:0};}
for(let i=0;i<5;i++)monsters.push(mkMonster(MCOL[i]));
const WV={on:false,t:0};const walert=document.createElement('div');walert.id='walert';document.body.appendChild(walert);
function startWave(){if(!G)return;G['wave'+G.si]=true;const n=3+Math.min(2,Math.floor(G.si/2));WV.on=true;WV.t=0;WV.left=n;
 walert.innerHTML='👾 怪獸來了！<b>射擊佢們！</b><small>'+(api.touch?'按右邊「🔫 發射」':'按 空白鍵／J／滑鼠左鍵 發射')+'</small>';walert.classList.remove('on');void walert.offsetWidth;walert.classList.add('on');
 [0,.2,.4].forEach((d,i)=>tone(400-i*60,.18,'square',.08,d));
 monsters.forEach((m,i)=>{m.alive=i<n;m.g.visible=i<n;m.hp=G.si<3?2:(i===0?2:3);m.ph=Math.random()*6;m.base=new THREE.Vector3((i-(n-1)/2)*16,(i%2?6:-3),-55-i*6);m.off.copy(m.base).add(new THREE.Vector3(0,20,-120));m.shootT=(G.si<3?4:2)+Math.random()*3;m.g.scale.setScalar(1);m.body.emissiveIntensity=.35;});}
function endWave(cleared){WV.on=false;if(cleared){SFX.win();G.stars++;G.max++;G.fuel=Math.min(100,G.fuel+15);renderHud();toast('🎉 全部怪獸打敗了！⭐ +1　⛽ +15');}else{toast('👾 怪獸飛走了… 下次再挑戰！');monsters.forEach(m=>{if(m.alive){m.leaving=true;}});setTimeout(()=>monsters.forEach(m=>{m.alive=false;m.leaving=false;m.g.visible=false;}),2500);}}
function popMonster(m){m.alive=false;G.monsters=(G.monsters||0)+1;SFX.star();tone(700,.15,'triangle',.12);tone(1100,.2,'triangle',.1,.08);
 for(let j=0;j<8;j++){const s=new THREE.Mesh(gemGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(MCOL[j%5]).multiplyScalar(1.6)}));s.position.copy(m.g.position);s.scale.setScalar(.6);S.add(s);frags.push({m:s,t:0,v:new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(70)});}
 m.g.visible=false;WV.left--;if(WV.left<=0)endWave(true);}
function hurtFuel(n,label){if(invul>0)return;invul=1;shakeT=.4;if(G){G.fuel=Math.max(5,G.fuel-n);drawFuel();}hitFlash.classList.remove('on');void hitFlash.offsetWidth;hitFlash.classList.add('on');
 const p=document.createElement('div');p.className='minus';p.textContent=label||('⛽ -'+n);const g=fuelEl.getBoundingClientRect();p.style.left=g.right+8+'px';p.style.top=g.top+g.height/2+'px';document.body.appendChild(p);setTimeout(()=>p.remove(),1100);}
function breakBig(k){const i=rocks.indexOf(k);if(i<0)return;rocks.splice(i,1);S.remove(k.m);G.rocksShot=(G.rocksShot||0)+1;tone(80,.4,'sawtooth',.16,0,.3);tone(220,.15,'square',.1,.05,.4);SFX.ok();
 for(let j=0;j<10;j++){const m=new THREE.Mesh(rockGeo,k.m.material);m.scale.setScalar(k.r*.28);m.position.copy(k.m.position);S.add(m);frags.push({m,t:0,v:new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(90)});}burst(fireBtn,['💥','✨']);toast('💥 射爆石頭！');}
function combatUpdate(dt){fireCd-=dt;if(firing&&fireCd<=0)fire();fireBtn.style.display=mode.m==='fly'&&api.touch?'flex':'none';
 // bolts
 for(const b of bolts){if(b.life<=0)continue;b.life-=dt;b.m.position.addScaledVector(b.v,dt);if(b.life<=0){b.m.visible=false;continue;}
  for(const t of targetsList()){if(b.m.position.distanceTo(t.p)<t.r+3){b.life=0;b.m.visible=false;const o=t.o;
    if(o.big){o.hp--;o.m.material.emissive.setRGB(1,.4,.1);tone(160,.12,'square',.12);setTimeout(()=>o.m&&o.m.material.emissive.setRGB(.25,0,0),120);o.m.scale.multiplyScalar(.93);if(o.hp<=0)breakBig(o);}
    else{o.hp--;o.body.emissiveIntensity=1.5;setTimeout(()=>o.body.emissiveIntensity=.35,120);tone(900,.08,'triangle',.1);if(o.hp<=0)popMonster(o);}break;}}}
 // monsters
 if(WV.on){WV.t+=dt;if(WV.t>25)endWave(false);}
 for(const m of monsters){if(!m.g.visible)continue;m.ph+=dt;if(m.leaving){m.off.y+=dt*80;}else{RV.b.copy(m.base).add(RV.c.set(Math.sin(m.ph*1.3)*12,Math.sin(m.ph*1.9)*5,Math.sin(m.ph*.7)*8));m.off.lerp(RV.b,1-Math.exp(-dt*2.5));}
  m.g.position.copy(m.off).applyQuaternion(ship.quaternion).add(ship.position);m.g.quaternion.copy(ship.quaternion);m.g.rotateY(Math.PI);m.g.rotation.z+=Math.sin(m.ph*3)*.1;m.tents.forEach((t,i)=>t.rotation.x=Math.sin(m.ph*5+i)*.5);
  if(m.alive&&!m.leaving){m.shootT-=dt;if(m.shootT<=0){m.shootT=(G.si<3?4.5:2.6)+Math.random()*3;const gb=goos.find(x=>x.life<=0);if(gb){gb.m.position.copy(m.g.position);gb.v.subVectors(ship.position,m.g.position).normalize().multiplyScalar(45).addScaledVector(api.vel,.9);gb.m.visible=true;gb.life=5;tone(250,.2,'sine',.08,0,.6);}}}}
 for(const gb of goos){if(gb.life<=0)continue;gb.life-=dt;gb.m.position.addScaledVector(gb.v,dt);gb.m.scale.setScalar(1+Math.sin(gb.life*10)*.15);if(gb.m.position.distanceTo(ship.position)<6){gb.life=0;hurtFuel(5,'💚 黏黏 ⛽ -5');tone(150,.3,'sine',.12,0,.5);}if(gb.life<=0)gb.m.visible=false;}
 // big rock hint
 if(G&&!G.bigHint){for(const k of rocks){if(k.big&&k.m.position.distanceTo(ship.position)<500){G.bigHint=true;toast('🪨🔴 閃不開！要射爆！'+(api.touch?'按「🔫 發射」':'按空白鍵發射'));break;}}}}
function clearCombat(){WV.on=false;monsters.forEach(m=>{m.alive=false;m.g.visible=false;});goos.forEach(g=>{g.life=0;g.m.visible=false;});bolts.forEach(b=>{b.life=0;b.m.visible=false;});firing=false;fireBtn.style.display='none';}

// ================= 計時星: work out elapsed seconds (textbook p79 style) =================
const lcd=(s,cls='')=>`<div class="lcd ${cls}"><span>00:${String(s).padStart(2,'0')}</span><i></i><i></i><i></i></div>`;
const mini=(sec,min,hr,cls='')=>clockSVG({sec,min,hr,cls:'mini '+cls});
const pair=(a,b)=>`<div class="pair"><div><small class="st">開始時間</small>${a}</div><b class="arr">➡</b><div><small class="en">結束時間</small>${b}</div></div>`;
function tiles(ans){return shuffle([ans,ans+5>59?ans-10:ans+5,Math.max(1,ans-5===ans?ans-3:ans-5)].filter((v,i,a)=>a.indexOf(v)===i));}
function tileDrop(t,ans,msg){const box=panel.querySelector('.tilerow');box.innerHTML=`<div class="useslot">用了 <span class="slotb" id="slotb">？</span> 秒</div><div class="tray">${tiles(ans).map(v=>`<div class="card ntile" data-v="${v}">${v}</div>`).join('')}</div>`;
 panel.querySelectorAll('.ntile').forEach(c=>{const drop=()=>{if(+c.dataset.v!==ans){miss(t,'再數一數亮起的小格！');return false;}SFX.snap();c.classList.add('placed');c.style.transform='';$('#slotb').replaceWith(c);finish(t,msg);return true;};
  draggable(c,(x,y)=>inside($('#slotb'),x,y)?drop():false);c.addEventListener('click',()=>{if(!c.classList.contains('placed'))drop();});});}
// (a) 秒針重播
R.replay=t=>{const s0=ri(0,11)*5,d=ri(2,9)*5+(Math.random()<.4?ri(1,4):0),s1=(s0+d)%60,m=ri(0,59),h=ri(1,12);const who=pick(['子賢','心悅','詠欣','小樂','家明']);
 showPanel(`${head(t)}<p class="prompt">✏️ ${who}寫數字 1 至 30。把秒針由<b>開始</b>撥到<b>結束</b>，數數用了多少秒！</p>${pair(mini(s0,m,h),mini(s1,m,h))}
 <div class="cbox">${clockSVG({sec:s0,min:m,hr:h,cls:'big'})}</div><div class="readout">秒針走了 <b id="cnt">0</b> 小格 = <b id="cnt2">0</b> 秒</div><div class="tilerow"></div><div id="fb"></div>`);
 const svg=panel.querySelectorAll('.clock')[2];let done=false;const tk=document.createElementNS('http://www.w3.org/2000/svg','circle');const a=s1*6*Math.PI/180;tk.setAttribute('cx',(Math.sin(a)*92).toFixed(1));tk.setAttribute('cy',(-Math.cos(a)*92).toFixed(1));tk.setAttribute('r','8');tk.setAttribute('fill','#2fb3e0');tk.setAttribute('class','tmark');svg.appendChild(tk);
 dragHand(svg,(k,cum)=>{if(done)return;const c=Math.min(59,cum);arcFrom(svg,s0,c);$('#cnt').textContent=c;$('#cnt2').textContent=c;if(c===d&&k===s1){done=true;SFX.star();fb(`<div class="fb good"><b>到了！</b><p>由 ${s0/5||12} 走到結束，共 ${d} 小格。</p></div>`);tileDrop(t,d,`${who}用了 <b>${d} 秒</b>。秒針走 1 小格是 1 秒！`);}},s0);};
function arcFrom(svg,s0,c){const p=svg.querySelector('.arc');if(c<=0){p.setAttribute('d','');}else{const a0=s0*6*Math.PI/180,a1=(s0+c)*6*Math.PI/180;p.setAttribute('d',`M${(Math.sin(a0)*90).toFixed(2)},${(-Math.cos(a0)*90).toFixed(2)} A90,90 0 ${c>30?1:0} 1 ${(Math.sin(a1)*90).toFixed(2)},${(-Math.cos(a1)*90).toFixed(2)}`);}
 svg.querySelectorAll('.tk').forEach(l=>{const i=+l.dataset.i,rel=(i-s0+60)%60;l.setAttribute('stroke',rel>0&&rel<=c?'#ff8a00':(i%5==0?'#3b4a6b':'#9aa7bd'));});}
// (b) 秒錶讀數
R.lcd=t=>{const s0=Math.random()<.6?0:ri(1,9),d=ri(8,40),s1=s0+d,who=pick(['心悅','子賢','詠欣','小樂']);let v=0;
 showPanel(`${head(t)}<p class="prompt">⏱️ ${who}用秒錶計時。拉動<b>燃料桿</b>到用了的秒數！</p>${pair(lcd(s0),lcd(s1,'end'))}
 <div class="gauge"><input type="range" id="gv" min="0" max="45" value="0"><div class="gnum"><b id="gn">0</b> 秒</div></div><button class="btn go" id="b_ok">確定 ✔</button><div id="fb"></div>`);
 const gv=$('#gv');gv.oninput=()=>{v=+gv.value;$('#gn').textContent=v;gv.style.setProperty('--p',v/45*100+'%');tone(400+v*15,.03,'square',.03);};
 $('#b_ok').onclick=()=>{if(t.finished)return;if(v===d)finish(t,`${s1} − ${s0} = <b>${d} 秒</b>。${who}用了 ${d} 秒！`);else miss(t,s0?`由 00:${String(s0).padStart(2,'0')} 到 00:${s1}，要減去開始的 ${s0} 秒喔。`:`秒錶由 00:00 開始，結束是 00:${s1}，用了多少秒？`);};};
// (d) 找結束時間
R.endpos=t=>{const s0=ri(0,11)*5,d=pick([10,15,20,25,30,35,40]),s1=(s0+d)%60,m=ri(0,59),h=ri(1,12);
 showPanel(`${head(t)}<p class="prompt">🎯 開始時秒針在這裏，<b>用了 ${d} 秒</b>。把秒針撥到<b>結束</b>的位置！</p><div class="cbox">${clockSVG({sec:s0,min:m,hr:h,cls:'big'})}</div><div class="readout">已走 <b id="cnt">0</b> 秒</div><button class="btn go" id="b_ok">確定 ✔</button><div id="fb"></div>`);
 const svg=panel.querySelector('.clock');let cum=0,k=s0;const g=svg.querySelector('[data-hand=sec]').cloneNode(true);g.removeAttribute('data-hand');g.setAttribute('opacity','.3');svg.insertBefore(g,svg.querySelector('[data-hand=sec]'));
 dragHand(svg,(kk,c)=>{k=kk;cum=c;arcFrom(svg,s0,Math.min(59,c));$('#cnt').textContent=Math.min(59,c);},s0);
 $('#b_ok').onclick=()=>{if(t.finished)return;if(k===s1)finish(t,`由開始走 ${d} 小格，秒針停在 ${s1===0?60:s1} 秒的位置。`);else miss(t,`現在走了 ${cum} 秒，要走 ${d} 秒。${cum<d?'再多走一點。':'走多了。'}`);};};
// (c) 頒獎台
document.addEventListener('pointerup',e=>{const z=document.querySelector('.kid .pair.zoom');if(z){z.classList.remove('zoom');return;}const p=e.target.closest&&e.target.closest('.kid .pair');if(p){p.classList.add('zoom');tone(700,.06);}});
R.podium=t=>{const names=shuffle([['子賢','👦'],['心悅','👧'],['詠欣','🧒']]);let ds=[];while(ds.length<3){const d=ri(3,11)*5-ri(0,2);if(!ds.includes(d)&&ds.every(x=>Math.abs(x-d)>=3))ds.push(d);}const m=ri(0,59),h=ri(1,12);
 const P=names.map((n,i)=>{const d=ds[i],dig=i===1;const s0=dig?0:ri(0,11)*5;return {n:n[0],e:n[1],d,dig,s0,s1:(s0+d)%60,ok:false,v:Math.max(1,d+pick([-7,-5,5,7]))};});
 showPanel(`${head(t)}<p class="prompt">🏆 三位小朋友寫數字 1 至 30。先算出各人<b>用了多少秒</b>，再把他們拖上頒獎台（<b>用時最短</b>是第 1 名）！</p>
 <div class="kids">${P.map((p,i)=>`<div class="kid" data-i="${i}"><div class="kh"><span class="ke">${p.e}</span><b>${p.n}</b></div>${pair(p.dig?lcd(p.s0):mini(p.s0,m,h),p.dig?lcd(p.s1,'end'):mini(p.s1,m,h))}
  <div class="kv"><button class="btn pm" data-d="-1">－</button><div class="pv"><b id="pv">${p.v}</b> 秒</div><button class="btn pm" data-d="1">＋</button><button class="btn go kok">✔</button></div></div>`).join('')}</div>
 <div class="podium"><div class="pd p2" data-r="2"><span>2</span></div><div class="pd p1" data-r="1"><span>1</span></div><div class="pd p3" data-r="3"><span>3</span></div></div><div id="fb"></div>`,'wide');
 let placed=0;const order=[...P].sort((a,b)=>a.d-b.d);
 panel.querySelectorAll('.kid').forEach(card=>{const p=P[+card.dataset.i];bindPicker(card,()=>p.v,x=>p.v=x);
  card.querySelector('.kok').onclick=()=>{if(p.ok)return;if(p.v===p.d){p.ok=true;SFX.snap();card.querySelector('.kv').innerHTML=`<div class="kdone">用了 <b>${p.d}</b> 秒 ✔</div>`;
    const tok=document.createElement('div');tok.className='ktoken';tok.innerHTML=`${p.e}<small>${p.n} ${p.d}秒</small>`;card.appendChild(tok);
    draggable(tok,(x,y)=>{const pd=[...panel.querySelectorAll('.pd')].find(e=>inside(e,x,y));if(!pd||pd.querySelector('.ktoken'))return false;const r=+pd.dataset.r;
     if(order[r-1]!==p){miss(t,`${p.n}用了 ${p.d} 秒。用的秒數<b>越少</b>＝越快，名次越前！`);return false;}SFX.ok();tok.classList.add('placed');tok.style.transform='';pd.appendChild(tok);burst(pd);
     if(++placed===3)finish(t,`${order[0].n}只用了 <b>${order[0].d} 秒</b>，用的時間<b>最短</b>，是第 1 名！`);return true;});
    if(P.every(q=>q.ok))fb('<div class="fb good"><b>全部算好了！</b><p>把小朋友拖上頒獎台吧 🏆</p></div>');}
   else miss(t,p.dig?'秒錶的結束數字減去開始數字。':'由開始的秒針位置，數一數走了多少小格。');};});};

// ================= alien encounter event =================
const AL={on:false};let alObj=null;
function buildUFO(){const g=new THREE.Group();const metal=new THREE.MeshStandardMaterial({color:0xb8c4dc,metalness:.6,roughness:.3,emissive:0x3a4870});
 const saucer=new THREE.Mesh(new THREE.SphereGeometry(6,28,14),metal);saucer.scale.set(1,.28,1);g.add(saucer);
 const dome=new THREE.Mesh(new THREE.SphereGeometry(3.2,20,12,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x9fe8ff,transparent:true,opacity:.35,metalness:.2,roughness:.05,emissive:0x2a6a8a,emissiveIntensity:.4}));dome.position.y=1;g.add(dome);
 const skin=new THREE.MeshStandardMaterial({color:0x7be36b,roughness:.5,emissive:0x2a6a20,emissiveIntensity:.5});const head=new THREE.Mesh(new THREE.SphereGeometry(1.4,18,12),skin);head.position.y=2.2;head.scale.set(1,1.1,1);g.add(head);
 const eyeM=new THREE.MeshBasicMaterial({color:0x111111}),hi=new THREE.MeshBasicMaterial({color:0xffffff});for(const sx of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.42,10,8),eyeM);e.position.set(sx*.55,2.4,1.15);g.add(e);const h=new THREE.Mesh(new THREE.SphereGeometry(.13,6,5),hi);h.position.set(sx*.55+.12,2.55,1.5);g.add(h);
  const an=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,1.2,5),skin);an.position.set(sx*.6,3.8,0);an.rotation.z=-sx*.4;g.add(an);const ab=new THREE.Mesh(new THREE.SphereGeometry(.25,8,6),new THREE.MeshBasicMaterial({color:0xffe066}));ab.position.set(sx*.85,4.4,0);g.add(ab);}
 const lights=[];const LC=[0xff4d6d,0xffd23f,0x5ee36b,0x4da3ff];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;const m=new THREE.Mesh(new THREE.SphereGeometry(.5,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(LC[i%4]).multiplyScalar(.5)}));m.position.set(Math.cos(a)*5.6,0,Math.sin(a)*5.6);m.userData.c=LC[i%4];g.add(m);lights.push(m);}
 const beamM=new THREE.MeshBasicMaterial({color:new THREE.Color(.8,1.6,2.4),transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending});const bubbles=[];for(let i=0;i<5;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.8,10,8),beamM);b.visible=false;ship.add(b);bubbles.push(b);}
 ship.add(g);return {g,lights,LC,bubbles};}
const LCN=['紅','黃','綠','藍'],LCC=['#ff4d6d','#ffd23f','#5ee36b','#4da3ff'];
function lightAll(on){alObj.lights.forEach(l=>l.material.color.set(l.userData.c).multiplyScalar(on?1.6:.5));}
function lightColor(ci,on){alObj.lights.forEach((l,i)=>{if(i%4===ci)l.material.color.set(l.userData.c).multiplyScalar(on?2.2:.5);});}
function startAlien(){if(AL.on)return;AL.on=true;G.alienMet=true;mode.m='alien';api.setFree(false);ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';autoBtn.style.display='none';
 if(!alObj)alObj=buildUFO();alObj.g.visible=true;AL.p=new THREE.Vector3(-30,-4,-160);AL.goal=new THREE.Vector3(-9,-2.5,-28);AL.mode='arrive';AL.t=0;alObj.g.position.copy(AL.p);lightAll(true);
 [0,.15,.3].forEach((d,i)=>tone(600+i*300,.2,'sine',.1,d));tone(1200,.4,'triangle',.08,.5);
 showPanel(`<div class="intro alien"><div class="big">👽</div><h2>突發！遇到外星人！</h2><p>📻「咕嚕咕嚕…嗶嗶？」</p><p class="sub">你會怎樣做？</p>
 <div class="opts achoice"><button class="btn ac atk" id="a_atk">⚔️ 攻擊</button><button class="btn ac lv" id="a_lv">💨 離開</button><button class="btn ac fr" id="a_fr">🤝 做朋友</button></div></div>`,'small');
 $('#a_atk').onclick=alienAttack;$('#a_lv').onclick=alienLeave;$('#a_fr').onclick=alienFriend;}
function alienUpdate(dt){AL.t+=dt;const o=alObj;
 if(AL.mode==='arrive'||AL.mode==='stay'){AL.p.lerp(AL.goal,1-Math.exp(-dt*1.5));}
 if(AL.mode==='flee'){AL.p.add(RV.b.set(30,22,-25).multiplyScalar(dt*(1+AL.t*2)));}
 if(AL.mode==='behind'){AL.p.add(RV.b.set(-4,0,60).multiplyScalar(dt*(1+AL.t*1.5)));}
 if(AL.mode==='bye'){AL.p.add(RV.b.set(8,6,-30).multiplyScalar(dt*(.5+AL.t)));}
 o.g.position.copy(AL.p);o.g.position.y+=Math.sin(AL.t*2.2)*.6;o.g.rotation.y+=dt*(AL.mode==='flee'?6:.8);o.g.rotation.z=Math.sin(AL.t*1.4)*.08;
 if(AL.shots){AL.st+=dt;o.bubbles.forEach((b,i)=>{const u=(AL.st-i*.12)/.5;b.visible=u>0&&u<1;if(b.visible){b.position.set(0,-1.5,-4).lerp(AL.p,u);b.scale.setScalar(1+u*1.5);}});if(AL.st>1.2){AL.shots=false;o.bubbles.forEach(b=>b.visible=false);}}}
function alienEnd(html){showPanel(html,'small');$('#a_go').onclick=()=>{SFX.click();alObj.g.visible=false;AL.on=false;mode.m='fly';hidePanel();ring.visible=guide.visible=true;flyhint.style.display='block';api.setFree(true,true);};}
function alienAttack(){SFX.click();AL.shots=true;AL.st=0;[0,.12,.24,.36].forEach(d=>tone(900,.12,'sine',.08,d,.5));setTimeout(()=>{lightAll(false);tone(300,.4,'triangle',.1,0,2.5);AL.mode='flee';AL.t=0;},650);
 G.fuel=Math.max(15,G.fuel-8);setTimeout(()=>{renderHud();alienEnd(`<div class="intro"><div class="big">😨💨</div><h2>外星人嚇走了…</h2><p>未了解對方就攻擊，並不友善喔。</p><p class="sub">⛽ −8　下次試試先打招呼吧！</p><button class="btn go" id="a_go">繼續飛行 🚀</button></div>`);},1300);hidePanel();}
function alienLeave(){SFX.click();hidePanel();AL.mode='behind';AL.t=0;tone(180,.9,'sawtooth',.06,0,3);toast('💨 加速閃避！');
 setTimeout(()=>alienEnd(`<div class="intro"><div class="big">🚀</div><h2>你安全離開了</h2><p class="sub">外星人留在後面，揮揮手。</p><button class="btn go" id="a_go">繼續飛行 🚀</button></div>`),1400);}
function alienFriend(){SFX.click();AL.mode='stay';let round=0,seq=[],inp=[],busy=false;
 const ui=()=>{showPanel(`<div class="intro"><div class="badge">🤝 打招呼</div><h3>外星人用燈光說「你好」！</h3><p class="sub" id="ast">看清楚燈光的次序，再照樣按一次。</p>
  <div class="lpads">${LCC.map((c,i)=>`<button class="lp" data-c="${i}" style="--c:${c}">${LCN[i]}</button>`).join('')}</div><div class="dots3">${[0,1].map(i=>`<i class="${i<round?'on':''}"></i>`).join('')}</div></div><div id="fb"></div>`,'small');
  panel.querySelectorAll('.lp').forEach(b=>b.onpointerdown=e=>{e.preventDefault();if(busy)return;const c=+b.dataset.c;flash(c,b);inp.push(c);
   if(c!==seq[inp.length-1]){busy=true;SFX.no();$('#ast').innerHTML='咕嚕？不太對…再看一次 👀';setTimeout(play,900);return;}
   if(inp.length===seq.length){busy=true;SFX.ok();round++;if(round>=2)return friendDone();$('#ast').innerHTML='嗶嗶！對了！再來一個更長的！';setTimeout(()=>{seq.push(ri(0,3));AL.seq=seq;ui();play();},1000);}});};
 const flash=(c,b)=>{lightColor(c,true);tone([523,659,784,988][c],.25,'triangle',.12);b=b||panel.querySelector(`.lp[data-c="${c}"]`);b&&b.classList.add('on');setTimeout(()=>{lightColor(c,false);b&&b.classList.remove('on');},380);};
 const play=async()=>{busy=true;inp=[];lightAll(false);$('#ast')&&($('#ast').innerHTML='👀 看清楚燈光…');await sleep(600);for(const c of seq){if(!AL.on)return;flash(c);await sleep(650);}busy=false;$('#ast')&&($('#ast').innerHTML='輪到你了！照樣按 👆');};
 seq=[ri(0,3),ri(0,3),ri(0,3)];AL.seq=seq;ui();play();}
function friendDone(){lightAll(true);SFX.win();G.alienFriend=true;G.stars++;G.max++;G.fuel=Math.min(100,G.fuel+20);renderHud();AL.mode='stay';
 setTimeout(()=>{alienEnd(`<div class="intro"><div class="big">👽🤝🧑‍🚀</div><h2>我們交了新朋友！</h2><p>外星人送你禮物：</p><p class="bonus">⭐ +1　⛽ +20　👽 友誼貼紙</p><button class="btn go" id="a_go">揮手道別，繼續飛行 👋</button></div>`);
  const b=$('#a_go'),f=b.onclick;},400);setTimeout(()=>{const b=$('#a_go');if(b){const f=b.onclick;b.onclick=()=>{AL.mode='bye';AL.t=0;f();setTimeout(()=>{alObj.g.visible=false;},3000);};}},450);}

// ---------------- result ----------------
function result(){G.done=true;mode.m='result';api.setMission('任務完成！');renderHud();const pct=G.max?G.stars/G.max:0,medal=pct>=.9?'🏆':pct>=.7?'🥇':pct>=.5?'🥈':'🥉';
 const rows=Object.keys(SKILL).filter(k=>G.stat[k]).map(k=>{const [a,b]=G.stat[k];return {k,a,b,good:a/b>=.75};});const weak=rows.filter(r=>!r.good),nm=G.name||'小太空人';
 const ai=weak.length?`<p>${nm}，你在 <b>${rows.filter(r=>r.good).map(r=>SKILL[r.k]).join('、')||'努力嘗試'}</b> 表現很好！</p><p>可以再多練習：</p><ul>${weak.map(r=>`<li><b>${SKILL[r.k]}</b>：${TIP[r.k]}</li>`).join('')}</ul>`:`<p>${nm}，太厲害了！每一項都掌握得很好！記得計時要<b>誠實、公平</b>啊！</p>`;
 const SELF=['我會認出秒針','我會看鐘讀秒','我知道 60 秒 = 1 分鐘','我會用秒錶計時','我知道估計和實測可能不同','我會誠實記錄結果','我會計算用了多少秒'];
 showPanel(`<div class="result"><div class="big">${medal}</div><h2>${G.name?G.name+'的':''}成績表</h2><p class="score">⭐ ${G.stars} / ${G.max}　💎 ${G.gems}</p><p class="sub">🪨 閃避石頭 ${G.dodge||0} 次　💥 撞到 ${G.hits||0} 次<br>👾 打敗怪獸 ${G.monsters||0}　🪨 射爆石頭 ${G.rocksShot||0}</p>
 <div class="skills">${rows.map(r=>`<div class="sk ${r.good?'g':'w'}"><span>${r.good?'✅':'💪'} ${SKILL[r.k]}</span><span>${r.a}/${r.b}</span></div>`).join('')}</div>
 ${G.alienFriend||G.rescued?`<p class="stick">${G.rescued?'<span>🧑‍🚀 救援英雄</span>':''}${G.alienFriend?'<span>👽 外星朋友</span>':''}</p>`:''}<div class="ai"><h3>🤖 AI 小助手的建議</h3>${ai}</div>
 <div class="selfev"><h3>📝 自我評估：我學會了…</h3>${SELF.map((s,i)=>`<div class="se"><span>${s}</span><span class="faces" data-i="${i}"><button>😀</button><button>😐</button><button>🙁</button></span></div>`).join('')}</div>
 <div class="opts two"><button class="btn go" id="b_again">🔄 再玩一次</button></div><div class="opts two endch"><button class="btn go home" id="b_home">🌍 飛返地球</button><button class="btn alt" id="b_free">🚀 自由太空探索</button></div></div>`,'wide');
 panel.querySelectorAll('.faces').forEach(f=>f.querySelectorAll('button').forEach(b=>b.onclick=()=>{SFX.click();f.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');G.self[f.dataset.i]=b.textContent;}));
 $('#b_again').onclick=()=>{SFX.click();newGame(G.name);fly.docked=null;renderHud();briefing();};
 $('#b_free').onclick=()=>{SFX.click();explore();};$('#b_home').onclick=()=>{SFX.click();startHome();};}
$('#gbtn').onclick=start;$('#gfree').onclick=()=>{ac();$('#start').style.display='none';explore();};
// ---- after the result: fly home to Earth, or free exploration
function startHome(){hidePanel();nav.warned=false;if(G)G.fuel=100;renderHud();fly.docked=null;mode.m='fly';nav.key='earth';nav.name='地球';nav.t=0;nav.start.copy(ship.position);standoff('earth',tP,tL);nav.dist0=ship.position.distanceTo(tP);
 api.setSpeedMul(Math.max(1,Math.min(12,nav.dist0/1600)));ring.visible=guide.visible=true;
 gems.forEach(g=>S.remove(g));gems.length=0;for(let i=1;i<=5;i++){const g=new THREE.Mesh(gemGeo,gemMat);g.position.copy(nav.start).lerp(tP,i/6.5).add(new THREE.Vector3((Math.random()-.5)*40,(Math.random()-.5)*30,(Math.random()-.5)*40));S.add(g);gems.push(g);}
 flyhint.style.display='block';api.setFree(true,true);SFX.go();autoBtn.style.display='none';pcard.style.display=backBtn.style.display='none';
 flyhint.innerHTML=`🌍 <b>飛返地球</b>！跟着<span class="y">黃色箭咀</span>，飛進<span class="c">光圈</span>就到家了！<span class="ctl">${api.touch?'左邊搖桿：前進／轉彎・右下「加速」':'W／↑ 前進・A D／← → 轉彎・Shift 加速'}</span>`;}
function homeArrive(){mode.m='home';ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';autoBtn.style.display='none';api.setFree(false);api.setSpeedMul(1);gems.forEach(g=>S.remove(g));gems.length=0;api.setMission('歡迎回家！');SFX.win&&SFX.win();SFX.star();
 const conf=Array.from({length:18},(_,i)=>`<i style="left:${Math.random()*100}%;animation-delay:${(Math.random()*1.2).toFixed(2)}s">${['🎉','⭐','✨','🎊','💫'][i%5]}</i>`).join('');
 showPanel(`<div class="home"><div class="confetti">${conf}</div><div class="big">🧑‍🚀🏠</div><h2>任務完成，歡迎回家！</h2>
 <p class="prompt">${G&&G.name?G.name+'，':''}你成功駕駛飛船飛返地球！🌍</p><p class="sub">你是一位守時又誠實的小太空人！${G?`　⭐ ${G.stars}　💎 ${G.gems}`:''}</p>
 <div class="opts two"><button class="btn go" id="h_again">🔄 再玩一次</button><button class="btn alt" id="h_free">🚀 自由探索</button></div></div>`);
 $('#h_again').onclick=()=>{SFX.click();newGame(G?G.name:'');fly.docked=null;renderHud();briefing();};$('#h_free').onclick=()=>{SFX.click();explore();};}
const FACTS=[{n:'太陽',e:'☀️',f:'太陽是一顆會發光發熱的恆星。'},{n:'金星',e:'🟡',f:'金星是天空中最光的行星之一。'},{n:'地球',e:'🌍',f:'地球是我們的家，有水和空氣。'},{n:'月球',e:'🌙',f:'月球圍着地球轉，約一個月轉一圈。'},
 {n:'火星',e:'🔴',f:'火星是紅色的，因為表面有很多鐵鏽。'},{n:'木星',e:'🟠',f:'木星是太陽系最大的行星。'},{n:'土星',e:'🪐',f:'土星有一個又大又美麗的光環。'},{n:'海王星',e:'🔵',f:'海王星離太陽很遠，非常寒冷。'},{n:'北斗衛星',e:'🛰️',f:'北斗衛星幫我們定位、導航和授時。'},{n:'太空站',e:'🛸',f:'太空人在太空站裏生活和做實驗。'}];
const bodies=(api.bodies||[]).map(b=>({...b,...FACTS.find(f=>f.n===b.n)}));bodies.push({o:sats[0],r:12,...FACTS[8]});
const pcard=document.createElement('div');pcard.id='pcard';document.body.appendChild(pcard);
const backBtn=document.createElement('button');backBtn.id='backres';backBtn.className='btn alt';document.body.appendChild(backBtn);
backBtn.onclick=()=>{SFX.click();mode.m='idle';pcard.style.display=backBtn.style.display='none';api.setFree(false);api.setSpeedMul(1);flyhint.style.display='none';
 if(G&&G.done)result();else location.reload();};
let near=null,exT=0;
function explore(){hidePanel();fly.docked=null;fly.on=false;mode.m='explore';ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';autoBtn.style.display='none';
 api.setSpeedMul(3);api.setFree(true,true);api.setMission('自由太空探索');backBtn.textContent=G&&G.done?'↩ 返回成績表':'↩ 返回主頁';backBtn.style.display='block';near=null;exT=0;
 flyhint.innerHTML=`🚀 <b>自由太空探索</b>：飛近星球，看看小知識！<span class="ctl">${api.touch?'左邊搖桿：前進／轉彎・右下「加速」':'W／↑ 前進・A D／← → 轉彎・Shift 加速'}</span>`;flyhint.style.display='block';setTimeout(()=>{if(mode.m==='explore')flyhint.style.display='none';},6000);}
const bp=new THREE.Vector3();
const tst=document.createElement('div');tst.id='toast';document.body.appendChild(tst);let tsT=0;
function toast(h){tst.innerHTML=h;tst.style.display='block';tst.classList.remove('in');void tst.offsetWidth;tst.classList.add('in');clearTimeout(tsT);tsT=setTimeout(()=>tst.style.display='none',2600);}
function exploreUpdate(dt){exT+=dt;if(exT<.25)return;exT=0;let best=null,bd=1e9;
 for(const b of bodies){b.o.getWorldPosition(bp);const d=bp.distanceTo(ship.position)-b.r;if(d<Math.max(250,b.r*2.5)&&d<bd){bd=d;best=b;}}
 if(best!==near){near=best;if(best){pcard.innerHTML=`<b>${best.e} ${best.n}</b><span>${best.f}</span>`;flyhint.style.display='none';pcard.style.display='block';pcard.classList.remove('in');void pcard.offsetWidth;pcard.classList.add('in');SFX.click();}else pcard.style.display='none';}
 api.setMission(near?`附近：${near.n}`:'自由太空探索');}

$('#gmute').onclick=e=>{muted=!muted;e.currentTarget.textContent=muted?'🔇':'🔊';};
let dbgNoRescue=false;const dbg={stationTasks,autoThrow,pullBtn,startWave,fire,monsters,WV,set firing(v){firing=v;},rocks,spawnRocks,rockHit,undock(){fly.docked=null;fly.on=false;mode.m='idle';},startAlien,AL,startRescue,RS,throwAt,pullOnce,set noRescue(v){dbgNoRescue=v;},startHome,homeArrive,explore,get G(){return G;},mode,start,result,runTask,arrive,startFlight,glideTo,stationDone,nav,R,
 setSi(i){G.si=i;renderHud();},dock(i){G.si=i;renderHud();mode.m='dock';ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';api.setFree(false);glideTo(STATIONS[i].key,.05);},
 task(kind,extra={}){const t={kind,title:'',skill:'hand',...extra};G.tasks=[t];G.ti=0;t.miss=0;t.finished=false;R[kind](t);}};
return {update,shake:()=>{if(shakeT>0){shakeT-=1/60;return shakeT*.28;}return 0;},api_eva:()=>api.eva,get speed(){return speed;},dbg};
}
