# Típusház-kalkulátor · Ingyen Energia Ház Kft. · bemutató

Static single-page app: `index.html` (layout, styles), `app.js` (calculation + screens), `data.js` (every number and text), `logo.png`. No backend, no build step, no external calls.

**Core message:** "A felmérés után a kolléga beírja, amit a helyszínen látott, és a program még aznap kiadja a tételes költségvetést és az ügyfélajánlatot."

**Minta tételek és mintaárak; az alapárak a weboldalukon közölt típusház-leírásokból.**
- **Real** (from their public type-house PDFs): the 7 types, areas, rooms, net prices, garage included or not, the kulcsrakész spec (BAXI 24 kW, gipszkarton, tile/laminate/sanitary allowances, windows) and the exclusions list.
- **Sample (mintaár):** every unit price in the price list, the 120-as itemised budget, rezsi 12% / haszon 13%, the customer-request package lines, **every survey-driven line and price** (the `sv_` items: feltöltés, bontás, fakivágás, daru, szűk bejárás, lemezalap, talajcsere, talajvíz, szakvélemény, bekötővezetékek, 3 fázis bővítés), the sample surveys, the saved offers and customer names.
- Nothing is connected to TERC, Excel, a supplier or their systems.
- Utility connections are excluded from the turnkey price in their spec. The tool only prices them when the colleague ticks **"Vállaljuk a bekötést"**. The exclusion text always stays visible, on the Felmérés screen and on the customer offer (with "kivéve: …" when a connection was taken on).

## What each screen proves (say it out loud)

1. **Típus** – "Kiválasztja a típust, és az alapár meg a műszaki tartalom már ott van, az Önök közölt adataiból."
2. **Felmérés** – "A kolléga a helyszínen beírja, amit látott – lejtő, feltöltés, daru, közművek –, és minden válasz azonnal tétel és ár lesz a költségvetésben."
3. **Ügyfél kérései** – "Minden kérés egy csomag sort jelent: mit vesz ki és mit tesz hozzá a költségvetésből, és az összeg azonnal frissül."
4. **Költségvetés** – "A program kiadja a tételes költségvetést az Önök tételeivel; kék ami a felmérésből jött, zöld ami az ügyfél kérése, piros ami kiesett – a kolléga csak ellenőrzi."
5. **Árlista** – "Az Excel a számokat tárolja, ez azt, hogyan áraznak: egy egységárat átír, és minden nyitott ajánlat újraszámolódik."
6. **Kimenetek** – "Ugyanabból a számításból jön az ügyfélajánlat a helyszíni adottságokkal, a belső költségvetés Excelbe, és a két verzió különbsége soronként."

## The Felmérés screen

Five sections, large touch-friendly inputs (16 px, 44 px high), works at 375 px and 1440 px. Every field shows its live price effect, or a grey chip ("nincs hatása", "nyitott tétel", "az ügyfél intézi · nincs az árban"). The sticky summary on the right splits **Felmérésből** and **Ügyfél kérései**.

| Mező | Ha… | Sor a költségvetésben (mintaár, nettó, rezsi+haszon előtt) |
|---|---|---|
| Terep | enyhe lejtő | Enyhe lejtő: földmunka-többlet, 1 klt × 280 000 |
| | lejtős | Lejtős telek 1 klt × 640 000 + lábazat-magasítás 52 fm × 10 000 |
| Feltöltés | m³ | m³ × 12 000 (7 200 anyag + 4 800 díj) |
| Bontandó épület | m² | m² × 14 000, plus an open item (bontási bejelentés, veszélyes hulladék) |
| Kivágandó fa | db | db × 64 000 |
| Megközelíthetőség | szűk bejárás | Kézi anyagmozgatás 1 klt × 480 000 |
| Daru | nap | nap × 240 000 |
| Szakvélemény | nincs | Szakvélemény megrendelése (javasolt) 1 klt × 144 000; the foundation becomes an **open item** (not in the total) and the foundation choice is locked |
| Alapozás | lemezalap | Lemezalap-többlet 150 m² × 18 000 |
| | talajcsere | m³ × 16 000 |
| Talajvíz | igen | Szigetelés-többlet 165 m² × 5 000 |
| Víz | vállaljuk | fm × 8 000 |
| Csatorna | vállaljuk | fm × 12 000 (+ egyedi szennyvízkezelő 1 800 000, plus an open item for its permit) |
| Villany | vállaljuk | fm × 8 000; with "bővítés kell", + 3 fázis bővítés 180 000 |
| Gáz | vállaljuk, and heating is gas | fm × 10 000. With a heat pump, gas is shown as "nem kell". |
| Ház távolsága az úttól | m | Default length for every connection whose own length is left empty |
| Tükrözött alaprajz | igen | Tervmódosítás line, 0 Ft (moved here from Ügyfél kérései) |

Customer price = line × 1,25 (12% overhead + 13% margin, per chapter). Survey lines carry a blue tag: "felmérésből: …" or "vállalt bekötés: …".
Cross-check: if the customer wants a heat pump and the survey says 1 phase with no upgrade ticked, a warning shows on both screens.

## Maths check (verified with a Node script against app.js, and in the browser)

**120-as master budget (103 lines):** direct cost 67 120 000 Ft. Rezsi and haszon are rounded per chapter: rezsi 8 054 401 + haszon 8 725 599 = 16 780 000 (= 25%). **Total 83 900 000 Ft** = the public price. The two balancing lines that make it exact are `f_epvez` (Építésvezetés, 1 193 711 Ft) and `tk_atadas` (Átadás-átvétel, 185 801 Ft).

**Kovács Péter v2 – line by line:**

| | Számítás | Nettó |
|---|---|---:|
| 120-as alapár | | 83 900 000 |
| **Ügyfél kérései** | | **+13 617 323** |
| Garázs, 2 állásos | 15 sor + 1 áramkör | +8 900 000 |
| Hőszivattyú | +4 200 000 (9 sor) − 1 150 000 (6 gázos sor) | +3 050 000 |
| Tégla válaszfal | | +1 450 000 |
| Hidegburkolat | (14 000 − 8 000) × 40 m² × 1,15 = 276 000 bruttó ÷ 1,27 | +217 323 |
| **Felmérésből** | | **+2 270 000** |
| Enyhe lejtő | 280 000 × 1,25 | +350 000 |
| Feltöltés 35 m³ | 35 × 12 000 = 420 000 × 1,25 | +525 000 |
| Fakivágás 1 db | 64 000 × 1,25 | +80 000 |
| Daru 2 nap | 2 × 240 000 = 480 000 × 1,25 | +600 000 |
| Teherautó bejut, szakvélemény megvan, sávalap, nincs talajvíz | | 0 |
| Víz 14 fm (vállaljuk) | 14 × 8 000 = 112 000 × 1,25 | +140 000 |
| Csatorna, közcsatorna 14 fm (vállaljuk) | 14 × 12 000 = 168 000 × 1,25 | +210 000 |
| Villany 14 fm + 3 fázis bővítés (vállaljuk) | (112 000 + 180 000) × 1,25 | +365 000 |
| Gáz | nem kell (hőszivattyú) | 0 |
| **Nettó** | | **99 787 323** |
| ÁFA 27% | | 26 942 577 |
| **Bruttó** | | **126 729 900** |

The 14 fm lengths come from "ház távolsága az úttól: 14 m" (the length fields are left empty, so they follow it).
Open items on the v2 offer: Hőszivattyú végleges ára, Csempe munkadíj-többlet. The foundation is not open, because the soil report exists.

| Ajánlat | Számítás | Nettó | ÁFA 27% | Bruttó |
|---|---|---:|---:|---:|
| Kovács v1 (gáz, 1 állásos, tégla, csempe; felmérés előtt) | 83 900 000 + 5 900 000 + 1 450 000 + 217 323 | **91 467 323** | 24 696 177 | 116 163 500 |
| Kovács v2 (above) | | **99 787 323** | 26 942 577 | 126 729 900 |
| Tóth Eszter, 94-es alap, **nincs szakvélemény** | 69 000 000 + szakvélemény 144 000 × 1,25 | **69 180 000** | 18 678 600 | 87 858 600 |
| Szabó Bence, 145-ös, hőszivattyú (no survey yet) | 93 900 000 + 3 050 000 | **96 950 000** | 26 176 500 | 123 126 500 |

Tóth shows the open-item behaviour: "Alapozás" becomes an open item (not in the total), and the soil report is a suggested line.

**v1 → v2 comparison:** "gáz → hőszivattyú, 1 → 2 állásos garázs, felmérés: terep, feltöltés, fa, daru, víz, csatorna, villany: **+8 320 000 Ft** nettó". This splits into Ügyfél kérései +6 050 000 (3 000 000 + 3 050 000) and Felmérésből +2 270 000.

**Price list +8%:** Kerámia falazóblokk 30 N+F anyag 12 500 → 13 500 Ft/m². Kovács v1 → +140 000, v2 → +162 500. Banner: **"2 nyitott ajánlat érintett: +302 500 Ft összesen"**, and the 120-as base becomes 83 980 000.

VAT is 27% in `data.js` (`vatRate`). Change it there if the reduced rate applies.

## Changing data

Edit only `data.js`:
- `houses`: real prices.
- `items`: the price list; survey items start with `sv_`.
- `base120`: the budget lines.
- `packages`: customer requests.
- `survey`: fixed survey quantities and the empty-survey defaults.
- `openItems`, `excluded` (`except` names which "Vállaljuk" toggles create a "kivéve" note).
- `offers`, including each offer's `survey`.
- `email`.

## Local preview

```bash
python -m http.server 5174
```
Then open http://localhost:5174. Opening index.html directly also works.

## Deploy (only when Milán says so)

```bash
npx vercel deploy --prod
```

Possible later step (not built): TERC / Excel import-export.

## Kattintási útvonal a híváshoz (10 lépés)

Előtte: felül „Demó alaphelyzet”, majd az Ajánlat menüben „Kovács Péter – 120-as, Mediterrán · v2”.

1. **Típus:** mutasd a 120-ast. *"Itt az Önök hét típusa a közölt árakkal; a 120-ashoz feltöltöttünk egy minta tételes költségvetést."*
2. **Felmérés → 1. Telek:** enyhe lejtő, 35 m³ feltöltés, 1 fa, daru 2 nap. *"Ezt írja be a kolléga a helyszínen, telefonról: minden mező mellett azonnal ott az ára."*
3. **Felmérés → 2. Talaj:** kattints a „nincs” szakvéleményre, majd vissza a „megvan”-ra. *"Ha nincs szakvélemény, az alapozás nyitott tétel lesz, nem találgatunk; a szakvélemény javasolt sorként bekerül."*
4. **Felmérés → 3. Közművek:** mutasd a kék dobozt, majd írd át a ház távolságát 14-ről 20 m-re (és vissza). *"Az Önök leírása szerint a bekötés nem része az árnak; csak ha a „Vállaljuk” be van jelölve, akkor lesz belőle sor, és a hossz az úttól mért távolságból jön."*
5. **Ügyfél kérései:** mutasd a garázst, a hőszivattyút és a jobb oldali összesítőt. *"Külön látszik, mennyi jön a felmérésből (+2 270 000) és mennyi az ügyfél kéréseiből (+13 617 323)."*
6. **Költségvetés → „Csak a változások”.** *"Kék a felmérésből, zöld az ügyfél kérése, piros ami kiesett – ez a tételes költségvetés, amit eddig órákig kézzel írtak át."*
7. **Kimenetek → Ügyfélajánlat.** *"Ugyanaznap kész az ajánlat: helyszíni adottságok, az ügyfél kérései, a nyitott kérdések szövegesen, nettó, ÁFA, bruttó – 99 787 323 Ft + ÁFA."*
8. **Nyomtatás / PDF**, majd **Belső költségvetés → Letöltés Excelbe.** *"Egy oldal az ügyfélnek, a teljes költségvetés Excelben a kollégának."*
9. *(Opcionális)* **Árlista:** keresd „falazóblokk 30”, Szerkesztés → +8%, utána „Visszaállítás”. *"Drágul a tégla: azonnal látja, mely nyitott ajánlatokat érinti és mennyivel."*
10. *(Opcionális)* **Kimenetek → Verzió-összehasonlítás (v1 → v2).** *"A levél utáni első ajánlathoz képest a felmérés és a telefon után +8 320 000 Ft – soronként látszik, mi jött a felmérésből és mi az ügyfél kéréséből."*

A hívás után: „Demó alaphelyzet”.
