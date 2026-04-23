-- Pixie Chess — New vs Returning Minters (by day)
--
-- SOURCE OF TRUTH: ERC-721 Transfer events from the NFT contract,
-- filtered to mints (from = 0x0). Captures VRGDA, Pack, and any future mint path.
--
-- ERC-721 Transfer topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
--   topic1 = from (indexed), topic2 = to (indexed), topic3 = tokenId (indexed)
--
-- NFT contract: 0x15f3b4d6b019d506d719a02ee97121bd95f6b6a6

WITH all_mints AS (
    SELECT
        topic2 AS minter,
        DATE_TRUNC('day', block_time) AS mint_day
      FROM base.logs
     WHERE contract_address = 0x15f3b4d6b019d506d719a02ee97121bd95f6b6a6
       AND topic0 = 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
       AND topic1 = 0x0000000000000000000000000000000000000000000000000000000000000000
       AND block_time >= DATE '2026-04-01'
),

first_mint AS (
    SELECT minter, MIN(mint_day) AS first_day
      FROM all_mints
     GROUP BY 1
),

daily_minters AS (
    SELECT DISTINCT mint_day AS day, minter
      FROM all_mints
)

SELECT
    dm.day,
    COUNT(CASE WHEN dm.day = f.first_day THEN 1 END) AS new_minters,
    COUNT(CASE WHEN dm.day >  f.first_day THEN 1 END) AS returning_minters,
    COUNT(*) AS total_minters
  FROM daily_minters dm
  JOIN first_mint f ON dm.minter = f.minter
 GROUP BY 1
 ORDER BY 1;
