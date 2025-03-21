# Veltis - IP NFT Tokenization Platform

This repository contains the Veltis platform configured to work with Hardhat Local network for easy development and testing.

## Features

- IP NFT Tokenization
- Fractionalization of IP NFTs
- Marketplace for trading IP NFTs and fractions
- Integration with IPFS via NFT.Storage
- Hardhat Local network configuration for development

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file based on the `.env.example`
4. Start the local Hardhat node: `npx hardhat node`
5. Deploy the contracts: `npx hardhat run scripts/minimal-deploy.js --network localhost`
6. Start the frontend: `cd veltis-frontend && npm run dev`

## Connect to Hardhat Local in MetaMask

1. Open MetaMask
2. Add a new network with these settings:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 31337
   - Currency Symbol: ETH

3. Import one of the test accounts that Hardhat provides (check the private keys in the Hardhat node console output)

## Improvements Made

- Updated Web3Provider to properly detect and connect to Hardhat Local network
- Simplified contracts for easier local deployment
- Fixed NFT.Storage integration with proper error handling
- Updated environment variables for local development

## License

MIT