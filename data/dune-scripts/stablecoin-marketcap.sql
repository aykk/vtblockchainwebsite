SELECT
    token_symbol,
    COUNT(DISTINCT address) as holder_count,
    SUM(balance_usd) as market_cap_usd,
    AVG(balance_usd) as avg_balance_usd,
    MAX(day) as last_updated_date
FROM stablecoins_evm.balances
WHERE day = (SELECT MAX(day) FROM stablecoins_evm.balances)
GROUP BY token_symbol
HAVING SUM(balance_usd) > 0
ORDER BY market_cap_usd DESC
LIMIT 50;