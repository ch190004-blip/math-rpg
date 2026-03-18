# Math RPG 沉浸式世界 v4

這版重點是把主流程真正打通，並修正你點名的三個痛點：

1. **十個戰鬥頁正式重寫**
   - `battle-1-1-type1.html` ～ `battle-1-1-type10.html`
   - 每頁只對應一個題型
   - 保留隨機出題、標準題 / 素養題切換、單題計時
   - 改成**輸入正確答案才會發放金幣與 EXP**
   - 答對後會自動返回 `chapter-1-1-field.html`

2. **大廳原野入口修正**
   - `lobby.html`
   - 七上之塔改成較小、明確的門口入口
   - 角色**碰到門口就會直接進塔**
   - 不再出現巨大塔體卻不好進入的問題

3. **七上之塔重做**
   - `tower-seven-up.html`
   - 改成三區直覺式橫向塔樓
   - 不走迷宮
   - 以中央升降區切換上層 / 下層
   - 第一區可進 `1-1 原野`
   - 其他章節門先保留 LOCK 位置

4. **1-1 原野優化**
   - `chapter-1-1-field.html`
   - 放入 10 種對應題型的史萊姆
   - 碰到就直接進入該題型戰鬥
   - 戰後回原野會安全重生，不會立刻再次撞怪

## 控制方式

### 電腦版
- 移動：`WASD` 或 `方向鍵`
- 互動：`E` 或 `Space`
- 大廳進塔：直接碰門口
- 七上之塔切換樓層：站上中央升降區後按 `上 / 下` 或 `E / Space`

### 手機版
- 左下：虛擬方向鍵
- 右下：`互動`

> 已把原本讓人困惑的 `A` 改為 `互動`，桌機畫面也改成直接顯示鍵盤提示。

## 核心檔案

- `index.html`：Google 登入入口
- `lobby.html`：大廳原野
- `tower-seven-up.html`：七上之塔
- `chapter-1-1-field.html`：1-1 原野
- `battle-1-1-type1.html` ～ `battle-1-1-type10.html`：十個獨立戰鬥頁
- `js/ch1-1-battle-engine.js`：十題型戰鬥題庫引擎
- `js/firebase-core.js`：Firebase 登入與獎勵寫入
- `1-1_原始題庫來源.html`：你提供的正式 1-1 隨機題庫來源備份

## Firebase

目前沿用既有 Web Firebase 設定：
- Google 登入
- `users/{uid}` 文件
- 寫入：
  - `coins += 10`
  - `exp += 50`

## 後續最適合接的下一步

1. 把 `1-2`、`1-3`、`1-4` 也做成對應原野與戰鬥頁
2. 增加真正像 RPG 的戰鬥特效、血量、掉寶
3. 以 Tiled + spritesheet 逐步替換目前的程式化場景
4. 再往 Capacitor / Cordova 打包 iOS / Android
