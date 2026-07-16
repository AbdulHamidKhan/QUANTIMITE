# LeetCode CPH Companion

A small Chrome extension that sends **correctly-parsed** LeetCode test
cases straight to [CPH (Competitive Programming Helper)][cph] in VS Code.

Most LeetCode-scraping extensions grab test cases by parsing the rendered
page's HTML, which breaks on multi-example or multi-parameter problems
(inputs and outputs get merged/misaligned). This one calls LeetCode's own
GraphQL API instead, and uses the real parameter count from the problem's
`metaData` to split test cases correctly.

[cph]: https://marketplace.visualstudio.com/items?itemName=DivyanshuAgrawal.competitive-programming-helper

## Install

1. Clone or download this repo:
   ```bash
   git clone https://github.com/AbdulHamidKhan/leetcode-cph-companion.git
   ```
2. Open `chrome://extensions`
3. Toggle **Developer mode** on (top-right)
4. Click **Load unpacked** and select the `leetcode-cph-companion` folder

## Requirements

- The [CPH extension][cph] installed in VS Code. It listens on
  `http://127.0.0.1:27121` by default — no extra config needed unless
  you've changed the port in CPH's settings (see below).

## Usage

1. Open any LeetCode problem, e.g.
   `https://leetcode.com/problems/gcd-of-odd-and-even-sums/`
2. Wait for the page to fully load
3. Click the green **"⇩ Send to VS Code"** button (bottom-right of the page)
4. Switch to VS Code — CPH's sidebar should now show the correctly split
   test cases for the currently open solution file
5. Press **Run All** (or `Ctrl+Alt+B`) to test

## How it works

- `content.js` runs on `leetcode.com/problems/*`. It queries LeetCode's
  GraphQL endpoint for:
  - `exampleTestcases` — raw stdin values for every example, concatenated
  - `metaData` — includes the function's parameter count, which tells us
    how many lines of `exampleTestcases` belong to each example
  - `content` — the raw problem description HTML, which we flatten to
    plain text and split on `Example N:` to pull out expected outputs
    (this works regardless of whether a problem wraps examples in
    `<pre>` or plain `<p>` tags — older and newer LeetCode problems use
    different markup)
- It builds a small JSON payload in the shape CPH expects (the same shape
  Competitive Companion sends), and hands it to `background.js`
- `background.js` (a service worker, so it isn't subject to LeetCode's
  CSP) `POST`s that payload to `http://127.0.0.1:27121`, using
  `Content-Type: text/plain` rather than `application/json` — this
  avoids a CORS preflight `OPTIONS` request, which CPH's local server
  doesn't implement and would otherwise silently block the whole request

## Known limitations

- Problems with unusual expected-output formatting (rare edge cases) may
  not parse perfectly — spot-check the CPH sidebar against the problem
  page if a test looks off.
- "Design a class" style problems (e.g. LRU Cache) aren't handled — their
  input/output shape doesn't map to stdin/stdout in the first place.
- If you've changed CPH's default port, update `CPH_PORT` at the top of
  `background.js` to match.

## Troubleshooting

- **"Extension context invalidated" error** — happens if you reload the
  extension in `chrome://extensions` without also refreshing the LeetCode
  tab. Refresh the tab after every reload.
- **CORS / "Could not reach CPH" error** — make sure VS Code is open with
  CPH's sidebar visible and a C++ solution file focused; CPH's local
  server only listens while that's active.

## Contributing

PRs welcome — especially for edge-case problem formats that don't parse
cleanly. Open an issue with a link to the problem if you hit one.

## License

MIT — see [LICENSE](./LICENSE).
