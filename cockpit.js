// Procedural first-person cockpit: smooth lathe/tube geometry + high-res canvas instrument screens. No downloads.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export function buildCockpit({R,ship,bodies,touch}){
const G=new THREE.Group();G.name='cockpit';ship.add(G);
const aniso=R.capabilities.getMaxAnisotropy();
// ---- materials
const hull=new THREE.MeshStandardMaterial({color:0x48525e,metalness:.55,roughness:.42,envMapIntensity:1.6});
const hullDark=new THREE.MeshStandardMaterial({color:0x252b33,metalness:.65,roughness:.4,envMapIntensity:1.4});
const trim=new THREE.MeshStandardMaterial({color:0xb9c2cc,metalness:1,roughness:.22});
const accent=new THREE.MeshBasicMaterial({color:new THREE.Color(.25,.8,1.3)});
const amber=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,1.1,.3)});
// subtle brushed/leather-like fine-grain roughness texture (high-res, mipmapped) for the console skin
{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');const im=x.createImageData(512,512);
 for(let i=0;i<im.data.length;i+=4){const y=(i/4/512)|0;const v=150+Math.random()*40+Math.sin(y*.9)*6;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}x.putImageData(im,0,0);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(8,2);t.anisotropy=aniso;hull.roughnessMap=t;}
const add=(geo,mat,par=G)=>{const m=new THREE.Mesh(geo,mat);par.add(m);return m;};
// ---- helper: smooth 2D profile from rounded polyline
function smooth(pts,rad,seg=10){const out=[];for(let i=0;i<pts.length;i++){const p=pts[i];if(i==0||i==pts.length-1){out.push(new THREE.Vector2(...p));continue;}
 const a=new THREE.Vector2(...pts[i-1]),b=new THREE.Vector2(...p),c=new THREE.Vector2(...pts[i+1]);
 const r=Math.min(rad,a.distanceTo(b)/2,c.distanceTo(b)/2);const p0=b.clone().add(a.clone().sub(b).normalize().multiplyScalar(r)),p2=b.clone().add(c.clone().sub(b).normalize().multiplyScalar(r));
 const q=new THREE.QuadraticBezierCurve(p0,b,p2);out.push(...q.getPoints(seg));}return out;}
const SPAN=2.5,PH0=Math.PI-SPAN/2;
// ---- main curved dashboard (lathe around the pilot) : lip -> instrument slope -> hood -> front skirt
const dashProf=smooth([[.5,-.75],[.47,-.56],[.52,-.51],[.74,-.45],[.98,-.445],[1.07,-.465],[1.1,-.75],[1.1,-1.1]],.035,10);
const dash=add(new THREE.LatheGeometry(dashProf,160,PH0,SPAN),hull);
// soft glowing lip strip + chrome trim along the dashboard edges
const arc=(r,y,a0=PH0,len=SPAN,n=120)=>{const pts=[];for(let i=0;i<=n;i++){const a=a0+len*i/n;pts.push(new THREE.Vector3(r*Math.sin(a),y,r*Math.cos(a)));}return new THREE.CatmullRomCurve3(pts);};
add(new THREE.TubeGeometry(arc(.478,-.545),200,.005,12),accent);
add(new THREE.TubeGeometry(arc(.515,-.514),200,.008,12),trim);
add(new THREE.TubeGeometry(arc(1.0,-.444),200,.01,12),trim);add(new THREE.TubeGeometry(arc(.985,-.44),200,.003,8),accent);
// ---- footwell / floor so nothing shows through below the console
add(new THREE.LatheGeometry(smooth([[0,-1.05],[.7,-1.05],[.72,-.98],[.5,-.75]],.05,8),96),hullDark);
// ---- side consoles (lower, wrapping beside the seat)
for(const s of [-1,1]){const prof=smooth([[.42,-.95],[.4,-.66],[.46,-.6],[.7,-.58],[.74,-.7],[.74,-.95]],.03,8);
 const g=new THREE.LatheGeometry(prof,64,s>0?Math.PI/2-.95:Math.PI*1.5-.15,1.1);add(g,hull);}
// ---- canopy frame: smooth tubes (rounded struts), all meeting in a roof arch
const strut=(pts,r=.028)=>{const c=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),false,'centripetal');add(new THREE.TubeGeometry(c,96,r,20),hullDark);add(new THREE.TubeGeometry(c,96,r*.35,10),trim).position.set(0,0,0);return c;};
const pa=.78;// pillar angle
for(const s of [-1,1]){const x0=Math.sin(Math.PI+s*pa)*1.03,z0=Math.cos(Math.PI+s*pa)*1.03;
 strut([[x0,-.32,z0],[x0*1.02,.15,z0*.95],[x0*.88,.62,z0*.55],[x0*.6,.86,-.05],[x0*.45,.9,.45]],.035);}
strut([[-.95,.5,-.05],[-.6,.84,-.1],[0,.95,-.12],[.6,.84,-.1],[.95,.5,-.05]],.03);
// ---- canopy glass: fresnel tint + faint diagonal reflection streaks (additive, no download)
const glassMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.BackSide,
 vertexShader:'varying vec3 vn,vp;void main(){vp=position;vec4 mv=modelViewMatrix*vec4(position,1.);vn=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}',
 fragmentShader:`varying vec3 vn,vp;void main(){vec3 d=normalize(vp);float f=pow(1.-abs(d.z),4.)*.035+pow(max(d.y,0.),5.)*.03;
 float st=smoothstep(.0,.02,abs(fract((d.x*1.3+d.y)*1.6)-.5)-.44);float streak=(1.-smoothstep(.0,.006,abs(fract((d.x*1.3+d.y)*1.2)-.5)-.47))*.02*smoothstep(.1,.7,d.y);
 gl_FragColor=vec4(vec3(.45,.65,.9)*(f+streak),1.);}`});
add(new THREE.SphereGeometry(1.06,96,48,Math.PI*.5,Math.PI,0,Math.PI*.62),glassMat).rotation.y=Math.PI;
// ---- instrument screens: curved, high-res canvas, glow
const scale=Math.min(2,Math.max(1,devicePixelRatio));const screens=[];
function screen(w,h,ang,el,r,res){const c=document.createElement('canvas');c.width=res*scale;c.height=Math.round(res*h/w)*scale;
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=aniso;tex.generateMipmaps=false;tex.minFilter=THREE.LinearFilter; // no mipmap rebuild on every redraw
 const g=new THREE.PlaneGeometry(w,h,32,1);const p=g.attributes.position;const rr=.9;for(let i=0;i<p.count;i++){const x=p.getX(i),a=x/rr;p.setX(i,rr*Math.sin(a));p.setZ(i,rr*(1-Math.cos(a))*1.);}
 const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false,depthWrite:false}));
 const piv=new THREE.Object3D();piv.rotation.y=ang;G.add(piv);piv.add(m);m.position.set(0,el,-r);m.rotation.x=-.55;
 // bezel: rounded-rect extruded frame
 const sh=new THREE.Shape(),bw=w/2+.012,bh=h/2+.012,rc=.018;sh.moveTo(-bw+rc,-bh);sh.lineTo(bw-rc,-bh);sh.quadraticCurveTo(bw,-bh,bw,-bh+rc);sh.lineTo(bw,bh-rc);sh.quadraticCurveTo(bw,bh,bw-rc,bh);sh.lineTo(-bw+rc,bh);sh.quadraticCurveTo(-bw,bh,-bw,bh-rc);sh.lineTo(-bw,-bh+rc);sh.quadraticCurveTo(-bw,-bh,-bw+rc,-bh);
 const bz=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:.008,bevelEnabled:true,bevelSize:.004,bevelThickness:.004,bevelSegments:4,curveSegments:10}),hullDark);bz.position.set(0,el,-r-.012);bz.rotation.x=-.55;bz.position.addScaledVector(new THREE.Vector3(0,-Math.cos(.95),-Math.sin(.95)),.0);piv.add(bz);bz.translateZ(-.014);
 const s={c,x:c.getContext('2d'),tex,w:c.width/scale,h:c.height/scale};s.x.scale(scale,scale);screens.push(s);return s;}
const sL=screen(.25,.145,.37,-.335,.62,640),sC=screen(.21,.15,0,-.33,.6,560),sR=screen(.25,.145,-.37,-.335,.62,640);
// ---- buttons & switches: bevelled rounded keys (instanced), small glowing indicators
{const sh=new THREE.Shape(),r=.004,a=.011;sh.moveTo(-a+r,-a);sh.lineTo(a-r,-a);sh.quadraticCurveTo(a,-a,a,-a+r);sh.lineTo(a,a-r);sh.quadraticCurveTo(a,a,a-r,a);sh.lineTo(-a+r,a);sh.quadraticCurveTo(-a,a,-a,a-r);sh.lineTo(-a,-a+r);sh.quadraticCurveTo(-a,-a,-a+r,-a);
 const kg=new THREE.ExtrudeGeometry(sh,{depth:.004,bevelEnabled:true,bevelSize:.002,bevelThickness:.003,bevelSegments:3,curveSegments:6});
 const keyM=new THREE.MeshStandardMaterial({color:0x39424e,metalness:.5,roughness:.35});const ledM=new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false});
 const keys=[],leds=[];const d=new THREE.Object3D();
 for(const side of [-1,1])for(let row=0;row<2;row++)for(let i=0;i<6;i++){const ang=side*(.6+i*.05),rr=.56+row*.05,y=-.5+row*.012;d.position.set(rr*Math.sin(Math.PI+ang),y,rr*Math.cos(Math.PI+ang));d.lookAt(0,y+.9,0);d.rotateX(-.6);d.updateMatrix();keys.push(d.matrix.clone());
  d.translateZ(.008);d.translateY(.006);d.scale.setScalar(.25);d.updateMatrix();leds.push(d.matrix.clone());d.scale.setScalar(1);}
 const ki=new THREE.InstancedMesh(kg,keyM,keys.length);keys.forEach((m,i)=>ki.setMatrixAt(i,m));G.add(ki);
 const li=new THREE.InstancedMesh(new THREE.SphereGeometry(.006,12,8),ledM,leds.length);const pal=[[.3,1.6,2.4],[.3,2,.6],[2.4,1.2,.2],[2.4,.3,.3]];
 leds.forEach((m,i)=>{li.setMatrixAt(i,m);const p=pal[(i*7)%4];li.setColorAt(i,new THREE.Color(...p));});G.add(li);
 // toggle switches row on the hood
 const tg=new THREE.CylinderGeometry(.0018,.0025,.014,12),tb=new THREE.CylinderGeometry(.006,.007,.004,20);
 for(let i=-5;i<=5;i++){if(Math.abs(i)<2)continue;const a=Math.PI+i*.06,x=.86*Math.sin(a),z=.86*Math.cos(a);const b=add(tb,hullDark);b.position.set(x,-.447,z);const t=add(tg,trim);t.position.set(x,-.441,z);t.rotation.set(-.4*(i%2?1:-1),0,0);}
}
// ---- flight stick + throttle (smooth lathe shapes)
const stick=new THREE.Group();stick.position.set(.2,-.72,-.42);G.add(stick);
add(new THREE.LatheGeometry(smooth([[0,0],[.06,0],[.06,.015],[.035,.03],[.02,.05]],.01,6).map(v=>v),48),hullDark,stick);
add(new THREE.CylinderGeometry(.011,.013,.17,24),trim,stick).position.y=.13;
const grip=add(new THREE.CapsuleGeometry(.022,.07,8,24),new THREE.MeshStandardMaterial({color:0x1a1d22,roughness:.7}),stick);grip.position.y=.24;grip.rotation.x=-.25;
add(new THREE.SphereGeometry(.007,16,10),amber,stick).position.set(0,.285,.01);
const thr=new THREE.Group();thr.position.set(-.48,-.6,-.3);G.add(thr);
add(new THREE.BoxGeometry(.03,.006,.16),hullDark,thr);const thH=add(new THREE.CapsuleGeometry(.016,.04,6,20),trim,thr);thH.rotation.z=Math.PI/2;thH.position.y=.03;
// ---- soft interior fill light
const fill=new THREE.PointLight(0x7fc8ff,1.2,1.4,1.5);fill.position.set(0,-.12,-.3);const fill2=new THREE.PointLight(0xffc890,.5,1.2,1.5);fill2.position.set(0,.3,.2);G.add(fill2);G.add(fill);
[hull,hullDark,trim].forEach(m=>m.side=THREE.DoubleSide);
// merge static meshes per material -> few draw calls (stick/throttle groups stay separate so they can move)
{G.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(G.matrixWorld).invert(),groups=new Map(),rm=[];const mm=[hull,hullDark,trim,accent,amber];
 G.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!mm.includes(o.material))return;for(let p=o.parent;p&&p!==G;p=p.parent)if(p===stick||p===thr)return;
  let g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(g.index)g=g.toNonIndexed();
  for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);if(!g.attributes.uv)g.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count*2),2));
  (groups.get(o.material)||groups.set(o.material,[]).get(o.material)).push(g);rm.push(o);});
 rm.forEach(o=>o.parent.remove(o));groups.forEach((gs,m)=>{const mg=mergeGeometries(gs);if(mg)G.add(new THREE.Mesh(mg,m));});}
G.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;o.frustumCulled=false;o.renderOrder=o.material.transparent?10:0;}});

// ---------- screen drawing (smooth vector gauges)
const C1='#7fdcff',C2='#2a7fb0',WARM='#ffb35a';
function panel(s,title){const x=s.x,w=s.w,h=s.h;x.clearRect(0,0,w,h);
 const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(8,30,48,.92)');g.addColorStop(1,'rgba(3,12,22,.92)');x.fillStyle=g;rr(x,2,2,w-4,h-4,14);x.fill();
 x.strokeStyle='rgba(127,220,255,.55)';x.lineWidth=1.5;rr(x,4,4,w-8,h-8,12);x.stroke();
 x.fillStyle=C1;x.font='600 15px "PingFang HK","Noto Sans TC",sans-serif';x.textBaseline='top';x.fillText(title,16,12);
 x.fillStyle='rgba(127,220,255,.25)';x.fillRect(16,34,w-32,1);}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();}
function txt(x,s,px,py,size=13,col=C1,al='left',wt=400){x.font=`${wt} ${size}px "PingFang HK","Noto Sans TC",sans-serif`;x.fillStyle=col;x.textAlign=al;x.fillText(s,px,py);x.textAlign='left';}
const names=bodies.map(b=>b.name),tmp=new THREE.Vector3(),inv=new THREE.Matrix4();let acc=1,sweep=0;
const keys=['','',''];const R_=Math.round;
function draw(st){
 let best=null,bd=1e9;bodies.forEach(b=>{const d=b.obj.getWorldPosition(tmp).distanceTo(st.pos)-b.r;if(d<bd){bd=d;best=b;}});
 const kL=[R_(st.speed),R_(st.heading),R_(st.pitch),st.boost,R_(st.thrust*10),R_(st.pos.x/10),R_(st.pos.y/10),R_(st.pos.z/10)].join();
 const kC=st.lvl==2?String(Math.floor(st.t*1.4/(Math.PI*2)*24)):String(Math.floor(st.t*2));
 const kR=[best.name,R_(bd/10),R_(st.speed),R_(st.fps/5),st.quality,st.mission||''].join();
 if(kL!==keys[0]){keys[0]=kL;sL.tex.needsUpdate=true;
 {const s=sL,x=s.x;panel(s,'飛行資料');const cx=100,cy=125,R0=62,sp=Math.min(st.speed/1000,1);
  x.lineCap='round';x.lineWidth=9;x.strokeStyle='rgba(42,127,176,.35)';x.beginPath();x.arc(cx,cy,R0,Math.PI*.75,Math.PI*2.25);x.stroke();
  const gg=x.createLinearGradient(cx-R0,0,cx+R0,0);gg.addColorStop(0,'#3fd0ff');gg.addColorStop(1,sp>.7?WARM:'#bff4ff');x.strokeStyle=gg;x.beginPath();x.arc(cx,cy,R0,Math.PI*.75,Math.PI*(.75+1.5*sp));x.stroke();
  x.lineWidth=1.5;x.strokeStyle='rgba(127,220,255,.6)';for(let i=0;i<=10;i++){const a=Math.PI*(.75+.15*i),r1=R0-16,r2=R0-(i%5?11:6);x.beginPath();x.moveTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);x.lineTo(cx+Math.cos(a)*r2,cy+Math.sin(a)*r2);x.stroke();}
  txt(x,st.speed.toFixed(0),cx,cy-14,30,'#e8fbff','center',300);txt(x,'單位/秒',cx,cy+20,11,C2,'center');
  txt(x,'推進',205,58,12,C2);x.fillStyle='rgba(42,127,176,.3)';rr(x,205,78,14,100,7);x.fill();x.fillStyle=st.boost?WARM:C1;const th=Math.min(1,st.thrust);rr(x,205,78+100*(1-th),14,100*th+.01,7);x.fill();
  txt(x,'航向',240,58,12,C2);txt(x,String(Math.round(st.heading)).padStart(3,'0')+'°',240,76,20,'#e8fbff');
  txt(x,'俯仰',240,108,12,C2);txt(x,(st.pitch>=0?'+':'')+st.pitch.toFixed(0)+'°',240,126,20,'#e8fbff');
  txt(x,'座標',240,158,12,C2);txt(x,`${st.pos.x.toFixed(0)}, ${st.pos.y.toFixed(0)}, ${st.pos.z.toFixed(0)}`,240,174,11,C1);
  txt(x,'加速 '+(st.boost?'開啟':'待命'),16,h_(s)-24,12,st.boost?WARM:C2);}}
 // centre: radar
 if(kC!==keys[1]){keys[1]=kC;sC.tex.needsUpdate=true;{const s=sC,x=s.x;panel(s,'雷達掃描');const cx=s.w/2,cy=s.h/2+14,R0=Math.min(s.w,s.h)/2-30;
  const rg=x.createRadialGradient(cx,cy,0,cx,cy,R0);rg.addColorStop(0,'rgba(40,140,200,.25)');rg.addColorStop(1,'rgba(10,40,70,.15)');x.fillStyle=rg;x.beginPath();x.arc(cx,cy,R0,0,7);x.fill();
  x.strokeStyle='rgba(127,220,255,.35)';x.lineWidth=1;for(const k of [1,.66,.33]){x.beginPath();x.arc(cx,cy,R0*k,0,7);x.stroke();}
  x.beginPath();x.moveTo(cx-R0,cy);x.lineTo(cx+R0,cy);x.moveTo(cx,cy-R0);x.lineTo(cx,cy+R0);x.stroke();
  sweep=(st.t*1.4)%(Math.PI*2);const sg=x.createConicGradient?x.createConicGradient(sweep-1.2,cx,cy):null;
  if(sg){sg.addColorStop(0,'rgba(127,220,255,0)');sg.addColorStop(.19,'rgba(127,220,255,.35)');sg.addColorStop(.191,'rgba(127,220,255,0)');x.fillStyle=sg;x.beginPath();x.arc(cx,cy,R0,0,7);x.fill();}
  inv.copy(ship.matrixWorld).invert();const range=3000;
  bodies.forEach(b=>{b.obj.getWorldPosition(tmp).applyMatrix4(inv);const d=Math.hypot(tmp.x,tmp.z);let k=Math.min(1,Math.log10(1+d)/Math.log10(1+range*3));
   const a=Math.atan2(tmp.x,-tmp.z);const px=cx+Math.sin(a)*R0*k,py=cy-Math.cos(a)*R0*k;
   const gl=x.createRadialGradient(px,py,0,px,py,9);gl.addColorStop(0,b.col);gl.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gl;x.beginPath();x.arc(px,py,9,0,7);x.fill();
   x.fillStyle='#fff';x.beginPath();x.arc(px,py,2.2,0,7);x.fill();txt(x,b.name,px+6,py-6,10,'rgba(200,240,255,.85)');});
  x.fillStyle=C1;x.beginPath();x.moveTo(cx,cy-7);x.lineTo(cx+5,cy+5);x.lineTo(cx,cy+2);x.lineTo(cx-5,cy+5);x.closePath();x.fill();}}
 // right: nav target / systems
 if(kR!==keys[2]){keys[2]=kR;sR.tex.needsUpdate=true;{const s=sR,x=s.x;panel(s,'導航・任務');
  if(st.mission){txt(x,'目前任務',16,48,12,C2);txt(x,st.mission,16,64,22,'#e8fbff',undefined,400);}else{txt(x,'最近天體',16,48,12,C2);txt(x,best.name,16,64,26,'#e8fbff',undefined,300);}txt(x,'距離 '+Math.max(0,bd).toFixed(0)+' 單位',16,98,13,C1);
  const eta=st.speed>1?bd/st.speed:Infinity;txt(x,'預計抵達 '+(isFinite(eta)?(eta<600?eta.toFixed(0)+' 秒':Math.round(eta/60)+' 分鐘'):'—'),16,118,13,C1);
  const sys=[['護盾',.92],['能量',.8],['冷卻',.64]];
  sys.forEach(([n,v],i)=>{const y=150+i*22;txt(x,n,16,y,12,C2);x.fillStyle='rgba(42,127,176,.3)';rr(x,58,y+2,120,8,4);x.fill();const gg=x.createLinearGradient(58,0,178,0);gg.addColorStop(0,'#2fb7ff');gg.addColorStop(1,'#bff4ff');x.fillStyle=gg;rr(x,58,y+2,120*v,8,4);x.fill();txt(x,Math.round(v*100)+'%',186,y,11,C1);});
  txt(x,'畫質 '+st.quality,s.w-16,48,12,C2,'right');txt(x,st.fps.toFixed(0)+' fps',s.w-16,64,12,C2,'right');}}}
const h_=s=>s.h;
const fit=()=>{G.scale.x=Math.min(1,Math.max(.5,innerWidth/innerHeight/1.4));};fit();addEventListener('resize',fit);
return {group:G,stick,thH,update(dt,st){acc+=dt;const iv=st.lvl==0?.25:st.lvl==1?.15:.1;if(acc>=iv){acc=0;draw(st);}
 // stick/throttle follow input subtly
 stick.rotation.x=THREE.MathUtils.lerp(stick.rotation.x,-st.inF*.25,.1);stick.rotation.z=THREE.MathUtils.lerp(stick.rotation.z,-st.inX*.25,.1);
 thH.parent.children[1].position.z=THREE.MathUtils.lerp(thH.position.z,-.06*st.thrust,.1);}};
}
