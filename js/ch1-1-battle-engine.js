
import { primeAuth, watchUser, rewardPlayer } from "./firebase-core.js";
import { getBattleEntry, saveBattleResult, transitionTo } from "./app-shell.js";

export const TYPE_CONFIG = [
  { type: 1, title: "題型一：相反意義的量(一)", desc: "正負符號與平均基準", short: "基準差" },
  { type: 2, title: "題型二：相反意義的量(二)", desc: "增減量與相對紀錄", short: "增減量" },
  { type: 3, title: "題型三：數線坐標與距離", desc: "兩點距離判斷", short: "距離" },
  { type: 4, title: "題型四：數線與等分點", desc: "分點座標", short: "等分點" },
  { type: 5, title: "題型五：數的大小比較(一)", desc: "整數與小數排序", short: "排序" },
  { type: 6, title: "題型六：數的大小比較(二)", desc: "負分數比較", short: "比較" },
  { type: 7, title: "題型七：相反數解碼", desc: "相反數與距離", short: "相反數" },
  { type: 8, title: "題型八：絕對值運算範圍", desc: "整數解個數", short: "範圍" },
  { type: 9, title: "題型九：圖解絕對值距離", desc: "數線圖判讀", short: "圖判" },
  { type: 10, title: "題型十：綜合挑戰", desc: "絕對值綜合推理", short: "綜合" }
];

const REWARD_COINS = 10;
const REWARD_EXP = 50;

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function gcd(a, b) { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
function genFracHTML(n, d) { return `<span class="frac"><span class="num">${n}</span><span class="den">${d}</span></span>`; }
function escapeHTML(value) {
  return String(value).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}
function normalizeBasic(text) {
  return String(text ?? "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/＋/g, "+")
    .replace(/－/g, "-")
    .replace(/，/g, ",")
    .replace(/、/g, ",")
    .replace(/。/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")");
}
function normalizeCompareSymbol(text) {
  return normalizeBasic(text).replace(/＞/g, ">").replace(/＜/g, "<").replace(/≧/g, ">=").replace(/≦/g, "<=");
}
function parseNumeric(text) {
  const raw = normalizeBasic(text);
  if (!raw) return null;
  if (/^[+-]?\d+\/\d+$/.test(raw)) {
    const [n, d] = raw.split("/").map(Number);
    if (d === 0) return null;
    return n / d;
  }
  if (/^[+-]?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return null;
}
function equalNumeric(input, target, tolerance = 1e-9) {
  const val = parseNumeric(input);
  return val !== null && Math.abs(val - target) <= tolerance;
}
function normalizeOrder(text) {
  return normalizeBasic(text)
    .toLowerCase()
    .replace(/[()]/g, "")
    .replace(/>/g, "")
    .replace(/,/g, "")
    .replace(/[^abc]/g, "");
}
function normalizeOption(text) {
  return normalizeBasic(text)
    .toUpperCase()
    .replace(/[()]/g, "")
    .replace(/答案/g, "")
    .replace(/選/g, "")
    .replace(/液體/g, "");
}
function normalizeSet(text) {
  return normalizeBasic(text)
    .replace(/或/g, ",")
    .replace(/and/gi, ",")
    .split(/[,/]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => a - b);
}
function sameNumberSet(a, b) {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}
function rationalToText(num, den) {
  const sign = num < 0 ? "-" : "";
  const absNum = Math.abs(num);
  const g = gcd(absNum, den);
  const n = absNum / g;
  const d = den / g;
  return d === 1 ? `${sign}${n}` : `${sign}${n}/${d}`;
}
function createInputHTML(inputs) {
  return inputs.map((input) => `
    <div class="input-group">
      <label for="ans-${input.key}">${input.label}</label>
      <input id="ans-${input.key}" class="answer-input" type="text" placeholder="${escapeHTML(input.placeholder || "")}" autocomplete="off" />
    </div>
  `).join("");
}
function valuesFromInputs(inputs) {
  const out = {};
  inputs.forEach((input) => {
    out[input.key] = document.getElementById(`ans-${input.key}`)?.value ?? "";
  });
  return out;
}
function firstInputFocus(inputs) {
  const key = inputs[0]?.key;
  if (!key) return;
  const el = document.getElementById(`ans-${key}`);
  if (el) el.focus();
}
function setFeedback(text, tone = "info") {
  const box = document.getElementById("feedback-box");
  box.innerHTML = text;
  box.className = `feedback-box show ${tone}`;
}
function resetFeedback() {
  const box = document.getElementById("feedback-box");
  box.className = "feedback-box";
  box.innerHTML = "";
}
function clearAnswerSections() {
  document.getElementById("hText").style.display = "none";
  document.getElementById("aText").style.display = "none";
}
function updateModeBadge(isApp) {
  const badge = document.getElementById("modeBadge");
  badge.textContent = isApp ? "🚀 現代素養情境" : "📝 課本標準情境";
  badge.style.borderColor = isApp ? "rgba(167,139,250,0.26)" : "rgba(83,214,255,0.22)";
  badge.style.color = isApp ? "#d7c6ff" : "var(--accent-main)";
  badge.style.background = isApp ? "rgba(139,92,246,0.12)" : "rgba(83,214,255,0.12)";
  document.getElementById("standard-btn").classList.toggle("active", !isApp);
  document.getElementById("app-btn").classList.toggle("active", isApp);
}

function drawType9Canvas() {
  const canvas = document.getElementById("mathCanvas");
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.moveTo(30, 75);
  ctx.lineTo(570, 75);
  ctx.strokeStyle = "#53d6ff";
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(570, 75);
  ctx.lineTo(560, 70);
  ctx.lineTo(560, 80);
  ctx.fillStyle = "#53d6ff";
  ctx.fill();

  const cx = 350;
  const pts = [
    { x: cx - 220, label: "C", sub: "c" },
    { x: cx - 80, label: "D", sub: "d" },
    { x: cx, label: "O", sub: "0" },
    { x: cx + 45, label: "A", sub: "a" },
    { x: cx + 170, label: "B", sub: "b" }
  ];

  ctx.font = 'bold 20px "Noto Sans TC"';
  ctx.textAlign = "center";
  pts.forEach((p) => {
    ctx.beginPath();
    ctx.moveTo(p.x, 68);
    ctx.lineTo(p.x, 82);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = p.label === "O" ? "#fbbf24" : "#f8fafc";
    ctx.fillText(p.label, p.x, 56);
    ctx.fillStyle = "#9bb0c9";
    ctx.font = 'italic 16px "Times New Roman"';
    ctx.fillText(p.sub, p.x, 101);
    ctx.font = 'bold 20px "Noto Sans TC"';
  });
}

function buildQuestion(type, isApp) {
  switch (type) {
    case 1: {
      const base = rand(60, 85);
      const pDiff = rand(3, 15);
      const nDiffBase = rand(2, 12);
      const answer = -nDiffBase;
      const qHTML = !isApp
        ? `某次數學平時測驗以全班平均分數 <i>${base}</i> 分為基準。若小妍考了 <i>${base + pDiff}</i> 分，記為 <i>+${pDiff}</i> 分；那麼小翊考了 <i>${base + answer}</i> 分，在紀錄表上應記為什麼數字？`
        : `在星際物資運輸系統中，標準貨物艙的規定基準重量為 <i>${base}</i> 噸。系統感測器設定：重量超出基準 <i>${pDiff}</i> 噸時發送訊號 <i>+${pDiff}</i>。今日查核發現某貨物艙重量僅有 <i>${base + answer}</i> 噸，請問系統感測器會發送什麼數值的訊號？`;
      const hHTML = `把基準看成 0。高於基準記為正、低於基準記為負。<br>這題只要判斷「比基準少了多少」。`;
      const aHTML = `因為比基準少了 <i>${nDiffBase}</i>，所以應記為 <strong><i>${answer}</i></strong>。`;
      return {
        qHTML, hHTML, aHTML,
        inputs: [{ key: "main", label: "你的答案", placeholder: "例如 -8" }],
        validate: (values) => normalizeBasic(values.main) === String(answer),
        answerHelp: "請輸入帶正負號的數字。",
      };
    }
    case 2: {
      const base = rand(60, 90);
      const isHigher = Math.random() > 0.5;
      const diff = rand(3, 15);
      const refDiff = rand(2, 10);
      const finalScore = isHigher ? base + diff : base - diff;
      const answer = `${isHigher ? "+" : "-"}${diff}`;
      const qHTML = !isApp
        ? `以 <i>${base}</i> 為基準，比 <i>${base}</i> 大 <i>${refDiff}</i> 記為 <i>+${refDiff}</i>。若 <i>A</i> 表示的數為 <i>${finalScore}</i>，應如何記錄？`
        : `小明參加「賽博電競積分賽」，系統以 <i>${base}</i> 分為基礎評級線。超過基礎線 <i>${refDiff}</i> 分的玩家，狀態欄會顯示 <i>+${refDiff}</i>。若小明今日完賽後，積分結算為 <i>${finalScore}</i> 分，請問他的狀態欄會顯示什麼數字？`;
      const hHTML = `先判斷最後的數值比基準高還是低，再看相差多少。`;
      const aHTML = `因為 <i>${finalScore}</i> 與基準 <i>${base}</i> 相差 <i>${diff}</i>，且是${isHigher ? "高於" : "低於"}基準，所以答案是 <strong><i>${answer}</i></strong>。`;
      return {
        qHTML, hHTML, aHTML,
        inputs: [{ key: "main", label: "你的答案", placeholder: "例如 +6 或 -4" }],
        validate: (values) => normalizeBasic(values.main) === answer,
        answerHelp: "請輸入帶正負號的數字。",
      };
    }
    case 3: {
      const aPos = -rand(3, 12);
      const bPos = rand(2, 10);
      const dist = bPos - aPos;
      const qHTML = !isApp
        ? `在數線上，點 <i>A</i> 代表的數是 <i>${aPos}</i>，點 <i>B</i> 代表的數是 <i>${bPos}</i>。請問 <i>A</i>、<i>B</i> 兩點之間的距離是多少單位長？`
        : `在《CyberCity》擴增實境遊戲中，敵人據點 <i>A</i> 位於座標 <i>${aPos}</i>，你的基地 <i>B</i> 位於座標 <i>${bPos}</i>。請問基地 <i>B</i> 發射雷射導彈摧毀據點 <i>A</i>，導彈需要飛行的直線距離是多少單位？`;
      const hHTML = `數線上兩點的距離一定是正數，可以用「右邊坐標 − 左邊坐標」。`;
      const aHTML = `距離 = <i>${bPos}</i> − (<i>${aPos}</i>) = <strong><i>${dist}</i></strong>。`;
      return {
        qHTML, hHTML, aHTML,
        inputs: [{ key: "main", label: "距離", placeholder: "例如 11" }],
        validate: (values) => normalizeBasic(values.main) === String(dist),
        answerHelp: "請輸入正整數。",
      };
    }
    case 4: {
      const A = rand(1, 8);
      const N = randItem([3, 4, 5, 8, 10]);
      const k = rand(1, N - 1);
      const isMovingLeft = Math.random() > 0.5;
      const startInt = isMovingLeft ? -A : -(A + 1);
      const directionWord = isMovingLeft ? "向左" : "向右";
      let num, den = N;
      if (isMovingLeft) num = -(A * N + k);
      else num = -(A * N + (N - k));
      const g = gcd(Math.abs(num), den);
      num /= g;
      den /= g;
      const answerText = rationalToText(num, den);
      const qHTML = !isApp
        ? `在數線上，將 <i>${-A}</i> 和 <i>${-(A + 1)}</i> 之間平分成 <i>${N}</i> 等分。若從 <i>${startInt}</i> 開始${directionWord}算起，第 <i>${k}</i> 個等分點所代表的數為何？`
        : `深海探測潛水艇「海神號」正在垂直軌道移動。探測器發現在刻度 <i>${-A}</i> 公里與 <i>${-(A + 1)}</i> 公里的兩個觀測站之間，佈設了均勻聲納網，將這段距離平分成 <i>${N}</i> 段。若海神號從 <i>${startInt}</i> 公里的觀測站繼續${isMovingLeft ? "向下潛" : "向上浮"}，經過了 <i>${k}</i> 段聲納網，此時所在刻度應記為多少？`;
      const hHTML = `每一段的長度是 ${genFracHTML(1, N)}。先確定方向，再把移動的 ${genFracHTML(k, N)} 加到起點或從起點扣掉。`;
      const aHTML = `移動後的座標是 <strong>${answerText}</strong>。`;
      return {
        qHTML, hHTML, aHTML,
        inputs: [{ key: "main", label: "座標值", placeholder: "最簡分數或整數，例如 -13/4" }],
        validate: (values) => equalNumeric(values.main, num / den, 1e-9),
        answerHelp: "可輸入最簡分數（如 -13/4）或等值小數。",
      };
    }
    case 5: {
      const int1 = -rand(4, 9);
      const dec = int1 + rand(2, 8) / 10;
      const pos = rand(1, 5);
      let vars = [
        { name: "a", val: Number(dec.toFixed(1)), str: dec.toFixed(1) },
        { name: "b", val: int1, str: String(int1) },
        { name: "c", val: pos, str: String(pos) }
      ];
      for (let i = vars.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [vars[i], vars[j]] = [vars[j], vars[i]];
      }
      const sorted = [...vars].sort((x, y) => y.val - x.val);
      const answer = sorted.map((x) => x.name).join("");
      const qHTML = !isApp
        ? `已知三個數：<i>${vars[0].name}</i> = <i>${vars[0].str}</i>、<i>${vars[1].name}</i> = <i>${vars[1].str}</i>、<i>${vars[2].name}</i> = <i>${vars[2].str}</i>。請利用不等號將 <i>a</i>、<i>b</i>、<i>c</i> 由大到小排列。`
        : `極地科考站監控三個鑽探井的深層冰溫變化。測得三井溫度分別為 <i>${vars[0].str}</i>、<i>${vars[1].str}</i>、<i>${vars[2].str}</i>，且用變數 <i>${vars[0].name}</i>、<i>${vars[1].name}</i>、<i>${vars[2].name}</i> 表示。請將這三個變數依溫度由高到低排列。`;
      const hHTML = `正數一定比負數大；兩個負數比較時，絕對值大的反而比較小。`;
      const aHTML = `由大到小排列為 <strong><i>${sorted[0].name}</i> &gt; <i>${sorted[1].name}</i> &gt; <i>${sorted[2].name}</i></strong>。`;
      return {
        qHTML, hHTML, aHTML,
        inputs: [{ key: "main", label: "排列結果", placeholder: "例如 c>a>b" }],
        validate: (values) => normalizeOrder(values.main) === answer,
        answerHelp: "請用不等號輸入，例如 c>a>b。",
      };
    }
    case 6: {
      const d1 = rand(3, 9);
      const n1 = rand(1, d1 - 1);
      let d2 = rand(3, 9);
      while (d2 === d1) d2 = rand(3, 9);
      let n2 = Math.floor((n1 / d1) * d2);
      if (n2 === 0) n2 = 1;
      if (n2 >= d2) n2 = d2 - 1;
      if (n1 * d2 === n2 * d1) n2 = n2 > 1 ? n2 - 1 : n2 + 1;
      const val1 = -(n1 / d1);
      const val2 = -(n2 / d2);
      const relation = val1 > val2 ? ">" : "<";
      const askHigher = Math.random() > 0.5;
      const target = askHigher ? (val1 > val2 ? "A" : "B") : (val1 < val2 ? "A" : "B");
      const frac1 = `- ${genFracHTML(n1, d1)}`;
      const frac2 = `- ${genFracHTML(n2, d2)}`;

      const qHTML = !isApp
        ? `請比較兩數的大小，在空格中填入 &gt;、= 或 &lt;：<br><br><div style="text-align:center; font-size:1.5rem;">${frac1}　[　　]　${frac2}</div>`
        : `實驗室中存放兩種超導體冷卻液，A 液體的溫度必須維持在 ${frac1} ℃，B 液體的溫度必須維持在 ${frac2} ℃。請判斷哪一種液體的規定溫度比較<strong>${askHigher ? "高" : "低"}</strong>？`;

      const hHTML = `先比較分數大小，再記住「負數的絕對值愈大，實際數值愈小」。`;
      const aHTML = !isApp
        ? `比較後可得 <strong>${frac1} ${relation} ${frac2}</strong>。`
        : `比較後可得 ${frac1} ${relation} ${frac2}，所以符合條件的是 <strong>${target} 液體</strong>。`;
      return {
        qHTML, hHTML, aHTML,
        inputs: [{ key: "main", label: !isApp ? "填入符號" : "填入 A 或 B", placeholder: !isApp ? ">, < 或 =" : "A 或 B" }],
        validate: (values) => !isApp ? normalizeCompareSymbol(values.main) === relation : normalizeOption(values.main) === target,
        answerHelp: !isApp ? "請輸入 >、< 或 =" : "請輸入 A 或 B。",
      };
    }
    case 7: {
      const baseNum = rand(2, 9);
      const isFraction = Math.random() > 0.5;
      let qValue, distValue, numStr, opNumStr, distStr;
      if (isFraction) {
        const den = rand(2, 5);
        qValue = baseNum / den;
        distValue = (baseNum * 2) / den;
        numStr = `&minus;${genFracHTML(baseNum, den)}`;
        opNumStr = rationalToText(baseNum, den);
        distStr = rationalToText(baseNum * 2, den);
      } else {
        const val = Number((baseNum + rand(1, 9) / 10).toFixed(1));
        qValue = val;
        distValue = Number((val * 2).toFixed(1));
        numStr = `&minus;<i>${val.toFixed(1)}</i>`;
        opNumStr = val.toFixed(1);
        distStr = distValue.toFixed(1);
      }
      const qHTML = !isApp
        ? `若 <i>x</i> 的相反數是 ${numStr}，求 <i>x</i> = ？<br>又 <i>x</i> 與它的相反數，在數線上的距離是多少？`
        : `量子電腦中的位元態具有「反轉對稱性」。當觀測到反粒子狀態值為 ${numStr} 時，其對應的糾纏粒子狀態值 <i>x</i> 必定是它的相反數。請問 <i>x</i> 的數值為何？這兩個粒子在狀態數據軸上的距離是多少？`;
      const hHTML = `相反數的特徵是「符號相反、大小相同」。兩數在數線上的距離等於兩個絕對值相加。`;
      const aHTML = `<i>x</i> = <strong>${opNumStr}</strong>，兩點距離為 <strong>${distStr}</strong>。`;
      return {
        qHTML, hHTML, aHTML,
        inputs: [
          { key: "x", label: "x 的值", placeholder: "例如 3/2 或 1.5" },
          { key: "dist", label: "兩點距離", placeholder: "例如 3 或 3.0" }
        ],
        validate: (values) => equalNumeric(values.x, qValue, 1e-9) && equalNumeric(values.dist, distValue, 1e-9),
        answerHelp: "請分別輸入 x 與距離，可用分數或小數。",
      };
    }
    case 8: {
      const limit = rand(5, 12);
      const isLessOrEqual = Math.random() > 0.5;
      const symbol = isLessOrEqual ? "≤" : "<";
      const maxInt = isLessOrEqual ? limit : limit - 1;
      const count = maxInt * 2 + 1;
      const qHTML = !isApp
        ? `已知 <i>a</i> 為整數，且滿足絕對值條件 |<i>a</i>| ${symbol} <i>${limit}</i>。請問符合此條件的 <i>a</i> 共有幾個？並列出最大與最小的可能值。`
        : `星際巡邏艦停泊於太空站（座標 0）。規定巡邏的安全警戒範圍半徑必須${isLessOrEqual ? "不超過" : "嚴格小於"} <i>${limit}</i> 光年（即巡邏座標 <i>P</i> 需滿足 |<i>P</i>| ${symbol} <i>${limit}</i>）。若巡邏艦只能在整數座標節點上跳躍，請問可用節點共有幾個？最大與最小座標是多少？`;
      const hHTML = `絕對值代表到原點的距離。左右對稱的整數解要一起算，最後別忘了原點 0。`;
      const aHTML = `共有 <strong>${count}</strong> 個整數，最大值為 <strong>${maxInt}</strong>，最小值為 <strong>-${maxInt}</strong>。`;
      return {
        qHTML, hHTML, aHTML,
        inputs: [
          { key: "count", label: "整數個數", placeholder: "例如 11" },
          { key: "max", label: "最大值", placeholder: "例如 5" },
          { key: "min", label: "最小值", placeholder: "例如 -5" }
        ],
        validate: (values) =>
          normalizeBasic(values.count) === String(count) &&
          normalizeBasic(values.max) === String(maxInt) &&
          normalizeBasic(values.min) === String(-maxInt),
        answerHelp: "三格都答對才算過關。",
      };
    }
    case 9: {
      const askSmallest = Math.random() > 0.5;
      const answer = askSmallest ? "A" : "C";
      const qHTML = !isApp
        ? `數線上有 O、A、B、C、D 五點，O 為原點。各點位置如圖所示。已知圖中各點代表的數分別為 0、<i>a</i>、<i>b</i>、<i>c</i>、<i>d</i>。根據圖形判斷，下列何者的值${askSmallest ? "最小" : "最大"}？<br><br>(A) |<i>a</i>|　(B) |<i>b</i>|　(C) |<i>c</i>|　(D) |<i>d</i>|`
        : `無人機送貨系統的軌跡記錄儀顯示了一條東西向航線。以基地（O 點）為原點，標記四個投放點 A、B、C、D。請問哪個投放點距離基地的直線距離最${askSmallest ? "短" : "遠"}？`;
      const hHTML = `絕對值代表「到原點的距離」。看圖判斷哪一個點離 O 最近或最遠。`;
      const aHTML = `距離原點 O 最${askSmallest ? "近" : "遠"}的點是 <strong>${answer}</strong>。`;
      return {
        qHTML, hHTML, aHTML,
        beforeRender: drawType9Canvas,
        inputs: [{ key: "main", label: "答案選項", placeholder: "輸入 A、B、C 或 D" }],
        validate: (values) => normalizeOption(values.main) === answer,
        answerHelp: "請輸入選項英文字母。",
      };
    }
    case 10: {
      const valX = rand(3, 8);
      const valY = rand(10, 16);
      const isGreater = Math.random() > 0.5;
      const aVals = [valX, -valX];
      const bVals = [valY, -valY];
      const conditionSymbol = isGreater ? ">" : "<";
      let validPairs = [];
      aVals.forEach((a) => {
        bVals.forEach((b) => {
          if (isGreater ? a > b : a < b) validPairs.push({ a, b, sum: a + b });
        });
      });
      const uniqueSums = [...new Set(validPairs.map((p) => p.sum))].sort((a, b) => a - b);
      const qHTML = !isApp
        ? `已知 <i>a</i>、<i>b</i> 皆為整數，且滿足 |<i>a</i>| = <i>${valX}</i>，|<i>b</i>| = <i>${valY}</i>。若在數線上，代表 <i>a</i> 的點在代表 <i>b</i> 的點的<strong>${isGreater ? "右邊" : "左邊"}</strong>，請求出 <i>a</i> + <i>b</i> 的所有可能值。`
        : `星際測量員在探測兩顆相鄰行星的極端溫度。已知甲星溫度絕對值為 <i>${valX}</i> 度，乙星溫度絕對值為 <i>${valY}</i> 度，且甲星的實際溫度比乙星還要<strong>${isGreater ? "高" : "低"}</strong>。請問兩顆行星溫度的加總可能為多少？`;
      const hHTML = `先列出 <i>a</i>、<i>b</i> 的所有可能，再用位置關係 ${conditionSymbol} 篩掉不符合的組合。`;
      const detail = validPairs.map((p) => `<i>a</i> = ${p.a}，<i>b</i> = ${p.b}，和 = <i>${p.sum}</i>`).join("<br>");
      const aHTML = `符合條件的組合為：<br>${detail}<br><br>所以所有可能值是 <strong>${uniqueSums.join("、")}</strong>。`;
      return {
        qHTML, hHTML, aHTML,
        inputs: [{ key: "main", label: "所有可能值", placeholder: "用逗號分隔，例如 -7,5" }],
        validate: (values) => sameNumberSet(normalizeSet(values.main), uniqueSums),
        answerHelp: "請把所有可能值都列出，用逗號分隔。",
      };
    }
    default:
      return {
        qHTML: "題目生成中...",
        hHTML: "",
        aHTML: "",
        inputs: [{ key: "main", label: "答案", placeholder: "" }],
        validate: () => false,
        answerHelp: ""
      };
  }
}

window.toggleModal = function(show) {
  document.getElementById("coreModal").classList.toggle("active", !!show);
};

export async function bootBattlePage(type) {
  const config = TYPE_CONFIG.find((item) => item.type === type) || TYPE_CONFIG[0];
  await primeAuth();

  const params = new URLSearchParams(window.location.search);
  const localEntry = getBattleEntry() || {};
  const returnTo = params.get("returnTo") || localEntry.returnTo || "chapter-1-1-field.html";
  const battleLabel = decodeURIComponent(params.get("label") || localEntry.label || config.title);
  let currentProfile = null;
  let currentUser = null;
  let currentModeIsApp = params.get("mode") === "app";
  let currentQuestion = null;
  let timerInterval = null;
  let seconds = 0;
  let cleared = false;

  function formatTimer(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }
  function startTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    const el = document.getElementById("timer");
    el.textContent = "00:00";
    el.classList.remove("timer-stopped");
    timerInterval = setInterval(() => {
      seconds += 1;
      el.textContent = formatTimer(seconds);
    }, 1000);
  }
  function stopTimer() {
    clearInterval(timerInterval);
    document.getElementById("timer").classList.add("timer-stopped");
  }

  document.getElementById("battle-tag").textContent = battleLabel;
  document.getElementById("page-title").textContent = "CH 1-1 負數與數線";
  document.getElementById("monster-badge").textContent = config.short;
  document.getElementById("type-title").textContent = config.title;
  document.getElementById("return-btn").addEventListener("click", () => transitionTo(`./${returnTo}`));
  document.getElementById("tower-btn").addEventListener("click", () => transitionTo("./tower-seven-up.html"));

  watchUser((user, profile) => {
    currentUser = user;
    currentProfile = profile;
    const wrap = document.getElementById("player-info");
    if (user && profile) {
      wrap.style.display = "flex";
      document.getElementById("player-name").textContent = profile.name || "勇者";
      document.getElementById("player-coins").textContent = profile.coins ?? 0;
    } else {
      wrap.style.display = "none";
    }
  });

  function renderQuestion() {
    clearAnswerSections();
    resetFeedback();
    cleared = false;
    document.getElementById("mathCanvas").style.display = "none";
    currentQuestion = buildQuestion(type, currentModeIsApp);
    document.getElementById("qText").innerHTML = currentQuestion.qHTML;
    document.getElementById("hText").innerHTML = currentQuestion.hHTML;
    document.getElementById("aText").innerHTML = currentQuestion.aHTML;
    document.getElementById("answer-grid").innerHTML = createInputHTML(currentQuestion.inputs);
    document.getElementById("answer-help").textContent = currentQuestion.answerHelp || "";
    if (typeof currentQuestion.beforeRender === "function") currentQuestion.beforeRender();
    updateModeBadge(currentModeIsApp);
    startTimer();
    firstInputFocus(currentQuestion.inputs);
  }

  async function handleSubmit() {
    if (!currentQuestion || cleared) return;
    const values = valuesFromInputs(currentQuestion.inputs);
    const anyEmpty = currentQuestion.inputs.some((input) => !String(values[input.key] ?? "").trim());
    if (anyEmpty) {
      setFeedback("請先把答案欄位填完整再送出。", "error");
      return;
    }
    const ok = currentQuestion.validate(values);
    if (!ok) {
      setFeedback("攻擊失敗，答案還不對。先檢查正負號、排序或所有可能值是否完整。", "error");
      return;
    }

    cleared = true;
    stopTimer();
    document.getElementById("aText").style.display = "block";
    setFeedback(`命中！獲得 ${REWARD_COINS} 金幣與 ${REWARD_EXP} EXP，返回 1-1 原野中…`, "success");

    try {
      if (currentUser) {
        await rewardPlayer(currentUser.uid, REWARD_COINS, REWARD_EXP);
        const coinEl = document.getElementById("player-coins");
        const currentCoins = Number(coinEl.textContent || "0");
        coinEl.textContent = String(currentCoins + REWARD_COINS);
      }
      saveBattleResult({
        scene: "chapter-1-1-field",
        coins: REWARD_COINS,
        exp: REWARD_EXP,
        type
      });
      setTimeout(() => transitionTo(`./${returnTo}`), 900);
    } catch (error) {
      console.error(error);
      cleared = false;
      setFeedback("已答對，但 Firebase 結算失敗。請檢查登入與網路後再試一次。", "error");
    }
  }

  document.getElementById("submit-btn").addEventListener("click", handleSubmit);
  document.getElementById("hint-btn").addEventListener("click", () => {
    document.getElementById("hText").style.display = "block";
    setFeedback("提示已展開，想清楚再出手。", "info");
  });
  document.getElementById("leave-btn").addEventListener("click", () => transitionTo(`./${returnTo}`));
  document.getElementById("standard-btn").addEventListener("click", () => {
    currentModeIsApp = false;
    renderQuestion();
  });
  document.getElementById("app-btn").addEventListener("click", () => {
    currentModeIsApp = true;
    renderQuestion();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleSubmit();
  });

  renderQuestion();
}
