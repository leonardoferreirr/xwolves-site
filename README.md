# X Wolves · site

Site institucional da X Wolves, consultoria TOTVS. Layout, componentes e copy inspirados na WeePulse, que vende o mesmo tipo de serviço, com texto próprio e o lobo da marca em 3D.

HTML estático, sem framework: o `build.py` monta o `index.html` a partir de `_src/index.html`, com o CSS embutido. O comportamento fica em `assets/js/site.js`.

```
python3 build.py              # depois de mexer em _src/index.html, no CSS ou nas listas do build.py
python3 tools/serve.py 5330   # servidor local com gzip
```

## O lobo

As imagens foram geradas no ChatGPT pelo Leonardo, com os prompts de `06_OUTPUTS/xwolves/prompts-lobo-3d.md` do Kit. Os originais estão em `~/Downloads/lobo/`.

- **Topo:** busto com 5 quadros da cabeça (`busto-e2`, `e1`, `c`, `d1`, `d2`) e a piscada. No computador, o quadro muda conforme o mouse; no celular, ele olha em volta sozinho. Os quadros estão alinhados pelo terno, para o corpo não tremer. Só o quadro de frente baixa junto com a página; os outros baixam depois do `load`.
- **Seções:** poses de corpo inteiro (`lobo-00` a `lobo-09`). Elas entram com um pulo, respiram e inclinam na direção do mouse.

## Conteúdo

- Os números (+10 anos, +1.800 projetos, +250 empresas com IA, +75 profissionais) foram confirmados pelo Leonardo em 27/10/2026.
- Não há seção de time, a pedido dele.
- Os logos de clientes ainda não chegaram. Quando chegarem, substituem o letreiro de produtos logo abaixo do topo.
- A IA X Wolves aparece como "em desenvolvimento".
- O formulário não guarda nada: ele monta a mensagem e abre o WhatsApp (+55 11 97611-7343).

## Para publicar no domínio

`INDEXAR = False` no `build.py` deixa a página com `noindex` enquanto o xwolves.com.br aponta para o site antigo. Quando o domínio vier para cá, troque para `True` e rode o build.
