// src/components/Modal.js
// Generic modal builder

/**
 * Creates and shows a modal.
 * Returns a close() function.
 * @param {{ title: string, body: string|HTMLElement, buttons: {label:string,class:string,action:()=>void}[] }} opts
 */
export function showModal({ title, body, buttons = [] }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  const box = document.createElement('div');
  box.className = 'card modal-box';
  box.style.maxWidth = '480px';
  box.style.width = '90%';
  box.style.textAlign = 'center';

  if (title) {
    const h = document.createElement('h3');
    h.style.cssText = "font-family:var(--font-game);color:var(--color-accent);font-size:22px;margin-bottom:16px";
    h.textContent = title;
    box.appendChild(h);
  }

  if (typeof body === 'string') {
    const p = document.createElement('p');
    p.style.cssText = 'color:var(--color-muted);line-height:1.6;margin-bottom:20px';
    p.innerHTML = body;
    box.appendChild(p);
  } else if (body instanceof HTMLElement) {
    box.appendChild(body);
  }

  if (buttons.length) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:center;margin-top:8px';
    buttons.forEach(({ label, className = 'btn btn-primary', action }) => {
      const btn = document.createElement('button');
      btn.className = className;
      btn.textContent = label;
      btn.addEventListener('click', () => { action?.(); close(); });
      row.appendChild(btn);
    });
    box.appendChild(row);
  }

  backdrop.appendChild(box);
  document.body.appendChild(backdrop);

  function close() { backdrop.remove(); }
  return close;
}
