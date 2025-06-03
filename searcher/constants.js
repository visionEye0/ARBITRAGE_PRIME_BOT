const { Token } = require("@uniswap/sdk-core")
require("dotenv").config()


const jsonRPCProvider = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`
const UNISWAP_V3_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984"
const QUOTER_CONTRACT_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"
const QUOTER2_CONTRACT_ADDRESS = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e"

const TOKEN_weth = new Token(1, //representing the ethereum mainnet chain id
    "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    18,
    "WETH",
    "Wrapped eth"
)


const TOKEN_wbtc = new Token(1,
    "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    8,
    "WBTC",
    "Wrapped BTC"
)



const TOKEN_dai = new Token(1,
    "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    18,
    "DAI",
    "DAI stablecoin"
)

const TOKEN_usdc = new Token(1,
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    6,
    "USDC",
    "Coinbase USD"
)

const TOKEN_usdt = new Token(1,
    "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    6,
    "USDT",
    "Tether USD"


)

const TOKEN_GFI = new Token(1,
    "0xdab396cCF3d84Cf2D07C4454e10C8A6F5b008D2b",
    18,
    "GFI",
    "Goldfinch"
)

const TOKEN_sushi = new Token(1,
    "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2",
    18,
    "SUSHI",
    "Token SUSHI"
)

const TOKEN_UNI = new Token(1,
    "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    18,
    "UNI",
    "Token Uniswap"
)

module.exports = {TOKEN_GFI, TOKEN_UNI, TOKEN_sushi, TOKEN_dai, TOKEN_usdc, TOKEN_usdt, TOKEN_wbtc, TOKEN_weth, jsonRPCProvider, UNISWAP_V3_FACTORY_ADDRESS, QUOTER_CONTRACT_ADDRESS, QUOTER2_CONTRACT_ADDRESS }

