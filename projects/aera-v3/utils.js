const contracts = require('./contracts');
const { getLogs } = require('../helper/cache/getLogs')

async function getMultiDepositorVaults(api) {
    const vaults = [];
    const factory = contracts[api.chain].multiDepositorVaultFactory;
    const logs = await getLogs({
        api,
        target: factory.address,
        topic: factory.topic,
        topics: factory.topics,
        eventAbi: factory.eventAbi,
        fromBlock: factory.fromBlock,
        onlyArgs: true,
    });
    vaults.push(...logs.map(x => x.vault))
    return vaults;
}

async function getSingleDepositorVaults(api) {
    const vaults = [];
    const factory = contracts[api.chain].singleDepositorVaultFactory;
    const logs = await getLogs({
        api,
        target: factory.address,
        topic: factory.topic,
        topics: factory.topics,
        eventAbi: factory.eventAbi,
        fromBlock: factory.fromBlock,
        onlyArgs: true,
    });
    // if (logs.length > 0) throw new Error(JSON.stringify(logs[0]));
    vaults.push(...logs.map(x => ({ vault: x.vault, feeToken: x.feeToken })))
    return vaults;
}

module.exports = {
    getMultiDepositorVaults,
    getSingleDepositorVaults,
};
