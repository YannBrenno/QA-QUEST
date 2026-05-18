// src/screens/WorldScreen.js

import { WorldEngine }   from '../game/WorldEngine.js';
import { presence }      from '../multiplayer/presence.js';
import { showModal }     from '../components/Modal.js';

export function WorldScreen({ player, area, progress, onEnterChallenge, onGoToMap, onOpenBonus }) {
  const el = document.createElement('div');
  el.id = 'screen-world';
  el.style.cssText = 'width:100%;height:100%;position:relative;overflow:hidden;';

  let engine = null;

  async function boot() {
    // Garante que o player está registrado no Supabase antes de entrar na área
    try {
      // Ensure previous subscriptions are cleared to avoid cross-area updates
      try { presence.leaveArea(); } catch {}

      const current = presence.getPlayer();
      if (!current || current.id !== player.id) {
        await presence.register({ ...player, currentArea: area });
      } else {
        await presence.changeArea(area);
      }
    } catch (e) {
      console.warn('[WorldScreen] presence register/changeArea falhou:', e);
    }

    engine = new WorldEngine(el, {
      player,
      area,
      progress,
      onEnterChallenge(node) {
        const isDone = (progress.completed ?? []).includes(node.id);
        if (isDone) return;

        // Show challenge info modal
        const stars = '⭐'.repeat(node.difficulty);
        showModal({
          title: `${node.icon} ${node.label}`,
          body: `<p>Encontre 5 bugs nesta página e avance para o próximo desafio.</p><br><p style="color:var(--color-gold)">${stars}</p>`,
          buttons: [
            {
              label: '▶ Entrar',
              className: 'btn btn-primary',
              action: () => {
                engine.stop();
                onEnterChallenge(node);
              },
            },
            { label: 'Fechar', className: 'btn btn-secondary', action: () => {} },
          ],
        });
      },
      onOpenBonus: () => {
        // open bonus externally
        if (onOpenBonus) onOpenBonus();
      },
      // onGoToMap: garante que o engine pare antes de mudar de tela
      onGoToMap: () => {
        engine?.stop();
        if (onGoToMap) onGoToMap();
      },
    });

    engine.start();
  }

  boot();

  el._destroy = () => {
    engine?.stop();
    try { presence.leaveArea(); } catch {}
  };

  return el;
}
