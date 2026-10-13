/* 书页视频页的布局配置：编辑器中调整后，把 window.FX_LAYOUT 贴回本文件即可 */
(function () {
    'use strict';

    window.FX_LAYOUT = {
        // 边框 + 视频窗（相对整个视口）
        frame: { left: 3.26, top: 7.78, width: 92.74 },

        // 以下元素相对 fx-frame
        boy: { left: 3.94, top: 65.13, width: 92.20 },
        verticalBar: { left: 12.39, top: 7.20, height: 86.09 },
        logo: { left: -8.16, top: -12.60, height: 121.81 },
        token: { left: 19.62, top: 29.28, height: 42.48 },
        text1: { left: 31.81, top: 22.59, height: 51.37 },
        text2: { left: 34.61, top: 16.07, height: 64.00 },
        text3: { left: 84.76, top: 31.52, height: 28.81 },
        text4: { left: 87.51, top: 39.12, height: 11.54 },
        frameLogo: { left: 1.88, top: 82.32, height: 23.33 },

        // 边框下方（相对整个视口）
        mono1: { left: 10.50, top: 83.64, width: 41.33 },
        mono2: { left: 51.43, top: 83.36, width: 43.96 },
        process: { left: 16.60, top: 76.66, width: 63.60 },
    };

    // 各组件默认使用的属性（横向条调 width，竖向图调 height）
    window.FX_LAYOUT_META = {
        frame: { resize: 'width' },
        boy: { resize: 'width' },
        verticalBar: { resize: 'height' },
        logo: { resize: 'height' },
        token: { resize: 'height' },
        text1: { resize: 'height' },
        text2: { resize: 'height' },
        text3: { resize: 'height' },
        text4: { resize: 'height' },
        frameLogo: { resize: 'height' },
        mono1: { resize: 'width' },
        mono2: { resize: 'width' },
        process: { resize: 'width' },
    };

    window.FX_LAYOUT_APPLY = function applyFxLayout(layout) {
        layout = layout || window.FX_LAYOUT;
        const get = (id) => document.getElementById(id);

        const setPos = (el, cfg) => {
            if (!el || !cfg) return;
            if (cfg.left !== undefined) el.style.left = cfg.left + '%';
            if (cfg.top !== undefined) el.style.top = cfg.top + '%';
            if (cfg.width !== undefined) el.style.width = cfg.width + '%';
            if (cfg.height !== undefined) el.style.height = cfg.height + '%';
        };

        const frame = get('fx-frame');
        setPos(frame, layout.frame);

        const childMap = {
            'fx-boy': layout.boy,
            'fx-vertical-bar': layout.verticalBar,
            'fx-logo': layout.logo,
            'fx-token': layout.token,
            'fx-text-1': layout.text1,
            'fx-text-2': layout.text2,
            'fx-text-3': layout.text3,
            'fx-text-4': layout.text4,
        };
        Object.keys(childMap).forEach((id) => setPos(get(id), childMap[id]));

        const captionMap = {
            'fx-monologue-1': layout.mono1,
            'fx-monologue-2': layout.mono2,
            'fx-process': layout.process,
        };
        Object.keys(captionMap).forEach((id) => setPos(get(id), captionMap[id]));

        // 常驻 logo 放在 fx-frame 之外，需要按 fx-frame 坐标换算，让下半部分露出到书页
        const logoCfg = layout.frameLogo;
        const logoEl = get('fx-frame-logo');
        if (frame && logoEl && logoCfg) {
            const fr = frame.getBoundingClientRect();
            logoEl.style.left = (fr.left + (fr.width * logoCfg.left) / 100) + 'px';
            logoEl.style.top = (fr.top + (fr.height * logoCfg.top) / 100) + 'px';
            logoEl.style.height = ((fr.height * logoCfg.height) / 100) + 'px';
            logoEl.style.width = 'auto';
        }
    };

    window.addEventListener('resize', () => {
        window.FX_LAYOUT_APPLY(window.FX_LAYOUT);
    });
})();
