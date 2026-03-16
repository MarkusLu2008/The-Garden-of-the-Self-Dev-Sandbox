# The Garden of the Self

A personal journaling app built with Expo and React Native. Create daily entries, reflect with prompts, and track virtues as you grow.

## Vision

The Garden of the Self is grounded in **virtue ethics**: the idea that character and habits shape a good life. In this app, each **virtue is a plant in your garden of life**. You unlock new plants—and virtues—by completing **quests**, and you tend your garden through practices like **journaling**. The aim is to help people build virtues and improve their daily lives by turning reflection and small, intentional actions into lasting growth.

## Features

- **Journals** — Create and edit journal entries with a rich text editor. Entries are stored locally with SQLite and file-based content.
- **Prompts & virtues** — Attach a prompt and select from a set of virtues (Courage, Temperance, Patience, Kindness, and more) to each entry.
- **DevTools** — Inspect the SQLite database, run custom queries, and explore the app’s file storage (development and debugging).
- **Cross-platform** — Runs on iOS, Android, and web.
- **Theming** — Automatic light/dark mode with system preference.

## Tech stack

- [Expo](https://expo.dev) (~54) with [Expo Router](https://docs.expo.dev/router/introduction/)
- React 19, React Native
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) for journal metadata
- [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/) for journal content
- [react-native-pell-rich-editor](https://github.com/wxik/react-native-rich-editor) for rich text editing

## Project structure

```
Garden-of-the-Self/
├── app/
│   ├── (tabs)/
│   │   ├── journals/       # Journal list, create, editor
│   │   └── devtools.tsx    # DevTools screen
│   └── _layout.tsx
├── components/             # UI (themed text/view, icons, collapsible)
├── constants/              # Theme, virtues list
├── hooks/                  # Color scheme, theme
├── services/               # journalManager, db, fileStorage
└── utils/                  # Date formatting, styles
```

## Getting started

### Prerequisites

- Node.js (LTS recommended)
- [Expo Go](https://expo.dev/go) on your device (for iOS/Android), or a simulator/emulator

### Install and run

```bash
cd Garden-of-the-Self
npm install
npm start
```

Then:

- Press **i** for iOS simulator, **a** for Android emulator, or scan the QR code with Expo Go.
- Press **w** to open in the browser (web).

### Scripts

| Command        | Description                    |
|----------------|--------------------------------|
| `npm start`    | Start Expo dev server         |
| `npm run ios`  | Start with iOS                |
| `npm run android` | Start with Android        |
| `npm run web`  | Start with web                |
| `npm run lint` | Run ESLint                    |

## License

Private — see repository settings.
