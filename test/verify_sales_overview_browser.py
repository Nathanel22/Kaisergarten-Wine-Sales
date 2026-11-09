"""Isolated local production-build integration QA. Never contacts the public demo."""
from pathlib import Path
from urllib.parse import urlparse
import argparse
import json
import re
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
BASE='http://localhost/Kaisergarten-Wine-Sales/'
LIVE='https://nathanel22.github.io/Kaisergarten-Wine-Sales/'
KEY='kaisergarten_demo_orders_v1'

def main(live=False):
    base = LIVE if live else BASE
    with sync_playwright() as engine:
        browser=engine.chromium.launch(channel='msedge',headless=True,chromium_sandbox=True)
        page=browser.new_page(viewport={'width':1024,'height':768},service_workers='block',timezone_id='Europe/Zurich')
        requests=[];errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        def serve(route):
            req=route.request;requests.append((req.method,req.url))
            if req.method!='GET' or not req.url.startswith(base):return route.abort()
            if live:return route.continue_()
            rel=urlparse(req.url).path.removeprefix('/Kaisergarten-Wine-Sales/') or 'index.html'
            dest=(ROOT/'dist'/rel).resolve()
            if dest.is_relative_to(ROOT/'dist') and dest.is_file():return route.fulfill(path=dest)
            route.abort()
        page.route('**/*',serve)
        page.goto(base)
        nav=page.get_by_role('navigation',name='Hauptnavigation')
        nav.get_by_role('button',name='Verkaufsübersicht',exact=True).click()
        expect(page.get_by_text(re.compile('LOKALE DEMO-AUSWERTUNG'))).to_be_visible()
        expect(page.locator('.kgso-bar')).to_have_count(4)
        def kpi(label,value):
            card=page.locator('.kgso-kpi').filter(has=page.get_by_text(label,exact=True))
            expect(card.locator('.kgso-kpival')).to_have_text(value)
        # First open seeds once without a button click.
        kpi('Gesamtumsatz','CHF 1’200.00');kpi('Bestellungen','6');kpi('Verkaufte Flaschen','48');kpi('Verkäufer mit Bestellung','3 von 4')
        seed=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
        assert len(seed)==6 and sum(o['totalBottles'] for o in seed)==48
        expect(page.get_by_role('button',name='Beispielszenario laden')).to_be_disabled()
        for label in ['Heute','Diese Woche','Dieser Monat','Messe gesamt']:
            page.get_by_role('button',name=label,exact=True).click();kpi('Bestellungen','6')
        page.get_by_role('combobox',name='Messe',exact=True).select_option('all');kpi('Verkaufte Flaschen','48')
        for label in ['Umsatz','Bestellungen','Flaschen']:
            page.get_by_role('group',name='Balken zeigen').get_by_role('button',name=label,exact=True).click()
        for number,count in [(1,2),(2,1),(3,0),(4,3)]:
            page.get_by_role('button',name=f'Demo-Verkäufer {number} Details anzeigen').click()
            kpi('Bestellungen',str(count))
            assert 'example.invalid' not in page.locator('.kgso').inner_text()
            assert 'Fiktive Demofirma' not in page.locator('.kgso').inner_text()
            expect(page.locator('.kgso tbody tr')).to_have_count(count)
            page.get_by_role('button',name='Zurück zur Übersicht').click()
        for width,height in [(1024,768),(820,1180),(390,844),(1440,900)]:
            page.set_viewport_size({'width':width,'height':height})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            page.evaluate('window.scrollTo(0,0)')
            page.screenshot(path=str(ROOT/f'.publication/overview-tablet-{width}.png'),full_page=True)
        page.reload();nav.get_by_role('button',name='Verkaufsübersicht',exact=True).click();kpi('Bestellungen','6')
        assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)==seed
        # Remove examples first. Empty state survives reload and all four sellers remain.
        page.once('dialog',lambda d:d.accept())
        page.get_by_role('button',name='Beispieldaten entfernen').click()
        kpi('Gesamtumsatz','CHF 0.00');kpi('Bestellungen','0')
        page.reload();nav.get_by_role('button',name='Verkaufsübersicht',exact=True).click()
        kpi('Bestellungen','0');expect(page.locator('.kgso-bar')).to_have_count(4)
        page.get_by_role('button',name='Demo-Verkäufer 3 Details anzeigen').click()
        kpi('Umsatz','CHF 0.00');page.get_by_role('button',name='Zurück zur Übersicht').click()
        page.set_viewport_size({'width':1024,'height':768})
        # Chef test: two different fair-price wines, 12 bottles, existing checkout.
        nav.get_by_role('button',name='Verkauf',exact=True).click()
        names=page.locator('main h3').all_text_contents()
        add=page.get_by_role('button',name='+6',exact=True)
        add.nth(names.index('Kaiser Gemischter Satz')).click()
        add.nth(names.index('Turul Reserve Sauvignon Blanc black label')).click()
        nav.get_by_role('button',name='Verkaufsübersicht',exact=True).click()
        page.get_by_role('button',name='Warenkorb öffnen',exact=True).click()
        page.get_by_role('button',name='Bestellsimulation starten').click()
        page.get_by_text('DEMO-CUSTOMER-1',exact=True).click()
        page.get_by_role('button',name='Weiter',exact=True).click()
        page.locator('p').filter(has_text=re.compile('^Demo-Verkäufer 3$')).click()
        page.get_by_role('button',name='Weiter',exact=True).click()
        before=len(requests)
        page.get_by_role('button',name=re.compile('Demo-Bestellung simulieren.*362.40')).click()
        expect(page.get_by_role('heading',name='Demo-Bestellung simuliert!')).to_be_visible()
        page.get_by_role('button',name='Neue Bestellung starten').click()
        kpi('Bestellungen','1');kpi('Verkaufte Flaschen','12');kpi('Gesamtumsatz','CHF 362.40');kpi('Verkäufer mit Bestellung','1 von 4')
        assert all(m=='GET' and u.startswith(base) for m,u in requests[before:])
        all_orders=page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)
        own=[o for o in all_orders if not o.get('demoScenario')];assert len(own)==1
        assert own[0]['sellerId']=='seller-03' and own[0]['pricing']['finalTotalRappen']==36240
        assert own[0]['totalBottles']==12
        page.reload();nav.get_by_role('button',name='Verkaufsübersicht',exact=True).click()
        kpi('Bestellungen','1');kpi('Gesamtumsatz','CHF 362.40')
        assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)==own
        expect(page.get_by_role('button',name='Beispielszenario laden')).to_be_disabled()
        # Reinsert only the synthetic seed fixture to verify selective removal beside own orders.
        page.evaluate('([key,orders])=>localStorage.setItem(key,JSON.stringify(orders))',[KEY,own+seed])
        page.reload();nav.get_by_role('button',name='Verkaufsübersicht',exact=True).click()
        kpi('Bestellungen','7')
        page.once('dialog',lambda d:d.accept());page.get_by_role('button',name='Beispieldaten entfernen').click()
        kpi('Bestellungen','1');assert page.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',KEY)==own
        # Historical second fair and prior-month date exercise UI filters, using synthetic snapshots only.
        old={**own[0],'id':'DEMO-QA-HISTORY','idempotencyKey':'demo-qa-history','fairId':'qa-fair','fairName':'Synthetische Testmesse','createdAt':'2020-01-01T10:00:00.000Z'}
        page.evaluate('([key,orders])=>localStorage.setItem(key,JSON.stringify(orders))',[KEY,own+[old]])
        page.reload();nav.get_by_role('button',name='Verkaufsübersicht',exact=True).click()
        page.get_by_role('combobox',name='Messe',exact=True).select_option('qa-fair');kpi('Bestellungen','1')
        page.get_by_role('button',name='Heute',exact=True).click();kpi('Bestellungen','0')
        page.get_by_role('button',name='Messe gesamt',exact=True).click()
        page.get_by_role('combobox',name='Messe',exact=True).select_option('all');kpi('Bestellungen','2')
        page.once('dialog',lambda d:d.accept())
        page.get_by_role('button',name='Demo-Daten zurücksetzen',exact=True).click()
        expect(page.locator('main h3')).to_have_count(67)
        assert page.evaluate('(key)=>localStorage.getItem(key)',KEY) is None
        nav.get_by_role('button',name='Verkaufsübersicht',exact=True).click();kpi('Bestellungen','0')
        page.get_by_role('button',name='Beispielszenario laden').click();kpi('Bestellungen','6')
        assert not errors,errors
        assert all(m=='GET' and u.startswith(base) for m,u in requests),requests
        print('Final overview browser passed: 4 sellers, automatic 6/48/CHF1200, persistent removal, mixed-price chef checkout 1/12/CHF362.40, details, periods/fairs, own-order preservation, 390/820/1024/1440px, no external requests.')
        browser.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--live',action='store_true');main(parser.parse_args().live)
