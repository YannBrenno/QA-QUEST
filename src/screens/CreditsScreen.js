// src/screens/CreditsScreen.js

export function CreditsScreen({ onBack }) {
  const el = document.createElement('div');
  el.id = 'screen-credits';
  el.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:32px;overflow-y:auto';

  el.innerHTML = `
    <div class="card" style="max-width:560px;width:100%;text-align:center;animation:fadeSlideUp .6s ease">
      <div style="font-size:48px;margin-bottom:12px">🐛</div>
      <h2 style="font-family:var(--font-game);color:var(--color-accent);font-size:22px;margin-bottom:24px">QA Quest</h2>
      <p style="color:var(--color-muted);line-height:1.8;margin-bottom:24px">
        Um jogo educativo sobre Quality Assurance.<br>
        Aprenda a identificar bugs reais enquanto se diverte.<br><br>
        <strong style="color:var(--color-text)">Conceito & Design</strong><br>
        <span style="color:var(--color-muted)">Feito com ❤️ por QA lovers</span><br><br>
        <strong style="color:var(--color-text)">Tecnologias</strong><br>
        <span style="color:var(--color-muted)">HTML · CSS · JavaScript · Vite · Supabase</span><br><br>
        <strong style="color:var(--color-text)">Multiplicador</strong><br>
        <span style="color:var(--color-muted)">Supabase Realtime</span>
      </p>
      <button id="back-btn" class="btn btn-secondary">← Voltar</button>
    </div>
  `;

  el.querySelector('#back-btn').addEventListener('click', onBack);
  return el;
}
