# Math RPG 單一入口 v10 Beta

這版是在 v9 的基礎上，把「手機 / 瀏覽器偶爾跳回舊版」的問題正式納入工程層處理。

## v10 新增重點
- build 版號升級為 `v10.0.0-beta.0`
- 新增 `version.json`
- 新增 `service-worker.js`
- 啟動時先比對遠端 build
- 若發現當前頁面不是最新 build：
  - 自動清掉舊 runtime cache
  - 自動解除舊 service worker
  - 強制重新載入最新 `index.html`
- service worker 改成：
  - `skipWaiting()`
  - `clients.claim()`
  - `index.html / version.json / manifest / service-worker` 走 network-first
- 新增 `firebase.json`
- 新增 `firebaserc.sample.json`
- 新增 `FIREBASE_HOSTING_DEPLOY.md`

## 這版的目標
不是把遊戲改成離線快取玩具版，而是優先解決：
1. 玩家重新整理還看到舊版
2. 手機已安裝主畫面殼卻抓到舊資源
3. GitHub Pages 覆蓋上傳後殘留舊檔
4. 封測前需要更可控的部署流程

## 目前建議部署方式
### 最推薦
Firebase Hosting

### 可以暫時用，但不建議當最終封測正式版
GitHub Pages 直接拖拉覆蓋

## 你如果還是要繼續用 GitHub Pages
至少務必做到：
- 不要只「覆蓋」，要先刪掉舊版根目錄內容再上傳
- 不要把舊版 zip 與舊版資料夾留在公開根目錄
- 每次發版都一起更新：
  - `index.html`
  - `version.json`
  - `service-worker.js`
  - `manifest.webmanifest`

## Firebase 仍需要的 Collection
### `users/{uid}`
- `name`
- `email`
- `level`
- `exp`
- `coins`
- `avatarSkin`
- `customNameSet`

### `feedback`
- `uid`
- `userName`
- `userEmail`
- `kind`
- `bugType`
- `semesterId`
- `chapterId`
- `slimeTypeId`
- `description`
- `sceneKey`
- `currentTowerId`
- `currentChapterId`
- `build`
- `createdAt`
- `serverTimestamp`

## 啟動方式
建議：
- 本機伺服器
- GitHub Pages
- Firebase Hosting

不要直接雙擊 `index.html`。

## 本版新增檔案
- `version.json`
- `service-worker.js`
- `firebase.json`
- `firebaserc.sample.json`
- `FIREBASE_HOSTING_DEPLOY.md`
