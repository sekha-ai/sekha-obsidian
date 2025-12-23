import { describe, it, expect, beforeEach, vi } from 'vitest';
import SekhaPlugin from '../main';

describe('Plugin Commands', () => {
  let plugin: SekhaPlugin;
  let mockApp: any;

  beforeEach(async () => {
    mockApp = {
      vault: {
        getMarkdownFiles: vi.fn(() => []),
        read: vi.fn(),
        create: vi.fn(),
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

    await plugin.loadSettings();

    plugin.memory = {
      getConversation: vi.fn(),
      search: vi.fn(),
      listConversations: vi.fn()
    } as any;
  });

  describe('Import Conversation Command', () => {
    it('should import conversation when ID provided', async () => {
      const mockConv = {
        id: 'conv-123',
        label: 'Test Conversation',
        created_at: '2024-01-01T00:00:00Z',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi' }
        ]
      };

      (plugin.memory.getConversation as any).mockResolvedValue(mockConv);

      await plugin.importConversation('conv-123');

      expect(plugin.memory.getConversation).toHaveBeenCalledWith('conv-123');
      expect(mockApp.vault.create).toHaveBeenCalled();

      const createCall = mockApp.vault.create.mock.calls[0];
      expect(createCall[0]).toContain('Sekha Conversations');
      expect(createCall[1]).toContain('Test Conversation');
    });

    it('should generate correct filename', async () => {
      const mockConv = {
        id: 'conv-12345678-abcd',
        label: 'My Test',
        created_at: '2024-01-01',
        messages: []
      };

      (plugin.memory.getConversation as any).mockResolvedValue(mockConv);

      await plugin.importConversation('conv-12345678-abcd');

      const filename = mockApp.vault.create.mock.calls[0][0];
      expect(filename).toContain('My Test_conv-1234');
      expect(filename).toContain('.md');
    });
  });

  describe('Import by Label Command', () => {
    it('should import all matching conversations', async () => {
      const mockResults = [
        { id: 'conv-1', label: 'Project:AI #1' },
        { id: 'conv-2', label: 'Project:AI #2' },
        { id: 'conv-3', label: 'Project:AI #3' }
      ];

      (plugin.memory.search as any).mockResolvedValue(mockResults);
      (plugin.memory.getConversation as any).mockResolvedValue({
        id: 'conv-1',
        label: 'Test',
        created_at: '2024-01-01',
        messages: []
      });

      await plugin.importByLabel('Project:AI');

      expect(plugin.memory.search).toHaveBeenCalledWith('Project:AI', { limit: 50 });
      expect(plugin.memory.getConversation).toHaveBeenCalledTimes(3);
    });

    it('should handle empty search results', async () => {
      (plugin.memory.search as any).mockResolvedValue([]);

      await plugin.importByLabel('NonExistent');

      expect(plugin.memory.getConversation).not.toHaveBeenCalled();
    });
  });

  describe('Search Command', () => {
    it('should perform search through memory controller', async () => {
      const mockResults = [
        { id: 'conv-1', label: 'Result 1', created_at: '2024-01-01' },
        { id: 'conv-2', label: 'Result 2', created_at: '2024-01-02' }
      ];

      (plugin.memory.search as any).mockResolvedValue(mockResults);

      const results = await plugin.memory.search('test query', { limit: 10 });

      expect(results).toHaveLength(2);
      expect(plugin.memory.search).toHaveBeenCalledWith('test query', { limit: 10 });
    });
  });

  describe('Conversation Formatting', () => {
    it('should format with frontmatter', () => {
      const conv = {
        id: 'conv-123',
        label: 'Test Conversation',
        created_at: '2024-01-01T12:00:00Z',
        messages: [
          { role: 'user', content: 'Question 1' },
          { role: 'assistant', content: 'Answer 1' }
        ]
      };

      const formatted = plugin.formatConversation(conv);

      expect(formatted).toContain('---');
      expect(formatted).toContain('label: Test Conversation');
      expect(formatted).toContain('created: 2024-01-01T12:00:00Z');
      expect(formatted).toContain('sekha_id: conv-123');
    });

    it('should format messages correctly', () => {
      const conv = {
        id: 'conv-123',
        label: 'Test',
        created_at: '2024-01-01',
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there!' },
          { role: 'user', content: 'How are you?' }
        ]
      };

      const formatted = plugin.formatConversation(conv);

      expect(formatted).toContain('**user**: Hello');
      expect(formatted).toContain('**assistant**: Hi there!');
      expect(formatted).toContain('**user**: How are you?');
    });

    it('should handle empty messages', () => {
      const conv = {
        id: 'conv-123',
        label: 'Empty',
        created_at: '2024-01-01',
        messages: []
      };

      const formatted = plugin.formatConversation(conv);

      expect(formatted).toContain('label: Empty');
      expect(formatted).not.toContain('**');
    });
  });
});
