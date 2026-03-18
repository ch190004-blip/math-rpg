# Math RPG Immersive World v2

這版完成：
- Google 登入首頁
- 大廳原野（亮色、全螢幕、勇者鬥惡龍感 top-down）
- 七上之塔（橫向卷軸、多樓層、上下樓、進出章節）
- 1-1 原野（多種移動史萊姆，碰撞進戰鬥）
- 1-1 題庫戰鬥頁（保留原題庫核心，追加戰鬥回原野流程）
- Firebase users 資料結構相容：name / email / level / exp / coins

## 入口
- `index.html`：Google 登入
- `lobby.html`：大廳原野
- `tower-seven-up.html`：七上之塔
- `chapter-1-1-field.html`：1-1 原野
- `1-1.html`：戰鬥題庫頁
- `1-1_原始題庫來源.html`：保留原始來源檔

## 操作
### 原野
- 鍵盤：WASD / 方向鍵移動，E 或觸控 A 互動
- 手機：左側方向鍵、右側 A

### 塔樓
- 鍵盤：A/D 左右移動，Space 跳躍，W/S 上下樓，E 進門
- 手機：左側方向鍵，右側 B 跳躍、A 互動

## 執行
請用靜態伺服器開啟，不要直接雙擊本機檔案。
可用：
- VS Code Live Server
- Python `python -m http.server`
- Firebase Hosting / Netlify / Vercel

## Firebase
目前已沿用你提供題庫檔中的 Firebase 專案設定。
若要改成正式專案，只需更新：
- `js/firebase-core.js`
- `1-1.html` 內的 firebaseConfig

## 下一步很適合直接做
- 戰鬥碰撞後不只帶題型，也帶史萊姆屬性、血量、掉寶
- 七上之塔章節門全面量產
- 1-1 原野接正式 tilemap / spritesheet
- 將剩餘章節批次接到同一套戰鬥殼
