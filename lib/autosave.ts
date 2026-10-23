// Autosave core: debounce 1.5s, status machine, retry x3
// States are intentionally distinct in copy/color (saved vs saving vs dirty vs failed)
export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'failed';

export function createAutosaver(opts: {
  save: (scene: unknown) => Promise<void>;
  onStatus: (s: SaveStatus, at?: Date) => void;
  delayMs?: number;
}) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: unknown = null;
  let inFlight = false;

  async function flush() {
    if (inFlight || pending == null) return;
    inFlight = true;
    opts.onStatus('saving');
    const scene = pending; pending = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { await opts.save(scene); opts.onStatus('saved', new Date()); inFlight = false; if (pending) schedule(); return; }
      catch { if (attempt === 2) { opts.onStatus('failed'); pending = scene; } else await new Promise(r => setTimeout(r, 800 * (attempt + 1))); }
    }
    inFlight = false;
  }
  function schedule() { opts.onStatus(pending ? 'dirty' : 'saved'); if (timer) clearTimeout(timer); timer = setTimeout(flush, opts.delayMs ?? 1500); }
  return { push(scene: unknown) { pending = scene; schedule(); }, flush };
}

export const SAVE_STATUS_LABEL: Record<SaveStatus, string> = {
  saved: '已保存', saving: '正在保存…', dirty: '未保存改动', failed: '保存失败，点击重试',
};
