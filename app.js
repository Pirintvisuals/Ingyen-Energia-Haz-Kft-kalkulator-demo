// Típusház-kalkulátor · bemutató
// Ez a fájl csak számol és megjelenít. Minden szám és szöveg forrása a data.js.
(function () {
  "use strict";
  var D = window.DATA;
  var NB = " ";
  var MONTHS = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"];
  var GROUPS = ["garage", "heat", "walls", "tile", "winColor", "hrv", "roomCtl", "mirror", "custom"];
  var CHMAP = {};
  D.chapters.forEach(function (c) { CHMAP[c[0]] = c[1]; });
  var BASE_CH = {}, BASE_QTY = {};
  D.base120.forEach(function (b) { BASE_CH[b[1]] = b[0]; BASE_QTY[b[1]] = b[2]; });

  // ---------- formázás ----------
  function rnd(x) { return x < 0 ? -Math.round(-x) : Math.round(x); }
  function grp(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  function fInt(n) { n = rnd(n); return (n < 0 ? "−" : "") + grp(String(Math.abs(n))); }
  function fFt(n) { return fInt(n) + NB + "Ft"; }
  function fSigned(n) { n = rnd(n); if (n === 0) return "0" + NB + "Ft"; return (n > 0 ? "+" : "−") + grp(String(Math.abs(n))) + NB + "Ft"; }
  function fDec(x, max) {
    if (x == null || isNaN(x)) return "";
    var neg = x < 0; x = Math.abs(x);
    var s = x.toFixed(max == null ? 2 : max);
    if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    var p = s.split(".");
    return (neg ? "−" : "") + grp(p[0]) + (p[1] ? "," + p[1] : "");
  }
  function fPct(x) { return fDec(x * 100, 1) + "%"; }
  function parseNum(s) { var v = parseFloat(String(s).replace(/[\s ]/g, "").replace(",", ".")); return isNaN(v) ? 0 : v; }
  function rawNum(x) { return x ? String(x).replace(".", ",") : ""; }
  function fDate(iso) { var p = iso.split("-"); return p[0] + ". " + MONTHS[+p[1] - 1] + " " + (+p[2]) + "."; }
  function addDays(iso, n) { var d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function today() { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function typeName(type) { var h = D.houses[type]; return h.m2 + "-" + h.sfx; }
  var GARAGE_LBL = { none: "nincs", "1": "1 állásos", "2": "2 állásos" };

  // ---------- árak ----------
  function priceFn(over) {
    return function (id) {
      var it = D.items[id], o = over && over[id];
      return { a: o && o.a != null ? o.a : it.a, d: o && o.d != null ? o.d : it.d };
    };
  }
  var ORIG = priceFn(null);

  // ---------- számolás ----------
  function defaultOpts(type) {
    return { garage: D.houses[type].garage, heat: "gas", walls: "gk", tilePrice: D.tile.allowance, tileArea: 0,
      tileSize: "ok", winColor: false, hrv: false, roomCtl: false, mirror: false, custom: [] };
  }
  function applyGroup(o, src, g) {
    o = clone(o);
    if (g === "tile") { o.tilePrice = src.tilePrice; o.tileArea = src.tileArea; o.tileSize = src.tileSize; }
    else if (g === "custom") o.custom = clone(src.custom || []);
    else o[g] = src[g];
    return o;
  }
  function tileOn(o) { return o.tilePrice > D.tile.allowance && o.tileArea > 0; }

  // Mely csomagok aktívak. group: melyik vezérlőhöz tartozik.
  function activePkgs(type, o) {
    var inc = D.houses[type].garage, list = [], P = D.packages;
    if (o.garage !== inc) {
      if (inc === "none") list.push({ group: "garage", pkg: P["garage" + o.garage] });
      else if (inc === "1" && o.garage === "2") list.push({ group: "garage", pkg: P.garage2, minus: P.garage1 });
    }
    if (o.heat === "hp") list.push({ group: "heat", pkg: P.hp });
    if (o.walls === "brick") list.push({ group: "walls", pkg: P.brick });
    if (o.winColor) list.push({ group: "winColor", pkg: P.winColor });
    if (o.hrv) list.push({ group: "hrv", pkg: P.hrv });
    if (o.roomCtl) list.push({ group: "roomCtl", pkg: P.roomCtl });
    if (o.mirror) list.push({ group: "mirror", pkg: P.mirror });
    return list;
  }

  function mkRow(P, ch, it, q, name, status, tag, group) {
    var p = P(it), i = D.items[it];
    return { ch: ch, item: it, name: name || i.n, unit: i.u, qty: q, qtyOld: null, a: p.a, d: p.d,
      status: status, tag: tag || null, group: group || null, noMarkup: false };
  }

  function baseTotal(P) {
    return build({ type: "m120", opts: defaultOpts("m120") }, P, true).total;
  }

  // A költségvetés felépítése: alap sorok + csomagok sorai, fejezetenként rezsi és haszon.
  function build(offer, P, isBase) {
    P = P || priceNow();
    var h = D.houses[offer.type], o = offer.opts, detailed = !!h.detailed;
    var rows = [], byItem = {};
    if (detailed) D.base120.forEach(function (b) {
      var r = mkRow(P, b[0], b[1], b[2], null, "base"); r.key = "b:" + b[1]; rows.push(r); byItem[b[1]] = r;
    });
    activePkgs(offer.type, o).forEach(function (ap) {
      var pkg = ap.pkg, g = ap.group;
      (pkg.remove || []).forEach(function (it) {
        if (detailed) { var r = byItem[it]; r.status = "removed"; r.tag = pkg.tag; r.group = g; }
        else { var v = mkRow(P, BASE_CH[it], it, BASE_QTY[it], null, "removed", pkg.tag, g); v.key = "b:" + it; v.virtual = true; rows.push(v); }
      });
      (pkg.change || []).forEach(function (c) {
        if (detailed) { var r = byItem[c[0]]; r.qtyOld = r.qty; r.qty = r.qty + c[1]; r.status = "changed"; r.tag = pkg.tag; r.group = g; }
        else { var v = mkRow(P, BASE_CH[c[0]], c[0], c[1], D.items[c[0]].n + " – többlet", "added", pkg.tag, g); v.key = "x:" + c[0]; rows.push(v); }
      });
      (pkg.add || []).forEach(function (a) {
        var r = mkRow(P, a[0], a[1], a[2], a[3], "added", pkg.tag, g); r.key = "p:" + r.name; rows.push(r);
      });
      if (ap.minus) (ap.minus.add || []).forEach(function (a) {
        var r = mkRow(P, a[0], a[1], a[2], a[3], "removed", "Az alapár 1 állásos garázsa", g); r.key = "m:" + a[1] + ":" + r.name; r.virtual = true; rows.push(r);
      });
    });
    if (tileOn(o)) {
      var diff = o.tilePrice - D.tile.allowance, q = o.tileArea * (1 + D.tile.waste);
      rows.push({ ch: "13", item: null, key: "tile", name: "Hidegburkolat: keret feletti különbözet (választott lap bruttó " + fInt(o.tilePrice) + " Ft/m²)",
        unit: "m²", qty: q, a: diff / (1 + D.allowanceVat), d: 0, status: "added", tag: "Hidegburkolat", group: "tile", noMarkup: true, how: true });
    }
    if (o.tileSize === "big" && o.tileArea > 0) {
      var nr = mkRow(P, "13", D.tile.largeLabourItem, o.tileArea, null, "added", "Nagyméretű lap", "tile"); nr.key = "nagylap"; rows.push(nr);
    }
    (o.custom || []).forEach(function (c, i) {
      rows.push({ ch: "18", item: null, key: "c:" + i + ":" + c.name, name: c.name || "Egyedi tétel", unit: c.unit || "db", qty: +c.qty || 0,
        a: +c.price || 0, d: 0, status: "added", tag: "Egyedi tétel", group: "custom", noMarkup: true, custom: true });
    });
    rows.forEach(function (r) { r.matT = rnd(r.qty * r.a); r.labT = rnd(r.qty * r.d); });

    var chs = D.chapters.map(function (c) { return { code: c[0], name: c[1], rows: [], mat: 0, lab: 0, N: 0 }; });
    var cm = {}; chs.forEach(function (c) { cm[c.code] = c; });
    rows.forEach(function (r) { cm[r.ch].rows.push(r); });
    chs.forEach(function (c) {
      var seq = 0;
      c.rows.forEach(function (r) {
        r.tsz = c.code + "-" + String(++seq).padStart(3, "0");
        var sign = r.status === "removed" ? (detailed ? 0 : -1) : 1;
        if (!sign) return;
        if (r.noMarkup) c.N += sign * (r.matT + r.labT);
        else { c.mat += sign * r.matT; c.lab += sign * r.labT; }
      });
      c.D = c.mat + c.lab;
      c.rezsi = rnd(c.D * D.rezsi); c.haszon = rnd(c.D * D.haszon);
      c.sell = c.D + c.rezsi + c.haszon + c.N;
      c.changed = c.rows.some(function (r) { return r.status !== "base"; });
    });
    var sum = function (k) { return chs.reduce(function (s, c) { return s + c[k]; }, 0); };
    var res = { rows: rows, chs: chs.filter(function (c) { return c.rows.length; }), detailed: detailed, house: h,
      mat: sum("mat"), lab: sum("lab"), D: sum("D"), rezsi: sum("rezsi"), haszon: sum("haszon"), N: sum("N") };
    if (detailed) { res.total = sum("sell"); res.base = isBase ? res.total : baseTotal(P); }
    else { res.base = h.price; res.total = h.price + sum("sell"); }
    res.extras = res.total - res.base;
    res.vat = rnd(res.total * D.vatRate); res.gross = res.total + res.vat;
    return res;
  }

  // Vezérlőnkénti hatás: a módosításokat sorban rakja rá az alapra, így az összegük pontosan a pótmunkák összege.
  function effects(offer, P) {
    var o = defaultOpts(offer.type), out = {};
    var prev = build({ type: offer.type, opts: o }, P).total;
    GROUPS.forEach(function (g) {
      o = applyGroup(o, offer.opts, g);
      var t = build({ type: offer.type, opts: o }, P).total;
      out[g] = t - prev; prev = t;
    });
    return out;
  }

  function openItems(o) {
    return D.openItems.filter(function (x) {
      return x.when === "always" || (x.when === "hp" && o.heat === "hp") ||
        (x.when === "tileUnknown" && o.tileSize === "unknown" && o.tileArea > 0) ||
        (x.when === "tileBig" && o.tileSize === "big" && o.tileArea > 0);
    });
  }

  function crossNotes(o) {
    var n = [];
    if (o.heat === "hp" && o.hrv) n.push({ g: ["heat", "hrv"], t: "Hőszivattyú + hővisszanyerős szellőzés: a gépész méretezze együtt (hőszükséglet, légmennyiség)." });
    if (o.heat === "hp" && o.roomCtl) n.push({ g: ["heat", "roomCtl"], t: "A helyiségenkénti szabályozást a hőszivattyú vezérlésével együtt kell beállítani." });
    return n;
  }

  // Sorszámláló chipek egy vezérlőhöz.
  function pkgChips(offer, group) {
    var ap = activePkgs(offer.type, offer.opts).filter(function (x) { return x.group === group; })[0];
    if (!ap) return [];
    var p = ap.pkg, out = [];
    var rem = (p.remove || []).length + (ap.minus ? ap.minus.add.length : 0);
    if (rem) out.push({ c: "rem", t: "−" + rem + " sor" });
    if (p.add && p.add.length) out.push({ c: "add", t: "+" + p.add.length + " sor" });
    (p.change || []).forEach(function (c) {
      if (D.houses[offer.type].detailed) out.push({ c: "chg", t: shortName(c[0]) + ": " + fDec(BASE_QTY[c[0]]) + " → " + fDec(BASE_QTY[c[0]] + c[1]) + " " + D.items[c[0]].u });
      else out.push({ c: "chg", t: shortName(c[0]) + ": +" + fDec(c[1]) + " " + D.items[c[0]].u });
    });
    (p.deps || []).forEach(function (t) { out.push({ c: "dep", t: t }); });
    return out;
  }
  function shortName(it) { return { v_belso: "belső vakolás", el_aramkor: "áramkörök" }[it] || D.items[it].n; }
  // Bontás: mennyi a hozzáadott és mennyi a kieső rész (eladási áron).
  function pkgSplit(offer, group, P) {
    var ap = activePkgs(offer.type, offer.opts).filter(function (x) { return x.group === group; })[0];
    if (!ap) return null;
    var m = 1 + D.rezsi + D.haszon, add = 0, rem = 0;
    (ap.pkg.add || []).forEach(function (a) { var p = P(a[1]); add += rnd(a[2] * p.a) + rnd(a[2] * p.d); });
    (ap.pkg.remove || []).forEach(function (it) { var p = P(it); rem += rnd(BASE_QTY[it] * p.a) + rnd(BASE_QTY[it] * p.d); });
    return { add: rnd(add * m), rem: rnd(rem * m) };
  }

  // ---------- állapot ----------
  var KEY = "iehTipushazKalkulator.v1";
  var state = { offers: clone(D.offers), currentId: "kovacs-v2", prices: {}, screen: "tipus",
    internal: false, onlyChanges: false, collapsed: {}, howOpen: false, outTab: "offer", cmpA: null, cmpB: null,
    plSearch: "", plEdit: null, mail: { open: false, applied: false } };
  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.offers && saved.offers.length) {
      state.offers = saved.offers; state.currentId = saved.currentId; state.prices = saved.prices || {};
    }
  } catch (e) { /* localStorage nélkül is működik */ }
  if (!state.offers.some(function (o) { return o.id === state.currentId; })) state.currentId = state.offers[0].id;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify({ offers: state.offers, currentId: state.currentId, prices: state.prices })); } catch (e) { }
  }
  function cur() { return state.offers.filter(function (o) { return o.id === state.currentId; })[0]; }
  function priceNow() { return priceFn(state.prices); }
  function hasOverrides() { return Object.keys(state.prices).length > 0; }

  // ---------- közös HTML darabok ----------
  function offerLabel(o) {
    var base = o.customer + " – " + typeName(o.type) + ", " + o.variant + " · v" + o.version;
    var dup = state.offers.some(function (x) { return x !== o && x.customer === o.customer && x.version === o.version && x.ref !== o.ref; });
    return dup ? base + " (" + o.ref + ")" : base;
  }

  function renderTop() {
    var sel = document.getElementById("offerSel");
    sel.innerHTML = state.offers.map(function (o) {
      return '<option value="' + esc(o.id) + '"' + (o.id === state.currentId ? " selected" : "") + ">" + esc(offerLabel(o)) + "</option>";
    }).join("");
    var o = cur(), b = build(o);
    var steps = [["tipus", "Típus"], ["mod", "Módosítások"], ["kv", "Költségvetés"], ["arlista", "Árlista"], ["ki", "Kimenetek"]];
    document.getElementById("steps").innerHTML = steps.map(function (s, i) {
      return '<button data-act="go" data-v="' + s[0] + '"' + (state.screen === s[0] ? ' aria-current="page"' : "") + '><span class="n">' + (i + 1) + "</span>" + s[1] + "</button>";
    }).join("") + '<div class="ctx">' + esc(o.customer) + " · " + typeName(o.type) + " · v" + o.version + " · <b>" + fFt(b.total) + "</b> + ÁFA</div>";
  }

  function head(title, lead, right) {
    return '<div class="screen-head"><div><h2>' + title + "</h2><p>" + lead + "</p></div>" + (right || "") + "</div>";
  }

  // ---------- 1. Típus ----------
  function screenTipus() {
    var o = cur(), keys = Object.keys(D.houses);
    var cards = keys.map(function (k) {
      var h = D.houses[k], on = o.type === k;
      var gar = h.garage === "none" ? "nincs (pótmunkaként kérhető)" : GARAGE_LBL[h.garage] + ", az árban";
      return '<button class="tcard" data-act="type" data-v="' + k + '" aria-pressed="' + on + '">' +
        '<div class="tt">' + typeName(k) + "<small>típusház</small></div>" +
        (on ? '<span class="pill blue sel">Kiválasztva</span>' : "") +
        "<dl><dt>Alapterület</dt><dd>" + fDec(h.net) + " m² nettó · " + fDec(h.gross) + " m² bruttó</dd>" +
        "<dt>Terasz</dt><dd>" + (h.terrace ? fDec(h.terrace) + " m²" : "–") + "</dd>" +
        "<dt>Szobák</dt><dd>" + h.rooms + "</dd><dt>Vizes helyiség</dt><dd>" + h.baths + "</dd>" +
        "<dt>Garázs</dt><dd>" + gar + "</dd></dl>" +
        '<div class="tp">' + fFt(h.price) + " <span>nettó + ÁFA</span></div>" +
        (h.detailed ? '<div><span class="pill ok">Tételes költségvetés feltöltve</span></div>' : '<div><span class="pill">Csak alapár</span></div>') +
        "</button>";
    }).join("");
    var h = D.houses[o.type];
    var note = h.detailed ? "" :
      '<div class="note" style="margin-top:14px">A részletes költségvetés ehhez a típushoz élesben kerül feltöltésre. A bemutatóban az alapár a közölt ár, a módosítások a 120-as típus mintasoraival számolnak.</div>';
    return head("Típus", "Válassza ki a típusházat. Az alapár, az alapterület és a műszaki tartalom a weboldalon közölt típusház-leírásokból származik.",
        '<button class="btn primary" data-act="go" data-v="mod">Tovább: Módosítások →</button>') +
      '<div class="types">' + cards + "</div>" + note +
      '<div class="s1-bottom">' +
      '<div class="card"><h3 style="font-size:16px;margin-bottom:12px">Ajánlat adatai</h3><div class="form-grid">' +
      '<label for="f-cust">Ügyfél neve</label><input class="in" id="f-cust" data-k="customer" value="' + esc(o.customer) + '">' +
      '<label for="f-loc">Helyszín</label><input class="in" id="f-loc" data-k="location" value="' + esc(o.location || "") + '">' +
      '<label for="f-var">Homlokzati kivitel</label><select class="in" id="f-var" data-k="variant">' +
      D.variants.map(function (v) { return "<option" + (v === o.variant ? " selected" : "") + ">" + v + "</option>"; }).join("") + "</select>" +
      '<label>Ajánlat száma</label><div>' + esc(o.ref) + " · v" + o.version + ' <span class="muted small">· ' + fDate(o.date) + "</span></div>" +
      "</div>" + (o.note ? '<p class="muted small" style="margin:12px 0 0">' + esc(o.note) + "</p>" : "") + "</div>" +
      '<div class="card"><h3 style="font-size:16px">Kulcsrakész műszaki tartalom</h3><div class="muted small">A közölt műszaki leírás szerint. Ami ettől eltér, az pótmunka.</div>' +
      '<ul class="spec">' + D.spec.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ul></div>" +
      "</div>";
  }

  // ---------- 2. Módosítások ----------
  function optCard(o, g, title, why, ctl, eff, extra) {
    var on = eff !== 0 || (g === "mirror" && o.opts.mirror);
    var chips = pkgChips(o, g).map(function (c) { return '<span class="chip ' + c.c + '">' + esc(c.t) + "</span>"; }).join("");
    var notes = crossNotes(o.opts).filter(function (n) { return n.g.indexOf(g) >= 0; })
      .map(function (n) { return '<div class="warn info">' + esc(n.t) + "</div>"; }).join("");
    var mail = state.mail.applied && MAIL_GROUP[g] ? mailPill(MAIL_GROUP[g]) : "";
    var effHtml = eff === 0 ? '<div class="eff zero">' + (g === "mirror" && o.opts.mirror ? "0 Ft<small>díjmentes</small>" : "nincs változás") + "</div>"
      : '<div class="eff num">' + fSigned(eff) + (extra && extra.effSub ? "<small>" + extra.effSub + "</small>" : "") + "</div>";
    return '<section class="opt' + (on ? " on" : "") + '"><div><h3>' + title + '</h3><div class="why">' + why + "</div></div>" + effHtml +
      '<div class="ctl">' + ctl + "</div>" +
      ((chips || mail) ? '<div class="foot">' + mail + chips + "</div>" : "") + notes + (extra && extra.after ? extra.after : "") + "</section>";
  }
  function seg(k, val, options, disabledFn) {
    return '<div class="seg" role="group">' + options.map(function (op) {
      var dis = disabledFn && disabledFn(op[0]);
      return '<button data-act="set" data-k="' + k + '" data-v="' + op[0] + '" aria-pressed="' + (val === op[0]) + '"' + (dis ? " disabled" : "") + ">" + op[1] + "</button>";
    }).join("") + "</div>";
  }
  function tog(k, val, label) {
    return '<button class="tog" data-act="toggle" data-k="' + k + '" aria-pressed="' + !!val + '"><span class="sw"></span>' + label + "</button>";
  }

  var MAIL_GROUP = { garage: "garage", heat: "heat", walls: "walls", tile: "tile" };
  function mailPill(k) {
    var part = D.email.body.filter(function (p) { return typeof p === "object" && p.k === k; })[0];
    return part ? '<span class="from-mail c-' + k + '">a levélből: „' + esc(part.t) + "”</span>" : "";
  }

  function tileExplain(o) {
    var t = D.tile, x = o.opts, diff = x.tilePrice - t.allowance, q = x.tileArea * (1 + t.waste);
    var gross = diff * q, net = rnd(gross / (1 + D.allowanceVat));
    if (!tileOn(x)) return '<div class="explain"><h4>Hogyan számolja?</h4><p style="margin:0">A választott ár nem haladja meg a műszaki leírás keretét (bruttó ' + fInt(t.allowance) + " Ft/m²), ezért nincs különbözet.</p></div>";
    var rows = [
      ["Választott lap ára (bruttó, ahogy az ügyfél mondja)", fInt(x.tilePrice) + " Ft/m²"],
      ["Keret a műszaki leírás szerint (bruttó)", "− " + fInt(t.allowance) + " Ft/m²"],
      ["Különbözet", fInt(diff) + " Ft/m²"],
      ["Felület + " + fPct(t.waste) + " vágási veszteség: " + fDec(x.tileArea) + " m² × " + fDec(1 + t.waste) , fDec(q) + " m²"],
      ["Bruttó többlet: " + fInt(diff) + " × " + fDec(q), fFt(gross)],
      ["Nettó: " + fInt(gross) + " ÷ " + fDec(1 + D.allowanceVat), fFt(net)]
    ];
    return '<div class="explain"><h4>Hogyan számolja? – hidegburkolat különbözet</h4><table>' + rows.map(function (r, i) {
      return '<tr><td class="sn">' + (i + 1) + ".</td><td>" + r[0] + '</td><td class="num">' + r[1] + "</td></tr>";
    }).join("") + "</table><p>A szabály a műszaki leírásból: a keretig az alapár része, felette csak a különbözetet számoljuk fel. Átadott ár: rezsi és haszon nem kerül rá.</p></div>";
  }

  function screenMod() {
    var o = cur(), x = o.opts, P = priceNow(), b = build(o, P), ef = effects(o, P), h = D.houses[o.type];
    var order = { none: 0, "1": 1, "2": 2 };
    var garWhy = h.garage === "none" ? "A leírás szerint a garázs opcionális, ezért pótmunka." :
      "Az alapár " + GARAGE_LBL[h.garage] + " garázst tartalmaz.";
    var hpSplit = pkgSplit(o, "heat", P);
    var cards = [
      optCard(o, "garage", "Garázs", garWhy,
        seg("garage", x.garage, [["none", "nincs"], ["1", "1 állásos"], ["2", "2 állásos"]], function (v) { return order[v] < order[h.garage]; }), ef.garage),
      optCard(o, "heat", "Fűtés", "Az alapár része a BAXI 24 kW kondenzációs gázkazán. Hőszivattyú pótmunkaként kérhető.",
        seg("heat", x.heat, [["gas", "gázkazán (alap)"], ["hp", "levegő-víz hőszivattyú"]]), ef.heat,
        hpSplit ? { effSub: fSigned(hpSplit.add) + " · " + fSigned(-hpSplit.rem) } : null),
      optCard(o, "walls", "Válaszfalak", "Az alapár gipszkarton válaszfallal számol. Tégla válaszfal 10-es falazóelemből pótmunkaként kérhető.",
        seg("walls", x.walls, [["gk", "gipszkarton (alap)"], ["brick", "tégla, 10-es falazóelem"]]), ef.walls),
      optCard(o, "tile", "Hidegburkolat", "Keret: bruttó " + fInt(D.tile.allowance) + " Ft/m² + " + fPct(D.tile.waste) + " vágási veszteség. A keret felett csak a különbözetet számoljuk fel.",
        '<label class="field">Lap ára, bruttó Ft/m²<input class="in n" inputmode="decimal" data-k="tilePrice" value="' + rawNum(x.tilePrice) + '"></label>' +
        '<label class="field">Érintett felület, m²<input class="in n" inputmode="decimal" data-k="tileArea" value="' + rawNum(x.tileArea) + '"></label>' +
        '<label class="field">Lapméret<select class="in" data-k="tileSize">' +
        [["ok", "a méretszabályon belül"], ["unknown", "még nem ismert"], ["big", "nagyobb lap"]].map(function (s) {
          return '<option value="' + s[0] + '"' + (x.tileSize === s[0] ? " selected" : "") + ">" + s[1] + "</option>";
        }).join("") + "</select></label>" +
        '<button class="linkbtn" data-act="how">' + (state.howOpen ? "Számítás elrejtése" : "Hogyan számolja?") + "</button>",
        ef.tile, { after: (x.tileSize === "big" ? '<div class="warn">A lap a műszaki leírás méretszabályán kívül esik (' + esc(D.tile.sizeRule) + "). Munkadíj-többlet sor került a költségvetésbe; a végleges összeg a burkoló ajánlata után.</div>" : "") +
          (state.howOpen ? '<div style="grid-column:1/-1">' + tileExplain(o) + "</div>" : "") }),
      optCard(o, "winColor", "Nyílászárók színezése", "Az alapár fehér, 6 légkamrás, 3 rétegű üvegezésű nyílászárókkal számol.", tog("winColor", x.winColor, "külső és belső színezés"), ef.winColor),
      optCard(o, "hrv", "Hővisszanyerős szellőzés", "Az alapárban elszívás van az ablak nélküli helyiségekben.", tog("hrv", x.hrv, "központi, hővisszanyerős"), ef.hrv),
      optCard(o, "roomCtl", "Fűtésszabályozás", "Az alapárban hordozható termosztát van.", tog("roomCtl", x.roomCtl, "helyiségenkénti szabályozás"), ef.roomCtl),
      optCard(o, "mirror", "Tükrözött alaprajz", "A telekhez igazítva. Ár nincs, de a tervet módosítani kell.", tog("mirror", x.mirror, "tükrözve"), ef.mirror),
      optCard(o, "custom", "Egyedi tétel", "Bármi, ami nincs a listában. Nettó eladási árral, kézzel.",
        '<div style="display:grid;gap:8px;width:100%">' + (x.custom || []).map(function (c, i) {
          return '<div class="custom-row"><input class="in" placeholder="Megnevezés" data-k="cust-' + i + '-name" value="' + esc(c.name) + '">' +
            '<input class="in n" inputmode="decimal" placeholder="Menny." data-k="cust-' + i + '-qty" value="' + rawNum(c.qty) + '">' +
            '<input class="in" placeholder="Egység" data-k="cust-' + i + '-unit" value="' + esc(c.unit) + '">' +
            '<input class="in n" inputmode="decimal" placeholder="Nettó Ft/egység" data-k="cust-' + i + '-price" value="' + rawNum(c.price) + '">' +
            '<div class="num">' + fFt(rnd((+c.qty || 0) * (+c.price || 0))) + "</div>" +
            '<button class="x" data-act="custDel" data-v="' + i + '" title="Törlés" aria-label="Törlés">×</button></div>';
        }).join("") + '<div><button class="btn sm" data-act="custAdd">+ Egyedi tétel</button></div></div>', ef.custom)
    ].join("");

    return head("Módosítások", "Minden módosítás a költségvetés sorait változtatja: mit vesz ki, mit tesz hozzá. Az összeg azonnal frissül.",
        '<button class="btn primary" data-act="go" data-v="kv">Tovább: Költségvetés →</button>') +
      '<div class="s2"><div class="opts">' + mailCard() + cards + "</div>" + summaryCard(o, b, ef) + "</div>";
  }

  function mailCard() {
    var m = D.email, st = state.mail;
    var body = m.body.map(function (p) {
      if (typeof p === "string") return esc(p);
      return '<mark class="hl c-' + p.k + (st.applied ? " done" : "") + '">' + esc(p.t) + "</mark>";
    }).join("");
    var log = st.applied ? '<div class="maillog">' + Object.keys(m.sets).map(function (k) {
      var s = m.sets[k];
      return '<div class="c-' + k + '"><b>' + esc(s.label) + "</b>" + (s.note ? ' <span class="muted">– ' + esc(s.note) + "</span>" : "") + "</div>";
    }).join("") + "</div>" : "";
    return '<div class="mail"><div class="mailhead"><div class="who"><b>Beérkezett levél</b> · ' + esc(m.from) + ": „" + esc(m.subject) + '” <span class="muted small">· ' + esc(m.received) + "</span></div>" +
      '<div style="display:flex;gap:8px">' + (st.open ? '<button class="btn sm primary" data-act="mailFill">Kitöltés a levélből</button>' : "") +
      '<button class="btn sm" data-act="mailToggle">' + (st.open ? "Bezárás" : "Levél megnyitása") + "</button></div></div>" +
      (st.open ? '<div class="mailbody">' + body + "</div>" + log : "") + "</div>";
  }

  function summaryCard(o, b, ef) {
    var lines = changeLines(o, ef);
    var opens = openItems(o.opts);
    return '<aside class="summary"><div class="card"><h3>Összesítő</h3>' +
      '<div class="sumrow"><span>' + typeName(o.type) + " típusház, " + esc(o.variant) + '<br><span class="muted small">kulcsrakész alapár</span></span><span class="num">' + fFt(b.base) + "</span></div>" +
      lines.map(function (l) { return '<div class="sumrow sub"><span>' + esc(l.short) + '</span><span class="num">' + (l.text || fSigned(l.amt)) + "</span></div>"; }).join("") +
      '<div class="sumrow tot"><span>Pótmunkák összesen</span><span class="num">' + fSigned(b.extras) + "</span></div>" +
      '<div class="sumrow"><span>Nyitott tételek <span class="muted small">(nincs az összegben)</span></span><span class="num">' + opens.length + " db</span></div>" +
      '<div class="sumrow big"><span>Nettó</span><span class="num">' + fFt(b.total) + "</span></div>" +
      '<div class="sumrow"><span class="muted">ÁFA ' + fPct(D.vatRate) + '</span><span class="num muted">' + fFt(b.vat) + "</span></div>" +
      '<div class="sumrow gross"><span>Bruttó</span><span class="num">' + fFt(b.gross) + "</span></div>" +
      '<div class="sumbtns"><button class="btn" data-act="go" data-v="kv">Tételes költségvetés</button><button class="btn primary" data-act="goOffer">Ügyfélajánlat</button></div>' +
      "</div></aside>";
  }

  // Az ügyfél számára olvasható módosítás-sorok (ajánlat, összesítő).
  function changeLines(o, ef) {
    var x = o.opts, h = D.houses[o.type], out = [];
    if (ef.garage) out.push({ short: h.garage === "none" ? "Garázs, " + GARAGE_LBL[x.garage] : "Garázs bővítése 2 állásosra",
      long: h.garage === "none" ? "Garázs, " + GARAGE_LBL[x.garage] + ", a házhoz csatolva" : "Garázs bővítése 2 állásosra (az alapár 1 állásos garázst tartalmaz)", amt: ef.garage });
    if (ef.heat) { var sp = pkgSplit(o, "heat", priceNow());
      out.push({ short: "Hőszivattyú a gázkazán helyett", long: "Levegő-víz hőszivattyús fűtés a gázkazán helyett",
        detail: "Benne: elmaradó BAXI gázkazán és gázszerelés " + fSigned(-sp.rem) + ". Gázbekötés és gázterv nem szükséges.", amt: ef.heat }); }
    if (ef.walls) out.push({ short: "Tégla válaszfalak", long: "Tégla válaszfalak 10-es falazóelemből, gipszkarton helyett", amt: ef.walls });
    if (ef.tile) out.push({ short: "Hidegburkolat " + fInt(x.tilePrice) + " Ft/m²", long: "Hidegburkolat: választott lap bruttó " + fInt(x.tilePrice) + " Ft/m², " + fDec(x.tileArea) + " m²",
      detail: "A műszaki leírás kerete bruttó " + fInt(D.tile.allowance) + " Ft/m²; a különbözet " + fPct(D.tile.waste) + " vágási veszteséggel." + (x.tileSize === "big" ? " Nagyméretű lap munkadíj-többletével (becsült)." : ""), amt: ef.tile });
    if (ef.winColor) out.push({ short: "Nyílászárók színezése", long: "Nyílászárók külső és belső színezése", amt: ef.winColor });
    if (ef.hrv) out.push({ short: "Hővisszanyerős szellőzés", long: "Hővisszanyerős központi szellőzés", detail: "Az elszívó ventilátorok helyett.", amt: ef.hrv });
    if (ef.roomCtl) out.push({ short: "Helyiségenkénti szabályozás", long: "Helyiségenkénti hőmérséklet-szabályozás", amt: ef.roomCtl });
    if (x.mirror) out.push({ short: "Tükrözött alaprajz", long: "Tükrözött alaprajz", text: "díjmentes", amt: 0 });
    (x.custom || []).forEach(function (c) {
      var a = rnd((+c.qty || 0) * (+c.price || 0));
      out.push({ short: c.name || "Egyedi tétel", long: c.name || "Egyedi tétel", detail: fDec(+c.qty || 0) + " " + (c.unit || "") + " × " + fFt(+c.price || 0), amt: a });
    });
    return out;
  }

  // ---------- 3. Költségvetés ----------
  function fPrice(x) { return x ? fDec(x, 2) : "–"; }
  function fAmt(x) { return x ? fInt(x) : "–"; }

  function rowHtml(r, detailed) {
    var cls = r.status === "base" ? "" : r.status;
    var qty = r.qtyOld != null ? '<span class="old">' + fDec(r.qtyOld) + "</span>" + fDec(r.qty) : fDec(r.qty);
    var tag = r.tag ? '<span class="tag">' + (r.status === "removed" ? "kiesik: " : r.status === "changed" ? "módosul: " : "") + esc(r.tag) + "</span>" : "";
    var nm = r.noMarkup ? '<span class="tag nm">' + (r.custom ? "kézi ár" : "átadott ár") + "</span>" : "";
    var how = r.how ? ' <button class="linkbtn" data-act="how">' + (state.howOpen ? "elrejt" : "Hogyan számolja?") + "</button>" : "";
    return '<tr class="' + cls + '"><td class="tsz">' + r.tsz + '</td><td class="nm"><span class="t">' + esc(r.name) + "</span>" + tag + nm + how + "</td>" +
      '<td class="num">' + qty + "</td><td>" + esc(r.unit) + '</td><td class="num">' + fPrice(r.a) + '</td><td class="num">' + fPrice(r.d) + "</td>" +
      '<td class="num">' + fAmt(r.matT) + '</td><td class="num">' + fAmt(r.labT) + "</td></tr>" +
      (r.how && state.howOpen ? '<tr class="' + cls + '"><td></td><td colspan="7">' + tileExplain(cur()) + "</td></tr>" : "");
  }

  function screenKv() {
    var o = cur(), b = build(o);
    var info = b.detailed ? "" : '<div class="note" style="margin-bottom:12px">A részletes költségvetés ehhez a típushoz élesben kerül feltöltésre. Itt a típus közölt alapára (' + fFt(b.base) + ") és a módosítások sorai látszanak, a 120-as típus mintamennyiségeivel.</div>";
    var body = b.chs.map(function (c) {
      var rows = state.onlyChanges ? c.rows.filter(function (r) { return r.status !== "base"; }) : c.rows;
      if (!rows.length) return "";
      var coll = state.collapsed[c.code]; if (coll == null) coll = !c.changed && b.detailed;
      var nChg = c.rows.filter(function (r) { return r.status !== "base"; }).length;
      var hd = '<tr class="chh' + (c.changed ? " haschg" : "") + '" data-act="chToggle" data-v="' + c.code + '"><td><span class="caret">' + (coll ? "▸" : "▾") + "</span>" + c.code + '</td><td colspan="5">' + esc(c.name) +
        '<span class="cnt">' + c.rows.length + " sor" + (nChg ? " · " + nChg + " változás" : "") + "</span></td>" +
        '<td class="num">' + fInt(c.mat + c.N) + '</td><td class="num">' + fInt(c.lab) + "</td></tr>";
      var int = state.internal ? '<tr class="int"><td></td><td colspan="7"><span style="display:flex;gap:18px;flex-wrap:wrap;justify-content:flex-end">' +
        "<span>Közvetlen költség: <b>" + fFt(c.D) + "</b></span><span>Rezsi " + fPct(D.rezsi) + ": <b>" + fFt(c.rezsi) + "</b></span><span>Haszon " + fPct(D.haszon) + ": <b>" + fFt(c.haszon) + "</b></span>" +
        (c.N ? "<span>Átadott ár: <b>" + fFt(c.N) + "</b></span>" : "") + "<span>Fejezet eladási ára: <b>" + fFt(c.sell) + "</b></span></span></td></tr>" : "";
      return hd + int + (coll ? "" : rows.map(function (r) { return rowHtml(r, b.detailed); }).join(""));
    }).join("");
    var opens = openItems(o.opts);
    var tot = '<table class="tot-table">' +
      '<tr><td>Anyag összesen</td><td class="num">' + fFt(b.mat + b.N) + "</td></tr>" +
      '<tr><td>Díj összesen</td><td class="num">' + fFt(b.lab) + "</td></tr>" +
      (b.detailed ? "" : '<tr><td>Típusház közölt alapára</td><td class="num">' + fFt(b.base) + "</td></tr>") +
      (state.internal ?
        '<tr class="int"><td>Közvetlen költség (rezsi és haszon alapja)</td><td class="num">' + fFt(b.D) + "</td></tr>" +
        '<tr class="int"><td>Rezsi ' + fPct(D.rezsi) + '</td><td class="num">' + fFt(b.rezsi) + "</td></tr>" +
        '<tr class="int"><td>Haszon ' + fPct(D.haszon) + '</td><td class="num">' + fFt(b.haszon) + "</td></tr>" +
        (b.N ? '<tr class="int"><td>Átadott árak (rezsi és haszon nélkül)</td><td class="num">' + fFt(b.N) + "</td></tr>" : "") +
        '<tr class="int"><td>Haszon a teljes ajánlaton</td><td class="num">' + fPct(b.haszon / b.total) + "</td></tr>"
        : '<tr><td class="muted" colspan="2">Rezsi és haszon: a Belső nézetben</td></tr>') +
      '<tr class="grand"><td>Nettó vállalási ár</td><td class="num">' + fFt(b.total) + "</td></tr>" +
      '<tr class="vat"><td>ÁFA ' + fPct(D.vatRate) + '</td><td class="num">' + fFt(b.vat) + "</td></tr>" +
      '<tr><td><b>Bruttó</b></td><td class="num"><b>' + fFt(b.gross) + "</b></td></tr>" +
      '<tr><td class="muted small" colspan="2">ebből alapár ' + fFt(b.base) + " · módosítások " + fSigned(b.extras) + "</td></tr></table>";
    return head("Költségvetés", "A típus tételes költségvetése a választott módosításokkal. A program sorokat vesz ki és tesz hozzá; a kolléga ellenőrzi.",
        '<button class="btn" data-act="goOut" data-v="budget">Nyomtatás / Excel →</button>') + info +
      '<div class="toolbar">' +
      seg("onlyChanges", state.onlyChanges ? "chg" : "all", [["all", "Minden sor"], ["chg", "Csak a változások"]]) +
      '<button class="btn sm" data-act="expandAll">Mind kinyit</button><button class="btn sm" data-act="collapseAll">Mind becsuk</button>' +
      '<span class="sp"></span>' + tog("internal", state.internal, "Belső nézet") + "</div>" +
      '<div class="legend" style="margin-bottom:10px"><span><i style="background:var(--add-bg);border-color:var(--add-bd)"></i>új sor (módosítás miatt)</span>' +
      '<span><i style="background:var(--rem-bg);border-color:var(--rem-bd)"></i>kieső sor, áthúzva</span>' +
      '<span><i style="background:var(--chg-bg);border-color:var(--chg-bd)"></i>módosult mennyiség: régi → új</span></div>' +
      '<div class="tablewrap"><table class="bt"><thead><tr><th>Tételszám</th><th>Megnevezés</th><th class="num">Menny.</th><th>Egység</th>' +
      '<th class="num">Anyag egységár</th><th class="num">Díj egységár</th><th class="num">Anyag összesen</th><th class="num">Díj összesen</th></tr></thead>' +
      "<tbody>" + (body || '<tr><td></td><td colspan="7" class="muted" style="padding:18px 10px">Nincs módosítás: az ajánlat a típus közölt alapárával számol (' + fFt(b.base) + ").</td></tr>") + "</tbody>" +
      '<tfoot><tr><td></td><td colspan="5">Összesen' + (b.detailed ? "" : " (csak a módosítások)") + '</td><td class="num">' + fInt(b.mat + b.N) + '</td><td class="num">' + fInt(b.lab) + "</td></tr></tfoot></table></div>" +
      '<div class="totals"><div class="openbox"><h3>Nyitott tételek</h3><p class="sub">Még nem árazhatók. Nem szerepelnek az összegben, az ajánlaton szövegként jelennek meg.</p><ul>' +
      opens.map(function (x) { return "<li><b>" + esc(x.label) + ":</b> " + esc(x.text) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="card">' + tot + "</div></div>";
  }

  // ---------- 4. Árlista ----------
  function usage() {
    var u = {};
    D.base120.forEach(function (b) { u[b[1]] = (u[b[1]] || 0) + 1; });
    Object.keys(D.packages).forEach(function (k) {
      var p = D.packages[k];
      (p.add || []).forEach(function (a) { u[a[1]] = (u[a[1]] || 0) + 1; });
    });
    return u;
  }
  function impact() {
    var now = priceNow();
    return state.offers.map(function (o) {
      var a = build(o, ORIG).total, b = build(o, now).total;
      return { o: o, before: a, after: b, d: b - a };
    });
  }
  function screenArlista() {
    var u = usage(), q = state.plSearch.trim().toLowerCase(), g = null, rows = "";
    var P = priceNow();
    Object.keys(D.items).forEach(function (id) {
      var it = D.items[id];
      if (q && (it.n + " " + it.g).toLowerCase().indexOf(q) < 0) return;
      if (it.g !== g) { g = it.g; rows += '<tr class="grp"><td colspan="6">' + esc(g) + "</td></tr>"; }
      var p = P(id), ed = !!state.prices[id];
      var cell = function (k) {
        return ed && p[k] !== it[k] ? '<span class="old">' + fPrice(it[k]) + "</span>" + fPrice(p[k]) : fPrice(p[k]);
      };
      rows += '<tr class="' + (ed ? "edited" : "") + '"><td>' + esc(it.n) + "</td><td>" + esc(it.u) + '</td><td class="num">' + cell("a") + '</td><td class="num">' + cell("d") +
        '</td><td class="num">' + (u[id] || 0) + ' sor</td><td class="num"><button class="linkbtn" data-act="plEdit" data-v="' + id + '">' + (state.plEdit === id ? "Bezár" : "Szerkesztés") + "</button></td></tr>";
      if (state.plEdit === id) {
        rows += '<tr class="editor"><td colspan="6"><div class="ed">' +
          '<label class="field">Anyag egységár, Ft/' + esc(it.u) + '<input class="in n" inputmode="decimal" data-k="pl-a-' + id + '" value="' + rawNum(p.a) + '"></label>' +
          '<label class="field">Díj egységár, Ft/' + esc(it.u) + '<input class="in n" inputmode="decimal" data-k="pl-d-' + id + '" value="' + rawNum(p.d) + '"></label>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap"><span class="muted small" style="align-self:center">Anyagár:</span>' +
          [5, 8, 10].map(function (pc) { return '<button class="btn sm" data-act="plPct" data-v="' + id + '" data-p="' + pc + '">+' + pc + "%</button>"; }).join("") +
          '<button class="btn sm" data-act="plReset" data-v="' + id + '">Eredeti ár</button></div></div></td></tr>';
      }
    });
    var banner = "";
    if (hasOverrides()) {
      var im = impact(), hit = im.filter(function (x) { return x.d !== 0; }), sum = hit.reduce(function (s, x) { return s + x.d; }, 0);
      var bt = baseTotal(P);
      banner = '<div class="banner"><div><b>' + (hit.length ? hit.length + " nyitott ajánlat érintett: " + fSigned(sum) + " összesen" : "Nincs érintett nyitott ajánlat") + "</b>" +
        "<ul>" + hit.map(function (x) { return "<li>" + esc(offerLabel(x.o)) + ": " + fFt(x.before) + " → " + fFt(x.after) + " (" + fSigned(x.d) + ")</li>"; }).join("") +
        (bt !== D.houses.m120.price ? "<li>120-as alapár a költségvetés szerint: " + fFt(D.houses.m120.price) + " → " + fFt(bt) + "</li>" : "") +
        (im.length - hit.length ? '<li class="muted">' + (im.length - hit.length) + " ajánlat nem érintett (nem használja ezt a tételt, vagy a típushoz még nincs tételes költségvetés).</li>" : "") +
        '</ul></div><button class="btn" data-act="plResetAll">Visszaállítás</button></div>';
    }
    return head("Árlista", "Az anyag- és díj-egységárak, amelyekből minden költségvetés számol. Egy ár módosítása minden ajánlatot azonnal újraszámol. (Mintaárak.)",
        '<input class="in" style="width:280px;max-width:100%" placeholder="Keresés: pl. falazóblokk" data-k="plSearch" value="' + esc(state.plSearch) + '">') +
      banner + '<div class="tablewrap"><table class="pl"><thead><tr><th>Megnevezés</th><th>Egység</th><th class="num">Anyag Ft/egység</th><th class="num">Díj Ft/egység</th><th class="num">Felhasználva</th><th></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="6" class="muted">Nincs találat.</td></tr>') + "</tbody></table></div>";
  }

  // ---------- 5. Kimenetek ----------
  function offerSheet(o) {
    var b = build(o), ef = effects(o, priceNow()), h = D.houses[o.type], x = o.opts;
    var lines = changeLines(o, ef), opens = openItems(x);
    var excl = D.excluded.filter(function (e) { return !(e.dropIf === "hp" && x.heat === "hp"); });
    var tbl = '<tr><td><b>' + typeName(o.type) + ' típusház, kulcsrakész alapár</b><div class="d">A közölt műszaki leírás szerint.</div></td><td class="num">' + fFt(b.base) + "</td></tr>" +
      lines.map(function (l) {
        return "<tr><td>" + esc(l.long) + (l.detail ? '<div class="d">' + esc(l.detail) + "</div>" : "") + '</td><td class="num">' + (l.text || fSigned(l.amt)) + "</td></tr>";
      }).join("") +
      '<tr class="g"><td>Nettó összesen</td><td class="num">' + fFt(b.total) + "</td></tr>" +
      '<tr><td>ÁFA ' + fPct(D.vatRate) + '</td><td class="num">' + fFt(b.vat) + "</td></tr>" +
      '<tr class="t"><td>Bruttó összesen</td><td class="num">' + fFt(b.gross) + "</td></tr>";
    return '<div class="sheet"><div class="lh"><img src="logo.png" alt="' + esc(D.company.name) + '"><div class="r"><b>Előzetes ajánlat</b>' + esc(o.ref) + " · " + o.version + ". verzió<br>" + fDate(o.date) + "</div></div>" +
      "<h1>Tisztelt " + esc(o.customer) + "!</h1>" +
      '<p style="margin:4px 0 0">Köszönjük megkeresését. Az ajánlat a ' + typeName(o.type) + " típusház kulcsrakész műszaki leírására és az Ön által kért módosításokra épül.</p>" +
      "<h2>A ház</h2><div>" + typeName(o.type) + " típusház, " + esc(o.variant) + " kivitel · " + fDec(h.net) + " m² nettó, " + fDec(h.gross) + " m² bruttó alapterület" +
      (h.terrace ? " · terasz " + fDec(h.terrace) + " m²" : "") + " · " + h.rooms + " szoba · " + esc(h.baths) +
      (h.garage !== "none" ? " · " + GARAGE_LBL[h.garage] + " garázs" : "") + (o.location ? " · Helyszín: " + esc(o.location) : "") + "</div>" +
      "<h2>Ár</h2><table>" + tbl + "</table>" +
      '<div class="cols"><div><h2>Az ár nem tartalmazza</h2><ul>' + excl.map(function (e) { return "<li>" + esc(e.text) + "</li>"; }).join("") + "</ul></div>" +
      "<div><h2>Még nyitott kérdések</h2><ul>" + opens.map(function (x2) { return "<li><b>" + esc(x2.label) + ":</b> " + esc(x2.text) + "</li>"; }).join("") +
      '</ul><div class="d" style="margin-top:4px">Ezek nem szerepelnek a fenti összegben.</div>' +
      (x.heat === "hp" ? '<div class="d" style="margin-top:4px">Hőszivattyú mellett gázbekötés és belső gázterv nem szükséges.</div>' : "") + "</div></div>" +
      "<h2>Érvényesség</h2><div>Az ajánlat " + fDate(addDays(o.date, D.validityDays)).replace(/\.$/, "") + "-ig érvényes, a kulcsrakész műszaki leírással együtt. Az árak nettó árak, a végösszeg ÁFA-val értendő.</div>" +
      '<div class="foot">' + esc(D.company.name) + " · " + esc(D.company.city) + "</div></div>";
  }

  function budgetPrint(o) {
    var b = build(o);
    return '<div class="print-budget"><div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:6px"><div><b style="font-size:13px">Belső költségvetés – ' + esc(o.customer) + ", " + typeName(o.type) + ", " + esc(o.variant) + "</b><br>" + esc(o.ref) + " · v" + o.version + " · " + fDate(o.date) + '</div><div>Bemutató – minta tételek és mintaárak</div></div>' +
      '<table><thead><tr><th>Tételszám</th><th>Megnevezés</th><th class="num">Menny.</th><th>Egys.</th><th class="num">Anyag e.ár</th><th class="num">Díj e.ár</th><th class="num">Anyag össz.</th><th class="num">Díj össz.</th></tr></thead><tbody>' +
      b.chs.map(function (c) {
        return '<tr class="chh"><td>' + c.code + '</td><td colspan="5">' + esc(c.name) + '</td><td class="num">' + fInt(c.mat + c.N) + '</td><td class="num">' + fInt(c.lab) + "</td></tr>" +
          c.rows.map(function (r) {
            return '<tr class="' + (r.status === "base" ? "" : r.status) + '"><td>' + r.tsz + "</td><td>" + esc(r.name) + (r.tag ? " [" + esc(r.tag) + "]" : "") + '</td><td class="num">' + (r.qtyOld != null ? fDec(r.qtyOld) + " → " : "") + fDec(r.qty) + "</td><td>" + esc(r.unit) +
              '</td><td class="num">' + fPrice(r.a) + '</td><td class="num">' + fPrice(r.d) + '</td><td class="num">' + fAmt(r.matT) + '</td><td class="num">' + fAmt(r.labT) + "</td></tr>";
          }).join("");
      }).join("") + "</tbody></table>" +
      '<table style="width:auto;margin:8px 0 0 auto"><tr><td>Közvetlen költség</td><td class="num">' + fFt(b.D) + "</td></tr><tr><td>Rezsi " + fPct(D.rezsi) + '</td><td class="num">' + fFt(b.rezsi) + "</td></tr><tr><td>Haszon " + fPct(D.haszon) + '</td><td class="num">' + fFt(b.haszon) + "</td></tr>" +
      (b.N ? '<tr><td>Átadott árak</td><td class="num">' + fFt(b.N) + "</td></tr>" : "") + (b.detailed ? "" : '<tr><td>Típus alapára</td><td class="num">' + fFt(b.base) + "</td></tr>") +
      '<tr><td><b>Nettó vállalási ár</b></td><td class="num"><b>' + fFt(b.total) + "</b></td></tr></table></div>";
  }

  function csv(o) {
    var b = build(o);
    var num = function (x) { return x == null ? "" : String(Math.round(x * 100) / 100).replace(".", ","); };
    var q = function (s) { return '"' + String(s).replace(/"/g, '""') + '"'; };
    var L = [["Fejezet", "Tételszám", "Megnevezés", "Mennyiség", "Egység", "Anyag egységár", "Díj egységár", "Anyag összesen", "Díj összesen", "Változás", "Módosítás"].map(q).join(";")];
    var ST = { base: "", added: "új sor", removed: "kiesik", changed: "mennyiség módosul" };
    b.chs.forEach(function (c) {
      c.rows.forEach(function (r) {
        L.push([q(c.code + " " + c.name), q(r.tsz), q(r.name), num(r.qty), q(r.unit), num(r.a), num(r.d), num(r.matT), num(r.labT),
          q(ST[r.status] + (r.qtyOld != null ? " (" + fDec(r.qtyOld) + " → " + fDec(r.qty) + ")" : "")), q(r.tag || "")].join(";"));
      });
    });
    L.push("");
    L.push([q("Közvetlen költség"), "", "", "", "", "", "", num(b.D)].join(";"));
    L.push([q("Rezsi " + fPct(D.rezsi)), "", "", "", "", "", "", num(b.rezsi)].join(";"));
    L.push([q("Haszon " + fPct(D.haszon)), "", "", "", "", "", "", num(b.haszon)].join(";"));
    if (b.N) L.push([q("Átadott árak"), "", "", "", "", "", "", num(b.N)].join(";"));
    if (!b.detailed) L.push([q("Típus alapára"), "", "", "", "", "", "", num(b.base)].join(";"));
    L.push([q("Nettó vállalási ár"), "", "", "", "", "", "", num(b.total)].join(";"));
    L.push([q("Megjegyzés"), q(D.source)].join(";"));
    return "﻿" + L.join("\r\n");
  }
  function download(name, text) {
    var blob = new Blob([text], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function slug(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function optSummary(o) {
    var x = o.opts;
    return [typeName(o.type), "garázs: " + GARAGE_LBL[x.garage], x.heat === "hp" ? "hőszivattyú" : "gázkazán", x.walls === "brick" ? "tégla válaszfal" : "gipszkarton",
      tileOn(x) ? "csempe " + fInt(x.tilePrice) + " Ft/m², " + fDec(x.tileArea) + " m²" : "csempe a kereten belül"]
      .concat(x.winColor ? ["színezett nyílászárók"] : []).concat(x.hrv ? ["hővisszanyerős szellőzés"] : [])
      .concat(x.roomCtl ? ["helyiségenkénti szabályozás"] : []).concat(x.mirror ? ["tükrözött"] : []);
  }
  function diffParts(a, b) {
    var x = a.opts, y = b.opts, p = [];
    if (a.type !== b.type) p.push(typeName(a.type) + " → " + typeName(b.type) + " típus");
    if (x.heat !== y.heat) p.push(x.heat === "gas" ? "gáz → hőszivattyú" : "hőszivattyú → gáz");
    if (x.garage !== y.garage) p.push(x.garage !== "none" && y.garage !== "none" ? x.garage + " → " + y.garage + " állásos garázs" : "garázs: " + GARAGE_LBL[x.garage] + " → " + GARAGE_LBL[y.garage]);
    if (x.walls !== y.walls) p.push(x.walls === "gk" ? "gipszkarton → tégla válaszfal" : "tégla → gipszkarton válaszfal");
    if (x.tilePrice !== y.tilePrice) p.push("csempe " + fInt(x.tilePrice) + " → " + fInt(y.tilePrice) + " Ft/m²");
    if (x.tileArea !== y.tileArea) p.push("burkolt felület " + fDec(x.tileArea) + " → " + fDec(y.tileArea) + " m²");
    if (x.tileSize !== y.tileSize) p.push("lapméret módosul");
    [["winColor", "nyílászáró színezés"], ["hrv", "hővisszanyerős szellőzés"], ["roomCtl", "helyiségenkénti szabályozás"], ["mirror", "tükrözött alaprajz"]].forEach(function (t) {
      if (!!x[t[0]] !== !!y[t[0]]) p.push((y[t[0]] ? "+ " : "− ") + t[1]);
    });
    if (JSON.stringify(x.custom || []) !== JSON.stringify(y.custom || [])) p.push("egyedi tételek módosulnak");
    return p;
  }
  function compareHtml() {
    var A = state.offers.filter(function (o) { return o.id === state.cmpA; })[0], B = state.offers.filter(function (o) { return o.id === state.cmpB; })[0];
    var sel = function (k, v) {
      return '<select class="in" data-k="' + k + '">' + state.offers.map(function (o) { return '<option value="' + esc(o.id) + '"' + (o.id === v ? " selected" : "") + ">" + esc(offerLabel(o)) + "</option>"; }).join("") + "</select>";
    };
    var top = '<div class="toolbar"><label class="field">Régi verzió' + sel("cmpA", state.cmpA) + '</label><span style="align-self:flex-end;padding-bottom:8px">→</span><label class="field">Új verzió' + sel("cmpB", state.cmpB) + "</label></div>";
    if (!A || !B) return top;
    var ba = build(A), bb = build(B), d = bb.total - ba.total, parts = diffParts(A, B);
    var eff = function (r) { return r.status === "removed" ? null : r; };
    var ma = {}, mb = {}, keys = [];
    var add = function (m, r) { if (!eff(r)) return; m[r.key] = r; if (keys.indexOf(r.key) < 0) keys.push(r.key); };
    ba.rows.forEach(function (r) { add(ma, r); }); bb.rows.forEach(function (r) { add(mb, r); });
    var amt = function (r) { return r ? r.matT + r.labT : 0; };
    var diffs = keys.map(function (k) {
      var ra = ma[k], rb = mb[k];
      if (ra && rb && ra.qty === rb.qty && amt(ra) === amt(rb)) return null;
      var r = rb || ra;
      return { r: r, st: !ra ? "added" : !rb ? "removed" : "changed", qa: ra ? ra.qty : null, qb: rb ? rb.qty : null, d: amt(rb) - amt(ra) };
    }).filter(Boolean).sort(function (p, q2) { return p.r.ch < q2.r.ch ? -1 : p.r.ch > q2.r.ch ? 1 : 0; });
    var STL = { added: "új sor", removed: "kiesik", changed: "mennyiség" };
    var dsum = diffs.reduce(function (s, x) { return s + x.d; }, 0);
    var sameType = A.type === B.type && ba.detailed;
    return top +
      '<div class="card" style="margin-bottom:14px"><div class="muted small">' + esc(A.customer) + " · v" + A.version + " → v" + B.version + '</div><div class="cmp-head">' + esc(parts.length ? parts.join(", ") : "nincs eltérés a módosításokban") + ': <span class="num">' + fSigned(d) + "</span> nettó</div>" +
      '<div class="muted">v' + A.version + ": " + fFt(ba.total) + " → v" + B.version + ": " + fFt(bb.total) + " · " + diffs.length + " sor változik</div></div>" +
      '<div class="grid2" style="margin-bottom:14px">' + [A, B].map(function (o, i) {
        return '<div class="card"><div class="muted small">' + (i ? "Új" : "Régi") + " · v" + o.version + " · " + fDate(o.date) + "</div><div style=\"margin-top:4px\">" + esc(optSummary(o).join(" · ")) + "</div>" +
          (o.note ? '<div class="muted small" style="margin-top:6px">' + esc(o.note) + "</div>" : "") + "</div>";
      }).join("") + "</div>" +
      '<div class="tablewrap"><table class="cmp"><thead><tr><th>Fejezet</th><th>Megnevezés</th><th>Változás</th><th class="num">v' + A.version + ' menny.</th><th class="num">v' + B.version + ' menny.</th><th>Egység</th><th class="num">Különbség (közvetlen / átadott)</th></tr></thead><tbody>' +
      diffs.map(function (x) {
        return '<tr class="' + x.st + '"><td>' + x.r.ch + "</td><td>" + esc(x.r.name) + (x.r.tag ? ' <span class="muted small">· ' + esc(x.r.tag) + "</span>" : "") + "</td><td>" + STL[x.st] + '</td><td class="num">' + (x.qa == null ? "–" : fDec(x.qa)) + '</td><td class="num">' + (x.qb == null ? "–" : fDec(x.qb)) + "</td><td>" + esc(x.r.unit) + '</td><td class="num">' + fSigned(x.d) + "</td></tr>";
      }).join("") + "</tbody>" +
      '<tfoot><tr><td></td><td colspan="5">Sorok különbsége összesen</td><td class="num">' + fSigned(dsum) + "</td></tr>" +
      (sameType ? '<tr><td></td><td colspan="5" style="font-weight:500">+ rezsi és haszon a sorokra, fejezetenként</td><td class="num" style="font-weight:500">' + fSigned(d - dsum) + "</td></tr>" : "") +
      '<tr><td></td><td colspan="5">Ajánlati ár különbsége (nettó)</td><td class="num">' + fSigned(d) + "</td></tr></tfoot></table></div>";
  }

  function screenKi() {
    var o = cur(), t = state.outTab;
    if (!state.cmpA || !state.cmpB) {
      var same = state.offers.filter(function (x) { return x.ref === o.ref; }).sort(function (a, b) { return a.version - b.version; });
      if (same.length < 2) same = state.offers.filter(function (x) { return x.ref === "IEH-2026-041"; });
      if (same.length < 2) same = state.offers.slice(0, 2);
      state.cmpA = same[same.length - 2].id; state.cmpB = same[same.length - 1].id;
    }
    var tabs = '<div class="tabs">' + [["offer", "Ügyfélajánlat"], ["budget", "Belső költségvetés"], ["cmp", "Verzió-összehasonlítás"]].map(function (x) {
      return '<button data-act="outTab" data-v="' + x[0] + '" aria-pressed="' + (t === x[0]) + '">' + x[1] + "</button>";
    }).join("") + "</div>";
    var body;
    if (t === "offer") {
      body = '<div class="printbar"><span class="muted">Egy A4-es oldal. Belső árak, rezsi és haszon nélkül.</span><button class="btn primary" data-act="print" data-v="offer">Nyomtatás / PDF</button></div>' +
        '<div class="sheetwrap">' + offerSheet(o) + "</div>";
    } else if (t === "budget") {
      var b = build(o);
      body = '<div class="printbar"><span class="muted">A teljes tételes költségvetés, ' + b.rows.length + " sor, rezsivel és haszonnal. Csak belső használatra.</span>" +
        '<span style="display:flex;gap:8px"><button class="btn" data-act="csv">Letöltés Excelbe</button><button class="btn primary" data-act="print" data-v="budget">Nyomtatás / PDF</button></span></div>' +
        '<div class="tablewrap" style="padding:12px">' + budgetPrint(o).replace('class="print-budget"', 'class="print-budget" style="font-size:12.5px"') + "</div>";
    } else body = compareHtml();
    return head("Kimenetek", "Ügyfélajánlat, belső költségvetés és verzió-összehasonlítás – ugyanabból a számításból.") + tabs + body;
  }

  // ---------- megjelenítés ----------
  var SCREENS = { tipus: screenTipus, mod: screenMod, kv: screenKv, arlista: screenArlista, ki: screenKi };
  function render() {
    var ae = document.activeElement, fk = ae && ae.getAttribute && ae.getAttribute("data-k"), fv = null, ss = null, se = null;
    if (fk && ae.tagName === "INPUT") { fv = ae.value; try { ss = ae.selectionStart; se = ae.selectionEnd; } catch (e) { } }
    renderTop();
    document.getElementById("screen").innerHTML = SCREENS[state.screen]();
    if (fk) {
      var el = document.querySelector('#app [data-k="' + fk + '"]');
      if (el && el.tagName === "INPUT") {
        el.focus(); if (fv != null) el.value = fv;
        try { if (ss != null) el.setSelectionRange(ss, se); } catch (e) { }
      }
    }
  }

  function setOpt(k, v) {
    var o = cur();
    o.opts[k] = v;
    save(); render();
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]");
    if (!t || t.disabled) return;
    var act = t.getAttribute("data-act"), v = t.getAttribute("data-v"), k = t.getAttribute("data-k"), o = cur();
    switch (act) {
      case "go": state.screen = v; window.scrollTo(0, 0); render(); break;
      case "goOffer": state.screen = "ki"; state.outTab = "offer"; window.scrollTo(0, 0); render(); break;
      case "goOut": state.screen = "ki"; state.outTab = v; window.scrollTo(0, 0); render(); break;
      case "type":
        o.type = v;
        var inc = D.houses[v].garage, ord = { none: 0, "1": 1, "2": 2 };
        if (ord[o.opts.garage] < ord[inc]) o.opts.garage = inc;
        save(); render(); break;
      case "set":
        if (k === "onlyChanges") { state.onlyChanges = v === "chg"; render(); }
        else setOpt(k, v);
        break;
      case "toggle":
        if (k === "internal") { state.internal = !state.internal; render(); }
        else setOpt(k, !o.opts[k]);
        break;
      case "how": state.howOpen = !state.howOpen; render(); break;
      case "custAdd": o.opts.custom = o.opts.custom || []; o.opts.custom.push({ name: "", qty: 1, unit: "db", price: 0 }); save(); render(); break;
      case "custDel": o.opts.custom.splice(+v, 1); save(); render(); break;
      case "chToggle":
        var b = build(o), c = b.chs.filter(function (x) { return x.code === v; })[0];
        var curC = state.collapsed[v]; if (curC == null) curC = !c.changed && b.detailed;
        state.collapsed[v] = !curC; render(); break;
      case "expandAll": D.chapters.forEach(function (c) { state.collapsed[c[0]] = false; }); render(); break;
      case "collapseAll": D.chapters.forEach(function (c) { state.collapsed[c[0]] = true; }); render(); break;
      case "plEdit": state.plEdit = state.plEdit === v ? null : v; render(); break;
      case "plPct":
        var p = priceNow()(v), it = D.items[v];
        state.prices[v] = { a: Math.round(p.a * (1 + (+t.getAttribute("data-p")) / 100)), d: p.d };
        if (state.prices[v].a === it.a && state.prices[v].d === it.d) delete state.prices[v];
        save(); render(); break;
      case "plReset": delete state.prices[v]; save(); render(); break;
      case "plResetAll": state.prices = {}; state.plEdit = null; save(); render(); break;
      case "outTab": state.outTab = v; render(); break;
      case "print":
        document.getElementById("print-area").innerHTML = v === "offer" ? offerSheet(o) : budgetPrint(o);
        window.print(); break;
      case "csv": download("koltsegvetes_" + slug(o.customer) + "_" + o.type.slice(1) + "_v" + o.version + ".csv", csv(o)); break;
      case "mailToggle": state.mail.open = !state.mail.open; render(); break;
      case "mailFill":
        var sets = D.email.sets;
        Object.keys(sets).forEach(function (key) {
          var s = sets[key].set;
          Object.keys(s).forEach(function (f) { if (f === "type" || f === "variant") o[f] = s[f]; else o.opts[f] = s[f]; });
        });
        if (/^Új ügyfél/.test(o.customer)) { o.customer = D.email.from; o.location = "Kiskundorozsma"; }
        state.mail.applied = true; save(); render(); break;
      case "newOffer":
        var max = state.offers.reduce(function (m, x) { return Math.max(m, +x.ref.split("-")[2] || 0); }, 0);
        var n = { id: "o" + Date.now(), customer: "Új ügyfél", ref: "IEH-2026-" + String(max + 1).padStart(3, "0"), version: 1, date: today(),
          type: "m120", variant: "Mediterrán", location: "", note: "", opts: defaultOpts("m120") };
        state.offers.push(n); state.currentId = n.id; state.screen = "tipus"; state.mail = { open: false, applied: false };
        state.cmpA = state.cmpB = null; save(); render(); break;
      case "newVersion":
        var vmax = state.offers.filter(function (x) { return x.ref === o.ref; }).reduce(function (m, x) { return Math.max(m, x.version); }, 0);
        var nv = clone(o); nv.id = "o" + Date.now(); nv.version = vmax + 1; nv.date = today(); nv.note = "A(z) v" + o.version + " másolata.";
        state.offers.push(nv); state.currentId = nv.id; state.cmpA = o.id; state.cmpB = nv.id; save(); render(); break;
      case "resetDemo":
        if (!window.confirm("Visszaállítja a bemutató eredeti ajánlatait és árlistáját?")) break;
        try { localStorage.removeItem(KEY); } catch (err) { }
        state.offers = clone(D.offers); state.currentId = "kovacs-v2"; state.prices = {}; state.screen = "tipus";
        state.mail = { open: false, applied: false }; state.cmpA = state.cmpB = null; state.collapsed = {}; state.plEdit = null;
        state.internal = false; state.onlyChanges = false; state.howOpen = false;
        render(); break;
    }
  });

  function onField(e) {
    var t = e.target, k = t.getAttribute && t.getAttribute("data-k");
    if (!k) return;
    if (t.id === "offerSel") return;
    var o = cur(), v = t.value, m;
    if (k === "customer" || k === "location" || k === "variant") { o[k] = v; save(); renderTop(); return; }
    if (k === "tilePrice" || k === "tileArea") { o.opts[k] = parseNum(v); save(); render(); return; }
    if (k === "tileSize") { o.opts.tileSize = v; save(); render(); return; }
    if ((m = k.match(/^cust-(\d+)-(\w+)$/))) {
      var c = o.opts.custom[+m[1]]; c[m[2]] = (m[2] === "qty" || m[2] === "price") ? parseNum(v) : v; save(); render(); return;
    }
    if ((m = k.match(/^pl-([ad])-(\w+)$/))) {
      var id = m[2], p = priceNow()(id), it = D.items[id];
      p[m[1]] = parseNum(v);
      if (p.a === it.a && p.d === it.d) delete state.prices[id]; else state.prices[id] = p;
      save(); render(); return;
    }
    if (k === "plSearch") { state.plSearch = v; render(); return; }
    if (k === "cmpA" || k === "cmpB") { state[k] = v; render(); return; }
  }
  document.addEventListener("input", function (e) { if (e.target.tagName === "INPUT") onField(e); });
  document.addEventListener("change", function (e) {
    if (e.target.id === "offerSel") {
      state.currentId = e.target.value; state.mail = { open: false, applied: false }; state.cmpA = state.cmpB = null; save(); render(); return;
    }
    if (e.target.tagName === "SELECT") onField(e);
  });

  // Teszteléshez (konzolból): window.KALK.build(...)
  window.KALK = { build: build, effects: effects, defaultOpts: defaultOpts, priceFn: priceFn, state: state, csv: csv };
  render();
})();
