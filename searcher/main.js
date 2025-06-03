const { TOKEN_usdc, TOKEN_usdt, TOKEN_wbtc, TOKEN_weth, TOKEN_dai, TOKEN_GFI, TOKEN_UNI, TOKEN_sushi} = require("./constants.js")
const { muffinSwap } = require("./resources/muffinSwap.js")
const { uniSwapv3 } = require("./resources/uniswapv3.js")
const { uniswapv3PriceImpactCalculator } = require("./resources/uniswapv3_priceimpact.js")
// const signer = new ethers.Wallet('private key', provider)


async function searcher(){
    let percentDiffLimit = .1 //percentage difference between successive maxinput guesses for maximizeOutput function
    // let tokenInAmount = .00512
    let tokenInAmount = 50

    //These are all the tokens in muffinswap which has enough liquidity to give
    //us a profitable arbitrage trade

    //finding arbitrage with these tokens b/w uniswapv3 & muffinswap
    let muffinSwapAllListedTokens = [TOKEN_usdc, TOKEN_usdt, TOKEN_wbtc, TOKEN_weth, TOKEN_dai, TOKEN_GFI, TOKEN_UNI, TOKEN_sushi]

    //most of the times there only exists stablecoin/erc20 pair or (eth/weth)/erc20 pair,
    //all other erc20/erc20 pair are in some ways routing to erc20/(weth/stablecoin) to (weth/stablecoin)/erc20 pair
    // so we're gonna create all (weth/stablecoin)/erc20 pairs with the given tokens above

    //in this 2d array the base tokens (weth/usdc/usdt/dai) are put on the left side of the array 
    //TO do: implement uniswap multi routeswap to implement [TOKEN_usdc, TOKEN_GFI] pair
    let muffinSwapPairCombinations = [[TOKEN_usdt, TOKEN_weth]]
    
    //calculate price impact by getting the actual token0/token1 value from highly liquid defi exchange
    //compare that value with the expected output from muffinswap and get the priceimpact percentage

    for(const pair of muffinSwapPairCombinations){
        console.log(`(0) we reached here, currentPair = ${pair[0].symbol}/${pair[1].symbol}`)

        //step 1 see if an arbitrage exists
        let baseToken = pair[0] //The token in which we want the final profits to be accumulated in

        //PLAN A - buy from muffinswap and sell it to uniswap to see if there's an arb
        let muffinSwapAmountOut = await muffinSwap(pair[0], pair[1], tokenInAmount)

        //finding price uniswapv3 for the tokenpair in each fee tier and take the one with the largest output
        let uniswapv3Outputs = await Promise.all([
            uniSwapv3(pair[1], pair[0], muffinSwapAmountOut, 100),
            uniSwapv3(pair[1], pair[0], muffinSwapAmountOut, 500),
            uniSwapv3(pair[1], pair[0], muffinSwapAmountOut, 3000),
            uniSwapv3(pair[1], pair[0], muffinSwapAmountOut, 10000)
        ])

        let uniswapv3OptimalOutput = findUniswapv3OptimalOutput(uniswapv3Outputs)

        //determining if there's an arb in PLAN A
        if(uniswapv3OptimalOutput.amountOut > tokenInAmount){
            console.log("There is an arb in PLAN A (buy from muffinswap and sell it to uniswap)")
            //find max arb input
            const maxTokenInputAmount = await maximizeOutput(uniswapv3OptimalOutput.fee, tokenInAmount, true, pair[0], pair[1], 1, percentDiffLimit)
            console.log("max input calculation finished, maxcurrenttokenIn = ", maxTokenInputAmount.maxTokenAmountIn)
        }
        else if(uniswapv3OptimalOutput.amountOut < tokenInAmount){
        //PLAN B - buy from uniswapv3 and sell it to muffinswap, to see if there's an arb
            uniswapv3Outputs = await Promise.all([
                uniSwapv3(pair[0], pair[1], tokenInAmount, 100),
                uniSwapv3(pair[0], pair[1], tokenInAmount, 500),
                uniSwapv3(pair[0], pair[1], tokenInAmount, 3000),
                uniSwapv3(pair[0], pair[1], tokenInAmount, 10000)
            ])

            uniswapv3OptimalOutput = findUniswapv3OptimalOutput(uniswapv3Outputs)

            muffinSwapAmountOut = await muffinSwap(pair[1], pair[0], uniswapv3OptimalOutput.amountOut)
            if(muffinSwapAmountOut > tokenInAmount){
                //find max arb input
                console.log("\n(buy from uniswapv3 and sell it to muffinswap)")
                console.log(`There is an arb in PLAN B for  ${pair[0].symbol}/${pair[1].symbol}`)
                const maxTokenInputAmount = await maximizeOutput(uniswapv3OptimalOutput.fee, tokenInAmount, false, pair[0], pair[1], 1, percentDiffLimit)
                console.log("TTTTmax input calculation finished, maxcurrenttokenIn = ", maxTokenInputAmount.maxTokenAmountIn)
            }

        }

    }
}

async function maximizeOutput(uniswapv3Fee, initialTokenInAmount, isMuffinBuyUniswapv3Sell, token0, token1, multiplierOffset, percentDiffLimit, setPreviousProfit=0, setPreviousTokenInAmount=0){
    let previousTokenInAmount = setPreviousTokenInAmount
    let muffinSwapAmountOut
    let uniswapV3Output
    let uniswapV3AmountOut
    let previousProfit = setPreviousProfit
    let currentProfit
    let multiplier = 1 + multiplierOffset
    let percentDiff
    let currentMultiplierOffset = multiplierOffset
    let currentTokenInAmount = initialTokenInAmount * multiplier
    let isCurrentProfitAlreadyCalculated = false
    let previousTokenInPercentValue
    let previousTokenInPercentage = .1
    let previousTokenInPercentProfit
    if(isMuffinBuyUniswapv3Sell){
        muffinSwapAmountOut = await muffinSwap(token0, token1, currentTokenInAmount)
        uniswapV3Output = await uniSwapv3(token1, token0, muffinSwapAmountOut, uniswapv3Fee)
        uniswapV3AmountOut = uniswapV3Output.amountOut
        currentProfit = uniswapV3AmountOut - currentTokenInAmount
        percentDiff = percentageDifference(currentProfit, previousProfit)
        isCurrentProfitAlreadyCalculated = true
        while (percentDiff > percentDiffLimit){
            console.log("\n=======================================")
            if(!isCurrentProfitAlreadyCalculated){
                muffinSwapAmountOut = await muffinSwap(token0, token1, currentTokenInAmount)
                uniswapV3Output = await uniSwapv3(token1, token0, muffinSwapAmountOut, uniswapv3Fee)
                uniswapV3AmountOut = uniswapV3Output.amountOut
                currentProfit = uniswapV3AmountOut - currentTokenInAmount
            }
            isCurrentProfitAlreadyCalculated = false

            //double the inputed amount, if the current profit is greater than previous profit
            console.log(`prev profit = ${previousProfit}, curr profit = ${currentProfit} for ${token0.symbol}/${token1.symbol}`)
            console.log(`prev token in = ${previousTokenInAmount}, curr token in = ${currentTokenInAmount}`)

            //if the percentage difference between them is less than percentDiff, we'll stop and return the value
            percentDiff = percentageDifference(currentProfit, previousProfit)
            console.log("percentage difference = ", percentDiff)

            if(currentProfit > previousProfit){
                previousProfit = currentProfit
                previousTokenInAmount = currentTokenInAmount
                currentTokenInAmount = currentTokenInAmount * multiplier
            }
            else{
                previousTokenInPercentValue = percentageFinder(previousTokenInAmount, (100-previousTokenInPercentage))
                muffinSwapAmountOut = await muffinSwap(token0, token1, previousTokenInPercentValue)
                uniswapV3Output = await uniSwapv3(token1, token0, muffinSwapAmountOut, uniswapv3Fee)
                previousTokenInPercentProfit = uniswapV3Output.amountOut - previousTokenInPercentValue

                muffinSwapAmountOut = await muffinSwap(token0, token1, previousTokenInAmount)
                uniswapV3Output = await uniSwapv3(token1, token0, muffinSwapAmountOut, uniswapv3Fee)
                previousProfit = uniswapV3Output.amountOut - previousTokenInAmount
                
                console.log(`FFF-previousTokenInPercentProfit = ${previousTokenInPercentProfit}, previousProfit = ${previousProfit}, condition = ${previousTokenInPercentProfit>previousProfit}`)
                if(previousTokenInPercentProfit > previousProfit){
                    console.log("FFFnew condition working")
                    let previousPreviousTokenIn = previousTokenInAmount/multiplier
                    // let previousPreviousTokenInForwardHalf = (previousPreviousTokenIn+previousTokenInAmount)/2
                    // let previousPreviousTokenInForwardForwardHalf = (previousPreviousTokenInForwardHalf+previousTokenInAmount)/2
                    // let newMultiplier = previousPreviousTokenInForwardForwardHalf/previousPreviousTokenInForwardHalf
                    // currentMultiplierOffset = newMultiplier - 1
                    currentMultiplierOffset = multiplierOffset/2

                    return await maximizeOutput(uniswapv3Fee, previousPreviousTokenIn, isMuffinBuyUniswapv3Sell, token0, token1, currentMultiplierOffset, percentDiffLimit, previousProfit, previousPreviousTokenIn)

                }
                else{
                    currentMultiplierOffset = multiplierOffset/2
                    return await maximizeOutput(uniswapv3Fee, previousTokenInAmount, isMuffinBuyUniswapv3Sell, token0, token1, currentMultiplierOffset, percentDiffLimit, previousProfit, previousTokenInAmount)
                }
                
                
            }
        }

        return {maxTokenAmountIn: (currentProfit>previousProfit) ? currentTokenInAmount:previousTokenInAmount}
    }
    else{
        uniswapV3Output = await uniSwapv3(token0, token1, currentTokenInAmount, uniswapv3Fee)
        muffinSwapAmountOut = await muffinSwap(token1, token0, uniswapV3Output.amountOut)
        currentProfit = muffinSwapAmountOut - currentTokenInAmount
        percentDiff = percentageDifference(currentProfit, previousProfit)
        isCurrentProfitAlreadyCalculated = true

        while (percentDiff > percentDiffLimit){
            console.log("\nTTTTT=======================================")
            if(!isCurrentProfitAlreadyCalculated){
                uniswapV3Output = await uniSwapv3(token0, token1, currentTokenInAmount, uniswapv3Fee)
                muffinSwapAmountOut = await muffinSwap(token1, token0, uniswapV3Output.amountOut)
                currentProfit = muffinSwapAmountOut - currentTokenInAmount
            }
            isCurrentProfitAlreadyCalculated = false

            //double the inputed amount, if the current profit is greater than previous profit
            console.log(`prev profit = ${previousProfit}, curr profit = ${currentProfit} for ${token0.symbol}/${token1.symbol}`)
            console.log(`prev token in = ${previousTokenInAmount}, curr token in = ${currentTokenInAmount}`)

            //if the percentage difference between them is less than percentDiff, we'll stop and return the value
            percentDiff = percentageDifference(currentProfit, previousProfit)
            console.log("percentage difference = ", percentDiff)

            if(currentProfit > previousProfit){
                previousProfit = currentProfit
                previousTokenInAmount = currentTokenInAmount
                currentTokenInAmount = currentTokenInAmount * multiplier
            }
            else{
                previousTokenInPercentValue = percentageFinder(previousTokenInAmount, (100-previousTokenInPercentage))
                uniswapV3Output = await uniSwapv3(token0, token1, previousTokenInPercentValue, uniswapv3Fee)
                muffinSwapAmountOut = await muffinSwap(token1, token0, uniswapV3Output.amountOut)
                previousTokenInPercentProfit = muffinSwapAmountOut - previousTokenInPercentValue

                uniswapV3Output = await uniSwapv3(token0, token1, previousTokenInAmount, uniswapv3Fee)
                muffinSwapAmountOut = await muffinSwap(token1, token0, uniswapV3Output.amountOut)
                previousProfit = muffinSwapAmountOut - previousTokenInAmount

                console.log(`TTTpreviousTokenInPercentProfit = ${previousTokenInPercentProfit}, previousProfit = ${previousProfit}, condition = ${previousTokenInPercentProfit>previousProfit}`)
                if(previousTokenInPercentProfit > previousProfit){
                    console.log("new condition working")
                    let previousPreviousTokenIn = previousTokenInAmount/multiplier
                    // let previousPreviousTokenInForwardHalf = (previousPreviousTokenIn+previousTokenInAmount)/2
                    // let previousPreviousTokenInForwardForwardHalf = (previousPreviousTokenInForwardHalf+previousTokenInAmount)/2
                    // let newMultiplier = previousPreviousTokenInForwardForwardHalf/previousPreviousTokenInForwardHalf
                    // currentMultiplierOffset = newMultiplier - 1
                    currentMultiplierOffset = multiplierOffset/2

                    return await maximizeOutput(uniswapv3Fee, previousPreviousTokenIn, isMuffinBuyUniswapv3Sell, token0, token1, currentMultiplierOffset, percentDiffLimit, previousProfit, previousPreviousTokenIn)
                }
                else{
                    currentMultiplierOffset = multiplierOffset/2
                    return await maximizeOutput(uniswapv3Fee, previousTokenInAmount, isMuffinBuyUniswapv3Sell, token0, token1, currentMultiplierOffset, percentDiffLimit, previousProfit, previousTokenInAmount)
                }

                


                
                
            }
        }

        return {maxTokenAmountIn: (currentProfit>previousProfit) ? currentTokenInAmount:previousTokenInAmount}

    }

}

function percentageDifference(x, y){
    let numerator = Math.abs(x-y)
    let denominator = (x+y)/2
    let result = (numerator/denominator)*100

    return result
}

function findUniswapv3OptimalOutput(uniswapv3Outputs_array){
    let uniswapv3MaxOutput = 0
    let uniswapv3MaxOutputFee
    for(let i = 0; i<uniswapv3Outputs_array.length; i++){
        if(uniswapv3Outputs_array[i].amountOut > uniswapv3MaxOutput){
            uniswapv3MaxOutput = uniswapv3Outputs_array[i].amountOut
            uniswapv3MaxOutputFee = uniswapv3Outputs_array[i].fee
        }
    }

    return {
        amountOut: uniswapv3MaxOutput,
        fee: uniswapv3MaxOutputFee
    }
}

function percentageFinder(value, percentToFind){
    return value*(percentToFind/100)
}

searcher()

// uniSwapv3(TOKEN_weth, TOKEN_UNI, 0.0019200000000000003, 3000, log=true)



// async function main(){

//     let swap1 = await muffinSwap(TOKEN_usdc, TOKEN_usdt, 0.00001, log=true)
//     let swap2 = await uniSwapv3(TOKEN_usdt, TOKEN_usdc, swap1, 500, log=true)

// }

// main()




