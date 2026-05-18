// src/screens/ChallengeScreen.js
// Renders a challenge in-game (simulated web page with bugs)

import { storage }   from '../services/storage.js';
import { showToast } from '../components/Toast.js';

// ------ Challenge definitions ------
const CHALLENGES = {
  1: {
    title: '🔐 Desafio 1: Login Bugado',
    color: '#00e5ff',
    render: buildChallenge1,
  },
  2: {
    title: '🛒 Desafio 2: Loja Virtual',
    color: '#76ff03',
    render: buildChallenge2,
  },
  3: {
    title: '📊 Desafio 3: Dashboard',
    color: '#ffd166',
    render: buildChallenge3,
  },
  4: {
    title: '📝 Desafio 4: Formulário',
    color: '#c77dff',
    render: buildChallenge4,
  },
  5: {
    title: '🏆 Desafio Final',
    color: '#ff9a3c',
    render: buildChallenge5,
  },
};

export function ChallengeScreen({ challengeId, player, onComplete, onExit }) {
  const def = CHALLENGES[challengeId];
  if (!def) { onExit?.(); return document.createTextNode(''); }

  let found = 0;
  const TOTAL = 5;

  const el = document.createElement('div');
  el.id = 'screen-challenge';
  el.style.cssText = 'width:100%;height:100%;display:flex;flex-direction:column;background:#060e1f;overflow:hidden';

  // HUD
  const hud = document.createElement('div');
  hud.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:14px 24px;background:rgba(0,0,0,.5);border-bottom:1px solid ${def.color}22;flex-shrink:0;`;
  hud.innerHTML = `
    <span style="font-family:var(--font-game);font-size:14px;color:${def.color}">${def.title}</span>
    <span id="bug-counter" style="font-family:var(--font-game);font-size:14px;color:var(--color-accent2)">🐛 0/${TOTAL}</span>
    <button id="exit-btn" class="btn btn-secondary" style="padding:8px 16px;font-size:12px">✕ Sair</button>
  `;
  el.appendChild(hud);

  // Instruction
  const instr = document.createElement('div');
  instr.style.cssText = `text-align:center;padding:10px;background:${def.color}10;border-bottom:1px solid ${def.color}18;font-size:14px;color:${def.color};flex-shrink:0`;
  instr.textContent = '🔍 Clique nos elementos com bugs para identificá-los. Encontre todos os 5!';
  el.appendChild(instr);

  // Sim area
  const simArea = document.createElement('div');
  simArea.style.cssText = 'flex:1;overflow:auto;padding:32px;';
  el.appendChild(simArea);

  // Render challenge content
  const simPage = def.render();
  simArea.appendChild(simPage);

  // Wire up bug clicks
  const counter = hud.querySelector('#bug-counter');
  simPage.querySelectorAll('[data-bug]').forEach(bugEl => {
    // Make clickable even if disabled
    bugEl.removeAttribute('disabled');
    bugEl.style.cursor = 'pointer';

    bugEl.addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      if (bugEl.classList.contains('found')) return;
      bugEl.classList.add('found');
      bugEl.style.outline    = '3px solid #76ff03';
      bugEl.style.outlineOffset = '3px';
      found++;
      counter.textContent = `🐛 ${found}/${TOTAL}`;
      showToast(`✓ Bug #${found}: ${bugEl.dataset.hint}`, 'success', 4000);
      if (found >= TOTAL) {
        setTimeout(() => _showWin(), 600);
      }
    });

    // Prevent links from navigating
    if (bugEl.tagName === 'A') bugEl.addEventListener('click', e => e.preventDefault());
  });

  // Exit
  hud.querySelector('#exit-btn').addEventListener('click', onExit);

  // Win
  function _showWin() {
    storage.markChallengeComplete(challengeId);

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:absolute;inset:0;background:rgba(2,6,18,.85);display:flex;align-items:center;justify-content:center;z-index:200;animation:fadeIn .3s';
    overlay.innerHTML = `
      <div class="card modal-box" style="max-width:480px;width:90%;text-align:center">
        <div style="font-size:64px;margin-bottom:12px;animation:float 2s ease-in-out infinite">${challengeId === 5 ? '🏆' : '🎉'}</div>
        <h2 style="font-family:var(--font-game);color:var(--color-accent2);font-size:28px;margin-bottom:12px">
          ${challengeId === 5 ? 'QA Master!' : 'Fase Completa!'}
        </h2>
        <p style="color:var(--color-muted);line-height:1.6;margin-bottom:24px">
          ${challengeId === 5
            ? 'Parabéns! Você completou todos os desafios do QA Quest!<br>Você é um verdadeiro testador!'
            : 'Você encontrou todos os bugs.<br>Próximo desafio desbloqueado!'}
        </p>
        <button id="win-continue" class="btn btn-${challengeId === 5 ? 'gold' : 'primary'}" style="font-size:16px">
          ${challengeId === 5 ? '🌟 Ver Área Final' : '→ Continuar'}
        </button>
      </div>
    `;
    el.style.position = 'relative';
    el.appendChild(overlay);
    overlay.querySelector('#win-continue').addEventListener('click', () => onComplete(challengeId));
  }

  return el;
}

// ===================== CHALLENGE BUILDERS =====================

function bugEl(tag, attrs, hint, content = '') {
  const el = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v);
  });
  el.dataset.bug  = '1';
  el.dataset.hint = hint;
  el.innerHTML = content;
  return el;
}

function simPage(content) {
  const p = document.createElement('div');
  p.style.cssText = 'background:#fff;color:#222;border-radius:12px;padding:32px;max-width:900px;margin:0 auto;box-shadow:0 20px 80px rgba(0,0,0,.5)';
  p.innerHTML = `
    <style>
      .bug-el{cursor:pointer;transition:outline .2s}
      .bug-el:hover{outline:2px dashed rgba(255,0,0,.35)!important;outline-offset:2px}
      .bug-el.found{outline:3px solid #76ff03!important}
    </style>
  `;
  p.insertAdjacentHTML('beforeend', content);
  return p;
}

// ---- Challenge 1: Login ----
function buildChallenge1() {
  return simPage(`
    <h2 class="bug-el" data-bug="1" data-hint="Título com erro de digitação: 'Faça seu Lgin'"
        style="text-align:center;margin-bottom:24px;font-size:22px;color:#1a1a2e">Faça seu Lgin</h2>

    <div style="margin-bottom:14px">
      <label style="display:block;font-size:13px;color:#555;margin-bottom:5px">Email:</label>
      <input class="bug-el" data-bug="2" data-hint="Campo de email usa type='text' ao invés de type='email'"
        type="text" placeholder="seu@email.com"
        style="width:100%;padding:10px;border:2px solid #ddd;border-radius:7px;font-size:15px">
    </div>

    <div style="margin-bottom:14px">
      <label style="display:block;font-size:13px;color:#555;margin-bottom:5px">Senha:</label>
      <input class="bug-el" data-bug="3" data-hint="Campo de senha usa type='text' — a senha fica visível em tela!"
        type="text" value="minhasenha123" placeholder="sua senha"
        style="width:100%;padding:10px;border:2px solid #ddd;border-radius:7px;font-size:15px">
    </div>

    <button class="bug-el" data-bug="4" data-hint="Botão de login está desabilitado sem motivo aparente"
      style="width:100%;padding:13px;background:rgba(74,144,217,.5);color:#fff;border:none;border-radius:7px;font-size:15px;opacity:.5">
      Entrar
    </button>

    <p style="text-align:center;margin-top:14px;font-size:13px;color:#999">
      <a class="bug-el" data-bug="5" data-hint="Link 'Esqueci minha senha' não leva a lugar nenhum (href='#')"
        href="#" style="color:#4a90d9;text-decoration:none">Esqueci minha senha</a>
    </p>
  `);
}

// ---- Challenge 2: Shop ----
function buildChallenge2() {
  return simPage(`
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #eee;padding-bottom:14px;margin-bottom:20px">
      <h2 style="font-size:22px;color:#1a1a2e">MegaShop</h2>
      <span class="bug-el" data-bug="1" data-hint="Carrinho mostra '-3 itens' — quantidade negativa é impossível!"
        style="background:#e74c3c;color:#fff;padding:6px 14px;border-radius:20px;font-size:13px">
        🛒 -3 itens
      </span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
      <div style="border:1px solid #eee;border-radius:10px;padding:14px;text-align:center">
        <div style="width:100%;height:100px;background:#f0f0f0;border-radius:8px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;font-size:36px">📱</div>
        <h3 style="font-size:15px;margin-bottom:6px">Smartphone XZ</h3>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">R$ 1.999,00</div>
        <button style="background:#27ae60;color:#fff;border:none;padding:8px 16px;border-radius:7px;cursor:pointer">Comprar</button>
      </div>
      <div style="border:1px solid #eee;border-radius:10px;padding:14px;text-align:center">
        <div style="width:100%;height:100px;background:#f0f0f0;border-radius:8px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;font-size:36px">💻</div>
        <h3 style="font-size:15px;margin-bottom:6px">Notebook Pro</h3>
        <div class="bug-el" data-bug="2" data-hint="Preço negativo: R$ -500,00 é impossível!"
          style="font-size:16px;font-weight:700;margin-bottom:8px;color:#e74c3c">R$ -500,00</div>
        <button style="background:#27ae60;color:#fff;border:none;padding:8px 16px;border-radius:7px;cursor:pointer">Comprar</button>
      </div>
      <div style="border:1px solid #eee;border-radius:10px;padding:14px;text-align:center">
        <div style="width:100%;height:100px;background:#f0f0f0;border-radius:8px;margin-bottom:10px;display:flex;align-items:center;justify-content:center;font-size:36px">🎧</div>
        <h3 class="bug-el" data-bug="3" data-hint="Nome do produto é placeholder 'Lorem Ipsum Dolor'"
          style="font-size:15px;margin-bottom:6px">Lorem Ipsum Dolor</h3>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">R$ 299,00</div>
        <button class="bug-el" data-bug="4" data-hint="Botão diz 'Excluir conta' ao invés de 'Comprar'"
          style="background:#e74c3c;color:#fff;border:none;padding:8px 16px;border-radius:7px;cursor:pointer">Excluir conta</button>
      </div>
      <div style="border:1px solid #eee;border-radius:10px;padding:14px;text-align:center">
        <img class="bug-el" data-bug="5" data-hint="Imagem do produto está quebrada e sem texto alternativo (alt vazio)"
          src="broken.jpg" alt=""
          style="width:100%;height:100px;object-fit:cover;background:#f0f0f0;border-radius:8px;margin-bottom:10px;display:block">
        <h3 style="font-size:15px;margin-bottom:6px">Teclado Gamer</h3>
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">R$ 450,00</div>
        <button style="background:#27ae60;color:#fff;border:none;padding:8px 16px;border-radius:7px;cursor:pointer">Comprar</button>
      </div>
    </div>
  `);
}

// ---- Challenge 3: Dashboard ----
function buildChallenge3() {
  return simPage(`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
      <h2 style="font-size:20px;color:#1a1a2e">Painel de Vendas</h2>
      <span class="bug-el" data-bug="1" data-hint="Data impossível: '32 de Março de 2025' não existe!"
        style="font-size:13px;color:#666">Atualizado: 32 de Março de 2025</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
      <div style="background:#fff;border-radius:10px;padding:16px;text-align:center;border:1px solid #eee">
        <div style="font-size:26px;font-weight:700">1.284</div><div style="font-size:11px;color:#888;margin-top:3px">Vendas</div>
      </div>
      <div style="background:#fff;border-radius:10px;padding:16px;text-align:center;border:1px solid #eee">
        <div class="bug-el" data-bug="2" data-hint="Receita negativa: R$ -45.000 é impossível!"
          style="font-size:26px;font-weight:700;color:#e74c3c">R$ -45.000</div>
        <div style="font-size:11px;color:#888;margin-top:3px">Receita</div>
      </div>
      <div style="background:#fff;border-radius:10px;padding:16px;text-align:center;border:1px solid #eee">
        <div style="font-size:26px;font-weight:700">342</div><div style="font-size:11px;color:#888;margin-top:3px">Clientes</div>
      </div>
      <div style="background:#fff;border-radius:10px;padding:16px;text-align:center;border:1px solid #eee">
        <div class="bug-el" data-bug="3" data-hint="Taxa de conversão de 250% é impossível — max é 100%!"
          style="font-size:26px;font-weight:700;color:#e74c3c">250%</div>
        <div style="font-size:11px;color:#888;margin-top:3px">Conversão</div>
      </div>
    </div>
    <div style="background:#fff;border-radius:10px;padding:20px;border:1px solid #eee;margin-bottom:16px">
      <h3 style="font-size:15px;color:#333;margin-bottom:14px">Vendas por Mês</h3>
      <div style="display:flex;align-items:flex-end;gap:10px;height:100px">
        <div style="text-align:center"><div style="height:60px;width:38px;background:#4a90d9;border-radius:4px 4px 0 0"></div><div style="font-size:10px;color:#888;margin-top:3px">Jan</div></div>
        <div style="text-align:center"><div style="height:80px;width:38px;background:#4a90d9;border-radius:4px 4px 0 0"></div><div style="font-size:10px;color:#888;margin-top:3px">Fev</div></div>
        <div style="text-align:center"><div style="height:40px;width:38px;background:#4a90d9;border-radius:4px 4px 0 0"></div><div style="font-size:10px;color:#888;margin-top:3px">Mar</div></div>
        <div class="bug-el" data-bug="4" data-hint="Abril mostra 'R$89k' mas a barra tem altura zero!" style="text-align:center">
          <div style="height:0px;width:38px;background:#4a90d9;border-radius:4px 4px 0 0;border:1px dashed #e74c3c"></div>
          <div style="font-size:10px;color:#e74c3c;margin-top:3px">Abr (R$89k)</div>
        </div>
        <div style="text-align:center"><div style="height:100px;width:38px;background:#4a90d9;border-radius:4px 4px 0 0"></div><div style="font-size:10px;color:#888;margin-top:3px">Mai</div></div>
      </div>
    </div>
    <div style="background:#fff;border-radius:10px;padding:16px;border:1px solid #eee">
      <table style="width:100%;border-collapse:collapse">
        <tr><th style="padding:8px;text-align:left;font-size:11px;color:#888;border-bottom:1px solid #eee">Produto</th><th style="padding:8px;font-size:11px;color:#888;border-bottom:1px solid #eee">Vendas</th><th style="padding:8px;font-size:11px;color:#888;border-bottom:1px solid #eee">Status</th></tr>
        <tr><td style="padding:8px;font-size:13px">Produto A</td><td style="padding:8px;font-size:13px">523</td><td style="padding:8px;font-size:13px;color:#27ae60">✓ Ativo</td></tr>
        <tr><td style="padding:8px;font-size:13px">Produto B</td><td style="padding:8px;font-size:13px">198</td><td style="padding:8px;font-size:13px;color:#27ae60">✓ Ativo</td></tr>
        <tr class="bug-el" data-bug="5" data-hint="Vendas do Produto C mostra 'NaN' — erro de cálculo não tratado!">
          <td style="padding:8px;font-size:13px">Produto C</td><td style="padding:8px;font-size:13px;color:#e74c3c">NaN</td><td style="padding:8px;font-size:13px;color:#e74c3c">✗ Erro</td>
        </tr>
      </table>
    </div>
  `);
}

// ---- Challenge 4: Form ----
function buildChallenge4() {
  return simPage(`
    <h2 style="text-align:center;margin-bottom:22px;color:#1a1a2e">Criar Conta</h2>
    <div style="margin-bottom:14px">
      <label style="display:block;font-size:13px;color:#555;margin-bottom:5px">Nome completo:</label>
      <input class="bug-el" data-bug="1" data-hint="Label diz 'Nome' mas placeholder pede 'Digite seu CPF' — campos trocados!"
        type="text" placeholder="Digite seu CPF"
        style="width:100%;padding:10px;border:2px solid #ddd;border-radius:7px;font-size:15px">
    </div>
    <div style="margin-bottom:14px">
      <label style="display:block;font-size:13px;color:#555;margin-bottom:5px">Data de nascimento:</label>
      <input class="bug-el" data-bug="2" data-hint="Campo de data usa type='text' e valor pré-preenchido como 'ontem' — deveria ser type='date'"
        type="text" value="ontem"
        style="width:100%;padding:10px;border:2px solid #ddd;border-radius:7px;font-size:15px">
    </div>
    <div style="margin-bottom:14px">
      <label style="display:block;font-size:13px;color:#555;margin-bottom:5px">Estado:</label>
      <select class="bug-el" data-bug="3" data-hint="Select não tem opção padrão ('Selecione...') e 'São Paulo' aparece duplicado!"
        style="width:100%;padding:10px;border:2px solid #ddd;border-radius:7px;font-size:15px">
        <option>São Paulo</option>
        <option>São Paulo</option>
        <option>Rio de Janeiro</option>
      </select>
    </div>
    <div style="margin-bottom:14px">
      <label style="display:block;font-size:13px;color:#555;margin-bottom:5px">Sobre você:</label>
      <textarea class="bug-el" data-bug="4" data-hint="Textarea tem maxlength=5 — impossível escrever algo útil em apenas 5 caracteres!"
        maxlength="5" placeholder="Conte sobre você (máx 5 caracteres)"
        style="width:100%;padding:10px;border:2px solid #ddd;border-radius:7px;font-size:15px;height:70px;resize:vertical"></textarea>
    </div>
    <div class="bug-el" data-bug="5" data-hint="Checkbox 'Li os termos' vem marcada E desabilitada — usuário não pode desmarcar!"
      style="display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:13px;color:#555">
      <input type="checkbox" checked disabled> <span>Li e aceito os termos de uso</span>
    </div>
    <button style="width:100%;padding:12px;background:#8e44ad;color:#fff;border:none;border-radius:7px;font-size:15px;cursor:pointer">Cadastrar</button>
  `);
}

// ---- Challenge 5: Blog ----
function buildChallenge5() {
  return simPage(`
    <nav style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#1a1a2e;color:#fff;margin:-32px -32px 0;border-radius:12px 12px 0 0">
      <span style="font-size:18px;font-weight:700">TechBlog</span>
      <div style="display:flex;gap:20px">
        <a href="#" style="color:#aab;text-decoration:none;font-size:13px">Home</a>
        <a href="#" style="color:#aab;text-decoration:none;font-size:13px">Artigos</a>
        <a class="bug-el" data-bug="1" data-hint="Link 'Contato' usa href='mailto:' sem endereço de e-mail definido!"
          href="mailto:" style="color:#aab;text-decoration:none;font-size:13px">Contato</a>
      </div>
    </nav>
    <div style="padding:40px 20px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;text-align:center;margin:-0px -32px 20px">
      <h1 style="font-size:28px;margin-bottom:8px">Bem-vindo ao TechBlog</h1>
      <p class="bug-el" data-bug="2" data-hint="Subtítulo em inglês numa página em português — deveria estar traduzido!"
        style="font-size:15px;opacity:.85">The best tech articles for developers</p>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
      <div>
        <div style="background:#f8f9fc;border-radius:10px;padding:18px;border:1px solid #eee;margin-bottom:16px">
          <h3 style="font-size:16px;color:#333;margin-bottom:8px">Como usar React em 2025</h3>
          <p style="font-size:13px;color:#666;line-height:1.5">React continua sendo uma das bibliotecas mais populares...</p>
          <div class="bug-el" data-bug="3" data-hint="Data de publicação '45 de Janeiro de 2030' é impossível — não existe dia 45!"
            style="font-size:11px;color:#999;margin-top:8px">Publicado em 45 de Janeiro de 2030 • 5 min</div>
        </div>
        <div style="background:#f8f9fc;border-radius:10px;padding:18px;border:1px solid #eee">
          <h3 style="font-size:16px;color:#333;margin-bottom:8px">Guia de TypeScript</h3>
          <p style="font-size:13px;color:#666;line-height:1.5">TypeScript adiciona tipagem estática ao JavaScript...</p>
          <div style="font-size:11px;color:#999;margin-top:8px">Publicado em 10/10/2024 • 8 min</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="background:#f8f9fc;border-radius:10px;padding:14px;border:1px solid #eee">
          <h4 style="font-size:13px;color:#333;margin-bottom:8px">Categorias</h4>
          <ul style="list-style:none;display:flex;flex-direction:column;gap:5px">
            <li style="font-size:12px;color:#666">JavaScript (23)</li>
            <li style="font-size:12px;color:#666">Python (15)</li>
            <li class="bug-el" data-bug="4" data-hint="Categoria 'CSS' com contagem negativa: (-7) artigos é impossível!"
              style="font-size:12px;color:#e74c3c">CSS (-7)</li>
            <li style="font-size:12px;color:#666">DevOps (11)</li>
          </ul>
        </div>
        <div style="background:#f8f9fc;border-radius:10px;padding:14px;border:1px solid #eee">
          <h4 style="font-size:13px;color:#333;margin-bottom:8px">Newsletter</h4>
          <p style="font-size:12px;color:#666;margin-bottom:6px">Receba novidades:</p>
          <input class="bug-el" data-bug="5" data-hint="Campo de e-mail usa type='number' — não aceita endereços de email!"
            type="number" placeholder="seu@email.com"
            style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:13px">
        </div>
      </div>
    </div>
    <div style="margin:20px -32px -32px;padding:14px 20px;background:#1a1a2e;color:#888;text-align:center;font-size:12px;border-radius:0 0 12px 12px">
      © 2025 TechBlog. Todos os direitos reservados.
    </div>
  `);
}
