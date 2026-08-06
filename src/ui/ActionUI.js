export class ActionUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.activeAction = 'ground';
    this._listeners = {};
    this._build();
  }

  _build() {
    this.container.innerHTML = `
      <div id="action-panel" style="
        display: none;
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        gap: 12px;
        flex-direction: row;
      ">
        <button class="action-btn" data-action="ground" style="background:#2563eb">땅볼 패스</button>
        <button class="action-btn" data-action="lob" style="background:#7c3aed">로빙 패스</button>
        <button class="action-btn" data-action="shot" style="background:#dc2626">슛!</button>
      </div>
      <style>
        .action-btn {
          padding: 14px 22px;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 17px;
          font-weight: bold;
          cursor: pointer;
          touch-action: manipulation;
          pointer-events: all;
        }
        .action-btn.active { outline: 3px solid #fbbf24; }
        #action-panel { display: none; }
        #action-panel.visible { display: flex; }
      </style>
    `;

    this.panel = document.getElementById('action-panel');

    this.panel.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeAction = btn.dataset.action;
        this.panel.querySelectorAll('.action-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (this._listeners.actionChange) this._listeners.actionChange(this.activeAction);
      });
    });

    this.panel.querySelector('[data-action="ground"]').classList.add('active');
  }

  show() { this.panel.classList.add('visible'); }
  hide() { this.panel.classList.remove('visible'); }
  on(event, cb) { this._listeners[event] = cb; }
}
