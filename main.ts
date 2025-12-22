import { App, Plugin, PluginSettingTab, Setting, Notice, Modal } from 'obsidian';
import { MemoryController } from '@sekha/sdk';

interface SekhaPluginSettings {
    apiUrl: string;
    apiKey: string;
    importFolder: string;
}

const DEFAULT_SETTINGS: SekhaPluginSettings = {
    apiUrl: 'http://localhost:8080',
    apiKey: '',
    importFolder: 'Sekha Conversations'
};

export default class SekhaPlugin extends Plugin {
    settings: SekhaPluginSettings;
    memory: MemoryController;

    async onload() {
        await this.loadSettings();

        this.memory = new MemoryController({
            baseURL: this.settings.apiUrl,
            apiKey: this.settings.apiKey
        });

        // Command: Search Sekha
        this.addCommand({
            id: 'search-sekha',
            name: 'Search Sekha memory',
            callback: () => {
                new SekhaSearchModal(this.app, this.memory).open();
            }
        });

        // Command: Import conversation
        this.addCommand({
            id: 'import-conversation',
            name: 'Import conversation by ID',
            callback: async () => {
                const id = await this.promptForId();
                if (id) await this.importConversation(id);
            }
        });

        // Command: Import by label
        this.addCommand({
            id: 'import-by-label',
            name: 'Import conversations by label',
            callback: async () => {
                const label = await this.promptForLabel();
                if (label) await this.importByLabel(label);
            }
        });

        this.addSettingTab(new SekhaSettingTab(this.app, this));
    }

    async importConversation(id: string) {
        try {
            const conv = await this.memory.getConversation(id);
            const folder = this.settings.importFolder;
            await this.app.vault.createFolder(folder).catch(() => {});
            
            const filename = `${folder}/${conv.label}_${id.substring(0, 8)}.md`;
            const content = this.formatConversation(conv);
            
            await this.app.vault.create(filename, content);
            new Notice(`Imported: ${filename}`);
        } catch (err) {
            new Notice(`Failed to import: ${err.message}`);
        }
    }

    async importByLabel(label: string) {
        try {
            const results = await this.memory.search(label, { limit: 50 });
            for (const conv of results) {
                await this.importConversation(conv.id);
            }
            new Notice(`Imported ${results.length} conversations`);
        } catch (err) {
            new Notice(`Failed: ${err.message}`);
        }
    }

    formatConversation(conv: any): string {
        return `---
label: ${conv.label}
created: ${conv.created_at}
sekha_id: ${conv.id}
---

# ${conv.label}

${conv.messages.map(m => `**${m.role}**: ${m.content}`).join('\n\n')}
`;
    }

    async promptForId(): Promise<string> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.titleEl.setText('Enter Conversation ID');
            
            const input = modal.contentEl.createEl('input', {
                type: 'text',
                placeholder: 'conv_...'
            });
            
            modal.contentEl.createEl('button', { text: 'Import' }).onclick = () => {
                resolve(input.value);
                modal.close();
            };
            
            modal.open();
        });
    }

    async promptForLabel(): Promise<string> {
        return new Promise((resolve) => {
            const modal = new Modal(this.app);
            modal.titleEl.setText('Enter Label');
            
            const input = modal.contentEl.createEl('input', {
                type: 'text',
                placeholder: 'Project:AI'
            });
            
            modal.contentEl.createEl('button', { text: 'Import' }).onclick = () => {
                resolve(input.value);
                modal.close();
            };
            
            modal.open();
        });
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

class SekhaSearchModal extends Modal {
    memory: MemoryController;

    constructor(app: App, memory: MemoryController) {
        super(app);
        this.memory = memory;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.setText('Search Sekha...');
        
        const input = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'Search query...'
        });
        
        const results = contentEl.createDiv('search-results');
        
        input.oninput = async () => {
            const query = input.value;
            if (query.length < 3) return;
            
            const matches = await this.memory.search(query, { limit: 10 });
            results.empty();
            
            matches.forEach(conv => {
                const item = results.createDiv('search-result');
                item.setText(`${conv.label} - ${conv.created_at}`);
                item.onclick = () => {
                    // Copy conversation link
                    navigator.clipboard.writeText(`sekha://${conv.id}`);
                    new Notice('Copied link!');
                };
            });
        };
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

class SekhaSettingTab extends PluginSettingTab {
    plugin: SekhaPlugin;

    constructor(app: App, plugin: SekhaPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName('API URL')
            .setDesc('Sekha controller URL')
            .addText(text => text
                .setPlaceholder('http://localhost:8080')
                .setValue(this.plugin.settings.apiUrl)
                .onChange(async (value) => {
                    this.plugin.settings.apiUrl = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('API Key')
            .setDesc('Your Sekha API key')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.apiKey)
                .onChange(async (value) => {
                    this.plugin.settings.apiKey = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Import Folder')
            .setDesc('Folder for imported conversations')
            .addText(text => text
                .setPlaceholder('Sekha Conversations')
                .setValue(this.plugin.settings.importFolder)
                .onChange(async (value) => {
                    this.plugin.settings.importFolder = value;
                    await this.plugin.saveSettings();
                }));
    }
}
