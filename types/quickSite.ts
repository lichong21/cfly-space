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

export const DEFAULT_QUICK_SITE_STATE: QuickSiteState = {
  sites: [],
  groups: [
    { id: DEFAULT_GROUP_ID, name: '未分组', order: 0, collapsed: false },
  ],
};
