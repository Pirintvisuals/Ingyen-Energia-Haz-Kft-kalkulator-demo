// Ingyen Energia Ház Kft. · Típusház-kalkulátor · bemutató adatai
//
// EZ AZ EGYETLEN ADATFORRÁS. Az app.js csak számol ezekből; a HTML-ben nincs beírt összeg.
//
// VALÓS (a cég weboldalán közölt típusház-leírásokból, ingyenenergiahaz.hu, 2026):
//   - a 7 típus alapadatai és nettó kulcsrakész ára (houses)
//   - a kulcsrakész műszaki tartalom: BAXI 24 kW gázkazán, gipszkarton válaszfal,
//     burkolási keretek (hidegburkolat bruttó 8 000 Ft/m² + 15%, laminált bruttó 7 500 Ft/m² + 5%),
//     szaniter keret bruttó 550 000 Ft, fehér 6 légkamrás 3 rétegű ablak (spec)
//   - ami nem része az árnak (excluded)
//
// MINTA (mintaár / minta tétel, csak a bemutatóhoz – a cég valódi tételei és árai nem nyilvánosak):
//   - az árlista minden anyag- és díj-egységára (items)
//   - a 120-as típus tételes költségvetése (base120): mennyiségek a 120,43 m² nettó /
//     171,2 m² bruttó alapterülethez igazítva; az árakat úgy választottuk, hogy
//     közvetlen költség 67 120 000 + rezsi 12% + haszon 13% = pontosan 83 900 000 Ft (a közölt ár)
//   - a rezsi és haszon %
//   - a módosítási csomagok sorai és árai (packages)
//   - a mentett ajánlatok (offers) és az ügyfélnevek (kitalált minták)
//
// Minden ár NETTÓ forint, kivéve ahol a leírás bruttó keretet ad meg.

window.DATA = {
  vatRate: 0.27,           // ÁFA a végösszeghez (ha kedvezményes kulcs alkalmazható, itt kell átírni)
  allowanceVat: 0.27,      // a műszaki leírás bruttó kereteinek nettósítása
  rezsi: 0.12,             // MINTA: rezsi a közvetlen költségre, fejezetenként
  haszon: 0.13,            // MINTA: haszon a közvetlen költségre, fejezetenként
  validityDays: 30,        // ajánlat érvényessége

  company: { name: "Ingyen Energia Ház Kft.", city: "Szeged" },
  source: "Minta tételek és mintaárak; az alapárak a weboldalukon közölt típusház-leírásokból.",

  // Típusházak (VALÓS). price: nettó kulcsrakész ár. garage: amit az alapár tartalmaz.
  // detailed: van-e feltöltött tételes költségvetés (a bemutatóban csak a 120-ashoz).
  houses: {
    m80:  { m2: 80,  sfx: "as", net: 79.82,  terrace: null,  gross: 98.95, rooms: 4, baths: "1 fürdő-wc, 1 külön wc",             price: 60900000, garage: "none" },
    m94:  { m2: 94,  sfx: "es", net: 94.6,   terrace: 21.5,  gross: 130.4, rooms: 4, baths: "1 fürdő, 1 zuhanyzó-wc, 1 külön wc", price: 69000000, garage: "none" },
    m106: { m2: 106, sfx: "os", net: 106.35, terrace: 13.3,  gross: 144.4, rooms: 4, baths: "2 fürdő-wc, 1 külön wc",             price: 72900000, garage: "none" },
    m120: { m2: 120, sfx: "as", net: 120.43, terrace: 19.1,  gross: 171.2, rooms: 4, baths: "2 fürdő-wc, 1 külön wc",             price: 83900000, garage: "none", detailed: true },
    m126: { m2: 126, sfx: "os", net: 126.28, terrace: 27.77, gross: 189.6, rooms: 5, baths: "2 fürdő-wc, 1 külön wc",             price: 89900000, garage: "1" },
    m145: { m2: 145, sfx: "ös", net: 144.91, terrace: 21.39, gross: 197.9, rooms: 4, baths: "2 fürdő-wc, 1 külön wc",             price: 93900000, garage: "2" },
    m160: { m2: 160, sfx: "as", net: 159.73, terrace: 5.5,   gross: 197.9, rooms: 4, baths: "2 fürdő-wc, 1 külön wc",             price: 96900000, garage: "2" }
  },
  variants: ["Mediterrán", "Antracit"],

  // A kulcsrakész műszaki tartalom (VALÓS, a leírásokból) – a Típus képernyőn és az ajánlaton.
  spec: [
    "40 cm-es tégla külső falazat, homlokzati hőszigeteléssel",
    "Gipszkarton belső válaszfalak",
    "BAXI 24 kW kondenzációs gázkazán, padlófűtés",
    "Fehér műanyag nyílászárók, 6 légkamrás profil, 3 rétegű üvegezés",
    "Hidegburkolat: bruttó 8 000 Ft/m² keretig, + 15% vágási veszteség",
    "Melegburkolat: laminált padló bruttó 7 500 Ft/m² keretig, + 5%",
    "Szaniterek, csaptelepek bruttó 550 000 Ft értékig",
    "Napelem a gépészeti leírás szerint, 1 klíma-kiállás előkészítve"
  ],

  // Hidegburkolat szabály (VALÓS): bruttó 8 000 Ft/m² keret + 15% vágási veszteség.
  // A keret feletti különbözetet számoljuk fel: (ár − 8 000) × felület × 1,15 ÷ 1,27 = nettó.
  tile: {
    allowance: 8000, waste: 0.15,
    sizeRule: "padlón max. 50×50 cm vagy max. 90×15 cm, falon 30×20 és 50×20 cm közötti lap",
    largeLabourItem: "b_nagylap"   // MINTA: nagyméretű lap munkadíj-többlete, Ft/m²
  },

  // Nem része a kulcsrakész árnak (VALÓS, a leírásokból).
  excluded: [
    { id: "kozmu",   text: "Közművek behozatala a telekhatárig, mérőórák kiépítése" },
    { id: "bekotes", text: "Víz, szennyvíz, gáz és villany bekötése a mérőóráktól a házig" },
    { id: "gazterv", text: "Belső gázterv elkészíttetése, engedélyeztetése és rákötése", dropIf: "hp" },
    { id: "terv",    text: "Tervezési költség (a tervdokumentációt a cég készíti)" },
    { id: "terasz",  text: "Teraszok és külső lépcsők burkolása" },
    { id: "lampa",   text: "Lámpatestek, világítótestek" },
    { id: "napelem", text: "Napelem: a szolgáltató felé fizetendő díj" },
    { id: "kerites", text: "Kerítés" },
    { id: "kulso",   text: "Udvari térburkolat, parkosítás, terep- és kertrendezés" }
  ],

  // Költségvetési fejezetek.
  chapters: [
    ["01", "Felvonulás, organizáció"], ["02", "Földmunka"], ["03", "Alapozás (fúrt vagy sávalap)"],
    ["04", "Falazat"], ["05", "Födém, koszorú, áthidalók"], ["06", "Tetőszerkezet és fedés"],
    ["07", "Nyílászárók"], ["08", "Szárazépítés (gipszkarton)"], ["09", "Vakolás"],
    ["10", "Hőszigetelés és homlokzat"], ["11", "Gépészet (víz, csatorna, fűtés)"], ["12", "Villanyszerelés"],
    ["13", "Aljzat és burkolatok"], ["14", "Festés"], ["15", "Szaniterek"],
    ["16", "Napelem, klíma-előkészítés"], ["17", "Takarítás, átadás"], ["18", "Egyedi tételek"]
  ],

  // ÁRLISTA – MINDEN ÁR MINTAÁR. id: { g: csoport, n: megnevezés, u: egység, a: anyag Ft/egység, d: díj Ft/egység }
  // A "keret" tételek a műszaki leírás bruttó kereteinek nettó értékei (8 000 / 1,27; 7 500 / 1,27; 550 000 / 1,27; 2 000 / 1,27).
  items: {
    // Felvonulás, organizáció
    f_organiz: { g: "Felvonulás, organizáció", n: "Felvonulási terület kialakítása, konténer, anyagtároló", u: "klt", a: 238900, d: 291900 },
    f_ideig: { g: "Felvonulás, organizáció", n: "Ideiglenes víz- és villanyvételi hely, építési fogyasztás", u: "klt", a: 185800, d: 79600 },
    f_wc: { g: "Felvonulás, organizáció", n: "Mobil WC bérlete", u: "hó", a: 0, d: 37200 },
    f_kituzes: { g: "Felvonulás, organizáció", n: "Épület kitűzése, geodéziai munkák", u: "klt", a: 0, d: 159200 },
    f_allvany: { g: "Felvonulás, organizáció", n: "Homlokzati állvány bérlete, fel- és leszerelés", u: "m²", a: 1200, d: 1500 },
    f_hulladek: { g: "Felvonulás, organizáció", n: "Építési hulladék elszállítása, konténerrel", u: "db", a: 0, d: 99500 },
    f_epvez: { g: "Felvonulás, organizáció", n: "Építésvezetés, kivitelezési dokumentáció, e-építési napló", u: "klt", a: 0, d: 1193711 },
    f_tervmod: { g: "Felvonulás, organizáció", n: "Tervmódosítás: tükrözött alaprajz (díjmentes)", u: "klt", a: 0, d: 0 },
    // Földmunka
    e_humusz: { g: "Földmunka", n: "Humuszleszedés 20 cm vastagságban, deponálás", u: "m²", a: 0, d: 1200 },
    e_sav: { g: "Földmunka", n: "Sávalap-árok gépi kiemelése", u: "m³", a: 0, d: 6500 },
    e_kezi: { g: "Földmunka", n: "Kézi földkiemelés, árokpótlás", u: "m³", a: 0, d: 18600 },
    e_visszat: { g: "Földmunka", n: "Munkagödör visszatöltése, tömörítés", u: "m³", a: 0, d: 6000 },
    e_kavics: { g: "Földmunka", n: "Kavicsfeltöltés padló alá, rétegenként tömörítve", u: "m³", a: 12600, d: 5300 },
    e_elszall: { g: "Földmunka", n: "Felesleges föld elszállítása", u: "m³", a: 0, d: 9300 },
    e_csatarok: { g: "Földmunka", n: "Alapvezeték árka az épület alatt", u: "fm", a: 0, d: 6000 },
    // Beton, alapozás
    a_beton: { g: "Beton, alapozás", n: "Sávalap betonozása C16/20", u: "m³", a: 38000, d: 9000 },
    a_vasalas: { g: "Beton, alapozás", n: "Betonacél szerelése B500B", u: "kg", a: 500, d: 300 },
    a_zsalu: { g: "Beton, alapozás", n: "Lábazati fal zsaluzása, kizsaluzás", u: "m²", a: 2400, d: 5600 },
    a_labazat: { g: "Beton, alapozás", n: "Lábazati fal betonozása C20/25", u: "m³", a: 55700, d: 13300 },
    a_szig: { g: "Beton, alapozás", n: "Talajnedvesség elleni szigetelés, bitumenes lemez 2 rétegben", u: "m²", a: 3700, d: 2100 },
    a_aljzat: { g: "Beton, alapozás", n: "Aljzatbeton 10 cm, hálós vasalással", u: "m²", a: 5600, d: 2400 },
    a_foldelo: { g: "Beton, alapozás", n: "Alapföldelő, EPH-bekötés", u: "klt", a: 59700, d: 46400 },
    // Falazás
    w_38: { g: "Falazás", n: "Kerámia falazóblokk 38 N+F, külső teherhordó fal, habarccsal", u: "m²", a: 20600, d: 8600 },
    w_30: { g: "Falazás", n: "Kerámia falazóblokk 30 N+F, belső teherhordó és oromfal", u: "m²", a: 12500, d: 5500 },
    w_10: { g: "Falazás", n: "Kerámia falazóelem 10 N+F, válaszfal falazása", u: "m²", a: 6000, d: 4500 },
    w_kiegy: { g: "Falazás", n: "Kiegyenlítő sor, falazóblokk kiegészítő elemek", u: "fm", a: 2000, d: 1300 },
    w_falkoto: { g: "Falazás", n: "Falkötő acélok, csatlakozó elemek", u: "klt", a: 63700, d: 42500 },
    w_kava: { g: "Falazás", n: "Nyíláskávák kialakítása, falazott párkány alá", u: "fm", a: 0, d: 2000 },
    w_vbekotes: { g: "Falazás", n: "Válaszfal bekötése: falkötő acél, első sor alatti szigetelés", u: "fm", a: 1500, d: 1000 },
    w_horony: { g: "Falazás", n: "Villanyszerelési horonyvésés és javítás téglafalban", u: "klt", a: 0, d: 350800 },
    // Födém, koszorú
    s_athid: { g: "Födém, koszorú", n: "Kerámia áthidaló, 38 cm-es falhoz", u: "fm", a: 8600, d: 2000 },
    s_athid10: { g: "Födém, koszorú", n: "Válaszfal áthidaló, 10 cm", u: "fm", a: 4000, d: 1500 },
    s_kosz: { g: "Födém, koszorú", n: "Vasbeton koszorú C20/25, zsaluzással, vasalással", u: "m³", a: 72000, d: 38000 },
    s_fodem: { g: "Födém, koszorú", n: "Gerendás-béléstestes födém, felbetonnal", u: "m²", a: 19200, d: 7300 },
    s_fodemvas: { g: "Födém, koszorú", n: "Felbeton hálós vasalása", u: "m²", a: 1600, d: 660 },
    s_alatam: { g: "Födém, koszorú", n: "Födém-alátámasztás bérlete, szerelése", u: "m²", a: 0, d: 1200 },
    s_padlas: { g: "Födém, koszorú", n: "Padlásfeljáró létra, hőszigetelt", u: "db", a: 126100, d: 33200 },
    // Tetőszerkezet, fedés
    t_racsos: { g: "Tetőszerkezet, fedés", n: "Szeglemezes rácsos fa tetőszerkezet, gyártás és elhelyezés", u: "m²", a: 9800, d: 3200 },
    t_folia: { g: "Tetőszerkezet, fedés", n: "Páraáteresztő tetőfólia, ellenléc, léc", u: "m²", a: 2200, d: 1300 },
    t_cserep: { g: "Tetőszerkezet, fedés", n: "Betoncserép fedés, kiegészítő elemekkel", u: "m²", a: 4600, d: 3400 },
    t_gerinc: { g: "Tetőszerkezet, fedés", n: "Gerinc- és élgerinc kialakítása, szellőzőelemek", u: "fm", a: 6000, d: 3300 },
    t_eresz: { g: "Tetőszerkezet, fedés", n: "Ereszcsatorna és lefolyócső, színes acél", u: "fm", a: 8000, d: 3300 },
    t_deszka: { g: "Tetőszerkezet, fedés", n: "Ereszdeszkázat, homlokdeszka, lazúrozva", u: "m²", a: 9300, d: 5300 },
    t_hofogo: { g: "Tetőszerkezet, fedés", n: "Hófogó rács", u: "fm", a: 4600, d: 1300 },
    t_bado: { g: "Tetőszerkezet, fedés", n: "Bádogos szegélyek, falcsatlakozások", u: "klt", a: 112800, d: 73000 },
    // Nyílászárók
    n_ablak: { g: "Nyílászárók", n: "Műanyag ablak, fehér, 6 légkamrás, 3 rétegű üvegezés, beépítve", u: "m²", a: 169800, d: 18600 },
    n_terajto: { g: "Nyílászárók", n: "Műanyag teraszajtó, fehér, 3 rétegű üvegezés", u: "m²", a: 180500, d: 21200 },
    n_bejarati: { g: "Nyílászárók", n: "Bejárati ajtó, hőszigetelt, biztonsági zárral", u: "db", a: 557300, d: 53100 },
    n_belpark: { g: "Nyílászárók", n: "Belső ablakpárkány, műanyag", u: "fm", a: 6000, d: 2000 },
    n_kulpark: { g: "Nyílászárók", n: "Külső ablakpárkány, alumínium", u: "fm", a: 7300, d: 2700 },
    n_belteri: { g: "Nyílászárók", n: "Beltéri ajtó, fehér, tokkal, kilinccsel", u: "db", a: 90200, d: 19900 },
    n_csatl: { g: "Nyílászárók", n: "Csatlakozó fóliák (belső párazáró, külső páraáteresztő)", u: "fm", a: 1600, d: 800 },
    n_kapu1: { g: "Nyílászárók", n: "Szekcionált garázskapu 2500×2125, kézi nyitású", u: "db", a: 520000, d: 60000 },
    n_kapu2: { g: "Nyílászárók", n: "Szekcionált garázskapu 5000×2125, kézi nyitású", u: "db", a: 880000, d: 90000 },
    n_szinezes: { g: "Nyílászárók", n: "Nyílászárók külső és belső színezése, felár", u: "m²", a: 20000, d: 0 },
    n_szinpark: { g: "Nyílászárók", n: "Színre egyeztetett párkányok, takaróprofilok, felár", u: "klt", a: 114000, d: 0 },
    // Szárazépítés
    g_valaszfal: { g: "Szárazépítés", n: "Gipszkarton válaszfal 100 mm, kétoldali egyrétegű, ásványgyapottal", u: "m²", a: 6000, d: 5000 },
    g_impreg: { g: "Szárazépítés", n: "Impregnált gipszkarton többlet, vizes helyiségek", u: "m²", a: 1500, d: 500 },
    g_almenny: { g: "Szárazépítés", n: "Gipszkarton álmennyezet, függesztett, glettelve", u: "m²", a: 8600, d: 7300 },
    g_parazaro: { g: "Szárazépítés", n: "Párazáró fólia az álmennyezet felett", u: "m²", a: 800, d: 530 },
    // Vakolás
    v_belso: { g: "Vakolás", n: "Belső gépi vakolás, mész-cement", u: "m²", a: 1400, d: 2400 },
    v_kava: { g: "Vakolás", n: "Kávák, élvédők, vakolatháló", u: "fm", a: 800, d: 1200 },
    v_labazat: { g: "Vakolás", n: "Lábazati díszvakolat", u: "m²", a: 6000, d: 4600 },
    // Hőszigetelés, homlokzat
    h_eps: { g: "Hőszigetelés, homlokzat", n: "Homlokzati hőszigetelő rendszer, grafitos EPS 10 cm", u: "m²", a: 10400, d: 8200 },
    h_xps: { g: "Hőszigetelés, homlokzat", n: "Lábazati XPS hőszigetelés 10 cm", u: "m²", a: 8600, d: 4600 },
    h_vakolat: { g: "Hőszigetelés, homlokzat", n: "Színezett vékonyvakolat (Mediterrán / Antracit kivitel)", u: "m²", a: 3600, d: 2400 },
    h_padlas: { g: "Hőszigetelés, homlokzat", n: "Padlásfödém hőszigetelése, ásványgyapot 25 cm", u: "m²", a: 5600, d: 1700 },
    h_padlo: { g: "Hőszigetelés, homlokzat", n: "Padló hőszigetelése, EPS 100, 10 cm", u: "m²", a: 3700, d: 930 },
    h_peremsz: { g: "Hőszigetelés, homlokzat", n: "Peremszigetelő szalag, lépéshang-szigetelés", u: "fm", a: 330, d: 200 },
    // Gépészet
    m_viz: { g: "Gépészet", n: "Hideg-meleg víz vezetékhálózat, ötrétegű cső, szigeteléssel", u: "fm", a: 3200, d: 3500 },
    m_csat: { g: "Gépészet", n: "Belső szennyvízhálózat, KG/PP csövek", u: "fm", a: 4200, d: 3700 },
    m_alapvez: { g: "Gépészet", n: "Alapvezeték az épület alatt, tisztítóidomokkal", u: "fm", a: 6000, d: 4600 },
    m_padlof: { g: "Gépészet", n: "Padlófűtés, rendszerlemez, PE-Xa cső", u: "m²", a: 9000, d: 4200 },
    m_oszto: { g: "Gépészet", n: "Osztó-gyűjtő szekrénnyel, szabályozó szelepekkel", u: "db", a: 152600, d: 33200 },
    m_torolk: { g: "Gépészet", n: "Elektromos törölközőszárító radiátor", u: "db", a: 63700, d: 15900 },
    m_termo: { g: "Gépészet", n: "Hordozható termosztát, vezeték nélküli", u: "db", a: 38000, d: 12000 },
    m_elszivo: { g: "Gépészet", n: "Elszívó ventilátor ablak nélküli helyiségben, utánfutó relével", u: "db", a: 26000, d: 14000 },
    m_kertcsap: { g: "Gépészet", n: "Fagymentes kerti csap", u: "db", a: 29200, d: 10600 },
    m_nyomasp: { g: "Gépészet", n: "Vízvezeték nyomáspróbája, fertőtlenítése", u: "klt", a: 0, d: 59700 },
    m_kazan: { g: "Gépészet", n: "BAXI 24 kW kondenzációs gázkazán, kombi, beépítve", u: "db", a: 420000, d: 60000 },
    m_kazanszer: { g: "Gépészet", n: "Kazán bekötő szerelvények, tágulási tartály, iszapleválasztó", u: "klt", a: 85000, d: 35000 },
    m_fust: { g: "Gépészet", n: "Égéstermék-elvezető, koncentrikus 60/100, tetőátvezetéssel", u: "klt", a: 95000, d: 35000 },
    m_gazcso: { g: "Gépészet", n: "Belső gázvezeték, acélcső, festve", u: "fm", a: 3500, d: 4500 },
    m_gazszerelv: { g: "Gépészet", n: "Gázszerelvények: főelzáró, gázszűrő, készülékcsap", u: "klt", a: 28000, d: 12000 },
    m_gaznyomas: { g: "Gépészet", n: "Gázvezeték nyomáspróbája, beüzemelés, átadási dokumentáció", u: "klt", a: 0, d: 38000 },
    hp_egyseg: { g: "Gépészet", n: "Levegő-víz hőszivattyú, monoblokk, 8 kW", u: "db", a: 1650000, d: 0 },
    hp_puffer: { g: "Gépészet", n: "Puffertároló 100 l, hőszigetelt", u: "db", a: 165000, d: 25000 },
    hp_hmv: { g: "Gépészet", n: "HMV-tároló 200 l, hőszivattyúhoz", u: "db", a: 395000, d: 35000 },
    hp_alap: { g: "Gépészet", n: "Kültéri egység betonalapja, rezgéscsillapító konzol", u: "klt", a: 45000, d: 55000 },
    hp_hidr: { g: "Gépészet", n: "Hidraulikai bekötés: csővezeték, szivattyú, szelepek, szigetelés", u: "klt", a: 185000, d: 95000 },
    hp_szer: { g: "Gépészet", n: "Hőszivattyús rendszer szerelési munkadíja", u: "klt", a: 0, d: 345000 },
    hp_beuz: { g: "Gépészet", n: "Beüzemelés, fűtési görbe beállítása, átadás", u: "klt", a: 0, d: 65000 },
    rc_termo: { g: "Gépészet", n: "Helyiségenkénti szobatermosztát, vezeték nélküli", u: "db", a: 32000, d: 6000 },
    rc_fej: { g: "Gépészet", n: "Motoros szelepfej az osztó-gyűjtőn", u: "db", a: 11500, d: 2500 },
    rc_vezerlo: { g: "Gépészet", n: "Központi vezérlőegység, bekötés, beállítás", u: "klt", a: 88000, d: 48000 },
    hrv_gep: { g: "Gépészet", n: "Hővisszanyerős központi szellőzőgép, 300 m³/h", u: "db", a: 980000, d: 0 },
    hrv_csat: { g: "Gépészet", n: "Légcsatorna-hálózat, elosztódobozok, hőszigeteléssel", u: "klt", a: 420000, d: 260000 },
    hrv_szelep: { g: "Gépészet", n: "Befúvó és elszívó szelepek", u: "db", a: 9500, d: 3000 },
    hrv_kulso: { g: "Gépészet", n: "Külső légbeszívó és kidobó elem, tetőátvezetés", u: "klt", a: 85000, d: 45000 },
    hrv_beszab: { g: "Gépészet", n: "Beszabályozás, légmennyiség-mérés, átadás", u: "klt", a: 0, d: 260000 },
    // Villanyszerelés
    el_mero: { g: "Villanyszerelés", n: "Fogyasztásmérő-szekrény 1×32 A, főelosztó", u: "klt", a: 192400, d: 73000 },
    el_aramkor: { g: "Villanyszerelés", n: "Áramkör kiépítése (dugalj, világítás), vezetékezéssel", u: "db", a: 32000, d: 38000 },
    el_szerelv: { g: "Villanyszerelés", n: "Szerelvények: kapcsolók, dugaljak, fehér", u: "db", a: 3700, d: 2300 },
    el_vilag: { g: "Villanyszerelés", n: "Világítási kiállás (lámpatest nélkül)", u: "db", a: 2000, d: 3300 },
    el_gyenge: { g: "Villanyszerelés", n: "Gyengeáram: TV, internet, csengő előkészítése", u: "klt", a: 86300, d: 73000 },
    el_meres: { g: "Villanyszerelés", n: "Érintésvédelmi mérés, villamos átadási dokumentáció", u: "klt", a: 19900, d: 112800 },
    el_kulter: { g: "Villanyszerelés", n: "Kültéri dugalj és lámpakiállás", u: "db", a: 8000, d: 5300 },
    el_3fazis: { g: "Villanyszerelés", n: "Betáplálás bővítése 3 fázisra (mérőhely, elosztó)", u: "klt", a: 145000, d: 75000 },
    el_hpbekot: { g: "Villanyszerelés", n: "Hőszivattyú villamos bekötése, külön áramkör, védelem", u: "klt", a: 38000, d: 42000 },
    el_garvill: { g: "Villanyszerelés", n: "Garázs világítás és dugalj áramkör", u: "klt", a: 65000, d: 75000 },
    el_kapuvill: { g: "Villanyszerelés", n: "Szekcionált kapu motoros nyitásának villamos előkészítése", u: "klt", a: 28000, d: 34000 },
    // Aljzat, burkolat
    b_esztrich: { g: "Aljzat, burkolat", n: "Úsztatott esztrich 6 cm, padlófűtéshez", u: "m²", a: 4200, d: 2400 },
    b_kenheto: { g: "Aljzat, burkolat", n: "Kenhető vízszigetelés vizes helyiségekben", u: "m²", a: 3300, d: 2000 },
    b_csempe: { g: "Aljzat, burkolat", n: "Hidegburkolat anyaga, keret: bruttó 8 000 Ft/m² (vágási veszteséggel)", u: "m²", a: 6299, d: 0 },
    b_csemperak: { g: "Aljzat, burkolat", n: "Hidegburkolat lerakása padlón és falon, fugázással", u: "m²", a: 1600, d: 10000 },
    b_lamanyag: { g: "Aljzat, burkolat", n: "Laminált padló anyaga, keret: bruttó 7 500 Ft/m² (5% veszteséggel)", u: "m²", a: 5906, d: 0 },
    b_lamrak: { g: "Aljzat, burkolat", n: "Laminált padló lerakása alátéttel, szegőléccel", u: "m²", a: 1200, d: 3500 },
    b_valto: { g: "Aljzat, burkolat", n: "Burkolatváltó profil, keret: bruttó 2 000 Ft/fm", u: "fm", a: 1575, d: 1000 },
    b_garpadlo: { g: "Aljzat, burkolat", n: "Garázspadló: aljzatbeton, simított, kopásálló", u: "m²", a: 5200, d: 2800 },
    b_nagylap: { g: "Aljzat, burkolat", n: "Nagyméretű lap lerakásának munkadíj-többlete", u: "m²", a: 0, d: 3000 },
    // Festés
    p_alapozo: { g: "Festés", n: "Mélyalapozó", u: "m²", a: 160, d: 240 },
    p_glett: { g: "Festés", n: "Glettelés, csiszolás falon és mennyezeten", u: "m²", a: 460, d: 1500 },
    p_festes: { g: "Festés", n: "Diszperziós festés 2 rétegben, fehér", u: "m²", a: 500, d: 1100 },
    // Szaniterek
    sz_keret: { g: "Szaniterek", n: "Szaniterek és csaptelepek, keret: bruttó 550 000 Ft", u: "klt", a: 433071, d: 0 },
    sz_szerel: { g: "Szaniterek", n: "Szaniterek, csaptelepek felszerelése", u: "db", a: 0, d: 12600 },
    sz_wc: { g: "Szaniterek", n: "Falsík mögötti WC-tartály szerelőkerettel", u: "db", a: 55700, d: 18600 },
    sz_konyha: { g: "Szaniterek", n: "Konyhai víz- és lefolyó-kiállás, mosogatógép-csatlakozás", u: "klt", a: 23900, d: 29200 },
    // Napelem, klíma
    np_rendszer: { g: "Napelem, klíma", n: "Napelemes rendszer a gépészeti leírás szerint, inverterrel (minta: 4 kWp)", u: "klt", a: 2189500, d: 464400 },
    np_kabel: { g: "Napelem, klíma", n: "DC/AC kábelezés, túlfeszültség-védelem", u: "klt", a: 146000, d: 79600 },
    np_admin: { g: "Napelem, klíma", n: "Napelem: műszaki dokumentáció, hálózati csatlakozási ügyintézés", u: "klt", a: 0, d: 159200 },
    np_klima: { g: "Napelem, klíma", n: "Klíma-előkészítés: hűtőközegcső, kondenzvíz, villamos kiállás", u: "db", a: 99500, d: 73000 },
    // Takarítás, átadás
    tk_takar: { g: "Takarítás, átadás", n: "Építési végtakarítás, ablaktisztítás", u: "m²", a: 0, d: 1200 },
    tk_atadas: { g: "Takarítás, átadás", n: "Átadás-átvétel, kezelési útmutatók, energetikai tanúsítvány", u: "klt", a: 0, d: 185801 },
    // Garázs
    gar_kieg1: { g: "Garázs", n: "Garázs csatlakozása a házhoz: dilatáció, bádogozás, kiegészítő munkák", u: "klt", a: 0, d: 438000 },
    gar_kieg2: { g: "Garázs", n: "Garázs csatlakozása a házhoz: dilatáció, bádogozás, kiegészítő munkák", u: "klt", a: 0, d: 712600 },
  },

  // A 120-as típus tételes költségvetése (MINTA). [fejezet, árlista-tétel, mennyiség]
  // Kiegyenlítő sorok: "f_epvez" és "tk_atadas" egységára úgy van beállítva, hogy az összeg pontosan 83 900 000 Ft legyen.
  base120: [
    ["01", "f_organiz", 1], ["01", "f_ideig", 1], ["01", "f_wc", 8], ["01", "f_kituzes", 1],
    ["01", "f_allvany", 260], ["01", "f_hulladek", 6], ["01", "f_epvez", 1],
    ["02", "e_humusz", 210], ["02", "e_sav", 48], ["02", "e_kezi", 6], ["02", "e_visszat", 32],
    ["02", "e_kavics", 30], ["02", "e_elszall", 22], ["02", "e_csatarok", 24],
    ["03", "a_beton", 42], ["03", "a_vasalas", 1450], ["03", "a_zsalu", 95], ["03", "a_labazat", 14],
    ["03", "a_szig", 165], ["03", "a_aljzat", 150], ["03", "a_foldelo", 1],
    ["04", "w_38", 132], ["04", "w_30", 64], ["04", "w_kiegy", 52], ["04", "w_falkoto", 1],
    ["04", "w_kava", 68],
    ["05", "s_athid", 48], ["05", "s_kosz", 9], ["05", "s_fodem", 128], ["05", "s_fodemvas", 128],
    ["05", "s_alatam", 128], ["05", "s_padlas", 1],
    ["06", "t_racsos", 210], ["06", "t_folia", 210], ["06", "t_cserep", 210], ["06", "t_gerinc", 32],
    ["06", "t_eresz", 62], ["06", "t_deszka", 26], ["06", "t_hofogo", 30], ["06", "t_bado", 1],
    ["07", "n_ablak", 26], ["07", "n_terajto", 7.5], ["07", "n_bejarati", 1], ["07", "n_belpark", 18],
    ["07", "n_kulpark", 18], ["07", "n_belteri", 8], ["07", "n_csatl", 95],
    ["08", "g_valaszfal", 92], ["08", "g_impreg", 18], ["08", "g_almenny", 121], ["08", "g_parazaro", 121],
    ["09", "v_belso", 380], ["09", "v_kava", 120], ["09", "v_labazat", 30],
    ["10", "h_eps", 150], ["10", "h_xps", 30], ["10", "h_vakolat", 150], ["10", "h_padlas", 128],
    ["10", "h_padlo", 120], ["10", "h_peremsz", 140],
    ["11", "m_viz", 95], ["11", "m_csat", 58], ["11", "m_alapvez", 24], ["11", "m_padlof", 112],
    ["11", "m_oszto", 2], ["11", "m_torolk", 2], ["11", "m_termo", 1], ["11", "m_elszivo", 3],
    ["11", "m_kertcsap", 1], ["11", "m_nyomasp", 1], ["11", "m_kazan", 1], ["11", "m_kazanszer", 1],
    ["11", "m_fust", 1], ["11", "m_gazcso", 14], ["11", "m_gazszerelv", 1], ["11", "m_gaznyomas", 1],
    ["12", "el_mero", 1], ["12", "el_aramkor", 18], ["12", "el_szerelv", 72], ["12", "el_vilag", 26],
    ["12", "el_gyenge", 1], ["12", "el_meres", 1], ["12", "el_kulter", 4],
    ["13", "b_esztrich", 120], ["13", "b_kenheto", 32], ["13", "b_csempe", 98.9], ["13", "b_csemperak", 86],
    ["13", "b_lamanyag", 69.3], ["13", "b_lamrak", 66], ["13", "b_valto", 12],
    ["14", "p_alapozo", 685], ["14", "p_glett", 685], ["14", "p_festes", 685],
    ["15", "sz_keret", 1], ["15", "sz_szerel", 14], ["15", "sz_wc", 3], ["15", "sz_konyha", 1],
    ["16", "np_rendszer", 1], ["16", "np_kabel", 1], ["16", "np_admin", 1], ["16", "np_klima", 1],
    ["17", "tk_takar", 120], ["17", "tk_atadas", 1]
  ],

  // MÓDOSÍTÁSI CSOMAGOK (MINTA). Minden csomag sorokból áll:
  //   add:    [fejezet, tétel, mennyiség, (megnevezés felülírása)] – új sor, zöld
  //   remove: [tétel, ...]                                          – az alap sora kiesik, áthúzva
  //   change: [tétel, +mennyiség]                                   – alap sor mennyisége változik (régi → új)
  // A csomag ára = sorai × (1 + rezsi + haszon). A célösszegek (a régi bemutató mintaárai):
  //   garázs 1 állásos 5 900 000 · 2 állásos 8 900 000 · tégla válaszfal 1 450 000 · hőszivattyú 4 200 000
  //   elmaradó gázkazán −1 150 000 · nyílászáró színezés 980 000 · helyiségenkénti szabályozás 650 000 · szellőzés 2 600 000
  packages: {
    garage1: { tag: "Garázs, 1 állásos", add: [
      ["02", "e_sav", 14, "Garázs: sávalap-árok gépi kiemelése"],
      ["03", "a_beton", 12, "Garázs: sávalap betonozása C16/20"],
      ["03", "a_vasalas", 380, "Garázs: betonacél szerelése B500B"],
      ["04", "w_30", 48, "Garázs: falazat kerámia falazóblokk 30 N+F"],
      ["05", "s_kosz", 2, "Garázs: vasbeton koszorú"],
      ["06", "t_racsos", 34, "Garázs: rácsos fa tetőszerkezet"],
      ["06", "t_folia", 34, "Garázs: tetőfólia, ellenléc, léc"],
      ["06", "t_cserep", 34, "Garázs: betoncserép fedés"],
      ["07", "n_kapu1", 1],
      ["09", "v_belso", 70, "Garázs: belső vakolás"],
      ["10", "h_vakolat", 42, "Garázs: színezett vékonyvakolat"],
      ["12", "el_garvill", 1],
      ["13", "b_garpadlo", 21],
      ["06", "gar_kieg1", 1]
    ]},
    garage2: { tag: "Garázs, 2 állásos", add: [
      ["02", "e_sav", 20, "Garázs: sávalap-árok gépi kiemelése"],
      ["03", "a_beton", 17, "Garázs: sávalap betonozása C16/20"],
      ["03", "a_vasalas", 540, "Garázs: betonacél szerelése B500B"],
      ["04", "w_30", 66, "Garázs: falazat kerámia falazóblokk 30 N+F"],
      ["05", "s_kosz", 3, "Garázs: vasbeton koszorú"],
      ["06", "t_racsos", 52, "Garázs: rácsos fa tetőszerkezet"],
      ["06", "t_folia", 52, "Garázs: tetőfólia, ellenléc, léc"],
      ["06", "t_cserep", 52, "Garázs: betoncserép fedés"],
      ["07", "n_kapu2", 1],
      ["09", "v_belso", 98, "Garázs: belső vakolás"],
      ["10", "h_vakolat", 56, "Garázs: színezett vékonyvakolat"],
      ["12", "el_garvill", 1],
      ["12", "el_kapuvill", 1],
      ["13", "b_garpadlo", 38],
      ["06", "gar_kieg2", 1]
    ], change: [["el_aramkor", 1]],
      deps: ["2 állásos kapu: motoros nyitás villamos előkészítése", "+1 áramkör a főelosztóban"] },

    hp: { tag: "Hőszivattyú",
      remove: ["m_kazan", "m_kazanszer", "m_fust", "m_gazcso", "m_gazszerelv", "m_gaznyomas"],
      add: [
        ["11", "hp_egyseg", 1], ["11", "hp_puffer", 1], ["11", "hp_hmv", 1], ["11", "hp_alap", 1],
        ["11", "hp_hidr", 1], ["11", "hp_szer", 1], ["11", "hp_beuz", 1],
        ["12", "el_3fazis", 1], ["12", "el_hpbekot", 1]
      ],
      deps: ["villany: 3 fázis szükséges", "gázbekötés nem kell"] },

    brick: { tag: "Tégla válaszfal",
      remove: ["g_valaszfal", "g_impreg"],
      add: [
        ["04", "w_10", 92], ["04", "w_vbekotes", 46], ["04", "w_horony", 1], ["05", "s_athid10", 14]
      ],
      change: [["v_belso", 184]],
      deps: ["belső vakolás a válaszfalak két oldalán is"] },

    winColor: { tag: "Nyílászáró színezés", add: [["07", "n_szinezes", 33.5], ["07", "n_szinpark", 1]] },

    hrv: { tag: "Hővisszanyerős szellőzés",
      remove: ["m_elszivo"],
      add: [["11", "hrv_gep", 1], ["11", "hrv_csat", 1], ["11", "hrv_szelep", 12], ["11", "hrv_kulso", 1], ["11", "hrv_beszab", 1]],
      deps: ["az elszívó ventilátorok kimaradnak"] },

    roomCtl: { tag: "Helyiségenkénti szabályozás",
      remove: ["m_termo"],
      add: [["11", "rc_termo", 7], ["11", "rc_fej", 12], ["11", "rc_vezerlo", 1]] },

    mirror: { tag: "Tükrözött alaprajz", add: [["01", "f_tervmod", 1]] }
  },

  // Nyitott tételek: nem kerülnek az összegbe. when: mikor jelenik meg.
  openItems: [
    { id: "alapozas", when: "always", label: "Alapozás",
      text: "A talajmechanikai szakvélemény után. Fúrt vagy sávalap az alapár része, más alapozás (talajcsere, lemezalap) többletköltség." },
    { id: "hp", when: "hp", label: "Hőszivattyú végleges ára",
      text: "A hőszükséglet-számítás és a gépész méretezése után. Az ajánlat átlagos rendszerrel számol." },
    { id: "csempe", when: "tileUnknown", label: "Csempe munkadíj-többlet",
      text: "Csak ha a választott lap nagyobb a műszaki leírás méretszabályánál. A lapméret még nem ismert." },
    { id: "nagylap", when: "tileBig", label: "Nagylapos burkolás munkadíja",
      text: "A sor becsült mintaárral szerepel; a végleges összeg a burkoló ajánlata után." }
  ],

  // Mentett ajánlatok (MINTA, kitalált ügyfelek).
  // opts: garage "none" | "1" | "2" · heat "gas" | "hp" · walls "gk" | "brick" · tileSize "ok" | "big" | "unknown"
  offers: [
    { id: "kovacs-v1", customer: "Kovács Péter", ref: "IEH-2026-041", version: 1, date: "2026-11-03",
      type: "m120", variant: "Mediterrán", location: "Kiskundorozsma",
      note: "Első ajánlat: gázkazánnal, 1 állásos garázzsal.",
      opts: { garage: "1", heat: "gas", walls: "brick", tilePrice: 14000, tileArea: 40, tileSize: "unknown",
              winColor: false, hrv: false, roomCtl: false, mirror: false, custom: [] } },
    { id: "kovacs-v2", customer: "Kovács Péter", ref: "IEH-2026-041", version: 2, date: "2026-11-07",
      type: "m120", variant: "Mediterrán", location: "Kiskundorozsma",
      note: "Telefonos egyeztetés után: hőszivattyú, 2 állásos garázs.",
      opts: { garage: "2", heat: "hp", walls: "brick", tilePrice: 14000, tileArea: 40, tileSize: "unknown",
              winColor: false, hrv: false, roomCtl: false, mirror: false, custom: [] } },
    { id: "toth-v1", customer: "Tóth Eszter", ref: "IEH-2026-044", version: 1, date: "2026-11-05",
      type: "m94", variant: "Antracit", location: "Szeged",
      note: "Alap kivitel, módosítás nélkül.",
      opts: { garage: "none", heat: "gas", walls: "gk", tilePrice: 8000, tileArea: 0, tileSize: "ok",
              winColor: false, hrv: false, roomCtl: false, mirror: false, custom: [] } },
    { id: "szabo-v1", customer: "Szabó Bence", ref: "IEH-2026-046", version: 1, date: "2026-11-06",
      type: "m145", variant: "Antracit", location: "Algyő",
      note: "Hőszivattyúval; a 2 állásos garázs az alapár része.",
      opts: { garage: "2", heat: "hp", walls: "gk", tilePrice: 8000, tileArea: 0, tileSize: "ok",
              winColor: false, hrv: false, roomCtl: false, mirror: false, custom: [] } }
  ],

  // Beérkezett levél (MINTA). A "Kitöltés a levélből" gomb ezek alapján állítja be a módosításokat.
  // Szkriptelt hozzárendelés, nem szövegértés: minden kiemelt mondatrészhez fix beállítás tartozik.
  email: {
    from: "Kovács Péter", subject: "120-as Mediterrán ház", received: "2026. november 3., 9:42",
    body: [
      "Jó napot!\n\nA ", { k: "type", t: "120-as Mediterrán házat" }, " néznénk Kiskundorozsmán, a telek megvan. ",
      { k: "garage", t: "Garázzsal" }, " kérnénk, ", { k: "heat", t: "gáz helyett hőszivattyúval" }, ", és ha lehet ",
      { k: "walls", t: "tégla válaszfalakkal" }, ". A fürdőkbe ", { k: "tile", t: "drágább csempét szeretnénk, kb. 14 ezres négyzetméterárút" },
      ". ", { k: "fence", t: "Kerítés is kellene" }, ". Mennyi lenne így nagyjából?\n\nÜdv,\nKovács Péter"
    ],
    sets: {
      type:   { set: { type: "m120", variant: "Mediterrán" }, label: "Típus: 120-as, Mediterrán" },
      garage: { set: { garage: "1" }, label: "Garázs: 1 állásos", note: "A levél nem írja, 1 vagy 2 állásos – visszakérdezni. Addig 1 állással számol." },
      heat:   { set: { heat: "hp" }, label: "Fűtés: levegő-víz hőszivattyú" },
      walls:  { set: { walls: "brick" }, label: "Válaszfalak: tégla" },
      tile:   { set: { tilePrice: 14000, tileArea: 40, tileSize: "unknown" }, label: "Hidegburkolat: 14 000 Ft/m², 40 m²",
                note: "Bruttó bolti árnak vesszük. 40 m² minta-felület (2 fürdő, padló + fal) – a kolléga ellenőrzi." },
      fence:  { set: {}, label: "Kerítés: nem része az árnak – külön ajánlat" }
    }
  }
};
