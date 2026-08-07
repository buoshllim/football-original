export class ActionUI {
  constructor() {
    this._panel = null;
    this._statusEl = null;
    this._action = 'ground';
    this._onChange = null;
    this._build();
  }

  _build() {
    const wrap = document.createElement('div');
    wrap.id = 'action-wrap';
    wrap.style.cssText = `
      position: fixed; bottom: 0; left: 0; width: 100%;
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; padding-bottom: 20px; pointer-events: none;
    `;
    wrap.innerHTML = `
      <div id="status-msg" style="
        font-family:monospace; font-size:20px; font-weight:bold;
        color:#fbbf24; text-shadow:1px 1px 4px #000; min-height:28px;
      "></div>
      <div id="action-panel" style="display:none; gap:10px; flex-direction:row; pointer-events:all;">
        <button class="abtn" data-a="ground" style="background:#2563eb">⚽ 땅볼 패스</button>
        <button class="abtn" data-a="lob"    style="background:#7c3aed">🌈 로빙 패스</button>
        <button class="abtn" data-a="shot"   style="background:#dc2626">🔥 슛!</button>
      </div>
      <style>
        .abtn {
          padding:14px 20px; border:none; border-radius:10px;
          color:#fff; font-size:16px; font-weight:bold;
          cursor:pointer; touch-action:manipulation;
        }
        .abtn.on { outline:3px solid #ffd700; }
        #action-panel.show { display:flex !important; }
      </style>
    `;
    document.body.appendChild(wrap);

    this._panel    = wrap.querySelector('#action-panel');
    this._statusEl = wrap.querySelector('#status-msg');

    this._panel.querySelectorAll('.abtn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._action = btn.dataset.a;
        this._panel.querySelectorAll('.abtn').forEach(b => b.classList.remove('on'));
        btn.classList.add('on');
        if (this._onChange) this._onChange(this._action);
      });
    });

    this._panel.querySelector('[data-a="ground"]').classList.add('on');
  }

  showActions() {
    this._panel.classList.add('show');
  }

  hideActions() {
    this._panel.classList.remove('show');
  }

  setStatus(msg) {
    this._statusEl.textContent = msg;
  }

  get action() { return this._action; }

  onActionChange(cb) { this._onChange = cb; }
}
