// src/screens/MenuScreen.js

export function MenuScreen({ onStart, onCredits }) {
  const el = document.createElement('div');
  el.id = 'screen-menu';
  el.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;position:relative;overflow:hidden;';

  // Particle canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'particles';
  canvas.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:0';
  el.appendChild(canvas);

  // Content
  const content = document.createElement('div');
  content.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:36px;animation:fadeSlideUp .8s ease';

  content.innerHTML = `
    <div style="text-align:center">
      <span style="font-size:64px;display:block;margin-bottom:12px;animation:float 3s ease-in-out infinite">🐛</span>
      <h1 style="font-family:var(--font-game);font-size:clamp(36px,6vw,64px);font-weight:900;background:linear-gradient(90deg,#00e5ff,#76ff03);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;letter-spacing:4px">QA QUEST</h1>
      <p style="color:var(--color-muted);font-size:16px;margin-top:8px;letter-spacing:1px">Encontre os bugs. Salve o software.</p>
    </div>
    <div id="menu-btns" style="display:flex;flex-direction:column;gap:14px;align-items:center;min-width:260px"></div>
    <div style="text-align:center;color:rgba(123,158,201,.4);font-size:13px;line-height:1.8">
      <p>Use <kbd style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:4px;padding:2px 7px;font-family:var(--font-game);font-size:11px">W A S D</kbd> ou Setas para mover</p>
      <p>Pressione <kbd style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:4px;padding:2px 7px;font-family:var(--font-game);font-size:11px">E</kbd> para interagir</p>
    </div>
  `;

  const btnArea = content.querySelector('#menu-btns');

  const btnStart = document.createElement('button');
  btnStart.className = 'btn btn-primary';
  btnStart.style.fontSize = '18px';
  btnStart.innerHTML = '▶ Jogar';
  btnStart.addEventListener('click', onStart);
  btnArea.appendChild(btnStart);

  const btnCredits = document.createElement('button');
  btnCredits.className = 'btn btn-secondary';
  btnCredits.innerHTML = '⭐ Créditos';
  btnCredits.addEventListener('click', onCredits);
  btnArea.appendChild(btnCredits);

  el.appendChild(content);

  // Particle animation
  function initParticles() {
    const ctx = canvas.getContext('2d');
    let W, H;
    let particles = [];

    function resize() {
      W = canvas.width  = el.offsetWidth;
      H = canvas.height = el.offsetHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 2 + .5,
        dx: (Math.random() - .5) * .35,
        dy: (Math.random() - .5) * .35,
        a: Math.random() * .35 + .1,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${p.a})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,229,255,${.06 * (1 - d / 110)})`;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  requestAnimationFrame(initParticles);

  return el;
}
