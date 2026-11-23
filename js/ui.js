// Interface: telas, HUD, painéis, tutorial, cinemáticas, salvar
'use strict';
(function(){
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const SAVE='guerras_mundiais_save_v1';const VEL=[0,1.5,5,14];
let S=null,vel=1,rodando=false,pausadoUI=false,selExe=null,selProv=null,painelAtual=null,tutAtivo=false,lidas=0;
const P=SIM.P;
const fmt=n=>{n=Math.floor(n);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(n>=1e5?0:1)+'k':String(n)};
const band=(id,e)=>{const n=S&&S.nac[id];return `<span class="band">${ART.bandeira(id,e==null?(n?n.era:0):e,n?n.cor:'#888')}</span>`};
const icone=(k,s)=>ART.icone(k,s);
const custoHTML=(c,n)=>`<div class="custo">${Object.entries(c).map(([k,v])=>`<span class="${n&&n.res[k]<v?'falta':''}">${icone(k,12)}${fmt(v)}</span>`).join('')}</div>`;
function toast(txt,tipo='info',ms=3800){const t=document.createElement('div');t.className='toast '+tipo;t.innerHTML=txt;$('#toasts').prepend(t);const ts=$$('#toasts .toast');if(ts.length>2)ts.slice(2).forEach(x=>x.remove());setTimeout(()=>{t.style.transition='opacity .4s';t.style.opacity=0;setTimeout(()=>t.remove(),400)},ms)}
window.__toast=toast;
// ícones da nav
$$('#nav i').forEach(i=>i.innerHTML=ART.icone(i.dataset.ic,22));
// ---------- fundo do menu inicial
ART.carregar();const cv=$('#mapa');MAPA.init(cv);
let demo=true,demoPan=true;S=SIM.novo('BRA');S.jog='__demo';S.nac.__demo={id:'__demo',era:0,cor:'#888',res:{},pf:{}};SIM.calcVisao();S.visivel=new Uint8Array(SIM.NP).fill(1);MAPA.sujar();
MAPA.olhar(2200,560,Math.max(MAPA.zMin()*2.6,.45));
let ultimo=performance.now(),acHUD=0,acSheet=0,acSave=0,acFog=0;
function loop(t){const dt=Math.min(.1,(t-ultimo)/1000);ultimo=t;
 if(demo){if(demoPan)MAPA.cam.x+=dt*8/MAPA.cam.z}
 else if(rodando&&!pausadoUI&&vel>0&&!S.fim){const antes=S.dia;SIM.passo(dt*VEL[vel]);if(S.mudouDono){S.mudouDono=false;MAPA.sujar()}acFog+=dt;if(Math.floor(S.dia/3)!==Math.floor(antes/3))MAPA.sujarFog()}
 MAPA.desenhar(dt);
 if(!demo){acHUD+=dt;if(acHUD>.25){acHUD=0;hud()}acSheet+=dt;if(acSheet>.8){acSheet=0;atualizarSheet()}acSave+=dt;if(acSave>25){acSave=0;salvar()}}
 requestAnimationFrame(loop)}
requestAnimationFrame(loop);
$('.versao').textContent='Mapa real com '+SIM.NP+' províncias · '+Object.keys(S.nac).length+' nações em 1914';
// ---------- início
if(localStorage.getItem(SAVE))$('#btContinuar').classList.remove('oculto');
$('#btNovo').onclick=()=>abrirEscolha();
$('#btContinuar').onclick=()=>{try{const o=JSON.parse(localStorage.getItem(SAVE));SIM.carregar(o);S=SIM.get();iniciarJogo(false)}catch(e){console.error(e);toast('Não foi possível carregar o jogo salvo.','guerra')}};
$('#btComo').onclick=()=>comoJogar();
function comoJogar(){modal(`<h3>Como jogar</h3>
<p><b>🎯 Objetivo:</b> comece em 1914 e leve seu país por todas as guerras — 1ª Guerra, 2ª Guerra, Guerra Fria e Guerra Moderna — até 2030. Conquiste, sobreviva e fique no topo do ranking.</p>
<p><b>🗺️ Mapa:</b> arraste para mover, use dois dedos (ou a rodinha) para dar zoom.</p>
<p><b>🪖 Exércitos:</b> toque num exército seu e depois toque no destino. Se entrar em território inimigo, ele luta e conquista a província.</p>
<p><b>🏭 Províncias:</b> toque numa província sua para construir (quartel, fábrica, porto, aeródromo, ferrovia, fortificação) e recrutar tropas.</p>
<p><b>🔬 Pesquisa:</b> libera aviões, submarinos, tanques melhores e permite pular para a próxima era antes do calendário.</p>
<p><b>🤝 Diplomacia:</b> alianças, paz, comércio, visão compartilhada ou guerra. Cuidado: tem país traiçoeiro!</p>
<p><b>⏩ Tempo:</b> use ❚❚ ▶ ▶▶ ▶▶▶ no topo. As eras mudam com o calendário (1939, 1947, 1991) ou antes, pela pesquisa.</p>
<div class="acoes" style="grid-template-columns:1fr"><button class="prim" data-fechar>Entendi</button></div>`)}
// ---------- escolha de nação
const MAIORES=['DEU','GBR','FRA','RUS','AUT','TUR','ITA','USA','JPN','BRA','CHN','ESP','SRB','ARG','PRT','NLD','MEX','SWE','IRN','ETH'];
const DESAFIO={DEU:3,GBR:2,FRA:2,RUS:2,AUT:4,TUR:4,ITA:3,USA:1,JPN:2,BRA:1,CHN:3,ESP:2,SRB:5,ARG:1,PRT:3,NLD:3,MEX:2,SWE:1,IRN:3,ETH:4};
let escolhido=null,dific=1,mostrarTodos=false;
function abrirEscolha(){$('#inicio').classList.add('oculto');const el=$('#escolha');el.classList.remove('oculto');renderEscolha()}
function renderEscolha(){const el=$('#escolha');const cont={};S.prov.forEach(p=>cont[p.d]=(cont[p.d]||0)+1);
 const ids=mostrarTodos?Object.keys(S.nac).filter(i=>i!=='__demo'&&cont[i]).sort((a,b)=>SIM.nomeNac(a).localeCompare(SIM.nomeNac(b))):MAIORES.filter(i=>S.nac[i]);
 const exs=id=>S.exs.filter(a=>a.dono===id).reduce((s,a)=>s+a.units.length,0);
 el.innerHTML=`<div class="esc-top"><h2>ESCOLHA SUA NAÇÃO</h2><p>28 de julho de 1914. O mundo está prestes a explodir.</p></div>
 <div class="esc-lista"><div class="abas"><button class="${!mostrarTodos?'on':''}" data-t="0">Grandes nações</button><button class="${mostrarTodos?'on':''}" data-t="1">Todos os países (${Object.keys(cont).length})</button></div>
 <div class="cards">${ids.map(id=>{const n=S.nac[id];const d=DESAFIO[id]||3;return `<button class="ncard ${escolhido===id?'on':''}" data-n="${id}">${band(id,0)}<b>${SIM.nomeNac(id)}</b><small>${cont[id]||0} províncias · ${exs(id)} tropas</small><small>IA: ${PERSONAS[n.persona].n}</small><span class="estrelas">${'★'.repeat(d)}${'☆'.repeat(5-d)}</span></button>`}).join('')}</div></div>
 <div class="esc-rodape"><div class="dific">${['Fácil','Normal','Difícil'].map((t,i)=>`<button class="${dific===i?'on':''}" data-d="${i}">${t}</button>`).join('')}</div>
 <div class="acoes" style="grid-template-columns:1fr 2fr;margin:0"><button data-voltar>Voltar</button><button class="prim" data-comecar ${escolhido?'':'disabled'}>${escolhido?'Começar com '+SIM.nomeNac(escolhido):'Toque numa nação'}</button></div></div>`;
 el.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{escolhido=b.dataset.n;const c=P[S.nac[escolhido].cap];MAPA.voar(c.x,c.y+60/Math.max(.6,MAPA.cam.z),Math.max(.9,MAPA.cam.z),.9);MAPA.selProv=S.nac[escolhido].cap;demoPan=false;renderEscolha()});
 el.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{mostrarTodos=b.dataset.t==='1';renderEscolha()});
 el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{dific=+b.dataset.d;renderEscolha()});
 el.querySelector('[data-voltar]').onclick=()=>{el.classList.add('oculto');$('#inicio').classList.remove('oculto');demoPan=true;MAPA.selProv=null};
 el.querySelector('[data-comecar]').onclick=()=>{if(!escolhido)return;SIM.novo(escolhido);S=SIM.get();S.dific=dific;MAPA.selProv=null;iniciarJogo(true)}}
// ---------- iniciar
function iniciarJogo(novo){demo=false;S=SIM.get();$('#inicio').classList.add('oculto');$('#escolha').classList.add('oculto');['#hud','#nav','#botoesMapa'].forEach(s=>$(s).classList.remove('oculto'));
 MAPA.sujar();SIM.calcVisao();const c=P[S.nac[S.jog].cap];MAPA.olhar(c.x,c.y,P[S.nac[S.jog].cap].cont==='Europe'?2.4:1.4);hud();rodando=true;setVel(novo?0:1);lidas=S.news.length;
 if(novo){cinematica(0,()=>{if(!localStorage.getItem('guerras_tut_ok'))tutorial();else setVel(1)})}salvar()}
// ---------- HUD
function setVel(v){vel=v;$$('#vel button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v))}
$$('#vel button').forEach(b=>b.onclick=()=>setVel(+b.dataset.v));
$('#zMais').onclick=()=>MAPA.zoom(1.6);$('#zMenos').onclick=()=>MAPA.zoom(1/1.6);
$('#zCasa').onclick=()=>{const c=P[S.nac[S.jog].cap];MAPA.voar(c.x,c.y,Math.max(1.1,MAPA.cam.z))};
$('#hudNac').onclick=()=>abrirPainel('diplo');
function hud(){const n=S.nac[S.jog];if(!n)return;const e=Math.min(3,n.era);document.documentElement.style.setProperty('--ac',TEMAS[e].acento);document.documentElement.style.setProperty('--ac2',['#f3d98a','#e4d9a2','#a8ecff','#a6ffe6'][e]);
 $('#hudBand').innerHTML=ART.bandeira(S.jog,e,n.cor);$('#hudNome').textContent=SIM.nomeNac(S.jog);$('#hudEra').textContent=ERAS[e].curto+(e>S.eraMundo?' ★':'');
 $('#hudData').textContent=SIM.dataTxt(S.dia);const prox=SIM.DIA_ERA[S.eraMundo+1];$('#hudAno').textContent=prox?`${ERAS[S.eraMundo+1].curto} em ${Math.max(0,SIM.ano(prox)-SIM.ano(S.dia))} anos`:'até 2030';
 const g=n.ganho||{};const m=n.manut||{};
 $('#recursos').innerHTML=RECURSOS.map(([k])=>{const liq=(g[k]||0)-(m[k]||0);return `<div class="rc">${icone(k,16)}<b>${fmt(n.res[k])}</b><small class="${liq<0?'neg':''}">${liq>=0?'+':''}${Math.round(liq)}</small></div>`}).join('');
 const np=S.prop.length;$('#bDiplo').textContent=np;$('#bDiplo').classList.toggle('oculto',!np);const nn=S.news.length-lidas;$('#bNews').textContent=nn>99?'99+':nn;$('#bNews').classList.toggle('oculto',nn<=0||painelAtual==='noticias');
 if(painelAtual&&painelAtual!=='noticias'&&painelAtual!=='menu'&&Math.random()<.25)renderPainel(true)}
// ---------- callbacks da simulação
SIM.onNoticia=n=>{if(demo)return;toast(n.txt,n.tipo)};
SIM.onEra=e=>{if(demo)return;MAPA.sujar();cinematica(e)};
SIM.onConquista=(p,novo,velho)=>{if(demo)return;const n=S.nac[novo];MAPA.onda(P[p].x,P[p].y,MAPA.corEra(n.cor,3));if(novo===S.jog){toast(`🚩 Conquistamos <b>${P[p].n}</b>!`,'paz',2500)}};
SIM.onAtaque=(node,dono,dmg)=>{const x=SIM.nx(node),y=SIM.ny(node);if(S.visivel&&(node>=SIM.NP||S.visivel[node]))for(let i=0;i<4;i++)setTimeout(()=>MAPA.explosao(x+(Math.random()-.5)*14,y+(Math.random()-.5)*10,2),i*120)};
SIM.onLancar=m=>{if(demo)return;const vis=m.dono===S.jog||(m.alvo<SIM.NP&&S.visivel[m.alvo])||(m.de<SIM.NP&&S.visivel[m.de]);if(vis)MAPA.missil(SIM.nx(m.de),SIM.ny(m.de),SIM.nx(m.alvo),SIM.ny(m.alvo),m.dur/VEL[Math.max(1,vel)]);if(m.alvo<SIM.NP&&S.prov[m.alvo].d===S.jog)toast('🚀 Míssil inimigo a caminho de '+P[m.alvo].n+'!','guerra')};
SIM.onMissil=m=>{const x=SIM.nx(m.alvo),y=SIM.ny(m.alvo);MAPA.explosao(x,y,4);setTimeout(()=>MAPA.explosao(x+5,y-3,3),150);MAPA.onda(x,y,'#ffb347')};
SIM.onGuerra=(a,b)=>{if(demo)return;if(a===S.jog||b===S.jog){const o=a===S.jog?b:a;toast(`⚔️ GUERRA contra <b>${SIM.nomeNac(o)}</b>!`,'guerra',5000)}};
SIM.onDerrota=()=>{rodando=false;modal(`<h3>Derrota</h3><p>${SIM.nomeNac(S.jog)} foi completamente conquistado(a) em ${SIM.dataTxt(S.dia)}.</p><p>A história continua sem você… quer tentar de novo?</p><div class="acoes" style="grid-template-columns:1fr"><button class="prim" onclick="localStorage.removeItem('${SAVE}');location.reload()">Nova campanha</button></div>`)};
SIM.onFim=()=>{setVel(0);modal(`<h3>2030 — Fim da campanha</h3><p>Você atravessou todas as guerras do século!</p>${rankingHTML()}<div class="acoes" style="grid-template-columns:1fr 1fr"><button data-fechar>Continuar jogando</button><button class="prim" onclick="localStorage.removeItem('${SAVE}');location.reload()">Nova campanha</button></div>`)};
// ---------- toque no mapa
const meus=ids=>ids.map(i=>S.exs.find(a=>a.id===i)).filter(Boolean);
MAPA.onTapExe=(ids,sx,sy)=>{if(demo)return;const l=meus(ids);if(!l.length)return;
 if(MAPA.cam.z<.9&&l.length>1){const a=l[0];MAPA.voar(a.x,a.y,1.3,.5);return}
 const a=l[0];const sel=selExe&&S.exs.find(x=>x.id===selExe);
 if(sel&&sel.dono===S.jog&&a.dono!==S.jog){ordenar(sel,a.node);return}
 if(a.dono===S.jog&&sel&&sel.id===a.id){desselecionar();return}
 selecionarExe(a.id)};
MAPA.onTapProv=p=>{if(demo){return}const sel=selExe&&S.exs.find(x=>x.id===selExe);if(sel&&sel.dono===S.jog){ordenar(sel,p);return}abrirProv(p)};
MAPA.onTapMar=(node)=>{if(demo)return;const sel=selExe&&S.exs.find(x=>x.id===selExe);if(sel&&sel.dono===S.jog&&node>=0&&!SIM.ehAereo(sel)){ordenar(sel,node);return}fecharSheet()};
function ordenar(a,node){if(a.units.every(u=>u.t==='mis')){if(node>=SIM.NP){toast('Escolha uma província como alvo.');return}const r=SIM.lancarMissil(a,node);if(r==='ok'){toast('🚀 Míssil lançado contra '+P[node].n+'!','guerra');if(!S.exs.includes(a))desselecionar()}else toast(r==='fora'?'Alvo fora do alcance do míssil.':'Sem mísseis.');return}
 if(SIM.ehAereo(a)){if(node>=SIM.NP){toast('Escolha uma província.');return}const pr=S.prov[node];if(pr.d===S.jog||SIM.aliado(pr.d,S.jog)){const r=SIM.reposicionar(a,node);toast(r==='ok'?'✈️ Esquadrão voando para '+P[node].n:r==='base'?'Precisa de um Aeródromo lá.':'Muito longe para este avião.');return}
  const temIni=S.exs.some(b=>b.node===node&&SIM.emGuerra(b.dono,S.jog));if(!SIM.emGuerra(pr.d,S.jog)&&!temIni){toast('Você não está em guerra com '+SIM.nomeNac(pr.d)+'.');return}
  const r=SIM.ataqueAereo(a,node);toast(r==='ok'?'💥 Ataque aéreo a caminho de '+P[node].n+'!':'Alvo fora do alcance ('+Math.round(SIM.alcance(a))+' km).',r==='ok'?'guerra':'info');return}
 if(node<SIM.NP){const o=S.prov[node].d;if(o!==S.jog&&!SIM.aliado(o,S.jog)&&!SIM.emGuerra(o,S.jog)){modal(`<h3>Território neutro</h3><p>${P[node].n} pertence a <b>${SIM.nomeNac(o)}</b>. Para entrar, você precisa declarar guerra.</p><div class="acoes" style="grid-template-columns:1fr 1fr"><button data-fechar>Cancelar</button><button class="perigo" id="mGuerra">Declarar guerra</button></div>`);$('#mGuerra').onclick=()=>{SIM.propor('guerra',o);fecharModal();MAPA.sujar();ordenar(a,node)};return}}
 const p=SIM.mover(a,node);if(!p){toast('Não há caminho até lá.');return}if(!p.length)return;const d=SIM.tempoCaminho(a,p);MAPA.preview={node};setTimeout(()=>{if(MAPA.preview&&MAPA.preview.node===node)MAPA.preview=null},1500);
 toast(`🪖 Marchando para <b>${SIM.nomeNo(node)}</b> · ${Math.max(1,Math.round(d))} dia(s)${p.some(n=>n>=SIM.NP)&&!SIM.ehNaval(a)?' (por mar)':''}`,'info',2200);atualizarSheet(true)}
function selecionarExe(id){selExe=id;MAPA.sel=id;selProv=null;MAPA.selProv=null;const a=S.exs.find(x=>x.id===id);if(!a)return;abrirExe();const [,sy]=MAPA.W2S(a.x,a.y);if(sy>innerHeight*.5||sy<110){const z=MAPA.cam.z;MAPA.voar(a.x,a.y+(innerHeight*.5-innerHeight*.33)/z,z,.45)}if(a.dono===S.jog){const aer=SIM.ehAereo(a),mis=a.units.every(u=>u.t==='mis');dica(mis?'🎯 Toque no alvo do míssil':aer?'🎯 Toque no alvo do ataque aéreo':'👉 Toque no destino no mapa')}}
function desselecionar(){selExe=null;MAPA.sel=null;dica(null);fecharSheet()}
function dica(t){const d=$('#dica');if(!t){d.classList.add('oculto');return}d.textContent=t;d.classList.remove('oculto');posDica()}
function posDica(){const d=$('#dica'),sh=$('#sheet');if(d.classList.contains('oculto'))return;const r=sh.classList.contains('oculto')?null:sh.getBoundingClientRect();d.style.bottom=r?(innerHeight-r.top+8)+'px':''}
setInterval(posDica,300);
// ---------- folha: província
function abrirProv(p){selProv=p;selExe=null;MAPA.sel=null;MAPA.selProv=p;dica(null);fecharPainel();const sh=$('#sheet');sh.classList.remove('oculto','compacta');sh.dataset.t='prov';renderProv();sh.scrollTop=0}
function abrirExe(){fecharPainel();const sh=$('#sheet');sh.classList.remove('oculto');sh.classList.add('compacta');sh.dataset.t='exe';renderExe();sh.scrollTop=0}
function fecharSheet(){$('#sheet').classList.add('oculto');selProv=null;MAPA.selProv=null;if(!selExe){MAPA.sel=null;dica(null)}}
function atualizarSheet(forca){const sh=$('#sheet');if(sh.classList.contains('oculto'))return;if(document.activeElement&&sh.contains(document.activeElement)&&!forca){}
 const st=sh.scrollTop;const rs=[...sh.querySelectorAll('.recr')].map(r=>r.scrollLeft);if(sh.dataset.t==='prov')renderProv();else renderExe();sh.scrollTop=st;sh.querySelectorAll('.recr').forEach((r,i)=>r.scrollLeft=rs[i]||0)}
function statusRel(o){if(o===S.jog)return '<span class="chip meu">Sua</span>';if(SIM.emGuerra(o,S.jog))return '<span class="chip guerra">Em guerra</span>';if(SIM.aliado(o,S.jog))return '<span class="chip ali">Aliada</span>';return '<span class="chip">Neutra</span>'}
function renderProv(){const p=selProv;if(p==null)return;const pr=S.prov[p];const pp=P[p];const o=pr.d;const n=S.nac[o];const meu=o===S.jog;const vis=S.visivel[p];const e=Math.min(3,S.nac[S.jog].era);
 const prod=SIM.producao(p);const nucleo=SIM.nucleo(o,p);
 let h=`<div class="cab">${band(o)}<div><h3>${pp.n}${n.cap===p?' ★':''}</h3><div class="sub">${SIM.nomeNac(o)}${nucleo?'':' · território ocupado'}</div></div><button class="x" data-fechar-sheet>✕</button></div>
 <div class="chips">${statusRel(o)}<span class="chip">${TERRENOS[pp.ter].n}</span><span class="chip">👥 ${fmt(pp.pop*1000)}</span>${pp.costa?'<span class="chip">⚓ Litoral</span>':''}${pr.cerco>0?`<span class="chip guerra">Cerco ${Math.round(pr.cerco/SIM.precCerco(p)*100)}%</span>`:''}</div>
 <div style="display:flex;align-items:center;gap:8px;font-size:12px"><span style="width:54px;color:var(--mut)">Moral</span><div class="barra" style="flex:1"><i style="width:${pr.m}%;${pr.m<35?'background:#ff4d4d':''}"></i></div><b>${Math.round(pr.m)}%</b></div>
 <div class="sec">Produção por dia</div><div class="chips">${Object.entries(prod).map(([k,v])=>`<span class="chip">${icone(k,14)} +${v.toFixed(1)}</span>`).join('')}</div>`;
 if(meu){h+=`<div class="sec">Construções</div><div class="grade">${Object.keys(PREDIOS).map(k=>{const D=PREDIOS[k];const lv=pr.b[k];const naFila=pr.f.find(f=>f.t==='b'&&f.k===k);const c=SIM.custoPredio(p,k);const max=lv>=D.max;const porto=k==='por'&&!pp.costa;
   return `<div class="pred"><b>${D.n}</b><div class="nv">${lv}<small style="font-size:11px;color:var(--mut)">/${D.max}</small></div>${max?'<small style="color:var(--grn)">Máximo</small>':porto?'<small>Sem litoral</small>':naFila?`<div class="barra" style="margin-top:8px"><i style="width:${(1-naFila.rest/naFila.tot)*100}%"></i></div><small>${Math.ceil(naFila.rest)} dias</small>`:`${custoHTML(c,S.nac[S.jog])}<button data-cons="${k}" ${SIM.pode(S.nac[S.jog],c)?'':'disabled'}>Construir</button>`}</div>`}).join('')}</div>`;
  h+=`<div class="sec">Recrutar tropas</div><div class="recr">${ORDEM_UNID.map(t=>{const U=UNIDADES[t];const r=SIM.podeRecrutar(p,t);if(r.e===undefined&&r.motivo==='Pesquise primeiro'){const e0=Math.max(U.era0,0);if(!U.nomes[Math.max(e0,Math.min(3,S.nac[S.jog].era))])return '';}
   const eu=r.e!=null&&r.e>=0?r.e:Math.max(U.era0,Math.min(3,S.nac[S.jog].era));if(!U.nomes[eu])return '';const c=r.c||SIM.custo(U.custo,eu);
   return `<div class="uc"><div class="art">${ART.svg(t,eu)}</div><b>${U.nomes[eu]}</b><div class="st">${Math.round(U.dias*(1+eu*.15))} dias</div>${custoHTML(c,S.nac[S.jog])}<button data-rec="${t}" ${r.ok?'':'disabled'}>${r.ok?'Recrutar':r.motivo}</button></div>`}).join('')}</div>`;
  if(pr.f.length)h+=`<div class="sec">Fila de produção</div>${pr.f.map((f,i)=>`<div class="fila">${f.t==='u'?`<span style="width:40px;height:26px;display:inline-block">${ART.svg(f.u,f.e)}</span>${UNIDADES[f.u].nomes[f.e]}`:'🏗️ '+PREDIOS[f.k].n}<div class="barra"><i style="width:${i===0?(1-f.rest/f.tot)*100:0}%"></i></div><small>${Math.ceil(f.rest)}d</small><button class="x" data-canc="${i}">✕</button></div>`).join('')}`}
 else if(vis){const ex=S.exs.filter(a=>a.node===p&&SIM.exeVisivel(a));h+=`<div class="sec">Tropas vistas aqui</div>${ex.length?ex.map(linhaExe).join(''):'<p style="color:var(--mut);font-size:12px">Nenhuma tropa visível.</p>'}`;
  h+=`<div class="sec">Construções</div><div class="chips">${Object.keys(PREDIOS).filter(k=>pr.b[k]).map(k=>`<span class="chip">${PREDIOS[k].n} ${pr.b[k]}</span>`).join('')||'<small style="color:var(--mut)">Nenhuma</small>'}</div>`}
 else h+=`<p style="color:var(--mut);font-size:12px;margin-top:10px">🌫️ Região fora da sua visão. Envie tropas para perto ou faça "visão compartilhada" na diplomacia.</p>`;
 if(!meu)h+=`<div class="acoes" style="grid-template-columns:1fr"><button data-diplo="${o}">Diplomacia com ${SIM.nomeNac(o)}</button></div>`;
 const aqui=S.exs.filter(a=>a.node===p&&a.dono===S.jog);if(meu&&aqui.length)h+=`<div class="sec">Seus exércitos aqui</div>${aqui.map(linhaExe).join('')}`;
 $('#sheetC').innerHTML=h;ligarSheet()}
function grupos(a){const g={};for(const u of a.units){const k=u.t+u.e;(g[k]=g[k]||{t:u.t,e:u.e,n:0,hp:0,hpm:0}).n++;g[k].hp+=u.hp;g[k].hpm+=SIM.hpMax(u)}return Object.values(g)}
function nomeExe(a){const t=grupos(a).sort((x,y)=>y.n-x.n)[0];if(!t)return 'Exército';const U=UNIDADES[t.t];return SIM.ehNaval(a)?'Frota':SIM.ehAereo(a)?'Esquadrilha':a.units.every(u=>u.t==='mis')?'Bateria de mísseis':'Exército'}
function statusExe(a){if(a.missao)return a.missao.tipo==='ataque'?'✈️ Em missão de ataque':'✈️ Voando';if(S.batalhas.has(a.node))return '⚔️ Em combate';if(a.path.length){const d=SIM.tempoCaminho(a,a.path)*(1-0);return `➡️ Indo para ${SIM.nomeNo(a.path[a.path.length-1])} · ${Math.max(1,Math.round(d))}d`}const pr=a.node<SIM.NP?S.prov[a.node]:null;if(pr&&pr.cd===a.dono&&pr.cerco>0)return '🚩 Conquistando…';return '⏸ Parado em '+SIM.nomeNo(a.node)}
function linhaExe(a){const t=grupos(a).sort((x,y)=>y.n-x.n)[0];return `<button class="linha" data-exe="${a.id}"><span class="art">${ART.svg(t.t,t.e)}</span><span class="meio"><b>${nomeExe(a)} · ${a.units.length} unid.</b><small>${a.dono===S.jog?statusExe(a):SIM.nomeNac(a.dono)}</small></span><span class="dir">${Math.round(SIM.forca(a))}<br><small style="color:var(--mut);font-weight:600">força</small></span></button>`}
function renderExe(){const a=S.exs.find(x=>x.id===selExe);if(!a){desselecionar();return}const meu=a.dono===S.jog;const gs=grupos(a);const top=gs.sort((x,y)=>y.n-x.n)[0];
 let h=`<div class="cab"><span style="width:64px;height:40px;flex:none">${ART.svg(top.t,top.e)}</span><div><h3>${nomeExe(a)} · ${a.units.length}</h3><div class="sub">${band(a.dono).replace('class="band"','class="band" style="width:20px;height:13px;vertical-align:-2px"')} ${SIM.nomeNac(a.dono)} · força ${Math.round(SIM.forca(a))}</div></div><button class="x" data-desel>✕</button></div>
 <div class="chips"><span class="chip ${S.batalhas.has(a.node)?'guerra':''}">${meu?statusExe(a):SIM.nomeNo(a.node)}</span>${SIM.ehAereo(a)?`<span class="chip">Alcance ${Math.round(SIM.alcance(a))} km</span>`:''}</div>
 ${gs.map(g=>`<div class="linha" style="padding:5px 8px"><span class="art">${ART.svg(g.t,g.e)}</span><span class="meio"><b>${UNIDADES[g.t].nomes[g.e]} ×${g.n}</b><div class="barra" style="margin-top:4px"><i style="width:${g.hp/g.hpm*100}%;background:${g.hp/g.hpm>.6?'#5be37a':g.hp/g.hpm>.3?'#ffc93c':'#ff4d4d'}"></i></div></span><span class="dir" style="font-size:11px;color:var(--mut)">${ERAS[g.e].curto}</span></div>`).join('')}`;
 if(meu){const outros=S.exs.filter(b=>b!==a&&b.dono===S.jog&&b.node===a.node&&!b.missao&&SIM.ehAereo(b)===SIM.ehAereo(a));const mod=SIM.custoModernizar(a);const temMod=Object.keys(mod).length>0;
  h+=`<div class="acoes"><button data-a="parar" ${a.path.length?'':'disabled'}>Parar</button><button data-a="dividir" ${a.units.length>1?'':'disabled'}>Dividir</button><button data-a="juntar" ${outros.length?'':'disabled'}>Juntar (${outros.length})</button></div>`;
  if(temMod)h+=`<div class="acoes" style="grid-template-columns:1fr"><button class="prim" data-a="modernizar">Modernizar tropas antigas ${custoHTML(mod,S.nac[S.jog]).replace('class="custo"','class="custo" style="color:#1a1206"')}</button></div>`;
  const prs=a.node<SIM.NP?S.exs.filter(b=>b.node===a.node&&b.dono===S.jog&&b!==a):[];if(prs.length)h+=`<div class="sec">Outros aqui</div>${prs.map(linhaExe).join('')}`}
 $('#sheetC').innerHTML=h;ligarSheet()}
function ligarSheet(){const c=$('#sheetC');
 c.querySelectorAll('[data-fechar-sheet]').forEach(b=>b.onclick=fecharSheet);c.querySelectorAll('[data-desel]').forEach(b=>b.onclick=desselecionar);
 c.querySelectorAll('[data-cons]').forEach(b=>b.onclick=()=>{const r=SIM.construir(selProv,b.dataset.cons);if(r!=='ok')toast(r==='rec'?'Recursos insuficientes.':r==='fila'?'Já está em construção.':'Nível máximo.');renderProv()});
 c.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>{const r=SIM.recrutar(selProv,b.dataset.rec);if(r!=='ok')toast(r);else toast('Recrutamento iniciado: '+UNIDADES[b.dataset.rec].nomes[SIM.eraUnid(S.jog,b.dataset.rec)],'info',1500);atualizarSheet(true)});
 c.querySelectorAll('[data-canc]').forEach(b=>b.onclick=()=>{SIM.cancelarFila(selProv,+b.dataset.canc);renderProv()});
 c.querySelectorAll('[data-exe]').forEach(b=>b.onclick=()=>{const a=S.exs.find(x=>x.id===+b.dataset.exe);if(!a)return;if(a.dono===S.jog)selecionarExe(a.id);else{selExe=a.id;MAPA.sel=a.id;abrirExe()}});
 c.querySelectorAll('[data-diplo]').forEach(b=>b.onclick=()=>detalheNac(b.dataset.diplo));
 c.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=S.exs.find(x=>x.id===selExe);if(!a)return;const k=b.dataset.a;
  if(k==='parar'){a.path=[];a.alvo=null;a.prog=0;a.x=SIM.nx(a.node);a.y=SIM.ny(a.node)}
  if(k==='dividir'){const metade=a.units.splice(Math.ceil(a.units.length/2));const nv=SIM.novoExe(a.dono,a.node,metade);toast('Exército dividido em dois.','info',1500)}
  if(k==='juntar'){for(const o of S.exs.filter(x=>x!==a&&x.dono===S.jog&&x.node===a.node&&!x.missao&&SIM.ehAereo(x)===SIM.ehAereo(a))){a.units.push(...o.units);o.units=[]}S.exs=S.exs.filter(x=>x.units.length);toast('Exércitos unidos.','info',1500)}
  if(k==='modernizar'){const r=SIM.modernizar(a);toast(r==='ok'?'Tropas modernizadas!':r,r==='ok'?'paz':'info')}
  renderExe()})}
// ---------- painéis
$$('#nav button').forEach(b=>b.onclick=()=>{const p=b.dataset.p;if(p==='mapa'){fecharPainel();return}if(painelAtual===p){fecharPainel();return}abrirPainel(p)});
$('#painelX').onclick=()=>fecharPainel();
function abrirPainel(p){painelAtual=p;$('#sheet').classList.add('oculto');dica(null);$$('#nav button').forEach(b=>b.classList.toggle('ativo',b.dataset.p===p));$('#painel').classList.remove('oculto');$('#painelC').scrollTop=0;if(p==='noticias')lidas=S.news.length;renderPainel()}
function fecharPainel(){painelAtual=null;$('#painel').classList.add('oculto');$$('#nav button').forEach(b=>b.classList.toggle('ativo',b.dataset.p==='mapa'));if(selExe){const a=S.exs.find(x=>x.id===selExe);if(a&&a.dono===S.jog)dica(SIM.ehAereo(a)?'🎯 Toque no alvo do ataque aéreo':'👉 Toque no destino no mapa')}}
let abaEra=null;
function renderPainel(auto){const c=$('#painelC');const st=c.scrollTop;const p=painelAtual;const T={exercitos:'Seus exércitos',pesquisa:'Pesquisa',diplo:'Diplomacia',noticias:'Notícias do mundo',menu:'Menu'};$('#painelT').textContent=T[p];
 if(p==='exercitos'){const l=S.exs.filter(a=>a.dono===S.jog);const tot=l.reduce((s,a)=>s+a.units.length,0);c.innerHTML=`<div class="chips"><span class="chip meu">${l.length} grupos</span><span class="chip">${tot} unidades</span><span class="chip">Força ${Math.round(l.reduce((s,a)=>s+SIM.forca(a),0))}</span></div>`+(l.length?l.sort((a,b)=>SIM.forca(b)-SIM.forca(a)).map(linhaExe).join(''):'<p>Você não tem tropas. Recrute num quartel!</p>');
  c.querySelectorAll('[data-exe]').forEach(b=>b.onclick=()=>{const a=S.exs.find(x=>x.id===+b.dataset.exe);if(!a)return;fecharPainel();MAPA.voar(a.x,a.y,Math.max(1.4,MAPA.cam.z));selecionarExe(a.id)})}
 if(p==='pesquisa'){const n=S.nac[S.jog];if(abaEra==null)abaEra=Math.min(3,n.era);
  c.innerHTML=`<div class="labs">${[0,1].map(i=>{const f=n.fila[i];if(!f)return `<div class="lab"><small>LABORATÓRIO ${i+1}</small><span style="color:var(--mut)">Livre — escolha uma pesquisa</span></div>`;const pz=PESQUISAS.find(q=>q.id===f.id);return `<div class="lab"><small>LABORATÓRIO ${i+1}</small><b>${pz.nome}</b><div class="barra" style="margin:5px 0 2px"><i style="width:${(1-f.rest/f.tot)*100}%"></i></div><small style="letter-spacing:0">${Math.ceil(f.rest)} dias</small></div>`}).join('')}</div>
  <div class="abas">${ERAS.map((e,i)=>`<button class="${abaEra===i?'on':''} ${i>n.era?'trava':''}" data-era="${i}">${i>n.era?'🔒 ':''}${e.curto}</button>`).join('')}</div>
  ${abaEra>n.era?`<p style="color:var(--mut);font-size:12.5px">🔒 Esta era abre em ${SIM.ano(SIM.DIA_ERA[abaEra])} pelo calendário, ou antes se você pesquisar “Rumo à ${ERAS[abaEra].nome}”.</p>`:''}
  <div class="tecs">${PESQUISAS.filter(q=>q.era===abaEra).map(q=>{const feita=n.pf[q.id];const and=n.fila.find(f=>f.id===q.id);const disp=SIM.pesqDisponivel(S.jog,q);const c2=SIM.custoPesq(q);
   const vis=q.tipo==='unid'?`<div class="art">${ART.svg(q.u,Math.max(q.era,UNIDADES[q.u].era0))}</div>`:`<div class="sym">${{eco:'🏭',dou:'🎖️',log:'🚂',era:'⏩'}[q.tipo]}</div>`;
   return `<button class="tec ${feita?'feita':''} ${and?'andando':''} ${!disp&&!feita&&!and?'bloq':''} ${q.tipo==='era'?'era':''}" data-pz="${q.id}">${vis}<b>${q.nome}</b><small>${q.desc}</small>${feita?'<small style="color:var(--grn)">Concluída</small>':and?`<small style="color:var(--ac2)">Pesquisando… ${Math.ceil(and.rest)}d</small>`:`${custoHTML(c2,n)}<small>⏱ ${q.dias} dias</small>`}</button>`}).join('')}</div>`;
  c.querySelectorAll('[data-era]').forEach(b=>b.onclick=()=>{abaEra=+b.dataset.era;renderPainel()});
  c.querySelectorAll('[data-pz]').forEach(b=>b.onclick=()=>{const q=PESQUISAS.find(x=>x.id===b.dataset.pz);if(n.pf[q.id])return;const r=SIM.pesquisar(S.jog,q.id);if(r==='ok')toast('🔬 Pesquisando: '+q.nome,'info',1600);else toast(q.tipo==='era'&&!SIM.pesqDisponivel(S.jog,q)&&q.era<=n.era?'Conclua 5 pesquisas desta era primeiro.':r);renderPainel()})}
 if(p==='diplo'){if(auto&&c.querySelector('.modal'))return;const vivos=Object.keys(S.nac).filter(i=>i!==S.jog&&S.nac[i].vivo&&S.prov.some(x=>x.d===i));const viz=new Set(SIM.vizinhosNac(S.jog));
  const ordem=id=>(SIM.emGuerra(id,S.jog)?0:SIM.aliado(id,S.jog)?1:viz.has(id)?2:3)*1e7-SIM.poder(id);vivos.sort((a,b)=>ordem(a)-ordem(b));
  c.innerHTML=(S.prop.length?`<div class="sec">Propostas recebidas</div>`+S.prop.map((pr,i)=>`<div class="prop">${band(pr.de).replace('class="band"','class="band" style="width:24px;height:16px;vertical-align:-3px"')} ${pr.txt}<div class="acoes"><button data-resp="${i}:0">Recusar</button><button class="prim" data-resp="${i}:1">Aceitar</button></div></div>`).join(''):'')+
  `<div class="sec">Nações do mundo</div>`+vivos.map(id=>{const r=SIM.rel(id,S.jog);return `<button class="linha nacrow" data-nac="${id}">${band(id)}<span class="meio"><b>${SIM.nomeNac(id)}</b><small>${PERSONAS[S.nac[id].persona].n}${viz.has(id)?' · vizinho':''}</small><div class="relbar"><i style="left:${(r+100)/2}%"></i></div></span><span class="dir">${SIM.emGuerra(id,S.jog)?'<span class="chip guerra">Guerra</span>':SIM.aliado(id,S.jog)?'<span class="chip ali">Aliado</span>':''}${S.com[[id,S.jog].sort().join('|')]?'<span class="chip com">Comércio</span>':''}</span></button>`}).join('');
  c.querySelectorAll('[data-resp]').forEach(b=>b.onclick=()=>{const [i,s]=b.dataset.resp.split(':').map(Number);const pr=S.prop[i];SIM.responderProposta(i,!!s);if(s)toast('Acordo aceito com '+SIM.nomeNac(pr.de)+'.','alianca');MAPA.sujar();renderPainel()});
  c.querySelectorAll('[data-nac]').forEach(b=>b.onclick=()=>detalheNac(b.dataset.nac))}
 if(p==='noticias'){const ic={guerra:'⚔️',paz:'🕊️',alianca:'🤝',traicao:'🗡️',revolta:'🔥',conquista:'🚩',era:'⏳',combate:'💥',info:'📰'};
  c.innerHTML=S.news.slice(0,120).map(n=>`<div class="news ${n.imp?'imp':''}"><span class="ic ${n.tipo}">${ic[n.tipo]||'📰'}</span><span><small>${SIM.dataTxt(n.dia)}</small>${n.txt}</span></div>`).join('')}
 if(p==='menu'){c.innerHTML=`<div class="sec">Ranking mundial</div>${rankingHTML()}<div class="sec">Jogo</div>
  <div class="acoes" style="grid-template-columns:1fr 1fr"><button data-m="salvar">💾 Salvar agora</button><button data-m="tut">🎓 Tutorial</button><button data-m="como">❓ Como jogar</button><button data-m="cine">🎬 Ver abertura da era</button><button data-m="novo" class="perigo">Nova campanha</button><button data-m="tela">⛶ Tela cheia</button></div>
  <p style="color:var(--mut);font-size:11.5px;margin-top:14px">O jogo salva sozinho a cada 25 segundos neste aparelho. Dificuldade: ${['Fácil','Normal','Difícil'][S.dific??1]}.</p>`;
  c.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const m=b.dataset.m;if(m==='salvar'){salvar();toast('Jogo salvo!','paz',1500)}if(m==='tut'){fecharPainel();tutorial()}if(m==='como')comoJogar();if(m==='cine'){cinematica(Math.min(3,S.nac[S.jog].era))}if(m==='tela'){document.documentElement.requestFullscreen&&document.documentElement.requestFullscreen().catch(()=>{})}
   if(m==='novo')modal(`<h3>Nova campanha?</h3><p>O progresso atual será apagado.</p><div class="acoes" style="grid-template-columns:1fr 1fr"><button data-fechar>Cancelar</button><button class="perigo" onclick="localStorage.removeItem('${SAVE}');location.reload()">Apagar e recomeçar</button></div>`)})}
 if(auto)c.scrollTop=st}
function rankingHTML(){const vivos=Object.keys(S.nac).filter(i=>S.nac[i].vivo&&S.prov.some(x=>x.d===i));const cont={};S.prov.forEach(p=>cont[p.d]=(cont[p.d]||0)+1);const r=vivos.map(id=>({id,p:SIM.poder(id)})).sort((a,b)=>b.p-a.p);const pos=r.findIndex(x=>x.id===S.jog);
 return r.slice(0,10).map((x,i)=>`<div class="linha nacrow" style="${x.id===S.jog?'border-color:var(--ac)':''}"><b style="width:22px;font-family:Oswald;font-size:16px">${i+1}</b>${band(x.id)}<span class="meio"><b>${SIM.nomeNac(x.id)}</b><small>${cont[x.id]} províncias</small></span><span class="dir">${fmt(x.p)}</span></div>`).join('')+(pos>=10?`<div class="linha" style="border-color:var(--ac)"><b style="width:22px">${pos+1}</b>${band(S.jog)}<span class="meio"><b>${SIM.nomeNac(S.jog)}</b><small>${cont[S.jog]||0} províncias</small></span><span class="dir">${fmt(r[pos].p)}</span></div>`:'')}
function detalheNac(id){const n=S.nac[id];const r=SIM.rel(id,S.jog);const g=SIM.emGuerra(id,S.jog),al=SIM.aliado(id,S.jog);const cont=S.prov.filter(p=>p.d===id).length;const k=[id,S.jog].sort().join('|');
 modal(`<div class="cab">${band(id)}<div><h3>${SIM.nomeNac(id)}</h3><div class="sub">${PERSONAS[n.persona].n} · ${cont} províncias · ${ERAS[Math.min(3,n.era)].curto}</div></div><button class="x" data-fechar>✕</button></div>
 <div class="chips">${g?'<span class="chip guerra">Em guerra com você</span>':al?'<span class="chip ali">Aliado</span>':'<span class="chip">Em paz</span>'}${S.com[k]?'<span class="chip com">Comércio</span>':''}${S.vis[id+'>'+S.jog]?'<span class="chip">Visão compartilhada</span>':''}</div>
 <div style="font-size:12px;color:var(--mut)">Relação com você: <b style="color:${r>20?'#5be37a':r<-20?'#ff6b6b':'#ddd'}">${Math.round(r)}</b></div><div class="relbar" style="width:100%;margin:6px 0 10px"><i style="left:${(r+100)/2}%"></i></div>
 <div style="font-size:12px;color:var(--mut);margin-bottom:6px">Força militar: ${fmt(SIM.poder(id))} (você: ${fmt(SIM.poder(S.jog))})</div>
 <div class="acoes" style="grid-template-columns:1fr 1fr">
 ${g?`<button class="prim" data-pr="paz">🕊️ Propor paz</button>`:`<button class="prim" data-pr="ali" ${al?'disabled':''}>🤝 Aliança</button>`}
 <button data-pr="com" ${g||S.com[k]?'disabled':''}>💰 Comércio</button><button data-pr="vis" ${g||S.vis[id+'>'+S.jog]?'disabled':''}>👁️ Visão</button><button data-pr="pre">🎁 Presente (200)</button>
 ${al?`<button class="perigo" data-pr="romper">Romper aliança</button>`:''}${g?'':`<button class="perigo" data-pr="guerra">⚔️ Declarar guerra</button>`}
 <button data-ver>📍 Ver no mapa</button></div>`);
 $$('#modalC [data-pr]').forEach(b=>b.onclick=()=>{const t=b.dataset.pr;const go=()=>{const res=SIM.propor(t,id);if(res==='ACEITO'){toast({paz:'🕊️ Paz assinada!',ali:'🤝 Aliança formada!',com:'💰 Acordo comercial fechado!',vis:'👁️ Visão compartilhada!',pre:'🎁 Presente enviado. Relação melhorou.',guerra:'⚔️ Guerra declarada!',romper:'Aliança rompida.'}[t]+' — '+SIM.nomeNac(id),t==='guerra'?'guerra':'alianca')}else toast(res,'info',4200);MAPA.sujar();detalheNac(id);if(painelAtual)renderPainel(true)};
  if(t==='guerra'){modal(`<h3>Declarar guerra?</h3><p>Você vai declarar guerra a <b>${SIM.nomeNac(id)}</b>.${al?' Isso é uma <b>traição</b> e outros países vão confiar menos em você.':''} Os aliados dele podem entrar na guerra.</p><div class="acoes" style="grid-template-columns:1fr 1fr"><button data-fechar>Cancelar</button><button class="perigo" id="cg">Declarar</button></div>`);$('#cg').onclick=()=>{fecharModal();go()}}else go()});
 const v=$('#modalC [data-ver]');v.onclick=()=>{fecharModal();fecharPainel();const c=P[n.cap];MAPA.voar(c.x,c.y,Math.max(.8,MAPA.cam.z))}}
// ---------- modal
function modal(h){$('#modalC').innerHTML=h;$('#modal').classList.remove('oculto');pausadoUI=true;$$('#modalC [data-fechar]').forEach(b=>b.onclick=fecharModal)}
function fecharModal(){$('#modal').classList.add('oculto');pausadoUI=false}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')fecharModal()});
// ---------- cinemática de era
const CINE_FUNDO=['radial-gradient(ellipse at 50% 40%,#6b4e2a 0%,#2a1b0c 55%,#0d0804 100%)','radial-gradient(ellipse at 50% 40%,#5a5330 0%,#23200f 55%,#080805 100%)','radial-gradient(ellipse at 50% 40%,#16456e 0%,#071a2c 55%,#02060b 100%)','radial-gradient(ellipse at 50% 40%,#0f4a44 0%,#04161a 55%,#010405 100%)'];
const CINE_UNID=[['inf','arm','art','fig','nav','sub'],['inf','arm','art','fig','bom','car'],['inf','arm','hel','fig','mis','sub'],['inf','arm','dro','fig','bom','nav']];
function cinematica(e,depois){const c=$('#cine');pausadoUI=true;const ano=ERAS[e].ano;const anoAnt=e?ERAS[e-1].ano:1900;
 let fag='';for(let i=0;i<26;i++)fag+=`<span class="fagulha" style="left:${Math.random()*100}%;bottom:-10px;animation-duration:${4+Math.random()*6}s;animation-delay:${-Math.random()*8}s;${e>=2?'background:#7fe3ff;box-shadow:0 0 6px #2bc4ff':''}"></span>`;
 c.innerHTML=`<div class="fundo" style="background:${CINE_FUNDO[e]}"></div>${fag}<div class="faixa" style="top:18%"></div><div class="faixa" style="bottom:18%"></div>
 <div style="font-family:Oswald;letter-spacing:.5em;font-size:12px;color:${TEMAS[e].acento}">ERA ${e+1} DE 4</div><div class="ano" id="cAno">${anoAnt}</div><div class="titulo" style="color:${TEMAS[e].acento}">${ERAS[e].nome.toUpperCase()}</div><div class="lema">“${ERAS[e].lema}”</div><div class="sub">${ERAS[e].sub}${e===0?'<br><br>Você comanda <b>'+SIM.nomeNac(S.jog)+'</b>.':''}</div>
 <div class="tropas">${CINE_UNID[e].map((t,i)=>`<div style="animation-delay:${1.6+i*.15}s">${ART.svg(t,Math.max(e,UNIDADES[t].era0))}</div>`).join('')}</div><button class="bt bt-ouro" id="cOk">${e===0?'COMEÇAR A GUERRA':'CONTINUAR'}</button>`;
 c.classList.remove('oculto');const el=$('#cAno');const t0=performance.now();const anim=t=>{const f=Math.min(1,(t-t0)/1400);el.textContent=Math.round(anoAnt+(ano-anoAnt)*(1-Math.pow(1-f,3)));if(f<1)requestAnimationFrame(anim)};requestAnimationFrame(anim);
 $('#cOk').onclick=()=>{c.classList.add('oculto');pausadoUI=false;hud();if(depois)depois()}}
window.__cine=cinematica;
// ---------- tutorial
const PASSOS=[
 {t:'Bem-vindo, comandante!',p:()=>`Você governa <b>${SIM.nomeNac(S.jog)}</b> em 1914. Seu território tem a borda brilhante. A estrela marca sua capital.`,alvo:null,acao:()=>{const c=P[S.nac[S.jog].cap];MAPA.voar(c.x,c.y,1.2)}},
 {t:'Recursos',p:()=>'Aqui ficam comida, bens, metal, petróleo, materiais raros, dinheiro e soldados. O número verde é quanto você ganha por dia.',alvo:'#recursos'},
 {t:'Mover tropas',p:()=>'Os quadradinhos com desenho e número são exércitos. Toque num exército seu e depois toque no destino. Em território inimigo ele luta e conquista.',alvo:null,acao:()=>{const a=S.exs.find(x=>x.dono===S.jog&&!SIM.ehNaval(x));if(a){MAPA.voar(a.x,a.y,1.6)}}},
 {t:'Construir e recrutar',p:()=>'Toque numa província sua para construir quartéis, fábricas, portos e aeródromos, e para recrutar tropas.',alvo:null},
 {t:'Pesquisa e eras',p:()=>'Pesquise novas armas. Em 1939 começa a 2ª Guerra, em 1947 a Guerra Fria e em 1991 a Guerra Moderna — ou chegue antes pela pesquisa!',alvo:'#nav [data-p=pesquisa]'},
 {t:'Diplomacia',p:()=>'Faça alianças, comércio, paz ou declare guerra. Os outros países têm personalidade: alguns são leais, outros traiçoeiros.',alvo:'#nav [data-p=diplo]'},
 {t:'Controle do tempo',p:()=>'Pause ou acelere o tempo aqui. Boa sorte, comandante!',alvo:'#vel'}];
let passo=0;
function tutorial(){tutAtivo=true;passo=0;setVel(0);$('#tut').classList.remove('oculto');mostrarPasso()}
function mostrarPasso(){const P2=PASSOS[passo];if(P2.acao)P2.acao();const foco=$('#tutFoco'),cx=$('#tutCaixa');
 if(P2.alvo){const r=$(P2.alvo).getBoundingClientRect();foco.style.cssText=`left:${r.left-4}px;top:${r.top-4}px;width:${r.width+8}px;height:${r.height+8}px;opacity:1`}else foco.style.cssText=`left:50%;top:45%;width:0;height:0;opacity:1`;
 const embaixo=P2.alvo&&$(P2.alvo).getBoundingClientRect().top<innerHeight/2;cx.style.top=embaixo?'auto':'auto';cx.style.bottom=embaixo?'90px':'auto';if(!embaixo)cx.style.top=P2.alvo?'calc(var(--sa) + 120px)':'auto',cx.style.bottom=P2.alvo?'auto':'110px';
 cx.innerHTML=`<small style="color:var(--mut);font-weight:800;letter-spacing:.1em">PASSO ${passo+1} DE ${PASSOS.length}</small><h3>${P2.t}</h3><p>${P2.p()}</p><div class="acoes"><button id="tPular">Pular</button><button class="prim" id="tProx">${passo<PASSOS.length-1?'Próximo':'Jogar!'}</button></div>`;
 $('#tPular').onclick=fimTut;$('#tProx').onclick=()=>{passo++;if(passo>=PASSOS.length)fimTut();else mostrarPasso()}}
function fimTut(){tutAtivo=false;$('#tut').classList.add('oculto');localStorage.setItem('guerras_tut_ok','1');setVel(1)}
// ---------- salvar
function salvar(){if(demo||!S||!S.nac[S.jog])return;try{localStorage.setItem(SAVE,SIM.exportar())}catch(e){console.warn('save',e)}}
window.addEventListener('visibilitychange',()=>{if(document.hidden)salvar()});window.addEventListener('pagehide',salvar);
// ---------- teclado (PC)
window.addEventListener('keydown',e=>{if(demo)return;if(e.key===' '){setVel(vel?0:1);e.preventDefault()}if(e.key==='Escape'){desselecionar();fecharPainel();fecharModal()}if('0123'.includes(e.key))setVel(+e.key)});
// API de testes
window.__G={get S(){return SIM.get()},SIM,MAPA,iniciar:(id,d=1)=>{SIM.novo(id);S=SIM.get();S.dific=d;iniciarJogo(true)},setVel,selecionarExe,abrirProv,abrirPainel,fecharPainel,ordenar:(id,n)=>ordenar(S.exs.find(a=>a.id===id),n),salvar,cinematica,fecharCine:()=>$('#cOk')&&$('#cOk').click(),hud,tutorial,fimTut,
 get vel(){return vel}};
})();
