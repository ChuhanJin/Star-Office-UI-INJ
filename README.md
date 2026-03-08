# Star Office UI

This repository contains the Star Office UI project, a pixel-art styled office dashboard for visualizing AI agent work status in real-time, with Injective blockchain wallet integration.

## Recent Updates

- **Injective Wallet Integration** — Connect, view balance, and send transactions from the office UI
- Work Log panel (formerly "Yesterday Notes") now displays real-time task updates
- Office name updated to **Vincent Co.Tech** across all language versions
- Automatic state synchronization via `set_state.py`
- Scrollable log area with larger font for better readability

## Features

- Real-time work status visualization
- Automatic state management with 6 states: `idle`, `writing`, `researching`, `executing`, `syncing`, `error`
- **Injective Wallet Panel** — Connect wallet, view INJ balance, refresh on-chain data
- Multi-language support (Chinese, English, Japanese)
- Responsive design for desktop and mobile
- Integration with OpenClaw agent framework
- Live log updates with work record panel
- Multi-agent support with guest agent system

## Quick Start

### Installation

```bash
git clone https://github.com/ChuhanJin/Star-Office-UI-INJ.git
cd Star-Office-UI-INJ

python3 -m pip install -r backend/requirements.txt
cp state.sample.json state.json
```

### Running the Server

```bash
cd backend
python3 app.py
```

Open your browser at `http://127.0.0.1:19000` to access the UI.

### Updating the Work Log

```bash
python3 set_state.py executing "Your task description here"
python3 set_state.py idle "Task complete"
```

The Work Log panel will automatically refresh with the latest status message.

## Wallet Integration

The office UI includes an Injective wallet panel for on-chain interaction.

### Wallet API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/wallet/health` | GET | Check if wallet service is available |
| `/wallet/connect` | POST | Connect to a wallet (auto-creates default if none) |
| `/wallet/list` | GET | List all available wallets |
| `/wallet/create` | POST | Create a new wallet |
| `/wallet/balance` | GET | Query balance for an address |
| `/wallet/send` | POST | Send an INJ transaction |

### Connect via API

```bash
# Connect to default wallet
curl -X POST http://localhost:19000/wallet/connect \
  -H "Content-Type: application/json" \
  -d '{"is_testnet": false}'

# Check balance
curl "http://localhost:19000/wallet/balance?address=inj1..."

# Create named wallet
curl -X POST http://localhost:19000/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"name": "my-wallet"}'
```

### Chain Configuration

- **Mainnet**: `injective-1` via `https://sentry.tm.injective.network:443`
- **Testnet**: `injective-888` via `https://testnet.sentry.tm.injective.network:443`

The wallet module supports both direct `injectived` CLI calls and a local demo mode for development. When `injectived` is available and configured, it queries the real chain; otherwise it falls back to demo data.

## Project Structure

```
Star-Office-UI-INJ/
├── backend/              # Flask backend server
│   ├── app.py            # Main application with all routes
│   ├── wallet_utils.py   # Injective wallet integration
│   ├── security_utils.py # Security helpers
│   ├── memo_utils.py     # Work log utilities
│   └── store_utils.py    # State persistence
├── frontend/             # HTML/CSS/JS UI files
│   ├── index.html        # Main UI page
│   ├── wallet.js         # Wallet panel controller
│   ├── game.js           # Phaser game logic
│   ├── layout.js         # UI layout logic
│   └── log.txt           # Real-time work log
├── set_state.py          # State management script
├── state.sample.json     # State template
├── README.md             # This file
└── LICENSE               # MIT License
```

## API Endpoints

### Core
- `GET /health` — Health check
- `GET /status` — Get current status
- `POST /set_state` — Update state
- `GET /yesterday-memo` — Get work log

### Wallet
- `GET /wallet/health` — Wallet service health check
- `POST /wallet/connect` — Connect to wallet
- `GET /wallet/list` — List wallets
- `POST /wallet/create` — Create wallet
- `GET /wallet/balance` — Query balance
- `POST /wallet/send` — Send transaction

### Agents
- `GET /agents` — List all agents
- `POST /join-agent` — Join as guest agent
- `POST /leave-agent` — Leave office
- `POST /agent-push` — Push agent status update

## Configuration

Edit `state.json` to customize office appearance, agent names, and settings.

## License

MIT © OpenClaw contributors

## Support

For issues, feature requests, or contributions, please open an issue or pull request on GitHub.
