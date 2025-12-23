import { beforeAll, afterEach, vi } from 'vitest';

// Mock Obsidian API globally
beforeAll(() => {
  // Mock Notice
  vi.mock('obsidian', () => ({
    Notice: class Notice {
      constructor(message: string) {
        console.log('Notice:', message);
      }
    },
    Plugin: class Plugin {
      app: any;
      manifest: any;

      constructor(app: any, manifest: any) {
        this.app = app;
        this.manifest = manifest;
      }

      loadData() { 
        return Promise.resolve({}); 
      }

      saveData(data: any) { 
        return Promise.resolve(); 
      }

      addCommand(cmd: any) {
        console.log('Command registered:', cmd.id);
      }

      addSettingTab(tab: any) {
        console.log('Setting tab registered');
      }

      registerEvent(event: any) {}
    },

    PluginSettingTab: class PluginSettingTab {
      app: any;
      plugin: any;

      constructor(app: any, plugin: any) {
        this.app = app;
        this.plugin = plugin;
      }

      display() {}
    },

    Modal: class Modal {
      app: any;
      titleEl: any = { setText: vi.fn() };
      contentEl: any = {
        setText: vi.fn(),
        createEl: vi.fn((tag: string, opts?: any) => ({
          value: '',
          onclick: null,
          oninput: null,
          setText: vi.fn(),
          empty: vi.fn(),
          createDiv: vi.fn(() => ({
            setText: vi.fn(),
            onclick: null,
            empty: vi.fn(),
            createDiv: vi.fn()
          }))
        })),
        empty: vi.fn()
      };

      constructor(app: any) {
        this.app = app;
      }

      open() {}
      close() {}
      onOpen() {}
      onClose() {}
    },

    Setting: class Setting {
      constructor(containerEl: any) {}
      setName(name: string) { return this; }
      setDesc(desc: string) { return this; }
      addText(cb: any) {
        cb({
          setPlaceholder: vi.fn().mockReturnThis(),
          setValue: vi.fn().mockReturnThis(),
          onChange: vi.fn().mockReturnThis()
        });
        return this;
      }
    },

    App: vi.fn(),
    TFile: vi.fn(),
    Vault: vi.fn(),
    Editor: vi.fn(),
    MarkdownView: vi.fn()
  }));

  // Mock @sekha/sdk
  vi.mock('@sekha/sdk', () => ({
    MemoryController: vi.fn().mockImplementation(() => ({
      getConversation: vi.fn(),
      search: vi.fn(),
      listConversations: vi.fn()
    }))
  }));

  // Mock global navigator using globalThis
  (globalThis as any).navigator = {
    clipboard: {
      writeText: vi.fn(() => Promise.resolve())
    }
  };
});

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});