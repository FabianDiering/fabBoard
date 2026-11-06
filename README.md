# fabBoard

[Deutsche Fassung](README.de.md)

fabBoard is a desktop board for working on your projects with an AI coding agent – without chatting. You collect questions, ideas, instructions and tasks per project. The AI works through them on its own, asks back with concrete options and a recommendation, and you decide with a click. Then it implements what you decided.

- **Any AI you like:** Claude Code or OpenAI Codex with your subscription, your own API key (Anthropic, OpenAI, Google Gemini, Mistral) or a local model (Ollama, LM Studio).
- **Your data stays with you:** projects are plain JSON files in a folder on your computer (`Documents\fabBoard`). API keys are stored encrypted on your computer.
- **German and English:** follows your system language, can be changed in the setup.
- **Free and open source** (MIT licence).

> **Status: early preview.** There is no installer yet; fabBoard currently runs from source on Windows. A Windows installer and a Mac version are planned.

## Requirements
- Windows 10 or 11
- [Node.js](https://nodejs.org) (LTS)
- [Git](https://git-scm.com) – fabBoard creates a commit before and after each AI run, so every change can be undone
- At least one AI agent; fabBoard checks which ones are installed and signed in and shows you the commands for anything missing

## Getting started
```
git clone https://github.com/FabianDiering/fabBoard.git
cd fabBoard\app
npm install
npm start
```
On first start, a short setup assistant helps you choose your AI and get it ready (installed, signed in or API key saved). You can open it again at any time with the gear icon at the top right.

## How it works
1. Create a project and link it to its folder on your computer.
2. Add entries: questions, ideas, instructions, tasks – or simply a message.
3. Click **Start** (the button carries the name of your AI). The AI runs in the project folder, turns messages into questions with options, answers your questions and implements decided items.
4. Decide on the questions with a click; decided items go to the archive and are implemented in the next run.

The rules the AI follows are in [`app/ki-auftrag.md`](app/ki-auftrag.md). The format of the project files is described in [`app/beispiel/DATENFORMAT.md`](app/beispiel/DATENFORMAT.md), with two example projects in German and English.

## Licence
MIT – see [LICENSE](LICENSE). © 2026 Fabian Diering
