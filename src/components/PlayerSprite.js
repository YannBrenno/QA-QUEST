// src/components/PlayerSprite.js
// Draws a player character on a canvas 2D context

const ACCESSORIES = {
  none:   null,
  hat:    '🎩',
  glasses:'🕶️',
  crown:  '👑',
  ribbon: '🎀',
};

/**
 * Draw a single player at (x, y) on ctx.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ nickname, color, accessory, x, y, direction }} player
 * @param {{ isLocal?: boolean, alpha?: number }} opts
 */
export function drawPlayer(ctx, player, opts = {}) {
  const { isLocal = false, alpha = 1 } = opts;
  const { x, y, color = '#00e5ff', accessory = 'none', nickname = '', direction = 0 } = player;
  const R = 20; // body radius

  ctx.save();
  ctx.globalAlpha = alpha;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(x, y + R + 4, R * .6, R * .2, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.fill();

  // Body glow (local player)
  if (isLocal) {
    const g = ctx.createRadialGradient(x, y, R, x, y, R * 3);
    g.addColorStop(0, `${color}22`);
    g.addColorStop(1, 'transparent');
    ctx.beginPath();
    ctx.arc(x, y, R * 3, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
  }

  // Body
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  // Shine
  const shine = ctx.createRadialGradient(x - 6, y - 6, 2, x, y, R);
  shine.addColorStop(0, 'rgba(255,255,255,.3)');
  shine.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();

  // Eyes
  const ex = Math.cos(direction) * 7;
  const ey = Math.sin(direction) * 7;
  ctx.fillStyle = 'rgba(0,0,0,.8)';
  [-5, 5].forEach(ox => {
    ctx.beginPath();
    ctx.arc(x + ox + ex * .6, y - 4 + ey * .6, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  // Eye whites
  ctx.fillStyle = '#fff';
  [-5, 5].forEach(ox => {
    ctx.beginPath();
    ctx.arc(x + ox + ex * .6 - 1, y - 5 + ey * .6, 1.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Accessory emoji
  const emoji = ACCESSORIES[accessory];
  if (emoji) {
    ctx.font = '18px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = '#fff';
    ctx.fillText(emoji, x, y - R + 2);
  }

  // Nickname
  if (nickname) {
    ctx.font = `bold 11px 'Orbitron', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const label = isLocal ? `${nickname} (você)` : nickname;
    const tw = ctx.measureText(label).width;

    // Background pill (moved higher)
    const pillY = y - R - 38; // subir nome acima de acessórios
    ctx.fillStyle = 'rgba(3,11,26,.75)';
    ctx.beginPath();
    ctx.roundRect(x - tw / 2 - 8, pillY, tw + 16, 20, 6);
    ctx.fill();

    // Text (moved higher accordingly)
    ctx.fillStyle = isLocal ? '#00e5ff' : '#fff';
    ctx.fillText(label, x, y - R - 22);
  }

  ctx.restore();
}
