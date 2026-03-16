import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import type { QuickSite, SiteGroup, QuickSiteState } from '@/types/quickSite';
import { DEFAULT_QUICK_SITE_STATE, DEFAULT_GROUP_ID } from '@/types/quickSite';

const STORAGE_KEY = 'quickSites';

export const useQuickSiteStore = defineStore('quickSite', () => {
  const state = ref<QuickSiteState>(structuredClone(DEFAULT_QUICK_SITE_STATE));

  // Restore from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        const saved = result[STORAGE_KEY] as QuickSiteState;
        state.value = {
          sites: saved.sites || [],
          groups: saved.groups?.length ? saved.groups : structuredClone(DEFAULT_QUICK_SITE_STATE.groups),
        };
      }
    });
  }

  // Persist changes
  watch(state, (val) => {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ [STORAGE_KEY]: val });
    }
  }, { deep: true });

  // ---- Site actions ----

  function addSite(name: string, url: string, groupId: string = DEFAULT_GROUP_ID) {
    const maxOrder = state.value.sites
      .filter(s => s.groupId === groupId)
      .reduce((max, s) => Math.max(max, s.order), -1);
    state.value.sites.push({
      id: crypto.randomUUID(),
      name,
      url,
      groupId,
      order: maxOrder + 1,
      createdAt: Date.now(),
    });
  }

  function updateSite(id: string, updates: Partial<Pick<QuickSite, 'name' | 'url' | 'groupId'>>) {
    const site = state.value.sites.find(s => s.id === id);
    if (site) {
      Object.assign(site, updates);
    }
  }

  function removeSite(id: string) {
    state.value.sites = state.value.sites.filter(s => s.id !== id);
  }

  // ---- Group actions ----

  function addGroup(name: string) {
    const maxOrder = state.value.groups.reduce((max, g) => Math.max(max, g.order), -1);
    const group: SiteGroup = {
      id: crypto.randomUUID(),
      name,
      order: maxOrder + 1,
      collapsed: false,
    };
    state.value.groups.push(group);
    return group.id;
  }

  function updateGroup(id: string, updates: Partial<Pick<SiteGroup, 'name'>>) {
    const group = state.value.groups.find(g => g.id === id);
    if (group) {
      Object.assign(group, updates);
    }
  }

  function removeGroup(id: string) {
    if (id === DEFAULT_GROUP_ID) return;
    // Move sites to ungrouped
    state.value.sites.forEach(s => {
      if (s.groupId === id) s.groupId = DEFAULT_GROUP_ID;
    });
    state.value.groups = state.value.groups.filter(g => g.id !== id);
  }

  function toggleGroupCollapse(id: string) {
    const group = state.value.groups.find(g => g.id === id);
    if (group) {
      group.collapsed = !group.collapsed;
    }
  }

  return {
    state,
    addSite,
    updateSite,
    removeSite,
    addGroup,
    updateGroup,
    removeGroup,
    toggleGroupCollapse,
  };
});
