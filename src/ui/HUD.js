export class HUD {
  constructor() {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; top:0; left:0; width:100%; pointer-events:none;
      font-family:monospace;
    `;
    el.innerHTML = `
      <div style="
        display:flex; justify-content:space-between; align-items:center;
        background:rgba(0,0,0,0.75); color:#fff; padding:10px 24px; font-size:22px; font-weight:bold;
      ">
        <span id="h-home">🔵 홈 0</span>
        <span id="h-time">05:00</span>
        <span id="h-away">0 어웨이 🔴</span>
      </div>
      <div id="h-msg" style="
        text-align:center; font-size:42px; font-weight:bold;
        color:#fbbf24; text-shadow:2px 2px 6px #000; min-height:56px; padding-top:4px;
      "></div>
    `;
    document.body.appendChild(el);

    this._home = el.querySelector('#h-home');
    this._away = el.querySelector('#h-away');
    this._time = el.querySelector('#h-time');
    this._msg  = el.querySelector('#h-msg');
    this._msgTimer = null;
  }

  update(homeScore, awayScore, secondsLeft) {
    this._home.textContent = `🔵 홈 ${homeScore}`;
    this._away.textContent = `${awayScore} 어웨이 🔴`;
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const s = String(Math.floor(secondsLeft % 60)).padStart(2, '0');
    this._time.textContent = `${m}:${s}`;
  }

  flash(msg, ms = 2500) {
    this._msg.textContent = msg;
    clearTimeout(this._msgTimer);
    if (ms > 0) this._msgTimer = setTimeout(() => { this._msg.textContent = ''; }, ms);
  }

  persist(msg) { this._msg.textContent = msg; }
}
