// Simulação no estilo WAR: tropas por cidade, reforços, atacar vizinho, mover tropas.
// Mantém eras (1914 → hoje), IA com diplomacia, alianças, revoltas e notícias.
'use strict';
const SIM={};
(function(){
const g=window.GEO;const NP=g.provinces.length;SIM.NP=NP;
const dec=a=>{const o=[];let x=0,y=0;for(let i=0;i<a.length;i+=2){x+=a[i];y+=a[i+1];o.push([x/2,y/2])}return o};
const CT={};for(const c of g.countries)CT[c.id]=c;SIM.CT=CT;
const P=g.provinces.map((p,i)=>{const rings=p.r.map(dec);const bb=[1e9,1e9,-1e9,-1e9];for(const r of rings)for(const [x,y] of r){if(x<bb[0])bb[0]=x;if(y<bb[1])bb[1]=y;if(x>bb[2])bb[2]=x;if(y>bb[3])bb[3]=y}
 return {id:i,c:p.c,n:p.n,x:p.x,y:p.y,pop:p.pop,cap:p.cap,ter:p.ter,lat:p.lat,lon:p.lon,rings,bb,a:p.a.slice(),m:[],s:p.s,costa:p.s.length>0,oil:!!p.oil,cont:(CT[p.c]||{}).ct||'',renda:+(.35+Math.sqrt(p.pop)/55).toFixed(2)}});
SIM.P=P;SIM.E=g.edges.map(([a,b,l])=>({a,b,pts:dec(l)}));
// ---------- ligações marítimas (como no tabuleiro do WAR)
const G=g.G,GW=g.GW,GH=g.GH;const seaB=atob(g.sea);const SEA=new Uint8Array(GW*GH);for(let i=0;i<SEA.length;i++)SEA[i]=seaB.charCodeAt(i);
const seaProv=new Map();P.forEach(p=>{for(const c of p.s){if(!seaProv.has(c))seaProv.set(c,[]);seaProv.get(c).push(p.id)}});
const extra=new Map();for(const [a,b] of g.extra){if(!extra.has(a))extra.set(a,[]);if(!extra.has(b))extra.set(b,[]);extra.get(a).push(b);extra.get(b).push(a)}
function marViz(c){const i=c%GW,j=(c/GW)|0;const o=[];for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const I=i+di,J=j+dj;if(I<0||J<0||I>=GW||J>=GH)continue;const k=J*GW+I;if(SEA[k])o.push(k)}const ex=extra.get(c);if(ex)for(const k of ex)o.push(k);return o}
function terraPerto(p,max){const vis=new Map([[p,0]]);const q=[p];while(q.length){const x=q.shift();const d=vis.get(x);if(d>=max)continue;for(const y of P[x].a)if(!vis.has(y)){vis.set(y,d+1);q.push(y)}}return vis}
(function ligacoes(){const PROF=5;
 for(const p of P){if(!p.costa)continue;const dist=new Map();const q=[];for(const c of p.s){dist.set(c,0);q.push(c)}const cand=new Map();
  while(q.length){const c=q.shift();const d=dist.get(c);const ps=seaProv.get(c);if(ps)for(const o of ps)if(o!==p.id&&(!cand.has(o)||cand.get(o)>d))cand.set(o,d);if(d>=PROF)continue;for(const k of marViz(c))if(!dist.has(k)){dist.set(k,d+1);q.push(k)}}
  if(!cand.size)continue;const perto=terraPerto(p.id,5);const l=[...cand.entries()].filter(([o])=>!perto.has(o)).sort((a,b)=>a[1]-b[1]||Math.hypot(P[a[0]].x-p.x,P[a[0]].y-p.y)-Math.hypot(P[b[0]].x-p.x,P[b[0]].y-p.y));
  const pipP=(x,y)=>{for(const q of P){const b=q.bb;if(x<b[0]||x>b[2]||y<b[1]||y>b[3])continue;for(const r of q.rings){let ins=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const xi=r[i][0],yi=r[i][1],xj=r[j][0],yj=r[j][1];if(((yi>y)!=(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))ins=!ins}if(ins)return true}}return false};
  const sobreTerra=o=>{let n=0;for(const f of [.25,.5,.75]){if(pipP(p.x+(P[o].x-p.x)*f,p.y+(P[o].y-p.y)*f))n++}return n>=2};
  for(const [o] of l.filter(([o])=>!sobreTerra(o)).slice(0,2)){if(p.m.length>=3||P[o].m.length>=3)continue;if(!p.m.includes(o))p.m.push(o);if(!P[o].m.includes(p.id))P[o].m.push(p.id)}}
 const perto=(lat,lon)=>{let b=null,bd=1e9;for(const p of P){if(!p.costa)continue;const d=Math.hypot(p.lat-lat,(p.lon-lon)*Math.cos(lat*Math.PI/180));if(d<bd){bd=d;b=p}}return b};
 for(const [a,b] of [[[40.7,-74],[50.4,-4.5]],[[-8,-35],[14.7,-17.4]],[[47,-53],[53,-9]]]){const pa=perto(...a),pb=perto(...b);if(pa&&pb&&pa!==pb){if(!pa.m.includes(pb.id))pa.m.push(pb.id);if(!pb.m.includes(pa.id))pb.m.push(pa.id)}}
 const L=[];for(const p of P)for(const o of p.m)if(p.id<o)L.push([p.id,o]);SIM.LIG=L})();
const viz=p=>P[p].a.concat(P[p].m);SIM.viz=viz;
// ---------- utilidades
const K=(a,b)=>a<b?a+'|'+b:b+'|'+a;
let S=null;SIM.get=()=>S;
const rnd=()=>Math.random();const N=id=>S.nac[id];
const nomeBase=id=>{const n=S&&S.nac[id];const e=n?Math.min(3,n.era):0;if(NOMES[id])return NOMES[id][e];return (n&&n.nome)||(CT[id]||{}).n||id};SIM.nomeBase=nomeBase;
SIM.nomeNac=id=>{const n=S&&S.nac[id];const b=nomeBase(id);if(!n||!n.tier)return b;const dB=()=>{const a=artBase(b);return ({'':'de ',o:'do ',a:'da ',os:'dos ',as:'das '})[a]+b};
 const sh=(CT[id]&&CT[id].n)||b;const dS=()=>{const a=artBase(sh);return ({'':'de ',o:'do ',a:'da ',os:'dos ',as:'das '})[a]+sh};
 const mon=/^(Império|Reino|Sultanato|Emirado|Grão)/.test(b),gov=/^(República|Estados|União|Federação|Confederação|Domínio|Raj)/.test(b);
 if(n.tier===1)return mon?'Grande '+b:gov?b:'Reino '+dB();if(n.tier===2)return /^Império/.test(b)?b+' Supremo':'Império '+dS();return 'Superpotência '+dS()};
// artigos em português (para a Bélgica, do Brasil, à França, aos Estados Unidos)
const SEM_ART=['Portugal','Israel','Cuba','Angola','Moçambique','Taiwan','Mônaco','Malta','Chipre','Timor-Leste','Singapura','Hong Kong','Andorra','Omã','Mianmar','Madagascar','Belize','Fiji','Cabo Verde','São Tomé e Príncipe','Granada','Barbados','Jamaica','Trinidad e Tobago','Porto Rico','Samoa','Tonga','Kosovo','Montenegro','Djibuti','Bahrein','Mali','Andorra','Luxemburgo','Liechtenstein'];
const MASC=/^(Império|Reino|Sultanato|Emirado|Domínio|Raj|Canadá|Japão|Brasil|México|Peru|Chile|Uruguai|Paraguai|Equador|Egito|Irã|Iraque|Iêmen|Líbano|Sudão|Chade|Níger|Marrocos|Congo|Gabão|Senegal|Togo|Benin|Quênia|Zimbábue|Malawi|Malaui|Afeganistão|Paquistão|Nepal|Butão|Vietnã|Laos|Camboja|Cazaquistão|Uzbequistão|Turcomenistão|Quirguistão|Tadjiquistão|Azerbaijão|Sri Lanka|Bangladesh|Catar|Kuwait|Haiti|Panamá|Suriname|Lesoto|Botsuana|Burundi|Ruanda|Saara|Sião|Tibete|Vaticano|Camarões|Brunei|Gana|Zaire|Turquestão|Saara Ocidental|Sudão do Sul|Benim|Iémen|Kuwait|Omã)/;
function artBase(n){if(SEM_ART.includes(n))return '';if(/^(Estados Unidos|Países Baixos|Emirados|Camarões)/.test(n))return 'os';if(/^(Ilhas|Filipinas|Maldivas|Bahamas|Seicheles|Comores)/.test(n))return 'as';if(MASC.test(n))return 'o';if(/a$/.test(n)||/^(República|União|Federação|Confederação)/.test(n))return 'a';return 'o'}
function artigo(id){const n=SIM.nomeNac(id);if(/^Superpotência/.test(n))return 'a';if(/^Grande Império/.test(n))return 'o';if(SEM_ART.includes(n))return '';if(/^(Estados Unidos|Países Baixos|Emirados|Camarões)/.test(n))return 'os';if(/^(Ilhas|Filipinas|Maldivas|Bahamas|Seicheles|Comores)/.test(n))return 'as';if(MASC.test(n))return 'o';if(/a$/.test(n)||/^(República|União|Federação|Confederação)/.test(n))return 'a';return 'o'}
SIM.artigo=artigo;
SIM.oNac=id=>{const a=artigo(id);return (a?a+' ':'')+SIM.nomeNac(id)};
SIM.OoNac=id=>{const s=SIM.oNac(id);return s[0].toUpperCase()+s.slice(1)};
SIM.deNac=id=>{const a=artigo(id);return ({'':'de ',o:'do ',a:'da ',os:'dos ',as:'das '})[a]+SIM.nomeNac(id)};
SIM.aNac=id=>{const a=artigo(id);return ({'':'a ',o:'ao ',a:'à ',os:'aos ',as:'às '})[a]+SIM.nomeNac(id)};
const PL=id=>['os','as'].includes(artigo(id));SIM.PL=PL;const V=(id,a,b)=>PL(id)?b:a;SIM.V=V;
SIM.paraNac=id=>'para '+SIM.oNac(id);
SIM.emNac=id=>{const a=artigo(id);return ({'':'em ',o:'no ',a:'na ',os:'nos ',as:'nas '})[a]+SIM.nomeNac(id)};
const emGuerra=(a,b)=>a!==b&&!!S.guerra[K(a,b)];const aliado=(a,b)=>a===b||!!S.ali[K(a,b)];
SIM.emGuerra=emGuerra;SIM.aliado=aliado;
const rel=(a,b)=>S.rel[K(a,b)]||0;const addRel=(a,b,v)=>{const k=K(a,b);S.rel[k]=Math.max(-100,Math.min(100,(S.rel[k]||0)+v))};SIM.rel=rel;
const dataDe=d=>{const t=new Date(Date.UTC(1914,6,28));t.setUTCDate(t.getUTCDate()+Math.floor(d));return t};
const MESES=['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez'];
SIM.dataTxt=d=>{const t=dataDe(d);return t.getUTCDate()+' '+MESES[t.getUTCMonth()]+' '+t.getUTCFullYear()};
SIM.ano=d=>dataDe(d).getUTCFullYear();
const diaDoAno=(ano,mes,dia)=>Math.round((Date.UTC(ano,mes,dia)-Date.UTC(1914,6,28))/864e5);
const DIA_ERA=[0,diaDoAno(1939,8,1),diaDoAno(1947,2,12),diaDoAno(1991,11,26)];SIM.DIA_ERA=DIA_ERA;
const DIA_FIM=diaDoAno(2030,0,1);SIM.DIA_FIM=DIA_FIM;
function noticia(txt,tipo='info',envolve=[]){const n={dia:S.dia,txt,tipo,meu:envolve.includes(S.jog)};S.news.unshift(n);if(S.news.length>120)S.news.length=120;if(SIM.onNoticia)SIM.onNoticia(n)}
SIM.noticia=noticia;
// ---------- tropas
const TIPOS={i:{n:['Infantaria','Infantaria','Infantaria Mecanizada','Forças Especiais'],cat:'Infantaria',img:'inf',f:1,custo:{din:40,pet:0},man:.07},
 b:{n:['Tanque Mark I','Tanque Médio','Tanque de Batalha','Tanque Moderno'],cat:'Blindados',img:'tan',f:3,custo:{din:110,pet:8},man:.13},
 a:{n:['Biplano','Caça a Hélice','Caça a Jato','Caça Furtivo'],cat:'Aviação',img:'avi',f:3.5,custo:{din:140,pet:14},man:.16}};
SIM.TIPOS=TIPOS;const TK=['i','b','a'];
const ERA_F=[1,1.7,2.8,4.2];SIM.ERA_F=ERA_F;
const TER_DEF={pla:1,flo:1.15,sel:1.25,mon:1.4,des:1,fri:1.15,urb:1.2};SIM.TER_DEF=TER_DEF;
const bonus=(n,k)=>{let b=1;for(let e=0;e<4;e++)if(n.pq[k+e])b+=.2;return b};SIM.bonus=bonus;
SIM.total=t=>t.i+t.b+t.a;
function forcaDe(t,id,ter,atk){const n=N(id);if(!n)return 0;let s=t.i*bonus(n,'i')+t.b*3*bonus(n,'b')*(atk&&(ter==='mon'||ter==='sel')?.7:1)+t.a*3.5*bonus(n,'a');return s*ERA_F[Math.min(3,n.era)]}
SIM.forcaDe=forcaDe;
const ehCapital=p=>{const n=N(S.prov[p].d);return n&&n.cap===p};SIM.ehCapital=ehCapital;
function defesa(p){const pr=S.prov[p];const n=N(pr.d);let d=forcaDe(pr,pr.d,P[p].ter,false);d+=SIM.milicia(p)*ERA_F[Math.min(3,n?n.era:0)];return d*(TER_DEF[P[p].ter]||1)*(1+.4*pr.fort)*(ehCapital(p)?1.2:1)*[1.45,1.05,1.1,1.1][S.eraMundo]}
SIM.defesa=defesa;SIM.milicia=p=>+(1.2+Math.sqrt(P[p].pop)/28).toFixed(1);
SIM.forcaCidade=p=>forcaDe(S.prov[p],S.prov[p].d,P[p].ter,false);
const chance=(A,D)=>D<=0?1:Math.pow(A,3)/(Math.pow(A,3)+Math.pow(D,3));SIM.chance=chance;
function separar(p,frac){const pr=S.prov[p];const tot=pr.i+pr.b+pr.a;if(tot<=1)return {i:0,b:0,a:0};let t={i:Math.round(pr.i*frac),b:Math.round(pr.b*frac),a:Math.round(pr.a*frac)};
 if(t.i+t.b+t.a>=tot){if(t.i>0)t.i--;else if(t.b>0)t.b--;else t.a--}if(t.i+t.b+t.a===0){if(pr.i>1)t.i=1;else if(pr.b>0)t.b=1;else if(pr.a>0)t.a=1;else if(pr.i>0&&tot>1)t.i=1}return t}
SIM.separar=separar;
// ---------- nações
function donoInicial(c){for(const k in IMPERIOS)if(IMPERIOS[k].split(' ').includes(c))return k;return c}
SIM.donoIni=donoInicial;
SIM.nucleo=(nac,p)=>{const pc=P[p].c;if(pc===nac)return true;const l=NUCLEOS[nac];return !!(l&&l.split(' ').includes(pc))};
function corNac(id){if(CORES[id])return CORES[id];const h=ART.corHash(id+'x');return `hsl(${h%360},${45+(h>>9)%25}%,${48+(h>>5)%14}%)`}
function criarNacao(id){const persona=PERSONA_FIXA[id]||['agressivo','expansionista','defensivo','traicoeiro','leal','oportunista','pacifico','pacifico','defensivo','oportunista'][ART.corHash(id)%10];
 S.nac[id]={id,cor:corNac(id),persona,era:S.eraMundo||0,din:250,pet:30,cap:-1,vivo:true,pq:{},ref:0,cont:(CT[id]||{}).ct||'',vez:ART.corHash(id)%5,ini:0};return S.nac[id]}
const cidadesDe=id=>{const l=[];for(let i=0;i<NP;i++)if(S.prov[i].d===id)l.push(i);return l};SIM.cidadesDe=cidadesDe;
function vizinhosNac(id){const s=new Set();for(let i=0;i<NP;i++){if(S.prov[i].d!==id)continue;for(const q of viz(i)){const o=S.prov[q].d;if(o!==id&&N(o)&&N(o).vivo)s.add(o)}}return [...s]}
SIM.vizinhosNac=vizinhosNac;
function poder(id){let s=0;for(let i=0;i<NP;i++)if(S.prov[i].d===id)s+=forcaDe(S.prov[i],id,'pla',false);return s}
SIM.poder=poder;
const MAIORES={DEU:9,RUS:9,FRA:8,AUT:7,GBR:7,TUR:5,ITA:5,USA:5,JPN:5,CHN:4,SRB:3,ESP:3,BRA:3};
SIM.novo=(jog)=>{S={v:20,dia:0,jog,eraMundo:0,nac:{},prov:[],guerra:{},ali:{},com:{},rel:{},treg:{},inicioG:{},news:[],prop:[],ev:0,stats:{conq:0,perd:0,vit:0,der:0,rec:0,mov:0,cons:0,pesq:0},mis:0,misIni:{},ultDia:0};
 for(const p of P){const d=donoInicial(p.c);S.prov.push({d,i:0,b:0,a:0,fab:0,fort:0,oc:0});if(!S.nac[d])criarNacao(d)}
 for(const id in S.nac){const n=S.nac[id];const ps=cidadesDe(id);const cap=ps.find(p=>P[p].cap&&P[p].c===id)??ps.find(p=>P[p].cap)??ps.slice().sort((a,b)=>P[b].pop-P[a].pop)[0];n.cap=cap;
  const maj=MAIORES[id]||0;n.din=maj?700:220;n.pet=maj?60:20;
  for(const p of ps){const pr=S.prov[p];const nuc=SIM.nucleo(id,p);let t=nuc?2+Math.round(Math.sqrt(P[p].pop)/20):1;if(maj&&nuc){t+=Math.round(maj/2);pr.fab=1}pr.i=t;
   if(maj&&nuc&&P[p].a.some(q=>S.prov.length>q&&false))pr.b=1}
  const pc=S.prov[cap];pc.i+=3+Math.round(maj/2);pc.fab=1;pc.fort=1;if(maj){pc.b=1+Math.round(maj/4);pc.a=maj>=5?1:0}
  n.ini=ps.length}
 // blindados na fronteira das potências
 for(let p=0;p<NP;p++){const pr=S.prov[p];const maj=MAIORES[pr.d];if(!maj||!SIM.nucleo(pr.d,p))continue;if(P[p].a.some(q=>S.prov[q].d!==pr.d)&&rnd()<.5)pr.b+=1}
 for(const [a,b] of ALIANCAS_1914)if(S.nac[a]&&S.nac[b]){S.ali[K(a,b)]=1;addRel(a,b,60)}
 N(jog).din+=150;N(jog).ref=0;for(const id in S.nac)N(id).ini=cidadesDe(id).length;S.ameaca=0;
 noticia('28 de julho de 1914. A Europa está à beira da guerra.','era');return S};
// ---------- impérios e ameaça
const TIERS=[null,{n:'Reino',min:8,ref:2,renda:.10,ic:'🏰'},{n:'Império',min:25,ref:5,renda:.20,ic:'👑'},{n:'Superpotência',min:60,ref:10,renda:.35,ic:'🌍'}];SIM.TIERS=TIERS;
const cresc=id=>{const n=N(id);return cidadesDe(id).length-(n.ini||0)};SIM.cresc=cresc;
const precisa=(id,t)=>Math.max(TIERS[t].min,Math.ceil((N(id).ini||0)*[0,.12,.35,.7][t]));SIM.precisa=precisa;
SIM.nomeComTier=(id,t)=>{const n=N(id);const o=n.tier;n.tier=t;const r=SIM.nomeNac(id);n.tier=o;return r};
SIM.podeProclamar=(id=S.jog)=>{const n=N(id);const t=(n.tier||0)+1;if(t>=TIERS.length)return 0;return cresc(id)>=precisa(id,t)?t:0};
SIM.proclamar=(id=S.jog)=>{const t=SIM.podeProclamar(id);if(!t)return null;const n=N(id);const antes=SIM.nomeNac(id);n.tier=t;const novo=SIM.nomeNac(id);
 noticia(novo===antes?`${TIERS[t].ic} ${antes} agora é uma POTÊNCIA REGIONAL!`:`${TIERS[t].ic} ${antes} se proclama ${novo}!`,'imperio',[id]);
 if(id===S.jog){S.ameaca=Math.min(100,(S.ameaca||0)+12);for(const o in S.nac)if(o!==id&&N(o).vivo&&cidadesDe(o).length>=10)addRel(o,id,-8)}return {t,antes,novo}};
function ameacaMensal(){const eu=S.jog;const n=N(eu);if(!n||!n.vivo)return;S.ameaca=Math.max(0,(S.ameaca||0)-2.5+(n.tier||0)*.6);const a=S.ameaca;S.amNiv=S.amNiv||0;
 if(a>35){for(const o in S.nac){if(o===eu||!N(o).vivo||cidadesDe(o).length<8||aliado(o,eu))continue;addRel(o,eu,-(a-35)/15)}}
 if(a>=40&&S.amNiv<1){S.amNiv=1;noticia(`👀 As potências se preocupam com o crescimento ${SIM.deNac(eu)}.`,'ameaca',[eu])}
 if(a<25&&S.amNiv>=1)S.amNiv=0;
 if(a>=70&&rnd()<.35&&(S.coalDia||-999)<S.dia-240){const pot=Object.keys(S.nac).filter(o=>o!==eu&&N(o).vivo&&!aliado(o,eu)&&cidadesDe(o).length>=12).sort((x,y)=>poder(y)-poder(x)).slice(0,4);if(pot.length>=2){S.coalDia=S.dia;S.amNiv=2;
  for(let i=0;i<pot.length;i++)for(let j=i+1;j<pot.length;j++)if(!emGuerra(pot[i],pot[j])&&!aliado(pot[i],pot[j])){S.ali[K(pot[i],pot[j])]=1;addRel(pot[i],pot[j],20)}
  const lst=pot.map(o=>SIM.oNac(o)).join(', ').replace(/, ([^,]*)$/,' e $1');noticia(`⚔️ COALIZÃO! ${lst[0].toUpperCase()+lst.slice(1)} se unem contra ${SIM.oNac(eu)}.`,'ameaca',[eu].concat(pot));
  if(a>=82){const vz=new Set(vizinhosNac(eu));for(const o of pot)if(vz.has(o)&&!emGuerra(o,eu))declararGuerra(o,eu,`⚔️ ${SIM.OoNac(o)} ${V(o,'declara','declaram')} guerra ${SIM.aNac(eu)} para conter o seu império!`,false)}}}}
SIM.ameacaTxt=a=>a>=70?'Alarmante':a>=40?'Alta':a>=20?'Média':'Baixa';
// ---------- economia
let comB={};const valorCom=(ra,rb)=>Math.round((2+Math.min(18,.12*Math.min(ra,rb)))*10)/10;
const temCom=(a,b)=>!!S.com[K(a,b)];SIM.temCom=temCom;
const comerciosDe=id=>Object.keys(S.com).filter(k=>k.split('|').includes(id)).map(k=>{const [x,y]=k.split('|');return x===id?y:x});SIM.comerciosDe=comerciosDe;
SIM.bonusCom=id=>{let din=0,pet=0;for(const o of comerciosDe(id)){din+=SIM.valorComCom(id,o);pet+=(SIM.rendaDia(o).pet-(comB[o]?comB[o].pet:0))>.5?.2:.08}return {din,pet}};
SIM.valorComCom=(a,b)=>{const r=id=>SIM.rendaDia(id).bruto-(comB[id]?comB[id].din:0);return valorCom(r(a),r(b))};
function fazerCom(a,b,silencio){if(a===b||temCom(a,b))return;S.com[K(a,b)]=S.dia;addRel(a,b,8);if(!silencio)noticia(`💰 ${SIM.OoNac(a)} e ${SIM.oNac(b)} fecham um acordo comercial.`,'alianca',[a,b])}
function cancelarCom(a,b,txt){if(!temCom(a,b))return;delete S.com[K(a,b)];addRel(a,b,-10);noticia(txt||`${SIM.OoNac(a)} ${V(a,'cancela','cancelam')} o acordo comercial com ${SIM.oNac(b)}.`,'traicao',[a,b])}
SIM.fazerCom=fazerCom;
function diario(){const d=Math.round(S.dia);const ag={};for(const id in S.nac)ag[id]={r:0,p:.1,m:0,c:0,cn:0};
 for(let i=0;i<NP;i++){const pr=S.prov[i];const a=ag[pr.d];if(!a)continue;a.c++;if(SIM.nucleo(pr.d,i))a.cn++;a.r+=P[i].renda*(1+.5*pr.fab)*(SIM.nucleo(pr.d,i)?1:.15);if(P[i].oil)a.p+=.7;a.m+=pr.i*TIPOS.i.man+pr.b*TIPOS.b.man+pr.a*TIPOS.a.man}
 comB={};for(const k in S.com){const [x,y]=k.split('|');if(!ag[x]||!ag[y]||!ag[x].c||!ag[y].c){delete S.com[k];continue}const v=valorCom(ag[x].r,ag[y].r);for(const [u,o] of [[x,y],[y,x]]){const b=comB[u]||(comB[u]={din:0,pet:0});b.din+=v;b.pet+=ag[o].p>.5?.2:.08}}
 for(const id in ag){const t=N(id)&&N(id).tier;if(t)ag[id].r*=1+TIERS[t].renda}
 for(const id in comB){if(ag[id]){ag[id].r+=comB[id].din;ag[id].p+=comB[id].pet}}
 for(const id in S.nac){const n=N(id);if(!n.vivo)continue;const a=ag[id];if(!a.c){continue}n.din+=a.r-a.m;n.pet+=a.p;if(n.din<-50){n.din=-50;const cs=cidadesDe(id).filter(p=>S.prov[p].i>1);if(cs.length){S.prov[cs[(rnd()*cs.length)|0]].i--}}}
 if(d%30===0){for(const id in S.nac){const n=N(id);if(!n.vivo)continue;const c=ag[id].c;if(!c)continue;const cn=ag[id].cn;let r=Math.max(2,Math.floor((cn+(c-cn)/10)/3))+(S.prov[n.cap]&&S.prov[n.cap].d===id?2:0)+(n.tier?TIERS[n.tier].ref:0);if(id===S.jog){n.ref+=r;if(SIM.onReforco)SIM.onReforco(r)}else colocarIA(id,r)}
  revoltas()}
 // eventos históricos de 1914
 while(S.ev<EVENTOS_1914.length&&EVENTOS_1914[S.ev].d<=d){const ev=EVENTOS_1914[S.ev++];if(S.eraMundo>0)continue;const a=ev.a,b=ev.b;if(!N(a)||!N(b)||!N(a).vivo||!N(b).vivo)continue;
  if(a===S.jog){if(ev.t==='alianca')S.prop.push({de:b,tipo:'ali',txt:'📜 Na história real: '+ev.txt+' Aceitar a aliança?'});else if(!emGuerra(a,b))S.prop.push({de:b,tipo:'hist',txt:'📜 Na história real: '+ev.txt+' Quer seguir a história e declarar guerra '+SIM.aNac(b)+'?'});continue}
  if(ev.t==='alianca')aliar(a,b,ev.txt);else{if(ev.t==='traicao')delete S.ali[K(a,b)];declararGuerra(a,b,ev.txt)}}
 if(d%30===15){ajudaAliados();ajudaInimigos();ameacaMensal()}
 for(const id in S.nac){const n=N(id);if(!n.vivo||id===S.jog)continue;if((d+n.vez)%5===0)iaTurno(id);if((d+n.vez*6)%30===0)iaDiplo(id)}
 for(let e=S.eraMundo+1;e<4;e++)if(d>=DIA_ERA[e]){eventoEra(e);break}
 if(d>=DIA_FIM&&SIM.onFim)SIM.onFim()}
SIM.rendaDia=id=>{let r=0,pe=.1,m=0;for(let i=0;i<NP;i++){const pr=S.prov[i];if(pr.d!==id)continue;r+=P[i].renda*(1+.5*pr.fab)*(SIM.nucleo(id,i)?1:.15);if(P[i].oil)pe+=.7;m+=pr.i*TIPOS.i.man+pr.b*TIPOS.b.man+pr.a*TIPOS.a.man}const tt=N(id)&&N(id).tier;if(tt)r*=1+TIERS[tt].renda;const cb=comB[id]||{din:0,pet:0};r+=cb.din;pe+=cb.pet;return {din:r-m,bruto:r,pet:pe,man:m,com:cb}};
SIM.passo=(dias)=>{if(!S)return;S.dia+=dias;while(S.ultDia<Math.floor(S.dia)){S.ultDia++;diario()}};
// ---------- ações
function pagar(n,c){if(n.din<c.din||n.pet<(c.pet||0))return false;n.din-=c.din;n.pet-=(c.pet||0);return true}
SIM.custoTropa=k=>TIPOS[k].custo;
SIM.recrutar=(p,k,q=1,id=S.jog)=>{const pr=S.prov[p];if(pr.d!==id)return 'Essa cidade não é sua.';const n=N(id);const c=TIPOS[k].custo;let feitos=0;for(let j=0;j<q;j++){if(!pagar(n,c))break;pr[k]++;feitos++}if(!feitos)return c.pet&&n.pet<c.pet?'Falta petróleo.':'Falta dinheiro.';if(id===S.jog)S.stats.rec+=feitos;return 'ok'};
SIM.colocarReforcos=(p)=>{const n=N(S.jog);const pr=S.prov[p];if(pr.d!==S.jog||n.ref<=0)return 0;const r=n.ref;pr.i+=r;n.ref=0;S.stats.ref=(S.stats.ref||0)+r;return r};
SIM.alcancaveis=(de,id=S.jog)=>{const dist=new Map([[de,0]]);const q=[de];while(q.length){const x=q.shift();for(const y of viz(x))if(S.prov[y].d===id&&!dist.has(y)){dist.set(y,dist.get(x)+1);q.push(y)}}dist.delete(de);return dist};
SIM.mover=(de,para,frac=1,id=S.jog)=>{if(de===para||S.prov[de].d!==id||S.prov[para].d!==id)return null;if(!viz(de).includes(para)&&!SIM.alcancaveis(de,id).has(para))return null;let t;if(typeof frac==='object'){const pr=S.prov[de];t={};for(const k of TK)t[k]=Math.max(0,Math.min(pr[k],frac[k]|0));if(SIM.total(pr)-(t.i+t.b+t.a)<1){if(t.i>0)t.i--;else if(t.b>0)t.b--;else if(t.a>0)t.a--}}else t=separar(de,frac);const tot=t.i+t.b+t.a;if(!tot)return null;for(const k of TK){S.prov[de][k]-=t[k];S.prov[para][k]+=t[k]}if(id===S.jog)S.stats.mov++;return t};
const PREDIOS2={fab:{n:'Fábrica',d:'+50% de dinheiro nesta cidade',c:l=>({din:220*(l+1),pet:0}),max:2},fort:{n:'Fortaleza',d:'+40% de defesa nesta cidade',c:l=>({din:140*(l+1),pet:0}),max:2}};SIM.PREDIOS=PREDIOS2;
SIM.construir=(p,k,id=S.jog)=>{const pr=S.prov[p];const B=PREDIOS2[k];if(pr.d!==id)return 'Essa cidade não é sua.';if(pr[k]>=B.max)return 'Nível máximo.';if(!pagar(N(id),B.c(pr[k])))return 'Falta dinheiro.';pr[k]++;if(id===S.jog)S.stats.cons++;return 'ok'};
// pesquisa: 3 melhorias por era + avançar de era
const PESQ=[];for(let e=0;e<4;e++){for(const k of TK)PESQ.push({id:k+e,era:e,k,nome:TIPOS[k].n[e]+' melhor',desc:'+20% de força para '+TIPOS[k].cat.toLowerCase(),custo:{din:[250,450,700,1000][e]*(k==='i'?1:k==='b'?1.3:1.5)|0,pet:k==='i'?0:[20,40,60,80][e]}})}
SIM.PESQ=PESQ;
SIM.custoEra=e=>({din:[900,1500,2200][e]||0,pet:[60,120,180][e]||0});
SIM.pesquisar=(id,nac=S.jog)=>{const n=N(nac);const pz=PESQ.find(x=>x.id===id);if(!pz||n.pq[id])return 'Já feito.';if(pz.era>n.era)return 'Precisa chegar a essa era.';if(!pagar(n,pz.custo))return pz.custo.pet&&n.pet<pz.custo.pet?'Falta petróleo.':'Falta dinheiro.';n.pq[id]=1;if(nac===S.jog)S.stats.pesq++;return 'ok'};
SIM.avancarEra=()=>{const e=S.eraMundo;if(e>=3)return 'Você já está na última era.';const n=N(S.jog);const feitos=TK.filter(k=>n.pq[k+e]).length;if(feitos<2)return 'Pesquise pelo menos 2 melhorias desta era.';if(!pagar(n,SIM.custoEra(e)))return 'Falta dinheiro ou petróleo.';S.dia=Math.max(S.dia,DIA_ERA[e+1]);S.ultDia=Math.floor(S.dia)-1;eventoEra(e+1);return 'ok'};
// ---------- ataque
SIM.fontesPara=(alvo,id=S.jog)=>viz(alvo).filter(q=>S.prov[q].d===id&&SIM.total(S.prov[q])>1);
const porMar=(f,alvo)=>!P[f].a.includes(alvo);SIM.porMar=porMar;
SIM.prepararAtaque=(fontes,alvo,frac=1,id=S.jog)=>{const env=[];let t={i:0,b:0,a:0};const ter=P[alvo].ter;let A=0,mar=false;for(const f of fontes){const s=separar(f,frac);if(s.i+s.b+s.a){env.push({p:f,t:s});for(const k of TK)t[k]+=s[k];const pm=porMar(f,alvo);if(pm)mar=true;A+=forcaDe(s,id,ter,true)*(pm?.6:1)}}
const D=defesa(alvo);return {id,fontes:env,alvo,t,A,D,mar,chance:chance(A,D),dono:S.prov[alvo].d}};
function perder(t,f){const o={i:0,b:0,a:0};for(const k of TK){let x=t[k]*f;x=Math.floor(x)+(rnd()<x%1?1:0);o[k]=Math.min(t[k],x)}return o}
SIM.executarAtaque=(pr)=>{const id=pr.id,alvo=pr.alvo,dono=S.prov[alvo].d;if(dono===id)return null;
 if(!emGuerra(id,dono))declararGuerra(id,dono,`${SIM.OoNac(id)} ${V(id,'ataca','atacam')} ${SIM.oNac(dono)} sem aviso: é guerra!`);
 let A=0;for(const f of pr.fontes)A+=forcaDe(f.t,id,P[alvo].ter,true)*(porMar(f.p,alvo)?.6:1);const D=defesa(alvo);const ch=chance(A,D);const vit=pr.garantido?true:rnd()<ch;
 for(const e of pr.fontes)for(const k of TK)S.prov[e.p][k]=Math.max(0,S.prov[e.p][k]-e.t[k]);
 const dt={i:S.prov[alvo].i,b:S.prov[alvo].b,a:S.prov[alvo].a};let pa,pd;
 if(vit){const f=Math.max(.06,Math.min(.75,.55*D/Math.max(A,.01)));pa=perder(pr.t,f);pd=dt;
  const sob={};for(const k of TK)sob[k]=pr.t[k]-pa[k];if(sob.i+sob.b+sob.a===0)sob.i=1;
  conquistar(alvo,id);for(const k of TK)S.prov[alvo][k]=sob[k]}
 else{const fa=Math.max(.35,Math.min(.92,.45+.5*(1-ch)));pa=perder(pr.t,fa);const fd=Math.max(.05,Math.min(.8,.5*A/Math.max(D,.01)));pd=perder(dt,fd);
  for(const k of TK)S.prov[alvo][k]-=pd[k];if(SIM.total(S.prov[alvo])===0)S.prov[alvo].i=1;
  const volta={};for(const k of TK)volta[k]=pr.t[k]-pa[k];const f0=pr.fontes[0];if(f0&&S.prov[f0.p].d===id)for(const k of TK)S.prov[f0.p][k]+=volta[k]}
 const r={id,dono,alvo,vit,chance:ch,A,D,env:pr.t,pa,pd,de:pr.fontes.map(f=>f.p)};
 if(id===S.jog){vit?S.stats.vit++:S.stats.der++}
 else if(N(S.jog)&&aliado(id,S.jog)&&emGuerra(dono,S.jog)){noticia(`🤝 Aliado: ${SIM.OoNac(id)} ${V(id,'atacou','atacaram')} ${P[alvo].n} (${SIM.oNac(dono)}) — ${vit?'e conquistou a cidade!':'mas foi repelido.'}`,vit?'aliado_vit':'aliado',[id,S.jog])}
 if(SIM.onBatalha)SIM.onBatalha(r);return r};
function conquistar(p,id){const pr=S.prov[p];const antigo=pr.d;if(id===S.jog&&S.dia>0)S.ameaca=Math.min(100,(S.ameaca||0)+(SIM.ehCapital(p)?7:2.2));pr.d=id;pr.fort=Math.max(0,pr.fort-1);pr.oc=SIM.nucleo(id,p)?0:1;for(const k of TK)pr[k]=0;
 if(id===S.jog)S.stats.conq++;if(antigo===S.jog)S.stats.perd++;
 const na=N(antigo);if(id===S.jog&&na&&na.cap===p)S.stats.caps=(S.stats.caps||0)+1;if(na&&na.cap===p){const resto=cidadesDe(antigo);if(resto.length){na.cap=resto.sort((a,b)=>P[b].pop-P[a].pop)[0];noticia(`${SIM.OoNac(id)} ${V(id,'toma','tomam')} ${P[p].n}, a capital ${SIM.deNac(antigo)}!`,'conquista',[id,antigo])}}
 if(na&&!cidadesDe(antigo).length){na.vivo=false;for(const k in S.guerra)if(k.split('|').includes(antigo))delete S.guerra[k];for(const k in S.ali)if(k.split('|').includes(antigo))delete S.ali[k];noticia(`${SIM.OoNac(antigo)} ${V(antigo,'foi','foram')} derrotad${({a:'a',as:'as',os:'os'})[artigo(antigo)]||'o'} e ${V(antigo,'deixou','deixaram')} de existir.`,'conquista',[id,antigo]);if(antigo===S.jog&&SIM.onDerrota)SIM.onDerrota()}
 if(SIM.onConquista)SIM.onConquista(p,id,antigo)}
SIM.conquistar=conquistar;
// ---------- diplomacia
function declararGuerra(a,b,txt,cadeia=true){if(a===b||emGuerra(a,b)||!N(a)||!N(b)||!N(a).vivo||!N(b).vivo)return;delete S.ali[K(a,b)];if(S.com[K(a,b)]){delete S.com[K(a,b)];noticia(`A guerra encerra o acordo comercial entre ${SIM.oNac(a)} e ${SIM.oNac(b)}.`,'info',[a,b])}S.guerra[K(a,b)]=1;S.inicioG[K(a,b)]={dia:S.dia,ca:cidadesDe(a).length,cb:cidadesDe(b).length};addRel(a,b,-60);
 noticia(txt||`${SIM.OoNac(a)} ${V(a,'declara','declaram')} guerra ${SIM.aNac(b)}!`,'guerra',[a,b]);if(SIM.onGuerra)SIM.onGuerra(a,b);
 if(cadeia&&a===S.jog){for(const id of aliadosDe(a)){if(id===b||emGuerra(id,b)||aliado(id,b))continue;const pp=PERSONAS[N(id).persona];const ch=.45+rel(id,a)/200+(pp.trai<.3?.15:0);if(rnd()<ch)aliadoEntra(id,b);else noticia(`${SIM.OoNac(id)} ${V(id,'preferiu','preferiram')} ficar fora da sua guerra contra ${SIM.oNac(b)}. Use "Pedir ajuda" na Diplomacia.`,'info',[id,a])}}
 if(cadeia&&b===S.jog){for(const id of aliadosDe(b)){if(id===a||emGuerra(id,a)||aliado(id,a))continue;const pp=PERSONAS[N(id).persona];if(rnd()<(pp.trai>1?.5:.92))aliadoEntra(id,a)}}
 if(cadeia){for(const id in S.nac){if(id===a||id===b||!N(id).vivo)continue;if(aliado(id,b)&&!aliado(id,a)&&!emGuerra(id,a)){if(id===S.jog){S.prop.push({de:b,tipo:'ajuda',inim:a,txt:`${SIM.OoNac(b)} (sua aliança) ${V(b,'foi atacado','foram atacados')}${artigo(b)==='a'?'a':''} por ${SIM.oNac(a)}. Entrar na guerra para defendê-la?`});continue}
  const near=N(id).cont===N(a).cont||vizinhosNac(id).includes(a);const pp=PERSONAS[N(id).persona];if(near&&rnd()<(pp.trai>1?.35:pp.trai>.5?.7:.95))declararGuerra(id,a,a===S.jog?`⚠️ ${SIM.OoNac(id)} ${V(id,'entrou','entraram')} na guerra CONTRA VOCÊ para defender ${SIM.oNac(b)}!`:`${SIM.OoNac(id)} ${V(id,'entra','entram')} na guerra para defender ${SIM.oNac(b)}.`,false)}}}}
function aliadoEntra(id,inim){declararGuerra(id,inim,`🤝 ${SIM.OoNac(id)} ${V(id,'entrou','entraram')} na guerra ao seu lado contra ${SIM.oNac(inim)}!`,false);S.ajudaDia=S.ajudaDia||{};S.ajudaDia[id]=S.dia}
SIM.pedirAjuda=(id)=>{const eu=S.jog;if(!aliado(id,eu))return {ok:false,txt:'Só aliados podem ajudar.'};const ws=guerrasDe(eu).filter(w=>!emGuerra(id,w)&&!aliado(id,w)&&N(w)&&N(w).vivo);if(!ws.length)return {ok:false,txt:guerrasDe(eu).length?`${SIM.OoNac(id)} já ${V(id,'está','estão')} lutando ao seu lado.`:'Você não está em guerra.'};
 S.pedido=S.pedido||{};if((S.pedido[id]||-999)>S.dia-45)return {ok:false,txt:`Você já pediu ajuda ${SIM.aNac(id)} há pouco tempo. Espere uns dias.`};S.pedido[id]=S.dia;
 const pp=PERSONAS[N(id).persona];const sc=rel(id,eu)/60+.45-(guerrasDe(id).length*.25)+(pp.trai<.3?.25:0)-(pp.trai>.6?.3:0)+(rnd()-.5)*.5;
 if(sc>0){for(const w of ws)aliadoEntra(id,w);return {ok:true,txt:`${SIM.OoNac(id)} ${V(id,'aceitou','aceitaram')} e ${V(id,'entrou','entraram')} na guerra ao seu lado!`}}addRel(id,eu,-3);return {ok:false,txt:`${SIM.OoNac(id)} ${V(id,'recusou','recusaram')} entrar na guerra agora. Melhore as relações (acordo comercial ajuda).`}};
SIM.precisaAjuda=id=>aliado(id,S.jog)&&guerrasDe(S.jog).some(w=>!emGuerra(id,w)&&!aliado(id,w));
// aliados mandam tropas para a fronteira do jogador
function ajudaAliados(){const eu=S.jog;if(!N(eu)||!N(eu).vivo)return;const ws=new Set(guerrasDe(eu));if(!ws.size)return;
 for(const id of aliadosDe(eu)){if(!guerrasDe(id).some(w=>ws.has(w)))continue;if(rnd()>.5)continue;const meus=cidadesDe(id);if(meus.length<3)continue;
  const front=cidadesDe(eu).filter(p=>viz(p).some(q=>ws.has(S.prov[q].d)&&emGuerra(id,S.prov[q].d)));if(!front.length)continue;front.sort((x,y)=>ameaca(y,eu)-ameaca(x,eu));
  const doador=meus.filter(p=>!viz(p).some(q=>emGuerra(id,S.prov[q].d))&&S.prov[p].i>3).sort((x,y)=>S.prov[y].i-S.prov[x].i)[0];if(doador==null)continue;
  const q=Math.max(1,Math.min(S.prov[doador].i-2,Math.round(1+Math.sqrt(meus.length)/2)));S.prov[doador].i-=q;const alvo=front[0];S.prov[alvo].i+=q;S.vol=S.vol||{};S.vol[alvo]=(S.vol[alvo]||0)+q;
  noticia(`🤝 ${SIM.OoNac(id)} ${V(id,'enviou','enviaram')} ${q} ${q>1?'tropas':'tropa'} para defender ${P[alvo].n}.`,'alianca',[id,eu]);if(SIM.onAjuda)SIM.onAjuda(id,alvo,q)}}
function ajudaInimigos(){const eu=S.jog;if(!N(eu)||!N(eu).vivo)return;const ws=guerrasDe(eu);
 for(const w of ws){for(const id of aliadosDe(w)){if(id===eu||!emGuerra(id,eu)||rnd()>.45)continue;const meus=cidadesDe(id);if(meus.length<3)continue;
  const front=cidadesDe(w).filter(p=>viz(p).some(q=>S.prov[q].d===eu));if(!front.length)continue;front.sort((x,y)=>ameaca(y,w)-ameaca(x,w));
  const doador=meus.filter(p=>!viz(p).some(q=>emGuerra(id,S.prov[q].d))&&S.prov[p].i>3).sort((x,y)=>S.prov[y].i-S.prov[x].i)[0];if(doador==null)continue;
  const q=Math.max(1,Math.min(S.prov[doador].i-2,Math.round(1+Math.sqrt(meus.length)/2)));S.prov[doador].i-=q;S.prov[front[0]].i+=q;
  noticia(`⚠️ ${SIM.OoNac(id)} ${V(id,'enviou','enviaram')} ${q} ${q>1?'tropas':'tropa'} para ajudar ${SIM.oNac(w)} em ${P[front[0]].n}.`,'guerra',[id,eu])}}}
function fazerPaz(a,b,txt){if(!emGuerra(a,b))return;delete S.guerra[K(a,b)];S.treg[K(a,b)]=S.dia+120;addRel(a,b,25);noticia(txt||`Paz assinada entre ${SIM.oNac(a)} e ${SIM.oNac(b)}.`,'paz',[a,b]);if(SIM.onPaz)SIM.onPaz(a,b)}
function aliar(a,b,txt){if(a===b||aliado(a,b)||emGuerra(a,b))return;S.ali[K(a,b)]=1;addRel(a,b,30);noticia(txt||`${SIM.OoNac(a)} e ${SIM.oNac(b)} formam uma aliança.`,'alianca',[a,b])}
SIM.declararGuerra=declararGuerra;SIM.fazerPaz=fazerPaz;SIM.aliar=aliar;
const guerrasDe=id=>Object.keys(S.guerra).filter(k=>k.split('|').includes(id)).map(k=>{const [x,y]=k.split('|');return x===id?y:x});SIM.guerrasDe=guerrasDe;
const aliadosDe=id=>Object.keys(S.ali).filter(k=>k.split('|').includes(id)).map(k=>{const [x,y]=k.split('|');return x===id?y:x}).filter(x=>N(x)&&N(x).vivo);SIM.aliadosDe=aliadosDe;
function perdendo(id,inim){const g=S.inicioG[K(id,inim)];if(!g)return 0;const c=cidadesDe(id).length;const c0=id<inim?g.ca:g.cb;return 1-c/Math.max(1,c0)}
SIM.propor=(tipo,id)=>{const eu=S.jog;const n=N(id);if(!n||!n.vivo)return {ok:false,txt:'Esse país não existe mais.'};
 if(tipo==='guerra'){if(aliado(eu,id))delete S.ali[K(eu,id)];declararGuerra(eu,id,`${SIM.OoNac(eu)} ${V(eu,'declara','declaram')} guerra ${SIM.aNac(id)}!`);return {ok:true,txt:'Guerra declarada!'}}
 if(tipo==='paz'){if(!emGuerra(eu,id))return {ok:false,txt:'Vocês não estão em guerra.'};const pp=PERSONAS[n.persona];const g=S.inicioG[K(eu,id)]||{dia:S.dia};const tempo=(S.dia-g.dia)/365;const sc=perdendo(id,eu)*2-perdendo(eu,id)+tempo*.25+pp.paz*.2-.35+rel(eu,id)/200;
  if(sc>0||rnd()<.1){fazerPaz(eu,id);return {ok:true,txt:`${SIM.OoNac(id)} ${V(id,'aceitou','aceitaram')} a paz!`}}addRel(eu,id,-3);return {ok:false,txt:`${SIM.OoNac(id)} ${V(id,'recusou','recusaram')} a paz. Conquiste mais cidades para forçar um acordo.`}}
 if(tipo==='alianca'){if(emGuerra(eu,id))return {ok:false,txt:'Faça a paz primeiro.'};if(aliado(eu,id))return {ok:false,txt:'Vocês já são aliados.'};const comum=guerrasDe(eu).some(x=>emGuerra(id,x));const sc=rel(eu,id)/40+(comum?1.2:0)+(n.persona==='leal'?.3:0)-(aliadosDe(id).length>=4?2:0)-Math.max(0,(S.ameaca||0)-30)/35-.6+(rnd()-.5)*.6;
  if(sc>0){aliar(eu,id);return {ok:true,txt:`${SIM.OoNac(id)} ${V(id,'aceitou','aceitaram')} a aliança!`}}addRel(eu,id,2);return {ok:false,txt:`${SIM.OoNac(id)} ${V(id,'recusou','recusaram')} a aliança por enquanto. Ter um inimigo em comum ajuda.`}}
 if(tipo==='comercio'){if(emGuerra(eu,id))return {ok:false,txt:'Faça a paz primeiro.'};if(temCom(eu,id))return {ok:false,txt:'Vocês já têm um acordo comercial.'};if(comerciosDe(eu).length>=6)return {ok:false,txt:'Você já tem 6 acordos comerciais (o máximo).'};const sc=rel(eu,id)/40+.55-Math.max(0,(S.ameaca||0)-30)/40+(aliado(eu,id)?.6:0)-(comerciosDe(id).length>=5?1.2:0)+(n.persona==='agressivo'?-.25:0)+(rnd()-.5)*.7;
  if(sc>0){fazerCom(eu,id);return {ok:true,txt:`${SIM.OoNac(id)} ${V(id,'aceitou','aceitaram')} o acordo comercial! +${SIM.valorComCom(eu,id)} de dinheiro por dia para os dois.`}}addRel(eu,id,1);return {ok:false,txt:`${SIM.OoNac(id)} ${V(id,'recusou','recusaram')} o acordo comercial. Melhore as relações e tente de novo.`}}
 if(tipo==='cancelarcom'){cancelarCom(eu,id);return {ok:true,txt:'Acordo comercial cancelado.'}}
 if(tipo==='romper'){delete S.ali[K(eu,id)];addRel(eu,id,-30);noticia(`${SIM.OoNac(eu)} ${V(eu,'rompe','rompem')} a aliança com ${SIM.oNac(id)}.`,'traicao',[eu,id]);return {ok:true,txt:'Aliança rompida.'}}};
SIM.responder=(pr,sim)=>{const eu=S.jog;S.prop=S.prop.filter(x=>x!==pr);if(!N(pr.de)||!N(pr.de).vivo)return;
 if(!sim){if(pr.tipo==='ali')addRel(eu,pr.de,-8);if(pr.tipo==='com')addRel(eu,pr.de,-4);if(pr.tipo==='ajuda'){addRel(eu,pr.de,-25);delete S.ali[K(eu,pr.de)];noticia(`${SIM.OoNac(eu)} ${V(eu,'abandona','abandonam')} ${SIM.oNac(pr.de)} na guerra. A aliança acabou.`,'traicao',[eu,pr.de])}return}
 if(pr.tipo==='paz')fazerPaz(eu,pr.de);else if(pr.tipo==='ali')aliar(eu,pr.de);else if(pr.tipo==='com')fazerCom(eu,pr.de);else if(pr.tipo==='hist')declararGuerra(eu,pr.de,pr.txt.replace('📜 Na história real: ','').split(' Quer')[0]);else if(pr.tipo==='ajuda')declararGuerra(eu,pr.inim,`${SIM.OoNac(eu)} ${V(eu,'entra','entram')} na guerra para defender ${SIM.oNac(pr.de)}.`,false)};
// ---------- revoltas
function revoltas(){for(let p=0;p<NP;p++){const pr=S.prov[p];if(!pr.oc||SIM.total(pr)>2)continue;let ch=.012*(S.eraMundo>=2?2:1);if(rnd()>ch)continue;
 const orig=donoInicial(P[p].c);let novo=(N(orig)&&N(orig).vivo&&orig!==pr.d)?orig:P[p].c;if(novo===pr.d)continue;const antigo=pr.d;
 if(!N(novo)){criarNacao(novo);N(novo).cap=p}const n=N(novo);if(!n.vivo){n.vivo=true;n.cap=p;n.era=S.eraMundo}
 pr.d=novo;pr.oc=0;pr.i=2+S.eraMundo;pr.b=0;pr.a=0;if(!emGuerra(novo,antigo)){S.guerra[K(novo,antigo)]=1;S.inicioG[K(novo,antigo)]={dia:S.dia,ca:1,cb:1}}
 noticia(`Revolta em ${P[p].n}! A cidade se liberta do domínio ${SIM.deNac(antigo)}.`,'revolta',[antigo]);if(SIM.onConquista)SIM.onConquista(p,novo,antigo)}}
function independencia(c,ps){const antigo=S.prov[ps[0]].d;if(!S.nac[c])criarNacao(c);const n=N(c);n.vivo=true;n.persona=n.persona||'defensivo';n.era=S.eraMundo;
 for(const p of ps){const pr=S.prov[p];pr.d=c;pr.oc=0;pr.i=Math.max(2,pr.i);}n.cap=ps.find(p=>P[p].cap)??ps.slice().sort((a,b)=>P[b].pop-P[a].pop)[0];n.din=200;
 if(SIM.onConquista)SIM.onConquista(ps[0],c,antigo)}
// ---------- eras
function eventoEra(e){S.eraMundo=e;for(const id in S.nac)S.nac[id].era=Math.max(S.nac[id].era,e);
 noticia(`${ERAS[e].nome.toUpperCase()}: ${ERAS[e].lema}`,'era');
 const vivos=Object.keys(S.nac).filter(id=>N(id).vivo&&cidadesDe(id).length);const rank=vivos.filter(x=>x!==S.jog).map(id=>({id,p:poder(id)})).sort((a,b)=>b.p-a.p);
 if(e===1){for(const k in S.guerra){const [a,b]=k.split('|');fazerPaz(a,b,`Fim da 1ª Guerra: ${SIM.oNac(a)} e ${SIM.oNac(b)} param de lutar.`)}
  for(const k in S.ali)if(rnd()<.6)delete S.ali[k];
  const agr=r=>['agressivo','expansionista','traicoeiro'].includes(N(r.id).persona)?3:1;const eixo=rank.slice(0,12).sort((a,b)=>agr(b)*b.p-agr(a)*a.p).slice(0,3).map(r=>r.id);
  const alis=rank.filter(r=>!eixo.includes(r.id)).slice(0,3).map(r=>r.id);
  for(const a of eixo)for(const b of eixo)if(a<b)aliar(a,b,`${SIM.OoNac(a)} e ${SIM.oNac(b)} assinam o Pacto do EIXO.`);
  for(const a of alis)for(const b of alis)if(a<b)aliar(a,b,`${SIM.OoNac(a)} e ${SIM.oNac(b)} se unem aos ALIADOS.`);
  for(const a of eixo){const vz=vizinhosNac(a).filter(v=>!eixo.includes(v)&&v!==S.jog).sort((x,y)=>poder(x)-poder(y));if(vz[0])declararGuerra(a,vz[0],`${SIM.OoNac(a)} ${V(a,'invade','invadem')} ${SIM.oNac(vz[0])}! A 2ª Guerra Mundial começou.`)}
  if(eixo[0]&&alis[0])declararGuerra(alis[0],eixo[0]);
  if(!eixo.includes(S.jog)&&!alis.includes(S.jog)){if(alis[0])S.prop.push({de:alis[0],tipo:'ali',txt:`Os ALIADOS (liderados por ${SIM.oNac(alis[0])}) convidam você para a aliança.`});if(eixo[0])S.prop.push({de:eixo[0],tipo:'ali',txt:`O EIXO (liderado por ${SIM.oNac(eixo[0])}) convida você para o pacto.`})}}
 if(e===2){for(const k in S.guerra){const [a,b]=k.split('|');fazerPaz(a,b,`Fim da guerra: ${SIM.oNac(a)} e ${SIM.oNac(b)} assinam a paz.`)}for(const k in S.ali)delete S.ali[k];
  const A=rank[0]&&rank[0].id,B=rank[1]&&rank[1].id;S.blocos={A,B};
  if(A&&B){noticia(`Cortina de Ferro: o mundo se divide entre o bloco ${SIM.deNac(A)} e o bloco ${SIM.deNac(B)}.`,'era');addRel(A,B,-60);
   for(const r of rank.slice(2,30)){if(rnd()<.55){const lider=rel(r.id,A)>=rel(r.id,B)?A:B;aliar(r.id,lider,`${SIM.OoNac(r.id)} ${V(r.id,'entra','entram')} no bloco ${SIM.deNac(lider)}.`)}}
   S.prop.push({de:A,tipo:'ali',txt:`O bloco ${SIM.deNac(A)} quer você do lado dele.`});S.prop.push({de:B,tipo:'ali',txt:`O bloco ${SIM.deNac(B)} quer você do lado dele.`})}
  const grupos={};P.forEach(p=>{const d=S.prov[p.id].d;if(SIM.nucleo(d,p.id)||p.c===d)return;const cn=N(d).cont;if(cn&&p.cont===cn&&!['GBR','FRA','PRT','ESP','NLD','BEL','ITA','DEU','JPN'].includes(d))return;(grupos[p.c]=grupos[p.c]||{d,ps:[]}).ps.push(p.id)});
  let nI=0;for(const c in grupos){const gr=grupos[c];if(gr.d===S.jog?rnd()<.35:rnd()<.6){independencia(c,gr.ps);nI++}}if(nI)noticia(`Onda de descolonização: ${nI} novos países declaram independência!`,'revolta')}
 if(e===3){for(const k in S.ali)if(rnd()<.5)delete S.ali[k];S.blocos=null;noticia('Nova ordem mundial: os blocos acabam e conflitos regionais explodem pelo mundo.','era');
  const agr=rank.filter(r=>['agressivo','expansionista','traicoeiro'].includes(N(r.id).persona)).slice(0,4);for(const r of agr){const vz=vizinhosNac(r.id).filter(v=>v!==S.jog&&poder(v)<r.p*.7);if(vz.length)declararGuerra(r.id,vz[(rnd()*vz.length)|0])}}
 if(SIM.onEra)SIM.onEra(e)}
SIM.eventoEra=eventoEra;SIM.eraVisual=()=>S?Math.min(3,S.eraMundo):0;
// ---------- IA
const LIM={agressivo:.7,expansionista:.73,traicoeiro:.75,oportunista:.77,leal:.8,defensivo:.84,pacifico:.88};
function ameaca(p,id){let a=0;for(const q of viz(p)){const o=S.prov[q].d;if(o!==id&&emGuerra(o,id))a+=SIM.forcaCidade(q)*(porMar(q,p)?.6:1)+1}return (a/Math.max(1,defesa(p)))*(SIM.nucleo(id,p)?1.6:1)*(p===N(id).cap?1.5:1)}
function colocarIA(id,r){const cs=cidadesDe(id);if(!cs.length)return;const l=cs.map(p=>({p,v:ameaca(p,id)})).sort((x,y)=>y.v-x.v);if(!l[0].v){S.prov[N(id).cap]&&S.prov[N(id).cap].d===id?S.prov[N(id).cap].i+=r:S.prov[cs[0]].i+=r;return}const a=Math.ceil(r*.6);S.prov[l[0].p].i+=a;if(r-a>0)S.prov[(l[1]||l[0]).p].i+=r-a}
function iaTurno(id){const n=N(id);const cs=cidadesDe(id);if(!cs.length)return;const inim=new Set(guerrasDe(id));
 const front=cs.filter(p=>viz(p).some(q=>inim.has(S.prov[q].d)));
 // recrutar
 let tent=0;const reserva=60+cs.length;const amea=front.map(p=>({p,v:ameaca(p,id)})).sort((x,y)=>y.v-x.v);while(n.din>reserva&&tent++<(inim.size?30:10)){const alvoP=amea.length?amea[Math.min(amea.length-1,(rnd()*rnd()*Math.min(4,amea.length))|0)].p:(rnd()<.6?n.cap:cs[(rnd()*cs.length)|0]);if(S.prov[alvoP].d!==id)break;let k='i';if(n.pet>40&&rnd()<.35)k=rnd()<.55?'b':'a';if(SIM.recrutar(alvoP,k,1,id)!=='ok'){if(SIM.recrutar(alvoP,'i',1,id)!=='ok')break}}
 // construir / pesquisar
 if(n.din>500&&rnd()<.15){const c=n.cap;if(S.prov[c].fab<2)SIM.construir(c,'fab',id)}
 if(front.length&&n.din>300&&rnd()<.08){const c=front[(rnd()*front.length)|0];if(S.prov[c].fort<2)SIM.construir(c,'fort',id)}
 if(n.din>600&&rnd()<.12){const op=PESQ.filter(z=>z.era<=n.era&&!n.pq[z.id]);if(op.length)SIM.pesquisar(op[(rnd()*op.length)|0].id,id)}
 // atacar
 if(inim.size){const aliadoJ=N(S.jog)&&aliado(id,S.jog);const lim=LIM[n.persona]||.62;let ataques=0;const ordem=front.slice().sort(()=>rnd()-.5);
  for(const p of ordem){if(ataques>=2)break;if(S.prov[p].d!==id||SIM.total(S.prov[p])<2)continue;let melhor=null,mc=0;
   for(const q of viz(p)){if(!inim.has(S.prov[q].d))continue;const pr=SIM.prepararAtaque([p],q,.7,id);const bon=(SIM.ehCapital(q)?.05:0)+(SIM.nucleo(id,q)?.06:0)+(aliadoJ&&emGuerra(S.prov[q].d,S.jog)?.12:0);if(pr.chance+bon>mc){mc=pr.chance+bon;melhor=pr}}
   if(melhor&&mc>lim+(S.eraMundo===0?.08:0)){SIM.executarAtaque(melhor);ataques++}}}
 // mover tropas do interior para a frente
 if(front.length||true){const alvoSet=new Set(front.length?front:cs.filter(p=>viz(p).some(q=>S.prov[q].d!==id&&!aliado(S.prov[q].d,id))));if(!alvoSet.size)return;
  const dist=new Map();const q=[...alvoSet];for(const p of q)dist.set(p,0);while(q.length){const x=q.shift();for(const y of viz(x))if(S.prov[y].d===id&&!dist.has(y)){dist.set(y,dist.get(x)+1);q.push(y)}}
  for(const p of cs){const d=dist.get(p);if(!d||SIM.total(S.prov[p])<3)continue;const prox=viz(p).find(y=>S.prov[y].d===id&&dist.get(y)===d-1);if(prox!=null)SIM.mover(p,prox,.8,id)}}}
function iaDiplo(id){const n=N(id);const pp=PERSONAS[n.persona]||PERSONAS.defensivo;const ws=guerrasDe(id);const meuP=poder(id);
 // paz
 for(const o of ws){const g=S.inicioG[K(id,o)]||{dia:S.dia};const anos=(S.dia-g.dia)/365;const ruim=perdendo(id,o);if(ruim>.3||(anos>2.5&&rnd()<.25*pp.paz)||(anos>1&&ruim>.15&&rnd()<.4)){
  if(o===S.jog){if(!S.prop.some(x=>x.de===id&&x.tipo==='paz'))S.prop.push({de:id,tipo:'paz',txt:ruim>.3?`${SIM.OoNac(id)} ${V(id,'está','estão')} perdendo e ${V(id,'pede','pedem')} PAZ. Aceitar?`:`${SIM.OoNac(id)} ${V(id,'propõe','propõem')} um tratado de paz. Aceitar?`})}
  else{const ruimO=perdendo(o,id);if(ruimO>-.2&&rnd()<.6)fazerPaz(id,o)}}}
 if(id===S.jog)return;
 if(SIM.podeProclamar(id)&&rnd()<.5)SIM.proclamar(id);
 // guerra
 if(ws.length<2&&cidadesDe(id).length>=4&&rnd()<.06*pp.guerra*(S.eraMundo===0&&S.dia<500?.3:1)){const vz=vizinhosNac(id).filter(v=>!aliado(v,id)&&!emGuerra(v,id)&&!(S.treg[K(id,v)]>S.dia));let alvo=null,ra=1e9;for(const v of vz){const r=poder(v)/Math.max(1,meuP);if(r<ra){ra=r;alvo=v}}
  if(alvo&&ra<.45){if(alvo===S.jog&&S.dia<365)return;declararGuerra(id,alvo,`${SIM.OoNac(id)} ${V(id,'declara','declaram')} guerra ${SIM.aNac(alvo)}!`)}}
 // aliança
 if(rnd()<.12&&aliadosDe(id).length<3){for(const v of vizinhosNac(id).concat(ws.flatMap(w=>guerrasDe(w)))){if(v===id||aliado(v,id)||emGuerra(v,id)||!N(v)||!N(v).vivo)continue;const comum=ws.some(w=>emGuerra(v,w));if(!comum||aliadosDe(v).length>=3)continue;
  if(v===S.jog){if(!S.prop.some(x=>x.de===id&&x.tipo==='ali'))S.prop.push({de:id,tipo:'ali',txt:`${SIM.OoNac(id)} ${V(id,'tem','têm')} um inimigo em comum com você e ${V(id,'propõe','propõem')} uma ALIANÇA.`});break}aliar(id,v);break}}
 // comércio: relações melhoram, IA propõe, fecha entre si e pode cancelar
 for(const o of comerciosDe(id))addRel(id,o,1);
 if(rnd()<.06&&comerciosDe(id).length<5){const cands=vizinhosNac(id).concat(aliadosDe(id)).filter(v=>v!==id&&N(v)&&N(v).vivo&&!emGuerra(v,id)&&!temCom(v,id)&&rel(id,v)>-15);const v=cands[(rnd()*cands.length)|0];
  if(v===S.jog){if(S.dia>60&&comerciosDe(S.jog).length<6&&!S.prop.some(x=>x.de===id&&x.tipo==='com'))S.prop.push({de:id,tipo:'com',txt:`💰 ${SIM.OoNac(id)} ${V(id,'propõe','propõem')} um ACORDO COMERCIAL: +${SIM.valorComCom(id,S.jog)} de dinheiro por dia para os dois. Aceitar?`})}
  else if(v&&comerciosDe(v).length<5)fazerCom(id,v,true)}
 if(temCom(id,S.jog)){const r=rel(id,S.jog);const inimAli=guerrasDe(S.jog).some(w=>aliado(w,id));
  if((r<-25&&rnd()<.35)||(inimAli&&rnd()<.3)||rnd()<.006)cancelarCom(id,S.jog,`💔 ${SIM.OoNac(id)} ${V(id,'cancelou','cancelaram')} o acordo comercial com você${inimAli?' porque você está em guerra com um aliado '+V(id,'dele','deles'):r<-25?': as relações estão ruins':''}.`)}
 // IA pode romper aliança com o jogador
 if(aliado(id,S.jog)){const r=rel(id,S.jog);const comum=guerrasDe(id).some(w=>emGuerra(S.jog,w));const fraco=poder(S.jog)<meuP*.35;
  let ch=0;if(r<-20)ch+=.3;if(!comum&&r<15)ch+=.03;if(fraco&&pp.trai>.25)ch+=.08*pp.trai*3;if(guerrasDe(S.jog).length>=3&&!comum)ch+=.05;
  if(rnd()<ch){delete S.ali[K(id,S.jog)];addRel(id,S.jog,-15);noticia(`💔 ${SIM.OoNac(id)} ${V(id,'rompeu','romperam')} a aliança com você${r<-20?': as relações azedaram':fraco?': '+V(id,'acha','acham')+' que você ficou fraco demais':' por falta de um inimigo em comum'}.`,'traicao',[id,S.jog])}}
 // traição
 if(pp.trai>.6&&rnd()<.03*pp.trai){const al=aliadosDe(id).filter(a=>a!==S.jog&&poder(a)<meuP*.5&&vizinhosNac(id).includes(a));if(al[0]){delete S.ali[K(id,al[0])];declararGuerra(id,al[0],`TRAIÇÃO! ${SIM.OoNac(id)} ${V(id,'rompe','rompem')} a aliança e ${V(id,'ataca','atacam')} ${SIM.oNac(al[0])}!`,false)}}}
SIM.iaTurno=iaTurno;
// ---------- salvar
SIM.exportar=()=>JSON.stringify(S);
SIM.carregar=txt=>{const o=JSON.parse(txt);if(!o||o.v!==20)return false;S=o;S.com=S.com||{};if(S.ameaca==null)S.ameaca=0;for(const id in S.nac)if(N(id).ini==null)N(id).ini=cidadesDe(id).length;return true};
})();
