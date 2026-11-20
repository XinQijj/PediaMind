// Charts and the replay widget for the PediaMind project page. All numbers come from window.PM_DATA (data.js),
// generated from the evaluation outputs by pediamind/scripts/build_project_page_data.py.
(() => {
  const D = window.PM_DATA;
  const NS = "http://www.w3.org/2000/svg";
  const SER = { web: "--s-ours", ours: "--s-ours", kb: "--s-kb", old: "--s-old", base_free: "--s-base", base: "--s-base", kimi: "--s-kimi" };
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const f1 = (x) => (Math.round(x * 10) / 10).toFixed(1);

  function svg(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (parent) parent.appendChild(e);
    return e;
  }
  function text(parent, x, y, s, attrs = {}) { const t = svg("text", { x, y, ...attrs }, parent); t.textContent = s; return t; }

  // ---------------------------------------------------------------- tooltip
  const tip = document.createElement("div"); tip.id = "tip"; tip.setAttribute("role", "tooltip"); document.body.appendChild(tip);
  function showTip(html, ev) {
    tip.innerHTML = html; tip.classList.add("on");
    const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
    let x = ev.clientX + pad, y = ev.clientY + pad;
    if (x + w > innerWidth - 8) x = ev.clientX - w - pad;
    if (y + h > innerHeight - 8) y = ev.clientY - h - pad;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  const hideTip = () => tip.classList.remove("on");
  const sw = (v) => `<span class="sw" style="background:var(${v})"></span>`;
  function hover(target, html) {
    target.style.cursor = "default";
    target.addEventListener("mousemove", (e) => showTip(typeof html === "function" ? html(e) : html, e));
    target.addEventListener("mouseleave", hideTip);
    target.setAttribute("tabindex", "0");
    target.addEventListener("focus", () => { const r = target.getBoundingClientRect(); showTip(typeof html === "function" ? html({ clientX: r.right, clientY: r.top }) : html, { clientX: r.right, clientY: r.top }); });
    target.addEventListener("blur", hideTip);
  }
  // column with a 4px rounded data end, square at the baseline
  function colPath(x, y0, w, y1, r = 4) {
    const h = y0 - y1; r = Math.min(r, h, w / 2);
    return `M${x},${y0} V${y1 + r} Q${x},${y1} ${x + r},${y1} H${x + w - r} Q${x + w},${y1} ${x + w},${y1 + r} V${y0} Z`;
  }
  function barPath(x0, y, x1, h, r = 4) {           // horizontal bar, rounded at the right end
    const w = x1 - x0; r = Math.min(r, w, h / 2);
    if (w <= 0) return "";
    return `M${x0},${y} H${x1 - r} Q${x1},${y} ${x1},${y + r} V${y + h - r} Q${x1},${y + h} ${x1 - r},${y + h} H${x0} Z`;
  }
  function table(head, rows, hl = -1, numFrom = 1) {
    return `<div class="tablewrap"><table class="t"><thead><tr>${head.map((h, i) => `<th${i >= numFrom ? ' class="num"' : ""}>${h}</th>`).join("")}</tr></thead><tbody>${
      rows.map((r, j) => `<tr${j === hl ? ' class="hl"' : ""}>${r.map((c, i) => `<td${i >= numFrom ? ' class="num"' : ""}>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }

  // ---------------------------------------------------------------- 1. dumbbell: same asker, without / with IMCS-21
  function dumbbell(root) {
    const rows = D.dumbbell, W = 760, LW = 232, X0 = 250, X1 = 700, RH = 64, T = 10, H = T + rows.length * RH + 34;
    const xs = (v) => X0 + (X1 - X0) * v / 80;
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "同一个提问方，不用和用了 IMCS-21 时问 5 个问题的召回" }, root);
    for (const g of [0, 20, 40, 60, 80]) {
      svg("line", { x1: xs(g), x2: xs(g), y1: T, y2: H - 30, class: g ? "grid" : "axis" }, s);
      text(s, xs(g), H - 12, g + "%", { "text-anchor": "middle", class: "t-muted" });
    }
    rows.forEach((r, i) => {
      const y = T + i * RH + RH / 2, b = r.before.recall, a = r.after.recall;
      text(s, 0, y - 4, r.label, { class: "t-strong" });
      text(s, 0, y + 15, r.sub, { class: "t-muted" });
      svg("line", { x1: xs(b), x2: xs(a), y1: y, y2: y, style: "stroke:var(--axis);stroke-width:2" }, s);
      const g = svg("g", {}, s);
      svg("circle", { cx: xs(b), cy: y, r: 6, style: "fill:var(--before);stroke:var(--chart-surface);stroke-width:2" }, g);
      svg("circle", { cx: xs(a), cy: y, r: 6, style: "fill:var(--s-ours);stroke:var(--chart-surface);stroke-width:2" }, g);
      text(s, xs(b) - 11, y + 4.5, f1(b), { "text-anchor": "end" });
      text(s, xs(a) + 11, y + 4.5, `${f1(a)}（+${f1(a - b)}）`, { class: "t-strong" });
      const hit = svg("rect", { x: xs(b) - 16, y: y - 18, width: xs(a) - xs(b) + 32, height: 36, fill: "transparent" }, s);
      hover(hit, `<b>${esc(r.label)}</b><br>${esc(r.sub)}<br>${sw("--before")}不用 IMCS-21：${f1(b)}%（95% CI ${r.before.ci.map(f1).join("–")}）<br>`
        + `${sw("--s-ours")}用了 IMCS-21：<b>${f1(a)}%</b>（95% CI ${r.after.ci.map(f1).join("–")}）<br>孩子确有的症状：${f1(r.before.pos)}% → ${f1(r.after.pos)}%`);
    });
    root.insertAdjacentHTML("beforeend", `<details class="data"><summary>查看数据表</summary>${table(
      ["提问方", "比较", "不用 IMCS-21", "用了 IMCS-21", "提升", "用了之后 95% CI"],
      rows.map((r) => [esc(r.label), esc(r.sub), f1(r.before.recall), f1(r.after.recall), "+" + f1(r.after.recall - r.before.recall), r.after.ci.map(f1).join("–")]), -1, 2)}</details>`);
  }

  // ---------------------------------------------------------------- 2. recall after k questions (lines + crosshair)
  function curves(root) {
    const C = D.curves, W = 760, H = 320, L = 50, R = 16, T = 14, B = 44;
    const xs = (k) => L + (W - L - R) * (k - 1) / 9, ys = (v) => T + (H - T - B) * (1 - v / 80);
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "问了 k 个问题后的召回曲线" }, root);
    for (const g of [0, 20, 40, 60, 80]) {
      svg("line", { x1: L, x2: W - R, y1: ys(g), y2: ys(g), class: g ? "grid" : "axis" }, s);
      text(s, L - 8, ys(g) + 4, g + "%", { "text-anchor": "end", class: "t-muted" });
    }
    C.k.forEach((k) => text(s, xs(k), H - B + 20, k, { "text-anchor": "middle", class: "t-muted" }));
    text(s, (L + W - R) / 2, H - 6, "已经问了几个追问", { "text-anchor": "middle", class: "t-muted" });
    svg("line", { x1: xs(5), x2: xs(5), y1: T, y2: H - B, style: "stroke:var(--axis);stroke-width:1" }, s);
    text(s, xs(5) + 6, T + 12, "网站最多追问 5 个", { class: "t-muted" });
    for (const se of [...C.series].reverse()) {
      const v = `var(${SER[se.key]})`;
      svg("path", { d: se.values.map((y, i) => `${i ? "L" : "M"}${xs(i + 1)},${ys(y)}`).join(""), fill: "none",
        style: `stroke:${v};stroke-width:2;stroke-linejoin:round;stroke-linecap:round` }, s);
      const n = se.values.length;
      svg("circle", { cx: xs(n), cy: ys(se.values[n - 1]), r: 4, style: `fill:${v};stroke:var(--chart-surface);stroke-width:2` }, s);
    }
    const cross = svg("line", { y1: T, y2: H - B, style: "stroke:var(--muted);stroke-width:1;opacity:0" }, s);
    const dots = C.series.map((se) => svg("circle", { r: 5, style: `fill:var(${SER[se.key]});stroke:var(--chart-surface);stroke-width:2;opacity:0` }, s));
    const area = svg("rect", { x: L, y: T, width: W - L - R, height: H - T - B, fill: "transparent" }, s);
    const at = (e) => { const p = s.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(s.getScreenCTM().inverse());
      return Math.max(1, Math.min(10, Math.round(1 + (q.x - L) / (W - L - R) * 9))); };
    area.addEventListener("mousemove", (e) => {
      const k = at(e);
      cross.setAttribute("x1", xs(k)); cross.setAttribute("x2", xs(k)); cross.style.opacity = 1;
      C.series.forEach((se, i) => { dots[i].setAttribute("cx", xs(k)); dots[i].setAttribute("cy", ys(se.values[k - 1])); dots[i].style.opacity = 1; });
      const lines = [...C.series].sort((a, b) => b.values[k - 1] - a.values[k - 1])
        .map((se) => `${sw(SER[se.key])}${esc(se.name)}：<b>${f1(se.values[k - 1])}%</b>`).join("<br>");
      showTip(`<b>问了 ${k} 个追问后</b><br>${lines}`, e);
    });
    area.addEventListener("mouseleave", () => { hideTip(); cross.style.opacity = 0; dots.forEach((d) => (d.style.opacity = 0)); });
    (root.querySelector(".csub") || root).insertAdjacentHTML("afterend", `<div class="legend">${C.series.map((se) => `<span><i class="line" style="background:var(${SER[se.key]})"></i>${esc(se.name)}</span>`).join("")}</div>`);
    root.insertAdjacentHTML("beforeend", `<details class="data"><summary>查看数据表</summary>${table(
      ["提问方式", ...C.k.map((k) => `问 ${k} 个`)], C.series.map((se) => [esc(se.name), ...se.values.map(f1)]), 0)}</details>`);
  }

  // ---------------------------------------------------------------- 3. record model: two small multiples
  function record(root) {
    const R = D.record_model, keys = ["base", "kimi", "ours"], short = ["原版", "Kimi", "微调"];
    const W = 760, H = 270, PW = 340, gap = 80, T = 30, B = 40;
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "病历模型：症状识别 F1 与病历生成得分" }, root);
    [["sr_f1", "sr_ci", "症状识别 F1（官方 IMCS-SR）"], ["mrg", "mrg_ci", "病历生成得分（官方 IMCS-MRG）"]].forEach(([m, ci, title], p) => {
      const x0 = 40 + p * (PW + gap), ys = (v) => T + (H - T - B) * (1 - v / 80);
      text(s, x0, 16, title, { class: "t-strong" });
      for (const g of [0, 20, 40, 60, 80]) {
        svg("line", { x1: x0, x2: x0 + PW, y1: ys(g), y2: ys(g), class: g ? "grid" : "axis" }, s);
        text(s, x0 - 8, ys(g) + 4, g, { "text-anchor": "end", class: "t-muted" });
      }
      R.forEach((r, i) => {
        const cx = x0 + PW * (i + 0.5) / 3, v = r[m];
        const col = svg("path", { d: colPath(cx - 12, ys(0), 24, ys(v)), style: `fill:var(${SER[keys[i]]})` }, s);
        text(s, cx, ys(v) - 8, f1(v), { "text-anchor": "middle", class: i === 2 ? "t-strong" : "" });
        text(s, cx, H - B + 20, short[i], { "text-anchor": "middle", class: "t-muted" });
        hover(col, `${sw(SER[keys[i]])}<b>${esc(r.name)}</b><br>${esc(title)}：<b>${f1(v)}</b><br>95% CI ${r[ci].map(f1).join("–")}（200 段测试对话）`);
      });
    });
    (root.querySelector(".csub") || root).insertAdjacentHTML("afterend", `<div class="legend">${R.map((r, i) => `<span><i style="background:var(${SER[keys[i]]})"></i>${esc(r.name)}</span>`).join("")}</div>`);
    root.insertAdjacentHTML("beforeend", `<details class="data"><summary>查看数据表</summary>${table(
      ["模型", "症状识别 F1", "95% CI", "病历生成得分", "95% CI"], R.map((r) => [esc(r.name), f1(r.sr_f1), r.sr_ci.map(f1).join("–"), f1(r.mrg), r.mrg_ci.map(f1).join("–")]), 2)}</details>`);
  }

  // ---------------------------------------------------------------- 4. understand first: repeated questions
  function understand(root) {
    const U = D.understand, W = 760, LW = 236, X0 = 244, X1 = 690, RH = 40, T = 6, H = T + U.length * RH + 30;
    const max = Math.max(...U.map((u) => u.repeats)), xs = (v) => X0 + (X1 - X0) * v / 900;
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "不同读法下，重复问家长已经说过的症状的次数" }, root);
    for (const g of [0, 300, 600, 900]) {
      svg("line", { x1: xs(g), x2: xs(g), y1: T, y2: H - 26, class: g ? "grid" : "axis" }, s);
      text(s, xs(g), H - 8, g, { "text-anchor": "middle", class: "t-muted" });
    }
    U.forEach((u, i) => {
      const y = T + i * RH + RH / 2, web = u.name.includes("网站"), h = 20;
      text(s, 0, y + 4.5, u.name, { class: web ? "t-strong" : "" });
      const p = barPath(xs(0), y - h / 2, Math.max(xs(u.repeats), xs(0) + (u.repeats ? 4 : 0)), h);
      const bar = p ? svg("path", { d: p, style: `fill:var(${web ? "--s-ours" : "--before"})` }, s) : null;
      text(s, xs(u.repeats) + 8, y + 4.5, u.repeats + " 次", { class: web ? "t-strong" : "" });
      const hit = svg("rect", { x: 0, y: y - RH / 2, width: W, height: RH, fill: "transparent" }, s);
      hover(hit, `<b>${esc(u.name)}</b><br>重复问家长已说过的症状：<b>${u.repeats} 次</b><br>抽对的比例 ${u.precision}% · 抽全的比例 ${u.recall}%<br>问 5 个后的召回：${f1(u.recall5)}%`);
    });
    root.insertAdjacentHTML("beforeend", `<details class="data"><summary>查看数据表</summary>${table(
      ["怎么读家长原话", "抽对的比例", "抽全的比例", "问 5 个后的召回", "重复提问"],
      U.map((u) => [esc(u.name), u.precision + "%", u.recall + "%", f1(u.recall5), u.repeats + " 次"]), U.findIndex((u) => u.name.includes("网站")))}</details>`);
  }

  // ---------------------------------------------------------------- 4b. preliminary diagnosis accuracy
  function dxbars(root) {
    const R = D.diagnosis.rows, W = 760, X0 = 268, X1 = 690, RH = 46, T = 6, H = T + R.length * RH + 30, bh = 11;
    const xs = (v) => X0 + (X1 - X0) * v / 100;
    const s = svg("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": "初步诊断的准确率：第 1 个就对、前 3 个里有" }, root);
    for (const g of [0, 25, 50, 75, 100]) {
      svg("line", { x1: xs(g), x2: xs(g), y1: T, y2: H - 26, class: g ? "grid" : "axis" }, s);
      text(s, xs(g), H - 8, g + "%", { "text-anchor": "middle", class: "t-muted" });
    }
    R.forEach((r, i) => {
      const y = T + i * RH + 8, model = r.name.startsWith("诊断模型（只听");
      text(s, 0, y + 15, r.name, { class: model ? "t-strong" : "" });
      [["top1", "--s-top1", 0], ["top3", "--s-top3", bh + 3]].forEach(([k, v, dy]) => {
        if (r[k] == null) return;
        svg("path", { d: barPath(xs(0), y + dy, xs(r[k]), bh), style: `fill:var(${v})` }, s);
        text(s, xs(r[k]) + 6, y + dy + bh - 1, f1(r[k]), { class: k === "top3" && model ? "t-strong" : "" });
      });
      const hit = svg("rect", { x: 0, y: y - 4, width: W, height: RH - 4, fill: "transparent" }, s);
      hover(hit, `<b>${esc(r.name)}</b><br>${sw("--s-top1")}第 1 个就对：<b>${f1(r.top1)}%</b>${r.top1_ci ? `（95% CI ${r.top1_ci.map(f1).join("–")}）` : ""}`
        + (r.top3 != null ? `<br>${sw("--s-top3")}前 3 个里有：<b>${f1(r.top3)}%</b>` : ""));
    });
    (root.querySelector(".csub") || root).insertAdjacentHTML("afterend", `<div class="legend"><span><i style="background:var(--s-top1)"></i>第 1 个就对</span><span><i style="background:var(--s-top3)"></i>前 3 个里有</span></div>`);
    root.insertAdjacentHTML("beforeend", `<details class="data"><summary>查看数据表</summary>${table(
      ["诊断依据（测试集 811 段）", "第 1 个就对", "95% CI", "前 3 个里有"],
      R.map((r) => [esc(r.name), f1(r.top1), r.top1_ci ? r.top1_ci.map(f1).join("–") : "—", r.top3 != null ? f1(r.top3) : "—"]), 2)}</details>`);
  }

  // ---------------------------------------------------------------- 5. tables built from data
  function dxclinical(root) {
    const C = D.diagnosis.clinical;
    root.insertAdjacentHTML("beforeend", table(["设定（测试集）", "主要诊断与医生一致", "95% CI", "医生的诊断在列出的诊断里", "平均列出"],
      C.map((r) => [esc(r.name), f1(r.primary), r.primary_ci.map(f1).join("–"), f1(r.listed), r.n_listed.toFixed(1)]),
      C.findIndex((r) => r.name.startsWith("知识库每答一题重算，问 5"))));
  }
  function arms811(root) {
    const A = D.arms811;
    root.innerHTML = table(["提问方式（全部 811 段测试问诊）", "问 3 个", "问 5 个", "95% CI", "问 10 个", "孩子确有的症状（问 5 个）"],
      A.map((a) => [esc(a.name), f1(a.k3), f1(a.recall), a.ci.map(f1).join("–"), f1(a.k10), f1(a.pos)]), A.length - 1);
  }
  function stopping(root) {
    const S = D.stopping;
    root.innerHTML = table(["停止阈值", "平均问几个", "召回", "孩子确有的症状", "每问命中率"],
      Object.entries(S).map(([th, m]) => [`${Math.round(th * 100)}%${th === "0.20" ? "（网站所用）" : ""}`, f1(m.questions_mean), f1(m.recall), f1(m.pos_recall), m.hit_per_question + "%"]),
      Object.keys(S).indexOf("0.20"));
  }

  // ---------------------------------------------------------------- 6. replay: simulated parent
  function replay(root) {
    const E = D.examples;
    let cur = 0, timer = null;
    root.innerHTML = `<div class="tabs">${E.map((e, i) => `<button data-i="${i}">例 ${i + 1}</button>`).join("")}</div><div id="rp"></div>`;
    const tabs = [...root.querySelectorAll(".tabs button")];
    const col = (key, title, v, items) => `<div><div class="colhead"><i style="background:var(${v})"></i>${title}</div>
      <ul class="qa" data-col="${key}">${items.map((q, j) => `<li class="${q.hit ? "hit" : ""}"><span class="k">${j + 1}</span><span class="s">有没有“${esc(q.s)}”？</span>
      <span class="a">家长：${esc(q.a || "—")}</span><span class="mark">${q.hit ? "✓ 问到了" : ""}</span></li>`).join("")}</ul>
      <div class="score" data-score="${key}"></div></div>`;
    function show(i) {
      clearInterval(timer); cur = i;
      tabs.forEach((b, j) => b.classList.toggle("on", j === i));
      const e = E[i];
      $("#rp", root).innerHTML = `<div class="parent"><div class="small muted">家长开头的原话（IMCS-21 测试集，第 ${esc(e.id)} 段）</div>
        <div class="q">“${esc(e.self_report)}”</div>
        <div class="small muted" style="margin-top:6px">家长已经说了：${e.explicit.map(esc).join("、") || "—"}　·　真实医生靠追问才知道的：</div>
        <div class="chips">${e.target.map((t) => `<span class="chip" data-s="${esc(t.s)}">${esc(t.s)}（${esc(t.a)}）</span>`).join("")}</div></div>
        <div class="grid2">${col("old", "改进前的 A1 清单（按主诉，问诊中不变）", "--s-old", e.old)}${col("web", "现在：知识库 + 问诊模型，每答一题重算", "--s-ours", e.web)}</div>
        <div style="margin-top:12px"><button class="play">▶ 播放这次问诊</button> <span class="small muted">模拟家长按真实问诊的记录回答；绿色 = 问到了医生追问出来的症状</span></div>`;
      $(".play", root).onclick = () => play(e);
      play(e, true);
    }
    function play(e, instant = false) {
      clearInterval(timer);
      const lists = [...root.querySelectorAll(".qa")];
      lists.forEach((ul) => [...ul.children].forEach((li) => li.classList.toggle("shown", instant)));
      const chips = [...root.querySelectorAll(".chip")];
      const score = (n) => ["old", "web"].forEach((k) => {
        const items = (k === "old" ? e.old : e.web).slice(0, n), got = new Set(items.filter((q) => q.hit).map((q) => q.s));
        root.querySelector(`[data-score="${k}"]`).textContent = `问了 ${n} 个，问到 ${got.size} / ${e.target.length} 个`;
      });
      const mark = (n) => { const got = new Set([...e.old, ...e.web].slice(0).filter((q, j) => q.hit).map((q) => q.s));
        const webGot = new Set(e.web.slice(0, n).filter((q) => q.hit).map((q) => q.s));
        chips.forEach((c) => c.classList.toggle("hit", webGot.has(c.dataset.s))); return got; };
      if (instant) { score(5); mark(5); return; }
      let n = 0; score(0); mark(0);
      timer = setInterval(() => {
        n++;
        lists.forEach((ul) => ul.children[n - 1] && ul.children[n - 1].classList.add("shown"));
        score(n); mark(n);
        if (n >= 5) clearInterval(timer);
      }, 900);
    }
    tabs.forEach((b) => (b.onclick = () => show(+b.dataset.i)));
    show(0);
  }

  // ---------------------------------------------------------------- facts used in text
  function facts() {
    const f = D.data_facts, n = D.nextq;
    document.querySelectorAll("[data-fact]").forEach((e) => {
      const v = { kb_cases: f.kb_cases, q_train: f.question_samples_train, test_eps: f.test.episodes, test_with: f.test.with_target,
        exp_med: f.test.explicit_median, tgt_med: f.test.target_median, pos_med: f.test.target_positive_median,
        ask_h1: n.ask_hit_at_1, kb_h1: n.kb_hit_at_1, ask_h5: n.ask_hit_at_5, kb_h5: n.kb_hit_at_5 }[e.dataset.fact];
      if (v !== undefined) e.textContent = typeof v === "number" && v >= 1000 ? v.toLocaleString("en-US") : v;
    });
  }
  D.nextq.ask_hit_at_1 = D.nextq["ask_hit@1"]; D.nextq.ask_hit_at_5 = D.nextq["ask_hit@5"];
  D.nextq.kb_hit_at_1 = D.nextq["kb_hit@1"]; D.nextq.kb_hit_at_5 = D.nextq["kb_hit@5"];

  // ---------------------------------------------------------------- lightbox
  function lightbox() {
    const lb = document.createElement("div"); lb.id = "lightbox"; lb.innerHTML = "<img alt=''>"; document.body.appendChild(lb);
    document.querySelectorAll(".gallery img").forEach((im) => (im.onclick = () => { lb.firstChild.src = im.src; lb.firstChild.alt = im.alt; lb.classList.add("on"); }));
    lb.onclick = () => lb.classList.remove("on");
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.classList.remove("on"); });
  }

  const run = { dumbbell, curves, record, understand, dxbars, dxclinical, arms811, stopping, replay };
  document.querySelectorAll("[data-chart]").forEach((e) => run[e.dataset.chart](e));
  facts();
  lightbox();
})();
