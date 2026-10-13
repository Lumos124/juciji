(function () {
'use strict';
const $ = (id) => document.getElementById(id);
const stage = $('stage');
const compsBox = $('comps');
const handlesBox = $('handles');
const ctrl = $('ctrl');
const out = $('out');
let handles = [];

const CONFIG = {
        complete: {
        timings: { bgMs: 1200, patternMs: 1000, levelMs: 700, scoreMs: 900, congratsMs: 900 },
        components: {
            bg:       { src: '/上钉/image/结算背景.webp' },
            pattern:    { src: '/上钉/image/结算图案.webp', left: 23.3, top: 46.97, width: 46 },
            level:    { src: '/上钉/image/等级.webp', left: 71.68, top: 39.2, width: 44.17 },
            score:    { src: '/上钉/image/分数.webp', left: 71.79, top: 76.27, width: 44.45 },
            congrats:    { src: '/上钉/image/恭喜.webp', left: 24.99, top: 87.6, width: 47.08 },
        },
    },
};
const KEYS = ['pattern', 'level', 'score', 'congrats'];

function bust(src) { return src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + Date.now(); }
function fmt(n) { return Math.round(n * 100) / 100; }
function setStyle(el, obj) { for (const k in obj) el.style[k] = obj[k]; }

function applyComps() {
    compsBox.innerHTML = '';
    const cc = CONFIG.complete.components;
    const bg = document.createElement('div');
    bg.className = 'comp bg';
    const bimg = document.createElement('img');
    bimg.src = bust(cc.bg.src);
    bimg.alt = '';
    bg.appendChild(bimg);
    compsBox.appendChild(bg);
    KEYS.forEach((key) => {
        const d = document.createElement('div');
        d.className = 'comp ' + key;
        const img = document.createElement('img');
        img.src = bust(cc[key].src);
        img.alt = key;
        d.appendChild(img);
        compsBox.appendChild(d);
    });
    positionComps();
}
function positionComps() {
    const cc = CONFIG.complete.components;
    KEYS.forEach((key) => {
        const cfg = cc[key];
        const el = compsBox.querySelector('.comp.' + key);
        setStyle(el, { left: cfg.left + '%', top: cfg.top + '%', width: cfg.width + '%', transform: 'translate(-50%, -50%)' });
    });
}

function toXY(ev, box) {
    const r = box.getBoundingClientRect();
    return { x: ((ev.clientX - r.left) / r.width) * 100, y: ((ev.clientY - r.top) / r.height) * 100 };
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function mkHandle(kind, label, getPos, onApply) {
    const d = document.createElement('div');
    d.className = 'h ' + kind;
    d.textContent = label;
    const h = { el: d, getPos, onApply };
    d.addEventListener('pointerdown', (e) => onDown(e, h));
    handlesBox.appendChild(d);
    handles.push(h);
    return h;
}
function onDown(e, h) {
    e.preventDefault(); e.stopPropagation();
    const pid = e.pointerId;
    try { h.el.setPointerCapture(pid); } catch (err) {}
    const move = (ev) => {
        if (ev.pointerId !== pid) return;
        const pt = toXY(ev, $('play'));
        h.onApply(pt.x, pt.y);
        positionComps();
        positionHandles();
        update();
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
        h.el.style.left = p.x + '%';
        h.el.style.top = p.y + '%';
    });
}
function buildHandles() {
    handlesBox.innerHTML = '';
    handles = [];
    KEYS.forEach((key, i) => {
        const cfg = CONFIG.complete.components[key];
        const n = i + 1;
        mkHandle('comp-m', 'M' + n, () => ({ x: cfg.left, y: cfg.top }), (x, y) => {
            cfg.left = clamp(x, -20, 120);
            cfg.top = clamp(y, -20, 120);
        });
        mkHandle('comp-r', 'R' + n, () => ({ x: cfg.left + cfg.width, y: cfg.top }), (x, y) => {
            cfg.width = clamp(x - cfg.left, 1, 200);
        });
    });
    positionHandles();
}
function update() {
    const cc = CONFIG.complete;
    const c = cc.components;
    const lines = [];
    lines.push('    complete: {');
    lines.push(`        timings: { bgMs: ${cc.timings.bgMs}, patternMs: ${cc.timings.patternMs}, levelMs: ${cc.timings.levelMs}, scoreMs: ${cc.timings.scoreMs}, congratsMs: ${cc.timings.congratsMs} },`);
    lines.push('        components: {');
    lines.push(`            bg:       { src: '${c.bg.src}' },`);
    KEYS.forEach((key) => {
        const cfg = c[key];
        lines.push(`            ${key}:    { src: '${cfg.src}', left: ${fmt(cfg.left)}, top: ${fmt(cfg.top)}, width: ${fmt(cfg.width)} },`);
    });
    lines.push('        },');
    lines.push('    },');
    out.value = lines.join('\n');
}

$('copy').addEventListener('click', () => {
    out.select();
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(out.value).then(() => flash('已复制'), () => flash('复制失败，请手动选中'));
    } else flash('复制失败，请手动选中 textarea');
});
function flash(msg) { const b = $('copy'); const old = b.textContent; b.textContent = msg; setTimeout(() => { b.textContent = old; }, 1400); }

$('hide-panel').addEventListener('click', () => { ctrl.classList.add('hidden'); $('show-panel').classList.add('show'); });
$('show-panel').addEventListener('click', () => { ctrl.classList.remove('hidden'); $('show-panel').classList.remove('show'); });
(function initPanelDrag() {
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
        localStorage.setItem('nailCompletePanelPos', JSON.stringify({ x: ctrl.getBoundingClientRect().left, y: ctrl.getBoundingClientRect().top }));
    };
    dh.addEventListener('pointerup', stop);
    dh.addEventListener('pointercancel', stop);
    const saved = localStorage.getItem('nailCompletePanelPos');
    if (saved) {
        try { const p = JSON.parse(saved); ctrl.style.left = p.x + 'px'; ctrl.style.top = p.y + 'px'; ctrl.style.right = 'auto'; } catch (err) {}
    }
})();

applyComps();
buildHandles();
update();
})();
