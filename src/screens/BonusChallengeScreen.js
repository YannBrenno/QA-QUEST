// src/screens/BonusChallengeScreen.js
// Extra challenge screen: simple input, timer, and leaderboard broadcast

import { showModal } from '../components/Modal.js';
import { presence } from '../multiplayer/presence.js';
import { supabase } from '../services/supabase.js';
import { storage } from '../services/storage.js';

const ANSWER = '1060998813locuraem';
const PAGE_PATH = '/UGFyYWLDqW5zIHBvciB0ZXIgY2hlZ2FkbyBhdMOpIGFxdWksIHZvY8OqIHJlYWxtZW50ZSDDqSB1bSBRQSBxdWUgcGVuc2EgZm9yYSBkYSBjYWl4YS4KT3F1ZSB2b2PDqiBwcm9jdXJhIMOpOiAxMDYwOTk4ODEzbG9jdXJhZW0='; // base64 path

export function BonusChallengeScreen({ player, onExit }) {
  const el = document.createElement('div');
  el.style.cssText = 'width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;';

  const box = document.createElement('div');
  box.className = 'card';
  box.style.cssText += 'width:520px;max-width:92%;text-align:center;';

  const title = document.createElement('h2');
  title.textContent = 'Desafio Extra - QA Master';
  title.style.fontFamily = 'var(--font-game)';
  title.style.marginBottom = '8px';
  box.appendChild(title);

  const p = document.createElement('p');
  p.textContent = 'Você é exímio QA, parabéns por chegar até aqui. Insira a resposta correta no campo abaixo.';
  p.style.color = 'var(--color-muted)';
  box.appendChild(p);

  const input = document.createElement('input');
  input.className = 'input';
  input.placeholder = 'Resposta...';
  input.style.margin = '12px 0 8px';
  box.appendChild(input);

  const info = document.createElement('div');
  info.style.fontSize = '13px';
  info.style.color = 'var(--color-muted)';
  info.style.marginBottom = '8px';
  box.appendChild(info);

  const btnRow = document.createElement('div');
  btnRow.style.display = 'flex';
  btnRow.style.gap = '8px';
  btnRow.style.justifyContent = 'center';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = 'Enviar';

  const exitBtn = document.createElement('button');
  exitBtn.className = 'btn btn-secondary';
  exitBtn.textContent = 'Sair';
  exitBtn.onclick = () => {
    onExit();
  };

  btnRow.appendChild(submitBtn);
  btnRow.appendChild(exitBtn);
  box.appendChild(btnRow);

  el.appendChild(box);

  let startTime = Date.now();
  info.textContent = 'Iniciado em: ' + new Date(startTime).toLocaleTimeString();

  async function submit() {
    const val = input.value.trim();
    if (!val) return;
    if (val === ANSWER) {
      const timeTaken = Date.now() - startTime;
      // Persist to supabase scoreboard table
      try {
        await supabase.from('bonus_scoreboard').insert({
          player_id: player.id,
          nickname: player.nickname,
          time_ms: timeTaken,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[Bonus] submit failed:', e);
      }

      // Broadcast via presence: we will rely on presence poll/realtime to fetch leaderboard elsewhere
      showModal({ title: 'Parabéns!', body: `<p>Resposta correta! Tempo: ${Math.round(timeTaken/1000)}s</p>`, buttons: [{ label: 'Fechar', className: 'btn btn-primary', action: () => {} }] });
      onExit();
    } else {
      showModal({ title: 'Errado', body: '<p>Resposta incorreta. Tente novamente.</p>', buttons: [{ label: 'Fechar', className: 'btn btn-secondary', action: () => {} }] });
    }
  }

  submitBtn.onclick = submit;
  input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });

  el._destroy = () => {};
  return el;
}
