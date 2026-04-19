-- Pixie Chess — weekly cohort retention
--
-- A "player" = any address that has ever minted a piece (received a Transfer from 0x0).
-- Their COHORT = the week they first minted.
-- They are "active" in a given week if they appear as `from` or `to` (excluding 0x0)
-- on any Transfer of the NFT collection contract — this captures mints, burns,
-- and secondary-market trades all as engagement signals.
--
-- Output: one row per (cohort_week, week_offset) pair.
--   cohort_week       — ISO week start (Monday) of the cohort's first-mint week
--   cohort_size       — number of distinct addresses whose first mint was in that week
--   week_offset       — weeks since cohort_week (0 = week of first mint, always 100%)
--   active_players    — distinct active addresses from that cohort in that week
--   retention_pct     — active_players / cohort_size (0.0 – 1.0)

WITH transfers AS (
    SELECT evt_block_time AS ts, "from" AS addr_from, "to" AS addr_to
      FROM erc721_base.evt_Transfer
     WHERE contract_address = 0x15f3b4d6b019d506d719a02ee97121bd95f6b6a6
),
all_activity AS (
    SELECT ts, addr_to AS player
      FROM transfers
     WHERE addr_to != 0x0000000000000000000000000000000000000000
    UNION ALL
    SELECT ts, addr_from AS player
      FROM transfers
     WHERE addr_from != 0x0000000000000000000000000000000000000000
),
first_mint AS (
    SELECT addr_to AS player,
           DATE_TRUNC('week', MIN(ts)) AS cohort_week
      FROM transfers
     WHERE addr_from = 0x0000000000000000000000000000000000000000
     GROUP BY 1
),
player_weeks AS (
    SELECT DISTINCT
           f.cohort_week,
           f.player,
           DATE_TRUNC('week', a.ts) AS activity_week
      FROM all_activity a
      JOIN first_mint   f ON a.player = f.player
     WHERE DATE_TRUNC('week', a.ts) >= f.cohort_week
),
cohort_size AS (
    SELECT cohort_week, COUNT(*) AS cohort_size
      FROM first_mint
     GROUP BY 1
)
SELECT pw.cohort_week,
       cs.cohort_size,
       CAST(DATE_DIFF('week', pw.cohort_week, pw.activity_week) AS INTEGER) AS week_offset,
       COUNT(*) AS active_players,
       ROUND(1.0 * COUNT(*) / cs.cohort_size, 4) AS retention_pct
  FROM player_weeks pw
  JOIN cohort_size  cs ON pw.cohort_week = cs.cohort_week
 GROUP BY 1, 2, 3
 ORDER BY pw.cohort_week, week_offset;
