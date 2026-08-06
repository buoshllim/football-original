const MATCH_DURATION = 5 * 60;

export class MatchSystem {
  constructor() {
    this.homeScore = 0;
    this.awayScore = 0;
    this.timeLeft = MATCH_DURATION;
    this.state = 'kickoff';
    this._goalCooldown = 0;
    this._onFullTime = null;
  }

  onFullTime(cb) { this._onFullTime = cb; }

  startKickoff() { this.state = 'playing'; }

  goal(team) {
    if (this.state !== 'playing') return;
    if (team === 'home') this.homeScore++;
    else this.awayScore++;
    this.state = 'goal';
    this._goalCooldown = 2.5;
  }

  update(dt) {
    if (this.state === 'goal') {
      this._goalCooldown -= dt;
      if (this._goalCooldown <= 0) this.state = 'kickoff';
      return;
    }

    if (this.state === 'playing') {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.state = 'fulltime';
        if (this._onFullTime) this._onFullTime(this.homeScore, this.awayScore);
      }
    }
  }
}
