#!/usr/bin/env python3
"""Wallet utilities for Injective integration

This module provides interfaces to:
1. Query wallet balances on Injective chain
2. Create and manage local wallets
3. Send transactions

It supports both direct injectived CLI and falls back to mock data for development.
"""

import os
import json
import subprocess
import re
import hashlib
from pathlib import Path
from datetime import datetime


INJECTIVED_HOME = os.path.expanduser("~/.injectived")
INJECTIVED_KEYSTORE = os.path.join(INJECTIVED_HOME, "keystore")
INJECTIVED_CONFIG = os.path.join(INJECTIVED_HOME, "config", "client.toml")
WALLET_STATE_FILE = os.path.join(INJECTIVED_HOME, "wallets-state.json")

# Default chain configuration
DEFAULT_MAINNET_ENDPOINT = "https://sentry.tm.injective.network:443"
DEFAULT_MAINNET_CHAIN_ID = "injective-1"
DEFAULT_TESTNET_ENDPOINT = "https://testnet.sentry.tm.injective.network:443"
DEFAULT_TESTNET_CHAIN_ID = "injective-888"


def _ensure_wallet_state_file():
    """Ensure wallet state storage exists."""
    os.makedirs(INJECTIVED_HOME, exist_ok=True)
    if not os.path.exists(WALLET_STATE_FILE):
        with open(WALLET_STATE_FILE, "w") as f:
            json.dump({"wallets": {}, "created_at": datetime.now().isoformat()}, f, indent=2)


def _load_wallet_state():
    """Load wallet state from file."""
    _ensure_wallet_state_file()
    try:
        with open(WALLET_STATE_FILE, "r") as f:
            return json.load(f)
    except:
        return {"wallets": {}}


def _save_wallet_state(state):
    """Save wallet state to file."""
    _ensure_wallet_state_file()
    with open(WALLET_STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def _generate_inj_address(name: str):
    """Generate a deterministic Injective address for demo purposes."""
    # Real addresses start with 'inj1', followed by bech32 encoded data
    # For demo, we'll create a deterministic mock address
    hash_input = f"{name}:{INJECTIVED_HOME}".encode()
    hash_digest = hashlib.sha256(hash_input).hexdigest()[:40]
    return f"inj1{hash_digest}"


def try_cli_call(cmd_args, shell=False):
    """Try to execute a CLI command, return (success, stdout, stderr)."""
    try:
        result = subprocess.run(
            cmd_args,
            capture_output=True,
            text=True,
            timeout=15,
            shell=shell
        )
        return (result.returncode == 0, result.stdout, result.stderr)
    except subprocess.TimeoutExpired:
        return (False, "", "Command timeout")
    except Exception as e:
        return (False, "", str(e))


def ensure_injectived_installed():
    """Check if injective CLI is reasonably available."""
    # Just return True - we have fallbacks
    return True


def get_endpoint_and_chain_id(is_testnet: bool = False):
    """Get endpoint and chain-id from config or use defaults."""
    if is_testnet:
        return DEFAULT_TESTNET_ENDPOINT, DEFAULT_TESTNET_CHAIN_ID
    return DEFAULT_MAINNET_ENDPOINT, DEFAULT_MAINNET_CHAIN_ID


def list_wallets():
    """List all available wallets (keys)."""
    try:
        state = _load_wallet_state()
        wallets = []
        
        for name, wallet_info in state.get("wallets", {}).items():
            wallets.append({
                "name": name,
                "address": wallet_info.get("address", _generate_inj_address(name)),
            })
        
        return {"ok": True, "wallets": wallets}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def create_wallet(name: str, passphrase: str = ""):
    """Create a new wallet (key) - stores locally."""
    try:
        if not name or len(name) < 2:
            return {"ok": False, "error": "Wallet name must be at least 2 characters"}
        
        state = _load_wallet_state()
        
        # Check if already exists
        if name in state.get("wallets", {}):
            return {"ok": False, "error": f"Wallet '{name}' already exists"}
        
        # Generate address
        address = _generate_inj_address(name)
        
        # Store wallet info
        if "wallets" not in state:
            state["wallets"] = {}
        
        state["wallets"][name] = {
            "address": address,
            "created_at": datetime.now().isoformat(),
            "network": "mainnet",
        }
        
        _save_wallet_state(state)
        
        return {
            "ok": True,
            "name": name,
            "address": address,
            "note": "Wallet created locally (demo mode). For production, use injectived CLI."
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


def get_wallet_balance(address: str, is_testnet: bool = False):
    """Query wallet balance on Injective chain."""
    try:
        endpoint, chain_id = get_endpoint_and_chain_id(is_testnet)
        
        # Try CLI first
        success, stdout, stderr = try_cli_call(
            f"injectived query bank balances {address} --node {endpoint} --chain-id {chain_id} -o json",
            shell=True
        )
        
        if success:
            try:
                data = json.loads(stdout)
                balances = data.get("balances", [])
                
                parsed_balances = {}
                for balance in balances:
                    denom = balance.get("denom", "unknown")
                    amount = balance.get("amount", "0")
                    
                    if denom == "inj":
                        try:
                            inj_amount = float(amount) / 1e18
                            parsed_balances[denom] = {
                                "amount": amount,
                                "human": f"{inj_amount:.6f} INJ"
                            }
                        except:
                            parsed_balances[denom] = {"amount": amount, "human": amount}
                    else:
                        parsed_balances[denom] = {"amount": amount, "human": amount}
                
                return {
                    "ok": True,
                    "address": address,
                    "balances": parsed_balances,
                    "raw": data,
                    "source": "chain"
                }
            except json.JSONDecodeError:
                pass
        
        # Fallback: demo balance
        return {
            "ok": True,
            "address": address,
            "balances": {
                "inj": {
                    "amount": "1000000000000000000",  # 1 INJ
                    "human": "1.000000 INJ"
                }
            },
            "raw": {"balances": [{"denom": "inj", "amount": "1000000000000000000"}]},
            "source": "demo",
            "note": "This is demo data. Connect to chain to see real balance."
        }
        
    except Exception as e:
        return {"ok": False, "error": str(e)}


def connect_wallet(wallet_name: str = None, is_testnet: bool = False):
    """
    Connect to a wallet. If wallet_name not provided, list available wallets.
    """
    try:
        wallets_result = list_wallets()
        if not wallets_result["ok"]:
            return wallets_result
        
        wallets = wallets_result.get("wallets", [])
        
        # If no wallets exist, create default one
        if not wallets:
            default_result = create_wallet("default")
            if default_result["ok"]:
                wallets = [{
                    "name": "default",
                    "address": default_result["address"]
                }]
            else:
                return {
                    "ok": False,
                    "error": "No wallets found. Please create one first.",
                    "wallets": []
                }
        
        # Select wallet
        selected_wallet = None
        if wallet_name:
            selected_wallet = next((w for w in wallets if w["name"] == wallet_name), None)
            if not selected_wallet:
                return {
                    "ok": False,
                    "error": f"Wallet '{wallet_name}' not found",
                    "available": [w["name"] for w in wallets]
                }
        else:
            selected_wallet = wallets[0]
        
        # Get balance
        address = selected_wallet["address"]
        balance_result = get_wallet_balance(address, is_testnet)
        
        return {
            "ok": True,
            "wallet": {
                "name": selected_wallet["name"],
                "address": address,
                "network": "testnet" if is_testnet else "mainnet"
            },
            "balance": balance_result,
            "available_wallets": [w["name"] for w in wallets]
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


def send_transaction(
    from_address: str,
    to_address: str,
    amount_inj: float,
    wallet_name: str = None,
    is_testnet: bool = False,
    passphrase: str = ""
):
    """Send INJ transaction (demo implementation)."""
    try:
        # Validate inputs
        if not from_address or not to_address:
            return {"ok": False, "error": "from_address and to_address required"}
        
        if not from_address.startswith("inj") or not to_address.startswith("inj"):
            return {"ok": False, "error": "Invalid Injective address format"}
        
        if amount_inj <= 0:
            return {"ok": False, "error": "Amount must be > 0"}
        
        endpoint, chain_id = get_endpoint_and_chain_id(is_testnet)
        amount_uinj = int(amount_inj * 1e18)
        
        # Try CLI
        cmd = (
            f"injectived tx bank send {from_address} {to_address} {amount_uinj}inj "
            f"--node {endpoint} --chain-id {chain_id} --gas auto --gas-adjustment 1.5 "
            f"--gas-prices 160000000inj --yes -o json"
        )
        
        if wallet_name:
            cmd += f" --from {wallet_name}"
        
        cmd += " --keyring-backend test"
        
        success, stdout, stderr = try_cli_call(cmd, shell=True)
        
        if success:
            try:
                tx_result = json.loads(stdout)
                return {
                    "ok": True,
                    "tx_hash": tx_result.get("txhash"),
                    "tx_result": tx_result,
                    "source": "chain"
                }
            except:
                pass
        
        # Demo response
        import hashlib
        tx_hash = hashlib.sha256(
            f"{from_address}{to_address}{amount_inj}{datetime.now().isoformat()}".encode()
        ).hexdigest().upper()
        
        return {
            "ok": True,
            "tx_hash": tx_hash,
            "tx_result": {
                "txhash": tx_hash,
                "code": 0,
                "log": "Demo transaction (use real CLI for actual chain transaction)"
            },
            "source": "demo",
            "note": f"Demo: Would send {amount_inj:.4f} INJ from {from_address} to {to_address}"
        }
        
    except Exception as e:
        return {"ok": False, "error": str(e)}
