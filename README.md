# Math RPG 單一入口 v6 Beta

這版重點：

- 修正有時跳回舊版的問題  
  - 所有本地 CSS / JS 已加上 build 版本參數
  - `index.html` 加入 no-cache meta
  - 啟動時會嘗試解除舊 service worker / 舊 caches
  - 介面顯示目前 build：`v6.0.0-beta.1`

- 首頁改成精簡版分頁式入口
  - 保留左右分區顯示
  - 加入「這版更新 / 目前上架 / 目前規則」

- 右上角加入主選單
  - 回首頁
  - BUG / 回饋
  - 登出

- 全場景右下角固定保留 BUG / 回饋按鈕

## 啟動
建議用本機伺服器或 HTTPS 靜態主機執行。

## 若還看到舊版
1. 改從這個新資料夾重新開啟  
2. 重新整理一次  
3. 若你曾建立桌面捷徑或安裝成應用程式，請改用新版入口重新建立捷徑

## 主檔
- `index.html`
- `js/ui/hud.js`
- `js/ui/overlays.js`
- `styles/layout.css`
- `styles/overlays.css`


## v7 修正
- 六塔數學中心相對位置重排
- 七上之塔改為 3 層章節塔：1F(1-1~1-4)、2F(2-1~2-4)、3F(3-1~3-3)
- 1-1 怪物加入 10 題型高辨識色與三種種族外觀
- 戰鬥題目版面改善，避免圖文互蓋
- Firestore level 欄位同步更新
- 右上選單與右下 BUG/回饋按鈕可點擊
