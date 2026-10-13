/* 书页视频动效 · 布局编辑器
   在预览画面上直接拖动组件，输出 window.FX_LAYOUT 后贴回 fx-layout.js */
(function () {
    'use strict';

    const LAYOUT = window.FX_LAYOUT;
    const META = window.FX_LAYOUT_META || {};
    const DEFAULT_LAYOUT = JSON.parse(JSON.stringify(LAYOUT));
    const $ = (id) => document.getElementById(id);

    const ITEMS = [
        { key: 'page', label: '书页（固定）' },
        { key: 'frame', label: '边框 + 视频窗' },
        { key: 'logo', label: 'logo' },
        { key: 'verticalBar', label: '竖条' },
        { key: 'token', label: '令牌' },
        { key: 'text1', label: '文字 1' },
        { key: 'text2', label: '文字 2' },
        { key: 'text3', label: '文字 3' },
        { key: 'text4', label: '文字 4' },
        { key: 'frameLogo', label: '边框常驻 logo' },
        { key: 'boy', label: '瓷片小男孩' },
        { key: 'mono1', label: '独白 1' },
        { key: 'mono2', label: '独白 2' },
        { key: 'process', label: '流程条' },
    ];

    const ID_MAP = {
        frame: 'fx-frame',
        boy: 'fx-boy',
        verticalBar: 'fx-vertical-bar',
        logo: 'fx-logo',
        token: 'fx-token',
        text1: 'fx-text-1',
        text2: 'fx-text-2',
        text3: 'fx-text-3',
        text4: 'fx-text-4',
        frameLogo: 'fx-frame-logo',
        mono1: 'fx-monologue-1',
        mono2: 'fx-monologue-2',
        process: 'fx-process',
    };

    const el = (key) => $(ID_MAP[key]);
    const frameEl = () => $('fx-frame');
    const handlesBox = $('handles');
    const out = $('out');
    let current = 'frame';

    function fmt(v) { return (Math.round(v * 100) / 100).toFixed(2); }

    function applyStaticState() {
        window.FX_LAYOUT_APPLY(LAYOUT);
        frameEl().style.opacity = '1';
        $('fx-frame-img').style.opacity = '1';
        $('fx-mask').style.opacity = '0.55';
        $('fx-boy').style.opacity = $('show-boy').checked ? '1' : '0';
        ['fx-logo', 'fx-vertical-bar', 'fx-token', 'fx-text-1', 'fx-text-2', 'fx-text-3', 'fx-text-4'].forEach((id) => {
            $(id).style.opacity = '1';
            $(id).style.clipPath = 'none';
        });
        $('fx-frame-logo').style.opacity = '1';
        const monoOn = $('show-captions').checked;
        ['fx-monologue-1', 'fx-monologue-2'].forEach((id) => {
            $(id).style.opacity = monoOn ? '1' : '0';
        });
        const process = $('fx-process');
        process.style.opacity = $('show-process').checked ? '1' : '0';
        process.style.setProperty('--process-reveal', '100%');
        process.querySelectorAll('.process-glow').forEach((el) => {
            el.style.opacity = '1';
        });
        // 编辑器只展示最终静态位置，logo/竖条不做入场位移
        $('fx-logo').style.transform = 'none';
        $('fx-vertical-bar').style.transform = 'translateX(-50%)';
    }

    function buildList() {
        const box = $('comp-list');
        box.innerHTML = '';
        ITEMS.forEach((item) => {
            const b = document.createElement('button');
            b.textContent = item.label;
            b.dataset.key = item.key;
            b.addEventListener('click', () => select(item.key));
            box.appendChild(b);
        });
    }

    function select(key) {
        current = key;
        document.querySelectorAll('#comp-list button').forEach((b) => {
            b.classList.toggle('active', b.dataset.key === key);
        });
        document.querySelectorAll('.edit-el.selected').forEach((el2) => {
            el2.classList.remove('selected');
        });
        const target = el(key);
        if (target) target.classList.add('selected');
        renderFields();
        buildHandles();
    }

    function isCaption(key) {
        return ['mono1', 'mono2', 'process'].includes(key);
    }

    function parentRect(key) {
        if (key === 'frame') {
            return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        }
        if (isCaption(key)) {
            return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        }
        return frameEl().getBoundingClientRect();
    }

    function activeField() {
        const meta = META[current];
        return meta && meta.resize === 'width' ? 'width' : 'height';
    }

    function renderFields() {
        const cfg = LAYOUT[current];
        const fieldTitle = $('field-title');
        const leftInput = $('i-left');
        const topInput = $('i-top');
        const wInput = $('i-width');
        const hInput = $('i-height');

        if (current === 'page') {
            fieldTitle.textContent = '书页：按长边铺满，剩余区域 #311909';
            leftInput.disabled = topInput.disabled = wInput.disabled = hInput.disabled = true;
            leftInput.value = topInput.value = wInput.value = hInput.value = '';
            $('i-w-label').textContent = 'width %';
            $('i-h-label').textContent = 'height %';
            return;
        }

        if (!cfg) return;
        const field = activeField();
        const wLabel = $('i-w-label');
        const hLabel = $('i-h-label');
        wLabel.textContent = 'width %';
        hLabel.textContent = 'height %';

        leftInput.disabled = topInput.disabled = false;
        wInput.disabled = field !== 'width';
        hInput.disabled = field !== 'height';
        leftInput.value = fmt(cfg.left);
        topInput.value = fmt(cfg.top);
        wInput.value = cfg.width !== undefined ? fmt(cfg.width) : '';
        hInput.value = cfg.height !== undefined ? fmt(cfg.height) : '';
        if (field === 'width') {
            wLabel.textContent = 'width %（可拖动）';
            hLabel.textContent = 'height %（自动）';
        } else {
            wLabel.textContent = 'width %（自动）';
            hLabel.textContent = 'height %（可拖动）';
        }
        fieldTitle.textContent = `位置 / 尺寸（${ITEMS.find((i) => i.key === current).label}）`;
    }

    function buildHandles() {
        handlesBox.innerHTML = '';
        if (current === 'page' || !LAYOUT[current]) return;
        const target = el(current);
        const r = target.getBoundingClientRect();
        const meta = META[current];

        const addHandle = (kind, cls, left, top, label) => {
            const h = document.createElement('div');
            h.className = 'h ' + cls;
            h.textContent = label;
            h.style.left = left + 'px';
            h.style.top = top + 'px';
            h.dataset.kind = kind;
            handlesBox.appendChild(h);
            h.addEventListener('pointerdown', (e) => startDrag(e, current, kind, true));
        };

        addHandle('move', 'move', r.left + r.width / 2, r.top + r.height / 2, 'M');
        if (meta.resize === 'width') {
            addHandle('resize', 'resize', r.right, r.top + r.height / 2, 'R');
        } else {
            addHandle('resize', 'resize', r.left + r.width / 2, r.bottom, 'R');
        }
    }

    let drag = null;

    function startDrag(e, key, kind, fromHandle) {
        e.preventDefault();
        e.stopPropagation();
        if (!fromHandle) select(key);
        const cfg = LAYOUT[key];
        if (!cfg) return;
        const pr = parentRect(key);
        drag = {
            key,
            kind,
            startX: e.clientX,
            startY: e.clientY,
            cfg: { ...cfg },
            pw: pr.width,
            ph: pr.height,
        };
        if (e.currentTarget && e.currentTarget.setPointerCapture) {
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
    }

    function positionHandles() {
        if (current === 'page' || !LAYOUT[current]) return;
        const target = el(current);
        if (!target) return;
        const r = target.getBoundingClientRect();
        const meta = META[current];
        const hs = handlesBox.querySelectorAll('.h');
        if (hs[0]) {
            hs[0].style.left = (r.left + r.width / 2) + 'px';
            hs[0].style.top = (r.top + r.height / 2) + 'px';
        }
        if (hs[1]) {
            if (meta.resize === 'width') {
                hs[1].style.left = r.right + 'px';
                hs[1].style.top = (r.top + r.height / 2) + 'px';
            } else {
                hs[1].style.left = (r.left + r.width / 2) + 'px';
                hs[1].style.top = r.bottom + 'px';
            }
        }
    }

    function onPointerMove(e) {
        if (!drag) return;
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        const cfg = LAYOUT[drag.key];
        const pctX = (v) => (v * 100) / drag.pw;
        const pctY = (v) => (v * 100) / drag.ph;

        if (drag.kind === 'move') {
            cfg.left = clamp(drag.cfg.left + pctX(dx), -120, 220);
            cfg.top = clamp(drag.cfg.top + pctY(dy), -120, 220);
        } else {
            const meta = META[drag.key];
            if (meta.resize === 'width') {
                cfg.width = clamp(drag.cfg.width + pctX(dx), 0.5, 300);
                delete cfg.height;
            } else {
                cfg.height = clamp(drag.cfg.height + pctY(dy), 0.5, 300);
                delete cfg.width;
            }
        }
        applyStaticState();
        renderFields();
        positionHandles();
        refreshOutput();
    }

    function onPointerUp() {
        drag = null;
        setTimeout(positionHandles, 0);
    }

    function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

    function refreshOutput() {
        const lines = [
            'window.FX_LAYOUT = {',
            '    // 边框 + 视频窗（相对整个视口）',
            `    frame: { left: ${fmt(LAYOUT.frame.left)}, top: ${fmt(LAYOUT.frame.top)}, width: ${fmt(LAYOUT.frame.width)} },`,
            '',
            '    // 以下元素相对 fx-frame',
        ];
        ['boy', 'verticalBar', 'logo', 'token', 'text1', 'text2', 'text3', 'text4', 'frameLogo'].forEach((key) => {
            const c = LAYOUT[key];
            const parts = [`left: ${fmt(c.left)}`, `top: ${fmt(c.top)}`];
            if (c.width !== undefined) parts.push(`width: ${fmt(c.width)}`);
            if (c.height !== undefined) parts.push(`height: ${fmt(c.height)}`);
            lines.push(`    ${key}: { ${parts.join(', ')} },`);
        });
        lines.push('', '    // 边框下方（相对整个视口）');
        ['mono1', 'mono2', 'process'].forEach((key) => {
            const c = LAYOUT[key];
            const parts = [`left: ${fmt(c.left)}`, `top: ${fmt(c.top)}`, `width: ${fmt(c.width)}`];
            lines.push(`    ${key}: { ${parts.join(', ')} },`);
        });
        lines.push('};');
        out.value = lines.join('\n');
    }

    function bindEvents() {
        document.querySelectorAll('.edit-el[data-key]').forEach((item) => {
            item.addEventListener('pointerdown', (e) => {
                if (item.id === 'fx-frame' && e.target !== item) return;
                startDrag(e, item.dataset.key, 'move', false);
            });
        });
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);

        ['i-left', 'i-top', 'i-width', 'i-height'].forEach((id) => {
            $(id).addEventListener('input', (e) => {
                if (current === 'page' || !LAYOUT[current]) return;
                const v = parseFloat(e.target.value);
                if (isNaN(v)) return;
                const cfg = LAYOUT[current];
                if (id === 'i-left') cfg.left = v;
                else if (id === 'i-top') cfg.top = v;
                else if (id === 'i-width' && META[current].resize === 'width') {
                    cfg.width = v;
                    delete cfg.height;
                } else if (id === 'i-height' && META[current].resize === 'height') {
                    cfg.height = v;
                    delete cfg.width;
                }
                applyStaticState();
                buildHandles();
                refreshOutput();
            });
        });

        $('show-boy').addEventListener('change', () => {
            $('fx-boy').style.opacity = $('show-boy').checked ? '1' : '0';
        });
        $('show-captions').addEventListener('change', () => {
            const on = $('show-captions').checked;
            ['fx-monologue-1', 'fx-monologue-2'].forEach((id) => {
                $(id).style.opacity = on ? '1' : '0';
            });
        });
        $('show-process').addEventListener('change', () => {
            $('fx-process').style.opacity = $('show-process').checked ? '1' : '0';
        });

        $('btn-copy').addEventListener('click', () => {
            out.select();
            const done = () => out.setSelectionRange(0, out.value.length);
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(out.value).catch(done);
            } else {
                document.execCommand('copy');
            }
        });
        $('btn-reset').addEventListener('click', () => {
            Object.keys(DEFAULT_LAYOUT).forEach((key) => {
                LAYOUT[key] = JSON.parse(JSON.stringify(DEFAULT_LAYOUT[key]));
            });
            applyStaticState();
            select(current);
            refreshOutput();
        });

        $('hide-panel').addEventListener('click', () => {
            $('ctrl').classList.add('hidden');
            $('show-panel').classList.add('show');
            setTimeout(buildHandles, 220);
        });
        $('show-panel').addEventListener('click', () => {
            $('ctrl').classList.remove('hidden');
            $('show-panel').classList.remove('show');
            setTimeout(buildHandles, 220);
        });
        window.addEventListener('resize', () => setTimeout(buildHandles, 80));
    }

    buildList();
    applyStaticState();
    select('frame');
    refreshOutput();
    bindEvents();
})();
