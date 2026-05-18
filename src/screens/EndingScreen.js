// src/screens/EndingScreen.js
// "Em breve" ending area — multiplayer

import { WorldScreen } from './WorldScreen.js';
import { presence }    from '../multiplayer/presence.js';

export function EndingScreen({ player, progress }) {
  presence.changeArea('ending');

  const el = document.createElement('div');
  el.id = 'screen-ending';
  el.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden';

  // World canvas
  const worldEl = WorldScreen({
    player,
    area: 'ending',
    progress,
    onEnterChallenge: () => {},
  });

  // Overlay text
  const banner = document.createElement('div');
  banner.style.cssText = `
    position:absolute;
    top:50%;left:50%;
    transform:translate(-50%,-50%);
    text-align:center;
    pointer-events:none;
    z-index:1000; /* ensure banner overlays the world canvas and HUD */
  `;
  banner.innerHTML = `
    <div style="font-size:48px;animation:float 3s ease-in-out infinite;margin-bottom:12px">🏆</div>
    <h2 style="font-family:var(--font-game);font-size:clamp(18px,3vw,28px);color:#ffd166;letter-spacing:2px;margin-bottom:10px">Você é um QA Master!</h2>
    <p style="color:rgba(123,158,201,.7);font-size:15px;max-width:400px">Novas aventuras chegarão futuramente.<br>Continue explorando o mundo com outros testadores.</p>
  `;

  el.appendChild(worldEl);
  el.appendChild(banner);

  el._destroy = () => worldEl._destroy?.();
  return el;
}
