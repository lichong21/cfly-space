export interface QuickSite {
  id: string;           // 唯一标识（UUID）
  name: string;         // 网站名称
  url: string;          // 网站地址
  groupId: string;      // 所属分组 ID
  order: number;        // 排序序号
  createdAt: number;    // 创建时间戳
}

export interface SiteGroup {
  id: string;           // 分组 ID
  name: string;         // 分组名称
  order: number;        // 分组排序序号
  collapsed: boolean;   // 是否折叠
}

export interface QuickSiteState {
  sites: QuickSite[];
  groups: SiteGroup[];
}

export const DEFAULT_GROUP_ID = 'ungrouped';

// 预置分组 ID
const GROUP_DOCS = 'group-docs';
const GROUP_TOOLS = 'group-tools';
const GROUP_UI = 'group-ui';
const GROUP_EFFICIENCY = 'group-efficiency';

const now = Date.now();

export const DEFAULT_QUICK_SITE_STATE: QuickSiteState = {
  groups: [
    { id: GROUP_DOCS, name: '开发文档', order: 0, collapsed: false },
    { id: GROUP_TOOLS, name: '工具平台', order: 1, collapsed: false },
    { id: GROUP_UI, name: 'UI & 设计', order: 2, collapsed: false },
    { id: GROUP_EFFICIENCY, name: '效率工具', order: 3, collapsed: false },
    { id: DEFAULT_GROUP_ID, name: '未分组', order: 4, collapsed: false },
  ],
  sites: [
    // 开发文档
    { id: 'site-01', name: 'MDN Web Docs', url: 'https://developer.mozilla.org', groupId: GROUP_DOCS, order: 0, createdAt: now },
    { id: 'site-02', name: 'Vue 3 文档', url: 'https://vuejs.org', groupId: GROUP_DOCS, order: 1, createdAt: now },
    { id: 'site-03', name: 'React 文档', url: 'https://react.dev', groupId: GROUP_DOCS, order: 2, createdAt: now },
    { id: 'site-04', name: 'React Native', url: 'https://reactnative.dev', groupId: GROUP_DOCS, order: 3, createdAt: now },
    { id: 'site-05', name: 'TypeScript', url: 'https://www.typescriptlang.org', groupId: GROUP_DOCS, order: 4, createdAt: now },
    { id: 'site-06', name: 'Vite', url: 'https://vite.dev', groupId: GROUP_DOCS, order: 5, createdAt: now },
    // 工具平台
    { id: 'site-07', name: 'GitHub', url: 'https://github.com', groupId: GROUP_TOOLS, order: 0, createdAt: now },
    { id: 'site-08', name: 'npm', url: 'https://www.npmjs.com', groupId: GROUP_TOOLS, order: 1, createdAt: now },
    { id: 'site-09', name: 'StackOverflow', url: 'https://stackoverflow.com', groupId: GROUP_TOOLS, order: 2, createdAt: now },
    { id: 'site-10', name: 'Can I Use', url: 'https://caniuse.com', groupId: GROUP_TOOLS, order: 3, createdAt: now },
    { id: 'site-11', name: 'Bundlephobia', url: 'https://bundlephobia.com', groupId: GROUP_TOOLS, order: 4, createdAt: now },
    { id: 'site-12', name: 'Regex101', url: 'https://regex101.com', groupId: GROUP_TOOLS, order: 5, createdAt: now },
    // UI & 设计
    { id: 'site-13', name: 'Tailwind CSS', url: 'https://tailwindcss.com', groupId: GROUP_UI, order: 0, createdAt: now },
    { id: 'site-14', name: 'Ant Design', url: 'https://ant-design.antgroup.com', groupId: GROUP_UI, order: 1, createdAt: now },
    { id: 'site-15', name: 'Element Plus', url: 'https://element-plus.org', groupId: GROUP_UI, order: 2, createdAt: now },
    { id: 'site-16', name: 'Figma', url: 'https://www.figma.com', groupId: GROUP_UI, order: 3, createdAt: now },
    { id: 'site-17', name: 'IconFont', url: 'https://www.iconfont.cn', groupId: GROUP_UI, order: 4, createdAt: now },
    { id: 'site-18', name: 'Lucide Icons', url: 'https://lucide.dev', groupId: GROUP_UI, order: 5, createdAt: now },
    // 效率工具
    { id: 'site-19', name: 'JSON Formatter', url: 'https://jsonformatter.org', groupId: GROUP_EFFICIENCY, order: 0, createdAt: now },
    { id: 'site-20', name: 'TinyPNG', url: 'https://tinypng.com', groupId: GROUP_EFFICIENCY, order: 1, createdAt: now },
    { id: 'site-21', name: 'Carbon', url: 'https://carbon.now.sh', groupId: GROUP_EFFICIENCY, order: 2, createdAt: now },
    { id: 'site-22', name: 'CodePen', url: 'https://codepen.io', groupId: GROUP_EFFICIENCY, order: 3, createdAt: now },
    { id: 'site-23', name: 'StackBlitz', url: 'https://stackblitz.com', groupId: GROUP_EFFICIENCY, order: 4, createdAt: now },
  ],
};
