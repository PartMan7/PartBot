# Contributing to PartBot

I welcome all contributors to PartBot! Technical contributors can refer to the documentation below, while non-technical
contributors are welcome to check out the [Suggestions, Bug Reports, and Feedback](https://github.com/PartMan7/PartBot/tree/main/docs/SUGGESTIONS.md)
docs.

---

## System Requirements and Setup

PartBot requires Node.js v18+ (v16+ may work but v18+ is recommended) to run, and uses `npm` as the package manager.

To install, clone this repository and install dependencies.

```bash
$ git clone https://github.com/PartMan7/PartBot.git PartBot
$ cd PartBot
$ npm install
```

This will also run the `prepare` script, which installs Husky hooks and patches TypeScript.

## Configuration

Once setup is complete, please copy the `.env.example` file to `.env` and change the values accordingly. This file populates
the environment variables. The full list of supported env variables is below:

- `PREFIX`: The prefix to use for commands on PS.
- `PS_USERNAME`: The username for the chatbot on PS.
- `PS_PASSWORD`: The password for said account. Leave blank if unregistered.
- `PS_OWNER`: The username of the Bot owner. Only affects the default help message and credits.
- `PS_ADMINS`: A comma-separated list of users on PS to give admin access to.
- `DISCORD_TOKEN`: The login token to use for the Discord account. Leave blank to disable Discord.
- `DB_MONGO_URL`: The MongoDB connection URL. Leave blank to disable database access/usage.

## Running

You can start the chatbot using `npm start`.

## Testing

Currently, PartBot's tests are only a lint test (`npm run lint`) and TypeScript validity (`npm exec tsc`). These will
automatically run on every pull request.

---

For details about the structure of PartBot (globals, types, layouts, etc.) please refer to the [structure documentation](docs/STRUCTURE.md).
