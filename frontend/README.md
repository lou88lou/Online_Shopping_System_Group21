建议结构：

- 将现有前端项目 `cart/` 移动到本目录下，成为 `frontend/cart/`。

在 Windows PowerShell 中移动：

```powershell
Move-Item cart frontend
```

移动后，可在 `frontend/cart` 里继续使用现有的 `package.json`、`npm` 脚本等。
