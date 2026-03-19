# Firebase Hosting 部署指南（Math RPG v10）

## 是否一定要搬到 Firebase Hosting？
不是絕對必須，但對這個專案非常建議。
因為它能：
- 控制 `index.html / version.json / service-worker.js` 的快取
- 把所有路徑 rewrite 回單一 `index.html`
- 和 Firebase Auth / Firestore 用同一專案管理
- 用 Preview Channel 先測再推 live

## 最快部署步驟
1. 安裝 Firebase CLI  
   `npm install -g firebase-tools`

2. 登入  
   `firebase login`

3. 在本專案根目錄執行  
   `firebase init hosting`

4. 選擇你現在正在用的 Firebase Project

5. Public directory 建議填  
   `.`

6. Single-page app rewrite  
   選 `Yes`

7. 如果 CLI 問要不要覆蓋 `index.html`  
   選 `No`

8. 建立專案關聯  
   直接執行 `firebase use --add`  
   或參考 `firebaserc.sample.json`

9. 部署  
   `firebase deploy --only hosting`

## 預覽測試
- `firebase hosting:channel:deploy beta`
- 先用 preview URL 測，再決定推 live

## 若你仍想暫時用 GitHub Pages
請至少做到：
1. 每次只保留同一份最新版根目錄內容
2. 刪掉 repo 內舊版資料夾、舊版 `service-worker.js`、舊版 `index.html`
3. 不要把不同版本一起放在同一個公開分支根目錄
4. 發版時務必一起上傳 `version.json`

## 你現在的習慣：解壓縮後直接拖拉覆蓋到 GitHub
最大的風險不是覆蓋，而是沒有刪掉舊檔。
若新版本改了檔名、刪了舊 JS、換了 service worker，舊檔仍可能留在 repo 裡被載到。

所以若你還沒搬 Firebase Hosting，最少要改成：
- 先把 GitHub Pages 分支根目錄舊檔清乾淨
- 再整包放上這版 v10 的根目錄
- 確認 repo 根目錄只有一份 `index.html`
- 確認舊版 zip、舊版資料夾不要公開放在網站根目錄
