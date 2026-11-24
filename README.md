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
