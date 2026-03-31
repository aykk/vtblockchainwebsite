SELECT
    blockchain,
    token_symbol,
    COUNT(*) as transfer_count,
    SUM(amount_usd) as total_volume_usd,
    AVG(amount_usd) as avg_transfer_usd,
    COUNT(DISTINCT "from") as unique_senders,
    COUNT(DISTINCT "to") as unique_receivers,
    MIN(block_time) as first_transfer,
    MAX(block_time) as last_transfer
FROM stablecoins_evm.transfers
WHERE block_date >= date_trunc('day', now()) - INTERVAL '7' day
GROUP BY blockchain, token_symbol
HAVING SUM(amount_usd) > 0
ORDER BY total_volume_usd DESC
LIMIT 100;
