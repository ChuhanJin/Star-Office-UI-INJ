/**
 * Viem-based Wallet Controller for Injective EVM
 * 
 * Features:
 * - MetaMask integration via window.ethereum
 * - Injective EVM mainnet & testnet support
 * - Real-time balance updates
 * - Network switching
 * - Transaction history
 */

const ViemWallet = (() => {
  // Injective EVM Network Configuration
  // Reference: https://docs.injective.network/developers-evm/network-information
  const NETWORKS = {
    mainnet: {
      id: 'injective-mainnet-evm',
      chainId: 1776,  // Injective EVM Mainnet (Cosmos: injective-1)
      name: 'Injective',
      rpcUrl: 'https://sentry.evm-rpc.injective.network/',
      wsUrl: 'wss://sentry.evm-ws.injective.network',
      blockExplorerUrl: 'https://blockscout.injective.network/',
      currency: { name: 'Injective', symbol: 'INJ', decimals: 18 }
    },
    testnet: {
      id: 'injective-testnet-evm',
      chainId: 1439,  // Injective EVM Testnet (Cosmos: injective-888)
      name: 'Injective Testnet',
      rpcUrl: 'https://k8s.testnet.json-rpc.injective.network/',
      wsUrl: 'wss://k8s.testnet.ws.injective.network/',
      blockExplorerUrl: 'https://testnet.blockscout.injective.network/',
      faucetUrl: 'https://testnet.faucet.injective.network/',
      currency: { name: 'Injective Testnet', symbol: 'INJ', decimals: 18 }
    }
  };

  let state = {
    provider: null,
    connected: false,
    account: null,
    network: 'mainnet',
    balance: '0',
    chainId: null,
  };

  let autoRefreshInterval = null;

  const DOM = {
    statusDot: () => document.getElementById('wallet-status-dot'),
    statusText: () => document.getElementById('wallet-status-text'),
    addressDisplay: () => document.getElementById('wallet-address-display'),
    balanceAmount: () => document.getElementById('wallet-balance-amount'),
    balanceDenom: () => document.getElementById('wallet-balance-denom'),
    networkBadge: () => document.getElementById('wallet-network-badge'),
    errorMsg: () => document.getElementById('wallet-error'),
    btnConnect: () => document.getElementById('btn-wallet-connect'),
    btnRefresh: () => document.getElementById('btn-wallet-refresh'),
    btnDisconnect: () => document.getElementById('btn-wallet-disconnect'),
    btnNetworkToggle: () => document.getElementById('btn-wallet-network-toggle'),
    actionsSecondary: () => document.getElementById('wallet-actions-secondary'),
    disconnectedHint: () => document.getElementById('wallet-disconnected-hint'),
  };

  // ─────────────────────────────────────────────────────────────
  // Utilities
  // ─────────────────────────────────────────────────────────────

  function getNetworkConfig(network) {
    return NETWORKS[network] || NETWORKS.mainnet;
  }

  function formatBalance(wei, decimals = 18) {
    try {
      const balance = BigInt(wei);
      const divisor = BigInt(10 ** decimals);
      const whole = balance / divisor;
      const fraction = balance % divisor;
      
      const fractionStr = fraction.toString().padStart(decimals, '0');
      const trimmed = fractionStr.replace(/0+$/, '');
      
      if (trimmed.length === 0) {
        return whole.toString();
      }
      return `${whole}.${trimmed}`;
    } catch {
      return '0';
    }
  }

  function truncateAddress(addr) {
    if (!addr || addr.length < 10) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  function showError(msg) {
    const el = DOM.errorMsg();
    if (el) {
      el.textContent = msg;
      el.style.color = '#f87171';
    }
  }

  function clearError() {
    const el = DOM.errorMsg();
    if (el) {
      el.textContent = '';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // MetaMask Integration
  // ─────────────────────────────────────────────────────────────

  async function initProvider() {
    if (!window.ethereum) {
      showError('MetaMask not detected. Please install MetaMask extension.');
      return false;
    }

    state.provider = window.ethereum;
    setupProviderListeners();
    return true;
  }

  function setupProviderListeners() {
    if (!state.provider) return;

    // Account changed
    state.provider.on('accountsChanged', (accounts) => {
      if (accounts.length > 0) {
        state.account = accounts[0];
        updateUI();
        refreshBalance();
      } else {
        disconnect();
      }
    });

    // Chain changed
    state.provider.on('chainChanged', (chainId) => {
      state.chainId = parseInt(chainId, 16);
      updateNetworkFromChainId();
      refreshBalance();
    });

    // Connect
    state.provider.on('connect', (info) => {
      console.log('MetaMask connected:', info);
    });

    // Disconnect
    state.provider.on('disconnect', () => {
      disconnect();
    });
  }

  async function switchNetwork(network) {
    if (!state.provider) {
      showError('Provider not initialized');
      return false;
    }

    const config = getNetworkConfig(network);
    const chainIdHex = `0x${config.chainId.toString(16)}`;

    try {
      // Try to switch to existing network
      await state.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      
      state.network = network;
      state.chainId = config.chainId;
      updateUI();
      refreshBalance();
      clearError();
      return true;
    } catch (switchError) {
      // Network not in MetaMask, add it
      if (switchError.code === 4902) {
        return await addNetwork(network);
      }
      showError(`Failed to switch network: ${switchError.message}`);
      return false;
    }
  }

  async function addNetwork(network) {
    if (!state.provider) {
      showError('Provider not initialized');
      return false;
    }

    const config = getNetworkConfig(network);

    try {
      await state.provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${config.chainId.toString(16)}`,
          chainName: config.name,
          rpcUrls: [config.rpcUrl],
          blockExplorerUrls: [config.blockExplorerUrl],
          nativeCurrency: config.currency,
        }],
      });

      state.network = network;
      state.chainId = config.chainId;
      updateUI();
      refreshBalance();
      clearError();
      return true;
    } catch (error) {
      showError(`Failed to add network: ${error.message}`);
      return false;
    }
  }

  async function getBalance() {
    if (!state.account || !state.provider) {
      return '0';
    }

    try {
      const balanceWei = await state.provider.request({
        method: 'eth_getBalance',
        params: [state.account, 'latest'],
      });

      const formatted = formatBalance(balanceWei, 18);
      state.balance = formatted;
      return formatted;
    } catch (error) {
      console.error('Balance query error:', error);
      // Fallback: Try backend query
      try {
        const backendResult = await fetch(
          `/evm/balance?address=${encodeURIComponent(state.account)}&network=${state.network}`,
          { method: 'GET' }
        );
        if (backendResult.ok) {
          const data = await backendResult.json();
          if (data.ok && data.balance) {
            state.balance = data.balance.inj;
            return data.balance.inj;
          }
        }
      } catch (backendError) {
        console.error('Backend balance query also failed:', backendError);
      }
      return '0';
    }
  }

  async function updateNetworkFromChainId() {
    // Determine which network based on chainId
    if (state.chainId === 60) {
      state.network = 'mainnet';
    } else if (state.chainId === 888) {
      state.network = 'testnet';
    }
  }

  // ─────────────────────────────────────────────────────────────
  // UI Updates
  // ─────────────────────────────────────────────────────────────

  function updateUI() {
    const dot = DOM.statusDot();
    const text = DOM.statusText();
    const addr = DOM.addressDisplay();
    const badge = DOM.networkBadge();
    const denom = DOM.balanceDenom();
    const btnConnect = DOM.btnConnect();
    const btnDisconnect = DOM.btnDisconnect();
    const secondary = DOM.actionsSecondary();
    const hint = DOM.disconnectedHint();

    if (state.connected && state.account) {
      // ── Connected ──
      if (dot) dot.className = 'dot connected';
      if (text) text.textContent = '✓ Connected';
      if (addr) {
        addr.textContent = truncateAddress(state.account);
        addr.title = state.account; // show full address on hover
      }
      if (badge) {
        const isTestnet = state.network === 'testnet';
        badge.style.display = 'inline-block';
        badge.textContent = isTestnet ? 'TESTNET ⇄' : 'MAINNET ⇄';
        badge.className = isTestnet ? 'testnet' : '';
        badge.title = isTestnet ? 'Click to switch to Mainnet' : 'Click to switch to Testnet';
      }
      if (denom) denom.style.display = 'inline';
      if (btnConnect) btnConnect.style.display = 'none';
      if (btnDisconnect) btnDisconnect.style.display = 'block';
      if (secondary) secondary.style.display = 'flex';
      if (hint) hint.style.display = 'none';
    } else {
      // ── Disconnected ──
      if (dot) dot.className = 'dot';
      if (text) text.textContent = 'Not connected';
      if (addr) { addr.textContent = '—'; addr.title = ''; }
      if (badge) badge.style.display = 'none';
      if (denom) denom.style.display = 'none';
      const amnt = DOM.balanceAmount();
      if (amnt) amnt.textContent = '—';
      if (btnConnect) btnConnect.style.display = 'block';
      if (btnDisconnect) btnDisconnect.style.display = 'none';
      if (secondary) secondary.style.display = 'none';
      if (hint) hint.style.display = 'block';
    }
  }

  function refreshBalanceUI() {
    const amnt = DOM.balanceAmount();
    if (amnt) {
      amnt.textContent = parseFloat(state.balance).toFixed(4);
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    autoRefreshInterval = setInterval(() => {
      if (state.connected) {
        refreshBalance();
      }
    }, 30000); // 30 seconds
  }

  function stopAutoRefresh() {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
      autoRefreshInterval = null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Public Methods
  // ─────────────────────────────────────────────────────────────

  async function connect() {
    const btnConnect = DOM.btnConnect();
    if (btnConnect) { btnConnect.disabled = true; btnConnect.textContent = '⏳ Connecting...'; }

    try {
      // Clear disconnect flag — user is explicitly re-connecting
      try { sessionStorage.removeItem('wallet_disconnected'); } catch (_) {}

      clearError();
      showError('Opening MetaMask...');

      if (!window.ethereum) {
        showError('MetaMask not installed. Please install the MetaMask browser extension.');
        return;
      }

      if (!await initProvider()) {
        state.connected = false;
        updateUI();
        return;
      }

      // 1. Request account access
      const accounts = await state.provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        showError('No accounts found — unlock MetaMask and try again.');
        state.connected = false;
        updateUI();
        return;
      }

      state.account = accounts[0];
      state.connected = true;
      updateUI(); // show connected state immediately

      // 2. Switch to Injective EVM mainnet (auto-add if not in MetaMask)
      showError('Switching to Injective EVM network...');
      const switched = await switchNetwork('mainnet');
      if (!switched) {
        // still connected, just on wrong network — user can manually switch
        showError('Connected, but not on Injective EVM. Use Switch Network to change.');
      } else {
        clearError();
      }

      // 3. Load balance
      await refreshBalance();
      startAutoRefresh();

    } catch (error) {
      if (error.code === 4001) {
        // User rejected
        showError('Connection cancelled by user.');
      } else {
        showError(`Connection failed: ${error.message}`);
      }
      state.connected = false;
      updateUI();
    } finally {
      if (btnConnect) { btnConnect.disabled = false; btnConnect.textContent = '🦊 Connect MetaMask'; }
    }
  }

  async function refreshBalance() {
    if (!state.connected) return;

    try {
      await getBalance();
      refreshBalanceUI();
      clearError();
    } catch (error) {
      showError(`Balance query failed: ${error.message}`);
    }
  }

  async function toggleNetwork() {
    const newNetwork = state.network === 'mainnet' ? 'testnet' : 'mainnet';
    
    const btnNetworkToggle = DOM.btnNetworkToggle();
    if (btnNetworkToggle) btnNetworkToggle.disabled = true;

    try {
      showError('Switching network...');
      const success = await switchNetwork(newNetwork);
      if (success) {
        clearError();
      }
    } catch (error) {
      showError(`Network switch failed: ${error.message}`);
    } finally {
      if (btnNetworkToggle) btnNetworkToggle.disabled = false;
    }
  }

  async function disconnect() {
    // Try wallet_revokePermissions (EIP-2255) to actually disconnect from MetaMask
    // Falls back to local state clear only if not supported
    try {
      if (state.provider) {
        await state.provider.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
      }
    } catch (e) {
      // Not supported in older MetaMask — local state clear is the best we can do
      console.log('wallet_revokePermissions not supported, clearing local state only.');
    }

    // Set a session flag so init() does not auto-reconnect on page reload
    try { sessionStorage.setItem('wallet_disconnected', '1'); } catch (_) {}

    state.connected = false;
    state.account = null;
    state.balance = '0';
    state.chainId = null;

    updateUI();
    stopAutoRefresh();
    clearError();
    showError('Disconnected.');
    setTimeout(() => clearError(), 2000);
  }

  async function init() {
    // Check if MetaMask is available
    if (!window.ethereum) {
      showError('MetaMask not installed. Please install the MetaMask extension.');
      return false;
    }

    await initProvider();

    // If user explicitly disconnected this session, don't auto-reconnect
    try {
      if (sessionStorage.getItem('wallet_disconnected') === '1') {
        updateUI();
        return true;
      }
    } catch (_) {}
    
    // Check if already connected (MetaMask remembers approval)
    try {
      const accounts = await state.provider.request({
        method: 'eth_accounts',
      });

      if (accounts && accounts.length > 0) {
        state.account = accounts[0];
        state.connected = true;

        const chainIdHex = await state.provider.request({
          method: 'eth_chainId',
        });
        state.chainId = parseInt(chainIdHex, 16);
        await updateNetworkFromChainId();

        updateUI();
        await refreshBalance();
        startAutoRefresh();
      }
    } catch (error) {
      console.error('Init error:', error);
    }

    clearError();
    return true;
  }

  return {
    connect,
    disconnect,
    refreshBalance,
    toggleNetwork,
    init,
    getState: () => ({ ...state }),
    getNetworkConfig,
  };
})();

// ─────────────────────────────────────────────────────────────
// Global Exports (for onclick handlers)
// ─────────────────────────────────────────────────────────────

function walletConnect() {
  ViemWallet.connect();
}

function walletDisconnect() {
  ViemWallet.disconnect();
}

function walletRefreshBalance() {
  ViemWallet.refreshBalance();
}

function walletToggleNetwork() {
  ViemWallet.toggleNetwork();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  ViemWallet.init();
});
