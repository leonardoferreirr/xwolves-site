#!/usr/bin/env python3
"""
Monta o index.html a partir de _src/index.html, com o CSS embutido (uma folha externa atrasa a primeira pintura).

    python3 build.py

O conteúdo que se repete (soluções, poses do lobo, quadros do busto) sai daqui. As poses estão em
assets/img/lobo/lobo-NN.webp (1000 px de altura) e lobo-NN-600.webp.
"""
import json
import re
from pathlib import Path
from urllib.parse import quote

from PIL import Image

RAIZ = Path(__file__).parent
URL = 'https://xwolves.com.br'
INDEXAR = False  # o domínio ainda aponta para o site antigo; liga quando este for para o xwolves.com.br
WHATS = 'https://wa.me/5511976117343?text=' + quote('Olá, X Wolves! Vim pelo site e quero falar com um especialista.')
WHATS_IA = 'https://wa.me/5511976117343?text=' + quote('Olá, X Wolves! Quero conhecer a IA X Wolves primeiro.')

SOLUCOES = [  # (slug, nome, título, texto)
    ('protheus', 'Protheus', 'Seu ERP no centro da operação.', 'Especialistas para fazer do Protheus o coração da gestão, do backoffice ao chão de fábrica.'),
    ('rm', 'RM', 'Gestão que conecta.', 'Consultoria completa em todos os módulos do TOTVS RM, com a empresa inteira falando a mesma língua.'),
    ('datasul', 'Datasul', 'Indústria em evolução.', 'Atualização, revitalização e personalizações para o Datasul rodar em alto nível.'),
    ('fluig', 'Fluig', 'Processos mais fluidos.', 'Integramos o Fluig aos ERPs TOTVS e simplificamos aprovações, cadastros e fluxos digitais.'),
    ('salesforce', 'Salesforce', 'O cliente no centro.', 'CRM integrado ao seu ERP, para vendas e atendimento enxergarem o mesmo cliente.'),
    ('ams', 'AMS Suporte', 'Operação sem parar.', 'Gestão de chamados e sustentação para manter os seus sistemas funcionando sem falhas.'),
    ('outsourcing', 'Outsourcing', 'Seu time, ampliado.', 'Profissionais e times dedicados aos desafios dos seus produtos TOTVS.'),
]
ECO = ['Protheus', 'RM', 'Datasul', 'Fluig', 'Salesforce', 'AMS Suporte', 'Outsourcing', 'IA X Wolves']


def e(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;').replace('"', '&quot;')


def whats(texto):
    return 'https://wa.me/5511976117343?text=' + quote(texto)


SETA = '<svg aria-hidden="true"><use href="#i-seta"/></svg>'


def pose(n, sizes):
    w, h = Image.open(RAIZ / f'assets/img/lobo/lobo-{n}.webp').size
    return (f'<figure class="pose" aria-hidden="true"><img src="/assets/img/lobo/lobo-{n}-600.webp" '
            f'srcset="/assets/img/lobo/lobo-{n}-600.webp {round(w * .6)}w, /assets/img/lobo/lobo-{n}.webp {w}w" sizes="{sizes}" '
            f'width="{w}" height="{h}" alt="" loading="lazy" decoding="async"></figure>')


def busto():
    out = []
    for f, nome in (('c', 'busto-c'), ('e2', 'busto-e2'), ('e1', 'busto-e1'), ('d1', 'busto-d1'), ('d2', 'busto-d2'), ('p', 'busto-piscada')):
        ss = f'/assets/img/lobo/{nome}-620.webp 620w, /assets/img/lobo/{nome}.webp 1000w'
        base = f'data-f="{f}" sizes="(max-width: 900px) 92vw, 58vw" width="1000" height="1000" alt=""'
        if f == 'c':  # o de frente pinta junto com a página; os outros baixam depois do load
            out.append(f'<img class="is-on" src="/assets/img/lobo/{nome}.webp" srcset="{ss}" {base} fetchpriority="high">')
        else:
            out.append(f'<img data-src="/assets/img/lobo/{nome}.webp" data-srcset="{ss}" {base} decoding="async">')
    return ''.join(out)


def main():
    css = (RAIZ / 'assets/css/site.css').read_text(encoding='utf-8')
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = '\n'.join(l.strip() for l in css.split('\n') if l.strip())
    mega = ''.join(f'<a href="#sol-{s}"><small>{i + 1:02d}</small><span>{e(nm)}</span>{SETA}</a>' for i, (s, nm, t, d) in enumerate(SOLUCOES))
    mnav = ''.join(f'<a href="#sol-{s}">{e(nm)}</a>' for s, nm, t, d in SOLUCOES)
    sols = ''.join(
        f'<article class="sol" id="sol-{s}" style="--i:{i}"><span class="sol__n">{i + 1:02d}</span><p class="sol__name">{e(nm)}</p>'
        f'<h3>{e(t)}</h3><p>{e(d)}</p><a class="go" href="{e(whats(f"Olá, X Wolves! Quero falar sobre {nm}."))}" target="_blank" rel="noopener">Falar sobre {e(nm)} {SETA}</a></article>'
        for i, (s, nm, t, d) in enumerate(SOLUCOES))
    eco = ''.join(f'<span>{e(x)}</span>' for x in ECO)
    eco2 = ''.join(f'<span aria-hidden="true">{e(x)}</span>' for x in ECO)  # cópia do letreiro: leitor de tela lê uma vez só
    opcoes = ''.join(f'<option>{e(nm)}</option>' for s, nm, t, d in SOLUCOES) + '<option>IA X Wolves</option><option>Ainda não sei</option>'
    foot = ''.join(f'<li><a href="#sol-{s}">{e(nm)}</a></li>' for s, nm, t, d in SOLUCOES)
    ld = {'@context': 'https://schema.org', '@type': 'ProfessionalService', 'name': 'X Wolves', 'url': URL + '/',
          'description': 'Consultoria TOTVS com mais de 10 anos em ERP, CRM e integrações: Protheus, RM, Datasul, Fluig, Salesforce, AMS e outsourcing.',
          'telephone': '+55 11 97611-7343', 'email': 'contato@xwolves.com.br', 'areaServed': 'BR', 'slogan': 'É momento de mudar, para evoluir e não parar.',
          'logo': URL + '/assets/brand/apple-touch-icon.png',
          'hasOfferCatalog': {'@type': 'OfferCatalog', 'name': 'Soluções TOTVS', 'itemListElement': [
              {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': nm, 'description': d}} for s, nm, t, d in SOLUCOES]}}
    html = (RAIZ / '_src/index.html').read_text(encoding='utf-8')
    troca = {'CSS': css, 'MEGA': mega, 'MNAV': mnav, 'SOLUCOES': sols, 'ECO': eco, 'ECO2': eco2, 'OPCOES': opcoes, 'FOOT_SOL': foot,
             'BUSTO': busto(), 'WHATS': e(WHATS), 'WHATS_IA': e(WHATS_IA), 'URL': URL,
             'ROBOTS': 'index, follow, max-image-preview:large' if INDEXAR else 'noindex',
             'JSONLD': json.dumps(ld, ensure_ascii=False)}
    html = re.sub(r'\{\{POSE:(\d\d)\|([^}]*)\}\}', lambda m: pose(m.group(1), m.group(2)), html)
    html = re.sub(r'\{\{([A-Z0-9_]+)\}\}', lambda m: troca[m.group(1)], html)
    assert '{{' not in html, re.findall(r'\{\{[^}]*\}\}', html)
    (RAIZ / 'index.html').write_text(html, encoding='utf-8')
    (RAIZ / 'robots.txt').write_text('User-agent: *\n' + ('Allow: /\n' if INDEXAR else 'Disallow:\n') + f'\nSitemap: {URL}/sitemap.xml\n', encoding='utf-8')
    (RAIZ / 'sitemap.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>{URL}/</loc></url></urlset>\n', encoding='utf-8')
    print(f'index.html · CSS embutido {len(css) / 1024:.1f} KB · HTML {len(html) / 1024:.1f} KB · indexar={INDEXAR}')


if __name__ == '__main__':
    main()
