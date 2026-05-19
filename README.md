# Copilot Fallback

> 当 Copilot 额度耗尽，你的代码补全不中断

[![Installs](https://img.shields.io/visual-studio-marketplace/i/copilot-fallback?color=007ACC)](https://marketplace.visualstudio.com/items?itemName=copilot-fallback.copilot-fallback)
[![Rating](https://img.shields.io/visual-studio-marketplace/stars/copilot-fallback?color=FFB800)](https://marketplace.visualstudio.com/items?itemName=copilot-fallback.copilot-fallback)

---

## 🎯 解决的问题 

配置你的模型实现 copilot 内联建议相同的效果。

---

## ✨ 功能特性

### 多模型配置管理
- **添加多个模型配置** — 同时配置 OpenAI、Anthropic、自定义 API，想配多少配多少
- **一键切换** — 点击选择当前使用的模型，无需重复配置
- **编辑和删除** — 随时修改配置参数，支持测试连接

### 多 Provider 支持
- **OpenAI** — GPT-4o, GPT-4o-mini, GPT-3.5-turbo 等
- **Anthropic** — Claude 4, Claude 3.5 Sonnet, Claude 3 Haiku 等
- **自定义 API** — 任意 OpenAI 兼容接口（硅基流动、OneAPI、Azure 等）

### 智能切换
- 用户手动切换，完全可控
- 点击状态栏即可切换，无需复杂操作
- 无需重新配置，切换后立即生效

### 安全可靠
- API Key 存储在系统密钥链，不明文暴露
- 超时保护（3秒），不会阻塞你的输入
- API 调用失败自动降级，不影响 Copilot 恢复

---

## 🚀 快速开始

### 1. 安装

方式一：VS Code 扩展面板 → 点击 `···` → `Install from VSIX...` → 选择 `.vsix` 文件

方式二：命令行
```bash
code --install-extension copilot-fallback-0.0.1.vsix
```

### 2. 添加模型配置

1. 点击 VS Code 左侧边栏的 **Copilot Fallback** 图标
2. 点击「+ 添加模型配置」
3. 填写配置名称、选择 Provider、输入 API Key 和模型名称
4. 点击「测试连接」确认配置正确
5. 点击「保存」

### 3. 选择并启用

1. 在配置列表中点击选择要使用的模型
2. 点击状态栏的 `$(copilot) Copilot Fallback: OFF` 启用
3. 开始编码！

### 4. 切换模型

- 随时点击其他配置项即可切换
- 状态栏会显示当前选中的模型名称

---

## ⚙️ 配置说明

### 模型配置结构

```javascript
{
  id: "profile_xxx",           // 唯一标识
  name: "GPT-4o 工作",         // 配置名称
  provider: "openai",          // openai | anthropic | custom
  baseUrl: "https://...",      // Base URL（OpenAI/自定义）
  apiKey: "sk-...",            // API Key
  model: "gpt-4o-mini",       // 模型名称
  enabled: true                // 是否启用
}
```

### 配置存储

| 配置项 | 说明 |
|--------|------|
| `copilotFallback.enable` | 是否启用备用模式 |
| `copilotFallback.profiles` | 模型配置列表 |
| `copilotFallback.activeProfileId` | 当前选中的配置 ID |

---

## ❓ 常见问题

**Q: 为什么选择手动切换而不是自动？**
A: 自动检测需要定时探测或者等待 Copilot 报错，用户体验不够直接。手动切换让你完全掌控何时使用哪个模型，避免不必要的 API 消耗。

**Q: 会影响 Copilot 的聊天功能吗？**
A: 完全不会。本插件只接管内联代码补全事件，不影响 Copilot 的聊天机器人和代码解释功能。

**Q: API 额度用完会怎样？**
A: API 调用失败时插件会静默返回空结果，不阻塞编辑器。你可以切换回 Copilot 或更换 API Key。

**Q: 支持哪些 IDE？**
A: 目前仅支持 VS Code。

---

## 📋 系统要求

- VS Code 1.85.0 或更高版本
- Windows / macOS / Linux

---

## 📝 版本历史

### 0.0.2
- 新增多模型配置管理功能
- 支持同时配置多个模型，一键切换
- 重构配置界面，支持添加/编辑/删除配置
- 支持测试连接

### 0.0.1
- 初始版本
- 支持 OpenAI / Anthropic / Custom 三种 API
- 状态栏快速切换

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT