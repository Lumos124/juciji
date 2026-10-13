# 打孔上钉 · 手机/平板端游戏 说明文档

> 本文档说明"打孔上钉"环节（第四环节）涉及的每个文件用途，以及如何调整图层位置、孔位、分段连线轨迹、动画时长等。
> 所有可调项集中在 `nail.js` 顶部的 `CONFIG` 与 `nail.css` 顶部的 `:root` 变量，按下方指引改对应字段即可。
> 整体设计仿照绑扎定型（bind-*），共享同一静态服务器与同一 PC 端滚动叙事。

---

## 一、文件清单与用途

| 文件 | 作用 | 是否需要改动 |
| --- | --- | --- |
| `project/server.js` | 静态服务器。已新增 `/上钉/` 别名，把项目外的 `焗瓷记/上钉/` 目录挂载到 URL。 | 一般不用改；如要挂载其它外部目录，改顶部 `ALIASES` |
| `project/ar.html` | 手机端入口路由。扫 QR 后落到 `ar.html?node=n04_nail`，此处会自动跳转到 `nail.html`。 | 不用改 |
| `project/qr.html` | 开发者二维码页。已新增"上钉·桌面 QR 路由"和"上钉·直连"两个目标按钮，方便手机扫码直接进游戏调试。 | 仅调试用 |
| `project/nail.html` | 打孔游戏的页面结构（开场覆盖层/工作台/提示-移至操作台/提示-开始体验/提示-连孔上钉/提示-上钉/主玩区(cup+bases+svg+孔+成就)/提示-连线/完成层/右下角退出）。 | 不用改（坐标在 JS 里） |
| `project/nail.css` | 布局与全部动画（渐黑、闪烁、上滑、孔弹出、目标脉冲、钉成就闪光、文字横幅、横屏提示）。颜色/透明度/发光半径等用 `:root` 变量统一管理。 | 改颜色/透明度/发光主要在这里 |
| `project/nail.js` | 游戏逻辑：状态机、孔位拖动连线（`segments` 分段）、钉与文字揭示、阶段评分与完成上报。所有**坐标/尺寸/时长**集中在顶部 `CONFIG`。 | 调位置/坐标/时长在这里 |
| `project/nail-edit.html` | 可视化编辑器页面（cup+bases+svg+孔+成就预览+提示图预览+控制面板）。 | 不用改 |
| `project/nail-edit.js` | 编辑器逻辑：组件位置/孔位（分段连线）/成就位置三种模式，手柄拖拽 + 分段连线列表 + 复制 CONFIG 片段。 | 不用改 |
| `project/nail-README.md` | 本文档。 | — |
| `焗瓷记/上钉/image/*.png` | 全部 PNG 素材（开幕、工作台背景、瓷杯底图、打孔底图、孔、提示图、梅花钉/柳叶钉、成就文字等）。 | 一般不动；如换图请保持文件名 |

---

## 二、如何运行

1. 在 `焗瓷记` 根目录启动服务器（与绑扎共用）：
   ```bash
   node project/server.js
   ```
   - HTTP：`http://<本机IP>:8000/`（电脑端滚动叙事）
   - HTTPS：`https://<本机IP>:8443/`（手机扫码需 HTTPS，证书在 `project/certs/`）
2. 电脑端滚到"第四环节 打孔上钉"节点，弹出 QR。
3. 手机/平板扫码 → 自动跳到 `nail.html`，进入游戏。

> 也可直接访问 `http://<本机IP>:8000/nail.html` 单独测试游戏（无需扫码）。
> **本版本已不依赖陀螺仪**：点段位字"钉"进入开场 → 点"移至操作台" → 点闪烁的"开始体验"即可走完流程，桌面上也能完整跑通。
> 调试快捷键（进入主玩区后有效）：`M` = 梅花钉成就闪一下，`L` = 柳叶钉成就闪一下。
> 控制台调用：`_NAIL.startAll()` 直接进主玩区；`_NAIL.startNail(0)` 进梅花钉；`_NAIL.startNail(1)` 进柳叶钉；`_NAIL.reveal('梅花钉' | '柳叶钉')` 直接揭示成就。
>
> **本轮迭代新增（与绑扎定型共用）**：
> - 开场背景视频统一为 `/image/背景.mp4`（带 `poster` 与首次手势补播）。
> - 进入正式游戏会停掉「游戏初始界面」BGM，改播 `game-bgm.js` 的正式游戏 BGM。
> - 右下角新增「退出」按钮：随时按已完成阶段进结算。
> - 结算按阶段评分（2 颗钉，每颗 50 分，全完成 99.9），并把分数 POST 给电脑端 `/api/complete`。

---

## 三、游戏流程（对应代码状态机）

> 当前实现**已去掉陀螺仪/倾斜感应**，鼠标、手指都能完整走完流程。

`INTRO`(点段位字"钉"后的开场) → `LIGHTUP`(工作台亮起 + "移至操作台"渐显，**点它**继续) → `SLIDE_IN`(瓷杯从下往上滑入 + "开始体验"渐显 + "连孔上钉"闪烁，**点"连孔上钉"**继续) → `CUP_ADJUST`(开始体验消失、瓷杯上移、提示移位，"上钉"取代并闪烁) → `BASES_SHOW`(梅花钉/柳叶钉底图依次渐显 + 顶部"连线"提示) → `DRILLING`(逐孔拖动连线) → `COMPLETE`

两种钉的连线分组记在 `CONFIG.nails[i].segments`（数组套数组，每个内层数组是一条连续线段经过的孔序号）：

| 钉种 | 孔数 | 默认连线分组 |
| --- | --- | --- |
| 梅花钉 | 6 | `[[0,2,4,5,3,1,0]]`：一条闭合成环的线 |
| 柳叶钉 | 4 | `[[0,1],[2,3]]`：两条短线 |

每条线段的起点孔会自动落位；用户从当前已落孔**按住拖到金色目标圈**（`hole-target`）附近松手即连上：
1. 松手位置对准目标孔时，该孔出现 `孔.png`（弹出动画）
2. 与上一个孔之间画一条白线（`#cup-svg` 中的 `connect-line`），拖动中显示虚线预览
3. 连完一孔后 `holeGapMs`(280ms) 出现下一个目标孔位金色脉冲圈；未对准时松手可直接重试
4. 一条线段连完会自动落下一条新线段的起点孔，继续连下一条

- 梅花钉 6 孔全连后：上层显示 `梅花钉.png` + `成就——梅花钉文字.png`，金色脉冲高亮 ~3.2s；高亮结束后文字消失、梅花钉变半透明常驻。
- 然后顶部再次显示"连线"提示 → 进入柳叶钉 4 孔（流程同上）。
- 柳叶钉 4 孔全连后：揭示 `柳叶钉.png` + `成就——柳叶钉文字.png`，高亮 3.2s → 文字消失、柳叶钉半透明常驻 → 显示完成层。
- 完成层出现时会把 `{score}` POST 给电脑端（`/api/complete?node=n04_nail&score=...`），分数 = 已完成钉数 / 2 × 100，全完成压到 99.9。

---

## 三（附）· 可视化编辑器：nail-edit.html 使用说明

服务器在跑时，电脑浏览器打开（手机/平板也可）：

```
http://<电脑IP>:8000/nail-edit.html
```

**页面布局**：工作台背景 + 居中的 16:9 设计稿盒（与游戏 `nail.html` 主玩区一致），盒内是 cup-box（瓷杯盒）。cup-box 内可见：瓷杯底图、打孔底图、孔.png、连线轨迹、成就图层预览；浮层有"提示——上钉"和"提示——连线"。右上角控制面板有模式切换、当前钉切换、显示开关、分段连线列表、复制按钮和大文本框。

### 一、三种编辑模式（控制面板"编辑模式"切换）

#### 模式 1：组件位置（默认）
- **紫色 P / R**（打孔底图）：`P` 方块 = 移动；`R` 方块 = 缩放宽。打孔底图比例固定（`1611/2540` 竖向窄长），仅调位置/宽。
- **蓝色 N / R**（提示——上钉）：`N` 方块 = 移动整屏闪烁标识；`R` 方块 = 缩放宽。
- **蓝色 C / R**（提示——连线）：`C` 方块 = 移动杯顶连线提示；`R` 方块 = 缩放宽（按中心居中缩放）。
  - 注：编辑器内连线提示的 `left` 字段代表"中心 X"。导出到 `nail.js` 后通过 `transform: translateX(-50%)` 居中。

#### 模式 2：孔位 / 连线
- 先用控制面板"当前钉"切换：**① 梅花钉 (6 孔)** 或 **② 柳叶钉 (4 孔)**。
- **绿色 ● 圆点**：每个孔的移动手柄，**角标是"段号.位次"**（例如 `1.3` = 第 1 段的第 3 个孔）。
- 拖动圆点 → 孔位实时更新；**金色虚线**按 `segments` 自动连成轨迹（与游戏内白线一致，仅颜色/虚实不同便于辨识）。
- **分段连线面板**（控制面板下方）：列出每条线段依次经过的孔，说明文字为"每段内顺序相连；段间不连线"。当前钉的分段来自 `CONFIG.nails[i].segments`，改分组请直接改该数组（或改完用复制按钮回填）。
- 判定松手的宽容半径 `CONFIG.hole.zoneRadius` 也在这个模式下生效。

#### 模式 3：成就位置
- 先用"当前钉"切换要调的钉。
- **金色 N / R**（钉图）：`N` = 移动；`R` = 缩放宽。
- **紫色圆 T**（文字横幅）：移动文字横幅（横幅始终垂直居中）。
- **紫色方块 H**（文字横幅）：拖动改文字横幅高度。
- 编辑器中钉图半透明显示 + 文字横幅带紫色虚线轮廓，便于辨识位置；游戏端正式流程里这些图层默认隐藏，完成对应钉才会显示——两者共用同一份位置/尺寸配置。

### 二、显示开关
| 按钮 | 作用 |
| --- | --- |
| 隐藏连线轨迹 | 隐藏金色虚线（仅看孔位） |
| 隐藏孔位 | 隐藏所有孔.png（仅看打孔底图） |
| 隐藏成就预览 | 隐藏钉图 + 文字横幅 |

### 三、完成编辑：复制 → 贴回 nail.js

点"**复制 CONFIG 片段**"按钮（或手动选中文本框内容 Ctrl+C）。打开 [nail.js](file:///d:/焗瓷记/project/nail.js)，找到顶部 CONFIG，**整段替换** `timings / layout / bases / prompts / hole / target / nails / nailOrder` 这几段（文本框里的内容即是这些字段的序列化结果）。

保存 `nail.js` 后，刷新 `nail.html` 游戏页面即可看到效果。

---

## 四、调整图层位置（坐标都在 `nail.js` 的 `CONFIG`）

坐标统一用 **0–100 的百分比**（相对各自的盒子），左上角为 (0,0)。盒子说明：
- 打孔底图、孔位、连线、待点目标、钉图、文字横幅 → 相对 **`#cup-box`**（瓷杯盒，比例与瓷杯底图一致，所以 % 直接对齐杯图）。
- 提示——连线 → 相对 **`#play`**（16:9 设计稿盒）。
- 提示——上钉 → 相对 **`#stage`**（整屏舞台）。

### 1) 瓷杯整体大小/位置 → `nail.css`
```css
#cup-box  { height: 92%; aspect-ratio: 5057 / 3833; }
#play { aspect-ratio: 16 / 9; ... padding: 2% 2.6%; }
```
- 想让杯更大/更小：改 `height: 92%`。
- 整体上下边距：改 `#play` 的 `padding`。

### 2) 两张钉底图的位置/大小 → `CONFIG.bases`
```js
bases: [
  { src: '/上钉/image/梅花钉底图.webp', pos: { left: 40.14, top: 15.64, width: 19.95, aspect: 0.6343 } },
  { src: '/上钉/image/柳叶钉底图.webp', pos: { left: 39.06, top: 36.69, width: 22.51, aspect: 0.6343 } },
]
```
- `pos.left/top`：相对 cup-box 的偏移；`pos.width`：相对 cup-box 宽度；`pos.aspect`：固定图比例（一般不动）。
- 编辑器"组件位置"模式下拖紫色 P/R 手柄就是改这两张底图（P 移动、R 缩放宽度）。

### 3) 提示图位置/大小 → `CONFIG.prompts`
```js
prompts: {
    move:            { width: 92.47, top: 65.72, left: 49.98 }, // 移至操作台（整屏）
    startExperience: { width: 92.19, top: 65.72, left: 49.82 }, // 开始体验
    connectBefore:   { width: 9.42,  top: 12.97, left: 49.74 }, // 连孔上钉（瓷杯上滑前）
    connectAfter:    { width: 9.42,  top: 46.4,  left: 50.37 }, // 连孔上钉（瓷杯上移后）
    nail:            { width: 11.53, top: 45.05, left: 50.22 }, // 上钉
    connectLine:     { width: 42.77, top: 12.31, left: 49.9 },  // 提示——连线（杯顶）
}
```
- 这些提示的 `left` 都是中心 X（代码里用 `translateX(-50%)` 居中），`connectLine` 相对 `#play` 定位。

### 4) 孔.png 与目标圈大小 → `CONFIG.hole` / `CONFIG.target`
```js
hole:   { width: 3.5, aspect: 1, zoneRadius: 4 },   // 孔.png；zoneRadius 是松手判定的宽容半径
target: { width: 4 },                               // 待点目标圈（金色脉冲圈）
```

### 5) 各钉的孔位与连线分组 → `CONFIG.nails[i].holes` / `.segments`
```js
nails: [
  {
    method: '梅花钉',
    holes: [ { x:50, y:27.83 }, { x:55.93, y:32.94 }, ... ],  // 6 个孔的坐标
    segments: [[0, 2, 4, 5, 3, 1, 0]],                        // 一条闭合成环的连线
    ...
  },
  {
    method: '柳叶钉',
    holes: [ { x:46.24, y:54.74 }, ... ],   // 4 个孔
    segments: [[0, 1], [2, 3]],             // 两条短线
  }
]
```
- `holes`：孔位的 (x, y) 坐标数组。数组下标即"孔编号"（0, 1, 2, …）。
- `segments`：连线分组。每个内层数组是一条连续线段依次经过的孔编号；玩家就是按这个顺序一孔一孔拖过去的。
  - 单条闭合线（梅花钉）：`[[0,2,4,5,3,1,0]]`，首尾同一个孔表示绕一圈。
  - 多条短线（柳叶钉）：`[[0,1],[2,3]]`，先连完第一组再连第二组。
- 编辑器"孔位/连线"模式下可以直接拖孔位、看连线轨迹；导出的 CONFIG 会带上 `segments`。

### 6) 钉图与文字横幅位置 → `CONFIG.nails[i].achievement`
```js
achievement: {
    nail: { src: '/上钉/image/梅花钉.png',
            pos: { width: 80, left: 10, top: 6 } },           // 钉图相对 cup-box
    text: { src: '/上钉/image/成就——梅花钉文字.png',
            pos: { right: 105, top: 50, height: 96, offsetX: -6, aspect: 14445 / 3957 } },
}
```
- `nail.pos`：钉图相对 cup-box 的位置与大小。`width/left/top` 都是 % of cup-box。
- `text.pos`：文字横幅相对 cup-box 的位置与大小：
  - `right` = 距 cup-box 右边缘多少 %（105 = 压出左侧 5%）。
  - `top` = 竖直中心 50%。
  - `height` = 横幅高度相对 cup-box 高度的 %。
  - `offsetX` = 水平方向微调（`translateX` 的 %）。
  - `aspect` = 固定比例保持文字牌形状（与实际 PNG 比例一致）。

---

## 五、调整颜色 / 透明度 / 发光（主要在 `nail.css` 的 `:root`）

```css
:root {
    --col-bg: #12100c;
    --col-ink: #f2ead9;
    --col-gold: #e6c886;            /* 金色：高亮脉冲、成就描边 */
    --col-line: #ffffff;            /* 连线颜色（白线） */
    --col-pulse: #ffd56b;           /* 待点孔位脉冲色 */
    --highlight-rest-opacity: 0.5;  /* 成就常驻透明度（半透明） */
    --glow-px: 18px;                /* 金色发光半径 */
}
```
- 黑屏遮罩透明度/时长：`#blackout` 的 `opacity` 与 `.dim` 的 `transition`（默认 2.6s）。
- 钉图闪光动画细节：`@keyframes nailFlashBrief`（在 `nail.css`）。
- 文字横幅闪光：`@keyframes textFlashBrief`。

---

## 六、调整动画时长 / 行为阈值（在 `CONFIG.timings`）

```js
timings: {
    lightUpMs: 1400,        // 工作台亮起
    moveShowMs: 1800,       // "移至操作台"停留
    moveFadeMs: 800,        // 提示渐显渐隐
    slideInMs: 1200,        // 瓷杯上滑
    slideFadeMs: 900,
    startExpFadeMs: 900,    // "开始体验"渐显/渐隐
    connectFadeMs: 900,     // "连孔上钉"渐显
    connectBlinkMs: 500,    // 闪烁单次时长
    connectBlinks: 2,       // 闪烁次数
    cupMoveMs: 1100,        // 瓷杯上移到 after 位置
    connectReplaceMs: 900,  // "连孔上钉"→"上钉"替换
    baseFadeMs: 900,        // 底图渐显
    baseGapMs: 600,         // 两张底图之间的间隔
    nailAppearMs: 900,      // 钉图出现
    nailShrinkMs: 1200,     // 钉图从大缩到正常
    textFadeMs: 900,
    textShowMs: 3500,       // 成就文字停留
    textFadeOutMs: 900,
    nailSemiMs: 900,        // 钉图渐变半透明
    connectLineFadeMs: 900, // 顶部"连线"提示渐显渐隐
    holeGapMs: 280,         // 连上一孔到下一个目标圈出现的延迟
    nailPromptShowMs: 1800,
}
```
- 判定松手的宽容半径：`CONFIG.hole.zoneRadius`（默认 4，相对 cup-box 的百分比，越大越容易连上）。
- 成就闪光时长（约 3.2s）：在 `onNailComplete` 里的 `setTimeout(..., 3200)` 与 CSS `@keyframes nailFlashBrief / textFlashBrief` 总时长，两处要同步改。

---

## 七、常见自定义速查

| 想改什么 | 改哪里 |
| --- | --- |
| 瓷杯整体大小 | `nail.css` `#cup-box height` |
| 两张钉底图位置/大小 | 编辑器组件位置模式拖 P/R；或手改 `CONFIG.bases` |
| 提示——上钉位置 | 编辑器组件模式拖 N/R；或手改 `CONFIG.prompts.nail` |
| 提示——连线位置 | 编辑器组件位置模式拖 C/R；或手改 `CONFIG.prompts.connectLine` |
| 某个孔位置 | 编辑器孔位模式拖绿色 ●；或手改 `CONFIG.nails[i].holes[k]` |
| **分段连线（哪几个孔连成一条线）** | 手改 `CONFIG.nails[i].segments`（每个内层数组一条线，元素是孔编号） |
| 连线轨迹 | 由 `segments` 决定，改分组即可 |
| 孔.png 大小 | `CONFIG.hole.width` |
| 待点目标圈大小 | `CONFIG.target.width` |
| 钉图位置/大小 | 编辑器成就模式拖 N/R；或手改 `CONFIG.nails[i].achievement.nail.pos` |
| 文字横幅位置/大小 | 编辑器成就模式拖 T/H；或手改 `CONFIG.nails[i].achievement.text.pos` |
| 连线颜色 | `--col-line`（默认白） |
| 金色发光强度 | `--glow-px`、`@keyframes nailFlashBrief` |
| 成就常驻透明度 | `--highlight-rest-opacity`（默认 0.5） |
| 动画时长 | `CONFIG.timings` |
| 连线判定宽容度 | `CONFIG.hole.zoneRadius`（默认 4） |
| 完成上报节点 | `nail.js` 的 `reportComplete()`（`n04_nail`） |
| 阶段评分 | `stage-score.js` + `nail.js` 的 `computeNailScore()` |

---

## 八、跨端扫码 & 开发者二维码页

桌面滚动叙事在"第四环节"节点会自动渲染 QR，手机扫码 → `ar.html?node=n04_nail` → 自动跳转 `nail.html` 进入游戏。要让手机访问到，桌面端必须用**电脑局域网 IP** 打开（不要用 `localhost`），否则 QR 里会是 localhost，手机访问不到。

为方便随时扫码调试，已扩展二维码页支持上钉：
- 浏览器打开 `http://<电脑IP>:8000/qr.html`。
- 目标切换栏新增两个按钮：
  - **上钉·桌面 QR 路由** (`ar.html?node=n04_nail`)：走桌面 PC 滚动叙事同款路由
  - **上钉·直连** (`nail.html`)：直连游戏页
- 主机字段会尽力用 WebRTC 自动探测局域网 IP 填入；探测失败请手填电脑 IP。
- 手机与电脑需同一局域网。iOS 如需 `https`，用自签证书首次访问要先信任。

## 九、注意事项

- **本版本不需要陀螺仪**：鼠标、手指都能完整走完流程（点"移至操作台"→点"连孔上钉"→拖动连线）。
- **横屏推荐**：窄竖屏会显示"请横屏使用"遮罩（`@media (max-aspect-ratio: 3/4)`），横屏体验最佳。
- **开场视频与 BGM**：开场背景统一用 `/image/背景.mp4`；进入正式游戏会停掉「游戏初始界面」BGM，改播 `game-bgm.js` 的正式游戏 BGM（自动播放被拦截时首次手势补播）。
- **右下角「退出」**：随时结束本局进结算，分数按已完成钉数计算；一颗都没完成不会上报完成。
- **打孔底图实际孔位**：`打孔底图.png` 上已画好孔位指示，需要用编辑器把 `CONFIG.nails[i].holes` 的坐标拖到与图中孔位重合。默认值是合理的梅花/柳叶布局占位，不一定对齐实图，请以编辑器所见为准调整。
- **achievement `aspect`**：梅花/柳叶文字横幅的 `aspect` 已按实际 PNG 比例填好（`14445/3957` 和 `15063/3600`），换图后需更新这两处。

---

## 十、本轮迭代（2026-10）与遗留项

### 这一轮改了什么

| 改动 | 位置 |
| --- | --- |
| 开场背景视频统一为 `/image/背景.mp4`（带 `poster`、首次手势补播、`webkit-playsinline`） | `intro-common.js` 的 `SHARED.background` |
| 进入正式游戏停「游戏初始界面」BGM，改播正式游戏 BGM | `game-bgm.js`（本页引入该脚本） |
| 右下角「退出」按钮：随时按已完成钉数结算 | `nail.html` 的 `#exit-btn` + `nail.css` 的 `.exit-btn` + `nail.js` 的 `exitGame()` |
| 按阶段评分：2 颗钉各 50 分，全完成 99.9 | `stage-score.js` + `nail.js` 的 `computeNailScore()` |
| 结算时把分数上报电脑端 | `nail.js` 的 `reportComplete()` → `/api/complete?node=n04_nail&score=` |
| 去掉陀螺仪依赖，改为纯点击 + 拖拽 | `nail.js` 状态机 |

### 遗留 / 可清理

1. `nail.css` 里还留着早期"感应授权 / 无感应继续"按钮的样式（`#sensor-enable`、`#no-sensor-continue`），当前 HTML 里已经没有这两个元素，可以删。
2. `nail.css` 的 `#prompt-nail` 仍写着旧的硬编码位置（`width:26%; top:38%; left:37%`），运行时会被 `nail.js` 的 `applyPrompts()` 覆盖，建议把这几行删掉以免误导。
3. 结算页目前只有「分数」图片，没有数字读数；分数只上报服务端。需要显示数字的话要在完成层里再加一个文本节点。
4. 完成状态存在服务器内存里，重启即清空。
