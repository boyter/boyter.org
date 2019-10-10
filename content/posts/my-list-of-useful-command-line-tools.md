---
title: My list of useful command line tools
date: 2019-10-09
---

A post that is constantly a work in progress.

 - ripgrep - Similar to grep, but a drop in replacement for large file scanning without unicode penalities. It's also similar to Ag and Ack and optimised for searching code, ignoring .git directories and the like.
 - tmux - Terminal multiplexer. I wrote a [5 min guide](https://boyter.org/posts/enough-tmux-to-be-productive-in-5-minutes/) to this. Use it to have resumable sessions after closing ssh sessions and to have split pane windows.
 - bat - Replacement for cat but provides syntax highlighting and line numbers. Can work as a drop in replacement for cat as well as it detects redirects and removes the fancy output.
 - fd - Better than find. Recursivly looks for whatever it is you need using regular expressions and like ripgrep ignores .git directories and the like.
 - fzf - Fuzzy finder. Hard to explain why this is so useful. Suggest checking it out https://github.com/junegunn/fzf
 - gron - Makes JSON files grepable by flattening the struture. Very useful when trying to find something in JSON quickly.
 - hexyl - Hex view of files with highlighting and the like. Find BOM in files quickly!
 - hyperfine - A command line benchmark tool. Give it two commands `hyperfine 'scc' 'tokei'` to determine which one is faster.
