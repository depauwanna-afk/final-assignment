# Audit: Books to Scrape

## Summary

I audited this project for publication twice using an AI coding assistant (GPT-6 Luna, VS Code chat) and the course audit prompt, both on 25 Nov 2026. Between the runs I fixed the relevant issues and verified, myself, the points the assistant could not check (such as the live database permissions). This project uses real secrets (Supabase API keys), so protecting them was the main focus. No key was ever committed.

## What was checked

- Secrets, credentials and personal data in the source files, screenshots and full Git history
- That `.env` is ignored and never tracked, and that `.env.example` contains only placeholders
- Files that should be excluded (virtual environment, caches) and the `.gitignore` rules
- Dependencies, setup instructions and configuration examples
- README coverage of purpose, data collection, persistence, user interaction, setup, learning and limitations
- The live database permissions in Supabase

**Protecting the keys during the audit:** before each run I moved `.env` out of the project folder and closed all open files, so the AI tool could not read the keys. I only allowed read-only commands (for example `git check-ignore`, which checks the ignore rules without opening the file).

## Run 1: findings and decisions

| # | Finding | Type | Decision | What I did / why |
|---|---|---|---|---|
| 1 | `readonly-test.png` showed my Windows profile path (account name) in a traceback | Confirmed | Fixed | Covered the path with a black box; the test result is still visible. |
| 2 | `requirements.txt` was saved as UTF-16 (PowerShell's `>` default), which can break `pip install -r` | Confirmed | Fixed | Re-saved as UTF-8 in VS Code, then verified a fresh install works (see below). |
| 3 | The repository also contains the other two projects | Confirmed (scope) | No action | By design: the assignment requires one repository with a folder per project. Each project is audited separately. |
| 4 | README claimed "Python 3.9 or newer" but was only tested on 3.14 | Possible concern | Fixed | Changed to "Python 3 (developed and tested with Python 3.14)". |
| 5 | `schema.sql` granted permissions but did not revoke existing ones, so "nobody can delete" depended on project settings | Possible concern | Fixed | Added `revoke all ...` before the grants and `drop policy if exists` so the script gives the same result in any project and can be re-run. Re-ran it in Supabase. |
| 6 | Duplicate "Why Supabase / a database" label in README | Possible concern | Fixed | Removed the repeated label. |
| 7 | Large pinned dependency list; no license | Recommendation | No action | Pinning exact versions is what makes installs reproducible. A license is not required by the assignment. |

## Additional checks (points the assistant could not verify)

- **Secrets in Git history:** searched every commit for `sb_secret_`, `sb_publishable_` and `supabase.co`. The only matches were README documentation (key formats shown as `sb_secret_...`, links to supabase.com) and the placeholder URL in `.env.example`. No real key or project URL was ever committed.
- **`.env` not tracked:** `git ls-files` lists `.env.example` but not `.env`; `git check-ignore -v .env` confirms the root `.gitignore` rule.
- **Live permissions:** queried `information_schema.role_table_grants` in Supabase. `anon` has only SELECT; `service_role` has SELECT, INSERT and UPDATE; nobody has DELETE.
- **Read-only public key:** with the publishable key, reading works but inserting is refused with `permission denied for table books` (42501).
- **No duplicates:** ran the scraper twice; the table still has 1000 rows with 1000 unique URLs.
- **Reproducible install:** created a fresh virtual environment outside the repository and ran `pip install -r requirements.txt`; all packages installed successfully.

## Run 2: results

- **Resolved:** the screenshot path, the UTF-16 encoding, the Python version claim, the missing revoke and the duplicate label. Run 2 also confirmed independently that `.env` is absent and ignored, that `.env.example` contains placeholders, and that it found no credentials in the files or screenshots.
- **New possible concern:** an earlier version of `readonly-test.png` remains in Git history. I know its contents: it is my own screenshot of the permission test, which shows variable names but no key values, plus my Windows account name in a file path. I judged this low risk and did not rewrite Git history (the same decision as for the Momentum Dash screenshots).
- **New recommendation:** ignore tool caches and Streamlit's secrets file. I added `.streamlit/secrets.toml` to `.gitignore` as a safety net. I did not add pytest, mypy or ruff caches because I do not use those tools.
- **Repeated recommendations:** license and pinned dependencies, same decisions as in run 1.

## Remaining limitations

- The original `readonly-test.png`, showing my Windows account name in a file path, remains in an earlier commit (see above).
- The publishable key is meant to be public and only allows reading the scraped book data, which is public anyway. The Supabase project should only ever contain this public data.
- Both audits were static reviews by an AI assistant plus my own manual checks; no dedicated secret-scanning tool was used. As the audit prompt notes, finding no issues does not prove the project is completely safe.
