# Contributing

## Add a day's notebook entry

Add one line to the end of `content/notebook.txt`:

```
YYYY-MM-DD | Card title | Another card title
```

Then run:

```bash
node scripts/build-notebook.cjs
```

That rewrites `/notebook/` and the homepage Updated stamp from the newest date. Use the real date. One line is one day. Further titles on that line are more cards from the same day. The page adds "Daily card posted on X and Instagram." Do not add metrics or quotes.
