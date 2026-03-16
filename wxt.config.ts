import { defineConfig } from 'wxt';
import UnoCSS from 'unocss/vite';

export default defineConfig({
  outDir: 'dist',
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: 'CFly Space',
    description: '浏览器办公辅助插件 - JSON格式化、时间戳转换、喝水提醒',
    permissions: ['storage', 'alarms', 'notifications', 'contextMenus'],
  },
  vite: () => ({
    plugins: [UnoCSS()],
  }),
});
