import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {Lensflare,LensflareElement} from 'three/addons/objects/Lensflare.js';
import {TEX} from './textures.js';
import {buildCockpit} from './cockpit.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {initGame} from './game.js';

// phones + tablets (iPadOS reports as Mac, so also check maxTouchPoints)
const touchDev=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>1;
const SEG=touchDev?[48,32]:[64,48];
const R=new THREE.WebGLRenderer({antialias:!touchDev,powerPreference:'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio,1));R.setSize(innerWidth,innerHeight);
R.info.autoReset=false;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.0;R.outputColorSpace=THREE.SRGBColorSpace;
R.shadowMap.enabled=false; // shadows from a point light = 6 extra scene passes; removed for smoothness
document.body.prepend(R.domElement);
const S=new THREE.Scene();
const cam=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.1,80000);
const ship=new THREE.Object3D();ship.position.set(0,60,1300);S.add(ship);ship.add(cam);
const rnd=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(42);

// ---------- shared GLSL noise
const NOISE=`float h3(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vn(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);
return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<6;i++){s+=a*vn(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=.5;}return s;}`;

// ---------- procedural Milky Way + nebula skybox, baked ONCE into a cube map (no download)
function bakeSky(size){
  const sc=new THREE.Scene();
  const m=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
    vertexShader:'varying vec3 d;void main(){d=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:NOISE+`varying vec3 d;
    void main(){vec3 v=normalize(d);vec3 N=normalize(vec3(.35,1.,.25));vec3 G=normalize(vec3(-.6,-.12,-.8));
      float b=dot(v,N);float core=pow(max(dot(v,G),0.),2.);
      float n1=fbm(v*3.),n2=fbm(v*9.+3.),n3=fbm(v*26.);
      float wid=.005+.012*core+.004*n1;
      float band=exp(-b*b/wid)*(.45+.9*n2)*(.35+.65*core+.15);
      float halo=exp(-b*b/.08)*.07*(.3+core);
      float dust=smoothstep(.45,.75,fbm(v*7.+vec3(5.))) * exp(-b*b/(wid*.35));
      float lum=(band*(1.-.85*dust)+halo)*(.7+.6*n3);
      vec3 col=mix(vec3(.55,.62,.85),vec3(1.,.82,.6),core)*lum*.22;
      // coloured nebula clouds
      float neb=smoothstep(.52,.85,fbm(v*2.2+vec3(11.)));
      float neb2=smoothstep(.55,.9,fbm(v*2.7+vec3(-4.,2.,7.)));
      float fil=pow(fbm(v*12.+vec3(2.)),3.);
      col+=vec3(.5,.1,.35)*neb*(.15+fil*1.6)*.16;
      col+=vec3(.06,.28,.5)*neb2*(.15+fil*1.6)*.15;
      // tiny unresolved stars
      float st=pow(h3(floor(v*1400.)),300.)*.8+pow(h3(floor(v*700.)+7.),500.)*1.2;
      col+=vec3(st)*(.4+band*3.);
      col+=vec3(.004,.005,.012);
      gl_FragColor=vec4(col,1.);}`});
  sc.add(new THREE.Mesh(new THREE.SphereGeometry(5,64,32),m));
  const rt=new THREE.WebGLCubeRenderTarget(size,{type:THREE.HalfFloatType,generateMipmaps:true,minFilter:THREE.LinearMipmapLinearFilter});
  const cc=new THREE.CubeCamera(.1,10,rt);const tm=R.toneMapping;R.toneMapping=THREE.NoToneMapping;cc.update(R,sc);R.toneMapping=tm;
  m.dispose();return rt.texture;}
// quick 128px bake for the first frame; full-res bake + environment map happen right after the scene is up
S.background=bakeSky(128);S.backgroundIntensity=1.;
function upgradeSky(){const old=S.background,hi=bakeSky(touchDev?512:1024);S.background=hi;old.dispose();
  const pm=new THREE.PMREMGenerator(R);S.environment=pm.fromCubemap(hi).texture;S.environmentIntensity=.5;pm.dispose();}

// ---------- multi-layer twinkling starfield (custom shader: size, colour temperature, twinkle)
const starMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{t:{value:0},pr:{value:R.getPixelRatio()}},
  vertexShader:`attribute float sz,ph;attribute vec3 c;uniform float t,pr;varying vec3 vc;varying float vs;
  void main(){vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;
  float tw=.75+.25*sin(t*(1.3+fract(ph*7.)*2.5)+ph*6.283);vc=c*tw;vs=sz*pr;gl_PointSize=vs;}`,
  fragmentShader:`varying vec3 vc;varying float vs;void main(){vec2 p=gl_PointCoord-.5;float r=length(p)*2.;
  float a=exp(-r*r*6.);float sp=vs>6.?max(0.,1.-abs(p.x)*24.)*max(0.,1.-abs(p.y)*2.2)+max(0.,1.-abs(p.y)*24.)*max(0.,1.-abs(p.x)*2.2):0.;
  gl_FragColor=vec4(vc*(a+sp*.6),1.);}`});
const starPal=[[.62,.72,1.],[.8,.86,1.],[1,1,1],[1,.96,.86],[1,.85,.62],[1,.7,.5]];
function starLayer(n,szMin,szMax,bMin,bMax,bandBias){const g=new THREE.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3),s=new Float32Array(n),ph=new Float32Array(n);
  const N=new THREE.Vector3(.35,1,.25).normalize(),v=new THREE.Vector3();
  for(let i=0;i<n;i++){v.randomDirection();if(rnd()<bandBias){v.addScaledVector(N,-v.dot(N)*(.85+rnd()*.15)).normalize();}
    v.multiplyScalar(30000+rnd()*15000);p.set([v.x,v.y,v.z],i*3);
    const pc=starPal[Math.min(5,Math.floor(Math.pow(rnd(),.8)*6))],br=bMin+Math.pow(rnd(),3)*(bMax-bMin);c.set([pc[0]*br,pc[1]*br,pc[2]*br],i*3);
    s[i]=szMin+Math.pow(rnd(),2.5)*(szMax-szMin);ph[i]=rnd();}
  g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('c',new THREE.BufferAttribute(c,3));g.setAttribute('sz',new THREE.BufferAttribute(s,1));g.setAttribute('ph',new THREE.BufferAttribute(ph,1));
  const pts=new THREE.Points(g,starMat);pts.frustumCulled=false;return pts;}
const starG=new THREE.Group();
starG.add(starLayer(touchDev?3000:6000,.8,1.6,.1,.4,.5),starLayer(touchDev?1000:1600,1.8,3.,.4,1.1,.3),starLayer(touchDev?150:220,3.5,8,1.,2.6,.15));S.add(starG);

// ---------- sun: animated granulated surface + corona shader + glow + lens flare
S.add(new THREE.AmbientLight(0x334455,0.25));
const sunMat=new THREE.ShaderMaterial({uniforms:{t:{value:0}},vertexShader:'varying vec3 p,n,vv;void main(){p=position;n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vv=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:NOISE+`uniform float t;varying vec3 p,n,vv;void main(){vec3 q=normalize(p);float g=fbm(q*7.+vec3(t*.03));float g2=fbm(q*22.-vec3(t*.05));
  float mu=max(dot(n,vv),0.);float limb=.45+.55*pow(mu,.5);float k=(.35+g*g2*2.6)*limb;
  gl_FragColor=vec4(vec3(1.6,.95,.42)*k+vec3(.25,.12,.02),1.);}`});
const sun=new THREE.Mesh(new THREE.SphereGeometry(300,...SEG),sunMat);S.add(sun);
const coronaMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{t:{value:0}},
  vertexShader:'varying vec2 u;void main(){u=uv*2.-1.;vec4 mv=modelViewMatrix*vec4(0,0,0,1);mv.xy+=position.xy;gl_Position=projectionMatrix*mv;}',
  fragmentShader:NOISE+`uniform float t;varying vec2 u;void main(){float r=length(u);float a=atan(u.y,u.x);
  float rays=fbm(vec3(cos(a)*3.,sin(a)*3.,t*.08))*.9+fbm(vec3(cos(a)*11.,sin(a)*11.,t*.12))*.5;
  float core=smoothstep(1.,.0,r);float g=pow(core,7.)*1.4+pow(core,3.)*.7*rays*rays*rays+pow(core,1.6)*.035;
  gl_FragColor=vec4(vec3(1.,.72,.42)*g,1.);}`});
const corona=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),coronaMat);corona.frustumCulled=false;S.add(corona);
const sunL=new THREE.PointLight(0xfff0dd,4,0,0);S.add(sunL);
function radTex(stops,sz=128){const c=document.createElement('canvas');c.width=c.height=sz;const x=c.getContext('2d'),g=x.createRadialGradient(sz/2,sz/2,0,sz/2,sz/2,sz/2);stops.forEach(([o,s])=>g.addColorStop(o,s));x.fillStyle=g;x.fillRect(0,0,sz,sz);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const flareT=radTex([[0,'rgba(255,255,255,.9)'],[.4,'rgba(255,220,180,.25)'],[1,'rgba(255,200,150,0)']]);
const ringT=radTex([[0,'rgba(0,0,0,0)'],[.8,'rgba(120,180,255,0)'],[.9,'rgba(140,200,255,.3)'],[1,'rgba(0,0,0,0)']]);
const hexT=radTex([[0,'rgba(180,220,255,.18)'],[.7,'rgba(160,200,255,.12)'],[1,'rgba(0,0,0,0)']],64);
const lf=new Lensflare();lf.addElement(new LensflareElement(flareT,220,0,new THREE.Color(.8,.7,.55)));
[[hexT,40,.35],[hexT,70,.55],[flareT,30,.7],[hexT,110,.9],[hexT,35,1.1]].forEach(([t,s,d])=>lf.addElement(new LensflareElement(t,s,d)));
const flareL=new THREE.PointLight(0,0);flareL.add(lf);S.add(flareL);

// ---------- progressive texture streaming
const prog={total:0,done:0};const progEl=document.getElementById('prog'),progTx=document.getElementById('progtx');
function bump(){prog.done++;const f=prog.done/prog.total;if(progEl)progEl.style.width=(f*100).toFixed(0)+'%';if(progTx)progTx.textContent=f<1?`載入中 ${(f*100)|0}%`:"準備好了！";}
const TL=new THREE.TextureLoader();const queue=[];let active=0;
function stream(file,apply,srgb=true,prio=0){prog.total++;queue.push({file,apply,srgb,prio});queue.sort((a,b)=>a.prio-b.prio);pump();}
function pump(){while(active<3&&queue.length){const j=queue.shift();active++;TL.load(TEX.base+j.file,t=>{if(j.srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(touchDev?4:8,R.capabilities.getMaxAnisotropy());R.initTexture(t);j.apply(t);active--;bump();pump();},undefined,()=>{active--;bump();pump();});}}
// ---------- planets (start with flat colours, textures swap in as they arrive; far planets stream last)
function atmo(r,col,k=1.){return new THREE.Mesh(new THREE.SphereGeometry(r*1.06,...SEG),new THREE.ShaderMaterial({transparent:true,blending:THREE.AdditiveBlending,side:THREE.BackSide,depthWrite:false,uniforms:{c:{value:new THREE.Color(col)},k:{value:k}},
vertexShader:'varying vec3 n,v,wn,wp;void main(){vec4 w=modelMatrix*vec4(position,1.);wp=w.xyz;wn=normalize(mat3(modelMatrix)*normal);vec4 mv=viewMatrix*w;n=normalize(normalMatrix*normal);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
fragmentShader:'uniform vec3 c;uniform float k;varying vec3 n,v,wn,wp;void main(){float d=abs(dot(n,v));float f=pow(smoothstep(0.,.55,d),2.2)*(1.-smoothstep(.55,1.,d)*.6);float day=smoothstep(-.35,.45,dot(wn,normalize(-wp)));gl_FragColor=vec4(c*f*(.08+day)*1.6*k,1.);}'}));}
function rim(col){return {onBeforeCompile:s=>{s.uniforms.rimC={value:new THREE.Color(col)};s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 rimC;').replace('#include <emissivemap_fragment>',
'#include <emissivemap_fragment>\nfloat fr=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),3.);totalEmissiveRadiance+=rimC*fr*.35;');}};}
const planets=[];
function planet(d,r,col,ang,opts={}){const piv=new THREE.Object3D();piv.rotation.y=ang;S.add(piv);
const mat=new THREE.MeshStandardMaterial({color:col,roughness:.9,metalness:0});if(opts.atmo)Object.assign(mat,rim(opts.atmo));
const m=new THREE.Mesh(new THREE.SphereGeometry(r,...SEG),mat);
m.position.x=d;m.rotation.z=opts.tilt||0;piv.add(m);if(opts.atmo)m.add(atmo(r,opts.atmo,opts.ak||1));
if(opts.tex)stream(opts.tex,t=>{mat.map=t;mat.color.set(0xffffff);mat.needsUpdate=true;},true,opts.prio??d/1000);
planets.push({piv,m,sp:0.02/Math.sqrt(d/1000),spin:opts.spin||.06});return m;}
planet(1000,55,0xd8b77c,2.2,{atmo:0xffd9a0,tex:'venus.webp',prio:2});
const earth=planet(1500,60,0x3a6aa8,0.2,{atmo:0x5fa8ff,tilt:.41,ak:1.3});
{const em=earth.material;em.roughness=.7;em.metalness=.1;
 stream('earth_lo.webp',t=>{if(!em.map||em.map.image.width<300){em.map=t;em.color.set(0xffffff);em.needsUpdate=true;}},true,0);
 stream('earth.webp',t=>{em.map=t;em.needsUpdate=true;},true,3);
 stream('earth_normal.webp',t=>{em.normalMap=t;em.normalScale.set(.85,-.85);em.needsUpdate=true;},false,3.1);
 stream('earth_spec.webp',t=>{em.roughnessMap=t;em.needsUpdate=true;},false,3.2);}
const cloudM=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false});
const clouds=new THREE.Mesh(new THREE.SphereGeometry(60.6,...SEG),cloudM);earth.add(clouds);
stream('earth_clouds.webp',t=>{cloudM.alphaMap=t;cloudM.opacity=1;cloudM.needsUpdate=true;},false,3.3);
const moonPiv=new THREE.Object3D();earth.parent.add(moonPiv);moonPiv.position.x=1500;
const moonM=new THREE.MeshStandardMaterial({color:0x888888,roughness:1});
const moon=new THREE.Mesh(new THREE.SphereGeometry(16,32,24),moonM);moon.position.x=140;moonPiv.add(moon);
stream('moon.webp',t=>{moonM.map=t;moonM.color.set(0xffffff);moonM.needsUpdate=true;},true,4);
planet(2300,40,0xb5583a,1.4,{atmo:0xff8a60,tilt:.44,tex:'mars.webp',prio:5,ak:.6});
planet(4400,190,0xc8a882,3.4,{spin:.15,tilt:.05,tex:'jupiter.webp',prio:6,atmo:0xffd8a8,ak:.5});
const saturn=planet(5900,150,0xd9c08c,4.6,{spin:.13,tilt:.47,tex:'saturn.webp',prio:7,atmo:0xffe0a0,ak:.4});
{const r=150,rg=new THREE.RingGeometry(r*1.25,r*2.3,256,1),uv=rg.attributes.uv,pos=rg.attributes.position;
for(let k=0;k<uv.count;k++){const l=Math.hypot(pos.getX(k),pos.getY(k));uv.setXY(k,(l-r*1.25)/(r*1.05),.5);}
const rmM=new THREE.MeshStandardMaterial({color:0xc8b48a,side:THREE.DoubleSide,transparent:true,opacity:.5,roughness:.9,depthWrite:false});
const rm=new THREE.Mesh(rg,rmM);rm.rotation.x=Math.PI/2;rm.receiveShadow=true;saturn.add(rm);
stream('saturn_ring.webp',t=>{rmM.map=t;rmM.color.set(0xffffff);rmM.opacity=1;rmM.needsUpdate=true;},true,7.1);}
planet(7600,110,0x4f78d8,5.5,{atmo:0x6f9cff,spin:.1,tex:'neptune.webp',prio:8});
// --- space station (procedural, near start)
const station=new THREE.Group();station.position.set(70,40,1080);station.rotation.set(.25,.5,0);S.add(station);
const metal=new THREE.MeshStandardMaterial({color:0x8f959d,metalness:.85,roughness:.5});
const darkM=new THREE.MeshStandardMaterial({color:0x3a3f46,metalness:.8,roughness:.45});
const goldM=new THREE.MeshStandardMaterial({color:0xd4a64a,metalness:1,roughness:.3});
const winM=new THREE.MeshStandardMaterial({color:0x111111,emissive:0xffd9a0,emissiveIntensity:.9});
const pc=document.createElement('canvas');pc.width=256;pc.height=128;{const x=pc.getContext('2d');x.fillStyle='#0a1a3a';x.fillRect(0,0,256,128);for(let i=0;i<16;i++)for(let j=0;j<8;j++){x.fillStyle=`hsl(220,60%,${18+Math.random()*10}%)`;x.fillRect(i*16+1,j*16+1,14,14);}}
const pTex=new THREE.CanvasTexture(pc);pTex.colorSpace=THREE.SRGBColorSpace;
const panelM=new THREE.MeshStandardMaterial({map:pTex,metalness:.6,roughness:.25});
const add=(g,m,p,r,par=station)=>{const o=new THREE.Mesh(g,m);if(p)o.position.set(...p);if(r)o.rotation.set(...r);o.castShadow=o.receiveShadow=true;par.add(o);return o;};
// hub along z
add(new THREE.CylinderGeometry(7,7,44,32),metal,[0,0,0],[Math.PI/2,0,0]);
add(new THREE.SphereGeometry(7,32,16),metal,[0,0,22]);add(new THREE.SphereGeometry(7,32,16),metal,[0,0,-22]);
for(let z=-18;z<=18;z+=6)add(new THREE.TorusGeometry(7.2,.35,8,48),darkM,[0,0,z]);
// rotating ring habitat
const ring=new THREE.Group();station.add(ring);
add(new THREE.TorusGeometry(42,4.2,24,160),darkM,null,null,ring);add(new THREE.TorusGeometry(42,4.25,8,160),metal,null,null,ring).scale.set(1,1,.35);
for(let i=0;i<48;i++){const a=i/48*Math.PI*2;if(i%8==0)continue;add(new THREE.BoxGeometry(.6,2.2,1.4),winM,[Math.cos(a)*46.2,Math.sin(a)*46.2,0],[0,0,a],ring);}
for(let i=0;i<6;i++){const a=i/6*Math.PI*2;add(new THREE.CylinderGeometry(1.1,1.1,35,12),darkM,[Math.cos(a)*24.5,Math.sin(a)*24.5,0],[0,0,a+Math.PI/2],ring);
add(new THREE.BoxGeometry(6,9,10),metal,[Math.cos(a)*42,Math.sin(a)*42,0],[0,0,a],ring);}
// solar arrays on truss at back
add(new THREE.BoxGeometry(150,2,2),darkM,[0,0,-16]);
for(const sx of [-1,1])for(let k=0;k<3;k++){const px=sx*(22+k*19),pg=new THREE.Group();pg.position.set(px,0,-16);pg.rotation.x=1.1;station.add(pg);add(new THREE.BoxGeometry(17,.4,26),panelM,null,null,pg);add(new THREE.BoxGeometry(17.4,.5,.6),goldM,[0,0,-13],null,pg);add(new THREE.BoxGeometry(17.4,.5,.6),goldM,[0,0,13],null,pg);}
// docking modules at front
add(new THREE.CylinderGeometry(4,4,14,24),metal,[0,0,34],[Math.PI/2,0,0]);add(new THREE.TorusGeometry(4.2,.8,12,32),goldM,[0,0,41]);
for(const [dx,dy] of [[1,0],[-1,0],[0,1]]){add(new THREE.CylinderGeometry(3,3,12,20),metal,[dx*12,dy*12,14],[dy?0:0,0,dx?Math.PI/2:0]);add(new THREE.TorusGeometry(3.2,.6,10,28),goldM,[dx*18,dy*18,14],[dy?Math.PI/2:0,dx?Math.PI/2:0,0]);}
add(new THREE.CylinderGeometry(.3,.3,16,6),darkM,[0,9+8,6]);add(new THREE.SphereGeometry(2.5,16,8,0,Math.PI*2,0,Math.PI/2),goldM,[0,25,6],[Math.PI,0,0]);
// blinking navigation lights
const navs=[];const nav=(p,c,ph,par=station)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.9,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(6)}));m.position.set(...p);par.add(m);navs.push({m,ph});};
nav([-97,0,-16],0xff2020,0);nav([97,0,-16],0x20ff40,0);nav([0,0,43],0xffffff,.5);nav([0,26,6],0xffffff,.25);
for(let i=0;i<6;i++){const a=i/6*Math.PI*2+Math.PI/6;nav([Math.cos(a)*46.5,Math.sin(a)*46.5,0],i%2?0xff3030:0x30ff60,i*.17,ring);}
// merge the station's many small static meshes into one mesh per material (≈100 draw calls -> ≈8)
function mergeByMaterial(root,skip){root.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(root.matrixWorld).invert(),groups=new Map(),rm=[];
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;for(let p=o;p&&p!==root;p=p.parent)if(skip.includes(p))return;
  const g=o.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));if(g.index)g.toNonIndexed&&0;
  for(const k of Object.keys(g.attributes))if(!['position','normal','uv'].includes(k))g.deleteAttribute(k);
  (groups.get(o.material)||groups.set(o.material,[]).get(o.material)).push(g.index?g.toNonIndexed():g);rm.push(o);});
 rm.forEach(o=>o.parent.remove(o));groups.forEach((gs,m)=>{const mg=mergeGeometries(gs);if(mg)root.add(new THREE.Mesh(mg,m));gs.forEach(g=>g.dispose());});}
mergeByMaterial(station,[ring,...navs.map(n=>n.m)]);mergeByMaterial(ring,navs.map(n=>n.m));
// ---------- asteroid belt: 8 distinct noise-displaced rock shapes, instanced, plus fine dust & gravel
const v3=new THREE.Vector3();
function vnoise(x,y,z,s){const h=(a,b,c)=>{let n=Math.sin(a*127.1+b*311.7+c*74.7+s*13.3)*43758.5453;return n-Math.floor(n);};
 const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),fx=x-ix,fy=y-iy,fz=z-iz,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),uz=fz*fz*(3-2*fz),L=(a,b,t)=>a+(b-a)*t;
 return L(L(L(h(ix,iy,iz),h(ix+1,iy,iz),ux),L(h(ix,iy+1,iz),h(ix+1,iy+1,iz),ux),uy),L(L(h(ix,iy,iz+1),h(ix+1,iy,iz+1),ux),L(h(ix,iy+1,iz+1),h(ix+1,iy+1,iz+1),ux),uy),uz);}
function rockGeo(seed,detail){let g=new THREE.IcosahedronGeometry(1,detail);g.deleteAttribute('normal');g.deleteAttribute('uv');
 const {mergeVertices}=BufferGeometryUtilsLite;g=mergeVertices(g);const p=g.attributes.position;const st=[.6+rnd()*.7,.6+rnd()*.5,.6+rnd()*.6];
 const craters=[...Array(4)].map(()=>[new THREE.Vector3().randomDirection(),.2+rnd()*.35]);const cols=new Float32Array(p.count*3);
 for(let i=0;i<p.count;i++){v3.fromBufferAttribute(p,i);let d=0,a=.5,f=1.6;for(let o=0;o<6;o++){d+=a*(vnoise(v3.x*f+5,v3.y*f,v3.z*f,seed)-.5);a*=.55;f*=2.1;}
  let r=1+d*1.1;for(const [c,cr] of craters){const q=v3.distanceTo(c);if(q<cr)r-=.12*Math.cos(q/cr*Math.PI*.5)*(1-q/cr);}
  v3.multiplyScalar(r);v3.set(v3.x*st[0],v3.y*st[1],v3.z*st[2]);p.setXYZ(i,v3.x,v3.y,v3.z);const sh=.75+d*.8;cols.set([sh,sh*.96,sh*.9],i*3);}
 g.setAttribute('color',new THREE.BufferAttribute(cols,3));g.computeVertexNormals();return g;}
// tiny mergeVertices (avoids another addon download)
const BufferGeometryUtilsLite={mergeVertices(g){const p=g.attributes.position,map=new Map(),idx=[],pos=[];for(let i=0;i<p.count;i++){const k=`${p.getX(i).toFixed(4)},${p.getY(i).toFixed(4)},${p.getZ(i).toFixed(4)}`;let j=map.get(k);if(j===undefined){j=pos.length/3;map.set(k,j);pos.push(p.getX(i),p.getY(i),p.getZ(i));}idx.push(j);}
 const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));o.setIndex(idx);return o;}};
const astG=new THREE.Group();S.add(astG);const astMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:.05});
const dm=new THREE.Object3D(),col=new THREE.Color();const NK=touchDev?6:8,NPER=touchDev?140:300;
for(let k=0;k<NK;k++){const im=new THREE.InstancedMesh(rockGeo(k,2),astMat,NPER);im.castShadow=false;im.receiveShadow=true;
 for(let i=0;i<NPER;i++){const a=rnd()*Math.PI*2,dd=2900+(rnd()+rnd()+rnd())/3*600;dm.position.set(Math.cos(a)*dd,(rnd()+rnd()-1)*55,Math.sin(a)*dd);dm.rotation.set(rnd()*6,rnd()*6,rnd()*6);
  const s=1.2+Math.pow(rnd(),4)*30;dm.scale.set(s,s*(.7+rnd()*.3),s*(.75+rnd()*.25));dm.updateMatrix();im.setMatrixAt(i,dm.matrix);
  const ty=rnd();im.setColorAt(i,ty<.6?col.setHSL(.07+rnd()*.04,.1+rnd()*.1,.2+rnd()*.12):ty<.85?col.setHSL(.03,.22,.18+rnd()*.1):col.setHSL(.6,.04,.3+rnd()*.12));}
 astG.add(im);}
// a few hero boulders close to the start route
{const hg=rockGeo(99,touchDev?3:4);[[260,20,780,26],[-180,-30,620,18],[120,50,400,12]].forEach(([x,y,z,s])=>{const m=new THREE.Mesh(hg,new THREE.MeshStandardMaterial({color:0x5a5048,vertexColors:true,roughness:.95}));m.position.set(x,y,z);m.scale.setScalar(s);m.rotation.set(rnd()*6,rnd()*6,0);S.add(m);});}
// belt gravel / dust glitter
{const n=touchDev?3000:8000,g=new THREE.BufferGeometry(),p=new Float32Array(n*3);for(let i=0;i<n;i++){const a=rnd()*Math.PI*2,dd=2850+(rnd()+rnd())/2*700;p.set([Math.cos(a)*dd,(rnd()+rnd()-1)*70,Math.sin(a)*dd],i*3);}
 g.setAttribute('position',new THREE.BufferAttribute(p,3));astG.add(new THREE.Points(g,new THREE.PointsMaterial({color:0xb8a68f,size:1.6,sizeAttenuation:true,transparent:true,opacity:.7,depthWrite:false})));}
// --- near dust for parallax
const DN=touchDev?600:1200,DR=150,dg=new THREE.BufferGeometry(),dp=new Float32Array(DN*3);for(let i=0;i<DN*3;i++)dp[i]=(Math.random()*2-1)*DR;
dg.setAttribute('position',new THREE.BufferAttribute(dp,3));S.add(new THREE.Points(dg,new THREE.PointsMaterial({color:0x99ccff,size:.25,transparent:true,opacity:.35,depthWrite:false})));
// ---------- cockpit (procedural, see cockpit.js)
const bodyDefs=[[sun,'太陽','#ffd27a',300],[planets[0].m,'金星','#ffd9a0',55],[earth,'地球','#6fb6ff',60],[planets[2].m,'火星','#ff8a60',40],[planets[3].m,'木星','#e8c49a',190],[planets[4].m,'土星','#f0dca0',150],[planets[5].m,'海王星','#7fa6ff',110],[station,'太空站','#aaffcc',50]];
const cockpit=buildCockpit({R,ship,touch:touchDev,bodies:bodyDefs.map(([obj,name,col,r])=>({obj,name,col,r}))});
const fwd=new THREE.Vector3();let fpsShow=60,inF=0,inX=0,boostOn=false;
// ---------- post: bloom, adaptive
const comp=new EffectComposer(R);comp.addPass(new RenderPass(S,cam));
const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),0.45,0.35,0.9);comp.addPass(bloom);comp.addPass(new OutputPass());
// quality levels: 2=high (bloom+shadows, dpr<=2) 1=medium (bloom, dpr 1, no shadows) 0=low (no bloom, dpr .75)
let lvl=touchDev?0:2,auto=true;const LMAX=touchDev?1:2;const qEl=document.getElementById('q');const QN=['低','中','高'];
function setQ(l,manual){lvl=l;if(manual)auto=false;const dpr=devicePixelRatio||1;
 // pixel-ratio caps: phones/iPads max 1.5 (High) / 1.25 (Med) / 1 (Low); desktop 2 / 1.5 / 1
 const pr=touchDev?[Math.min(dpr,1),Math.min(dpr,1.25),Math.min(dpr,1.5)][l]:[Math.min(dpr,1),Math.min(dpr,1.5),Math.min(dpr,2)][l];
 R.setPixelRatio(pr);comp.setPixelRatio(pr);R.setSize(innerWidth,innerHeight);comp.setSize(innerWidth,innerHeight);starMat.uniforms.pr.value=pr;
 flareL.visible=l>0&&!touchDev; // Lensflare copies the framebuffer every frame: costly on tablets
 useBloom=!touchDev&&l>0;
 qEl.textContent='畫質：'+QN[l]+(auto?'（自動）':'');}
let useBloom=false;
qEl.addEventListener('click',e=>{e.stopPropagation();setQ((lvl+1)%3,true);});addEventListener('keydown',e=>{if(e.code==='KeyG'&&!(e.target&&e.target.tagName==='INPUT'))setQ((lvl+1)%3,true);});
// first frames render plain (no bloom/shadows) so the scene appears ASAP; full quality kicks in a moment later
// auto quality: smoothed frame time; steps DOWN fast (fps<45 for ~1s), steps UP slowly (fps>58 for 8s, not soon after a drop)
let ema=1/60,lowT=0,highT=0,lastDrop=-99;function adapt(dt){if(!auto||document.hidden)return;ema+=(dt-ema)*.1;
 if(ema>1/45){lowT+=dt;highT=0;if(lowT>1&&lvl>0){setQ(lvl-1);lowT=0;lastDrop=t;ema=1/50;}}
 else{lowT=Math.max(0,lowT-dt);if(ema<1/58){highT+=dt;if(highT>8&&lvl<LMAX&&t-lastDrop>20){setQ(lvl+1);highT=0;}}else highT=0;}}
// --- controls
const keys={},vel=new THREE.Vector3(),rotV=new THREE.Vector3();let started=false,lookX=0,lookY=0;
addEventListener('keydown',e=>keys[e.code]=true);addEventListener('keyup',e=>keys[e.code]=false);
const touch=touchDev;let free=false;
// game API: free flight on/off (touch joystick or pointer-lock mouse look), mission label on cockpit screen
let mission='';
let kid=false,spMul=1;
function setFree(on,kidMode=false){free=on;started=on;kid=on&&kidMode;document.body.classList.toggle('free',on);document.body.classList.toggle('kidfly',kid);
 ['joy','bBoost'].forEach(id=>document.getElementById(id).style.display=on&&touch?'flex':'none');['bUp','bDown'].forEach(id=>document.getElementById(id).style.display=on&&touch&&!kid?'flex':'none');
 document.getElementById('freehint').style.display=on&&!kid?'block':'none';if(!on){vel.set(0,0,0);}}
R.domElement.addEventListener('click',()=>{if(free&&!touch)R.domElement.requestPointerLock?.();});
addEventListener('mousemove',e=>{if(document.pointerLockElement){lookX+=e.movementX;lookY+=e.movementY;}});
let joy={x:0,y:0},jid=null,lid=null,lp=null;const jEl=document.getElementById('joy'),kn=document.getElementById('knob');const tb={};
['bUp','bBoost','bDown'].forEach(id=>{const b=document.getElementById(id);b.addEventListener('touchstart',e=>{e.preventDefault();tb[id]=1;});b.addEventListener('touchend',()=>tb[id]=0);});
addEventListener('touchstart',e=>{for(const t of e.changedTouches){if(t.target.classList.contains('tb'))continue;if(t.clientX<innerWidth/2&&jid===null&&started)jid=t.identifier;else if(lid===null){lid=t.identifier;lp=[t.clientX,t.clientY];}}},{passive:true});
addEventListener('touchmove',e=>{for(const t of e.changedTouches){if(t.identifier===jid){const r=jEl.getBoundingClientRect(),h=r.width/2,R=h*.62;let x=(t.clientX-r.left-h)/R,y=(t.clientY-r.top-h)/R;const l=Math.hypot(x,y);if(l>1){x/=l;y/=l;}joy={x,y};kn.style.left=h+x*h*.56+'px';kn.style.top=h+y*h*.56+'px';}
if(t.identifier===lid){lookX+=(t.clientX-lp[0])*1.5;lookY+=(t.clientY-lp[1])*1.5;lp=[t.clientX,t.clientY];}}},{passive:true});
addEventListener('touchend',e=>{for(const t of e.changedTouches){if(t.identifier===jid){jid=null;joy={x:0,y:0};kn.style.left=kn.style.top='50%';}if(t.identifier===lid)lid=null;}});
addEventListener('resize',()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();R.setSize(innerWidth,innerHeight);comp.setSize(innerWidth,innerHeight);});
const tmpV=new THREE.Vector3(),cst={};
const game=initGame({THREE,ship,cam,S,R,touch:touchDev,targets:{venus:planets[0].m,mars:planets[2].m,jupiter:planets[3].m,saturn:planets[4].m,earth,earthPiv:earth.parent},setFree,setMission:m=>{mission=m;},setSpeedMul:m=>{spMul=m;},get vel(){return vel;}});const spd=document.getElementById('speed'),clk=new THREE.Clock(),q=new THREE.Quaternion(),e3=new THREE.Euler();let t=0,frames=0;
function loop(){requestAnimationFrame(loop);const dt=Math.min(clk.getDelta(),.05);t+=dt;
planets.forEach(p=>{p.piv.rotation.y+=p.sp*dt;p.m.rotation.y+=p.spin*dt;});clouds.rotation.y+=.015*dt;moonPiv.rotation.y+=.05*dt;moonPiv.parent.updateMatrixWorld();astG.rotation.y+=.003*dt;ring.rotation.z+=.12*dt;station.rotation.y+=.004*dt;navs.forEach(n=>n.m.visible=((t+n.ph)%1.6)<.25);
starMat.uniforms.t.value=t;sunMat.uniforms.t.value=t;coronaMat.uniforms.t.value=t;
const auto=game.update(dt);if(auto){vel.set(0,0,0);rotV.set(0,0,0);lookX=lookY=0;}
if(started){const k=c=>keys[c]?1:0;
rotV.x+=-lookY*.00004;rotV.y+=-lookX*.00004;rotV.z+=(k('KeyQ')-k('KeyE'))*1.2*dt;lookX=lookY=0;
const boost=(k('ShiftLeft')||k('ShiftRight')||tb.bBoost)?4:1;
const f=(k('KeyW')+k('ArrowUp')-k('KeyS')-k('ArrowDown')-joy.y),sx=(k('KeyD')+k('ArrowRight')-k('KeyA')-k('ArrowLeft')+joy.x),up=(k('Space')+(tb.bUp||0)-k('KeyC')-(tb.bDown||0));
inF=f;inX=sx;boostOn=boost>1;
if(kid){rotV.y+=-sx*.07*dt;rotV.x+=up*.05*dt;vel.addScaledVector(tmpV.set(0,0,-Math.max(f,-.3)).multiplyScalar(60*boost*spMul).applyQuaternion(ship.quaternion),dt);} // kid flight: left/right = turn, forward only
else vel.addScaledVector(tmpV.set(sx,up,-f).multiplyScalar(60*boost).applyQuaternion(ship.quaternion),dt);}
rotV.multiplyScalar(Math.pow(.02,dt));vel.multiplyScalar(Math.pow(.45,dt));
ship.quaternion.multiply(q.setFromEuler(e3.set(rotV.x,rotV.y,rotV.z)));ship.position.addScaledVector(vel,dt);
const s=auto?game.speed:vel.length(),sw=Math.min(s/400,1);if(!window.__dbg?.freeze)cam.position.set(Math.sin(t*1.7)*.15*sw,Math.sin(t*2.3)*.12*sw,0);if(!window.__dbg?.freeze)cam.rotation.z=Math.sin(t*.9)*.01*sw;cam.fov=70+sw*8;cam.updateProjectionMatrix();
const P=dg.attributes.position.array,o=ship.position;for(let i=0;i<DN*3;i+=3)for(let j=0;j<3;j++){const c=o.getComponent(j);let v=P[i+j];if(v-c>DR)v-=2*DR;else if(v-c<-DR)v+=2*DR;P[i+j]=v;}
dg.attributes.position.needsUpdate=true;starG.position.copy(o);
fpsShow+=((1/Math.max(dt,1e-3))-fpsShow)*.05;fwd.set(0,0,-1).applyQuaternion(ship.quaternion);
Object.assign(cst,{mission,t,speed:s,thrust:Math.min(1,Math.abs(inF)*(boostOn?1:.6)+s/2000),boost:boostOn,heading:(Math.atan2(fwd.x,-fwd.z)*180/Math.PI+360)%360,pitch:Math.asin(THREE.MathUtils.clamp(fwd.y,-1,1))*180/Math.PI,pos:ship.position,lvl,quality:QN[lvl],fps:fpsShow,inF,inX});cockpit.update(dt,cst);
if(!started){inF*=.9;inX*=.9;}
R.info.reset();if(useBloom&&frames>8)comp.render();else R.render(S,cam);if(frames>60)adapt(dt);
if(++frames===1){window.__firstFrame=performance.now();document.body.classList.add('ready');}
if(frames===3)setTimeout(()=>{upgradeSky();window.__skyHi=1;},50);
if(frames===20)setTimeout(()=>setQ(lvl),0);}
loop();
window.__dbg={game,R,ship,earth,station,THREE,cam,setQ,prog,cockpit};
