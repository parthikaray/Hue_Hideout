# Hue Hideout — a cozy camouflage game 🦎

Guide a little chameleon across colored garden paths while an eagle watches from above.
Turn the color wheel and line up the three shade lines (Hue, Saturation, Brightness) to copy
the path color. Get **95% or better** and the chameleon blends in perfectly — any less and
the eagle strikes!

- Flat, cozy "coloring book" artwork, seen from the eagle's top-down view
- Chameleon changes color live as you mix, 3-shade-line advanced color picker
- Golden 3-star rating filled by your accuracy
- Soft pop/click button sounds, eagle screech, and warm success chimes (no audio files needed)
- Save your score as a guest, or sign in for an online leaderboard and daily streak

## Run it (0 setup)

Double-click **`index.html`**. It starts instantly — no internet needed except for fonts
and (optional) accounts.

Prefer a local web address? In this folder run:

```powershell
python -m http.server 8000
```

then open `http://localhost:8000`.

## How to play

1. Give your chameleon a name and press **Start adventure**.
2. Look at the **TARGET PATH** color on the garden floor.
3. Drag the rainbow **color wheel** for the main hue.
4. Slide the three **shade lines** under it to match saturation and brightness.
5. The chameleon shows your mix live — get to **95% MATCH** before the timer runs out.
6. Survive all **10 rounds** and the whole run gets a star rating (and your best % is saved).

Fail one round and the eagle swoops — game over, but your best score is kept.

## Publish it free on the internet

1. Create a free account at **github.com** and a new **repository** (any name).
2. On the repo page click **Add file → Upload files**, and upload all files here
   (`index.html`, `styles.css`, `app.js`, `config.js`, `supabase-schema.sql`, `README.md`).
3. In the repo, go to **Settings → Pages → Build and deployment → Source: Deploy from branch**
   and pick branch `main`, folder `/ (root)`. Click Save.
4. After about a minute GitHub gives you a public **https://yourname.github.io/repo/** link —
   that's your game's web address to share.

## Turn on accounts (leaderboard + daily streak)

Accounts use **Supabase**, a free backend. It takes about 10 minutes once.

1. Go to **supabase.com → Start your project**. Sign up free, and **create a project**.
2. In the project dashboard, open **SQL Editor**, paste the *entire contents* of
   **`supabase-schema.sql`** into the editor, and press **Run**. It creates the score tables
   and security rules.
3. Open **Project Settings → API** and copy the **Project URL** and the **anon public key**.
4. Open **`config.js`** in a text editor and paste them into the quotes, then save:

   ```js
   window.SUPABASE_CONFIG = {
     url: "https://YOUR-PROJECT-ref.supabase.co",
     anonKey: "your-long-anon-public-key"
   };
   ```

   These two values are *public on purpose* — they are not secrets.
5. Reload the game. The **Sign in** button now works. Sign in, play a round, and you're
   on the leaderboard with a daily streak 🔥.

> First signups may need to confirm their email before they can sign in — Supabase sends it
> automatically.

## Files

| File | What it does |
|------|--------------|
| `index.html` | The page: screens, game scene, picker, account dialog |
| `styles.css` | All colors, layout, and cozy animations (pastel theme) |
| `app.js` | The game itself: mixing, timing, eagle, sounds, scores, accounts |
| `config.js` | Paste your Supabase URL + anon key here (leave empty for guest-only) |
| `supabase-schema.sql` | One-time setup script for your Supabase project |
| `README.md` | This guide |

## Tweak the feel (non-coders welcome)

Open `styles.css` in a text editor:

- **Pastel colors:** find `:root{` — the `--peach`, `--mint`, `--lilac` values are the palette.
- **Round time / rounds:** in `app.js` find `secondsPerRound = 15` and `roundsTotal = 10`.
- **Match difficulty:** `MATCH = 95` (make it lower for easier, higher for harder).
- **Sounds:** all built-in, in the `sfx` section of `app.js` — easy to turn one off in its code.

## Note on originality

This is a free, original color-matching/camouflage game inspired by the general idea of
games like *Tosava*. Its name, artwork, UI, code and sounds are all its own — keep it that
way, and don't copy *Tosava*'s branding or art.