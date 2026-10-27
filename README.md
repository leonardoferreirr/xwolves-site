# X Wolves · site

Site institucional da X Wolves, consultoria TOTVS. Layout, componentes e copy inspirados na WeePulse, que vende o mesmo tipo de serviço, com texto próprio e o lobo da marca em 3D.

HTML estático, sem framework: o `build.py` monta o `index.html` a partir de `_src/index.html`, com o CSS embutido. O comportamento fica em `assets/js/site.js`.

```
python3 build.py              # depois de mexer em _src/index.html, no CSS ou nas listas do build.py
python3 tools/serve.py 5330   # servidor local com gzip
```

## O lobo

As imagens foram geradas no ChatGPT pelo Leonardo, com os prompts de `06_OUTPUTS/xwolves/prompts-lobo-3d.md` do Kit. Os originais estão em `~/Downloads/lobo/`.

- **Topo:** a cabeça segue o mouse sem degraus.
  - Um vídeo de 5 s da cabeça virando, gerado no Higgsfield (FLUX 3 Video, 1080p, 40 créditos), virou 31 quadros escolhidos pelo ângulo do focinho, e não pelo tempo, porque o vídeo vira devagar e depois rápido.
  - Os quadros foram alinhados pelo terno e o fundo verde saiu por recorte de cor. Ficam em `assets/img/lobo/giro/` (840 px) e em `giro-m/` (16 quadros de 480 px para o celular), e o `_src/giro.json` guarda a contagem.
  - O `site.js` baixa os quadros depois do load, do meio para as pontas, e desenha no canvas o quadro que o mouse pede, com suavização. No celular, ele olha em volta sozinho.
  - O quadro do meio (`frente.webp`) é a imagem que aparece antes, e é o LCP.
  - O vídeo original está no Kit, em `06_OUTPUTS/xwolves/video-entrada/giro-cabeca-flux3.mp4`.
- **Seções:** poses de corpo inteiro (`lobo-00` a `lobo-09`). Elas entram com um pulo, respiram e inclinam na direção do mouse.

## Conteúdo

- Os números (+10 anos, +1.800 projetos, +250 empresas com IA, +75 profissionais) foram confirmados pelo Leonardo em 27/10/2026.
- Não há seção de time, a pedido dele.
- Os logos de clientes ainda não chegaram. Quando chegarem, substituem o letreiro de produtos logo abaixo do topo.
- A IA X Wolves aparece como "em desenvolvimento".
- O formulário não guarda nada: ele monta a mensagem e abre o WhatsApp (+55 11 97611-7343).

## Para publicar no domínio

`INDEXAR = False` no `build.py` deixa a página com `noindex` enquanto o xwolves.com.br aponta para o site antigo. Quando o domínio vier para cá, troque para `True` e rode o build.
