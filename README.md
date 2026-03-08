# Star Office UI

A pixel-art styled office dashboard for visualizing AI agent work status in real-time, with **Injective EVM wallet integration via MetaMask**.

## Features

- Real-time work status visualization
- Automatic state management with 6 states: `idle`, `writing`, `researching`, `executing`, `syncing`, `error`
- **MetaMask Wallet Integration** — Connect wallet, view INJ balance on Injective EVM
- **Injective EVM Support** — Mainnet (Chain ID 1776) & Testnet (Chain ID 1439) with auto network add to MetaMask
- Multi-agent support with guest agent system
- Responsive design for desktop and mobile
- Integration with OpenClaw agent framework
- Real-time work log updates

## Quick Start

### Installation

```bash
git clone https://github.com/ChuhanJin/Star-Office-UI-INJ.git
cd Star-Office-UI-INJ

pip install flask requests
cp state.sample.json state.json
```

### Running the Server

```bash
cd backend
python3 app.py
```

Open your browser at `http://127.0.0.1:19000` to access the UI.

### Connecting MetaMask

1. Install [MetaMask](https://metamask.io) browser extension
2. Open the office UI at `http://127.0.0.1:19000`
3. Click **Connect Wallet** in the wallet panel
4. Approve the MetaMask connection
5. If Injective EVM network is not configured, it will be auto-added to MetaMask
6. Use **Toggle Network** to switch between Mainnet and Testnet

## Wallet Integration

### Injective EVM Networks

Official documentation: https://docs.injective.network/developers-evm/network-information

| Network | EVM Chain ID | Cosmos Chain ID | RPC URL | Explorer |
|---------|------|---|---------|----------|
| **Mainnet** | 1776 | injective-1 | `https://sentry.evm-rpc.injective.network/` | [blockscout.injective.network](https://blockscout.injective.network/) |
| **Testnet** | 1439 | injective-888 | `https://k8s.testnet.json-rpc.injective.network/` | [testnet.blockscout.injective.network](https://testnet.blockscout.injective.network/) |

### Architecture

The wallet integration uses a **frontend-first approach**:

- **Frontend** (`viem-wallet.js`): Manages MetaMask connection via `window.ethereum` (EIP-1193 provider). Handles account selection, balance queries, and network switching directly through MetaMask.
- **Backend** (`viem_wallet.py`, `evm_config.py`): Provides JSON-RPC proxy endpoints for server-side balance queries, gas estimation, and network configuration. Acts as a fallback when frontend queries fail.

### Wallet API Endpoints

#### EVM (MetaMask-compatible)

| Endpoint | Method | Description |
|---|---|---|
| `/evm/networks` | GET | List all Injective EVM networks with chain config |
| `/evm/network/<name>` | GET | Get specific network config (mainnet/testnet) |
| `/evm/balance` | GET | Query balance for an 0x address |
| `/evm/gas-price` | GET | Get current gas price |
| `/evm/block-number` | GET | Get current block number |
| `/evm/estimate-gas` | POST | Estimate gas for a transaction |

#### Legacy (Cosmos/injectived CLI)

| Endpoint | Method | Description |
|---|---|---|
| `/wallet/health` | GET | Check CLI availability |
| `/wallet/connect` | POST | Connect via CLI |
| `/wallet/list` | GET | List CLI wallets |
| `/wallet/create` | POST | Create CLI wallet |
| `/wallet/balance` | GET | Query balance via CLI |
| `/wallet/send` | POST | Send via CLI |

### Usage Examples

```bash
# Get available networks
curl http://localhost:19000/evm/networks

# Query balance (EVM address)
curl "http://localhost:19000/evm/balance?address=0x...&network=mainnet"

# Get gas price
curl "http://localhost:19000/evm/gas-price?network=mainnet"

# Get block number
curl "http://localhost:19000/evm/block-number?network=testnet"
```

## Project Structure

```
Star-Office-UI-INJ/
├── backend/
│   ├── app.py              # Flask application with all routes
│   ├── viem_wallet.py      # EVM wallet manager (JSON-RPC)
│   ├── evm_config.py       # Injective EVM network configuration
│   ├── wallet_utils.py     # Legacy Cosmos wallet integration
│   ├── security_utils.py   # Security helpers
│   ├── memo_utils.py       # Work log utilities
│   └── store_utils.py      # State persistence
├── frontend/
│   ├── index.html          # Main UI page
│   ├── viem-wallet.js      # MetaMask wallet controller
│   ├── game.js             # Phaser game logic
│   └── layout.js           # UI layout logic
├── set_state.py            # State management script
├── state.sample.json       # State template
├── README.md               # This file
└── LICENSE                 # MIT License
```

## API Endpoints

### Core
- `GET /health` — Health check
- `GET /status` — Get current status
- `POST /set_state` — Update state
- `GET /yesterday-memo` — Get work log

### EVM Wallet (MetaMask)
- `GET /evm/networks` — Network configurations
- `GET /evm/balance` — Query EVM balance
- `GET /evm/gas-price` — Current gas price
- `GET /evm/block-number` — Latest block number
- `POST /evm/estimate-gas` — Gas estimation

### Agents
- `GET /agents` — List all agents
- `POST /join-agent` — Join as guest agent
- `POST /leave-agent` — Leave office
- `POST /agent-push` — Push agent status

## MetaMask Setup

MetaMask will automatically prompt to add Injective EVM networks when you click "Connect Wallet". Manual configuration:

**Mainnet:**
- Network Name: Injective
- RPC URL: `https://sentry.evm-rpc.injective.network/`
- Chain ID: `1776`
- Currency Symbol: `INJ`
- Explorer: `https://blockscout.injective.network/`

**Testnet:**
- Network Name: Injective Testnet
- RPC URL: `https://k8s.testnet.json-rpc.injective.network/`
- Chain ID: `1439`
- Currency Symbol: `INJ`
- Explorer: `https://testnet.blockscout.injective.network/`
- Faucet: `https://testnet.faucet.injective.network/`

## Configuration

Edit `state.json` to customize office appearance, agent names, and settings.

## License

MIT © OpenClaw contributors

## Support

For issues, feature requests, or contributions, please open an issue or pull request on GitHub.
