---
name: feature_change_workflow
description: Workflow for feature changes
---
---

# Feature Change Workflow

## Overview
This skill defines mandatory workflow rules that must be followed after every bug fix or feature addition.

---

## Rules

### Rule 1: Push to GitHub After Every Change
After fixing a bug or adding a new feature, you **must always** push the changes to GitHub before considering the task complete.

**Steps to follow:**
1. Stage all relevant changes:
   ```bash
   git add .
   ```
2. Commit with a descriptive message:
   ```bash
   git commit -m "<type>: <short description of the fix or feature>"
   ```
   - Use `fix:` prefix for bug fixes (e.g., `fix: resolve null pointer in login flow`)
   - Use `feat:` prefix for new features (e.g., `feat: add user profile page`)
3. Push to the appropriate branch:
   ```bash
   git push origin <branch-name>
   ```
4. Confirm the push was successful by checking the terminal output for no errors.

> ⚠️ **Do not skip this step.** Every code change — no matter how small — must be committed and pushed to GitHub.

---

### Rule 2: Open Chrome to Test After Deploying
After successfully pushing the change to GitHub (and after any deployment completes), you **must** open the Chrome browser to verify the change works as expected in the live or staging environment.

**Steps to follow:**
1. Wait for any CI/CD pipeline or deployment to finish (if applicable).
2. Open Chrome and navigate to the relevant URL:
   ```bash
   google-chrome <url>
   # or
   open -a "Google Chrome" <url>
   ```
3. Manually verify that:
   - The bug is no longer reproducible, **or**
   - The new feature behaves as expected
4. Check the browser console for any new errors introduced by the change.
5. Document the result (pass/fail) before closing the task.

> ⚠️ **Do not mark a task as done** without first opening Chrome and confirming the change works in the browser.

---

## Workflow Summary

```
Fix bug / Add feature
        ↓
  git add & commit
        ↓
   git push to GitHub
        ↓
  Wait for deployment
        ↓
  Open Chrome & test
        ↓
    Task complete ✅
```

---

## Non-Negotiable Checklist
Before closing any task, verify:
- [ ] Code changes are committed with a meaningful message
- [ ] Changes are pushed to GitHub successfully
- [ ] Chrome browser was opened to test the deployed change
- [ ] No new console errors were introduced
