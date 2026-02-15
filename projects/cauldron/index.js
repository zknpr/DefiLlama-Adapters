// This adaptor uses the Riftenlabs Indexer API to query for TVL.
//
// This indexer is open source (GPLv3) and available at:
// https://gitlab.com/riftenlabs/riftenlabs-indexer

const axios = require("axios");

const TOKEN_MAPPINGS = {
  // Example mapping:
  // 'token_id_hex': { coingeckoId: 'coingecko-id', decimals: 8 },
};

async function tvl({ timestamp }) {
  const { data } = await axios.get(`http://rostrum.cauldron.quest:8000/cauldron/tvl/${timestamp}`);

  const balances = {};
  let total_sats = BigInt(0);

  // Every token pair is matched with BCH. We collect total value locked on the BCH side of the contract.
  data.forEach((token_pair) => {
    total_sats += BigInt(token_pair.satoshis);

    if (TOKEN_MAPPINGS[token_pair.token_id]) {
      const { coingeckoId, decimals } = TOKEN_MAPPINGS[token_pair.token_id];
      const amount = Number(token_pair.token_amount) / (10 ** decimals);
      const key = `coingecko:${coingeckoId}`;
      balances[key] = (balances[key] || 0) + amount;
    }
  });

  balances['bitcoin-cash'] = Number(total_sats) / 1e8;

  return balances;
}

module.exports = {
  methodology: "Scrape the blockchain and filter for spent transaction outputs that match the cauldron contract's redeem script. Check if the transaction has an output with a locking script that matches the redeem script in the input. A match on locking script means the funds are still locked in the DEX contract. Aggregate the value of funds in contract utxos.",
  start: '2023-07-01',
  bitcoincash: { tvl },
  hallmarks: [
    ['2023-07-01', "First cauldron contract deployed (SOCK)"],
    ['2023-08-28', "Cauldron opens trading for any token"],
  ]
};
