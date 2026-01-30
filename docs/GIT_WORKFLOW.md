# Git Workflow – Ekstra Router

## Auto-push so the team can review

We want **every new file, update, and code change** to be pushed to GitHub after commit so the team can review.

### One-time setup: enable auto-push on commit

From the **repo root** (`ekstrarouter/`), run:

```bash
git config core.hooksPath scripts/git-hooks
```

- **Windows (PowerShell):**  
  `git config core.hooksPath scripts/git-hooks`

- **macOS/Linux:**  
  `git config core.hooksPath scripts/git-hooks`

After this, every time you run `git commit`, the **post-commit** hook runs and executes `git push`. Your commits will go to GitHub automatically so the team can review.

### Your daily workflow

1. **Make changes** (new files, edits, etc.).
2. **Stage and commit:**
   ```bash
   git add .
   git commit -m "Short description of what changed"
   ```
3. **Push** – If the hook is set up, this runs automatically after commit.  
   If you didn’t run the one-time setup, push manually:
   ```bash
   git push origin main
   ```

So: **commit = push** (once the hook is enabled). No need to remember a separate push step for normal work.

### Verify hook is active

```bash
git config core.hooksPath
```

You should see: `scripts/git-hooks` (or the full path to that folder).

### Disable auto-push (optional)

To stop auto-pushing and push only when you choose:

```bash
git config --unset core.hooksPath
```

### Summary

| Goal | Action |
|------|--------|
| Push latest changes to GitHub | Run the one-time hook setup, then just `git add` and `git commit`. |
| One-time setup | `git config core.hooksPath scripts/git-hooks` (from repo root). |
| Manual push | `git push origin main` (e.g. if hook is not set up). |

Every new file, update, or change you commit will be pushed automatically so the team can review.
