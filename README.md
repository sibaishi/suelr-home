# SUELR · 冬冬的个人空间

独立个人主页与随笔，部署至 `www.suelr.com`。连接 `design.suelr.com` 作品集与 `winter.suelr.com` 冬季路书，不改变两个子站。

## 开发

```sh
cd /workspace/suelr-home
python3 scripts/build.py
python3 -m http.server 8002 --bind 127.0.0.1 --directory _site
```

使用 Python 标准库生成静态 HTML 到 `_site/`，不安装依赖。验证使用 Node.js 22 和 Python 3.12。页面可无 JavaScript 阅读；JS 仅管理筛选、主题、菜单、进度和分享。

## 内容

编辑 `content/*.md` 后运行生成脚本。文件头支持 title、category、summary、label。当前 Markdown 支持二级标题、段落、列表、引用和 HTTPS 链接。构建会自动发现新增文章；含 date 的新文章按日期倒序排列，既有三篇保持原顺序。文件名使用小写英文、数字和连字符。可选 `date: YYYY-MM-DD`，`draft: true` 会从首页、文章、sitemap、编辑器文章列表和发布产物中排除；缺少 draft 的既有文章继续发布。

首版文案根据用户简历、作品集、N/OWN 手册及路书内容撰写，不编造旅行经历；N/OWN 标注自主概念品牌，2027 远行标注计划未出发。未公开薪资、电话或原始简历文件。文章是为本站起草的首版记录，用户可继续润色。

## 共同视觉

`design-system.css`、`theme.js` 从另外两站复用，保持字节一致。灰阶、直角、导航、日夜模式与阅读进度一致；主题通过 suelr.com 非敏感 Cookie 跨子域共享，其他数据不共享。本站此次编辑器使用独立样式，不修改共享样式或其他仓库。

图标为品牌手册正式独立符号；品牌字标保留原轮廓。禾木照片由 Leeinm 拍摄，来源 Wikimedia Commons，CC BY-SA 4.0；页面保留原图与许可链接，明确非本人旅拍。

## 随笔工作台

打开 `https://www.suelr.com/editor/`，或本地构建后访问 `/editor/`。首页随笔区有「写随笔 / 本地草稿」入口。

- 输入后自动保存，可手动保存、切换和删除多篇草稿。数据在当前浏览器的 localStorage 中，不跨设备同步；清理浏览器数据会丢失草稿，请定期导出。多标签页冲突或存储失败时会提示，不覆盖原数据。
- 阅读预览与正式文章使用同一组 Markdown 规则：段落、二级标题、无序列表、引用、HTTPS 链接。HTML 作为文本显示；其他 Markdown 扩展暂不支持。
- 导入 `.md` / `.markdown` 创建新草稿，不覆盖现有草稿。支持本站文件头和无文件头的纯 Markdown；UTF-8，最大 1 MB。已发布列表来自构建时生成的 `published.json`，打开文章会生成本地副本。
- 「导出草稿」带 `draft: true`，上传后也不会发布。草稿是本地数据，不是服务器私密存储；不要将含敏感信息的草稿提交到公开 GitHub 仓库。
- 「准备发布」校验必填信息及文件名后，下载 `draft: false` 的正式文件，再打开固定的 `sibaishi/suelr-home` 仓库 `content/` 上传页。登录 GitHub、上传并提交到 main 后，Actions 自动发布。相同文件名更新原文章，新文件名创建文章。操作前核对文件名；编辑器不会自动推送或保存访问令牌。

## 发布

GitHub 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。工作流 `.github/workflows/publish.yml` 在 main 提交或手动运行时，先运行验证、再构建并仅上传 `_site/`，随后部署至该仓库的 Pages。首次切换发布源需有仓库管理权限。

CNAME 保留为 `www.suelr.com`；不更改 DNS、`design.suelr.com` 或 `winter.suelr.com`。发布目录使用明确白名单，不包含 `content/`、`scripts/`、`tests/`、`.github/` 或本地草稿。旧文章文件即使残留在源码中，也不会被误打包发布。

```sh
node --test tests/editor.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py'
python3 scripts/build.py
```

在仓库 Actions 中确认 Publish personal home 成功后，再访问线上编辑入口。更改源文件后需重新构建；请勿直接编辑 `_site/`。
