-- Pixie Chess — Revenue Split (Pack vs VRGDA, totals)
-- Query 7323363
--
-- Fix: piece_id range expanded from 1..28 → 1..32 so late-release pieces
--      (Pawn w/ Knife, Shrike, War Automaton, Warp Jumper) are not dropped.
--      That was the reason daily revenue "ended" mid-month.

WITH vrgda_contracts AS (
    SELECT address
      FROM base.creation_traces
     WHERE "from" = 0xd2ee2d200d57007e6c62f29958bf43dc98075a47
),

vrgda_revenue AS (
    SELECT
        'VRGDA' AS mint_method,
        varbinary_to_uint256(varbinary_substring(l.data, 33, 32)) / 1e18 AS price_eth
      FROM base.logs l
     WHERE l.contract_address IN (SELECT address FROM vrgda_contracts)
       AND l.topic0 = 0xcc9c58b575eabd3f6a1ee653e91fcea3ff546867ffc3782a3bbca1f9b6dbb8df
       AND varbinary_to_uint256(varbinary_substring(l.data, 1, 32)) BETWEEN 1 AND 32
       AND l.block_time >= DATE '2026-04-01'
),

pack_revenue AS (
    SELECT
        'Pack' AS mint_method,
        varbinary_to_uint256(varbinary_substring(p.data, 65, 32)) / 1e18 AS price_eth
      FROM base.logs p
     WHERE p.contract_address = 0xb3b4f451870b53586949f0af4ba754aaf8aed4f3
       AND p.topic0 = 0xb51a16e9de896bb0db1c02c5ef3a351e39cf485f00b566ee0b521ca5243b5211
       AND p.block_time >= DATE '2026-04-01'
),

all_revenue AS (
    SELECT * FROM vrgda_revenue
    UNION ALL
    SELECT * FROM pack_revenue
)

SELECT
    mint_method,
    COUNT(*) AS transactions,
    ROUND(SUM(price_eth), 4) AS total_eth,
    ROUND(SUM(price_eth) * 100.0 / SUM(SUM(price_eth)) OVER (), 1) AS pct_of_total
  FROM all_revenue
 GROUP BY 1
 ORDER BY total_eth DESC;
