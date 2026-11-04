#!/usr/bin/env bash
# Runs the database tests on a local Postgres (16+): every migration, then tests/db/premium.test.sql.
#   PGHOST=/tmp/pgdk PGPORT=5433 tests/db/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
P="psql -X -q -v ON_ERROR_STOP=1 -U ${PGUSER:-postgres} -d ${PGDATABASE:-postgres}"
$P -f tests/db/stub.sql >/dev/null
for m in supabase/migrations/*.sql; do $P -f "$m" >/dev/null; done
$P -f tests/db/premium.test.sql
bash tests/db/concurrency.sh
