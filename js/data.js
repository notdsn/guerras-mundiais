// Dados do jogo: eras, nações, unidades, prédios, pesquisas
'use strict';
const ERAS=[
 {id:0,nome:'1ª Guerra Mundial',curto:'1ª GUERRA',ano:1914,lema:'A guerra que acabaria com todas as guerras.',sub:'Trincheiras, cavalaria, encouraçados e os primeiros aviões.'},
 {id:1,nome:'2ª Guerra Mundial',curto:'2ª GUERRA',ano:1939,lema:'O mundo inteiro em chamas.',sub:'Blitzkrieg, tanques, bombardeiros pesados e porta-aviões.'},
 {id:2,nome:'Guerra Fria',curto:'GUERRA FRIA',ano:1947,lema:'Dois blocos. Um mundo dividido.',sub:'Jatos, helicópteros, submarinos nucleares e mísseis.'},
 {id:3,nome:'Guerra Moderna',curto:'GUERRA MODERNA',ano:1991,lema:'Guerra de precisão. Guerra de drones.',sub:'Drones, caças furtivos, tanques modernos e mísseis de cruzeiro.'}];
// Tema visual do mapa por era
const TEMAS=[
 {oceano:['#4d6b6c','#2f4a4f'],costa:'#8fb0a6',terra:'#d2bc8f',fillA:.62,borda:'#3b2412',prov:'rgba(70,45,20,.35)',txt:'#2a1a0c',txtSombra:'rgba(255,240,210,.7)',fonte:'Georgia, "Times New Roman", serif',grade:'rgba(60,40,20,.10)',acento:'#c9a24a',neblina:'rgba(60,45,30,.42)'},
 {oceano:['#33474c','#1c2a2f'],costa:'#6f8a83',terra:'#9b9468',fillA:.58,borda:'#15140c',prov:'rgba(20,20,10,.35)',txt:'#15140c',txtSombra:'rgba(230,225,190,.65)',fonte:'Oswald, Impact, sans-serif',grade:'rgba(20,20,10,.10)',acento:'#c4b26f',neblina:'rgba(20,24,18,.45)'},
 {oceano:['#0f2a44','#071524'],costa:'#2b6f9c',terra:'#2c4357',fillA:.5,borda:'#a9e3ff',prov:'rgba(160,220,255,.18)',txt:'#e6f6ff',txtSombra:'rgba(0,10,25,.8)',fonte:'Oswald, Impact, sans-serif',grade:'rgba(80,190,255,.10)',acento:'#4fd1ff',neblina:'rgba(2,10,22,.5)'},
 {oceano:['#08121c','#03070c'],costa:'#1d5a58',terra:'#1b252e',fillA:.42,borda:'#5cffd6',prov:'rgba(120,255,220,.14)',txt:'#eafff8',txtSombra:'rgba(0,0,0,.85)',fonte:'Oswald, Impact, sans-serif',grade:'rgba(60,255,200,.07)',acento:'#36f1c5',neblina:'rgba(0,4,8,.55)'}];
const TERRENOS={pla:{n:'Planície',def:1,vel:1,cor:null},flo:{n:'Floresta',def:.8,vel:.85,cor:'#4f6b3a'},sel:{n:'Selva',def:.75,vel:.7,cor:'#3e6b35'},mon:{n:'Montanha',def:.6,vel:.65,cor:'#8a7358'},des:{n:'Deserto',def:1,vel:.85,cor:'#d9bf83'},fri:{n:'Gelo/Tundra',def:.85,vel:.7,cor:'#dfe6ea'},urb:{n:'Cidade grande',def:.7,vel:1,cor:'#9a8e80'}};
const RECURSOS=[['comida','Comida'],['bens','Bens'],['metal','Metal'],['petroleo','Petróleo'],['raros','Raros'],['dinheiro','Dinheiro'],['homens','Soldados']];
// Mapa de 1914: dono inicial por código do país moderno
const IMPERIOS={
 GBR:'GBR IRL CAN AUS NZL IND PAK BGD LKA MMR MYS SGP BRN EGY SDN SSD KEN UGA ZAF ZWE ZMB MWI BWA LSO SWZ NGA GHA SLE GMB CYP MLT GUY BLZ JAM BHS TTO FLK KWT QAT ARE BHR OMN FJI SLB VUT PNG',
 FRA:'FRA DZA TUN MAR SEN MLI MRT NER TCD BFA GIN CIV BEN CAF COG GAB MDG VNM LAO KHM DJI NCL PYF COM',
 DEU:'DEU NAM CMR TGO TZA RWA BDI',
 RUS:'RUS FIN EST LVA LTU POL BLR UKR MDA GEO ARM AZE KAZ UZB TKM KGZ TJK',
 AUT:'AUT HUN CZE SVK SVN HRV BIH',
 TUR:'TUR SYR IRQ LBN ISR PSE JOR SAU YEM',
 ITA:'ITA LBY ERI SOM',ESP:'ESP GNQ',PRT:'PRT AGO MOZ GNB TLS',BEL:'BEL COD',NLD:'NLD IDN SUR',
 USA:'USA PHL PRI',JPN:'JPN KOR PRK TWN',DNK:'DNK ISL GRL FRO',SRB:'SRB MKD KOS',CHN:'CHN'};
const NUCLEOS={GBR:'GBR IRL',RUS:'RUS UKR BLR',AUT:'AUT HUN CZE SVK SVN HRV BIH',DEU:'DEU',TUR:'TUR',JPN:'JPN',SRB:'SRB MKD KOS',DNK:'DNK FRO',USA:'USA',NLD:'NLD',BEL:'BEL',CHN:'CHN'};
const NOMES={GBR:['Império Britânico','Reino Unido','Reino Unido','Reino Unido'],FRA:['França','França','França','França'],DEU:['Império Alemão','Alemanha','Alemanha','Alemanha'],
 RUS:['Império Russo','União Soviética','União Soviética','Rússia'],AUT:['Áustria-Hungria','Áustria','Áustria','Áustria'],TUR:['Império Otomano','Turquia','Turquia','Turquia'],
 ITA:['Reino da Itália','Itália','Itália','Itália'],JPN:['Império do Japão','Império do Japão','Japão','Japão'],USA:['Estados Unidos','Estados Unidos','Estados Unidos','Estados Unidos'],
 CHN:['República da China','China','China','China'],IRN:['Pérsia','Irã','Irã','Irã'],THA:['Sião','Tailândia','Tailândia','Tailândia'],SRB:['Sérvia','Iugoslávia','Iugoslávia','Sérvia'],
 ESP:['Espanha','Espanha','Espanha','Espanha'],PRT:['Portugal','Portugal','Portugal','Portugal'],BRA:['Brasil','Brasil','Brasil','Brasil'],NLD:['Países Baixos','Países Baixos','Países Baixos','Países Baixos'],
 BEL:['Bélgica','Bélgica','Bélgica','Bélgica'],DNK:['Dinamarca','Dinamarca','Dinamarca','Dinamarca'],ETH:['Abissínia','Etiópia','Etiópia','Etiópia']};
const CORES={GBR:'#d0453c',FRA:'#3f72cf',DEU:'#5b6168',RUS:'#3d9a57',AUT:'#e2bb45',TUR:'#9a6232',ITA:'#3fb7a6',JPN:'#e2789a',USA:'#6d93e0',CHN:'#e7cf72',BRA:'#2dbe6c',ESP:'#e5963a',PRT:'#7f9b2e',NLD:'#f07f1e',BEL:'#b49128',DNK:'#b2385a',SRB:'#9e5fd0',ARG:'#7fc6ea',MEX:'#a3c25a',SWE:'#5aa3c9',NOR:'#c85a3c',IRN:'#5fbf9a',ETH:'#c7a75e',CHL:'#c96b8c',GRC:'#4c8ed6',ROU:'#d2a03a',BGR:'#6aa04a',THA:'#c86fd8',CHE:'#c4504d',AFG:'#a08060'};
// Personalidades da IA
const PERSONAS={agressivo:{n:'Agressivo',guerra:1.6,trai:.2,paz:.5},expansionista:{n:'Expansionista',guerra:1.3,trai:.3,paz:.7},defensivo:{n:'Defensivo',guerra:.5,trai:.1,paz:1.3},
 traicoeiro:{n:'Traiçoeiro',guerra:1.1,trai:1.5,paz:.9},leal:{n:'Leal',guerra:.8,trai:0,paz:1},oportunista:{n:'Oportunista',guerra:1.1,trai:.7,paz:1},pacifico:{n:'Pacífico',guerra:.25,trai:.05,paz:1.6}};
const PERSONA_FIXA={DEU:'agressivo',RUS:'expansionista',GBR:'leal',FRA:'defensivo',AUT:'leal',TUR:'oportunista',ITA:'traicoeiro',JPN:'expansionista',USA:'pacifico',BRA:'pacifico',CHN:'defensivo',SRB:'agressivo',BGR:'oportunista',ROU:'oportunista',ESP:'pacifico',CHE:'pacifico',SWE:'pacifico'};
// Unidades. atk: s=infantaria/leves a=blindados r=aéreos n=navais
const UNIDADES={
 inf:{cls:'s',era0:0,nomes:['Infantaria','Infantaria','Infantaria Mecanizada','Forças Especiais'],hp:20,atk:{s:6,a:2,r:1,n:0},vel:[30,38,60,75],custo:{dinheiro:50,comida:30,homens:20},dias:6,req:'qua',desc:'Base do exército. Segura território.'},
 arm:{cls:'a',era0:0,nomes:['Cavalaria','Tanque Médio','Tanque de Batalha','Tanque Moderno'],hp:28,atk:{s:8,a:7,r:1,n:0},vel:[60,55,70,85],custo:{dinheiro:90,comida:20,metal:30,petroleo:10,homens:12},dias:9,req:'qua',reqF:1,desc:'Rápido e forte. Rompe as linhas inimigas.'},
 art:{cls:'s',era0:0,nomes:['Artilharia de Campo','Obuseiro','Lança-Foguetes','Artilharia de Precisão'],hp:12,atk:{s:12,a:6,r:0,n:2},vel:[24,30,50,70],custo:{dinheiro:70,metal:25,bens:15,homens:10},dias:8,req:'qua',desc:'Destrói tropas de longe. Frágil sozinha.'},
 aa:{cls:'s',era0:0,pesq:1,nomes:['Canhão Antiaéreo','Bateria Flak','Mísseis SAM','Defesa Aérea'],hp:14,atk:{s:2,a:1,r:13,n:0},vel:[25,30,45,60],custo:{dinheiro:60,metal:20,bens:15,homens:8},dias:7,req:'qua',desc:'Derruba aviões, helicópteros e drones.'},
 fig:{cls:'r',era0:0,pesq:1,aereo:1,nomes:['Caça Biplano','Caça','Caça a Jato','Caça Furtivo'],hp:14,atk:{s:3,a:2,r:13,n:2},vel:[900,1600,3000,3600],alc:[350,800,1500,2200],custo:{dinheiro:90,petroleo:20,bens:20,raros:5,homens:4},dias:9,req:'aer',desc:'Domina o céu. Abate aviões inimigos.'},
 bom:{cls:'r',era0:0,pesq:1,aereo:1,nomes:['Bombardeiro Biplano','Bombardeiro Pesado','Bombardeiro Estratégico','Bombardeiro Furtivo'],hp:16,atk:{s:12,a:9,r:1,n:9},vel:[700,1300,2400,2800],alc:[450,1300,4000,6000],custo:{dinheiro:130,petroleo:30,bens:25,raros:8,homens:5},dias:12,req:'aer',desc:'Ataque aéreo devastador contra tropas e navios.'},
 hel:{cls:'r',era0:2,nomes:['','','Helicóptero de Ataque','Helicóptero Apache'],hp:18,atk:{s:11,a:12,r:2,n:4},vel:[0,0,320,380],custo:{dinheiro:140,petroleo:30,bens:30,raros:10,homens:4},dias:10,req:'aer',desc:'Voa baixo sobre o terreno. Caçador de tanques.'},
 dro:{cls:'r',era0:3,aereo:1,nomes:['','','','Drone de Ataque'],hp:8,atk:{s:10,a:10,r:0,n:6},vel:[0,0,0,1400],alc:[0,0,0,1600],custo:{dinheiro:70,bens:20,raros:12},dias:5,req:'fab',desc:'Barato, sem piloto, ataque de precisão.'},
 mis:{cls:'m',era0:2,missil:1,nomes:['','','Míssil Balístico','Míssil de Cruzeiro'],hp:1,atk:{s:60,a:50,r:0,n:60},vel:[0,0,6000,4000],alc:[0,0,3000,3500],custo:{dinheiro:220,petroleo:20,raros:40,bens:20},dias:12,req:'fab',reqF:2,desc:'Uso único. Destrói tudo no alvo.'},
 nav:{cls:'n',era0:0,naval:1,nomes:['Encouraçado','Encouraçado','Cruzador de Mísseis','Destróier Moderno'],hp:45,atk:{s:7,a:5,r:4,n:13},vel:[380,450,550,600],custo:{dinheiro:180,metal:60,petroleo:25,homens:10},dias:16,req:'por',desc:'Controla os mares e bombardeia a costa.'},
 sub:{cls:'u',era0:0,pesq:1,naval:1,nomes:['Submarino U-Boat','Submarino','Submarino Nuclear','Submarino Furtivo'],hp:22,atk:{s:0,a:0,r:0,n:17},vel:[300,380,550,600],custo:{dinheiro:130,metal:40,petroleo:15,homens:6},dias:12,req:'por',desc:'Invisível. Afunda navios de surpresa.'},
 car:{cls:'n',era0:1,naval:1,nomes:['','Porta-Aviões','Porta-Aviões Nuclear','Superporta-aviões'],hp:60,atk:{s:9,a:7,r:11,n:12},vel:[0,400,520,560],custo:{dinheiro:300,metal:90,petroleo:40,bens:40,homens:12},dias:22,req:'por',reqF:2,desc:'Base aérea flutuante. Ataca longe.'}};
const ORDEM_UNID=['inf','arm','art','aa','fig','bom','hel','dro','mis','nav','sub','car'];
const ERA_MULT=e=>[1,1.65,2.6,3.9][e]; const CUSTO_MULT=e=>[1,1.35,1.8,2.3][e];
const PREDIOS={qua:{n:'Quartel',d:'Permite recrutar tropas.',max:3,custo:{dinheiro:120,bens:40},dias:10},
 fab:{n:'Fábrica',d:'+25% produção por nível. Libera blindados e mísseis.',max:3,custo:{dinheiro:200,metal:60,bens:30},dias:16},
 por:{n:'Porto',d:'Constrói navios e abriga a frota.',max:3,custo:{dinheiro:180,metal:50},dias:14},
 aer:{n:'Aeródromo',d:'Base para aviões e helicópteros.',max:3,custo:{dinheiro:160,metal:30,petroleo:20},dias:12},
 fer:{n:'Ferrovia',d:'+50% velocidade das tropas e +10% produção.',max:1,custo:{dinheiro:100,metal:40},dias:10},
 fort:{n:'Fortificação',d:'Tropas defendendo levam menos dano.',max:4,custo:{dinheiro:90,metal:20,homens:10},dias:9}};
// Árvore de pesquisa: id, era, nome, desc, efeito
function montarPesquisas(){const L=[];
 const UN=['inf','arm','art','aa','fig','bom','hel','dro','mis','nav','sub','car'];
 for(let e=0;e<4;e++){
  for(const u of UN){const U=UNIDADES[u];if(!U.nomes[e])continue;if(e===0&&!U.pesq)continue;L.push({id:u+e,era:e,tipo:'unid',u,nome:U.nomes[e],desc:'Libera: '+U.nomes[e]+'.',dias:[14,20,26,30][e]})}
  L.push({id:'eco'+e,era:e,tipo:'eco',nome:['Economia de Guerra','Produção em Massa','Automação','Economia Digital'][e],desc:'+15% de produção em todas as províncias.',dias:[16,22,28,32][e]});
  L.push({id:'dou'+e,era:e,tipo:'dou',nome:['Táticas de Trincheira','Blitzkrieg','Armas Combinadas','Guerra em Rede'][e],desc:'+12% de ataque para todas as tropas.',dias:[16,22,28,32][e]});
  L.push({id:'log'+e,era:e,tipo:'log',nome:['Logística Ferroviária','Motorização','Transporte Aéreo','Logística por Satélite'][e],desc:'+15% de velocidade e menos gasto de comida.',dias:[14,20,26,30][e]});
  if(e<3)L.push({id:'era'+(e+1),era:e,tipo:'era',nome:'Rumo à '+ERAS[e+1].nome,desc:'Entra na próxima era antes do calendário (precisa de 5 pesquisas desta era).',dias:[30,36,40][e]});
 }return L}
const PESQUISAS=montarPesquisas();
// Eventos históricos de 1914 (dia após o início, ação)
const EVENTOS_1914=[
 {d:0,t:'guerra',a:'AUT',b:'SRB',txt:'Áustria-Hungria declara guerra à Sérvia após o assassinato do arquiduque Francisco Ferdinando.'},
 {d:3,t:'guerra',a:'DEU',b:'RUS',txt:'Alemanha declara guerra à Rússia, que mobilizou suas tropas para defender a Sérvia.'},
 {d:5,t:'guerra',a:'DEU',b:'FRA',txt:'Alemanha declara guerra à França e põe em marcha o Plano Schlieffen.'},
 {d:6,t:'guerra',a:'DEU',b:'BEL',txt:'Tropas alemãs invadem a Bélgica neutra a caminho de Paris.'},
 {d:7,t:'guerra',a:'GBR',b:'DEU',txt:'O Império Britânico declara guerra à Alemanha em defesa da Bélgica.'},
 {d:10,t:'guerra',a:'FRA',b:'AUT',txt:'França e Áustria-Hungria entram em guerra.'},
 {d:23,t:'guerra',a:'JPN',b:'DEU',txt:'O Japão declara guerra à Alemanha e mira suas colônias no Pacífico.'},
 {d:95,t:'alianca',a:'TUR',b:'DEU',txt:'O Império Otomano se une às Potências Centrais.'},
 {d:96,t:'guerra',a:'TUR',b:'RUS',txt:'Navios otomanos bombardeiam portos russos no Mar Negro.'},
 {d:300,t:'traicao',a:'ITA',b:'AUT',txt:'TRAIÇÃO! A Itália rompe com a Tríplice Aliança e declara guerra à Áustria-Hungria.'},
 {d:440,t:'guerra',a:'BGR',b:'SRB',txt:'A Bulgária entra na guerra ao lado das Potências Centrais.'},
 {d:760,t:'guerra',a:'ROU',b:'AUT',txt:'A Romênia declara guerra à Áustria-Hungria.'},
 {d:980,t:'guerra',a:'USA',b:'DEU',txt:'Após ataques de submarinos, os Estados Unidos entram na guerra contra a Alemanha.'},
 {d:1180,t:'guerra',a:'BRA',b:'DEU',txt:'O Brasil declara guerra à Alemanha após navios brasileiros serem afundados.'}];
const ALIANCAS_1914=[['GBR','FRA'],['GBR','RUS'],['FRA','RUS'],['RUS','SRB'],['DEU','AUT'],['DEU','ITA'],['AUT','ITA'],['GBR','JPN'],['FRA','BEL'],['GBR','BEL']];
