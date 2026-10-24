from pathlib import Path
import json
import fitz
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'artifacts'
ART.mkdir(exist_ok=True)
doc = fitz.open()
doc.new_page().insert_text((60,80), 'Primera pagina. Leer nos permite descubrir nuevas ideas. ' * 8, fontsize=12)
doc.new_page()
doc.new_page().insert_text((60,80), 'Tercera pagina. Esta lectura continua despues de una pagina vacia.', fontsize=12)
doc.save(str(ART/'sample.pdf')); doc.close()
scan = fitz.open(); scan.new_page(); scan.save(str(ART/'scanned.pdf')); scan.close()
protected = fitz.open(); protected.new_page().insert_text((60,80),'Contenido protegido')
protected.save(str(ART/'protected.pdf'),encryption=fitz.PDF_ENCRYPT_AES_256,user_pw='secret',owner_pw='owner'); protected.close()
(ART/'invalid.pdf').write_text('not a pdf')
MOCK = '''
window.__speech = { utterances: [], active: null, cancelled: 0 };
window.SpeechSynthesisUtterance = class { constructor(text) { this.text=text; } };
const mock = { getVoices:()=>[
 {name:'Voz de prueba', lang:'es-ES',voiceURI:'test-es',localService:true,default:true},
 {name:'English voice', lang:'en-US',voiceURI:'test-en',localService:false}],
 addEventListener:()=>{}, cancel(){window.__speech.cancelled++;},
 speak(u){window.__speech.active=u;window.__speech.utterances.push(u);if(u.onstart)u.onstart();},
 pause(){}, resume(){} };
Object.defineProperty(window,'speechSynthesis',{value:mock,configurable:true});
'''
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
    context.add_init_script(MOCK)
    page=context.new_page(); errors=[]; requests=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append((r.method,r.url)))
    page.goto('http://127.0.0.1:8765',wait_until='networkidle')
    expect(page.get_by_role('heading',name='Dale voz a tus PDF.')).to_be_visible()
    page.screenshot(path=str(ART/'desktop-empty.png'),full_page=True)
    page.get_by_role('button',name='Probar con un ejemplo').click()
    expect(page.locator('#document-name')).to_have_text('El placer de escuchar')
    page.get_by_role('button',name='Reproducir',exact=True).click()
    expect(page.get_by_role('button',name='Pausar',exact=True)).to_be_visible()
    assert page.evaluate('window.__speech.utterances.length')==1
    page.get_by_role('button',name='Pausar',exact=True).click()
    page.get_by_role('button',name='Reproducir',exact=True).click()
    page.locator('#speed').select_option('1.5')
    assert page.evaluate('window.__speech.active.rate')==1.5
    page.locator('#voice').select_option('test-en')
    expect(page.locator('#voice-note')).to_contain_text('servicio en línea')
    assert page.evaluate('window.__speech.active.voice.voiceURI')=='test-en'
    page.get_by_role('button',name='Pausar',exact=True).click()
    page.locator('#voice').select_option('')
    page.reload(wait_until='networkidle')
    expect(page.locator('#voice')).to_have_value('')
    page.locator('#file-input').set_input_files(str(ART/'sample.pdf'))
    expect(page.locator('#document-name')).to_have_text('sample.pdf',timeout=30000)
    expect(page.locator('#page-select')).to_have_value('0')
    expect(page.locator('#reading-text')).to_contain_text('Primera pagina')
    page.locator('#page-select').select_option('1')
    expect(page.locator('#reading-text')).to_contain_text('Esta página no contiene texto seleccionable')
    page.get_by_role('button',name='Reproducir',exact=True).click()
    expect(page.locator('#page-select')).to_have_value('2')
    expect(page.locator('#reading-text')).to_contain_text('Tercera pagina')
    page.get_by_role('button',name='Pausar',exact=True).click()
    page.reload(wait_until='networkidle')
    page.locator('#file-input').set_input_files(str(ART/'sample.pdf'))
    expect(page.locator('#page-select')).to_have_value('2',timeout=30000)
    page.locator('#file-input').set_input_files(str(ART/'invalid.pdf'))
    expect(page.locator('#message')).to_contain_text('PDF',timeout=30000)
    expect(page.locator('#document-name')).to_have_text('sample.pdf')
    page.locator('#file-input').set_input_files(str(ART/'protected.pdf'))
    expect(page.locator('#message')).to_contain_text('contraseña',timeout=30000)
    page.locator('#file-input').set_input_files(str(ART/'scanned.pdf'))
    expect(page.locator('#message')).to_contain_text('OCR',timeout=30000)
    expect(page.get_by_role('button',name='Reproducir',exact=True)).to_be_disabled()
    page.get_by_role('button',name='Probar con un ejemplo').click()
    page.get_by_role('button',name='Ayuda').click()
    expect(page.get_by_role('dialog')).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.get_by_role('dialog')).not_to_be_visible()
    for w in [320,390,768,1440]:
        page.set_viewport_size({'width':w,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'Overflow at {w}'
        expect(page.get_by_role('button',name='Reproducir',exact=True)).to_be_visible()
        page.screenshot(path=str(ART/f'reader-{w}.png'),full_page=True)
    assert not errors,errors
    assert not [r for r in requests if r[0]!='GET'],requests
    # Storage denial does not prevent demo or playback; speech absence keeps text usable.
    denied=browser.new_context(viewport={'width':390,'height':844})
    denied.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('denied')}}); Object.defineProperty(window,'speechSynthesis',{value:undefined});")
    d=denied.new_page(); d.goto('http://127.0.0.1:8765')
    d.get_by_role('button',name='Probar con un ejemplo').click()
    expect(d.locator('#reading-text')).to_contain_text('Escuchar')
    expect(d.locator('#speech-warning')).to_be_visible()
    expect(d.get_by_role('button',name='Reproducir',exact=True)).to_be_disabled()
    print(json.dumps({'status':'passed','checks':['demo speech','pause/resume','voice/rate','real PDF extraction','blank page skip','restore same PDF','corrupt PDF','protected PDF','scanned PDF','responsive 320/390/768/1440','help keyboard','storage denied','speech absent','no document HTTP uploads'],'browser_errors':errors,'requests':len(requests)},ensure_ascii=False))
    browser.close()
