-- Realtors X production baseline.
--
-- The schema and upgrades that existed before automated migrations were enabled
-- were applied manually through the Supabase SQL Editor. This no-op migration
-- establishes the first migration-history entry without reapplying that schema.
-- All future database changes must be added as new timestamped files in this
-- directory so GitHub Actions can apply them safely and in order.

select 1;
