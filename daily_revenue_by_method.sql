-- Pixie Chess — daily revenue by mint method (VRGDA vs Pack)
--
-- Daily-grouped version of query 7323363 (totals-only revenue split).
-- Same event sources and factory-based VRGDA auto-discovery.
--
-- Output: one row per (day, mint_method) with total ETH revenue and tx count.
--   day           — DATE_TRUNC('day', block_time)
--   mint_method   — 'VRGDA' or 'Pack'
--   eth_revenue   — sum of price_wei / 1e18
--   transactions  — count of events (= mints)

WITH vrgda_contracts AS (
    SELECT address
      FROM base.creation_traces
     WHERE "from" = 0xd2ee2d200d57007e6c62f29958bf43dc98075a47
),

vrgda_revenue AS (
    SELECT
        DATE_TRUNC('day', block_time) AS day,
        'VRGDA' AS mint_method,
        varbinary_to_uint256(varbinary_substring(data, 33, 32)) / 1e18 AS eth
      FROM base.logs
     WHERE contract_address IN (SELECT address FROM vrgda_contracts)
       AND topic0 = 0xcc9c58b575eabd3f6a1ee653e91fcea3ff546867ffc3782a3bbca1f9b6dbb8df
),

pack_revenue AS (
    -- Pack event: [field1, field2, price_wei] — price is the 3rd word (offset 65)
    SELECT
        DATE_TRUNC('day', block_time) AS day,
        'Pack' AS mint_method,
        varbinary_to_uint256(varbinary_substring(data, 65, 32)) / 1e18 AS eth
      FROM base.logs
     WHERE contract_address = 0xb3b4f451870b53586949f0af4ba754aaf8aed4f3
       AND topic0 = 0xb51a16e9de896bb0db1c02c5ef3a351e39cf485f00b566ee0b521ca5243b5211
),

all_revenue AS (
    SELECT * FROM vrgda_revenue
    UNION ALL
    SELECT * FROM pack_revenue
)

SELECT
    day,
    mint_method,
    SUM(eth)    AS eth_revenue,
    COUNT(*)    AS transactions
  FROM all_revenue
 GROUP BY 1, 2
 ORDER BY 1, 2;
