// src/screens/EndingScreen.js
// "Em breve" ending area — multiplayer

import { WorldScreen } from './WorldScreen.js';
import { BonusChallengeScreen } from './BonusChallengeScreen.js';
import { presence }    from '../multiplayer/presence.js';
import { supabase }    from '../services/supabase.js';
import { showModal }   from '../components/Modal.js';

export function EndingScreen({ player, progress, onGoToMap }) {
  presence.changeArea('ending');

  const el = document.createElement('div');
  el.id = 'screen-ending';
  el.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden';

  let worldEl = null;

  function showWorld() {
    el.innerHTML = '';
    worldEl = WorldScreen({
      player,
      area: 'ending',
      progress,
      onEnterChallenge: () => {},
      onOpenBonus: () => showBonus(),
      onOpenScoreboard: () => showScoreboard(),
    });

    // Overlay banner (non-blocking, just visual)
    const banner = document.createElement('div');
    banner.style.cssText = `
      position:absolute;
      top:20%;left:50%;
      transform:translate(-50%,-50%);
      text-align:center;
      pointer-events:none;
      z-index:100;
    `;
    banner.innerHTML = `
      <div style="font-size:48px;animation:float 3s ease-in-out infinite;margin-bottom:12px">🏆</div>
      <h2 style="font-family:var(--font-game);font-size:clamp(18px,3vw,28px);color:#ffd166;letter-spacing:2px;margin-bottom:10px">Você é um QA Master!</h2>
      <p style="color:rgba(123,158,201,.7);font-size:14px;max-width:400px">Novas aventuras chegarão futuramente.<br>Encontre o portal 💠 no canto para o desafio extra!</p>
    `;

    el.appendChild(worldEl);
    el.appendChild(banner);

    // Back to map button
    const backBtn = document.createElement('button');
    backBtn.className = 'btn btn-secondary';
    backBtn.textContent = '← Voltar ao Mapa';
    backBtn.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:200;';
    backBtn.onclick = () => {
      worldEl?._destroy?.();
      if (onGoToMap) onGoToMap();
    };
    el.appendChild(backBtn);
  }

  function showBonus() {
    worldEl?._destroy?.();
    el.innerHTML = '';
    const bonusEl = BonusChallengeScreen({
      player,
      onExit: () => showWorld(),
    });
    el.appendChild(bonusEl);
  }

  async function showScoreboard() {
    let rows = [];
    try {
      const { data } = await supabase.from('bonus_scoreboard').select('nickname, time_ms').order('time_ms', { ascending: true }).limit(10);
      if (data) rows = data;
    } catch (e) { console.warn('[Scoreboard] fetch failed', e); }

    const list = rows.length
      ? rows.map((r, i) => `<tr><td style="padding:4px 12px;color:#ffd166;">${i+1}º</td><td style="padding:4px 12px;">${r.nickname}</td><td style="padding:4px 12px;color:#8be9fd;">${(r.time_ms/1000).toFixed(1)}s</td></tr>`).join('')
      : '<tr><td colspan="3" style="padding:12px;color:rgba(255,255,255,.4);">Nenhum registro ainda</td></tr>';

    showModal({
      title: '🏅 Placar — Desafio Extra',
      body: `<table style="width:100%;font-size:14px;border-collapse:collapse;text-align:left;"><thead><tr><th style="padding:4px 12px;color:rgba(255,255,255,.5);">#</th><th style="padding:4px 12px;color:rgba(255,255,255,.5);">Jogador</th><th style="padding:4px 12px;color:rgba(255,255,255,.5);">Tempo</th></tr></thead><tbody>${list}</tbody></table>`,
      buttons: [{ label: 'Fechar', className: 'btn btn-secondary', action: () => {} }],
    });
  }

  showWorld();

  el._destroy = () => worldEl?._destroy?.();
  return el;
}
