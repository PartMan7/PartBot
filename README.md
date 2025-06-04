# PartBot

_A modern rewrite of PartBot for Pokémon Showdown_

---

**PartBot** is a chatbot designed for Pokémon Showdown, rebuilt from the ground up with modern TypeScript, improved architecture, and best practices. This project aims for greater maintainability, scalability, and feature richness.

## Features

- Modular and extensible TypeScript codebase
- Discord integration via `discord.js`
- Web interface with React and TailwindCSS
- MongoDB support via `mongoose`
- Scheduling and automation with `cron`
- Real-time file watching and reloads
- Rich set of utilities for tournaments, games (e.g., Chess), and more

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (for persistence)
- Optionally: [NGINX](https://nginx.org/) for production web/CDN features

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/TurboRx/PartBot.git
   cd PartBot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**

   Create a `.env` file at the root with your configuration (see `.env.example` if available).

4. **Build and prepare configs**
   ```bash
   npm run prepare
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

### Scripts

- `npm run build-configs` – Build NGINX configs for production
- `npm run notify-unpushed` – Notify if there are unpushed commits
- `npm run secrets-check` – Scan for secrets before pushing

## Planned Features

See [Enhancements](https://github.com/PartMan7/PartBot/labels/enhancement).

## Known Issues

See [Bugs](https://github.com/PartMan7/PartBot/labels/bug).

## Suggestions & Feedback

- Use [Suggestions & Feedback](https://github.com/PartMan7/PartBot/tree/main/docs/SUGGESTIONS.md) for ideas, bugs, and requests.

## Contributing

Contributions are welcome! Please check the [`CONTRIBUTING.md`](CONTRIBUTING.md) file for guidelines and best practices before submitting a pull request.

## Credits

- [PartMan](https://github.com/PartMan7) (Parth Mane) – Lead Developer, Maintainer
- [zxchan](https://github.com/singiamtel) – for advice and support

## License

This project is licensed under the [MIT License](LICENSE).

---

**This is an ongoing rewrite. Contributions, suggestions, and bug reports are welcome!**
