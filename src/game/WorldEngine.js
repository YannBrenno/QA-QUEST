// src/game/WorldEngine.js
import { drawPlayer } from '../components/PlayerSprite.js';
import { presence } from '../multiplayer/presence.js';
import { throttle } from '../utils/throttle.js';

const FRICTION = 0.84;
const POS_RATE = 50;
const INTERP_DELAY_MS = 380;
const BUFFER_MAX = 90;
const SYNC_DEBOUNCE_MS = 120;

export const CHALLENGE_NODES = [
  { id: 1, label: 'Login Bugado', icon: '\uD83D\uDD10', difficulty: 1, file: '/challenge/challenge1.html' },
  { id: 2, label: 'Loja Virtual', icon: '\uD83D\uDED2', difficulty: 2, file: '/challenge/challenge2.html' },
  { id: 3, label: 'Dashboard', icon: '\uD83D\uDCCA', difficulty: 3, file: '/challenge/challenge3.html' },
  { id: 4, label: 'Formul\u00E1rio', icon: '\uD83D\uDCDD', difficulty: 4, file: '/challenge/challenge4.html' },
  { id: 5, label: 'Bug Final', icon: '\uD83C\uDFC6', difficulty: 5, file: '/challenge/challenge5.html' },
  { id: 6, label: 'Desafio Extra', icon: '\uD83D\uDCA0', difficulty: 5, file: '/bonus' },
];

function getNodePositions(W, H) {
  var cx = W / 2, cy = H / 2;
  var s = Math.min(W, H) * .28;
  return [
    { x: cx - s * 1.2, y: cy + s * .4 },
    { x: cx - s * .4, y: cy - s * .35 },
    { x: cx + s * .3, y: cy + s * .5 },
    { x: cx + s * .8, y: cy - s * .25 },
    { x: cx + s * 1.2, y: cy + s * .1 },
  ];
}

function catmullRom(p0, p1, p2, p3, t) {
  var t2 = t * t, t3 = t2 * t;
  var x = 0.5 * ((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3);
  var y = 0.5 * ((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3);
  return { x: x, y: y };
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export class WorldEngine {
  constructor(container, opts) {
    this.container = container;
    this.opts = opts;
    this.area = opts.area || 'lobby';
    this.player = Object.assign({}, opts.player, { x: opts.player.x || 200, y: opts.player.y || 200, vx: 0, vy: 0, direction: 0 });
    this.otherPlayers = {};
    this.keys = {};
    this.running = false;
    this.nearNode = -1;
    this.time = 0;
    this._rafId = null;
    this._lastFrameTime = performance.now();
    this._syncDebounceTimer = null;
    this._nearDoor = null;
    this._buildDOM();
    this._bindInput();
  }

  _buildDOM() {
    this.container.innerHTML = '';
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;inset:0;display:block;';
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.prompt = document.createElement('div');
    this.prompt.style.cssText = 'position:absolute;padding:10px 20px;background:rgba(0,229,255,.12);border:1px solid rgba(0,229,255,.35);border-radius:10px;font-size:13px;color:#00e5ff;pointer-events:none;display:none;white-space:nowrap;transform:translate(-50%,-100%);';
    this.container.appendChild(this.prompt);
    this.hud = document.createElement('div');
    this.hud.className = 'hud';
    this.hud.innerHTML = '<div class="hud-item" id="hud-area">' + this._areaLabel() + '</div><div class="hud-item" id="hud-players"><span id="hud-pc">1</span> online</div>';
    this.container.appendChild(this.hud);
    this._resize();
    window.addEventListener('resize', this._resize.bind(this));
  }

  _areaLabel() {
    var labels = { lobby: 'Lobby', map: 'Mapa de Desafios', ending: 'Area Final' };
    return labels[this.area] || this.area;
  }

  _resize() {
    this.W = this.canvas.width = this.container.clientWidth || window.innerWidth;
    this.H = this.canvas.height = this.container.clientHeight || window.innerHeight;
    this.player.x = Math.max(60, Math.min(this.W - 60, this.player.x));
    this.player.y = Math.max(110, Math.min(this.H - 60, this.player.y));
  }

  _bindInput() {
    var self = this;
    this._onKeyDown = function(e) {
      self.keys[e.key.toLowerCase()] = true;
      self.keys[e.code] = true;
      if (e.key === 'e' || e.key === 'E') {
        if (self.nearNode >= 0) {
          self._interactWithNode(self.nearNode);
        } else if (self._nearDoor) {
          if (self._nearDoor.type === 'bonus') {
            self._handleBonus();
          } else if (self._nearDoor.type === 'scoreboard') {
            if (self.opts.onOpenScoreboard) self.opts.onOpenScoreboard();
          } else if (self._nearDoor.type === 'ending') {
            if (self.opts.onGoToEnding) self.opts.onGoToEnding();
          } else if (self.opts.onGoToMap) {
            self.opts.onGoToMap();
          }
        }
      }
    };
    this._onKeyUp = function(e) {
      self.keys[e.key.toLowerCase()] = false;
      self.keys[e.code] = false;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  start() {
    var self = this;
    this.running = true;
    this.otherPlayers = {};
    var applyPlayersDebounced = function(players) {
      if (self._syncDebounceTimer) clearTimeout(self._syncDebounceTimer);
      self._syncDebounceTimer = setTimeout(function() {
        var me = presence.getPlayer ? presence.getPlayer() : null;
        if (me && me.currentArea !== self.area) return;
        self._syncOthers(players);
        self._syncDebounceTimer = null;
      }, SYNC_DEBOUNCE_MS);
    };
    presence.joinArea(this.area, function(players) { applyPlayersDebounced(players); });
    this._syncPos = throttle(function(x, y, dir) { presence.updatePosition(x, y, dir); }, POS_RATE);
    this._loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._rafId);
    if (this._syncDebounceTimer) { clearTimeout(this._syncDebounceTimer); this._syncDebounceTimer = null; }
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
  }

  _syncOthers(players) {
    var me = presence.getPlayer ? presence.getPlayer() : null;
    if (me && me.currentArea !== this.area) return;
    var current = {};
    var now = performance.now();
    for (var k = 0; k < players.length; k++) {
      var p = players[k];
      if (this.otherPlayers[p.id]) {
        var op = this.otherPlayers[p.id];
        op.buffer.push({ x: p.x, y: p.y, t: now });
        if (op.buffer.length > BUFFER_MAX) op.buffer.shift();
        op.lastUpdate = now;
        op.direction = p.direction !== undefined ? p.direction : op.direction;
        op.color = p.color;
        op.accessory = p.accessory;
        op.nickname = p.nickname;
      } else {
        this.otherPlayers[p.id] = { id: p.id, x: p.x, y: p.y, tx: p.x, ty: p.y, direction: p.direction || 0, color: p.color, accessory: p.accessory, nickname: p.nickname, buffer: [{ x: p.x, y: p.y, t: now - 40 }, { x: p.x, y: p.y, t: now }], lastUpdate: now };
      }
      current[p.id] = true;
    }
    for (var id in this.otherPlayers) { if (!current[id]) delete this.otherPlayers[id]; }
    var pcEl = document.getElementById('hud-pc');
    if (pcEl) pcEl.textContent = String(Object.keys(this.otherPlayers).length + 1);
  }

  _loop() {
    if (!this.running) return;
    var now = performance.now();
    var dt = Math.min((now - this._lastFrameTime) / 1000, 0.05);
    this._lastFrameTime = now;
    this._update(dt);
    this._draw();
    var self = this;
    this._rafId = requestAnimationFrame(function() { self._loop(); });
  }

  _update(dt) {
    this.time++;
    var p = this.player;
    var ix = 0, iy = 0;
    if (this.keys['w'] || this.keys['arrowup']) iy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) iy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) ix -= 1;
    if (this.keys['d'] || this.keys['arrowright']) ix += 1;
    if (ix !== 0 && iy !== 0) { ix *= 0.707; iy *= 0.707; }
    if (ix !== 0 || iy !== 0) { p.direction = Math.atan2(iy, ix); }
    p.vx = (p.vx + ix * .8) * FRICTION;
    p.vy = (p.vy + iy * .8) * FRICTION;
    p.x += p.vx;
    p.y += p.vy;
    p.x = Math.max(60, Math.min(this.W - 60, p.x));
    p.y = Math.max(110, Math.min(this.H - 60, p.y));
    if (Math.abs(p.vx) > .05 || Math.abs(p.vy) > .05) {
      if (this._syncPos) this._syncPos(p.x, p.y, p.direction);
    }
    this._nearDoor = null;
    this.prompt.style.display = 'none';

    // Interpolate others
    var renderTime = performance.now() - INTERP_DELAY_MS;
    for (var id in this.otherPlayers) {
      var op = this.otherPlayers[id];
      var buf = op.buffer;
      if (!buf || buf.length < 2) continue;
      var i = 0;
      while (i < buf.length - 1 && buf[i + 1].t < renderTime) i++;
      var p0 = buf[clamp(i - 1, 0, buf.length - 1)];
      var p1 = buf[clamp(i, 0, buf.length - 1)];
      var p2 = buf[clamp(i + 1, 0, buf.length - 1)];
      var p3 = buf[clamp(i + 2, 0, buf.length - 1)];
      var segStart = p1.t;
      var segEnd = p2.t;
      var t = clamp((renderTime - segStart) / Math.max(1, segEnd - segStart), 0, 1);
      var pos = catmullRom(p0, p1, p2, p3, t);
      op.x = op.x + (pos.x - op.x) * 0.2;
      op.y = op.y + (pos.y - op.y) * 0.2;
    }

    // Proximity (map)
    if (this.area === 'map') {
      var nodes = getNodePositions(this.W, this.H);
      this.nearNode = -1;
      var completed = (this.opts.progress && this.opts.progress.completed) ? this.opts.progress.completed : [];
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        var dx = p.x - n.x;
        var dy = p.y - n.y;
        var ch = CHALLENGE_NODES[i];
        var unlocked = i === 0 || completed.includes(CHALLENGE_NODES[i - 1].id);
        if (Math.sqrt(dx * dx + dy * dy) < 56 && unlocked) {
          this.nearNode = i;
          break;
        }
      }
      if (this.nearNode >= 0) {
        var n2 = getNodePositions(this.W, this.H)[this.nearNode];
        var isDone = completed.includes(CHALLENGE_NODES[this.nearNode].id);
        this.prompt.style.display = 'block';
        this.prompt.style.left = n2.x + 'px';
        this.prompt.style.top = (n2.y - 50) + 'px';
        this.prompt.textContent = isDone ? '[E] Rejogar: ' + CHALLENGE_NODES[this.nearNode].label : '[E] Entrar: ' + CHALLENGE_NODES[this.nearNode].label;
      }
    }
  }

  _draw() {
    var ctx = this.ctx;
    var W = this.W, H = this.H;
    ctx.fillStyle = '#060e1f';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,229,255,.025)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (var y = 0; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (this.area === 'lobby') this._drawLobby(ctx, W, H);
    if (this.area === 'map') this._drawMap(ctx, W, H);
    if (this.area === 'ending') this._drawEnding(ctx, W, H);
    for (var id in this.otherPlayers) { drawPlayer(ctx, this.otherPlayers[id], { alpha: .9 }); }
    drawPlayer(ctx, this.player, { isLocal: true });
  }

  _drawLobby(ctx, W, H) {
    ctx.fillStyle = 'rgba(0,229,255,.03)';
    ctx.beginPath(); ctx.ellipse(W/2, H/2, W*.35, H*.3, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,229,255,.08)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(W/2, H/2, W*.35, H*.3, 0, 0, Math.PI*2); ctx.stroke();
    var pulse = Math.sin(this.time * .04) * 6;
    ctx.beginPath(); ctx.arc(W/2, H/2, 18+pulse, 0, Math.PI*2); ctx.fillStyle = 'rgba(0,229,255,.15)'; ctx.fill();
    ctx.beginPath(); ctx.arc(W/2, H/2, 8, 0, Math.PI*2); ctx.fillStyle = '#00e5ff'; ctx.fill();
    ctx.font = "bold 13px 'Orbitron', sans-serif"; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,229,255,.5)'; ctx.fillText('LOBBY', W/2, H/2+40);
    this._drawDoor(ctx, W-80, H/2, 'MAPA', 'map');
  }

  _drawDoor(ctx, x, y, label, type) {
    var p = this.player;
    var dx = p.x - x, dy = p.y - y;
    var dist = Math.sqrt(dx*dx + dy*dy);
    var isNear = dist < 60;
    var pulse = Math.sin(this.time * 0.06) * 4;
    ctx.beginPath(); ctx.arc(x, y, 28+(isNear?pulse:0), 0, Math.PI*2);
    ctx.fillStyle = isNear ? 'rgba(0,229,255,.25)' : 'rgba(0,229,255,.08)'; ctx.fill();
    ctx.strokeStyle = isNear ? '#00e5ff' : 'rgba(0,229,255,.3)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "bold 11px 'Orbitron', sans-serif"; ctx.textAlign = 'center';
    ctx.fillStyle = isNear ? '#00e5ff' : 'rgba(0,229,255,.6)'; ctx.fillText(label, x, y+4);
    if (isNear) {
      this._nearDoor = { type: type };
      this.prompt.style.display = 'block';
      this.prompt.style.left = x + 'px';
      this.prompt.style.top = (y - 50) + 'px';
      this.prompt.textContent = '[E] ' + label;
    }
  }

  _drawMap(ctx, W, H) {
    var nodes = getNodePositions(W, H);
    var completed = (this.opts.progress && this.opts.progress.completed) ? this.opts.progress.completed : [];
    var t = this.time;

    // Draw animated connection lines
    for (var i = 0; i < nodes.length - 1; i++) {
      var from = nodes[i], to = nodes[i+1];
      var done = completed.includes(CHALLENGE_NODES[i].id);
      var grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      if (done) {
        grad.addColorStop(0, 'rgba(40,200,64,.6)');
        grad.addColorStop(1, 'rgba(40,200,64,.2)');
      } else {
        grad.addColorStop(0, 'rgba(0,229,255,.25)');
        grad.addColorStop(1, 'rgba(0,229,255,.05)');
      }
      ctx.strokeStyle = grad; ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -t * 0.5;
      ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.lineTo(to.x, to.y); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw nodes
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var ch = CHALLENGE_NODES[i];
      var unlocked = i === 0 || completed.includes(CHALLENGE_NODES[i - 1].id);
      var done = completed.includes(ch.id);
      var pulse = Math.sin(t * 0.06 + i * 1.2) * 4;

      // Outer glow ring
      ctx.beginPath();
      ctx.arc(n.x, n.y, 34 + (unlocked ? pulse : 0), 0, Math.PI * 2);
      if (done) {
        ctx.fillStyle = 'rgba(40,200,64,.08)';
        ctx.strokeStyle = 'rgba(40,200,64,.3)';
      } else if (unlocked) {
        ctx.fillStyle = 'rgba(0,229,255,.06)';
        ctx.strokeStyle = 'rgba(0,229,255,.4)';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.02)';
        ctx.strokeStyle = 'rgba(255,255,255,.08)';
      }
      ctx.lineWidth = 2; ctx.fill(); ctx.stroke();

      // Inner circle
      ctx.beginPath();
      ctx.arc(n.x, n.y, 22, 0, Math.PI * 2);
      if (done) {
        ctx.fillStyle = 'rgba(40,200,64,.15)';
      } else if (unlocked) {
        ctx.fillStyle = 'rgba(0,229,255,.12)';
      } else {
        ctx.fillStyle = 'rgba(30,30,50,.5)';
      }
      ctx.fill();

      // Particles for completed nodes
      if (done) {
        for (var p2 = 0; p2 < 3; p2++) {
          var angle = (t * 0.02 + p2 * 2.09) + i;
          var px = n.x + Math.cos(angle) * (28 + pulse);
          var py = n.y + Math.sin(angle) * (28 + pulse);
          ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(40,200,64,' + (0.4 + Math.sin(t * 0.1 + p2) * 0.3) + ')';
          ctx.fill();
        }
      }

      // Pulsing ring for unlocked (not done)
      if (unlocked && !done) {
        var ringPulse = (Math.sin(t * 0.04 + i) + 1) * 0.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 26 + ringPulse * 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,229,255,' + (0.15 - ringPulse * 0.12) + ')';
        ctx.lineWidth = 1.5; ctx.stroke();
      }

      // Icon
      ctx.globalAlpha = unlocked ? 1 : 0.3;
      ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(done ? '🏆' : ch.icon, n.x, n.y);
      ctx.globalAlpha = 1;

      // Label
      ctx.font = "bold 11px 'Orbitron', sans-serif"; ctx.textAlign = 'center';
      if (done) {
        ctx.fillStyle = 'rgba(40,200,64,.8)';
      } else if (unlocked) {
        ctx.fillStyle = 'rgba(0,229,255,.8)';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,.25)';
      }
      ctx.fillText(ch.label, n.x, n.y + 38);

      // Difficulty stars
      if (unlocked) {
        ctx.font = '9px sans-serif';
        ctx.fillText('⭐'.repeat(ch.difficulty), n.x, n.y + 50);
      }
    }

    // Door back to lobby
    this._drawDoor(ctx, 60, H / 2, 'LOBBY', 'map');

    // Door to ending (only if all 5 challenges completed)
    if (completed.length >= 5) {
      this._drawDoor(ctx, W - 60, H / 2, 'FINAL', 'ending');
    }
  }

  _drawEnding(ctx, W, H) {
    // Draw bonus portal on the floor (bottom-right corner)
    var bx = W - 120, by = H - 100;
    var pulse = Math.sin(this.time * 0.05) * 5;
    var p = this.player;
    var dx = p.x - bx, dy = p.y - by;
    var dist = Math.sqrt(dx*dx + dy*dy);
    var isNear = dist < 60;

    // Portal glow
    ctx.beginPath(); ctx.arc(bx, by, 32 + pulse, 0, Math.PI*2);
    ctx.fillStyle = isNear ? 'rgba(255,209,102,.2)' : 'rgba(255,209,102,.08)'; ctx.fill();
    ctx.strokeStyle = isNear ? '#ffd166' : 'rgba(255,209,102,.4)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffd166'; ctx.fillText('💠', bx, by);
    ctx.font = "bold 10px 'Orbitron', sans-serif";
    ctx.fillStyle = 'rgba(255,209,102,.7)'; ctx.fillText('BONUS', bx, by + 42);

    if (isNear) {
      this._nearDoor = { type: 'bonus' };
      this.prompt.style.display = 'block';
      this.prompt.style.left = bx + 'px';
      this.prompt.style.top = (by - 50) + 'px';
      this.prompt.textContent = '[E] Desafio Extra';
    }

    // Draw scoreboard item (bottom-left corner)
    var sx = 120, sy = H - 100;
    var pulse2 = Math.sin(this.time * 0.04 + 1) * 4;
    var dx2 = p.x - sx, dy2 = p.y - sy;
    var dist2 = Math.sqrt(dx2*dx2 + dy2*dy2);
    var isNear2 = dist2 < 60;

    ctx.beginPath(); ctx.arc(sx, sy, 30 + pulse2, 0, Math.PI*2);
    ctx.fillStyle = isNear2 ? 'rgba(0,229,255,.2)' : 'rgba(0,229,255,.06)'; ctx.fill();
    ctx.strokeStyle = isNear2 ? '#00e5ff' : 'rgba(0,229,255,.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = '24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00e5ff'; ctx.fillText('🏅', sx, sy);
    ctx.font = "bold 10px 'Orbitron', sans-serif";
    ctx.fillStyle = 'rgba(0,229,255,.7)'; ctx.fillText('PLACAR', sx, sy + 42);

    if (isNear2 && !isNear) {
      this._nearDoor = { type: 'scoreboard' };
      this.prompt.style.display = 'block';
      this.prompt.style.left = sx + 'px';
      this.prompt.style.top = (sy - 50) + 'px';
      this.prompt.textContent = '[E] Placar';
    }
  }

  _interactWithNode(idx) {
    if (this.opts.onEnterChallenge) this.opts.onEnterChallenge(CHALLENGE_NODES[idx]);
  }

  _handleBonus() {
    if (this._nearDoor && this._nearDoor.type === 'bonus') {
      if (this.opts.onOpenBonus) this.opts.onOpenBonus();
      return true;
    }
    return false;
  }
}