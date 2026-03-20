export interface HttpStatusCode {
  code: number;
  name: string;
  category: '1xx' | '2xx' | '3xx' | '4xx' | '5xx';
  description: string;
  scenario: string;
  cause?: string;
  fix?: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
  '1xx': '#3b82f6',
  '2xx': '#22c55e',
  '3xx': '#f59e0b',
  '4xx': '#ef4444',
  '5xx': '#8b5cf6',
};

export const CATEGORY_LABELS: Record<string, string> = {
  '1xx': '信息',
  '2xx': '成功',
  '3xx': '重定向',
  '4xx': '客户端错误',
  '5xx': '服务端错误',
};

export const HTTP_STATUS_CODES: HttpStatusCode[] = [
  // 1xx
  { code: 100, name: 'Continue', category: '1xx', description: '服务器已收到请求头，客户端应继续发送请求体', scenario: '大文件上传前的预检', cause: undefined, fix: undefined },
  { code: 101, name: 'Switching Protocols', category: '1xx', description: '服务器同意切换协议', scenario: 'WebSocket 连接建立', cause: undefined, fix: undefined },

  // 2xx
  { code: 200, name: 'OK', category: '2xx', description: '请求成功', scenario: '常规 GET/POST 请求成功返回', cause: undefined, fix: undefined },
  { code: 201, name: 'Created', category: '2xx', description: '资源创建成功', scenario: 'POST 创建新资源后返回', cause: undefined, fix: undefined },
  { code: 204, name: 'No Content', category: '2xx', description: '成功但无返回内容', scenario: 'DELETE 请求成功、PUT 更新成功', cause: undefined, fix: undefined },
  { code: 206, name: 'Partial Content', category: '2xx', description: '返回部分内容', scenario: '断点续传、Range 请求', cause: undefined, fix: undefined },

  // 3xx
  { code: 301, name: 'Moved Permanently', category: '3xx', description: '资源已永久迁移到新 URL', scenario: '域名更换、URL 结构调整', cause: '资源地址已变更', fix: '更新请求 URL 为新地址' },
  { code: 302, name: 'Found', category: '3xx', description: '资源临时重定向', scenario: '登录后跳转、临时维护页', cause: '服务器临时将请求转到其他地址', fix: '继续使用原 URL，浏览器会自动跟随' },
  { code: 304, name: 'Not Modified', category: '3xx', description: '资源未修改，使用缓存', scenario: '浏览器缓存验证（If-Modified-Since）', cause: '资源自上次请求以来未变化', fix: '正常行为，不需要修复' },
  { code: 307, name: 'Temporary Redirect', category: '3xx', description: '临时重定向，保持请求方法不变', scenario: 'HTTPS 强制跳转', cause: undefined, fix: undefined },
  { code: 308, name: 'Permanent Redirect', category: '3xx', description: '永久重定向，保持请求方法不变', scenario: 'API 版本迁移', cause: undefined, fix: undefined },

  // 4xx
  { code: 400, name: 'Bad Request', category: '4xx', description: '请求参数错误或格式不正确', scenario: '表单提交参数缺失、JSON 格式错误', cause: '请求语法错误、参数类型不匹配、缺少必填字段', fix: '检查请求参数格式和必填字段' },
  { code: 401, name: 'Unauthorized', category: '4xx', description: '未认证，需要登录凭证', scenario: '未携带 Token 或 Token 过期', cause: '缺少认证信息或认证信息无效', fix: '检查 Token/Cookie 是否过期，重新登录' },
  { code: 403, name: 'Forbidden', category: '4xx', description: '已认证但无权限访问', scenario: '普通用户访问管理员接口', cause: '当前用户角色无权访问该资源', fix: '检查用户权限配置，联系管理员授权' },
  { code: 404, name: 'Not Found', category: '4xx', description: '请求的资源不存在', scenario: '访问已删除的资源、URL 拼写错误', cause: 'URL 路径错误、资源已被删除', fix: '检查 URL 拼写、确认资源是否存在' },
  { code: 405, name: 'Method Not Allowed', category: '4xx', description: '请求方法不被允许', scenario: '对只支持 GET 的接口发送 POST 请求', cause: '接口不支持当前 HTTP 方法', fix: '检查 API 文档确认支持的 HTTP 方法' },
  { code: 408, name: 'Request Timeout', category: '4xx', description: '请求超时', scenario: '客户端发送请求时间过长', cause: '网络慢、请求体过大', fix: '检查网络状况，减少请求体大小' },
  { code: 409, name: 'Conflict', category: '4xx', description: '请求与当前资源状态冲突', scenario: '并发更新同一资源', cause: '版本冲突、唯一约束冲突', fix: '重新获取最新数据后再提交' },
  { code: 413, name: 'Payload Too Large', category: '4xx', description: '请求体超过服务器限制', scenario: '上传大文件超过限制', cause: '请求体大小超过 Nginx/服务器配置限制', fix: '调整服务器上传大小限制或压缩请求体' },
  { code: 415, name: 'Unsupported Media Type', category: '4xx', description: '不支持的媒体类型', scenario: 'Content-Type 设置错误', cause: '请求的 Content-Type 不被接口支持', fix: '检查 Content-Type 是否与 API 要求一致' },
  { code: 422, name: 'Unprocessable Entity', category: '4xx', description: '请求格式正确但语义错误', scenario: '业务规则校验失败', cause: '字段值不符合业务规则', fix: '检查请求数据是否符合业务要求' },
  { code: 429, name: 'Too Many Requests', category: '4xx', description: '请求频率超过限制', scenario: '短时间内大量调用接口', cause: '触发了服务端的速率限制', fix: '降低请求频率，添加重试退避机制' },

  // 5xx
  { code: 500, name: 'Internal Server Error', category: '5xx', description: '服务器内部错误', scenario: '后端代码异常未捕获', cause: '空指针、数据库异常、未处理的异常', fix: '查看服务端日志定位异常' },
  { code: 502, name: 'Bad Gateway', category: '5xx', description: '网关/代理收到无效响应', scenario: 'Nginx 反代的后端服务挂了', cause: '上游服务不可用或返回无效响应', fix: '检查上游服务是否正常运行' },
  { code: 503, name: 'Service Unavailable', category: '5xx', description: '服务暂时不可用', scenario: '服务重启、部署中、过载', cause: '服务器过载或正在维护', fix: '稍后重试，检查服务健康状态' },
  { code: 504, name: 'Gateway Timeout', category: '5xx', description: '网关/代理等待上游超时', scenario: '后端处理时间过长', cause: '上游服务响应太慢', fix: '优化后端接口性能或增加超时配置' },
];
