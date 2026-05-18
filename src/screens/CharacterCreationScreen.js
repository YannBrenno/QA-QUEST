// src/screens/CharacterCreationScreen.js

import { drawPlayer }      from '../components/PlayerSprite.js';
import { v4 as uuidv4 }   from '../utils/uuid.js';

const COLORS = [
  '#00e5ff', '#76ff03', '#ffd166', '#ff6b9d',
  '#c77dff', '#ff9a3c', '#ff5c5c', '#43e97b',
];

const ACCESSORIES = ['none', 'hat', 'glasses', 'crown', 'ribbon'];
const ACC_LABELS  = { none: 'Nenhum', hat: '🎩 Chapéu', glasses: '🕶️ Óculos', crown: '👑 Coroa', ribbon: '🎀 Faixa' };

export function CharacterCreationScreen({ onComplete }) {
  const el = document.createElement('div');
  el.id = 'screen-character';
  el.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:24px;overflow-y:auto;';

  let draft = {
    color:     '#00e5ff',
    accessory: 'none',
    nickname:  '',
  };

  el.innerHTML = `
    <div class="card" style="width:100%;max-width:820px;display:grid;grid-template-columns:1fr 1fr;gap:32px;animation:fadeSlideUp .6s ease">
      <!-- Left: form -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <h2 style="font-family:var(--font-game);color:var(--color-accent);font-size:20px">Criar Personagem</h2>

        <div>
          <label class="label">Nickname</label>
          <input id="input-nick" class="input" type="text" maxlength="20" placeholder="Seu nome de testador...">
          <p id="nick-error" style="font-size:12px;color:var(--color-danger);margin-top:4px;min-height:16px"></p>
        </div>

        <div>
          <label class="label">Cor do personagem</label>
          <div id="color-grid" style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px"></div>
        </div>

        <div>
          <label class="label">Acessório</label>
          <div id="acc-grid" style="display:flex;flex-wrap:wrap;gap:8px"></div>
        </div>

        <button id="btn-confirm" class="btn btn-primary" style="margin-top:8px">✓ Entrar no Mundo</button>
      </div>

      <!-- Right: preview -->
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">
        <p style="font-family:var(--font-game);font-size:13px;color:var(--color-muted)">Preview</p>
        <canvas id="preview-canvas" width="200" height="200"
          style="background:rgba(10,30,61,.6);border:1px solid var(--color-border);border-radius:var(--radius-md)"></canvas>
        <p id="preview-name" style="font-family:var(--font-game);font-size:14px;color:var(--color-accent)">—</p>
      </div>
    </div>
  `;

  // ---- DOM refs ----
  const nickInput  = el.querySelector('#input-nick');
  const nickError  = el.querySelector('#nick-error');
  const colorGrid  = el.querySelector('#color-grid');
  const accGrid    = el.querySelector('#acc-grid');
  const btnConfirm = el.querySelector('#btn-confirm');
  const previewCvs = el.querySelector('#preview-canvas');
  const previewCtx = previewCvs.getContext('2d');
  const previewName = el.querySelector('#preview-name');

  // ---- Build color grid ----
  COLORS.forEach(c => {
    const btn = document.createElement('button');
    btn.style.cssText = `width:100%;aspect-ratio:1;border-radius:50%;border:3px solid transparent;background:${c};cursor:pointer;transition:all .2s`;
    btn.dataset.color = c;
    btn.addEventListener('click', () => {
      draft.color = c;
      colorGrid.querySelectorAll('button').forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = '#fff';
      renderPreview();
    });
    colorGrid.appendChild(btn);
  });
  // Select first
  colorGrid.children[0].style.borderColor = '#fff';

  // ---- Build accessory grid ----
  ACCESSORIES.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.cssText = 'padding:8px 14px;font-size:13px;';
    btn.textContent = ACC_LABELS[a];
    btn.dataset.acc = a;
    btn.addEventListener('click', () => {
      draft.accessory = a;
      accGrid.querySelectorAll('button').forEach(b => b.classList.remove('btn-primary'));
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');
      renderPreview();
    });
    accGrid.appendChild(btn);
  });
  accGrid.children[0].classList.remove('btn-secondary');
  accGrid.children[0].classList.add('btn-primary');

  // ---- Preview ----
  function renderPreview() {
    previewCtx.clearRect(0, 0, 200, 200);
    previewCtx.fillStyle = 'rgba(10,30,61,.6)';
    previewCtx.fillRect(0, 0, 200, 200);
    drawPlayer(previewCtx, {
      x: 100, y: 110,
      color:     draft.color,
      accessory: draft.accessory,
      nickname:  draft.nickname || '...',
      direction: 0,
    }, { isLocal: true });
    previewName.textContent = draft.nickname || '—';
  }
  renderPreview();

  nickInput.addEventListener('input', () => {
    draft.nickname = nickInput.value.trim();
    nickError.textContent = '';
    renderPreview();
  });

  // ---- Confirm ----
  btnConfirm.addEventListener('click', () => {
    const nick = nickInput.value.trim();
    if (!nick) { nickError.textContent = 'Insira um nickname.'; return; }
    if (nick.length < 2) { nickError.textContent = 'Mínimo 2 caracteres.'; return; }

    // Player é criado localmente — persiste no localStorage via main.js
    // Se limpar o cache, perde o personagem e cria um novo. Simples assim.
    const playerData = {
      id:        uuidv4(),
      nickname:  nick,
      color:     draft.color,
      accessory: draft.accessory,
      createdAt: new Date().toISOString(),
    };

    onComplete(playerData);
  });

  return el;
}
