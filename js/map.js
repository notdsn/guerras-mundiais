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
// ---------- imagens das tropas (pintadas)
const IMG={};MAPA.IMG=IMG;
MAPA.carregarImgs=()=>Promise.all(['inf','tan','avi'].flatMap(t=>[0,1,2,3].map(e=>new Promise(r=>{const im=new Image();im.onload=r;im.onerror=r;im.src='img/'+t+e+'.webp';IMG[t+e]=im}))));
const TIPO_IMG={i:'inf',b:'tan',a:'avi'};MAPA.imgTipo=(k,e)=>IMG[TIPO_IMG[k]+Math.min(3,e)];
// ---------- efeitos
MAPA.explosao=(x,y,g=1)=>{fx.push({t:'exp',x,y,g,v:0,dur:.8+g*.3});for(let i=0;i<2+g*3;i++)fx.push({t:'fum',x:x+(Math.random()-.5)*8*g,y:y+(Math.random()-.5)*5*g,g,v:0,dur:1.6+Math.random()*1.4,dx:(Math.random()-.3)*5,dy:-2-Math.random()*3})};
MAPA.onda=(x,y,cor)=>fx.push({t:'onda',x,y,cor,v:0,dur:1.4});
MAPA.texto=(x,y,txt,cor)=>fx.push({t:'txt',x,y,txt,cor,v:0,dur:1.6});
// marcha: soldados/tanques/aviões indo de (x0,y0) até (x1,y1)
MAPA.marcha=(x0,y0,x1,y1,tipo,era,dur=1.5,cor='#fff')=>fx.push({t:'mar',x0,y0,x1,y1,tipo,era,v:0,dur,cor});
let tremor=0;MAPA.tremer=v=>{tremor=Math.max(tremor,v)};
// ---------- desenho
const W2S=(x,y)=>[(x-cam.x)*cam.z,(y-cam.y)*cam.z];MAPA.W2S=W2S;
const S2W=(sx,sy)=>[sx/cam.z+cam.x,sy/cam.z+cam.y];MAPA.S2W=S2W;
MAPA.selProv=null;MAPA.alvos=null;MAPA.moveis=null;MAPA.missao=null;MAPA.esconder=new Set();
MAPA.desenhar=(dt)=>{const S=SIM.get();if(!S||!ctx)return;tempo+=dt;
 if(voo){voo.t+=dt;let f=Math.min(1,voo.t/voo.dur);const e=f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2;const zz=voo.z0+(voo.z1-voo.z0)*e;cam.z=zz;const cx=voo.x0+(voo.x1-voo.x0)*e,cy=voo.y0+(voo.y1-voo.y0)*e;cam.x=cx-VW/zz/2;cam.y=cy-VH/zz/2;limitar();if(f>=1)voo=null}
 if(inercia&&!ptrs.size){cam.x-=inercia.vx*dt/cam.z;cam.y-=inercia.vy*dt/cam.z;inercia.vx*=Math.pow(.02,dt);inercia.vy*=Math.pow(.02,dt);limitar();if(Math.hypot(inercia.vx,inercia.vy)<5)inercia=null}
 const eraV=SIM.eraVisual();if(baseEra!==eraV)desenharBase(eraV);if(sujoDono)refazerDonos();
 const T=TEMAS[eraV];const z=cam.z;const k=z*dpr;let tx=0,ty=0;if(tremor>0){tx=(Math.random()-.5)*tremor*10;ty=(Math.random()-.5)*tremor*10;tremor=Math.max(0,tremor-dt*1.8)}
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=T.oceano[1];ctx.fillRect(0,0,cv.width,cv.height);
 ctx.setTransform(k,0,0,k,-cam.x*k+tx*dpr,-cam.y*k+ty*dpr);
 ctx.imageSmoothingEnabled=true;ctx.drawImage(base,0,0,WW,WH);
 ctx.globalAlpha=T.fillA;for(const d in ownerPaths){const n=S.nac[d];ctx.fillStyle=corEra(n?n.cor:'#888',eraV);ctx.fill(ownerPaths[d])}ctx.globalAlpha=1;
 if(playerPath){ctx.save();ctx.clip(playerPath);ctx.strokeStyle='#fff6d0';ctx.globalAlpha=.5;ctx.lineWidth=7/z;ctx.stroke(borderPath);ctx.restore();ctx.globalAlpha=1}
 ctx.lineJoin='round';ctx.strokeStyle=T.prov;ctx.lineWidth=.8/z;ctx.stroke(edgesPath);
 ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=3.2/z;ctx.stroke(borderPath);ctx.strokeStyle=T.borda;ctx.lineWidth=1.3/z;ctx.globalAlpha=eraV>=2?.85:.7;ctx.stroke(borderPath);ctx.globalAlpha=1;
 if(playerPath){ctx.strokeStyle='#ffe9a0';ctx.lineWidth=1.6/z;ctx.globalAlpha=.9;ctx.save();ctx.clip(playerPath);ctx.stroke(borderPath);ctx.restore();ctx.globalAlpha=1}
 // rotas marítimas
 if(z>.8){ctx.save();ctx.setLineDash([5/z,5/z]);ctx.lineWidth=1.4/z;ctx.strokeStyle=eraV>=2?'rgba(140,220,255,.32)':'rgba(255,250,230,.38)';ctx.beginPath();for(const [a,b] of SIM.LIG){const A=SIM.P[a],B=SIM.P[b];if(Math.abs(A.x-B.x)>1500)continue;ctx.moveTo(A.x,A.y);ctx.lineTo(B.x,B.y)}ctx.stroke();ctx.restore()}
 const pulso=.5+.5*Math.sin(tempo*5);
 // destaques
 const dest=(set,cor,fill)=>{if(!set)return;for(const p of set){const pp=provPath[p];ctx.fillStyle=fill.replace('A',(.14+.14*pulso).toFixed(2));ctx.fill(pp);ctx.save();ctx.shadowColor=cor;ctx.shadowBlur=10;ctx.strokeStyle=cor;ctx.lineWidth=(2+1.2*pulso)/z;ctx.stroke(pp);ctx.restore()}};
 dest(MAPA.moveis,'#5bf08a','rgba(70,230,120,A)');dest(MAPA.alvos,'#ff4a3a','rgba(255,60,40,A)');
 if(MAPA.missao!=null&&!(MAPA.alvos&&MAPA.alvos.includes(MAPA.missao)))dest([MAPA.missao],'#ffb020','rgba(255,170,30,A)');
 if(MAPA.selProv!=null){const pp=provPath[MAPA.selProv];ctx.fillStyle='rgba(255,230,140,.25)';ctx.fill(pp);ctx.save();ctx.shadowColor='#ffd34d';ctx.shadowBlur=14;ctx.strokeStyle='#ffd34d';ctx.lineWidth=2.6/z;ctx.stroke(pp);ctx.restore()}
 // ----- espaço de tela
 ctx.setTransform(dpr,0,0,dpr,tx*dpr,ty*dpr);
 const vx0=cam.x,vy0=cam.y,vx1=cam.x+VW/z,vy1=cam.y+VH/z;const naTela=(x,y,m=30)=>x>vx0-m/z&&x<vx1+m/z&&y>vy0-m/z&&y<vy1+m/z;
 // nomes dos países
 if(z<2.0){ctx.textAlign='center';ctx.textBaseline='middle';const fade=Math.min(1,(2.0-z)/.6);
  for(const l of labels){if(!naTela(l.x,l.y,200))continue;const n=S.nac[l.d];if(!n)continue;let fs=Math.sqrt(l.area)*.3*z;fs=Math.min(fs,Math.max(9,l.w*z/(SIM.nomeNac(l.d).length*.75)));if(fs<10)continue;fs=Math.min(fs,42);
   const [sx,sy]=W2S(l.x,l.y);ctx.font=`${eraV===0?'600':'500'} ${fs.toFixed(1)}px ${T.fonte}`;try{ctx.letterSpacing=(fs*.12).toFixed(1)+'px'}catch(e){}
   const txt=SIM.nomeNac(l.d).toUpperCase();ctx.globalAlpha=fade*.55;ctx.lineWidth=Math.max(2,fs*.14);ctx.strokeStyle=T.txtSombra;ctx.strokeText(txt,sx,sy);ctx.fillStyle=T.txt;ctx.fillText(txt,sx,sy)}
  ctx.globalAlpha=1;try{ctx.letterSpacing='0px'}catch(e){}}
 // marcadores de cidade
 hits=[];const r=Math.max(9,Math.min(17,7+z*3.2));const cel=r*2+5;const occ=new Set();
 const alvos=new Set(MAPA.alvos||[]),moveis=new Set(MAPA.moveis||[]);const lista=[];
 for(const p of SIM.P){if(!naTela(p.x,p.y))continue;const pr=S.prov[p.id];const n=S.nac[pr.d];const cap=n&&n.cap===p.id;const meu=pr.d===S.jog;const tot=pr.i+pr.b+pr.a;
  let pri=tot+(p.pop/400);if(meu)pri+=1e4;if(cap)pri+=5e3;if(alvos.has(p.id)||moveis.has(p.id))pri+=1e6;if(p.id===MAPA.selProv||p.id===MAPA.missao)pri+=1e7;
  if(z<.75&&!cap&&pri<1e6&&!(meu&&z>.5))continue;lista.push({p,pr,n,cap,meu,tot,pri})}
 lista.sort((a,b)=>b.pri-a.pri);
 const vistos=[];
 for(const it of lista){const [sx,sy]=W2S(it.p.x,it.p.y);const key=Math.floor(sx/cel)+','+Math.floor(sy/cel);const k2=[[0,0],[1,0],[0,1],[1,1],[-1,0],[0,-1]];let livre=true;
  if(it.pri<1e6){for(const [a,b] of k2){if(occ.has((Math.floor(sx/cel)+a)+','+(Math.floor(sy/cel)+b))){livre=false;break}}if(!livre)continue}
  occ.add(key);vistos.push([it,sx,sy])}
 // nomes e figuras primeiro (atrás dos marcadores)
 for(const [it,sx,sy] of vistos){if(MAPA.esconder.has(it.p.id))continue;const fig=(z>2.3&&(it.meu||alvos.has(it.p.id)||it.p.id===MAPA.selProv||it.p.id===MAPA.missao))||it.p.id===MAPA.selProv;
  if(fig&&it.tot>0){const pr=it.pr;const n=it.n;const e=n?Math.min(3,n.era):0;const kk=pr.a*3.5>pr.b*3&&pr.a*3.5>pr.i?'a':pr.b*3>pr.i?'b':'i';const im=MAPA.imgTipo(kk,e);if(im&&im.complete&&im.naturalWidth){const w=r*3.4,h=w*im.naturalHeight/im.naturalWidth;ctx.save();ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=6;ctx.shadowOffsetY=2;ctx.drawImage(im,sx-w*.5,sy-r-h+3,w,h);ctx.restore()}}
  if(z>1.7){ctx.font=`600 ${z>2.6?11.5:10}px Inter, system-ui, sans-serif`;ctx.textAlign='center';ctx.textBaseline='top';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.strokeText(it.p.n,sx,sy+r+2);ctx.fillStyle='#fff';ctx.fillText(it.p.n,sx,sy+r+2)}}
 for(const [it,sx,sy] of vistos){if(MAPA.esconder.has(it.p.id))continue;marcador(it,sx,sy,r,eraV,alvos,moveis,pulso,S);hits.push({x:sx,y:sy,r:r+4,p:it.p.id})}
 // seta da missão
 if(MAPA.missao!=null){const p=SIM.P[MAPA.missao];const [sx,sy]=W2S(p.x,p.y);const b=Math.sin(tempo*6)*6;const y0=sy-r-30-b-(z>2.3?r*2.2:0);ctx.save();ctx.translate(sx,y0);ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=8;ctx.fillStyle='#ffb020';ctx.strokeStyle='#fff';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-9,-20);ctx.lineTo(9,-20);ctx.lineTo(9,-2);ctx.lineTo(17,-2);ctx.lineTo(0,16);ctx.lineTo(-17,-2);ctx.lineTo(-9,-2);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
 // efeitos
 for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.v+=dt;if(f.v>=f.dur){fx.splice(i,1);continue}const q=f.v/f.dur;
  if(f.t==='exp'){const [sx,sy]=W2S(f.x,f.y);const R=(8+f.g*9)*(.4+q)*(.8+z*.15);const g=ctx.createRadialGradient(sx,sy,0,sx,sy,R);g.addColorStop(0,`rgba(255,250,210,${1-q})`);g.addColorStop(.35,`rgba(255,170,40,${.9*(1-q)})`);g.addColorStop(1,'rgba(200,40,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(sx,sy,R,0,7);ctx.fill()}
  else if(f.t==='fum'){const [sx,sy]=W2S(f.x+f.dx*f.v,f.y+f.dy*f.v);const R=(4+f.g*3+q*12)*(.8+z*.15);ctx.fillStyle=`rgba(50,45,40,${.4*(1-q)})`;ctx.beginPath();ctx.arc(sx,sy,R,0,7);ctx.fill()}
  else if(f.t==='onda'){const [sx,sy]=W2S(f.x,f.y);ctx.strokeStyle=f.cor;ctx.globalAlpha=1-q;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy,10+q*60,0,7);ctx.stroke();ctx.globalAlpha=1}
  else if(f.t==='txt'){const [sx,sy]=W2S(f.x,f.y);ctx.globalAlpha=Math.min(1,(1-q)*2);ctx.font='800 18px Oswald, Impact, sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='rgba(0,0,0,.8)';ctx.strokeText(f.txt,sx,sy-20-q*30);ctx.fillStyle=f.cor||'#fff';ctx.fillText(f.txt,sx,sy-20-q*30);ctx.globalAlpha=1}
  else if(f.t==='mar'){const e=q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;const aer=f.tipo==='a';const x=f.x0+(f.x1-f.x0)*e,y=f.y0+(f.y1-f.y0)*e-(aer?Math.sin(e*Math.PI)*Math.hypot(f.x1-f.x0,f.y1-f.y0)*.35:0);const [sx,sy]=W2S(x,y);
   const im=MAPA.imgTipo(f.tipo,f.era);const ang=Math.atan2(f.y1-f.y0,f.x1-f.x0);const esq=Math.cos(ang)<0;const W0=aer?70:f.tipo==='b'?78:70;
   for(let j=(aer?0:2);j>=0;j--){const ox=-Math.cos(ang)*j*22-Math.sin(ang)*(j%2?10:-10)*(j?1:0),oy=-Math.sin(ang)*j*22+Math.cos(ang)*(j%2?10:-10)*(j?1:0);const bob=aer?0:Math.abs(Math.sin(tempo*12+j))*-3;
    if(!aer&&Math.random()<dt*14)fx.push({t:'poe',x:x+(ox/z)+(Math.random()-.5)*4/z,y:y+(oy/z)+6/z,v:0,dur:.7});
    if(im&&im.complete&&im.naturalWidth){const w=W0,h=w*im.naturalHeight/im.naturalWidth;ctx.save();ctx.translate(sx+ox,sy+oy+bob);if(esq)ctx.scale(-1,1);if(aer)ctx.rotate((esq?-1:1)*Math.max(-.4,Math.min(.4,Math.cos(e*Math.PI)*-.5)));ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=8;ctx.shadowOffsetY=aer?14:3;ctx.drawImage(im,-w/2,-h*.8,w,h);ctx.restore()}}}
  else if(f.t==='poe'){const [sx,sy]=W2S(f.x,f.y);ctx.fillStyle=`rgba(170,150,120,${.35*(1-q)})`;ctx.beginPath();ctx.arc(sx,sy,3+q*7,0,7);ctx.fill()}}
};
function marcador(it,sx,sy,r,eraV,alvos,moveis,pulso,S){const n=it.n;const cor=n?corEra(n.cor,3):'#888';const [R,G,B]=hexRgb(n?n.cor:'#888888');const id=it.p.id;
 const alvo=alvos.has(id),mov=moveis.has(id),sel=id===MAPA.selProv,mis=id===MAPA.missao;const inimigo=n&&SIM.emGuerra(it.pr.d,S.jog);
 ctx.save();
 if(alvo||mov||sel||mis){ctx.beginPath();ctx.arc(sx,sy,r+4+pulso*4,0,7);ctx.fillStyle=alvo?`rgba(255,60,40,${.25+.25*pulso})`:mov?`rgba(80,240,130,${.25+.25*pulso})`:mis?`rgba(255,176,32,${.3+.3*pulso})`:'rgba(255,211,77,.45)';ctx.fill()}
 ctx.beginPath();ctx.arc(sx+1,sy+2.5,r,0,7);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fill();
 const g=ctx.createRadialGradient(sx-r*.35,sy-r*.45,1,sx,sy,r*1.1);g.addColorStop(0,`rgb(${Math.min(255,R+90)},${Math.min(255,G+90)},${Math.min(255,B+90)})`);g.addColorStop(.55,`rgb(${R},${G},${B})`);g.addColorStop(1,`rgb(${R*.45|0},${G*.45|0},${B*.45|0})`);
 ctx.beginPath();ctx.arc(sx,sy,r,0,7);ctx.fillStyle=g;ctx.fill();
 ctx.lineWidth=it.meu?2.6:1.8;ctx.strokeStyle=sel?'#ffd34d':it.meu?'#fffbe8':alvo?'#ff4a3a':inimigo?'#ff7b6b':'rgba(20,15,10,.85)';ctx.stroke();
 if(it.meu){ctx.beginPath();ctx.arc(sx,sy,r-3,0,7);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1;ctx.stroke()}
 // número de tropas
 const t=it.tot>=1e4?(it.tot/1e3|0)+'k':it.tot>=1e3?(it.tot/1e3).toFixed(1)+'k':String(it.tot);const fs=t.length>=4?r*.78:t.length===3?r*.92:r*1.08;
 ctx.font=`700 ${fs.toFixed(1)}px Oswald, Impact, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=3;ctx.strokeStyle='rgba(0,0,0,.55)';ctx.strokeText(t,sx,sy+1);ctx.fillStyle='#fff';ctx.fillText(t,sx,sy+1);
 // capital / fortaleza
 if(it.cap)estrela(sx-r*.75,sy-r*.8,r*.5,eraV);
 if(it.pr.fort){ctx.fillStyle='#2b2b2b';ctx.strokeStyle='#e9d9a6';ctx.lineWidth=1.2;const x=sx+r*.72,y=sy-r*.78,s=r*.42;ctx.beginPath();ctx.moveTo(x-s,y-s);ctx.lineTo(x+s,y-s);ctx.lineTo(x+s,y+s*.2);ctx.quadraticCurveTo(x,y+s*1.4,x-s,y+s*.2);ctx.closePath();ctx.fill();ctx.stroke()}
 ctx.restore()}
function estrela(x,y,r,e){ctx.save();ctx.translate(x,y);ctx.beginPath();for(let i=0;i<10;i++){const rr=i%2?r*.45:r;const an=-Math.PI/2+i*Math.PI/5;ctx.lineTo(Math.cos(an)*rr,Math.sin(an)*rr)}ctx.closePath();ctx.fillStyle='#ffd34d';ctx.fill();ctx.strokeStyle='#3a2600';ctx.lineWidth=1.3;ctx.stroke();ctx.restore()}
// ---------- toque
MAPA.provEm=(wx,wy)=>{for(const p of SIM.P){const b=p.bb;if(wx<b[0]||wx>b[2]||wy<b[1]||wy>b[3])continue;if(pip(wx,wy,p.rings))return p.id}return -1};
function tocar(sx,sy){let best=null,bd=1e9;for(const h of hits){const d=Math.hypot(sx-h.x,sy-h.y);if(d<h.r&&d<bd){bd=d;best=h}}if(best){MAPA.onTapProv&&MAPA.onTapProv(best.p);return}
 const [wx,wy]=S2W(sx,sy);const p=MAPA.provEm(wx,wy);if(p>=0)MAPA.onTapProv&&MAPA.onTapProv(p);else MAPA.onTapMar&&MAPA.onTapMar()}
MAPA.tocar=tocar;MAPA.hits=()=>hits;
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
