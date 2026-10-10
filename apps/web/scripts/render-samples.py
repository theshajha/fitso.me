"""Render content/samples/*.json into docs/engine/sample-reports.html.

Hierarchy first: page one, then each section as a lead line, points, and a fold
for the why. Lists come from decisions and plan. Mechanics sit at the very end.
"""
import json, base64, html, pathlib
R = pathlib.Path(__file__).resolve().parents[3]
esc = html.escape


def img(path):
    b = open(R / "apps/web/public" / path.lstrip("/"), "rb").read()
    return "data:image/jpeg;base64," + base64.b64encode(b).decode()


def sw(c, size=40):
    return f'<span class="sw" title="{esc(c.get("name", ""))}" style="background:{esc(c["hex"])};width:{size}px;height:{size}px"></span>'


def swatches(items, size=40, label=None):
    return "".join(f'<div class="swc">{sw(x, size)}<span>{esc(x["name"])}</span>{("<small>" + esc(x[label]) + "</small>") if label and x.get(label) else ""}</div>' for x in items)


def block(n, title, b, extra=""):
    pts = "".join(f"<li>{esc(p)}</li>" for p in b["points"])
    fold = f'<details><summary>Why</summary><p>{esc(b["detail"])}</p></details>' if b.get("detail") else ""
    return f'<section><div class="part">{n}</div><h2>{esc(title)}</h2><p class="lead">{esc(b["lead"])}</p><ul class="pts">{pts}</ul>{extra}{fold}</section>'


def render(door):
    j = json.load(open(R / f"apps/web/content/samples/{door}.json"))
    r = j["report"]; d = r["decisions"]; p = r["plan"]; t = r["text"]; rt = t["report"]; o = r["observations"][0]
    acc = "#2B3DF5" if door == "men" else "#F0127A"
    h = [f'<article class="report" style="--acc:{acc}">']
    # page one
    h.append(f'''<header class="cover"><img src="{img(j["photo"])}" alt=""><div>
<div class="part">Your Style Report</div>
<h1>{esc(t["free"]["headline"])}</h1>
<p class="sub">{esc(t["free"]["subline"])}</p>
<p class="youare">{esc(rt["summary"]["you_are"])}</p>
<ol class="five">{"".join(f"<li>{esc(x)}</li>" for x in rt["summary"]["five_lines"])}</ol>
<div class="card"><div class="row">{swatches(d["palette"], 30)}</div><div class="row">{swatches(d["neutrals"], 22)}<span class="muted">· {esc(d["metal"])}</span></div><div class="words">{" · ".join(esc(w) for w in d["style_words"])}</div></div>
</div></header>''')
    # seen
    h.append(block("1", "What we saw", rt["seen"], f'<div class="grid3 facts"><div><b>Colouring</b><br>{esc(o["skin"]["depth"].replace("_", " "))} skin, {esc(d["undertone"])} undertone<br>{esc(o["hair"]["colour"])} hair, {esc(o["eyes"]["colour"])} eyes<br>{esc(d["contrast"])} contrast, {esc(d["clarity"])}</div><div><b>Face</b><br>{esc(o["face"]["shape"])}<br>{esc("; ".join(o["face"]["notable_features"][:3]))}</div><div><b>Frame</b><br>{esc(d["line"]["body"]["summary"])}</div></div>'))
    # colours
    cols = f'''<div class="grid2"><div><div class="part">Your palette</div><div class="row">{swatches(d["palette"], 44, "use")}</div></div><div><div class="part">Neutrals and metal</div><div class="row">{swatches(d["neutrals"], 44, "use")}</div><p class="muted">Metal: <b>{esc(d["metal"])}</b></p></div></div>
<div class="grid2"><div><div class="part">Also yours</div><div class="row">{swatches(d["flow"], 32, "keep")}</div></div><div><div class="part">Keep away from your face</div><div class="row">{swatches(d["avoid"], 32)}</div></div></div>'''
    h.append(block("2", "Your colours", rt["colours"], cols))
    # face / body
    f = d["line"]["face"]; b = d["line"]["body"]
    h.append(block("3", "Your face", rt["face"], f'<details><summary>Every call, with the evidence</summary><ul class="adv">{"".join(f"<li><b>{esc(a['what'])}.</b> {esc(a['why'])}<div class=ev>Seen: {esc(a['evidence'])}</div></li>" for a in f["necklines"] + f["collars"] + [f["glasses"], f["hair"], f["earrings_or_scale"]])}</ul></details>'))
    h.append(block("4", "Your shape", rt["body"], f'<details><summary>Every call, with the evidence</summary><ul class="adv">{"".join(f"<li><b>{esc(a['what'])}.</b> {esc(a['why'])}<div class=ev>Seen: {esc(a['evidence'])}</div></li>" for a in b["silhouettes"] + b["rise_and_lengths"] + [b["print_scale"], b["accessory_scale"], b["fabric_weight"]] + b["fit_fixes"])}</ul></details>'))
    # style
    retire = "".join(f"<li><span class='tag change'>retire</span> {esc(k['item'])} <span class=muted>→ {esc(k['instead'])}</span></li>" for k in p["audit"]["retire"])
    keep = "".join(f"<li><span class='tag keep'>keep</span> {esc(k['item'])}</li>" for k in p["audit"]["keep"])
    h.append(block("5", "Your style", rt["style"], f'<ul class="plain">{keep}{retire}</ul>'))
    # outfits
    def piece(pc):
        yours = ' <em>yours</em>' if pc["from_photo"] else ""
        return f'<li>{sw({"hex": pc["hex"], "name": pc["colour_name"]}, 14)}<span>{esc(pc["colour_name"])} {esc(pc["item"])}{yours}</span></li>'
    outs = "".join(f'<div class="box outfit"><div class="part">{esc(x["occasion"])}</div><h3>{esc(x["name"])}</h3><ul class="pieces">{"".join(piece(pc) for pc in x["pieces"])}</ul><details><summary>Why</summary><p>{esc(x["why"])}</p></details></div>' for x in p["outfits"])
    h.append(block("6", "What to wear", rt["outfits"], f'<div class="grid3">{outs}</div>'))
    # buy
    buys = "".join(f'<li>{sw({"hex": x["hex"], "name": x["colour_name"]}, 20)}<div><b>{esc(x["item"])}</b> <span class="tier">{esc(x["budget_tier"])}</span><div class="muted">Search: <code>{esc(x["search_terms"])}</code></div><details><summary>Wear with, unlocks</summary><p>{esc(x["wear_with"])}. {esc(x["unlocks"])}</p></details></div></li>' for x in p["buy"])
    stop = "".join(f"<li>{esc(s['item'])}</li>" for s in p["stop_buying"])
    h.append(block("7", "What to buy", rt["buy"], f'<ol class="buy">{buys}</ol><p class="muted"><b>Stop buying:</b></p><ul class="plain">{stop}</ul>'))
    # grooming, week
    h.append(block("8", "Grooming", rt["grooming"]))
    h.append(block("9", "This week", rt["week"]))
    # mechanics
    c = r["colour"]
    held = sum(1 for v in r["verification"] if v["relation"] == "supports")
    h.append(f'<p class="mech">How this was read: {r["photo_count"]} photo · {len(r["observations"])} independent reads · season agreed by {round(c["agreement"] * c["votes"])} of {c["votes"]} analysts{(", runner-up " + esc(c["runner_up"]["season_depth"]) + " " + esc(c["runner_up"]["season"])) if c.get("runner_up") else ""} · {held} of {len(r["verification"])} free-read lines checked against the photo and held · visuals {len(r.get("visuals", []))} (needs GEMINI_API_KEY)</p>')
    h.append("</article>")
    return "".join(h)


CSS = open(R / "apps/web/scripts/render-samples.css").read()
page = f'''<title>fitso Sample Reports</title>
<meta name="description" content="Two full Style Reports generated by the fitso engine on the sample photos, in the report's reading order.">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;900&family=Hanken+Grotesk:wght@400;600;700&family=Spline+Sans+Mono:wght@500&display=swap">
<style>{CSS}</style>
<div class="wrap">
<nav class="top"><span class="part" style="margin:0">fitso · sample Style Reports · engine output</span><a href="#women">Women</a><a href="#men">Men</a></nav>
<div id="women">{render("women")}</div>
<div id="men">{render("men")}</div>
</div>'''
out = R / "docs/engine/sample-reports.html"
out.write_text(page)
print(out, len(page) // 1024, "KB")
