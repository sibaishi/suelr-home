(() => {
  'use strict';
  const $ = id => document.getElementById(id), C = NoteCore;
  const KEY = 'suelr-home:note-drafts:v1';
  const fields = ['title','slug','category','label','date','summary','body'];
  let drafts = [], current, dirty = false, timer, storageReady = true, conflict = false;
  let publishedSlugs = new Set();
  function error(message = '') { $('error-status').textContent = message; }
  function message(text) { $('save-status').textContent = text; }
  function read() { const n = {...current}; for (const key of fields) n[key] = $(key).value; return n; }
  function renderList() {
    $('draft-list').replaceChildren();
    for (const n of [...drafts].sort((a,b) => b.updated.localeCompare(a.updated))) {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = n.title || '未命名草稿'; button.setAttribute('aria-current', String(n.id === current?.id));
      const time = document.createElement('small'); time.textContent = new Date(n.updated).toLocaleString('zh-CN'); button.append(time);
      button.addEventListener('click', () => { if (flush()) load(n); }); $('draft-list').append(button);
    }
    if (!drafts.length) $('draft-list').textContent = '还没有本地草稿。';
  }
  function persist(next) {
    if (!storageReady || conflict) { error('本地存储不可用或已被其他标签页修改。请先导出当前草稿备份，再刷新页面。'); return false; }
    try { localStorage.setItem(KEY, JSON.stringify(next)); drafts = next; return true; }
    catch { error('无法保存草稿，可能是浏览器限制或存储已满。请立即导出 Markdown 备份。'); return false; }
  }
  function save() {
    clearTimeout(timer);
    const n = {...read(), updated:new Date().toISOString()};
    const next = drafts.filter(d => d.id !== n.id); next.push(n);
    if (!persist(next)) return false;
    current = n; dirty = false; error(); renderList(); message('已保存到此浏览器 · ' + new Date(n.updated).toLocaleTimeString('zh-CN')); return true;
  }
  function flush() { return !dirty || save(); }
  function load(n) {
    clearTimeout(timer); current = {...n};
    for (const key of fields) $(key).value = n[key] || '';
    dirty = false; renderList(); preview(); message(drafts.some(d => d.id === n.id) ? '已打开本地草稿' : '新草稿 · 输入后自动保存'); error();
  }
  function fresh(data = {}) {
    return {id:crypto.randomUUID(),title:'',slug:'',category:'设计与创作',label:'随笔',date:'',summary:'',body:'',updated:new Date().toISOString(),...data};
  }
  function preview() {
    const n = read();
    $('preview-title').textContent = n.title || '未命名随笔'; $('preview-category').textContent = n.category + ' / NOTES';
    $('preview-summary').textContent = n.summary;
    $('preview-meta').textContent = ['DYLAN / 黄冬冬',n.label,n.date,'本地预览 · 尚未发布'].filter(Boolean).join(' / ');
    $('preview-body').innerHTML = C.markdown(n.body);
  }
  function download(n, draft) {
    const raw = C.serialize(n, draft), url = URL.createObjectURL(new Blob([raw], {type:'text/markdown;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.slug) ? n.slug : 'untitled-note') + '.md';
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(stored) || stored.some(n => !n || typeof n.id !== 'string' || typeof n.updated !== 'string' || fields.some(f => typeof n[f] !== 'string'))) throw new Error('草稿格式不正确');
    drafts = stored;
  } catch { storageReady = false; }
  load(drafts.length ? [...drafts].sort((a,b) => b.updated.localeCompare(a.updated))[0] : fresh());
  if (!storageReady) error('无法读取本地草稿；原存储未被覆盖。可以继续编辑并导出 Markdown 备份。');
  $('note-form').addEventListener('submit', event => {event.preventDefault(); save();});
  $('note-form').addEventListener('input', () => { dirty = true; message('尚未保存…'); clearTimeout(timer); timer = setTimeout(save, 450); preview(); });
  $('save-note').addEventListener('click', save);
  $('new-note').addEventListener('click', () => { if (flush()) {load(fresh()); $('title').focus();} });
  $('export-note').addEventListener('click', () => { try { download(read(), true); message('已导出草稿（draft: true），请保管下载文件。'); } catch (e) {error(e.message);} });
  $('delete-note').addEventListener('click', () => {
    if (!confirm('删除当前本地草稿？已发布文章不会被删除。')) return;
    clearTimeout(timer);
    if (persist(drafts.filter(n => n.id !== current.id))) { dirty = false; load(drafts[0] || fresh()); }
  });
  $('import-note').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      if (!/\.(md|markdown)$/i.test(file.name)) throw new Error('请选择 .md 或 .markdown 文件。');
      if (file.size > 1024 * 1024) throw new Error('请导入小于 1 MB 的 Markdown 文件。');
      const data = C.parse(await file.text(), file.name);
      if (!flush()) return;
      load(fresh(data)); dirty = true; save(); message(dirty ? '已导入，但未能自动保存，请导出备份。' : '已导入为新草稿；原有草稿和线上文章未改动。');
    } catch (e) {error(e.message);} finally {event.target.value = '';}
  });
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => {
    const isPreview = button.dataset.view === 'preview'; preview();
    $('edit-pane').hidden = isPreview; $('preview-pane').hidden = !isPreview;
    document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  }));
  $('publish-note').addEventListener('click', () => {
    try {
      const n = read(); C.validate(n); flush();
      const plan = C.publication(n, publishedSlugs.has(n.slug));
      $('publish-filename').textContent = n.slug + '.md';
      $('publish-source').value = plan.raw; $('github-edit').href = plan.url;
      $('copy-publish').hidden = plan.prefilled;
      $('publish-copy-status').textContent = '';
      $('publish-instructions').textContent = plan.prefilled
        ? '文章已准备好。前往 GitHub 后，检查内容并点击 Commit changes 确认提交即可。'
        : '先复制文章内容，再前往 GitHub，将编辑区内容全选替换并粘贴，点击 Commit changes 确认提交。';
      $('publish-dialog').showModal();
    } catch (e) {error(e.message);}
  });
  $('download-publish').addEventListener('click', () => { try {const n=read(); C.validate(n); download(n, false);} catch(e) {error(e.message);} });
  $('copy-publish').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('publish-source').value);
      $('publish-copy-status').textContent = '已复制。现在前往 GitHub 粘贴并确认提交。';
    } catch {
      $('publish-fallback').open = true; $('publish-source').focus(); $('publish-source').select();
      $('publish-copy-status').textContent = '浏览器未允许自动复制，内容已选中，请手动复制。';
    }
  });
  $('close-publish').addEventListener('click', () => $('publish-dialog').close());
  window.addEventListener('beforeunload', e => {if (dirty) {e.preventDefault(); e.returnValue = '';}});
  window.addEventListener('storage', e => { if (e.key === KEY || e.key === null) {conflict = true; clearTimeout(timer); error('另一标签页已修改草稿。为避免覆盖，请先导出当前草稿，再刷新此页面。');} });
  const openingId = current.id, openingUpdated = current.updated;
  fetch('published.json', {cache:'no-cache'}).then(r => {if (!r.ok) throw new Error(); return r.json();}).then(notes => {
    if (!Array.isArray(notes)) throw new Error();
    publishedSlugs = new Set(notes.map(n => n.slug));
    $('published-status').textContent = '打开后创建本地副本，提交前不会改变线上文章。';
    const requested = new URLSearchParams(window.location.search).get('edit');
    if (requested && !dirty && current.id === openingId && current.updated === openingUpdated) {
      const n = notes.find(n => n.slug === requested);
      if (n) {
        const saved = drafts.filter(d => d.slug === requested).sort((a,b) => b.updated.localeCompare(a.updated))[0];
        if (saved) load(saved);
        else {load(fresh(C.parse(n.raw, n.slug + '.md'))); dirty = true; save();}
      } else error('找不到这篇随笔，请从已发布列表选择。');
    }
    for (const n of notes) {
      const button = document.createElement('button'); button.type='button'; button.textContent=n.title;
      button.addEventListener('click', () => { try {if (flush()) {load(fresh(C.parse(n.raw, n.slug + '.md'))); dirty=true; save();}} catch(e) {error(e.message);} }); $('published-list').append(button);
    }
  }).catch(() => {$('published-status').textContent = '暂时无法读取文章列表。可以从 content 目录下载 Markdown 后导入。';});
})();
