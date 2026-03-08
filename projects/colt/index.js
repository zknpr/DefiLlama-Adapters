const ADDRESSES = require('../helper/coreAssets.json')
const config = {
  saga: {
    d: {
      address: '0xB76144F87DF95816e8c55C240F874C554B4553C3',
      collateralVault: "0x70924f77509dC1EB9384077B12Ca049AA2168d6f",
    },
  }
}

async function getCollateralsTvl(api) {
  const networkConfig = config[api.chain]
  if (!networkConfig) return
  const vaults = Object.values(networkConfig).map(c => c.collateralVault)
  const collaterals = await api.multiCall({ abi: 'address[]:listCollateral', calls: vaults })
  const tokensAndOwners = collaterals.flatMap((tokens, i) => tokens.map(t => [t, vaults[i]]))
  return api.sumTokens({ tokensAndOwners })
}

module.exports = {
  methodology: 'Includes TVL for issued stablecoins (e.g. $D).',
  saga: {
    tvl: getCollateralsTvl
  },
};