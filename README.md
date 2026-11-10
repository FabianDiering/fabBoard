# fabBoard

[Deutsche Fassung](README.de.md)

**A decision layer between you and your AI.** One board for all your projects: the AI works on several projects at the same time, asks you, and you decide.

fabBoard is a free program for working on your projects with an AI model of your choice – without chatting, and without technical knowledge. Each project (e.g. a website, a text, a research task, a piece of software) has its own board and its own folder. You write a task and start the AI with one click; while it works on one project, you start it on the next. Instead of waiting for you in a chat window, the AI puts its questions on the board, with concrete options and a recommendation. You answer whenever it suits you, project by project, and the AI then implements what you decided.

- **Several projects at the same time, in one window:** the AI works on several projects in parallel, one run per project. You keep the overview and decide where it is needed.
- **You decide, the AI works:** questions, ideas, instructions and tasks are collected per project on the board. Every decision is yours and stays documented.
- **Any AI you like, per project:** Claude, ChatGPT (Codex), Gemini or Mistral with your own account, your own API key (Anthropic, OpenAI, Google Gemini, Mistral) or a model on your own computer (Ollama, LM Studio). Different projects can use different AIs side by side.
- **Setup without prior knowledge:** fabBoard installs the official AI program with one click and helps with the sign-in. With Claude and ChatGPT (Codex) you simply sign in in your browser, without any terminal.
- **Your data stays with you:** projects are plain JSON files in a folder on your computer (`Documents\fabBoard`). API keys are stored encrypted on your computer.
- **German and English:** follows your system language, can be changed at any time.
- **Free and open source** (MIT licence). If fabBoard helps you, I'd appreciate a coffee: [ko-fi.com/fabboard](https://ko-fi.com/fabboard)

> **Status: preview release for Windows.** fabBoard is currently being tested with its first users. A Mac version is planned.

## Download and install
1. Download the latest `fabBoard-Setup-….exe` from [Releases](https://github.com/FabianDiering/fabBoard/releases).
2. Double-click the file. fabBoard installs without further questions and without administrator rights, and starts by itself.
3. A short setup assistant helps you choose your AI, install it and sign in. Everything works with buttons, there is nothing to type.

As long as the installer is not yet signed, Windows shows a warning (“Windows protected your PC”). Continue with “More info” and “Run anyway”. On computers where Windows Smart App Control is switched on, the preview release unfortunately cannot be installed at all until it is signed.

## Requirements
- Windows 10 or 11
- An account with an AI (e.g. Claude or ChatGPT), your own API key or a local model. You don't need any other programs, fabBoard fetches everything it needs by itself.

## For developers: run from source
You need [Node.js](https://nodejs.org) (LTS):
```
git clone https://github.com/FabianDiering/fabBoard.git
cd fabBoard\app
npm install
npm start
```

## How it works
1. Create a project and link it to its folder on your computer.
2. Add entries: questions, ideas, instructions, tasks – or simply a message.
3. Click **Start** (the button carries the name of your AI). The AI runs in the project folder, turns messages into questions with options, answers your questions and implements decided items.
4. Decide on the questions with a click; decided items go to the archive and are implemented in the next run.

The rules the AI follows are in [`app/ki-auftrag.md`](app/ki-auftrag.md). The format of the project files is described in [`app/beispiel/DATENFORMAT.md`](app/beispiel/DATENFORMAT.md), with a practice project and two example projects in German and English.

## Code signing policy
Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org).

- **Team:** Authors, reviewers and approvers: [Fabian Diering](https://github.com/FabianDiering) (project owner). Changes by other contributors are reviewed before they are merged.
- **Signed files:** only the Windows installer and the program files built from this repository by the GitHub Actions workflow [`installer.yml`](.github/workflows/installer.yml). Every release is approved by hand before it is signed.
- **Privacy:** This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it. In particular: your projects are sent to the AI you chose only when you start it; updates are only checked when you ask for it or switch on automatic update checks. Details are in the [privacy statement](PRIVACY.md), which is also shown inside the app (settings → Features → Privacy).

## Licence
MIT – see [LICENSE](LICENSE). © 2026 Fabian Martin Diering
