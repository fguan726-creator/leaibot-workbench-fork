import unittest
from html.parser import HTMLParser
from pathlib import Path


class BrandParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements = []
        self.depth = 0
        self.current_link = None
        self.image_links = []
        self.card_ctas = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'section' and 'lx-brand-home' in attrs.get('class', '').split():
            self.depth = 1
        elif tag == 'section' and self.depth:
            self.depth += 1
        if self.depth:
            self.elements.append((tag, attrs))
            if tag == 'a':
                self.current_link = attrs
            if tag == 'img':
                self.image_links.append(self.current_link)
            if tag == 'span' and attrs.get('class') == 'lxbrand-link' and self.current_link and self.current_link.get('class') == 'lxbrand-card':
                self.card_ctas.append(attrs)

    def handle_endtag(self, tag):
        if tag == 'a':
            self.current_link = None
        if tag == 'section' and self.depth:
            self.depth -= 1


class BrandPageTest(unittest.TestCase):
    def test_image_cards_link_directly_without_separate_cta(self):
        self.assertEqual(self.page.card_ctas, [])
        self.assertEqual(len(self.page.image_links), 8)
        for link in self.page.image_links:
            self.assertIsNotNone(link)
            self.assertEqual(link.get('class'), 'lxbrand-card')
            self.assertTrue(link.get('href', '').startswith('https://'))
            self.assertEqual(link.get('target'), '_blank')

    def test_news_is_first_content_without_brand_heading(self):
        self.assertFalse(any(t == 'header' for t, _ in self.page.elements))
        self.assertEqual(self.page.elements[1][1].get('id'), 'lxbrand-news')

    def test_no_duplicate_brand_navigation(self):
        self.assertFalse(any(t == 'nav' for t, _ in self.page.elements))

    def setUp(self):
        self.root = Path(__file__).resolve().parents[1]
        self.html = (self.root / 'public/index.html').read_text()
        self.page = BrandParser()
        self.page.feed(self.html)

    def test_three_sections_in_requested_order(self):
        sections = [a['id'] for t, a in self.page.elements if t == 'section' and 'id' in a]
        self.assertEqual(sections, ['lxbrand-news', 'lxbrand-cases', 'lxbrand-about'])

    def test_real_landing_links_without_ai_actions(self):
        links = [a for t, a in self.page.elements if t == 'a' and a.get('href', '').startswith('https://')]
        self.assertEqual(len(links), 12)
        for link in links:
            self.assertEqual(link.get('target'), '_blank')
            self.assertIn('noopener', link.get('rel', ''))
        self.assertFalse(any('data-brand-ask' in a for _, a in self.page.elements))

    def test_images_have_stable_dimensions(self):
        images = [a for t, a in self.page.elements if t == 'img']
        self.assertEqual(len(images), 8)
        for image in images:
            self.assertIn('width', image)
            self.assertIn('height', image)
            self.assertIn('alt', image)

    def test_about_links_do_not_use_blank_official_placeholders(self):
        self.assertNotIn('u1xz4ovvumfij5oe3zgkkktu5sd50v849690.png', self.html)
        self.assertNotIn('2ro6iwr7ofro4itcrtgelsvopg5tkh030302.png', self.html)

    def test_scoped_design_stylesheet_is_loaded(self):
        self.assertIn('/css/brand-home.css?v=20260907-4', self.html)
        css = (self.root / 'public/css/brand-home.css').read_text()
        self.assertIn('object-fit: cover', css)
        self.assertIn(':focus-visible', css)
        self.assertNotIn('vw', css)


if __name__ == '__main__':
    unittest.main()
