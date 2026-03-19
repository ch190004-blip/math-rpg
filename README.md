# Math RPG 單一入口 v5 Beta

這版是依封測前最後需求，直接把動線與戰鬥顯示再重修一次的版本。

## 這次修正重點

- 單一 `index.html` 入口，不再用網址切頁
- Google 登入狀態保留，重新整理回入口但不登出
- 大廳原野重新整理成 **中央廣場 + 六座明確小門口**
  - 七上之塔
  - 七下之塔
  - 八上之塔
  - 八下之塔
  - 九上之塔
  - 九下之塔
- 各學期之塔內部動線重做成：
  - 每章一層樓
  - 左側下樓
  - 右側上樓
  - 中央章節門
  - 不再需要跳躍解謎
  - 不再有空的地下層
- 章節原野改成 **混區史萊姆草原**
  - 不同題型會在同一區域活動
  - 方便玩家直接選題
  - 同題型仍維持同色
  - 晶角仍代表素養題
- 已上架章節：
  - 七上 1-1 負數與數線
  - 七下 1-1 二元一次方程式
  - 八下 1-1 等差數列
- 戰鬥畫面重新整理：
  - 題目不一定強制畫圖
  - 需要圖時改成較精準的 SVG 示意
  - 手機版與網頁版都避免圖文互蓋
  - 題目模式鎖定，不能在戰鬥中切換
- 所有場景右下角都有 `BUG / 回饋` 入口
- 人物外觀維持四部位：
  - head
  - body
  - hands
  - feet
- 測試版速度維持 2 倍

## 執行方式

建議用本機伺服器開啟，例如：

```bash
python -m http.server 8000
```

再開啟：

```text
http://localhost:8000/
```

## Firebase

目前仍沿用專案內 Firebase Web SDK 設定。

- 使用 Google 登入
- 玩家資料寫入 `users`
- 回饋表單優先寫入 Firestore `feedback`
- 若離線或 Firebase 寫入失敗，會暫存到 localStorage

## 主要檔案

- `index.html`
- `js/data/world-data.js`
- `js/data/chapter11-bank.js`
- `js/data/chapter7d11-bank.js`
- `js/data/chapter8d11-bank.js`
- `js/game/scenes/lobby.js`
- `js/game/scenes/tower.js`
- `js/game/scenes/field.js`
- `js/ui/overlays.js`
- `js/ui/feedback.js`
- `styles/battle.css`

## 這版優先驗收

1. 大廳六座塔是否都能順利進入
2. 各塔內左下 / 右上 / 中央門的流線是否直覺
3. 七上 1-1 原野是否已是混區多題型史萊姆
4. 七下與八下原野是否也能直接挑不同題型
5. 戰鬥中的圖與文字在手機直式、平板、桌機都不互蓋
6. BUG / 回饋表單是否能正確選冊別、章節、題型
