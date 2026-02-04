---
title: Installing direnv on macOS
date: 2024-03-07
---

Having had to install direnv multiple times over the last few days to get a team up and running im writing the method down because I keep having to look it up.

Install based on the following instructions <https://github.com/direnv/direnv/blob/master/docs/installation.md>
Then hook it up to your shell via <https://github.com/direnv/direnv/blob/master/docs/hook.md>

Lastly to have it work with .env files create the following directory and file

```bash
~/.config/direnv/direnv.toml
```

and edit the contents to contain the following,

```bash
[global]
load_dotenv=true
```

You will need to restart your shell after doing this. Opening a new terminal is the easiest way to do this.

You need to allow the .env file when you enter the directory, which will be prompted, but for reference the following is the command.

```bash
direnv allow .

```

Should do it for you.
