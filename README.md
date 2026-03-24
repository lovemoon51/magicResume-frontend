# Magic Resume Frontend

这个项目已支持部署到 GitHub Pages，并可通过外网访问。

## 1. 推送到 GitHub

在项目根目录执行：

```bash
git add .
git commit -m "feat: add github pages deployment"
```

创建你的 GitHub 仓库后，绑定远程并推送：

```bash
git remote add origin <你的仓库地址>
git push -u origin master
```

例如：

- HTTPS: `https://github.com/<your-name>/<your-repo>.git`
- SSH: `git@github.com:<your-name>/<your-repo>.git`

## 2. 开启 GitHub Pages

1. 打开仓库 `Settings` -> `Pages`
2. 在 `Build and deployment` 中选择 `Source: GitHub Actions`
3. 等待 Actions 里的 `Deploy GitHub Pages` 工作流完成

部署完成后，访问：

`https://<your-name>.github.io/<your-repo>/`

## 3. 静态部署说明

- Pages 环境下，页面会自动使用本地模板数据（`apps/web/public/seed-resume.json`）
- `保存` 会写入浏览器本地存储
- `导出 PDF` 需要后端服务，GitHub Pages 上不可用

如果需要在线导出 PDF，请把 `scripts/demo-server.mjs` 对应的 Node 服务部署到 Render/Railway/Fly.io 等平台。
