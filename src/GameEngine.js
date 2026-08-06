import { Field } from './entities/Field.js';
import { Ball } from './entities/Ball.js';
import { Team } from './entities/Team.js';
import { InputSystem } from './systems/InputSystem.js';
import { PossessionSystem } from './systems/PossessionSystem.js';
import { TimeStopSystem } from './systems/TimeStopSystem.js';
import { AISystem } from './systems/AISystem.js';
import { MatchSystem } from './systems/MatchSystem.js';
import { HUD } from './ui/HUD.js';
import { ActionUI } from './ui/ActionUI.js';
import { screenToField } from './utils/raycast.js';

export class GameEngine {
  constructor(scene, camera, canvas) {
    this.scene = scene;
    this.camera = camera;
    this.canvas = canvas;
    this._init();
  }

  _init() {
    this.field = new Field(this.scene);
    this.ball = new Ball(this.scene);
    this.homeTeam = new Team(this.scene, { name: 'home', color: 0x2563eb, side: 1 });
    this.awayTeam = new Team(this.scene, { name: 'away', color: 0xdc2626, side: -1 });

    this.input = new InputSystem(this.canvas);
    this.possession = new PossessionSystem();
    this.timeStop = new TimeStopSystem();
    this.ai = new AISystem(this.awayTeam);
    this.match = new MatchSystem();

    this.hud = new HUD('hud');
    this.actionUI = new ActionUI('action-ui');

    this._wire();
    this.match.startKickoff();
  }

  _wire() {
    // Possession change → time stop if home team gets ball
    this.possession.onChange(player => {
      if (!player) return;
      // Clear ball indicator on all players
      [...this.homeTeam.allPlayers(), ...this.awayTeam.allPlayers()]
        .forEach(p => p.showBallIndicator(false));

      player.showBallIndicator(true);

      if (player.team === 'home' && !player.isGK) {
        this.timeStop.freeze();
        this.actionUI.show();
      }
    });

    this.actionUI.on('actionChange', action => {
      this.timeStop.setPendingAction(action);
    });

    // Click → move player with ball, or move nearest home player
    this.input.onClick(({ x, y }) => {
      const pos = screenToField(x, y, this.camera, this.canvas.clientWidth, this.canvas.clientHeight);
      if (!pos) return;

      const possessor = this.possession.possessor;
      if (possessor && possessor.team === 'home') {
        possessor.moveTo(pos.x, pos.z);
      } else {
        const nearest = this.homeTeam.findNearestTo(pos);
        if (nearest) nearest.moveTo(pos.x, pos.z);
      }
    });

    // Swipe → execute pass or shot
    this.input.onSwipe(swipe => {
      if (!this.timeStop.frozen) return;
      const possessor = this.possession.possessor;
      if (!possessor || possessor.team !== 'home') return;

      // Screen swipe Y maps to field Z (inverted)
      const dx = swipe.dir.x;
      const dz = swipe.dir.y;
      const action = this.timeStop.pendingAction;
      const power = action === 'shot' ? Math.max(swipe.power, 0.6) : swipe.power;

      this._kick(possessor, dx, dz, power);
      this.timeStop.unfreeze();
      this.actionUI.hide();
    });

    this.match.onFullTime((h, a) => {
      const msg = h > a ? '🏆 홈팀 승리!' : h < a ? '어웨이 승리!' : '무승부!';
      this.hud.showMessage(msg, 0);
    });
  }

  _kick(player, dx, dz, power) {
    this.possession.release();
    player.showBallIndicator(false);
    this.ball.kick(dx, dz, power);
  }

  update(dt) {
    if (this.match.state === 'fulltime') return;

    const allPlayers = [
      ...this.homeTeam.allPlayers(),
      ...this.awayTeam.allPlayers(),
    ];
    const frozen = this.timeStop.frozen;

    // Ball follows possessor during time-stop
    const possessor = this.possession.possessor;
    if (possessor) {
      this.ball.position.x = possessor.position.x;
      this.ball.position.z = possessor.position.z;
      this.ball.mesh.position.x = possessor.position.x;
      this.ball.mesh.position.z = possessor.position.z;
    } else {
      this.ball.update(dt);
    }

    this.homeTeam.update(dt, frozen, this.ball.position);
    this.awayTeam.update(dt, frozen, this.ball.position);

    if (!frozen && this.match.state === 'playing') {
      this.possession.update(allPlayers, this.ball);
    }

    this.ai.update(dt, this.ball, this.possession, this.timeStop, (dx, dz, power) => {
      const p = this.possession.possessor;
      if (p) this._kick(p, dx, dz, power);
    });

    // Goal detection
    if (this.match.state === 'playing' && !possessor) {
      const goal = this.ball.checkGoal();
      if (goal) {
        this.match.goal(goal);
        this.hud.showMessage(goal === 'home' ? '⚽ 홈팀 골!' : '⚽ 어웨이 골!');
        setTimeout(() => {
          this.ball.reset();
          this.possession.release();
        }, 2500);
      }
    }

    // Kickoff restart
    if (this.match.state === 'kickoff') {
      this.match.startKickoff();
    }

    this.match.update(dt);
    this.hud.update(this.match.homeScore, this.match.awayScore, this.match.timeLeft);
  }
}
