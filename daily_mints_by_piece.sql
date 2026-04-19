-- Pixie Chess — daily mints by piece (auction + pack)
--
-- SOURCE OF TRUTH: per-mint events on the VRGDA and Pack contracts.
-- Every new VRGDA auto-discovered via base.creation_traces (factory deployer).
--
-- VRGDA event  topic0 = 0xcc9c58b575eabd3f6a1ee653e91fcea3ff546867ffc3782a3bbca1f9b6dbb8df
--   data layout: [piece_id (uint256), price_wei (uint256)]   — 1 event = 1 NFT minted
--
-- Pack event   topic0 = 0xb51a16e9de896bb0db1c02c5ef3a351e39cf485f00b566ee0b521ca5243b5211
--   data layout: [field1, field2, price_wei]
--   TODO: verify which of field1/field2 is piece_id (currently assuming field1).
--         If pack events turn out not to carry piece_id, the pack UNION branch
--         must be removed and pack-mint piece attribution needs another source.

WITH vrgda_contracts AS (
    SELECT address
      FROM base.creation_traces
     WHERE "from" = 0xd2ee2d200d57007e6c62f29958bf43dc98075a47
),

vrgda_mints AS (
    SELECT
        block_time,
        varbinary_to_uint256(varbinary_substring(data, 1, 32)) AS piece_id,
        'auction' AS mint_source
      FROM base.logs
     WHERE contract_address IN (SELECT address FROM vrgda_contracts)
       AND topic0 = 0xcc9c58b575eabd3f6a1ee653e91fcea3ff546867ffc3782a3bbca1f9b6dbb8df
       AND varbinary_to_uint256(varbinary_substring(data, 1, 32)) BETWEEN 1 AND 32
),

pack_mints AS (
    -- Assumes first data word is piece_id. Verify against a real pack log.
    SELECT
        block_time,
        varbinary_to_uint256(varbinary_substring(data, 1, 32)) AS piece_id,
        'pack' AS mint_source
      FROM base.logs
     WHERE contract_address = 0xb3b4f451870b53586949f0af4ba754aaf8aed4f3
       AND topic0 = 0xb51a16e9de896bb0db1c02c5ef3a351e39cf485f00b566ee0b521ca5243b5211
       AND varbinary_to_uint256(varbinary_substring(data, 1, 32)) BETWEEN 1 AND 32
),

all_mints AS (
    SELECT * FROM vrgda_mints
    UNION ALL
    SELECT * FROM pack_mints
),

piece_lookup (piece_id, piece_name) AS (
    VALUES
        (1,  'Rocketman'),       (2,  'Fission Reactor'), (3,  'Phase Rook'),
        (4,  'Sumo Rook'),       (5,  'Aristocrat'),      (6,  'Basilisk'),
        (7,  'Blade Runner'),    (8,  'Bouncer'),         (9,  'Cardinal'),
        (10, 'Dancer'),          (11, 'Djinn'),           (12, 'Horde Mother'),
        (13, 'Icicle'),          (14, 'Marauder'),        (15, 'Pilgrim'),
        (16, 'Gunslinger'),      (17, 'Anti Violence'),   (18, 'Banker'),
        (19, 'Camel'),           (20, 'ElectroKnight'),   (21, 'Fish'),
        (22, 'Piñata'),          (23, 'Knightmare'),      (24, 'Blueprint'),
        (25, 'Epee Pawn'),       (26, 'Golden Pawn'),     (27, 'Hero Pawn'),
        (28, 'Iron Pawn'),       (29, 'Pawn w/ Knife'),   (30, 'Shrike'),
        (31, 'War Automaton'),   (32, 'Warp Jumper')
)

SELECT
    DATE_TRUNC('day', m.block_time) AS day,
    l.piece_name,
    COUNT(*) AS daily_mints
  FROM all_mints m
  JOIN piece_lookup l ON m.piece_id = l.piece_id
 GROUP BY 1, 2
 ORDER BY 1, 2;
