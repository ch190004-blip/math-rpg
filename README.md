# Math RPG Single URL v3

這版重點：
- 單一入口 `index.html`
- 重新整理回入口，但 Firebase 登入狀態保留
- 大廳 → 七上之塔 → 1-1 原野 → 戰鬥，全都在同頁 Phaser / JS 場景完成
- 玩家移動速度、史萊姆移動速度已調為測試版 2 倍
- 玩家外觀已拆成 `head / body / hands / feet` 四個部位，後續可接商店 skin
- 1-1 原野已放入 10 題型 × 2 模式 = 20 隻史萊姆
  - 同題型同顏色
  - 頭上有晶角的是素養題史萊姆
- 戰鬥不再提供換題、也不能切換標準 / 素養
- 答對後會寫入金幣 / EXP，然後回到 1-1 原野
- 題型九數線圖已改成不直接洩漏答案

## 目錄
- `index.html`
- `styles/`
- `js/core/`
- `js/services/`
- `js/data/chapter11-bank.js`
- `js/game/avatar-builder.js`
- `js/game/scenes/`
- `references/1-1_負數與數線_原始隨機題庫來源.html`

## Firebase
直接打開後即可用 Web 版 Firebase Google 登入。
若要換成你的正式專案，修改：
- `js/core/state.js` 內的 `app.config.firebase`

## 目前已完成
- 大廳入口明確碰撞進塔
- 七上之塔三區上下樓
- 1-1 十題型史萊姆
- 十題型戰鬥題目隨機生成
- 金幣 / EXP 獎勵回寫

## 後續最適合接的方向
1. 商店 NPC 與 skin 購買
2. 七上 1-2、1-3、1-4 接入
3. 戰鬥特效、擊敗掉寶、音效
4. 裝備 / 道具系統
