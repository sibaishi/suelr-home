import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class BuildTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory()
  self.addCleanup(self.tmp.cleanup)
  self.root=Path(self.tmp.name)/'site'
  shutil.copytree(ROOT,self.root,ignore=shutil.ignore_patterns('_site','.git','__pycache__'))
  # Integration tests own their content; real articles may be added, edited or removed.
  shutil.rmtree(self.root/'content',ignore_errors=True)
  (self.root/'content').mkdir()
  shutil.copy2(ROOT/'tests/fixtures/example.md',self.root/'content/example.md')
 def run_build(self,ok=True):
  result=subprocess.run(['python3','scripts/build.py'],cwd=self.root,capture_output=True,text=True)
  self.assertEqual(result.returncode==0,ok,result.stderr)
  return result
 def test_discovery_drafts_and_publish_allowlist(self):
  raw=(self.root/'content/example.md').read_text()
  (self.root/'content/new-note.md').write_text(raw.replace('title: ','date: 2026-11-04\ntitle: NEW ',1))
  (self.root/'content/private-note.md').write_text(raw.replace('title: ','draft: true\ntitle: PRIVATE SECRET ',1))
  (self.root/'notes/private-note.html').write_text('STALE SECRET')
  (self.root/'editor/published.json').write_text('STALE SECRET')
  self.run_build()
  site=self.root/'_site'
  self.assertTrue((site/'notes/new-note.html').exists())
  self.assertFalse((site/'notes/private-note.html').exists())
  for name in ('content','scripts','tests','.github','README.md'):self.assertFalse((site/name).exists())
  self.assertIn('共 2 篇记录',(site/'index.html').read_text())
  self.assertIn('./editor/',(site/'index.html').read_text())
  published=json.loads((site/'editor/published.json').read_text())
  self.assertEqual(published[0]['slug'],'new-note')
  for path in site.rglob('*'):
   if path.is_file():self.assertNotIn('SECRET',path.read_text(errors='ignore'))
  (self.root/'content/new-note.md').unlink()
  self.run_build()
  self.assertFalse((site/'notes/new-note.html').exists())
 def test_arbitrary_article_count_does_not_block_publication(self):
  raw=(self.root/'content/example.md').read_text()
  for i in range(7):
   (self.root/'content'/f'added-{i}.md').write_text(raw)
  self.run_build()
  site=self.root/'_site'
  self.assertEqual(len(json.loads((site/'editor/published.json').read_text())),8)
  self.assertIn('共 8 篇记录',(site/'index.html').read_text())
 def test_deleting_all_articles_is_supported(self):
  shutil.rmtree(self.root/'content')
  self.run_build()
  site=self.root/'_site'
  self.assertEqual(json.loads((site/'editor/published.json').read_text()),[])
  self.assertEqual(list((site/'notes').iterdir()),[])
  self.assertIn('共 0 篇记录',(site/'index.html').read_text())
 def test_bad_metadata_fails_build(self):
  (self.root/'content/bad.md').write_text('---\ntitle: Invalid\n---\nBody')
  self.run_build(ok=False)
 def test_preview_matches_built_article_and_escapes_html(self):
  raw=(self.root/'content/example.md').read_text()
  body='## 标题\n\n段落 <script>alert(1)</script>\n\n- A & B\n- [链接](https://example.com/)\n\n> 引用\n\n[x](javascript:alert(1))\n'
  front=raw.split('---',2)[1]
  (self.root/'content/parity.md').write_text('---'+front+'---\n'+body)
  self.run_build()
  rendered=subprocess.run(['node','-e',"process.stdout.write(require('./editor/core.js').markdown(process.argv[1]))",body],cwd=self.root,capture_output=True,text=True,check=True).stdout
  article=(self.root/'_site/notes/parity.html').read_text()
  self.assertIn('<div class="prose">'+rendered+'</div>',article)
  self.assertNotIn('<script>alert',article)

if __name__=='__main__':unittest.main()
