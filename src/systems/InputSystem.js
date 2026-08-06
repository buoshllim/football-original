import { calcSwipe } from '../utils/swipe.js';

const CLICK_THRESHOLD_PX = 15;

export class InputSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.swipeStart = null;
    this._swipeComplete = null;
    this._onClick = null;
    this._bind();
  }

  onSwipe(cb) { this._swipeComplete = cb; }
  onClick(cb) { this._onClick = cb; }

  _getPos(e, touch = false) {
    const rect = this.canvas.getBoundingClientRect();
    const src = touch ? e.changedTouches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }

  _bind() {
    let lastTouchTime = 0;

    this.canvas.addEventListener('mousedown', e => {
      this.swipeStart = this._getPos(e);
    });

    this.canvas.addEventListener('mouseup', e => {
      if (!this.swipeStart) return;
      this._resolve(this._getPos(e));
      this.swipeStart = null;
    });

    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this.swipeStart = this._getPos(e, true);
    }, { passive: false });

    this.canvas.addEventListener('touchend', e => {
      e.preventDefault();
      lastTouchTime = Date.now();
      if (!this.swipeStart) return;
      this._resolve(this._getPos(e, true));
      this.swipeStart = null;
    }, { passive: false });

    this.canvas.addEventListener('click', e => {
      if (Date.now() - lastTouchTime < 500) return;
      if (this._onClick) this._onClick(this._getPos(e));
    });
  }

  _resolve(end) {
    const start = this.swipeStart;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CLICK_THRESHOLD_PX) {
      if (this._onClick) this._onClick(end);
    } else {
      if (this._swipeComplete) this._swipeComplete(calcSwipe(start, end));
    }
  }
}
