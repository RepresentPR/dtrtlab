# Contributing

## Add a notebook entry

Add one line to the end of `content/notebook.txt`:

```
YYYY-MM-DD | Title | One-line note
```

Then run:

```bash
node scripts/build-notebook.cjs
```

That rewrites `/notebook/` and the homepage Updated stamp from the newest date. Use a real date on or before today in America/New_York. One line is one entry. You write the note. An entry is not always a business card. Do not add metrics or quotes.

A `posted on <platform>` note may only name platforms verified live while logged out. Do not claim a post you have not seen.
