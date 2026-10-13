# 绑扎定型 · 手机/平板端游戏 说明文档

> 本文档说明“绑扎定型”环节涉及的每个文件用途，以及如何调整图层位置、颜色、透明度、动画时长等。
> 所有可调项尽量集中在 `bind.js` 顶部的 `CONFIG` 与 `bind.css` 顶部的 `:root` 变量，按下方指引改对应字段即可。

---

## 一、文件清单与用途

| 文件 | 作用 | 是否需要改动 |
| --- | --- | --- |
| `project/server.js` | 静态服务器。已新增 `/绑扎/` 别名，把项目外的 `焗瓷记/绑扎/` 目录挂载到 URL，游戏无需复制素材即可引用。 | 一般不用改；如要挂载其它外部目录，改顶部 `ALIASES` |
| `project/ar.html` | 手机端入口路由。扫 QR 后落到 `ar.html?node=n03_bind`，此处会自动跳转到 `bind.html`。其余环节仍是原占位页。 | 不用改 |
| `project/qr.html` | 开发者二维码页。单独提取出“绑扎定型”的 QR，可改主机/端口/目标，方便手机扫码直接进游戏调试。 | 仅调试用 |
| `project/bind.html` | 绑扎游戏的页面结构（开幕/黑屏/操作台/提示/瓷杯+SVG/成就面板/完成层）。 | 不用改（坐标在 JS 里） |
| `project/bind.css` | 布局与全部动画（渐黑、闪烁、滑入、金色脉冲、常驻高亮、横屏提示）。颜色/透明度/发光半径等用 `:root` 变量统一管理。 | 改颜色/透明度/发光主要在这里 |
| `project/bind.js` | 游戏逻辑：状态机、倾斜感应、滑动检测、SVG 粉色路径、高亮与成就揭示。所有**坐标/尺寸/时长**集中在顶部 `CONFIG`。 | 调位置/坐标/时长/阈值在这里 |
| `project/bind-README.md` | 本文档。 | — |
| `焗瓷记/绑扎/image/*.png` | 全部 PNG 素材（开幕、瓷杯底图、高亮1~5、起/终点、各成就图与文字图等）。成就面板不再使用“未达成”底图。 | 一般不动；如换图请保持文件名 |

---

## 二、如何运行

1. 在 `焗瓷记` 根目录启动服务器（项目自带）：
   ```bash
   node project/server.js
   ```
   - HTTP：`http://<本机IP>:8000/`（电脑端滚动叙事）
   - HTTPS：`https://<本机IP>:8443/`（手机扫码需 HTTPS，证书在 `project/certs/`）
2. 电脑端滚到“第三环节 绑扎定型”节点，弹出 QR。
3. 手机/平板扫码 → 自动跳到 `bind.html`，进入游戏。

> 也可直接访问 `http://<本机IP>:8000/bind.html` 单独测试游戏（无需扫码）。
> 桌面测试：直接点击“绑”字即可进入游戏流程。

---

## 三、游戏流程（对应代码状态机）

`INTRO`(点击“绑”字) → `LIGHTUP`(操作台背景亮起+“移至操作台”渐显停留后消失) → `START_PROMPT`(闪烁“开始绑扎定型”，点击后渐消) → `SLIDE_IN`(瓷杯逆时针 10° 渐显摆正 + 四瓣花循环 + 右侧底图逐个渐显 + 滑动icon 从左侧划入) → 点击屏幕(起终点渐显，同时 icon 淡出) → `TYING`(拖动起点到终点) → 普通路径直接进入下一条；完成一种绑扎时成就渐显 → 滑动icon提示 → 下一条 → `COMPLETE`(三槽成就一起渐显)

5 条路径顺序（在 `CONFIG.paths`）：

| 序号 | 绑扎方式 | 路径形态 |
| --- | --- | --- |
| 1 | 井字 | 左斜（杯口左上 → 杯底右下） |
| 2 | 井字 | 右斜（杯口右上 → 杯底左下） |
| 3 | 十字 | 杯口横向（左 → 右，二次贝塞尔曲线形态） |
| 4 | 十字 | 杯身竖向（上 → 下） |
| 5 | 绕底 | 绕杯底一圈（椭圆） |

- 完成 1、2 后揭示右侧“井字”槽位；完成 3、4 后揭示“十字”；完成 5 后揭示“绕底”并显示完成层。
- 每条路径：起点圆点 + 终点圆点（起点小于终点）+ `#FFBEBE` 半透明渐变带状路径（起点细、终点粗，类似棒球棒，两端半圆贴合起终点）。**拖动起点图标，把它移动到与终点大概重合即完成**；拖动时起点图标吸附在路径上，路径随进度消失、高亮沿路径逐段亮起。
- 完成：对应高亮绳图渐显为半透明常驻；普通路径完成后直接出现下一个起终点；该绑扎方式全部完成时，成就渐显 → 文字1 → 文字2 → 三者一起渐消，随后滑动icon + 四瓣花闪一次并渐出，再出现下一个起终点。

---

## 三（附）· 可视化编辑器：bind-edit.html 使用说明

服务器在跑时，电脑浏览器打开（手机/平板也可）：

```
http://<电脑IP>:8000/bind-edit.html
```

**页面布局**：中间是瓷杯（左）+ 成就面板盒（右，无“未达成”底图）；右上角控制面板有滑块/按钮和一个大文本框（存放 CONFIG 片段）。**面板标题栏的 `≡ 拖动面板` 可直接拖动整块面板，右上角“隐藏面板”可收起，收起后会露出“显示面板”按钮。** 编辑器实时预览的布局与游戏 `bind.html` 完全一致。

### 〇、编辑模式：组件位置（所有 PNG）

控制面板点 **“组件位置”** 进入（默认模式）。舞台上每张 PNG 都有两个手柄：
- **蓝色 M1..M10（移动）**：背景、移至操作台、开始提示、四瓣花、井/十/绕底图、滑动icon、瓷杯、面板。
- **橙色 R1..R10（缩放）**：与 M 对应，拖右下角缩放该组件。
- **起终点图标**：用“起点宽 / 终点宽”两个滑块调大小；位置仍由“路径起终点”模式控制。

瓷杯/面板现在由 `CONFIG.components.cup / panel` 的 `left/top/height` 直接定位，不再依赖 `bind.css` 里的 flex 布局。

### 一、全局滑块（所有模式都可用）
| 控件 | 作用 |
| --- | --- |
| 高度比 | 瓷杯和面板的高度占可视区比例（0.5 ~ 0.95）。对应 `CONFIG.layout.heightRatio`。 |
| 排列 | `居中` / `两端`。对应 `bind.css` `#play justify-content`。 |
| 间距 | 杯与面板的水平空隙（vw）。对应 `bind.css` `#play gap`。 |
| 隐藏路径/高亮 | 分别隐藏粉色路径、高亮绳图，方便看底层。 |
| 参考网格 | 在杯图上画 25/50/75 的十字网格，方便对齐。 |
| 复制 CONFIG 片段 | 把当前所有改动序列化成 4 段（layout / paths / highlights / slots），复制到剪贴板；按钮下方的文本框也会同步显示，复制失败可以直接全选文本框的内容粘贴。 |

### 二、编辑模式：路径起终点

在控制面板点 **"路径起终点"** 进入。杯图上出现彩色圆点/方块手柄：
- **绿色 Sn / 红色 En**（n=1~4）：直线 n 的起点 / 终点。直接拖到想要的位置。
- **紫色 Q3 方块**：路径 3（杯口横绑）的二次贝塞尔控制点。上下拖 = 变拱/变下垂，左右拖 = 让曲线整体往某一边翘。路径 3 在编辑器里还会额外画一条淡的"起点→控制点→终点"虚线，帮你看清控制关系。
- **蓝色 C5 / 橙 X5 / 紫 Y5**：绕底椭圆的心 / 水平半径 / 竖直半径。
- 曲线手柄的颜色会跟随对应的 SVG 路径颜色，方便区分每条路径对应的手柄。

### 三、编辑模式：高亮位置

控制面板点 **"高亮位置"** 进入。杯图上每张高亮图都有两个小方块：
- **金色 Mn（移动手柄）**：平移该张高亮。
- **灰色 Rn（缩放手柄）**：以左上角为基准缩放尺寸。
- 额外控件"**高亮4居中**"（路径3那条竖绳高亮4，因为是 height 基准，默认水平居中，左右拖不动）：
  - 默认是 **居中**：高亮4永远水平居中（`centerX:true`）。
  - 点 **自由**：M4 手柄拖到哪里就对齐哪里（`centerX:false`，`left` 生效），需要左右调整时切这个。

### 四、编辑模式：成就位置

控制面板点 **"成就位置"** 进入。进入后会多出一排"编辑槽位"按钮：**①井字 / ②十字 / ③绕底**。三个槽位要逐个调：

- 首先点你想调的那个槽（比如要调绕底绑扎的 2 张图层叠放，点 **③绕底**）。右侧面板里对应的槽会被金色虚线框选中。
- 手柄分为三类（全都相对当前槽的所在位置）：
  - **外壳：S1/S2/S3 / E1/E2/E3 方块**：`S` 方块 = 左上，拖它能改 `top / slotBox.left`；`E` 方块 = 右下，拖它能改 `height / slotBox.right`。也就是"调整个槽的框框"。
  - **图层：L1..Ln / R1..Rn**：当前槽里每张成就图都有 `L`（左上，移动）和 `R`（右下，缩放宽）。绕底槽有 2 张图层，所以你会看到 `L1/R1`（绕底绑扎1，主图）和 `L2/R2`（绕底绑扎2，小图叠在左上）。
  - **文字横幅：T1.1/H1.1、T1.2/H1.2**（每个槽有 2 张：文字1、文字2）：`T` 圆圈 = 拖动横幅位置；`H` 方块 = 改高度。两张文字图可分别调整。

> 编辑器在成就预览模式下会让成就图"提前显示出来"（并加金色轮廓虚线 + 紫色文字横幅虚线），方便你直接看到叠放和位置；游戏端正式流程里这些成就图还是默认隐藏，等你完成对应绑扎方式才会显示——两者用的是同一份位置和尺寸配置，所以在编辑器里调好就是游戏里的位置。

### 五、完成编辑：复制 → 贴回 bind.js

点"**复制 CONFIG 片段**"按钮（或手动选中文本框内容 Ctrl+C）。打开 [bind.js](file:///d:/焗瓷记/project/bind.js)，找到顶部同名的对象，**整段替换**：

```
    layout: { ... }      ← 替换为文本框里的 layout 段
    components: { ... }  ← 替换为文本框里的 components 段（所有 PNG 组件）
    pathStyle / highlight ← 随文本框一起保留（滑动判定半径等样式配置）
    paths:  [ ... ]      ← 替换为文本框里的 paths 段
    highlights: { ... }  ← 替换为文本框里的 highlights 段
    slots:  [ ... ]      ← 替换为文本框里的 slots 段
```
保存 bind.js 后，刷新 `bind.html` 游戏页面即可看到效果。

---

## 四、调整图层位置（坐标都在 `bind.js` 的 `CONFIG`）

坐标统一用 **0–100 的百分比**（相对各自的盒子），左上角为 (0,0)。盒子说明：
- 路径/高亮/起终点的坐标 → 相对 **`#cup-box`**（瓷杯盒，比例与瓷杯底图一致，所以 % 直接对齐杯图）。
- 槽位坐标 → 相对 **`#panel-box`**（成就面板盒，无底图，仅作为槽位容器）。

### 1) 瓷杯 / 面板整体大小/位置 → `CONFIG.components`
```css
# 编辑器“组件位置”拖 M9/R9（杯）、M10/R10（板），或直接改：
cup:   { left: 2, top: 4, height: 92, aspect: 3766 / 3445 }
panel: { left: 55, top: 4, height: 92, aspect: 1232 / 2113 }
```
- `left/top/height` 都是相对 16:9 主玩区 `#play` 的百分比；`aspect` 保持图片比例，缩放高度时宽度自动跟随。

### 2) 5 条绑扎路径的起终点（或曲线/椭圆）→ `CONFIG.paths`
三种类型：
- `type:'line'` 直线：`sx,sy` 起点、`ex,ey` 终点（0–100）。
- `type:'curve'` **二次贝塞尔曲线**（用于杯口横绑等需要弯曲形态的路径，如路径 3）：
  ```js
  { id:3, method:'十字', type:'curve', sx:15, sy:20, qx:50, qy:12, ex:85, ey:20 }
  ```
  `qx,qy` 是控制点（把曲线向上/下/左/右"拉扯"的锚点）。控制点越低/越高，杯子横绑曲线就越下垂/上拱。
- `type:'arc'`（绕底）椭圆：`cx,cy` 圆心、`rx,ry` 横/纵半径；起终点取两端。

路径 1/2/4 仍是直线；路径 3 默认是曲线，若要改回直线把 `type:'curve' → 'line'` 并去掉 `qx,qy` 即可。

### 3) 高亮绳图位置 → `CONFIG.highlights`
```js
1: { left:9, top:3, width:70, aspect:1832/2303 },
4: { left:50, top:9, height:82, aspect:788/1123, centerX:true },
```
- 以 `width` 为准时高度按 `aspect` 自动算；以 `height` 为准时宽度按 `aspect` 自动算。
- **高亮 4（杯身竖）的左右可调**：默认 `centerX:true` 保持水平居中；想左右拖动，把 `centerX` 改成 `false`（或在编辑器的"高亮4居中"栏切到"自由"），此时 `left` 字段生效。
- 若某张高亮没盖在杯上对应位置：调 `left/top/width/height` 直到对齐。

### 4) 起点/终点图标大小 → `CONFIG.components.endpoints`
```css
endpoints: {
    start: { src: '/绑扎/image/提示——起点.png', width: 8.5 },
    end:   { src: '/绑扎/image/提示——终点.png', width: 11 },
}
```
- 在编辑器“组件位置”模式用“起点宽 / 终点宽”滑块调，或手改 `width`。判定半径在 `CONFIG.pathStyle.zoneRadius`（默认 10，越大越容易触发）。

### 6) 其余 PNG 组件 → `CONFIG.components`
背景、提示图、四瓣花、右侧底图、滑动icon 都统一在 `CONFIG.components` 里：
```js
components: {
    background:  { src: '.../操作台背景.png', left: 0, top: 0, width: 100, height: 100 },
    promptMove:  { src: '.../提示——移至操作台.png', left: 0, top: 0, width: 100, height: 100 },
    promptStart: { src: '.../提示——开始绑扎定型.png', left: 50, top: 50, width: 40, offsetX: -50, offsetY: -50 },
    flower:      { src: '.../四瓣花.png', left: 50, top: 50, width: 120, ... },
    bottomImgs:  { jing/shi/rao: { src, left, top, width } },
    slideIcon:   { src: '.../提示——滑动icon.png', left: 5, top: 45, width: 20 },
    ...
}
```
`promptMove` 与 `background` 默认铺满全屏；`promptStart`/`flower` 的 `offsetX/offsetY` 是居中偏移（默认 -50% 即中心点定位）。

### 5) 成就面板三个槽位 + 图层 + 文字图层 → `CONFIG.slots`
每个槽位是一整套独立配置（3 个槽 → 3 份），外层：
```js
{ method:'井字', top:2, height:31, slotBox:{ left:5, right:5 }, achievement:{ layers:[...] }, text:{ src:'...', pos:{...} } }
```
- `top/height`：槽位在右侧面板里的纵向位置和高度。
- `slotBox.left / right`：槽位距离面板左/右边缘的缩进（默认左右各 5%，也就是左右各留一点边）。
- `achievement.layers[]`：每一层成就图（井字/十字是 1 张；绕底是 2 张叠放）。每张：
  ```js
  { src:'/绑扎/image/成就——绕底绑扎1.png', pos:{ width:90, left:5, top:5 } }
  ```
  `pos.width / left / top` 都相对**该槽的成就区域（= slot 宽高）**。
- `text.layers[]`：两张文字图（文字1、文字2），每张的 `pos` 相对**面板**的位置与大小：
  ```js
  { src:'.../成就——井字绑扎文字1.png', pos:{ right:104, top:50, height:96, offsetX:-6, aspect:1329/2860 } }
  { src:'.../成就——井字绑扎文字2.png', pos:{ right:104, top:50, height:96, offsetX:-6, aspect:1329/2860 } }
  ```
  - `right` = 距离面板**右边缘**多少 %（104 = 压出面板左侧 4%），`top` = 竖直中心 50%。
  - `height` = 横幅高度相对面板高度的 %。
  - `offsetX` = 水平方向微调（`translateX` 的 %），默认 -6 再往左挪一点。
  - `aspect` = 固定比例保持文字牌形状。

---

## 五、调整颜色 / 透明度 / 发光（主要在 `bind.css` 的 `:root`）

```css
:root {
  --col-pink: #f4a8c2;            /* 粉色提示路径颜色（对应 提示——路径.png 样式） */
  --path-opacity: 0.7;            /* 粉色路径透明度（淡粉、70%） */
  --col-gold: #e6c886;            /* 金色：高亮脉冲、成就描边 */
  --highlight-rest-opacity: 0.92;/* 高亮常驻透明度（脉冲后保持） */
  --glow-px: 18px;                /* 金色发光半径 */
  --col-bg: #12100c;              /* 整体背景 */
  --col-ink: #f2ead9;             /* 文字主色 */
}
```

- 粉色路径颜色/透明度可在 `CONFIG.pathStyle` 改；**粗细由两端半圆决定**，直接跟 `CONFIG.components.endpoints.start/end.width` 走（起点细、终点粗），`startWidthRatio` 可再单独收细起点端（默认 `0.55`），拖动时剩余路径从当前位置按比例收窄：
  ```js
  pathStyle: { color:'#f4a8c2', opacity:0.7, width:2.4, dash:'6 5', zoneRadius:10, startWidthRatio:0.55 }
  ```
  注：`提示——路径.png` 仅作**样式参考**，代码用 SVG 填充带状复刻其“淡粉、70% 透明”观感，从而适配斜线/横/竖/曲线/椭圆等不同形状；`width`/`dash` 字段已不参与绘制。
- 黑屏遮罩透明度/时长：`#blackout` 的 `opacity` 与 `.dim` 的 `transition`（默认 2.6s）。
- 高亮脉冲动画细节：`@keyframes goldPulse`（在 `bind.css`）。
- 成就脉冲：`@keyframes achPulse`。

---

## 六、调整动画时长 / 行为阈值（在 `CONFIG.timings`）

```js
timings: {
  openingHold: 2200,   // 开幕停留
  blackoutMs: 2600,    // 渐黑时长
  lightUpMs: 1400,     // 操作台亮起时长
  slideInMs: 900,      // 杯/面板滑入时长
  goldPulseMs: 2000,   // 金色脉冲时长
  pathGapMs: 700,      // 普通路径完成后到下一条间隔
  methodGapMs: 1400,   // 一种绑扎完成后到下一条间隔
}
```

- 倾斜感应阈值：`bind.js` 的 `onTilt` 中 `Math.abs(db) > 25 || Math.abs(dg) > 25`，改 `25` 调灵敏度（越小越灵敏）。
- 滑动判定半径：`CONFIG.pathStyle.zoneRadius`（默认 10；越大越宽松）。

---

## 七、常见自定义速查

| 想改什么 | 改哪里 |
| --- | --- |
| 主玩区整体大小 | `CONFIG.layout.heightRatio`（编辑器有滑块） |
| 瓷杯/面板大小位置 | 编辑器“组件位置”M9/R9、M10/R10；或 `CONFIG.components.cup/panel` |
| 背景/提示/四瓣花/底图/滑动icon | 编辑器“组件位置”M1..R8；或 `CONFIG.components` |
| 起/终点图标大小 | 编辑器“组件位置”滑块；或 `CONFIG.components.endpoints` |
| 某条绑扎路径起终点 | `bind.js` `CONFIG.paths[i]` 的 `sx,sy,ex,ey` |
| **路径3的弯曲程度**（路径3是二次贝塞尔曲线） | 编辑器路径模式下拖紫色 **Q3** 控制点；或手改 `paths[2].qx/qy` |
| 绕底椭圆大小/位置 | `CONFIG.paths[4]` 的 `cx,cy,rx,ry` |
| **高亮4左右位置** | 编辑器切"高亮位置"+"高亮4:自由"，拖M4；或手改 `highlights[4].centerX=false + left=xx` |
| 某张高亮没对齐杯子 | `CONFIG.highlights[id]` 的 `left/top/width/height` |
| 粉色路径颜色/透明度/虚线 | `--col-pink`、`--path-opacity` 或 `CONFIG.pathStyle` |
| 金色发光强度 | `--glow-px`、`@keyframes goldPulse` |
| 高亮常驻透明度 | `--highlight-rest-opacity` |
| 槽位纵向位置 + 左右缩进 | 编辑器"成就位置"+ `CONFIG.slots[i]` 的 `top/height/slotBox.left/right` |
| **成就图（绕底）的位置/大小** | 编辑器"成就位置"槽③，拖图层 `L/R` 手柄；或 `CONFIG.slots[2].achievement.layers[]` |
| **成就文字1/文字2的位置与大小** | 编辑器"成就位置"+ `T1.1/H1.1`、`T1.2/H1.2` 手柄；或手改 `slots[i].text.layers[]` 的 pos |
| 动画时长 | `CONFIG.timings` |
| 倾斜灵敏度 | `onTilt` 里的阈值 `25` |
| 滑动判定宽松度 | `CONFIG.pathStyle.zoneRadius` |

---

## 八、跨端扫码 & 开发者二维码页

桌面滚动叙事在“第三环节”节点会自动渲染 QR，手机扫码 → `ar.html?node=n03_bind` → 自动跳转 `bind.html` 进入游戏。要让手机访问到，桌面端必须用**电脑局域网 IP** 打开（不要用 `localhost`），否则 QR 里会是 localhost，手机访问不到。

为方便随时扫码调试，已单独提取出二维码页：

- 浏览器打开 `http://<电脑IP>:8000/qr.html`（调试时也可 `http://localhost:8000/qr.html`）。
- 页面用 `vendor/qrcode-bundle.js` 渲染 QR，可改：协议(http/https)、主机、端口、目标(`ar.html?node=n03_bind` 走桌面路由 / `bind.html` 直连游戏)。
- 主机字段会尽力用 WebRTC 自动探测局域网 IP 填入；探测失败请手填电脑 IP。
- 手机与电脑需同一局域网；iOS 启用陀螺仪要走 `https`（自签证书首次需信任）。

## 九、注意事项

- 当前绑扎流程不依赖陀螺仪：点击“绑”字后直接进入操作台提示流程。
- **横屏推荐**：窄竖屏会显示“请横屏使用”遮罩（`@media (max-aspect-ratio: 3/4)`），横屏体验最佳。
- **桌面调试**：无陀螺仪依赖，直接点击“绑”字即可跑通流程。
- **绕底绑扎两张图的尺寸矛盾**见第四节第 5 点，请按实际效果决定是否对调。

---

## 十、本轮迭代（2026-10）与遗留项

### 这一轮改了什么

| 改动 | 位置 |
| --- | --- |
| 开场背景视频统一为 `/image/背景.mp4`（带 `poster`、首次手势补播、`webkit-playsinline`） | `intro-common.js` 的 `SHARED.background` |
| 进入正式游戏停「游戏初始界面」BGM，改播正式游戏 BGM | `game-bgm.js`；`bind-audio.js` 已改为复用该实例（`BindAudio.bgm` 现在返回共享实例） |
| 右下角「退出」按钮：随时按已完成的绑扎路径数进结算 | `bind.html` 的 `#exit-btn` + `bind.css` 的 `.exit-btn` + `bind.js` 的 `exitGame()` |
| 按阶段评分：5 条路径各 20 分，全完成 99.9 | `stage-score.js` + `bind.js` 的 `computeBindScore()` |
| 结算时把分数上报电脑端 | `bind.js` 的 `reportComplete()` → `/api/complete?node=n03_bind&score=` |

### 与电脑端的配合（重要）

- 电脑端到「第三环节」节点时会先播放节点动效，**动效期间滚轮完全失效**，点「继续」才继续往后。
- 电脑端只有在前面环节都上报完成之后，这个节点的二维码才会解锁；没解锁时显示「未解锁」占位，但仍可点「继续」看剧情。
- 手机端玩完后 `bind.js` 会 POST `/api/complete?node=n03_bind&score=xx`，电脑端轮询 `/api/state` 拿到后把卡片标成「本环节已完成」。
- **一条路径都没绑完就点「退出」**时不会上报完成，后面的小游戏仍保持锁定。

### 遗留 / 可清理

1. 结算页目前只有「分数」图片，没有数字读数；分数只上报服务端。需要显示具体数字的话要在完成层里再加一个文本节点。
2. 完成状态存在服务器内存里，重启即清空。
3. `CONFIG.timings` 里 `achShowMs` 注释写着"兼容保留"，当前流程不再依赖它，可清理。
