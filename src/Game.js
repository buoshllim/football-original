import { Field, FIELD } from './entities/Field.js';
import { Ball } from './entities/Ball.js';
import { Team } from './entities/Team.js';
import { HUD } from './ui/HUD.js';
import { ActionUI } from './ui/ActionUI.js';
import { calcSwipe } from './utils/swipe.js';
import { screenToField } from './utils/raycast.js';
import { dist2D } from './utils/math.js';

const CATCH_R    = 2.0;   // radius to catch ball
const GRACE_SEC  = 0.35;  // seconds after kick before kicker can re-catch
const CPU_THINK  = 1.5;   // seconds CPU "thinks"
const MATCH_SECS = 5 * 60;

// States: kickoff | player_turn | executing | cpu_turn | goal | fulltime
export class Game {
  constructor(scene, camera, canvas) {
    this._scene  = scene;
    this._camera = camera;
    this._canvas = canvas;

    this._field = new Field(scene);
    this._ball  = new Ball(scene);
    this._home  = new Team(scene, { name: 'home', color: 0x2563eb, side: 1 });
    this._away  = new Team(scene, { name: 'away', color: 0xdc2626, side: -1 });

    this._hud    = new HUD();
    this._ui     = new ActionUI();

    this._state      = 'kickoff';
    this._possessor  = null;
    this._kicker     = null;
    this._graceTimer = 0;
    this._cpuTimer   = 0;
    this._goalTimer  = 0;
    this._homeScore  = 0;
    this._awayScore  = 0;
    this._timeLeft   = MATCH_SECS;
    this._swipeStart = null;

    this._bindInput();
    this._kickoff();
  }

  // ─── Kickoff ────────────────────────────────────────
  _kickoff() {
    this._ball.reset();
    this._clearPossessor();
    this._home.driftHome(null);
    this._away.driftHome(null);

    // Give ball to home FWD (last player in list, role: fwd)
    setTimeout(() => {
      const fwd = this._home.players[this._home.players.length - 1];
      this._setPossessor(fwd);
      this._ball.snapTo(fwd.pos.x, fwd.pos.z);
      this._enterPlayerTurn();
    }, 300);
  }

  // ─── Player Turn ────────────────────────────────────
  _enterPlayerTurn() {
    this._state = 'player_turn';
    this._ui.showActions();
    this._ui.setStatus('⏸ 시간 멈춤 — 스와이프해서 패스/슛!');
  }

  // ─── CPU Turn ───────────────────────────────────────
  _enterCPUTurn(player) {
    this._state    = 'cpu_turn';
    this._cpuTimer = 0;
    this._ui.hideActions();
    this._ui.setStatus('🔴 CPU 생각 중...');
  }

  _cpuDecide() {
    const p = this._possessor;
    if (!p) return;

    const homeGoalZ = -FIELD.depth / 2;
    const distToGoal = dist2D(p.pos.x, p.pos.z, 0, homeGoalZ);

    if (distToGoal < 22) {
      // Shoot toward home goal with slight randomness
      const tx = (Math.random() - 0.5) * FIELD.goalWidth * 0.6;
      const tz = homeGoalZ;
      this._doKick(p, tx - p.pos.x, tz - p.pos.z, 0.75 + Math.random() * 0.25, false);
    } else {
      // Pass to furthest-forward teammate (closest to home goal)
      const mates = this._away.players.filter(pl => pl !== p && !pl.id.endsWith('_0'));
      if (!mates.length) return;
      const target = mates.reduce((best, pl) =>
        pl.pos.z < best.pos.z ? pl : best
      , mates[0]);
      this._doKick(p, target.pos.x - p.pos.x, target.pos.z - p.pos.z, 0.5 + Math.random() * 0.25, false);
    }
  }

  // ─── Kick ────────────────────────────────────────────
  _doKick(player, dx, dz, power, isLob) {
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len === 0) return;
    this._clearPossessor();
    this._kicker     = player;
    this._graceTimer = 0;
    this._ball.kick(dx / len, dz / len, power, isLob);
    this._enterExecuting();
  }

  _enterExecuting() {
    this._state = 'executing';
    this._ui.hideActions();
    this._ui.setStatus('');
  }

  // ─── Executing Update ───────────────────────────────
  _updateExecuting(dt) {
    this._graceTimer += dt;

    const allPlayers = [...this._home.players, ...this._away.players];
    const ball = this._ball;

    // Check goal first
    const goal = ball.checkGoal();
    if (goal) { this._onGoal(goal); return; }

    // Ball out of bottom/top bounds (behind goal, no goal) → reset
    if (Math.abs(ball.pos.z) > FIELD.depth / 2 + 3) {
      this._ui.flash('아웃!', 1000);
      setTimeout(() => this._kickoff(), 1200);
      this._state = 'goal'; // reuse goal state to block input
      return;
    }

    // Check catch
    if (this._graceTimer > GRACE_SEC) {
      for (const p of allPlayers) {
        const d = dist2D(p.pos.x, p.pos.z, ball.pos.x, ball.pos.z);
        if (d < CATCH_R) {
          this._onCatch(p);
          return;
        }
      }
    }

    // Ball stopped with nobody near → give to nearest home player
    if (!ball.moving) {
      const nearest = this._home.nearestTo(ball.pos.x, ball.pos.z, true);
      if (nearest) {
        // Move nearest player to ball
        nearest.moveTo(ball.pos.x, ball.pos.z);
        setTimeout(() => {
          this._setPossessor(nearest);
          this._ball.snapTo(nearest.pos.x, nearest.pos.z);
          this._enterPlayerTurn();
        }, 600);
        this._state = 'goal'; // block input while player walks over
      }
    }

    // Drift non-possessors toward formation
    this._home.driftHome(this._possessor);
    this._away.driftHome(this._possessor);
  }

  _onCatch(player) {
    this._setPossessor(player);
    this._ball.snapTo(player.pos.x, player.pos.z);

    if (player.team === 'home') {
      this._enterPlayerTurn();
    } else {
      this._enterCPUTurn(player);
    }
  }

  // ─── Goal ───────────────────────────────────────────
  _onGoal(team) {
    this._state = 'goal';
    if (team === 'home') this._homeScore++;
    else this._awayScore++;
    this._ui.hideActions();
    this._ui.setStatus('');
    this._hud.flash(team === 'home' ? '⚽ 홈팀 골!' : '⚽ 어웨이 골!');
    setTimeout(() => this._kickoff(), 2800);
  }

  // ─── Helpers ─────────────────────────────────────────
  _setPossessor(player) {
    this._clearPossessor();
    this._possessor = player;
    player.setHasBall(true);
  }

  _clearPossessor() {
    if (this._possessor) this._possessor.setHasBall(false);
    this._possessor = null;
  }

  // ─── Input ───────────────────────────────────────────
  _bindInput() {
    const canvas = this._canvas;
    let lastTouch = 0;

    const getPos = (e, touch = false) => {
      const r = canvas.getBoundingClientRect();
      const s = touch ? e.changedTouches[0] : e;
      return { x: s.clientX - r.left, y: s.clientY - r.top };
    };

    canvas.addEventListener('mousedown', e => { this._swipeStart = getPos(e); });
    canvas.addEventListener('mouseup',   e => { this._resolveInput(getPos(e)); });

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this._swipeStart = getPos(e, true);
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      lastTouch = Date.now();
      this._resolveInput(getPos(e, true));
    }, { passive: false });

    canvas.addEventListener('click', e => {
      if (Date.now() - lastTouch < 500) return;
      this._handleClick(getPos(e));
    });
  }

  _resolveInput(end) {
    if (!this._swipeStart) return;
    const start = this._swipeStart;
    this._swipeStart = null;
    const dx = end.x - start.x, dy = end.y - start.y;
    const d  = Math.sqrt(dx*dx + dy*dy);
    if (d < 15) {
      this._handleClick(end);
    } else {
      this._handleSwipe(calcSwipe(start, end));
    }
  }

  _handleClick({ x, y }) {
    if (this._state !== 'player_turn') return;
    const pos = screenToField(x, y, this._camera, this._canvas.clientWidth, this._canvas.clientHeight);
    if (!pos || !this._possessor) return;
    // Move possessor to clicked spot (dribble preview)
    this._possessor.moveTo(pos.x, pos.z);
  }

  _handleSwipe(swipe) {
    if (this._state !== 'player_turn') return;
    if (!this._possessor) return;
    const action = this._ui.action;
    const isLob  = action === 'lob';
    const power  = action === 'shot' ? Math.max(swipe.power, 0.65) : swipe.power + 0.15;
    // Screen swipe: right→positive field X, down→positive field Z
    this._doKick(this._possessor, swipe.dir.x, swipe.dir.y, Math.min(power, 1), isLob);
  }

  // ─── Main Update ─────────────────────────────────────
  update(dt) {
    this._ball.update(dt);
    this._home.update(dt);
    this._away.update(dt);

    // Snap ball to possessor
    if (this._possessor && this._state !== 'executing') {
      this._ball.snapTo(this._possessor.pos.x, this._possessor.pos.z);
    }

    switch (this._state) {
      case 'executing':
        this._updateExecuting(dt);
        break;

      case 'cpu_turn':
        this._cpuTimer += dt;
        if (this._cpuTimer >= CPU_THINK) this._cpuDecide();
        break;

      case 'player_turn':
      case 'kickoff':
        this._home.driftHome(this._possessor);
        this._away.driftHome(this._possessor);
        break;
    }

    // Timer (only ticks during executing)
    if (this._state === 'executing' && this._timeLeft > 0) {
      this._timeLeft -= dt;
      if (this._timeLeft <= 0) {
        this._timeLeft = 0;
        this._state = 'fulltime';
        this._ui.hideActions();
        this._ui.setStatus('');
        const h = this._homeScore, a = this._awayScore;
        this._hud.persist(h > a ? '🏆 홈팀 승리!' : h < a ? '어웨이 승리!' : '무승부!');
      }
    }

    this._hud.update(this._homeScore, this._awayScore, this._timeLeft);
  }
}
