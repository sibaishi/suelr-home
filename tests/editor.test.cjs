const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const C = require('../editor/core.js');

test('published Markdown survives import/export including punctuation and Unicode', () => {
  const raw = readFileSync('content/designing-order.md','utf8');
  const note = C.parse(raw,'designing-order.md');
  C.validate(note);
  const exported = C.serialize(note, true);
  const restored = C.parse(exported,'designing-order.md');
  for (const key of ['title','category','summary','label','body','slug']) assert.equal(restored[key],note[key]);
  assert.equal(restored.draft,true);
  assert.equal(C.parse(C.serialize(note,false)).draft,false);
});
test('plain Markdown and BOM/Windows newlines import without losing body', () => {
  assert.equal(C.parse('## Hello\n\n世界','hello.md').body,'## Hello\n\n世界');
  const n = C.parse('\uFEFF---\r\ntitle: A: B\r\ndraft: TRUE\r\n---\r\nText','test.md');
  assert.equal(n.title,'A: B'); assert.equal(n.body,'Text'); assert.equal(n.draft,true);
});
test('invalid or unknown frontmatter is rejected instead of silently losing metadata', () => {
  for (const raw of ['---\ntitle: hi','---\nbad\n---\nbody','---\nsecret: text\n---\nbody','---\ndraft: maybe\n---\nbody']) assert.throws(() => C.parse(raw));
});
test('preview treats raw HTML and unsafe links as text', () => {
  const html = C.markdown('<img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))\n\n[good](https://example.com/?x="hello")');
  assert.ok(!html.includes('<img')); assert.ok(!html.includes('href="javascript:'));
  assert.ok(html.includes('&lt;img')); assert.ok(html.includes('&quot;hello&quot;'));
});
test('publish rejects path traversal, frontmatter injection, empty body and invalid dates', () => {
  const n = C.parse(readFileSync('content/designing-order.md','utf8'),'designing-order.md');
  for (const change of [{slug:'../evil'},{title:'Hello\ndraft: false'},{body:' '},{date:'2026-02-30'},{category:'Unknown'}]) assert.throws(() => C.validate({...n,...change}));
});

const vm = require('node:vm');
function workspace(initial, {blocked=false}={}) {
  const elements = new Map(), handlers = {}, writes = [];
  class Element {
    constructor() {this.value='';this.textContent='';this.children=[];this.listeners={};this.files=[];}
    addEventListener(name,fn) {this.listeners[name]=fn;}
    append(child) {this.children.push(child);}
    replaceChildren() {this.children=[];}
    setAttribute() {}
    focus() {}
    showModal() {this.open=true;}
    close() {this.open=false;}
    remove() {}
    click() {}
  }
  const get = id => {if (!elements.has(id)) elements.set(id,new Element());return elements.get(id);};
  const context={NoteCore:C,crypto:require('node:crypto').webcrypto,Date,Blob,URL,console,
    localStorage:{getItem:()=>initial,setItem:(key,value)=>{if(blocked)throw new Error('quota');writes.push(JSON.parse(value));}},
    document:{getElementById:get,querySelectorAll:()=>[],createElement:()=>new Element(),body:new Element()},
    URLSearchParams,window:{location:{search:''},addEventListener:(event,fn)=>{handlers[event]=fn;}},
    fetch:async()=>({ok:true,json:async()=>[]}),confirm:()=>true,setTimeout:()=>1,clearTimeout:()=>{}};
  vm.runInNewContext(readFileSync('editor/editor.js','utf8'),context);
  return {get,writes,handlers,click:id=>get(id).listeners.click(),input:()=>get('note-form').listeners.input()};
}
test('workspace restores drafts, saves edits and creates independent drafts', () => {
  const w=workspace(null); w.get('title').value='本地草稿'; w.input(); w.click('save-note');
  assert.equal(w.writes.at(-1)[0].title,'本地草稿');
  const restored=workspace(JSON.stringify(w.writes.at(-1)));
  assert.equal(restored.get('title').value,'本地草稿');
  restored.click('new-note'); restored.get('title').value='第二篇'; restored.input(); restored.click('save-note');
  assert.equal(restored.writes.at(-1).length,2);
});
test('corrupt storage and cross-tab edits do not overwrite saved drafts', () => {
  for (const corrupt of ['{broken','{}','[{}]']) {
    const w=workspace(corrupt);w.get('title').value='Keep';w.input();w.click('save-note');
    assert.equal(w.writes.length,0);assert.ok(w.get('error-status').textContent);
  }
  const w=workspace(null);w.get('title').value='Keep';w.input();
  w.handlers.storage({key:'suelr-home:note-drafts:v1'});w.click('save-note');
  assert.equal(w.writes.length,0);assert.ok(w.get('error-status').textContent);
});
test('failed persistence retains unsaved-edit protection', () => {
  const w=workspace(null,{blocked:true});w.get('body').value='Unstored';w.input();w.click('save-note');
  let protected=false;w.handlers.beforeunload({preventDefault:()=>{protected=true;}});
  assert.equal(protected,true);assert.equal(w.get('body').value,'Unstored');
});
test('Markdown import creates a new draft and preserves the previous draft', async () => {
  const w=workspace(null);w.get('title').value='Original';w.input();w.click('save-note');
  const file={name:'imported.md',size:20,text:async()=> '## Imported\n\n正文'};
  await w.get('import-note').listeners.change({target:{files:[file],value:'imported.md'}});
  assert.equal(w.writes.at(-1).length,2);assert.equal(w.get('slug').value,'imported');
  assert.equal(w.get('body').value,'## Imported\n\n正文');
});

test('publishing prefills new notes and routes existing notes to their editor', () => {
  const n=C.parse(readFileSync('content/designing-order.md','utf8'),'designing-order.md');
  const create=C.publication({...n,body:n.body.repeat(10)},false);
  assert.equal(create.prefilled,false); // Long Unicode article uses clipboard to avoid oversized URLs.
  assert.ok(create.url.includes('/new/main?filename='));
  const short=C.publication({...n,body:'Hello',title:'Hi',summary:'Text',label:'Note'},false);
  assert.equal(short.prefilled,true);
  assert.equal(new URL(short.url).searchParams.get('value'),short.raw);
  const edit=C.publication(n,true);
  assert.equal(edit.url,'https://github.com/sibaishi/suelr-home/edit/main/content/designing-order.md');
  assert.equal(C.parse(edit.raw).draft,false);
});
