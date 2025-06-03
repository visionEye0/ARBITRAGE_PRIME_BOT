# ARBITRAGE_PRIME_BOT

ARBITRAGE_PRIME_BOT is a DeFi trading bot designed to detect and exploit arbitrage opportunities between decentralized exchanges — specifically **Uniswap** and **Muffinswap** — on the Ethereum blockchain. It identifies price discrepancies between selected token pairs and simulates trade execution with estimated gas fees. If a profitable opportunity exists, it automatically executes the trade.

---

## 🚀 Features

- 📈 **Price Comparison Engine**: Compares token prices between Uniswap and Muffinswap.
- 🔍 **Arbitrage Searcher**: Continuously scans for profitable arbitrage scenarios.
- ⚙️ **Executor Module**: Automatically triggers a trade when a profitable opportunity is detected.
- 🔁 **Simulation Mode**: Estimates gas cost and net profit before execution.
- 📦 Built using:
  - [`@uniswap/v3-sdk`](https://github.com/Uniswap/v3-sdk)
  - [`ethers.js`](https://docs.ethers.org/)

---

## 💡 How It Works

The bot is split into two main components:

### 1. **searcher/**
Scans the DEX markets for arbitrage opportunities between token pairs:
- USDC
- USDT
- WBTC
- WETH
- DAI
- GFI
- UNI
- SUSHI

It simulates trades and evaluates profitability based on:
- Token price discrepancy
- Estimated gas costs
- Network conditions

### 2. **executor/**
Responsible for executing the arbitrage trades found by the `searcher`. Uses `ethers.js` to interact with smart contracts and perform real trades on-chain when a profitable opportunity is found.

---

## ⚙️ Installation

```bash
git clone https://github.com/yourusername/ARBITRAGE_PRIME_BOT.git
cd ARBITRAGE_PRIME_BOT
npm install
```

## 🧪 Usage

1. Run the searcher to monitor arbitrage oppurtunities:

```
node searcher/main.js
```

2. If an oppurtunity is found, executor will be triggered

```
node executor/main.js
```

## 📋 Notes

* Ensure your wallet has sufficient ETH for gas fees.

* Run on a fast node (e.g Private ethereum node) for low latency data

## 🔒 Disclaimer

This project is for educational and research purposes only. Use at your own risk. DeFi trading involves significant financial risk.

## 📄 License

MIT License