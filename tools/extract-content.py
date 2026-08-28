#!/usr/bin/env python3
"""Extract every word of visible copy from the site into one JSON file, grouped
by page and by the section it sits in, so the writing can be reread and proofed
in one place.

This reads the HTML; it never writes it. Editing the JSON does not change the
site. Regenerate after editing copy:

    python3 tools/extract-content.py
"""
import html
import io
import json
import os
import re
from collections import OrderedDict
from html.parser import HTMLParser

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'site')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..',
                   'content', 'site-content.json')

PAGES = [
    ('index.html', 'https://vfaraji89.github.io/'),
    ('updates.html', 'https://vfaraji89.github.io/updates.html'),
    ('context-engineering.html', 'https://vfaraji89.github.io/context-engineering.html'),
    ('papers/cais-2026.html', 'https://vfaraji89.github.io/papers/cais-2026.html'),
    ('papers/tokalator.html', 'https://vfaraji89.github.io/papers/tokalator.html'),
    ('papers/skill-extraction.html', 'https://vfaraji89.github.io/papers/skill-extraction.html'),
]

SKIP = {'script', 'style', 'svg', 'noscript', 'template'}
HEADINGS = ('h1', 'h2', 'h3', 'h4', 'h5', 'h6')
# Inline elements continue a sentence, so text runs through them; everything
# else ends the run. Without this, <p>a <strong>b</strong> c</p> would come out
# as three fragments, and a wrapper <div> would swallow a whole page as one.
INLINE = {'a', 'strong', 'em', 'b', 'i', 'code', 'sup', 'sub', 'small', 'mark',
          'abbr', 'time', 'u', 's', 'br', 'span', 'wbr', 'q', 'cite', 'kbd',
          'samp', 'var', 'del', 'ins'}

WS = re.compile(r'\s+')


def clean(text):
    return WS.sub(' ', html.unescape(text)).strip()


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', (text or '').lower()).strip('-')[:48]


class Extractor(HTMLParser):
    """Collect visible copy as readable blocks, grouped into the part of the
    page they belong to. A part starts at a <section id> or at a heading."""

    def __init__(self):
        HTMLParser.__init__(self)
        self.skip_depth = 0
        self.buf = []
        self.heading_now = False
        self.parts = []
        self._open('(page)', None)

    def _open(self, ident, heading):
        self.parts.append({'id': ident, 'heading': heading, 'blocks': []})

    def handle_starttag(self, tag, attrs):
        if tag in SKIP:
            self.skip_depth += 1
            return
        if self.skip_depth:
            return
        if tag == 'br':
            self.buf.append(' ')
            return
        if tag not in INLINE:
            self._flush()
        if tag == 'section' or tag == 'main' or tag == 'footer':
            ident = dict(attrs).get('id')
            if ident:
                self._open(ident, None)
        if tag in HEADINGS:
            self.heading_now = tag
        elif 'section-label' in dict(attrs).get('class', ''):
            # This site titles its sections with a styled div, not an h2, so the
            # class is the only signal that a line is a section title.
            self.heading_now = 'h2'

    def handle_endtag(self, tag):
        if tag in SKIP:
            if self.skip_depth:
                self.skip_depth -= 1
            return
        if self.skip_depth:
            return
        if tag not in INLINE:
            self._flush()

    def handle_data(self, data):
        if not self.skip_depth and data.strip():
            self.buf.append(data)

    def _flush(self):
        text = clean(''.join(self.buf))
        self.buf = []
        if not text:
            return
        if self.heading_now in ('h1', 'h2'):
            part = self.parts[-1]
            if not part['heading'] and not part['blocks']:
                part['heading'] = text          # titles the section it opened
            else:
                self._open(slug(text) or 'part', text)
            self.heading_now = False
            return
        if self.heading_now:
            part = self.parts[-1]
            if not part['heading']:
                part['heading'] = text
            elif text not in part['blocks']:
                part['blocks'].append(text)
            self.heading_now = False
            return
        part = self.parts[-1]
        if text not in part['blocks']:
            part['blocks'].append(text)

    def close(self):
        HTMLParser.close(self)
        self._flush()


META_KEYS = ('description', 'og:title', 'og:description', 'og:image:alt',
             'twitter:title', 'twitter:description')


def page_meta(source):
    out = OrderedDict()
    m = re.search(r'<title>(.*?)</title>', source, re.S)
    if m:
        out['title'] = clean(m.group(1))
    for key in META_KEYS:
        m = re.search(r'<meta (?:name|property)="%s" content="([^"]*)"' % re.escape(key), source)
        if m:
            out[key] = clean(m.group(1))
    return out


def main():
    pages = []
    words = 0
    for rel, url in PAGES:
        path = os.path.join(ROOT, rel)
        source = io.open(path, encoding='utf-8').read()

        ex = Extractor()
        body = source[source.index('<body'):] if '<body' in source else source
        ex.feed(body)
        ex.close()

        sections = [s for s in ex.parts if s['blocks'] or s['heading']]
        for s in sections:
            words += sum(len(b.split()) for b in s['blocks'])

        pages.append(OrderedDict([
            ('file', rel),
            ('url', url),
            ('meta', page_meta(source)),
            ('sections', sections),
        ]))

    doc = OrderedDict([
        ('note', 'Visible copy extracted from the site HTML for proofreading. '
                 'This file is generated; editing it does not change the site. '
                 'Regenerate with: python3 tools/extract-content.py'),
        ('pages', pages),
    ])

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with io.open(OUT, 'w', encoding='utf-8') as fh:
        json.dump(doc, fh, indent=2, ensure_ascii=False)
        fh.write('\n')

    print('%s  %d pages  %d sections  ~%d words  %.0f KB' % (
        os.path.relpath(OUT), len(pages),
        sum(len(p['sections']) for p in pages), words,
        os.path.getsize(OUT) / 1024))


if __name__ == '__main__':
    main()
