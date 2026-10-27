#!/usr/bin/env python3
"""
Renderiza a grade de olhares do lobo a partir do modelo 3D e gera os arquivos que o site.js toca no canvas.

    python3 tools/lobo3d/grade.py <modelo.glb>

O modelo (Tripo H3.1 pelo Higgsfield, a partir da imagem de frente) fica no Drive do Kit:
06_OUTPUTS/xwolves/3d/lobo-tripo-h31.glb. O render.html torce só o pescoço (o terno não mexe) e desenha sem
luz, com a textura do jeito que veio, que já traz a luz da imagem original. Roda no Chromium do Playwright.

Por que 3D e não vídeo: os modelos de vídeo viram a cabeça aos trancos e piscam bem no meio do giro, então o olho
tremia. Do 3D sai um quadro para cada ângulo, sem piscada e sem diferença de um para o outro.

Saída, em assets/img/lobo/:
  olhar/<linha>-<coluna>.webp   só a parte de cima (cabeça), computador; linha 0 = olhando para cima
  olhar-m/                      o mesmo para o celular, com menos quadros
  corpo.webp, corpo-m.webp      a parte de baixo, que é igual em todos os quadros
  frente.webp, frente-620.webp  o quadro de frente inteiro (LCP e sem JS)
e _src/giro.json com o tamanho da grade e a altura do corte.
"""
import base64
import functools
import http.server
import json
import shutil
import socketserver
import sys
import threading
from pathlib import Path

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
LOBO = RAIZ / 'assets/img/lobo'
TAM = 1000                                   # tamanho do render
GIRO = [round(-34 + i * 4.25, 2) for i in range(17)]   # graus, da esquerda para a direita de quem olha
INCL = [-14, -7, 0, 6, 12]                   # graus, de cima para baixo
CEL_COLS, CEL_LINHAS = list(range(0, 17, 2)), [0, 2, 4]
PX, PX_CEL = 840, 480
ROT_Y = -90                                  # o GLB do Tripo vem olhando para +X
CHROME = Path.home() / 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'


def renderiza(glb):
    class H(http.server.SimpleHTTPRequestHandler):
        def translate_path(self, path):
            return str(glb) if path.startswith('/modelo.glb') else super().translate_path(path)

        def log_message(self, *a):
            pass
    srv = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(H, directory=str(AQUI)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    quadros = {}
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=str(CHROME), args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = b.new_page(viewport={'width': TAM, 'height': TAM})
        pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/render.html?s={TAM}')
        pg.wait_for_function('window.pronto === true', timeout=60000)
        pg.evaluate(f'carrega("modelo.glb", true, {ROT_Y})')
        for l, inc in enumerate(INCL):
            for c, gi in enumerate(GIRO):
                url = pg.evaluate(f'pose({gi}, {inc})')
                quadros[l, c] = Image.open(__import__('io').BytesIO(base64.b64decode(url.split(',', 1)[1]))).convert('RGBA')
        b.close()
    srv.shutdown()
    return quadros


def suave(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def cor(im):
    """A textura do 3D puxa para o lilás; o lobo original é azul-royal. Gira o matiz só nos azuis com cor e luz
    (o cinza do terno, o branco do pelo, a camisa escura e o vermelho da boca ficam como estão) e satura um pouco."""
    a = np.asarray(im).astype(np.float32) / 255
    rgb = a[..., :3]
    mx, mn = rgb.max(-1), rgb.min(-1)
    c = mx - mn
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.zeros_like(mx)
    m = c > 1e-6
    for cond, val in ((mx == r, ((g - b) / np.maximum(c, 1e-6)) % 6), (mx == g, (b - r) / np.maximum(c, 1e-6) + 2), (mx == b, (r - g) / np.maximum(c, 1e-6) + 4)):
        i = m & cond & (h == 0)
        h[i] = val[i]
    h *= 60
    s = np.where(mx > 0, c / np.maximum(mx, 1e-6), 0)
    v = mx
    w = suave(s, .12, .35) * suave(v, .22, .45) * (1 - suave(np.abs(h - 240), 40, 70))
    h = (h - 15 * w) % 360
    s = np.clip(s * (1 + .5 * w), 0, 1)
    hh = h / 60

    def canal(n):
        k = (n + hh) % 6
        return v - v * s * np.clip(np.minimum(k, 4 - k), 0, 1)
    out = np.stack([canal(5), canal(3), canal(1)], -1)
    return Image.fromarray((np.concatenate([out, a[..., 3:]], -1) * 255).clip(0, 255).astype(np.uint8))


def main():
    glb = Path(sys.argv[1]).resolve()
    q = renderiza(glb)
    q = {k: cor(v) for k, v in q.items()}
    # corte: a primeira linha (de cima para baixo) a partir da qual todos os quadros são iguais
    pilha = np.stack([np.asarray(v).astype(np.int16) for v in q.values()])
    muda = (np.abs(pilha - pilha[0]).max(axis=(0, 3)) > 6).any(1)
    corte = int(np.nonzero(muda)[0].max()) + 1
    corte = min(TAM, (corte + 12 + 7) // 8 * 8)  # folga e múltiplo de 8
    fr = corte / TAM
    print(f'{len(q)} quadros, a cabeça mexe até a linha {corte} de {TAM} ({fr:.3f})')

    for p in ('olhar', 'olhar-m'):
        shutil.rmtree(LOBO / p, ignore_errors=True)
        (LOBO / p).mkdir(parents=True)
    tam = {'pc': 0, 'cel': 0}
    hp, hc = round(PX * fr), round(PX_CEL * fr)
    for (l, c), im in q.items():
        topo = im.crop((0, 0, TAM, corte))
        d = LOBO / f'olhar/{l}-{c:02d}.webp'
        topo.resize((PX, hp), Image.LANCZOS).save(d, 'WEBP', quality=64, method=6)
        tam['pc'] += d.stat().st_size
        if l in CEL_LINHAS and c in CEL_COLS:
            d = LOBO / f'olhar-m/{CEL_LINHAS.index(l)}-{CEL_COLS.index(c):02d}.webp'
            topo.resize((PX_CEL, hc), Image.LANCZOS).save(d, 'WEBP', quality=60, method=6)
            tam['cel'] += d.stat().st_size
    frente = q[INCL.index(0), len(GIRO) // 2]
    corpo = frente.crop((0, corte, TAM, TAM))
    corpo.resize((PX, PX - hp), Image.LANCZOS).save(LOBO / 'corpo.webp', 'WEBP', quality=66, method=6)
    corpo.resize((PX_CEL, PX_CEL - hc), Image.LANCZOS).save(LOBO / 'corpo-m.webp', 'WEBP', quality=62, method=6)
    frente.save(LOBO / 'frente.webp', 'WEBP', quality=70, method=6)
    frente.resize((620, 620), Image.LANCZOS).save(LOBO / 'frente-620.webp', 'WEBP', quality=64, method=6)

    json.dump({'linhas': len(INCL), 'cols': len(GIRO), 'linhas_cel': len(CEL_LINHAS), 'cols_cel': len(CEL_COLS),
               'corte_pc': round(hp / PX, 4), 'corte_cel': round(hc / PX_CEL, 4), 'giro_graus': GIRO, 'inclinacao_graus': INCL,
               'origem': 'modelo 3D Tripo H3.1 (Higgsfield) renderizado por tools/lobo3d/grade.py'},
              open(RAIZ / '_src/giro.json', 'w'), ensure_ascii=False, indent=1)
    print(f"computador {len(q)} quadros, {tam['pc'] // 1024} KB + corpo {(LOBO / 'corpo.webp').stat().st_size // 1024} KB | "
          f"celular {len(CEL_LINHAS) * len(CEL_COLS)} quadros, {tam['cel'] // 1024} KB | frente {(LOBO / 'frente.webp').stat().st_size // 1024} KB")

    # folha de conferência
    S = 150
    folha = Image.new('RGB', (S * len(GIRO), S * len(INCL)), (2, 10, 31))
    for (l, c), im in q.items():
        t = im.resize((S, S))
        folha.paste(t, (c * S, l * S), t)
    folha.save(AQUI / 'folha.jpg', quality=85)


if __name__ == '__main__':
    main()
