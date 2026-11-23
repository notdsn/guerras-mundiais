// Renderizador do mapa (canvas 2D) + toque/arraste/pinça
'use strict';
const MAPA={};
(function(){
const WW=GEO.W,WH=GEO.H;let cv,ctx,dpr=1,VW=0,VH=0;const cam={x:1900,y:500,z:1};MAPA.cam=cam;
let base=null,baseEra=-1;const BS=Math.min(0.8,4096/WW);
let provPath=[],coastPath,edgesPath,borderPath,fogPath,ownerPaths={},labels=[],playerPath=null;
let sujoDono=true,sujoFog=true;MAPA.sujar=()=>{sujoDono=true;sujoFog=true};MAPA.sujarFog=()=>{sujoFog=true};
const fx=[];MAPA.fx=fx;let hits=[];let tempo=0;
const dec=a=>{const o=[];let x=0,y=0;for(let i=0;i<a.length;i+=2){x+=a[i];y+=a[i+1];o.push([x/2,y/2])}return o};
function ringsPath(rings,p=new Path2D()){for(const r of rings){p.moveTo(r[0][0],r[0][1]);for(let i=1;i<r.length;i++)p.lineTo(r[i][0],r[i][1]);p.closePath()}return p}
const pip=(x,y,rings)=>{let ins=false;for(const r of rings){for(let i=0,j=r.length-1;i<r.length;j=i++){const xi=r[i][0],yi=r[i][1],xj=r[j][0],yj=r[j][1];if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))ins=!ins}}return ins};
MAPA.init=(canvas)=>{cv=canvas;ctx=cv.getContext('2d');
 provPath=SIM.P.map(p=>ringsPath(p.rings));
 coastPath=new Path2D();MAPA.landRings=[];for(const c of GEO.countries)for(const r of c.r){const rr=dec(r);MAPA.landRings.push(rr);ringsPath([rr],coastPath)}
 edgesPath=new Path2D();for(const e of SIM.E){const l=e.pts;edgesPath.moveTo(l[0][0],l[0][1]);for(let i=1;i<l.length;i++)edgesPath.lineTo(l[i][0],l[i][1])}
 resize();window.addEventListener('resize',resize);entrada()};
function resize(){dpr=Math.min(window.devicePixelRatio||1,2.5);VW=cv.clientWidth;VH=cv.clientHeight;cv.width=Math.round(VW*dpr);cv.height=Math.round(VH*dpr);limitar()}
MAPA.resize=resize;
const zMin=()=>Math.max(VW/WW,VH/WH)*1.0;MAPA.zMin=zMin;
function limitar(){cam.z=Math.max(zMin(),Math.min(7,cam.z));const vw=VW/cam.z,vh=VH/cam.z;cam.x=Math.max(-vw*.3,Math.min(WW-vw*.7,cam.x));cam.y=Math.max(-vh*.25,Math.min(WH-vh*.75,cam.y))}
MAPA.centro=()=>[cam.x+VW/cam.z/2,cam.y+VH/cam.z/2];
let voo=null;MAPA.voar=(x,y,z,dur=.8)=>{const [cx,cy]=MAPA.centro();voo={x0:cx,y0:cy,z0:cam.z,x1:x,y1:y,z1:z||cam.z,t:0,dur}};
MAPA.olhar=(x,y,z)=>{cam.z=z||cam.z;cam.x=x-VW/cam.z/2;cam.y=y-VH/cam.z/2;limitar()};
// ---------- cores
function hexRgb(c){if(c.startsWith('hsl')){const m=c.match(/[\d.]+/g).map(Number);const h=m[0]/360,s=m[1]/100,l=m[2]/100;const f=(n)=>{const k=(n+h*12)%12;const a=s*Math.min(l,1-l);return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))))};return [f(0),f(8),f(4)]}const n=parseInt(c.slice(1),16);return [n>>16&255,n>>8&255,n&255]}
MAPA.hexRgb=hexRgb;
function corEra(c,e){let [r,g,b]=hexRgb(c);if(e===0){const s=.38;r=r*(1-s)+190*s;g=g*(1-s)+160*s;b=b*(1-s)+110*s}else if(e===1){const s=.25;r=r*(1-s)+120*s;g=g*(1-s)+120*s;b=b*(1-s)+90*s}else if(e===3){r=Math.min(255,r*1.05);g=Math.min(255,g*1.05);b=Math.min(255,b*1.1)}return `rgb(${r|0},${g|0},${b|0})`}
MAPA.corEra=corEra;
// ---------- base (oceano + terreno), refeita quando muda a era
function ruido(n,alpha,cores){const c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');const im=x.createImageData(n,n);for(let i=0;i<im.data.length;i+=4){const v=Math.random();const col=cores[(v*cores.length)|0];im.data[i]=col[0];im.data[i+1]=col[1];im.data[i+2]=col[2];im.data[i+3]=Math.random()*alpha}x.putImageData(im,0,0);return c}
function rnd(s){return()=>{s=(s*16807)%2147483647;return s/2147483647}}
function desenharBase(e){const T=TEMAS[e];const c=document.createElement('canvas');c.width=Math.round(WW*BS);c.height=Math.round(WH*BS);const x=c.getContext('2d');x.scale(BS,BS);
 // oceano
 let gr=x.createLinearGradient(0,0,0,WH);gr.addColorStop(0,T.oceano[1]);gr.addColorStop(.5,T.oceano[0]);gr.addColorStop(1,T.oceano[1]);x.fillStyle=gr;x.fillRect(0,0,WW,WH);
 const rg=x.createRadialGradient(WW/2,WH/2,100,WW/2,WH/2,WW*.6);rg.addColorStop(0,'rgba(255,255,255,.06)');rg.addColorStop(1,'rgba(0,0,0,.25)');x.fillStyle=rg;x.fillRect(0,0,WW,WH);
 // ondas
 const R=rnd(7);x.strokeStyle=e>=2?'rgba(120,200,255,.05)':'rgba(255,255,255,.045)';x.lineWidth=1.2;for(let i=0;i<2600;i++){const px=R()*WW,py=R()*WH;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+5,py-2.5,px+10,py);x.stroke()}
 // grade
 x.strokeStyle=T.grade;x.lineWidth=e>=2?1:1.4;if(e===3){x.setLineDash([2,6])}
 const my=lat=>1.25*Math.log(Math.tan(Math.PI/4+.4*lat*Math.PI/180));const YT=my(84),SC=WW/(2*Math.PI);
 for(let lon=-165;lon<=190;lon+=15){const px=(lon+170)/360*WW;x.beginPath();x.moveTo(px,0);x.lineTo(px,WH);x.stroke()}for(let lat=-45;lat<=75;lat+=15){const py=(YT-my(lat))*SC;x.beginPath();x.moveTo(0,py);x.lineTo(WW,py);x.stroke()}x.setLineDash([]);
 if(e===2){x.strokeStyle='rgba(80,190,255,.05)';x.lineWidth=1;for(let r=200;r<2600;r+=200){x.beginPath();x.arc(WW*.48,WH*.42,r,0,7);x.stroke()}}
 // águas rasas
 x.lineJoin='round';for(const [w,a] of [[34,.07],[20,.1],[10,.14],[4,.2]]){x.strokeStyle=T.costa;x.globalAlpha=a;x.lineWidth=w;x.stroke(coastPath)}x.globalAlpha=1;
 // terra
 x.fillStyle=T.terra;x.fill(coastPath);
 x.save();x.clip(coastPath);
 for(const p of SIM.P){const t=TERRENOS[p.ter];if(!t.cor)continue;x.globalAlpha=e>=2?.28:.5;x.fillStyle=t.cor;x.fill(provPath[p.id])}x.globalAlpha=1;
 // textura de relevo
 const nz=ruido(256,e>=2?40:70,e>=2?[[0,0,0],[255,255,255]]:[[60,40,20],[255,245,220],[0,0,0]]);x.fillStyle=x.createPattern(nz,'repeat');x.fillRect(0,0,WW,WH);
 // símbolos de terreno
 const R2=rnd(11);
 for(const p of SIM.P){const t=p.ter;if(t==='pla'||t==='urb')continue;const [bx0,by0,bx1,by1]=p.bb;const area=(bx1-bx0)*(by1-by0);const nq=Math.min(260,Math.round(area/(t==='mon'?55:70)));
  for(let i=0;i<nq;i++){const px=bx0+R2()*(bx1-bx0),py=by0+R2()*(by1-by0);if(!pip(px,py,p.rings))continue;
   if(t==='mon'){const s=2.2+R2()*2.2;x.fillStyle=e>=2?'rgba(170,200,220,.22)':'rgba(90,65,40,.42)';x.beginPath();x.moveTo(px-s,py+s*.6);x.lineTo(px,py-s);x.lineTo(px+s,py+s*.6);x.fill();x.fillStyle=e>=2?'rgba(255,255,255,.18)':'rgba(255,250,235,.5)';x.beginPath();x.moveTo(px,py-s);x.lineTo(px-s*.35,py-s*.2);x.lineTo(px+s*.1,py-s*.35);x.fill()}
   else if(t==='flo'||t==='sel'){x.fillStyle=e>=2?'rgba(80,160,120,.18)':(t==='sel'?'rgba(25,70,30,.38)':'rgba(40,70,35,.34)');x.beginPath();x.arc(px,py,1+R2()*1.3,0,7);x.fill()}
   else if(t==='des'){x.strokeStyle=e>=2?'rgba(220,200,150,.14)':'rgba(150,110,50,.3)';x.lineWidth=.7;x.beginPath();x.arc(px,py+2,2.4,Math.PI*1.15,Math.PI*1.85);x.stroke()}
   else if(t==='fri'){x.fillStyle='rgba(255,255,255,'+(e>=2?.12:.4)+')';x.beginPath();x.arc(px,py,1.2,0,7);x.fill()}}}
 // sombra interna do litoral
 x.strokeStyle='rgba(0,0,0,.22)';x.lineWidth=5;x.stroke(coastPath);x.restore();
 x.strokeStyle=e>=2?'rgba(150,220,255,.35)':'rgba(40,25,10,.55)';x.lineWidth=1;x.stroke(coastPath);
 // vinheta / papel
 if(e===0){x.fillStyle=x.createPattern(ruido(256,40,[[120,90,50],[255,240,200]]),'repeat');x.fillRect(0,0,WW,WH);const v=x.createRadialGradient(WW/2,WH/2,WW*.25,WW/2,WH/2,WW*.7);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(70,40,10,.35)');x.fillStyle=v;x.fillRect(0,0,WW,WH)}
 if(e===3){x.strokeStyle='rgba(60,255,200,.035)';x.lineWidth=1;const hs=24;for(let yy=0;yy<WH;yy+=hs*.866){for(let xx=((yy/(hs*.866))%2)*hs/2;xx<WW;xx+=hs){x.beginPath();for(let k=0;k<6;k++){const an=Math.PI/3*k+Math.PI/6;x.lineTo(xx+Math.cos(an)*hs/2,yy+Math.sin(an)*hs/2)}x.closePath();x.stroke()}}}
 base=c;baseEra=e}
MAPA.base=()=>base;
// ---------- caminhos dinâmicos
function refazerDonos(){const S=SIM.get();ownerPaths={};for(let i=0;i<SIM.NP;i++){const d=S.prov[i].d;(ownerPaths[d]=ownerPaths[d]||new Path2D()).addPath(provPath[i])}
 borderPath=new Path2D();for(const e of SIM.E){if(S.prov[e.a].d===S.prov[e.b].d)continue;const l=e.pts;borderPath.moveTo(l[0][0],l[0][1]);for(let i=1;i<l.length;i++)borderPath.lineTo(l[i][0],l[i][1])}
 playerPath=ownerPaths[S.jog]||null;
 // rótulos: componentes conexas por dono
 labels=[];const vis=new Uint8Array(SIM.NP);for(let i=0;i<SIM.NP;i++){if(vis[i])continue;const d=S.prov[i].d;const comp=[];const st=[i];vis[i]=1;while(st.length){const p=st.pop();comp.push(p);for(const q of SIM.P[p].a)if(!vis[q]&&S.prov[q].d===d){vis[q]=1;st.push(q)}}
  let area=0,sx=0,sy=0,x0=1e9,x1=-1e9;for(const p of comp){const b=SIM.P[p].bb;const a=(b[2]-b[0])*(b[3]-b[1]);area+=a;sx+=SIM.P[p].x*a;sy+=SIM.P[p].y*a;x0=Math.min(x0,b[0]);x1=Math.max(x1,b[2])}
  if(area<300)continue;labels.push({d,x:sx/area,y:sy/area,area,w:x1-x0,n:comp.length})}
 const best={};for(const l of labels){if(!best[l.d]||best[l.d].area<l.area)best[l.d]=l}labels=labels.filter(l=>best[l.d]===l||l.area>best[l.d].area*.35);
 sujoDono=false}
function refazerFog(){const S=SIM.get();fogPath=new Path2D();const v=S.visivel;if(v)for(let i=0;i<SIM.NP;i++)if(!v[i])fogPath.addPath(provPath[i]);sujoFog=false}
// ---------- efeitos
MAPA.explosao=(x,y,g=1)=>{fx.push({t:'exp',x,y,g,v:0,dur:.9+g*.3});for(let i=0;i<3+g*3;i++)fx.push({t:'fum',x:x+(Math.random()-.5)*6*g,y:y+(Math.random()-.5)*4*g,g,v:0,dur:2+Math.random()*1.5,dx:(Math.random()-.3)*4,dy:-2-Math.random()*3})};
MAPA.onda=(x,y,cor)=>fx.push({t:'onda',x,y,cor,v:0,dur:1.4});
MAPA.voo=(x0,y0,x1,y1,img,cor)=>fx.push({t:'voo',x0,y0,x1,y1,img,cor,v:0,dur:1.2});
MAPA.missil=(x0,y0,x1,y1,dur)=>fx.push({t:'mis',x0,y0,x1,y1,v:0,dur,trail:[]});
// ---------- desenho
const W2S=(x,y)=>[(x-cam.x)*cam.z,(y-cam.y)*cam.z];MAPA.W2S=W2S;
const S2W=(sx,sy)=>[sx/cam.z+cam.x,sy/cam.z+cam.y];MAPA.S2W=S2W;
MAPA.sel=null;MAPA.selProv=null;MAPA.preview=null;
MAPA.desenhar=(dt)=>{const S=SIM.get();if(!S||!ctx)return;tempo+=dt;
 if(voo){voo.t+=dt;let f=Math.min(1,voo.t/voo.dur);const e=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;const zz=voo.z0+(voo.z1-voo.z0)*e;cam.z=zz;const cx=voo.x0+(voo.x1-voo.x0)*e,cy=voo.y0+(voo.y1-voo.y0)*e;cam.x=cx-VW/zz/2;cam.y=cy-VH/zz/2;limitar();if(f>=1)voo=null}
 if(inercia&&!ptrs.size){cam.x-=inercia.vx*dt/cam.z;cam.y-=inercia.vy*dt/cam.z;inercia.vx*=Math.pow(.02,dt);inercia.vy*=Math.pow(.02,dt);limitar();if(Math.hypot(inercia.vx,inercia.vy)<5)inercia=null}
 const eraV=SIM.eraVisual();if(baseEra!==eraV)desenharBase(eraV);if(sujoDono)refazerDonos();if(sujoFog)refazerFog();
 const T=TEMAS[eraV];const z=cam.z;const k=z*dpr;
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=T.oceano[1];ctx.fillRect(0,0,cv.width,cv.height);
 ctx.setTransform(k,0,0,k,-cam.x*k,-cam.y*k);
 ctx.imageSmoothingEnabled=true;ctx.drawImage(base,0,0,WW,WH);
 // países
 ctx.globalAlpha=T.fillA;for(const d in ownerPaths){const n=S.nac[d];ctx.fillStyle=corEra(n?n.cor:'#888',eraV);ctx.fill(ownerPaths[d])}ctx.globalAlpha=1;
 // destaque do jogador (listras suaves)
 if(playerPath){ctx.save();ctx.clip(playerPath);ctx.strokeStyle=corEra(S.nac[S.jog].cor,eraV);ctx.globalAlpha=.55;ctx.lineWidth=9/z;ctx.stroke(borderPath);ctx.restore();ctx.globalAlpha=1}
 // guerra: inimigos com contorno vermelho interno
 ctx.lineJoin='round';
 ctx.strokeStyle=T.prov;ctx.lineWidth=.8/z;ctx.stroke(edgesPath);
 ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=3.2/z;ctx.stroke(borderPath);ctx.strokeStyle=T.borda;ctx.lineWidth=1.3/z;ctx.globalAlpha=eraV>=2?.85:.7;ctx.stroke(borderPath);ctx.globalAlpha=1;
 if(eraV>=2){ctx.save();ctx.shadowColor=T.borda;ctx.shadowBlur=6;ctx.strokeStyle=T.borda;ctx.globalAlpha=.35;ctx.lineWidth=1/z;ctx.stroke(borderPath);ctx.restore();ctx.globalAlpha=1}
 // névoa
 ctx.fillStyle=T.neblina;ctx.fill(fogPath);
 // província selecionada
 if(MAPA.selProv!=null){const p=provPath[MAPA.selProv];ctx.save();ctx.shadowColor='#fff';ctx.shadowBlur=12;ctx.strokeStyle='#fff';ctx.lineWidth=2.4/z;ctx.stroke(p);ctx.restore();ctx.fillStyle='rgba(255,255,255,.12)';ctx.fill(p)}
 // prévia de destino
 if(MAPA.preview&&MAPA.preview.node<SIM.NP){ctx.strokeStyle='#ffd34d';ctx.setLineDash([4/z,3/z]);ctx.lineWidth=2/z;ctx.stroke(provPath[MAPA.preview.node]);ctx.setLineDash([])}
 // ----- espaço de tela
 ctx.setTransform(dpr,0,0,dpr,0,0);
 const vx0=cam.x,vy0=cam.y,vx1=cam.x+VW/z,vy1=cam.y+VH/z;const naTela=(x,y,m=20)=>x>vx0-m/z&&x<vx1+m/z&&y>vy0-m/z&&y<vy1+m/z;
 // rótulos de nações
 if(z<2.2){ctx.textAlign='center';ctx.textBaseline='middle';const fade=Math.min(1,(2.2-z)/.6);
  for(const l of labels){if(!naTela(l.x,l.y,200))continue;const n=S.nac[l.d];if(!n)continue;let fs=Math.sqrt(l.area)*.32*z;fs=Math.min(fs,Math.max(9,l.w*z/ (SIM.nomeNac(l.d).length*.75)));if(fs<8.5)continue;fs=Math.min(fs,46);
   const [sx,sy]=W2S(l.x,l.y);ctx.font=`${eraV===0?'600':'500'} ${fs.toFixed(1)}px ${T.fonte}`;try{ctx.letterSpacing=(fs*.12).toFixed(1)+'px'}catch(e){}
   const txt=SIM.nomeNac(l.d).toUpperCase();ctx.globalAlpha=fade*(eraV>=2?.8:.75);ctx.lineWidth=Math.max(2,fs*.14);ctx.strokeStyle=T.txtSombra;ctx.strokeText(txt,sx,sy);ctx.fillStyle=l.d===S.jog?(eraV>=2?'#fff':'#1a0e05'):T.txt;ctx.fillText(txt,sx,sy)}
  ctx.globalAlpha=1;try{ctx.letterSpacing='0px'}catch(e){}}
 // cidades
 const occ=new Set();
 for(const p of SIM.P){if(!naTela(p.x,p.y))continue;const pr=S.prov[p.id];const n=S.nac[pr.d];const ehCap=n&&n.cap===p.id;const imp=ehCap||p.pop>2500||(z>.9&&p.pop>600)||z>1.6;if(!imp)continue;const [sx,sy]=W2S(p.x,p.y);
  if(ehCap){estrela(sx,sy,z>1?6:4.5,eraV)}else{ctx.fillStyle=eraV>=2?'#e8f6ff':'#2a1a0c';ctx.beginPath();ctx.arc(sx,sy,z>1.4?2.6:1.8,0,7);ctx.fill();ctx.strokeStyle=eraV>=2?'rgba(0,0,0,.7)':'rgba(255,240,210,.85)';ctx.lineWidth=1;ctx.stroke()}
  if(z>1.25){const key=((sx/70)|0)+','+((sy/18)|0);if(!occ.has(key)){occ.add(key);ctx.font=`600 ${z>2.4?12:10.5}px Inter, system-ui, sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.lineWidth=3;ctx.strokeStyle=T.txtSombra;ctx.strokeText(p.n,sx,sy+5);ctx.fillStyle=T.txt;ctx.fillText(p.n,sx,sy+5)}}
  if(z>2.3)predios(sx,sy,pr.b,eraV);
  if(pr.cerco>0&&pr.cd){const prog=pr.cerco/SIM.precCerco(p.id);ctx.strokeStyle='rgba(0,0,0,.6)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(sx,sy,10,0,7);ctx.stroke();ctx.strokeStyle=corEra(S.nac[pr.cd].cor,3);ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy,10,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);ctx.stroke()}}
 // caminhos
 const exs=S.exs;ctx.lineCap='round';
 for(const a of exs){if(!a.path.length)continue;const meu=a.dono===S.jog;if(!meu&&!(MAPA.sel===a.id))continue;
  ctx.beginPath();let [sx,sy]=W2S(a.x,a.y);ctx.moveTo(sx,sy);for(const n of a.path){[sx,sy]=W2S(SIM.nx(n),SIM.ny(n));ctx.lineTo(sx,sy)}
  ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle=MAPA.sel===a.id?'#ffd34d':(eraV>=2?'#7fe3ff':'#fff4d6');ctx.lineWidth=2.4;ctx.setLineDash([7,6]);ctx.lineDashOffset=-tempo*22;ctx.stroke();ctx.setLineDash([]);
  const L=a.path.length;const p2=a.path[L-1],p1=L>1?a.path[L-2]:null;const [ex,ey]=W2S(SIM.nx(p2),SIM.ny(p2));const [fx0,fy0]=p1!=null?W2S(SIM.nx(p1),SIM.ny(p1)):W2S(a.x,a.y);const an=Math.atan2(ey-fy0,ex-fx0);
  ctx.fillStyle=MAPA.sel===a.id?'#ffd34d':'#fff4d6';ctx.beginPath();ctx.moveTo(ex+Math.cos(an)*7,ey+Math.sin(an)*7);ctx.lineTo(ex+Math.cos(an+2.4)*8,ey+Math.sin(an+2.4)*8);ctx.lineTo(ex+Math.cos(an-2.4)*8,ey+Math.sin(an-2.4)*8);ctx.fill()}
 // batalhas
 for(const node of S.batalhas){const x=SIM.nx(node),y=SIM.ny(node);if(!naTela(x,y)||(node<SIM.NP&&!S.visivel[node]))continue;if(Math.random()<dt*3)MAPA.explosao(x+(Math.random()-.5)*14/z,y+(Math.random()-.5)*10/z,Math.random()<.3?2:1)}
 // exércitos
 hits=[];const grupos=new Map();const cel=z<.45?34:z<1.1?26:0;
 for(const a of exs){if(!SIM.exeVisivel(a))continue;if(!naTela(a.x,a.y,40))continue;let [sx,sy]=W2S(a.x,a.y);
  if(cel){const key=a.dono+':'+Math.round(sx/cel)+':'+Math.round(sy/cel)+(SIM.ehNaval(a)?'n':'');let g=grupos.get(key);if(!g)grupos.set(key,g={l:[],sx:0,sy:0});g.l.push(a);g.sx+=sx;g.sy+=sy}else{const key=a.node+':'+(a.path.length&&a.prog>0?'m'+a.id:'');let g=grupos.get(key);if(!g)grupos.set(key,g={l:[],sx:0,sy:0,pilha:1});g.l.push(a);g.sx+=sx;g.sy+=sy}}
 const sel=MAPA.sel;
 for(const g of grupos.values()){const n=g.l.length;let cx=g.sx/n,cy=g.sy/n;if(g.pilha&&n>1){g.l.forEach((a,i)=>{const off=(i-(n-1)/2)*30;contador(a,[a],cx+off,cy-8,eraV,sel)})}else contador(g.l[0],g.l,cx,cy-8,eraV,sel)}
 // efeitos
 for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.v+=dt;if(f.v>=f.dur){fx.splice(i,1);continue}const r=f.v/f.dur;
  if(f.t==='exp'){const [sx,sy]=W2S(f.x,f.y);const R=(6+f.g*7)*(.4+r)*(.7+z*.2);const g=ctx.createRadialGradient(sx,sy,0,sx,sy,R);g.addColorStop(0,`rgba(255,250,210,${1-r})`);g.addColorStop(.35,`rgba(255,170,40,${.9*(1-r)})`);g.addColorStop(1,'rgba(200,40,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,R,0,7);ctx.fill()}
  else if(f.t==='fum'){const [sx,sy]=W2S(f.x+f.dx*f.v,f.y+f.dy*f.v);const R=(3+f.g*3+r*10)*(.7+z*.2);ctx.fillStyle=`rgba(60,55,50,${.35*(1-r)})`;ctx.beginPath();ctx.arc(sx,sy,R,0,7);ctx.fill()}
  else if(f.t==='onda'){const [sx,sy]=W2S(f.x,f.y);ctx.strokeStyle=f.cor;ctx.globalAlpha=1-r;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy,10+r*60,0,7);ctx.stroke();ctx.globalAlpha=1}
  else if(f.t==='mis'){const e=r;const x=f.x0+(f.x1-f.x0)*e,y=f.y0+(f.y1-f.y0)*e-Math.sin(e*Math.PI)*Math.hypot(f.x1-f.x0,f.y1-f.y0)*.25;const [sx,sy]=W2S(x,y);f.trail.push([x,y]);if(f.trail.length>40)f.trail.shift();
   ctx.strokeStyle='rgba(230,230,230,.5)';ctx.lineWidth=2.5;ctx.beginPath();f.trail.forEach(([tx,ty],j)=>{const [a,b]=W2S(tx,ty);j?ctx.lineTo(a,b):ctx.moveTo(a,b)});ctx.stroke();ctx.fillStyle='#ffe9a8';ctx.shadowColor='#ff8a00';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(sx,sy,3.5,0,7);ctx.fill();ctx.shadowBlur=0}}
 // aviões em missão (desenhados por cima)
 for(const a of exs){if(!a.missao||!SIM.exeVisivel(a))continue}
};
function estrela(x,y,r,e){ctx.save();ctx.translate(x,y);ctx.beginPath();for(let i=0;i<10;i++){const rr=i%2?r*.45:r;const an=-Math.PI/2+i*Math.PI/5;ctx.lineTo(Math.cos(an)*rr,Math.sin(an)*rr)}ctx.closePath();ctx.fillStyle=e>=2?'#ffd34d':'#b0121b';ctx.fill();ctx.strokeStyle=e>=2?'#000':'#fff3d6';ctx.lineWidth=1.3;ctx.stroke();ctx.restore()}
const PI={qua:'Q',fab:'F',por:'P',aer:'A',fort:'▲',fer:'≡'};
function predios(x,y,b,e){let i=0;for(const k of ['qua','fab','por','aer','fort']){if(!b[k])continue;const bx=x-26+i*13,by=y+20;ctx.fillStyle=e>=2?'rgba(10,30,45,.85)':'rgba(40,28,15,.85)';ctx.fillRect(bx,by,12,12);ctx.fillStyle=e>=2?'#8fe3ff':'#ffe6b0';ctx.font='700 8px Inter, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(PI[k]+(b[k]>1?b[k]:''),bx+6,by+6.5);i++}}
function contador(a,lista,sx,sy,e,sel){const S=SIM.get();const n=S.nac[a.dono];const meu=a.dono===S.jog;const inimigo=SIM.emGuerra(a.dono,S.jog);const z=cam.z;
 let units=0;const tipos={};let hp=0,hpm=0;for(const b of lista)for(const u of b.units){units++;tipos[u.t]=(tipos[u.t]||0)+1;hp+=u.hp;hpm+=SIM.hpMax(u)}
 let top=Object.entries(tipos).sort((x,y)=>{const pr=t=>({arm:3,inf:2,nav:3,car:4,bom:2,fig:3}[t]||1);return y[1]*pr(y[0])-x[1]*pr(x[0])})[0][0];
 let ue=0;for(const b of lista)for(const u of b.units)if(u.t===top)ue=Math.max(ue,u.e);
 const sc=Math.max(.72,Math.min(1.2,.66+z*.12));const w=40*sc,h=28*sc;const x=sx-w/2,y=sy-h/2;const aer=SIM.ehAereo(a),nav=SIM.ehNaval(a);
 const cor=corEra(n.cor,3);const [r,g,b]=hexRgb(n.cor);
 ctx.save();if(a.missao)ctx.globalAlpha=.95;
 // sombra
 ctx.fillStyle='rgba(0,0,0,.45)';rr(x+1.5,y+2.5,w,h,aer?h/2:6);ctx.fill();
 const grd=ctx.createLinearGradient(0,y,0,y+h);grd.addColorStop(0,`rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`);grd.addColorStop(1,`rgb(${r*.55|0},${g*.55|0},${b*.55|0})`);
 ctx.fillStyle=grd;rr(x,y,w,h,aer?h/2:nav?h/2.6:6);ctx.fill();
 ctx.lineWidth=sel===a.id?2.6:1.4;ctx.strokeStyle=sel===a.id?'#ffd34d':meu?'#fff2c4':inimigo?'#ff4b4b':'rgba(0,0,0,.65)';ctx.stroke();
 if(sel===a.id){ctx.strokeStyle=`rgba(255,211,77,${.5+.5*Math.sin(tempo*6)})`;ctx.lineWidth=2;rr(x-4,y-4,w+8,h+8,10);ctx.stroke()}
 // painel claro para arte
 ctx.fillStyle='rgba(255,255,255,.18)';rr(x+3,y+3,w-6,h-9,4);ctx.fill();
 const im=ART.img[top+Math.max(ue,UNIDADES[top].era0)];if(im&&im.complete){ctx.drawImage(im,x+4,y+2.5,w-8,(w-8)*40/64*.92)}
 // barra de vida
 const fr=hpm?hp/hpm:1;ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x+4,y+h-5,w-8,3);ctx.fillStyle=fr>.6?'#5be37a':fr>.3?'#ffc93c':'#ff4b4b';ctx.fillRect(x+4,y+h-5,(w-8)*fr,3);
 // número
 const t=String(units);ctx.font=`800 ${10.5*sc}px Inter, sans-serif`;const tw=ctx.measureText(t).width+7;ctx.fillStyle=inimigo?'#c3121b':meu?'#1d2a12':'#222';rr(x+w-tw+3,y-6,tw,13*sc,6);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(t,x+w-tw/2+3,y-6+6.5*sc);
 if(lista.length>1&&cam.z<.9){ctx.fillStyle='rgba(0,0,0,.55)';rr(x-3,y-6,14,12,5);ctx.fill();ctx.fillStyle='#fff';ctx.font='700 8px Inter';ctx.fillText('×'+lista.length,x+4,y)}
 // bandeira pequena
 if(a.path.length&&!cel0()){ctx.fillStyle='#ffd34d';ctx.beginPath();ctx.moveTo(x-5,y+h/2-4);ctx.lineTo(x-1,y+h/2);ctx.lineTo(x-5,y+h/2+4);ctx.fill()}
 ctx.restore();hits.push({x,y,w,h,ids:lista.map(b=>b.id)})}
const cel0=()=>false;
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
// ---------- seleção por toque
MAPA.provEm=(wx,wy)=>{for(const p of SIM.P){const b=p.bb;if(wx<b[0]||wx>b[2]||wy<b[1]||wy>b[3])continue;if(pip(wx,wy,p.rings))return p.id}return -1};
function tocar(sx,sy){for(let i=hits.length-1;i>=0;i--){const h=hits[i];if(sx>=h.x-4&&sx<=h.x+h.w+4&&sy>=h.y-6&&sy<=h.y+h.h+4){if(MAPA.onTapExe)MAPA.onTapExe(h.ids,sx,sy);return}}
 const [wx,wy]=S2W(sx,sy);const p=MAPA.provEm(wx,wy);if(p>=0){MAPA.onTapProv&&MAPA.onTapProv(p)}else{const c=SIM.celulaMar(wx,wy);MAPA.onTapMar&&MAPA.onTapMar(c,wx,wy)}}
MAPA.tocar=tocar;
// ---------- entrada
const ptrs=new Map();let ini=null,pinch=null,inercia=null,ultimo=null;
function entrada(){cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});voo=null;inercia=null;
  if(ptrs.size===1)ini={x:e.clientX,y:e.clientY,t:performance.now(),mov:false,cx:cam.x,cy:cam.y};
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:cam.z,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};if(ini)ini.mov=true}});
 cv.addEventListener('pointermove',e=>{if(!ptrs.has(e.pointerId))return;const prev=ptrs.get(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});const r=cv.getBoundingClientRect();
  if(ptrs.size===2&&pinch){const [a,b]=[...ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y);const mx=(a.x+b.x)/2-r.left,my=(a.y+b.y)/2-r.top;const [wx,wy]=S2W(mx,my);cam.z=Math.max(zMin(),Math.min(7,pinch.z*d/pinch.d));cam.x=wx-mx/cam.z;cam.y=wy-my/cam.z;
   const pmx=pinch.mx-r.left,pmy=pinch.my-r.top;cam.x-=(mx-pmx)/cam.z;cam.y-=(my-pmy)/cam.z;pinch.mx=(a.x+b.x)/2;pinch.my=(a.y+b.y)/2;limitar();return}
  if(ini&&ptrs.size===1){const dx=e.clientX-prev.x,dy=e.clientY-prev.y;if(Math.hypot(e.clientX-ini.x,e.clientY-ini.y)>7)ini.mov=true;if(ini.mov){cam.x-=dx/cam.z;cam.y-=dy/cam.z;limitar();const now=performance.now();if(ultimo){const dtt=(now-ultimo.t)/1000||.016;inercia={vx:dx/dtt*.9,vy:dy/dtt*.9}}ultimo={t:now}}}});
 const fim=e=>{if(!ptrs.has(e.pointerId))return;ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(ptrs.size===0){if(ini&&!ini.mov&&performance.now()-ini.t<600){const r=cv.getBoundingClientRect();tocar(e.clientX-r.left,e.clientY-r.top);inercia=null}else if(ultimo&&performance.now()-ultimo.t>80)inercia=null;ini=null;ultimo=null}};
 cv.addEventListener('pointerup',fim);cv.addEventListener('pointercancel',fim);
 cv.addEventListener('wheel',e=>{e.preventDefault();const r=cv.getBoundingClientRect();const mx=e.clientX-r.left,my=e.clientY-r.top;const [wx,wy]=S2W(mx,my);cam.z=Math.max(zMin(),Math.min(7,cam.z*Math.pow(1.0015,-e.deltaY)));cam.x=wx-mx/cam.z;cam.y=wy-my/cam.z;limitar()},{passive:false})}
MAPA.zoom=f=>{const [cx,cy]=MAPA.centro();MAPA.voar(cx,cy,Math.max(zMin(),Math.min(7,cam.z*f)),.35)};
})();
