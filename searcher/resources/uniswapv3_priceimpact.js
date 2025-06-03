//This is a function that calculates the price impact after a swap
const ethers = require("ethers")
const { computePoolAddress } = require("@uniswap/v3-sdk");
const IUniswapV3PoolABI = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json")
const {abi: Quoter2ABI} = require("@uniswap/v3-periphery/artifacts/contracts/lens/QuoterV2.sol/QuoterV2.json")
const {jsonRPCProvider, UNISWAP_V3_FACTORY_ADDRESS, QUOTER2_CONTRACT_ADDRESS} = require("../constants")
const provider = new ethers.providers.JsonRpcProvider(jsonRPCProvider)



async function uniswapv3PriceImpactCalculator(tokenIn, tokenOut, fee, amountIn){
    const currentTokenPairPoolAddress = computePoolAddress({
        factoryAddress: UNISWAP_V3_FACTORY_ADDRESS,
        tokenA: tokenIn,
        tokenB: tokenOut,
        fee: fee
    })    

    const pool_contract_instance = new ethers.Contract(
        currentTokenPairPoolAddress,
        IUniswapV3PoolABI.abi,
        provider
    )

    const [slot0, token0, token1] = await Promise.all([
        pool_contract_instance.slot0(),
        pool_contract_instance.token0(),
        pool_contract_instance.token1()

    ])
    const sqrtPriceX96Before = slot0.sqrtPriceX96
    const token0IsInput = token0 === tokenIn.address

    const priceBefore = sqrtPriceX96ToPrice(sqrtPriceX96Before, tokenIn, tokenOut, token0IsInput)

    const quoter2ContractInstance = new ethers.Contract(
        QUOTER2_CONTRACT_ADDRESS,
        Quoter2ABI,
        provider
    )

    const params = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        fee: fee,
        amountIn: ethers.utils.parseUnits(amountIn.toString(), tokenIn.decimals),
        sqrtPriceLimitX96: 0 //this is to make sure to swap with our amountIn until the price reaches this value 
    }

    const quote = await quoter2ContractInstance.callStatic.quoteExactInputSingle(params)
    const priceAfter = sqrtPriceX96ToPrice(quote.sqrtPriceX96After, tokenIn, tokenOut, token0IsInput)

    console.log(`priceBefore = ${priceBefore}, priceAfter = ${priceAfter}`)
}

function sqrtPriceX96ToPrice(sqrtPriceX96, tokenIn, tokenOut,token0IsInput){
    //sqrtPriceX96 = root(price) * 2^96
    const numerator = sqrtPriceX96**2
    const denominator = 2 ** 192
    const ratio = numerator/denominator
    const shiftDecimals = Math.pow(10, tokenIn.decimals - tokenOut.decimals)
    let price = ratio * shiftDecimals

    if(!token0IsInput){
        price = 1/price
    }

    return price
}

module.exports = {uniswapv3PriceImpactCalculator}






