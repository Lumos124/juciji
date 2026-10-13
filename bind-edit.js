/* ============================================================
   绑扎定型 · 可视化编辑器
   四种模式：
     components → 所有 PNG 组件（背景/提示/四瓣花/底图/滑动icon/瓷杯/面板/起终点大小）
     paths      → 5 条路径的起点/终点/曲线控制点
     highlights → 5 张高亮图的平移与缩放
     slots      → 成就槽位：外壳/每个图层/文字横幅
   输出 CONFIG 片段（layout/components/paths/highlights/slots）贴回 bind.js
   ============================================================ */
(function () {
'use strict';

// ============== 与 bind.js 顶部 CONFIG 结构保持一致的副本 ==============
const CONFIG = {
    layout: { heightRatio: 0.76 },
    components: {
        background: { src: '/绑扎/image/操作台背景.webp', left:0, top:0, width:100, height:100 },
        promptMove: { src: '/绑扎/image/提示——移至操作台 .png', left:4.9, top:64.5, width:87.56, height:29.08 },
        promptStart: { src: '/绑扎/image/提示——开始绑扎定型.webp', left:22.05, top:67.5, width:12.87, offsetX:-50, offsetY:-50 },
        flower: { src: '/绑扎/image/四瓣花.webp', left:28.37, top:48.04, width:60, offsetX:-50, offsetY:-50, scaleStart:0.3, scalePeak:1.6, animDuration:1800 },
        bottomImgs: {
            jing: { src: '/绑扎/image/井底图.webp', left:73.6, top:7.63, width:23.11 },
            shi:  { src: '/绑扎/image/十底图.webp', left:70.09, top:30.94, width:26.09 },
            rao:  { src: '/绑扎/image/绕底图.webp', left:73.05, top:55.02, width:22.71 },
        },
        slideIcon: { src: '/绑扎/image/提示——滑动icon.webp', left:8, top:8.7, width:70.42, slideDuration:1200 },
        cup: { src: '/绑扎/image/瓷杯底图.webp', left:2, top:4, height:97.49, aspect:1.093178519593614 },
        panel: { left:73.37, top:-1.2, height:84.89, aspect:0.5830572645527686 },
        endpoints: {
            start: { src: '/绑扎/image/提示——起点.webp', width:8.5 },
            end: { src: '/绑扎/image/提示——终点.png', width:11 },
        },
    },
    pathStyle: {
        color: '#ff827b', opacity: 1, width: 2.4, dash: '6 5', zoneRadius: 10,
        startWidthRatio: 0.55, endWidthRatio: 0.75,
    },
    highlight: {
        gold: '#e6c886', restOpacity: 0.92, glowPx: 18,
    },
    paths: [
        { id:1, method:'井字', type: 'line', sx:44.03, sy:15.29, ex:68.9, ey:52.01 },
        { id:2, method:'井字', type: 'line', sx:82.68, sy:21.97, ex:10.93, ey:35.61 },
        { id:3, method:'十字', type: 'curve', sx:23.9, sy:51.65, qx:52.11, qy:74.02, ex:77.62, ey:52.99 },
        { id:4, method:'十字', type: 'line', sx:57.98, sy:56.11, ex:50.96, ey:86.59 },
        { id:5, method:'绕底', type: 'arc', cx:49.99, cy:71.43, rx:14.68, ry:7 }
    ],
    highlights: {
        1: { left:17.29, top:-0.22, width:73.3, aspect:0.7954841511072515 },
        2: { left:-0.24, top:0.85, width:100.61, aspect:1.1061674008810574 },
        3: { left:12.56, top:37.21, width:84.47, aspect:2.5903614457831323 },
        4: { left:35.47, top:43.72, height:48.84, aspect:0.7016918967052538 },
        5: { left:30.5, top:67.96, width:34, aspect:2.422222222222222 }
    },
    slots: [
        {
            method: '井字', top: 10.18, height: 31,
            slotBox: { left: 6.94, right: 5 },
            achievement: { layers: [
                    { src: '/绑扎/image/成就——井字绑扎.webp', pos: { width:113.45, left:-18.52, top:1.65 } }
            ] },
            text: { layers: [
                { src: '/绑扎/image/成就——井字绑扎文字1.png', pos: { right: 120.89, top: 80.29, height: 187.21, offsetX: -6, aspect: 0.4646853146853147 } },
                { src: '/绑扎/image/成就——井字绑扎文字2.png', pos: { right: 127.03, top: 172.88, height: 133.34, offsetX: -6, aspect: 0.4646853146853147 } }
            ] },
        },
        {
            method: '十字', top: 43.52, height: 30,
            slotBox: { left: -6.63, right: 5 },
            achievement: { layers: [
                    { src: '/绑扎/image/成就——十字绑扎.webp', pos: { width:93.75, left:0.24, top:-11.64 } }
            ] },
            text: { layers: [
                { src: '/绑扎/image/成就——十字绑扎文字1.png', pos: { right: 97.03, top: -30.29, height: 200.24, offsetX: -6, aspect: 0.4646853146853147 } },
                { src: '/绑扎/image/成就——十字绑扎文字2.png', pos: { right: 108.71, top: 64.65, height: 140.24, offsetX: -6, aspect: 0.4646853146853147 } }
            ] },
        },
        {
            method: '绕底', top: 77.19, height: 31,
            slotBox: { left: -15.3, right: 5 },
            achievement: { layers: [
                    { src: '/绑扎/image/成就——绕底绑扎.webp', pos: { width:86.75, right:31.3, top:-19.33 } }
            ] },
            text: { layers: [
                { src: '/绑扎/image/成就——绕底绑扎文字1.png', pos: { right: 95.03, top: -140.29, height: 180.24, offsetX: -6, aspect: 0.4646853146853147 } },
                { src: '/绑扎/image/成就——绕底绑扎文字2.png', pos: { right: 100.21, top: -40.89, height: 140.24, offsetX: -6, aspect: 0.4646853146853147 } }
            ] },
        }
    ],
    methodOrder: ['井字', '十字', '绕底'],
};

const $ = (id) => document.getElementById(id);
const SVG_NS = 'http://www.w3.org/2000/svg';
const stage = $('stage');
const tableBg = $('table-bg');
const promptMove = $('prompt-move');
const promptStart = $('prompt-start');
const flowerEl = $('flower');
const bottomJing = $('bottom-jing');
const bottomShi = $('bottom-shi');
const bottomRao = $('bottom-rao');
const slideIcon = $('slide-icon');
const play = $('play');
const cupBox = $('cup-box');
const panelBox = $('panel-box');
const cupImg = $('cup');
const cupSvg = $('cup-svg');
const hlBox = $('highlights');
const hdBox = $('handles');
const endpointsBox = $('endpoints');
const slotsBox = $('edit-slots');
const out = $('out');
const ctrl = $('ctrl');

let mode = 'components';   // 'components' | 'paths' | 'highlights' | 'slots'
let currentSlot = 0;
let showPath = true, showHl = true, showComp = true, showGrid = false;
let handles = [];
let hlEls = {};

const PATH_COLORS = ['#3fbf6a', '#e0596b', '#3a86c8', '#c98a3a', '#8a3ac9'];

const hl4Row = $('hl4-row');
const slotRow = $('slot-row');
const compRow = $('comp-row');

// 组件顺序与手柄编号一一对应
const COMP_DEFS = [
    { key: 'background', el: tableBg, box: stage, mode: 'box' },
    { key: 'promptMove', el: promptMove, box: stage, mode: 'box' },
    { key: 'promptStart', el: promptStart, box: stage, mode: 'center' },
    { key: 'flower', el: flowerEl, box: stage, mode: 'center' },
    { key: 'bottomJing', el: bottomJing, box: stage, mode: 'corner' },
    { key: 'bottomShi', el: bottomShi, box: stage, mode: 'corner' },
    { key: 'bottomRao', el: bottomRao, box: stage, mode: 'corner' },
    { key: 'slideIcon', el: slideIcon, box: stage, mode: 'corner' },
    { key: 'cup', el: cupBox, box: play, mode: 'height' },
    { key: 'panel', el: panelBox, box: play, mode: 'height' },
];

/* ============== 工具 ============== */
function setStyle(el, obj) { for (const k in obj) el.style[k] = obj[k]; }
function fmt(n) { return Math.round(n * 100) / 100; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function bust(src) { return src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + Date.now(); }

function toXY(ev, box) {
    const r = box.getBoundingClientRect();
    return {
        x: ((ev.clientX - r.left) / r.width) * 100,
        y: ((ev.clientY - r.top) / r.height) * 100,
    };
}
function boxToStage(x, y, box) {
    const r = box.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    return {
        x: ((r.left + x / 100 * r.width) - sr.left) / sr.width * 100,
        y: ((r.top + y / 100 * r.height) - sr.top) / sr.height * 100,
    };
}

function pathStart(p) {
    if (p.type === 'arc') return { x: p.cx - p.rx, y: p.cy };
    return { x: p.sx, y: p.sy };
}
function pathEnd(p) {
    if (p.type === 'arc') return { x: p.cx + p.rx, y: p.cy };
    return { x: p.ex, y: p.ey };
}

/* ============== 应用组件布局（含起终点预览） ============== */
function applyComponents() {
    const c = CONFIG.components;
    const pos = (el, cfg) => setStyle(el, {
        left: cfg.left + '%',
        top: cfg.top + '%',
        width: cfg.width + '%',
        height: (cfg.height !== undefined) ? cfg.height + '%' : 'auto',
    });

    if (c.background.src) tableBg.src = bust(c.background.src);
    pos(tableBg, c.background);
    tableBg.style.objectFit = 'cover';

    if (c.promptMove.src) promptMove.src = bust(c.promptMove.src);
    pos(promptMove, c.promptMove);
    promptMove.style.objectFit = 'cover';

    if (c.promptStart.src) promptStart.src = bust(c.promptStart.src);
    pos(promptStart, c.promptStart);
    promptStart.style.transform = `translate(${c.promptStart.offsetX ?? -50}%, ${c.promptStart.offsetY ?? -50}%)`;

    if (c.flower.src) flowerEl.src = bust(c.flower.src);
    pos(flowerEl, c.flower);
    flowerEl.style.transform = `translate(${c.flower.offsetX ?? -50}%, ${c.flower.offsetY ?? -50}%)`;

    if (c.bottomImgs.jing.src) bottomJing.src = bust(c.bottomImgs.jing.src);
    pos(bottomJing, c.bottomImgs.jing);
    if (c.bottomImgs.shi.src) bottomShi.src = bust(c.bottomImgs.shi.src);
    pos(bottomShi, c.bottomImgs.shi);
    if (c.bottomImgs.rao.src) bottomRao.src = bust(c.bottomImgs.rao.src);
    pos(bottomRao, c.bottomImgs.rao);

    if (c.slideIcon.src) slideIcon.src = bust(c.slideIcon.src);
    pos(slideIcon, c.slideIcon);
    slideIcon.style.transform = 'none';

    if (c.cup.src) cupImg.src = bust(c.cup.src);
    setStyle(cupBox, {
        position: 'absolute',
        left: c.cup.left + '%',
        top: c.cup.top + '%',
        height: c.cup.height + '%',
        aspectRatio: String(c.cup.aspect),
        width: 'auto',
    });
    setStyle(panelBox, {
        position: 'absolute',
        left: c.panel.left + '%',
        top: c.panel.top + '%',
        height: c.panel.height + '%',
        aspectRatio: String(c.panel.aspect),
        width: 'auto',
    });

    renderEndpoints();
    applyCompVisibility();
}

function applyCompVisibility() {
    COMP_DEFS.forEach((def) => {
        def.el.style.visibility = showComp ? '' : 'hidden';
    });
}

function renderEndpoints() {
    endpointsBox.innerHTML = '';
    CONFIG.paths.forEach((p) => {
        const s = pathStart(p), e = pathEnd(p);
        mkEndpoint('start', s.x, s.y);
        mkEndpoint('end', e.x, e.y);
    });
}
function mkEndpoint(cls, x, y) {
    const cfg = CONFIG.components.endpoints[cls];
    const d = document.createElement('div');
    d.className = 'endpoint ' + cls;
    d.style.backgroundImage = `url('${bust(cfg.src)}')`;
    d.style.width = cfg.width + '%';
    d.style.left = x + '%';
    d.style.top = y + '%';
    endpointsBox.appendChild(d);
}

/* ============== 路径 / 网格 ============== */
function drawGrid() {
    for (const v of [25, 50, 75]) {
        const l = document.createElementNS(SVG_NS, 'line');
        l.setAttribute('x1', v); l.setAttribute('y1', 0); l.setAttribute('x2', v); l.setAttribute('y2', 100);
        l.setAttribute('stroke', 'rgba(255,255,255,0.18)'); l.setAttribute('stroke-width', 0.3);
        cupSvg.appendChild(l);
        const l2 = document.createElementNS(SVG_NS, 'line');
        l2.setAttribute('x1', 0); l2.setAttribute('y1', v); l2.setAttribute('x2', 100); l2.setAttribute('y2', v);
        l2.setAttribute('stroke', 'rgba(255,255,255,0.18)'); l2.setAttribute('stroke-width', 0.3);
        cupSvg.appendChild(l2);
    }
}
function drawPaths() {
    cupSvg.innerHTML = '';
    if (showGrid) drawGrid();
    if (!showPath) return;
    CONFIG.paths.forEach((p, i) => {
        let el;
        const stroke = PATH_COLORS[i % PATH_COLORS.length];
        if (p.type === 'arc') {
            el = document.createElementNS(SVG_NS, 'ellipse');
            el.setAttribute('cx', p.cx); el.setAttribute('cy', p.cy);
            el.setAttribute('rx', p.rx); el.setAttribute('ry', p.ry);
        } else if (p.type === 'curve') {
            el = document.createElementNS(SVG_NS, 'path');
            el.setAttribute('d', `M ${p.sx} ${p.sy} Q ${p.qx} ${p.qy} ${p.ex} ${p.ey}`);
            const hl = document.createElementNS(SVG_NS, 'path');
            hl.setAttribute('d', `M ${p.sx} ${p.sy} L ${p.qx} ${p.qy} L ${p.ex} ${p.ey}`);
            hl.setAttribute('fill', 'none');
            hl.setAttribute('stroke', stroke);
            hl.setAttribute('stroke-opacity', 0.25);
            hl.setAttribute('stroke-dasharray', '2 4');
            hl.setAttribute('stroke-width', 0.5);
            cupSvg.appendChild(hl);
        } else {
            el = document.createElementNS(SVG_NS, 'line');
            el.setAttribute('x1', p.sx); el.setAttribute('y1', p.sy);
            el.setAttribute('x2', p.ex); el.setAttribute('y2', p.ey);
        }
        el.setAttribute('class', 'tip-path');
        el.style.stroke = stroke;
        cupSvg.appendChild(el);
    });
}

/* ============== 高亮 ============== */
function drawHighlights() {
    hlBox.innerHTML = '';
    hlEls = {};
    CONFIG.paths.forEach((p) => {
        const cfg = CONFIG.highlights[p.id];
        const img = document.createElement('img');
        img.src = bust(`/绑扎/image/高亮${p.id}.webp`);
        img.className = 'highlight';
        img.dataset.id = p.id;
        if (!showHl) img.style.display = 'none';
        applyHighlight(img, cfg);
        hlBox.appendChild(img);
        hlEls[p.id] = img;
    });
}
function applyHighlight(img, cfg) {
    img.style.position = 'absolute';
    img.style.aspectRatio = String(cfg.aspect);
    img.style.transform = '';
    if (cfg.width !== undefined) {
        img.style.left = cfg.left + '%';
        img.style.top = cfg.top + '%';
        img.style.width = cfg.width + '%';
        img.style.height = 'auto';
    } else {
        img.style.top = cfg.top + '%';
        img.style.height = cfg.height + '%';
        img.style.width = 'auto';
        if (cfg.centerX) {
            img.style.left = '50%';
            img.style.transform = 'translateX(-50%)';
        } else {
            img.style.left = (cfg.left || 0) + '%';
        }
    }
}

/* ============== 成就面板预览 ============== */
function renderSlotsPreview() {
    slotsBox.innerHTML = '';
    CONFIG.slots.forEach((slot, idx) => {
        const sb = slot.slotBox || { left: 5, right: 5 };
        const wrap = document.createElement('div');
        wrap.dataset.slotIdx = String(idx);
        Object.assign(wrap.style, {
            position: 'absolute',
            top: slot.top + '%', height: slot.height + '%',
            left: sb.left + '%', right: sb.right + '%',
            outline: idx === currentSlot && mode === 'slots' ? '1px dashed #e6c886' : '1px dashed rgba(233,220,192,0.25)',
            boxSizing: 'border-box',
        });

        const ach = document.createElement('div');
        ach.className = 'ach-preview';
        Object.assign(ach.style, {
            position: 'relative', width: '100%', height: '100%',
            display: 'block',
        });
        (slot.achievement?.layers || []).forEach((ly) => {
            const im = document.createElement('img');
            im.src = bust(ly.src);
            const pos = ly.pos || { width: 96, left: 2, top: 2 };
            Object.assign(im.style, {
                position: 'absolute', width: pos.width + '%',
                left: (pos.left ?? 0) + '%', top: (pos.top ?? 0) + '%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px rgba(230,200,134,0.5))',
            });
            ach.appendChild(im);
        });
        wrap.appendChild(ach);

        const t = slot.text || {};
        const textLayers = (t.layers && t.layers.length) ? t.layers : (t.src ? [{ src: t.src, pos: t.pos }] : []);
        wrap._textEls = [];
        textLayers.forEach((ly, li) => {
            const tp = ly.pos || { right: 104, top: 50, height: 96, offsetX: -6, aspect: 1329 / 2860 };
            const txt = document.createElement('div');
            Object.assign(txt.style, {
                position: 'absolute',
                right: tp.right + '%',
                top: tp.top + '%',
                transform: `translateY(-50%) translateX(${tp.offsetX ?? -6}%)`,
                height: tp.height + '%',
                aspectRatio: String(tp.aspect ?? (1329 / 2860)),
                outline: idx === currentSlot && mode === 'slots' ? '1px dashed #b76ed0' : '1px dashed rgba(183,110,208,0.25)',
                opacity: li === 0 ? 0.85 : 0.55,
            });
            const tim = document.createElement('img');
            tim.src = bust(ly.src);
            Object.assign(tim.style, { width: '100%', height: '100%', objectFit: 'contain' });
            txt.appendChild(tim);
            wrap.appendChild(txt);
            wrap._textEls.push(txt);
        });

        wrap._achEl = ach;
        (slot.achievement?.layers || []).forEach((_, i) => { ach.children[i]._lyIdx = i; });
        slotsBox.appendChild(wrap);
    });
}

/* ============== 手柄 ============== */
function mkHandle(kind, label, getPos, onApply, box) {
    const d = document.createElement('div');
    d.className = 'h ' + kind;
    d.textContent = label;
    const h = { el: d, getPos, onApply, box };
    d.addEventListener('pointerdown', (e) => onDown(e, h));
    hdBox.appendChild(d);
    handles.push(h);
    return h;
}
function onDown(e, h) {
    e.preventDefault();
    e.stopPropagation();
    const pid = e.pointerId;
    try { h.el.setPointerCapture(pid); } catch (err) {}
    const move = (ev) => {
        if (ev.pointerId !== pid) return;
        const pt = toXY(ev, h.box);
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
function positionHandles() {
    handles.forEach((h) => {
        const p = h.getPos();
        const abs = boxToStage(p.x, p.y, h.box);
        h.el.style.left = abs.x + '%';
        h.el.style.top = abs.y + '%';
    });
}
function buildHandles() {
    hdBox.innerHTML = '';
    handles = [];
    if (mode === 'components') buildComponentHandles();
    else if (mode === 'paths') buildPathHandles();
    else if (mode === 'highlights') buildHighlightHandles();
    else buildSlotHandles();
    positionHandles();
}

/* ---------- 组件模式手柄 ---------- */
function buildComponentHandles() {
    COMP_DEFS.forEach((def, i) => {
        const cfg = def.key.indexOf('bottom') === 0
            ? CONFIG.components.bottomImgs[def.key.replace('bottom', '').toLowerCase()]
            : CONFIG.components[def.key];
        const box = def.box;
        const n = i + 1;

        mkHandle('comp-m', 'M' + n, () => ({ x: cfg.left, y: cfg.top }),
            (x, y) => {
                cfg.left = clamp(x, -20, 120);
                cfg.top = clamp(y, -20, 120);
                applyComponents();
                update();
            }, box);

        const rPos = () => {
            if (def.mode === 'height') {
                const pw = def.box.clientWidth || 1;
                const w = (cfg.height * cfg.aspect / pw) * 100;
                return { x: cfg.left + w, y: cfg.top + cfg.height };
            }
            if (def.mode === 'box') return { x: cfg.left + cfg.width, y: cfg.top + cfg.height };
            return { x: cfg.left + cfg.width, y: cfg.top };
        };
        const rApply = (x, y) => {
            if (def.mode === 'height') {
                cfg.height = clamp(y - cfg.top, 3, 150);
            } else if (def.mode === 'box') {
                cfg.width = clamp(x - cfg.left, 3, 300);
                cfg.height = clamp(y - cfg.top, 3, 300);
            } else {
                cfg.width = clamp(x - cfg.left, 1, 300);
            }
            applyComponents();
            update();
        };
        mkHandle('comp-r', 'R' + n, rPos, rApply, box);
    });
}

/* ---------- 路径模式手柄 ---------- */
function buildPathHandles() {
    CONFIG.paths.forEach((p, i) => {
        const color = PATH_COLORS[i % PATH_COLORS.length];
        const created = [];
        if (p.type === 'arc') {
            created.push(mkHandle('ctr', 'C' + p.id, () => ({ x: p.cx, y: p.cy }), (x, y) => { p.cx = x; p.cy = y; drawPaths(); update(); }, cupBox));
            created.push(mkHandle('rx', 'X' + p.id, () => ({ x: p.cx + p.rx, y: p.cy }), (x) => { p.rx = Math.max(2, x - p.cx); drawPaths(); update(); }, cupBox));
            created.push(mkHandle('ry', 'Y' + p.id, () => ({ x: p.cx, y: p.cy + p.ry }), (_x, y) => { p.ry = Math.max(1, y - p.cy); drawPaths(); update(); }, cupBox));
        } else {
            created.push(mkHandle('start', 'S' + p.id, () => ({ x: p.sx, y: p.sy }), (x, y) => { p.sx = x; p.sy = y; drawPaths(); renderEndpoints(); update(); }, cupBox));
            created.push(mkHandle('end', 'E' + p.id, () => ({ x: p.ex, y: p.ey }), (x, y) => { p.ex = x; p.ey = y; drawPaths(); renderEndpoints(); update(); }, cupBox));
            if (p.type === 'curve') {
                created.push(mkHandle('q', 'Q' + p.id, () => ({ x: p.qx, y: p.qy }), (x, y) => { p.qx = x; p.qy = y; drawPaths(); update(); }, cupBox));
            }
        }
        created.forEach((h) => { h.el.style.borderColor = color; });
    });
}

/* ---------- 高亮模式手柄 ---------- */
function buildHighlightHandles() {
    CONFIG.paths.forEach((p) => {
        const cfg = CONFIG.highlights[p.id];
        const el = hlEls[p.id];
        mkHandle('hlm', 'M' + p.id, () => hlPos(cfg), (x, y) => { setHlPos(cfg, x, y); applyHighlight(el, cfg); update(); }, cupBox);
        mkHandle('hrs', 'R' + p.id, () => hlResizePos(cfg), (x, y) => { setHlSize(cfg, x, y); applyHighlight(el, cfg); update(); }, cupBox);
    });
}
function hlPos(cfg) {
    if (cfg.width !== undefined) return { x: cfg.left, y: cfg.top };
    return { x: cfg.centerX ? 50 : (cfg.left ?? 50), y: cfg.top };
}
function setHlPos(cfg, x, y) {
    if (cfg.width !== undefined) { cfg.left = x; cfg.top = y; return; }
    cfg.top = y;
    if (!cfg.centerX) cfg.left = x;
}
function hlResizePos(cfg) {
    if (cfg.width !== undefined) return { x: cfg.left + cfg.width, y: cfg.top };
    const w = cfg.height * cfg.aspect;
    if (cfg.centerX) return { x: 50 + w / 2, y: cfg.top + cfg.height };
    const l = cfg.left ?? 0;
    return { x: l + w, y: cfg.top + cfg.height };
}
function setHlSize(cfg, x, y) {
    if (cfg.width !== undefined) { cfg.width = Math.max(3, x - cfg.left); return; }
    cfg.height = Math.max(3, y - cfg.top);
}

/* ---------- 成就槽位手柄 ---------- */
function buildSlotHandles() {
    const slot = CONFIG.slots[currentSlot];
    const wrap = slotsBox.querySelector(`[data-slot-idx="${currentSlot}"]`);
    if (!wrap) return;

    const sb = slot.slotBox || (slot.slotBox = { left: 5, right: 5 });
    const topLeft = () => ({ x: sb.left, y: slot.top });
    const botRight = () => ({ x: 100 - sb.right, y: slot.top + slot.height });
    const applyTL = (x, y) => {
        sb.left = clamp(x, -30, 130);
        slot.top = clamp(y, -20, 120);
        renderSlotsPreview();
        update();
    };
    const applyBR = (x, y) => {
        sb.right = clamp(100 - x, -30, 130);
        slot.height = clamp(y - slot.top, 2, 120);
        renderSlotsPreview();
        update();
    };
    mkHandle('slot-box', 'S' + (currentSlot + 1), topLeft, applyTL, panelBox);
    mkHandle('slot-r', 'E' + (currentSlot + 1), botRight, applyBR, panelBox);

    (slot.achievement?.layers || []).forEach((ly, i) => {
        const pos = ly.pos || (ly.pos = { width: 96, left: 2, top: 2 });
        const imgEl = wrap._achEl.children[i];
        const box = wrap._achEl;
        const mvp = () => ({ x: pos.left ?? 0, y: pos.top ?? 0 });
        const applyMv = (x, y) => {
            pos.left = x; pos.top = y;
            Object.assign(imgEl.style, { left: x + '%', top: y + '%' });
            update();
        };
        const rsp = () => {
            const boxR = box.getBoundingClientRect();
            const imgR = imgEl.getBoundingClientRect();
            return {
                x: ((imgR.right - boxR.left) / boxR.width) * 100,
                y: ((imgR.bottom - boxR.top) / boxR.height) * 100,
            };
        };
        const applyRs = (x) => {
            pos.width = Math.max(3, x - (pos.left ?? 0));
            imgEl.style.width = pos.width + '%';
            update();
        };
        mkHandle('layer-m', 'L' + (i + 1), mvp, applyMv, box);
        mkHandle('layer-r', 'R' + (i + 1), rsp, applyRs, box);
    });

    const t = slot.text || (slot.text = { layers: [{ pos: { right: 104, top: 50, height: 96, offsetX: -6, aspect: 1329 / 2860 } }] });
    const textLayers = (t.layers && t.layers.length) ? t.layers : (t.src ? [{ src: t.src, pos: t.pos }] : []);
    textLayers.forEach((ly, li) => {
        const tp = ly.pos || (ly.pos = { right: 104, top: 50, height: 96, offsetX: -6, aspect: 1329 / 2860 });
        const txtEl = wrap._textEls[li];
        const centerPt = () => ({
            x: 100 - tp.right + (tp.offsetX ?? -6),
            y: tp.top,
        });
        const applyCenter = (x, y) => {
            tp.top = y;
            tp.right = 100 + (tp.offsetX ?? -6) - x;
            Object.assign(txtEl.style, {
                right: tp.right + '%', top: tp.top + '%',
                transform: `translateY(-50%) translateX(${tp.offsetX ?? -6}%)`,
            });
            update();
        };
        const heightPt = () => ({
            x: 100 - tp.right + (tp.offsetX ?? -6),
            y: tp.top + tp.height / 2,
        });
        const applyHeight = (_x, y) => {
            const h = 2 * Math.max(2, y - tp.top);
            tp.height = h;
            txtEl.style.height = h + '%';
            update();
        };
        mkHandle('text-m', 'T' + (currentSlot + 1) + '.' + (li + 1), centerPt, applyCenter, panelBox);
        mkHandle('text-r', 'H' + (currentSlot + 1) + '.' + (li + 1), heightPt, applyHeight, panelBox);
    });
}

/* ============== 输出 CONFIG 片段 ============== */
function update() {
    const c = CONFIG.components;
    const lines = [];
    lines.push(`    layout: { heightRatio: ${CONFIG.layout.heightRatio.toFixed(2)} },`);
    lines.push(`    components: {`);
    lines.push(`        background: { src: '${c.background.src}', left:${fmt(c.background.left)}, top:${fmt(c.background.top)}, width:${fmt(c.background.width)}, height:${fmt(c.background.height)} },`);
    lines.push(`        promptMove: { src: '${c.promptMove.src}', left:${fmt(c.promptMove.left)}, top:${fmt(c.promptMove.top)}, width:${fmt(c.promptMove.width)}, height:${fmt(c.promptMove.height)} },`);
    lines.push(`        promptStart: { src: '${c.promptStart.src}', left:${fmt(c.promptStart.left)}, top:${fmt(c.promptStart.top)}, width:${fmt(c.promptStart.width)}, offsetX:${fmt(c.promptStart.offsetX)}, offsetY:${fmt(c.promptStart.offsetY)} },`);
    lines.push(`        flower: { src: '${c.flower.src}', left:${fmt(c.flower.left)}, top:${fmt(c.flower.top)}, width:${fmt(c.flower.width)}, offsetX:${fmt(c.flower.offsetX)}, offsetY:${fmt(c.flower.offsetY)}, scaleStart:${fmt(c.flower.scaleStart)}, scalePeak:${fmt(c.flower.scalePeak)}, animDuration:${fmt(c.flower.animDuration)} },`);
    lines.push(`        bottomImgs: {`);
    lines.push(`            jing: { src: '${c.bottomImgs.jing.src}', left:${fmt(c.bottomImgs.jing.left)}, top:${fmt(c.bottomImgs.jing.top)}, width:${fmt(c.bottomImgs.jing.width)} },`);
    lines.push(`            shi:  { src: '${c.bottomImgs.shi.src}', left:${fmt(c.bottomImgs.shi.left)}, top:${fmt(c.bottomImgs.shi.top)}, width:${fmt(c.bottomImgs.shi.width)} },`);
    lines.push(`            rao:  { src: '${c.bottomImgs.rao.src}', left:${fmt(c.bottomImgs.rao.left)}, top:${fmt(c.bottomImgs.rao.top)}, width:${fmt(c.bottomImgs.rao.width)} },`);
    lines.push(`        },`);
    lines.push(`        slideIcon: { src: '${c.slideIcon.src}', left:${fmt(c.slideIcon.left)}, top:${fmt(c.slideIcon.top)}, width:${fmt(c.slideIcon.width)}, slideDuration:${fmt(c.slideIcon.slideDuration)} },`);
    lines.push(`        cup: { src: '${c.cup.src}', left:${fmt(c.cup.left)}, top:${fmt(c.cup.top)}, height:${fmt(c.cup.height)}, aspect:${c.cup.aspect} },`);
    lines.push(`        panel: { left:${fmt(c.panel.left)}, top:${fmt(c.panel.top)}, height:${fmt(c.panel.height)}, aspect:${c.panel.aspect} },`);
    lines.push(`        endpoints: {`);
    lines.push(`            start: { src: '${c.endpoints.start.src}', width:${fmt(c.endpoints.start.width)} },`);
    lines.push(`            end: { src: '${c.endpoints.end.src}', width:${fmt(c.endpoints.end.width)} },`);
    lines.push(`        },`);
    lines.push(`    },`);
    lines.push(`    pathStyle: {`);
    lines.push(`        color: '${CONFIG.pathStyle.color}', opacity: ${CONFIG.pathStyle.opacity}, width: ${CONFIG.pathStyle.width}, dash: '${CONFIG.pathStyle.dash}', zoneRadius: ${CONFIG.pathStyle.zoneRadius}, startWidthRatio: ${CONFIG.pathStyle.startWidthRatio}, endWidthRatio: ${CONFIG.pathStyle.endWidthRatio},`);
    lines.push(`    },`);
    lines.push(`    highlight: {`);
    lines.push(`        gold: '${CONFIG.highlight.gold}', restOpacity: ${CONFIG.highlight.restOpacity}, glowPx: ${CONFIG.highlight.glowPx},`);
    lines.push(`    },`);

    const pathtype = (p) => `type: '${p.type}'`;
    const pathsTxt = CONFIG.paths.map((p) => {
        const head = `{ id:${p.id}, method:'${p.method}', ${pathtype(p)}`;
        if (p.type === 'arc')
            return `        ${head}, cx:${fmt(p.cx)}, cy:${fmt(p.cy)}, rx:${fmt(p.rx)}, ry:${fmt(p.ry)} }`;
        if (p.type === 'curve')
            return `        ${head}, sx:${fmt(p.sx)}, sy:${fmt(p.sy)}, qx:${fmt(p.qx)}, qy:${fmt(p.qy)}, ex:${fmt(p.ex)}, ey:${fmt(p.ey)} }`;
        return `        ${head}, sx:${fmt(p.sx)}, sy:${fmt(p.sy)}, ex:${fmt(p.ex)}, ey:${fmt(p.ey)} }`;
    }).join(',\n');
    const hlEntries = Object.keys(CONFIG.highlights).map((k) => {
        const v = CONFIG.highlights[k];
        if (v.width !== undefined)
            return `        ${k}: { left:${fmt(v.left)}, top:${fmt(v.top)}, width:${fmt(v.width)}, aspect:${v.aspect} }`;
        const cx = v.centerX ? ', centerX:true' : '';
        const lf = v.centerX ? '' : ` left:${fmt(v.left || 0)},`;
        return `        ${k}: {${lf} top:${fmt(v.top)}, height:${fmt(v.height)}, aspect:${v.aspect}${cx} }`;
    }).join(',\n');
    const slotsTxt = CONFIG.slots.map((s) => {
        const sb = s.slotBox || { left: 5, right: 5 };
        const layersTxt = (s.achievement?.layers || []).map((ly) => {
            const p = ly.pos || { width: 96, left: 2, top: 2 };
            return `                    { src: '${ly.src}', pos: { width:${fmt(p.width)}, left:${fmt(p.left ?? 0)}, top:${fmt(p.top ?? 0)} } }`;
        }).join(',\n');
        const textLayers = (s.text.layers && s.text.layers.length) ? s.text.layers : (s.text.src ? [{ src: s.text.src, pos: s.text.pos }] : []);
        const textTxt = textLayers.map((ly) => {
            const tp = ly.pos || { right: 104, top: 50, height: 96, offsetX: -6, aspect: 1329 / 2860 };
            return `                { src: '${ly.src}', pos: { right: ${fmt(tp.right)}, top: ${fmt(tp.top)}, height: ${fmt(tp.height)}, offsetX: ${fmt(tp.offsetX ?? -6)}, aspect: ${tp.aspect ?? (1329/2860)} } }`;
        }).join(',\n');
        return [
            `        {`,
            `            method: '${s.method}', top: ${fmt(s.top)}, height: ${fmt(s.height)},`,
            `            slotBox: { left: ${fmt(sb.left)}, right: ${fmt(sb.right)} },`,
            `            achievement: { layers: [`,
            layersTxt,
            `            ] },`,
            `            text: { layers: [`,
            textTxt,
            `            ] },`,
            `        }`,
        ].join('\n');
    }).join(',\n');

    out.value = [
        ...lines,
        `    paths: [`,
        pathsTxt,
        `    ],`,
        `    highlights: {`,
        hlEntries,
        `    },`,
        `    slots: [`,
        slotsTxt,
        `    ],`,
        `    methodOrder: ['井字', '十字', '绕底'],`,
    ].join('\n');
}

/* ============== 控制面板 ============== */
function fit() { positionHandles(); }
addEventListener('resize', fit);
addEventListener('orientationchange', () => setTimeout(fit, 250));

const rH = $('r-h'), vH = $('v-h');
rH.addEventListener('input', () => {
    CONFIG.layout.heightRatio = parseFloat(rH.value);
    vH.textContent = rH.value;
    fit(); update();
});

$('seg-mode').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-mode]');
    if (!b) return;
    mode = b.dataset.mode;
    Array.prototype.forEach.call(e.currentTarget.querySelectorAll('button'), (x) => x.classList.toggle('active', x === b));
    compRow.style.display = (mode === 'components') ? '' : 'none';
    hl4Row.style.display = (mode === 'highlights') ? '' : 'none';
    slotRow.style.display = (mode === 'slots') ? '' : 'none';
    if (mode === 'slots') renderSlotsPreview();
    buildHandles();
    update();
});

$('seg-cx4').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-val]');
    if (!b) return;
    Array.prototype.forEach.call(e.currentTarget.querySelectorAll('button'), (x) => x.classList.toggle('active', x === b));
    const cx = b.dataset.val === '1';
    CONFIG.highlights[4].centerX = cx;
    if (!cx && CONFIG.highlights[4].left === undefined) CONFIG.highlights[4].left = 50;
    applyHighlight(hlEls[4], CONFIG.highlights[4]);
    buildHandles();
    update();
});

$('seg-slot').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-slot]');
    if (!b) return;
    currentSlot = parseInt(b.dataset.slot, 10);
    Array.prototype.forEach.call(e.currentTarget.querySelectorAll('button'), (x) => x.classList.toggle('active', x === b));
    renderSlotsPreview();
    buildHandles();
});

$('t-comp').addEventListener('click', (e) => {
    showComp = !showComp;
    applyCompVisibility();
    e.target.textContent = showComp ? '隐藏组件' : '显示组件';
});
$('t-path').addEventListener('click', (e) => {
    showPath = !showPath; drawPaths(); e.target.textContent = showPath ? '隐藏路径' : '显示路径';
});
$('t-hl').addEventListener('click', (e) => {
    showHl = !showHl;
    Object.values(hlEls).forEach((el) => { el.style.display = showHl ? '' : 'none'; });
    e.target.textContent = showHl ? '隐藏高亮' : '显示高亮';
});
$('t-grid').addEventListener('click', (e) => {
    showGrid = !showGrid; drawPaths(); e.target.textContent = showGrid ? '隐藏网格' : '参考网格';
});

const rStart = $('r-start'), vStart = $('v-start');
const rEnd = $('r-end'), vEnd = $('v-end');
rStart.addEventListener('input', () => {
    CONFIG.components.endpoints.start.width = parseFloat(rStart.value);
    vStart.textContent = rStart.value + '%';
    renderEndpoints();
    update();
});
rEnd.addEventListener('input', () => {
    CONFIG.components.endpoints.end.width = parseFloat(rEnd.value);
    vEnd.textContent = rEnd.value + '%';
    renderEndpoints();
    update();
});

$('copy').addEventListener('click', () => {
    out.select();
    const txt = out.value;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(() => flash('已复制 CONFIG 片段'), () => flash('复制失败，请手动选中'));
    } else { flash('复制失败，请手动选中 textarea'); }
});
function flash(msg) {
    const b = $('copy'); const old = b.textContent;
    b.textContent = msg; setTimeout(() => { b.textContent = old; }, 1400);
}

/* ============== 面板隐藏 / 拖动 ============== */
$('hide-panel').addEventListener('click', () => {
    ctrl.classList.add('hidden');
    $('show-panel').classList.add('show');
});
$('show-panel').addEventListener('click', () => {
    ctrl.classList.remove('hidden');
    $('show-panel').classList.remove('show');
});
(function initPanelDrag() {
    const saved = localStorage.getItem('bindEditPanelPos');
    if (saved) {
        try {
            const p = JSON.parse(saved);
            ctrl.style.left = p.x + 'px';
            ctrl.style.top = p.y + 'px';
            ctrl.style.right = 'auto';
        } catch (err) {}
    }
    const dh = $('drag-handle');
    let dragging = false, pid = null, sx = 0, sy = 0, ox = 0, oy = 0;
    dh.addEventListener('pointerdown', (e) => {
        dragging = true; pid = e.pointerId; sx = e.clientX; sy = e.clientY;
        const r = ctrl.getBoundingClientRect(); ox = r.left; oy = r.top;
        ctrl.style.right = 'auto';
        ctrl.style.left = ox + 'px'; ctrl.style.top = oy + 'px';
        try { dh.setPointerCapture(pid); } catch (err) {}
        e.preventDefault(); e.stopPropagation();
    });
    dh.addEventListener('pointermove', (e) => {
        if (!dragging || e.pointerId !== pid) return;
        ctrl.style.left = Math.max(0, ox + e.clientX - sx) + 'px';
        ctrl.style.top = Math.max(0, oy + e.clientY - sy) + 'px';
    });
    const stop = (e) => {
        if (!dragging || e.pointerId !== pid) return;
        dragging = false;
        const r = ctrl.getBoundingClientRect();
        localStorage.setItem('bindEditPanelPos', JSON.stringify({ x: r.left, y: r.top }));
    };
    dh.addEventListener('pointerup', stop);
    dh.addEventListener('pointercancel', stop);
})();

/* ============== 启动 ============== */
hl4Row.style.display = 'none';
slotRow.style.display = 'none';
applyComponents();
drawHighlights();
drawPaths();
renderSlotsPreview();
buildHandles();
update();
setTimeout(() => {
    Object.keys(hlEls).forEach((k) => applyHighlight(hlEls[k], CONFIG.highlights[k]));
    renderSlotsPreview();
    positionHandles();
}, 350);

})();
