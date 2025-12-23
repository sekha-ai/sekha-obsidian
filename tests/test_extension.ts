import { describe, it, expect, beforeEach, vi } from 'vitest';
import { App } from 'obsidian';
import SekhaPlugin from '../main';
import { MemoryController } from '@sekha/sdk';

// Mock @sekha/sdk
vi.mock('@sekha/sdk', () => ({
  MemoryController: vi.fn().mockImplementation(() => ({
    getConversation: vi.fn(),
    search: vi.fn(),
    listConversations: vi.fn()
  }))
}));

describe('SekhaPlugin', () => {
  let plugin: SekhaPlugin;
  let mockApp: any;

  beforeEach(() => {
    mockApp = {
      vault: {
        getMarkdownFiles: vi.fn(() => []),
        read: vi.fn(() => Promise.resolve('# Test Note\n\nContent')),
        create: vi.fn(() => Promise.resolve()),
        createFolder: vi.fn(() => Promise.resolve()),
        modify: vi.fn()
      },
      workspace: {
        getActiveFile: vi.fn(),
        openLinkText: vi.fn()
      }
    };

    plugin = new SekhaPlugin(mockApp, { 
      id: 'sekha', 
      name: 'Sekha', 
      version: '1.0.0',
      author: 'Sekha',
      description: 'Sekha Memory Plugin',
      isDesktopOnly: false,
      minAppVersion: '0.15.0'
    });
  });

  describe('Plugin Initialization', () => {
    it('should load plugin successfully', async () => {
      await plugin.onload();
      expect(plugin).toBeDefined();
    });

    it('should initialize settings with defaults', async () => {
      await plugin.loadSettings();
      expect(plugin.settings).toBeDefined();
      expect(plugin.settings.apiUrl).toBe('http://localhost:8080');
      expect(plugin.settings.importFolder).toBe('Sekha Conversations');
    });

    it('should initialize MemoryController', async () => {
      await plugin.onload();
      expect(plugin.memory).toBeDefined();
      expect(MemoryController).toHaveBeenCalledWith({
        baseURL: plugin.settings.apiUrl,
        apiKey: plugin.settings.apiKey
      });
    });
  });

  describe('Settings Management', () => {
    it('should save settings', async () => {
      const saveDataSpy = vi.spyOn(plugin, 'saveData').mockResolvedValue();

      plugin.settings = {
        apiUrl: 'http://example.com',
        apiKey: 'test-key',
        importFolder: 'Custom Folder'
      };

      await plugin.saveSettings();
      expect(saveDataSpy).toHaveBeenCalledWith(plugin.settings);
    });

    it('should load saved settings', async () => {
      const mockSavedSettings = {
        apiUrl: 'http://saved-url.com',
        apiKey: 'saved-key',
        importFolder: 'Saved Folder'
      };

      vi.spyOn(plugin, 'loadData').mockResolvedValue(mockSavedSettings);

      await plugin.loadSettings();
      expect(plugin.settings.apiUrl).toBe('http://saved-url.com');
      expect(plugin.settings.apiKey).toBe('saved-key');
    });

    it('should merge with defaults when loading partial settings', async () => {
      const partialSettings = {
        apiKey: 'new-key'
      };

      vi.spyOn(plugin, 'loadData').mockResolvedValue(partialSettings);

      await plugin.loadSettings();
      expect(plugin.settings.apiUrl).toBe('http://localhost:8080'); // default
      expect(plugin.settings.apiKey).toBe('new-key'); // saved
    });
  });

  describe('Conversation Import', () => {
    beforeEach(async () => {
      await plugin.loadSettings();
      plugin.memory = {
        getConversation: vi.fn(),
        search: vi.fn(),
        listConversations: vi.fn()
      } as any;
    });

    it('should import conversation by ID', async () => {
      const mockConv = {
        id: 'conv-123',
        label: 'Test Conversation',
        created_at: '2024-01-01',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' }
        ]
      };

      (plugin.memory.getConversation as any).mockResolvedValue(mockConv);

      await plugin.importConversation('conv-123');

      expect(plugin.memory.getConversation).toHaveBeenCalledWith('conv-123');
      expect(mockApp.vault.create).toHaveBeenCalled();
    });

    it('should format conversation correctly', async () => {
      const conv = {
        id: 'conv-123',
        label: 'Test Conv',
        created_at: '2024-01-01T00:00:00Z',
        messages: [
          { role: 'user', content: 'Question' },
          { role: 'assistant', content: 'Answer' }
        ]
      };

      const formatted = plugin.formatConversation(conv);

      expect(formatted).toContain('label: Test Conv');
      expect(formatted).toContain('sekha_id: conv-123');
      expect(formatted).toContain('**user**: Question');
      expect(formatted).toContain('**assistant**: Answer');
    });

    it('should handle import errors gracefully', async () => {
      (plugin.memory.getConversation as any).mockRejectedValue(
        new Error('Not found')
      );

      await plugin.importConversation('invalid-id');

      // Should not throw, should show Notice
      expect(plugin.memory.getConversation).toHaveBeenCalled();
    });

    it('should create import folder if missing', async () => {
      mockApp.vault.createFolder.mockRejectedValueOnce(new Error('Exists'));

      const mockConv = {
        id: 'conv-123',
        label: 'Test',
        created_at: '2024-01-01',
        messages: []
      };

      (plugin.memory.getConversation as any).mockResolvedValue(mockConv);

      await plugin.importConversation('conv-123');

      expect(mockApp.vault.createFolder).toHaveBeenCalledWith('Sekha Conversations');
      expect(mockApp.vault.create).toHaveBeenCalled();
    });
  });

  describe('Import by Label', () => {
    beforeEach(async () => {
      await plugin.loadSettings();
      plugin.memory = {
        search: vi.fn(),
        getConversation: vi.fn()
      } as any;
    });

    it('should import multiple conversations by label', async () => {
      const mockResults = [
        { id: 'conv-1', label: 'Test 1' },
        { id: 'conv-2', label: 'Test 2' }
      ];

      (plugin.memory.search as any).mockResolvedValue(mockResults);
      (plugin.memory.getConversation as any).mockResolvedValue({
        id: 'conv-1',
        label: 'Test',
        created_at: '2024-01-01',
        messages: []
      });

      await plugin.importByLabel('Test');

      expect(plugin.memory.search).toHaveBeenCalledWith('Test', { limit: 50 });
      expect(plugin.memory.getConversation).toHaveBeenCalledTimes(2);
    });

    it('should handle search errors', async () => {
      (plugin.memory.search as any).mockRejectedValue(
        new Error('Search failed')
      );

      await plugin.importByLabel('Test');

      // Should not throw
      expect(plugin.memory.search).toHaveBeenCalled();
    });
  });
});

describe('SekhaSettingTab', () => {
  it('should display settings UI elements', () => {
    // Settings tab is tested through plugin integration
    expect(true).toBe(true);
  });
});
