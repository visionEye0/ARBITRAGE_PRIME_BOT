const { getContracts, SupportedChainId, Pool, Route, Trade, SwapManager, encodeRouteToPath, MAX_TIER_CHOICES, ALL_TIERS, MaxUint256 } = require("@muffinfi/muffin-sdk")
const {ethers} = require("ethers")
const {jsonRPCProvider} = require("../constants")
const provider = new ethers.providers.JsonRpcProvider(jsonRPCProvider)
const {hub, manager, lens} = getContracts(SupportedChainId.MAINNET, provider)
const {truncateToDecimals} = require("./helper.js")

async function muffinSwap(token0, token1, amountIn, log = true){
    // compute pool id
    const poolId = Pool.computePoolId(token0, token1)
    log == true ? console.log("pool id = ", poolId):null
    // Fetch chain data
    const [tickSpacing] = await hub.getPoolParameters(poolId)
    const tiersData = await hub.getAllTiers(poolId)
    // console.log("tickSpacing = ", tickSpacing)
    const pool = Pool.fromChainData(token0, token1, tickSpacing, tiersData)

    // pool.tiers[0].token1Price.toSignificant(10)

    // creating a route instance for swap
    const route = new Route([pool], [ALL_TIERS], token0, token1)
    // truncate the amountin upto token0.decimals
    const truncatedAmountIn = truncateToDecimals(amountIn, token0.decimals)
    const amountInFormatted = ethers.utils.parseUnits(truncatedAmountIn.toString(), token0.decimals)
    const { amountOut } = await lens.simulate(encodeRouteToPath(route, false), amountInFormatted)
    const humanReadableTokenOut = ethers.utils.formatUnits(amountOut, token1.decimals)
    log == true ? console.log(`(muffinswap) we swap ${truncatedAmountIn} ${token0.symbol} for ${humanReadableTokenOut} ${token1.symbol}`):null
    return humanReadableTokenOut
}


module.exports = {muffinSwap}