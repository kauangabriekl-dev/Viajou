#!/usr/bin/env bash
# Recria um banco de teste local, aplica stub + migrations + seed e roda os testes SQL.
# Requer PostgreSQL local. Configure com PGHOST/PGUSER/PGPASSWORD (padrão: localhost/postgres).
set -euo pipefail
cd "$(dirname "$0")/.."

export PGHOST="${PGHOST:-localhost}" PGUSER="${PGUSER:-postgres}"
DB="${TEST_DB_NAME:-viajou_test}"

psql -q -d postgres -c "drop database if exists $DB with (force);" -c "create database $DB;"
run() { psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1" > /dev/null; }

run supabase/tests/00_local_supabase_stub.sql
for f in supabase/migrations/*.sql; do run "$f"; done
run supabase/seed.sql
psql -q -t -A -v ON_ERROR_STOP=1 -d "$DB" -f supabase/tests/rls.test.sql 2>&1 | sed -n "s/^psql:[^ ]* NOTICE:  //p; /ERROR/p; /passaram/p"
