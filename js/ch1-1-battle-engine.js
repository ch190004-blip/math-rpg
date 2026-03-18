
import { primeAuth, watchUser, rewardPlayer } from "./firebase-core.js";
import { getBattleEntry, saveBattleResult, transitionTo } from "./app-shell.js";

export const TYPE_CONFIG = [
  { type: 1, title: "題型一：相反意義的量(一)", desc: "正負符號與平均基準", tag: "基礎" },
  { type: 2, title: "題型二：相反意義的量(二)", desc: "正負符號與增減表徵", tag: "基礎" },
  { type: 3, title: "題型三：數線坐標與距離", desc: "解析空間距離", tag: "基礎" },
  { type: 4, title: "題型四：數線與等分點", desc: "分數與等分切割", tag: "進階" },
  { type: 5, title: "題型五：數的大小比較(一)", desc: "整數與小數比較", tag: "進階", labelClass: "label-normal" },
  { type: 6, title: "題型六：數的大小比較(二)", desc: "負分數與絕對值", tag: "進階", labelClass: "label-normal" },
  { type: 7, title: "題型七：相反數解碼", desc: "原點對稱特性", tag: "進階", labelClass: "label-normal" },
  { type: 8, title: "題型八：絕對值運算範圍", desc: "距離限制與不等式", tag: "挑戰", labelClass: "label-hard" },
  { type: 9, title: "題型九：圖解絕對值距離", desc: "歷屆會考改編", tag: "挑戰", labelClass: "label-hard" },
  { type: 10, title: "題型十：綜合挑戰", desc: "絕對值邏輯推演", tag: "綜合", labelClass: "label-hard" }
];

const STARTER_COINS = 10;
const STARTER_EXP = 50;

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function gcd(a, b) { return b === 0 ? Math.abs(a) : gcd(b, a % b); }
function genFracHTML(n, d) { return `<span class="frac"><span class="num">${n}</span><span class="den">${d}</span></span>`; }

function setupTypeButtons(defaultType) {
  const sidebar = document.getElementById("sidebar");
  TYPE_CONFIG.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "type-btn" + (item.type === defaultType ? " active" : "");
    btn.dataset.type = String(item.type);
    btn.innerHTML = `
      <div class="type-title">${item.title}</div>
      <div class="type-meta">
        <span class="sub-label ${item.labelClass || ""}">${item.desc}</span>
        <span class="tag">${item.tag}</span>
      </div>
    `;
    sidebar.appendChild(btn);
  });
}

function setActiveButton(type) {
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.classList.toggle("active", Number(btn.dataset.type) === type);
  });
}

function toggleModal(show) {
  document.getElementById("coreModal").classList.toggle("active", !!show);
}
window.toggleModal = toggleModal;

export async function bootBattlePage(defaultType) {
  setupTypeButtons(defaultType);
  await primeAuth();

  const params = new URLSearchParams(window.location.search);
  const localEntry = getBattleEntry();
  const typeFromUrl = parseInt(params.get("type") || String(defaultType), 10);
  const currentTypeRef = { value: Math.max(1, Math.min(10, Number.isFinite(typeFromUrl) ? typeFromUrl : defaultType)) };
  let isCurrentApp = false;
  let timerInterval = null;
  let seconds = 0;
  let rewardClaimed = false;
  let currentUser = null;
  let currentProfile = null;
  const returnTo = params.get("returnTo") || localEntry?.returnTo || "chapter-1-1-field.html";
  const battleLabel = decodeURIComponent(params.get("label") || localEntry?.label || TYPE_CONFIG.find((x) => x.type === currentTypeRef.value)?.title || "1-1 戰鬥");

  document.getElementById("battle-tag").textContent = battleLabel;
  document.getElementById("battle-note").innerHTML = `遭遇 <strong>${battleLabel}</strong>。<br>保留原題庫結構，支援標準題 / 素養題切換，完成挑戰後返回 1-1 原野。`;
  document.getElementById("return-btn").addEventListener("click", () => { window.location.href = returnTo; });
  document.getElementById("tower-btn").addEventListener("click", () => { window.location.href = "tower-seven-up.html"; });

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

  function resetSections() {
    document.getElementById("hText").style.display = "none";
    document.getElementById("aText").style.display = "none";
    document.getElementById("battle-note").style.display = "none";
    const completeBtn = document.getElementById("complete-btn");
    completeBtn.classList.remove("ready");
  }

  function showHint() {
    document.getElementById("hText").style.display = "block";
    document.getElementById("hText").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function showAnswer() {
    document.getElementById("aText").style.display = "block";
    document.getElementById("battle-note").style.display = "block";
    document.getElementById("complete-btn").classList.add("ready");
    stopTimer();
    document.getElementById("aText").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  async function completeBattle() {
    const btn = document.getElementById("complete-btn");
    if (rewardClaimed) {
      window.location.href = returnTo;
      return;
    }
    rewardClaimed = true;
    btn.disabled = true;
    btn.textContent = "💰 結算中...";
    try {
      if (currentUser) {
        await rewardPlayer(currentUser.uid, STARTER_COINS, STARTER_EXP);
      }
      saveBattleResult({
        scene: "chapter-1-1-field",
        coins: STARTER_COINS,
        exp: STARTER_EXP,
        type: currentTypeRef.value
      });
      btn.classList.add("done");
      btn.textContent = `🏹 完成挑戰，返回 1-1 原野（+${STARTER_COINS} 金幣）`;
      setTimeout(() => transitionTo(`./${returnTo}`), 250);
    } catch (error) {
      console.error(error);
      rewardClaimed = false;
      btn.disabled = false;
      btn.textContent = "💰 完成挑戰並返回 1-1 原野";
      document.getElementById("battle-note").innerHTML = "⚠️ Firebase 結算失敗，請確認網路或授權設定。";
      document.getElementById("battle-note").style.display = "block";
    }
  }

  document.getElementById("hint-btn").addEventListener("click", showHint);
  document.getElementById("answer-btn").addEventListener("click", showAnswer);
  document.getElementById("standard-btn").addEventListener("click", () => generateQuestion(false));
  document.getElementById("app-btn").addEventListener("click", () => generateQuestion(true));
  document.getElementById("complete-btn").addEventListener("click", completeBattle);

  watchUser((user, profile) => {
    currentUser = user;
    currentProfile = profile;
    const nameEl = document.getElementById("player-name");
    const coinsEl = document.getElementById("player-coins");
    const wrapper = document.getElementById("player-info");
    if (user && profile) {
      wrapper.style.display = "flex";
      nameEl.textContent = profile.name || "勇者";
      coinsEl.textContent = profile.coins ?? 0;
    } else {
      wrapper.style.display = "none";
    }
  });

  function updateModeBadge(isApp) {
    const badge = document.getElementById("modeBadge");
    if (isApp) {
      badge.innerText = "🚀 現代素養情境";
      badge.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(217, 70, 239, 0.2))";
      badge.style.color = "#e879f9";
      badge.style.borderColor = "rgba(217, 70, 239, 0.3)";
    } else {
      badge.innerText = "📝 課本標準情境";
      badge.style.background = "rgba(34, 211, 238, 0.1)";
      badge.style.color = "var(--accent-main)";
      badge.style.borderColor = "rgba(34, 211, 238, 0.3)";
    }
  }

  function drawType9Canvas() {
    const canvas = document.getElementById("mathCanvas");
    canvas.style.display = "block";
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.moveTo(30, 75);
    ctx.lineTo(570, 75);
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(570, 75);
    ctx.lineTo(560, 70);
    ctx.lineTo(560, 80);
    ctx.fillStyle = "#22d3ee";
    ctx.fill();

    const cx = 350;
    const pts = [
      { x: cx - 220, label: "C", sub: "c" },
      { x: cx - 80, label: "D", sub: "d" },
      { x: cx, label: "O", sub: "0" },
      { x: cx + 45, label: "A", sub: "a" },
      { x: cx + 170, label: "B", sub: "b" }
    ];
    ctx.font = 'bold 18px "Noto Sans TC"';
    ctx.textAlign = "center";
    pts.forEach((p) => {
      ctx.beginPath();
      ctx.moveTo(p.x, 70);
      ctx.lineTo(p.x, 80);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = p.label === "O" ? "#f59e0b" : "#f8fafc";
      ctx.fillText(p.label, p.x, 60);
      ctx.fillStyle = "#94a3b8";
      ctx.font = 'italic 16px "Times New Roman"';
      ctx.fillText(p.sub, p.x, 100);
      ctx.font = 'bold 18px "Noto Sans TC"';
    });
  }

  function generateQuestion(isApp) {
    isCurrentApp = isApp;
    resetSections();
    updateModeBadge(isApp);
    rewardClaimed = false;
    document.getElementById("complete-btn").disabled = false;
    document.getElementById("complete-btn").textContent = "💰 完成挑戰並返回 1-1 原野";
    document.getElementById("qText").innerHTML = "";
    document.getElementById("hText").innerHTML = "";
    document.getElementById("aText").innerHTML = "";
    const canvas = document.getElementById("mathCanvas");
    canvas.style.display = "none";

    let qHTML = "", hHTML = "", aHTML = "";
    switch (currentTypeRef.value) {
      case 1: {
        const base = rand(60, 85);
        const pDiff = rand(3, 15);
        const nDiffBase = rand(2, 12);
        const nDiff = -nDiffBase;

        if (!isApp) {
          qHTML = `某次數學平時測驗以全班平均分數 <i>${base}</i> 分為基準。若小妍考了 <i>${base + pDiff}</i> 分，記為 <i>+${pDiff}</i> 分；那麼小翊考了 <i>${base + nDiff}</i> 分，在紀錄表上應記為什麼？`;
          hHTML = `基準點設為 0。<br>比基準高記為正號 (＋)，比基準低則記為負號 (－)。<br>小翊的分數比平均少 <i>${nDiffBase}</i> 分。`;
          aHTML = `應記為 <i>${nDiff}</i> 分。`;
        } else {
          qHTML = `在星際物資運輸系統中，標準貨物艙的規定基準重量為 <i>${base}</i> 噸。系統感測器設定：重量超出基準 <i>${pDiff}</i> 噸時發送訊號 <i>+${pDiff}</i>。今日查核發現某貨物艙重量僅有 <i>${base + nDiff}</i> 噸，請問系統感測器會發送什麼數值的訊號？`;
          hHTML = `以標準重量為基準(0)。超重為正，不足為負。<br>該貨艙比基準輕了 <i>${nDiffBase}</i> 噸，應以負數表示。`;
          aHTML = `發送訊號 <i>${nDiff}</i>。`;
        }
        break;
      }
      case 2: {
        const base = rand(60, 90);
        const isHigher = Math.random() > 0.5;
        const diff = rand(3, 15);
        const refDiff = rand(2, 10);
        const finalScore = isHigher ? base + diff : base - diff;
        const actionWord = isHigher ? "多" : "少";
        const sign = isHigher ? "+" : "-";
        if (!isApp) {
          qHTML = `以 <i>${base}</i> 為基準，比 <i>${base}</i> 大 <i>${refDiff}</i> 記為 <i>+${refDiff}</i>。若 <i>A</i> 表示的數為 <i>${finalScore}</i>，應如何記錄？`;
          hHTML = `基準點設為 ${base}。大於基準用「+」表示，則小於基準用「-」表示。<br>判斷 ${finalScore} 比基準 ${base} 大還是小，相差多少。`;
          aHTML = `因為 ${finalScore} 比 ${base} ${actionWord} ${diff}，所以應記為 <i>${sign}${diff}</i>。`;
        } else {
          qHTML = `小明參加「賽博電競積分賽」，系統以 <i>${base}</i> 分為基礎評級線。超過基礎線 <i>${refDiff}</i> 分的玩家，狀態欄會顯示 <i>+${refDiff}</i>。若小明今日完賽後，積分結算為 <i>${finalScore}</i> 分，請問他的狀態欄會顯示什麼數字？`;
          hHTML = `生活中的正負號代表相對基準的增減。<br>計算小明的得分 ${finalScore} 與基礎線 ${base} 的差距。`;
          aHTML = `小明的積分比基礎線${actionWord} <i>${diff}</i> 分，所以顯示為 <i>${sign}${diff}</i>。`;
        }
        break;
      }
      case 3: {
        const aPos = -rand(3, 12);
        const bPos = rand(2, 10);
        const dist = bPos - aPos;

        if (!isApp) {
          qHTML = `在數線上，點 <i>A</i> 代表的數是 <i>${aPos}</i>，點 <i>B</i> 代表的數是 <i>${bPos}</i>。請問 <i>A</i>、<i>B</i> 兩點之間的距離是多少單位長？`;
          hHTML = `數線上兩點的距離計算公式：|右邊坐標 − 左邊坐標|。<br>也可以直接用大數減去小數：<i>${bPos}</i> − (<i>${aPos}</i>)。`;
          aHTML = `距離為 <i>${dist}</i> 個單位長。`;
        } else {
          qHTML = `在《CyberCity》擴增實境遊戲中，敵人據點 <i>A</i> 位於座標 <i>${aPos}</i>，你的基地 <i>B</i> 位於座標 <i>${bPos}</i>。請問基地 <i>B</i> 發射雷射導彈摧毀據點 <i>A</i>，導彈需要飛行的直線距離為多少單位？`;
          hHTML = `距離與方向無關，必須為正數。<br>計算兩坐標的差值絕對值：|<i>${bPos}</i> − (<i>${aPos}</i>)|。`;
          aHTML = `導彈飛行距離為 <i>${dist}</i> 單位。`;
        }
        break;
      }
      case 4: {
        const A = rand(1, 8);
        const N = randItem([3, 4, 5, 8, 10]);
        const k = rand(1, N - 1);
        const isMovingLeft = Math.random() > 0.5;
        const startInt = isMovingLeft ? -A : -(A + 1);
        const directionWord = isMovingLeft ? "向左" : "向右";
        let ansFrac;
        if (isMovingLeft) {
          const g = gcd(k, N);
          const n = k / g;
          const d = N / g;
          ansFrac = d === 1 ? `-${A + n}` : `-${A}${genFracHTML(n, d)}`;
        } else {
          const remainNum = N - k;
          const g = gcd(remainNum, N);
          const n = remainNum / g;
          const d = N / g;
          ansFrac = d === 1 ? `-${A + n}` : `-${A}${genFracHTML(n, d)}`;
        }

        if (!isApp) {
          qHTML = `在數線上，將 <i>${-A}</i> 和 <i>${-(A + 1)}</i> 之間平分成 <i>${N}</i> 等分。若從 <i>${startInt}</i> 開始${directionWord}算起，第 <i>${k}</i> 個等分點所代表的數為何？`;
          hHTML = `先確認方向：從 ${startInt} ${directionWord}，判斷是增加還是減少。<br>每一個等分的長度為 ${genFracHTML(1, N)} 單位。移動了 ${k} 個等分，所以移動距離是 ${genFracHTML(k, N)}。`;
          aHTML = `從 <i>${startInt}</i> ${directionWord}移動後，位置在 <strong>${ansFrac}</strong>。`;
        } else {
          qHTML = `深海探測潛水艇「海神號」正在垂直軌道移動。儀表板上的刻度以海平面為 0（向下為負）。探測器發現在標示 <i>${-A}</i> 公里與 <i>${-(A + 1)}</i> 公里的兩個觀測站之間，佈設了均勻的聲納網，將這段距離平分成 <i>${N}</i> 段。若海神號從 <i>${startInt}</i> 公里的觀測站繼續${isMovingLeft ? "向下潛" : "向上浮"}，經過了 <i>${k}</i> 段聲納網，此時它所在深度的刻度應記為多少？`;
          hHTML = `垂直數線上，向下等同於向負方向（向左）移動，向上為向正向（向右）。<br>計算每一段聲納網的間距，並配合方向加減原本的深度。`;
          aHTML = `答案記為：<strong>${ansFrac}</strong>。`;
        }
        break;
      }
      case 5: {
        const int1 = -rand(4, 9);
        const dec = int1 + rand(2, 8) / 10;
        const pos = rand(1, 5);
        let vars = [
          { name: "a", val: dec, str: dec.toFixed(1) },
          { name: "b", val: int1, str: int1.toString() },
          { name: "c", val: pos, str: pos.toString() }
        ];
        for (let i = vars.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1));
          [vars[i], vars[j]] = [vars[j], vars[i]];
        }
        const sorted = [...vars].sort((x, y) => y.val - x.val);
        const ansStr = `<i>${sorted[0].name}</i> &gt; <i>${sorted[1].name}</i> &gt; <i>${sorted[2].name}</i>`;
        if (!isApp) {
          qHTML = `已知三個數：<i>${vars[0].name}</i> = <i>${vars[0].str}</i>、<i>${vars[1].name}</i> = <i>${vars[1].str}</i>、<i>${vars[2].name}</i> = <i>${vars[2].str}</i>。<br>請利用不等號 (&gt;) 將 <i>a</i>、<i>b</i>、<i>c</i> 由大到小排列。`;
          hHTML = `比較規則：正數 &gt; 負數。<br>在負數中，絕對值愈大的，在數線上愈靠左，其實際數值反而愈小。`;
          aHTML = `${ansStr}<br><span style="font-size:0.85em; color:var(--text-muted);">(即 <i>${sorted[0].str}</i> &gt; <i>${sorted[1].str}</i> &gt; <i>${sorted[2].str}</i>)</span>`;
        } else {
          qHTML = `極地科考站監控三個鑽探井的深層冰溫變化。測得甲井溫度為 <i>${vars[0].str}</i> °C，乙井為 <i>${vars[1].str}</i> °C，丙井為 <i>${vars[2].str}</i> °C。若設定變數 <i>${vars[0].name}</i>、<i>${vars[1].name}</i>、<i>${vars[2].name}</i> 分別代表甲、乙、丙三井的溫度，請將這三個變數依溫度「由高到低」排列。`;
          hHTML = `溫度愈高，代表數值愈大。<br>零上的溫度高於零下的溫度；零下溫度中，負愈多代表愈冷。`;
          aHTML = `${ansStr}`;
        }
        break;
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
        const frac1 = `- ${genFracHTML(n1, d1)}`;
        const frac2 = `- ${genFracHTML(n2, d2)}`;
        const relation = val1 > val2 ? "&gt;" : "&lt;";
        const askHigher = Math.random() > 0.5;

        if (!isApp) {
          qHTML = `請比較兩數的大小，在空格中填入 &gt;、= 或 &lt;：<br><br><div style="text-align:center; font-size:1.5rem;">${frac1} &nbsp;&nbsp;[ &nbsp;&nbsp;&nbsp;&nbsp; ]&nbsp;&nbsp; ${frac2}</div>`;
          hHTML = `比較負分數大小的步驟：<br>1. 先通分比較數字部分（絕對值）的大小。<br>2. 記住原則：負數的絕對值愈大，其值愈小。`;
          aHTML = `通分後比較可得：${frac1} <strong>${relation}</strong> ${frac2}。`;
        } else {
          qHTML = `實驗室中存放兩種超導體冷卻液，A 液體的溫度必須維持在 ${frac1} ℃，B 液體的溫度必須維持在 ${frac2} ℃。請判斷哪一種液體的規定溫度比較<strong>${askHigher ? "高" : "低"}</strong>？`;
          hHTML = `溫度較${askHigher ? "高" : "低"}代表在數線上的位置較靠${askHigher ? "右" : "左"}，也就是數值較${askHigher ? "大" : "小"}。`;
          const targetVal = askHigher ? (val1 > val2 ? "A液體" : "B液體") : (val1 < val2 ? "A液體" : "B液體");
          aHTML = `因為 ${frac1} <strong>${relation}</strong> ${frac2}，所以符合條件的是 <strong>${targetVal}</strong>。`;
        }
        break;
      }
      case 7: {
        const baseNum = rand(2, 9);
        const isFraction = Math.random() > 0.5;
        let numStr, opNumStr, distStr;
        if (isFraction) {
          const den = rand(2, 5);
          numStr = `&minus;${genFracHTML(baseNum, den)}`;
          opNumStr = genFracHTML(baseNum, den);
          const g = gcd(baseNum * 2, den);
          distStr = genFracHTML((baseNum * 2) / g, den / g);
        } else {
          const val = baseNum + rand(1, 9) / 10;
          numStr = `&minus;<i>${val.toFixed(1)}</i>`;
          opNumStr = `<i>${val.toFixed(1)}</i>`;
          distStr = `<i>${(val * 2).toFixed(1)}</i>`;
        }

        if (!isApp) {
          qHTML = `若 <i>x</i> 的相反數是 ${numStr}，求 <i>x</i> = ？<br>又 <i>x</i> 與它的相反數，在數線上的距離為多少？`;
          hHTML = `相反數的性質：符號相反，數字部分相同。<br>負數的相反數為正數，兩數在數線上位於原點對稱兩側。`;
          aHTML = `<i>x</i> = ${opNumStr}<br>兩點距離為 <strong>${distStr}</strong>。`;
        } else {
          qHTML = `量子電腦中的位元態具有「反轉對稱性」。當觀測到反粒子狀態值為 ${numStr} 時，其對應的糾纏粒子狀態值 <i>x</i> 必定是它的相反數。請問 <i>x</i> 的數值為何？這兩個粒子在狀態數據軸上的差距（距離）是多少？`;
          hHTML = `糾纏粒子狀態值為反粒子的相反數，即去掉負號。<br>它們分別在 0 的左右兩側距離相等處，因此差距為單一狀態絕對值的兩倍。`;
          aHTML = `糾纏粒子狀態值 <i>x</i> = ${opNumStr}<br>狀態差距為 <strong>${distStr}</strong>。`;
        }
        break;
      }
      case 8: {
        const limit = rand(5, 12);
        const isLessOrEqual = Math.random() > 0.5;
        const symbol = isLessOrEqual ? "&le;" : "&lt;";
        const maxInt = isLessOrEqual ? limit : limit - 1;
        const count = maxInt * 2 + 1;
        if (!isApp) {
          qHTML = `已知 <i>a</i> 為整數，且滿足絕對值條件 |<i>a</i>| ${symbol} <i>${limit}</i>。請問符合此條件的 <i>a</i> 共有幾個？並列出最大與最小的可能值。`;
          hHTML = `絕對值 |<i>a</i>| 代表數線上的點到原點的距離。<br>距離${isLessOrEqual ? "小於或等於" : "嚴格小於"} <i>${limit}</i> 的整數共有左右對稱，再加上 0。`;
          aHTML = `共有 <i>${count}</i> 個整數。<br>最大值為 <i>${maxInt}</i>，最小值為 <i>-${maxInt}</i>。`;
        } else {
          qHTML = `星際巡邏艦停泊於太空站（座標 0）。規定巡邏的安全警戒範圍半徑必須${isLessOrEqual ? "不超過（小於等於）" : "嚴格小於"} <i>${limit}</i> 光年（即巡邏座標 <i>P</i> 需滿足 |<i>P</i>| ${symbol} <i>${limit}</i>）。若巡邏艦只能在整數光年座標的能量節點上跳躍，請問這條直線上共有幾個能量節點可供跳躍？其中座標值最大與最小的節點分別為何？`;
          hHTML = `題意相當於求解 |<i>P</i>| ${symbol} <i>${limit}</i> 的整數解。<br>往正向最遠可達 <i>${maxInt}</i>，往負向最遠可達 <i>-${maxInt}</i>，並包含原點 0。`;
          aHTML = `共有 <i>${count}</i> 個節點。<br>最大為 <i>${maxInt}</i>，最小為 <i>-${maxInt}</i>。`;
        }
        break;
      }
      case 9: {
        drawType9Canvas();
        const askSmallest = Math.random() > 0.5;
        if (!isApp) {
          qHTML = `數線上有 O、A、B、C、D 五點，O 為原點。各點位置及距離關係如圖所示。已知圖中各點代表的數分別為 0、<i>a</i>、<i>b</i>、<i>c</i>、<i>d</i>。<br>根據圖形判斷，下列何者的值${askSmallest ? "最<strong>小</strong>" : "最<strong>大</strong>"}？<br><br>(A) |<i>a</i>|　(B) |<i>b</i>|　(C) |<i>c</i>|　(D) |<i>d</i>|`;
          hHTML = `絕對值的幾何意義代表「該點到原點的距離」。<br>在圖上尋找哪一個點離原點 O 最${askSmallest ? "近" : "遠"}。`;
          const ansChar = askSmallest ? "A" : "C";
          const pointName = askSmallest ? "A" : "C";
          const varName = askSmallest ? "a" : "c";
          aHTML = `從數線圖可知，點 ${pointName} 距離原點 O 最${askSmallest ? "近" : "遠"}。<br>距離即為絕對值，故 |<i>${varName}</i>| 最${askSmallest ? "小" : "大"}。答案選 <strong>(${ansChar})</strong>。`;
        } else {
          qHTML = `無人機送貨系統的軌跡記錄儀顯示了一條東西向航線。以基地（O 點）為原點，標記了四個包裹投放點 A(<i>a</i>)、B(<i>b</i>)、C(<i>c</i>)、D(<i>d</i>)。儀器螢幕截圖如下。請問哪個投放點距離基地的直線距離最${askSmallest ? "<strong>短</strong>" : "<strong>遠</strong>"}？`;
          hHTML = `直線距離就是數線上的絕對值。觀察 A、B、C、D 四個點，誰與中心點 O 的間距最${askSmallest ? "短" : "長"}？`;
          const ansChar = askSmallest ? "A" : "C";
          aHTML = `距離原點 O 最${askSmallest ? "近" : "遠"}的點是 <strong>${ansChar}</strong>。`;
        }
        break;
      }
      case 10: {
        const valX = rand(3, 8);
        const valY = rand(10, 16);
        const isGreater = Math.random() > 0.5;
        const dirStr = isGreater ? "右邊" : "左邊";
        const conditionSymbol = isGreater ? "&gt;" : "&lt;";
        const aVals = [valX, -valX];
        const bVals = [valY, -valY];
        let validPairs = [];
        aVals.forEach((a) => {
          bVals.forEach((b) => {
            if (isGreater ? a > b : a < b) validPairs.push({ a, b, sum: a + b });
          });
        });
        const sumStrs = validPairs.map((p) => `<i>a</i> = ${p.a}, <i>b</i> = ${p.b} 時，和為 <i>${p.sum}</i>`).join("<br>");
        const finalSums = [...new Set(validPairs.map((p) => p.sum))].join(" 或 ");

        if (!isApp) {
          qHTML = `已知 <i>a</i>、<i>b</i> 皆為整數，且滿足絕對值方程式 |<i>a</i>| = <i>${valX}</i>，|<i>b</i>| = <i>${valY}</i>。<br>若在數線上，代表 <i>a</i> 的點在代表 <i>b</i> 的點的<strong>${dirStr}</strong>，請求出 <i>a</i> + <i>b</i> 的所有可能值。`;
          hHTML = `先從絕對值推導出 <i>a</i> 和 <i>b</i> 的可能數值，再利用位置關係「<i>a</i> 在 <i>b</i> 的${dirStr}」得到 <i>a</i> ${conditionSymbol} <i>b</i>。`;
          aHTML = `符合條件的組合為：<br>${sumStrs}<br><br>故 <i>a</i> + <i>b</i> 的可能值為：<strong>${finalSums}</strong>。`;
        } else {
          qHTML = `星際測量員在探測兩顆相鄰行星的地表極端溫度。已知甲星的極端溫度絕對值為 <i>${valX}</i> 度，乙星的極端溫度絕對值為 <i>${valY}</i> 度。根據紅外線掃描，甲星的實際溫度比乙星還要<strong>${isGreater ? "高" : "低"}</strong>。請問這兩顆行星的極端溫度加總（甲星溫度 + 乙星溫度），可能為多少度？`;
          hHTML = `甲星溫度可能為 ${valX} 或 -${valX}，乙星溫度可能為 ${valY} 或 -${valY}。<br>利用「甲 ${conditionSymbol} 乙」的條件排除不可能的組合。`;
          aHTML = `可能的真實溫度組合如下：<br>${sumStrs}<br><br>故兩星溫度加總可能為：<strong>${finalSums}</strong>。`;
        }
        break;
      }
      default:
        qHTML = "題目生成中。";
        hHTML = "";
        aHTML = "";
        break;
    }

    document.getElementById("qText").innerHTML = qHTML;
    document.getElementById("hText").innerHTML = hHTML;
    document.getElementById("aText").innerHTML = aHTML;
    startTimer();
  }

  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentTypeRef.value = Number(btn.dataset.type);
      setActiveButton(currentTypeRef.value);
      document.getElementById("battle-tag").textContent = TYPE_CONFIG.find((item) => item.type === currentTypeRef.value)?.title || battleLabel;
      generateQuestion(false);
    });
  });

  document.getElementById("page-title").textContent = `CH 1-1 負數與數線`;
  setActiveButton(currentTypeRef.value);
  generateQuestion(false);
}
