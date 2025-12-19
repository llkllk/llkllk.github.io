const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

// 创建代理服务器
const server = http.createServer((req, res) => {
  // 获取目标 URL
  const parsedUrl = url.parse(req.url, true);
  const targetUrl = parsedUrl.query.url;

  if (!targetUrl) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('缺少 url 参数。用法: http://localhost:3000/?url=https://example.com');
    return;
  }

  console.log('代理请求:', targetUrl);

  // 解析目标 URL
  const targetParsed = url.parse(targetUrl);
  const protocol = targetParsed.protocol === 'https:' ? https : http;

  // 发起请求
  const options = {
    hostname: targetParsed.hostname,
    port: targetParsed.port || (targetParsed.protocol === 'https:' ? 443 : 80),
    path: targetParsed.path,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    }
  };

  const proxyReq = protocol.request(options, (proxyRes) => {
    const contentType = proxyRes.headers['content-type'] || '';

    // 只处理 HTML 内容
    if (contentType.includes('text/html')) {
      let body = '';
      proxyRes.setEncoding('utf8');

      proxyRes.on('data', (chunk) => {
        body += chunk;
      });

      proxyRes.on('end', () => {
        // 注入 <base> 标签：设置 href 确保资源正确加载，设置 target 控制链接跳转
        const baseUrl = `${targetParsed.protocol}//${targetParsed.host}`;
        const baseTag = `<base href="${baseUrl}" target="_self">`;

        // 尝试在 <head> 标签后插入
        if (body.includes('<head>')) {
          body = body.replace('<head>', `<head>${baseTag}`);
        } else if (body.includes('<HEAD>')) {
          body = body.replace('<HEAD>', `<HEAD>${baseTag}`);
        } else if (body.includes('<html>')) {
          // 如果没有 head 标签，在 html 后插入
          body = body.replace('<html>', `<html><head>${baseTag}</head>`);
        } else {
          // 如果都没有，在文档开头插入
          body = baseTag + body;
        }

        // 设置响应头
        res.writeHead(200, {
          'Content-Type': contentType,
          'Content-Length': Buffer.byteLength(body),
          'Access-Control-Allow-Origin': '*',
        });
        res.end(body);
      });
    } else {
      // 非 HTML 内容直接转发
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    }
  });

  proxyReq.on('error', (err) => {
    console.error('代理请求错误:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`代理请求失败: ${err.message}`);
  });

  proxyReq.end();
});

server.listen(PORT, () => {
  console.log(`代理服务器运行在 http://localhost:${PORT}`);
  console.log(`用法: http://localhost:${PORT}/?url=https://example.com`);
});
