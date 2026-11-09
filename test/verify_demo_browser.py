"""Local QA only. Requires Playwright for Python, Edge and an existing dist/.
The isolated browser serves the build from disk, without contacting any server.
"""
from pathlib import Path
from urllib.parse import urlparse
import re
import argparse
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
LOCAL = 'http://localhost/Kaisergarten-Wine-Sales/'
LIVE = 'https://nathanel22.github.io/Kaisergarten-Wine-Sales/'

def main(live=False):
    base = LIVE if live else LOCAL
    with sync_playwright() as engine:
        browser = engine.chromium.launch(channel='msedge', headless=True, chromium_sandbox=True)
        page = browser.new_page(viewport={'width': 1024, 'height': 768}, service_workers='block')
        attempted = []
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        def serve(route):
            request = route.request
            attempted.append((request.method, request.resource_type, request.url))
            if request.method != 'GET' or not request.url.startswith(base):
                return route.abort()
            if live:
                return route.continue_()
            rel = urlparse(request.url).path.removeprefix('/Kaisergarten-Wine-Sales/') or 'index.html'
            dest = (ROOT/'dist'/rel).resolve()
            if dest.is_relative_to(ROOT/'dist') and dest.is_file():
                return route.fulfill(path=dest)
            route.abort()
        page.route('**/*', serve)
        page.goto(base)
        cards = page.locator('main h3')
        expect(cards).to_have_count(67)
        loaded = page.locator('main img[src*="/images/products/"]').evaluate_all(
            "async imgs => { await Promise.all(imgs.map(img => { img.loading='eager'; return img.decode(); })); return imgs.filter(i => i.naturalWidth > 0).length; }")
        assert loaded == 66, loaded
        add = page.get_by_role('button', name='+6', exact=True)
        expect(add).to_have_count(67)
        assert sum(add.nth(i).is_enabled() for i in range(67)) == 55
        expect(page.get_by_text('DEMO-PREIS · CHF 25.00', exact=True)).to_have_count(19)
        expect(page.get_by_text(re.compile(r'^MESSEPREIS 2026 · CHF \d+\.\d{2}$'))).to_have_count(39)
        page.get_by_role('button', name='Details', exact=True).first.click()
        expect(page.get_by_text('Simuliertes Kartongebinde.', exact=False)).to_be_visible()
        page.keyboard.press('Escape')
        names = cards.all_text_contents()
        add.nth(names.index('Kaiser Gemischter Satz')).click()
        add.nth(names.index('Turul Reserve Sauvignon Blanc black label')).click()
        page.get_by_role('button', name='Warenkorb prüfen').click()
        page.get_by_role('button', name='Bestellsimulation starten').click()
        page.get_by_role('button', name='+ Neuen Kunden erfassen').click()
        page.get_by_label('Kundentyp').select_option('Firma')
        for label,value in [('Firmenname','Fiktiver QA-Testbetrieb'),('Strasse','Testgasse'),('Hausnummer','4b'),('PLZ','8000'),('Ort','Demo-Ort'),('E-Mail-Adresse','qa@example.invalid')]:
            field_label = label if label == 'E-Mail-Adresse' else f'{label} *'
            page.locator('form').get_by_label(field_label, exact=True).fill(value)
        page.get_by_role('checkbox').check()
        page.get_by_role('button',name='Speichern und Verkäufer wählen').click()
        expect(page.get_by_text('Zuständiger Sommelier / Verkäufer', exact=True)).to_be_visible()
        page.get_by_text('Demo-Verkäufer 2', exact=True).click()
        page.get_by_role('button', name='Weiter', exact=True).click()
        submit = page.get_by_role('button', name=re.compile('Demo-Bestellung simulieren.*362.40'))
        expect(submit).to_be_enabled()
        # Force the actual order write to fail once, leaving the cart intact for retry.
        page.evaluate('''() => { const set = Storage.prototype.setItem; Storage.prototype.setItem = function(k,v) {
            if(k === 'kaisergarten_demo_orders_v1') { Storage.prototype.setItem=set; throw Error('QA quota'); }
            return set.call(this,k,v); }; }''')
        page.evaluate("document.fonts.ready")
        assert page.evaluate("document.fonts.check('16px Inter') && document.fonts.check('16px \"Playfair Display\"')")
        assert all(method == 'GET' and url.startswith(base) for method,_,url in attempted), attempted
        assert any(kind == 'font' for _,kind,_ in attempted)
        attempted.clear()
        submit.click()
        expect(page.get_by_text('Speicherfehler beim Bestellabschluss')).to_be_visible()
        page.get_by_role('button',name='Erneut versuchen').click()
        expect(page.get_by_role('heading',name='Demo-Bestellung simuliert!')).to_be_visible()
        assert all(method == 'GET' and kind == 'image' and url.startswith(base) for method,kind,url in attempted), attempted
        orders = page.evaluate("JSON.parse(localStorage.getItem('kaisergarten_demo_orders_v1'))")
        assert len(orders)==1 and orders[0]['mode']=='SIMULATION' and orders[0]['pricing']['finalTotalCHF']==362.40
        assert orders[0]['sellerId']=='seller-02' and orders[0]['customer']['id'].startswith('DEMO-NEU-') and orders[0]['customer']['company']=='Fiktiver QA-Testbetrieb'
        page.get_by_role('button', name='Bestellübersicht öffnen').click()
        expect(page.get_by_text(orders[0]['id'],exact=True).first).to_be_visible()
        page.get_by_text('Schliessen',exact=True).click()
        page.reload()
        add.first.click()
        page.get_by_role('button',name='Warenkorb prüfen').click()
        page.get_by_role('button',name='Bestellsimulation starten').click()
        page.get_by_placeholder('Name, Ort, E-Mail, Telefon oder Kundennummer suchen...').fill(orders[0]['customer']['id'])
        page.get_by_text(orders[0]['customer']['id'],exact=True).click()
        expect(page.get_by_text('Ausgewählt',exact=True)).to_be_visible()
        page.get_by_role('button',name='Schliessen',exact=True).click()
        page.once('dialog',lambda dialog: dialog.accept())
        page.get_by_role('button',name='Demo-Daten zurücksetzen').click()
        expect(cards).to_have_count(67)
        assert page.evaluate("localStorage.getItem('kaisergarten_demo_orders_v1')") is None
        assert page.evaluate("localStorage.getItem('kaisergarten_demo_customers_v1')") is None
        assert not errors,errors
        print('Tablet browser passed: 67 products, 55 enabled, details, 12 mixed bottles, new customer, automatic seller step, customer reselection, failed save and successful retry, history, no order transmissions, reset.')
        browser.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--live', action='store_true', help='Test the public Pages site using a fresh browser profile')
    main(parser.parse_args().live)
