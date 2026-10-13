(function () {
    'use strict';

    // 与 nodes.json 保持一致，便于和甲方核对四个硬停节点。
    const NODES = [
        {
            id: 'n01_identify',
            time: 8,
            step: '第一环节',
            title: '名瓷鉴定',
            desc: '博古架场景定格，识别眼前瓷器的年代与窑口。',
            page: 'check.html',
            fxImage: '/image/名瓷鉴定.webp'
        },
        {
            id: 'n02_align',
            time: 67,
            step: '第二环节',
            title: '找碴对缝',
            desc: '案头碎瓷定格，将散落的碎片对齐拼回碗身。',
            page: 'align.html',
            fxImage: '/image/找碴对缝.webp'
        },
        {
            id: 'n03_bind',
            time: 80,
            step: '第三环节',
            title: '绑扎定型',
            desc: '拼合后的碗定格，绕线绑扎，让碎片就此定型。',
            page: 'bind.html',
            fxImage: '/image/绑扎定型.webp'
        },
        {
            id: 'n04_nail',
            time: 91,
            step: '第四环节',
            title: '打孔上钉',
            desc: '聚光特写定格，进入打孔与锔钉的最后一步。',
            page: 'nail.html',
            fxImage: '/image/打孔上钉.webp'
        }
    ];

    // 鼠标滚轮推进速度：按体验反馈再放慢一点，滚动同样距离推进得更少。
    const WHEEL_SENSITIVITY = 0.0025;
    const MIN_WHEEL_STEP = 0.008;
    const SCRUB_EASE = 0.12;
    const SCRUB_STOP_EPSILON = 0.004;
    const COAST_DELAY = 120;
    const COAST_MS = 1500;
    const SEEK_MIN_STEP = 0.02;
    const WARMUP_THRESHOLD = 0.15;
    // 网页动效与故事视频使用独立阶段：前 7.15 秒只推进动效，结束后视频才从 0 秒开始。
    const INTRO_END = 7.15;

    // 节点动效：底条划入 → 游戏标题渐显渐隐 → 棕色卡片（二维码 + 继续）。
    // 全部在边框下层、视频上层，见 fx.css 的 #node-fx。
    const NODE_FX = {
        barInMs: 900,        // 底条从左往右划入
        titleDelayMs: 250,   // 底条到位后停一下再出标题
        titleInMs: 500,      // 标题渐显
        titleHoldMs: 1400,   // 标题停留
        titleOutMs: 500,     // 标题渐隐
    };
    // 卡片下方文案：可扫码 / 前置未完成 / 本环节已完成
    const NODE_TIP = {
        ready: '扫码进入小游戏',
        locked: '请先完成前面的环节',
        done: '本环节已完成',
    };

    // 四个节点的标题图先预加载，避免出场那一下才下载导致闪一下。
    function preloadNodeFxImages() {
        NODES.forEach((node) => {
            if (!node.fxImage) return;
            const img = new Image();
            img.src = node.fxImage;
        });
    }

    const State = {
        LOADING: 'loading',
        READY: 'ready',
        SCRUBBING: 'scrubbing',
        COASTING: 'coasting',
        PRESENTING: 'presenting',
        LOCKED: 'locked',
        ENDED: 'ended'
    };

    class VideoScrollController {
        constructor() {
            this.main = document.getElementById('main-video');
            this.proxy = document.getElementById('proxy-video');
            this.loadingOverlay = document.getElementById('loading-overlay');
            this.hint = document.getElementById('scroll-hint');
            this.nodeFx = document.getElementById('node-fx');
            this.nodeFxTitle = document.getElementById('node-fx-title');
            this.nodeFxCard = document.getElementById('node-fx-card');
            this.nodeFxStep = document.getElementById('node-fx-step');
            this.nodeFxQr = document.getElementById('node-fx-qr');
            this.nodeFxQrTip = document.getElementById('node-fx-qr-tip');
            this.nodeFxContinue = document.getElementById('node-fx-continue');
            this.endOverlay = document.getElementById('end-overlay');
            this.replayBtn = document.getElementById('replay-btn');
            this.fxToken = 0;
            this.fxTimers = [];

            // passed：本次会话里已经点过「继续」的节点，往回滚时不再重复拦截。
            this.nodes = NODES.map((node) => ({ ...node, completed: false, passed: false }));
            // 手机端上报的完成状态（/api/state），决定后续节点的小游戏是否解锁。
            this.serverState = {};
            this.duration = 0;
            this.state = State.LOADING;
            this.targetTime = 0;
            this.lastTime = 0;
            this.lastWheelAt = 0;
            this.coastDirection = 1;
            this.coastTimer = null;
            this.coastUntil = 0;
            this.lockedNode = null;
            this.touchStartY = null;
            this.mainReady = false;
            this.proxyReady = false;
            this.proxySwitching = false;
            this.proxySeekInFlight = false;
            this.pendingProxySeek = null;
            this.presenting = false;
            this.switchId = 0;
            this.introActive = true;
            this.introTime = 0;
            this.introTarget = 0;
            this.lanHost = null;
            this.lanPort = null;
            this.lanProtocol = null;
            this.qrDetectStarted = false;
            this.storyBgm = document.getElementById('story-bgm');
            this.storyBgmStarted = false;
            this.completionPollTimer = null;

            preloadNodeFxImages();
            this.fetchLanInfo();  // 取服务器局域网地址，保证二维码手机能进
            this.fetchCompletionState();   // 取已完成环节，决定节点解锁状态
            this.bindEvents();
            this.raf = requestAnimationFrame((now) => this.animate(now));
        }

        bindEvents() {
            this.main.addEventListener('loadedmetadata', () => {
                this.duration = Number.isFinite(this.main.duration) ? this.main.duration : 0;
                this.main.currentTime = 0;
                this.proxy.currentTime = 0;
                this.lastTime = 0;
            });

            this.main.addEventListener('canplay', () => {
                this.mainReady = true;
                this.tryStart();
            });

            this.proxy.addEventListener('canplay', () => {
                this.proxyReady = true;
                this.tryStart();
            });

            this.proxy.addEventListener('seeked', () => this.onProxySeeked());
            this.main.addEventListener('ended', () => this.handleEnd());

            window.addEventListener('wheel', (e) => {
                e.preventDefault();
                const multiplier = e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 100 : 1;
                this.applyScrollDelta(e.deltaY * multiplier);
            }, { passive: false });

            document.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    this.touchStartY = e.touches[0].clientY;
                    if (this.state !== State.LOCKED) {
                        e.preventDefault();
                    }
                }
            }, { passive: false });

            document.addEventListener('touchmove', (e) => {
                if (e.touches.length !== 1 || this.touchStartY === null) return;
                const y = e.touches[0].clientY;
                const delta = this.touchStartY - y;
                this.touchStartY = y;
                if (this.state !== State.LOCKED) {
                    e.preventDefault();
                }
                // 触摸上滑 = 向前推进，与滚轮方向保持一致。
                this.applyScrollDelta(-delta * 1.5);
            }, { passive: false });

            document.addEventListener('touchend', () => {
                this.touchStartY = null;
            }, { passive: true });

            this.nodeFxContinue.addEventListener('click', () => this.unlockNode());
            this.replayBtn.addEventListener('click', () => this.replay());

            // 全流程背景音乐：浏览器要求有声播放必须先有用户手势，第一次滚轮/触摸/按键即可启动。
            const startStoryBgm = () => this.startStoryBgm();
            window.addEventListener('pointerdown', startStoryBgm);
            window.addEventListener('touchstart', startStoryBgm);
            window.addEventListener('wheel', startStoryBgm, { once: true });
            window.addEventListener('keydown', startStoryBgm, { once: true });
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    if (this.storyBgm && !this.storyBgm.paused) this.storyBgm.pause();
                } else if (this.storyBgmStarted) {
                    const p = this.storyBgm.play();
                    if (p && p.catch) p.catch(() => {});
                }
            });
        }

        startStoryBgm() {
            if (!this.storyBgm || this.storyBgmStarted) return;
            this.storyBgmStarted = true;
            this.storyBgm.volume = 0.5;
            const p = this.storyBgm.play();
            if (p && p.catch) {
                p.catch(() => {
                    this.storyBgmStarted = false;
                });
            }
        }

        async tryStart() {
            if (this.state !== State.LOADING || !this.mainReady || !this.proxyReady) return;
            this.state = State.READY;
            const id = ++this.switchId;
            await this.ensureFrame(this.main, 0);
            if (id !== this.switchId || this.state !== State.READY) return;
            this.loadingOverlay.classList.add('hidden');
            this.showVideo(this.main);
            this.syncTimelineExposure();
        }

        showVideo(video) {
            const showMain = video === this.main;
            this.main.classList.toggle('active', showMain);
            this.proxy.classList.toggle('active', !showMain);
        }

        waitPainted() {
            return new Promise((resolve) => {
                requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
            });
        }

        ensureFrame(video, time) {
            return new Promise((resolve) => {
                const target = Math.max(0, Math.min(this.duration || time, time));
                const needSeek = Math.abs(video.currentTime - target) > 0.02 || video.seeking;

                const painted = () => {
                    if (typeof video.requestVideoFrameCallback === 'function') {
                        Promise.race([
                            new Promise((r) => video.requestVideoFrameCallback(() => r())),
                            this.waitPainted()
                        ]).then(resolve);
                    } else {
                        this.waitPainted().then(resolve);
                    }
                };

                if (!needSeek) {
                    this.waitPainted().then(resolve);
                    return;
                }

                const done = () => {
                    video.removeEventListener('seeked', done);
                    painted();
                };
                video.addEventListener('seeked', done);
                try {
                    video.currentTime = target;
                } catch (err) {
                    video.removeEventListener('seeked', done);
                    resolve();
                }
            });
        }

        applyScrollDelta(deltaY) {
            if (this.state === State.LOADING || this.state === State.ENDED) {
                return;
            }
            if (!this.duration) return;

            // 向下滚 = 前进播放，向上滚 = 后退播放。
            const amount = deltaY * WHEEL_SENSITIVITY;
            if (Math.abs(amount) < MIN_WHEEL_STEP) return;

            // 节点动效播放期间（锁定状态）滚轮/触摸完全失效：
            // 向前、向后都不响应，必须等动效播完再点「继续」。
            if (this.state === State.LOCKED) {
                return;
            }

            if (this.introActive) {
                this.stopCoastPlayback();
                this.introTarget = Math.max(0, Math.min(INTRO_END, this.introTarget + amount));
                this.hint.classList.add('dimmed');
                this.lastWheelAt = performance.now();
                return;
            }

            const currentStory = this.state === State.COASTING
                ? this.proxy.currentTime
                : this.state === State.SCRUBBING
                    ? this.lastTime
                    : this.main.currentTime;
            if (amount < 0 && currentStory <= 0.001) {
                this.stopCoastPlayback();
                this.state = State.READY;
                this.introActive = true;
                this.introTime = INTRO_END;
                this.introTarget = Math.max(0, INTRO_END + amount);
                this.showVideo(this.main);
                this.syncTimelineExposure();
                return;
            }

            this.coastDirection = amount >= 0 ? 1 : -1;

            // 惯性播放中再次滚动：立刻停住播放，回到手动寻帧。
            if (this.state === State.COASTING) {
                this.stopCoastPlayback();
                // 以上一次惯性结束的时刻为新的起点，避免回跳。
                this.lastTime = this.proxy.currentTime;
                this.state = State.SCRUBBING;
            } else if (this.state !== State.SCRUBBING) {
                this.lastTime = this.main.currentTime;
                this.beginScrub(this.lastTime);
            }

            const base = this.state === State.SCRUBBING ? this.lastTime : this.main.currentTime;
            this.targetTime = Math.max(0, Math.min(this.duration, base + amount));
            this.hint.classList.add('dimmed');
            this.lastWheelAt = performance.now();

            clearTimeout(this.coastTimer);
            this.coastTimer = setTimeout(() => this.startCoast(), COAST_DELAY);

            // 单次大幅滚动直接越过节点时，立即精准定位并锁定。
            const node = this.findNodeToLock(base, this.targetTime);
            if (node) {
                this.lockNode(node);
            }
        }

        async beginScrub(base) {
            this.presenting = false;
            this.switchId++;
            this.proxySwitching = true;
            this.state = State.SCRUBBING;
            this.lastWheelAt = performance.now();
            const id = this.switchId;

            await this.ensureFrame(this.proxy, base);
            if (id !== this.switchId || this.state !== State.SCRUBBING) return;
            this.proxySwitching = false;
            this.showVideo(this.proxy);
        }

        requestProxySeek(time) {
            if (this.proxySeekInFlight) {
                this.pendingProxySeek = time;
                return;
            }
            if (Math.abs(this.proxy.currentTime - time) < SEEK_MIN_STEP) return;
            this.proxySeekInFlight = true;
            this.proxy.currentTime = time;
        }

        onProxySeeked() {
            this.proxySeekInFlight = false;
            if (this.state === State.SCRUBBING && this.pendingProxySeek !== null) {
                const next = this.pendingProxySeek;
                this.pendingProxySeek = null;
                this.requestProxySeek(next);
            }
        }

        warmUpMain(time) {
            if (this.main.seeking) return;
            if (Math.abs(this.main.currentTime - time) < SEEK_MIN_STEP) return;
            this.main.currentTime = time;
        }

        syncProxyTo(time) {
            if (Math.abs(this.proxy.currentTime - time) < SEEK_MIN_STEP) return;
            this.proxy.currentTime = time;
        }

        getStoryTime() {
            if (this.state === State.SCRUBBING) return this.lastTime;
            if (this.state === State.COASTING) return this.proxy.currentTime;
            if (this.state === State.LOCKED) return this.lastTime;
            return this.main.currentTime;
        }

        syncTimelineExposure() {
            if (this.introActive) {
                window.__storyTime = 0;
                window.__timelineTime = this.introTime;
                return;
            }
            const story = this.getStoryTime();
            window.__storyTime = story;
            window.__timelineTime = INTRO_END + story;
        }

        finishIntro() {
            if (!this.introActive) return;
            this.introActive = false;
            this.introTime = INTRO_END;
            this.introTarget = INTRO_END;
            this.lastTime = 0;
            this.targetTime = 0;
            this.state = State.READY;
            this.showVideo(this.main);
            this.syncProxyTo(0);
            this.syncTimelineExposure();
        }

        startCoast() {
            if (this.state !== State.SCRUBBING) return;
            this.coastTimer = null;

            this.main.pause();
            this.proxy.pause();

            this.state = State.COASTING;
            this.coastUntil = performance.now() + COAST_MS;
        }

        stopCoastPlayback() {
            this.main.pause();
            this.proxy.pause();
            this.proxy.playbackRate = 1;
            this.main.playbackRate = 1;
        }

        async finishCoast() {
            if (this.state !== State.COASTING) return;
            this.stopCoastPlayback();
            this.state = State.PRESENTING;
            const id = ++this.switchId;
            const time = this.proxy.currentTime;

            // main 已通过预热接近该时间点，只需最后一次精确定位即可无缝切回。
            await this.ensureFrame(this.main, time);
            if (id !== this.switchId || this.state !== State.PRESENTING) return;
            this.showVideo(this.main);
            this.state = State.READY;
            this.lastTime = this.main.currentTime;
            this.targetTime = this.lastTime;
            this.syncProxyTo(this.lastTime);
            this.syncTimelineExposure();
        }

        findNodeToLock(from, to) {
            if (to <= from) return null;
            // 已经完成过的节点不再拦截；from 处留一点余量，避免刚点完“继续”
            // 因播放时间的细微抖动又把同一个节点重新锁住。
            const candidates = this.nodes
                .filter((node) => !node.completed && !node.passed && node.time > from + 0.05 && node.time <= to + 0.001)
                .sort((a, b) => a.time - b.time);
            return candidates.length ? candidates[0] : null;
        }

        lockNode(node) {
            this.stopCoastPlayback();
            this.proxySeekInFlight = false;
            this.pendingProxySeek = null;
            this.presenting = false;
            this.lastTime = node.time;
            this.targetTime = node.time;
            this.lockedNode = node;
            this.state = State.LOCKED;
            this.syncTimelineExposure();

            this.startNodeFx(node);
            this.presentLockedFrame(node.time);
            this.startCompletionPoll(node);
        }

        async presentLockedFrame(time) {
            const id = ++this.switchId;
            await this.ensureFrame(this.main, time);
            if (id !== this.switchId || this.state !== State.LOCKED) return;
            this.showVideo(this.main);
            this.syncTimelineExposure();
        }

        unlockNode() {
            this.stopCompletionPoll();
            // “继续”只表示往后推进剧情，不等于这个环节已经玩过；
            // 完成与否由手机端上报（/api/complete）决定。
            // 但标记 passed：往回滚时不再被同一个节点拦住。
            if (this.lockedNode) this.lockedNode.passed = true;
            this.lockedNode = null;
            this.stopNodeFx();
            this.switchId++;
            this.state = State.READY;
            this.lastTime = this.main.currentTime;
            this.targetTime = this.lastTime;
            this.syncProxyTo(this.lastTime);
            this.syncTimelineExposure();
        }

        startCompletionPoll(node) {
            this.stopCompletionPoll();
            if (!node || !node.id) return;

            const poll = async () => {
                if (this.lockedNode !== node) return;
                await this.fetchCompletionState();
                if (this.lockedNode !== node) return;
                // 前置环节完成后，当前节点的二维码要在原地自动解锁。
                this.renderNodeCard();
                this.completionPollTimer = setTimeout(poll, 1200);
            };
            poll();
        }

        /* ---------------- 完成状态：决定节点是否解锁 ---------------- */
        isNodeCompleted(node) {
            return !!(node && (node.completed || this.serverState[node.id]));
        }

        // 只有前面所有环节都做完，当前节点的小游戏才解锁。
        isNodeUnlocked(node) {
            const index = this.nodes.indexOf(node);
            if (index <= 0) return true;
            for (let i = 0; i < index; i++) {
                if (!this.isNodeCompleted(this.nodes[i])) return false;
            }
            return true;
        }

        async fetchCompletionState() {
            try {
                const res = await fetch('/api/state', { cache: 'no-store' });
                if (!res.ok) return;
                const data = await res.json();
                if (!data || !data.completed) return;
                this.serverState = data.completed;
                this.nodes.forEach((node) => { node.completed = !!this.serverState[node.id]; });
            } catch (err) {
                // 旧服务进程没有该接口时忽略，节点仍可通过“继续”往后推进。
            }
        }

        stopCompletionPoll() {
            if (this.completionPollTimer) {
                clearTimeout(this.completionPollTimer);
                this.completionPollTimer = null;
            }
        }

        /* ---------------- 节点动效：底条 → 游戏标题 → 棕色卡片（二维码 + 继续） ---------------- */
        clearFxTimers() {
            this.fxTimers.forEach((id) => clearTimeout(id));
            this.fxTimers = [];
        }

        later(ms, fn) {
            const token = this.fxToken;
            const id = setTimeout(() => {
                if (token !== this.fxToken) return;
                fn();
            }, ms);
            this.fxTimers.push(id);
            return id;
        }

        startNodeFx(node) {
            this.stopNodeFx();
            const fx = this.nodeFx;
            if (!fx) return;
            const token = ++this.fxToken;

            fx.classList.remove('in', 'title', 'card');
            fx.classList.add('active');
            if (this.nodeFxTitle) this.nodeFxTitle.src = node.fxImage || '';
            if (this.nodeFxCard) this.nodeFxCard.classList.remove('locked', 'done');

            // 1. 底条从左往右划入
            requestAnimationFrame(() => {
                if (token !== this.fxToken) return;
                fx.classList.add('in');
            });

            const t = NODE_FX;
            // 各段依次串联：后一段从“前一段真正开始”起算，
            // 这样即使视频 seek 卡住主线程，也不会把标题/卡片的显示窗口挤没。
            this.later(t.barInMs, () => {
                this.later(t.titleDelayMs, () => {
                    fx.classList.add('title');                             // 2. 游戏标题渐显
                    this.later(t.titleInMs + t.titleHoldMs, () => {
                        fx.classList.remove('title');                      // 3. 游戏标题渐隐
                        // 4. 棕色卡片：二维码 + 继续
                        this.later(t.titleOutMs, () => this.showNodeCard());
                    });
                });
            });
        }

        stopNodeFx() {
            this.fxToken++;
            this.clearFxTimers();
            if (this.nodeFx) {
                this.nodeFx.classList.remove('active', 'in', 'title', 'card');
            }
            if (this.nodeFxCard) this.nodeFxCard.classList.remove('locked', 'done');
        }

        /* 出示棕色卡片：二维码 + 继续；前置环节没做完时二维码保持锁定态。 */
        showNodeCard() {
            const node = this.lockedNode;
            if (!node) return;
            if (this.nodeFx) this.nodeFx.classList.add('card');
            this.renderNodeCard();
        }

        renderNodeCard() {
            const node = this.lockedNode;
            const card = this.nodeFxCard;
            if (!node || !card) return;

            const unlocked = this.isNodeUnlocked(node);
            const done = this.isNodeCompleted(node);
            card.classList.toggle('locked', !unlocked);
            card.classList.toggle('done', done);

            if (this.nodeFxStep) this.nodeFxStep.textContent = node.step + ' · ' + node.title;
            if (this.nodeFxQrTip) {
                this.nodeFxQrTip.textContent = !unlocked
                    ? NODE_TIP.locked
                    : (done ? NODE_TIP.done : NODE_TIP.ready);
            }
            // 前置环节没完成时不出二维码，等完成后再原地解锁。
            if (unlocked) this.renderQr(node);
            else this.drawLockedQr();
        }

        // 未解锁：二维码位置画一块“未解锁”占位，避免出现空白方块。
        drawLockedQr() {
            const canvas = this.nodeFxQr;
            if (!canvas) return;
            const size = canvas.width;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#241d15';
            ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = 'rgba(201, 164, 92, 0.55)';
            ctx.lineWidth = Math.max(2, size * 0.012);
            ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth);
            ctx.fillStyle = 'rgba(233, 220, 192, 0.78)';
            ctx.font = Math.round(size * 0.14) + 'px "Noto Serif SC", "Songti SC", serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('未解锁', size / 2, size / 2);
        }

        renderQr(node) {
            const canvas = this.nodeFxQr;
            this.qrNode = node;
            if (!canvas) return;
            if (typeof QRCode === 'undefined' || typeof QRErrorCorrectLevel === 'undefined') {
                const size = canvas.width;
                const margin = Math.round(size * 0.09);
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, size, size);
                ctx.fillStyle = '#13110d';
                ctx.font = '12px sans-serif';
                ctx.fillText('二维码组件缺失', margin, size / 2);
                return;
            }

            this.drawQr(this.getArUrl(node));
            if (!this.lanHost && !this.qrDetectStarted) {
                this.qrDetectStarted = true;
                // 首选服务器返回的局域网地址；拿不到再退回 WebRTC 探测。
                this.fetchLanInfo().then((host) => {
                    if (host) return;
                    return this.detectLanHost().then((h) => {
                        if (!h) {
                            this.qrDetectStarted = false;
                            return;
                        }
                        this.lanHost = h;
                        const currentNode = this.lockedNode || this.qrNode;
                        if (currentNode) this.drawQr(this.getArUrl(currentNode));
                    });
                });
            }
        }

        drawQr(url) {
            const canvas = this.nodeFxQr;
            if (!canvas) return;
            const size = canvas.width;
            const margin = Math.round(size * 0.09);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, size, size);
            const qr = new QRCode(0, QRErrorCorrectLevel.M);
            qr.addData(url);
            qr.make();

            const count = qr.getModuleCount();
            const cell = (size - margin * 2) / count;
            ctx.fillStyle = '#13110d';
            for (let row = 0; row < count; row++) {
                for (let col = 0; col < count; col++) {
                    if (qr.isDark(row, col)) {
                        const x = margin + col * cell;
                        const y = margin + row * cell;
                        ctx.fillRect(x, y, Math.ceil(cell), Math.ceil(cell));
                    }
                }
            }
        }

        // 服务器 /api/info 里的局域网地址（比 WebRTC 可靠：Chrome 会隐藏本机 IP）
        fetchLanInfo() {
            return fetch('/api/info', { cache: 'no-store' })
                .then((res) => (res.ok ? res.json() : null))
                .then((info) => {
                    if (!info || !Array.isArray(info.lanHosts) || !info.lanHosts.length) return null;
                    this.lanHost = info.host || info.lanHosts[0];
                    this.lanPort = info.port || null;
                    this.lanProtocol = info.protocol || 'http:';
                    // 二维码已经显示出来就按局域网地址重画
                    const node = this.lockedNode || this.qrNode;
                    if (node && this.nodeFx && this.nodeFx.classList.contains('card')) {
                        this.drawQr(this.getArUrl(node));
                    }
                    return this.lanHost;
                })
                .catch(() => null);
        }

        isLocalQrHost() {
            return /^(localhost|127(?:\.\d{1,3}){3}|::1)$/i.test(location.hostname);
        }

        detectLanHost() {
            return new Promise((resolve) => {
                let found = null;
                try {
                    const pc = new RTCPeerConnection({ iceServers: [] });
                    pc.createDataChannel('');
                    pc.onicecandidate = (event) => {
                        if (!event.candidate) {
                            try { pc.close(); } catch (err) { /* ignore */ }
                            resolve(found);
                            return;
                        }
                        const match = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/.exec(event.candidate.candidate || '');
                        if (!match || match[1] === '127.0.0.1' || /^0\./.test(match[1])) return;
                        const ip = match[1];
                        const isPrivate = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(ip);
                        if (isPrivate || !found) found = ip;
                    };
                    pc.createOffer()
                        .then((offer) => pc.setLocalDescription(offer))
                        .catch(() => resolve(null));
                    setTimeout(() => {
                        try { pc.close(); } catch (err) { /* ignore */ }
                        resolve(found);
                    }, 2000);
                } catch (err) {
                    resolve(null);
                }
            });
        }

        getArUrl(node) {
            // 有服务器给的局域网地址就用它（localhost 手机扫不进来）
            if (this.lanHost) {
                const proto = this.lanProtocol || 'http:';
                const port = this.lanPort && this.lanPort !== 80 && this.lanPort !== 443 ? ':' + this.lanPort : '';
                return `${proto}//${this.lanHost}${port}/ar.html?node=${node.id}`;
            }
            const isHttp = location.protocol === 'http:' || location.protocol === 'https:';
            const origin = isHttp ? location.origin : 'https://example.com';
            const base = origin.replace(
                /\/\/(?:localhost|127(?:\.\d{1,3}){3}|\[::1\])/i,
                `//${location.hostname}`
            );
            return `${base}/ar.html?node=${node.id}`;
        }

        async handleEnd() {
            if (this.state === State.ENDED) return;
            this.stopCoastPlayback();
            this.stopCompletionPoll();
            this.proxySeekInFlight = false;
            this.pendingProxySeek = null;
            this.presenting = false;
            this.state = State.ENDED;
            const id = ++this.switchId;

            await this.ensureFrame(this.main, this.duration);
            if (id !== this.switchId || this.state !== State.ENDED) return;
            this.showVideo(this.main);
            this.syncTimelineExposure();
            this.endOverlay.classList.remove('hidden');
        }

        async replay() {
            this.switchId++;
            this.stopCoastPlayback();
            this.stopCompletionPoll();
            try {
                fetch('/api/reset', { method: 'POST' }).catch(() => {});
            } catch (err) {
                /* 忽略旧服务进程不支持的接口 */
            }
            this.proxySeekInFlight = false;
            this.pendingProxySeek = null;
            this.presenting = false;
            this.lastTime = 0;
            this.targetTime = 0;
            this.state = State.READY;
            this.lockedNode = null;
            this.serverState = {};
            this.nodes.forEach((node) => {
                node.completed = false;
                node.passed = false;
            });
            this.stopNodeFx();
            this.endOverlay.classList.add('hidden');
            this.hint.classList.remove('dimmed');
            this.proxy.currentTime = 0;
            this.introActive = true;
            this.introTime = 0;
            this.introTarget = 0;
            window.__storyTime = 0;
            window.__timelineTime = 0;

            const id = this.switchId;
            await this.ensureFrame(this.main, 0);
            if (id !== this.switchId || this.state !== State.READY) return;
            this.showVideo(this.main);
            this.syncTimelineExposure();
        }

        animate(now) {
            this.raf = requestAnimationFrame((t) => this.animate(t));

            if (this.introActive) {
                const diff = this.introTarget - this.introTime;
                if (Math.abs(diff) <= SCRUB_STOP_EPSILON) {
                    this.introTime = this.introTarget;
                } else {
                    this.introTime += diff * SCRUB_EASE;
                }
                this.syncTimelineExposure();
                if (this.introTime >= INTRO_END - 0.0001) {
                    this.finishIntro();
                }
                return;
            }

            if (this.state === State.SCRUBBING) {
                if (this.proxySwitching) return;

                const current = this.lastTime;
                const diff = this.targetTime - current;
                let next;

                if (Math.abs(diff) <= SCRUB_STOP_EPSILON) {
                    next = this.targetTime;
                } else {
                    next = current + diff * SCRUB_EASE;
                }

                const node = this.findNodeToLock(current, next);
                if (node) {
                    this.lockNode(node);
                    return;
                }

                this.lastTime = next;
                this.syncTimelineExposure();

                if (next >= this.duration - 0.05) {
                    this.handleEnd();
                    return;
                }

                this.requestProxySeek(next);

                if (Math.abs(diff) < WARMUP_THRESHOLD) {
                    this.warmUpMain(next);
                }
                return;
            }

            if (this.state === State.COASTING) {
                const current = this.proxy.currentTime;
                const diff = this.targetTime - current;
                let next;
                if (Math.abs(diff) <= SCRUB_STOP_EPSILON) {
                    next = this.targetTime;
                } else {
                    next = current + diff * SCRUB_EASE;
                }
                next = Math.max(0, Math.min(this.duration, next));

                if (this.coastDirection > 0) {
                    const node = this.findNodeToLock(current, next);
                    if (node) {
                        this.proxy.currentTime = node.time;
                        this.lockNode(node);
                        return;
                    }
                    if (next >= this.duration - 0.05) {
                        this.proxy.currentTime = this.duration;
                        this.handleEnd();
                        return;
                    }
                } else if (next <= 0) {
                    this.proxy.currentTime = 0;
                    this.finishCoast();
                    return;
                }

                this.proxy.currentTime = next;
                this.warmUpMain(next);
                this.syncTimelineExposure();

                if (Math.abs(this.targetTime - next) <= SCRUB_STOP_EPSILON || now >= this.coastUntil) {
                    this.finishCoast();
                }
                return;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        window.__videoScrollController = new VideoScrollController();
    });
})();
