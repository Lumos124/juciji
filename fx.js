/* 视频网页动效层：与主视频同一条滚动时间轴联动，全部由 fx.js 逐帧设置 */
(function () {
    'use strict';

    // 前 7.15 秒只播放网页动效，之后才进入故事视频。
    const INTRO_END = 7.15;
    const FX = {
        video: { in0: 0.35, in1: 1.35 },
        mask: { in0: 0.35, in1: 1.25, out0: 6.75, out1: 7.15, max: 0.82 },
        processReveal: { in0: 6.75, in1: 7.55 },
        boy: { in0: 0.95, in1: 1.95, out0: 4.25, out1: 4.75 },
        mono1: { in0: 1.60, in1: 3.00 },
        mono2: { in0: 2.90, in1: 4.25 },
        heroOut: { in0: 4.30, in1: 4.75 },
        logo: { in0: 4.95, in1: 5.25 },
        bar: { in0: 5.05, in1: 5.40 },
        token: { in0: 5.20, in1: 5.55 },
        text1: { in0: 5.35, in1: 5.65 },
        text2: { in0: 5.70, in1: 6.00 },
        text3: { in0: 6.05, in1: 6.45 },
        text4: { in0: 6.50, in1: 6.75 },
        fadeOut: { in0: 6.80, in1: 7.15 },
    };

    // 流程条始终存在；图标只在自己的时间点开始渐亮，短线在相邻节点之间推进。
    const PROCESS_TIMES = [0, 8, 21, 67, 80, 91];
    const LOGO_RAMP = 0.75;
    const PAGE_SEGMENT = {
        start: 21,
        end: 41,
        leftBarStart: 28,
        rightStart: 31,
        rightBarStart: 37,
    };

    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    function ramp(t, a, b) {
        if (b <= a) return t >= b ? 1 : 0;
        return clamp01((t - a) / (b - a));
    }

    function smooth(t, a, b) {
        const p = ramp(t, a, b);
        return p * p * (3 - 2 * p);
    }

    function backOut(p) {
        const c = 1.70158;
        const v = p - 1;
        return 1 + (c + 1) * v * v * v + c * v * v;
    }

    function revealStep(p, steps) {
        if (!steps) return clamp01(p);
        return Math.ceil(clamp01(p) * steps) / steps;
    }

    class FxRenderer {
        constructor() {
            this.main = document.getElementById('main-video');
            this.proxy = document.getElementById('proxy-video');
            this.root = document.querySelector('.fx-root');
            this.frame = document.getElementById('fx-frame');
            this.frameImg = document.getElementById('fx-frame-img');
            this.videoBox = document.querySelector('#fx-frame .video-container');
            this.mask = document.getElementById('fx-mask');
            this.boy = document.getElementById('fx-boy');
            this.mono1 = document.getElementById('fx-monologue-1');
            this.mono2 = document.getElementById('fx-monologue-2');
            this.process = document.getElementById('fx-process');
            this.processLogos = Array.from(document.querySelectorAll('#fx-process .process-logo'));
            this.processLines = Array.from(document.querySelectorAll('#fx-process .process-line'));
            this.pageStage = document.getElementById('page-stage');
            this.pageLeft = document.getElementById('page-left');
            this.pageRight = document.getElementById('page-right');
            this.pageBarLeft = document.getElementById('page-bar-left');
            this.pageBarRight = document.getElementById('page-bar-right');
            this.pageMaskLeft = document.getElementById('page-mask-left');
            this.pageMaskRight = document.getElementById('page-mask-right');
            this.pageBorderLeft = document.getElementById('page-border-left');
            this.pageBorderRight = document.getElementById('page-border-right');
            this.pageBarSide = 'left';
            this.borderLeftActive = false;
            this.borderRightActive = false;
            this.lastInputActive = null;
            if (typeof window.PAGE_STAGE_LAYOUT_APPLY === 'function') {
                window.PAGE_STAGE_LAYOUT_APPLY(window.PAGE_STAGE_LAYOUT, this.pageBarSide);
            }
            this.bar = document.getElementById('fx-vertical-bar');
            this.logo = document.getElementById('fx-logo');
            this.token = document.getElementById('fx-token');
            this.text1 = document.getElementById('fx-text-1');
            this.text2 = document.getElementById('fx-text-2');
            this.text3 = document.getElementById('fx-text-3');
            this.text4 = document.getElementById('fx-text-4');
            this.frameLogo = document.getElementById('fx-frame-logo');
            this.lastFrame = -1;
            if (typeof window.FX_LAYOUT_APPLY === 'function') {
                window.FX_LAYOUT_APPLY(window.FX_LAYOUT);
            }
            this.tick = this.tick.bind(this);
            this.tick();
        }

        currentTime() {
            if (Number.isFinite(window.__timelineTime)) {
                return window.__timelineTime;
            }
            if (!this.main || !this.proxy) return 0;
            if (!this.main.classList.contains('active') && !this.proxy.classList.contains('active')) return 0;
            const story = this.main.classList.contains('active') ? this.main.currentTime : this.proxy.currentTime;
            return INTRO_END + story;
        }

        tick() {
            requestAnimationFrame(this.tick);
            if (!this.frame) return;
            const t = this.currentTime();
            const inputActive = this.isInputActive();
            if (inputActive !== this.lastInputActive) {
                this.lastInputActive = inputActive;
                this.lastFrame = -1;
            }
            if (Math.abs(t - this.lastFrame) < 0.0004) return;
            this.lastFrame = t;
            this.update(t);
        }

        isInputActive() {
            const controller = window.__videoScrollController;
            if (!controller) return false;
            const state = controller.state;
            if (state === 'scrubbing' || state === 'coasting' || state === 'presenting') {
                return true;
            }
            return (performance.now() - (controller.lastWheelAt || 0)) < 600;
        }

        update(t) {
            const F = FX;
            const introTime = Math.min(t, INTRO_END);
            const storyTime = Math.max(0, t - INTRO_END);

            // 边框与常驻 logo 从网页打开起就在；视频窗在序章保持黑底。
            this.frame.style.opacity = '1';
            const chromeOpacity = this.getChromeOpacity(storyTime);
            const pageSegmentActive = storyTime >= 20.6 && storyTime < 41.9;
            this.root.classList.toggle('page-segment-active', pageSegmentActive);
            this.frameImg.style.opacity = chromeOpacity.toFixed(4);
            if (this.frameLogo) this.frameLogo.style.opacity = chromeOpacity.toFixed(4);
            this.frame.style.transform = 'none';

            if (this.videoBox) {
                const videoIn = introTime >= INTRO_END ? 1 : smooth(introTime, F.video.in0, F.video.in1);
                const mainStoryOpacity = Math.max(
                    1 - smooth(storyTime, 20.6, 21.1),
                    smooth(storyTime, PAGE_SEGMENT.end, PAGE_SEGMENT.end + 0.8)
                );
                this.videoBox.style.opacity = (videoIn * mainStoryOpacity).toFixed(4);
            }

            const maskIn = smooth(introTime, F.mask.in0, F.mask.in1);
            const maskOut = 1 - smooth(introTime, F.mask.out0, F.mask.out1);
            const introMask = maskIn * maskOut * F.mask.max;
            this.mask.style.opacity = introMask.toFixed(4);
            this.updatePageVideos(storyTime, pageSegmentActive);

            const effectFade = 1 - smooth(introTime, F.fadeOut.in0, F.fadeOut.in1);
            const heroOut = smooth(introTime, F.heroOut.in0, F.heroOut.in1);

            const boyIn = smooth(introTime, F.boy.in0, F.boy.in1);
            let boy = boyIn * (1 - heroOut);
            if (boy > 0 && introTime < F.boy.out0) {
                const phase = Math.max(0, introTime - F.boy.in1);
                const blink = 0.55 + 0.45 * Math.max(0, Math.sin(phase * 5.2));
                boy *= blink;
            }
            this.boy.style.opacity = boy.toFixed(4);

            const mono = 1 - heroOut;
            this.revealHorizontal(this.mono1, introTime, F.mono1.in0, F.mono1.in1);
            this.revealHorizontal(this.mono2, introTime, F.mono2.in0, F.mono2.in1);
            this.mono1.style.opacity = mono.toFixed(4);
            this.mono2.style.opacity = mono.toFixed(4);

            const processReveal = smooth(t, F.processReveal.in0, F.processReveal.in1) * 100;
            this.process.style.opacity = '1';
            this.process.style.setProperty('--process-reveal', processReveal.toFixed(3) + '%');
            this.updateProcess(storyTime);

            const barIn = smooth(introTime, F.bar.in0, F.bar.in1);
            const barShift = (1 - barIn) * 1.45;
            this.bar.style.opacity = (barIn * effectFade).toFixed(4);
            this.bar.style.transform = `translateX(-50%) translateY(${(-barShift * 100).toFixed(2)}%)`;

            const logoIn = smooth(introTime, F.logo.in0, F.logo.in1);
            const logoShift = (1 - logoIn) * 1.35;
            this.logo.style.opacity = (logoIn * effectFade).toFixed(4);
            this.logo.style.transform = `translateX(${(-logoShift * 100).toFixed(2)}%)`;

            const tokenIn = smooth(introTime, F.token.in0, F.token.in1);
            const tokenScale = 1.12 - tokenIn * 0.12;
            this.token.style.opacity = (tokenIn * effectFade).toFixed(4);
            this.token.style.transform = `scale(${tokenScale.toFixed(4)})`;

            this.revealText(this.text1, introTime, F.text1.in0, F.text1.in1);
            this.revealText(this.text2, introTime, F.text2.in0, F.text2.in1);
            this.revealText(this.text3, introTime, F.text3.in0, F.text3.in1);
            this.revealText(this.text4, introTime, F.text4.in0, F.text4.in1);
            if (this.text1) this.text1.style.opacity = effectFade.toFixed(4);
            if (this.text2) this.text2.style.opacity = effectFade.toFixed(4);
            if (this.text3) this.text3.style.opacity = effectFade.toFixed(4);
            if (this.text4) this.text4.style.opacity = effectFade.toFixed(4);
        }

        updateProcess(storyTime) {
            this.processLogos.forEach((el, index) => {
                if (index === 0) {
                    el.style.opacity = '1';
                    return;
                }
                const start = PROCESS_TIMES[index];
                const glow = smooth(storyTime, start, start + LOGO_RAMP);
                el.style.opacity = glow.toFixed(4);
            });

            this.processLines.forEach((el, index) => {
                const glow = smooth(storyTime, PROCESS_TIMES[index], PROCESS_TIMES[index + 1]);
                el.style.opacity = glow.toFixed(4);
            });
        }

        updatePageVideos(storyTime, active) {
            this.pageStage.classList.toggle('active', active);
            if (!active) {
                [this.pageLeft, this.pageRight, this.pageBarLeft, this.pageBarRight].forEach((video) => video.pause());
                this.pageLeft.style.opacity = '0';
                this.pageRight.style.opacity = '0';
                this.pageMaskLeft.style.opacity = '0';
                this.pageMaskRight.style.opacity = '0';
                this.pageBorderLeft.style.opacity = '0';
                this.pageBorderRight.style.opacity = '0';
                this.pageBarLeft.style.opacity = '0';
                this.pageBarRight.style.opacity = '0';
                return;
            }

            const leftActive = storyTime >= 20.6 && storyTime <= PAGE_SEGMENT.end + 0.8;
            const rightActive = storyTime >= PAGE_SEGMENT.rightStart && storyTime <= PAGE_SEGMENT.end + 0.8;
            const leftBarActive = storyTime >= PAGE_SEGMENT.leftBarStart && storyTime < PAGE_SEGMENT.start + 11;
            const rightBarActive = storyTime >= PAGE_SEGMENT.rightBarStart && storyTime < PAGE_SEGMENT.end;

            const leftOpacity = (
                smooth(storyTime, 20.7, 21.35)
                * (1 - smooth(storyTime, PAGE_SEGMENT.end, PAGE_SEGMENT.end + 0.8))
            );
            const rightOpacity = (
                smooth(storyTime, 20.7, 21.35)
                * (1 - smooth(storyTime, PAGE_SEGMENT.end, PAGE_SEGMENT.end + 0.8))
            );
            this.pageLeft.style.opacity = leftOpacity.toFixed(4);
            this.pageRight.style.opacity = rightOpacity.toFixed(4);

            const pageFadeOut = 1 - smooth(storyTime, PAGE_SEGMENT.end, PAGE_SEGMENT.end + 0.8);
            const pageFadeIn = smooth(storyTime, 20.7, 21.35);
            const leftMaskPhase1 = pageFadeIn * (1 - smooth(storyTime, 21.35, 21.75));
            const leftMaskPhase2 = smooth(storyTime, PAGE_SEGMENT.leftBarStart - 0.2, PAGE_SEGMENT.leftBarStart + 0.2);
            const leftMaskOpacity = Math.min(1, leftMaskPhase1 + leftMaskPhase2) * pageFadeOut;
            const rightMaskPhase1 = pageFadeIn * (1 - smooth(storyTime, PAGE_SEGMENT.rightStart, PAGE_SEGMENT.rightStart + 0.35));
            const rightMaskPhase2 = smooth(storyTime, PAGE_SEGMENT.rightBarStart - 0.2, PAGE_SEGMENT.rightBarStart + 0.2);
            const rightMaskOpacity = Math.min(1, rightMaskPhase1 + rightMaskPhase2) * pageFadeOut;
            this.pageMaskLeft.style.opacity = leftMaskOpacity.toFixed(4);
            this.pageMaskRight.style.opacity = rightMaskOpacity.toFixed(4);

            // 操作边框只在鼠标/触摸操作期间出现：
            // 左页播放时只亮左边框，右页播放时只亮右边框；停止操作后回到书页自带边框。
            const inputActive = this.isInputActive();
            const leftPagePlaying = storyTime < PAGE_SEGMENT.rightStart;
            const rightPagePlaying = storyTime >= PAGE_SEGMENT.rightStart;
            const leftBorderActive = inputActive && leftPagePlaying;
            const rightBorderActive = inputActive && rightPagePlaying;
            this.pageBorderLeft.style.opacity = leftBorderActive ? leftOpacity.toFixed(4) : '0';
            this.pageBorderRight.style.opacity = rightBorderActive ? rightOpacity.toFixed(4) : '0';
            if (leftBorderActive !== this.borderLeftActive) {
                this.borderLeftActive = leftBorderActive;
                if (typeof window.PAGE_BORDER_STATE_APPLY === 'function') {
                    window.PAGE_BORDER_STATE_APPLY('left');
                }
            }
            if (rightBorderActive !== this.borderRightActive) {
                this.borderRightActive = rightBorderActive;
                if (typeof window.PAGE_BORDER_STATE_APPLY === 'function') {
                    window.PAGE_BORDER_STATE_APPLY('right');
                }
            }

            const leftBarPlayActive = leftBarActive;
            const leftBarHoldActive = storyTime >= PAGE_SEGMENT.start + 11 && storyTime < PAGE_SEGMENT.end + 0.8;
            const leftBarVisible = leftBarPlayActive || leftBarHoldActive;
            const leftBarOpacity = smooth(storyTime, PAGE_SEGMENT.leftBarStart, PAGE_SEGMENT.leftBarStart + 0.3)
                * pageFadeOut;
            const rightBarOpacity = smooth(storyTime, PAGE_SEGMENT.rightBarStart, PAGE_SEGMENT.rightBarStart + 0.3)
                * (1 - smooth(storyTime, PAGE_SEGMENT.end - 0.25, PAGE_SEGMENT.end + 0.2));

            this.pageBarLeft.style.opacity = (leftBarVisible ? leftBarOpacity : 0).toFixed(4);
            this.pageBarRight.style.opacity = (rightBarActive ? rightBarOpacity : 0).toFixed(4);

            this.syncScrubVideo(this.pageLeft, storyTime - PAGE_SEGMENT.start, leftActive);
            this.syncScrubVideo(this.pageRight, storyTime - PAGE_SEGMENT.rightStart, rightActive);
            this.syncScrubVideo(
                this.pageBarLeft,
                leftBarPlayActive ? storyTime - PAGE_SEGMENT.leftBarStart : 9999,
                leftBarVisible
            );
            this.syncScrubVideo(
                this.pageBarRight,
                rightBarActive ? storyTime - PAGE_SEGMENT.rightBarStart : -1,
                rightBarActive
            );
        }

        syncScrubVideo(video, time, active) {
            if (!active) {
                video.pause();
                return;
            }
            if (!Number.isFinite(video.duration) || video.readyState < 1 || video.seeking) return;
            const target = Math.max(0, Math.min(video.duration - 0.04, time));
            if (Math.abs(video.currentTime - target) > 0.035) {
                video.currentTime = target;
            }
        }

        getChromeOpacity(storyTime) {
            const hide = smooth(storyTime, 20.6, 21.1);
            const show = smooth(storyTime, PAGE_SEGMENT.end, PAGE_SEGMENT.end + 0.8);
            return Math.max(1 - hide, show);
        }

        revealText(el, t, a, b) {
            if (!el) return;
            const p = smooth(t, a, b);
            const steps = Number(el.dataset.steps || 1);
            const shown = revealStep(p, steps);
            el.style.clipPath = `inset(0 0 ${((1 - shown) * 100).toFixed(2)}% 0)`;
        }

        revealHorizontal(el, t, a, b) {
            if (!el) return;
            const shown = smooth(t, a, b);
            el.style.clipPath = `inset(0 ${((1 - shown) * 100).toFixed(2)}% 0 0)`;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.__fxRenderer = new FxRenderer();
    });
})();
