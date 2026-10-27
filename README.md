# X Wolves · site

Site institucional da X Wolves, consultoria TOTVS. Layout, componentes e copy inspirados na WeePulse, que vende o mesmo tipo de serviço, com texto próprio e o lobo da marca em 3D.

HTML estático, sem framework: o `build.py` monta o `index.html` a partir de `_src/index.html`, com o CSS embutido. O comportamento fica em `assets/js/site.js`.

```
python3 build.py              # depois de mexer em _src/index.html, no CSS ou nas listas do build.py
python3 tools/serve.py 5330   # servidor local com gzip
```

## O lobo

As imagens foram geradas no ChatGPT pelo Leonardo, com os prompts de `06_OUTPUTS/xwolves/prompts-lobo-3d.md` do Kit. Os originais estão em `~/Downloads/lobo/`.

- **Topo:** a cabeça olha para onde o mouse está, para os lados, para cima e para baixo.
  - **Modelo 3D:** feito no Higgsfield com o Tripo H3.1 (18 créditos), a partir da imagem de frente. O GLB (65 MB) fica no Kit, em `06_OUTPUTS/xwolves/3d/lobo-tripo-h31.glb`, e não vai para o site.
  - **Grade:** o `tools/lobo3d/grade.py` renderiza o modelo numa grade de olhares: 5 alturas (de -14° a +12°) × 17 giros (de -34° a +34°).
    - O `render.html` torce só o pescoço e desenha sem luz, com a textura do jeito que veio.
    - O script corrige o matiz para o azul-royal do lobo original, porque a textura puxa para o lilás.
    - Cada quadro guarda só a parte de cima. O corpo, igual em todos, vira uma imagem à parte (`corpo.webp`).
  - **Arquivos:** os quadros ficam em `assets/img/lobo/olhar/` (85 quadros, 2,7 MB, só no computador) e em `olhar-m/` (3 × 9 quadros, 425 KB, celular). O `_src/giro.json` guarda o tamanho da grade e a altura do corte.
  - **No `site.js`:**
    - Os quadros baixam depois do load, do olhar de frente para as pontas.
    - O canvas mistura os 4 quadros vizinhos, e uma mola leva o olhar até o alvo.
    - Parado, o olhar sempre assenta num quadro inteiro, então a imagem fica nítida, sem fantasma.
    - No celular, ele olha em volta sozinho e olha para onde o dedo toca.
  - **LCP:** o quadro de frente inteiro (`frente.webp`) é a imagem que aparece antes.
  - **Por que não vídeo:** os vídeos (FLUX 3, Kling 3.0 e Kling Omni) viram a cabeça aos trancos e piscam bem no meio do giro, o que deixava o olho tremido. Os vídeos testados estão no Kit, em `06_OUTPUTS/xwolves/video-entrada/`.
- **Seções:** poses de corpo inteiro (`lobo-00` a `lobo-09`). Elas entram com um pulo, respiram e inclinam na direção do mouse.

## Conteúdo

- Os números (+10 anos, +1.800 projetos, +250 empresas com IA, +75 profissionais) foram confirmados pelo Leonardo em 27/10/2026.
- Não há seção de time, a pedido dele.
- Os logos de clientes ainda não chegaram. Quando chegarem, substituem o letreiro de produtos logo abaixo do topo.
- A IA X Wolves aparece como "em desenvolvimento".
- O formulário não guarda nada: ele monta a mensagem e abre o WhatsApp (+55 11 97611-7343).

## Para publicar no domínio

`INDEXAR = False` no `build.py` deixa a página com `noindex` enquanto o xwolves.com.br aponta para o site antigo. Quando o domínio vier para cá, troque para `True` e rode o build.
