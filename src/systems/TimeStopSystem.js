export class TimeStopSystem {
  constructor() {
    this.frozen = false;
    this.pendingAction = 'ground';
  }

  freeze() { this.frozen = true; }
  unfreeze() { this.frozen = false; }

  setPendingAction(action) { this.pendingAction = action; }
}
