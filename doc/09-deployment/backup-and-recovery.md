# Backup & Recovery

## What to protect
| Data | Where | Backup |
|------|-------|--------|
| Orders, customers, catalogue, settings | PostgreSQL | Provider point-in-time recovery **and** nightly `pg_dump` |
| Product and banner images | Cloudinary | Cloudinary keeps originals; optional periodic export |
| Code | Git repository | Push to GitHub (private) |
| Secrets | Hosting dashboard | Keep an offline copy in a password manager |

## Automated backups
1. **Managed provider:** on Neon or Supabase, enable point-in-time restore (7 days or more).
2. **Independent nightly dump**, so you're not dependent on a single provider:
   ```bash
   DATABASE_URL="<direct url>" BACKUP_DIR=/var/backups/ambr \
   S3_BUCKET=s3://ambr-backups S3_ENDPOINT=https://<account>.r2.cloudflarestorage.com \
   ./scripts/backup.sh
   ```
   Schedule it daily at 03:00 Asia/Dhaka (cron `0 21 * * *` UTC). Local copies older than 30 days are pruned. Use bucket lifecycle rules for off-site retention, e.g. 90 days.

## Restore procedure (practise once before launch)
1. Create a **new, empty** database (never restore over production first).
2. `DATABASE_URL="<new db>" ./scripts/restore.sh backups/ambr-YYYYMMDDTHHMMSSZ.dump`
3. `DATABASE_URL="<new db>" npx prisma migrate status`. It should report "up to date".
4. Point a preview deployment at the new database and check recent orders, products and the admin.
5. To cut over, change `DATABASE_URL` in production and redeploy.

## Recovering from a bad change
- **A product or price was edited wrongly:** see Admin → Audit log, which keeps before/after JSON for every admin change.
- **A stock count looks wrong:** Admin → Inventory → movement log shows every change with its order or staff member. Correct it with an *Adjustment*.
- **Accidental mass deletion:** restore to a new database from point-in-time (just before the event), export the affected rows, and re-import.
