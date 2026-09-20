/*!
 * StaRK Bots — public paper desk trial gate (vanilla JS)
 * 5-minute free trial per browser per calendar day (localStorage).
 * No wallet, no secrets, paper UI only.
 *
 * Usage:
 *   <script src="../assets/trial-gate.js" data-app-id="arcus"></script>
 *   // or: StarkTrialGate.init({ appId: 'arcus', trialSeconds: 300 })
 */
(function (global) {
  'use strict';

  var PREFIX = 'starkbots_trial_v1';
  var DEFAULT_SECONDS = 300;
  var LANDING = 'https://starkcrypto.github.io/stark-tools/';
  var STYLE_ID = 'stark-trial-gate-css';
  var ROOT_ID = 'stark-trial-gate-root';

  function todayKey() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function storageKey(appId) {
    return PREFIX + ':' + appId + ':' + todayKey();
  }

  function readState(appId) {
    try {
      var raw = localStorage.getItem(storageKey(appId));
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || typeof o.startedAt !== 'number') return null;
      return o;
    } catch (e) {
      return null;
    }
  }

  function writeState(appId, startedAt) {
    try {
      localStorage.setItem(
        storageKey(appId),
        JSON.stringify({ startedAt: startedAt, v: 1 })
      );
    } catch (e) {
      /* private mode / quota — trial still runs in-memory */
    }
  }

  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + String(r).padStart(2, '0');
  }

  function injectCss() {
    if (document.getElementById(STYLE_ID)) return;
    var css = document.createElement('style');
    css.id = STYLE_ID;
    css.textContent = [
      '#' + ROOT_ID + '{all:initial;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Ubuntu,sans-serif}',
      '#' + ROOT_ID + ' *{box-sizing:border-box;font-family:inherit}',
      '.stg-badge{position:fixed;top:10px;right:12px;z-index:2147483000;display:flex;align-items:center;gap:8px;',
      'padding:6px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.02em;',
      'background:rgba(8,12,18,.92);color:#3de7ff;border:1px solid rgba(61,231,255,.45);',
      'box-shadow:0 8px 28px rgba(0,0,0,.45);backdrop-filter:blur(8px);pointer-events:none}',
      '.stg-badge b{font-variant-numeric:tabular-nums;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;color:#e4ebf5}',
      '.stg-overlay{position:fixed;inset:0;z-index:2147483001;display:flex;align-items:center;justify-content:center;',
      'padding:20px;background:rgba(4,8,14,.72);backdrop-filter:blur(6px)}',
      'html.stg-locked,html.stg-locked body{overflow:hidden!important}',
      'html.stg-locked body>*:not(#' + ROOT_ID + '){filter:grayscale(.35) brightness(.55);pointer-events:none!important;user-select:none!important}',
      '.stg-card{width:min(440px,100%);background:linear-gradient(180deg,#111822,#0d131b);border:1px solid #1b2636;',
      'border-radius:16px;padding:28px 24px;color:#e4ebf5;box-shadow:0 24px 80px rgba(0,0,0,.55);text-align:center}',
      '.stg-card h2{margin:0 0 10px;font-size:20px;letter-spacing:-.01em}',
      '.stg-card p{margin:0 0 10px;color:#8797af;font-size:14px;line-height:1.5}',
      '.stg-card .stg-cta{margin:18px 0 8px;display:flex;flex-direction:column;gap:10px;align-items:center}',
      '.stg-btn{appearance:none;border:0;cursor:pointer;border-radius:10px;padding:12px 20px;font-weight:700;font-size:14px;',
      'background:linear-gradient(90deg,#3de7ff,#8b6cff);color:#061018}',
      '.stg-btn:hover{filter:brightness(1.06)}',
      '.stg-link{color:#3de7ff;font-size:13px;font-weight:600;text-decoration:none}',
      '.stg-link:hover{text-decoration:underline}',
      '.stg-fine{font-size:11px;color:#6b7a90;margin-top:14px!important}',
      '.stg-pill{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;',
      'padding:4px 9px;border-radius:999px;border:1px solid rgba(240,180,41,.4);color:#f0b429;',
      'background:rgba(240,180,41,.08);margin-bottom:12px}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(css);
  }

  function ensureRoot() {
    var root = document.getElementById(ROOT_ID);
    if (root) return root;
    root = document.createElement('div');
    root.id = ROOT_ID;
    document.documentElement.appendChild(root);
    return root;
  }

  function clearRoot(root) {
    while (root.firstChild) root.removeChild(root.firstChild);
  }

  function showBadge(root, leftMs) {
    var el = root.querySelector('.stg-badge');
    if (!el) {
      el = document.createElement('div');
      el.className = 'stg-badge';
      el.setAttribute('aria-live', 'polite');
      root.appendChild(el);
    }
    el.innerHTML = 'Free trial · <b>' + fmt(leftMs) + '</b> left';
  }

  function showStart(root, onStart) {
    document.documentElement.classList.remove('stg-locked');
    clearRoot(root);
    var overlay = document.createElement('div');
    overlay.className = 'stg-overlay';
    overlay.innerHTML =
      '<div class="stg-card" role="dialog" aria-modal="true" aria-labelledby="stg-start-title">' +
      '<div class="stg-pill">Paper · Free test</div>' +
      '<h2 id="stg-start-title">Start your free paper trial</h2>' +
      '<p>5 minutes per browser per calendar day. Full paper UI — no wallet connect, no keys, not live trading.</p>' +
      '<div class="stg-cta"><button type="button" class="stg-btn" id="stg-start-btn">Start trial · 5:00</button></div>' +
      '<p class="stg-fine">CA soon · NFA · Paper only</p>' +
      '</div>';
    root.appendChild(overlay);
    overlay.querySelector('#stg-start-btn').addEventListener('click', function () {
      onStart();
    });
  }

  function showLock(root) {
    document.documentElement.classList.add('stg-locked');
    clearRoot(root);
    var overlay = document.createElement('div');
    overlay.className = 'stg-overlay';
    overlay.innerHTML =
      '<div class="stg-card" role="dialog" aria-modal="true" aria-labelledby="stg-lock-title">' +
      '<div class="stg-pill">Locked</div>' +
      '<h2 id="stg-lock-title">Free trial ended (5 min / day)</h2>' +
      '<p>Desks open after $BOTS launch; later premium may need ~0.5% hold</p>' +
      '<div class="stg-cta">' +
      '<a class="stg-btn" href="' + LANDING + '" target="_blank" rel="noopener noreferrer">Open landing →</a>' +
      '<a class="stg-link" href="' + LANDING + '" target="_blank" rel="noopener noreferrer">' + LANDING + '</a>' +
      '</div>' +
      '<p class="stg-fine">CA soon · NFA · Paper only</p>' +
      '</div>';
    root.appendChild(overlay);
  }

  function init(opts) {
    opts = opts || {};
    var appId = String(opts.appId || '').trim();
    if (!appId) {
      console.warn('[StarkTrialGate] appId required');
      return null;
    }
    var trialSeconds = Number(opts.trialSeconds);
    if (!isFinite(trialSeconds) || trialSeconds <= 0) trialSeconds = DEFAULT_SECONDS;
    var trialMs = trialSeconds * 1000;
    var autoStart = !!opts.autoStart;

    injectCss();

    var api = {
      appId: appId,
      trialSeconds: trialSeconds,
      _timer: null,
      _startedAt: null,
      destroy: function () {
        if (api._timer) clearInterval(api._timer);
        api._timer = null;
        var root = document.getElementById(ROOT_ID);
        if (root) root.remove();
        document.documentElement.classList.remove('stg-locked');
      },
      startTrial: function () {
        var existing = readState(appId);
        var now = Date.now();
        if (existing && existing.startedAt) {
          api._startedAt = existing.startedAt;
        } else {
          api._startedAt = now;
          writeState(appId, api._startedAt);
        }
        run();
      },
      remainingMs: function () {
        if (!api._startedAt) return trialMs;
        return Math.max(0, trialMs - (Date.now() - api._startedAt));
      }
    };

    function run() {
      var root = ensureRoot();
      if (api._timer) clearInterval(api._timer);

      function tick() {
        var left = api.remainingMs();
        if (left <= 0) {
          if (api._timer) clearInterval(api._timer);
          api._timer = null;
          showLock(root);
          return;
        }
        document.documentElement.classList.remove('stg-locked');
        /* keep only badge while running */
        if (!root.querySelector('.stg-badge') || root.querySelector('.stg-overlay')) {
          clearRoot(root);
        }
        showBadge(root, left);
      }

      tick();
      api._timer = setInterval(tick, 250);
    }

    function boot() {
      var root = ensureRoot();
      var state = readState(appId);
      if (state && state.startedAt) {
        api._startedAt = state.startedAt;
        var left = trialMs - (Date.now() - api._startedAt);
        if (left <= 0) {
          showLock(root);
          return;
        }
        run();
        return;
      }
      if (autoStart) {
        api.startTrial();
        return;
      }
      showStart(root, function () {
        api.startTrial();
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }

    global.StarkTrialGate = global.StarkTrialGate || api;
    return api;
  }

  function autoFromScript() {
    var me = document.currentScript;
    if (!me) {
      var scripts = document.getElementsByTagName('script');
      me = scripts[scripts.length - 1];
    }
    if (!me) return;
    var appId = me.getAttribute('data-app-id');
    if (!appId) return;
    var secs = me.getAttribute('data-trial-seconds');
    init({
      appId: appId,
      trialSeconds: secs ? Number(secs) : DEFAULT_SECONDS,
      autoStart: me.getAttribute('data-auto-start') === '1'
    });
  }

  global.StarkTrialGate = {
    init: init,
    PREFIX: PREFIX,
    DEFAULT_SECONDS: DEFAULT_SECONDS
  };

  autoFromScript();
})(typeof window !== 'undefined' ? window : this);
