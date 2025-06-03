const { CurrencyAmount, Percent, TradeType, Token, Ether } = require("@uniswap/sdk-core")
const { computePoolAddress } = require("@uniswap/v3-sdk");
const IUniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json")
const QuoterABI = require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json")
const ethers = require("ethers")
const {jsonRPCProvider, UNISWAP_V3_FACTORY_ADDRESS, QUOTER_CONTRACT_ADDRESS} = require("../constants")
const provider = new ethers.providers.JsonRpcProvider(jsonRPCProvider)
const {truncateToDecimals} = require("./helper.js")


async function uniSwapv3(token0, token1, amountIn, feePercent, log = true){
    let poolExist = true
    const currentTokenPairPoolAddress = computePoolAddress({
        factoryAddress: UNISWAP_V3_FACTORY_ADDRESS,
        tokenA: token0,
        tokenB: token1,
        fee: feePercent
    })
    log == true ? console.log("uniswapv3 pool address = ", currentTokenPairPoolAddress):null
    const pool_contract_instance = new ethers.Contract(
        currentTokenPairPoolAddress,
        IUniswapV3PoolABI.abi,
        provider
    )

    await pool_contract_instance.liquidity()
    .then(liquidity=>{
        if(liquidity == 0){
            poolExist = false
        }
    }).catch(err=>{
        console.log(`(uniswapv3) NO POOL DETECTED @${feePercent/10000} for ${token0.symbol}/${token1.symbol}`)
        poolExist = false
    })

    if(!poolExist){
        return 0
    }
    const [tokenA, tokenB, fee, slot0, liquidity] = await Promise.all([
        pool_contract_instance.token0(),
        pool_contract_instance.token1(),
        pool_contract_instance.fee(),
        pool_contract_instance.slot0(),
        pool_contract_instance.liquidity()
    ])
      //creating an instance of quoter contract
    const quoterContractInstance = new ethers.Contract(
      QUOTER_CONTRACT_ADDRESS,
      QuoterABI.abi,
      provider
    )
    //Before calling our quoterContract, by default the token0 we get by reading the pool is the Token going in =>
    // & the token comming out is token1, so we have to first see if token0 is our desired token to swap in,
    // if not then switch the tokens places while calling quoteExactInputSingle 

    //getting the estimate quote
    const truncatedAmountIn = truncateToDecimals(amountIn, token0.decimals)
    const tokenOut = await quoterContractInstance.callStatic.quoteExactInputSingle(
      tokenA === token0.address ? tokenA:tokenB,
      tokenB === token1.address ? tokenB:tokenA,
      fee,
      ethers.utils.parseUnits(truncatedAmountIn.toString(), token0.decimals),
      0
    )
    const humanReadableTokenOut = ethers.utils.formatUnits(tokenOut._hex, token1.decimals)
    log == true ? console.log(`(uniswap v3) We swap ${truncatedAmountIn} ${token0.symbol} tokens for => ${humanReadableTokenOut} ${token1.symbol} @${fee/10000} fee`):null
    return {
        amountOut: humanReadableTokenOut,
        fee: feePercent
    }
}

module.exports = {uniSwapv3}