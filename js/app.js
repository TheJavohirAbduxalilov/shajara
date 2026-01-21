// FamilyEcho layout core (adapted). Exposes window.FE_LAYOUT.
(function () {
    'use strict';

    function FAA(a, v) {
        if (a.indexOf(v) < 0) a.push(v);
    }

    function FAN(a, a2) {
        for (var j = 0; j < a2.length; j++) {
            FAA(a, a2[j]);
        }
    }

    function FAI(a, ar) {
        for (var j = 0; j < ar.length; j++) {
            var i = a.indexOf(ar[j]);
            if (i >= 0) a.splice(i, 1);
        }
    }

    function FPD(d) {
        if (d === null || d === undefined) return {};
        var s = String(d).trim();
        if (!s) return {};
        var m = s.match(/(-?\d{4})(?:[-/.]?(\d{2}))?(?:[-/.]?(\d{2}))?/);
        if (!m) return {};
        return {
            d: m[3] ? parseInt(m[3], 10) : 0,
            m: m[2] ? parseInt(m[2], 10) : 0,
            y: parseInt(m[1], 10)
        };
    }

    function FAD(d) {
        var p = FPD(d);
        return (p.m || p.y) ? true : false;
    }

    function FCD(d1, d2) {
        if (d1.y !== d2.y) return d1.y - d2.y;
        if (d1.m !== d2.m) return d1.m - d2.m;
        return d1.d - d2.d;
    }

    function FPO(p, o) {
        if (!p) return null;
        // Check explicit order (O) first - this is set from child_order in database
        if (p.O !== undefined && p.O !== null && !isNaN(parseFloat(p.O))) {
            return parseFloat(p.O);
        }
        // Fall back to birth date if no explicit order
        var d = FPD(p.b || "");
        if ((!o) && d.y) {
            return d.y * 10000 + d.m * 100 + d.d;
        }
        return null;
    }

    function FCC(p1, p2) {
        var b1 = FPO(p1);
        var b2 = FPO(p2);
        if (b1 == b2) {
            b1 = FPO(p1, true);
            b2 = FPO(p2, true);
        }
        if (b1 === null) b1 = 99999999;
        if (b2 === null) b2 = 99999999;
        if (b1 < b2) return -1;
        if (b2 < b1) return 1;
        if (p1.ai < p2.ai) return -1;
        if (p1.ai > p2.ai) return 1;
        return 0;
    }

    function FSC(f, ci) {
        var cp = [];
        for (var j = 0; j < ci.length; j++) {
            if (f[ci[j]]) cp.push(f[ci[j]]);
        }
        cp.sort(FCC);
        ci.length = 0;
        for (var k = 0; k < cp.length; k++) {
            ci.push(cp[k].i);
        }
    }

    function FPP(p, i) {
        if (!p) return null;
        if (i == p.m1) return "f1";
        if (i == p.f1) return "m1";
        if (i == p.m2) return "f2";
        if (i == p.f2) return "m2";
        if (i == p.m3) return "f3";
        if (i == p.f3) return "m3";
        return null;
    }

    function FNB(p, pi) {
        if (!p) return false;
        if ((pi == p.m1) || (pi == p.f1)) {
            if (p.t1) return (p.t1 == "a") || (p.t1 == "f") || (p.t1 == "s") || (p.t1 == "g");
            if ((p.t2 == "b") || (p.t3 == "b")) return true;
            return false;
        }
        if ((pi == p.m2) || (pi == p.f2)) {
            if (p.t2) return (p.t2 == "a") || (p.t2 == "f") || (p.t2 == "s") || (p.t2 == "g");
            if ((p.t1 == "b") || (p.t3 == "b")) return true;
            return false;
        }
        if ((pi == p.m3) || (pi == p.f3)) {
            if (p.t3) return (p.t3 == "a") || (p.t3 == "f") || (p.t3 == "s") || (p.t3 == "g");
            if ((p.t1 == "b") || (p.t2 == "b")) return true;
            return false;
        }
        return false;
    }

    function FSB(p, s) {
        return FNB(p, p["m" + s] || p["f" + s]);
    }

    function FLA(f, i) {
        var ac = [];
        var c = f[i].c || [];
        for (var j = 0; j < c.length; j++) {
            var cp = f[c[j]];
            if (!cp) continue;
            var pf = FPP(cp, i);
            var oi = pf ? cp[pf] : null;
            if (!(oi && f[oi])) {
                FAA(ac, c[j]);
            }
        }
        FSC(f, ac);
        return ac;
    }

    function FLP(f, i, pi) {
        var tc = [];
        var c = f[i].c || [];
        for (var j = 0; j < c.length; j++) {
            var cp = f[c[j]];
            if (!cp) continue;
            var pf = FPP(cp, i);
            if (pf && cp[pf] == pi) {
                FAA(tc, c[j]);
            }
        }
        FSC(f, tc);
        return tc;
    }

    function FLS(f, i, s, t) {
        var bs = [];
        var mi = f[i]["m" + s];
        var fi = f[i]["f" + s];
        var cs = {};
        if (mi && f[mi]) {
            var c = f[mi].c || [];
            for (var j = 0; j < c.length; j++) {
                cs[c[j]] = true;
            }
        }
        if (fi && f[fi]) {
            var c = f[fi].c || [];
            for (var j = 0; j < c.length; j++) {
                cs[c[j]] = true;
            }
        }
        for (var j in cs) {
            if ((j != i) && (!t || FPP(f[j], i))) {
                bs.push(j);
            }
        }
        FSC(f, bs);
        return bs;
    }

    function FSS(p, si, s) {
        var ps = [];
        for (var pi in p.pc) {
            if (pi != si) {
                var gpi = new String(p.gp ? (p.gp[pi] || "") : "");
                var o = (gpi.charAt(0) == "o");
                var d = 99999999;
                if ((gpi == "m") || (gpi == "s") || (gpi == "d") || (gpi == "a")) {
                    if (p.mp && p.mp[pi]) d = p.mp[pi];
                } else if (gpi == "e") {
                    if (p.rp && p.rp[pi]) d = p.rp[pi];
                } else if (o || (gpi == "r")) {
                    if (p.bp && p.bp[pi]) d = p.bp[pi];
                }
                var ds = FPD(new String(d));
                ds.i = pi;
                ps.push(ds);
            }
        }
        ps.sort(FCD);
        var po = {};
        if (s && si) po[si] = true;
        for (var j = 0; j < ps.length; j++) {
            po[ps[j].i] = true;
        }
        return po;
    }

    function FRP(f, mi, fi) {
        return f[mi] && f[fi] && (f[mi].s == fi) && (f[fi].s == mi);
    }

    function FUP(f, mi, fi) {
        return FRP(f, mi, fi) || (f[mi] && f[mi].ep && (f[mi].ep[fi] == 2));
    }

    function FGM(g) {
        return (g == "f") ? -1 : ((g == "m") ? 1 : 0);
    }

    function FCM(p1, p2) {
        return (p1 ? FGM(p1.g) : 0) - (p2 ? FGM(p2.g) : 0);
    }

    function FPM(f, i) {
        var m = 0;
        if (i && f[i]) {
            var ca = f[i].c || [];
            for (var j = 0; j < ca.length; j++) {
                var c = f[ca[j]];
                if (!c) continue;
                if ((c.m == i) || (!c.m && c.m1 == i)) m--;
                if ((c.f == i) || (!c.f && c.f1 == i)) m++;
                if (c.X == i) m--;
                if (c.Y == i) m++;
                if (c.K == i) m--;
                if (c.L == i) m++;
            }
        }
        return m;
    }

    function FSM(f, i, si) {
        var cm = FPM(f, i) - FPM(f, si);
        if (!cm) cm = FCM(i ? f[i] : null, si ? f[si] : null);
        return cm ? (cm < 0) : (si ? (i < si) : false);
    }

    function TND(cg) {
        var d = { l: 0, r: 0, w: 0, t: 0, b: 0, h: 0, e: {}, n: [], p: [], yl: {}, yr: {}, u: 0 };
        if (cg) d.yg = {};
        return d;
    }

    function TAE(d, i, p, x, y, k) {
        var e = { p: p, x: x, y: y, k: k };
        if (d.e[i]) {
            e.d = i;
            if (!d.e[i].d) {
                d.e[i].d = i;
                d.e[i].u = ++d.u;
            }
            d.e[i + Math.random()] = e;
        } else {
            d.e[i] = e;
        }
        d.l = Math.min(d.l, x);
        d.r = Math.max(d.r, 1 + x);
        d.w = d.r - d.l;
        d.t = Math.min(d.t, y);
        d.b = Math.max(d.b, 1 + y);
        d.h = d.b - d.t;
        if (d.yl[y] === undefined) d.yl[y] = x;
        else d.yl[y] = Math.min(d.yl[y], x);
        if (d.yr[y] === undefined) d.yr[y] = 1 + x;
        else d.yr[y] = Math.max(d.yr[y], 1 + x);
        if (d.yg) TUG(d, x, y);
    }

    function TUG(d, x, y) {
        var ga = d.yg[y];
        if (ga) {
            var j = TFF(ga, "r", x);
            if ((x - 1) < ga[j].l) {
                if ((x + 2) > ga[j].r) ga.splice(j, 1);
                else ga[j].l = x + 1;
            } else {
                if ((x + 2) > ga[j].r) ga[j].r = x;
                else if (x > ga[j].l) ga.splice(j, 1, { l: ga[j].l, r: x }, { l: x + 1, r: ga[j].r });
            }
        } else {
            d.yg[y] = [{ l: -999999, r: x }, { l: x + 1, r: 999999 }];
        }
    }

    function TAL(d, x1, y1, x2, y2, t, c) {
        var l = { x1: x1, y1: y1, x2: x2, y2: y2, t: t };
        if (c) l.c = c;
        d.n[d.n.length] = l;
    }

    function TAP(d, i, si, x1, x2, y, b) {
        if (Math.abs(x1 - x2) > 1.1) {
            d.p[d.p.length] = { i: i, si: si, x1: x1, x2: x2, y: y, b: b };
        }
    }

    function TAD(od, d, dx, dy) {
        for (var j = 0; j < d.n.length; j++) {
            var n = d.n[j];
            TAL(od, n.x1 + dx, n.y1 + dy, n.x2 + dx, n.y2 + dy, n.t, n.c);
        }
        for (j = 0; j < d.p.length; j++) {
            var p = d.p[j];
            TAP(od, p.i, p.si, p.x1 + dx, p.x2 + dx, p.y + dy, p.b);
        }
        for (var i in d.e) {
            var e = d.e[i];
            TAE(od, e.p.i, e.p, e.x + dx, e.y + dy, e.k);
        }
    }

    function TIF(a, v) {
        var l = 0;
        var r = a.length;
        while (l < r) {
            var m = Math.floor((l + r) / 2);
            if (a[m] <= v) l = m + 1;
            else r = m;
        }
        return l;
    }

    function TFF(a, f, v) {
        var l = 0;
        var r = a.length;
        while (l < r) {
            var m = Math.floor((l + r) / 2);
            if (a[m][f] <= v) l = m + 1;
            else r = m;
        }
        return l;
    }

    var Vvl = false;
    var Vdd = false;
    var Vll = true;
    var Vhb = 0.01;
    var Vvd = 0;
    var Vvu = 0.1;
    var Vhm = 0.075;
    var Vvm = 0.075;
    var Vhl = 0.475;
    var Vdl = 0.4;
    var Vhs = -0.4;
    var Vhw = 0.4;
    var Vho = 4;
    var Vvs = 0.1;
    var Vva = 0.7;
    var Vvk = 0.03;
    var Vci = null;
    var Vct = null;

    function VCA() {
        Vci = null;
        Vct = null;
    }

    function VFT(em, f, i, m, ch, ph, oh, fl, pg, zf, hr, ar) {
        var hi = JSON.stringify([em, i, m, ch, ph, oh, fl, pg]);
        var d, b;
        if (Vci == hi) {
            d = Vct.d;
            b = Vct.b;
        } else {
            d = VFE(f, i, m, ch, ph, oh, fl, pg, { a: {}, p: {}, c: {} }, false);
            b = VDB(d, f, fl);
            Vci = hi;
            Vct = { d: d, b: b };
        }
        d = VMB(d, b, zf, hr);
        if (d.e[i]) d.e[i].k = true;
        if (m && d.e[m]) d.e[m].m = true;
        return d;
    }

    function VAN(d, ad, dy, dr) {
        var x = 0;
        if (dr) {
            for (var y in ad.yl) {
                var drx = d.yr[Number(y) + dy];
                if (drx !== undefined) x = Math.max(x, drx - ad.yl[y]);
            }
        } else {
            for (var y in ad.yr) {
                var dl = d.yl[Number(y) + dy];
                if (dl !== undefined) x = Math.min(x, dl - ad.yr[y]);
            }
        }
        return x;
    }

    function VPR(f, i, pi, fl) {
        var sm = FSM(f, i, pi);
        return fl ? (!sm) : sm;
    }

    function VDB(d, f, fl) {
        var b = VCB();
        var xyx = VCP(d);
        var dp = {};
        var ps = [];
        var pm = [];
        var cs = [];
        var ax = {};
        var ay = {};
        var aho = {};
        var avo = {};
        for (var i in d.e) {
            var p = f[i];
            if (!p) continue;
            var x1 = d.e[i].x;
            var y1 = d.e[i].y;
            for (var pi in p.pc) {
                if (!dp[pi + "-" + i]) {
                    dp[i + "-" + pi] = true;
                    if (d.e[pi]) {
                        var x2 = d.e[pi].x;
                        var y2 = d.e[pi].y;
                        var ci = FLP(f, i, pi);
                        if (ci.length) {
                            var vb = VVB(d, ci);
                            var xl = Math.min(x1, x2);
                            var xr = x1 + x2 - xl;
                            var hw = false;
                            var py = Math.min(y1, y2);
                            if (pi == p.es) {
                                hw = true;
                                for (var opi in p.pc) {
                                    if ((opi != pi) && d.e[opi] && (d.e[opi].y == y2)) {
                                        var r = (d.e[opi].x - x1) / (x2 - x1);
                                        if ((r > 0) && (r < 1)) {
                                            hw = false;
                                            break;
                                        }
                                    }
                                }
                            }
                            var px = hw ? (x1 + x2) / 2 : ((x2 > x1) ? (x2 - 0.5) : (x2 + 0.5));
                            cs.push({ i: i, pi: pi, ci: ci, dx: Math.max(0, xl - vb.l) + Math.max(0, vb.r - xr) });
                            ax[i + "-" + pi] = px;
                            ay[i + "-" + pi] = py;
                        }
                        ps.push({ i: i, pi: pi, dx: Math.abs(d.e[pi].x - x1) });
                    } else {
                        pm.push({ i: i, pi: pi });
                    }
                }
            }
            var ci = FLA(f, i);
            if (ci.length) {
                var vb = VVB(d, ci);
                var pi = "";
                cs.push({ i: i, pi: pi, ci: ci, dx: Math.max(0, x1 - vb.l) + Math.max(0, vb.r - x1) });
                ax[i + "-" + pi] = x1;
                ay[i + "-" + pi] = y1 + Vvu;
            }
        }
        ps.sort(function (a, b) { return a.dx - b.dx; });
        for (var j = 0; j < ps.length; j++) {
            var i = ps[j].i;
            var pi = ps[j].pi;
            var x1 = d.e[i].x;
            var y1 = d.e[i].y;
            var x2 = d.e[pi].x;
            var y2 = d.e[pi].y;
            var t = FUP(f, i, pi) ? "S" : "P";
            if (y1 == y2) {
                var xl = Math.min(x1, x2);
                var xr = x1 + x2 - xl;
                aho[i + "-" + pi] = VHV(b, y1, xl + Vhb, xr - Vhb, t, xyx, ax[i + "-" + pi], f[i].h + "->" + f[pi].h, [i, pi]);
            } else {
                var yt = (y1 < y2) ? y1 : y2;
                var xt = (y1 < y2) ? x1 : x2;
                var yb = y1 + y2 - yt;
                var xb = x1 + x2 - xt;
                var y = yb - 0.5;
                var dr = (xb >= xt);
                var td = dr ? 1 : -1;
                if (Math.abs((xt + 0.5 * td) - (xb - 0.5 * td)) < 0.499999) {
                    dr = !dr;
                    td = -td;
                }
                var yg = VHP(b, y, xt + 0.5 * td, xb - 0.5 * td);
                var tg = VVC(b, xt + 0.5 * td, yt, y, dr);
                var bg = VVC(b, xb - 0.5 * td, yb, y, dr);
                var ho2 = VAH(b, [y, yg], [xt + 0.5 * td, tg], [xb - 0.5 * td, bg], t, f[i].h + "->" + f[pi].h + " horizontal", { i1: i, i2: pi, l: false, r: false });
                var ho = VAH(b, yt, xt + Vhb * td, [xt + 0.5 * td, tg], t, f[i].h + "->" + f[pi].h + " top stub");
                var vos = VVV(b, [xt + 0.5 * td, tg], ho, ho2, t, xyx, dr, null, f[i].h + "->" + f[pi].h + " top vertical");
                avo[i + "-" + pi] = vos[0];
                var ho = VAH(b, yb, xb - Vhb * td, [xb - 0.5 * td, bg], t, f[i].h + "->" + f[pi].h + " bottom stub");
                var vos = VVV(b, [xb - 0.5 * td, bg], ho, ho2, t, xyx, !dr, null, f[i].h + "->" + f[pi].h + " bottom vertical");
                ax[i + "-" + pi] = xt + 0.5 * td;
                ay[i + "-" + pi] = yt + 0.5;
            }
        }
        cs.sort(function (a, b) { return Math.abs(a.dx) - Math.abs(b.dx); });
        for (var j = 0; j < cs.length; j++) {
            var i = cs[j].i;
            var pi = cs[j].pi;
            var ci = cs[j].ci;
            VCL(b, d, f, ci, VCN(f, i, ci), ax[i + "-" + pi], ay[i + "-" + pi], pi ? aho[i + "-" + pi] : null, pi ? avo[i + "-" + pi] : null, xyx, "[" + f[i].h + (pi ? (", " + f[pi].h) : "") + "] ");
        }
        for (var j = 0; j < pm.length; j++) {
            var i = pm[j].i;
            var pi = pm[j].pi;
            var x1 = d.e[i].x;
            var y1 = d.e[i].y;
            var dm = VPR(f, i, pi, fl) ? 1 : -1;
            var x2 = x1 + dm * Vhl;
            x1 += dm * Vhb;
            var g = VHG(b, y1, x1, x2);
            var piLabel = f[pi] ? f[pi].h : "";
            VAH(b, [y1, g], x1, x2, FUP(f, i, pi) ? "s" : "p", "To hidden partner " + piLabel + " of " + f[i].h);
        }
        for (var i in d.e) {
            var p = f[i];
            for (var j = 1; j <= 3; j++) {
                var mi = p["m" + j];
                var fi = p["f" + j];
                var y1 = d.e[i].y;
                if (mi || fi) {
                    if (((!mi) || !d.e[mi]) && ((!fi) || !d.e[fi])) {
                        VAV(b, d.e[i].x, y1 - Vvd, y1 - Vdl, FSB(p, j) ? "c" : "b", "To hidden parent set " + j + " of " + p.h);
                    }
                } else {
                    break;
                }
            }
        }
        return b;
    }

    function VCN(f, i, cs) {
        var gs = [];
        for (var j = 0; j < cs.length; j++) {
            gs[j] = FNB(f[cs[j]], i);
        }
        return gs;
    }

    function VCL(b, d, f, cs, os, px, py, pho, pvo, xyx, c) {
        var vb = VVB(d, cs);
        if (vb.c) {
            var y = pvo ? py : Math.max(Math.floor(py) + 0.5, vb.t - 0.5);
            var l = Math.min(vb.l, px);
            var r = Math.max(vb.r, px);
            var yg = VHG(b, y, l, r);
        }
        if (vb.c) {
            var hs = [];
            for (var j = 0; j < cs.length; j++) {
                hs.push(f[cs[j]].h);
            }
            var pa = false;
            var gll = [999999, 0];
            var grr = [-999999, 0];
            for (var o = 0; o <= 1; o++) {
                var ll = [999999, 0];
                var rr = [-999999, 0];
                var oc = [];
                for (var j = 0; j < cs.length; j++) {
                    if (o ? os[j] : !os[j]) oc.push(cs[j]);
                }
                if (oc.length) {
                    var vc = VVE(d, oc);
                    if (vc.length) {
                        var t = o ? "C" : "B";
                        if ((vc.length == 1) && (px == d.e[vc[0]].x) && (VVE(d, cs).length == 1) && (d.e[vc[0]].y > py) && (!pvo)) {
                            var co = VVV(b, px, pho ? pho : py, d.e[vc[0]].y - Vvd, t, xyx, true, y, c + "Parent(s) direct to child " + f[vc[0]].h);
                            if (cs.length > 1) {
                                VAH(b, y, co, px + Vhm, "b", c + "Missing children from direct");
                            }
                            VMN(ll, co.x, co.g);
                            VMX(rr, co.x, co.g);
                        } else {
                            if (!pa) {
                                pa = true;
                                if (pvo) {
                                    var vo = pvo;
                                } else {
                                    var vo = VVV(b, px, pho ? pho : py, [y, yg], t, xyx, px > d.e[vc[0]].x, y, "To parents of [" + hs.join(", ") + "]");
                                }
                            }
                            VMN(ll, vo.x, vo.g);
                            VMX(rr, vo.x, vo.g);
                            var co = [];
                            for (var j = 0; j < vc.length; j++) {
                                var ci = vc[j];
                                co[j] = VVV(b, (d.e[ci].x == px) ? [vo.x, vo.g] : d.e[ci].x, [y, yg], (d.e[ci].y < y) ? (d.e[ci].y - 0.01) : (d.e[ci].y - Vvd), t, xyx, px < d.e[ci].x, y, "To child " + f[ci].h);
                                if ((co[j].oo) && (co[j].bo)) {
                                    if (d.e[ci].y > y) {
                                        co[j].og = co[j].oo.g;
                                        delete co[j].oo;
                                    } else {
                                        co[j].bg = co[j].bo.g;
                                        delete co[j].bo;
                                    }
                                }
                                VMN(ll, d.e[ci].x, co[j].g);
                                VMX(rr, d.e[ci].x, co[j].g);
                            }
                            var ho = VAH(b, [y, yg], ll, rr, t, c + "Child arm of [" + hs.join(", ") + "]");
                            VLB(b, ho, vo);
                            for (var j = 0; j < vc.length; j++) {
                                VLB(b, ho, co[j]);
                            }
                        }
                    }
                }
                VMN(gll, ll[0], ll[1]);
                VMX(grr, rr[0], rr[1]);
            }
            if (cs.length > vb.c) {
                var dr = (((gll[0] + grr[0]) / 2) <= px);
                if (dr) {
                    VAH(b, [y, yg], grr, grr[0] + Vhm, "b", c + "Missing siblings from [" + hs.join(", ") + "]");
                } else {
                    VAH(b, [y, yg], gll, gll[0] - Vhm, "b", c + "Missing siblings from [" + hs.join(", ") + "]");
                }
            }
        } else {
            if (cs.length) {
                if (pvo) {
                    VAH(b, [py, 0], pvo, px + Vhm, "b", c + "To hidden children");
                } else if (pho) {
                    VAV(b, px, pho, pho.y + Vvm, "b", c + "To hidden children");
                } else {
                    VAV(b, px, py, py + Vdl - Vvu, "b", c + "To hidden children");
                }
            }
        }
    }

    function VMN(xx, x, g) {
        if (x < xx[0]) {
            xx[0] = x;
            xx[1] = g;
        } else if (x == xx[0]) {
            xx[1] = Math.min(xx[1], g);
        }
    }

    function VMX(xx, x, g) {
        if (x > xx[0]) {
            xx[0] = x;
            xx[1] = g;
        } else if (x == xx[0]) {
            xx[1] = Math.max(xx[1], g);
        }
    }

    function VRC(i) {
        return Math.round(i * 1000000) / 1000000;
    }

    function VCB() {
        return { h: {}, v: {}, hx: {}, vy: {} };
    }

    function VHG(b, y, x1, x2) {
        var l = Math.min(x1, x2);
        var r = x1 + x2 - l;
        var g = 0;
        y = VRC(y);
        l = VRC(l);
        r = VRC(r);
        if (b.h[y] && (r > l)) {
            while (true) {
                var s = true;
                if (b.h[y][g]) {
                    for (var j = 0; j < b.h[y][g].length; j++) {
                        var h = b.h[y][g][j];
                        if ((r >= h.l) && (l <= h.r)) {
                            s = false;
                            break;
                        }
                    }
                }
                if (s) break;
                g++;
            }
        }
        return g;
    }

    function VHC(bg, l, r) {
        if (bg) {
            for (var j = 0; j < bg.length; j++) {
                var h = bg[j];
                if ((r >= h.l) && (l <= h.r)) return false;
            }
        }
        return true;
    }

    function VHP(b, y, x1, x2) {
        return VHF(b, y, x1, x2, 0);
    }

    function VHF(b, y, x1, x2, g) {
        var l = Math.min(x1, x2);
        var r = x1 + x2 - l;
        y = VRC(y);
        l = VRC(l);
        r = VRC(r);
        if (b.h[y] && b.h[y][g] && (r > l)) {
            for (var j = b.h[y][g].length - 1; j >= 0; j--) {
                var h = b.h[y][g][j];
                if ((r >= h.l) && (l <= h.r) && (h.r > h.l)) {
                    VHF(b, y, h.l, h.r, g + 1);
                    if (!b.h[y][g + 1]) b.h[y][g + 1] = [];
                    h.g = g + 1;
                    b.h[y][g + 1].push(h);
                    b.h[y][g].splice(j, 1);
                    if (!Vll) {
                        VHA(b, h.l, h.lo ? h.lo.g : h.lg, h.r, h.ro ? h.ro.g : h.rg, y, g, g + 1);
                    }
                }
            }
        }
        return g;
    }

    function VHA(b, l, lg, r, rg, y, oyg, nyg) {
        for (var x in b.vy[y]) {
            if ((x >= l) && (x <= r)) {
                var sg = 0;
                var eg = b.v[x].length - 1;
                if (x == l) sg = lg;
                if (x == r) eg = rg;
                for (var g = sg; g <= eg; g++) {
                    if (b.v[x][g]) {
                        for (var j = 0; j < b.v[x][g].length; j++) {
                            if ((b.v[x][g][j].o == y) && (!b.v[x][g][j].oo) && (b.v[x][g][j].og == oyg)) {
                                b.v[x][g][j].og = nyg;
                            }
                            if ((b.v[x][g][j].b == y) && (!b.v[x][g][j].bo) && (b.v[x][g][j].bg == oyg)) {
                                b.v[x][g][j].bg = nyg;
                            }
                        }
                    }
                }
            }
        }
    }

    function VVC(b, x, y1, y2, dr) {
        return dr ? VVG(b, x, y1, y2) : VVP(b, x, y1, y2);
    }

    function VVG(b, x, y1, y2) {
        var t = Math.min(y1, y2);
        var m = y1 + y2 - t;
        var g = 0;
        x = VRC(x);
        t = VRC(t);
        m = VRC(m);
        if (b.v[x] && (m > t)) {
            while (true) {
                var s = true;
                if (b.v[x][g]) {
                    for (var j = 0; j < b.v[x][g].length; j++) {
                        var v = b.v[x][g][j];
                        if ((m >= v.o) && (t <= v.b)) {
                            s = false;
                            break;
                        }
                    }
                }
                if (s) break;
                g++;
            }
        }
        return g;
    }

    function VVP(b, x, y1, y2) {
        return VVF(b, x, y1, y2, 0);
    }

    function VVF(b, x, y1, y2, g) {
        var t = Math.min(y1, y2);
        var m = y1 + y2 - t;
        x = VRC(x);
        t = VRC(t);
        m = VRC(m);
        if (b.v[x] && b.v[x][g] && (m > t)) {
            for (var j = b.v[x][g].length - 1; j >= 0; j--) {
                var v = b.v[x][g][j];
                if ((m >= v.o) && (t <= v.b) && (v.b > v.o)) {
                    VVF(b, x, v.o, v.b, g + 1);
                    if (!b.v[x][g + 1]) b.v[x][g + 1] = [];
                    v.g = g + 1;
                    b.v[x][g + 1].push(v);
                    b.v[x][g].splice(j, 1);
                    if (!Vll) {
                        VVA(b, v.o, v.oo ? v.oo.g : v.og, v.b, v.bo ? v.bo.g : v.bg, x, g, g + 1);
                    }
                }
            }
        }
        return g;
    }

    function VVA(b, t, tg, m, mg, x, oxg, nxg) {
        for (var y in b.hx[x]) {
            if ((y >= t) && (y <= m)) {
                var sg = 0;
                var eg = b.h[y].length - 1;
                if (y == t) eg = tg;
                if (y == m) sg = mg;
                for (var g = sg; g <= eg; g++) {
                    if (b.h[y][g]) {
                        for (var j = 0; j < b.h[y][g].length; j++) {
                            if ((b.h[y][g][j].l == x) && (!b.h[y][g][j].lo) && (b.h[y][g][j].lg == oxg)) {
                                b.h[y][g][j].lg = nxg;
                            }
                            if ((b.h[y][g][j].r == x) && (!b.h[y][g][j].ro) && (b.h[y][g][j].rg == oxg)) {
                                b.h[y][g][j].rg = nxg;
                            }
                        }
                    }
                }
            }
        }
    }

    function VHV(b, y, x1, x2, t, xyx, xo, c, p) {
        var yx = xyx.yx;
        var x1 = VCX(x1, 0);
        var x2 = VCX(x2, 0);
        var ll = (x1.x < x2.x) ? x1.x : x2.x;
        var lg = (x1.x < x2.x) ? x1.g : x2.g;
        var rr = x1.x + x2.x - ll;
        var rg = x1.g + x2.g - lg;
        var n = 0;
        var hs = [];
        var vs = [];
        if (yx[y]) {
            var k = TIF(yx[y], ll);
            while ((k < yx[y].length) && (yx[y][k] < rr)) {
                var xs = yx[y][k++];
                var xe = xs;
                while ((k < yx[y].length) && (yx[y][k] < rr) && ((yx[y][k] - xe) < 999999)) {
                    xe = yx[y][k++];
                }
                var x1 = xs - 0.5;
                var x2 = xe + 0.5;
                var y2 = y - 0.5;
                hs[n] = { l: ll, r: x1, y: y, g: VHG(b, y, ll, x1) };
                vs[n] = { s: y, e: y2, x: x1, g: VVP(b, x1, y, y2) };
                n++;
                hs[n] = { l: x1, r: x2, y: y2, g: VHG(b, y2, x1, x2) };
                vs[n] = { s: y2, e: y, x: x2, g: VVG(b, x2, y, y2) };
                n++;
                ll = x2;
            }
        }
        hs[n] = { l: ll, r: rr, y: y, g: VHG(b, y, ll, rr) };
        var pi = -1;
        if (p) {
            var pw = -1;
            for (var i = 0; i <= n; i++) {
                var w = hs[i].r - hs[i].l - ((i == 0) ? 0.5 : 0) - ((i == n) ? 0.5 : 0);
                if (w > pw) {
                    pi = i;
                    pw = w;
                }
            }
        }
        var o = null;
        for (var i = 0; i <= n; i++) {
            var h = hs[i];
            var g1 = (i > 0) ? vs[i - 1].g : lg;
            var g2 = (i < n) ? vs[i].g : rg;
            h.o = VAH(b, [h.y, h.g], [h.l, g1], [h.r, g2], t, c + " horizontal segment " + i + "/" + n, (i == pi) ? { i1: p[0], i2: p[1], l: (i == 0), r: (i == n) } : null);
            if ((!o) && ((h.r > xo) || (i == n))) {
                o = h.o;
            }
        }
        for (i = 0; i < n; i++) {
            var v = vs[i];
            var vo = VAV(b, [v.x, v.g], [v.s, hs[i].g], [v.e, hs[i + 1].g], t, c + " vertical segment " + i + "/" + n);
            VLB(b, hs[i].o, vo);
            VLB(b, hs[i + 1].o, vo);
        }
        return o;
    }

    function VVR(xyx, l, r, t, b) {
        var xy = xyx.xy;
        var xs = xyx.xs;
        var a = [];
        var j = TIF(xs, l);
        while ((j < xs.length) && (xs[j] < r)) {
            var x = xs[j++];
            var k = TIF(xy[x], t);
            while ((k < xy[x].length) && (xy[x][k] < b)) {
                a.push({ x: Number(x), y: xy[x][k++] });
            }
        }
        a.sort(function (a, b) { return a.y - b.y; });
        return a;
    }

    function VVV(b, x, y1, y2, t, xyx, dr, yo, c) {
        var xx = VCX(x, null);
        var x = xx.x;
        var hg = (xx.g !== null);
        if (hg) var xg = xx.g;
        var y1 = VCY(y1, 0);
        var y2 = VCY(y2, 0);
        var tt = (y1.y < y2.y) ? y1.y : y2.y;
        var tg = (y1.y < y2.y) ? y1.g : y2.g;
        var to = (y1.y < y2.y) ? y1.o : y2.o;
        var bb = y1.y + y2.y - tt;
        var bg = y1.g + y2.g - tg;
        var bo = (y1.y < y2.y) ? y2.o : y1.o;
        tt = VRC(tt);
        bb = VRC(bb);
        var a = VVR(xyx, x - 0.45, x + 0.45, tt, bb);
        var xd = x + (dr ? 0.5 : -0.5);
        var ad = VVR(xyx, xd - 0.45, xd + 0.45, tt, bb);
        var n = 0;
        var vs = [];
        var hs = [];
        var k = 0;
        while (k < a.length) {
            var x1 = a[k].x;
            var x2 = x1 + (dr ? 0.5 : -0.5);
            var ys = a[k++].y;
            var ye = ys;
            var kd = TFF(ad, "y", ye);
            var yd = ad[kd] ? (ad[kd].y - 1) : 999999;
            while ((k < a.length) && ((a[k].y - ye) < 999999.999999) && (a[k].x == x1)) {
                if (a[k].y > yd) {
                    ye = yd;
                    break;
                } else {
                    ye = a[k++].y;
                }
            }
            ys -= 0.5;
            ye += 0.5;
            if ((tt == ys) && (n > 0)) {
                hs[n - 1].e = x2;
            } else {
                vs[n] = { t: tt, b: ys, x: x, g: hg ? xg : VVC(b, x, tt, ys, !dr) };
                hs[n] = { s: x, e: x2, y: ys, g: VHP(b, ys, x, x2) };
                n++;
            }
            vs[n] = { t: ys, b: ye, x: x2, g: VVC(b, x2, ys, ye, dr) };
            hs[n] = { s: x2, e: x, y: ye, g: (ye == bb) ? bg : VHP(b, ye, x, x2) };
            n++;
            tt = ye;
        }
        vs[n] = { t: tt, b: bb, x: x, g: hg ? xg : VVC(b, x, tt, bb, dr) };
        if (yo === null) {
            var o = [];
        } else if (VRC(yo) == tt) {
            var o = null;
        }
        for (var i = 0; i <= n; i++) {
            var v = vs[i];
            var g1 = (i > 0) ? hs[i - 1].g : tg;
            var g2 = (i < n) ? hs[i].g : bg;
            v.o = VAV(b, [v.x, v.g], [v.t, g1], [v.b, g2], t, c + " vertical segment " + i + "/" + n);
            if (yo === null) {
                o[i] = v.o;
            } else if (!o) {
                if (i == 0) {
                    if (v.b >= yo) o = v.o;
                } else if (i == n) {
                    o = v.o;
                } else if (v.b > yo) {
                    o = v.o;
                }
            }
        }
        if (to) {
            if (vs[0].o.o == to.y) vs[0].o.og = to.g;
            else if (vs[0].o.b == to.y) vs[0].o.bg = to.g;
            VLB(b, to, vs[0].o);
        }
        if (bo) {
            if (vs[n].o.b == bo.y) vs[n].o.bg = bo.g;
            else if (vs[n].o.o == bo.y) vs[n].o.og = bo.g;
            VLB(b, bo, vs[n].o);
        }
        for (i = 0; i < n; i++) {
            var h = hs[i];
            var ho = VAH(b, [h.y, h.g], [h.s, vs[i].g], [h.e, vs[i + 1].g], t, c + " horizontal segment " + i + "/" + n);
            VLB(b, ho, vs[i].o);
            VLB(b, ho, vs[i + 1].o);
        }
        return o;
    }

    function VCX(x, gd) {
        if (typeof x == "object") {
            if (Array.isArray(x)) return { x: VRC(x[0]), g: x[1], o: null };
            if (Vll) return { x: x.x, g: x.g, o: x };
            return { x: x.x, g: x.g, o: null };
        }
        return { x: VRC(x), g: gd, o: null };
    }

    function VCY(y, gd) {
        if (typeof y == "object") {
            if (Array.isArray(y)) return { y: VRC(y[0]), g: y[1], o: null };
            if (Vll) return { y: y.y, g: y.g, o: y };
            return { y: y.y, g: y.g, o: null };
        }
        return { y: VRC(y), g: gd, o: null };
    }

    function VAH(b, y, x1, x2, t, c, p) {
        var y = VCY(y, undefined);
        var x1 = VCX(x1, 0);
        var x2 = VCX(x2, 0);
        var l, r;
        if (x1.x < x2.x) { l = x1; r = x2; } else { l = x2; r = x1; }
        if (y.g === undefined) y.g = VHP(b, y.y, l.x, r.x);
        if (!b.h[y.y]) b.h[y.y] = [];
        if (!b.h[y.y][y.g]) b.h[y.y][y.g] = [];
        var e = { y: y.y, g: y.g, l: l.x, r: r.x, t: t, c: c };
        if (l.o) e.lo = l.o; else e.lg = l.g;
        if (r.o) e.ro = r.o; else e.rg = r.g;
        if (p) e.p = p;
        b.h[y.y][y.g].push(e);
        if (!Vll) {
            if (!l.o) {
                if (!b.hx[l.x]) b.hx[l.x] = {};
                b.hx[l.x][y.y] = true;
            }
            if (!r.o) {
                if (!b.hx[r.x]) b.hx[r.x] = {};
                b.hx[r.x][y.y] = true;
            }
        }
        return e;
    }

    function VAV(b, x, y1, y2, t, c) {
        var x = VCX(x, undefined);
        var y1 = VCY(y1, 0);
        var y2 = VCY(y2, 0);
        var o, m;
        if (y1.y < y2.y) { o = y1; m = y2; } else { o = y2; m = y1; }
        if (x.g === undefined) x.g = VVG(b, x.x, o.y, m.y);
        if (!b.v[x.x]) b.v[x.x] = [];
        if (!b.v[x.x][x.g]) b.v[x.x][x.g] = [];
        var e = { x: x.x, g: x.g, o: o.y, b: m.y, t: t, c: c };
        if (o.o) e.oo = o.o; else e.og = o.g;
        if (m.o) e.bo = m.o; else e.bg = m.g;
        b.v[x.x][x.g].push(e);
        if (!Vll) {
            if (!o.o) {
                if (!b.vy[o.y]) b.vy[o.y] = {};
                b.vy[o.y][x.x] = true;
            }
            if (!m.o) {
                if (!b.vy[m.y]) b.vy[m.y] = {};
                b.vy[m.y][x.x] = true;
            }
        }
        return e;
    }

    function VLB(b, ho, vo) {
        if (Vll) {
            if ((!ho.lo) && (ho.l == vo.x) && (ho.lg == vo.g)) {
                delete ho.lg;
                ho.lo = vo;
            } else if ((!ho.ro) && (ho.r == vo.x) && (ho.rg == vo.g)) {
                delete ho.rg;
                ho.ro = vo;
            }
            if ((!vo.oo) && (vo.o == ho.y) && (vo.og == ho.g)) {
                delete vo.og;
                vo.oo = ho;
            } else if ((!vo.bo) && (vo.b == ho.y) && (vo.bg == ho.g)) {
                delete vo.bg;
                vo.bo = ho;
            }
        }
    }

    function VCP(d) {
        var xy = {};
        var yx = {};
        var xs = [];
        var ys = [];
        for (var i in d.e) {
            var x = d.e[i].x;
            var y = d.e[i].y;
            if (!xy[x]) {
                xy[x] = [];
                xs.push(x);
            }
            if (!yx[y]) {
                yx[y] = [];
                ys.push(y);
            }
            xy[x].push(y);
            yx[y].push(x);
        }
        var f = function (a, b) { return a - b; };
        for (var x in xy) xy[x].sort(f);
        for (var y in yx) yx[y].sort(f);
        xs.sort(f);
        ys.sort(f);
        return { xy: xy, yx: yx, xs: xs, ys: ys };
    }

    function VCC(l, m, z1, z2, d, f, s, wm, om) {
        var k = {};
        for (var j in l) k[j] = true;
        for (var j in m) {
            var gs = m[j].length;
            for (var g = 0; g < gs; g++) {
                for (var i = 0; i < m[j][g].length; i++) {
                    k[m[j][g][i][z1]] = true;
                    k[m[j][g][i][z2]] = true;
                }
            }
        }
        for (var j in d.e) k[d.e[j][f]] = true;
        var c = [];
        for (var j in k) c.push(Number(j));
        c.sort(function (a, b) { return a - b; });
        var cs = {};
        var o = 0;
        for (var j = 0; j < c.length; j++) {
            var i = c[j];
            var n = (l[i] && (l[i].length > 1)) ? (l[i].length - 1) : 0;
            var t = Math.min(n * Math.abs(s), (Math.abs(i % 1) < 0.000001) ? wm : om);
            cs[i] = { b: i + o + ((s < 0) ? t : 0), m: i + o + (t / 2), g: n ? (t * ((s < 0) ? -1 : 1) / n) : 0 };
            o += t;
        }
        return cs;
    }

    function VMB(od, b, zf, hr) {
        var d = TND(false);
        var xc = VCC(b.v, b.h, "l", "r", od, "x", Vvs, Vva, Vva);
        var yc = VCC(b.h, b.v, "o", "b", od, "y", hr * Vhs, hr * Vhw, hr * Vho);
        for (var i in od.e) {
            TAE(d, i, od.e[i].p, xc[od.e[i].x].m, yc[od.e[i].y].b, od.e[i].k);
        }
        var hd = {};
        for (var y in b.h) {
            var gs = b.h[y].length;
            for (var g = 0; g < gs; g++) {
                var yy = yc[y].b + g * yc[y].g;
                if (!hd[yy]) hd[yy] = [];
                for (var j = 0; j < b.h[y][g].length; j++) {
                    var n = b.h[y][g][j];
                    var lg = n.lo ? n.lo.g : n.lg;
                    var rg = n.ro ? n.ro.g : n.rg;
                    var l = xc[n.l].b + lg * xc[n.l].g;
                    var r = xc[n.r].b + rg * xc[n.r].g;
                    TAL(d, l, yy, r, yy, n.t, Vdd ? n.c : null);
                    if (n.p) {
                        var bl = null;
                        if (g == (gs - 1)) {
                            bl = false;
                        } else if (VHC(b.h[y][g + 1], n.l + (n.p.l ? 0.5 : 0), n.r - (n.p.r ? 0.5 : 0))) {
                            bl = false;
                        } else if (g == 0) {
                            bl = true;
                        } else if (VHC(b.h[y][g - 1], n.l + (n.p.l ? 0.5 : 0), n.r - (n.p.r ? 0.5 : 0))) {
                            bl = true;
                        }
                        TAP(d, n.p.i1, n.p.i2, l - (n.p.l ? 0 : 0.5), r + (n.p.r ? 0 : 0.5), yy, bl);
                    }
                    hd[yy].push({ l: l, r: r, y: y });
                }
            }
        }
        var hs = [];
        for (var yy in hd) {
            hs.push({ yy: Number(yy), hd: hd[yy].sort(function (a, b) { return a.l - b.l; }) });
        }
        hs.sort(function (a, b) { return a.yy - b.yy; });
        for (var x in b.v) {
            var gs = b.v[x].length;
            for (var g = 0; g < gs; g++) {
                var xx = xc[x].b + g * xc[x].g;
                for (var j = 0; j < b.v[x][g].length; j++) {
                    var n = b.v[x][g][j];
                    var og = n.oo ? n.oo.g : n.og;
                    var bg = n.bo ? n.bo.g : n.bg;
                    var y1 = yc[n.o].b + og * yc[n.o].g;
                    var y2 = yc[n.b].b + bg * yc[n.b].g;
                    var cs = VFC(hs, y1, y2, xx);
                    for (var k = 0; k < cs.length; k++) {
                        TAL(d, xx, y1, xx, cs[k] - Vvk / zf, n.t, Vdd ? n.c : null);
                        y1 = cs[k] + Vvk / zf;
                    }
                    TAL(d, xx, y1, xx, y2, n.t, Vdd ? n.c : null);
                }
            }
        }
        return d;
    }

    function VFC(hs, y1, y2, x) {
        var cs = [];
        for (var i = TFF(hs, "yy", y1); (i < hs.length) && (hs[i].yy < y2); i++) {
            var hd = hs[i].hd;
            for (var k = 0; k < hd.length; k++) {
                if ((hd[k].l < x) && (hd[k].r > x)) {
                    cs.push(Number(hs[i].yy));
                    break;
                }
            }
        }
        return cs;
    }

    function VVB(d, ai) {
        var t = 999999;
        var b = -999999;
        var l = 999999;
        var r = -999999;
        var v = [];
        for (var j = 0; j < ai.length; j++) {
            var e = d.e[ai[j]];
            if (e) {
                t = Math.min(t, e.y);
                b = Math.max(b, e.y);
                l = Math.min(l, e.x);
                r = Math.max(r, e.x);
                v.push(ai[j]);
            }
        }
        return { t: t, l: l, r: r, b: b, v: v, c: v.length };
    }

    function VVE(d, ai) {
        var aa = [];
        for (var j = 0; j < ai.length; j++) {
            if (d.e[ai[j]]) aa.push(ai[j]);
        }
        return aa;
    }

    function VAW(od, d, dx, dy) {
        VAU(d, od, od.e, {}, dx, dy);
    }

    function VAU(fd, td, ro, ri, dx, dy) {
        for (var i in fd.e) {
            if (ri[i] || !ro[i]) {
                var e = fd.e[i];
                TAE(td, i, e.p, e.x + dx, e.y + dy, e.k);
            }
        }
    }

    var Vtc = { pd: 4 };

    function VMG(f, i, si, pg) {
        var eg = 0;
        var p = f[i];
        if (pg["m"] && si) {
            if (p.gp && p.mp) {
                var t = p.gp[si];
                if (((t == "m") || (t == "s") || (t == "d") || (t == "a")) && FAD(p.mp[si])) {
                    eg = Math.max(eg, 0.625);
                }
            }
        }
        if (pg["w"] && si) {
            if (p.gp && p.wp) {
                var t = p.gp[si];
                if (((t == "m") || (t == "s") || (t == "d") || (t == "a")) && p.wp[si]) {
                    eg = Math.max(eg, 1.125);
                }
            }
        }
        if (pg["d"] && si) {
            if (p.gp && p.dp) {
                if ((p.gp[si] == "d") && FAD(p.dp[si])) {
                    eg = Math.max(eg, 0.625);
                }
            }
        }
        return 1 + eg;
    }

    function VGC(f, pi, ci, h, fl, pg, dp, ndli) {
        var ds = [], ss = [], gs = [];
        var tw = 0;
        for (var j = 0; j < ci.length; j++) {
            var i = ci[j];
            var p = f[i];
            var d = VGD(f, i, h, fl, pg, dp, false);
            var pr = (p.m1 == pi) || (p.f1 == pi);
            var gr = FNB(p, pi);
            ds.push(d);
            ss.push(!pr);
            gs.push(gr);
            tw += d.w;
        }
        var flp = ds[0].l;
        var lr = ds[ds.length - 1].r;
        return { ds: ds, ss: ss, gs: gs, tw: tw, fl: flp, lr: lr, aw: (tw + flp - lr) };
    }

    function VDC(d, dd, cx, cy, vx, vy, yo) {
        var ds = dd.ds;
        var gs = dd.gs;
        var aw = dd.aw;
        var ax = [];
        var x = cx - aw / 2 + dd.fl;
        for (var j = 0; j < ds.length; j++) {
            var cd = ds[j];
            ax[j] = x - cd.l;
            VAW(d, cd, ax[j], cy);
            x += cd.w;
        }
        VDL(d, vx, ax, vy, cy, gs, yo);
    }

    function VDL(d, vx, ax, vy, cy, gs, yo) {
    }

    function VDD(d, f, i, si, x, y, pd, sr, da) {
        if (!d.e[i]) TAE(d, i, f[i], x, y);
    }

    function VDE(d, f, i, x, y) {
        if (!d.e[i]) TAE(d, i, f[i], x, y);
    }

    function VAC(d, f, i, x, y) {
    }

    function VDA(d, f, i, si, h, dr, fx, cy, fl, pg, dp, skip, pcx, ndli) {
        var p = f[i];
        var ps = FSS(p, si, false);
        var yt = 0;
        for (var pi in ps) yt++;
        var ot = Math.min(0.1 * (yt - 1), 0.15);
        var ly = cy + ot / 2;
        var lo = (yt > 1) ? (ot / (yt - 1)) : 0;
        var uo = 0.1 / (yt + 1);
        var uy = cy - 0.5 + uo * (yt + 1);
        var ax = [];
        for (var pi in ps) {
            if (dp.p[i + "-" + pi]) {
            } else {
                dp.p[i + "-" + pi] = true;
                dp.p[pi + "-" + i] = true;
                var pc = FLP(f, i, pi);
                if (skip) FAI(pc, skip);
                VDH(d, f, i, pi, pc, h, dr, fx, cy, ly, uy, fl, pg, dp, ax, pcx, ndli);
            }
            ly -= lo;
            uy -= uo;
        }
    }

    function VDH(d, f, i, pi, ci, h, dr, fx, cy, ly, uy, fl, pg, dp, ax, pcx, ndli) {
        if (ci.length) {
            var ds = VGC(f, i, ci, h, fl, pg, dp, ndli);
            var cx = dr ? (d.r - ds.fl + ds.aw / 2) : (d.l - ds.lr - ds.aw / 2);
            var px = cx + (dr ? 0.5 : -0.5);
            VDC(d, ds, cx, cy + 1, (pi && f[pi]) ? cx : fx, ly, (pi === null) ? -0.15 : 0);
        } else {
            var px = dr ? (d.yr[cy]) : (d.yl[cy] - 1);
        }
        if (pi) {
            pcx[pi] = px - (dr ? 0.5 : -0.5);
        }
        if (pi && f[pi]) {
            VDD(d, f, pi, i, px, cy, true, dr, true);
            ax.push(px);
        }
    }

    function VSS(d, f, p, si, h, dr, cy, fl, pg, dp) {
        var li = [], ri = [];
        for (var j = 0; j < si.length; j++) {
            var r = (dr === null) ? (FCC(p, f[si[j]]) < 0) : dr;
            if (r) ri.push(si[j]); else li.push(si[j]);
        }
        var apl = VDS(d, f, p, li, h, false, cy, fl, pg, dp);
        var apr = VDS(d, f, p, ri, h, true, cy, fl, pg, dp);
        var al = apl[""];
        var ar = apr[""];
        var ap = apl;
        for (var j in apr) ap[j] = apr[j];
        return { al: al, ar: ar, ap: ap, ll: li.length, rl: ri.length };
    }

    function VDS(d, f, p, si, h, dr, cy, fl, pg, dp) {
        var al = { "": 0 };
        for (var j = 0; j < si.length; j++) {
            var k = dr ? j : (si.length - j - 1);
            var sd = VGD(f, si[k], h, fl, pg, dp, false);
            var x = VAN(d, sd, cy, dr);
            VAW(d, sd, x, cy);
            al[f[si[k]].i] = x;
            al[""] = x;
        }
        return al;
    }

    function VPS(d, f, pi, oi, ph, h, dr, fx, fl, pg, dp) {
        var p = f[pi];
        if (p.m1 || p.f1) {
            if (ph <= 1) {
            } else {
                var gs = [FNB(p, p.m1 || p.f1)];
                var ax = [fx];
                var bx = fx;
                var od = oi && f[oi] && (f[oi].f1 || f[oi].m1);
                if (h > 0) {
                    var bs = FLS(f, pi, 1);
                    if (bs.length) {
                        if (od) {
                            var aa = VSS(d, f, p, bs, h - 1, dr, -1, fl, pg, dp);
                        } else {
                            var aa = VSS(d, f, p, bs, h - 1, null, -1, fl, pg, dp);
                            var al = aa.ll ? aa.al : fx;
                            var ar = aa.rl ? aa.ar : fx;
                            var bx = (al + ar) / 2;
                            if (Math.abs(bx - fx) > Vtc.pd) {
                                bx = fx + 0.5 * (aa.rl - aa.ll);
                            }
                        }
                        var ap = aa.ap;
                        for (var j = 0; j < bs.length; j++) {
                            gs.push(FNB(f[bs[j]], p.m1 || p.f1));
                            ax.push(ap[bs[j]]);
                        }
                    }
                }
                var ad = VGA(f, pi, ph - 1, od ? dr : null, h <= 0, fl, pg, dp, true);
                VAW(d, ad, bx, -1);
                if (h > 0) {
                    if (p.m1 && p.f1) {
                        dp.p[p.m1 + "-" + p.f1] = true;
                        dp.p[p.f1 + "-" + p.m1] = true;
                    }
                    VDL(d, bx + (ad.yl[-1] + ad.yr[-1] - 1) / 2, ax, -2, -1, gs, 0);
                }
            }
        }
    }

    function VGA(f, i, h, dr, da, fl, pg, dp, oo) {
        var d = TND(false);
        var p = f[i];
        var no = !dp.a[i + "-" + 1];
        if ((h > 0) && (oo || no)) {
            if (no) dp.a[i + "-" + 1] = true;
            else h = 1;
            var x1 = 0;
            if (p.m1 || p.f1) {
                if (p.m1 && p.f1) {
                    if (!dp.p[p.m1 + "-" + p.f1]) {
                        var g = VMG(f, p.m1, p.f1, pg);
                        var m1, dr1, dr2;
                        if (dr === null) {
                            m1 = !fl;
                            dr1 = false; dr2 = true;
                            x1 -= g / 2;
                        } else {
                            m1 = fl ? (!dr) : dr;
                            dr1 = dr; dr2 = dr;
                        }
                        var i1 = m1 ? p.m1 : p.f1;
                        var i2 = m1 ? p.f1 : p.m1;
                        VAW(d, VGA(f, i1, h - 1, dr1, true, fl, pg, dp, false), x1, -1);
                        VDD(d, f, i1, i2, x1, -1, false, dr1, true);
                        var ad = VGA(f, i2, h - 1, dr2, true, fl, pg, dp, false);
                        VDD(ad, f, i2, i1, 0, 0, false, dr2, true);
                        var x2 = VAN(d, ad, -1, dr2);
                        x2 = dr2 ? Math.max(x2, x1 + g) : Math.min(x2, x1 - g);
                        VAW(d, ad, x2, -1);
                    }
                } else {
                    var pi = p.m1 || p.f1;
                    if (!dp.c[pi]) {
                        VAW(d, VGA(f, pi, h - 1, dr, true, fl, pg, dp, false), x1, -1);
                        VDD(d, f, pi, null, x1, -1, false, f[pi].g != (fl ? "f" : "m"), false);
                        if (FLA(f, pi).length == 1) dp.c[pi] = true;
                    }
                }
            }
        }
        return d;
    }

    function VGD(f, i, h, fl, pg, dp, cg) {
        var p = f[i];
        var d = TND(cg);
        var sr = FSM(f, i, p.es);
        var g = VMG(f, i, p.es, pg);
        if (fl) {
            sr = !sr;
        }
        var sx = sr ? g : -g;
        if ((h > 0)) {
            if (!d.e[i]) {
                TAE(d, i, p, 0, 0);
            }
            var c = p.c.slice();
            if (p.es && f[p.es]) {
                FAN(c, f[p.es].c || []);
            }
            var _2c0 = [];
            var _2c1 = [];
            var _2c2 = [];
            var _2c3 = [];
            var _2c4 = {};
            var _2c5 = {};
            for (var j = 0; j < c.length; j++) {
                var ci = c[j];
                var cp = f[ci];
                if (!cp) continue;
                if ((cp.m1 == i) || (cp.f1 == i)) {
                    _2c1[_2c1.length] = ci;
                    if (p.es) {
                        if ((cp.m2 == p.es) || (cp.f2 == p.es)) {
                            _2c3[_2c3.length] = { j: 2, i: ci };
                        } else {
                            if ((cp.m3 == p.es) || (cp.f3 == p.es)) {
                                _2c3[_2c3.length] = { j: 3, i: ci };
                            }
                        }
                    }
                } else {
                    if (p.es && ((cp.m1 == p.es) || (cp.f1 == p.es))) {
                        _2c0[_2c0.length] = ci;
                        if ((cp.m2 == i) || (cp.f2 == i)) {
                            _2c2[_2c2.length] = { j: 2, i: ci };
                        } else {
                            if ((cp.m3 == i) || (cp.f3 == i)) {
                                _2c2[_2c2.length] = { j: 3, i: ci };
                            }
                        }
                    } else {
                        if ((cp.m2 == i) || (cp.f2 == i) || (cp.m3 == i) || (cp.f3 == i)) {
                            _2c1[_2c1.length] = ci;
                        } else {
                            _2c0[_2c0.length] = ci;
                        }
                    }
                }
            }
            var ac = FLA(f, i);
            FAI(ac, _2c0);
            _2c4[""] = 0;
            if (ac.length) {
                if (dp.c[i]) {
                    VAC(d, f, i, 0, 0);
                } else {
                    dp.c[i] = true;
                    var ds = VGC(f, i, ac, h - 1, fl, pg, dp, p.es);
                    VDC(d, ds, 0, 1, 0, 0, 0);
                }
            }
            if (p.es && f[p.es]) {
                if (dp.p[i + "-" + p.es]) {
                } else {
                    dp.p[i + "-" + p.es] = true;
                    dp.p[p.es + "-" + i] = true;
                    var tc = FLP(f, i, p.es);
                    FAI(tc, _2c0);
                    if (tc.length) {
                        var ds = VGC(f, i, tc, h - 1, fl, pg, dp);
                        if (ac.length) {
                            sx = sr ? Math.max(g, (d.r + (ds.tw - ds.fl - ds.lr) / 2 + 0.5)) : Math.min(-g, (d.l - (ds.tw + ds.lr + ds.fl) / 2 - 0.5));
                            var cx = sr ? (sx - 0.5) : (sx + 0.5);
                        } else {
                            var cx = sr ? (sx - g / 2) : (sx + g / 2);
                        }
                        VDC(d, ds, cx, 1, cx, 0, 0);
                        _2c4[p.es] = cx;
                        _2c5[i] = cx;
                    }
                    VDD(d, f, p.es, i, sx, 0, true, null, false);
                    _2c5[""] = sx;
                    var pac = FLA(f, p.es);
                    FAI(pac, _2c1);
                    if (pac.length) {
                        if (dp.c[p.es]) {
                            VAC(d, f, p.es, sx, 0);
                        } else {
                            dp.c[p.es] = true;
                            var ds = VGC(f, p.es, pac, h - 1, fl, pg, dp);
                            VDC(d, ds, sr ? (d.r + (ds.tw - ds.fl - ds.lr) / 2) : (d.l - (ds.tw + ds.lr + ds.fl) / 2), 1, sx, 0, -0.15);
                        }
                    }
                    VDA(d, f, p.es, i, h - 1, sr, sx, 0, fl, pg, dp, _2c1, _2c5, i);
                }
            }
            VDA(d, f, i, p.es, h - 1, !sr, 0, 0, fl, pg, dp, _2c0, _2c4, p.es);
            for (var k = 2; k <= 3; k++) {
                var oxy = (k - 1) * 0.05;
                for (var j = 0; j < _2c2.length; j++) {
                    if (_2c2[j].j == k) {
                        var ci = _2c2[j].i;
                        if (d.e[ci]) {
                            var op = (f[ci]["m" + k] == i) ? f[ci]["f" + k] : f[ci]["m" + k];
                            VDL(d, _2c4[op || ""] + 0, [d.e[ci].x + oxy], 0, 1, [FSB(f[ci], k)], -oxy);
                        }
                    }
                }
                for (var j = 0; j < _2c3.length; j++) {
                    if (_2c3[j].j == k) {
                        var ci = _2c3[j].i;
                        if (d.e[ci]) {
                            var op = (f[ci]["m" + k] == p.es) ? f[ci]["f" + k] : f[ci]["m" + k];
                            VDL(d, _2c5[op || ""] + 0, [d.e[ci].x + oxy], 0, 1, [FSB(f[ci], k)], -oxy);
                        }
                    }
                }
            }
        } else {
            VDD(d, f, i, null, 0, 0, false, sr, true);
        }
        return d;
    }

    function VGH(f, i) {
        var p = f[i];
        if (p) {
            var hc = p.es;
            var ac = FLA(f, i);
            if (hc && (!p.m1) && (!p.f1) && p.pc[hc] && (p.cp == 1) && (ac.length == 0)) {
                return hc;
            }
        }
        return null;
    }

    function VFE(f, i, m, ch, ph, oh, fl, pg, dp, cg) {
        var p = f[i];
        var hc = VGH(f, i);
        if (ch && hc && !VGH(f, hc)) {
            var d = TND(cg);
            var od = VFE(f, hc, m, ch, ph, oh, fl, pg, dp, false);
            TAD(d, od, -od.e[i].x, -od.e[i].y);
        } else {
            var d = VGD(f, i, ch, fl, pg, dp, cg);
            if (ph > 0) {
                for (var j = 1; j <= 3; j++) {
                    var mi = p["m" + j];
                    var fi = p["f" + j];
                    var pi = mi || fi;
                    if (pi && ((mi && fi) ? (!dp.p[mi + "-" + fi]) : (!dp.c[pi]))) {
                        var px = 0;
                        var bs = FLS(f, i, j);
                        if (bs.length) {
                            var aa = VSS(d, f, p, bs, oh, null, 0, fl, pg, dp);
                            px = (aa.al + aa.ar) / 2;
                            if (Math.abs(px) > Vtc.pd) {
                                px = 0.5 * (aa.rl - aa.ll);
                            }
                        }
                        if (mi || fi) {
                            var mx = px, fx = px;
                            var p2 = p["m" + (j + 1)] || p["f" + (j + 1)];
                            var p3 = p["m" + (j + 2)] || p["f" + (j + 2)];
                            if (mi && fi) {
                                dp.p[mi + "-" + fi] = true;
                                dp.p[fi + "-" + mi] = true;
                                var o = VMG(f, mi, fi, pg) / 2;
                                mx += (fl ? o : -o);
                                fx += (fl ? -o : o);
                            }
                            if (mi) {
                                VDE(d, f, mi, mx, -1);
                            }
                            if (fi) {
                                VDE(d, f, fi, fx, -1);
                            }
                            dp.a[i + "-" + j] = true;
                            if (p2) {
                                var dr2 = (bs.length == 0) || (aa.ll >= aa.rl);
                                var eu = {};
                                for (var k = 1; k <= 2; k++) {
                                    var drj = dr2;
                                    var mj = p["m" + (j + k)];
                                    var fj = p["f" + (j + k)];
                                    if (mj || fj) {
                                        var ej = null;
                                        var ei = null;
                                        var ex = null;
                                        var em = false;
                                        if (mj && fj && ((fj == mi) || (fj == fi)) && !eu[fj]) {
                                            ej = mj;
                                            drj = (fj == mi) ? fl : !fl;
                                            ei = fj;
                                            ex = fx;
                                            fj = null;
                                            em = true;
                                        } else {
                                            if (fj && mj && ((mj == mi) || (mj == fi)) && !eu[mj]) {
                                                ej = fj;
                                                drj = (mj == mi) ? fl : !fl;
                                                ei = mj;
                                                ex = mx;
                                                mj = null;
                                                em = true;
                                            } else {
                                                if (!(mj && fj)) {
                                                    ej = mj || fj;
                                                    if (f[ej].pc[mi] && !eu[mi]) {
                                                        drj = fl;
                                                        ei = mi;
                                                        ex = mx;
                                                    } else {
                                                        if (f[ej].pc[fi] && !eu[fi]) {
                                                            drj = !fl;
                                                            ei = fi;
                                                            ex = fx;
                                                        } else {
                                                            ej = null;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        var g = ej ? VMG(f, ej, ei, pg) : 1;
                                        var m2x = drj ? (d.yr[-1] + g - 1) : (d.yl[-1] - g);
                                        var f2x = m2x;
                                        if (mj && fj) {
                                            var g = VMG(f, mj, fj, pg);
                                            m2x += (fl ? (drj ? g : 0) : (drj ? 0 : -g));
                                            f2x = m2x + (fl ? -g : g);
                                        }
                                        if (mj) {
                                            VDD(d, f, mj, fj, m2x, -1, true, fl, false);
                                        }
                                        if (fj) {
                                            VDD(d, f, fj, mj, f2x, -1, true, !fl, false);
                                        }
                                        if (ej && ei) {
                                            eu[ei] = true;
                                        }
                                    }
                                }
                            } else {
                                if (mi) {
                                    var ac = FLA(f, mi);
                                    if (ac.length && fi) {
                                        VDH(d, f, mi, null, ac, oh, fl, mx, -1, -1, -1, fl, pg, dp, [], {});
                                    }
                                    VDA(d, f, mi, fi, oh, fl, mx, -1, fl, pg, dp, [], {});
                                }
                                if (fi) {
                                    var ac = FLA(f, fi);
                                    if (ac.length && mi) {
                                        VDH(d, f, fi, null, ac, oh, !fl, fx, -1, -1, -1, fl, pg, dp, [], {});
                                    }
                                    VDA(d, f, fi, mi, oh, !fl, fx, -1, fl, pg, dp, [], {});
                                }
                            }
                            if (mi) {
                                VPS(d, f, mi, fi, ph, oh, fl, mx, fl, pg, dp);
                            }
                            if (fi) {
                                VPS(d, f, fi, mi, ph, oh, !fl, fx, fl, pg, dp);
                            }
                        }
                        break;
                    }
                }
            }
        }
        return d;
    }

    window.FE_LAYOUT = {
        layout: VFT,
        reset: VCA
    };
})();


(() => {
    'use strict';

    const CARD_W = 180;
    const CARD_H = 52;
    const SPOUSE_GAP = 15;
    const SIBLING_GAP = 50;
    const FAMILY_GAP = 80;
    const ROW_H = 120;
    const FE_SHOW_PARENTS = 8;
    const FE_SHOW_CHILDREN = 8;
    const FE_SHOW_COUSINS = 2;
    const FE_X_GAP = 24;
    const FE_Y_GAP = 50;

    const state = {
        panX: 0,
        panY: 0,
        zoom: 1.0,
        isPanning: false,
        startX: 0,
        startY: 0,
        startPanX: 0,
        startPanY: 0,
        selectedPerson: null,
        visiblePersons: null,
        positions: {},
        instances: [],
        layoutSegments: null,
        layoutScale: null,
        layoutOrigin: null
    };

    let ancestorSide = new Map();
    let panAnimation = null;

    let personsData = [];
    let marriages = [];

    const appState = {
        isAuthenticated: false,
        accessLevel: 'owner',
        user: null,
        treeId: null,
        isShared: false,
        shareTokens: null
    };

    function setPersonsData(data) {
        personsData = Array.isArray(data) ? data : [];
    }

    function setMarriages(data) {
        marriages = Array.isArray(data) ? data : [];
    }

    function canEdit() {
        return appState.accessLevel === 'owner' || appState.accessLevel === 'editor';
    }

    function setAncestorSide(map) {
        ancestorSide = map;
    }

    function setPanAnimation(anim) {
        panAnimation = anim;
    }

    let instanceCounter = 0;

    function generateInstanceId() {
        return 'inst_' + (++instanceCounter);
    }

    function addInstance(personId, x, y, marriageContext = null) {
        const instanceId = generateInstanceId();
        state.instances.push({
            instanceId,
            personId,
            x,
            y,
            marriageContext
        });
        if (!state.positions[personId]) {
            state.positions[personId] = { x, y };
        }
        return instanceId;
    }

    function getInstancesForPerson(personId) {
        return state.instances.filter(inst => inst.personId === personId);
    }

    function clearInstances() {
        state.instances = [];
        state.positions = {};
        state.layoutSegments = null;
        state.layoutScale = null;
        state.layoutOrigin = null;
        instanceCounter = 0;
    }

    const baseUrl = 'api';

    function getToken() {
        return localStorage.getItem('auth_token');
    }

    function getShareToken() {
        const params = new URLSearchParams(window.location.search);
        return params.get('share');
    }

    function getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const shareToken = getShareToken();
        if (shareToken) {
            headers['X-Share-Token'] = shareToken;
        }

        return headers;
    }

    async function request(endpoint, method = 'GET', data = null) {
        const url = `${baseUrl}/${endpoint}`;
        const options = {
            method,
            headers: getHeaders()
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401 && !getShareToken()) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(result.error || 'Request failed');
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async function checkAuth() {
        const shareToken = getShareToken();
        const endpoint = shareToken ? `auth/check.php?share=${shareToken}` : 'auth/check.php';
        return request(endpoint);
    }

    async function login(loginValue, password) {
        return request('auth/login.php', 'POST', { login: loginValue, password });
    }

    async function register(username, email, password) {
        return request('auth/register.php', 'POST', { username, email, password });
    }

    async function logout() {
        const result = await request('auth/logout.php', 'POST');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        return result;
    }

    async function getTree() {
        const shareToken = getShareToken();
        const endpoint = shareToken ? `tree/get.php?share=${shareToken}` : 'tree/get.php';
        return request(endpoint);
    }

    async function getShareLinks() {
        return request('tree/share.php');
    }

    async function regenerateShareLinks(type = 'both') {
        return request('tree/share.php', 'POST', { type });
    }

    async function getPersons() {
        const shareToken = getShareToken();
        const endpoint = shareToken ? `persons/?share=${shareToken}` : 'persons/';
        return request(endpoint);
    }

    async function createPerson(personData) {
        const shareToken = getShareToken();
        const endpoint = shareToken ? `persons/?share=${shareToken}` : 'persons/';
        return request(endpoint, 'POST', personData);
    }

    async function updatePersonApi(id, personData) {
        const shareToken = getShareToken();
        const dbId = String(id).replace(/^p/, '');
        const endpoint = shareToken ? `persons/?id=${dbId}&share=${shareToken}` : `persons/?id=${dbId}`;
        return request(endpoint, 'PUT', personData);
    }

    async function deletePersonApi(id) {
        const shareToken = getShareToken();
        const dbId = String(id).replace(/^p/, '');
        const endpoint = shareToken ? `persons/?id=${dbId}&share=${shareToken}` : `persons/?id=${dbId}`;
        return request(endpoint, 'DELETE');
    }

    async function getMarriages() {
        const shareToken = getShareToken();
        const endpoint = shareToken ? `marriages/?share=${shareToken}` : 'marriages/';
        return request(endpoint);
    }

    async function createMarriage(husband, wife, children = []) {
        const shareToken = getShareToken();
        const endpoint = shareToken ? `marriages/?share=${shareToken}` : 'marriages/';
        return request(endpoint, 'POST', { husband, wife, children });
    }

    async function updateMarriage(id, data) {
        const shareToken = getShareToken();
        const dbId = String(id).replace(/^m/, '');
        const endpoint = shareToken ? `marriages/?id=${dbId}&share=${shareToken}` : `marriages/?id=${dbId}`;
        return request(endpoint, 'PUT', data);
    }

    async function addChildToMarriageApi(marriageId, childId) {
        const shareToken = getShareToken();
        const dbId = String(marriageId).replace(/^m/, '');
        const endpoint = shareToken ? `marriages/?id=${dbId}&share=${shareToken}` : `marriages/?id=${dbId}`;
        return request(endpoint, 'PUT', { add_child: childId });
    }

    async function removeChildFromMarriage(marriageId, childId) {
        const shareToken = getShareToken();
        const dbId = String(marriageId).replace(/^m/, '');
        const endpoint = shareToken ? `marriages/?id=${dbId}&share=${shareToken}` : `marriages/?id=${dbId}`;
        return request(endpoint, 'PUT', { remove_child: childId });
    }

    async function deleteMarriage(id) {
        const shareToken = getShareToken();
        const dbId = String(id).replace(/^m/, '');
        const endpoint = shareToken ? `marriages/?id=${dbId}&share=${shareToken}` : `marriages/?id=${dbId}`;
        return request(endpoint, 'DELETE');
    }

    async function importGEDCOMApi(file) {
        const formData = new FormData();
        formData.append('file', file);

        const shareToken = getShareToken();
        const url = shareToken ? `${baseUrl}/import/gedcom.php?share=${shareToken}` : `${baseUrl}/import/gedcom.php`;

        const headers = {};
        const token = getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });
        return response.json();
    }

    const API = {
        getToken,
        getShareToken,
        getHeaders,
        request,
        checkAuth,
        login,
        register,
        logout,
        getTree,
        getShareLinks,
        regenerateShareLinks,
        getPersons,
        createPerson,
        updatePerson: updatePersonApi,
        deletePerson: deletePersonApi,
        getMarriages,
        createMarriage,
        updateMarriage,
        addChildToMarriage: addChildToMarriageApi,
        removeChildFromMarriage,
        deleteMarriage,
        importGEDCOM: importGEDCOMApi
    };

    window.API = API;

    function coercePersonId(value) {
        if (!personsData.length) return value;
        return (typeof personsData[0].id === 'number') ? Number(value) : value;
    }

    function idsEqual(a, b) {
        return String(a) === String(b);
    }

    function getPersonById(id) {
        if (id === null || id === undefined) return undefined;
        const coerced = coercePersonId(id);
        return personsData.find(p => p.id === coerced);
    }

    function getPersonSurname(person) {
        if (!person) return '';
        if (person.surname) return person.surname;
        if (person.surname_at_birth) return person.surname_at_birth;
        return '';
    }

    function getPersonGivenName(person) {
        if (!person) return '';
        if (person.given_name) return person.given_name;
        return '';
    }

    function getPersonDisplayName(person) {
        if (!person) return '(Без имени)';
        const given = person.given_name || '';
        const patronymic = person.patronymic || '';
        const surname = person.surname || person.surname_at_birth || '';
        const parts = [given, patronymic, surname].filter(Boolean);
        if (parts.length) return parts.join(' ');
        return '(Без имени)';
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function canDeletePerson(personId) {
        const person = getPersonById(personId);
        if (person && person.is_root) {
            return { canDelete: false, reason: 'is_root', message: 'Нельзя удалить основателя дерева' };
        }

        const remainingPersons = personsData.filter(p => !idsEqual(p.id, personId));
        if (remainingPersons.length === 0) {
            return { canDelete: true };
        }

        const connections = new Map();
        remainingPersons.forEach(p => connections.set(p.id, new Set()));

        marriages.forEach(m => {
            if (idsEqual(m.husband, personId) || idsEqual(m.wife, personId)) return;

            if (connections.has(m.husband) && connections.has(m.wife)) {
                connections.get(m.husband).add(m.wife);
                connections.get(m.wife).add(m.husband);
            }

            (m.children || []).forEach(childId => {
                if (idsEqual(childId, personId)) return;
                if (connections.has(childId)) {
                    if (connections.has(m.husband)) {
                        connections.get(m.husband).add(childId);
                        connections.get(childId).add(m.husband);
                    }
                    if (connections.has(m.wife)) {
                        connections.get(m.wife).add(childId);
                        connections.get(childId).add(m.wife);
                    }
                }
            });
        });

        const root = remainingPersons.find(p => p.is_root);
        if (!root) {
            return { canDelete: true };
        }

        const visited = new Set();
        const queue = [root.id];
        visited.add(root.id);

        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = connections.get(current) || new Set();
            neighbors.forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            });
        }

        if (visited.size < remainingPersons.length) {
            return {
                canDelete: false,
                reason: 'split',
                message: 'Нельзя удалить этого человека, так как это приведёт к разделению дерева. Сначала удалите более внешних людей.'
            };
        }

        return { canDelete: true };
    }

    function findParents(personId) {
        for (const m of marriages) {
            if (m.children && m.children.some(childId => idsEqual(childId, personId))) {
                return { father: m.husband, mother: m.wife };
            }
        }
        return null;
    }

    function findSpouses(personId) {
        const spouses = [];
        for (const m of marriages) {
            if (idsEqual(m.husband, personId)) spouses.push(m.wife);
            if (idsEqual(m.wife, personId)) spouses.push(m.husband);
        }
        return spouses;
    }

    function findChildren(personId) {
        const children = [];
        for (const m of marriages) {
            if (idsEqual(m.husband, personId) || idsEqual(m.wife, personId)) {
                if (m.children) children.push(...m.children);
            }
        }
        return [...new Set(children)];
    }

    function findChildrenWithMarriages(personId) {
        const result = [];
        for (const m of marriages) {
            if (idsEqual(m.husband, personId) || idsEqual(m.wife, personId)) {
                if (m.children) {
                    for (const childId of m.children) {
                        result.push({
                            childId,
                            marriageId: m.id,
                            order: m.children.indexOf(childId)
                        });
                    }
                }
            }
        }
        return result;
    }

    function findSiblings(personId) {
        const parents = findParents(personId);
        if (!parents) return [];

        const siblings = [];
        for (const m of marriages) {
            if (idsEqual(m.husband, parents.father) && idsEqual(m.wife, parents.mother)) {
                if (m.children) {
                    for (const c of m.children) {
                        if (!idsEqual(c, personId)) siblings.push(c);
                    }
                }
            }
        }
        return siblings;
    }

    function findMarriagesForPerson(personId) {
        return marriages.filter(m => idsEqual(m.husband, personId) || idsEqual(m.wife, personId));
    }

    function findPersonMarriage(personId) {
        return marriages.find(m => idsEqual(m.husband, personId) || idsEqual(m.wife, personId));
    }

    function findAllPersonMarriages(personId) {
        return marriages.filter(m => idsEqual(m.husband, personId) || idsEqual(m.wife, personId));
    }

    function getSpouseInMarriage(personId, marriage) {
        return idsEqual(marriage.husband, personId) ? marriage.wife : marriage.husband;
    }

/**
 * Shajara - Tree Layout Module
 * @module modules/layout
 */

/**
 * Find root marriage (where neither spouse has parents)
 * @returns {Object|undefined} Root marriage object
 */
function findRootMarriage() {
    return marriages.find(m =>
        !findParents(m.husband) &&
        !findParents(m.wife) &&
        m.children && m.children.length > 0
    );
}

/**
 * Find ALL root marriages
 * @returns {Object[]} Array of root marriages
 */
function findAllRootMarriages() {
    return marriages.filter(m =>
        !findParents(m.husband) &&
        !findParents(m.wife) &&
        m.children && m.children.length > 0
    );
}

/**
 * Check if person is descendant of root marriage
 * @param {string} personId - Person ID
 * @param {Object} rootMarriage - Root marriage object
 * @param {Set} visited - Visited set
 * @returns {boolean}
 */
function isDescendantOfRootMarriage(personId, rootMarriage, visited = new Set()) {
    if (visited.has(personId)) return false;
    visited.add(personId);

    if (rootMarriage.children && rootMarriage.children.includes(personId)) {
        return true;
    }

    const parents = findParents(personId);
    if (parents) {
        if (isDescendantOfRootMarriage(parents.father, rootMarriage, visited) ||
            isDescendantOfRootMarriage(parents.mother, rootMarriage, visited)) {
            return true;
        }
    }

    return false;
}

/**
 * Get all descendants of a root marriage
 * @param {Object} rootMarriage - Root marriage object
 * @param {Set} visited - Visited set
 * @returns {Set<string>} Set of descendant IDs
 */
function getRootFamilyDescendants(rootMarriage, visited = new Set()) {
    const descendants = new Set();

    function addDescendants(personId) {
        if (visited.has(personId)) return;
        visited.add(personId);
        descendants.add(personId);

        const children = findChildren(personId);
        children.forEach(childId => {
            addDescendants(childId);
        });
    }

    descendants.add(rootMarriage.husband);
    descendants.add(rootMarriage.wife);

    if (rootMarriage.children) {
        rootMarriage.children.forEach(childId => {
            addDescendants(childId);
        });
    }

    return descendants;
}

/**
 * Calculate width needed for marriage children
 * @param {Object} marriage - Marriage object
 * @param {Set} visited - Visited set
 * @returns {number} Width in pixels
 */
function calcMarriageChildrenWidth(marriage, visited = new Set()) {
    const visible = state.visiblePersons;
    if (!marriage.children) return 0;

    const visibleChildren = marriage.children.filter(c => !visible || visible.has(c));
    if (visibleChildren.length === 0) return 0;

    let width = 0;
    visibleChildren.forEach(cId => {
        width += calcChildSubtreeWidth(cId, new Set(visited)) + SIBLING_GAP;
    });
    return Math.max(width - SIBLING_GAP, 0);
}

/**
 * Calculate width of child's subtree
 * @param {string} childId - Child person ID
 * @param {Set} visited - Visited set
 * @returns {number} Width in pixels
 */
function calcChildSubtreeWidth(childId, visited = new Set()) {
    const visible = state.visiblePersons;

    if (visited.has(childId)) return 0;
    visited.add(childId);

    if (visible && !visible.has(childId)) return 0;

    const allMarriages = findAllPersonMarriages(childId);

    if (allMarriages.length === 0) {
        return CARD_W;
    }

    const visibleSpouses = [];
    allMarriages.forEach(m => {
        const spouseId = getSpouseInMarriage(childId, m);
        if (!visible || visible.has(spouseId)) {
            visibleSpouses.push({ spouseId, marriage: m });
        }
    });

    if (visibleSpouses.length === 0) {
        return CARD_W;
    }

    if (visibleSpouses.length === 1) {
        const spouseId = visibleSpouses[0].spouseId;

        const childParents = findParents(childId);
        const spouseParents = findParents(spouseId);

        const childHasVisibleParents = childParents &&
            (!visible || (visible.has(childParents.father) && visible.has(childParents.mother)));
        const spouseHasVisibleParents = spouseParents &&
            (!visible || (visible.has(spouseParents.father) && visible.has(spouseParents.mother)));

        const parentCoupleWidth = CARD_W * 2 + SPOUSE_GAP;
        let coupleWidth;

        if (childHasVisibleParents && spouseHasVisibleParents) {
            coupleWidth = parentCoupleWidth * 2 + FAMILY_GAP;
        } else {
            coupleWidth = CARD_W * 2 + SPOUSE_GAP;
        }

        const childrenWidth = calcMarriageChildrenWidth(visibleSpouses[0].marriage, new Set(visited));
        return Math.max(coupleWidth, childrenWidth);
    }

    const marriage1 = visibleSpouses[0].marriage;
    const marriage2 = visibleSpouses[1].marriage;

    const children1Width = calcMarriageChildrenWidth(marriage1, new Set(visited));
    const children2Width = calcMarriageChildrenWidth(marriage2, new Set(visited));

    const coupleWidth = CARD_W * 2 + SPOUSE_GAP;
    const leftFamilyWidth = Math.max(coupleWidth, children2Width);
    const rightFamilyWidth = Math.max(coupleWidth, children1Width);
    const familyGap = Math.max(FAMILY_GAP, SIBLING_GAP);

    return leftFamilyWidth + familyGap + rightFamilyWidth;
}

/**
 * Check if person is ancestor of target
 * @param {string} personId - Person ID
 * @param {string} targetId - Target person ID
 * @param {Set} visited - Visited set
 * @returns {boolean}
 */
function isAncestorOf(personId, targetId, visited = new Set()) {
    if (visited.has(personId)) return false;
    visited.add(personId);

    if (personId === targetId) return true;

    const children = findChildren(personId);
    for (const childId of children) {
        if (isAncestorOf(childId, targetId, visited)) return true;
    }

    return false;
}

/**
 * Sort children placing ancestor child on correct side
 * @param {string[]} children - Array of child IDs
 * @returns {string[]} Sorted array
 */
function sortChildrenBySelectedPerson(children) {
    if (!state.selectedPerson) return children;

    const selected = state.selectedPerson;

    let ancestorChild = null;
    for (const childId of children) {
        if (childId === selected || isAncestorOf(childId, selected)) {
            ancestorChild = childId;
            break;
        }
    }

    if (!ancestorChild) return children;

    const side = ancestorSide.get(ancestorChild);
    const others = children.filter(c => c !== ancestorChild);

    if (side === 'right') {
        return [...others, ancestorChild];
    }
    if (side === 'left') {
        return [ancestorChild, ...others];
    }

    return [ancestorChild, ...others];
}

/**
 * Update ancestor side map for layout
 */
function updateAncestorSideMap() {
    const newMap = new Map();
    const focal = state.selectedPerson;
    if (!focal) {
        setAncestorSide(newMap);
        return;
    }

    const parents = findParents(focal);
    if (!parents) {
        setAncestorSide(newMap);
        return;
    }

    function markBranch(personId, side) {
        if (!personId || newMap.has(personId)) return;
        newMap.set(personId, side);
        const p = findParents(personId);
        if (p) {
            markBranch(p.father, side);
            markBranch(p.mother, side);
        }
    }

    markBranch(parents.father, 'left');
    markBranch(parents.mother, 'right');
    setAncestorSide(newMap);
}

/**
 * Normalize gender to single char
 * @param {string} gender - Gender string
 * @returns {string} 'm', 'f', or 'o'
 */
function normalizeGender(gender) {
    if (!gender) return 'o';
    const g = String(gender).toLowerCase();
    if (g === 'male' || g === 'm') return 'm';
    if (g === 'female' || g === 'f') return 'f';
    return 'o';
}

/**
 * Build data structure for FamilyEcho layout
 * @param {Set|null} visible - Set of visible person IDs
 * @returns {Object} Family data structure
 */
function buildFamilyEchoData(visible = null) {
    const f = {};
    const personList = visible ? personsData.filter(p => visible.has(p.id)) : personsData;

    personList.forEach((p, idx) => {
        const id = p.id;
        f[id] = {
            i: id,
            h: getPersonDisplayName(p) || '',
            g: normalizeGender(p.gender),
            c: [],
            pc: {},
            es: null,
            s: null,
            m1: null,
            f1: null,
            m: null,
            f: null,
            t1: 'b',
            ai: idx,
            b: p.birth || ''
        };
    });

    marriages.forEach(m => {
        const husbandId = m.husband;
        const wifeId = m.wife;
        const children = (m.children || []).filter(c => f[c]);

        children.forEach((childId, index) => {
            const child = f[childId];
            child.O = index;
            if (f[wifeId]) {
                child.m1 = wifeId;
                child.m = wifeId;
            }
            if (f[husbandId]) {
                child.f1 = husbandId;
                child.f = husbandId;
            }
        });

        if (f[husbandId]) {
            children.forEach(childId => {
                if (!f[husbandId].c.includes(childId)) f[husbandId].c.push(childId);
            });
            f[husbandId].pc[wifeId] = 1;
        }
        if (f[wifeId]) {
            children.forEach(childId => {
                if (!f[wifeId].c.includes(childId)) f[wifeId].c.push(childId);
            });
            f[wifeId].pc[husbandId] = 1;
        }
    });

    Object.values(f).forEach(entry => {
        entry.cp = Object.keys(entry.pc || {}).length;
    });

    const focusId = state.selectedPerson;
    personList.forEach(p => {
        const entry = f[p.id];
        const spouseKeys = Object.keys(entry.pc || {}).filter(sk => f[coercePersonId(sk)]);
        if (!spouseKeys.length) return;

        if (spouseKeys.length === 1) {
            entry.es = coercePersonId(spouseKeys[0]);
            entry.s = entry.es;
            return;
        }

        let chosen = null;
        let bestScore = -Infinity;

        spouseKeys.forEach(sk => {
            const spouseId = coercePersonId(sk);
            let score = 0;

            if (focusId != null) {
                const marriagesForPerson = findAllPersonMarriages(p.id);
                marriagesForPerson.forEach(m => {
                    const sId = getSpouseInMarriage(p.id, m);
                    if (sId !== spouseId) return;
                    if (m.children && m.children.includes(focusId)) {
                        score += 5;
                    } else if (m.children && m.children.some(ch => isAncestorOf(ch, focusId))) {
                        score += 3;
                    }
                });
            }

            if (visible && visible.has(spouseId)) score += 1;

            if (score > bestScore) {
                bestScore = score;
                chosen = spouseId;
            }
        });

        if (chosen !== null && chosen !== undefined) {
            entry.es = chosen;
            entry.s = chosen;
        }
    });

    return f;
}

/**
 * Compute visible depths from focus person
 * @param {string} focusId - Focus person ID
 * @param {Set|null} visible - Visible persons set
 * @returns {Object} { down, up }
 */
function computeVisibleDepths(focusId, visible) {
    let maxDown = 0;
    let maxUp = 0;

    const visitedDown = new Set();
    function walkDown(id, depth) {
        if (visitedDown.has(id)) return;
        visitedDown.add(id);
        maxDown = Math.max(maxDown, depth);

        const kids = findChildren(id).filter(c => !visible || visible.has(c));
        kids.forEach(childId => walkDown(childId, depth + 1));
    }

    const visitedUp = new Set();
    function walkUp(id, depth) {
        if (visitedUp.has(id)) return;
        visitedUp.add(id);
        maxUp = Math.max(maxUp, depth);

        const parents = findParents(id);
        if (!parents) return;
        const parentIds = [parents.father, parents.mother].filter(pid => pid && (!visible || visible.has(pid)));
        parentIds.forEach(pid => walkUp(pid, depth + 1));
    }

    walkDown(focusId, 0);
    walkUp(focusId, 0);

    return { down: maxDown, up: maxUp };
}

/**
 * Apply FamilyEcho layout data to state
 * @param {Object} d - Layout data from FE_LAYOUT
 */
function applyFamilyEchoLayout(d) {
    if (!d || !d.e) return;
    const entries = Object.entries(d.e);
    if (!entries.length) return;

    let minX = Infinity;
    let minY = Infinity;
    entries.forEach(([, e]) => {
        minX = Math.min(minX, e.x);
        minY = Math.min(minY, e.y);
    });

    const unitX = CARD_W + FE_X_GAP;
    const unitY = CARD_H + FE_Y_GAP;
    const margin = Math.max(80, CARD_W);
    const originX = margin - minX * unitX;
    const originY = margin - minY * unitY;

    state.layoutScale = { x: unitX, y: unitY };
    state.layoutOrigin = { x: originX, y: originY };
    state.layoutSegments = [];

    const primary = new Map();
    entries.forEach(([key, e]) => {
        const pid = e && e.p ? e.p.i : null;
        if (pid == null) return;
        if (String(key) === String(pid) && !primary.has(pid)) {
            primary.set(pid, e);
        }
    });
    entries.forEach(([, e]) => {
        const pid = e && e.p ? e.p.i : null;
        if (pid == null) return;
        if (!primary.has(pid)) primary.set(pid, e);
    });

    const visibleSet = new Set();
    primary.forEach((e, pid) => {
        const cx = originX + e.x * unitX;
        const cy = originY + e.y * unitY;
        state.positions[pid] = { x: cx - CARD_W / 2, y: cy - CARD_H / 2 };
        visibleSet.add(pid);
    });

    entries.forEach(([, e]) => {
        const pid = e && e.p ? e.p.i : null;
        if (pid == null) return;
        if (primary.get(pid) === e) return;

        const cx = originX + e.x * unitX;
        const cy = originY + e.y * unitY;
        state.instances.push({
            instanceId: generateInstanceId(),
            personId: pid,
            x: cx - CARD_W / 2,
            y: cy - CARD_H / 2,
            marriageContext: 'fe_dup'
        });
        visibleSet.add(pid);
    });

    if (Array.isArray(d.n)) {
        state.layoutSegments = d.n.map(seg => ({
            x1: originX + seg.x1 * unitX,
            y1: originY + seg.y1 * unitY,
            x2: originX + seg.x2 * unitX,
            y2: originY + seg.y2 * unitY,
            t: seg.t
        }));
    }
    state.visiblePersons = visibleSet.size ? visibleSet : null;
}

/**
 * Main layout function - computes tree layout
 */
function layoutTree() {
    clearInstances();
    if (!personsData.length) return;
    if (!window.FE_LAYOUT || !window.FE_LAYOUT.layout) return;

    const family = buildFamilyEchoData();
    const familyIds = Object.keys(family);
    if (!familyIds.length) return;

    let focusId = state.selectedPerson;
    if (!focusId || !family[focusId]) {
        const rootPerson = personsData.find(p => p.is_root && family[p.id]);
        focusId = rootPerson ? rootPerson.id : coercePersonId(familyIds[0]);
    }
    if (!focusId || !family[focusId]) return;

    const ch = FE_SHOW_CHILDREN;
    const ph = FE_SHOW_PARENTS;
    const oh = FE_SHOW_COUSINS;
    const hr = CARD_H / (CARD_H + FE_Y_GAP);

    window.FE_LAYOUT.reset();
    const d = window.FE_LAYOUT.layout("", family, focusId, null, ch, ph, oh, false, {}, 1, hr, 0);
    applyFamilyEchoLayout(d);
}

/**
 * Place marriage children in layout
 * @param {Object} marriage - Marriage object
 * @param {number} startX - Start X position
 * @param {number} y - Y position
 * @param {number} areaWidth - Available width
 * @param {Set} visited - Visited set
 */
function placeMarriageChildren(marriage, startX, y, areaWidth, visited) {
    const visible = state.visiblePersons;
    if (!marriage.children) return;

    let visibleChildren = marriage.children.filter(c => !visible || visible.has(c));
    if (visibleChildren.length === 0) return;

    visibleChildren = sortChildrenBySelectedPerson(visibleChildren);

    let childrenWidth = 0;
    const childData = [];
    visibleChildren.forEach(cId => {
        const w = calcChildSubtreeWidth(cId, new Set(visited));
        childData.push({ id: cId, width: w });
        childrenWidth += w + SIBLING_GAP;
    });
    childrenWidth = Math.max(childrenWidth - SIBLING_GAP, 0);

    let childX = startX + (areaWidth - childrenWidth) / 2;
    childData.forEach(gc => {
        placeChildWithFamily(gc.id, childX, y, new Set(visited));
        childX += gc.width + SIBLING_GAP;
    });
}

/**
 * Place child with their family in layout
 * @param {string} childId - Child person ID
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Set} visited - Visited set
 */
function placeChildWithFamily(childId, x, y, visited = new Set()) {
    const visible = state.visiblePersons;

    if (visited.has(childId)) return;
    visited.add(childId);

    if (visible && !visible.has(childId)) return;

    const subtreeWidth = calcChildSubtreeWidth(childId, new Set());
    const allMarriages = findAllPersonMarriages(childId);

    if (allMarriages.length === 0) {
        state.positions[childId] = { x: x + (subtreeWidth - CARD_W) / 2, y };
        return;
    }

    const visibleSpouses = [];
    allMarriages.forEach(m => {
        const spouseId = getSpouseInMarriage(childId, m);
        if (!visible || visible.has(spouseId)) {
            visibleSpouses.push({ spouseId, marriage: m });
        }
    });

    if (visibleSpouses.length === 0) {
        state.positions[childId] = { x: x + (subtreeWidth - CARD_W) / 2, y };
        return;
    }

    if (visibleSpouses.length === 1) {
        const marriage = visibleSpouses[0].marriage;
        const spouseId = visibleSpouses[0].spouseId;
        const spouseAlreadyPlaced = state.positions[spouseId] !== undefined;

        const childParents = findParents(childId);
        const spouseParents = findParents(spouseId);

        const childHasParents = childParents && childParents.father && childParents.mother;
        const spouseHasParents = spouseParents && spouseParents.father && spouseParents.mother;

        const coupleWidth = CARD_W * 2 + SPOUSE_GAP;

        if (childHasParents && spouseHasParents) {
            const coupleStartX = x + (subtreeWidth - coupleWidth) / 2;
            const wifeX = coupleStartX;
            const husbandX = coupleStartX + CARD_W + SPOUSE_GAP;

            if (marriage.husband === childId || marriage.husband === spouseId) {
                const hid = marriage.husband;
                const wid = marriage.wife;
                state.positions[wid] = { x: wifeX, y };
                if (spouseAlreadyPlaced && spouseId === hid) {
                    state.instances.push({
                        instanceId: generateInstanceId(),
                        personId: hid,
                        x: husbandX,
                        y,
                        marriageContext: `layout_dup_${childId}_${spouseId}`
                    });
                } else {
                    state.positions[hid] = { x: husbandX, y };
                }
            } else {
                state.positions[childId] = { x: wifeX, y };
                if (spouseAlreadyPlaced) {
                    state.instances.push({
                        instanceId: generateInstanceId(),
                        personId: spouseId,
                        x: husbandX,
                        y,
                        marriageContext: `layout_dup_${childId}_${spouseId}`
                    });
                } else {
                    state.positions[spouseId] = { x: husbandX, y };
                }
            }

            const parentY = y - ROW_H;

            state.positions[marriage.husband === childId ? childParents.father : spouseParents.father] = { x: husbandX - CARD_W - SPOUSE_GAP, y: parentY };
            state.positions[marriage.husband === childId ? childParents.mother : spouseParents.mother] = { x: husbandX + CARD_W + SPOUSE_GAP, y: parentY };

            state.positions[marriage.wife === childId ? childParents.father : spouseParents.father] = { x: wifeX - CARD_W - SPOUSE_GAP, y: parentY };
            state.positions[marriage.wife === childId ? childParents.mother : spouseParents.mother] = { x: wifeX + CARD_W + SPOUSE_GAP, y: parentY };

            placeMarriageChildren(marriage, coupleStartX, y + ROW_H, coupleWidth, visited);
            return;
        }

        const coupleStartX = x + (subtreeWidth - coupleWidth) / 2;
        const husbandId = marriage.husband;
        const wifeId = marriage.wife;
        state.positions[wifeId] = { x: coupleStartX, y };
        if (spouseAlreadyPlaced && spouseId === husbandId) {
            state.instances.push({
                instanceId: generateInstanceId(),
                personId: husbandId,
                x: coupleStartX + CARD_W + SPOUSE_GAP,
                y,
                marriageContext: `layout_dup_${childId}_${spouseId}`
            });
        } else {
            state.positions[husbandId] = { x: coupleStartX + CARD_W + SPOUSE_GAP, y };
        }

        placeMarriageChildren(marriage, x, y + ROW_H, subtreeWidth, visited);
        return;
    }

    // TWO MARRIAGES
    const marriage1 = visibleSpouses[0].marriage;
    const marriage2 = visibleSpouses[1].marriage;
    const spouse1Id = visibleSpouses[0].spouseId;
    const spouse2Id = visibleSpouses[1].spouseId;

    const children1Width = calcMarriageChildrenWidth(marriage1, new Set(visited));
    const children2Width = calcMarriageChildrenWidth(marriage2, new Set(visited));

    const minCoupleWidth = CARD_W * 2 + SPOUSE_GAP;
    const leftChildArea = Math.max(minCoupleWidth, children1Width);
    const rightChildArea = Math.max(minCoupleWidth, children2Width);

    const centerX = x + subtreeWidth / 2;
    const dividerX = centerX;

    const leftAreaStart = dividerX - SIBLING_GAP / 2 - leftChildArea;
    const rightAreaStart = dividerX + SIBLING_GAP / 2;

    const personX = centerX - CARD_W / 2;
    const spouse1X = personX - SPOUSE_GAP - CARD_W;
    const spouse2X = personX + CARD_W + SPOUSE_GAP;

    state.positions[spouse1Id] = { x: spouse1X, y };
    state.positions[childId] = { x: personX, y };
    state.positions[spouse2Id] = { x: spouse2X, y };

    placeMarriageChildren(marriage1, leftAreaStart, y + ROW_H, leftChildArea, visited);
    placeMarriageChildren(marriage2, rightAreaStart, y + ROW_H, rightChildArea, visited);
}

    let viewportEl = null;
    let canvasContentEl = null;
    let workspaceEl = null;
    let svgEl = null;
    let zoomSliderEl = null;
    let zoomValueEl = null;
    let personListEl = null;
    let personCountEl = null;
    let lineColor = '#3a3a3a';

    const MODALS = {
        parents: 'addParentsModal',
        spouse: 'addSpouseModal',
        child: 'addChildModal',
        spouseChoice: 'spouseChoiceModal',
        selectPerson: 'selectPersonModal',
        confirmDelete: 'confirmDeleteModal',
        confirmExport: 'confirmExportModal',
        confirmImport: 'confirmImportModal',
        shareModal: 'shareModal'
    };

    const modalState = {
        mode: null,
        sourcePersonId: null
    };

    let currentEditPersonId = null;
    let personToDelete = null;
    let currentMarriageForChildId = null;
    let pendingImportFile = null;

    const TOAST_ICONS = {
        success: 'check',
        error: 'x-circle',
        warning: 'alert-triangle',
        info: 'info'
    };

    const TOAST_DURATION = 4000;

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
            <span class="toast-icon">
                <i data-lucide="${TOAST_ICONS[type] || 'info'}"></i>
            </span>
            <span class="toast-message">${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        setTimeout(() => hideToast(toast), TOAST_DURATION);
    }

    function hideToast(toast) {
        if (!toast || toast.classList.contains('toast--hiding')) return;
        toast.classList.add('toast--hiding');
        setTimeout(() => toast.remove(), 200);
    }

    window.showToast = showToast;

    function showSaveIndicator(message = '') {
        if (message) {
            showToast(message, 'success');
        } else {
            showToast('Сохранено', 'success');
        }
    }

    function downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function formatDateParts(day, month, year) {
        if (!day && !month && !year) return '';
        const dd = day ? String(day).padStart(2, '0') : '??';
        const mm = month ? String(month).padStart(2, '0') : '??';
        const yy = year ? String(year) : '????';
        return `${dd}.${mm}.${yy}`;
    }

    function getDaysInMonth(month, year) {
        if (!month) return 31;
        const m = Number(month);
        if ([1, 3, 5, 7, 8, 10, 12].includes(m)) return 31;
        if ([4, 6, 9, 11].includes(m)) return 30;
        if (m === 2) {
            if (!year) return 29;
            const y = Number(year);
            return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28;
        }
        return 31;
    }

    function initDOMElements() {
        viewportEl = document.querySelector('.canvas');
        canvasContentEl = document.querySelector('.canvas-content');
        personListEl = document.querySelector('.person-list');
        personCountEl = document.querySelector('.section-badge');
        zoomSliderEl = document.querySelector('.zoom-toolbar-slider .slider');
        zoomValueEl = document.querySelector('.zoom-toolbar-value');

        if (!canvasContentEl) return;

        canvasContentEl.innerHTML = '';
        canvasContentEl.style.position = 'relative';
        canvasContentEl.style.display = 'block';
        canvasContentEl.style.width = '100%';
        canvasContentEl.style.height = '100%';
        canvasContentEl.style.overflow = 'hidden';

        workspaceEl = document.createElement('div');
        workspaceEl.id = 'workspace';
        workspaceEl.style.position = 'absolute';
        workspaceEl.style.left = '0';
        workspaceEl.style.top = '0';
        workspaceEl.style.width = '100%';
        workspaceEl.style.height = '100%';
        workspaceEl.style.transformOrigin = '0 0';

        svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.setAttribute('width', '20000');
        svgEl.setAttribute('height', '20000');
        svgEl.setAttribute('viewBox', '0 0 20000 20000');
        svgEl.style.position = 'absolute';
        svgEl.style.left = '0';
        svgEl.style.top = '0';
        svgEl.style.overflow = 'visible';
        svgEl.style.pointerEvents = 'none';

        const computed = getComputedStyle(document.documentElement).getPropertyValue('--line-color').trim();
        if (computed) lineColor = computed;

        workspaceEl.appendChild(svgEl);
        canvasContentEl.appendChild(workspaceEl);
    }

    function render(selectPersonFn) {
        if (!workspaceEl) return;

        workspaceEl.querySelectorAll('.tree-node').forEach(n => n.remove());
        if (!svgEl) return;

        const visible = state.visiblePersons;
        const renderedPositions = new Set();

        function createPersonCard(person, pos, isDuplicate = false) {
            const posKey = `${pos.x}_${pos.y}`;
            if (renderedPositions.has(posKey)) return;
            renderedPositions.add(posKey);

            const div = document.createElement('div');
            div.className = 'tree-node';
            if (state.selectedPerson && idsEqual(state.selectedPerson, person.id)) {
                div.classList.add('tree-node--selected');
            }
            if (isDuplicate) {
                div.style.opacity = '0.7';
            }

            div.style.left = `${pos.x}px`;
            div.style.top = `${pos.y}px`;
            div.style.width = `${CARD_W}px`;
            div.style.height = `${CARD_H}px`;
            div.dataset.personId = String(person.id);

            let avatarClass = 'tree-node-avatar--unknown';
            let avatarIcon = 'user';
            if (person.gender === 'male') {
                avatarClass = 'tree-node-avatar--male';
                avatarIcon = 'mars';
            } else if (person.gender === 'female') {
                avatarClass = 'tree-node-avatar--female';
                avatarIcon = 'venus';
            }

            const displayName = getPersonDisplayName(person);
            div.innerHTML = `
                <div class="tree-node-content">
                    <div class="tree-node-avatar ${avatarClass}">
                        <i data-lucide="${avatarIcon}"></i>
                    </div>
                    <span class="tree-node-name">${escapeHtml(displayName)}</span>
                </div>
            `;

            div.addEventListener('click', (e) => {
                e.stopPropagation();
                selectPersonFn(person.id);
            });

            workspaceEl.appendChild(div);
        }

        personsData.forEach(person => {
            if (visible && !visible.has(person.id)) return;
            const pos = state.positions[person.id];
            if (!pos) return;
            createPersonCard(person, pos, false);
        });

        state.instances.forEach(inst => {
            if (!inst.marriageContext) return;
            const person = getPersonById(inst.personId);
            if (!person) return;
            if (visible && !visible.has(person.id)) return;
            createPersonCard(person, { x: inst.x, y: inst.y }, true);
        });

        renderConnections();
        renderHiddenIndicators();

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    }

    function drawLine(x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', lineColor);
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        svgEl.appendChild(line);
    }

    function drawDashedLine(x1, y1, x2, y2) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('stroke', lineColor);
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-linecap', 'round');
        line.setAttribute('stroke-dasharray', '1 3');
        line.setAttribute('vector-effect', 'non-scaling-stroke');
        svgEl.appendChild(line);
    }

    function drawDot(x, y) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 3.5);
        circle.setAttribute('fill', lineColor);
        circle.setAttribute('vector-effect', 'non-scaling-stroke');
        svgEl.appendChild(circle);
    }

    function renderConnections() {
        if (!svgEl) return;
        svgEl.innerHTML = '';

        if (state.layoutSegments !== null) {
            state.layoutSegments.forEach(seg => {
                if (!seg) return;
                const lineType = (seg.t || '').toString();
                const isDashed = lineType && lineType === lineType.toLowerCase();
                if (isDashed) {
                    drawDashedLine(seg.x1, seg.y1, seg.x2, seg.y2);
                } else {
                    drawLine(seg.x1, seg.y1, seg.x2, seg.y2);
                }
            });
            return;
        }

        const visible = state.visiblePersons;

        marriages.forEach(m => {
            if (visible && (!visible.has(m.husband) || !visible.has(m.wife))) return;

            const husbandPos = state.positions[m.husband];
            const wifePos = state.positions[m.wife];
            if (!husbandPos || !wifePos) return;

            const hx = husbandPos.x + CARD_W / 2;
            const hy = husbandPos.y + CARD_H / 2;
            const wx = wifePos.x + CARD_W / 2;

            drawLine(hx, hy, wx, hy);
            const dotX = (hx + wx) / 2;
            drawDot(dotX, hy);

            if (m.children && m.children.length > 0) {
                const visibleChildren = m.children.filter(c => (!visible || visible.has(c)) && state.positions[c]);
                if (visibleChildren.length === 0) return;

                const childY = state.positions[visibleChildren[0]].y;
                const midY = hy + (childY - hy) / 2;

                drawLine(dotX, hy, dotX, midY);

                const childrenX = visibleChildren.map(c => state.positions[c].x + CARD_W / 2);
                const minX = Math.min(...childrenX);
                const maxX = Math.max(...childrenX);

                if (minX !== maxX) {
                    drawLine(minX, midY, maxX, midY);
                }

                if (dotX < minX) {
                    drawLine(dotX, midY, minX, midY);
                } else if (dotX > maxX) {
                    drawLine(dotX, midY, maxX, midY);
                }

                visibleChildren.forEach(childId => {
                    const cx = state.positions[childId].x + CARD_W / 2;
                    const cy = state.positions[childId].y;
                    drawLine(cx, midY, cx, cy);
                });
            }
        });
    }

    function renderHiddenIndicators() {
        if (state.layoutSegments !== null) return;
        const visible = state.visiblePersons;
        if (!visible) return;

        personsData.forEach(person => {
            if (!visible.has(person.id)) return;
            const pos = state.positions[person.id];
            if (!pos) return;

            const cx = pos.x + CARD_W / 2;
            const topY = pos.y;
            const bottomY = pos.y + CARD_H;
            const leftX = pos.x;
            const rightX = pos.x + CARD_W;
            const cy = pos.y + CARD_H / 2;

            const parents = findParents(person.id);
            const hasHiddenParents = parents && (!visible.has(parents.father) || !visible.has(parents.mother));
            if (hasHiddenParents) {
                drawDashedLine(cx, topY, cx, topY - 30);
            }

            const siblings = findSiblings(person.id);
            const hiddenSiblings = siblings.filter(s => !visible.has(s));
            if (hiddenSiblings.length > 0) {
                const branchY = topY - 15;

                const siblingsPos = siblings
                    .filter(s => visible.has(s) && state.positions[s])
                    .map(s => state.positions[s].x);

                const myX = pos.x;
                const hasLeftSiblings = siblingsPos.some(x => x < myX);
                const hasRightSiblings = siblingsPos.some(x => x > myX);

                if (!hasHiddenParents) {
                    drawDashedLine(cx, topY, cx, branchY);
                }

                if (hasLeftSiblings && !hasRightSiblings) {
                    drawDashedLine(cx, branchY, cx + 35, branchY);
                } else if (hasRightSiblings && !hasLeftSiblings) {
                    drawDashedLine(cx, branchY, cx - 35, branchY);
                } else {
                    drawDashedLine(cx, branchY, cx - 35, branchY);
                }
            }

            const spouses = findSpouses(person.id);
            const hiddenSpouses = spouses.filter(s => !visible.has(s));

            if (hiddenSpouses.length > 0) {
                drawDashedLine(rightX, cy, rightX + 20, cy);
            }

            const allMarriagesForChildren = findAllPersonMarriages(person.id);

            allMarriagesForChildren.forEach(marriage => {
                const marriageChildren = marriage.children || [];
                const hiddenMarriageChildren = marriageChildren.filter(c => !visible.has(c));
                const visibleMarriageChildren = marriageChildren.filter(c => visible.has(c));

                if (hiddenMarriageChildren.length > 0 && visibleMarriageChildren.length === 0) {
                    drawDashedLine(cx, bottomY - 5, cx, bottomY + 25);
                }
            });
        });
    }

    function stopPanAnimation() {
        if (!panAnimation) return;
        cancelAnimationFrame(panAnimation.rafId);
        setPanAnimation(null);
    }

    function animateViewportTo(targetPanX, targetPanY, targetZoom, duration = 280) {
        stopPanAnimation();
        const startPanX = state.panX;
        const startPanY = state.panY;
        const startZoom = state.zoom;
        const start = performance.now();

        const animState = { rafId: 0 };
        setPanAnimation(animState);

        function step(now) {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            state.panX = startPanX + (targetPanX - startPanX) * eased;
            state.panY = startPanY + (targetPanY - startPanY) * eased;
            state.zoom = startZoom + (targetZoom - startZoom) * eased;
            updateTransform();
            updateZoomDisplay();

            if (t < 1) {
                animState.rafId = requestAnimationFrame(step);
            } else {
                setPanAnimation(null);
            }
        }

        animState.rafId = requestAnimationFrame(step);
    }

    function centerOnPerson(personId, keepZoom = true) {
        if (!viewportEl) return;
        const pos = state.positions[personId];
        if (!pos) return;

        const viewportRect = viewportEl.getBoundingClientRect();
        const viewportCenterX = viewportRect.width / 2;
        const viewportCenterY = viewportRect.height / 2;
        let targetZoom = state.zoom;

        if (!keepZoom) {
            const positions = Object.values(state.positions);
            let minX = Infinity, minY = Infinity;
            let maxX = -Infinity, maxY = -Infinity;

            positions.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x + CARD_W);
                maxY = Math.max(maxY, p.y + CARD_H);
            });

            const treeW = maxX - minX;
            const treeH = maxY - minY;
            const padding = 80;
            const viewW = Math.max(200, viewportRect.width - padding * 2);
            const viewH = Math.max(200, viewportRect.height - padding * 2);

            targetZoom = Math.min(viewW / treeW, viewH / treeH, 1);
            targetZoom = Math.max(targetZoom, 0.4);
        }

        const personCenterX = pos.x + CARD_W / 2;
        const personCenterY = pos.y + CARD_H / 2;

        const targetPanX = viewportCenterX - personCenterX * targetZoom;
        const targetPanY = viewportCenterY - personCenterY * targetZoom;

        animateViewportTo(targetPanX, targetPanY, targetZoom);
    }

    function updateTransform() {
        if (workspaceEl) {
            workspaceEl.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.zoom})`;
        }
    }

    function updateZoomDisplay() {
        if (zoomValueEl) {
            const percentage = Math.round(state.zoom * 100);
            zoomValueEl.textContent = `${percentage}%`;
        }
        if (zoomSliderEl) {
            zoomSliderEl.value = Math.round(state.zoom * 100);
        }
    }

    function zoomToPoint(newZoom, pointX, pointY) {
        if (!viewportEl) return;

        const zoomRatio = newZoom / state.zoom;
        state.panX = pointX - (pointX - state.panX) * zoomRatio;
        state.panY = pointY - (pointY - state.panY) * zoomRatio;
        state.zoom = newZoom;

        updateTransform();
        updateZoomDisplay();
    }

    function getZoomFocusPoint() {
        if (!viewportEl) return { x: 0, y: 0 };

        const rect = viewportEl.getBoundingClientRect();

        // Если есть выбранный человек — зумим к нему
        if (state.selectedPerson && state.positions[state.selectedPerson]) {
            const pos = state.positions[state.selectedPerson];
            const personCenterX = pos.x + CARD_W / 2;
            const personCenterY = pos.y + CARD_H / 2;

            // Позиция человека в координатах viewport
            const screenX = state.panX + personCenterX * state.zoom;
            const screenY = state.panY + personCenterY * state.zoom;

            return { x: screenX, y: screenY };
        }

        // Иначе — центр viewport
        return { x: rect.width / 2, y: rect.height / 2 };
    }

    function zoomIn() {
        stopPanAnimation();
        const newZoom = Math.min(2.5, state.zoom * 1.15);
        const focus = getZoomFocusPoint();
        zoomToPoint(newZoom, focus.x, focus.y);
    }

    function zoomOut() {
        stopPanAnimation();
        const newZoom = Math.max(0.15, state.zoom / 1.15);
        const focus = getZoomFocusPoint();
        zoomToPoint(newZoom, focus.x, focus.y);
    }

    function initViewportEvents() {
        if (!viewportEl) return;

        // === Mouse Pan ===
        viewportEl.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            if (e.target.closest('.tree-node')) return;
            stopPanAnimation();
            state.isPanning = true;
            state.startX = e.clientX;
            state.startY = e.clientY;
            state.startPanX = state.panX;
            state.startPanY = state.panY;
        });

        document.addEventListener('mousemove', (e) => {
            if (!state.isPanning) return;
            state.panX = state.startPanX + (e.clientX - state.startX);
            state.panY = state.startPanY + (e.clientY - state.startY);
            updateTransform();
        });

        document.addEventListener('mouseup', () => {
            state.isPanning = false;
        });

        // === Mouse Wheel Zoom (плавное, к точке курсора) ===
        viewportEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            stopPanAnimation();

            // Плавный zoom с учётом скорости прокрутки
            const zoomIntensity = 0.002;
            const delta = -e.deltaY * zoomIntensity;
            const newZoom = Math.max(0.15, Math.min(2.5, state.zoom * (1 + delta)));

            // Точка курсора относительно viewport
            const rect = viewportEl.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Zoom к точке курсора (не к центру)
            const zoomRatio = newZoom / state.zoom;
            state.panX = mouseX - (mouseX - state.panX) * zoomRatio;
            state.panY = mouseY - (mouseY - state.panY) * zoomRatio;
            state.zoom = newZoom;

            updateTransform();
            updateZoomDisplay();
        }, { passive: false });

        // === Touch Events (pinch zoom + pan) ===
        let touchState = {
            isPanning: false,
            isPinching: false,
            startX: 0,
            startY: 0,
            startPanX: 0,
            startPanY: 0,
            startDist: 0,
            startZoom: 1,
            centerX: 0,
            centerY: 0
        };

        function getTouchDistance(touches) {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }

        function getTouchCenter(touches) {
            return {
                x: (touches[0].clientX + touches[1].clientX) / 2,
                y: (touches[0].clientY + touches[1].clientY) / 2
            };
        }

        viewportEl.addEventListener('touchstart', (e) => {
            // Не блокируем клики по узлам дерева
            if (e.target.closest('.tree-node')) return;

            e.preventDefault();
            stopPanAnimation();

            if (e.touches.length === 1) {
                // Single finger - pan
                touchState.isPanning = true;
                touchState.isPinching = false;
                touchState.startX = e.touches[0].clientX;
                touchState.startY = e.touches[0].clientY;
                touchState.startPanX = state.panX;
                touchState.startPanY = state.panY;
            } else if (e.touches.length === 2) {
                // Two fingers - pinch zoom
                touchState.isPanning = false;
                touchState.isPinching = true;
                touchState.startDist = getTouchDistance(e.touches);
                touchState.startZoom = state.zoom;

                const rect = viewportEl.getBoundingClientRect();
                const center = getTouchCenter(e.touches);
                touchState.centerX = center.x - rect.left;
                touchState.centerY = center.y - rect.top;
                touchState.startPanX = state.panX;
                touchState.startPanY = state.panY;
            }
        }, { passive: false });

        viewportEl.addEventListener('touchmove', (e) => {
            if (touchState.isPanning && e.touches.length === 1) {
                // Single finger pan
                e.preventDefault();
                const dx = e.touches[0].clientX - touchState.startX;
                const dy = e.touches[0].clientY - touchState.startY;
                state.panX = touchState.startPanX + dx;
                state.panY = touchState.startPanY + dy;
                updateTransform();
            } else if (touchState.isPinching && e.touches.length === 2) {
                // Pinch zoom
                e.preventDefault();
                const currentDist = getTouchDistance(e.touches);
                const scale = currentDist / touchState.startDist;
                const newZoom = Math.max(0.15, Math.min(2.5, touchState.startZoom * scale));

                // Zoom к центру pinch
                const zoomRatio = newZoom / touchState.startZoom;
                state.panX = touchState.centerX - (touchState.centerX - touchState.startPanX) * zoomRatio;
                state.panY = touchState.centerY - (touchState.centerY - touchState.startPanY) * zoomRatio;
                state.zoom = newZoom;

                updateTransform();
                updateZoomDisplay();
            }
        }, { passive: false });

        viewportEl.addEventListener('touchend', (e) => {
            if (e.touches.length === 0) {
                touchState.isPanning = false;
                touchState.isPinching = false;
            } else if (e.touches.length === 1) {
                // Switch from pinch to pan
                touchState.isPinching = false;
                touchState.isPanning = true;
                touchState.startX = e.touches[0].clientX;
                touchState.startY = e.touches[0].clientY;
                touchState.startPanX = state.panX;
                touchState.startPanY = state.panY;
            }
        });

        viewportEl.addEventListener('touchcancel', () => {
            touchState.isPanning = false;
            touchState.isPinching = false;
        });
    }
    function initSectionToggles() {
        const sectionHeaders = document.querySelectorAll('.section-header[data-collapsed]');

        sectionHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const isCollapsed = header.getAttribute('data-collapsed') === 'true';
                const content = header.nextElementSibling;

                if (content && content.classList.contains('section-content')) {
                    header.setAttribute('data-collapsed', !isCollapsed);
                    content.style.display = isCollapsed ? 'block' : 'none';
                }
            });
        });
    }

    function initZoomControls() {
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');

        if (zoomSliderEl) {
            zoomSliderEl.addEventListener('input', (e) => {
                stopPanAnimation();
                const value = parseInt(e.target.value, 10);
                const newZoom = Math.max(0.1, Math.min(2.5, value / 100));
                const focus = getZoomFocusPoint();
                zoomToPoint(newZoom, focus.x, focus.y);
            });
        }

        zoomInBtn?.addEventListener('click', zoomIn);
        zoomOutBtn?.addEventListener('click', zoomOut);
    }

    const MONTHS = [
        { value: 1, name: 'Январь' },
        { value: 2, name: 'Февраль' },
        { value: 3, name: 'Март' },
        { value: 4, name: 'Апрель' },
        { value: 5, name: 'Май' },
        { value: 6, name: 'Июнь' },
        { value: 7, name: 'Июль' },
        { value: 8, name: 'Август' },
        { value: 9, name: 'Сентябрь' },
        { value: 10, name: 'Октябрь' },
        { value: 11, name: 'Ноябрь' },
        { value: 12, name: 'Декабрь' }
    ];

    const MIN_YEAR = 1900;
    const MAX_YEAR = new Date().getFullYear();

    function initDatePickers() {
        document.querySelectorAll('.date-picker').forEach(picker => {
            initDatePicker(picker);
        });
    }

    function initDatePicker(picker) {
        const daySelect = picker.querySelector('.date-day');
        const monthSelect = picker.querySelector('.date-month');
        const yearSelect = picker.querySelector('.date-year');

        if (!daySelect || !monthSelect || !yearSelect) return;

        populateYears(yearSelect);
        populateMonths(monthSelect);
        updateDays(picker);

        const initialDay = daySelect.dataset.initial;
        const initialMonth = monthSelect.dataset.initial;
        const initialYear = yearSelect.dataset.initial;

        if (initialYear) yearSelect.value = initialYear;
        if (initialMonth) monthSelect.value = initialMonth;

        updateDays(picker);
        if (initialDay) daySelect.value = initialDay;

        monthSelect.addEventListener('change', () => {
            updateDays(picker);
            updateAgeDisplay(picker);
        });
        yearSelect.addEventListener('change', () => {
            updateDays(picker);
            updateAgeDisplay(picker);
        });
    }

    function populateYears(select) {
        select.innerHTML = '<option value="">Год</option>';
        for (let year = MAX_YEAR; year >= MIN_YEAR; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    }

    function populateMonths(select) {
        select.innerHTML = '<option value="">Месяц</option>';
        MONTHS.forEach(month => {
            const option = document.createElement('option');
            option.value = month.value;
            option.textContent = month.name;
            select.appendChild(option);
        });
    }

    function updateDays(picker) {
        const daySelect = picker.querySelector('.date-day');
        const monthSelect = picker.querySelector('.date-month');
        const yearSelect = picker.querySelector('.date-year');

        const currentDay = daySelect.value;
        const month = monthSelect.value;
        const year = yearSelect.value;
        const daysInMonth = getDaysInMonth(month, year);

        daySelect.innerHTML = '<option value="">День</option>';
        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day;
            option.textContent = day;
            daySelect.appendChild(option);
        }

        if (currentDay && parseInt(currentDay) <= daysInMonth) {
            daySelect.value = currentDay;
        }
    }

    function calculateAge(birthYear) {
        if (!birthYear) return null;
        const currentYear = new Date().getFullYear();
        return currentYear - parseInt(birthYear, 10);
    }

    function formatAge(age) {
        if (age === null || age < 0) return '';

        const lastDigit = age % 10;
        const lastTwoDigits = age % 100;

        let word;
        if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
            word = 'лет';
        } else if (lastDigit === 1) {
            word = 'год';
        } else if (lastDigit >= 2 && lastDigit <= 4) {
            word = 'года';
        } else {
            word = 'лет';
        }

        return `${age} ${word}`;
    }

    function updateAgeDisplay(picker) {
        if (!picker || picker.dataset.dateGroup !== 'birth') return;
        const yearSelect = picker.querySelector('.date-year');
        const ageElement = picker.parentElement.querySelector('.info-age');

        if (!yearSelect || !ageElement) return;

        const birthYear = yearSelect.value;
        const age = calculateAge(birthYear);

        if (age !== null && age >= 0) {
            ageElement.textContent = formatAge(age);
            ageElement.style.display = 'inline-block';
        } else {
            ageElement.style.display = 'none';
        }
    }

    function initAgeCalculation() {
        document.querySelectorAll('.date-picker[data-date-group="birth"]').forEach(picker => {
            const yearSelect = picker.querySelector('.date-year');
            if (yearSelect) {
                yearSelect.addEventListener('change', () => updateAgeDisplay(picker));
                updateAgeDisplay(picker);
            }
        });
    }

    function initDragAndDrop() {
        const containers = document.querySelectorAll('.family-children');

        containers.forEach(container => {
            const items = container.querySelectorAll('.relation-item[draggable="true"]');

            items.forEach(item => {
                item.addEventListener('dragstart', handleDragStart);
                item.addEventListener('dragend', handleDragEnd);
                item.addEventListener('dragover', handleDragOver);
                item.addEventListener('drop', handleDrop);
                item.addEventListener('dragleave', handleDragLeave);
            });
        });
    }

    let draggedItem = null;

    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    }

    function handleDragEnd() {
        this.classList.remove('dragging');
        document.querySelectorAll('.drag-over').forEach(el => {
            el.classList.remove('drag-over');
        });
        draggedItem = null;
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (this !== draggedItem && this.hasAttribute('draggable')) {
            this.classList.add('drag-over');
        }
    }

    function handleDragLeave() {
        this.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();

        if (this !== draggedItem && this.hasAttribute('draggable')) {
            const container = this.parentNode;
            const allItems = [...container.querySelectorAll('.relation-item[draggable="true"]')];
            const draggedIndex = allItems.indexOf(draggedItem);
            const targetIndex = allItems.indexOf(this);

            if (draggedIndex < targetIndex) {
                this.after(draggedItem);
            } else {
                this.before(draggedItem);
            }

            saveChildrenOrder(container);
        }

        this.classList.remove('drag-over');
    }

    function openModal(type) {
        const modalId = MODALS[type] || type;
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const form = modal.querySelector('.modal-form');
        form?.reset();

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        modal.querySelectorAll('.date-picker').forEach(picker => {
            initDatePicker(picker);
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function closeModal(type) {
        const modalId = MODALS[type] || type;
        const modal = document.getElementById(modalId);
        if (!modal) return;
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function closeAllModals() {
        Object.values(MODALS).forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    function initModal() {
        Object.values(MODALS).forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (!modal) return;

            const closeBtn = modal.querySelector('.modal-close');
            const cancelBtn = modal.querySelector('.modal-btn--secondary');

            closeBtn?.addEventListener('click', () => closeModal(modalId));
            cancelBtn?.addEventListener('click', () => closeModal(modalId));
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeAllModals();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                closeModal(e.target.id);
            }
        });

        document.querySelectorAll('.choice-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                closeModal('spouseChoiceModal');

                if (action === 'new') {
                    openModal('spouse');
                } else if (action === 'existing') {
                    openSelectPersonModal('spouse');
                }
            });
        });

        document.getElementById('confirmDeleteModal')
            ?.querySelector('.modal-btn--danger')
            ?.addEventListener('click', async () => {
                await confirmDeletePerson();
            });

        document.getElementById('confirmExportModal')
            ?.querySelector('.modal-btn--primary')
            ?.addEventListener('click', () => {
                exportGEDCOM();
                closeModal('confirmExportModal');
            });

        document.getElementById('confirmImportModal')
            ?.querySelector('.modal-btn--primary')
            ?.addEventListener('click', async () => {
                await confirmImportGEDCOM();
            });

        document.getElementById('addParentsModal')
            ?.querySelector('form')
            ?.addEventListener('submit', handleAddParentsSubmit);

        document.getElementById('addSpouseModal')
            ?.querySelector('form')
            ?.addEventListener('submit', handleAddSpouseSubmit);

        document.getElementById('addChildModal')
            ?.querySelector('form')
            ?.addEventListener('submit', handleAddChildSubmit);

        const selectModal = document.getElementById('selectPersonModal');
        if (selectModal) {
            selectModal.addEventListener('click', (e) => {
                const item = e.target.closest('.modal-person-item');
                if (!item) return;
                const personId = coercePersonId(item.dataset.personId);
                handleSelectPerson(personId);
            });

            const searchInput = selectModal.querySelector('.modal-search .search-input');
            searchInput?.addEventListener('input', () => {
                renderSelectPersonList();
            });
        }

        document.getElementById('exportBtn')?.addEventListener('click', () => openModal('confirmExport'));
        document.getElementById('importBtn')?.addEventListener('click', () => importGEDCOM());
        document.getElementById('shareBtn')?.addEventListener('click', () => openShareModal());

        // Share modal handlers
        const shareModal = document.getElementById('shareModal');
        if (shareModal) {
            shareModal.querySelectorAll('.share-copy-btn').forEach(btn => {
                btn.addEventListener('click', () => copyShareLink(btn.dataset.link));
            });
            shareModal.querySelectorAll('.share-reset-btn').forEach(btn => {
                btn.addEventListener('click', () => resetShareLink(btn.dataset.type));
            });
        }
    }

    function initFormValidation() {
        // Валидация только при submit, не на blur/input
        // Очистка ошибок при вводе (для UX)
        document.querySelectorAll('.form-input, .info-input').forEach(input => {
            input.addEventListener('input', () => {
                if (input.classList.contains('form-input--error') || input.classList.contains('info-input--error')) {
                    clearFieldError(input);
                }
            });
        });
    }

    function showFieldError(input, message) {
        input.classList.add('form-input--error', 'info-input--error');

        const existingError = input.parentElement.querySelector('.form-error, .info-error');
        if (existingError) {
            existingError.remove();
        }

        const errorEl = document.createElement('span');
        errorEl.className = input.classList.contains('info-input') ? 'info-error' : 'form-error';
        errorEl.textContent = message;
        input.parentElement.appendChild(errorEl);
    }

    function clearFieldError(input) {
        input.classList.remove('form-input--error', 'info-input--error');

        const errorEl = input.parentElement.querySelector('.form-error, .info-error');
        if (errorEl) {
            errorEl.remove();
        }
    }

    function validateRequired(input) {
        const value = input.value.trim();

        if (!value) {
            showFieldError(input, 'Обязательное поле');
            return false;
        }

        clearFieldError(input);
        return true;
    }

    function validateForm(form) {
        let isValid = true;

        // Очистить предыдущие ошибки
        form.querySelectorAll('.form-input--error, .info-input--error').forEach(el => {
            clearFieldError(el);
        });

        // Найти все поля с меткой required (span.required в label)
        const requiredFields = form.querySelectorAll('.form-field:has(.required), .info-field:has(.required)');

        requiredFields.forEach(field => {
            const input = field.querySelector('input, select, textarea');
            if (input && !validateRequired(input)) {
                isValid = false;
            }
        });

        return isValid;
    }

    function clearFormErrors(form) {
        if (!form) return;
        form.querySelectorAll('.form-input--error, .info-input--error').forEach(el => {
            clearFieldError(el);
        });
    }
    function initSidebar() {
        const searchInput = document.querySelector('.sidebar .search-input');
        searchInput?.addEventListener('input', (e) => {
            const value = e.target.value.trim().toLowerCase();
            searchQuery = value;
            renderSidebarList();
        });

        personListEl?.addEventListener('click', (e) => {
            const item = e.target.closest('.person-item');
            if (!item) return;
            const personId = coercePersonId(item.dataset.personId);
            selectPerson(personId, { center: true, keepZoom: true });
        });

        const logoutBtn = document.querySelector('.sidebar-profile-logout');
        logoutBtn?.addEventListener('click', async () => {
            try {
                await API.logout();
            } catch (error) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
            }
            window.location.href = 'login.html';
        });
    }

    let searchQuery = '';

    function renderSidebarList() {
        if (!personListEl) return;

        if (personsData.length === 0) {
            personListEl.innerHTML = '';
            if (personCountEl) personCountEl.textContent = '0';
            return;
        }

        const filtered = personsData.filter(person => {
            if (!searchQuery) return true;
            const searchText = [
                person.given_name,
                person.patronymic,
                person.surname,
                person.surname_at_birth,
                person.birth_place,
                person.occupation,
                person.residence,
                person.nationality,
                person.biography
            ].filter(Boolean).join(' ').toLowerCase();

            return searchText.includes(searchQuery) || getPersonDisplayName(person).toLowerCase().includes(searchQuery);
        });

        const sorted = filtered.slice().sort((a, b) => {
            return getPersonDisplayName(a).localeCompare(getPersonDisplayName(b));
        });

        personListEl.innerHTML = sorted.map(person => {
            const isSelected = state.selectedPerson && idsEqual(state.selectedPerson, person.id);
            const genderClass = person.gender === 'male'
                ? 'person-avatar--male'
                : person.gender === 'female'
                    ? 'person-avatar--female'
                    : '';
            const icon = person.gender === 'male'
                ? 'mars'
                : person.gender === 'female'
                    ? 'venus'
                    : 'user';
            const birthYear = person.birth ? String(person.birth) : '';

            return `
                <li class="person-item ${isSelected ? 'person-item--selected' : ''}" data-person-id="${String(person.id)}">
                    <div class="person-avatar ${genderClass}">
                        <i data-lucide="${icon}"></i>
                    </div>
                    <div class="person-info">
                        <span class="person-name">${escapeHtml(getPersonDisplayName(person))}</span>
                        <span class="person-meta">${escapeHtml(birthYear)}</span>
                    </div>
                </li>
            `;
        }).join('');

        if (personCountEl) {
            personCountEl.textContent = String(filtered.length);
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    }

    function getPanelElements() {
        const infoSection = document.querySelector('.panel .panel-section');
        const infoFields = infoSection ? infoSection.querySelectorAll('.info-field') : [];

        const additionalSection = Array.from(document.querySelectorAll('.panel .panel-section'))
            .find(section => section.querySelector('.section-header')?.textContent.includes('Дополн'));
        const additionalFields = additionalSection ? additionalSection.querySelectorAll('.info-field') : [];

        const relationsSection = Array.from(document.querySelectorAll('.panel .panel-section'))
            .find(section => section.querySelector('.section-header')?.textContent.includes('Связ'));

        const panelActions = document.querySelector('.panel-actions');

        return {
            info: {
                givenName: infoFields[0]?.querySelector('.info-input') || null,
                surname: infoFields[1]?.querySelector('.info-input') || null,
                patronymic: infoFields[2]?.querySelector('.info-input') || null,
                genderRadios: infoFields[3]?.querySelectorAll('input[name="gender"]') || [],
                birthPicker: infoFields[4]?.querySelector('.date-picker') || null,
                ageDisplay: infoFields[4]?.querySelector('.info-age') || null,
                accuracySelect: infoFields[5]?.querySelector('.info-select') || null
            },
            additional: {
                surnameAtBirth: additionalFields[0]?.querySelector('.info-input') || null,
                birthPlace: additionalFields[1]?.querySelector('.info-input') || null,
                residence: additionalFields[2]?.querySelector('.info-input') || null,
                nationality: additionalFields[3]?.querySelector('.info-input') || null,
                occupation: additionalFields[4]?.querySelector('.info-input') || null,
                biography: additionalFields[5]?.querySelector('.info-textarea') || null
            },
            relations: {
                section: relationsSection || null,
                parentsGroup: relationsSection?.querySelector('.relation-group') || null,
                familiesContainer: relationsSection?.querySelector('.families-container') || null,
                familiesBadge: relationsSection?.querySelector('.relation-label .relation-badge') || null,
                addSpouseBtn: relationsSection?.querySelector('.section-content > .add-btn') || null
            },
            actions: {
                saveBtn: panelActions?.querySelector('.action-btn--primary') || null,
                deleteBtn: document.querySelector('.danger-zone-btn') || null
            }
        };
    }

    function setPanelReadOnly(readOnly) {
        const panel = document.querySelector('.panel');
        if (!panel) return;

        panel.querySelectorAll('input, textarea, select, button').forEach(el => {
            if (el.closest('.panel-actions')) return;
            if (el.classList.contains('modal-btn')) return;
            if (el.classList.contains('section-icon-btn')) return;
            if (el.classList.contains('sidebar-profile-logout')) return;
            if (el.classList.contains('toolbar-btn')) return;
            if (el.classList.contains('add-btn')) {
                el.style.display = readOnly ? 'none' : '';
                return;
            }
            if (el.type === 'radio' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
                el.disabled = readOnly;
            }
        });

        const actions = getPanelElements().actions;
        const panelActions = document.querySelector('.panel-actions');
        const dangerZone = document.querySelector('.panel-danger-zone');

        if (panelActions) panelActions.style.display = readOnly ? 'none' : '';
        if (dangerZone) dangerZone.style.display = readOnly ? 'none' : '';
    }

    function setDatePickerValues(picker, day, month, year) {
        if (!picker) return;
        const daySelect = picker.querySelector('.date-day');
        const monthSelect = picker.querySelector('.date-month');
        const yearSelect = picker.querySelector('.date-year');

        if (yearSelect) yearSelect.value = year ? String(year) : '';
        if (monthSelect) monthSelect.value = month ? String(month) : '';
        updateDays(picker);
        if (daySelect) daySelect.value = day ? String(day) : '';
        updateAgeDisplay(picker);
    }

    function updatePanel(personId) {
        const panel = getPanelElements();
        const person = getPersonById(personId);
        currentEditPersonId = person ? person.id : null;
        const panelRoot = document.querySelector('.panel');
        const emptyState = panelRoot?.querySelector('.panel-empty');
        if (emptyState) emptyState.style.display = 'none';
        panelRoot?.querySelectorAll('.panel-content, .panel-section, .panel-actions').forEach(el => {
            el.style.display = '';
        });

        if (!person) {
            showEmptyPanel();
            return;
        }

        panel.info.givenName && (panel.info.givenName.value = person.given_name || '');
        panel.info.surname && (panel.info.surname.value = person.surname || '');
        panel.info.patronymic && (panel.info.patronymic.value = person.patronymic || '');

        if (panel.info.genderRadios.length) {
            panel.info.genderRadios.forEach(radio => {
                radio.checked = radio.value === person.gender;
            });
        }

        setDatePickerValues(panel.info.birthPicker, person.birth_day, person.birth_month, person.birth);
        if (panel.info.accuracySelect) {
            panel.info.accuracySelect.value = person.data_accuracy || 'unknown';
        }

        if (panel.additional.surnameAtBirth) panel.additional.surnameAtBirth.value = person.surname_at_birth || '';
        if (panel.additional.birthPlace) panel.additional.birthPlace.value = person.birth_place || '';
        if (panel.additional.residence) panel.additional.residence.value = person.residence || '';
        if (panel.additional.nationality) panel.additional.nationality.value = person.nationality || '';
        if (panel.additional.occupation) panel.additional.occupation.value = person.occupation || '';
        if (panel.additional.biography) panel.additional.biography.value = person.biography || '';

        renderRelations(person);
        setPanelReadOnly(!canEdit());
    }

    function showEmptyPanel() {
        currentEditPersonId = null;
        const panel = document.querySelector('.panel');
        if (!panel) return;

        let empty = panel.querySelector('.panel-empty');
        if (!empty) {
            empty = document.createElement('div');
            empty.className = 'panel-empty';
            empty.innerHTML = `
                <i data-lucide="user" class="panel-empty-icon"></i>
                <p class="panel-empty-text">Выберите человека из списка</p>
            `;
            panel.prepend(empty);
        }

        empty.style.display = 'flex';
        panel.querySelectorAll('.panel-content, .panel-section, .panel-actions').forEach(el => {
            el.style.display = 'none';
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

    }

    function renderRelations(person) {
        const panel = getPanelElements();
        if (!panel.relations.section) return;

        const parentsGroup = panel.relations.parentsGroup;
        if (parentsGroup) {
            const label = parentsGroup.querySelector('.relation-label');
            parentsGroup.innerHTML = '';
            if (label) parentsGroup.appendChild(label);

            const parents = findParents(person.id);
            if (parents) {
                const father = getPersonById(parents.father);
                const mother = getPersonById(parents.mother);
                if (father) parentsGroup.appendChild(buildRelationItem(father, false));
                if (mother) parentsGroup.appendChild(buildRelationItem(mother, false));
            } else if (canEdit()) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'relation-item relation-item--empty';
                emptyItem.dataset.action = 'add-parents';
                emptyItem.innerHTML = `
                    <i data-lucide="plus"></i>
                    <span>Добавить родителей</span>
                `;
                parentsGroup.appendChild(emptyItem);
            }
        }

        renderFamilies(person, panel);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    function buildRelationItem(person, draggable) {
        const item = document.createElement('div');
        item.className = 'relation-item';
        item.dataset.personId = String(person.id);
        if (draggable) item.setAttribute('draggable', 'true');

        const genderClass = person.gender === 'male'
            ? 'relation-avatar--male'
            : person.gender === 'female'
                ? 'relation-avatar--female'
                : '';
        const icon = person.gender === 'male' ? 'mars' : person.gender === 'female' ? 'venus' : 'user';

        const name = getPersonDisplayName(person);

        const dragHandle = draggable
            ? `<div class="drag-handle"><i data-lucide="grip-vertical"></i></div>`
            : '';

        item.innerHTML = `
            ${dragHandle}
            <div class="relation-avatar ${genderClass}">
                <i data-lucide="${icon}"></i>
            </div>
            <span class="relation-name">${escapeHtml(name)}</span>
        `;

        return item;
    }

    function renderFamilies(person, panel) {
        const familiesContainer = panel.relations.familiesContainer;
        if (!familiesContainer) return;

        const personMarriages = findMarriagesForPerson(person.id);
        familiesContainer.innerHTML = '';

        if (panel.relations.familiesBadge) {
            panel.relations.familiesBadge.textContent = String(personMarriages.length);
        }

        personMarriages.forEach((marriage, index) => {
            const spouseId = getSpouseInMarriage(person.id, marriage);
            const spouse = getPersonById(spouseId);
            const spouseName = spouse ? getPersonDisplayName(spouse) : 'Неизвестно';
            const spouseGender = spouse?.gender;
            const spouseIcon = spouseGender === 'male' ? 'mars' : spouseGender === 'female' ? 'venus' : 'user';
            const spouseClass = spouseGender === 'male'
                ? 'relation-avatar--male'
                : spouseGender === 'female'
                    ? 'relation-avatar--female'
                    : '';

            const children = marriage.children || [];

            const childrenItems = children.map(childId => {
                const child = getPersonById(childId);
                if (!child) return '';
                const childItem = buildRelationItem(child, canEdit());
                childItem.dataset.marriageId = String(marriage.id);
                return childItem.outerHTML;
            }).join('');

            const addChildButton = canEdit()
                ? `
                    <button class="add-btn" data-action="add-child" data-marriage-id="${String(marriage.id)}">
                        <i data-lucide="plus"></i>
                        <span>Добавить ребёнка</span>
                    </button>
                `
                : '';

            const card = document.createElement('div');
            card.className = 'family-card';
            card.dataset.marriageId = String(marriage.id);
            card.innerHTML = `
                <div class="family-header">
                    <span class="family-title">Семья ${index + 1}</span>
                </div>
                <div class="family-spouse">
                    <div class="relation-label">
                        <i data-lucide="heart"></i>
                        <span>Супруг(а)</span>
                    </div>
                    <div class="relation-item" data-person-id="${String(spouseId)}">
                        <div class="relation-avatar ${spouseClass}">
                            <i data-lucide="${spouseIcon}"></i>
                        </div>
                        <span class="relation-name">${escapeHtml(spouseName)}</span>
                    </div>
                </div>
                <div class="family-children" data-marriage-id="${String(marriage.id)}">
                    <div class="relation-label">
                        <i data-lucide="users"></i>
                        <span>Дети</span>
                        <span class="relation-badge">${children.length}</span>
                    </div>
                    ${childrenItems}
                    ${addChildButton}
                </div>
            `;

            familiesContainer.appendChild(card);
        });

        if (panel.relations.addSpouseBtn) {
            panel.relations.addSpouseBtn.dataset.action = 'add-spouse';
        }

        initDragAndDrop();
    }

    function initPanelActions() {
        const panel = getPanelElements();
        if (panel.actions.saveBtn) {
            panel.actions.saveBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await savePersonData();
            });
        }

        if (panel.actions.deleteBtn) {
            panel.actions.deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                openDeleteConfirmModal();
            });
        }

        if (panel.relations.section) {
            panel.relations.section.addEventListener('click', (e) => {
                const item = e.target.closest('.relation-item');
                if (item && item.dataset.personId) {
                    const personId = coercePersonId(item.dataset.personId);
                    selectPerson(personId, { center: true, keepZoom: true });
                    return;
                }

                const addBtn = e.target.closest('.add-btn');
                if (addBtn) {
                    const action = addBtn.dataset.action;
                    if (action === 'add-child') {
                        currentMarriageForChildId = addBtn.dataset.marriageId;
                        openModal('child');
                    }
                    if (action === 'add-spouse') {
                        openSpouseChoiceModal();
                    }
                    return;
                }

                const emptyItem = e.target.closest('.relation-item--empty');
                if (emptyItem && emptyItem.dataset.action === 'add-parents') {
                    openModal('parents');
                }
            });
        }
    }
    function openSpouseChoiceModal() {
        if (!currentEditPersonId) return;
        const person = getPersonById(currentEditPersonId);
        if (!person || !person.gender) {
            showToast('Укажите пол', 'warning');
            return;
        }
        openModal('spouseChoice');
    }

    function openSelectPersonModal(mode) {
        modalState.mode = mode;
        modalState.sourcePersonId = currentEditPersonId;
        renderSelectPersonList();
        openModal('selectPerson');
    }

    function getSpouseCandidates(personId, query = '') {
        const person = getPersonById(personId);
        if (!person) return [];
        const requiredGender = person.gender === 'male' ? 'female' : person.gender === 'female' ? 'male' : null;
        const existingSpouses = findSpouses(personId);

        return personsData.filter(p => {
            if (idsEqual(p.id, personId)) return false;
            if (requiredGender && p.gender && p.gender !== requiredGender) return false;
            if (existingSpouses.some(sp => idsEqual(sp, p.id))) return false;
            if (query) {
                const name = getPersonDisplayName(p).toLowerCase();
                if (!name.includes(query.toLowerCase())) return false;
            }
            return true;
        });
    }

    function renderSelectPersonList() {
        const modal = document.getElementById('selectPersonModal');
        if (!modal) return;

        const list = modal.querySelector('.modal-person-list');
        const searchInput = modal.querySelector('.modal-search .search-input');
        const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

        let candidates = [];
        if (modalState.mode === 'spouse') {
            candidates = getSpouseCandidates(modalState.sourcePersonId, query);
        }

        if (!list) return;

        if (candidates.length === 0) {
            list.innerHTML = `
                <li class="modal-person-item" style="pointer-events:none;">
                    <div class="person-info">
                        <span class="person-name">Ничего не найдено</span>
                    </div>
                </li>
            `;
            return;
        }

        list.innerHTML = candidates.map(person => {
            const genderClass = person.gender === 'male'
                ? 'person-avatar--male'
                : person.gender === 'female'
                    ? 'person-avatar--female'
                    : '';
            const icon = person.gender === 'male' ? 'mars' : person.gender === 'female' ? 'venus' : 'user';
            const birthYear = person.birth ? String(person.birth) : '';

            return `
                <li class="modal-person-item" data-person-id="${String(person.id)}">
                    <div class="person-avatar ${genderClass}">
                        <i data-lucide="${icon}"></i>
                    </div>
                    <div class="person-info">
                        <span class="person-name">${escapeHtml(getPersonDisplayName(person))}</span>
                        <span class="person-meta">${escapeHtml(birthYear)}</span>
                    </div>
                </li>
            `;
        }).join('');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async function handleSelectPerson(personId) {
        if (modalState.mode === 'spouse') {
            await selectExistingSpouse(personId);
        }
        closeModal('selectPerson');
    }

    async function addPerson(personData) {
        if (!canEdit()) {
            showToast('Нет прав на редактирование', 'warning');
            return null;
        }

        try {
            const result = await API.createPerson(personData);
            if (result.success) {
                personsData.push(result.data);
                return result.data;
            }
        } catch (error) {
            console.error('Error adding person:', error);
        }

        showToast('Ошибка при добавлении', 'error');
        return null;
    }

    async function updatePerson(personId, data) {
        if (!canEdit()) {
            showToast('Нет прав на редактирование', 'warning');
            return false;
        }

        try {
            const result = await API.updatePerson(personId, data);
            if (result.success) {
                const person = getPersonById(personId);
                if (person) {
                    Object.assign(person, result.data);
                }
                return true;
            }
        } catch (error) {
            console.error('Error updating person:', error);
        }

        showToast('Ошибка обновления', 'error');
        return false;
    }

    function openDeleteConfirmModal() {
        if (!currentEditPersonId) return;
        const check = canDeletePerson(currentEditPersonId);
        if (!check.canDelete) {
            showToast(check.message || 'Нельзя удалить', 'warning');
            return;
        }
        personToDelete = currentEditPersonId;
        openModal('confirmDelete');
    }

    async function confirmDeletePerson() {
        if (!personToDelete) return;
        const personId = personToDelete;
        personToDelete = null;
        closeModal('confirmDelete');

        try {
            const result = await API.deletePerson(personId);
            if (result.success) {
                setPersonsData(personsData.filter(p => !idsEqual(p.id, personId)));
                let newMarriages = marriages.filter(m => !idsEqual(m.husband, personId) && !idsEqual(m.wife, personId));
                newMarriages.forEach(m => {
                    if (m.children) {
                        m.children = m.children.filter(c => !idsEqual(c, personId));
                    }
                });
                setMarriages(newMarriages);

                const root = personsData.find(p => p.is_root);
                const newSelected = root ? root.id : (personsData[0]?.id || null);

                if (newSelected) {
                    selectPerson(newSelected, { center: true, keepZoom: false });
                } else {
                    state.selectedPerson = null;
                    layoutTree();
                    render(selectPerson);
                    showEmptyPanel();
                }

                renderSidebarList();
                showToast('Человек удалён', 'success');
            }
        } catch (error) {
            console.error('Error deleting person:', error);
            showToast('Ошибка удаления', 'error');
        }
    }
    async function handleAddParentsSubmit(e) {
        e.preventDefault();
        if (!currentEditPersonId) return;

        const form = e.currentTarget;

        // Валидация формы
        if (!validateForm(form)) {
            return; // Не отправлять если есть ошибки
        }

        const fatherFirstName = form.querySelector('[name="fatherFirstName"]')?.value.trim() || '';
        const fatherLastName = form.querySelector('[name="fatherLastName"]')?.value.trim() || '';
        const motherFirstName = form.querySelector('[name="motherFirstName"]')?.value.trim() || '';
        const motherLastName = form.querySelector('[name="motherLastName"]')?.value.trim() || '';

        const fatherDate = getModalDate(form, 0);
        const motherDate = getModalDate(form, 1);

        try {
            const father = await addPerson({
                given_name: fatherFirstName,
                surname: fatherLastName,
                gender: 'male',
                birth_day: fatherDate.day,
                birth_month: fatherDate.month,
                birth: fatherDate.year
            });
            if (!father) return;

            const mother = await addPerson({
                given_name: motherFirstName,
                surname: motherLastName,
                gender: 'female',
                birth_day: motherDate.day,
                birth_month: motherDate.month,
                birth: motherDate.year
            });
            if (!mother) return;

            const marriageResult = await API.createMarriage(father.id, mother.id, [currentEditPersonId]);
            if (marriageResult.success) {
                marriages.push(marriageResult.data);
                closeModal('parents');
                selectPerson(father.id, { center: true, keepZoom: true });
                renderSidebarList();
                showToast('Родители добавлены', 'success');
            }
        } catch (error) {
            console.error('Error adding parents:', error);
            showToast('Ошибка добавления', 'error');
        }
    }

    async function handleAddSpouseSubmit(e) {
        e.preventDefault();
        if (!currentEditPersonId) return;

        const person = getPersonById(currentEditPersonId);
        if (!person || !person.gender) {
            showToast('Укажите пол', 'warning');
            return;
        }

        const form = e.currentTarget;

        // Валидация формы
        if (!validateForm(form)) {
            return; // Не отправлять если есть ошибки
        }

        const firstName = form.querySelector('[name="firstName"]')?.value.trim() || '';
        const lastName = form.querySelector('[name="lastName"]')?.value.trim() || '';
        const date = getModalDate(form, 0);

        const spouseGender = person.gender === 'male' ? 'female' : 'male';

        try {
            const spouse = await addPerson({
                given_name: firstName,
                surname: lastName,
                gender: spouseGender,
                birth_day: date.day,
                birth_month: date.month,
                birth: date.year
            });
            if (!spouse) return;

            const husband = person.gender === 'male' ? person.id : spouse.id;
            const wife = person.gender === 'male' ? spouse.id : person.id;

            const marriageResult = await API.createMarriage(husband, wife, []);
            if (marriageResult.success) {
                marriages.push(marriageResult.data);
                closeModal('spouse');
                selectPerson(person.id, { center: false, keepZoom: true });
                renderSidebarList();
                showToast('Супруг добавлен', 'success');
            }
        } catch (error) {
            console.error('Error adding spouse:', error);
            showToast('Ошибка добавления', 'error');
        }
    }

    async function selectExistingSpouse(spouseId) {
        if (!currentEditPersonId) return;
        const person = getPersonById(currentEditPersonId);
        const spouse = getPersonById(spouseId);
        if (!person || !spouse) return;

        try {
            const husband = person.gender === 'male' ? person.id : spouse.id;
            const wife = person.gender === 'male' ? spouse.id : person.id;
            const marriageResult = await API.createMarriage(husband, wife, []);
            if (marriageResult.success) {
                marriages.push(marriageResult.data);
                selectPerson(person.id, { center: false, keepZoom: true });
                renderSidebarList();
                showToast('Супруг добавлен', 'success');
            }
        } catch (error) {
            console.error('Error selecting spouse:', error);
            showToast('Ошибка добавления', 'error');
        }
    }

    async function handleAddChildSubmit(e) {
        e.preventDefault();
        if (!currentMarriageForChildId) return;

        const form = e.currentTarget;

        // Валидация формы
        if (!validateForm(form)) {
            return; // Не отправлять если есть ошибки
        }

        // Проверить что пол выбран
        const genderInput = form.querySelector('input[name="childGender"]:checked');
        if (!genderInput) {
            showToast('Выберите пол ребёнка', 'warning');
            return;
        }

        const firstName = form.querySelector('[name="firstName"]')?.value.trim() || '';
        const lastName = form.querySelector('[name="lastName"]')?.value.trim() || '';
        const gender = genderInput.value;
        const date = getModalDate(form, 0);

        try {
            const child = await addPerson({
                given_name: firstName,
                surname: lastName,
                gender,
                birth_day: date.day,
                birth_month: date.month,
                birth: date.year
            });
            if (!child) return;

            const result = await API.addChildToMarriage(currentMarriageForChildId, child.id);
            if (result.success) {
                const marriage = marriages.find(m => idsEqual(m.id, currentMarriageForChildId));
                if (marriage) {
                    marriage.children = marriage.children || [];
                    marriage.children.push(child.id);
                }
                closeModal('child');
                selectPerson(currentEditPersonId, { center: false, keepZoom: true });
                renderSidebarList();
                showToast('Ребёнок добавлен', 'success');
            }
        } catch (error) {
            console.error('Error adding child:', error);
            showToast('Ошибка добавления', 'error');
        } finally {
            currentMarriageForChildId = null;
        }
    }

    function getModalDate(form, index) {
        const pickers = form.querySelectorAll('.date-picker');
        const picker = pickers[index];
        if (!picker) return { day: null, month: null, year: null };

        const day = picker.querySelector('.date-day')?.value || null;
        const month = picker.querySelector('.date-month')?.value || null;
        const year = picker.querySelector('.date-year')?.value || null;

        return {
            day: day ? parseInt(day, 10) : null,
            month: month ? parseInt(month, 10) : null,
            year: year ? parseInt(year, 10) : null
        };
    }

    async function savePersonData() {
        if (!currentEditPersonId) return;
        const panel = getPanelElements();
        const person = getPersonById(currentEditPersonId);
        if (!person) return;

        const gender = Array.from(panel.info.genderRadios || []).find(radio => radio.checked)?.value || '';
        const day = panel.info.birthPicker?.querySelector('.date-day')?.value || '';
        const month = panel.info.birthPicker?.querySelector('.date-month')?.value || '';
        const year = panel.info.birthPicker?.querySelector('.date-year')?.value || '';

        const payload = {
            given_name: panel.info.givenName?.value.trim() || '',
            patronymic: panel.info.patronymic?.value.trim() || '',
            surname: panel.info.surname?.value.trim() || '',
            surname_at_birth: panel.additional.surnameAtBirth?.value.trim() || '',
            gender,
            birth_day: day || null,
            birth_month: month || null,
            birth: year || null,
            birth_place: panel.additional.birthPlace?.value.trim() || '',
            data_accuracy: panel.info.accuracySelect?.value || 'unknown',
            residence: panel.additional.residence?.value.trim() || '',
            nationality: panel.additional.nationality?.value.trim() || '',
            occupation: panel.additional.occupation?.value.trim() || '',
            biography: panel.additional.biography?.value || ''
        };

        const success = await updatePerson(currentEditPersonId, payload);
        if (success) {
            layoutTree();
            render(selectPerson);
            renderSidebarList();
            showSaveIndicator('Изменения сохранены');
        }
    }

    function saveChildrenOrder(container) {
        const marriageId = container.dataset.marriageId;
        const marriage = marriages.find(m => idsEqual(m.id, marriageId));
        if (!marriage) return;

        const newOrder = Array.from(container.querySelectorAll('.relation-item[draggable="true"][data-person-id]'))
            .map(item => coercePersonId(item.dataset.personId));

        marriage.children = newOrder;

        if (canEdit()) {
            API.updateMarriage(marriage.id, { children: newOrder })
                .then(result => {
                    if (result?.success) {
                        showSaveIndicator('Порядок детей сохранён');
                    }
                })
                .catch(error => {
                    console.error('Error updating children order:', error);
                    showToast('Ошибка сохранения', 'error');
                });
        }
    }
    function importGEDCOM() {
        if (!canEdit()) return;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.ged,.gedcom';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            document.body.removeChild(fileInput);

            if (!file) return;
            pendingImportFile = file;
            openModal('confirmImport');
        });

        fileInput.click();
    }

    async function confirmImportGEDCOM() {
        if (!pendingImportFile) return;

        const file = pendingImportFile;
        pendingImportFile = null;
        closeModal('confirmImport');

        try {
            showSaveIndicator('Импорт...');
            const result = await API.importGEDCOM(file);
            if (result.success) {
                await loadDataFromAPI();
                renderAfterLoad();
                showSaveIndicator('Импорт завершён');
            } else {
                showToast('Ошибка импорта', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            showToast('Ошибка импорта', 'error');
        }
    }

    function exportGEDCOM() {
        let gedcom = '';

        gedcom += '0 HEAD\n';
        gedcom += '1 SOUR FamilyTree\n';
        gedcom += '2 NAME Shajara\n';
        gedcom += '2 VERS 1.0\n';
        gedcom += '1 DEST ANY\n';
        gedcom += '1 DATE ' + new Date().toISOString().split('T')[0].replace(/-/g, ' ') + '\n';
        gedcom += '1 GEDC\n';
        gedcom += '2 VERS 5.5.1\n';
        gedcom += '2 FORM LINEAGE-LINKED\n';
        gedcom += '1 CHAR UTF-8\n';
        gedcom += '1 LANG Russian\n';

        personsData.forEach(person => {
            gedcom += `0 @I${person.id}@ INDI\n`;

            const givenName = [person.given_name, person.patronymic].filter(Boolean).join(' ').trim();
            const surname = person.surname || person.surname_at_birth || '';
            const displayName = getPersonDisplayName(person);
            if (displayName && displayName !== '(Без имени)') {
                let nameLine = '';
                if (surname) {
                    const givenPart = givenName ? `${givenName} ` : '';
                    nameLine = `${givenPart}/${surname}/`;
                } else {
                    nameLine = givenName || displayName;
                }
                gedcom += `1 NAME ${nameLine}\n`;
                if (givenName) gedcom += `2 GIVN ${givenName}\n`;
                if (surname) gedcom += `2 SURN ${surname}\n`;
            }

            if (person.gender) {
                gedcom += `1 SEX ${person.gender === 'male' ? 'M' : 'F'}\n`;
            }

            if (person.birth || person.birth_day || person.birth_month) {
                gedcom += '1 BIRT\n';
                const birthDate = formatDateParts(person.birth_day, person.birth_month, person.birth);
                if (birthDate) {
                    gedcom += `2 DATE ${birthDate}\n`;
                }
            }

            const parents = findParentsForGedcom(person.id);
            if (parents) {
                gedcom += `1 FAMC @F${parents.marriageIndex}@\n`;
            }

            const spouseFamilies = findSpouseFamiliesForGedcom(person.id);
            spouseFamilies.forEach(famIdx => {
                gedcom += `1 FAMS @F${famIdx}@\n`;
            });
        });

        marriages.forEach((marriage, index) => {
            gedcom += `0 @F${index}@ FAM\n`;
            gedcom += `1 HUSB @I${marriage.husband}@\n`;
            gedcom += `1 WIFE @I${marriage.wife}@\n`;

            if (marriage.children) {
                marriage.children.forEach(childId => {
                    gedcom += `1 CHIL @I${childId}@\n`;
                });
            }
        });

        gedcom += '0 TRLR\n';

        downloadFile(gedcom, 'family_tree.ged', 'text/plain');
        showToast('Файл экспортирован', 'success');
    }

    function findParentsForGedcom(personId) {
        for (let i = 0; i < marriages.length; i++) {
            if (marriages[i].children && marriages[i].children.some(child => idsEqual(child, personId))) {
                return { marriageIndex: i };
            }
        }
        return null;
    }

    function findSpouseFamiliesForGedcom(personId) {
        const families = [];
        marriages.forEach((m, index) => {
            if (idsEqual(m.husband, personId) || idsEqual(m.wife, personId)) {
                families.push(index);
            }
        });
        return families;
    }

    // ========================================
    // Share Functions
    // ========================================

    async function openShareModal() {
        if (appState.accessLevel !== 'owner') {
            showToast('Только владелец может делиться деревом', 'warning');
            return;
        }

        openModal('shareModal');
        await loadShareLinks();
    }

    async function loadShareLinks() {
        const viewInput = document.getElementById('shareViewLink');
        const editInput = document.getElementById('shareEditLink');

        if (!viewInput || !editInput) return;

        viewInput.value = 'Загрузка...';
        editInput.value = 'Загрузка...';

        try {
            const result = await API.getShareLinks();
            if (result.success) {
                const baseUrl = window.location.origin + window.location.pathname;
                viewInput.value = result.data.view_token
                    ? `${baseUrl}?share=${result.data.view_token}`
                    : 'Ссылка не создана';
                editInput.value = result.data.edit_token
                    ? `${baseUrl}?share=${result.data.edit_token}`
                    : 'Ссылка не создана';
            } else {
                viewInput.value = 'Ошибка загрузки';
                editInput.value = 'Ошибка загрузки';
            }
        } catch (error) {
            console.error('Error loading share links:', error);
            viewInput.value = 'Ошибка загрузки';
            editInput.value = 'Ошибка загрузки';
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async function copyShareLink(type) {
        const inputId = type === 'view' ? 'shareViewLink' : 'shareEditLink';
        const input = document.getElementById(inputId);

        if (!input || !input.value || input.value.includes('Ошибка') || input.value.includes('Загрузка')) {
            showToast('Ссылка недоступна', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(input.value);
            showToast('Ссылка скопирована', 'success');
        } catch (error) {
            // Fallback для старых браузеров
            input.select();
            document.execCommand('copy');
            showToast('Ссылка скопирована', 'success');
        }
    }

    async function resetShareLink(type) {
        if (appState.accessLevel !== 'owner') {
            showToast('Нет прав', 'warning');
            return;
        }

        try {
            const result = await API.regenerateShareLinks(type);
            if (result.success) {
                await loadShareLinks();
                const typeName = type === 'view' ? 'просмотра' : 'редактирования';
                showToast(`Ссылка ${typeName} сброшена`, 'success');
            } else {
                showToast('Ошибка сброса ссылки', 'error');
            }
        } catch (error) {
            console.error('Error resetting share link:', error);
            showToast('Ошибка сброса ссылки', 'error');
        }
    }

    async function loadDataFromAPI() {
        try {
            const result = await API.getTree();
            if (result.success) {
                setPersonsData(result.data.persons || []);
                setMarriages(result.data.marriages || []);
                appState.treeId = result.data.tree_id;
                appState.accessLevel = result.data.access_level;
                appState.shareTokens = result.data.share_tokens;
                return true;
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        return false;
    }

    function renderAfterLoad() {
        renderSidebarList();
        layoutTree();
        render(selectPerson);

        const rootPerson = personsData.find(p => p.is_root);
        if (rootPerson) {
            selectPerson(rootPerson.id, { center: true, keepZoom: true });
        } else if (personsData.length > 0) {
            selectPerson(personsData[0].id, { center: true, keepZoom: true });
        } else {
            showEmptyPanel();
        }
    }

    function selectPerson(personId, options = {}) {
        const { center = true, keepZoom = true } = options;
        const coercedId = coercePersonId(personId);

        state.selectedPerson = coercedId;
        state.visiblePersons = null;

        layoutTree();
        render(selectPerson);
        renderSidebarList();
        updatePanel(coercedId);

        if (center) {
            requestAnimationFrame(() => centerOnPerson(coercedId, keepZoom));
        } else {
            updateTransform();
            updateZoomDisplay();
        }

        // На мобильных: закрыть sidebar (panel открывается только по кнопке)
        if (window.innerWidth <= 1024) {
            closeMobilePanels();
        }
    }

    // ==================== Mobile Responsive ====================

    function initMobileOverlay() {
        const mobileOverlay = document.createElement('div');
        mobileOverlay.className = 'mobile-overlay';
        mobileOverlay.id = 'mobileOverlay';
        document.body.appendChild(mobileOverlay);
    }

    function toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const panel = document.querySelector('.panel');
        const overlay = document.getElementById('mobileOverlay');

        // Закрыть panel если открыт
        panel?.classList.remove('active');

        sidebar?.classList.toggle('active');
        overlay?.classList.toggle('active', sidebar?.classList.contains('active'));
    }

    function togglePanel() {
        const sidebar = document.querySelector('.sidebar');
        const panel = document.querySelector('.panel');
        const overlay = document.getElementById('mobileOverlay');

        // Закрыть sidebar если открыт
        sidebar?.classList.remove('active');

        panel?.classList.toggle('active');
        overlay?.classList.toggle('active', panel?.classList.contains('active'));
    }

    function closeMobilePanels() {
        document.querySelector('.sidebar')?.classList.remove('active');
        document.querySelector('.panel')?.classList.remove('active');
        document.getElementById('mobileOverlay')?.classList.remove('active');
    }

    function initMobileToggle() {
        initMobileOverlay();

        const toggleSidebarBtn = document.getElementById('toggleSidebar');
        const togglePanelBtn = document.getElementById('togglePanel');
        const overlay = document.getElementById('mobileOverlay');

        // Click events
        toggleSidebarBtn?.addEventListener('click', toggleSidebar);
        togglePanelBtn?.addEventListener('click', togglePanel);
        overlay?.addEventListener('click', closeMobilePanels);

        // Touch events for mobile devices
        toggleSidebarBtn?.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleSidebar();
        });
        togglePanelBtn?.addEventListener('touchend', (e) => {
            e.preventDefault();
            togglePanel();
        });
        overlay?.addEventListener('touchend', (e) => {
            e.preventDefault();
            closeMobilePanels();
        });
    }

    function applyAccessLevel() {
        setPanelReadOnly(!canEdit());

        const addButtons = document.querySelectorAll('.add-btn');
        addButtons.forEach(btn => {
            btn.style.display = canEdit() ? '' : 'none';
        });

        // Кнопка "Поделиться" только для владельца
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.style.display = appState.accessLevel === 'owner' ? '' : 'none';
        }

        // Кнопка "Импорт" только для владельца и редактора
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.style.display = canEdit() ? '' : 'none';
        }
    }

    document.addEventListener('DOMContentLoaded', async () => {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        initDOMElements();
        initSectionToggles();
        initZoomControls();
        initDatePickers();
        initModal();
        initFormValidation();
        initViewportEvents();
        initSidebar();
        initPanelActions();
        initAgeCalculation();
        initMobileToggle();

        const token = localStorage.getItem('auth_token');
        const shareToken = getShareToken();

        if (!token && !shareToken) {
            window.location.href = 'login.html';
            return;
        }

        try {
            const authResult = await API.checkAuth();
            if (!authResult.success || !authResult.data.authenticated) {
                if (!shareToken) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                    return;
                }
            }

            appState.isAuthenticated = authResult.data.authenticated;
            appState.accessLevel = authResult.data.access_level || appState.accessLevel;
            appState.isShared = authResult.data.is_shared || false;
            appState.user = authResult.data.user || null;

            const userNameEl = document.querySelector('.sidebar-profile-name');
            if (userNameEl) {
                if (appState.user) {
                    userNameEl.textContent = appState.user.username;
                } else if (appState.isShared) {
                    userNameEl.textContent = appState.accessLevel === 'viewer' ? 'Просмотр' : 'Редактор';
                }
            }

            const loaded = await loadDataFromAPI();
            if (loaded) {
                applyAccessLevel();
                renderAfterLoad();
            }
        } catch (error) {
            console.error('Init error:', error);
        }
    });
})();
