/* ============================================================
   焗瓷记 · 起始选段动画可视化编辑器
   - 顶部选「游戏类型」（bind/nail）+「阶段」（stage1 4字全亮 / stage2 高亮+暗）
   - 拖拽手柄调整当前阶段 4 字的 top/left/width/height + scale（仅 stage2 active 字）
   - 编辑 timings（淡入/4字全亮停/可点延/淡出 毫秒）
   - 输出当前游戏的完整 CONFIG 片段（含 layoutStage1 + layoutStage2）
   ============================================================ */
(function () {
'use strict';

const CFG = window.PRE_INTRO_CONFIG;
const $ = (id) => document.getElementById(id);

/* ---------------- DOM ---------------- */
const stage = $('stage');
const bg = $('intro-bg');
const frame = $('frame-img');
const logoEl = $('intro-logo');
const charsBox = $('intro-chars');
const handlesBox = $('handles');
const out = $('out');

/* ---------------- 当前编辑状态 ---------------- */
let gameType = 'bind';     // 'bind' | 'nail'
let currentStage = 1;      // 1 | 2
let currentKey = 'bang';   // 当前选中编辑的字

/* ---------------- 工具 ---------------- */
function getGameCfg() { return CFG[gameType]; }
function getLayout() { return currentStage === 1 ? getGameCfg().layoutStage1 : getGameCfg().layoutStage2; }
function getActiveKey() { return getGameCfg().activeKey; }
function vpW() { return stage.clientWidth; }
function vpH() { return stage.clientHeight; }
function pctToPx_v(v) { return v * vpH() / 100; }
function pctToPx_h(v) { return v * vpW() / 100; }
function pxToPct_v(px) { return px * 100 / vpH(); }
function pxToPct_h(px) { return px * 100 / vpW(); }

/* ---------------- 渲染 ---------------- */
function bust(src) { return src + (src.indexOf('?') >= 0 ? '&' : '?') + 'v=' + Date.now(); }
function renderBackground() {
    bg.src = bust(CFG.background.src);
    if (CFG.background.poster) bg.poster = CFG.background.poster;
    const p = bg.play();
    if (p && p.catch) p.catch(() => {});
}
function renderFrame() { frame.src = bust(CFG.frame.src); }
function renderLogo() {
    logoEl.src = bust(CFG.logo.src);
    const p = CFG.logo.pos;
    logoEl.style.left = p.left + '%';
    logoEl.style.top = p.top + '%';
    logoEl.style.width = p.width + '%';
    logoEl.style.height = p.height + '%';
}

function renderChars() {
    charsBox.innerHTML = '';
    const layout = getLayout();
    const activeKey = getActiveKey();
    const order = ['jian', 'dui', 'bang', 'ding'];
    order.forEach(key => {
        const cfg = layout[key];
        const charCfg = CFG.chars[key];
        const img = document.createElement('img');
        img.className = 'intro-char';
        img.dataset.key = key;
        img.alt = '';
        if (currentStage === 1) {
            // 阶段1：全亮
            img.src = charCfg.bright;
        } else {
            // 阶段2：active 亮+放大，其余暗
            if (key === activeKey) {
                img.src = charCfg.bright;
                img.classList.add('active');
                img.style.transform = `scale(${cfg.scale || 1})`;
            } else {
                img.src = charCfg.dim;
                img.classList.add('dim');
            }
        }
        applyLayout(img, cfg);
        charsBox.appendChild(img);
    });
}

function applyLayout(el, cfg) {
    el.style.top = cfg.top + '%';
    el.style.left = cfg.left + '%';
    el.style.width = cfg.width + '%';
    el.style.height = cfg.height + '%';
    el.style.setProperty('--char-scale', String(cfg.scale || 1));
}

/* ---------------- 手柄 ----------------
   每个字给 2~3 个手柄：
     M (move)   : 字中心 → 改 top/left
     R (resize) : 字右下角 → 改 width/height
     S (scale)  : 字左下角 → 改 scale（仅 stage2 的 active 字有意义，但所有字都可调）
*/
let handles = [];

function clearHandles() {
    handlesBox.innerHTML = '';
    handles = [];
}

function positionHandles() {
    const layout = getLayout();
    handles.forEach(h => {
        if (h.key === 'logo') {
            // logo 手柄位置基于 CFG.logo.pos
            const p = CFG.logo.pos;
            if (h.kind === 'move') {
                h.el.style.left = (p.left + p.width / 2) + '%';
                h.el.style.top = (p.top + p.height / 2) + '%';
            } else if (h.kind === 'resize') {
                h.el.style.left = (p.left + p.width) + '%';
                h.el.style.top = (p.top + p.height) + '%';
            }
            return;
        }
        const cfg = layout[h.key];
        if (h.kind === 'move') {
            h.el.style.left = (cfg.left + cfg.width / 2) + '%';
            h.el.style.top = (cfg.top + cfg.height / 2) + '%';
        } else if (h.kind === 'resize') {
            h.el.style.left = (cfg.left + cfg.width) + '%';
            h.el.style.top = (cfg.top + cfg.height) + '%';
        } else if (h.kind === 'scale') {
            h.el.style.left = cfg.left + '%';
            h.el.style.top = (cfg.top + cfg.height) + '%';
        }
    });
}

function buildHandles() {
    clearHandles();
    const order = ['jian', 'dui', 'bang', 'ding'];
    const labels = { jian: '鉴', dui: '对', bang: '绑', ding: '钉' };
    order.forEach(key => {
        // move
        const mEl = document.createElement('div');
        mEl.className = 'h move';
        mEl.textContent = labels[key];
        handlesBox.appendChild(mEl);
        handles.push({ el: mEl, kind: 'move', key });
        // resize
        const rEl = document.createElement('div');
        rEl.className = 'h resize';
        rEl.textContent = 'R';
        handlesBox.appendChild(rEl);
        handles.push({ el: rEl, kind: 'resize', key });
        // scale
        const sEl = document.createElement('div');
        sEl.className = 'h scale';
        sEl.textContent = 'S';
        handlesBox.appendChild(sEl);
        handles.push({ el: sEl, kind: 'scale', key });
    });
    // logo 手柄（move + resize，无 scale）
    const lmEl = document.createElement('div');
    lmEl.className = 'h move';
    lmEl.style.background = '#2a8a5a';
    lmEl.textContent = 'L';
    handlesBox.appendChild(lmEl);
    handles.push({ el: lmEl, kind: 'move', key: 'logo' });
    const lrEl = document.createElement('div');
    lrEl.className = 'h resize';
    lrEl.textContent = 'R';
    handlesBox.appendChild(lrEl);
    handles.push({ el: lrEl, kind: 'resize', key: 'logo' });
    positionHandles();
    bindDrag();
}

/* ---------------- 拖拽 ---------------- */
let drag = null;

function bindDrag() {
    handles.forEach(h => {
        h.el.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (h.key !== 'logo') {
                currentKey = h.key;
                syncUIFromCfg();
                highlightCharPick();
            }
            drag = {
                handle: h, key: h.key, kind: h.kind,
                startX: e.clientX, startY: e.clientY,
                startCfg: h.key === 'logo' ? { ...CFG.logo.pos } : { ...getLayout()[h.key] },
            };
            h.el.setPointerCapture(e.pointerId);
        });
        h.el.addEventListener('pointermove', onPointerMove);
        h.el.addEventListener('pointerup', onPointerUp);
        h.el.addEventListener('pointercancel', onPointerUp);
    });
}

function onPointerMove(e) {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (drag.key === 'logo') {
        // logo 拖拽逻辑
        const p = CFG.logo.pos;
        if (drag.kind === 'move') {
            p.left = Math.max(-20, Math.min(100, pxToPct_h(pctToPx_h(drag.startCfg.left) + dx)));
            p.top = Math.max(-20, Math.min(100, pxToPct_v(pctToPx_v(drag.startCfg.top) + dy)));
        } else if (drag.kind === 'resize') {
            p.width = Math.max(2, pxToPct_h(pctToPx_h(drag.startCfg.width) + dx));
            p.height = Math.max(2, pxToPct_h(pctToPx_h(drag.startCfg.height) + dy));
        }
        logoEl.style.left = p.left + '%';
        logoEl.style.top = p.top + '%';
        logoEl.style.width = p.width + '%';
        logoEl.style.height = p.height + '%';
        positionHandles();
        syncLogoUI();
        refreshOutput();
        return;
    }
    const layout = getLayout();
    const cfg = layout[drag.key];
    if (drag.kind === 'move') {
        const newLeftPx = pctToPx_h(drag.startCfg.left) + dx;
        const newTopPx = pctToPx_v(drag.startCfg.top) + dy;
        cfg.left = Math.max(-20, Math.min(100, pxToPct_h(newLeftPx)));
        cfg.top = Math.max(-20, Math.min(100, pxToPct_v(newTopPx)));
    } else if (drag.kind === 'resize') {
        const newWPx = pctToPx_h(drag.startCfg.width) + dx;
        const newHPx = pctToPx_v(drag.startCfg.height) + dy;
        cfg.width = Math.max(2, pxToPct_h(newWPx));
        cfg.height = Math.max(2, pxToPct_h(newHPx));
    } else if (drag.kind === 'scale') {
        const startScale = drag.startCfg.scale || 1;
        const newScale = Math.max(0.5, Math.min(2.0, startScale + dy / 200));
        cfg.scale = parseFloat(newScale.toFixed(3));
    }
    const charEl = charsBox.querySelector(`.intro-char[data-key="${drag.key}"]`);
    if (charEl) {
        applyLayout(charEl, cfg);
        if (drag.key === getActiveKey() && currentStage === 2) {
            charEl.style.transform = `scale(${cfg.scale || 1})`;
        }
    }
    positionHandles();
    syncUIFromCfg();
    refreshOutput();
}

function onPointerUp(e) {
    drag = null;
}

/* ---------------- UI 同步 ---------------- */
function syncUIFromCfg() {
    const cfg = getLayout()[currentKey];
    $('i-top').value = cfg.top.toFixed(2);
    $('i-left').value = cfg.left.toFixed(2);
    $('i-width').value = cfg.width.toFixed(2);
    $('i-height').value = cfg.height.toFixed(2);
    $('i-scale').value = (cfg.scale || 1).toFixed(3);
    const t = getGameCfg().timings;
    $('i-fadeIn').value = t.fadeInMs;
    $('i-allBright').value = t.charsAllBrightMs;
    $('i-ready').value = t.readyDelayMs;
    $('i-blackout').value = t.blackoutMs;
    $('i-fadeOut').value = t.fadeOutMs;
    syncLogoUI();
}
function syncLogoUI() {
    const p = CFG.logo.pos;
    $('i-logo-top').value = p.top.toFixed(2);
    $('i-logo-left').value = p.left.toFixed(2);
    $('i-logo-width').value = p.width.toFixed(2);
    $('i-logo-height').value = p.height.toFixed(2);
}
function highlightCharPick() {
    document.querySelectorAll('#char-pick button').forEach(b => {
        b.classList.toggle('active', b.dataset.key === currentKey);
    });
}

/* ---------------- 输出 CONFIG 片段（当前游戏） ---------------- */
function refreshOutput() {
    const g = getGameCfg();
    const fmtLayout = (layout) => {
        const lines = [];
        ['jian', 'dui', 'bang', 'ding'].forEach(key => {
            const c = layout[key];
            const scale = c.scale !== undefined ? `, scale: ${c.scale.toFixed(3)}` : '';
            lines.push(`        ${key.padEnd(5)}: { top: ${c.top.toFixed(2)}, height: ${c.height.toFixed(2)}, left: ${c.left.toFixed(2)}, width: ${c.width.toFixed(2)}${scale} },`);
        });
        return lines.join('\n');
    };
    const txt = `// === ${gameType === 'bind' ? '绑扎定型' : '打孔上钉'} 起始选段 CONFIG ===
// 贴回 intro-common.js 的 PRE_INTRO_CONFIG.${gameType}
${gameType}: {
    activeKey: '${g.activeKey}',
    timings: {
        fadeInMs: ${g.timings.fadeInMs},
        charsAllBrightMs: ${g.timings.charsAllBrightMs},
        readyDelayMs: ${g.timings.readyDelayMs},
        blackoutMs: ${g.timings.blackoutMs},
        fadeOutMs: ${g.timings.fadeOutMs},
    },
    // 阶段1：4 字全亮
    layoutStage1: {
${fmtLayout(g.layoutStage1)}
    },
    // 阶段2：active 字放大保持亮，其余切到 _暗 版（layoutStage2 独立可调）
    layoutStage2: {
${fmtLayout(g.layoutStage2)}
    },
},
// logo（共享配置，贴回 PRE_INTRO_CONFIG.logo）
logo: { src: '/image/logo.webp', pos: { left: ${CFG.logo.pos.left.toFixed(2)}, top: ${CFG.logo.pos.top.toFixed(2)}, width: ${CFG.logo.pos.width.toFixed(2)}, height: ${CFG.logo.pos.height.toFixed(2)} } },`;
    out.value = txt;
}

/* ---------------- 预览动画 ---------------- */
function previewAnimation() {
    // 重置到 stage1
    currentStage = 1;
    $('stage-pick').value = '1';
    renderChars();
    buildHandles();
    syncUIFromCfg();
    // 模拟整层淡入 → 停留 → 切换到 stage2
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;transition:opacity 0.6s ease;z-index:90;';
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.style.opacity = '1');
    setTimeout(() => {
        overlay.style.opacity = '0';
        // 切换到 stage2
        currentStage = 2;
        $('stage-pick').value = '2';
        renderChars();
        buildHandles();
        syncUIFromCfg();
        setTimeout(() => overlay.remove(), 800);
    }, 1500);
}

/* ---------------- 事件绑定 ---------------- */
function bindEvents() {
    // 游戏类型切换
    $('game-type').addEventListener('change', (e) => {
        gameType = e.target.value;
        currentKey = getActiveKey();
        renderChars();
        buildHandles();
        syncUIFromCfg();
        highlightCharPick();
        refreshOutput();
    });

    // 阶段切换
    $('stage-pick').addEventListener('change', (e) => {
        currentStage = parseInt(e.target.value);
        renderChars();
        buildHandles();
        syncUIFromCfg();
        refreshOutput();
    });

    // 字选择
    document.querySelectorAll('#char-pick button').forEach(b => {
        b.addEventListener('click', () => {
            currentKey = b.dataset.key;
            syncUIFromCfg();
            highlightCharPick();
        });
    });

    // 数值输入
    ['i-top', 'i-left', 'i-width', 'i-height', 'i-scale'].forEach(id => {
        $(id).addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            if (isNaN(v)) return;
            const cfg = getLayout()[currentKey];
            if (id === 'i-top') cfg.top = v;
            else if (id === 'i-left') cfg.left = v;
            else if (id === 'i-width') cfg.width = v;
            else if (id === 'i-height') cfg.height = v;
            else if (id === 'i-scale') cfg.scale = v;
            const charEl = charsBox.querySelector(`.intro-char[data-key="${currentKey}"]`);
            if (charEl) {
                applyLayout(charEl, cfg);
                if (currentKey === getActiveKey() && currentStage === 2) {
                    charEl.style.transform = `scale(${cfg.scale || 1})`;
                }
            }
            positionHandles();
            refreshOutput();
        });
    });

    // timings 输入
    $('i-fadeIn').addEventListener('input', (e) => { getGameCfg().timings.fadeInMs = parseInt(e.target.value) || 0; refreshOutput(); });
    $('i-allBright').addEventListener('input', (e) => { getGameCfg().timings.charsAllBrightMs = parseInt(e.target.value) || 0; refreshOutput(); });
    $('i-ready').addEventListener('input', (e) => { getGameCfg().timings.readyDelayMs = parseInt(e.target.value) || 0; refreshOutput(); });
    $('i-blackout').addEventListener('input', (e) => { getGameCfg().timings.blackoutMs = parseInt(e.target.value) || 0; refreshOutput(); });
    $('i-fadeOut').addEventListener('input', (e) => { getGameCfg().timings.fadeOutMs = parseInt(e.target.value) || 0; refreshOutput(); });

    // logo 数值输入
    ['i-logo-top', 'i-logo-left', 'i-logo-width', 'i-logo-height'].forEach(id => {
        $(id).addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            if (isNaN(v)) return;
            const p = CFG.logo.pos;
            if (id === 'i-logo-top') p.top = v;
            else if (id === 'i-logo-left') p.left = v;
            else if (id === 'i-logo-width') p.width = v;
            else if (id === 'i-logo-height') p.height = v;
            logoEl.style.left = p.left + '%';
            logoEl.style.top = p.top + '%';
            logoEl.style.width = p.width + '%';
            logoEl.style.height = p.height + '%';
            positionHandles();
            refreshOutput();
        });
    });

    // 按钮
    $('btn-preview').addEventListener('click', previewAnimation);
    $('btn-copy').addEventListener('click', () => { out.select(); document.execCommand('copy'); });

    // 隐藏/显示面板
    $('hide-panel').addEventListener('click', () => {
        $('ctrl').classList.add('hidden');
        $('show-panel').classList.add('show');
        setTimeout(positionHandles, 200);
    });
    $('show-panel').addEventListener('click', () => {
        $('ctrl').classList.remove('hidden');
        $('show-panel').classList.remove('show');
        setTimeout(positionHandles, 200);
    });

    // 窗口尺寸变化
    window.addEventListener('resize', () => setTimeout(positionHandles, 100));
}

/* ---------------- 启动 ---------------- */
renderBackground();
renderFrame();
renderLogo();
renderChars();
buildHandles();
syncUIFromCfg();
highlightCharPick();
refreshOutput();
bindEvents();

})();
