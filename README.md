# Típusház-kalkulátor · Ingyen Energia Ház Kft. · bemutató

Static single-page app: `index.html` (layout, styles), `app.js` (calculation + screens), `data.js` (every number and text), `logo.png`. No backend, no build step, no external calls.

**Minta tételek és mintaárak; az alapárak a weboldalukon közölt típusház-leírásokból.**
Real (from their public type-house PDFs): the 7 types, areas, rooms, net prices, garage included or not, the kulcsrakész spec (BAXI 24 kW, gipszkarton, tile/laminate/sanitary allowances, windows) and the exclusions list.
Sample (mintaár): every unit price in the price list, the 120-as itemised budget, rezsi 12% / haszon 13%, the package lines, the saved offers and customer names. Nothing is connected to TERC, Excel, a supplier or their systems.

## What each screen proves (say it out loud)

1. **Típus** – "Kiválasztja a típust, és az alapár meg a műszaki tartalom már ott van, az Önök közölt adataiból."
2. **Módosítások** – "Minden pipa egy csomag sort jelent: mit vesz ki és mit tesz hozzá a költségvetésből, és az összeg azonnal frissül."
3. **Költségvetés** – "A program kiadja a tételes költségvetést az Önök tételeivel; zöld ami bekerült, piros ami kiesett, a kolléga csak ellenőrzi."
4. **Árlista** – "Az Excel a számokat tárolja, ez azt, hogyan áraznak: egy egységárat átír, és minden nyitott ajánlat újraszámolódik."
5. **Kimenetek** – "Ugyanabból a számításból jön az ügyfélajánlat, a belső költségvetés Excelbe, és a két verzió különbsége soronként."

## Maths check (verified with a Node script against app.js)

**120-as master budget (103 lines):** direct cost 67 120 000 Ft. Rezsi and haszon are rounded per chapter: rezsi 8 054 401 + haszon 8 725 599 = 16 780 000 (= 25%). **Total 83 900 000 Ft** = the public price. The two balancing lines that make it exact are `f_epvez` (Építésvezetés, 1 193 711 Ft) and `tk_atadas` (Átadás-átvétel, 185 801 Ft).

**Packages** (lines × 1,25, all line totals multiples of 100 Ft, so they add up exactly):

| Módosítás | Sorok | Nettó |
|---|---|---:|
| Garázs 1 állásos | +14 sor | 5 900 000 |
| Garázs 2 állásos | +15 sor, áramkörök 18 → 19 | 8 900 000 |
| Hőszivattyú | −6 sor (gáz: −1 150 000), +9 sor (+4 200 000) | 3 050 000 |
| Tégla válaszfal | −2 sor, +4 sor, belső vakolás 380 → 564 m² | 1 450 000 |
| Nyílászáró színezés | +2 sor | 980 000 |
| Hővisszanyerős szellőzés | −1 sor, +5 sor | 2 600 000 |
| Helyiségenkénti szabályozás | −1 sor, +3 sor | 650 000 |
| Tükrözött alaprajz | +1 sor (tervmódosítás) | 0 |
| Nagyméretű lap, 40 m² | 40 × 3 000 × 1,25 | 150 000 |

**Tile formula** (spec: bruttó 8 000 Ft/m² keret + 15%; passed through with no rezsi/haszon):
(14 000 − 8 000) × (40 m² × 1,15 = 46 m²) = 276 000 bruttó ÷ 1,27 = **217 323 Ft nettó**.

| Ajánlat | Számítás | Nettó | ÁFA 27% | Bruttó |
|---|---|---:|---:|---:|
| Kovács v1 (gáz, 1 állásos, tégla, csempe 14 000 / 40 m²) | 83 900 000 + 5 900 000 + 1 450 000 + 217 323 | **91 467 323** | 24 696 177 | 116 163 500 |
| Kovács v2 (hőszivattyú, 2 állásos, tégla, csempe) | 83 900 000 + 8 900 000 + 3 050 000 + 1 450 000 + 217 323 | **97 517 323** | 26 329 677 | 123 847 000 |
| Tóth Eszter, 94-es alap | 69 000 000 | **69 000 000** | 18 630 000 | 87 630 000 |
| Szabó Bence, 145-ös, hőszivattyú (2 állásos garázs az árban) | 93 900 000 + 3 050 000 | **96 950 000** | 26 176 500 | 123 126 500 |

v1 → v2 headline: "gáz → hőszivattyú, 1 → 2 állásos garázs: **+6 050 000 Ft** nettó" (3 000 000 + 3 050 000).
Note: to make that headline exact, v1 already has the brick walls and 14 000 Ft tiles. Only heating and garage change between v1 and v2.

**Price list +8%:** Kerámia falazóblokk 30 N+F anyag 12 500 → 13 500 Ft/m². Kovács v1 uses 64 + 48 m² → +140 000; v2 uses 64 + 66 m² → +162 500. Banner: **"2 nyitott ajánlat érintett: +302 500 Ft összesen"**, and the 120-as base becomes 83 980 000. Tóth and Szabó are not affected because their types have no itemised budget yet, and the banner says so. (Your brief said "3 offers / +412 000". The tool shows the real computed numbers instead.)

VAT is 27% in `data.js` (`vatRate`). Change it there if the reduced rate applies.

## Changing data

Edit only `data.js`: `houses` (real prices), `items` (price list), `base120` (budget lines), `packages` (add/remove/change lines per option), `openItems`, `offers`, `email`.

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

1. **Típus:** válaszd a 120-ast. *"Itt az Önök hét típusa a közölt árakkal; a 120-ashoz feltöltöttünk egy minta tételes költségvetést."*
2. **Felül az Ajánlat menü:** válaszd „Kovács Péter … v1”. *"Ez egy tipikus ügyfél: garázzsal, téglafalakkal, drágább csempével kéri."*
3. **Módosítások:** mutasd az összesítőt jobbra. *"Alapár 83,9 millió, a pótmunkák soronként, végösszeg 91 467 323 Ft + ÁFA."*
4. **Fűtés → hőszivattyú.** *"Egy kattintás: kivesz 6 gázos sort, betesz 9 hőszivattyús sort, és szól, hogy 3 fázis kell és gázbekötés nem."*
5. **Garázs → 2 állásos, majd Hővisszanyerős szellőzés be.** *"A függőségek maguktól jönnek: kapu-előkészítés, +1 áramkör, és figyelmeztet, hogy a gépész együtt méretezze."*
6. **Hidegburkolat → Hogyan számolja?** *"Az Önök szabálya a leírásból: csak a 8 000 forintos keret feletti különbözet, 15% vágással, nettósítva."*
7. **Költségvetés:** „Csak a változások”, utána kapcsold be a Belső nézetet. *"Zöld bekerült, piros kiesett, sárga mennyiség; belső nézetben fejezetenként a rezsi és a haszon."*
8. **Árlista:** keresd „falazóblokk 30”, Szerkesztés → +8%. *"Drágul a tégla: azonnal látja, mely nyitott ajánlatokat érinti és mennyivel. Ez az, amit az Excel nem tud."*
9. **Kimenetek → Ügyfélajánlat → Nyomtatás / PDF**, majd **Belső költségvetés → Letöltés Excelbe.** *"Ugyanabból a számításból egy oldalas ajánlat az ügyfélnek, és a teljes költségvetés Excelben a kollégának."*
10. **Verzió-összehasonlítás (v1 → v2).** *"Ha az ügyfél visszaír, hogy mégis hőszivattyú és dupla garázs: +6 050 000 Ft, soronként látszik, mi változott. A kolléga csak ellenőrzi."*

Before the call: in the Árlista, click „Visszaállítás”, then use „Demó alaphelyzet” in the top bar.
