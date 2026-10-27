# X Wolves · site

Site institucional da X Wolves, consultoria TOTVS. Layout, componentes e copy inspirados na WeePulse, que vende o mesmo tipo de serviço, com texto próprio e o lobo da marca em 3D.

HTML estático, sem framework: o `build.py` monta o `index.html` a partir de `_src/index.html`, com o CSS embutido. O comportamento fica em `assets/js/site.js`.

```
python3 build.py              # depois de mexer em _src/index.html, no CSS ou nas listas do build.py
python3 tools/serve.py 5330   # servidor local com gzip
```

## O lobo

As imagens foram geradas no ChatGPT pelo Leonardo, com os prompts de `06_OUTPUTS/xwolves/prompts-lobo-3d.md` do Kit. Os originais estão em `~/Downloads/lobo/`.

- **Topo:** o lobo é um modelo 3D desenhado ao vivo e olha para onde o mouse está, em qualquer direção.
  - **Modelo 3D:** feito no Higgsfield com o Tripo H3.1 (18 créditos), a partir da imagem de frente.
    - O original tem 65 MB e fica no Kit, em `06_OUTPUTS/xwolves/3d/lobo-tripo-h31.glb`.
    - `tools/lobo3d/otimiza.mjs` reduz para 120 mil triângulos, com textura 2K em webp e compressão meshopt: `assets/lobo/lobo-1.glb`, 1,2 MB. Se o modelo mudar, troque o número do nome.
  - **Módulo 3D:** `tools/lobo3d/src/vivo.js`, empacotado com three.js em `assets/js/lobo3d.js` (`npm run pacote`, 149 KB comprimido).
    - Só o pescoço gira; o terno fica parado.
    - Desenha sem luz, com a textura do jeito que veio, e puxa o matiz do lilás da textura para o azul-royal do lobo original.
  - **Imagem de frente:** `tools/lobo3d/poster.py` gera `frente.webp` com o mesmo módulo. Por isso a troca da imagem pelo 3D não tem salto.
  - **No `site.js`:**
    - **Computador:** depois do load, o módulo e o modelo só baixam em segundo plano. O 3D liga no primeiro movimento do mouse (em 0,2 s).
    - **Celular:** liga sozinho uns 3,5 s depois do load, ou ao primeiro toque ou rolagem. Ele olha em volta sozinho e olha para onde o dedo toca.
    - **Movimento:** a cada quadro de tela, uma mola leva a cabeça até o alvo, com arranque e freio de movimento real e sem misturar imagens. Medido: 60 quadros por segundo.
    - **Sem WebGL ou com movimento reduzido:** fica a imagem de frente, que também é o LCP.
  - **Por que não vídeo nem grade de imagens:**
    - Os vídeos de IA (FLUX 3, Kling 3.0 e Kling Omni) viram a cabeça aos trancos e piscam no meio do giro. Os testes estão no Kit, em `06_OUTPUTS/xwolves/video-entrada/`.
    - A grade de imagens misturava quadros no movimento, e o lobo parecia em câmera lenta, com dois rostos sobrepostos.
- **Seções:** poses de corpo inteiro (`lobo-00` a `lobo-09`), paradas, só com um esmaecer ao aparecer.
- **Selo da TOTVS (seção Sobre):** usa o símbolo da TOTVS do Simple Icons (`_src/totvs.svg`) com o texto "Parceira TOTVS". Se a TOTVS mandar o selo oficial de parceiro, ele substitui este.

## Conteúdo

- Os números (+10 anos, +1.800 projetos, +250 empresas com IA, +75 profissionais) foram confirmados pelo Leonardo em 27/10/2026.
- Não há seção de time, a pedido dele.
- Os logos de clientes ainda não chegaram. Quando chegarem, substituem o letreiro de produtos logo abaixo do topo.
- A IA X Wolves aparece como "em desenvolvimento".
- O formulário não guarda nada: ele monta a mensagem e abre o WhatsApp (+55 11 97611-7343).

## Para publicar no domínio

`INDEXAR = False` no `build.py` deixa a página com `noindex` enquanto o xwolves.com.br aponta para o site antigo. Quando o domínio vier para cá, troque para `True` e rode o build.
