// Simulação: mapa, economia, movimento, combate, IA, diplomacia, eras
'use strict';
const SIM={};
(function(){
const g=window.GEO; const NP=g.provinces.length; SIM.NP=NP;
const dec=a=>{const o=[];let x=0,y=0;for(let i=0;i<a.length;i+=2){x+=a[i];y+=a[i+1];o.push([x/2,y/2])}return o};
const CT={};for(const c of g.countries)CT[c.id]=c;
// ---------- dados estáticos das províncias
const P=g.provinces.map((p,i)=>{const rings=p.r.map(dec);let bb=[1e9,1e9,-1e9,-1e9];for(const r of rings)for(const [x,y] of r){if(x<bb[0])bb[0]=x;if(y<bb[1])bb[1]=y;if(x>bb[2])bb[2]=x;if(y>bb[3])bb[3]=y}
 const h=ART.corHash(p.n+i);let res;const t=p.ter;
 if(p.oil)res='petroleo';else if(t==='urb')res='bens';else if(t==='mon')res='metal';else if(t==='des')res=h%2?'raros':'petroleo';else if(t==='fri')res=h%2?'metal':'raros';else if(t==='sel')res=h%3?'comida':'raros';else if(t==='flo')res=h%2?'bens':'comida';else res=h%4?'comida':'metal';
 const r2=['comida','metal','bens','comida','raros'][(h>>>4)%5];
 return {id:i,c:p.c,n:p.n,x:p.x,y:p.y,pop:p.pop,cap:p.cap,ter:p.ter,lat:p.lat,lon:p.lon,rings,bb,a:p.a,s:p.s,res,res2:r2===res?'dinheiro':r2,cont:(CT[p.c]||{}).ct||'',costa:p.s.length>0,base:1+Math.sqrt(p.pop)/22}});
SIM.P=P;SIM.CT=CT;
// arestas entre províncias
SIM.E=g.edges.map(([a,b,l])=>({a,b,pts:dec(l)}));
// grade marítima
const G=g.G,GW=g.GW,GH=g.GH;const seaB=atob(g.sea);const SEA=new Uint8Array(GW*GH);for(let i=0;i<SEA.length;i++)SEA[i]=seaB.charCodeAt(i);
SIM.SEA=SEA;SIM.G=G;SIM.GW=GW;SIM.GH=GH;
const seaProv=new Map();P.forEach(p=>{for(const c of p.s){if(!seaProv.has(c))seaProv.set(c,[]);seaProv.get(c).push(p.id)}});
const extra=new Map();for(const [a,b] of g.extra){if(!extra.has(a))extra.set(a,[]);if(!extra.has(b))extra.set(b,[]);extra.get(a).push(b);extra.get(b).push(a)}
const nx=n=>n<NP?P[n].x:((n-NP)%GW+.5)*G; const ny=n=>n<NP?P[n].y:(Math.floor((n-NP)/GW)+.5)*G;
SIM.nx=nx;SIM.ny=ny;SIM.ehMar=n=>n>=NP;
function vizinhos(n){if(n<NP){return [P[n].a,P[n].s.map(c=>c+NP)]}
 const c=n-NP,i=c%GW,j=(c/GW)|0;const o=[];for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const I=i+di,J=j+dj;if(I<0||J<0||I>=GW||J>=GH)continue;const k=J*GW+I;if(SEA[k])o.push(k+NP)}
 const ex=extra.get(c);if(ex)for(const k of ex)o.push(k+NP);return [seaProv.get(c)||[],o]}
SIM.celulaMar=(x,y)=>{const i0=Math.floor(x/G),j0=Math.floor(y/G);let best=-1,bd=1e9;for(let r=0;r<4&&best<0;r++)for(let j=j0-r;j<=j0+r;j++)for(let i=i0-r;i<=i0+r;i++){if(i<0||j<0||i>=GW||j>=GH)continue;const k=j*GW+i;if(!SEA[k])continue;const d=Math.hypot((i+.5)*G-x,(j+.5)*G-y);if(d<bd){bd=d;best=k}}return best<0?-1:best+NP};
// ---------- utilidades
const K=(a,b)=>a<b?a+'|'+b:b+'|'+a;
let S=null;SIM.get=()=>S;
const rnd=()=>Math.random();
const N=id=>S.nac[id];
SIM.nomeNac=id=>{const n=S.nac[id];if(!n)return id;if(NOMES[id])return NOMES[id][Math.min(3,n.era)];return n.nome||(CT[id]||{}).n||id};
const emGuerra=(a,b)=>a!==b&&!!S.guerra[K(a,b)];const aliado=(a,b)=>a===b||!!S.ali[K(a,b)];
SIM.emGuerra=emGuerra;SIM.aliado=aliado;
const rel=(a,b)=>S.rel[K(a,b)]||0;const addRel=(a,b,v)=>{const k=K(a,b);S.rel[k]=Math.max(-100,Math.min(100,(S.rel[k]||0)+v))};
SIM.rel=rel;
const dataDe=d=>{const t=new Date(Date.UTC(1914,6,28));t.setUTCDate(t.getUTCDate()+Math.floor(d));return t};
SIM.dataDe=dataDe;
const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
SIM.dataTxt=d=>{const t=dataDe(d);return t.getUTCDate()+' '+MESES[t.getUTCMonth()]+' '+t.getUTCFullYear()};
SIM.ano=d=>dataDe(d).getUTCFullYear();
const diaDoAno=(ano,mes,dia)=>Math.round((Date.UTC(ano,mes,dia)-Date.UTC(1914,6,28))/864e5);
const DIA_ERA=[0,diaDoAno(1939,8,1),diaDoAno(1947,2,12),diaDoAno(1991,11,26)];SIM.DIA_ERA=DIA_ERA;
const DIA_FIM=diaDoAno(2030,0,1);SIM.DIA_FIM=DIA_FIM;
// ---------- notícias
function noticia(txt,tipo='info',imp=false,envolve=[]){const n={dia:S.dia,txt,tipo,imp:imp||envolve.includes(S.jog)};if(SIM.onLog)SIM.onLog(n);S.news.unshift(n);if(S.news.length>150)S.news.length=150;if(n.imp&&SIM.onNoticia)SIM.onNoticia(n)}
SIM.noticia=noticia;
// ---------- unidades
const U=t=>UNIDADES[t];
SIM.hpMax=(u)=>U(u.t).hp*ERA_MULT(u.e);
function eraUnid(nac,t){const n=N(nac);const Ut=U(t);let best=-1;for(let e=Math.min(3,n.era);e>=Ut.era0;e--){if(!Ut.nomes[e])continue;if(e===0&&!Ut.pesq){best=0;break}if(n.pf[t+e]){best=e;break}}return best}
SIM.eraUnid=eraUnid;
const novaUnid=(t,e)=>({t,e,hp:U(t).hp*ERA_MULT(e)});
function velUnid(u,nac){const Ut=U(u.t);let v=Ut.vel[u.e]||Ut.vel.find(x=>x)||30;const n=N(nac);if(n)v*=1+.15*n.log;return v}
// ---------- exércitos
function novoExe(dono,node,units){const a={id:S.nid++,dono,node,x:nx(node),y:ny(node),units,path:[],prog:0,alvo:null,missao:null};S.exs.push(a);return a}
SIM.novoExe=novoExe;
const ehAereo=a=>a.units.length>0&&a.units.every(u=>U(u.t).aereo);
const ehNaval=a=>a.units.length>0&&a.units.every(u=>U(u.t).naval);
const temTerra=a=>a.units.some(u=>!U(u.t).aereo&&!U(u.t).naval&&!U(u.t).missil);
SIM.ehAereo=ehAereo;SIM.ehNaval=ehNaval;SIM.temTerra=temTerra;
function velExe(a){let v=1e9;const mar=a.node>=NP;for(const u of a.units){const Ut=U(u.t);if(Ut.missil)continue;let s=velUnid(u,a.dono);if(mar&&!Ut.naval)s=[260,360,460,520][Math.min(3,N(a.dono).era)];v=Math.min(v,s)}return v===1e9?30:v}
function forca(a){let f=0;for(const u of a.units){const Ut=U(u.t);const m=ERA_MULT(u.e);f+=(u.hp/(Ut.hp*m))*(Ut.atk.s+Ut.atk.a+Ut.atk.r*.5+Ut.atk.n*.5)*m*(Ut.hp/20)}return f}
SIM.forca=forca;
// ---------- caminho (A*)
function passavel(dono,n,modo){if(n>=NP)return true;const o=S.prov[n].d;if(modo==='mar'){const pr=S.prov[n];return (o===dono||aliado(o,dono))&&pr.b.por>0}return o===dono||aliado(o,dono)||emGuerra(o,dono)}
const NT=NP+GW*GH;const gArr=new Float64Array(NT),cArr=new Int32Array(NT),stArr=new Uint32Array(NT);let gen=0;
function caminho(a,dest,soTerra){const modo=ehNaval(a)?'mar':'terra';if(dest===a.node)return [];
 if(!passavel(a.dono,dest,modo)&&!(modo==='mar'&&dest>=NP))return null;if(modo==='mar'&&a.node<NP&&dest<NP)return null;
 const vT=velExe(a),vMar=[260,360,460,520][Math.min(3,N(a.dono).era)];const vMax=Math.max(vT*1.6,vMar)*1.2;
 if(modo==='terra'&&a.node<NP&&P[a.node].a.includes(dest)&&dest<NP)return [dest];
 gen++;const tx=nx(dest),ty=ny(dest);const open=[[0,a.node]];stArr[a.node]=gen;gArr[a.node]=0;cArr[a.node]=-1;let it=0;
 const push=(f,n)=>{open.push([f,n]);let i=open.length-1;while(i>0){const p=(i-1)>>1;if(open[p][0]<=open[i][0])break;const t=open[p];open[p]=open[i];open[i]=t;i=p}};
 const pop=()=>{const top=open[0];const last=open.pop();if(open.length){open[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<open.length&&open[l][0]<open[m][0])m=l;if(r<open.length&&open[r][0]<open[m][0])m=r;if(m===i)break;const t=open[m];open[m]=open[i];open[i]=t;i=m}}return top};
 const fer=n=>n<NP&&S.prov[n].d===a.dono&&S.prov[n].b.fer;const lim=soTerra?6000:45000;
 const tenta=(n,m,c)=>{if(stArr[m]!==gen||c<gArr[m]){stArr[m]=gen;gArr[m]=c;cArr[m]=n;push(c+Math.hypot(tx-nx(m),ty-ny(m))*10/vMax,m)}};
 while(open.length&&it++<lim){const [f,n]=pop();if(n===dest){const path=[];let c=dest;while(c!==a.node&&c>=0){path.unshift(c);c=cArr[c]}return path}
  const gn=gArr[n];if(f-Math.hypot(tx-nx(n),ty-ny(n))*10/vMax>gn+1e-6)continue;const [pv,sv]=vizinhos(n);
  for(const m of pv){if(modo==='mar'&&m!==dest)continue;if(!passavel(a.dono,m,modo))continue;
   const d=Math.hypot(nx(m)-nx(n),ny(m)-ny(n))*10;let v=n>=NP?(modo==='mar'?vT:vMar):vT*TERRENOS[P[m].ter].vel;if(fer(n)&&fer(m))v*=1.6;
   tenta(n,m,gn+d/v+(n>=NP&&modo==='terra'?2:0)+(m<NP&&S.prov[m].d!==a.dono&&!aliado(S.prov[m].d,a.dono)?1.5:0))}
  if(soTerra&&modo==='terra')continue;
  for(const m of sv){const d=Math.hypot(nx(m)-nx(n),ny(m)-ny(n))*10;tenta(n,m,gn+d/(modo==='mar'?vT:vMar)+(n<NP&&modo==='terra'?3:0))}}
 return null}
SIM.caminho=caminho;
function tempoCaminho(a,path){let t=0,n=a.node;for(const m of path){const d=Math.hypot(nx(m)-nx(n),ny(m)-ny(n))*10;let v=velExe(a);if(m>=NP&&!ehNaval(a))v=[260,360,460,520][Math.min(3,N(a.dono).era)];else if(m<NP)v*=TERRENOS[P[m].ter].vel;t+=d/v;n=m}return t}
SIM.tempoCaminho=tempoCaminho;
SIM.mover=(a,dest,soTerra)=>{if(ehAereo(a))return null;let p=caminho(a,dest,soTerra);if(p&&!soTerra&&!ehNaval(a)&&p.some(n=>n>=NP)){const pt=caminho(a,dest,true);if(pt&&tempoCaminho(a,pt)<tempoCaminho(a,p)*1.8+4)p=pt}if(!p)return null;a.path=p;a.prog=0;a.alvo=dest;a.missao=null;return p};
// ---------- missões aéreas e mísseis
function alcance(a){let r=1e9;for(const u of a.units){const Ut=U(u.t);if(Ut.alc)r=Math.min(r,Ut.alc[u.e]||0)}return r===1e9?0:r}
SIM.alcance=alcance;
SIM.distKm=(n1,n2)=>Math.hypot(nx(n1)-nx(n2),ny(n1)-ny(n2))*10;
SIM.ataqueAereo=(a,alvo)=>{const d=SIM.distKm(a.node,alvo);if(d>alcance(a))return 'fora';a.missao={tipo:'ataque',alvo,fase:0,t:0,dur:d/velExeAr(a)};return 'ok'};
SIM.reposicionar=(a,alvo)=>{const d=SIM.distKm(a.node,alvo);if(d>alcance(a)*1.6)return 'fora';const pr=S.prov[alvo];if(!(pr.d===a.dono||aliado(pr.d,a.dono))||!pr.b.aer)return 'base';a.missao={tipo:'repos',alvo,fase:0,t:0,dur:d/velExeAr(a)};return 'ok'};
const velExeAr=a=>Math.min(...a.units.map(u=>U(u.t).vel[u.e]))*(1+.15*N(a.dono).log);
SIM.lancarMissil=(a,alvo)=>{const i=a.units.findIndex(u=>U(u.t).missil);if(i<0)return 'sem';const u=a.units[i];const d=SIM.distKm(a.node,alvo);if(d>U('mis').alc[u.e])return 'fora';a.units.splice(i,1);const mm={dono:a.dono,de:a.node,alvo,t:0,dur:Math.max(.4,d/U('mis').vel[u.e]),e:u.e};S.misseis.push(mm);if(SIM.onLancar)SIM.onLancar(mm);if(!a.units.length)S.exs.splice(S.exs.indexOf(a),1);return 'ok'};
// ---------- combate
function multDef(a,u,node){if(node>=NP)return (!U(u.t).naval&&!U(u.t).aereo)?2:1;const pr=S.prov[node];let m=1;if(!U(u.t).aereo){m*=TERRENOS[P[node].ter].def;if(pr.d===a.dono||aliado(pr.d,a.dono))m*=1-.12*(pr.b.fort||0)}if(U(u.t).cls==='a'&&(P[node].ter==='mon'||P[node].ter==='sel'))m*=1.25;return m}
function clsAlvo(u,node){const c=U(u.t).cls;if(node>=NP&&!U(u.t).naval&&!U(u.t).aereo)return 'n';if(c==='u')return 'n';return c==='m'?'s':c}
function aplicarDano(atacantes,defensores,node,k){// atacantes/defensores: lista de exércitos
 const alvos=[];for(const d of defensores)for(const u of d.units){if(U(u.t).missil)continue;alvos.push([d,u])}if(!alvos.length)return 0;
 let tot=0;const peso={};for(const [d,u] of alvos){const c=clsAlvo(u,node);peso[c]=(peso[c]||0)+U(u.t).hp}const sumP=Object.values(peso).reduce((a,b)=>a+b,0);
 const ataque={};for(const a of atacantes){const n=N(a.dono);const bonus=(1+.12*n.dou)*(.6+.4*n.moral/100);for(const u of a.units){const Ut=U(u.t);if(Ut.missil)continue;if(node>=NP&&!Ut.naval&&!Ut.aereo)continue;const m=ERA_MULT(u.e)*(u.hp/(Ut.hp*ERA_MULT(u.e)))*bonus;for(const c in peso){let at=Ut.atk[c==='u'?'n':c==='m'?'s':c];if(c==='s')at=Ut.atk.s;if(c==='a')at=Ut.atk.a;if(c==='r')at=Ut.atk.r;if(c==='n')at=Ut.atk.n;ataque[c]=(ataque[c]||0)+at*m*(peso[c]/sumP)}}}
 for(const [d,u] of alvos){const c=clsAlvo(u,node);const share=U(u.t).hp/peso[c];const dmg=(ataque[c]||0)*share*k*(.8+rnd()*.4)/multDef(d,u,node)*(1/multDefInv(d,u,node));u.hp-=dmg;tot+=dmg}return tot}
const multDefInv=(d,u,node)=>1;
function limparMortos(){for(const a of S.exs){const antes=a.units.length;a.units=a.units.filter(u=>u.hp>0.5);if(a.units.length<antes)a.perdas=(a.perdas||0)+antes-a.units.length}
 const mortos=S.exs.filter(a=>!a.units.length);if(mortos.length){for(const a of mortos){if(a.dono===S.jog)noticia(`Seu exército foi destruído em ${nomeNo(a.node)}.`,'combate',true);if(SIM.onMorte)SIM.onMorte(a)}S.exs=S.exs.filter(a=>a.units.length)}}
const nomeNo=n=>n<NP?P[n].n:'alto-mar';SIM.nomeNo=nomeNo;
function combates(k){const porNo=new Map();for(const a of S.exs){if(a.missao||ehAereo(a))continue;if(a.path.length&&a.prog>0)continue;let l=porNo.get(a.node);if(!l)porNo.set(a.node,l=[]);l.push(a)}
 S.batalhas=new Set();
 for(const [node,l] of porNo){if(l.length<2)continue;const donos=[...new Set(l.map(a=>a.dono))];if(donos.length<2)continue;
  let houve=false;for(const o of donos){const inimigos=l.filter(a=>emGuerra(a.dono,o));if(!inimigos.length)continue;houve=true;const meus=l.filter(a=>a.dono===o);aplicarDano(meus,inimigos,node,k)}
  if(houve){S.batalhas.add(node);for(const a of l){a.path=[];a.prog=0}}}
 limparMortos()}
function golpe(dono,node,forcaMult,armas){// ataque aéreo/míssil contra um nó
 const alvos=S.exs.filter(a=>a.node===node&&emGuerra(a.dono,dono)&&!a.missao);if(!alvos.length)return 0;
 const fake=[{dono,units:armas}];let tot=0;for(let r=0;r<3;r++)tot+=aplicarDano(fake,alvos,node,.33*forcaMult);
 limparMortos();return tot}
// ---------- inicialização
SIM.deNac=id=>{const n=SIM.nomeNac(id);const sem=['Portugal','Israel','Cuba','Angola','Moçambique','Taiwan','Mônaco','Malta','Chipre','Timor-Leste','Singapura','Hong Kong','Andorra','Omã','Mianmar','Madagascar','Belize','Fiji'];if(sem.includes(n))return 'de '+n;if(/^(Estados|Países|Emirados|Camarões)/.test(n))return 'dos '+n;if(/^(Ilhas|Filipinas|Maldivas|Bahamas|Seicheles|Comores)/.test(n))return 'das '+n;if(/^(Império|Reino|Sultanato|Emirado|Domínio|Raj|Canadá|Japão|Brasil|México|Peru|Chile|Uruguai|Paraguai|Equador|Egito|Irã|Iraque|Iêmen|Líbano|Sudão|Chade|Níger|Mali|Marrocos|Congo|Gabão|Senegal|Togo|Benin|Quênia|Zimbábue|Malawi|Afeganistão|Paquistão|Nepal|Butão|Vietnã|Laos|Camboja|Cazaquistão|Uzbequistão|Turcomenistão|Quirguistão|Tadjiquistão|Azerbaijão|Sri|Bangladesh|Catar|Kuwait|Bahrein|Haiti|Panamá|Suriname|Lesoto|Botsuana|Burundi|Ruanda|Saara|Djibuti|Iêmen)/.test(n))return 'do '+n;if(/a$/.test(n))return 'da '+n;return 'de '+n};SIM.donoIni=c=>donoInicial(c);function donoInicial(c){for(const k in IMPERIOS)if(IMPERIOS[k].split(' ').includes(c))return k;return c}
SIM.nucleo=(nac,p)=>{const pc=P[p].c;if(pc===nac)return true;const l=NUCLEOS[nac];return !!(l&&l.split(' ').includes(pc))};
function corNac(id){if(CORES[id])return CORES[id];const h=ART.corHash(id+'x');return `hsl(${h%360},${45+(h>>9)%25}%,${48+(h>>5)%14}%)`}
function criarNacao(id,extra={}){const persona=PERSONA_FIXA[id]||['agressivo','expansionista','defensivo','traicoeiro','leal','oportunista','pacifico','pacifico','defensivo','oportunista'][ART.corHash(id)%10];
 S.nac[id]=Object.assign({id,cor:corNac(id),persona,era:S.eraMundo||0,res:{comida:500,bens:300,metal:300,petroleo:200,raros:100,dinheiro:600,homens:200},pf:{},fila:[],moral:75,cap:-1,vivo:true,eco:0,dou:0,log:0,cont:(CT[id]||{}).ct||'',recrut:0,prox:ART.corHash(id)%6},extra);
 if(S.eraMundo)darEra(id,S.eraMundo,true);return S.nac[id]}
SIM.novo=(jog)=>{S={v:3,dia:0,jog,vel:1,eraMundo:0,nac:{},prov:[],exs:[],misseis:[],ataques:[],nid:1,guerra:{},ali:{},com:{},vis:{},rel:{},treg:{},news:[],ev:0,prop:[],batalhas:new Set(),stats:{conq:0,perd:0,vit:0},inicioGuerra:{},tut:0};
 for(const p of P){const d=donoInicial(p.c);S.prov.push({d,b:{qua:0,fab:0,por:0,aer:0,fer:0,fort:0},m:70,f:[],cerco:0,cd:null});if(!S.nac[d])criarNacao(d)}
 for(const id in S.nac){const ps=P.filter(p=>S.prov[p.id].d===id);let cap=ps.find(p=>p.cap&&p.c===id)||ps.find(p=>p.cap)||ps.sort((a,b)=>b.pop-a.pop)[0];S.nac[id].cap=cap.id}
 const MAJ={DEU:9,RUS:10,FRA:8,AUT:7,GBR:5,TUR:5,ITA:5,USA:4,JPN:4,CHN:5,SRB:3};const NAV={GBR:7,DEU:4,FRA:3,USA:3,JPN:3,ITA:2,RUS:2,AUT:1,TUR:1,ESP:1,NLD:1,BRA:1,ARG:1};
 const EUR_FER=['DEU','FRA','GBR','AUT','BEL','NLD','ITA','DNK','CHE'];
 for(const id in S.nac){const n=S.nac[id];const ps=P.filter(p=>S.prov[p.id].d===id);const nuc=ps.filter(p=>SIM.nucleo(id,p.id));const maj=MAJ[id]||0;
  if(maj){for(const k in n.res)n.res[k]=k==='raros'?400:1600;}
  const cp=S.prov[n.cap];cp.b.qua=2;cp.b.fab=1;cp.b.fort=1;if(P[n.cap].costa)cp.b.por=1;
  for(const p of nuc){const pr=S.prov[p.id];if(p.pop>1200||(maj&&p.pop>350)){pr.b.qua=Math.max(pr.b.qua,1);if(maj)pr.b.fab=Math.max(pr.b.fab,1);if(p.costa&&(maj||p.pop>2000))pr.b.por=Math.max(pr.b.por,1)}if(EUR_FER.includes(id)&&p.cont==='Europe')pr.b.fer=1}
  // tropas
  const nArm=maj||Math.max(1,Math.min(3,Math.round(nuc.length/3)));const fronteira=nuc.filter(p=>p.a.some(q=>S.prov[q].d!==id)).sort((a,b)=>b.pop-a.pop);
  const locais=[n.cap,...fronteira.map(p=>p.id)];
  for(let i=0;i<nArm;i++){const node=locais[i%locais.length];const us=[];const ni=maj?3+(i%3):2;for(let j=0;j<ni;j++)us.push(novaUnid('inf',0));if(maj||i===0)us.push(novaUnid('art',0));if(maj&&i%2===0)us.push(novaUnid('arm',0));novoExe(id,node,us)}
  const col=ps.filter(p=>!SIM.nucleo(id,p.id));for(let i=0;i<col.length;i+=4)novoExe(id,col[i].id,[novaUnid('inf',0),novaUnid('inf',0)]);
  const nv=NAV[id]||0;if(nv){const portos=nuc.filter(p=>p.costa).sort((a,b)=>b.pop-a.pop);for(let i=0;i<Math.ceil(nv/2)&&portos.length;i++){const pt=portos[i%portos.length];const cel=pt.s[0]+NP;const us=[];for(let j=0;j<Math.ceil(nv/Math.ceil(nv/2));j++)us.push(novaUnid('nav',0));novoExe(id,cel,us)}}
 }
 for(const [a,b] of ALIANCAS_1914)if(S.nac[a]&&S.nac[b]){S.ali[K(a,b)]=1;addRel(a,b,60)}
 // relações iniciais por vizinhança
 for(const p of P)for(const q of p.a){const a=S.prov[p.id].d,b=S.prov[q].d;if(a!==b&&!S.ali[K(a,b)])S.rel[K(a,b)]=(S.rel[K(a,b)]||0)-0.3}
 S.ini={};for(const p of S.prov)S.ini[p.d]=(S.ini[p.d]||0)+1;calcVisao();noticia('28 de julho de 1914: tensão máxima na Europa após o assassinato em Sarajevo.','era',true);return S};
SIM.carregar=(obj)=>{S=obj;S.batalhas=new Set();S.misseis=S.misseis||[];S.ataques=S.ataques||[];calcVisao();return S};
SIM.exportar=()=>{const o=Object.assign({},S);o.batalhas=[];o.visivel=undefined;return JSON.stringify(o)};
// ---------- visão (névoa de guerra)
function calcVisao(){const v=new Uint8Array(NP);const me=S.jog;const vemos=id=>id===me||aliado(id,me)||S.vis[me+'>'+id]||S.vis[id+'>'+me];
 for(let i=0;i<NP;i++){if(vemos(S.prov[i].d)){v[i]=2;for(const q of P[i].a)v[q]=Math.max(v[q],1)}}
 for(const a of S.exs){if(!vemos(a.dono))continue;if(a.node<NP){v[a.node]=2;for(const q of P[a.node].a)v[q]=Math.max(v[q],1)}else{const x=nx(a.node),y=ny(a.node);for(const p of P)if(Math.abs(p.x-x)<90&&Math.abs(p.y-y)<90)v[p.id]=Math.max(v[p.id],1)}}
 S.visivel=v}
SIM.calcVisao=calcVisao;
SIM.exeVisivel=a=>{const me=S.jog;if(a.dono===me||aliado(a.dono,me))return true;const v=S.visivel;if(a.node<NP&&!(a.path.length&&a.prog>0))return v[a.node]>0;
 const sub=a.units.every(u=>u.t==='sub');const R=sub?45:140;for(const b of S.exs){if(b.dono!==me&&!aliado(b.dono,me))continue;if(sub&&!ehNaval(b))continue;if(Math.abs(b.x-a.x)<R&&Math.abs(b.y-a.y)<R)return true}
 if(sub)return false;for(const p of P){if(v[p.id]===2&&p.costa&&Math.abs(p.x-a.x)<R*.7&&Math.abs(p.y-a.y)<R*.7)return true}return false};
// ---------- diplomacia
function declararGuerra(a,b,txt,cadeia=true){if(a===b||emGuerra(a,b)||!N(a)||!N(b)||!N(a).vivo||!N(b).vivo)return;delete S.ali[K(a,b)];delete S.com[K(a,b)];delete S.vis[a+'>'+b];delete S.vis[b+'>'+a];S.guerra[K(a,b)]=1;S.inicioGuerra[K(a,b)]=S.dia;addRel(a,b,-60);
 noticia(txt||`${SIM.nomeNac(a)} declara guerra a ${SIM.nomeNac(b)}!`,'guerra',false,[a,b]);if(SIM.onGuerra)SIM.onGuerra(a,b);
 if(cadeia){for(const id in S.nac){if(id===a||id===b||!N(id).vivo||id===S.jog)continue;if(aliado(id,b)&&!aliado(id,a)&&!emGuerra(id,a)&&(N(id).cont===N(a).cont||vizinhosNac(id).includes(a))){const pp=PERSONAS[N(id).persona];if(rnd()<(pp.trai>1?.35:pp.trai>.5?.7:1))declararGuerra(id,a,`${SIM.nomeNac(id)} entra na guerra para defender seu aliado ${SIM.nomeNac(b)}.`,false)}}}
 calcVisao()}
function fazerPaz(a,b,txt){if(!emGuerra(a,b))return;delete S.guerra[K(a,b)];S.treg[K(a,b)]=S.dia+90;addRel(a,b,25);
 // devolve cercos
 noticia(txt||`Tratado de paz assinado entre ${SIM.nomeNac(a)} e ${SIM.nomeNac(b)}.`,'paz',false,[a,b]);
 for(const ex of S.exs){if(ex.node<NP&&((ex.dono===a&&S.prov[ex.node].d===b)||(ex.dono===b&&S.prov[ex.node].d===a))){const casa=maisPerto(ex.dono,ex.node);if(casa>=0){ex.node=casa;ex.x=nx(casa);ex.y=ny(casa);ex.path=[]}}}calcVisao()}
function maisPerto(dono,node){let best=-1,bd=1e9;for(const p of P){if(S.prov[p.id].d!==dono)continue;const d=Math.hypot(p.x-nx(node),p.y-ny(node));if(d<bd){bd=d;best=p.id}}return best}
function aliar(a,b,txt){if(a===b||aliado(a,b)||emGuerra(a,b))return;S.ali[K(a,b)]=1;addRel(a,b,30);noticia(txt||`${SIM.nomeNac(a)} e ${SIM.nomeNac(b)} formam uma aliança.`,'alianca',false,[a,b]);calcVisao()}
function romper(a,b,txt){if(!S.ali[K(a,b)])return;delete S.ali[K(a,b)];addRel(a,b,-30);noticia(txt||`${SIM.nomeNac(a)} rompe a aliança com ${SIM.nomeNac(b)}.`,'traicao',false,[a,b]);calcVisao()}
SIM.declararGuerra=declararGuerra;SIM.fazerPaz=fazerPaz;SIM.aliar=aliar;SIM.romper=romper;
function poder(id){let f=0;for(const a of S.exs)if(a.dono===id)f+=forca(a);let pv=0;for(const p of S.prov)if(p.d===id)pv++;return f+pv*8}
SIM.poder=poder;
function poderAli(id){let f=poder(id);for(const o in S.nac)if(o!==id&&aliado(o,id)&&N(o).vivo)f+=poder(o)*.6;return f}
// Propostas do jogador para a IA
SIM.propor=(tipo,alvo)=>{const me=S.jog,n=N(alvo),pp=PERSONAS[n.persona],r=rel(me,alvo);
 if(tipo==='paz'){if(!emGuerra(me,alvo))return 'Vocês não estão em guerra.';const dias=S.dia-(S.inicioGuerra[K(me,alvo)]||0);const razao=poder(me)/(poder(alvo)+1);let sc=(r+100)/200*.4+Math.min(1,dias/240)*.4+(razao>1?.3:0)+(pp.paz-1)*.3;if(n.moral<40)sc+=.25;if(sc>.62){fazerPaz(me,alvo);return 'ACEITO'}addRel(me,alvo,-2);return `${SIM.nomeNac(alvo)} recusou a paz. Tente quando a guerra estiver a seu favor.`}
 if(tipo==='ali'){if(emGuerra(me,alvo))return 'Faça a paz primeiro.';const comum=Object.keys(S.nac).some(o=>emGuerra(o,me)&&emGuerra(o,alvo));if(r>35||(comum&&r>5)||(pp===PERSONAS.leal&&r>20)){aliar(me,alvo);return 'ACEITO'}addRel(me,alvo,-1);return `${SIM.nomeNac(alvo)} não confia em você o suficiente (relação ${Math.round(r)}). Mande presentes ou faça comércio.`}
 if(tipo==='com'){if(emGuerra(me,alvo))return 'Impossível em guerra.';if(S.com[K(me,alvo)])return 'Já existe acordo.';if(r>-15){S.com[K(me,alvo)]=1;addRel(me,alvo,10);noticia(`Acordo comercial entre ${SIM.nomeNac(me)} e ${SIM.nomeNac(alvo)}.`,'alianca',false,[me]);return 'ACEITO'}return 'Recusado. A relação está ruim demais.'}
 if(tipo==='vis'){if(r>30||aliado(me,alvo)){S.vis[alvo+'>'+me]=1;S.vis[me+'>'+alvo]=1;addRel(me,alvo,5);calcVisao();return 'ACEITO'}return 'Recusado. Precisa de mais confiança.'}
 if(tipo==='pre'){const nm=N(me);if(nm.res.dinheiro<200)return 'Dinheiro insuficiente (200).';nm.res.dinheiro-=200;n.res.dinheiro+=200;addRel(me,alvo,12);return 'ACEITO'}
 if(tipo==='guerra'){if(aliado(me,alvo)){romper(me,alvo,`TRAIÇÃO! ${SIM.nomeNac(me)} rompe a aliança com ${SIM.nomeNac(alvo)}.`);for(const o in S.nac)if(o!==alvo&&o!==me)addRel(me,o,-8)}if(S.treg[K(me,alvo)]>S.dia){for(const o in S.nac)if(o!==me)addRel(me,o,-5)}declararGuerra(me,alvo);return 'ACEITO'}
 if(tipo==='romper'){romper(me,alvo);return 'ACEITO'}return '?'};
SIM.responderProposta=(i,sim)=>{const p=S.prop[i];if(!p)return;S.prop.splice(i,1);if(!sim){if(p.tipo!=='hist')addRel(S.jog,p.de,-6);return}
 if(p.tipo==='hist'){declararGuerra(S.jog,p.de);return}if(p.tipo==='ali')aliar(S.jog,p.de);else if(p.tipo==='paz')fazerPaz(S.jog,p.de);else if(p.tipo==='com'){S.com[K(S.jog,p.de)]=1;addRel(S.jog,p.de,10)}};
// ---------- eras
function darEra(id,e,silencio){const n=N(id);if(n.era>=e&&!silencio)return;n.era=Math.max(n.era,e);for(const pz of PESQUISAS)if(pz.era<e&&pz.tipo==='unid')n.pf[pz.id]=1;
 if(e>=1){const cp=S.prov[n.cap];if(cp)cp.b.aer=Math.max(cp.b.aer,1)}
 if(id===S.jog&&SIM.onEra&&!silencio)SIM.onEra(e)}
SIM.darEra=darEra;
function eventoEra(e){S.eraMundo=e;const vivos=Object.keys(S.nac).filter(id=>N(id).vivo);for(const id of vivos){if(id!==S.jog||N(id).era<e)darEra(id,e,id!==S.jog)}
 if(N(S.jog).era<e)darEra(S.jog,e);
 noticia(`${ERAS[e].nome.toUpperCase()}: ${ERAS[e].lema}`,'era',true);
 const rank=vivos.filter(x=>x!==S.jog).map(id=>({id,p:poder(id)})).sort((a,b)=>b.p-a.p);
 if(e===1){for(const k in S.guerra){const [a,b]=k.split('|');fazerPaz(a,b,`Armistício geral: ${SIM.nomeNac(a)} e ${SIM.nomeNac(b)} param de lutar.`)}
  for(const k in S.ali)if(rnd()<.6)delete S.ali[k];
  const agrP=r=>['agressivo','expansionista','traicoeiro'].includes(N(r.id).persona)?3:1;const eixo=rank.slice(0,12).sort((a,b)=>agrP(b)*b.p-agrP(a)*a.p).slice(0,3).map(r=>r.id);
  const alis=rank.filter(r=>!eixo.includes(r.id)).slice(0,3).map(r=>r.id);
  for(const a of eixo)for(const b of eixo)if(a<b)aliar(a,b,`${SIM.nomeNac(a)} e ${SIM.nomeNac(b)} assinam o Pacto do EIXO.`);
  for(const a of alis)for(const b of alis)if(a<b)aliar(a,b,`${SIM.nomeNac(a)} e ${SIM.nomeNac(b)} se unem aos ALIADOS.`);
  for(const a of eixo){const viz=vizinhosNac(a).filter(v=>!eixo.includes(v)&&v!==S.jog).sort((x,y)=>poder(x)-poder(y));if(viz[0])declararGuerra(a,viz[0],`${SIM.nomeNac(a)} invade ${SIM.nomeNac(viz[0])}! A 2ª Guerra Mundial começou.`)}
  if(eixo[0]&&alis[0])declararGuerra(alis[0],eixo[0]);
  if(!eixo.includes(S.jog)&&!alis.includes(S.jog)){if(alis[0])S.prop.push({de:alis[0],tipo:'ali',dia:S.dia,txt:'Os ALIADOS convidam você a entrar na aliança.'});if(eixo[0])S.prop.push({de:eixo[0],tipo:'ali',dia:S.dia,txt:'O EIXO convida você a entrar no pacto.'})}}
 if(e===2){for(const k in S.guerra){const [a,b]=k.split('|');fazerPaz(a,b,`Fim da guerra: ${SIM.nomeNac(a)} e ${SIM.nomeNac(b)} assinam a paz.`)}
  for(const k in S.ali)delete S.ali[k];
  const A=rank[0]&&rank[0].id,B=rank.find(r=>r.id!==A)&&rank.find(r=>r.id!==A).id;S.blocos={A,B};
  if(A&&B){noticia(`Cortina de Ferro: o mundo se divide entre o bloco de ${SIM.nomeNac(A)} e o bloco de ${SIM.nomeNac(B)}.`,'era',true);addRel(A,B,-60);
   for(const r of rank.slice(2,30)){const ra=rel(r.id,A),rb=rel(r.id,B);if(rnd()<.55){const lider=ra>=rb?A:B;aliar(r.id,lider,`${SIM.nomeNac(r.id)} entra no bloco de ${SIM.nomeNac(lider)}.`)}}
   S.prop.push({de:A,tipo:'ali',dia:S.dia,txt:`O bloco de ${SIM.nomeNac(A)} quer você do lado deles.`});S.prop.push({de:B,tipo:'ali',dia:S.dia,txt:`O bloco de ${SIM.nomeNac(B)} quer você do lado deles.`})}
  descolonizar()}
 if(e===3){for(const k in S.ali)if(rnd()<.5)delete S.ali[k];S.blocos=null;noticia('Nova ordem mundial: os blocos se desfazem. Conflitos regionais e insurgências explodem pelo mundo.','era',true);
  const agr=rank.filter(r=>['agressivo','expansionista','traicoeiro'].includes(N(r.id).persona)).slice(0,4);for(const r of agr){const viz=vizinhosNac(r.id).filter(v=>poder(v)<r.p*.7);if(viz.length)declararGuerra(r.id,viz[(rnd()*viz.length)|0])}}
 calcVisao()}
function descolonizar(){const grupos={};P.forEach(p=>{const d=S.prov[p.id].d;if(SIM.nucleo(d,p.id))return;if(p.c===d)return;const cn=N(d).cont;if(cn&&p.cont===cn&&!['GBR','FRA','PRT','ESP','NLD','BEL','ITA','DEU','JPN'].includes(d))return;(grupos[p.c]=grupos[p.c]||{d,ps:[]}).ps.push(p.id)});
 let n=0;for(const c in grupos){const gr=grupos[c];if(gr.d===S.jog?rnd()<.35:rnd()<.6){independencia(c,gr.ps);n++}}if(n)noticia(`Onda de descolonização: ${n} novos países declaram independência!`,'era',true)}
function independencia(c,ps,exe=true){const antigo=S.prov[ps[0]].d;if(!S.nac[c])criarNacao(c);const n=N(c);n.vivo=true;n.persona=n.persona||'defensivo';n.era=Math.max(n.era,S.eraMundo);
 for(const p of ps){S.prov[p].d=c;S.prov[p].m=60;S.prov[p].f=[];S.prov[p].b.qua=Math.max(1,S.prov[p].b.qua)}
 const cap=ps.find(p=>P[p].cap)||ps.sort((a,b)=>P[b].pop-P[a].pop)[0];n.cap=cap;
 for(const ex of S.exs)if(ex.dono===antigo&&ps.includes(ex.node))ex.dono=c;
 if(exe)novoExe(c,cap,[novaUnid('inf',eraUnid(c,'inf')),novaUnid('inf',eraUnid(c,'inf'))]);
 noticia(`${SIM.nomeNac(c)} declara independência ${SIM.deNac(antigo)}!`,'revolta',false,[antigo]);checarCapital(antigo)}
function vizinhosNac(id){const s=new Set();for(const p of P){if(S.prov[p.id].d!==id)continue;for(const q of p.a){const o=S.prov[q].d;if(o!==id&&N(o).vivo)s.add(o)}}return [...s]}
SIM.vizinhosNac=vizinhosNac;
// ---------- conquista
function conquistar(p,novo){const pr=S.prov[p];const velho=pr.d;if(velho===novo)return;pr.d=novo;pr.oc=!SIM.nucleo(novo,p);pr.m=SIM.nucleo(novo,p)?55:22;pr.f=[];pr.cerco=0;pr.cd=null;if(pr.b.fort)pr.b.fort--;
 if(novo===S.jog){S.stats.conq++;if(SIM.onConquista)SIM.onConquista(p,novo,velho)}if(velho===S.jog){S.stats.perd++;noticia(`Perdemos ${P[p].n} para ${SIM.nomeNac(novo)}!`,'conquista',true)}
 else if(SIM.onConquista&&S.visivel&&S.visivel[p])SIM.onConquista(p,novo,velho);
 for(const ex of S.exs)if(ex.node===p&&ex.dono===velho&&ehAereo(ex)){ex.units=[]}
 S.exs=S.exs.filter(a=>a.units.length);
 if(N(velho).cap===p){const grande=S.prov.filter(x=>x.d===velho).length>=15;noticia(`A capital de ${SIM.nomeNac(velho)}, ${P[p].n}, caiu nas mãos de ${SIM.nomeNac(novo)}!`,'conquista',grande,[velho,novo]);N(velho).moral=Math.max(10,N(velho).moral-25)}
 checarCapital(velho);S.mudouDono=true}
function checarCapital(id){const n=N(id);if(!n||!n.vivo)return;if(S.prov[n.cap]&&S.prov[n.cap].d===id)return;const ps=P.filter(p=>S.prov[p.id].d===id);
 if(!ps.length){n.vivo=false;for(const k in S.guerra)if(k.split('|').includes(id))delete S.guerra[k];for(const k in S.ali)if(k.split('|').includes(id))delete S.ali[k];S.exs=S.exs.filter(a=>a.dono!==id);
  noticia(`${SIM.nomeNac(id)} foi completamente derrotado(a) e deixa de existir.`,'conquista',S.ini&&(S.ini[id]||0)>=15,[id]);if(id===S.jog&&SIM.onDerrota)SIM.onDerrota();return}
 n.cap=(ps.find(p=>SIM.nucleo(id,p.id))||ps).id||ps.sort((a,b)=>b.pop-a.pop)[0].id;if(!ps.some(p=>p.id===n.cap))n.cap=ps[0].id}
// ---------- economia
SIM.producao=(p)=>{const pr=S.prov[p];const n=N(pr.d);const nuc=SIM.nucleo(pr.d,p);const m=pr.m/100*(nuc?1:.32)*(1+.25*pr.b.fab)*(1+.1*pr.b.fer)*(1+.15*n.eco)*(1+.25*n.era);const b=P[p].base*m;const o={};
 o[P[p].res]=(o[P[p].res]||0)+1.5*b;o[P[p].res2]=(o[P[p].res2]||0)+.6*b;o.dinheiro=(o.dinheiro||0)+.9*b;o.homens=(o.homens||0)+.45*b;if(pr.b.fab)o.bens=(o.bens||0)+.4*pr.b.fab*b;return o};
SIM.custo=(base,e)=>{const o={};for(const k in base)o[k]=Math.round(base[k]*CUSTO_MULT(e));return o};
const pode=(n,c)=>Object.keys(c).every(k=>n.res[k]>=c[k]);SIM.pode=pode;
const pagar=(n,c)=>{for(const k in c)n.res[k]-=c[k]};
SIM.custoPredio=(p,k)=>{const lv=S.prov[p].b[k];const base=PREDIOS[k].custo;const o={};for(const r in base)o[r]=Math.round(base[r]*(1+lv*.8)*CUSTO_MULT(N(S.prov[p].d).era)*.8);return o};
SIM.construir=(p,k)=>{const pr=S.prov[p];const n=N(pr.d);if(pr.b[k]>=PREDIOS[k].max)return 'max';if(pr.f.some(f=>f.t==='b'&&f.k===k))return 'fila';const c=SIM.custoPredio(p,k);if(!pode(n,c))return 'rec';pagar(n,c);pr.f.push({t:'b',k,rest:PREDIOS[k].dias*(1+pr.b[k]*.4),tot:PREDIOS[k].dias*(1+pr.b[k]*.4)});return 'ok'};
SIM.podeRecrutar=(p,t)=>{const pr=S.prov[p];const Ut=U(t);const n=N(pr.d);const e=eraUnid(pr.d,t);if(e<0)return {ok:false,motivo:'Pesquise primeiro'};
 if(Ut.req==='qua'&&!pr.b.qua)return {ok:false,motivo:'Precisa de Quartel',e};if(Ut.req==='aer'&&!pr.b.aer)return {ok:false,motivo:'Precisa de Aeródromo',e};if(Ut.req==='por'&&!pr.b.por)return {ok:false,motivo:'Precisa de Porto',e};if(Ut.req==='fab'&&!pr.b.fab)return {ok:false,motivo:'Precisa de Fábrica',e};
 if(Ut.reqF&&(t!=='arm'||e>0)&&pr.b.fab<Ut.reqF)return {ok:false,motivo:'Precisa de Fábrica nv.'+Ut.reqF,e};const c=SIM.custo(Ut.custo,e);return {ok:pode(n,c),motivo:pode(n,c)?'':'Recursos insuficientes',e,c}};
SIM.recrutar=(p,t)=>{const r=SIM.podeRecrutar(p,t);if(!r.ok)return r.motivo;const pr=S.prov[p];const n=N(pr.d);if(pr.f.filter(f=>f.t==='u').length>=5)return 'Fila cheia (5)';pagar(n,r.c);const d=U(t).dias*(1+r.e*.15);pr.f.push({t:'u',u:t,e:r.e,rest:d,tot:d});return 'ok'};
SIM.cancelarFila=(p,i)=>{const pr=S.prov[p];const f=pr.f[i];if(!f)return;const n=N(pr.d);const c=f.t==='u'?SIM.custo(U(f.u).custo,f.e):SIM.custoPredio(p,f.k);for(const k in c)n.res[k]+=Math.round(c[k]*.8);pr.f.splice(i,1)};
SIM.modernizar=(a)=>{const n=N(a.dono);let tot={};let qt=0;for(const u of a.units){const e=eraUnid(a.dono,u.t);if(e>u.e){const c=SIM.custo(U(u.t).custo,e);for(const k in c)tot[k]=(tot[k]||0)+Math.round(c[k]*.5);qt++}}if(!qt)return 'Nada para modernizar';if(a.node>=NP||S.prov[a.node].d!==a.dono)return 'Precisa estar em província sua';if(!pode(n,tot))return 'Recursos insuficientes';pagar(n,tot);for(const u of a.units){const e=eraUnid(a.dono,u.t);if(e>u.e){const r=u.hp/SIM.hpMax(u);u.e=e;u.hp=SIM.hpMax(u)*r}}return 'ok'};
SIM.custoModernizar=a=>{let tot={};for(const u of a.units){const e=eraUnid(a.dono,u.t);if(e>u.e){const c=SIM.custo(U(u.t).custo,e);for(const k in c)tot[k]=(tot[k]||0)+Math.round(c[k]*.5)}}return tot};
// pesquisa
SIM.pesqDisponivel=(id,pz)=>{const n=N(id);if(n.pf[pz.id])return false;if(pz.era>n.era)return false;if(pz.tipo==='era'){const feitas=PESQUISAS.filter(q=>q.era===pz.era&&q.tipo!=='era'&&n.pf[q.id]).length;return feitas>=5}return true};
SIM.custoPesq=pz=>({dinheiro:Math.round(150*CUSTO_MULT(pz.era)*(pz.tipo==='era'?2.5:1)),bens:Math.round(50*CUSTO_MULT(pz.era)),raros:Math.round((pz.era>=2?60:20)*CUSTO_MULT(pz.era))});
SIM.pesquisar=(id,pzid)=>{const n=N(id);const pz=PESQUISAS.find(q=>q.id===pzid);if(!SIM.pesqDisponivel(id,pz))return 'Indisponível';if(n.fila.some(f=>f.id===pzid))return 'Já pesquisando';if(n.fila.length>=2)return 'Os 2 laboratórios estão ocupados';const c=SIM.custoPesq(pz);if(!pode(n,c))return 'Recursos insuficientes';pagar(n,c);n.fila.push({id:pzid,rest:pz.dias,tot:pz.dias});return 'ok'};
function concluirPesq(id,pzid){const n=N(id);n.pf[pzid]=1;const pz=PESQUISAS.find(q=>q.id===pzid);if(pz.tipo==='eco')n.eco++;if(pz.tipo==='dou')n.dou++;if(pz.tipo==='log')n.log++;
 if(id===S.jog)noticia(`Pesquisa concluída: ${pz.nome}.`,'info',true);
 if(pz.tipo==='era'){const e=pz.era+1;if(id===S.jog)noticia(`Nossos cientistas nos levaram à ${ERAS[e].nome} antes do resto do mundo!`,'era',true);darEra(id,e)}}
// ---------- diário
function diario(){const d=Math.round(S.dia);
 // eventos de 1914
 while(S.ev<EVENTOS_1914.length&&EVENTOS_1914[S.ev].d<=d){const ev=EVENTOS_1914[S.ev++];if(S.eraMundo>0)continue;const a=ev.a,b=ev.b;if(!N(a)||!N(b)||!N(a).vivo||!N(b).vivo)continue;if(a===S.jog){if(ev.t!=='alianca'&&!emGuerra(a,b))S.prop.push({de:b,tipo:'hist',dia:d,txt:'📜 Na história real: '+ev.txt+' Quer seguir a história e declarar guerra a '+SIM.nomeNac(b)+'?'});else if(ev.t==='alianca')S.prop.push({de:b,tipo:'ali',dia:d,txt:'📜 Na história real: '+ev.txt+' Aceitar a aliança?'});continue}
  if(ev.t==='guerra'){if(aliado(a,b))continue;declararGuerra(a,b,ev.txt,false)}else if(ev.t==='alianca'){aliar(a,b,ev.txt)}else if(ev.t==='traicao'){for(const o in S.nac)if(aliado(a,o)&&o!==a&&emGuerra(o,'FRA')===false&&['DEU','AUT'].includes(o))romper(a,o,'');romper(a,'DEU','');declararGuerra(a,b,ev.txt,false)}}
 for(let e=S.eraMundo+1;e<4;e++)if(d>=DIA_ERA[e]){eventoEra(e);break}
 // produção
 const ganho={};for(const id in S.nac)ganho[id]={};
 for(let p=0;p<NP;p++){const pr=S.prov[p];const n=N(pr.d);if(!n||!n.vivo)continue;const o=SIM.producao(p);const gn=ganho[pr.d];for(const k in o)gn[k]=(gn[k]||0)+o[k];
  // moral
  const alvo=(SIM.nucleo(pr.d,p)?72:pr.oc?42:55)+(n.moral-60)/3-(S.batalhas.has(p)?15:0);pr.m+=Math.sign(alvo-pr.m)*Math.min(1,Math.abs(alvo-pr.m));
  // filas
  if(pr.f.length){const f=pr.f[0];f.rest-=1;if(f.rest<=0){pr.f.shift();if(f.t==='b'){pr.b[f.k]++;if(pr.d===S.jog)noticia(`${PREDIOS[f.k].n} nível ${pr.b[f.k]} concluído em ${P[p].n}.`,'info',false)}else{entregarUnidade(pr.d,p,f.u,f.e)}}}
  // cerco
 }
 for(const id in S.nac){const n=N(id);if(!n.vivo)continue;const gn=ganho[id];let comMult=1;for(const k in S.com)if(k.split('|').includes(id))comMult+=.08;
  for(const k in gn)n.res[k]+=gn[k]*(k==='dinheiro'?comMult:1)*(id===S.jog?1:dificIA());n.ganho=gn;
  // manutenção
  let cf=0,cd=0;for(const a of S.exs)if(a.dono===id)for(const u of a.units){cf+=.2*(1+u.e*.3)*(1-.08*n.log);cd+=.22*CUSTO_MULT(u.e)}n.res.comida-=cf;n.res.dinheiro-=cd;n.manut={comida:cf,dinheiro:cd};
  let falta=false;for(const k of ['comida','dinheiro'])if(n.res[k]<0){n.res[k]=0;falta=true}
  const guerras=Object.keys(S.guerra).filter(k=>k.split('|').includes(id)).length;
  const alvoM=78-guerras*4-(falta?25:0);n.moral+=Math.sign(alvoM-n.moral)*Math.min(.5,Math.abs(alvoM-n.moral));
  if(falta){for(const a of S.exs)if(a.dono===id)for(const u of a.units)u.hp*=.995;if(id===S.jog&&d%10===0)noticia('Falta comida ou dinheiro! As tropas estão perdendo moral e saúde.','info',true)}
  // pesquisa
  for(const f of n.fila){f.rest-=1}const prontas=n.fila.filter(f=>f.rest<=0);n.fila=n.fila.filter(f=>f.rest>0);for(const f of prontas)concluirPesq(id,f.id)}
 // revoltas
 if(d%10===0)for(let p=0;p<NP;p++){const pr=S.prov[p];if(SIM.nucleo(pr.d,p)||pr.m>38)continue;if(!pr.oc&&S.eraMundo<2)continue;const guarn=S.exs.some(a=>a.node===p&&a.dono===pr.d);let ch=.035*(guarn?.25:1)*(S.eraMundo>=3?1.6:1)*(S.eraMundo>=2?1.3:1);if(rnd()<ch)revolta(p)}
 // IA
 for(const id in S.nac){const n=N(id);if(!n.vivo||id===S.jog)continue;if((d+n.prox)%5===0)IA(id);if((d+n.prox)%30===0)IAdiplo(id)}
 // coalizão contra quem domina
 if(d%60===0)coalizao();
 if(d%3===0)calcVisao();
 if(d>=DIA_FIM&&!S.fim){S.fim=true;if(SIM.onFim)SIM.onFim()}}
const dificIA=()=>S.dific===0?.85:S.dific===2?1.25:1;
function entregarUnidade(dono,p,t,e){const u=novaUnid(t,e);let node=p;if(U(t).naval){const c=P[p].s[0];node=c!==undefined?c+NP:p}
 const ex=S.exs.find(a=>a.dono===dono&&a.node===node&&!a.path.length&&!a.missao&&(U(t).aereo?ehAereo(a):U(t).naval?ehNaval(a):(!ehAereo(a)&&!ehNaval(a)))&&a.units.length<14);
 if(ex)ex.units.push(u);else novoExe(dono,node,[u]);if(dono===S.jog)noticia(`${U(t).nomes[e]} pronta em ${P[p].n}.`,'info',false)}
function revolta(p){const pr=S.prov[p];const c=P[p].c;let rebelde=c;if(!S.nac[rebelde])criarNacao(rebelde);const nr=N(rebelde);const antes=!nr.vivo;
 if(!nr.vivo){nr.vivo=true;nr.cap=p;nr.era=Math.max(nr.era,S.eraMundo);for(const k in nr.res)nr.res[k]=300}
 const e=Math.max(0,Math.min(nr.era,eraUnid(pr.d,'inf')));const qt=2+Math.min(4,Math.floor(P[p].pop/800));const us=[];for(let i=0;i<qt;i++)us.push(novaUnid('inf',e));
 if(!emGuerra(rebelde,pr.d)){S.guerra[K(rebelde,pr.d)]=1;S.inicioGuerra[K(rebelde,pr.d)]=S.dia;addRel(rebelde,pr.d,-50)}
 novoExe(rebelde,p,us);pr.m=30;noticia(`REVOLTA em ${P[p].n}! ${antes?'Rebeldes pegam':'A resistência de '+SIM.nomeNac(rebelde)+' pega'} em armas contra ${SIM.nomeNac(pr.d)}.`,'revolta',false,[pr.d]);calcVisao()}
SIM.revolta=revolta;
// ---------- cercos e conquista (rodam junto com combate)
function cercos(dt){const mapa=new Map();for(const a of S.exs){if(a.node>=NP||a.missao||(a.path.length&&a.prog>0)||!temTerra(a))continue;let l=mapa.get(a.node);if(!l)mapa.set(a.node,l=[]);l.push(a)}
 for(let p=0;p<NP;p++){const pr=S.prov[p];const aqui=mapa.get(p);if(!aqui){if(pr.cerco){pr.cerco=Math.max(0,pr.cerco-dt);if(!pr.cerco)pr.cd=null}continue}
  const inv=aqui.filter(a=>emGuerra(a.dono,pr.d));if(!inv.length){if(pr.cerco){pr.cerco=Math.max(0,pr.cerco-dt);if(!pr.cerco)pr.cd=null}continue}
  const def=aqui.filter(a=>a.dono===pr.d||(aliado(a.dono,pr.d)&&inv.some(i=>emGuerra(i.dono,a.dono))));if(def.length)continue;
  const quem=inv.sort((a,b)=>forca(b)-forca(a))[0].dono;if(pr.cd!==quem){pr.cd=quem;pr.cerco=0}pr.cerco+=dt;const prec=.6+(pr.b.fort||0)*.9+(N(pr.d).cap===p?1:0)+(P[p].ter==='urb'?.5:0);
  if(pr.cerco>=prec)conquistar(p,quem)}}
SIM.precCerco=p=>{const pr=S.prov[p];return .6+(pr.b.fort||0)*.9+(N(pr.d).cap===p?1:0)+(P[p].ter==='urb'?.5:0)};
// ---------- movimento
function mover(dt){for(const a of S.exs){if(a.missao){missao(a,dt);continue}if(!a.path.length)continue;const n0=a.node,n1=a.path[0];const L=Math.hypot(nx(n1)-nx(n0),ny(n1)-ny(n0))*10||1;
  let v=velExe(a);if(n1>=NP&&!ehNaval(a))v=[260,360,460,520][Math.min(3,N(a.dono).era)];else if(n1<NP){v*=TERRENOS[P[n1].ter].vel;if(n0<NP&&S.prov[n0].d===a.dono&&S.prov[n1].d===a.dono&&S.prov[n0].b.fer&&S.prov[n1].b.fer)v*=1.6}
  a.prog+=v*dt/L;if(a.prog>=1){a.node=n1;a.path.shift();a.prog=0;
   // ao chegar: pare se houver inimigo ou se for território inimigo sem dono aliado
   const hostil=S.exs.some(b=>b.node===n1&&b!==a&&emGuerra(b.dono,a.dono)&&!b.missao&&!(b.path.length&&b.prog>0));
   if(hostil)a.path=[];else if(n1<NP&&emGuerra(S.prov[n1].d,a.dono)&&temTerra(a))a.path=[];
   if(!a.path.length&&n1<NP&&!ehNaval(a)&&S.prov[n1].d!==a.dono&&!emGuerra(S.prov[n1].d,a.dono)&&!aliado(S.prov[n1].d,a.dono)){/* território neutro: volta */}
  }
  const t=a.path.length?a.prog:0;const m=a.path.length?a.path[0]:a.node;a.x=nx(a.node)+(nx(m)-nx(a.node))*t;a.y=ny(a.node)+(ny(m)-ny(a.node))*t}
 // retomar alvo após batalha/cerco
 for(const a of S.exs){if(!a.path.length&&a.alvo!=null&&a.alvo!==a.node&&!S.batalhas.has(a.node)){const pr=a.node<NP?S.prov[a.node]:null;if(pr&&emGuerra(pr.d,a.dono)&&temTerra(a))continue;const p=caminho(a,a.alvo,a.dono!==S.jog);if(p&&p.length)a.path=p;else a.alvo=null}else if(a.alvo===a.node&&!a.path.length)a.alvo=null}}
function missao(a,dt){const m=a.missao;const bx=nx(a.node),by=ny(a.node),tx=nx(m.alvo),ty=ny(m.alvo);m.t+=dt;
 if(m.tipo==='repos'){const f=Math.min(1,m.t/m.dur);a.x=bx+(tx-bx)*f;a.y=by+(ty-by)*f;if(f>=1){a.node=m.alvo;a.missao=null}return}
 if(m.fase===0){const f=Math.min(1,m.t/m.dur);a.x=bx+(tx-bx)*f;a.y=by+(ty-by)*f;if(f>=1){m.fase=1;m.t=0;
   // defesa aérea do alvo
   const def=S.exs.filter(b=>b.node===m.alvo&&emGuerra(b.dono,a.dono)&&!b.missao);if(def.length){aplicarDano(def,[a],m.alvo,.5)}
   const dmg=golpe(a.dono,m.alvo,1,a.units.filter(u=>u.hp>0));if(SIM.onAtaque)SIM.onAtaque(m.alvo,a.dono,dmg);limparMortos();
   if(m.alvo<NP&&S.prov[m.alvo].d!==a.dono&&emGuerra(S.prov[m.alvo].d,a.dono)&&rnd()<.25){const b=S.prov[m.alvo].b;const ks=Object.keys(b).filter(k=>b[k]>0&&k!=='fer');if(ks.length)b[ks[(rnd()*ks.length)|0]]--}}}
 else{const f=Math.min(1,m.t/m.dur);a.x=tx+(bx-tx)*f;a.y=ty+(by-ty)*f;if(f>=1){a.missao=null;a.x=bx;a.y=by}}}
function misseis(dt){for(const m of S.misseis){m.t+=dt;if(m.t>=m.dur&&!m.feito){m.feito=true;const arma=[{t:'mis',e:m.e,hp:1}];const alvos=S.exs.filter(a=>a.node===m.alvo&&emGuerra(a.dono,m.dono));
  for(const a of alvos)for(const u of a.units)u.hp-=(U('mis').atk[clsAlvo(u,m.alvo)==='r'?'r':clsAlvo(u,m.alvo)==='a'?'a':'s']||40)*ERA_MULT(m.e)*.5*(.7+rnd()*.6);limparMortos();
  if(m.alvo<NP){const b=S.prov[m.alvo].b;for(const k of ['fab','aer','por','fort','qua'])if(b[k]>0&&rnd()<.5)b[k]--;S.prov[m.alvo].m=Math.max(5,S.prov[m.alvo].m-20)}
  if(SIM.onMissil)SIM.onMissil(m)}}S.misseis=S.misseis.filter(m=>!m.feito)}
// ---------- IA militar
function IA(id){const n=N(id);const pp=PERSONAS[n.persona];const minhas=[];for(let p=0;p<NP;p++)if(S.prov[p].d===id)minhas.push(p);if(!minhas.length)return;
 const meus=S.exs.filter(a=>a.dono===id);const inimigos=Object.keys(S.nac).filter(o=>emGuerra(o,id));const emG=inimigos.length>0;
 // construção
 if(rnd()<.5){const ordem=[...minhas].sort((a,b)=>P[b].pop-P[a].pop).slice(0,8);const p=ordem[(rnd()*ordem.length)|0];const pr=S.prov[p];
  const opc=[];if(!pr.b.qua)opc.push('qua');if(pr.b.fab<2&&P[p].pop>300)opc.push('fab');if(n.era>=1&&!pr.b.aer&&p===n.cap)opc.push('aer');if(P[p].costa&&!pr.b.por&&P[p].pop>500)opc.push('por');
  const front=minhas.filter(q=>P[q].a.some(r=>inimigos.includes(S.prov[r].d)));if(front.length&&rnd()<.4){const f=front[(rnd()*front.length)|0];if(S.prov[f].b.fort<2)SIM.construir(f,'fort')}
  if(opc.length&&!pr.f.some(f=>f.t==='b'))SIM.construir(p,opc[(rnd()*opc.length)|0])}
 // pesquisa
 if(n.fila.length<2){const disp=PESQUISAS.filter(pz=>SIM.pesqDisponivel(id,pz)&&!n.fila.some(f=>f.id===pz.id)&&pz.tipo!=='era');if(disp.length){const pz=disp[(rnd()*disp.length)|0];SIM.pesquisar(id,pz.id)}}
 // recrutamento
 const unid=meus.reduce((s,a)=>s+a.units.length,0);const alvoU=Math.round(minhas.length*2*(emG?1.6:1)*(.7+.3*pp.guerra))+8;const reserva=250*CUSTO_MULT(n.era);
 if(unid<alvoU&&n.res.dinheiro>reserva){const quarteis=minhas.filter(p=>S.prov[p].b.qua&&S.prov[p].f.length<3);const qtd=Math.max(1,Math.min(10,Math.floor((n.res.dinheiro-reserva)/(110*CUSTO_MULT(n.era)))));for(let i=0;i<qtd&&quarteis.length&&n.res.dinheiro>reserva;i++){const p=quarteis[(rnd()*quarteis.length)|0];const r=rnd();let t='inf';
   if(r<.22)t='arm';else if(r<.36)t='art';else if(r<.42)t='aa';else if(r<.52)t=n.era>=1?'fig':'inf';else if(r<.58)t=n.era>=1?'bom':'art';else if(r<.63)t=n.era>=2?'hel':'arm';else if(r<.67)t=n.era>=3?'dro':'inf';else if(r<.70)t=n.era>=2?'mis':'inf';else if(r<.76)t=S.prov[p].b.por?(rnd()<.3?'sub':'nav'):'inf';
   if(SIM.recrutar(p,t)!=='ok')SIM.recrutar(p,'inf')}}
 // aéreos e mísseis
 for(const a of meus){if(a.missao)continue;if(ehAereo(a)&&emG){const r=alcance(a);let best=null,bv=0;for(const b of S.exs){if(!inimigos.includes(b.dono)||b.node>=NP&&!ehNaval(b))continue;const d=SIM.distKm(a.node,b.node);if(d>r)continue;const v=forca(b);if(v>bv){bv=v;best=b}}if(best)SIM.ataqueAereo(a,best.node)}
  if(a.units.some(u=>u.t==='mis')&&emG){let best=null,bv=0;for(const b of S.exs){if(!inimigos.includes(b.dono))continue;const d=SIM.distKm(a.node,b.node);if(d>U('mis').alc[3])continue;const v=forca(b);if(v>bv){bv=v;best=b}}if(best&&bv>40)SIM.lancarMissil(a,best.node)}}
 // juntar exércitos parados na mesma província
 const porNo={};for(const a of meus){if(a.path.length||a.missao||ehAereo(a)||!a.units.length)continue;const k=a.node+(ehNaval(a)?'n':'t');(porNo[k]=porNo[k]||[]).push(a)}
 for(const k in porNo){const l=porNo[k];while(l.length>1&&l[0].units.length<16){const b=l.pop();l[0].units.push(...b.units);b.units=[]}}S.exs=S.exs.filter(a=>a.units.length);
 if(!emG){// posiciona na fronteira com vizinhos hostis
  if(rnd()<.3){for(const a of meus){if(a.path.length||ehAereo(a)||ehNaval(a)||a.missao)continue;if(rnd()<.7)continue;const hostis=minhas.filter(p=>P[p].a.some(q=>{const o=S.prov[q].d;return o!==id&&rel(o,id)<-10}));if(hostis.length){SIM.mover(a,hostis[(rnd()*hostis.length)|0],true)}}}return}
 // em guerra: atacar províncias inimigas
 const alvosT=new Set();for(const p of minhas)for(const q of P[p].a)if(inimigos.includes(S.prov[q].d))alvosT.add(q);
 const fMap=new Map();for(const b of S.exs){if(!inimigos.includes(b.dono))continue;fMap.set(b.node,(fMap.get(b.node)||0)+forca(b))}const forcaEm=node=>fMap.get(node)||0;
 let ordens=0;
 for(const a of meus){if(ordens>6)break;if(a.path.length||a.missao||ehAereo(a))continue;if(S.batalhas.has(a.node))continue;
  if(ehNaval(a)){// caça frota inimiga próxima
   let best=null,bd=900;for(const b of S.exs){if(!inimigos.includes(b.dono)||b.node<NP)continue;const d=Math.hypot(b.x-a.x,b.y-a.y);if(d<bd&&forca(b)<forca(a)*1.3){bd=d;best=b}}if(best){SIM.mover(a,best.node);ordens++}continue}
  if(!temTerra(a))continue;
  const guarnicaoCap=a.node===n.cap&&meus.filter(b=>b.node===n.cap).length<=1&&meus.length>2;if(guarnicaoCap&&rnd()<.7)continue;
  const fa=forca(a);let best=null,bs=-1e9;
  const pequeno=minhas.length<=3;for(const q of alvosT){if(pequeno&&P[q].c!==id&&rnd()<.85)continue;const d=Math.hypot(P[q].x-a.x,P[q].y-a.y);if(d>220)continue;const fe=forcaEm(q);if(fe>fa*(pp.guerra>1?1.25:.9))continue;const s=-d*.6-fe*2+(S.prov[q].b.fort?-10:0)+(N(S.prov[q].d).cap===q?40:0)+P[q].pop/200;if(s>bs){bs=s;best=q}}
  if(best!=null){if(SIM.mover(a,best,true))ordens++;continue}
  // ir para a frente de batalha
  let fr=null,bd=1e9;for(const p of minhas){if(!P[p].a.some(q=>inimigos.includes(S.prov[q].d)))continue;const d=Math.hypot(P[p].x-a.x,P[p].y-a.y);if(d<bd&&d>1){bd=d;fr=p}}
  if(fr!=null&&bd<900){if(SIM.mover(a,fr,true))ordens++;else if(rnd()<.2&&SIM.mover(a,fr))ordens++;continue}
  // invasão naval ocasional
  if(fa>60&&!pequeno&&rnd()<.12&&P[a.node]&&P[a.node].costa&&S.exs.some(b=>b.dono===id&&ehNaval(b))){let alvo=null,bd2=1e9;for(let q=0;q<NP;q++){if(!inimigos.includes(S.prov[q].d)||!P[q].costa)continue;const d=Math.hypot(P[q].x-a.x,P[q].y-a.y);const fe=forcaEm(q);if(d<bd2&&d<450&&fe<fa*.8){bd2=d;alvo=q}}if(alvo!=null&&SIM.mover(a,alvo))ordens++}}}
// ---------- IA diplomática
function IAdiplo(id){const n=N(id);const pp=PERSONAS[n.persona];const viz=vizinhosNac(id);const meuP=poderAli(id);const guerras=Object.keys(S.nac).filter(o=>emGuerra(o,id));
 // rendição
 const nucTot=P.filter(p=>p.c===id||SIM.nucleo(id,p.id)).length,nucMeu=minhasNuc(id);const perdendo=nucTot>2&&nucMeu/nucTot<.6;
 if(perdendo&&guerras.length){for(const o of guerras){if(o===S.jog){if(!S.prop.some(p=>p.de===id&&p.tipo==='paz'))S.prop.push({de:id,tipo:'paz',dia:S.dia,txt:`${SIM.nomeNac(id)} está perdendo e pede a rendição. Você fica com o que conquistou.`});continue}if(rnd()<.45)fazerPaz(id,o,poder(o)>poder(id)?`${SIM.nomeNac(id)} se rende a ${SIM.nomeNac(o)} e assina um tratado de paz humilhante.`:undefined)}}
 // paz
 for(const o of guerras){const dias=S.dia-(S.inicioGuerra[K(id,o)]||0);if(dias<150)continue;const ratio=meuP/(poderAli(o)+1);let ch=.12*pp.paz*(ratio<.8?2:ratio>1.6?.3:1)*(N(id).moral<40?2:1);
  if(o===S.jog){if(rnd()<ch*.8&&!S.prop.some(p=>p.de===id&&p.tipo==='paz'))S.prop.push({de:id,tipo:'paz',dia:S.dia,txt:`${SIM.nomeNac(id)} propõe um acordo de paz.`});continue}
  const pp2=PERSONAS[N(o).persona];if(rnd()<ch&&rnd()<pp2.paz*.7)fazerPaz(id,o)}
 // traição
 if(pp.trai>.5&&S.dia>200){for(const o in S.nac){if(o===id||!aliado(id,o)||!N(o).vivo)continue;if(!viz.includes(o))continue;if(poder(o)<poder(id)*.6&&rnd()<.06*pp.trai){romper(id,o,`TRAIÇÃO! ${SIM.nomeNac(id)} apunhala seu aliado ${SIM.nomeNac(o)} pelas costas!`);declararGuerra(id,o,`${SIM.nomeNac(id)} invade o antigo aliado ${SIM.nomeNac(o)}!`);return}}}
 // nova guerra
 const gap=[150,70,160,90][S.eraMundo];if(guerras.length<2&&S.dia>120&&S.dia-(S.ultGIA||-999)>gap&&(S.eraMundo>0||pp.guerra>=1.3)){for(const o of viz){if(S.treg[K(id,o)]>S.dia||aliado(id,o))continue;const r=rel(id,o);const ratio=meuP/(poderAli(o)+1);let ch=.025*pp.guerra*(ratio>1.5?2:ratio>1.1?1:.2)*(r<-20?2:r<0?1:.3)*(S.eraMundo===2?.6:S.eraMundo===0?.5:1)*(r>10?.2:1);
   if(o===S.jog)ch*=S.dific===0?.5:S.dific===2?1.5:1;if(rnd()<ch){S.ultGIA=S.dia;declararGuerra(id,o);return}}}
 // alianças (poucas, entre vizinhos/continente)
 const nAli=Object.keys(S.ali).filter(k=>k.split('|').includes(id)).length;
 if(nAli<4)for(const o of viz.concat(Object.keys(S.nac).filter(x=>N(x).vivo&&N(x).cont===n.cont&&rnd()<.05))){if(o===id||!N(o).vivo||aliado(id,o)||emGuerra(id,o))continue;const comum=guerras.some(g=>emGuerra(g,o));const r=rel(id,o);
  const nAo=Object.keys(S.ali).filter(k=>k.split('|').includes(o)).length;if(nAo>=4)continue;
  if((comum&&r>15&&rnd()<.2)||(r>55&&rnd()<.06)){if(o===S.jog){if(!S.prop.some(p=>p.de===id))S.prop.push({de:id,tipo:'ali',dia:S.dia,txt:`${SIM.nomeNac(id)} propõe uma aliança${comum?' contra o inimigo em comum':''}.`})}else if(rnd()<(PERSONAS[N(o).persona].trai>1?.5:.8))aliar(id,o)}}
 // comércio
 if(rnd()<.15){const o=viz[(rnd()*viz.length)|0];if(o&&!emGuerra(id,o)&&!S.com[K(id,o)]&&rel(id,o)>0){if(o===S.jog){if(!S.prop.some(p=>p.de===id))S.prop.push({de:id,tipo:'com',dia:S.dia,txt:`${SIM.nomeNac(id)} quer um acordo comercial.`})}else{S.com[K(id,o)]=1;addRel(id,o,8)}}}
 // relações mudam devagar
 for(const o of viz){addRel(id,o,(rnd()-.55)*3*pp.guerra)}
 if(S.prop.length>6)S.prop.splice(0,S.prop.length-6)}
function minhasNuc(id){let c=0;for(const p of P)if(S.prov[p.id].d===id&&(p.c===id||SIM.nucleo(id,p.id)))c++;return c}
function coalizao(){let total=0;const cont={};for(const p of S.prov){cont[p.d]=(cont[p.d]||0)+1;total++}let top=null,tv=0;for(const k in cont)if(cont[k]>tv){tv=cont[k];top=k}
 if(!top||tv/total<.14||S.eraMundo<1)return;if(S.ini&&tv<(S.ini[top]||0)*1.25)return;if(S.ultCoal&&S.dia-S.ultCoal<720)return;S.ultCoal=S.dia;const viz=vizinhosNac(top).filter(o=>o!==S.jog&&!aliado(o,top));if(viz.length<2)return;
 noticia(`COALIZÃO! O mundo se une contra o domínio de ${SIM.nomeNac(top)}: ${viz.slice(0,5).map(SIM.nomeNac).join(', ')}.`,'guerra',true);
 const cz=viz.sort((x,y)=>poder(y)-poder(x)).slice(0,4);for(const a of cz)for(const b of cz)if(a<b&&!emGuerra(a,b))aliar(a,b,'');for(const a of cz)declararGuerra(a,top,'',false)}
// ---------- passo principal
let acum=0,acumC=0;
SIM.passo=(dtDias)=>{if(!S||S.fim&&S.fimParado)return;const SUB=.1;acum+=dtDias;let it=0;while(acum>=SUB&&it++<400){acum-=SUB;const antes=Math.floor(S.dia);S.dia+=SUB;mover(SUB);misseis(SUB);acumC+=SUB;if(acumC>=.25){acumC-=.25;combates(.25*.55);cercos(.25)}if(Math.floor(S.dia)>antes)diario()}};
SIM.IA=IA;SIM.diario=diario;SIM.eventoEra=eventoEra;SIM.conquistar=conquistar;SIM.independencia=independencia;
})();
SIM.eraVisual=()=>{const S=SIM.get();return S&&S.nac[S.jog]?Math.min(3,S.nac[S.jog].era):0};
