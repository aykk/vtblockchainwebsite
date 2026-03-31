const fs = require('fs');
const path = require('path');

// Read input files
const marketcapData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sample-data-marketcap.json'), 'utf8'));
const transfersData = JSON.parse(fs.readFileSync(path.join(__dirname, 'sampledata-transfers.json'), 'utf8'));

// Extract rows from results
const marketcapRows = marketcapData.result?.rows || [];
const transfersRows = transfersData.result?.rows || [];

// Calculate total marketcap stats
const totalMarketcap = marketcapRows.reduce((sum, row) => sum + (row.market_cap_usd || 0), 0);
const totalHolders = marketcapRows.reduce((sum, row) => sum + (row.holder_count || 0), 0);

// Top stablecoins by marketcap
const topStablecoins = marketcapRows
  .slice(0, 10)
  .map(row => ({
    symbol: row.token_symbol,
    marketCap: row.market_cap_usd,
    holders: row.holder_count
  }));

// Calculate transfers stats
const totalTransferVolume = transfersRows.reduce((sum, row) => sum + (row.total_volume_usd || 0), 0);
const totalTransfers = transfersRows.reduce((sum, row) => sum + (row.transfer_count || 0), 0);
const totalUniqueSenders = [...new Set(transfersRows.map(row => row.unique_senders))].length;

// Top chains by volume
const chainStats = {};
transfersRows.forEach(row => {
  if (!chainStats[row.blockchain]) {
    chainStats[row.blockchain] = {
      volume: 0,
      transfers: 0
    };
  }
  chainStats[row.blockchain].volume += row.total_volume_usd || 0;
  chainStats[row.blockchain].transfers += row.transfer_count || 0;
});

const topChains = Object.entries(chainStats)
  .map(([blockchain, stats]) => ({
    blockchain,
    volume: stats.volume,
    transfers: stats.transfers
  }))
  .sort((a, b) => b.volume - a.volume)
  .slice(0, 10);

// Combined output
const compressedStats = {
  timestamp: new Date().toISOString(),
  summary: {
    totalStablecoins: marketcapRows.length,
    totalMarketcapUsd: totalMarketcap,
    totalHolders: totalHolders,
    totalTransferVolume7d: totalTransferVolume,
    totalTransfers7d: totalTransfers,
    avgTransferUsd: totalTransferVolume / totalTransfers
  },
  topStablecoins,
  topChains,
  metadata: {
    marketcapLastUpdated: marketcapRows[0]?.last_updated_date,
    transfersPeriod: {
      first: transfersRows[0]?.first_transfer,
      last: transfersRows[0]?.last_transfer
    }
  }
};

// Write output
fs.writeFileSync(
  path.join(__dirname, 'stablecoin-stats-compressed.json'),
  JSON.stringify(compressedStats, null, 2)
);

console.log('Compressed stats written to stablecoin-stats-compressed.json');
console.log('Summary:', compressedStats.summary);
