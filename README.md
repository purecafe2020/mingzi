# Mingzi 名字 — Your name, in real Chinese

给外国人起中文名的免费工具站 + 付费成品（签名卡 / 命名证书 / 纹身安全卡）。
免费层永远免费；付费卖的是"盖章成品"，不是名字本身。

- License: AGPL-3.0（代码开源；`data/` 数据文件是运营资产，随仓库一同发布，修改衍生同样须开源）
- 站点: GitHub Pages 静态站，无后端、无注册、秒出结果
- 定名算法: 确定性（同名永远同名），FNV-1a + mulberry32，与前端 `assets/app.js` 完全一致

## 目录结构

```
mingzi/
├─ index.html            首页 = 生成器 + 三档付费 + waitlist + FAQ
├─ site-config.js        上线前唯一要改的文件（站点URL/商店URL/邮箱）
├─ assets/
│  ├─ style.css          纸面+朱砂设计系统
│  └─ app.js             生成器 + Canvas 分享卡（4:5 / 9:16 / 3:1 三尺寸导出）
├─ data/
│  ├─ hanzi.tsv          字库 v1：177 字 × 字/拼音/声调/性别/标签/英文释义
│  ├─ names.txt          609 个英文名（构建时去重取前 500）
│  ├─ hanzi.json         构建产物（前端运行时用）
│  └─ names.json         构建产物（名册映射，保证首页与 /name/ 页一致）
├─ name/{slug}/index.html  500 个 SEO 长尾页（"Emma in Chinese" 式）
├─ samples/              3 张付费成品样张（直接当 Lemon Squeezy 商品图）
├─ tools/
│  ├─ build.py           构建：定名算法 + 500 页 + sitemap + IndexNow key
│  └─ make_samples.py    样张渲染（Pillow + 楷体）
├─ sitemap.xml           --site-url 提供后生成
└─ {indexnow-key}.txt    IndexNow 验证文件（构建自动生成）
```

## 本地跑

```powershell
python tools/build.py          # 生成 500 页 + 数据 JSON + IndexNow key
python -m http.server 8809     # http://localhost:8809
```

## 上线状态（2026-11-17）

- **GitHub Pages**: https://purecafe2020.github.io/mingzi/ （✅ 已开通，index/长尾页线上 200；SEO canonical/sitemap 均指向此地址）
- **Vercel**: https://mingzi-ruddy.vercel.app （✅ 已部署，双线热备）
- **收录**：IndexNow 已提交（HTTP 202）；Bing Webmaster Tools 提交 sitemap 待办（需登录微软账号）
- **待办**：Vercel 自动部署——先在 vercel.com → Settings → Login Connections 绑定 GitHub 登录方式，再跑 `vercel git connect`
- **代理备注**：本仓库 git 配置了 `http.proxy http://127.0.0.1:17890`；代理端口变了记得同步改（`git config http.proxy http://127.0.0.1:<新端口>`）

## 部署（GitHub Pages）

1. 建仓库 `mingzi`，推送本目录。
2. Settings → Pages → Deploy from branch → main /root。
3. 拿到正式地址后**重建**（生成 sitemap 与每页 canonical）并提交：
   ```powershell
   python tools/build.py --site-url https://<你的用户名>.github.io/mingzi
   ```
4. 改 `site-config.js`：`siteUrl`（分享卡角标）、`storeUrl`（Lemon Squeezy 商品页）、
   `contactEmail`（waitlist 走 formsubmit.co 免费通道，首次提交后需到邮箱激活一次）。

## 收录（无代理环境下的打法，见《流量与推广逻辑 v1》）

- Bing Webmaster Tools 提交 `sitemap.xml`（Bing 数据兼喂 DuckDuckGo）。
- IndexNow：仓库根的 `{key}.txt` 即验证文件；推送收录一行 curl 即可：
  `curl "https://api.bing.com/indexnow?url=<页面URL>&key=<key>"`
- Google：Search Console 本网络不可用，靠自然爬取；数据面板用 Bing + Cloudflare Web Analytics 代理。

## 付费成品（样张见 samples/）

| 商品 | 价格 | 内容 |
|---|---|---|
| Signature + meaning | $4.9 | 签名卡 + 逐字释义 |
| Name certificate | $9.9 | 签名 + 表字 + 《说文》等出处 + 印章图 + 发音音频 + A4 证书 |
| Human-reviewed | $19.9 | 全套 + 逐行人工复核 + 一轮修改（每周限量） |

衍生品路线（已定稿）：角色名/道号 → 纹身安全卡 → 印章/书法横幅 → 教师班级包 → 宠物名证书 → 字源卡组 → 双语名片。字库七字段已为此预留。

## 已知边界（诚实口径）

- 字库 177 字、姓氏 26 声母映射池：名字组合多样性够 v1 用，扩池 = 改 `hanzi.tsv` 重跑构建。
- 声调搭配与避讳是规则扫描，不是人工把关——人工把关是 $19.9 档卖的东西。
- 站内楷体依赖访客系统字体栈，海外无楷体时退化为衬线体；要统一观感，v1.1 再内嵌思源宋体子集。
