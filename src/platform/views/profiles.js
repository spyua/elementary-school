// 孩子檔案畫面：切換、新增、刪除，以及匯出與匯入進度。
import { addProfile, removeProfile, switchProfile, exportState, importState, ImportError } from '../storage.js';
import { h } from './dom.js';

export const PROFILE_ICONS = ['🐣', '🐶', '🐱', '🐰', '🦊', '🐼', '🐸', '🦁'];
const BAD_FILE = '這不是進度檔，原本的進度沒有改變。';

// setState 會讓整個畫面重畫；要在重畫後顯示的訊息先放在這裡。
let flash = '';

function today() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function download(text, filename) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = h('a', { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function render(container, ctx) {
  const { state } = ctx;
  const ids = Object.keys(state.profiles);

  // ---- 刪除確認對話框（原生 <dialog>，不用 confirm()） ----
  let pendingDelete = null;
  const askText = h('p', {});
  const dialog = h('dialog', { id: 'confirmDelete' },
    askText,
    h('div', { className: 'row' },
      h('button', { type: 'button', className: 'smallbtn', onclick: () => { pendingDelete = null; dialog.close(); } }, '取消'),
      h('button', {
        type: 'button', className: 'smallbtn danger',
        onclick: () => {
          const id = pendingDelete;
          pendingDelete = null;
          dialog.close();
          if (id) ctx.setState(removeProfile(ctx.state, id));
        },
      }, '確定刪除')));

  // ---- 檔案清單 ----
  const list = h('div', { className: 'profiles' });
  for (const id of ids) {
    const p = state.profiles[id];
    const active = id === state.activeProfile;
    list.append(h('div', { className: active ? 'profile active' : 'profile' },
      h('span', { className: 'pic' }, p.icon),
      h('span', { className: 'who' }, p.name, active ? h('span', { className: 'tag now' }, '使用中') : null),
      h('button', {
        type: 'button', className: 'smallbtn', disabled: active,
        onclick: () => ctx.setState(switchProfile(ctx.state, id)),
      }, '切換'),
      h('button', {
        type: 'button', className: 'smallbtn', disabled: ids.length <= 1,
        onclick: () => {
          pendingDelete = id;
          askText.textContent = `要刪除「${p.icon} ${p.name}」和他的所有星星嗎？刪除後不能復原。`;
          dialog.showModal();
        },
      }, '刪除')));
  }

  // ---- 新增 ----
  let icon = PROFILE_ICONS[1];
  const nameInput = h('input', { id: 'newName', type: 'text', maxLength: 12, placeholder: '暱稱', autocomplete: 'off' });
  const addMsg = h('span', { className: 'msg', role: 'status' });
  const picker = h('div', { className: 'icon-pick', role: 'group', 'aria-label': '選一個圖示' });
  for (const ic of PROFILE_ICONS) {
    const b = h('button', { type: 'button', 'aria-pressed': String(ic === icon) }, ic);
    b.onclick = () => {
      icon = ic;
      for (const x of picker.children) x.setAttribute('aria-pressed', String(x === b));
    };
    picker.append(b);
  }
  const addBtn = h('button', {
    id: 'addProfile', type: 'button', className: 'smallbtn',
    onclick: () => {
      const name = nameInput.value.trim();
      if (!name) { addMsg.textContent = '請先輸入暱稱。'; nameInput.focus(); return; }
      ctx.setState(addProfile(ctx.state, { name, icon }).state);
    },
  }, '➕ 新增');

  // ---- 匯出匯入 ----
  const importMsg = h('p', { id: 'importMsg', role: 'status' }, flash);
  flash = '';
  const exportBtn = h('button', {
    id: 'exportBtn', type: 'button', className: 'smallbtn',
    onclick: () => download(exportState(ctx.state, new Date().toISOString()), `elementary-school-progress-${today()}.json`),
  }, '📤 匯出進度');
  const fileInput = h('input', { id: 'importFile', type: 'file', accept: '.json,application/json' });
  fileInput.onchange = async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    let next;
    try {
      next = importState(await file.text());
    } catch (e) {
      if (!(e instanceof ImportError)) console.error(e);
      importMsg.textContent = BAD_FILE;
      return;
    }
    flash = '已匯入進度。';
    ctx.setState(next);
  };

  container.replaceChildren(
    h('h2', { className: 'view-title' }, '孩子檔案'),
    list,
    h('div', { className: 'panel' },
      h('h3', {}, '新增孩子'),
      nameInput,
      picker,
      h('div', { className: 'row' }, addBtn, addMsg)),
    h('div', { className: 'panel' },
      h('h3', {}, '換裝置時保留進度'),
      h('p', {}, '進度只存在這台裝置的瀏覽器裡。換裝置前先「匯出進度」，到新裝置再「匯入進度」。'),
      h('div', { className: 'row' }, exportBtn),
      h('label', { className: 'row' }, '📥 匯入進度：', fileInput),
      importMsg),
    dialog,
  );
}
