/* Keep this small Markdown subset in sync with scripts/build.py. Raw HTML is text. */
(function (host) {
  'use strict';
  const fields = ['title', 'category', 'summary', 'label', 'date'];
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#x27;'}[c]));
  function inline(s) {
    const re = /\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;
    let out = '', pos = 0;
    for (const m of s.matchAll(re)) {
      out += escape(s.slice(pos, m.index)) + `<a href="${escape(m[2])}">${escape(m[1])}</a>`;
      pos = m.index + m[0].length;
    }
    return out + escape(s.slice(pos));
  }
  function markdown(s) {
    const out = [], paragraph = [];
    let list = false;
    function flush() { if (paragraph.length) { out.push('<p>' + inline(paragraph.join(' ')) + '</p>'); paragraph.length = 0; } }
    for (const line of [...s.split(/\r?\n/), '']) {
      if (line.startsWith('- ')) {
        flush(); if (!list) { out.push('<ul>'); list = true; }
        out.push('<li>' + inline(line.slice(2)) + '</li>'); continue;
      }
      if (list) { out.push('</ul>'); list = false; }
      if (line.startsWith('## ')) { flush(); out.push('<h2>' + inline(line.slice(3)) + '</h2>'); }
      else if (line.startsWith('> ')) { flush(); out.push('<blockquote><p>' + inline(line.slice(2)) + '</p></blockquote>'); }
      else if (!line.trim()) flush();
      else paragraph.push(line.trim());
    }
    return out.join('\n');
  }
  function parse(raw, filename = '') {
    raw = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
    const note = {title:'',category:'设计与创作',summary:'',label:'随笔',date:'',draft:true,body:raw,slug:filename.replace(/\.(md|markdown)$/i, '')};
    if (raw.startsWith('---\n')) {
      const m = raw.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
      if (!m) throw new Error('文件头缺少结束的 ---，未导入。');
      for (const line of m[1].split('\n')) {
        if (!line.trim()) continue;
        const i = line.indexOf(':');
        if (i < 1) throw new Error('文件头格式应为 字段: 内容。');
        const key = line.slice(0, i).trim(), value = line.slice(i + 1).trim();
        if (fields.includes(key)) note[key] = value;
        else if (key === 'draft') {
          if (!/^(true|false)$/i.test(value)) throw new Error('draft 必须是 true 或 false。');
          note.draft = value.toLowerCase() === 'true';
        } else throw new Error(`暂不支持文件头字段 ${key}；请保留原文件并移除该字段后导入。`);
      }
      note.body = m[2];
    }
    return note;
  }
  function serialize(note, draft = true) {
    for (const key of fields) if (/[\r\n]/.test(note[key] || '')) throw new Error('文件头字段不能换行。');
    return '---\n' + fields.filter(key => note[key]).map(key => `${key}: ${note[key]}`).join('\n') + `\ndraft: ${draft}\n---\n` + note.body;
  }
  function validate(n) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(n.slug)) throw new Error('文件名请使用小写英文、数字和连字符，例如 winter-notes。');
    for (const key of ['title','summary','label']) if (!n[key].trim()) throw new Error('请填写标题、摘要和记录标签。');
    if (!['设计与创作','生活与远行'].includes(n.category)) throw new Error('请选择有效分类。');
    if (!n.body.trim()) throw new Error('请填写正文。');
    if (n.date && (!/^\d{4}-\d{2}-\d{2}$/.test(n.date) || !Number.isFinite(Date.parse(n.date)) || new Date(n.date).toISOString().slice(0,10) !== n.date)) throw new Error('日期格式应为有效的 YYYY-MM-DD。');
    serialize(n);
  }
  const api = {escape, markdown, parse, serialize, validate};
  if (typeof module !== 'undefined') module.exports = api;
  else host.NoteCore = api;
})(globalThis);
