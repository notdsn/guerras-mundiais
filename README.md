# Guerras Mundiais — 1914 → hoje (v2)

Jogo de estratégia no navegador, em português, feito para celular (funciona no PC).
Mistura o estilo **WAR** (número de tropas em cada cidade, reforços, atacar vizinho, defender, mover tropas)
com uma campanha histórica no **mapa-múndi real**: 1ª Guerra (1914) → 2ª Guerra (1939) → Guerra Fria (1947) → Guerra Moderna (1991+).

**Jogar:** https://notdsn.github.io/guerras-mundiais/

## Como jogar
- Cada cidade mostra quantas tropas tem.
- Toque numa cidade sua e depois numa cidade **vermelha** vizinha → **ATACAR**. O jogo mostra sua força, a defesa e a chance de vitória.
- **Mover tropas:** toque numa cidade sua → botão **🚚 Mover tropas** → toque em qualquer cidade sua ligada pelo seu território (ou toque direto numa cidade verde). Escolha quantas com a barra, +/−, Metade ou Todas.
- Todo mês chegam **reforços**: toque no botão 🎖️ e coloque-os nas suas cidades.
- Recrute com um botão: Infantaria, Blindados e Aviação (melhoram sozinhos a cada era).
- Construções simples: Fábrica (mais dinheiro) e Fortaleza (mais defesa).
- Pesquisa: 3 melhorias por era e o botão para avançar de era.
- Diplomacia: paz, aliança, **acordo comercial** (+dinheiro e petróleo por dia para os dois), guerra. A IA aceita, recusa, propõe e pode cancelar acordos ou romper alianças. Países da IA fazem alianças, traem, sofrem revoltas.
- Missões guiadas com seta no mapa e jornal com as notícias da guerra.

Tudo em JavaScript puro + Canvas, sem servidor. Salva no próprio navegador.

## Novidades v4
- Aliados entram na guerra ao seu lado, atacam os inimigos em comum e mandam tropas para as suas fronteiras. Botão **🆘 Pedir ajuda** na Diplomacia.
- Os aliados dos seus inimigos também entram contra você e mandam reforços.
- **Proclamar Império:** conquiste cidades para subir de nível (Reino → Império → Superpotência), com cerimônia, novo nome e bônus de reforços e dinheiro. A IA também vira império.
- **Ameaça:** quanto mais você cresce, mais as potências desconfiam; com ameaça alta formam coalizões contra você.

## Novidades v5
- **Visual moderno e limpo:** HUD mínimo (bandeira, data, play/pausa e velocidade), recursos em chips compactos (toque para ver a economia), missão que recolhe sozinha, mapa só com marcador e número (nomes aparecem com zoom ou na cidade selecionada), vinheta por era.
- **Menos avisos:** só o importante aparece na tela, agrupado; o resto vai para Notícias.
- **Diplomacia em lista limpa:** toque no país para abrir as ações (paz, aliança, acordo, pedir ajuda, anexar, guerra).
- **Cartas especiais no ataque:** arma da era (gás, bombardeio, míssil, drones) e sabotagem por espiões. **Anexação pacífica** de países pequenos e amigos.
- **IA mais esperta:** escolhe fronteiras fracas, junta tropas de várias cidades, defende a capital, chama aliados, aproveita quando o inimigo está em outra guerra, usa cartas e espiões, anexa vizinhos e reage à sua ameaça. Cada personalidade joga diferente, com as mesmas regras e custos que você.

## Novidades v6
- **Generais por era** (retratos pintados, personagens fictícios): contrate até 3 e coloque numa cidade. Bônus de ataque, defesa, blindados ou aviação. Podem recuar ou ser capturados quando a cidade cai. A IA também contrata.
- **Cartas de bônus estilo WAR**: conquistou 1 cidade no mês, ganha 1 carta (▲ ■ ● ou ★ coringa). Com 3 iguais ou 3 diferentes, troque por reforços (4, 6, 8, 10, 12, 15…). O botão 🃏 só aparece quando dá para trocar.
- **Objetivo secreto** no começo (dominar continente, destruir um rival ou ter N cidades). Ao cumprir, aparece a tela de vitória e você pode continuar jogando.
- **Espionagem**: névoa de guerra (cidades longe mostram "?"). Na cidade inimiga, 🕵️ Espionagem: revelar tropas da região, sabotar ou incitar revolta. Se o espião for pego, a relação piora.
- **Batalhas com som** (WebAudio, muda conforme a era) e rajadas de tiros no mapa. Botão de som no Menu.
- **Medalhas** (18), sem ranking.
- **Partida rápida**: só um continente, tempo 2× e meta de 45% das cidades.
- **Protetorados/vassalos**: proponha com oferta em dinheiro e veja a chance de aceitar. O protetorado paga 25% da renda, entra nas suas guerras e pode se rebelar. A IA também faz, e países pequenos em apuros pedem a sua proteção.
- O Menu ganhou atalhos (Objetivo, Generais, Cartas, Medalhas, Som, Economia) e o ranking foi removido.
