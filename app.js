(function () {
  const D = window.DK;
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');
  const cat = id => D.cats.find(c => c.id === id);
  const P = id => D.prods[id];
  const A = p => 'assets/' + p;
  const money = v => '$' + Number(v).toFixed(2);
  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let userArt = null;
  // 同行页面选项是 JS 渲染没抓到时，用其 Specification 里的多值行（尺寸/颜色/材质）作为可选项
  Object.values(D.prods).forEach(p => {
    if (p.opts.length) return;
    p.spec.filter(([k, v]) => /^(Size|Measurement|Colou?r|Material|Style)/i.test(k) && /,|\//.test(v)).forEach(([k, v]) => {
      const split = x => x.split(/,\s*|\s\/\s/).map(y => y.trim()).filter(Boolean);
      const parts = v.split(' - ');
      if (parts.length > 2) { // "Kid's Shirt - S, M, 4XL Adult's Shirt - XS, S" → Style + Size
        const labels = [parts[0].trim()], vals = [];
        for (let i = 1; i < parts.length; i++) {
          const items = split(parts[i]);
          if (i < parts.length - 1) { const last = items.pop() || ''; const sp = last.indexOf(' '); items.push(last.slice(0, sp)); labels.push(last.slice(sp + 1)); }
          vals.push(items);
        }
        p.opts.push(['Style', labels, {}]); p.opts.push(['Size', vals[0], {}]);
      } else p.opts.push([/^Measurement/i.test(k) ? 'Size' : k, split(parts.length === 2 ? parts[1] : v), {}]);
    });
  });

  const tag = t => t ? `<span class="tag ${t}">${{ hot: 'HOT', new: 'NEW', have: '已上线' }[t]}</span>` : '';
  const ref = p => p.ref ? '<span class="ref">参考图</span>' : '';
  const catItems = c => c.types.flatMap(t => t.items);
  const typeOf = (c, tid) => c.types.find(t => t.id === tid);
  const minPrice = ids => Math.min(...ids.map(i => P(i).price));
  const hotFirst = ids => ids.slice().sort((a, b) => ({ hot: 0, have: 1, new: 2, '': 3 }[P(a).tag] - { hot: 0, have: 1, new: 2, '': 3 }[P(b).tag]));

  // ---------- 卡片 ----------
  function productCard(p) {
    return `<a class="card" href="#p/${p.id}">
      <div class="ph">${tag(p.tag)}<img src="${A(p.imgs[0])}" loading="lazy">${ref(p)}</div>
      <div class="meta"><div><div class="nm">${esc(p.name)}</div><div class="cn">${p.cn}</div><div class="pr">${money(p.price)} <small>USD</small></div></div><span class="arrow">→</span></div></a>`;
  }
  // 类型卡 / 大类卡 —— 点击进二级页
  function typeCard(c, t) {
    const lead = P(hotFirst(t.items)[0]);
    return `<a class="card" href="#cat/${c.id}?type=${t.id}">
      <div class="ph"><img src="${A(lead.imgs[0])}" loading="lazy">${ref(lead)}</div>
      <div class="meta"><div><div class="count">${t.items.length} styles · from ${money(minPrice(t.items))}</div><div class="nm nm-lg">${esc(t.name)}</div><div class="cn">${t.cn}</div></div><span class="arrow">→</span></div></a>`;
  }
  function bigCard(c) {
    const ids = catItems(c); const lead = P(hotFirst(ids)[0]);
    return `<a class="card" href="#cat/${c.id}">
      <div class="ph"><img src="${A(lead.imgs[0])}" loading="lazy">${ref(lead)}</div>
      <div class="meta"><div><div class="count">${ids.length} styles · from ${money(minPrice(ids))}</div><div class="nm nm-lg">${esc(c.name)}</div><div class="cn">${c.cn}</div></div><span class="arrow">→</span></div></a>`;
  }

  // ---------- ① 首页入口 ----------
  function viewHome() {
    const pics = [['clear-acrylic-keychain', 'mock/kc1.jpg', 'Acrylic Keychain'], ['clear-acrylic-stand', 'mock/std2.jpg', 'Acrylic Stand'], ['button-badge', 'mock/badge11.jpg', 'Button Badge'], ['die-cut-sticker', 'mock/stk7.jpg', 'Die-cut Sticker']].map(([id, img, n]) => ({ id, img, n }));
    app.innerHTML = `<div class="wrap">
      <div class="home-hero starry"><div><h1>Welcome to Dokipo World</h1><p>…首页其他板块不变…</p></div></div>
      <div class="entry">
        <div>
          <div class="eyebrow">Make your own</div>
          <h2 class="big" style="margin-top:10px">Your art, <em>made real.</em></h2>
          <p class="lead">Keychains, stands, stickers, tumblers and more. Upload a drawing, pick a product, get it from 1 piece.</p>
          <a class="btn btn-p btn-lg hl" style="width:auto" href="#diy/all">Upload &amp; make it →</a>
          <div class="chips"><span>100+ products</span><span>No minimum</span><span>Online editor</span><span>Ships worldwide</span></div>
        </div>
        <div class="entry-photos">${pics.map(p => `<a href="#p/${p.id}"><img src="${A(p.img)}"><span>${p.n}</span></a>`).join('')}</div>
      </div>
      <div class="note"><span class="pin">1</span><b>首页 DIY 入口</b>：按钮跳 DIY 首页（默认 All）。右侧改成 4 张<b>实物图</b>（钥匙扣 / 立牌 / 徽章 / 贴纸），点图直接进对应产品。<br>
      做法：用同行实拍底图（真实挂扣、底座、帆布包、笔记本），把原图案抹掉，换成<b>我们自己的 IP</b>（亚克力透边、白边模切、徽章高光按实物效果合成）。设计可按这个思路精修，或打样后实拍替换。</div>
    </div>`;
  }

  // ---------- ②③④ DIY 首页（顶部沿用线上原样） ----------
  function viewDiy(tab = 'all') {
    const icons = { all: 'dokipo-make-category-all.webp', gifts: 'dokipo-make-category-gifts.webp', goods: 'dokipo-make-category-goods.webp' };
    const tabs = [['all', 'All'], ['gifts', 'Gifts'], ['goods', 'Merch']].map(([id, n]) => `<a class="tabcard ${id === tab ? 'on' : ''}" href="#diy/${id}"><img src="assets/live/${icons[id]}">${n}</a>`).join('');
    const cats = D.cats.filter(c => tab === 'all' || c.tab === tab);
    const pills = cats.map(c => `<a class="pill" href="#cat/${c.id}">${c.name}</a>`).join('');
    const body = tab === 'all'
      ? `<div class="grid">${cats.map(bigCard).join('')}</div>
         <div class="explore"><a class="btn btn-p btn-lg" href="#all/all">Explore all ${D.cats.flatMap(catItems).length} styles →</a><small>Keychains, stickers, apparel, home and more</small></div>
         <div class="note"><span class="pin">3</span><b>All</b>：8 大类各放 1 张代表卡（谷子 5：钥匙扣 / 贴纸 / 徽章 / 立牌 / 卡片印刷；礼品 3：服饰 / 家居 / 包袋配饰），按热门度排序。卡片图用该大类最热门那款的<b>实物图</b>，点卡片进<b>二级页</b>。<br>卡片下方加「<b>Explore all N styles →</b>」引导按钮，进入全部款式页（谷子+礼品，按大类/子类分段）。</div>`
      : cats.map(c => { const ids = hotFirst(catItems(c)); return `<section class="group"><div class="group-hd"><div><h3>${c.name} <span class="cn">${c.cn}</span></h3></div><a class="viewall" href="#cat/${c.id}">View all ${ids.length} →</a></div>
          <div class="grid">${ids.slice(0, 4).map(i => productCard(P(i))).join('')}</div></section>`; }).join('') +
        `<div class="note"><span class="pin">4</span><b>${tab === 'goods' ? 'Merch 谷子' : 'Gifts 礼品'}</b>：按大类分组，每组<b>一排 4 个具体款式</b>（按热门取前 4），点卡片进该商品三级页。<br>
         标题右侧「<b>View all N →</b>」进这个大类的<b>二级页</b>，在二级页看全部款式。${tab === 'gifts' ? '<br>礼品已去掉玻璃杯、马克杯等易碎品。' : ''}</div>`;
    app.innerHTML = `<div class="wrap">
      <div class="crumb"><a href="#home">⌂ Home</a> &nbsp;›&nbsp; <b>Make your own</b></div>
      <div class="diy-hero">
        <div>
          <div class="eyebrow"><span style="color:var(--accent)">●</span> A little art. Endless possibilities.</div>
          <h1 class="lilita">Your art.<br>Your merch.</h1>
          <p style="color:var(--muted);font-size:16px;line-height:1.6">From a little imagination<br>to something you can hold.</p>
          <label class="upload"><input type="file" accept="image/*" hidden id="heroUp"><span class="up-ico">⇪</span><b>Upload your picture</b><small>or drag &amp; drop it here<br>PNG, JPG, WebP · Up to 20 MB</small></label>
          <p style="font-size:12px;color:var(--muted);text-align:center">✓ No minimums. Just your imagination.</p>
        </div>
        <div><img class="live-banner" src="assets/live/hero-banner.png">
          <div class="steps"><span class="on"><i>01</i>Upload artwork</span><hr><span><i>02</i>Choose your merch</span><hr><span><i>03</i>Customize &amp; order</span></div></div>
      </div>
      <div class="note"><span class="pin">2</span><b>DIY 首页顶部</b>：保持线上原样，不改。</div>
      <div class="panel">
        <div class="picker">
          <div><div class="eyebrow">A little art. Endless possibilities.</div><h2 class="lilita" style="font-size:40px;margin:6px 0 4px">Made real. <em>Made yours.</em></h2><p style="color:var(--muted);margin:0">Pick a product. Make it personal.</p></div>
          <div class="tabs">${tabs}</div>
        </div>
        <div class="searchrow"><div class="search">🔍 Find your next favourite…</div>${pills}</div>
        ${body}
      </div><div style="height:60px"></div></div>`;
    $('#heroUp').onchange = onUpload;
  }

  // ---------- ⑤ 二级页 ----------
  function viewCat(id, q) {
    const c = cat(id); if (!c) return viewDiy();
    const tabName = c.tab === 'goods' ? 'Merch' : 'Gifts';
    const sel = q.type || 'all';
    const ids = sel === 'all' ? hotFirst(catItems(c)) : typeOf(c, sel).items;
    const banner = hotFirst(catItems(c)).slice(0, 3).map(P);
    const siblings = `<a class="pill" href="#all/${c.tab}">All ${tabName}</a>` + D.cats.filter(x => x.tab === c.tab).map(x => `<a class="pill ${x.id === id ? 'on' : ''}" href="#cat/${x.id}">${x.name}</a>`).join('') + crossPill(c.tab === 'goods' ? 'gifts' : 'goods');
    const typePills = `<a class="pill ${sel === 'all' ? 'on' : ''}" href="#cat/${id}">All ${catItems(c).length}</a>` + c.types.map(t => `<a class="pill ${sel === t.id ? 'on' : ''}" href="#cat/${id}?type=${t.id}">${t.name} ${t.items.length}</a>`).join('');
    const compare = id === 'keychains' ? `<div class="compare"><h3>Same keychain, 9 finishes</h3><p style="color:var(--muted);margin:6px 0 0">Not sure which one? Compare the real thing. <span class="cn">每种工艺是一个独立商品，这里用实物图并排对比，点击进对应商品</span></p>
        <div class="compare-row">${typeOf(c, 'acrylic').items.map(P).map(p => `<a class="fcard" href="#p/${p.id}"><img src="${A(p.imgs[0])}">${esc(p.name.replace('Custom ', '').replace(' Acrylic Keychain', '').replace(' Keychain', ''))}<div class="cn">${p.cn.replace('钥匙扣', '')}</div></a>`).join('')}</div></div>` : '';
    app.innerHTML = `<div class="wrap">
      <div class="crumb"><a href="#home">⌂ Home</a> › <a href="#diy/all">Make your own</a> › <a href="#diy/${c.tab}">${tabName}</a> › <b>${c.name}</b></div>
      <div class="cat-banner starry">
        <div><div class="eyebrow" style="color:#C9D6FF;position:relative;z-index:1">${tabName} · ${catItems(c).length} styles</div><h1>Custom ${c.name}</h1><p>${c.cn} · from ${money(minPrice(catItems(c)))}</p>
        <a class="btn btn-y" style="position:relative;z-index:1;margin-top:10px" href="#p/${banner[0].id}">Start with your art →</a></div>
        <div class="vis">${banner.map(p => `<a href="#p/${p.id}"><img src="${A(p.imgs[0])}"></a>`).join('')}</div>
      </div>
      <div class="subnav">${siblings}</div>
      ${compare}
      <div class="filters">${typePills}<span class="sp"></span><select class="sort"><option>Sort: Best selling</option><option>Price: Low to high</option><option>Newest</option></select></div>
      <div class="grid">${ids.map(i => productCard(P(i))).join('')}</div>
      <div class="note"><span class="pin">5</span><b>二级页</b>：Banner 右侧和「工艺对比」全部换成<b>实物图</b>。下方类型标签筛选（从上一页点类型卡进来会自动选中），列表按 热门 → 已上线 → 新品 → 其他 排序。<b>一个工艺 = 一个商品</b>，点卡片进三级商品页。</div>
      <div style="height:60px"></div></div>`;
  }

  // ---------- ⑤' 二级页 · All Merch / All Gifts ----------
  function viewAll(tab, q) {
    const tabName = { goods: 'Merch', gifts: 'Gifts', all: 'Products' }[tab] || 'Products';
    const cats = D.cats.filter(x => tab === 'all' || x.tab === tab);
    const all = hotFirst(cats.flatMap(catItems));
    const types = cats.flatMap(c => c.types.map(t => ({ c, t })));
    const selT = q.type, selC = q.cat;
    const banner = cats.map(c => P(hotFirst(catItems(c))[0])).slice(0, 3);
    const other = tab === 'goods' ? 'gifts' : 'goods';
    const siblings = `<a class="pill on" href="#all/${tab}">All ${tabName}</a>` + cats.map(x => `<a class="pill" href="#cat/${x.id}">${x.name}</a>`).join('') + (tab === 'all' ? '' : crossPill(other));
    const pills = `<a class="pill ${!selT && !selC ? 'on' : ''}" href="#all/${tab}">All ${all.length}</a>` + types.map(({ c, t }) => `<a class="pill ${selT === t.id ? 'on' : ''}" href="#all/${tab}?type=${t.id}">${t.name} ${t.items.length}</a>`).join('');
    let body;
    if (selT) { const { t } = types.find(x => x.t.id === selT); body = `<h3 class="sec-h">${t.name} <span class="cn">${t.cn}</span></h3><div class="grid">${hotFirst(t.items).map(i => productCard(P(i))).join('')}</div>`; }
    else body = cats.filter(c => !selC || c.id === selC).map(c => `<section class="bigsec"><h2 class="sec-big">${c.name} <span class="cn">${c.cn}</span><small>${catItems(c).length} styles</small></h2>
        ${c.types.map(t => `<div class="group"><div class="group-hd"><h3>${t.name} <span class="cn">${t.cn}</span> <small class="muted-s">${t.items.length}</small></h3>${t.items.length > 4 ? `<a class="viewall" href="#all/${tab}?type=${t.id}">View all ${t.items.length} →</a>` : ''}</div>
        <div class="grid">${hotFirst(t.items).slice(0, 4).map(i => productCard(P(i))).join('')}</div></div>`).join('')}</section>`).join('');
    app.innerHTML = `<div class="wrap">
      <div class="crumb"><a href="#home">⌂ Home</a> › <a href="#diy/all">Make your own</a> › ${tab === 'all' ? '' : `<a href="#diy/${tab}">${tabName}</a> › `}<b>All ${tabName}</b></div>
      <div class="cat-banner starry">
        <div><div class="eyebrow" style="color:#C9D6FF;position:relative;z-index:1">${tabName} · ${all.length} styles</div><h1>All ${tabName}</h1><p>${{ goods: '谷子全部款式', gifts: '礼品全部款式', all: '全部 DIY 款式' }[tab]} · from ${money(minPrice(all))}</p>
        <a class="btn btn-y" style="position:relative;z-index:1;margin-top:10px" href="#p/${banner[0].id}">Start with your art →</a></div>
        <div class="vis">${banner.map(p => `<a href="#p/${p.id}"><img src="${A(p.imgs[0])}"></a>`).join('')}</div>
      </div>
      <div class="subnav">${siblings}</div>
      <div class="filters scroll">${pills}<span class="sp"></span><select class="sort"><option>Sort: Best selling</option><option>Price: Low to high</option><option>Newest</option></select></div>
      ${body}
      <div class="note"><span class="pin">5</span><b>二级页 · All ${tabName}</b>：按<b>大类 → 子类分段</b>展示，每个子类一排 4 款（按热门），超过 4 款的右侧有「View all N →」；顶部标签按<b>子类</b>筛选（例如 Pajama Pants 5 / Phone Cases 4），点了只看这一类。${tab === 'all' ? '' : `大类标签最后的「${other === 'gifts' ? '🎁 Shop Gifts' : '🧸 Shop Merch'} →」跳到另一个板块的二级页。`}</div>
      <div style="height:60px"></div></div>`;
  }
  function crossPill(t) { return `<a class="pill cross" href="#all/${t}">${t === 'gifts' ? '🎁 Shop Gifts' : '🧸 Shop Merch'} →</a>`; }

  // ---------- ⑥ 三级商品页（在线上商品页基础上优化） ----------
  const st = {};
  function viewProduct(pid) {
    const p = P(pid); if (!p) return viewDiy();
    const c = cat(p.cat);
    const s = st[pid] = st[pid] || { img: 0, opt: {}, tab: 'details' };
    const opts = p.opts.map(([name, vals, imgs], oi) => {
      const cur = s.opt[oi] ?? 0;
      const hasImg = imgs && Object.keys(imgs).length;
      return `<div class="opt"><div class="opt-t">${esc(name)}: <span>${esc(vals[cur])}</span></div>
        <div class="${hasImg ? 'mats' : 'chips'}">${vals.map((v, i) => hasImg && imgs[v]
          ? `<button class="mat ${i === cur ? 'on' : ''}" data-o="${oi}" data-v="${i}"><img src="${A(imgs[v])}">${esc(v)}</button>`
          : `<button class="chip ${i === cur ? 'on' : ''}" data-o="${oi}" data-v="${i}">${esc(v)}</button>`).join('')}</div></div>`;
    }).join('');
    const tiers = p.tiers.length ? `<div class="tier-box"><div class="opt-t">Buy more, save more <span>${esc(p.lead)}</span></div>
      <table class="tier-tb"><tr><th>Quantity</th><th>Discount (%)</th><th>Price</th></tr>${p.tiers.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td class="red">${r[2]}</td></tr>`).join('')}<tr><td colspan="3" class="more">… more tiers ⌄</td></tr></table>
      <p class="tip">${esc(p.tip || 'Discounts still available for different designs but with the same size & same clasps!')}</p></div>` : '';
    const specRows = (p.spec.length ? p.spec : p.opts.map(o => [o[0], o[1].join(' / ')]));
    const tabsBody = {
      details: `<p>${esc(p.desc || 'Upload your own art and order from 1 piece.')}</p><p>Made to order: arrives in 3–4 weeks.</p><p>Only upload art you own or have permission to use. No fan art of other people's characters, logos or brands.</p>${p.box.length ? `<h4>What's in the box</h4><div class="boxlist">${p.box.map(b => `<span>✓ ${esc(b)}</span>`).join('')}</div>` : ''}`,
      specs: `<table class="spec">${specRows.map(r => `<tr><th>${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join('')}</table><p class="muted-s">Sizes are approximate and can vary by a few millimeters. Colors may look slightly different on screen.</p>`,
      shipping: `<table class="spec"><tr><th>United States</th><td>$6.25 · 8–10 business days</td></tr><tr><th>United Kingdom</th><td>$3.99 · 8–16 business days</td></tr><tr><th>Canada</th><td>$5.99 · 8–16 business days</td></tr><tr><th>Australia</th><td>$4.39 · 8–15 business days</td></tr><tr><th>Production</th><td>Made to order in 8–10 business days</td></tr></table>`,
      care: `<p>Wipe gently with a soft dry cloth. Keep away from heat and direct sunlight.</p>`
    };
    app.innerHTML = `<div class="wrap">
      <div class="crumb"><a href="#home">⌂ Home</a> › <a href="#diy/${c.tab}">Make your own</a> › <a href="#cat/${c.id}?type=${p.type}">${c.name}</a> › <b>${esc(p.name)}</b></div>
      <div class="pdp2">
        <div>
          <div class="mainimg2"><img src="${A(p.imgs[s.img] || p.imgs[0])}">${ref(p)}<span class="count">${s.img + 1}/${p.imgs.length}</span></div>
          <div class="thumbs2">${p.imgs.map((im, i) => `<div class="${i === s.img ? 'on' : ''}" data-img="${i}"><img src="${A(im)}"></div>`).join('')}</div>
        </div>
        <div class="buy2">
          <h1>${esc(p.name)}</h1><div class="cn">${p.cn}</div>
          <div class="price2">${money(p.price)}${p.rating ? ` <span class="rating">★ ${p.rating} (${p.reviews})</span>` : ''}</div>
          <div class="mto"><b>Made to order · Arrives in 3-4 weeks</b><br>Printed in 8–10 business days, then 8–10 business days in transit.</div>
          <div class="chips3"><span>✓ Your art, 1 piece</span><span>✓ No minimum</span><span>✓ Ships worldwide</span></div>
          ${tiers}
          ${opts}
          <a class="btn btn-p btn-lg cta" href="#editor/${p.id}">Start customizing →</a>
          <div class="ok">✓ Damaged or wrong item? Send one photo and we reship free.</div><div class="ok">✓ Cancel any time before production starts.</div>
          <details class="faq"><summary>Is this a good gift?</summary><p>Yes — it ships in a gift-ready sleeve.</p></details>
          <details class="faq"><summary>Will it look like the pictures?</summary><p>You'll see a preview before you pay.</p></details>
          <details class="faq"><summary>Can I return it?</summary><p>Made-to-order items can't be returned, except where local law requires.</p></details>
        </div>
      </div>
      <div class="note"><span class="pin">6</span><b>三级商品页 = 线上原页面 + 增补</b>（布局、按钮、FAQ、下方标签页都保持线上原样）：<ol>
        <li>左侧图集全部用该商品自己的<b>实物图</b>（${p.ref ? '目前是同行原图，标了“参考图”' : '我们线上原图'}）。</li>
        <li>价格下面<b>新增</b>：阶梯价表（数量 / 折扣 / 单价，照同行原样）+ 规格选项（${p.opts.map(o => o[0]).join(' / ') || '—'}），名称和选项值<b>与同行原商品完全一致</b>，有材质图的带小图。</li>
        <li>「Start customizing」进编辑页；下方 Specs 标签填同行原规格。</li></ol>
        ${p.wurl || p.curl ? `规格来源：<a href="${p.wurl || p.curl}" target="_blank" style="color:var(--accent)">${p.wurl ? 'wooacry' : 'Callie'} 原商品页 ↗</a>` : '规格来源：我们线上原商品页'}</div>
      <div class="lower">
        <div class="tabbox"><div class="tabhd">${[['details', 'Details'], ['specs', 'Specs'], ['shipping', 'Shipping & returns'], ['care', 'Care']].map(([k, n]) => `<button class="${s.tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div><div class="tabbd">${tabsBody[s.tab]}</div></div>
        <div class="trust2"><div><b>Official merch</b><small>Approved by the creator</small></div><div><b>Creators get paid</b><small>Up to 30%+ of every sale</small></div><div><b>Tracked shipping</b><small>Shipping from $6.25</small></div><div><b>Lost or not right?</b><small>Send a photo, we reship free</small></div></div>
      </div>
      <div class="section"><h2 style="font-size:22px">You might also like</h2><div class="grid" style="margin-top:14px">${typeOf(c, p.type).items.filter(i => i !== pid).concat(catItems(c).filter(i => P(i).type !== p.type)).slice(0, 4).map(i => productCard(P(i))).join('')}</div></div>
      <div style="height:60px"></div></div>`;
    const rer = () => { const y = scrollY; viewProduct(pid); scrollTo(0, y); };
    app.querySelectorAll('[data-img]').forEach(b => b.onclick = () => { s.img = +b.dataset.img; rer(); });
    app.querySelectorAll('[data-o]').forEach(b => b.onclick = () => { s.opt[b.dataset.o] = +b.dataset.v; rer(); });
    app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { s.tab = b.dataset.tab; rer(); });
  }

  // ---------- ⑦ 编辑页（在线上 01/02/03 基础上优化） ----------
  function viewEditor(pid) {
    const p = P(pid); if (!p) return viewDiy();
    const isKC = p.cat === 'keychains';
    const e = st['ed' + pid] = st['ed' + pid] || { scale: 100, rot: 0, x: 0, y: 0, flip: false, side: 'front', text: '', font: 'Sans', color: '#14182E', shape: 0, acol: 0, acc: 7, accol: 9, size: 0, qty: 1, opt: {}, cut: true, tx: 0, ty: 0, nobg: false, hist: [] };
    const shapes = [['Die-cut', 'keychain-shape-die-cut'], ['Round', 'keychain-shape-round'], ['Rectangle', 'keychain-shape-rectangle']];
    const acols = ['clear', 'pink', 'lilac', 'mint', 'blue'];
    const acols2 = { clear: '#F7F9FC', pink: '#F8D6E4', lilac: '#E2D8F5', mint: '#D3F2E6', blue: '#D6E6FA' };
    const accs = ['carabiner', 'ball_chain', 'star', 'heart', 'bow', 'charm_ring', 'bunny', 'lobster_clasp', 'cat', 'sakura', 'd_ring', 'phone_strap', 'crescent_moon', 'bear', 'bat', 'apple'];
    const accols = ['orange', 'white', 'pink', 'purple', 'red', 'blue', 'mint', 'yellow', 'black', 'silver', 'gold', 'rose-gold', 'olive-green', 'gunmetal', 'satin-silver', 'lime-green'];
    const sizes = ['up to 9 cm²', 'up to 16 cm²', 'up to 25 cm²', 'up to 36 cm²', 'up to 49 cm²', 'up to 64 cm²', 'up to 81 cm²', 'up to 100 cm²'];
    const cap = s => s.replace(/[-_]/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
    const art = userArt || 'assets/ip/ip9.png';
    const sideMM = Math.round(Math.sqrt([9, 16, 25, 36, 49, 64, 81, 100][e.size]) * 10 * (isKC ? 1 : 1) * Math.min(e.scale, 100) / 100);
    const unit = p.price * (isKC ? [1, 1.25, 1.5, 1.8, 2.1, 2.4, 2.8, 3.2][e.size] : 1);
    const opt3 = isKC ? `
      <div class="lbl">Acrylic shape</div><div class="og3">${shapes.map((s, i) => `<button class="oc ${i === e.shape ? 'on' : ''}" data-k="shape" data-v="${i}"><img src="assets/opt/dokipo-option-r4-${s[1]}.webp">${s[0]}</button>`).join('')}</div>
      <div class="lbl">Acrylic colour</div><div class="og3">${acols.map((s, i) => `<button class="oc ${i === e.acol ? 'on' : ''}" data-k="acol" data-v="${i}"><img src="assets/opt/dokipo-option-r4-acrylic-colour-${s}.webp">${cap(s)}</button>`).join('')}</div>
      <div class="lbl">Accessory</div><div class="og4">${accs.map((s, i) => `<button class="oc sm ${i === e.acc ? 'on' : ''}" data-k="acc" data-v="${i}"><img src="assets/opt/dokipo-customizer-v3-clasp_${s}.webp">${cap(s)}</button>`).join('')}</div>
      <div class="lbl">Accessory colour</div><div class="og4">${accols.map((s, i) => `<button class="oc sm ${i === e.accol ? 'on' : ''}" data-k="accol" data-v="${i}"><img src="assets/opt/dokipo-option-r4-clasp-colour-${s}.webp">${cap(s)}</button>`).join('')}</div>
      <div class="lbl">Size</div><div class="og3">${sizes.map((s, i) => `<button class="sz ${i === e.size ? 'on' : ''}" data-k="size" data-v="${i}">${s}</button>`).join('')}</div>`
      : p.opts.map(([name, vals, imgs], oi) => `<div class="lbl">${esc(name)}</div><div class="${imgs && Object.keys(imgs).length ? 'og4' : 'og3'}">${vals.map((v, i) => `<button class="${imgs && imgs[v] ? 'oc sm' : 'sz'} ${(e.opt[oi] ?? 0) === i ? 'on' : ''}" data-ok="${oi}" data-v="${i}">${imgs && imgs[v] ? `<img src="${A(imgs[v])}">` : ''}${esc(v)}</button>`).join('')}</div>`).join('') || '<p class="muted-s">No extra options.</p>';
    const bg = isKC ? acols2[acols[e.acol]] : '#F4F6FC';
    const shapeCls = isKC ? ['diecut', 'round', 'rect'][e.shape] : 'rect';
    app.innerHTML = `<div class="wrap">
      <div class="crumb"><a href="#home">⌂ Home</a> › <a href="#diy/all">Make your own</a> › <a href="#p/${p.id}">Back to products</a> › <b>${esc(p.name)}</b></div>
      <div class="ed2">
        <div class="ed2-left">
          <div class="ed2-stage" style="--bg:${bg}">
            <div class="ed2-bar">
              <span class="edit-badge">✏️ Editing · drag to move · corners to resize</span>
              <div class="side-tg"><button class="${e.side === 'front' ? 'on' : ''}" data-side="front">Front</button><button class="${e.side === 'back' ? 'on' : ''}" data-side="back">Back</button></div>
            </div>
            <div class="ed2-canvas">
              <div class="ed2-board ${shapeCls} ${e.cut ? 'showcut' : ''}" id="board">
                ${isKC ? `<img class="ed2-clasp" src="assets/opt/dokipo-customizer-v3-clasp_${accs[e.acc]}.webp">` : ''}
                <div class="ed2-art sel ${e.nobg ? 'nobg' : ''}" id="edArt"><img src="${art}" draggable="false" style="${e.side === 'back' ? 'opacity:.55' : ''}"><i class="h tl" data-h="s"></i><i class="h tr" data-h="s"></i><i class="h bl" data-h="s"></i><i class="h br" data-h="s"></i><i class="h rot" data-h="r">↻</i></div>
                <div class="ed2-text" id="edText" style="${e.text ? '' : 'display:none;'}font-family:${{ Sans: 'Figtree', Serif: 'Georgia', Script: 'cursive' }[e.font]};color:${e.color}">${esc(e.text)}</div>
                <div class="ruler-v"><span>${sideMM} mm</span></div><div class="ruler-h"><span>${sideMM} mm</span></div>
              </div>
            </div>
            <div class="ed2-tools">
              <button data-t="zout" title="Zoom out">－</button><span>${e.scale}%</span><button data-t="zin" title="Zoom in">＋</button><i></i>
              <button data-t="rl" title="Rotate left">⟲</button><button data-t="rr" title="Rotate right">⟳</button><button data-t="flip" title="Flip">⇋</button><i></i>
              <button data-t="center" title="Center">⊕ Center</button><button data-t="fit" title="Fit">⤢ Fit</button><button data-t="cut" class="${e.cut ? 'on' : ''}" title="Cut line">✂ Cut line</button><button data-t="bg" class="${e.nobg ? 'on' : ''}" title="Remove background">✨ Remove BG</button><button data-t="undo">↶ Undo</button><button data-t="reset">⟲ Reset</button>
            </div>
            <p class="ed2-cap">Design preview · not a production proof · <b>${sideMM} × ${sideMM} mm</b> · <span style="color:var(--live)">— cut line</span> · <span>┄ bleed</span></p>
          </div>
          <div class="note"><span class="pin">7</span><b>编辑页 = 线上 01/02/03 原结构 + 编辑能力加强</b>：<ol>
            <li><b>可直接操作</b>：拖图片移动；拖 4 个角点缩放；拖顶部 ↻ 旋转；滚轮缩放；名字文字也能拖动位置。</li>
            <li><b>可操作项变多</b>：预览下方加工具条——缩放 ± / 左右旋转 / 镜像 / 居中 / 适配 / 切割线开关 / 一键抠图 / 撤销（可连续撤销）/ 重置；正反面切换（背面镜像）；尺寸档位变化时 mm 标注和价格实时更新。</li>
            <li>右侧 01 上传、02 加名字（字体/颜色）、03 选项保持线上原样；选项变化（形状、亚克力颜色、扣头、扣头颜色、尺寸）<b>左侧预览实时变化</b>。${isKC ? '' : '<br>非钥匙扣商品的 03 选项=该商品同行原规格。'}</li></ol></div>
        </div>
        <div class="ed2-right">
          <div class="stepc"><div class="sh"><i>01</i><div><b>Your artwork</b><small>Upload your artwork to make it into a ${esc(p.name.replace('Custom ', '').toLowerCase())}.</small></div></div>
            <label class="upbox"><input type="file" hidden accept="image/*" id="eUp"><div><b>${userArt ? 'my-artwork.png ✓' : 'Upload your artwork'}</b><small>PNG, JPG, WebP, GIF · Up to 20 MB</small></div><span class="btn btn-o">⇪ ${userArt ? 'Replace' : 'Upload artwork'}</span></label></div>
          <div class="stepc"><div class="sh"><i>02</i><div><b>Make it personal</b> <small style="display:inline">(optional)</small><small>Add a name or word to make it extra special.</small></div></div>
            <div class="lbl">A name or word</div><input class="inp" id="txt" maxlength="20" placeholder="A name or word" value="${esc(e.text)}">
            <div class="lbl">Font</div><div class="og3">${['Sans', 'Serif', 'Script'].map(f => `<button class="sz ${f === e.font ? 'on' : ''}" data-k="font" data-v="${f}"><b style="font-family:${{ Sans: 'Figtree', Serif: 'Georgia', Script: 'cursive' }[f]}">Aa</b> ${f}</button>`).join('')}</div>
            <div class="lbl">Text colour</div><div class="swatches">${['#14182E', '#FFFFFF', '#9AA0B0', '#E8559A', '#9B5CF6', '#5B6CF0'].map(col => `<button class="sw ${col === e.color ? 'on' : ''}" style="background:${col}" data-k="color" data-v="${col}"></button>`).join('')}</div></div>
          <div class="stepc"><div class="sh"><i>03</i><div><b>Choose your options</b><small>Choose the options for your ${esc(p.name.replace('Custom ', '').toLowerCase())}.</small></div></div>${opt3}</div>
          <div class="ed2-buy"><div class="qty"><button data-q="-1">−</button><b>${e.qty}</b><button data-q="1">+</button></div><b class="ed2-price">${money(unit * e.qty)}</b><button class="btn btn-grad" id="review">Review my creation →</button></div>
          <a href="#p/${p.id}" class="back">← Back to products</a>
        </div>
      </div><div style="height:60px"></div></div>`;
    const rer = () => { const y = scrollY; viewEditor(pid); scrollTo(0, y); };
    const snap = () => { const { hist, ...rest } = e; e.hist.push(JSON.stringify(rest)); if (e.hist.length > 50) e.hist.shift(); };
    const artEl = $('#edArt'), txtEl = $('#edText'), board = $('#board');
    const apply = () => {
      artEl.style.transform = `translate(calc(-50% + ${e.x}px), calc(-50% + ${e.y}px)) rotate(${e.rot}deg) scale(${e.scale / 100}) scaleX(${(e.flip ? -1 : 1) * (e.side === 'back' ? -1 : 1)})`;
      txtEl.style.transform = `translate(calc(-50% + ${e.tx}px), ${e.ty}px)`;
      const z = $('.ed2-tools span'); if (z) z.textContent = Math.round(e.scale) + '%';
    };
    apply();
    app.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { snap(); const k = b.dataset.k, v = b.dataset.v; e[k] = isNaN(+v) || k === 'color' ? v : +v; rer(); });
    app.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => { snap(); e.opt[b.dataset.ok] = +b.dataset.v; rer(); });
    app.querySelectorAll('[data-side]').forEach(b => b.onclick = () => { e.side = b.dataset.side; rer(); toast(e.side === 'back' ? 'Back side: mirrored print（背面镜像）' : 'Front side'); });
    app.querySelectorAll('[data-q]').forEach(b => b.onclick = () => { e.qty = Math.max(1, e.qty + +b.dataset.q); rer(); });
    const T = { zin: () => e.scale = Math.min(250, e.scale + 10), zout: () => e.scale = Math.max(20, e.scale - 10), rl: () => e.rot -= 15, rr: () => e.rot += 15, flip: () => e.flip = !e.flip,
      center: () => { e.x = e.y = 0; }, fit: () => { e.x = e.y = 0; e.scale = 100; e.rot = 0; }, cut: () => e.cut = !e.cut,
      bg: () => { e.nobg = !e.nobg; toast(e.nobg ? 'Background removed ✓' : 'Background restored'); },
      reset: () => Object.assign(e, { scale: 100, rot: 0, x: 0, y: 0, flip: false, tx: 0, ty: 0 }) };
    app.querySelectorAll('[data-t]').forEach(b => b.onclick = () => {
      if (b.dataset.t === 'undo') { const h = e.hist.pop(); if (h) Object.assign(e, JSON.parse(h)); return rer(); }
      snap(); T[b.dataset.t](); rer();
    });
    $('#txt').oninput = ev => { e.text = ev.target.value; txtEl.textContent = e.text; txtEl.style.display = e.text ? '' : 'none'; };
    $('#txt').onfocus = snap;
    // 拖动：图片移动 / 角点缩放 / 旋转柄旋转 / 文字移动
    const center = () => { const r = artEl.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
    const startDrag = (ev, kind) => {
      ev.preventDefault(); ev.stopPropagation(); snap();
      const [cx, cy] = center(); const s0 = { x: e.x, y: e.y, tx: e.tx, ty: e.ty, scale: e.scale, rot: e.rot, mx: ev.clientX, my: ev.clientY, d: Math.hypot(ev.clientX - cx, ev.clientY - cy) || 1, a: Math.atan2(ev.clientY - cy, ev.clientX - cx) };
      artEl.classList.add('dragging');
      const move = m => {
        const dx = m.clientX - s0.mx, dy = m.clientY - s0.my;
        if (kind === 'move') { e.x = s0.x + dx; e.y = s0.y + dy; }
        else if (kind === 'text') { e.tx = s0.tx + dx; e.ty = s0.ty + dy; }
        else if (kind === 's') { e.scale = Math.max(20, Math.min(250, s0.scale * Math.hypot(m.clientX - cx, m.clientY - cy) / s0.d)); }
        else if (kind === 'r') { e.rot = s0.rot + (Math.atan2(m.clientY - cy, m.clientX - cx) - s0.a) * 180 / Math.PI; }
        apply();
      };
      const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); artEl.classList.remove('dragging'); e.rot = Math.round(e.rot); };
      addEventListener('pointermove', move); addEventListener('pointerup', up);
    };
    artEl.onpointerdown = ev => startDrag(ev, ev.target.dataset.h || 'move');
    txtEl.onpointerdown = ev => startDrag(ev, 'text');
    artEl.onwheel = ev => { ev.preventDefault(); e.scale = Math.max(20, Math.min(250, e.scale - ev.deltaY * 0.1)); apply(); };
    $('#eUp').onchange = ev => onUpload(ev, rer);
    $('#review').onclick = () => openModal(`<h2>Review my creation</h2><p style="color:var(--muted)">Check your design before adding to cart. <span class="cn">确认页：正面/背面预览 + 所选规格汇总</span></p>
      <div class="pv"><div style="background:${bg}"><img src="${art}" style="width:80%;margin:10% auto;display:block">Front</div><div style="background:${bg}"><img src="${art}" style="width:80%;margin:10% auto;display:block;transform:scaleX(-1)">Back</div><div><img src="${A(p.imgs[0])}" style="width:100%">Real product</div></div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px"><button class="btn btn-o" onclick="closeModal()">Keep editing</button><button class="btn btn-p" onclick="closeModal()">Add to cart · ${money(unit * e.qty)}</button></div>`);
  }

  // ---------- 通用 ----------
  function onUpload(ev, cb) {
    const f = ev.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { userArt = r.result; toast('Artwork uploaded ✓'); cb ? cb() : route(); };
    r.readAsDataURL(f);
  }
  window.openModal = h => { $('#modalBody').innerHTML = h; $('#modal').classList.add('open'); };
  window.closeModal = () => $('#modal').classList.remove('open');
  function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2200); }

  function route() {
    window.onmousemove = null;
    const h = location.hash.slice(1) || 'home';
    const [path, qs] = h.split('?');
    const q = {}; (qs || '').split('&').filter(Boolean).forEach(x => { const [k, v] = x.split('='); q[k] = v; });
    const [v, a] = path.split('/');
    if (v === 'diy') viewDiy(a || 'all');
    else if (v === 'cat') viewCat(a, q);
    else if (v === 'all') viewAll(a, q);
    else if (v === 'p') viewProduct(a);
    else if (v === 'editor') viewEditor(a);
    else viewHome();
    document.querySelectorAll('#flow a').forEach(x => { const hr = x.getAttribute('href').slice(1); x.classList.toggle('on', (hr.split('/')[0] === v || (v === 'all' && hr.startsWith('cat'))) && (v !== 'diy' || hr === path)); });
    scrollTo(0, 0);
  }
  $('#cnToggle').onchange = ev => document.body.classList.toggle('hide-cn', !ev.target.checked);
  addEventListener('hashchange', route);
  route();
})();
