# Audit: Momentum Dash replica

## Summary

I audited this project for publication twice using an AI coding assistant (GPT-6 Luna, VS Code chat) and the course audit prompt: run 1 on 22 Nov 2026 and run 2 on 23 Nov 2026. Between the runs I fixed the relevant issues and manually verified the points the assistant could not check. No secrets or credentials were found at any point.

## What was checked

- Secrets, credentials and personal data in the source files, screenshots and full Git history
- Files that should be excluded, and the `.gitignore` rules
- Dependencies, setup instructions and configuration examples
- README coverage of purpose, data collection, persistence, user interaction, setup, learning and limitations
- Manual checks: a Git history search, the API's response headers, screenshot metadata, and whether the repository is visible when logged out

## Run 1: findings and decisions

| # | Finding | Type | Decision | What I did / why |
|---|---|---|---|---|
| 1 | Screenshots showed my first name and real to-do items | Possible concern | Fixed | Retook all three screenshots with a demo name ("Alex") and generic tasks, cropped to the page only (no tabs or bookmarks). The visible extension ID is not a credential, so I left it. |
| 2 | README said "nothing is sent to a server", but the extension contacts Picsum | Confirmed | Fixed | Reworded: the name and to-dos never leave the computer; the only requests are to Picsum for photos, which receives standard request information such as the IP address. |
| 3 | The repository contains all three projects, not just this one | Possible concern | No action | By design: the assignment requires one repository with a folder per project. |
| 4 | No host permission for `picsum.photos` might block requests | Possible concern | Verified, no change | DevTools shows Picsum responds with `Access-Control-Allow-Origin: *`, so the request is allowed without extra permissions. Tested working in Chrome. |
| 5 | `.gitignore` covered `.env` but not variants like `.env.local` | Recommendation | Fixed | Added `.env.*` and `!.env.example`. Tested with `git check-ignore -v`: `.env.local` is ignored, `.env.example` is not. |
| 6 | "Limitations and assistance" heading duplicated in README | Confirmed | Fixed | Removed the duplicate. |
| 7 | No LICENSE file | Recommendation | No action | Not required by the assignment; I decided not to add one for now. |
| 8 | XSS explanation in README was simplified | Recommendation | Fixed | Clarified that `innerHTML` parses text as HTML, which is what allows injected code to run. |

## Additional checks (points the assistant could not verify)

- **Secrets in Git history:** searched every commit (`git log --all -p`) for api_key, apikey, password, secret and token. The only matches were the word "Secrets" in a `.gitignore` comment and a commit message. No credentials were ever committed.
- **Screenshot metadata:** Windows file properties show only image dimensions and resolution; no author, camera or location data.
- **Public visibility:** opened the repository in an incognito window while logged out; it is public and all files are visible.
- **Runtime behaviour:** tested the extension in Chrome, including offline (the page still works with a plain background) and with a to-do containing HTML tags (shown as plain text).

## Run 2: results

- **Resolved:** the duplicate heading, the privacy wording (run 2 confirmed the README now separates local data from Picsum requests) and the `.env` variants.
- **Repeated possible concerns, already handled:** screenshot data (now demo data, which the assistant cannot distinguish from real data), host permission (verified above), repository scope (by design), license (decision above).
- **New confirmed finding:** the root README claimed every project already had setup instructions and an `AUDIT.md`, while the other two projects are still in progress. Fixed by adding a status column to the root README.
- **New recommendation:** ignore log files. Added `*.log` to `.gitignore`.
- **Note on scope:** run 2 covered the whole repository rather than only the `momentum-dash` folder, which is a broader check.

## Remaining limitations

- The original screenshots (showing my first name and two real to-do titles) remain in earlier commits. I judged this low risk (no secrets, and my GitHub username already includes my first name), so I did not rewrite Git history. For future projects I will use demo data before the first commit.
- Both audits were static reviews by an AI assistant plus my own manual checks; no dedicated secret-scanning tool was used. As the audit prompt notes, finding no issues does not prove the project is completely safe.
