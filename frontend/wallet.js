/**
 * Wallet UI Controller for Injective Integration
 * Handles wallet connection, balance queries, and UI state
 */

const WalletUI = (() => {
    let connectedWallet = null;
    let walletNetwork = 'mainnet';
    let autoRefreshInterval = null;

    const DOM = {
        statusDot: () => document.getElementById('wallet-status-dot'),
        statusText: () => document.getElementById('wallet-status-text'),
        addressDisplay: () => document.getElementById('wallet-address-display'),
        balanceAmount: () => document.getElementById('wallet-balance-amount'),
        balanceDenom: () => document.getElementById('wallet-balance-display').querySelector('.denom'),
        networkBadge: () => document.getElementById('wallet-network-badge'),
        errorMsg: () => document.getElementById('wallet-error'),
        btnConnect: () => document.getElementById('btn-wallet-connect'),
        btnRefresh: () => document.getElementById('btn-wallet-refresh'),
        btnDisconnect: () => document.getElementById('btn-wallet-disconnect'),
        walletPanel: () => document.getElementById('wallet-panel'),
    };

    const API_BASE = '';  // Same origin, use relative paths

    // ─────────────────────────────────────────────────────────────
    // API Calls
    // ─────────────────────────────────────────────────────────────

    async function apiCall(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: { 'Content-Type': 'application/json' },
            };
            if (data) {
                options.body = JSON.stringify(data);
            }
            const response = await fetch(`${API_BASE}${endpoint}`, options);
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return { ok: false, error: error.error || error.msg || `HTTP ${response.status}` };
            }
            return await response.json();
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    async function checkHealth() {
        return apiCall('/wallet/health');
    }

    async function connectWallet(walletName = null, isTestnet = false) {
        return apiCall('/wallet/connect', 'POST', {
            wallet_name: walletName,
            is_testnet: isTestnet,
        });
    }

    async function listWallets() {
        return apiCall('/wallet/list');
    }

    async function createWallet(name, passphrase = '') {
        return apiCall('/wallet/create', 'POST', {
            name,
            passphrase,
        });
    }

    async function getBalance(address, isTestnet = false) {
        return apiCall(
            `/wallet/balance?address=${encodeURIComponent(address)}&is_testnet=${isTestnet ? 'true' : 'false'}`,
            'GET'
        );
    }

    async function sendTx(fromAddr, toAddr, amountInj, walletName = null, isTestnet = false) {
        return apiCall('/wallet/send', 'POST', {
            from_address: fromAddr,
            to_address: toAddr,
            amount_inj: amountInj,
            wallet_name: walletName,
            is_testnet: isTestnet,
        });
    }

    // ─────────────────────────────────────────────────────────────
    // UI Updates
    // ─────────────────────────────────────────────────────────────

    function showError(msg) {
        const el = DOM.errorMsg();
        if (el) el.textContent = msg;
    }

    function clearError() {
        const el = DOM.errorMsg();
        if (el) el.textContent = '';
    }

    function setConnected(wallet, balanceData) {
        connectedWallet = wallet;
        const dot = DOM.statusDot();
        const text = DOM.statusText();
        const addr = DOM.addressDisplay();
        const badge = DOM.networkBadge();

        if (dot) dot.className = 'dot connected';
        if (text) text.textContent = '✓ 已连接';
        if (addr) addr.textContent = wallet.address;
        
        walletNetwork = wallet.network || 'mainnet';
        if (badge) {
            badge.textContent = walletNetwork.toUpperCase();
            badge.className = `${walletNetwork === 'testnet' ? 'testnet' : ''}`;
        }

        // Update balance if available
        if (balanceData && balanceData.ok) {
            updateBalance(balanceData);
        }

        // Show disconnect, hide connect
        const btnConnect = DOM.btnConnect();
        const btnDisconnect = DOM.btnDisconnect();
        if (btnConnect) btnConnect.style.display = 'none';
        if (btnDisconnect) btnDisconnect.style.display = 'inline-block';

        // Start auto-refresh (every 30s)
        startAutoRefresh();
        clearError();
    }

    function setDisconnected() {
        connectedWallet = null;
        const dot = DOM.statusDot();
        const text = DOM.statusText();
        const addr = DOM.addressDisplay();
        const amnt = DOM.balanceAmount();

        if (dot) dot.className = 'dot';
        if (text) text.textContent = '未连接';
        if (addr) addr.textContent = '未连接';
        if (amnt) amnt.textContent = '0';

        const btnConnect = DOM.btnConnect();
        const btnDisconnect = DOM.btnDisconnect();
        if (btnConnect) btnConnect.style.display = 'inline-block';
        if (btnDisconnect) btnDisconnect.style.display = 'none';

        stopAutoRefresh();
        clearError();
    }

    function setError(msg) {
        connectedWallet = null;
        const dot = DOM.statusDot();
        const text = DOM.statusText();

        if (dot) dot.className = 'dot error';
        if (text) text.textContent = '❌ 错误';

        const btnConnect = DOM.btnConnect();
        const btnDisconnect = DOM.btnDisconnect();
        if (btnConnect) btnConnect.style.display = 'inline-block';
        if (btnDisconnect) btnDisconnect.style.display = 'none';

        showError(msg);
        stopAutoRefresh();
    }

    function updateBalance(balanceData) {
        if (!balanceData || !balanceData.ok) {
            showError('余额查询失败');
            return;
        }

        const balances = balanceData.balances || {};
        const injBalance = balances.inj;

        if (injBalance) {
            const humanReadable = injBalance.human || '0';
            const amount = humanReadable.split(' ')[0];
            const amnt = DOM.balanceAmount();
            if (amnt) amnt.textContent = parseFloat(amount).toFixed(4);
        } else {
            const amnt = DOM.balanceAmount();
            if (amnt) amnt.textContent = '0.0000';
        }

        clearError();
    }

    // ─────────────────────────────────────────────────────────────
    // Auto-Refresh
    // ─────────────────────────────────────────────────────────────

    function startAutoRefresh() {
        stopAutoRefresh();
        autoRefreshInterval = setInterval(() => {
            if (connectedWallet) {
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
    // Public Methods (exposed to global scope)
    // ─────────────────────────────────────────────────────────────

    async function connect() {
        const btnConnect = DOM.btnConnect();
        if (btnConnect) btnConnect.disabled = true;

        try {
            showError('连接中...');
            const result = await connectWallet(null, false);

            if (!result.ok) {
                setError(result.error || '连接失败');
                return;
            }

            const wallet = result.wallet;
            setConnected(wallet, result.balance);
        } catch (e) {
            setError(e.message);
        } finally {
            if (btnConnect) btnConnect.disabled = false;
        }
    }

    async function refreshBalance() {
        if (!connectedWallet) return;

        try {
            const result = await getBalance(connectedWallet.address, walletNetwork === 'testnet');
            if (result.ok) {
                updateBalance(result);
            } else {
                showError(result.error || '余额查询失败');
            }
        } catch (e) {
            showError(e.message);
        }
    }

    function disconnect() {
        if (confirm('确定要断开钱包连接吗？')) {
            setDisconnected();
        }
    }

    async function init() {
        // Check if backend is ready
        const health = await checkHealth();
        if (!health.ok) {
            setError('钱包服务不可用');
        } else {
            clearError();
        }
    }

    return {
        connect,
        refreshBalance,
        disconnect,
        init,
        getConnected: () => connectedWallet,
        getNetwork: () => walletNetwork,
    };
})();

// ─────────────────────────────────────────────────────────────
// Global Exports (for onclick handlers)
// ─────────────────────────────────────────────────────────────

function walletConnect() {
    WalletUI.connect();
}

function walletRefreshBalance() {
    WalletUI.refreshBalance();
}

function walletDisconnect() {
    WalletUI.disconnect();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    WalletUI.init();
});
