# Math RPG Immersive World v3

這版重點修正與升級：

- 大廳原野重新調亮，改成更明確可進入的七上之塔入口
- 七上之塔改成三區式橫向卷軸，不用解迷宮也能上下切換章節區
- 1-1 原野正式放入 10 種題型史萊姆
- 每隻史萊姆各自對應一個戰鬥頁：
  - `battle-1-1-type1.html` ~ `battle-1-1-type10.html`
- 戰鬥頁以你提供的「1-1 負數與數線」隨機題庫為母體重構，保留：
  - 10 題型
  - 標準題 / 素養題切換
  - 換題即重置計時
  - 隨機參數與情境變化
- 勝利後回到 `chapter-1-1-field.html`，並寫入 Firebase 金幣與經驗值

## 目前遊戲流程
`index.html`
→ `lobby.html`
→ `tower-seven-up.html`
→ `chapter-1-1-field.html`
→ `battle-1-1-typeX.html`
→ 勝利返回 `chapter-1-1-field.html`

## 操作
### 原野 / 大廳
- 鍵盤：WASD / 方向鍵移動，E 或空白 / 觸控 A 互動
- 手機：左側虛擬方向鍵，右側 A

### 七上之塔
- 左右移動：A / D 或左右鍵
- 靠近樓梯區時：按上 / 下 或 A
- 靠近章節門時：按 A

## Firebase
- 使用 `js/firebase-core.js`
- `users/{uid}` 仍採：
  - `name`
  - `email`
  - `level`
  - `exp`
  - `coins`

## 注意
- 請用靜態伺服器開啟，不要直接雙擊本機檔案
- 可用 VS Code Live Server / Python `python -m http.server` / Firebase Hosting / Netlify / Vercel
