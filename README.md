# fabBoard

[Deutsche Fassung](README.de.md)

fabBoard is a desktop board for working on your projects with an AI coding agent – without chatting. You collect questions, ideas, instructions and tasks per project. The AI works through them on its own, asks back with concrete options and a recommendation, and you decide with a click. Then it implements what you decided.

- **Any AI you like:** Claude Code, OpenAI Codex, Gemini (Antigravity) or Mistral (Vibe) with your account, your own API key (Anthropic, OpenAI, Google Gemini, Mistral) or a local model (Ollama, LM Studio).
- **Several projects at once:** the AI can work on several projects in parallel, one run per project.
- **Your data stays with you:** projects are plain JSON files in a folder on your computer (`Documents\fabBoard`). API keys are stored encrypted on your computer.
- **German and English:** follows your system language, can be changed in the setup.
- **Free and open source** (MIT licence). If fabBoard helps you, I'd appreciate a coffee: [ko-fi.com/fabboard](https://ko-fi.com/fabboard)

> **Status: preview release for Windows.** fabBoard is currently being tested with its first users. A Mac version is planned.

## Download and install
1. Download the latest `fabBoard-Setup-….exe` from [Releases](https://github.com/FabianDiering/fabBoard/releases).
2. Double-click the file. fabBoard installs without further questions and without administrator rights, and starts by itself.
3. A short setup assistant helps you choose your AI, install it and sign in. Everything works with buttons, there is nothing to type.

As long as the installer is not yet signed, Windows shows a warning (“Windows protected your PC”). Continue with “More info” and “Run anyway”.

## Requirements
- Windows 10 or 11
- An account with an AI (e.g. Claude or ChatGPT), your own API key or a local model. You don't need any other programs, fabBoard fetches everything it needs by itself.
- Recommended: [Git](https://git-scm.com) in the project folder. fabBoard then saves a state before and after each AI run, so every change can be undone. fabBoard also works without Git.

## Run from source (for developers)
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

The rules the AI follows are in [`app/ki-auftrag.md`](app/ki-auftrag.md). The format of the project files is described in [`app/beispiel/DATENFORMAT.md`](app/beispiel/DATENFORMAT.md), with two example projects in German and English.

## Code signing policy
Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by [SignPath Foundation](https://signpath.org).

- **Team:** Authors, reviewers and approvers: [Fabian Diering](https://github.com/FabianDiering) (project owner). Changes by other contributors are reviewed before they are merged.
- **Signed files:** only the Windows installer and the program files built from this repository by the GitHub Actions workflow [`installer.yml`](.github/workflows/installer.yml). Every release is approved by hand before it is signed.
- **Privacy:** This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it. In particular: your projects are sent to the AI you chose only when you start it; updates are only checked when you ask for it or switch on automatic update checks. Details are in the privacy statement inside the app (settings → Features → Privacy).

## Licence
MIT – see [LICENSE](LICENSE). © 2026 Fabian Diering
