/* 左右页视频与竖条动画的共享布局配置 */
(function () {
    'use strict';

    const DEFAULTS = {
        left: { left: 8.73, top: 7.01, width: 33.45, height: 75.07 },
        right: { left: 56.58, top: 7.01, width: 33.45, height: 75.07 },
        barLeft: { left: 0.00, top: 3.00, width: 100.00, height: 93.00 },
        barRight: { left: -4.00, top: 4.30, width: 100.00, height: 92.00 },
        sideLeft: { left: 2.12, top: 0.5, width: 5.61, height: 99.00 },
        sideRight: { left: 91.65, top: 0.5, width: 5.61, height: 99.00 },
    };

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function merge(base, override) {
        const result = clone(base);
        if (!override || typeof override !== 'object') return result;
        Object.keys(result).forEach((key) => {
            if (override[key] && typeof override[key] === 'object') {
                Object.assign(result[key], override[key]);
            }
        });
        return result;
    }

    // 边框图片不是和视频元素一样大，而是以视频内容区为基准对齐。
    // 下面数值是“相对视频元素”的百分比，正值表示向右/向下偏移。
    const BORDER_FRAMES = {
        left: { left: -5.79, top: 0.40, width: 105.04, height: 110.24 },
        right: { left: 0.68, top: -8.01, width: 107.96, height: 107.85 },
    };

    function setPos(id, cfg) {
        const el = document.getElementById(id);
        if (!el || !cfg) return;
        el.style.left = cfg.left + '%';
        el.style.top = cfg.top + '%';
        el.style.width = cfg.width + '%';
        el.style.height = cfg.height + '%';
    }

    function borderRect(side, baseLayout) {
        const base = baseLayout[side];
        const frame = BORDER_FRAMES[side];
        return {
            left: base.left + base.width * frame.left / 100,
            top: base.top + base.height * frame.top / 100,
            width: base.width * frame.width / 100,
            height: base.height * frame.height / 100,
        };
    }

    let stored = null;
    try {
        stored = JSON.parse(localStorage.getItem('PAGE_STAGE_LAYOUT_OVERRIDE_V2') || 'null');
    } catch (err) {
        stored = null;
    }

    window.PAGE_STAGE_LAYOUT_DEFAULTS = clone(DEFAULTS);
    window.PAGE_STAGE_LAYOUT = merge(DEFAULTS, stored);

    window.PAGE_BORDER_STATE_APPLY = function applyPageBorderState(side) {
        setPos('page-border-' + side, borderRect(side, window.PAGE_STAGE_LAYOUT));
    };

    window.PAGE_STAGE_LAYOUT_APPLY = function applyPageStageLayout(layout, barSide) {
        layout = layout || window.PAGE_STAGE_LAYOUT;

        setPos('page-left', layout.left);
        setPos('page-right', layout.right);
        setPos('page-mask-left', layout.left);
        setPos('page-mask-right', layout.right);
        setPos('page-bar-left', layout.barLeft);
        setPos('page-bar-right', layout.barRight);
        setPos('page-side-left', layout.sideLeft);
        setPos('page-side-right', layout.sideRight);

        window.PAGE_BORDER_STATE_APPLY('left');
        window.PAGE_BORDER_STATE_APPLY('right');
    };
})();
