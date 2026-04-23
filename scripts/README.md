# Admin Dashboard Deployment Scripts

Scripts for deploying and rolling back the keepwatching admin dashboard on the Raspberry Pi.

## Prerequisites

Before running either script, ensure the following are in place on the Pi:

- **`GIT_NPM_TOKEN`** must be exported in your shell environment. This token authenticates with the GitHub Package Registry to install `@ajgifford` private packages.
  ```bash
  export GIT_NPM_TOKEN=<your-token>
  # Add to ~/.bashrc to make it permanent
  ```
- The production directory `/var/www/keepwatching-admin-dashboard` must exist:
  ```bash
  sudo mkdir -p /var/www/keepwatching-admin-dashboard
  ```
- The repo must be cloned at `~/git/keepwatching-admin-dashboard`

See [DEPLOYMENT.md](../DEPLOYMENT.md) for full one-time setup instructions.

---

## deploy.sh

Pulls the latest code, builds, and deploys to production. Automatically backs up the current production before deploying.

```bash
./scripts/deploy.sh
```

**What it does:**
1. Checks `GIT_NPM_TOKEN` is set (fails fast if not)
2. Backs up current production to `/var/www/keepwatching-admin-dashboard-backups/backup_TIMESTAMP_COMMIT`
3. Trims old backups — keeps the 10 most recent
4. Pulls latest from git
5. Runs `yarn install`
6. Runs `yarn build` (outputs to `dist/`)
7. Copies `dist/*` to `/var/www/keepwatching-admin-dashboard/`
8. Saves `.deployment-meta` with timestamp, commit hash, and deployer

---

## rollback.sh

Lists available backups and restores a previous deployment.

### List backups

```bash
./scripts/rollback.sh --list
```

Shows all available backups with date, git commit, and path.

### Preview a rollback (dry run)

```bash
./scripts/rollback.sh --rollback 1 --dry-run
```

Shows exactly what would change without making any modifications.

### Perform a rollback

```bash
./scripts/rollback.sh --rollback 1
```

Prompts for confirmation, then:
1. Backs up the current production state
2. Restores the selected backup to `/var/www/keepwatching-admin-dashboard/`
3. Updates `.deployment-meta` with rollback details

### Options

| Option | Description |
|---|---|
| `--list` | List all available backups |
| `--rollback N` | Roll back to backup number N |
| `--dry-run` | Preview changes without applying (use with `--rollback`) |
| `--help` | Show usage information |
