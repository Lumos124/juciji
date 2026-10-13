(function () {
    'use strict';

    const $ = (id) => document.getElementById(id);
    const root = document.querySelector('.page-edit-root');
    const stage = $('page-stage');
    const handles = $('handles');
    const panel = $('panel');
    const barSideRow = $('bar-side-row');
    const elements = {
        left: $('page-left'),
        right: $('page-right'),
        barLeft: $('page-bar-left'),
        barRight: $('page-bar-right'),
    };

    const DEFAULTS = JSON.parse(JSON.stringify(window.PAGE_STAGE_LAYOUT_DEFAULTS));
    const layout = JSON.parse(JSON.stringify(window.PAGE_STAGE_LAYOUT));
    let current = 'left';
    let barSide = 'left';
    let drag = null;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function fmt(value) {
        return (Math.round(value * 100) / 100).toFixed(2);
    }

    function currentConfig() {
        if (current === 'bar') return layout[barSide === 'right' ? 'barRight' : 'barLeft'];
        return layout[current];
    }

    function currentElement() {
        if (current === 'bar') return barSide === 'right' ? elements.barRight : elements.barLeft;
        return elements[current];
    }

    function setElementConfig(el, cfg) {
        if (!el || !cfg) return;
        el.style.left = cfg.left + '%';
        el.style.top = cfg.top + '%';
        el.style.width = cfg.width + '%';
        el.style.height = cfg.height + '%';
    }

    function applyLayout(keepHandles) {
        setElementConfig(elements.left, layout.left);
        setElementConfig(elements.right, layout.right);
        setElementConfig(elements.barLeft, layout.barLeft);
        setElementConfig(elements.barRight, layout.barRight);
        renderComponentState();
        renderFields();
        if (keepHandles) positionHandles();
        else renderHandles();
        renderOutput();
    }

    function select(key) {
        current = key;
        document.querySelectorAll('#component-list button').forEach((button) => {
            button.classList.toggle('active', button.dataset.key === key);
        });
        barSideRow.style.display = key === 'bar' ? '' : 'none';
        renderComponentState();
        renderFields();
        renderHandles();
    }

    function renderComponentState() {
        Object.keys(elements).forEach((key) => {
            const el = elements[key];
            const isBar = key === 'barLeft' || key === 'barRight';
            const side = key === 'barRight' ? 'right' : 'left';
            el.classList.toggle('selected', isBar ? (current === 'bar' && barSide === side) : key === current);
            el.classList.toggle('visible', isBar ? ($('show-bar').checked && barSide === side) : $('show-' + key).checked);
        });
    }

    function renderFields() {
        const cfg = currentConfig();
        $('fields-title').textContent = current === 'bar'
            ? (barSide === 'right' ? '右页竖条位置与尺寸' : '左页竖条位置与尺寸')
            : (current === 'left' ? '左页视频位置与尺寸' : '右页视频位置与尺寸');
        $('v-left').value = fmt(cfg.left);
        $('v-top').value = fmt(cfg.top);
        $('v-width').value = fmt(cfg.width);
        $('v-height').value = fmt(cfg.height);
    }

    function renderHandles() {
        handles.innerHTML = '';
        const el = currentElement();
        if (!el || !el.classList.contains('visible')) return;

        const move = document.createElement('button');
        move.type = 'button';
        move.className = 'h move';
        move.textContent = 'M';
        move.addEventListener('pointerdown', (event) => startDrag(event, 'move'));
        handles.appendChild(move);

        const resize = document.createElement('button');
        resize.type = 'button';
        resize.className = 'h resize';
        resize.textContent = 'R';
        resize.addEventListener('pointerdown', (event) => startDrag(event, 'resize'));
        handles.appendChild(resize);
        positionHandles();
    }

    function positionHandles() {
        const el = currentElement();
        if (!el) return;
        const move = handles.querySelector('.h.move');
        const resize = handles.querySelector('.h.resize');
        if (!move || !resize) return;
        const rect = el.getBoundingClientRect();
        move.style.left = (rect.left + rect.width / 2) + 'px';
        move.style.top = (rect.top + rect.height / 2) + 'px';
        resize.style.left = rect.right + 'px';
        resize.style.top = rect.bottom + 'px';
    }

    function startDrag(event, mode) {
        event.preventDefault();
        event.stopPropagation();
        const cfg = currentConfig();
        drag = {
            mode,
            startX: event.clientX,
            startY: event.clientY,
            cfg: { ...cfg },
            stageWidth: stage.getBoundingClientRect().width,
            stageHeight: stage.getBoundingClientRect().height,
        };
        if (event.currentTarget.setPointerCapture) {
            try { event.currentTarget.setPointerCapture(event.pointerId); } catch (err) { /* ignore */ }
        }
    }

    function onPointerMove(event) {
        if (!drag) return;
        const dx = ((event.clientX - drag.startX) / drag.stageWidth) * 100;
        const dy = ((event.clientY - drag.startY) / drag.stageHeight) * 100;
        const cfg = currentConfig();

        if (drag.mode === 'move') {
            cfg.left = clamp(drag.cfg.left + dx, -150, 250);
            cfg.top = clamp(drag.cfg.top + dy, -100, 200);
        } else {
            cfg.width = clamp(drag.cfg.width + dx, 1, 220);
            cfg.height = clamp(drag.cfg.height + dy, 1, 220);
        }
        applyLayout(true);
    }

    function onPointerUp() {
        drag = null;
    }

    function renderOutput() {
        const lines = [
            'const DEFAULTS = {',
            `    left: { left: ${fmt(layout.left.left)}, top: ${fmt(layout.left.top)}, width: ${fmt(layout.left.width)}, height: ${fmt(layout.left.height)} },`,
            `    right: { left: ${fmt(layout.right.left)}, top: ${fmt(layout.right.top)}, width: ${fmt(layout.right.width)}, height: ${fmt(layout.right.height)} },`,
            `    barLeft: { left: ${fmt(layout.barLeft.left)}, top: ${fmt(layout.barLeft.top)}, width: ${fmt(layout.barLeft.width)}, height: ${fmt(layout.barLeft.height)} },`,
            `    barRight: { left: ${fmt(layout.barRight.left)}, top: ${fmt(layout.barRight.top)}, width: ${fmt(layout.barRight.width)}, height: ${fmt(layout.barRight.height)} },`,
            `    sideLeft: { left: ${fmt(layout.sideLeft.left)}, top: ${fmt(layout.sideLeft.top)}, width: ${fmt(layout.sideLeft.width)}, height: ${fmt(layout.sideLeft.height)} },`,
            `    sideRight: { left: ${fmt(layout.sideRight.left)}, top: ${fmt(layout.sideRight.top)}, width: ${fmt(layout.sideRight.width)}, height: ${fmt(layout.sideRight.height)} },`,
            '};',
        ];
        $('output').value = lines.join('\n');
    }

    function syncVideoTime(inputId, outputId, video) {
        const value = Number($(inputId).value);
        $(outputId).textContent = value.toFixed(2) + 's';
        if (video.readyState >= 1 && !video.seeking) video.currentTime = value;
    }

    function flash(message) {
        const status = $('status');
        status.textContent = message;
        window.setTimeout(() => {
            if (status.textContent === message) status.textContent = '';
        }, 1800);
    }

    function bindEvents() {
        document.querySelectorAll('#component-list button').forEach((button) => {
            button.addEventListener('click', () => select(button.dataset.key));
        });

        document.querySelectorAll('#bar-side button').forEach((button) => {
            button.addEventListener('click', () => {
                barSide = button.dataset.side;
                document.querySelectorAll('#bar-side button').forEach((item) => {
                    item.classList.toggle('active', item === button);
                });
                applyLayout();
            });
        });

        Object.keys(elements).forEach((key) => {
            elements[key].addEventListener('pointerdown', (event) => {
                if (key === 'barLeft' || key === 'barRight') {
                    barSide = key === 'barRight' ? 'right' : 'left';
                    document.querySelectorAll('#bar-side button').forEach((item) => {
                        item.classList.toggle('active', item.dataset.side === barSide);
                    });
                    select('bar');
                } else {
                    select(key);
                }
                startDrag(event, 'move');
            });
            const showId = key === 'barLeft' || key === 'barRight' ? 'show-bar' : 'show-' + key;
            $(showId).addEventListener('change', applyLayout);
        });

        ['v-left', 'v-top', 'v-width', 'v-height'].forEach((id) => {
            $(id).addEventListener('input', () => {
                const cfg = currentConfig();
                const value = Number($(id).value);
                if (!Number.isFinite(value)) return;
                if (id === 'v-left') cfg.left = value;
                if (id === 'v-top') cfg.top = value;
                if (id === 'v-width') cfg.width = clamp(value, 1, 220);
                if (id === 'v-height') cfg.height = clamp(value, 1, 220);
                applyLayout();
            });
        });

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
        document.addEventListener('pointercancel', onPointerUp);

        $('time-left').addEventListener('input', () => syncVideoTime('time-left', 'time-left-value', elements.left));
        $('time-right').addEventListener('input', () => syncVideoTime('time-right', 'time-right-value', elements.right));
        $('time-bar').addEventListener('input', () => syncVideoTime('time-bar', 'time-bar-value', elements.bar));

        $('save-preview').addEventListener('click', () => {
            localStorage.setItem('PAGE_STAGE_LAYOUT_OVERRIDE_V2', JSON.stringify(layout));
            flash('已保存到浏览器预览');
        });

        $('copy-config').addEventListener('click', () => {
            const text = $('output').value;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text).then(
                    () => flash('配置已复制'),
                    () => flash('复制失败')
                );
            } else {
                $('output').select();
                document.execCommand('copy');
                flash('配置已复制');
            }
        });

        $('reset-config').addEventListener('click', () => {
            Object.keys(layout).forEach((key) => {
                layout[key] = { ...DEFAULTS[key] };
            });
            localStorage.removeItem('PAGE_STAGE_LAYOUT_OVERRIDE_V2');
            applyLayout();
            flash('已恢复默认');
        });

        $('hide-panel').addEventListener('click', () => {
            panel.classList.add('hidden');
            $('show-panel').classList.add('visible');
            window.setTimeout(renderHandles, 60);
        });
        $('show-panel').addEventListener('click', () => {
            panel.classList.remove('hidden');
            $('show-panel').classList.remove('visible');
            window.setTimeout(renderHandles, 60);
        });

        window.addEventListener('resize', renderHandles);
        root.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    bindEvents();
    select('left');
    syncVideoTime('time-left', 'time-left-value', elements.left);
    syncVideoTime('time-right', 'time-right-value', elements.right);
    syncVideoTime('time-bar', 'time-bar-value', elements.barLeft);
})();
