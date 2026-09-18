/**
 * StaRK Live Studio — client-side vault.
 * Keys stay in the browser (localStorage). Never posted to GitHub/static host as stored server state.
 * Burner keys only. We cannot recover keys.
 */
(function (global) {
  const VAULT_KEY = 'stark.live.vault.v1';
  const ARM_KEY = 'stark.live.armed.v1'; // sessionStorage — refresh disarms
  const DRY_KEY = 'stark.live.dryrun.v1';

  const CHAINS = {
    ethereum: { id: 1, name: 'Ethereum', rpc: 'https://ethereum.publicnode.com', symbol: 'ETH', explorer: 'https://etherscan.io' },
    polygon: { id: 137, name: 'Polygon', rpc: 'https://polygon-bor.publicnode.com', symbol: 'POL', explorer: 'https://polygonscan.com' },
    base: { id: 8453, name: 'Base', rpc: 'https://base.publicnode.com', symbol: 'ETH', explorer: 'https://basescan.org' },
    ink: { id: 57073, name: 'Ink', rpc: 'https://rpc-gel.inkonchain.com', symbol: 'ETH', explorer: 'https://explorer.inkonchain.com' },
  };

  // Canonical SeaDrop 1.0
  const SEADROP = '0x00005EA00Ac477B1030CE78506496e8C2dE24bf5';

  function loadVault() {
    try {
      const raw = localStorage.getItem(VAULT_KEY);
      if (!raw) return null;
      const v = JSON.parse(raw);
      if (!v || !v.evmPrivateKey) return null;
      return v;
    } catch {
      return null;
    }
  }

  function saveVault({ evmPrivateKey, solanaPrivateKey, label }) {
    const pk = String(evmPrivateKey || '').trim();
    if (!pk) throw new Error('EVM private key required');
    if (!/^0x?[0-9a-fA-F]{64}$/.test(pk)) throw new Error('Invalid EVM private key format');
    const vault = {
      evmPrivateKey: pk.startsWith('0x') ? pk : '0x' + pk,
      solanaPrivateKey: solanaPrivateKey ? String(solanaPrivateKey).trim() : undefined,
      label: label || 'burner',
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
    return vault;
  }

  function clearVault() {
    localStorage.removeItem(VAULT_KEY);
    sessionStorage.removeItem(ARM_KEY);
  }

  function maskKey(pk) {
    if (!pk) return '';
    const s = pk.startsWith('0x') ? pk : '0x' + pk;
    return s.slice(0, 6) + '…' + s.slice(-4);
  }

  function isArmed() {
    return sessionStorage.getItem(ARM_KEY) === '1';
  }

  function setArmed(on) {
    if (on) sessionStorage.setItem(ARM_KEY, '1');
    else sessionStorage.removeItem(ARM_KEY);
  }

  /** DRY_RUN defaults ON. Persisted in localStorage so user choice sticks across desks. */
  function isDryRun() {
    const v = localStorage.getItem(DRY_KEY);
    if (v === null || v === undefined) return true;
    return v !== '0';
  }

  function setDryRun(on) {
    localStorage.setItem(DRY_KEY, on ? '1' : '0');
  }

  function deriveAddress(pk) {
    if (typeof ethers === 'undefined') throw new Error('ethers not loaded');
    const w = new ethers.Wallet(pk.startsWith('0x') ? pk : '0x' + pk);
    return w.address;
  }

  function getWallet(pk) {
    if (typeof ethers === 'undefined') throw new Error('ethers not loaded');
    return new ethers.Wallet(pk.startsWith('0x') ? pk : '0x' + pk);
  }

  async function rpcCall(rpc, method, params) {
    const res = await fetch(rpc, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const j = await res.json();
    if (j.error) throw new Error(j.error.message || JSON.stringify(j.error));
    return j.result;
  }

  async function getNativeBalance(chainKey, address) {
    const chain = CHAINS[chainKey];
    if (!chain) throw new Error('Unknown chain');
    const hex = await rpcCall(chain.rpc, 'eth_getBalance', [address, 'latest']);
    const wei = BigInt(hex);
    const eth = Number(wei) / 1e18;
    return { wei, eth, symbol: chain.symbol, chain: chain.name };
  }

  function toast(msg) {
    let el = document.getElementById('stark-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'stark-toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2800);
  }

  function logLine(container, msg, cls) {
    if (!container) return;
    const d = document.createElement('div');
    d.className = 'line ' + (cls || 'info');
    const t = new Date().toLocaleTimeString();
    d.textContent = '[' + t + '] ' + msg;
    container.prepend(d);
  }

  function requireArmConfirm(actionLabel) {
    if (isDryRun()) {
      return confirm(
        'DRY_RUN is ON.\n\n"' +
          actionLabel +
          '" will be simulated only — no live tx.\n\nContinue paper run?'
      );
    }
    if (!isArmed()) {
      alert('Desk is DISARMED.\n\nArm explicitly (confirm dialog) before live orders.\nOr keep DRY_RUN on for paper.');
      return false;
    }
    return confirm(
      '⚠️ LIVE ARM\n\nYou are about to: ' +
        actionLabel +
        '\n\nBurner keys only. Real on-chain / venue effects.\nWe cannot recover keys. NFA.\n\nType-confirm: click OK only if you intend LIVE.'
    );
  }

  function updateChrome() {
    const vault = loadVault();
    const addrEl = document.querySelectorAll('[data-vault-addr]');
    const maskEl = document.querySelectorAll('[data-vault-mask]');
    const statusEl = document.querySelectorAll('[data-vault-status]');
    let addr = '—';
    let mask = 'no key';
    let status = 'Vault empty';
    if (vault?.evmPrivateKey) {
      try {
        addr = deriveAddress(vault.evmPrivateKey);
        mask = maskKey(vault.evmPrivateKey);
        status = 'Vault loaded · burner';
      } catch (e) {
        status = 'Invalid key in vault';
      }
    }
    addrEl.forEach((el) => (el.textContent = addr));
    maskEl.forEach((el) => (el.textContent = mask));
    statusEl.forEach((el) => (el.textContent = status));

    const dryEls = document.querySelectorAll('[data-dry-badge]');
    dryEls.forEach((el) => {
      el.textContent = isDryRun() ? 'DRY_RUN ON' : 'DRY_RUN OFF';
      el.className = 'badge ' + (isDryRun() ? 'badge-dry' : 'badge-armed');
    });
    const armEls = document.querySelectorAll('[data-arm-badge]');
    armEls.forEach((el) => {
      el.textContent = isArmed() ? 'ARMED' : 'DISARMED';
      el.className = 'badge ' + (isArmed() ? 'badge-armed' : 'badge-nfa');
      el.style.display = isDryRun() ? 'none' : '';
    });
  }

  global.StarkVault = {
    VAULT_KEY,
    CHAINS,
    SEADROP,
    loadVault,
    saveVault,
    clearVault,
    maskKey,
    isArmed,
    setArmed,
    isDryRun,
    setDryRun,
    deriveAddress,
    getWallet,
    rpcCall,
    getNativeBalance,
    toast,
    logLine,
    requireArmConfirm,
    updateChrome,
  };
})(typeof window !== 'undefined' ? window : globalThis);
