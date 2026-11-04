# SUELR · 冬冬的个人空间

独立个人主页与随笔，部署至 `www.suelr.com`。连接 `design.suelr.com` 作品集与 `winter.suelr.com` 冬季路书，不改变两个子站。

## 开发

```sh
cd /workspace/suelr-home
python3 scripts/build.py
python3 -m http.server 8002 --bind 127.0.0.1
```

使用 Python 标准库生成静态 HTML，不安装依赖。页面可无 JavaScript 阅读；JS 仅管理筛选、主题、菜单、进度和分享。

## 内容

编辑 `content/*.md` 后运行生成脚本。文件头支持 title、category、summary、label。当前 Markdown 支持二级标题、段落、列表、引用和 HTTPS 链接。新增文章需加入 `scripts/build.py` 的 order 列表。

首版文案根据用户简历、作品集、N/OWN 手册及路书内容撰写，不编造旅行经历；N/OWN 标注自主概念品牌，2027 远行标注计划未出发。未公开薪资、电话或原始简历文件。文章是为本站起草的首版记录，用户可继续润色。

## 共同视觉

`design-system.css`、`theme.js` 从另外两站复用，保持字节一致。灰阶、直角、导航、日夜模式与阅读进度一致；主题通过 suelr.com 非敏感 Cookie 跨子域共享，其他数据不共享。修改共享样式时同步其他仓库，并重新生成资源哈希。

图标为品牌手册正式独立符号；品牌字标保留原轮廓。禾木照片由 Leeinm 拍摄，来源 Wikimedia Commons，CC BY-SA 4.0；页面保留原图与许可链接，明确非本人旅拍。

## 发布

GitHub Pages：main / root。仓库包含生成后的 HTML，推送即可发布，无需服务器构建。CNAME 为 `www.suelr.com`。完整网址与 sitemap 已配置。
