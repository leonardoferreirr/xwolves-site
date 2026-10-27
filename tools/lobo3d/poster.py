#!/usr/bin/env python3
"""
Gera a imagem de frente do lobo (assets/img/lobo/frente.webp e frente-620.webp) com o mesmo módulo 3D do site,
para a troca da imagem pelo canvas ao vivo não ter salto. Também solta uma folha de poses para conferir.

    python3 tools/lobo3d/poster.py        (precisa de assets/js/lobo3d.js: npm run pacote)

Roda no Chromium do Playwright, nunca no Chrome do usuário.
"""
import base64, functools, http.server, io, socketserver, threading
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

RAIZ = Path(__file__).resolve().parent.parent.parent
LOBO = RAIZ / 'assets/img/lobo'
CHROME = Path.home() / 'Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell'
POSES = [(-34, -14), (0, -14), (34, -14), (-34, 0), (0, 0), (34, 0), (-34, 12), (0, 12), (34, 12)]


def main():
    H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(RAIZ))
    H.log_message = lambda *a: None
    srv = socketserver.TCPServer(('127.0.0.1', 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=str(CHROME), args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = b.new_page(viewport={'width': 1000, 'height': 1000})
        pg.on('pageerror', lambda e: print('erro:', e))
        pg.goto(f'http://127.0.0.1:{srv.server_address[1]}/tools/lobo3d/poster.html?s=1000')
        pg.wait_for_function('window.pronto === true', timeout=120000)
        foto = lambda g, i: Image.open(io.BytesIO(base64.b64decode(pg.evaluate(f'foto({g}, {i})').split(',', 1)[1]))).convert('RGBA')
        frente = foto(0, 0)
        frente.save(LOBO / 'frente.webp', 'WEBP', quality=72, method=6)
        frente.resize((620, 620), Image.LANCZOS).save(LOBO / 'frente-620.webp', 'WEBP', quality=66, method=6)
        S = 330
        folha = Image.new('RGB', (S * 3, S * 3), (2, 10, 31))
        for k, (g, i) in enumerate(POSES):
            im = foto(g, i).resize((S, S), Image.LANCZOS)
            folha.paste(im, ((k % 3) * S, (k // 3) * S), im)
        folha.save(Path(__file__).parent / 'folha.jpg', quality=88)
        b.close()
    srv.shutdown()
    print('frente', (LOBO / 'frente.webp').stat().st_size // 1024, 'KB ·', (LOBO / 'frente-620.webp').stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
