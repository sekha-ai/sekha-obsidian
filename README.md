# Sekha Obsidian Plugin

> **Connect Your Second Brain to Sekha Memory**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org)
[![Status](https://img.shields.io/badge/status-beta-orange.svg)]()

---

## What is Sekha Obsidian?

Integrate Sekha memory with Obsidian:

- ✅ Store notes as conversations
- ✅ Search Sekha from Obsidian
- ✅ Auto-save daily notes
- ✅ Bidirectional sync
- ✅ Memory sidebar

**Status:** Beta - Seeking testers!

---

## 📚 Documentation

**Complete guide: [docs.sekha.dev/integrations/obsidian](https://docs.sekha.dev/integrations/obsidian/)**

- [Obsidian Plugin Guide](https://docs.sekha.dev/integrations/obsidian/)
- [Getting Started](https://docs.sekha.dev/getting-started/quickstart/)
- [API Reference](https://docs.sekha.dev/api-reference/rest-api/)

---

## 🚀 Quick Start

### 1. Install Sekha

```bash
git clone https://github.com/sekha-ai/sekha-docker.git
cd sekha-docker
docker compose up -d
```

### 2. Install Plugin

**From Obsidian Community Plugins (coming soon):**
- Settings → Community Plugins → Browse
- Search "Sekha"

**Manual installation:**
```bash
# Clone to your vault's plugins folder
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/sekha-ai/sekha-obsidian.git sekha
cd sekha
npm install
npm run build
```

### 3. Configure

1. Enable the plugin in Obsidian settings
2. Set API URL: `http://localhost:8080`
3. Set API key: `your-api-key`

---

## ✨ Features

### Current (Beta)

- ✅ Store notes as conversations
- ✅ Search Sekha from command palette
- ✅ Memory sidebar panel
- ✅ Manual sync

### Roadmap

- [ ] Auto-sync daily notes
- [ ] Inline memory search
- [ ] Note templates with memory
- [ ] Graph view integration
- [ ] Dataview queries

---

## 📚 Usage

### Commands

- **Store Current Note** - Save note to Sekha
- **Search Memory** - Search Sekha from Obsidian
- **View Stats** - Sekha statistics
- **Open Sidebar** - Memory explorer

### Sidebar

- Recent conversations
- Quick search
- Folder navigation
- Stats overview

---

## 🧪 Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Test
npm test
```

---

## 🔗 Links

- **Main Repo:** [sekha-controller](https://github.com/sekha-ai/sekha-controller)
- **Docs:** [docs.sekha.dev](https://docs.sekha.dev)
- **Website:** [sekha.dev](https://sekha.dev)
- **Discord:** [discord.gg/sekha](https://discord.gg/sekha)

---

## 📄 License

AGPL-3.0 - **[License Details](https://docs.sekha.dev/about/license/)**
