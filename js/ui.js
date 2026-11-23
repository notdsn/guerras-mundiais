// Interface: telas, HUD, toque no mapa, ataque, resultado, missões, painéis
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const SAVE='guerras_mundiais_v2';const VEL=[0,.8,2.5,7];
let alcance=null;let S=null,vel=1,demo=true,sel=null,modo=null,painelAtual=null,animando=false,lidas=0,atqEst=null;
const P=SIM.P;const TK=['i','b','a'];const TI={i:'inf',b:'tan',a:'avi'};
const fmt=n=>{n=Math.floor(n);return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(n>=1e5?0:1)+'k':String(n)};
const band=id=>{const n=S&&S.nac[id];return `<span class="band">${ART.bandeira(id,n?Math.min(3,n.era):0,n?n.cor:'#888')}</span>`};
const icone=(k,s)=>ART.icone(k,s);
const eraDe=id=>{const n=S.nac[id];return n?Math.min(3,n.era):0};
const imgT=(k,e)=>`img/${TI[k]}${e}.webp`;
const nomeT=(k,e)=>SIM.TIPOS[k].n[e];
const espera=ms=>new Promise(r=>setTimeout(r,ms));
const topo=t=>t.a*3.5>=t.b*3&&t.a*3.5>t.i&&t.a>0?'a':t.b*3>t.i&&t.b>0?'b':'i';
// ---------- avisos (no máximo 1 na tela)
const fila=[];let toastAtivo=false;
function toast(txt,tipo='info'){if(fila.length>=3)fila.shift();fila.push({txt,tipo});if(!toastAtivo)proxToast()}
function proxToast(){const t=fila.shift();if(!t){toastAtivo=false;return}toastAtivo=true;const el=document.createElement('div');el.className='toast '+t.tipo;el.innerHTML=t.txt;$('#toasts').append(el);setTimeout(()=>{el.classList.add('sai');setTimeout(()=>{el.remove();proxToast()},300)},2600)}
// ---------- laço
const cv=$('#mapa');MAPA.init(cv);
S=SIM.novo('BRA');S.jog='__demo';MAPA.sujar();MAPA.olhar(2050,560,1.25);
let ultimo=performance.now(),acHUD=0,acSave=0,acMis=0;
const pausado=()=>animando||!$('#atq').classList.contains('oculto')||!$('#res').classList.contains('oculto')||!$('#modal').classList.contains('oculto')||!$('#cine').classList.contains('oculto')||painelAtual!=null;
function loop(t){const dt=Math.min(.1,(t-ultimo)/1000);ultimo=t;
 if(demo){const c=MAPA.cam;c.x+=dt*6/c.z;if(c.x>3200)c.x=1500}
 else if(vel&&!pausado())SIM.passo(VEL[vel]*dt);
 MAPA.desenhar(dt);
 if(!demo){acHUD+=dt;if(acHUD>.25){acHUD=0;hud();if(!pausado())proximaProposta()}acMis+=dt;if(acMis>.5){acMis=0;missoes()}acSave+=dt;if(acSave>20){acSave=0;salvar()}}
 requestAnimationFrame(loop)}
requestAnimationFrame(loop);
MAPA.carregarImgs();
// ---------- início
$('.versao').textContent='Mapa real com '+SIM.NP+' cidades · 4 eras · v2';
if(localStorage.getItem(SAVE))$('#btContinuar').classList.remove('oculto');
$('#btNovo').onclick=abrirEscolha;$('#btComo').onclick=()=>comoJogar();
$('#btContinuar').onclick=()=>{try{if(SIM.carregar(localStorage.getItem(SAVE))){S=SIM.get();iniciarJogo(false)}else toast('Save antigo incompatível. Comece uma nova campanha.')}catch(e){toast('Não deu para carregar o save.')}};
function comoJogar(depois){modal(`<h3>Como jogar</h3><div class="passos">
 <div><i>🗺️</i><p><b>Cada cidade mostra suas tropas.</b> O número no círculo é o tamanho do exército.</p></div>
 <div><i>⚔️</i><p><b>Ataque vizinhos:</b> toque numa cidade sua e depois numa cidade <span class="vermelho">vermelha</span>. Compare as forças e toque em ATACAR.</p></div>
 <div><i>🎖️</i><p><b>Reforços todo mês.</b> Coloque nas cidades de fronteira. Mova tropas tocando numa cidade <span class="verde">verde</span>.</p></div>
 <div><i>🕰️</i><p><b>Avance de era:</b> 1914 → 2ª Guerra → Guerra Fria → Guerra Moderna. Suas tropas evoluem sozinhas.</p></div></div>
 <div class="acoes"><button class="bt bt-ouro" data-fechar>Entendi!</button></div>`,depois)}
const MAIORES=['DEU','GBR','FRA','RUS','AUT','TUR','ITA','USA','JPN','BRA','CHN','ESP','SRB','ARG','PRT','NLD','MEX','SWE','IRN','ETH'];
const DESAFIO={DEU:3,GBR:2,FRA:3,RUS:3,AUT:4,TUR:4,ITA:3,USA:1,JPN:2,BRA:1,CHN:3,ESP:2,SRB:5,ARG:1,PRT:3,NLD:3,MEX:2,SWE:1,IRN:3,ETH:4};
let escolhido='BRA',todos=false;
function abrirEscolha(){$('#inicio').classList.add('oculto');$('#escolha').classList.remove('oculto');renderEscolha()}
function renderEscolha(){const cont={},tr={};S.prov.forEach(p=>{cont[p.d]=(cont[p.d]||0)+1;tr[p.d]=(tr[p.d]||0)+p.i+p.b+p.a});
 const ids=(todos?Object.keys(S.nac).filter(id=>id!=='__demo'&&cont[id]).sort((a,b)=>SIM.nomeNac(a).localeCompare(SIM.nomeNac(b),'pt')):MAIORES.filter(id=>S.nac[id]));
 $('#escolha').innerHTML=`<div class="esc-top"><h2>ESCOLHA SEU PAÍS</h2><p>28 de julho de 1914. O mundo está prestes a explodir.</p></div>
 <div class="abas"><button class="${!todos?'on':''}" data-t="0">Grandes nações</button><button class="${todos?'on':''}" data-t="1">Todos (${Object.keys(cont).length})</button></div>
 <div class="esc-lista"><div class="cards">${ids.map(id=>{const d=DESAFIO[id]||3;return `<button class="ncard ${id===escolhido?'on':''}" data-n="${id}">${band(id)}<b>${SIM.nomeNac(id)}</b><small>${cont[id]} cidades · ${tr[id]} tropas</small><span class="estrelas">${'★'.repeat(6-d)}${'☆'.repeat(d-1)}</span><small class="fac">${d<=2?'Fácil':d<=3?'Médio':'Difícil'}</small></button>`}).join('')}</div></div>
 <div class="esc-rodape"><button class="bt" id="escVoltar">Voltar</button><button class="bt bt-ouro" data-comecar>Jogar com ${SIM.nomeNac(escolhido)}</button></div>`;
 $$('#escolha [data-n]').forEach(b=>b.onclick=()=>{escolhido=b.dataset.n;const id=escolhido;const p=P[S.nac[id].cap];MAPA.voar(p.x,p.y,1.8);renderEscolha()});
 $$('#escolha [data-t]').forEach(b=>b.onclick=()=>{todos=b.dataset.t==='1';renderEscolha()});
 $('#escVoltar').onclick=()=>{$('#escolha').classList.add('oculto');$('#inicio').classList.remove('oculto')};
 $('[data-comecar]').onclick=()=>{S=SIM.novo(escolhido);iniciarJogo(true)}}
function iniciarJogo(novo){demo=false;S=SIM.get();$('#inicio').classList.add('oculto');$('#escolha').classList.add('oculto');['#hud','#nav','#botoesMapa','#missao'].forEach(s=>$(s).classList.remove('oculto'));
 MAPA.sujar();const c=P[S.nac[S.jog].cap];const eur=c.cont==='Europe';MAPA.olhar(c.x,c.y+40,eur?2.6:1.8);setVel(1);lidas=S.news.length;hud();
 if(novo){S.mis=0;S.misIni={};cinematica(0,()=>comoJogar(()=>{missoes(true)}))}else missoes(true)}
function setVel(v){vel=v;$$('#vel button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v))}
$$('#vel button').forEach(b=>b.onclick=()=>setVel(+b.dataset.v));
$('#zMais').onclick=()=>MAPA.zoom(1.5);$('#zMenos').onclick=()=>MAPA.zoom(1/1.5);
$('#zCasa').onclick=()=>{const c=P[S.nac[S.jog].cap];MAPA.voar(c.x,c.y,Math.max(2,MAPA.cam.z))};
$('#hudNac').onclick=()=>abrirPainel('menu');
$$('#nav [data-ic]').forEach(i=>i.innerHTML=icone(i.dataset.ic,22));
// ---------- HUD
function hud(){const n=S.nac[S.jog];if(!n)return;const e=Math.min(3,S.eraMundo);document.documentElement.style.setProperty('--ac',TEMAS[e].acento);
 $('#hudBand').innerHTML=ART.bandeira(S.jog,eraDe(S.jog),n.cor);$('#hudNome').textContent=SIM.nomeNac(S.jog);$('#hudEra').textContent=ERAS[e].curto;
 $('#hudData').textContent=SIM.dataTxt(S.dia);const prox=e<3?ERAS[e+1]:null;$('#hudAno').textContent=prox?`${ERAS[e+1].curto} em ${Math.max(0,prox.ano-SIM.ano(S.dia))} anos`:'Rumo a 2030';
 const r=SIM.rendaDia(S.jog);$('#rcDin').innerHTML=`${icone('dinheiro',16)}<b>${fmt(n.din)}</b><small class="${r.din<0?'neg':''}">${r.din>=0?'+':''}${r.din.toFixed(0)}/dia</small>`;
 $('#rcPet').innerHTML=`${icone('petroleo',16)}<b>${fmt(n.pet)}</b><small>+${r.pet.toFixed(1)}</small>`;
 const br=$('#btRef');if(n.ref>0){br.classList.remove('oculto');br.innerHTML=`🎖️ <b>${n.ref}</b> reforços`;br.classList.toggle('on',modo==='reforco')}else br.classList.add('oculto');
 const pt=SIM.podeProclamar(S.jog);const bi=$('#btImp');if(pt){bi.classList.remove('oculto');bi.innerHTML=`${SIM.TIERS[pt].ic} <b>Proclamar</b>`}else bi.classList.add('oculto');
 const am=S.ameaca||0;const ca=am>=70?'#ff4a3a':am>=40?'#ffb02e':am>=20?'#e8d35a':'#6fe39a';$('#btAm').innerHTML=`<span class="am-ic">👁️</span><span class="am-t"><small>Ameaça</small><span class="am-bar"><i style="width:${Math.max(4,am)}%;background:${ca}"></i></span></span>`;
 const np=S.prop.length;const bd=$('#bDiplo');bd.classList.toggle('oculto',!np);bd.textContent=np;
 const nn=S.news.length-lidas;const bn=$('#bNews');bn.classList.toggle('oculto',nn<=0||painelAtual==='noticias');bn.textContent=nn>99?'99+':nn;
 if(painelAtual==='noticias')lidas=S.news.length}
$('#btRef').onclick=()=>{if(modo==='reforco'){sairModo();return}desselecionar();modo='reforco';const n=S.nac[S.jog];MAPA.moveis=SIM.cidadesDe(S.jog).filter(p=>SIM.viz(p).some(q=>S.prov[q].d!==S.jog));if(!MAPA.moveis.length)MAPA.moveis=[n.cap];dica(`Toque numa cidade sua para colocar ${n.ref} reforços (as verdes são de fronteira).`);hud()};
$('#btImp').onclick=()=>cerimonia();
$('#btAm').onclick=()=>infoImperio();
function proxTierTxt(){const n=S.nac[S.jog];const t=(n.tier||0)+1;if(t>=SIM.TIERS.length)return 'Você já é uma Superpotência, o título máximo.';const f=SIM.precisa(S.jog,t)-SIM.cresc(S.jog);return f>0?`Conquiste mais <b>${f}</b> ${f>1?'cidades':'cidade'} para poder se proclamar <b>${SIM.TIERS[t].n}</b>.`:`Você já pode se proclamar <b>${SIM.TIERS[t].n}</b>!`}
function infoImperio(){const n=S.nac[S.jog];const am=S.ameaca||0;const t=n.tier||0;
 modal(`<h3>👁️ Ameaça: ${SIM.ameacaTxt(am)} (${Math.round(am)}%)</h3><div class="am-grande"><i style="width:${Math.max(3,am)}%"></i><span style="left:40%"></span><span style="left:70%"></span></div>
 <p>É o quanto as outras potências temem você. Sobe quando você conquista cidades (capitais contam mais) e quando proclama um império. Desce devagar em tempos de paz.</p>
 <ul class="lista-am"><li><b>40%+</b> as potências desconfiam: relações pioram e recusam acordos.</li><li><b>70%+</b> podem formar uma <b>coalizão</b> contra você.</li><li><b>82%+</b> a coalizão declara guerra.</li></ul>
 <h4>${t?SIM.TIERS[t].ic+' '+SIM.nomeNac(S.jog)+' · nível '+t+'/3':'Título: nenhum ainda'}</h4><p>${proxTierTxt()}</p>
 <div class="acoes">${SIM.podeProclamar(S.jog)?'<button class="bt bt-ouro" id="mImp">👑 Proclamar agora</button>':''}<button class="bt" data-fechar>Fechar</button></div>`);const b=$('#mImp');if(b)b.onclick=()=>{fecharModal();cerimonia()}}
function cerimonia(){const t=SIM.podeProclamar(S.jog);if(!t)return;const T=SIM.TIERS[t];const antes=SIM.nomeNac(S.jog);const n=S.nac[S.jog];const nb=(n.tier?SIM.TIERS[n.tier]:null);
 const c=$('#cine');c.classList.remove('oculto');const e=Math.min(3,S.eraMundo);
 c.innerHTML=`<div class="cine-fundo imp" style="background-image:url(img/era${e}.webp)"></div><div class="raios"></div><div class="cine-c imp-c"><small>PROCLAMAÇÃO</small>
  <div class="coroa">${T.ic}</div><div class="imp-band">${ART.bandeira(S.jog,eraDe(S.jog),n.cor)}</div>
  <p class="imp-antes">${antes} vai se tornar</p><h2 id="impNome">${SIM.nomeComTier(S.jog,t)}</h2><p class="imp-niv">Nível ${t} de 3</p>
  <div class="imp-bon"><div><b>+${T.ref}</b><small>reforços<br>por mês</small></div><div><b>+${Math.round(T.renda*100)}%</b><small>de dinheiro</small></div><div><b>${T.ic}</b><small>novo título</small></div></div>
  <p class="imp-aviso">⚠️ As potências vão ficar de olho: sua <b>Ameaça</b> sobe.</p>
  <button class="bt bt-ouro grande" id="impOk">Proclamar!</button></div>`;
 $('#impOk').onclick=()=>{const r=SIM.proclamar(S.jog);if(r){$('#impNome').textContent=r.novo;$('.imp-antes').textContent=r.novo===r.antes?`${r.antes} agora é uma Potência Regional!`:`${r.antes} agora se chama`;const b=$('#impOk');b.textContent='Viva!';b.onclick=()=>{c.classList.add('oculto');hud();MAPA.sujar()};S.stats.imp=(S.stats.imp||0)+1;c.querySelector('.coroa').classList.add('brilha');MAPA.sujar();hud()}}}
function sairModo(){modo=null;MAPA.moveis=null;dica(null);hud()}
function modoMover(p){if(SIM.total(S.prov[p])<2){toast('Precisa de pelo menos 2 tropas para mover (1 fica guardando a cidade).');return}sel=p;alcance=SIM.alcancaveis(p);if(!alcance.size){toast('Nenhuma cidade sua ligada a esta.');return}fecharSheet();modo='mover';MAPA.selProv=p;MAPA.alvos=null;MAPA.moveis=[...alcance.keys()];
 dica(`🚚 Toque na cidade <b class="verde">verde</b> para onde as tropas de <b>${P[p].n}</b> vão. <button class="bt mini" id="dCancel">Cancelar</button>`);const b=$('#dCancel');if(b)b.onclick=e=>{e.stopPropagation();sairModo();selecionar(p)};
 const z=Math.max(MAPA.cam.z,1.6);MAPA.voar(P[p].x,P[p].y,z,.5)}
// ---------- seleção
MAPA.onTapProv=p=>{if(demo||animando)return;const meu=S.prov[p].d===S.jog;
 if(modo==='reforco'){if(!meu){toast('Escolha uma cidade <b>sua</b>.');return}const r=SIM.colocarReforcos(p);if(r){MAPA.texto(P[p].x,P[p].y,'+'+r,'#7dff9a');MAPA.onda(P[p].x,P[p].y,'#7dff9a')}sairModo();selecionar(p);return}
 if(modo==='mover'){const de=sel;if(p===de){sairModo();selecionar(p);return}if(meu&&alcance&&alcance.has(p)){modo=null;dica(null);abrirMover(de,p);return}toast(meu?'Essa cidade não está ligada por terra ou mar às suas tropas.':'Escolha uma cidade <b>sua</b> (verde).');return}
 if(sel!=null&&p!==sel){if(MAPA.alvos&&MAPA.alvos.includes(p)){abrirAtaque(p,[sel]);return}if(meu&&alcance&&alcance.has(p)&&SIM.total(S.prov[sel])>1){abrirMover(sel,p);return}}
 if(meu){selecionar(p);return}
 const dono=S.prov[p].d;const fontes=SIM.fontesPara(p);if(fontes.length&&!SIM.aliado(dono,S.jog)){fontes.sort((a,b)=>SIM.forcaCidade(b)-SIM.forcaCidade(a));abrirAtaque(p,[fontes[0]]);return}
 abrirInfo(p)};
MAPA.onTapMar=()=>{if(modo==='reforco')return;desselecionar()};
function selecionar(p){sel=p;MAPA.selProv=p;const vz=SIM.viz(p);MAPA.alvos=vz.filter(q=>S.prov[q].d!==S.jog&&!SIM.aliado(S.prov[q].d,S.jog));const al=SIM.alcancaveis(p);MAPA.moveis=[...al.entries()].filter(([q,d])=>d<=4).map(([q])=>q);alcance=al;abrirSheet('meu');focar(p)}
function desselecionar(){sel=null;MAPA.selProv=null;MAPA.alvos=null;if(modo!=='reforco')MAPA.moveis=null;fecharSheet()}
function focar(p){const [sx,sy]=MAPA.W2S(P[p].x,P[p].y);if(sy>innerHeight*.42||sy<130||sx<30||sx>innerWidth-30){const z=MAPA.cam.z;MAPA.voar(P[p].x,P[p].y+(innerHeight*.5-innerHeight*.3)/z,z,.5)}}
function dica(t){const d=$('#dica');if(!t){d.classList.add('oculto');return}d.innerHTML=t;d.classList.remove('oculto')}
// ---------- folha da cidade
let sheetTipo=null,sheetP=null;
function abrirSheet(t,p=sel){sheetTipo=t;sheetP=p;const sh=$('#sheet');sh.classList.remove('oculto');renderSheet();dica(null)}
function fecharSheet(){$('#sheet').classList.add('oculto');sheetTipo=null;sheetP=null}
function abrirInfo(p){sel=null;MAPA.selProv=p;MAPA.alvos=null;MAPA.moveis=null;abrirSheet('info',p);focar(p)}
function terrenoTxt(p){const t=P[p].ter;const b=SIM.TER_DEF[t];return TERRENOS[t].n+(b>1?` (+${Math.round((b-1)*100)}% defesa)`:'')}
function tropasHTML(pr,e,rec){return `<div class="tropas3">${TK.map(k=>{const c=SIM.custoTropa(k);return `<div class="tc ${pr[k]?'':'zero'}"><img src="${imgT(k,e)}" alt=""><b>${pr[k]}</b><small>${SIM.TIPOS[k].cat}</small>${rec?`<div class="rbts"><button data-rec="${k}" data-q="1">+1 <span>${icone('dinheiro',11)}${c.din}${c.pet?` ${icone('petroleo',11)}${c.pet}`:''}</span></button><button data-rec="${k}" data-q="5">+5</button></div>`:''}</div>`}).join('')}</div>`}
function renderSheet(){const p=sheetP;if(p==null)return;const pr=S.prov[p];const d=pr.d;const n=S.nac[d];const meu=d===S.jog;const e=eraDe(d);const cap=n&&n.cap===p;const c=$('#sheetC');
 const st=meu?'<span class="chip meu">Sua cidade</span>':SIM.emGuerra(d,S.jog)?'<span class="chip guerra">Em guerra</span>':SIM.aliado(d,S.jog)?'<span class="chip ali">Aliado</span>':'<span class="chip">Em paz</span>';
 let h=`<div class="cab">${band(d)}<div class="cab-t"><h3>${P[p].n}${cap?' <span class="estrela">★</span>':''}</h3><div class="sub">${SIM.nomeNac(d)} ${st}</div></div><button class="x" data-fechar aria-label="Fechar">✕</button></div>`;
 h+=tropasHTML(pr,e,meu);
 h+=`<div class="forca-l"><span>🛡️ Defesa <b>${fmt(SIM.defesa(p))}</b></span><span>${terrenoTxt(p)}</span>${pr.fort?`<span>Fortaleza +${pr.fort*40}%</span>`:''}${cap?'<span>Capital +20%</span>':''}</div>`;
 if(meu){const nr=S.nac[S.jog].ref;if(nr>0)h+=`<button class="bt bt-ouro grande" data-colocar>🎖️ Colocar ${nr} reforços aqui</button>`;
  const temAlvo=SIM.viz(p).some(q=>S.prov[q].d!==S.jog&&!SIM.aliado(S.prov[q].d,S.jog));
  h+=`<div class="acoes-cid"><button class="bt bt-mov grande" data-mover>🚚 Mover tropas</button>${temAlvo?`<button class="bt bt-atk grande" data-atacarviz>⚔️ Atacar</button>`:''}</div>`;
  h+=`<p class="ajuda">Ou toque direto no mapa: cidade <b class="vermelho">vermelha</b> = atacar · <b class="verde">verde</b> (sua) = mover tropas.</p>`;
  h+=`<div class="sec">Construções</div><div class="preds">${Object.entries(SIM.PREDIOS).map(([k,B])=>{const lv=pr[k];const cu=B.c(lv);return `<div class="pd"><div class="pd-ic">${k==='fab'?'🏭':'🏰'}</div><div class="pd-t"><b>${B.n} <small>${lv}/${B.max}</small></b><small>${B.d}</small></div>${lv<B.max?`<button class="bt mini" data-cons="${k}">${icone('dinheiro',12)} ${cu.din}</button>`:'<span class="max">Máximo</span>'}</div>`}).join('')}</div>`}
 else{const fontes=SIM.fontesPara(p);const ali=SIM.aliado(d,S.jog);
  if(!ali&&fontes.length)h+=`<button class="bt bt-atk grande" data-atq>⚔️ Atacar ${P[p].n}</button>`;else if(!ali)h+=`<p class="ajuda">Você não faz fronteira com esta cidade. Conquiste as cidades do caminho para chegar aqui.</p>`;
  h+=`<div class="sec">${SIM.nomeNac(d)}</div><div class="dip-bts">${diploBts(d)}</div>`}
 c.innerHTML=h;
 c.querySelector('[data-fechar]').onclick=desselecionar;
 $$('#sheetC [data-rec]').forEach(b=>b.onclick=()=>{const r=SIM.recrutar(p,b.dataset.rec,+b.dataset.q);if(r==='ok'){MAPA.texto(P[p].x,P[p].y,'+'+b.dataset.q,'#7dff9a');renderSheet();hud()}else toast(r)});
 $$('#sheetC [data-cons]').forEach(b=>b.onclick=()=>{const r=SIM.construir(p,b.dataset.cons);if(r==='ok'){toast(`${SIM.PREDIOS[b.dataset.cons].n} construída em ${P[p].n}!`,'ok');renderSheet();hud()}else toast(r)});
 const bc=c.querySelector('[data-colocar]');if(bc)bc.onclick=()=>{const r=SIM.colocarReforcos(p);if(r){MAPA.texto(P[p].x,P[p].y,'+'+r,'#7dff9a');MAPA.onda(P[p].x,P[p].y,'#7dff9a')}renderSheet();hud()};
 const bm=c.querySelector('[data-mover]');if(bm)bm.onclick=()=>modoMover(p);
 const bav=c.querySelector('[data-atacarviz]');if(bav)bav.onclick=()=>{fecharSheet();dica(`⚔️ Toque numa cidade <b class="vermelho">vermelha</b> piscando para atacar a partir de <b>${P[p].n}</b>.`);const z=Math.max(MAPA.cam.z,1.6);MAPA.voar(P[p].x,P[p].y,z,.5)};
 const ba=c.querySelector('[data-atq]');if(ba)ba.onclick=()=>{const f=SIM.fontesPara(p).sort((a,b)=>SIM.forcaCidade(b)-SIM.forcaCidade(a));abrirAtaque(p,[f[0]])};
 ligarDiplo(c)}
// ---------- painel de ataque
function abrirAtaque(alvo,fontes){atqEst={modo:'atq',alvo,fontes:new Set(fontes),frac:1};fecharSheet();$('#atq').classList.remove('oculto');dica(null);renderAtq()}
function abrirMover(de,para){const t=SIM.separar(de,.5);if(t.i+t.b+t.a===0){const pr=S.prov[de];for(const k of TK)t[k]=0;const k=TK.find(k=>pr[k]>0&&SIM.total(pr)>1);if(k)t[k]=1}atqEst={modo:'mov',de,para,t};fecharSheet();$('#atq').classList.remove('oculto');renderAtq()}
function fecharAtq(){$('#atq').classList.add('oculto');atqEst=null}
function miniTropas(t,e){return `<div class="mini3">${TK.filter(k=>t[k]).map(k=>`<span><img src="${imgT(k,e)}" alt="">${t[k]}</span>`).join('')||'<span class="vazio">sem tropas</span>'}</div>`}
function maxMov(de){const pr=S.prov[de];const m={};for(const k of TK)m[k]=pr[k];const tot=SIM.total(pr);return {m,tot:Math.max(0,tot-1)}}
function fixMov(A){const {m,tot}=maxMov(A.de);for(const k of TK)A.t[k]=Math.max(0,Math.min(m[k],A.t[k]));let s=A.t.i+A.t.b+A.t.a;while(s>tot){const k=A.t.i>0?'i':A.t.b>0?'b':'a';A.t[k]--;s--}}
function renderAtq(){const A=atqEst;const c=$('#atqC');const eu=S.jog;const e=eraDe(eu);
 if(A.modo==='mov'){fixMov(A);const t=A.t;const tot=t.i+t.b+t.a;const {m,tot:mx}=maxMov(A.de);const prD=S.prov[A.para];const viz=SIM.viz(A.de).includes(A.para);
  c.innerHTML=`<div class="atq-top mov" style="background-image:linear-gradient(180deg,rgba(0,0,0,.2),rgba(8,12,10,.95)),url(img/era${S.eraMundo}.webp)"><small>MOVER TROPAS</small><h2>${P[A.de].n} → ${P[A.para].n}</h2><div class="dono">${viz?'Cidades vizinhas':'🛣️ Pelo seu território'}</div></div>
  <div class="mov-resumo"><div><small>${P[A.de].n}</small><b>${SIM.total(S.prov[A.de])-tot}</b><small>ficam</small></div><div class="seta">➜ <b>${tot}</b> ➜</div><div><small>${P[A.para].n}</small><b>${SIM.total(prD)+tot}</b><small>depois</small></div></div>
  <input type="range" class="mov-slider" min="0" max="${mx}" value="${tot}" data-slider>
  <div class="mov-tipos">${TK.filter(k=>m[k]>0).map(k=>`<div class="mt"><img src="${imgT(k,e)}" alt=""><div class="mt-n"><b>${nomeT(k,e)}</b><small>tem ${m[k]}</small></div><button class="pm" data-pm="${k}" data-d="-1" aria-label="menos">−</button><b class="mt-q">${t[k]}</b><button class="pm" data-pm="${k}" data-d="1" aria-label="mais">+</button></div>`).join('')}</div>
  <div class="seg">${[['1','Só 1'],['.5','Metade'],['1t','Todas']].map(([f,l])=>`<button data-qtd="${f}">${l}</button>`).join('')}</div>
  <p class="ajuda">Fica pelo menos 1 tropa guardando ${P[A.de].n}.</p>
  <div class="acoes"><button class="bt" data-cancelar>Cancelar</button><button class="bt bt-mov" data-ir ${tot?'':'disabled'}>🚚 MOVER ${tot}</button></div>
  <button class="link-ver" data-ver>Abrir ${P[A.para].n} em vez de mover</button>`;
  $$('#atqC [data-pm]').forEach(b=>b.onclick=()=>{A.t[b.dataset.pm]+=+b.dataset.d;renderAtq()});
  $$('#atqC [data-qtd]').forEach(b=>b.onclick=()=>{const q=b.dataset.qtd;if(q==='1'){for(const k of TK)A.t[k]=0;const k=TK.find(k=>m[k]>0);A.t[k]=1}else if(q==='.5')A.t=SIM.separar(A.de,.5);else A.t={...m};renderAtq()});
  const sl=c.querySelector('[data-slider]');sl.oninput=()=>{const v=+sl.value;const f=mx?v/mx:0;const nt={};let s=0;for(const k of TK){nt[k]=Math.floor(m[k]*f);s+=nt[k]}for(const k of TK){while(s<v&&nt[k]<m[k]){nt[k]++;s++}}A.t=nt;fixMov(A);const tt=A.t.i+A.t.b+A.t.a;c.querySelectorAll('.mt-q').forEach((el,i)=>{const k=TK.filter(k=>m[k]>0)[i];el.textContent=A.t[k]});c.querySelector('[data-ir]').textContent='🚚 MOVER '+tt;c.querySelector('[data-ir]').disabled=!tt;c.querySelector('.seta b').textContent=tt;const rs=c.querySelectorAll('.mov-resumo>div>b');rs[0].textContent=SIM.total(S.prov[A.de])-tt;rs[1].textContent=SIM.total(prD)+tt};
  c.querySelector('[data-ver]').onclick=()=>{fecharAtq();selecionar(A.para)};
  c.querySelector('[data-cancelar]').onclick=()=>{fecharAtq();selecionar(A.de)};c.querySelector('[data-ir]').onclick=()=>mover();return}
 if(false){const t={};const tot=0;
  c.innerHTML=`<div class="atq-top mov" style="background-image:linear-gradient(180deg,rgba(0,0,0,.2),rgba(8,12,10,.95)),url(img/era${S.eraMundo}.webp)"><small>MOVER TROPAS</small><h2>${P[A.de].n} → ${P[A.para].n}</h2></div>
  <div class="duelo"><div class="lado"><img class="grande" src="${imgT(topo(t),e)}" alt="">${miniTropas(t,e)}<small>vão para ${P[A.para].n}</small></div></div>
  <div class="seg">${[[.5,'Metade'],[1,'Quase todas']].map(([f,l])=>`<button class="${A.frac===f?'on':''}" data-frac="${f}">${l}</button>`).join('')}</div>
  <p class="ajuda">Fica pelo menos 1 tropa guardando ${P[A.de].n}.</p>
  <div class="acoes"><button class="bt" data-cancelar>Cancelar</button><button class="bt bt-mov" data-ir ${tot?'':'disabled'}>➜ MOVER ${tot}</button></div>`}
 else{const alvo=A.alvo;const dono=S.prov[alvo].d;const fontesTodas=SIM.fontesPara(alvo);for(const f of [...A.fontes])if(!fontesTodas.includes(f))A.fontes.delete(f);
  const pr=SIM.prepararAtaque([...A.fontes],alvo,A.frac);const ch=Math.round(pr.chance*100);const guerra=SIM.emGuerra(dono,eu);const tp=S.prov[alvo];const ed=eraDe(dono);
  const bon=[];const tb=SIM.TER_DEF[P[alvo].ter];if(tb>1)bon.push(`${TERRENOS[P[alvo].ter].n} +${Math.round((tb-1)*100)}%`);if(tp.fort)bon.push(`Fortaleza +${tp.fort*40}%`);if(SIM.ehCapital(alvo))bon.push('Capital +20%');if(S.eraMundo===0)bon.push('Trincheiras +45%');
  const cor=ch>=70?'#5be37a':ch>=45?'#ffc93c':'#ff5a4a';
  c.innerHTML=`<div class="atq-top" style="background-image:linear-gradient(180deg,rgba(0,0,0,.15),rgba(12,8,6,.96)),url(img/era${S.eraMundo}.webp)"><small>ATACAR</small><h2>${P[alvo].n}</h2><div class="dono">${band(dono)} ${SIM.nomeNac(dono)}</div></div>
  ${guerra?'':`<div class="aviso">⚠️ Atacar vai declarar guerra ${SIM.aNac(dono)}${SIM.aliadosDe(dono).length?` e seus aliados podem entrar na guerra`:''}.</div>`}
  <div class="duelo"><div class="lado meu"><img class="grande" src="${imgT(topo(pr.t),e)}" alt="">${miniTropas(pr.t,e)}<b class="forca">${fmt(pr.A)}</b><small>Seu ataque</small></div>
   <div class="vs">VS</div>
   <div class="lado ini"><img class="grande flip" src="${imgT(topo(tp),ed)}" alt="">${miniTropas(tp,ed)}<b class="forca">${fmt(pr.D)}</b><small>Defesa</small></div></div>
  ${bon.length?`<div class="bonus">Defesa: ${bon.join(' · ')}</div>`:''}${pr.mar?'<div class="bonus mar">🌊 Ataque pelo mar: −40% de força</div>':''}
  <div class="chance"><div class="barra"><i style="width:${ch}%;background:${cor}"></i></div><b style="color:${cor}">Chance de vitória: ${ch}%</b></div>
  <div class="fontes"><small>Atacar a partir de (toque para somar):</small><div>${fontesTodas.map(f=>`<button class="chip ${A.fontes.has(f)?'on':''}" data-f="${f}">${P[f].n} · ${SIM.total(S.prov[f])}</button>`).join('')}</div></div>
  <div class="seg">${[[.5,'Metade das tropas'],[1,'Quase todas']].map(([f,l])=>`<button class="${A.frac===f?'on':''}" data-frac="${f}">${l}</button>`).join('')}</div>
  <div class="acoes"><button class="bt" data-cancelar>Cancelar</button><button class="bt bt-atk" data-ir ${pr.fontes.length?'':'disabled'}>⚔️ ATACAR</button></div>`;
  $$('#atqC [data-f]').forEach(b=>b.onclick=()=>{const f=+b.dataset.f;if(A.fontes.has(f)){if(A.fontes.size>1)A.fontes.delete(f)}else A.fontes.add(f);renderAtq()})}
 $$('#atqC [data-frac]').forEach(b=>b.onclick=()=>{A.frac=+b.dataset.frac;renderAtq()});
 c.querySelector('[data-cancelar]').onclick=()=>{const de=A.modo==='mov'?A.de:sel;fecharAtq();if(de!=null&&S.prov[de].d===S.jog)selecionar(de);else desselecionar()};
 c.querySelector('[data-ir]').onclick=()=>A.modo==='mov'?mover():atacar()}
async function mover(){const A=atqEst;fecharAtq();const t=SIM.mover(A.de,A.para,A.t);if(!t)return;const e=eraDe(S.jog);MAPA.marcha(P[A.de].x,P[A.de].y,P[A.para].x,P[A.para].y,topo(t),e,.9);animando=true;MAPA.alvos=null;MAPA.moveis=null;await espera(900);animando=false;MAPA.texto(P[A.para].x,P[A.para].y,'+'+(t.i+t.b+t.a),'#7dff9a');selecionar(A.para)}
async function atacar(){const A=atqEst;const pr=SIM.prepararAtaque([...A.fontes],A.alvo,A.frac);if(!pr.fontes.length)return;fecharAtq();desselecionar();animando=true;
 const alvo=A.alvo;const e=eraDe(S.jog);const tp=topo(pr.t);const ax=P[alvo].x,ay=P[alvo].y;let mx=ax,my=ay,dm=0;for(const f of pr.fontes){mx+=P[f.p].x;my+=P[f.p].y;dm=Math.max(dm,Math.hypot(P[f.p].x-ax,P[f.p].y-ay))}mx/=pr.fontes.length+1;my/=pr.fontes.length+1;
 const z=Math.max(1.2,Math.min(4.5,innerWidth*.55/Math.max(20,dm)));MAPA.voar(mx,my+60/z,z,.6);await espera(650);
 for(const f of pr.fontes){const k=topo(f.t);MAPA.marcha(P[f.p].x,P[f.p].y,ax,ay,k,e,1.5);if(f.t.a&&k!=='a')MAPA.marcha(P[f.p].x,P[f.p].y,ax,ay,'a',e,1.3)}
 await espera(1350);for(let i=0;i<7;i++){setTimeout(()=>{MAPA.explosao(ax+(Math.random()-.5)*16/MAPA.cam.z*2,ay+(Math.random()-.5)*12/MAPA.cam.z*2,Math.random()<.4?2:1)},i*150)}MAPA.tremer(.9);
 await espera(1200);if(!(S.mis>0)&&pr.alvo===MAPA.missao&&pr.chance>.5)pr.garantido=true;const r=SIM.executarAtaque(pr);MAPA.sujar();animando=false;if(r){if(r.vit)MAPA.onda(ax,ay,'#ffd34d');resultado(r)}}
function resultado(r){const e=eraDe(S.jog);const pa=r.pa.i+r.pa.b+r.pa.a,pd=r.pd.i+r.pd.b+r.pd.a;const el=$('#res');el.classList.remove('oculto');
 const perdas=(t,ed)=>TK.filter(k=>t[k]).map(k=>`<span><img src="${imgT(k,ed)}" alt="">−${t[k]}</span>`).join('')||'<span>nenhuma</span>';
 el.innerHTML=`<div class="res-c ${r.vit?'vit':'der'}" style="background-image:linear-gradient(180deg,rgba(0,0,0,.25),rgba(8,8,8,.92) 55%),url(img/era${S.eraMundo}.webp)">
  <div class="res-banner">${r.vit?'VITÓRIA!':'DERROTA'}</div>
  <h2>${r.vit?`${P[r.alvo].n} conquistada!`:`O ataque a ${P[r.alvo].n} falhou`}</h2>
  <img class="res-img ${r.vit?'':'cinza'}" src="${imgT(topo(r.env),e)}" alt="">
  <div class="res-tab"><div><small>Suas perdas</small><b>−${pa}</b><div class="mini3">${perdas(r.pa,e)}</div></div><div><small>Perdas ${SIM.deNac(r.dono)}</small><b>−${pd}</b><div class="mini3">${perdas(r.pd,eraDe(r.dono))}</div></div></div>
  <p class="ajuda">${r.vit?`Suas tropas agora ocupam ${P[r.alvo].n} (${SIM.total(S.prov[r.alvo])}). Cuidado com o contra-ataque!`:'Os sobreviventes voltaram. Junte mais tropas ou ataque de várias cidades ao mesmo tempo.'}</p>
  <button class="bt bt-ouro grande" data-ok>Continuar</button></div>`;
 el.querySelector('[data-ok]').onclick=()=>{el.classList.add('oculto');if(r.vit&&S.prov[r.alvo].d===S.jog)selecionar(r.alvo);else if(r.de[0]!=null&&S.prov[r.de[0]].d===S.jog)selecionar(r.de[0])}}
// ---------- diplomacia
function diploBts(d){if(d===S.jog||!S.nac[d])return '';const g=SIM.emGuerra(d,S.jog),a=SIM.aliado(d,S.jog);
 const c=SIM.temCom(d,S.jog);const com=g?'':c?`<button class="bt bt-com off" data-dip="cancelarcom" data-n="${d}">💔 Cancelar acordo</button>`:`<button class="bt bt-com" data-dip="comercio" data-n="${d}">💰 Acordo comercial</button>`;
 const aj=a&&SIM.precisaAjuda(d)?`<button class="bt bt-ajuda" data-dip="ajuda" data-n="${d}">🆘 Pedir ajuda na guerra</button>`:a&&SIM.guerrasDe(S.jog).length?`<span class="chip ali lutando">⚔️ Lutando ao seu lado</span>`:'';
 return g?`<button class="bt" data-dip="paz" data-n="${d}">🕊️ Propor paz</button>`:a?`${aj}${com}<button class="bt" data-dip="romper" data-n="${d}">Romper aliança</button>`:`<button class="bt" data-dip="alianca" data-n="${d}">🤝 Propor aliança</button>${com}<button class="bt perigo" data-dip="guerra" data-n="${d}">⚔️ Declarar guerra</button>`}
function ligarDiplo(root){const di=root.querySelector('#dImp');if(di)di.onclick=()=>infoImperio();root.querySelectorAll('[data-dip]').forEach(b=>b.onclick=()=>{const t=b.dataset.dip,d=b.dataset.n;if(t==='guerra'){modal(`<h3>Declarar guerra?</h3><p>Você vai entrar em guerra contra ${SIM.oNac(d)}${SIM.aliadosDe(d).length?' e os aliados podem ajudar o inimigo':''}.</p><div class="acoes"><button class="bt" data-fechar>Cancelar</button><button class="bt perigo" id="mSim">Declarar guerra</button></div>`);$('#mSim').onclick=()=>{fecharModal();const r=SIM.propor('guerra',d);toast(r.txt,'guerra');MAPA.sujar();atualizar()};return}
 const r=t==='ajuda'?SIM.pedirAjuda(d):SIM.propor(t,d);toast(r.txt,r.ok?'ok':'info');MAPA.sujar();atualizar()})}
function atualizar(){if(sheetTipo)renderSheet();if(painelAtual)renderPainel();hud()}
let propAberta=null;
function proximaProposta(){if(propAberta&&$('#modal').classList.contains('oculto'))propAberta=null;if(propAberta||!S.prop.length||animando||(S.mis||0)<1)return;const pr=S.prop[0];if(!S.nac[pr.de]||!S.nac[pr.de].vivo){S.prop.shift();return}propAberta=pr;
 const tit={paz:'Proposta de paz',ali:'Proposta de aliança',hist:'Momento histórico',ajuda:'Pedido de ajuda',com:'Acordo comercial'}[pr.tipo]||'Diplomacia';
 modal(`<div class="prop-cab">${band(pr.de)}<h3>${tit}</h3></div><p>${pr.txt}</p><div class="acoes"><button class="bt" id="pNao">${pr.tipo==='hist'?'Não, seguir em paz':'Recusar'}</button><button class="bt bt-ouro" id="pSim">${pr.tipo==='hist'?'Seguir a história':'Aceitar'}</button></div>`);
 $('#pSim').onclick=()=>{SIM.responder(pr,true);propAberta=null;fecharModal();MAPA.sujar();atualizar()};$('#pNao').onclick=()=>{SIM.responder(pr,false);propAberta=null;fecharModal();atualizar()}}
// ---------- painéis
$$('#nav button').forEach(b=>b.onclick=()=>{const p=b.dataset.p;if(p==='mapa'||painelAtual===p){fecharPainel();return}abrirPainel(p)});
$('#painelX').onclick=fecharPainel;
function abrirPainel(p){painelAtual=p;fecharSheet();if(modo)sairModo();$$('#nav button').forEach(b=>b.classList.toggle('ativo',b.dataset.p===p));$('#painel').classList.remove('oculto');$('#painelC').scrollTop=0;renderPainel();hud()}
function fecharPainel(){painelAtual=null;$('#painel').classList.add('oculto');$$('#nav button').forEach(b=>b.classList.toggle('ativo',b.dataset.p==='mapa'))}
function renderPainel(){const p=painelAtual;const c=$('#painelC');const T={pesquisa:'Pesquisa',diplo:'Diplomacia',noticias:'Notícias do mundo',menu:'Menu'};$('#painelT').textContent=T[p];
 const n=S.nac[S.jog];const e=S.eraMundo;
 if(p==='pesquisa'){const pz=SIM.PESQ.filter(z=>z.era===e);const feitos=pz.filter(z=>n.pq[z.id]).length;const ce=SIM.custoEra(e);
  c.innerHTML=`<div class="era-banner" style="background-image:linear-gradient(90deg,rgba(0,0,0,.85),rgba(0,0,0,.2)),url(img/era${e}.webp)"><small>ERA ATUAL</small><h2>${ERAS[e].nome}</h2><p>${ERAS[e].sub}</p></div>
  <div class="sec">Melhorias desta era</div><div class="pesq">${pz.map(z=>{const ok=n.pq[z.id];return `<div class="pz ${ok?'feito':''}"><img src="${imgT(z.k,e)}" alt=""><div class="pz-t"><b>${SIM.TIPOS[z.k].cat} +20%</b><small>${z.nome} · ${z.desc}</small></div>${ok?'<span class="max">✔ Feito</span>':`<button class="bt mini" data-pz="${z.id}">${icone('dinheiro',12)}${z.custo.din}${z.custo.pet?` ${icone('petroleo',12)}${z.custo.pet}`:''}</button>`}</div>`}).join('')}</div>
  ${e<3?`<div class="sec">Próxima era</div><div class="prox-era" style="background-image:linear-gradient(90deg,rgba(0,0,0,.88),rgba(0,0,0,.35)),url(img/era${e+1}.webp)"><h3>${ERAS[e+1].nome}</h3><p>${ERAS[e+1].ano} · ${ERAS[e+1].sub}</p><div class="imgs">${TK.map(k=>`<img src="${imgT(k,e+1)}" alt="">`).join('')}</div>
   <p class="req">${feitos>=2?'✔':'✖'} 2 melhorias desta era (${feitos}/3) · ${icone('dinheiro',12)}${ce.din} ${icone('petroleo',12)}${ce.pet}</p><button class="bt bt-ouro" data-era ${feitos>=2?'':'disabled'}>Avançar para ${ERAS[e+1].ano}</button><small>Ou espere o calendário chegar em ${ERAS[e+1].ano}. Avançar leva o mundo inteiro junto.</small></div>`:'<p class="ajuda">Você está na última era. Domine o mundo até 2030!</p>'}`;
  $$('#painelC [data-pz]').forEach(b=>b.onclick=()=>{const r=SIM.pesquisar(b.dataset.pz);if(r==='ok')toast('Pesquisa concluída! Suas tropas ficaram mais fortes.','ok');else toast(r);renderPainel();hud()});
  const be=c.querySelector('[data-era]');if(be)be.onclick=()=>{const r=SIM.avancarEra();if(r!=='ok'){toast(r);return}fecharPainel();MAPA.sujar()}}
 else if(p==='diplo'){const props=S.prop;const vivos=id=>S.nac[id]&&S.nac[id].vivo&&SIM.cidadesDe(id).length;const guerras=SIM.guerrasDe(S.jog).filter(vivos),alis=SIM.aliadosDe(S.jog).filter(vivos);const viz=SIM.vizinhosNac(S.jog).filter(x=>!guerras.includes(x)&&!alis.includes(x));
  const cont={};S.prov.forEach(q=>cont[q.d]=(cont[q.d]||0)+1);const grandes=Object.keys(S.nac).filter(id=>id!==S.jog&&vivos(id)&&!guerras.includes(id)&&!alis.includes(id)&&!viz.includes(id)).sort((a,b)=>(cont[b]||0)-(cont[a]||0)).slice(0,6);
  const relTxt=id=>{const r=SIM.rel(id,S.jog);return r>=40?'<i class="rb">ótima</i>':r>=10?'<i class="rb">boa</i>':r>-15?'neutra':r>-40?'<i class="rm">ruim</i>':'<i class="rm">péssima</i>'};const coms=SIM.comerciosDe(S.jog).filter(vivos);const bc=SIM.bonusCom(S.jog);
  const linha=id=>`<div class="nrow">${band(id)}<div class="nr-t"><b>${SIM.nomeNac(id)}</b><small>${cont[id]||0} cidades · ${PERSONAS[S.nac[id].persona].n} · relação ${relTxt(id)}</small>${SIM.temCom(id,S.jog)?`<small class="tag-com">💰 Acordo comercial: +${SIM.valorComCom(id,S.jog)}/dia</small>`:''}</div><div class="nr-b">${diploBts(id)}</div></div>`;
  c.innerHTML=`${props.length?`<div class="sec">Propostas (${props.length})</div>${props.map((pr,i)=>`<div class="prop">${band(pr.de)}<p>${pr.txt}</p><div class="acoes"><button class="bt" data-pn="${i}">Recusar</button><button class="bt bt-ouro" data-ps="${i}">Aceitar</button></div></div>`).join('')}`:''}
  <button class="imp-box" id="dImp"><div><b>${S.nac[S.jog].tier?SIM.TIERS[S.nac[S.jog].tier].ic+' '+SIM.nomeNac(S.jog)+' · nível '+S.nac[S.jog].tier+'/3':'🏳️ Sem título imperial'}</b><small>${proxTierTxt()}</small></div><div class="am-mini"><small>Ameaça: ${SIM.ameacaTxt(S.ameaca||0)}</small><span class="am-bar"><i style="width:${Math.max(4,S.ameaca||0)}%;background:${(S.ameaca||0)>=70?'#ff4a3a':(S.ameaca||0)>=40?'#ffb02e':'#6fe39a'}"></i></span></div></button>
  <div class="com-box"><b>💰 Acordos comerciais (${coms.length}/6)</b><span>${coms.length?`Rendendo <b>+${bc.din.toFixed(0)}</b> de dinheiro e <b>+${bc.pet.toFixed(1)}</b> de petróleo por dia.`:'Feche acordos com países em paz: os dois ganham dinheiro e petróleo todo dia.'}</span>${coms.length?`<div class="com-l">${coms.map(id=>band(id)+' '+SIM.nomeNac(id)).join(' · ')}</div>`:''}</div>
  <div class="sec">Em guerra (${guerras.length})</div>${guerras.map(linha).join('')||'<p class="ajuda">Você está em paz com todos.</p>'}
  <div class="sec">Aliados (${alis.length})</div>${alis.map(linha).join('')||'<p class="ajuda">Nenhum aliado. Ter um inimigo em comum ajuda a fechar alianças.</p>'}
  <div class="sec">Vizinhos</div>${viz.map(linha).join('')||'<p class="ajuda">—</p>'}
  <div class="sec">Potências</div>${grandes.map(linha).join('')}`;
  $$('#painelC [data-ps]').forEach(b=>b.onclick=()=>{SIM.responder(S.prop[+b.dataset.ps],true);MAPA.sujar();renderPainel();hud()});$$('#painelC [data-pn]').forEach(b=>b.onclick=()=>{SIM.responder(S.prop[+b.dataset.pn],false);renderPainel();hud()});ligarDiplo(c)}
 else if(p==='noticias'){lidas=S.news.length;const IC={guerra:'⚔️',paz:'🕊️',alianca:'🤝',traicao:'🗡️',revolta:'🔥',era:'🕰️',conquista:'🏴',info:'📰'};
  c.innerHTML=S.news.slice(0,80).map(x=>`<div class="news ${x.meu?'meu':''}"><span class="ic">${IC[x.tipo]||'📰'}</span><div><p>${x.txt}</p><small>${SIM.dataTxt(x.dia)}</small></div></div>`).join('')}
 else if(p==='menu'){const cont={};S.prov.forEach(q=>cont[q.d]=(cont[q.d]||0)+1);const rk=Object.keys(cont).filter(id=>S.nac[id]).sort((a,b)=>cont[b]-cont[a]).slice(0,10);
  c.innerHTML=`<div class="stats"><div><b>${cont[S.jog]||0}</b><small>cidades</small></div><div><b>${S.stats.conq}</b><small>conquistas</small></div><div><b>${S.stats.vit}</b><small>vitórias</small></div><div><b>${S.stats.perd}</b><small>perdidas</small></div></div>
  <div class="sec">Ranking mundial</div>${rk.map((id,i)=>`<div class="nrow ${id===S.jog?'eu':''}"><span class="pos">${i+1}</span>${band(id)}<div class="nr-t"><b>${SIM.nomeNac(id)}</b><small>${cont[id]} cidades</small></div></div>`).join('')}
  <div class="menu-bts"><button class="bt" id="mSalvar">💾 Salvar jogo</button><button class="bt" id="mComo">❓ Como jogar</button><button class="bt" id="mMis">🎯 Ver missão</button><button class="bt perigo" id="mSair">🏠 Sair para o início</button></div>`;
  $('#mSalvar').onclick=()=>{salvar();toast('Jogo salvo neste aparelho.','ok')};$('#mComo').onclick=()=>comoJogar();$('#mMis').onclick=()=>{fecharPainel();missaoInfo()};$('#mSair').onclick=()=>{salvar();location.reload()}}}
// ---------- modal
let depoisModal=null;
function modal(h,depois){$('#modalC').innerHTML=h;$('#modal').classList.remove('oculto');depoisModal=depois||null;$$('#modalC [data-fechar]').forEach(b=>b.onclick=fecharModal)}
function fecharModal(){$('#modal').classList.add('oculto');const d=depoisModal;depoisModal=null;if(d)d()}
// ---------- cinemática de era
function cinematica(e,depois){const c=$('#cine');c.classList.remove('oculto');const n=S.nac[S.jog];
 c.innerHTML=`<div class="cine-fundo" style="background-image:url(img/era${e}.webp)"></div><div class="cine-c"><small>ERA ${e+1} DE 4</small><div class="ano">${ERAS[e].ano}</div><h2>${ERAS[e].nome}</h2><p class="lema">“${ERAS[e].lema}”</p>
  <div class="cine-tropas">${TK.map((k,i)=>`<div style="animation-delay:${.3+i*.2}s"><img src="${imgT(k,e)}" alt=""><small>${nomeT(k,e)}</small></div>`).join('')}</div>
  <p class="sub">${e?'Suas tropas evoluíram automaticamente.':'Você comanda '+SIM.oNac(S.jog)+'.'}</p><button class="bt bt-ouro grande" id="cOk">${e?'Continuar':'Começar a guerra'}</button></div>`;
 $('#cOk').onclick=()=>{c.classList.add('oculto');if(depois)depois()}}
// ---------- missões
const MIS=[
 {id:'atk',t:'Ataque a cidade marcada',d:'Toque na cidade com a <b>seta laranja</b> e depois em <b>ATACAR</b>.',ok:b=>S.stats.vit+S.stats.der>b.vd,alvo:1,premio:200},
 {id:'rec',t:'Recrute 3 tropas',d:'Toque numa cidade sua e use os botões <b>+1</b>.',ok:b=>S.stats.rec>=b.rec+3,premio:150},
 {id:'mov',t:'Mova tropas para a fronteira',d:'Toque na cidade marcada, aperte <b class="verde">🚚 Mover tropas</b> e escolha uma cidade <b class="verde">verde</b> na fronteira.',ok:b=>S.stats.mov>b.mov,origem:1,premio:100},
 {id:'ref',t:'Coloque seus reforços',d:'Todo mês chegam reforços. Toque em <b>🎖️ reforços</b> lá em cima e depois numa cidade sua.',ok:b=>(S.stats.ref||0)>b.ref,premio:100},
 {id:'conq',t:'Conquiste 3 cidades',d:'Ataque cidades vizinhas. Some tropas de várias cidades para ataques fortes.',ok:b=>S.stats.conq>=b.conq+3,prog:b=>[S.stats.conq-b.conq,3],alvo:1,premio:300},
 {id:'cons',t:'Construa uma Fábrica ou Fortaleza',d:'Toque numa cidade sua e role até <b>Construções</b>.',ok:b=>S.stats.cons>b.cons,premio:150},
 {id:'pesq',t:'Pesquise uma melhoria',d:'Abra <b>Pesquisa</b> no menu de baixo e deixe suas tropas mais fortes.',ok:b=>S.stats.pesq>b.pesq,premio:200},
 {id:'cap',t:'Conquiste uma capital inimiga',d:'Capitais têm uma ★. Elas dão +20% de defesa, então junte bastante tropa.',ok:b=>(S.stats.caps||0)>b.caps,alvo:2,premio:500},
 {id:'era',t:'Avance para a próxima era',d:'Em <b>Pesquisa</b>, faça 2 melhorias e avance de era (ou espere o calendário).',ok:b=>S.eraMundo>b.era,premio:600},
 {id:'imp',t:'Proclame um Reino',d:'Conquiste cidades até aparecer o botão <b>👑 Proclamar</b> lá em cima.',prog:b=>{const t=(S.nac[S.jog].tier||0)+1;return t<SIM.TIERS.length?[SIM.cresc(S.jog),SIM.precisa(S.jog,t)]:null},ok:b=>(S.stats.imp||0)>(b.imp||0),premio:300},
 {id:'conq2',t:'Conquiste 10 cidades',d:'Expanda seu país. Use reforços nas fronteiras.',ok:b=>S.stats.conq>=b.conq+10,prog:b=>[S.stats.conq-b.conq,10],alvo:1,premio:800}];
function misAtual(){const i=S.mis||0;return i<MIS.length?MIS[i]:MIS[MIS.length-1-(i-MIS.length)%2]}
function base(){return {vd:S.stats.vit+S.stats.der,rec:S.stats.rec,mov:S.stats.mov,ref:S.stats.ref||0,conq:S.stats.conq,cons:S.stats.cons,pesq:S.stats.pesq,caps:S.stats.caps||0,era:S.eraMundo,imp:S.stats.imp||0}}
function origemSugerida(){const cs=SIM.cidadesDe(S.jog);const int=cs.filter(p=>!SIM.viz(p).some(q=>S.prov[q].d!==S.jog));const l=(int.length?int:cs).filter(p=>SIM.total(S.prov[p])>=3);l.sort((a,b)=>SIM.total(S.prov[b])-SIM.total(S.prov[a]));return l[0]??S.nac[S.jog].cap}
function alvoSugerido(cap){let best=null,bs=-1e9;const meus=SIM.cidadesDe(S.jog);const vist=new Set();
 for(const m of meus)for(const q of SIM.viz(m)){if(vist.has(q))continue;vist.add(q);const d=S.prov[q].d;if(d===S.jog||SIM.aliado(d,S.jog))continue;if(cap&&!SIM.ehCapital(q))continue;const f=SIM.fontesPara(q);if(!f.length)continue;const pr=SIM.prepararAtaque(f,q,1);let s=pr.chance+(SIM.emGuerra(d,S.jog)?.35:0)+(SIM.porMar(f[0],q)?-.15:0)-SIM.cidadesDe(d).length/400;const C=SIM.P[S.nac[S.jog].cap],Q=SIM.P[q];s-=Math.hypot(C.x-Q.x,C.y-Q.y)/(SIM.MW||2000)*3;if(s>bs){bs=s;best=q}}
 if(cap&&best==null)return alvoSugerido(false);return best}
function missoes(abrir){if(!S||demo||!S.nac[S.jog])return;S.misIni=S.misIni||{};let m=misAtual();const k=(S.mis||0)+'';if(!S.misIni[k])S.misIni[k]=base();const b=S.misIni[k];
 if(m.ok(b)){S.nac[S.jog].din+=m.premio;toast(`🎯 Missão cumprida: <b>${m.t}</b> · +${m.premio} ${icone('dinheiro',12)}`,'ok');S.mis=(S.mis||0)+1;m=misAtual();S.misIni[S.mis+'']=base();abrir=true;MAPA.missao=null}
 if(m.origem){const a=MAPA.missao;if(a==null||S.prov[a].d!==S.jog||SIM.total(S.prov[a])<3)MAPA.missao=origemSugerida()}else if(m.alvo){const a=MAPA.missao;if(a==null||S.prov[a].d===S.jog||!SIM.fontesPara(a).length)MAPA.missao=alvoSugerido(m.alvo===2)}else MAPA.missao=null;
 const bb=S.misIni[(S.mis||0)+''];const pg=m.prog?m.prog(bb):null;
 $('#missao').innerHTML=`<span class="mi">🎯</span><span class="mt"><small>MISSÃO ${(S.mis||0)+1}</small><b>${m.t}${pg?` (${Math.max(0,pg[0])}/${pg[1]})`:''}</b></span>`;
 if(abrir)missaoInfo(true)}
function missaoInfo(auto){const m=misAtual();dica(`<b>🎯 ${m.t}</b><br>${m.d}`);if(m.alvo&&MAPA.missao!=null){const p=P[MAPA.missao];const z=Math.max(2.2,MAPA.cam.z);MAPA.voar(p.x,p.y+40/z,z,.8)}clearTimeout(missaoInfo.t);missaoInfo.t=setTimeout(()=>{if(!modo)dica(null)},9000)}
$('#missao').onclick=()=>missaoInfo();
// ---------- eventos da simulação
let ultAli=-99;SIM.onNoticia=n=>{if(demo)return;if(n.tipo==='era')return;if(n.tipo==='aliado')return;if(n.tipo==='aliado_vit'||(n.tipo==='alianca'&&/enviou|enviaram/.test(n.txt))||(n.tipo==='guerra'&&/enviou|enviaram/.test(n.txt))){if(S.dia-ultAli<12)return;ultAli=S.dia;toast(n.txt,n.tipo==='guerra'?'guerra':'ok');return}if(n.tipo==='imperio'&&!n.txt.includes(SIM.nomeNac(S.jog))){toast(n.txt,'info');return}if(n.tipo==='ameaca'){toast(n.txt,'guerra');return}if(n.meu){const tp=n.tipo==='paz'||n.tipo==='alianca'?'ok':n.tipo==='guerra'||n.tipo==='traicao'||n.tipo==='conquista'?'guerra':'info';toast(n.txt,tp)}};
SIM.onBatalha=r=>{if(demo||r.id===S.jog)return;const p=P[r.alvo];if(r.dono===S.jog){MAPA.explosao(p.x,p.y,2);if(r.vit){toast(`🏴 ${SIM.OoNac(r.id)} ${SIM.V(r.id,'tomou','tomaram')} <b>${p.n}</b>!`,'guerra')}else{toast(`🛡️ Defendemos <b>${p.n}</b> do ataque ${SIM.deNac(r.id)}!`,'ok');MAPA.texto(p.x,p.y,'DEFENDIDA','#7dff9a')}}else{const [sx,sy]=MAPA.W2S(p.x,p.y);if(sx>0&&sy>0&&sx<innerWidth&&sy<innerHeight&&Math.random()<.6)MAPA.explosao(p.x,p.y,1)}};
SIM.onConquista=(p,id,antigo)=>{MAPA.sujar();if(sheetP===p||sel===p){if(S.prov[p].d!==S.jog&&sel===p)desselecionar();else if(sheetTipo)renderSheet()}else if(sel!=null)selecionar(sel)};
SIM.onReforco=r=>{if(demo)return;toast(`🎖️ Chegaram <b>${r} reforços</b>! Toque no botão 🎖️ lá em cima para colocá-los.`,'ok')};
SIM.onEra=e=>{if(demo)return;MAPA.sujar();setTimeout(()=>cinematica(e),animando?3000:100)};
SIM.onDerrota=()=>{modal(`<h3>Seu país caiu</h3><p>${SIM.OoNac(S.jog)} foi derrotad${SIM.artigo(S.jog)==='a'?'a':'o'} em ${SIM.dataTxt(S.dia)}. Você conquistou ${S.stats.conq} cidades.</p><div class="acoes"><button class="bt bt-ouro" id="mNovo">Nova campanha</button></div>`);$('#mNovo').onclick=()=>{localStorage.removeItem(SAVE);location.reload()}};
SIM.onFim=()=>{if(S.fim)return;S.fim=1;const cont={};S.prov.forEach(q=>cont[q.d]=(cont[q.d]||0)+1);const rk=Object.keys(cont).sort((a,b)=>cont[b]-cont[a]);const pos=rk.indexOf(S.jog)+1;modal(`<h3>Fim da campanha: 2030</h3><p>Você atravessou todas as guerras! ${SIM.OoNac(S.jog)} terminou em <b>${pos}º lugar</b> no mundo, com ${cont[S.jog]||0} cidades.</p><div class="acoes"><button class="bt bt-ouro" data-fechar>Continuar jogando</button></div>`)};
// ---------- salvar
function salvar(){if(demo||!S||!S.nac[S.jog])return;try{localStorage.setItem(SAVE,SIM.exportar())}catch(e){}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)salvar()});
window.__G={get S(){return SIM.get()},SIM,MAPA,iniciar:id=>{S=SIM.novo(id);iniciarJogo(false);S.mis=0;S.misIni={};missoes(true)},setVel,selecionar,abrirAtaque,abrirMover,abrirPainel,fecharPainel,salvar,cinematica,missoes,get vel(){return vel},get animando(){return animando},fecharCine:()=>{$('#cine').classList.add('oculto')},fecharModal};
