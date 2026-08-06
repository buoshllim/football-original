export class HUD {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(0,0,0,0.75);
        color: white;
        padding: 10px 24px;
        font-family: monospace;
        font-size: 22px;
        font-weight: bold;
      ">
        <span id="hud-home">🔵 홈 0</span>
        <span id="hud-timer">05:00</span>
        <span id="hud-away">0 어웨이 🔴</span>
      </div>
      <div id="hud-msg" style="
        text-align: center;
        font-size: 40px;
        font-weight: bold;
        color: #fbbf24;
        text-shadow: 2px 2px 6px #000;
        min-height: 54px;
        font-family: monospace;
        padding-top: 4px;
      "></div>
    `;
    this.homeEl = document.getElementById('hud-home');
    this.awayEl = document.getElementById('hud-away');
    this.timerEl = document.getElementById('hud-timer');
    this.msgEl = document.getElementById('hud-msg');
  }

  update(homeScore, awayScore, secondsLeft) {
    this.homeEl.textContent = `🔵 홈 ${homeScore}`;
    this.awayEl.textContent = `${awayScore} 어웨이 🔴`;
    const m = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const s = Math.floor(secondsLeft % 60).toString().padStart(2, '0');
    this.timerEl.textContent = `${m}:${s}`;
  }

  showMessage(msg, durationMs = 2000) {
    this.msgEl.textContent = msg;
    if (durationMs > 0) setTimeout(() => { this.msgEl.textContent = ''; }, durationMs);
  }
}
