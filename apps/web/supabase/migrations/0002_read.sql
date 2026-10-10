-- Read engine (2026-10-10): the full report is generated in the same run as the free read.
-- Email is asked after the result, so it becomes nullable.
alter table quick_wins alter column email drop not null;
alter table quick_wins add column report jsonb;           -- ReadReport (packages/core/src/read.ts)
alter table quick_wins add column presented_as text;      -- man | woman | unsure, from the photo gate
