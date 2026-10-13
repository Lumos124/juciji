/* ============================================================
   打孔上钉 · 可视化编辑器
   三种编辑模式：
     components   → 各钉底图、各钉成就、瓷杯前/后位置、提示(开始体验/连孔上钉前/后/上钉/连线/移至操作台) 的位置/大小
     holes        → 当前钉的各孔位置 + 点击顺序（带数字角标）+ 连线轨迹
     achievements → 当前钉的钉图位置/大小（柳叶钉可有多张）+ 文字横幅位置/高度
   所有改动实时写回 CONFIG 对象，"复制 CONFIG 片段"按钮把
   (bases / prompts / nails) 三段贴回游戏端同名字段。
   ★ 与 nail.js 顶部 CONFIG 结构保持一致：瓷杯有 before/after 两套位置，
     提示有 move/startExperience/connectBefore/connectAfter/nail/connectLine。
   ============================================================ */
(function () {
'use strict';

// ============== 与 nail.js 顶部 CONFIG 结构保持一致的副本 ==============
const CONFIG = {
    timings: {
        lightUpMs: 1400, moveShowMs: 1800, moveFadeMs: 800,
        slideInMs: 1200, slideFadeMs: 900, startExpFadeMs: 900, connectFadeMs: 900,
        connectBlinkMs: 500, connectBlinks: 2, cupMoveMs: 1100, connectReplaceMs: 900,
        baseFadeMs: 900, baseGapMs: 600, nailAppearMs: 900, nailShrinkMs: 1200,
        textFadeMs: 900, textShowMs: 3500, textFadeOutMs: 900, nailSemiMs: 900,
        connectLineFadeMs: 900, holeGapMs: 280, nailPromptShowMs: 1800,
    },
    layout: {
        heightRatio: 0.80,
        cup: {
            before: { left: 50.26, top: 77.9, height: 95.04 },
            after:  { left: 50.26, top: 68.04, height: 95.04 },
        },
    },
    bases: [
        { src: '/上钉/image/梅花钉底图.webp',
          pos: { left: 40.14, top: 15.64, width: 19.95, aspect: 0.6342519685039371 } },
        { src: '/上钉/image/柳叶钉底图.webp',
          pos: { left: 39.06, top: 36.69, width: 22.51, aspect: 0.6342519685039371 } }
    ],
    prompts: {
        move:            { width: 92.47, top: 65.72, left: 49.98 },
        startExperience: { width: 92.19, top: 65.72, left: 49.82 },
        connectBefore:   { width: 9.42, top: 12.97, left: 49.74 },
        connectAfter:    { width: 9.42, top: 46.4, left: 50.37 },
        nail:            { width: 11.53, top: 45.05, left: 50.22 },
        connectLine:     { width: 42.77, top: 12.31, left: 49.9 },
    },
    hole: { width: 3.5, aspect: 1, zoneRadius: 4 },
    target: { width: 4 },
    nails: [
        {
            method: '梅花钉',
            holes: [
                { x: 50, y: 27.83 },
                { x: 55.93, y: 32.94 },
                { x: 44.3, y: 32.94 },
                { x: 55.42, y: 41.06 },
                { x: 44.53, y: 41.13 },
                { x: 50.17, y: 45.04 }
            ],
            segments: [[0, 2, 4, 5, 3, 1, 0]],
            achievement: {
                nails: [
                    { src: '/上钉/image/梅花钉.webp',
                      pos: { width: 27.3, left: 36.44, top: 18.57 }, initialScale: 1.5 }
                ],
                text: { src: '/上钉/image/成就——梅花钉文字.webp',
                        pos: { right: -16.97, top: 45.11, height: 41.5, offsetX: -6, aspect: 3.6504927975739196 } },
            },
        },
        {
            method: '柳叶钉',
            holes: [
                { x: 46.24, y: 54.74 },
                { x: 54.16, y: 54.67 },
                { x: 46.24, y: 64.37 },
                { x: 54.16, y: 64.67 }
            ],
            segments: [[0, 1], [2, 3]],
            achievement: {
                nails: [
                    { src: '/上钉/image/柳叶钉.webp',
                      pos: { width: 27.24, left: 36.38, top: 46.02 }, initialScale: 1.5 },
                    { src: '/上钉/image/柳叶钉.webp',
                      pos: { width: 27.24, left: 36.55, top: 55.72 }, initialScale: 1.5 }
                ],
                text: { src: '/上钉/image/成就——柳叶钉文字.webp',
                        pos: { right: -16.85, top: 46.46, height: 37.14, offsetX: -6, aspect: 4.184166666666667 } },
            },
        }
    ],
    nailOrder: ['梅花钉', '柳叶钉'],
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
const cupBox = $('cup-box');
const cup = $('cup');
const basesBox = $('bases');
const cupSvg = $('cup-svg');
const holesBox = $('holes');
const holeHint = $('hole-hint');
const editAch = $('edit-ach');
const hdBox = $('handles');
const play = $('play');
const playStage = $('play-stage');
const promptNail = $('prompt-nail');
const promptConnect = $('prompt-connect');          // 提示——连线（相对 #play）
const promptMove = $('prompt-move');                // 提示——移至操作台（相对 stage）
const promptStart = $('prompt-start');             // 提示——开始体验（相对 stage）
const promptConnBefore = $('prompt-connect-before');// 提示——连孔上钉·移动前
const promptConnAfter  = $('prompt-connect-after'); // 提示——连孔上钉·移动后
const out = $('out');
const orderPanel = $('order-panel');
const orderList = $('order-list');
const cupRow = $('cup-row');

let mode = 'components';
let cupWhich = 'before';       // 当前在编辑哪一套瓷杯位置
let currentNail = 0;
let showTrajectory = true, showHoles = true, showAch = true;
let handles = [];
let holeEls = [];
let achEls = {};
let baseEls = [];

const NAIL_COLORS = ['#3fbf6a', '#c43fbf'];

// ============== 工具 ==============
function setStyle(el, obj) { for (const k in obj) el.style[k] = obj[k]; }
function fmt(n) { return Math.round(n * 100) / 100; }

// 指针坐标 → 指定盒子的 % 坐标
function cupPt(ev) {
    const r = cupBox.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * 100, y: ((ev.clientY - r.top) / r.height) * 100 };
}
function playPt(ev) {
    const r = play.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * 100, y: ((ev.clientY - r.top) / r.height) * 100 };
}
function stagePt(ev) {
    const r = playStage.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * 100, y: ((ev.clientY - r.top) / r.height) * 100 };
}

// ============== 渲染：各钉底图（按 CONFIG.bases） ==============
function buildBases() {
    basesBox.innerHTML = '';
    baseEls = [];
    CONFIG.bases.forEach((b, i) => {
        const img = document.createElement('img');
        img.src = b.src;
        img.className = 'base';
        img.dataset.nail = String(i);
        basesBox.appendChild(img);
        baseEls.push(img);
    });
    applyBases();
}
function applyBases() {
    CONFIG.bases.forEach((b, i) => {
        const el = baseEls[i];
        if (!el) return;
        const p = b.pos;
        setStyle(el, {
            left: p.left + '%', top: p.top + '%', width: p.width + '%',
            aspectRatio: String(p.aspect), height: 'auto',
            display: 'block', opacity: '1',
        });
    });
}

// ============== 渲染：所有提示图（按 CONFIG.prompts） ==============
// 注意：除 connectLine 相对 #play 外，其余均相对 stage（play-stage）
function applyPrompts() {
    const P = CONFIG.prompts;
    // 移至操作台
    setStyle(promptMove, {
        width: P.move.width + '%', top: P.move.top + '%', left: P.move.left + '%',
        transform: 'translateX(-50%)',
    });
    // 开始体验
    setStyle(promptStart, {
        width: P.startExperience.width + '%', top: P.startExperience.top + '%', left: P.startExperience.left + '%',
        transform: 'translateX(-50%)',
    });
    // 连孔上钉·移动前
    setStyle(promptConnBefore, {
        width: P.connectBefore.width + '%', top: P.connectBefore.top + '%', left: P.connectBefore.left + '%',
        transform: 'translateX(-50%)',
        opacity: cupWhich === 'before' ? '1' : '0.35',
    });
    // 连孔上钉·移动后
    setStyle(promptConnAfter, {
        width: P.connectAfter.width + '%', top: P.connectAfter.top + '%', left: P.connectAfter.left + '%',
        transform: 'translateX(-50%)',
        opacity: cupWhich === 'after' ? '1' : '0.35',
    });
    // 上钉
    setStyle(promptNail, {
        width: P.nail.width + '%', top: P.nail.top + '%', left: P.nail.left + '%',
        transform: 'translateX(-50%)',
    });
    // 连线（相对 #play）
    setStyle(promptConnect, {
        width: P.connectLine.width + '%', top: P.connectLine.top + '%', left: P.connectLine.left + '%',
        transform: 'translateX(-50%)',
    });
}

// ============== 渲染：瓷杯盒位置（CONFIG.layout.cup[which]） ==============
// 与 nail.js 的 applyCupLayout(which) 完全一致
function applyCupLayout(which) {
    const c = CONFIG.layout.cup[which] || CONFIG.layout.cup.before;
    setStyle(cupBox, {
        position: 'absolute',
        left: c.left + '%',
        top: c.top + '%',
        height: c.height + '%',
        transform: 'translate(-50%, -50%)',
    });
}

// ============== 渲染：当前钉的孔位 ==============
function renderHoles() {
    holesBox.innerHTML = '';
    holeEls = [];
    if (!showHoles) return;
    const nail = CONFIG.nails[currentNail];
    nail.holes.forEach((h, i) => {
        const img = document.createElement('img');
        img.src = '/上钉/image/孔.png';
        img.className = 'hole';
        setStyle(img, {
            left: h.x + '%', top: h.y + '%',
            width: CONFIG.hole.width + '%',
            aspectRatio: String(CONFIG.hole.aspect),
            height: 'auto',
        });
        holesBox.appendChild(img);
        holeEls.push(img);
    });
}

// ============== 渲染：连线轨迹 ==============
function renderTrajectory() {
    cupSvg.innerHTML = '';
    if (!showTrajectory) return;
    const nail = CONFIG.nails[currentNail];
    nail.segments.forEach((seg) => {
        if (seg.length < 2) return;
        const pts = seg.map((idx) => ({ x: nail.holes[idx].x, y: nail.holes[idx].y }));
        const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + ' ' + fmt(p.x) + ' ' + fmt(p.y)).join(' ');
        const pl = document.createElementNS(SVG_NS, 'path');
        pl.setAttribute('d', d);
        pl.setAttribute('class', 'connect-line dim');
        cupSvg.appendChild(pl);
    });
}

function findHoleInSegments(nail, holeIdx) {
    for (let si = 0; si < nail.segments.length; si++) {
        const pi = nail.segments[si].indexOf(holeIdx);
        if (pi >= 0) return { si, pi };
    }
    return null;
}

// ============== 渲染：成就图层预览 ==============
function renderAchievementsPreview() {
    editAch.innerHTML = '';
    achEls = { nails: [], text: null };
    if (!showAch) return;
    const nail = CONFIG.nails[currentNail];
    const ach = nail.achievement;
    ach.nails.forEach((n, k) => {
        const nailImg = document.createElement('img');
        nailImg.src = n.src;
        nailImg.className = 'nail-ach';
        nailImg.dataset.idx = String(k);
        const np = n.pos;
        setStyle(nailImg, {
            position: 'absolute', width: np.width + '%',
            left: np.left + '%', top: np.top + '%',
            maxWidth: 'none', maxHeight: 'none', objectFit: 'contain',
            opacity: 0.6, display: 'block',
        });
        editAch.appendChild(nailImg);
        achEls.nails.push(nailImg);
    });

    const txt = document.createElement('div');
    txt.className = 'nail-text';
    const tp = ach.text.pos;
    setStyle(txt, {
        position: 'absolute',
        right: tp.right + '%', top: tp.top + '%',
        transform: `translateY(-50%) translateX(${tp.offsetX ?? -6}%)`,
        height: tp.height + '%',
        aspectRatio: String(tp.aspect),
        display: 'block',
    });
    const tImg = document.createElement('img');
    tImg.src = ach.text.src;
    setStyle(tImg, { width: '100%', height: '100%', objectFit: 'contain' });
    txt.appendChild(tImg);
    editAch.appendChild(txt);
    achEls.text = txt;
}

// ============== 手柄机制 ==============
function mkHandle(kind, label, getPos, onApply, boxForPt, borderColor) {
    const d = document.createElement('div');
    d.className = 'h ' + kind;
    d.textContent = label;
    if (borderColor) { d.style.borderColor = borderColor; d.style.background = borderColor; }
    const h = { el: d, getPos, onApply, boxForPt };
    d.addEventListener('pointerdown', (e) => onDown(e, h));
    hdBox.appendChild(d);
    handles.push(h);
    return h;
}
function clearHandles() { hdBox.innerHTML = ''; handles = []; }

function buildHandles() {
    clearHandles();
    if (mode === 'components') buildComponentHandles();
    else if (mode === 'holes') buildHoleHandles();
    else buildAchHandles();
    positionHandles();
}

// ---------- 组件模式手柄 ----------
function buildComponentHandles() {
    // 各钉底图：每个一组 move(B) + resize(R)，相对 cup-box
    CONFIG.bases.forEach((b, i) => {
        const p = b.pos;
        mkHandle('base-m', 'B', () => ({ x: p.left, y: p.top }),
            (x, y) => { p.left = x; p.top = y; applyBases(); update(); }, 'cup');
        mkHandle('base-r', 'R', () => ({ x: p.left + p.width, y: p.top }),
            (x) => { p.width = Math.max(3, x - p.left); applyBases(); update(); }, 'cup');
    });

    // 全局"提示——上钉"：移动 + 缩放（相对 stage）
    const pn = CONFIG.prompts.nail;
    mkHandle('comp', 'N', () => ({ x: pn.left, y: pn.top }),
        (x, y) => { pn.left = x; pn.top = y; applyPrompts(); update(); }, 'stage');
    mkHandle('comp-r', 'R', () => ({ x: pn.left + pn.width / 2, y: pn.top }),
        (x) => { pn.width = Math.max(3, (x - pn.left) * 2); applyPrompts(); update(); }, 'stage');

    // "提示——连线"：移动 + 缩放（相对 play，left 是中心 X）
    const pcl = CONFIG.prompts.connectLine;
    mkHandle('comp', '连', () => ({ x: pcl.left, y: pcl.top }),
        (x, y) => { pcl.left = x; pcl.top = y; applyPrompts(); update(); }, 'play');
    mkHandle('comp-r', 'R', () => ({ x: pcl.left + pcl.width / 2, y: pcl.top }),
        (x) => { pcl.width = Math.max(3, (x - pcl.left) * 2); applyPrompts(); update(); }, 'play');

    // "提示——移至操作台"：移动 + 缩放（相对 stage，left 是中心 X）
    const pm = CONFIG.prompts.move;
    mkHandle('comp', '移', () => ({ x: pm.left, y: pm.top }),
        (x, y) => { pm.left = x; pm.top = y; applyPrompts(); update(); }, 'stage');
    mkHandle('comp-r', 'R', () => ({ x: pm.left + pm.width / 2, y: pm.top }),
        (x) => { pm.width = Math.max(3, (x - pm.left) * 2); applyPrompts(); update(); }, 'stage');

    // "提示——开始体验"：移动 + 缩放（相对 stage）
    const pse = CONFIG.prompts.startExperience;
    mkHandle('comp', '体', () => ({ x: pse.left, y: pse.top }),
        (x, y) => { pse.left = x; pse.top = y; applyPrompts(); update(); }, 'stage', '#7adcb4');
    mkHandle('comp-r', 'R', () => ({ x: pse.left + pse.width / 2, y: pse.top }),
        (x) => { pse.width = Math.max(3, (x - pse.left) * 2); applyPrompts(); update(); }, 'stage', '#7adcb4');

    // "提示——连孔上钉·移动前"：移动 + 缩放（相对 stage）
    const pcb = CONFIG.prompts.connectBefore;
    mkHandle('comp', '连前', () => ({ x: pcb.left, y: pcb.top }),
        (x, y) => { pcb.left = x; pcb.top = y; applyPrompts(); update(); }, 'stage', '#ffb478');
    mkHandle('comp-r', 'R', () => ({ x: pcb.left + pcb.width / 2, y: pcb.top }),
        (x) => { pcb.width = Math.max(3, (x - pcb.left) * 2); applyPrompts(); update(); }, 'stage', '#ffb478');

    // "提示——连孔上钉·移动后"：移动 + 缩放（相对 stage）
    const pca = CONFIG.prompts.connectAfter;
    mkHandle('comp', '连后', () => ({ x: pca.left, y: pca.top }),
        (x, y) => { pca.left = x; pca.top = y; applyPrompts(); update(); }, 'stage', '#ff7996');
    mkHandle('comp-r', 'R', () => ({ x: pca.left + pca.width / 2, y: pca.top }),
        (x) => { pca.width = Math.max(3, (x - pca.left) * 2); applyPrompts(); update(); }, 'stage', '#ff7996');

    // 瓷杯盒 before：移动 + 缩放高度（中心点 + 底边中点）
    const cb = CONFIG.layout.cup.before;
    mkHandle('cup-m', '杯前', () => ({ x: cb.left, y: cb.top }),
        (x, y) => { cb.left = x; cb.top = y; if (cupWhich === 'before') applyCupLayout('before'); update(); }, 'play', '#5a7fbf');
    mkHandle('cup-r', 'R', () => ({ x: cb.left, y: cb.top + cb.height / 2 }),
        (_x, y) => { cb.height = Math.max(20, 2 * (y - cb.top)); if (cupWhich === 'before') applyCupLayout('before'); update(); }, 'play', '#3a5a8f');

    // 瓷杯盒 after：移动 + 缩放高度
    const ca = CONFIG.layout.cup.after;
    mkHandle('cup-m', '杯后', () => ({ x: ca.left, y: ca.top }),
        (x, y) => { ca.left = x; ca.top = y; if (cupWhich === 'after') applyCupLayout('after'); update(); }, 'play', '#3fbfc8');
    mkHandle('cup-r', 'R', () => ({ x: ca.left, y: ca.top + ca.height / 2 }),
        (_x, y) => { ca.height = Math.max(20, 2 * (y - ca.top)); if (cupWhich === 'after') applyCupLayout('after'); update(); }, 'play', '#1f8f98');
}

// ---------- 孔模式手柄 ----------
function buildHoleHandles() {
    const nail = CONFIG.nails[currentNail];
    const color = NAIL_COLORS[currentNail];
    nail.holes.forEach((h, i) => {
        const info = findHoleInSegments(nail, i);
        const label = info ? `${info.si + 1}.${info.pi + 1}` : '—';
        const handle = mkHandle('hole-m', label,
            () => ({ x: h.x, y: h.y }),
            (x, y) => { h.x = x; h.y = y; renderHoles(); renderTrajectory(); update(); updateOrderList(); },
            'cup');
        handle.el.style.borderColor = color;
    });
}

// ---------- 成就模式手柄 ----------
function buildAchHandles() {
    const nail = CONFIG.nails[currentNail];
    const ach = nail.achievement;
    ach.nails.forEach((n, k) => {
        const np = n.pos;
        mkHandle('ach-m', 'N' + (k + 1), () => ({ x: np.left, y: np.top }),
            (x, y) => { np.left = x; np.top = y; renderAchievementsPreview(); update(); }, 'cup');
        mkHandle('ach-r', 'R', () => ({ x: np.left + np.width, y: np.top }),
            (x) => { np.width = Math.max(3, x - np.left); renderAchievementsPreview(); update(); }, 'cup');
    });

    const tp = ach.text.pos;
    const centerPt = () => ({ x: 100 - tp.right, y: tp.top });
    const applyCenter = (x, y) => {
        tp.right = 100 - x;
        tp.top = y;
        renderAchievementsPreview(); update();
    };
    const heightPt = () => ({ x: 100 - tp.right, y: tp.top + tp.height / 2 });
    const applyHeight = (_x, y) => {
        tp.height = Math.max(4, 2 * (y - tp.top));
        renderAchievementsPreview(); update();
    };
    mkHandle('text-m', 'T', centerPt, applyCenter, 'cup');
    mkHandle('text-r', 'H', heightPt, applyHeight, 'cup');
}

function positionHandles() {
    handles.forEach((h) => {
        const p = h.getPos();
        let hdR;
        if (!h.boxForPt || h.boxForPt === 'cup') hdR = cupBox.getBoundingClientRect();
        else if (h.boxForPt === 'play') hdR = play.getBoundingClientRect();
        else if (h.boxForPt === 'stage') hdR = playStage.getBoundingClientRect();
        else hdR = cupBox.getBoundingClientRect();

        const cupR = cupBox.getBoundingClientRect();
        const absX = hdR.left + p.x / 100 * hdR.width;
        const absY = hdR.top + p.y / 100 * hdR.height;
        const hostX = (absX - cupR.left) / cupR.width * 100;
        const hostY = (absY - cupR.top) / cupR.height * 100;
        h.el.style.left = hostX + '%';
        h.el.style.top = hostY + '%';
    });
}
window.addEventListener('resize', positionHandles);

// ============== 拖拽 ==============
function onDown(e, h) {
    e.preventDefault();
    e.stopPropagation();
    const pid = e.pointerId;
    try { h.el.setPointerCapture(pid); } catch (err) {}
    const toXY = (ev) => {
        if (!h.boxForPt || h.boxForPt === 'cup') return cupPt(ev);
        if (h.boxForPt === 'play') return playPt(ev);
        if (h.boxForPt === 'stage') return stagePt(ev);
        return cupPt(ev);
    };
    const move = (ev) => {
        if (ev.pointerId !== pid) return;
        const pt = toXY(ev);
        h.onApply(pt.x, pt.y);
        positionHandles();
    };
    const up = (ev) => {
        if (ev.pointerId !== pid) return;
        try { h.el.releasePointerCapture(pid); } catch (err) {}
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
}

// ============== 段落编辑面板 ==============
function updateOrderList() {
    const nail = CONFIG.nails[currentNail];
    orderList.innerHTML = '';
    nail.holes.forEach((h, i) => {
        const info = findHoleInSegments(nail, i);
        const segTxt = info
            ? `段 ${info.si + 1} · 第 ${info.pi + 1} 位`
            : `未在连线中`;
        const row = document.createElement('div');
        row.className = 'order-row';
        const lbl = document.createElement('span');
        lbl.textContent = `孔 ${i + 1} (${fmt(h.x)}, ${fmt(h.y)}) · ${segTxt}`;
        row.appendChild(lbl);

        const btnSplit = document.createElement('button');
        btnSplit.textContent = '此后开新段';
        btnSplit.title = '把此孔之后的同段部分拆为新段';
        btnSplit.disabled = !info || info.pi === nail.segments[info.si].length - 1;
        btnSplit.addEventListener('click', () => splitSegmentAfterHole(i));
        row.appendChild(btnSplit);

        const btnMerge = document.createElement('button');
        btnMerge.textContent = '并入上段';
        btnMerge.title = '把此孔并入上一段末尾';
        btnMerge.disabled = !info || info.si === 0;
        btnMerge.addEventListener('click', () => mergeHoleToPrevSegment(i));
        row.appendChild(btnMerge);
        orderList.appendChild(row);
    });
}

function splitSegmentAfterHole(holeIdx) {
    const nail = CONFIG.nails[currentNail];
    const info = findHoleInSegments(nail, holeIdx);
    if (!info) return;
    const seg = nail.segments[info.si];
    if (info.pi === seg.length - 1) return;
    const head = seg.slice(0, info.pi + 1);
    const tail = seg.slice(info.pi + 1);
    nail.segments.splice(info.si, 1, head, tail);
    renderTrajectory(); buildHandles(); update(); updateOrderList();
}

function mergeHoleToPrevSegment(holeIdx) {
    const nail = CONFIG.nails[currentNail];
    const info = findHoleInSegments(nail, holeIdx);
    if (!info || info.si === 0) return;
    const cur = nail.segments[info.si];
    cur.splice(info.pi, 1);
    nail.segments[info.si - 1].push(holeIdx);
    if (cur.length === 0) nail.segments.splice(info.si, 1);
    renderTrajectory(); buildHandles(); update(); updateOrderList();
}

// ============== 输出 CONFIG 片段 ==============
function update() {
    const T = CONFIG.timings;
    const Pr = CONFIG.prompts;
    const L = CONFIG.layout;
    const Cb = L.cup.before, Ca = L.cup.after;

    const basesTxt = CONFIG.bases.map((b) => {
        const p = b.pos;
        return `        { src: '${b.src}',\n          pos: { left: ${fmt(p.left)}, top: ${fmt(p.top)}, width: ${fmt(p.width)}, aspect: ${p.aspect} } }`;
    }).join(',\n');

    const nailsTxt = CONFIG.nails.map((n) => {
        const holesTxt = n.holes.map((h) =>
            `                { x: ${fmt(h.x)}, y: ${fmt(h.y)} }`).join(',\n');
        const segTxt = n.segments.map(seg => '[' + seg.map(x => String(x)).join(', ') + ']').join(', ');
        const nailsAchTxt = n.achievement.nails.map((na) => {
            const np = na.pos;
            return `                    { src: '${na.src}',\n                      pos: { width: ${fmt(np.width)}, left: ${fmt(np.left)}, top: ${fmt(np.top)} }, initialScale: ${na.initialScale || 1.5} }`;
        }).join(',\n');
        const tp = n.achievement.text.pos;
        const lines = [
            `        {`,
            `            method: '${n.method}',`,
            `            holes: [`,
            holesTxt,
            `            ],`,
            `            segments: [${segTxt}],`,
            `            achievement: {`,
            `                nails: [`,
            nailsAchTxt,
            `                ],`,
            `                text: { src: '${n.achievement.text.src}',`,
            `                        pos: { right: ${fmt(tp.right)}, top: ${fmt(tp.top)}, height: ${fmt(tp.height)}, offsetX: ${fmt(tp.offsetX ?? -6)}, aspect: ${tp.aspect} } },`,
            `            },`,
            `        }`
        ];
        return lines.join('\n');
    }).join(',\n');

    out.value =
`    timings: {
        lightUpMs: ${T.lightUpMs}, moveShowMs: ${T.moveShowMs}, moveFadeMs: ${T.moveFadeMs},
        slideInMs: ${T.slideInMs}, slideFadeMs: ${T.slideFadeMs}, startExpFadeMs: ${T.startExpFadeMs}, connectFadeMs: ${T.connectFadeMs},
        connectBlinkMs: ${T.connectBlinkMs}, connectBlinks: ${T.connectBlinks}, cupMoveMs: ${T.cupMoveMs}, connectReplaceMs: ${T.connectReplaceMs},
        baseFadeMs: ${T.baseFadeMs}, baseGapMs: ${T.baseGapMs}, nailAppearMs: ${T.nailAppearMs}, nailShrinkMs: ${T.nailShrinkMs},
        textFadeMs: ${T.textFadeMs}, textShowMs: ${T.textShowMs}, textFadeOutMs: ${T.textFadeOutMs}, nailSemiMs: ${T.nailSemiMs},
        connectLineFadeMs: ${T.connectLineFadeMs}, holeGapMs: ${T.holeGapMs},
    },
    layout: {
        heightRatio: ${L.heightRatio.toFixed(2)},
        cup: {
            before: { left: ${fmt(Cb.left)}, top: ${fmt(Cb.top)}, height: ${fmt(Cb.height)} },
            after:  { left: ${fmt(Ca.left)}, top: ${fmt(Ca.top)}, height: ${fmt(Ca.height)} },
        },
    },
    bases: [
${basesTxt}
    ],
    prompts: {
        move:            { width: ${fmt(Pr.move.width)}, top: ${fmt(Pr.move.top)}, left: ${fmt(Pr.move.left)} },
        startExperience: { width: ${fmt(Pr.startExperience.width)}, top: ${fmt(Pr.startExperience.top)}, left: ${fmt(Pr.startExperience.left)} },
        connectBefore:   { width: ${fmt(Pr.connectBefore.width)}, top: ${fmt(Pr.connectBefore.top)}, left: ${fmt(Pr.connectBefore.left)} },
        connectAfter:    { width: ${fmt(Pr.connectAfter.width)}, top: ${fmt(Pr.connectAfter.top)}, left: ${fmt(Pr.connectAfter.left)} },
        nail:            { width: ${fmt(Pr.nail.width)}, top: ${fmt(Pr.nail.top)}, left: ${fmt(Pr.nail.left)} },
        connectLine:     { width: ${fmt(Pr.connectLine.width)}, top: ${fmt(Pr.connectLine.top)}, left: ${fmt(Pr.connectLine.left)} },
    },
    hole: { width: ${fmt(CONFIG.hole.width)}, aspect: ${CONFIG.hole.aspect}, zoneRadius: ${fmt(CONFIG.hole.zoneRadius)} },
    target: { width: ${fmt(CONFIG.target.width)} },
    nails: [
${nailsTxt}
    ],
    nailOrder: ['梅花钉', '柳叶钉'],`;
}

// ============== 隐藏/显示控制面板 ==============
$('hide-panel').addEventListener('click', () => {
    const ctrl = $('ctrl');
    ctrl.classList.add('hidden');
    $('show-panel').classList.add('show');
    setTimeout(positionHandles, 200);
});
$('show-panel').addEventListener('click', () => {
    const ctrl = $('ctrl');
    ctrl.classList.remove('hidden');
    $('show-panel').classList.remove('show');
    setTimeout(positionHandles, 200);
});

// ============== 控件事件 ==============
$('seg-mode').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-mode]');
    if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(e.currentTarget.querySelectorAll('button'), (x) => x.classList.toggle('active', x === b));
    // 瓷杯位置切换仅在 components 模式可见
    cupRow.style.display = (mode === 'components') ? '' : 'none';
    $('nail-row').style.display = (mode === 'holes' || mode === 'achievements') ? '' : 'none';
    orderPanel.style.display = (mode === 'holes') ? '' : 'none';
    if (mode === 'holes') { renderHoles(); renderTrajectory(); updateOrderList(); }
    if (mode === 'achievements') renderAchievementsPreview();
    if (mode === 'components') { /* hide hole/ach previews */ }
    buildHandles();
    update();
});

// 瓷杯位置切换：before / after
$('seg-cup').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cup]');
    if (!b) return;
    cupWhich = b.dataset.cup;
    Array.prototype.forEach.call(e.currentTarget.querySelectorAll('button'), (x) => x.classList.toggle('active', x === b));
    applyCupLayout(cupWhich);
    applyPrompts();   // 切换 before/after 时提示图透明度也变（高亮当前那套）
    buildHandles();
});

$('seg-nail').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-nail]');
    if (!b) return;
    currentNail = parseInt(b.dataset.nail, 10);
    Array.prototype.forEach.call(e.currentTarget.querySelectorAll('button'), (x) => x.classList.toggle('active', x === b));
    if (mode === 'holes') { renderHoles(); renderTrajectory(); updateOrderList(); }
    if (mode === 'achievements') renderAchievementsPreview();
    buildHandles();
    update();
});

$('t-trajectory').addEventListener('click', (e) => {
    showTrajectory = !showTrajectory;
    e.target.textContent = showTrajectory ? '隐藏连线轨迹' : '显示连线轨迹';
    renderTrajectory();
});
$('t-holes').addEventListener('click', (e) => {
    showHoles = !showHoles;
    e.target.textContent = showHoles ? '隐藏孔位' : '显示孔位';
    renderHoles();
});
$('t-ach').addEventListener('click', (e) => {
    showAch = !showAch;
    e.target.textContent = showAch ? '隐藏成就预览' : '显示成就预览';
    if (mode === 'achievements') renderAchievementsPreview();
    else editAch.innerHTML = '';
});

$('order-reset').addEventListener('click', () => {
    const nail = CONFIG.nails[currentNail];
    nail.segments = [nail.holes.map((_, i) => i)];
    renderTrajectory(); buildHandles(); update(); updateOrderList();
});
$('order-reverse').addEventListener('click', () => {
    const nail = CONFIG.nails[currentNail];
    nail.segments = nail.segments.map(seg => seg.slice().reverse());
    renderTrajectory(); buildHandles(); update(); updateOrderList();
});

$('copy').addEventListener('click', () => {
    out.select();
    const txt = out.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => flash('已复制 CONFIG 片段'),
                                                () => flash('复制失败，请手动选中'));
    } else { flash('复制失败，请手动选中 textarea'); }
});
function flash(msg) {
    const b = $('copy'); const old = b.textContent;
    b.textContent = msg; setTimeout(() => { b.textContent = old; }, 1400);
}

// ============== 启动 ==============
applyCupLayout(cupWhich);
buildBases();
applyPrompts();
renderHoles();
renderTrajectory();
renderAchievementsPreview();
buildHandles();
update();
setTimeout(() => { positionHandles(); }, 350);

})();
