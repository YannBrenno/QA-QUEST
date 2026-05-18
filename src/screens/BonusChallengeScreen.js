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
  el.style.cssText = 'width:100%;height:100%;position:relative;display:flex;align-items:center;justify-content:center;background:#1a1a2e;';

  // Fake browser window
  const browser = document.createElement('div');
  browser.style.cssText = 'width:720px;max-width:95%;height:480px;max-height:85%;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 8px 40px rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.1);';

  // Title bar
  const titleBar = document.createElement('div');
  titleBar.style.cssText = 'background:#2d2d3f;padding:10px 14px;display:flex;align-items:center;gap:8px;';
  const dots = document.createElement('div');
  dots.style.cssText = 'display:flex;gap:6px;';
  dots.innerHTML = '<span style="width:12px;height:12px;border-radius:50%;background:#ff5f57;display:inline-block;cursor:pointer;" title="Fechar"></span><span style="width:12px;height:12px;border-radius:50%;background:#ffbd2e;display:inline-block;"></span><span style="width:12px;height:12px;border-radius:50%;background:#28c840;display:inline-block;"></span>';
  dots.querySelector('span').onclick = () => onExit();
  const tabLabel = document.createElement('span');
  tabLabel.style.cssText = 'margin-left:12px;font-size:12px;color:rgba(255,255,255,.6);font-family:monospace;';
  tabLabel.textContent = '🔒 QA Quest — Desafio Extra';
  titleBar.appendChild(dots);
  titleBar.appendChild(tabLabel);
  browser.appendChild(titleBar);

  // URL bar
  const urlBar = document.createElement('div');
  urlBar.style.cssText = 'background:#1e1e2e;padding:8px 14px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,.05);';
  const lockIcon = document.createElement('span');
  lockIcon.textContent = '🔒';
  lockIcon.style.fontSize = '12px';
  const urlInput = document.createElement('input');
  urlInput.readOnly = true;
  urlInput.value = 'https://qa-quest.app' + PAGE_PATH;
  urlInput.style.cssText = 'flex:1;background:#12121f;border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:6px 10px;color:#8be9fd;font-family:monospace;font-size:11px;outline:none;';
  urlBar.appendChild(lockIcon);
  urlBar.appendChild(urlInput);
  browser.appendChild(urlBar);

  // Page content
  const page = document.createElement('div');
  page.style.cssText = 'flex:1;background:#0d0d1a;padding:32px 24px;overflow-y:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;';

  const title = document.createElement('h2');
  title.textContent = '💠 Desafio Extra - QA Master';
  title.style.cssText = "font-family:var(--font-game);margin-bottom:8px;color:#ffd166;font-size:20px;";
  page.appendChild(title);

  const p = document.createElement('p');
  p.textContent = 'Você é exímio QA, parabéns por chegar até aqui. Utilize suas habilidades exploratórias para descobrir o valor que precisa ser digitado no input abaixo.';
  p.style.cssText = 'color:rgba(255,255,255,.5);font-size:14px;max-width:400px;margin-bottom:16px;';
  page.appendChild(p);

  const hint = document.createElement('p');
  hint.style.cssText = 'color:rgba(139,233,253,.4);font-size:11px;font-family:monospace;margin-bottom:12px;';
  hint.textContent = 'Boa sorte!';
  page.appendChild(hint);

  // Red herrings - clickable distractions
  const trapsRow = document.createElement('div');
  trapsRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:16px;';
  const traps = [
    { label: '🔍 Inspecionar Elemento', icon: '' },
    { label: '📁 /admin/secret.txt', icon: '' },
    { label: '🗝️ Chave Mestra Base', icon: '' },
    { label: '💾 dump_database(64)', icon: '' },
    { label: '🐛 bug_report.log', icon: '' },
  ];
  traps.forEach(trap => {
    const btn = document.createElement('button');
    btn.textContent = trap.label;
    btn.style.cssText = 'background:rgba(255,255,255,.05);border:1px solid rgba(0,229,255,.2);border-radius:6px;padding:6px 12px;color:rgba(0,229,255,.7);font-size:11px;cursor:pointer;transition:all .2s;';
    btn.onmouseenter = () => { btn.style.background = 'rgba(0,229,255,.1)'; btn.style.borderColor = 'rgba(0,229,255,.5)'; };
    btn.onmouseleave = () => { btn.style.background = 'rgba(255,255,255,.05)'; btn.style.borderColor = 'rgba(0,229,255,.2)'; };
    btn.onclick = () => showModal({ title: '🚫 Nope!', body: '<p>Não é isso que você está procurando...</p>', buttons: [{ label: 'Fechar', className: 'btn btn-secondary', action: () => {} }] });
    trapsRow.appendChild(btn);
  });
  page.appendChild(trapsRow);

  const input = document.createElement('input');
  input.style.cssText = 'width:100%;max-width:320px;background:#12121f;border:1px solid rgba(0,229,255,.3);border-radius:8px;padding:10px 14px;color:#fff;font-size:14px;outline:none;margin-bottom:8px;';
  input.placeholder = 'Resposta...';
  page.appendChild(input);

  const info = document.createElement('div');
  info.style.cssText = 'font-size:12px;color:rgba(255,255,255,.3);margin-bottom:12px;';
  page.appendChild(info);

  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:8px;justify-content:center;';

  const submitBtn = document.createElement('button');
  submitBtn.className = 'btn btn-primary';
  submitBtn.textContent = 'Enviar';

  const exitBtn = document.createElement('button');
  exitBtn.className = 'btn btn-secondary';
  exitBtn.textContent = 'Sair';
  exitBtn.onclick = () => onExit();

  btnRow.appendChild(submitBtn);
  btnRow.appendChild(exitBtn);
  page.appendChild(btnRow);

  browser.appendChild(page);
  el.appendChild(browser);

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
