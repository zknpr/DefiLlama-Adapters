const { getLogs } = require('../helper/cache/getLogs')

const factory = '0xd696e56b3a054734d4c6dcbd32e11a278b0ec458'

async function tvl(api) {
  // Try both indexed and non-indexed event signatures to be robust against ABI uncertainty
  // The factory emits "Deployed(address contract, string identifier)"
  // We scan from block 16M (early 2023) as a safe starting point.
  // If minters were deployed earlier, this needs to be adjusted.
  const fromBlock = 16000000;

  const logsNonIndexed = await getLogs({
    target: factory,
    eventAbi: 'event Deployed(address contract, string identifier)',
    onlyArgs: true,
    fromBlock,
    api,
  }).catch(() => [])

  const logsIndexed = await getLogs({
    target: factory,
    eventAbi: 'event Deployed(address indexed contract, string identifier)',
    onlyArgs: true,
    fromBlock,
    api,
  }).catch(() => [])

  const allLogs = [...logsNonIndexed, ...logsIndexed]

  const allContracts = allLogs
    .filter(log => log.identifier && (log.identifier.endsWith('::minter') || log.identifier.endsWith('::genesis')))
    .map(log => log.contract)

  // Deduplicate addresses
  const uniqueContracts = [...new Set(allContracts)]

  if (uniqueContracts.length === 0) {
    // If no contracts found, we log a warning but don't throw, to avoid breaking the adapter if factory is dormant
    // but we expect at least the known minters if the range covers their deployment.
    api.log('No HarborFi minter/genesis contracts found via dynamic discovery.')
  }

  const collateralTokens = await api.multiCall({ abi: 'address:WRAPPED_COLLATERAL_TOKEN', calls: uniqueContracts, permitFailure: true });

  const validTokens = []
  const validOwners = []

  collateralTokens.forEach((token, i) => {
    if (token) {
      validTokens.push(token)
      validOwners.push(uniqueContracts[i])
    }
  })

  return api.sumTokens({ tokensAndOwners2: [validTokens, validOwners] });
}

module.exports = {
  methodology: 'TVL is calculated by summing the balances of collateral tokens held by all 0xHarborFi minter and genesis contracts. Contracts are discovered dynamically from factory events.',
  ethereum: {
    tvl,
  },
};
