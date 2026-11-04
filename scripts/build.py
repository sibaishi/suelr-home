"""Build the personal home and note pages using Python's standard library only."""
from pathlib import Path
import re, html, hashlib, json, shutil
from datetime import date
root=Path(__file__).resolve().parent.parent
order=['designing-order','before-winter','from-model-to-image']
def escape(s):return html.escape(s,quote=True)
def inline(s):
 pieces=[];pos=0
 for m in re.finditer(r'\[([^\]]+)\]\((https://[^\s)]+)\)',s):
  pieces.append(escape(s[pos:m.start()]));pieces.append(f'<a href="{escape(m[2])}">{escape(m[1])}</a>');pos=m.end()
 pieces.append(escape(s[pos:]));return ''.join(pieces)
def markdown(s):
 out=[];paragraph=[];in_list=False
 def flush():
  if paragraph:out.append('<p>'+inline(' '.join(paragraph))+'</p>');paragraph.clear()
 for line in s.splitlines()+['']:
  if line.startswith('- '):
   flush()
   if not in_list:out.append('<ul>');in_list=True
   out.append('<li>'+inline(line[2:])+'</li>');continue
  if in_list:out.append('</ul>');in_list=False
  if line.startswith('## '):flush();out.append('<h2>'+inline(line[3:])+'</h2>')
  elif line.startswith('> '):flush();out.append('<blockquote><p>'+inline(line[2:])+'</p></blockquote>')
  elif not line.strip():flush()
  else:paragraph.append(line.strip())
 return '\n'.join(out)
def asset(name,prefix):return prefix+name+'?v='+hashlib.sha256((root/name).read_bytes()).hexdigest()[:12]
def head(title,description,path,prefix='./'):
 return f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="{escape(description)}"><meta name="theme-color" content="#f0efeb"><title>{escape(title)}</title><link rel="canonical" href="https://www.suelr.com/{path}"><meta property="og:type" content="website"><meta property="og:title" content="{escape(title)}"><meta property="og:description" content="{escape(description)}"><meta property="og:url" content="https://www.suelr.com/{path}"><script src="{asset('theme.js',prefix)}"></script><link rel="stylesheet" href="{asset('site.css',prefix)}"><link rel="stylesheet" href="{asset('design-system.css',prefix)}"><link rel="icon" href="{asset('assets/favicon.svg',prefix)}" type="image/svg+xml"><link rel="icon" href="{prefix}favicon.ico" sizes="any"><link rel="apple-touch-icon" href="{prefix}assets/apple-touch-icon.png"></head><body><a href="#main" class="skip">跳到主要内容</a>'''
def header(prefix='./'):
 return f'''<header class="nav wrap"><a class="wordmark" href="{prefix}index.html" aria-label="SUELR 个人主页">SUELR<small>冬冬的个人空间</small></a><div class="site-actions"><button type="button" class="theme-toggle" data-theme-toggle aria-label="切换到夜间模式" aria-pressed="false">夜间模式</button><button type="button" class="menu-toggle" aria-controls="main-nav" aria-expanded="false">菜单 <span aria-hidden="true">＋</span></button></div><nav id="main-nav" aria-label="主导航"><a href="{prefix}index.html#spaces">创作与远行</a><a href="{prefix}index.html#notes">随笔</a><a href="{prefix}index.html#about">关于我</a><a href="{prefix}index.html#contact">联系 ↗</a></nav></header>'''
def footer(prefix='./'):
 return f'''<footer class="footer-home wrap"><p>© <span id="year">2026</span> SUELR / DYLAN<br>设计，日常，和下一段旅程。</p><div class="footer-links"><a href="https://design.suelr.com/">作品集 ↗</a><a href="https://winter.suelr.com/">冬季路书 ↗</a><a href="#top">回到顶部 ↑</a></div></footer><script src="{asset('home.js',prefix)}"></script></body></html>'''
def read_note(path):
 raw=path.read_text(encoding='utf-8-sig').replace('\r\n','\n')
 match=re.match(r'\A---\n(.*?)\n---(?:\n|$)(.*)\Z',raw,re.S)
 if not match:raise ValueError(f'{path.name}: 缺少 Markdown 文件头')
 meta={}
 for line in match[1].splitlines():
  if not line.strip():continue
  key,sep,value=line.partition(':')
  if not sep:raise ValueError(f'{path.name}: 无效文件头')
  meta[key.strip()]=value.strip()
 if meta.get('draft','false').lower() not in ('true','false'):
  raise ValueError(f'{path.name}: draft 必须是 true 或 false')
 if meta.get('draft','false').lower()=='true':return None
 if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',path.stem):raise ValueError(f'{path.name}: 无效文章文件名')
 for key in ('title','category','summary','label'):
  if not meta.get(key):raise ValueError(f'{path.name}: 缺少 {key}')
 if meta['category'] not in ('设计与创作','生活与远行'):raise ValueError(f'{path.name}: 无效分类')
 if meta.get('date'):date.fromisoformat(meta['date'])
 body=match[2]
 meta.update(slug=path.stem,body=body,minutes=max(1,round(len(body)/450)),raw=raw)
 return meta
notes=[n for path in sorted((root/'content').glob('*.md')) if (n:=read_note(path))]
notes.sort(key=lambda n:(n.get('date',''),-order.index(n['slug']) if n['slug'] in order else -len(order)),reverse=True)
(root/'notes').mkdir(exist_ok=True)
cards=''
for n in notes:
 cards+=f'''<a class="note-card" href="./notes/{n['slug']}.html" data-note-category="{escape(n['category'])}"><span class="note-category">{escape(n['category'])}</span><div><h3>{escape(n['title'])}</h3><p>{escape(n['summary'])}</p><div class="note-meta">{escape(n['label'])} / 约 {n['minutes']} 分钟</div></div><span class="note-arrow" aria-hidden="true">↗</span></a>'''
main='''<main id="main"><section class="hero-home wrap" id="top"><div class="hero-meta"><span>PERSONAL SPACE / DYLAN HUANG</span><span>上海 · 杭州 / 设计与生活之间</span></div><div class="hero-layout"><div><h1>你好，我是冬冬。<br><span>记录日常，也记录创作。</span></h1><p class="hero-description">工作里，我用三维和视觉讲产品的故事。<br>生活里，也想给那些值得记录的想法、准备和远行，留一个位置。</p></div><aside class="hero-aside"><span class="aside-label">A LITTLE ABOUT ME</span><h2>黄冬冬 / Dylan</h2><p>电商视觉设计师，三维方向。<br>从建模、布光到品牌表达，也在认真准备下一段旅程。</p><a class="inline-link" href="#about">多认识我一点 <span aria-hidden="true">↘</span></a></aside></div><div class="hero-foot"><div class="coordinates"><span>DESIGN</span><span>EVERYDAY</span><span>ON THE ROAD</span></div><span>慢慢记录，不急着填满。↓</span></div></section>
<section class="section-home wrap" id="spaces"><div class="section-heading"><div><p class="eyebrow">01 / DIFFERENT SIDES OF ME</p><h2>两个空间，同一个我。</h2></div><p>一边是工作与创作，一边是生活与远方。<br>从这里，走进我不同的侧面。</p></div><div class="spaces-grid"><a class="space-link" href="https://design.suelr.com/"><div class="space-image"><div class="design-proof"><img src="./assets/nown-wordmark.svg" alt="N/OWN 自定时区正式品牌字标" width="472" height="158"><p>自定时区</p><span>SELECTED BRAND EXPLORATION / 2026</span></div></div><div class="space-copy"><div class="space-topline"><span>DESIGN & CREATION</span><span>01</span></div><h3>设计与创作</h3><p>八年电商视觉经验，以三维为核心。作品、品牌探索，以及从一个模型到一套视觉表达的过程。</p><div class="space-bottom"><span>个人作品集 / design.suelr.com</span><b aria-hidden="true">↗</b></div></div></a><a class="space-link" href="https://winter.suelr.com/"><div class="space-image winter-image"><img src="./assets/winter-hemu.jpg" alt="禾木村冬季雪景，作为冬季出行计划的目的地参考" width="1600" height="1067" loading="lazy"><span class="image-label">2027 / 出行计划 · 尚未出发</span></div><div class="space-copy"><div class="space-topline"><span>LIFE & EXPLORATION</span><span>02</span></div><h3>生活与远行</h3><p>从金华出发的十五天冬季自驾计划。路线、装备和出发前的准备，先记在路书里，故事等上路之后再写。</p><div class="space-bottom"><span>冬季路书 / winter.suelr.com</span><b aria-hidden="true">↗</b></div></div></a></div><p class="photo-credit">冬季图像为目的地参考实景，非本人旅拍。摄影 Leeinm / <a href="https://commons.wikimedia.org/wiki/File:Hemu_Village_in_the_snow.jpg">原图</a> / <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>。</p></section>
<section class="section-home wrap" id="notes"><div class="section-heading"><div><p class="eyebrow">02 / NOTES ALONG THE WAY</p><h2>把一些想法，留在这里。</h2></div><p>关于设计的思考，出发前的准备。<br>先从已有的创作与计划开始记录。</p></div><p><a class="filter-button write-note" href="./editor/">＋ 写随笔</a></p><div class="notes-toolbar" role="group" aria-label="筛选随笔"><button class="filter-button" data-note-filter="all" aria-pressed="true" type="button">全部随笔</button><button class="filter-button" data-note-filter="设计与创作" aria-pressed="false" type="button">设计与创作</button><button class="filter-button" data-note-filter="生活与远行" aria-pressed="false" type="button">生活与远行</button></div><div class="note-list">'''+cards+'''</div><p class="filter-status" id="note-status" role="status">共 '''+str(len(notes))+''' 篇记录</p></section>
<section class="section-home wrap" id="about"><div class="about-layout"><div><p class="eyebrow">03 / A LITTLE ABOUT ME</p><h2 class="about-name">黄冬冬，<br>也可以叫我 Dylan。</h2><p class="about-role">电商视觉设计师 / 三维方向<br>上海 · 杭州</p><a class="inline-link" href="https://design.suelr.com/#experience">查看完整职业经历 <span aria-hidden="true">↗</span></a></div><div class="about-copy"><p>从电商详情页、主图和产品精修开始，我的工作逐渐延伸到<strong>三维建模、渲染、品牌视觉与产品动画</strong>。这些年积累的，不只是软件的使用方法，也包括如何把一个方向拆解成能够完成和交付的步骤。</p><p>现在，我以 C4D、Octane 等工具推进产品视觉，也将 ComfyUI 用于场景探索。N/OWN「自定时区」是一次自主品牌探索，让我从单张图继续走向一套完整的视觉语言。</p><p>这个网站留给工作之外更多的自己：创作过程、日常想法，还有正在准备的冬季远行。它会慢慢长成一个个人空间，不需要一开始就有答案。</p><dl class="about-facts"><div><dt>EXPERIENCE</dt><dd>8 年电商视觉</dd></div><div><dt>FOCUS</dt><dd>三维 / 品牌 / 动效</dd></div><div><dt>CURRENTLY</dt><dd>创作 N/OWN · 准备 2027 冬季远行</dd></div></dl></div></div></section>
<section class="contact-home wrap" id="contact"><div class="contact-grid"><div><p class="eyebrow">04 / SAY HELLO</p><h2>有话想说，欢迎来信。</h2></div><a class="email" href="mailto:huang.dylan@foxmail.com">huang.dylan@foxmail.com <span aria-hidden="true">↗</span></a></div><p>设计交流、工作机会，或是关于路上那些事的一点分享，都可以。</p></section></main>'''
(root/'index.html').write_text(head('SUELR · 冬冬的个人空间','黄冬冬 Dylan 的个人空间。记录三维设计与品牌创作、生活想法，以及正在准备的冬季远行。','')+header()+main+footer())
for n in notes:
 article=f'''<main id="main" class="wrap"><div class="breadcrumb" id="top"><a href="../index.html">个人主页</a><span>/</span><a href="../index.html#notes">随笔</a><span>/ {escape(n['category'])}</span></div><article class="article-shell"><header class="article-head"><p class="eyebrow">{escape(n['category'])} / NOTES</p><h1>{escape(n['title'])}</h1><p class="summary">{escape(n['summary'])}</p><p><a class="inline-link" href="../editor/?edit={n['slug']}">编辑随笔</a></p><div class="article-meta"><span>DYLAN / 黄冬冬</span><span>{escape(n['label'])}</span><span>约 {n['minutes']} 分钟阅读</span></div></header><div class="prose">{markdown(n['body'])}</div><div class="article-end"><a href="../index.html#notes">← 返回随笔</a><button class="close" type="button" id="share-note">复制文章链接 ↗</button></div><p id="share-status" class="copy-status" role="status"></p><p class="related-note">这篇记录随创作与计划更新。更多作品见 <a href="https://design.suelr.com/">个人作品集 ↗</a>，出行安排见 <a href="https://winter.suelr.com/">冬季路书 ↗</a>。</p></article></main>'''
 (root/'notes'/f'{n["slug"]}.html').write_text(head(n['title']+' · SUELR',n['summary'],'notes/'+n['slug']+'.html','../')+header('../')+article+footer('../'))
urls=['https://www.suelr.com/']+['https://www.suelr.com/notes/'+n['slug']+'.html' for n in notes]
(root/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+''.join('<url><loc>'+u+'</loc></url>' for u in urls)+'</urlset>')
(root/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: https://www.suelr.com/sitemap.xml\n')
# Publish an explicit allowlist; never upload repository sources or draft files.
site=root/'_site'
if site.exists():shutil.rmtree(site)
site.mkdir()
for name in ('index.html','site.css','design-system.css','theme.js','home.js','CNAME','robots.txt','sitemap.xml','.nojekyll','favicon.ico'):
 if (root/name).exists():shutil.copy2(root/name,site/name)
shutil.copytree(root/'assets',site/'assets')
shutil.copytree(root/'editor',site/'editor')
(site/'notes').mkdir()
for n in notes:shutil.copy2(root/'notes'/f"{n['slug']}.html",site/'notes'/f"{n['slug']}.html")
(site/'editor'/'published.json').write_text(json.dumps([{'slug':n['slug'],'title':n['title'],'raw':n['raw']} for n in notes],ensure_ascii=False),encoding='utf-8')
print('Built home and',len(notes),'notes into _site (drafts excluded)')

