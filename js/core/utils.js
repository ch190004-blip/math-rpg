
(function(app){
  function gcd(a, b){
    a = Math.abs(a);
    b = Math.abs(b);
    while (b) {
      const t = a % b;
      a = b;
      b = t;
    }
    return a || 1;
  }

  function reduceFraction(num, den){
    if (den === 0) return null;
    let n = Number(num);
    let d = Number(den);
    if (!Number.isFinite(n) || !Number.isFinite(d)) return null;
    if (d < 0) {
      n *= -1;
      d *= -1;
    }
    const g = gcd(n, d);
    return { num: n / g, den: d / g };
  }

  function decimalToFraction(value){
    const raw = String(value);
    if (!raw.includes('.')) return reduceFraction(Number(raw), 1);
    const digits = raw.split('.')[1].length;
    const den = 10 ** digits;
    const num = Math.round(Number(value) * den);
    return reduceFraction(num, den);
  }

  function parseRational(value){
    if (value == null) return null;
    const raw = String(value)
      .trim()
      .replace(/[＋﹢]/g, '+')
      .replace(/[−－﹣]/g, '-')
      .replace(/[，,]/g, ' ')
      .replace(/\s+/g, ' ');

    if (!raw) return null;

    if (/^[+-]?\d+$/.test(raw)) {
      return reduceFraction(parseInt(raw, 10), 1);
    }

    if (/^[+-]?\d+\.\d+$/.test(raw)) {
      return decimalToFraction(raw);
    }

    const mixed = raw.match(/^([+-]?\d+)\s+(\d+)\/(\d+)$/);
    if (mixed) {
      const whole = parseInt(mixed[1], 10);
      const num = parseInt(mixed[2], 10);
      const den = parseInt(mixed[3], 10);
      if (den === 0) return null;
      const sign = whole < 0 ? -1 : 1;
      const wholeAbs = Math.abs(whole);
      return reduceFraction(sign * (wholeAbs * den + num), den);
    }

    const frac = raw.match(/^([+-]?\d+)\/(\d+)$/);
    if (frac) {
      const num = parseInt(frac[1], 10);
      const den = parseInt(frac[2], 10);
      if (den === 0) return null;
      return reduceFraction(num, den);
    }

    return null;
  }

  function rationalEqual(a, b){
    const ra = typeof a === 'string' || typeof a === 'number' ? parseRational(a) : a;
    const rb = typeof b === 'string' || typeof b === 'number' ? parseRational(b) : b;
    if (!ra || !rb) return false;
    return ra.num === rb.num && ra.den === rb.den;
  }

  function rationalToString(num, den){
    const frac = reduceFraction(num, den);
    if (!frac) return '';
    const { num: n, den: d } = frac;
    if (d === 1) return String(n);
    const sign = n < 0 ? '-' : '';
    const absNum = Math.abs(n);
    const whole = Math.floor(absNum / d);
    const rest = absNum % d;
    if (whole && rest) return `${sign}${whole} ${rest}/${d}`;
    if (whole && !rest) return `${sign}${whole}`;
    return `${sign}${rest}/${d}`;
  }

  function htmlFraction(num, den){
    const frac = reduceFraction(num, den);
    if (!frac) return '';
    return `<span class="math-frac"><span class="num">${Math.abs(frac.num)}</span><span class="den">${frac.den}</span></span>`;
  }

  function htmlSignedFraction(num, den){
    const frac = reduceFraction(num, den);
    if (!frac) return '';
    const sign = frac.num < 0 ? '−' : '';
    const absNum = Math.abs(frac.num);
    if (frac.den === 1) return `${sign}<b>${absNum}</b>`;
    const whole = Math.floor(absNum / frac.den);
    const rest = absNum % frac.den;
    if (whole && rest) {
      return `${sign}<b>${whole}</b> ${htmlFraction(rest, frac.den)}`;
    }
    if (whole && !rest) {
      return `${sign}<b>${whole}</b>`;
    }
    return `${sign}${htmlFraction(rest, frac.den)}`;
  }

  const utils = {
    randInt(min, max){
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    choice(list){
      return list[Math.floor(Math.random() * list.length)];
    },
    clamp(v, min, max){
      return Math.max(min, Math.min(max, v));
    },
    normalizeIntegerInput(value){
      if (value == null) return null;
      const raw = String(value).trim()
        .replace(/[＋﹢]/g, '+')
        .replace(/[−－﹣]/g, '-')
        .replace(/\s+/g, '');
      if (!/^[+-]?\d+$/.test(raw)) return null;
      return String(parseInt(raw, 10));
    },
    normalizeChoiceInput(value){
      if (value == null) return null;
      return String(value).trim().toUpperCase().replace(/\s+/g, '');
    },
    isMobile(){
      return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || window.innerWidth <= 960;
    },
    formatTime(seconds){
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      return `${m}:${s}`;
    },
    safeHtml(text){
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    },
    uid(prefix='id'){
      return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
    },
    sanitizeName(value){
      const raw = String(value || '').replace(/\s+/g, ' ').trim();
      return raw.replace(/[<>]/g, '').slice(0, 12);
    },
    expToLevel(level){
      return level * 100;
    },
    levelFromExp(exp){
      return Math.max(1, Math.floor(exp / 100) + 1);
    },
    gcd,
    reduceFraction,
    parseRational,
    rationalEqual,
    rationalToString,
    htmlFraction,
    htmlSignedFraction
  };
  app.utils = Object.assign(app.utils, utils);
})(window.MathRPG);
