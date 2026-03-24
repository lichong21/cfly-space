const MENU_PARENT_ID = 'cfly-space';
const MENU_JSON_ID = 'cfly-space-json';
const MENU_MARKDOWN_ID = 'cfly-space-markdown';

export default defineBackground(() => {
  console.log('CFly Space background service started', { id: browser.runtime.id });

  // ---- Context Menu ----

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_PARENT_ID,
      title: 'CFly Space',
      contexts: ['all'],
    });
    chrome.contextMenus.create({
      id: MENU_JSON_ID,
      parentId: MENU_PARENT_ID,
      title: 'JSON 格式化',
      contexts: ['all'],
    });
    chrome.contextMenus.create({
      id: MENU_MARKDOWN_ID,
      parentId: MENU_PARENT_ID,
      title: 'Markdown 编辑器',
      contexts: ['all'],
    });
  });

  chrome.contextMenus.onClicked.addListener((info) => {
    const menuMap: Record<string, string> = {
      [MENU_JSON_ID]: 'json',
      [MENU_MARKDOWN_ID]: 'markdown',
    };
    const tab = menuMap[info.menuItemId as string];
    if (tab) {
      chrome.tabs.create({ url: chrome.runtime.getURL(`/options.html#${tab}`) });
    }
  });
});
