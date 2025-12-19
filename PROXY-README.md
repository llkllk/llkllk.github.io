# iframe 代理服务器使用说明

## 问题描述

当在 iframe 中嵌入跨域网站时，JavaScript 无法访问 iframe 内部的 DOM，导致无法通过注入 `<base target="_self">` 来控制链接跳转行为。

## 解决方案

使用服务器端代理，在返回 HTML 之前自动注入 `<base target="_self">` 标签。

## 使用方法

### 1. 启动代理服务器

```bash
# 方法 1: 使用 npm
npm start

# 方法 2: 直接运行
node proxy.js
```

服务器将在 `http://localhost:3000` 启动。

### 2. 使用代理页面

#### 方式 A: 使用 Safeurl-proxy.html（推荐）

访问: `Safeurl-proxy.html?url=https://example.com`

#### 方式 B: 直接访问代理服务器

访问: `http://localhost:3000/?url=https://example.com`

### 3. 自定义代理服务器地址

如果代理服务器部署在其他地址，可以通过 `proxy` 参数指定：

```
Safeurl-proxy.html?url=https://example.com&proxy=https://your-proxy-server.com
```

## 文件说明

- **proxy.js** - Node.js 代理服务器
- **Safeurl-proxy.html** - 使用代理的 iframe 页面
- **Safeurl.html** - 原始页面（适用于同源情况）

## 工作原理

1. 用户访问 `Safeurl-proxy.html?url=目标网址`
2. 页面通过 iframe 加载 `http://localhost:3000/?url=目标网址`
3. 代理服务器获取目标网站的 HTML
4. 在 `<head>` 标签中自动注入 `<base target="_self">`
5. 返回修改后的 HTML 给 iframe
6. iframe 内的所有链接默认在 iframe 内打开

## 注意事项

### 1. 资源加载问题

基础版代理只注入 base 标签到主 HTML，如果目标网站的资源使用相对路径，可能会加载失败。

**解决方法：**
- 在 proxy.js 中添加 HTML base href: `<base href="目标网站域名">`
- 或使用更完善的代理方案（如 nginx 反向代理）

### 2. 生产环境部署

将代理服务器部署到公网服务器：

```bash
# 安装 pm2
npm install -g pm2

# 启动服务
pm2 start proxy.js --name iframe-proxy

# 设置开机自启
pm2 startup
pm2 save
```

### 3. 端口配置

修改 proxy.js 中的 `PORT` 变量来更改端口：

```javascript
const PORT = 3000; // 改为你需要的端口
```

## 示例

```
# 本地测试
Safeurl-proxy.html?url=https://yunnan-newenergy.app.yidev.cn

# 生产环境（假设代理部署在 proxy.yidev.cn）
Safeurl-proxy.html?url=https://yunnan-newenergy.app.yidev.cn&proxy=https://proxy.yidev.cn
```

## 故障排查

### 问题: 页面显示空白

- 检查代理服务器是否正常运行
- 查看浏览器控制台错误信息
- 确认目标 URL 是否可访问

### 问题: 资源加载失败（CSS/JS/图片）

需要添加 `<base href>` 标签，修改 proxy.js:

```javascript
const baseTag = `<base target="_self" href="${targetParsed.protocol}//${targetParsed.host}">`;
```

### 问题: CORS 错误

代理服务器已设置 `Access-Control-Allow-Origin: *`，如果仍有问题，检查目标网站的 CSP 策略。
