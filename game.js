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
 tick:()=>tone(1500,.03,'square',.05),gem:()=>{tone(1568,.08,'triangle',.12);tone(2093,.15,'triangle',.12,.06);},
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
const SEC_ACTS=[['眨一下眼','👁️'],['拍手 10 下','👏'],['穿好外套','🧥'],['跑 50 米','🏃'],['刷牙','🪥'],['跳繩 20 下','🤸'],['打一個噴嚏','🤧'],['寫自己的名字','✏️']];
const MIN_ACTS=[['吃午餐','🍱'],['上一節課','📚'],['由家步行上學','🚶'],['看一套卡通片','📺'],['做功課','📝'],['踢一場足球','⚽']];
const MC={hand:[['時鐘上哪一支針走得<b>最快</b>？',['秒針','分針','時針'],'<b>秒針走得最快</b>，它走 1 小格只需 1 秒。'],['時鐘上<b>最幼、最長</b>的針是甚麼針？',['秒針','時針','分針'],'最幼、最長、走得最快的是<b>秒針</b>。'],['<b>秒</b>和<b>分鐘</b>比較，哪個是較小的時間單位？',['秒','分鐘','一樣'],'<b>秒是比分鐘小的時間單位</b>，用來量度較短的時間。']],
 rel:[['秒針走<b>一圈</b>，是多少秒？',['60 秒','12 秒','100 秒'],'秒針走一圈是 <b>60 小格</b>，即 <b>60 秒</b>。'],['<b>1 分鐘</b> 和 <b>50 秒</b>，哪個時間較長？',['1 分鐘','50 秒','一樣長'],'1 分鐘 = 60 秒，比 50 秒長。'],['<b>2 分鐘</b> 等於多少秒？',['120 秒','20 秒','200 秒'],'1 分鐘 = 60 秒，2 分鐘 = <b>120 秒</b>。']],
 hon:[['小明實際跑了 <b>10 秒</b>，秒錶只記錄了 <b>8 秒</b>。這個成績可信嗎？',['不可信，秒錶提早按停了','可信，秒錶顯示 8 秒','可信，因為小美是好朋友'],'小美在小明<b>未到終點就按停</b>，記錄不真實，所以<b>不可信</b>，對其他同學也不公平。'],['如果你是計時員，你應該怎樣做？',['到終點才按停，誠實記錄','幫好朋友少計幾秒','隨便寫一個時間'],'計時員要<b>誠實</b>：完成動作才按停，如實記錄。'],['計時員忘記按停秒錶，最好怎樣做？',['誠實說出來，請同學再跑一次','隨便寫一個時間','寫一個最快的時間'],'出錯不要緊，要<b>誠實說出來</b>，重新量度才公平。']],
 bd:[['<b>北斗衛星導航系統</b>是由哪個國家自主建設的？',['中國','美國','日本'],'北斗衛星導航系統由<b>中國自主建設、獨立運行</b>。'],['為甚麼國家要自己建設北斗系統？',['科技安全是國家安全的重要部分','因為衛星很好看','因為想放煙花'],'<b>科技安全是國家安全的重要領域</b>，自己建設就不用依賴別人。'],['以下哪一項<b>是</b>北斗衛星提供的服務？',['定位、導航和授時','煮飯','打機'],'北斗提供<b>定位、導航和授時（準確時間）</b>服務。']]};
const mcTask=(skill,pool)=>{const [p,o,e]=pick(MC[pool]);return {kind:'mc',skill,title:'快問快答',prompt:p,opts:o,explain:e};};

const STATIONS=[{name:'秒針星',emoji:'🪐',task:'認識秒針',key:'venus'},{name:'讀秒星',emoji:'🔴',task:'看鐘讀秒',key:'mars'},{name:'秒錶站',emoji:'⏱️',task:'秒錶計時',key:'jupiter'},
 {name:'誠信星',emoji:'🤝',task:'誠實與公平',key:'saturn'},{name:'北斗站',emoji:'🛰️',task:'北斗衛星與時間',key:'beidou'}];
function stationTasks(i){
 if(i===0)return [...shuffle([{kind:'fix',skill:'hand',title:'修理太空鐘'},{kind:'catch',skill:'hand',title:'捉住最快的針'}]),{kind:'sort',skill:'unit',title:'時間單位分類'},mcTask('hand','hand')];
 if(i===1){const a=ri(2,11)*5,b=pick([3,7,13,18,22,28,33,41,47,52,56]);return [{kind:'drag',skill:'read',title:'撥秒針',target:a},{kind:'drag',skill:'read',title:'撥秒針',target:b},{kind:'fuel',skill:'relation',title:'燃料裝載'},{kind:'match',skill:'relation',title:'配對任務'},mcTask('relation','rel')];}
 if(i===2)return [{kind:'watch',skill:'watch',title:'引擎點火',mode:'look',target:ri(5,8)},{kind:'suit',skill:'watch',title:'太空人穿太空衣'},{kind:'record',skill:'watch',title:'記錄成績'},{kind:'watch',skill:'watch',title:'估計挑戰',mode:'blind',target:ri(3,6)}];
 if(i===3)return [{kind:'race',skill:'honest',title:'誠實計時員'},{kind:'board',skill:'honest',title:'記分牌'},{kind:'spot',skill:'honest',title:'找出不公平的行為'},mcTask('honest','hon')];
 return [{kind:'orbit',skill:'beidou',title:'北斗衛星上軌道'},{kind:'sync',skill:'beidou',title:'北斗授時'},mcTask('beidou','bd')];}
const SKILL={hand:'辨認秒針',read:'看鐘讀秒',relation:'秒和分鐘的關係',unit:'選擇時間單位',watch:'秒錶計時',honest:'誠實與公平',beidou:'北斗衛星（國安）'};
const TIP={hand:'秒針是最幼、最長、走得最快的紅色針。',read:'由 12 開始數小格，1 小格就是 1 秒；每個數字之間有 5 小格。',relation:'60 秒 = 1 分鐘，秒針走一圈就是 60 秒。',
 unit:'很短的事情（眨眼、拍手）用「秒」；較長的事情（吃飯、上課）用「分鐘」。',watch:'聽到「開始」才按開始，完成動作才按停止，記錄「約＿秒」。',honest:'計時要誠實，提早按停會令成績不可信，對別人不公平。',beidou:'北斗由中國自主建設，提供定位、導航和授時（準確時間）。'};

// =====================================================================
export function initGame(api){
const {ship,targets,S}=api;
// ---- Beidou satellites around Earth
const bdPiv=new THREE.Object3D();targets.earthPiv.add(bdPiv);bdPiv.position.copy(targets.earth.position);
const gold=new THREE.MeshStandardMaterial({color:0xd8a640,metalness:1,roughness:.3}),pan=new THREE.MeshStandardMaterial({color:0x1a3a8a,metalness:.5,roughness:.3,emissive:0x0a1a40});
const sats=[];for(let i=0;i<3;i++){const g=new THREE.Group();g.add(new THREE.Mesh(new THREE.BoxGeometry(3,3,4),gold));for(const sx of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(8,.2,3),pan);p.position.x=sx*6;g.add(p);}
 const a=i/3*Math.PI*2;g.position.set(Math.cos(a)*105,(i-1)*18,Math.sin(a)*105);g.lookAt(0,0,0);g.scale.setScalar(1.4);bdPiv.add(g);sats.push(g);}
const tgtObj={earth:targets.earth,venus:targets.venus,mars:targets.mars,jupiter:targets.jupiter,saturn:targets.saturn,beidou:sats[0]};
const tgtR={earth:60,venus:55,mars:40,jupiter:190,saturn:150,beidou:7};
const up=new THREE.Vector3(0,1,0),m4=new THREE.Matrix4(),qT=new THREE.Quaternion(),BP=new THREE.Vector3(),tP=new THREE.Vector3(),tL=new THREE.Vector3(),v1=new THREE.Vector3();
function standoff(key,outP,outL){const o=tgtObj[key],r=tgtR[key];o.getWorldPosition(BP);const toSun=v1.copy(BP).multiplyScalar(-1).normalize().applyAxisAngle(up,.7);
 const portrait=innerWidth<innerHeight*.9,pf=portrait?1.7:1;outP.copy(BP).addScaledVector(toSun,(key==='beidou'?30:r*3.4)*pf).addScaledVector(up,key==='beidou'?6:r*.5);
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
 gems.forEach(g=>{g.rotation.y+=dt*2;g.rotation.x+=dt;});
 if(fly.on){fly.t+=dt;const u=Math.min(1,fly.t/fly.dur),e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;standoff(fly.key,tP,tL);
  const mid=fly.p0.clone().lerp(tP,.5).addScaledVector(up,fly.p0.distanceTo(tP)*.1);
  const p=fly.p0.clone().multiplyScalar((1-e)*(1-e)).addScaledVector(mid,2*(1-e)*e).addScaledVector(tP,e*e);
  fly.last.copy(ship.position);ship.position.copy(p);speed=fly.last.distanceTo(p)/Math.max(dt,1e-3);
  lookQ(ship.position,u<.8?tP.clone().lerp(tL,u/.8):tL,qT);ship.quaternion.copy(fly.q0).slerp(qT,Math.min(1,u*1.5));
  if(u>=1){fly.on=false;fly.docked=fly.key;speed=0;fly.key==='earth'?homeArrive():arrive();}return true;}
 if(fly.docked){standoff(fly.docked,tP,tL);ship.position.copy(tP);lookQ(tP,tL,qT);ship.quaternion.slerp(qT,Math.min(1,dt*4));speed=0;return true;}
 if(mode.m==='fly')navUpdate(dt);else if(mode.m==='explore')exploreUpdate(dt);
 return false;}
// manual flight: ring at next station, arrow, distance, assist
function startFlight(){const s=STATIONS[G.si];mode.m='fly';nav.key=s.key;nav.name=s.name;nav.t=0;nav.start.copy(ship.position);standoff(s.key,tP,tL);nav.dist0=ship.position.distanceTo(tP);
 api.setSpeedMul(Math.max(1,Math.min(3.5,nav.dist0/3000)));ring.visible=guide.visible=true;
 gems.forEach(g=>S.remove(g));gems.length=0;for(let i=1;i<=5;i++){const g=new THREE.Mesh(gemGeo,gemMat);g.position.copy(nav.start).lerp(tP,i/6.5).add(new THREE.Vector3((Math.random()-.5)*40,(Math.random()-.5)*30,(Math.random()-.5)*40));S.add(g);gems.push(g);}
 hidePanel();flyhint.style.display='block';api.setFree(true,true);SFX.go();autoBtn.style.display='none';
 flyhint.innerHTML=`🚀 飛往 <b>第 ${G.si+1} 站 ${s.emoji} ${s.name}</b>：跟着<span class="y">黃色箭咀</span>，飛進<span class="c">光圈</span>！<span class="ctl">${api.touch?'左邊搖桿：前進／轉彎・右下「加速」':'W／↑ 前進・A D／← → 轉彎・Shift 加速'}</span>`;}
const proj=new THREE.Vector3();
function navUpdate(dt){nav.t+=dt;standoff(nav.key,tP,tL);ring.position.copy(tP);ring.lookAt(ship.position);const pul=1+Math.sin(nav.t*4)*.05;ring.scale.setScalar(pul);ring2.rotation.z+=dt;
 const pa=lineG.attributes.position.array;v1.set(0,-6,-20).applyQuaternion(ship.quaternion).add(ship.position);pa[0]=v1.x;pa[1]=v1.y;pa[2]=v1.z;pa[3]=tP.x;pa[4]=tP.y;pa[5]=tP.z;lineG.attributes.position.needsUpdate=true;guide.computeLineDistances();
 // gentle steering assist toward the ring
 lookQ(ship.position,tP,qT);ship.quaternion.slerp(qT,1-Math.exp(-.45*dt));
 const d=ship.position.distanceTo(tP);
 for(let i=gems.length-1;i>=0;i--)if(gems[i].position.distanceTo(ship.position)<30){S.remove(gems[i]);gems.splice(i,1);G.gems++;SFX.gem();renderHud();}
 if(d<RR*1.3){mode.m='dock';ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';api.setFree(false);api.setSpeedMul(1);gems.forEach(g=>S.remove(g));gems.length=0;SFX.star();glideTo(nav.key,1.6);return;}
 if(nav.t>45&&autoBtn.style.display==='none')autoBtn.style.display='block';
 // screen marker / edge arrow
 proj.copy(tP).project(api.cam);const behind=v1.copy(tP).applyMatrix4(api.cam.matrixWorldInverse).z>0;const W=innerWidth,H=innerHeight;
 let x=(proj.x*.5+.5)*W,y=(-proj.y*.5+.5)*H;const on=!behind&&x>40&&x<W-40&&y>70&&y<H-40;
 if(on){mark.style.display='block';arrow.style.display='none';mark.style.left=x+'px';mark.style.top=y+'px';mark.querySelector('span').textContent=`${nav.name} ${Math.round(d)}`;}
 else{mark.style.display='none';arrow.style.display='block';let dx=x-W/2,dy=y-H/2;if(behind){dx=-dx;dy=-dy;if(Math.abs(dx)<1&&Math.abs(dy)<1)dy=1;}
  const ang=Math.atan2(dy,dx),k=Math.min((W/2-60)/Math.abs(Math.cos(ang)||1e-3),(H/2-80)/Math.abs(Math.sin(ang)||1e-3));
  arrow.style.left=(W/2+Math.cos(ang)*k)+'px';arrow.style.top=(H/2+Math.sin(ang)*k)+'px';arrow.querySelector('i').style.transform=`rotate(${ang}rad)`;arrow.querySelector('span').textContent=Math.round(d);}
 if(nav.t-nav.lastUi>.4){nav.lastUi=nav.t;api.setMission(`往 ${nav.name} 還有 ${Math.round(d)}`);}}
autoBtn.onclick=()=>{SFX.click();if(mode.m!=='fly')return;mode.m='dock';ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';autoBtn.style.display='none';api.setFree(false);api.setSpeedMul(1);gems.forEach(g=>S.remove(g));gems.length=0;
 glideTo(nav.key,Math.min(7,Math.max(3,ship.position.distanceTo(tP)/900)));};

// ---------------- UI shell ----------------
const panel=$('#panel'),hud=$('#ghud');
function showPanel(html,cls=''){panel.className='show '+cls;panel.innerHTML=html;panel.scrollTop=0;}
function hidePanel(){panel.className='';panel.innerHTML='';}
function renderHud(){if(!G){hud.style.display='none';return;}hud.style.display='flex';$('#gstars').innerHTML=`⭐ ${G.stars}<small> 💎 ${G.gems}</small>`;
 $('#gsteps').innerHTML=STATIONS.map((s,i)=>`<span class="dot ${i<G.si?'done':i===G.si?'now':''}">${i<G.si?'✓':s.emoji}<em>${s.name}</em></span>`).join('<b class="ln"></b>');}
function newGame(nm){G={name:nm,si:0,stars:0,max:0,gems:0,stat:{},ti:0,tasks:[],self:{},rec:{}};}
function start(){ac();SFX.click();newGame(($('#gname')?.value||'').trim().slice(0,12));$('#start').style.display='none';renderHud();briefing();}
function briefing(){const s=STATIONS[G.si];api.setMission(`飛往 ${s.name}`);
 showPanel(`<div class="intro"><div class="badge">第 ${G.si+1} 站</div><h2>${s.emoji} ${s.name}</h2><p>任務：<b>${s.task}</b></p><p class="sub">${G.si===0?'你是太空小隊長！親自駕駛飛船，飛進光圈就到站。':'下一站在等你！'}</p><button class="btn go" id="b_go">出發 🚀</button></div>`,'small');
 $('#b_go').onclick=()=>{SFX.click();startFlight();};}
function arrive(){mode.m='mission';const s=STATIONS[G.si];G.tasks=stationTasks(G.si);G.ti=0;api.setMission(`第${G.si+1}站 ${s.name}`);
 showPanel(`<div class="intro"><div class="badge">到站了！</div><h2>${s.emoji} 歡迎來到${s.name}</h2><p>今次有 <b>${G.tasks.length}</b> 個任務，完成就有 ⭐！</p><button class="btn go" id="b_go">開始任務 ▶</button></div>`,'small');
 $('#b_go').onclick=()=>{SFX.click();runTask();};}
function head(t){const s=STATIONS[G.si];return `<div class="qhead"><span>${s.emoji} ${t.title}</span><span>${G.ti+1} / ${G.tasks.length}</span></div>`;}
// task harness: render(t, done) ; done(firstTryOk) ; mistakes tracked with t.miss
function runTask(){if(G.ti>=G.tasks.length)return stationDone();const t=G.tasks[G.ti];t.miss=0;t.finished=false;(R[t.kind])(t);}
function miss(t,msg){t.miss++;SFX.no();fb(`<div class="fb bad"><b>再試一次 🤔</b><p>${msg}</p></div>`);}
function fb(h){const f=$('#fb');if(f){f.innerHTML=h;}}
function finish(t,msg,ok=true){if(t.finished)return;t.finished=true;const st=G.stat[t.skill]||(G.stat[t.skill]=[0,0]);st[1]++;G.max++;const star=ok&&t.miss===0;if(star){st[0]++;G.stars++;}
 SFX[star?'ok':'click']();renderHud();fb(`<div class="fb good"><b>${star?'完成！⭐ +1':'完成了！👍'}</b><p>${msg}</p><button class="btn go" id="b_n">下一個任務 ▶</button></div>`);
 $('#b_n').onclick=()=>{SFX.click();G.ti++;runTask();};$('#fb').scrollIntoView({block:'nearest'});}
function stationDone(){G.si++;renderHud();SFX.win();const last=G.si>=STATIONS.length;
 showPanel(`<div class="intro"><div class="big">🎉</div><h2>本站任務完成！</h2><p>⭐ <b>${G.stars}</b>　💎 <b>${G.gems}</b></p>${last?'<button class="btn go" id="b_go">看看我的成績 🏆</button>':`<p>下一站：${STATIONS[G.si].emoji} <b>${nav.name}</b><br><span class="sub">這次由你親自駕駛！</span></p><button class="btn go" id="b_go">駕駛飛船出發 🚀</button>`}</div>`,'small');
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
function dragHand(svg,cb){const sh=svg.querySelector('[data-hand=sec]');let cur=0,cum=0,act=false;svg.style.touchAction='none';
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
 <div class="sw"><div class="swdial ${blind?'blind':''}">${clockSVG({sec:0,showMin:false,showHr:false})}<div class="cover">🙈<br>心裏數</div></div><div class="swnum ${blind?'blind':''}" id="swn">0.0 秒</div><div class="flame" id="flame">🔥</div></div>
 <div class="opts two"><button class="btn start" id="sw_s">開始</button><button class="btn stop" id="sw_p" disabled>停止</button></div><div id="fb"><p class="sub">機會：${3-t.att} 次</p></div>`);
 const svg=panel.querySelector('.clock'),sh=svg.querySelector('[data-hand=sec]');let t0=0,raf=0,lastS=-1;const num=$('#swn');
 const tick=()=>{const e=(performance.now()-t0)/1000;num.textContent=e.toFixed(1)+' 秒';rot(sh,e*6);const s=Math.floor(e);if(s!==lastS){lastS=s;if(!blind)SFX.tick();}raf=requestAnimationFrame(tick);};
 $('#sw_s').onclick=()=>{ac();SFX.click();t0=performance.now();lastS=-1;$('#sw_s').disabled=true;$('#sw_p').disabled=false;raf=requestAnimationFrame(tick);};
 $('#sw_p').onclick=()=>{cancelAnimationFrame(raf);const e=(performance.now()-t0)/1000;$('#sw_p').disabled=true;num.textContent=e.toFixed(1)+' 秒';num.classList.remove('blind');panel.querySelector('.swdial').classList.remove('blind');rot(sh,e*6);
  const ok=Math.abs(e-t.target)<=(blind?1:.5);t.att++;
  if(ok||t.att>=3){if(ok){if(!blind)$('#flame').classList.add('on');}else t.miss++;finish(t,`秒錶顯示 <b>${e.toFixed(1)} 秒</b>，目標 ${t.target} 秒。${blind?'<br>估計和實際量度<b>可能不同</b>，多練習會越來越準！':ok?'引擎點火成功！🔥':''}`,true);}
  else{t.miss++;SFX.no();fb(`<div class="fb bad"><b>${e<t.target?'太快了！':'太慢了！'}</b><p>秒錶顯示 <b>${e.toFixed(1)} 秒</b>，目標 ${t.target} 秒。${blind?'心裏慢慢數：「1 秒、2 秒…」':'看着秒針走到第 '+t.target+' 小格就按停。'}</p><button class="btn go" id="b_r">再試一次</button></div>`);$('#b_r').onclick=()=>{SFX.click();R.watch(t);};}};};
// 太空人穿太空衣: start at the call, stop when fully dressed
R.suit=t=>{const T=ri(6,9);const parts=['👕 太空衣','🧤 手套','👢 靴子','🪖 頭盔'];
 showPanel(`${head(t)}<p class="prompt">太空人要穿好太空衣。你做計時員：<br>聽到「<b>開始</b>」才按開始，<b>穿好</b>才按停止！</p>
 <div class="suit"><div class="astro" id="astro">🧍</div><div class="parts">${parts.map(p=>`<span>${p}</span>`).join('')}</div><div class="call" id="call">準備…</div></div>
 <div class="sw small"><div class="swnum" id="swn">0.0 秒</div></div><div class="opts two"><button class="btn start" id="sw_s">開始</button><button class="btn stop" id="sw_p" disabled>停止</button></div><div id="fb"><button class="btn alt" id="b_ready">我準備好了 👍</button></div>`);
 let called=false,dressed=false,tCall=0,tDone=0,t0=0,raf=0,timers=[];const num=$('#swn'),call=$('#call');
 const reset=msg=>{timers.forEach(clearTimeout);cancelAnimationFrame(raf);miss(t,msg);setTimeout(()=>{if(!t.finished)R.suit(t);},2200);};
 $('#b_ready').onclick=()=>{SFX.click();fb('');const pre=ri(1500,2800);timers.push(setTimeout(()=>{called=true;tCall=performance.now();call.textContent='開始！';call.classList.add('go');SFX.call();
  parts.forEach((p,i)=>timers.push(setTimeout(()=>{panel.querySelectorAll('.parts span')[i]?.classList.add('on');SFX.snap();},T*1000*(i+1)/parts.length-250)));
  timers.push(setTimeout(()=>{dressed=true;tDone=performance.now();const a=$('#astro');if(a)a.textContent='👨‍🚀';call.textContent='穿好了！✅';call.classList.remove('go');call.classList.add('done');},T*1000));},pre));};
 $('#sw_s').onclick=()=>{if(!called)return reset('太早了！要<b>聽到「開始」才按開始</b>，這樣才公平。');t0=performance.now();$('#sw_s').disabled=true;$('#sw_p').disabled=false;const tk=()=>{num.textContent=((performance.now()-t0)/1000).toFixed(1)+' 秒';raf=requestAnimationFrame(tk);};tk();SFX.click();};
 $('#sw_p').onclick=()=>{if(!dressed)return reset('還未穿好！要<b>完成動作才按停止</b>。');cancelAnimationFrame(raf);const e=(performance.now()-t0)/1000;num.textContent=e.toFixed(1)+' 秒';$('#sw_p').disabled=true;
  const late=(performance.now()-tDone)/1000;G.rec.suit=e;if(late>2)t.miss++;finish(t,`秒錶顯示 <b>${e.toFixed(1)} 秒</b>。${late>2?'下次穿好就要立即按停啊！':'你在對的時候開始和停止，做得好！'}`);};};
// 記錄成績 約 N 秒
R.record=t=>{const e=G.rec.suit??7.4,n=Math.round(e);let v=ri(0,1)?n+ri(2,4):Math.max(1,n-ri(2,4));
 showPanel(`${head(t)}<p class="prompt">剛才秒錶顯示 <b>${e.toFixed(1)} 秒</b>。<br>在記錄表寫上「約＿秒」吧！</p><div class="sheet">📋 太空人穿太空衣：${picker(v)}</div><button class="btn go" id="b_ok">寫好了 ✔</button><div id="fb"></div>`);
 bindPicker(panel,()=>v,x=>v=x);$('#b_ok').onclick=()=>{if(t.finished)return;if(v===n)finish(t,`${e.toFixed(1)} 秒最接近 ${n} 秒，所以記錄「<b>約 ${n} 秒</b>」。`);else miss(t,`${e.toFixed(1)} 秒最接近哪個整數？用 ＋／－ 調整。`);};};
// 誠實計時員: alien race + temptation
R.race=t=>{const T=ri(7,10)+Math.random()*.5;const lanes=[['👽','小藍',1],['🐙','小八',T/(T-1.2)],['🤖','機機',T/(T+1.5)]];G.rec.race=null;
 showPanel(`${head(t)}<p class="prompt">你是 <b>👽 小藍</b> 的計時員！聽到「開始」按開始，小藍<b>衝過終點</b>才按停止。</p>
 <div class="track">${lanes.map((l,i)=>`<div class="lane"><span class="nm">${l[1]}</span><span class="runner" id="rn${i}">${l[0]}</span><span class="fin">🏁</span></div>`).join('')}<div class="call" id="call">準備…</div></div>
 <div class="sw small"><div class="swnum" id="swn">0.0 秒</div></div><div class="opts two"><button class="btn start" id="sw_s">開始</button><button class="btn stop" id="sw_p" disabled>停止</button></div><div id="fb"><button class="btn alt" id="b_ready">我準備好了 👍</button></div><div class="tempt" id="tempt"></div>`);
 let called=false,tCall=0,raceT=0,paused=false,last=0,t0=0,swT=0,running=false,raf=0,tempted=false,honest=true,finishedRace=false;const num=$('#swn');
 const loop=now=>{if(!panel.contains(num))return;const dt=(now-last)/1000;last=now;if(!paused){raceT+=dt;if(running)swT+=dt;}
  lanes.forEach((l,i)=>{const f=Math.min(1,raceT/(T/l[2]));const el=$('#rn'+i);if(el)el.style.left=`calc(${f*100}% * .82 + 8%)`;});
  if(running)num.textContent=swT.toFixed(1)+' 秒';
  if(!tempted&&raceT>T*.55){tempted=true;paused=true;$('#tempt').innerHTML=`<div class="tbox"><div class="who">🐙 小八悄悄說：</div><p>「小藍是我的好朋友！<b>幫我提早按停啦</b>，他就可以入隊！」</p><div class="opts"><button class="btn opt" id="t_no">不可以！我要誠實計時 🙅</button><button class="btn opt" id="t_yes">好吧…</button></div></div>`;
   $('#t_no').onclick=()=>{SFX.ok();$('#tempt').innerHTML='';paused=false;};$('#t_yes').onclick=()=>{honest=false;SFX.no();$('#tempt').innerHTML=`<div class="tbox"><p>⚠️ 提早按停，成績就<b>不可信</b>，對其他參賽者<b>不公平</b>！我們還是要誠實計時。</p><button class="btn go" id="t_ok">明白了，繼續</button></div>`;$('#t_ok').onclick=()=>{$('#tempt').innerHTML='';paused=false;};};}
  if(raceT>=T&&!finishedRace){finishedRace=true;}
  raf=requestAnimationFrame(loop);};
 $('#b_ready').onclick=()=>{SFX.click();fb('');setTimeout(()=>{called=true;const c=$('#call');if(!c)return;c.textContent='開始！';c.classList.add('go');SFX.call();last=performance.now();raf=requestAnimationFrame(loop);},ri(1200,2400));};
 $('#sw_s').onclick=()=>{if(!called){miss(t,'太早了！要<b>聽到「開始」</b>才按。');return;}running=true;swT=raceT;$('#sw_s').disabled=true;$('#sw_p').disabled=false;SFX.click();};
 $('#sw_p').onclick=()=>{if(paused)return;if(!finishedRace){miss(t,'小藍<b>還未到終點</b>！不可以提早按停，要等他衝過終點。');return;}running=false;$('#sw_p').disabled=true;cancelAnimationFrame(raf);
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

// ---------------- result ----------------
function result(){G.done=true;mode.m='result';api.setMission('任務完成！');renderHud();const pct=G.max?G.stars/G.max:0,medal=pct>=.9?'🏆':pct>=.7?'🥇':pct>=.5?'🥈':'🥉';
 const rows=Object.keys(SKILL).filter(k=>G.stat[k]).map(k=>{const [a,b]=G.stat[k];return {k,a,b,good:a/b>=.75};});const weak=rows.filter(r=>!r.good),nm=G.name||'小太空人';
 const ai=weak.length?`<p>${nm}，你在 <b>${rows.filter(r=>r.good).map(r=>SKILL[r.k]).join('、')||'努力嘗試'}</b> 表現很好！</p><p>可以再多練習：</p><ul>${weak.map(r=>`<li><b>${SKILL[r.k]}</b>：${TIP[r.k]}</li>`).join('')}</ul>`:`<p>${nm}，太厲害了！每一項都掌握得很好！記得計時要<b>誠實、公平</b>啊！</p>`;
 const SELF=['我會認出秒針','我會看鐘讀秒','我知道 60 秒 = 1 分鐘','我會用秒錶計時','我會誠實記錄結果'];
 showPanel(`<div class="result"><div class="big">${medal}</div><h2>${G.name?G.name+'的':''}成績表</h2><p class="score">⭐ ${G.stars} / ${G.max}　💎 ${G.gems}</p>
 <div class="skills">${rows.map(r=>`<div class="sk ${r.good?'g':'w'}"><span>${r.good?'✅':'💪'} ${SKILL[r.k]}</span><span>${r.a}/${r.b}</span></div>`).join('')}</div>
 <div class="ai"><h3>🤖 AI 小助手的建議</h3>${ai}</div>
 <div class="selfev"><h3>📝 自我評估：我學會了…</h3>${SELF.map((s,i)=>`<div class="se"><span>${s}</span><span class="faces" data-i="${i}"><button>😀</button><button>😐</button><button>🙁</button></span></div>`).join('')}</div>
 <div class="opts two"><button class="btn go" id="b_again">🔄 再玩一次</button></div><div class="opts two endch"><button class="btn go home" id="b_home">🌍 飛返地球</button><button class="btn alt" id="b_free">🚀 自由太空探索</button></div></div>`,'wide');
 panel.querySelectorAll('.faces').forEach(f=>f.querySelectorAll('button').forEach(b=>b.onclick=()=>{SFX.click();f.querySelectorAll('button').forEach(x=>x.classList.remove('on'));b.classList.add('on');G.self[f.dataset.i]=b.textContent;}));
 $('#b_again').onclick=()=>{SFX.click();newGame(G.name);fly.docked=null;renderHud();briefing();};
 $('#b_free').onclick=()=>{SFX.click();explore();};$('#b_home').onclick=()=>{SFX.click();startHome();};}
$('#gbtn').onclick=start;$('#gfree').onclick=()=>{ac();$('#start').style.display='none';explore();};
// ---- after the result: fly home to Earth, or free exploration
function startHome(){hidePanel();fly.docked=null;mode.m='fly';nav.key='earth';nav.name='地球';nav.t=0;nav.start.copy(ship.position);standoff('earth',tP,tL);nav.dist0=ship.position.distanceTo(tP);
 api.setSpeedMul(Math.max(1,Math.min(3.5,nav.dist0/3000)));ring.visible=guide.visible=true;
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
function exploreUpdate(dt){exT+=dt;if(exT<.25)return;exT=0;let best=null,bd=1e9;
 for(const b of bodies){b.o.getWorldPosition(bp);const d=bp.distanceTo(ship.position)-b.r;if(d<b.r*5+150&&d<bd){bd=d;best=b;}}
 if(best!==near){near=best;if(best){pcard.innerHTML=`<b>${best.e} ${best.n}</b><span>${best.f}</span>`;flyhint.style.display='none';pcard.style.display='block';pcard.classList.remove('in');void pcard.offsetWidth;pcard.classList.add('in');SFX.click();}else pcard.style.display='none';}
 api.setMission(near?`附近：${near.n}`:'自由太空探索');}

$('#gmute').onclick=e=>{muted=!muted;e.currentTarget.textContent=muted?'🔇':'🔊';};
const dbg={startHome,homeArrive,explore,get G(){return G;},mode,start,result,runTask,arrive,startFlight,glideTo,stationDone,nav,R,
 setSi(i){G.si=i;renderHud();},dock(i){G.si=i;renderHud();mode.m='dock';ring.visible=guide.visible=false;flyhint.style.display='none';arrow.style.display=mark.style.display='none';api.setFree(false);glideTo(STATIONS[i].key,.05);},
 task(kind,extra={}){const t={kind,title:'',skill:'hand',...extra};G.tasks=[t];G.ti=0;t.miss=0;t.finished=false;R[kind](t);}};
return {update,get speed(){return speed;},dbg};
}
