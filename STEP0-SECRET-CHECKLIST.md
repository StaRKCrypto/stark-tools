# STEP 0 — Secret Checklist (run before every publish)

Public teasers must ship **zero secrets**. This checklist is mandatory before
pushing any `stark-tools` / `starkcryptollc` public repo.

## Never include

| Pattern / file | Why |
|---|---|
| `.env`, `*.env`, `lighter-*.env` | Live credentials |
| `wallets.txt`, `*_private*`, `*.pem` | Keys / seeds |
| `sk-…`, `api_key`, `private_key` | API / wallet material |
| `0x` + 64 hex chars | EVM private keys |
| Long base58 strings that look like Solana seeds | Wallet seeds |
| Real Token CA | Use `YOUR_TOKEN_CA_HERE` only |
| Full product brains (`sr-bot-src`, `nimbus`, `taking-profits`, …) | Not teasers |

## Scan commands (from repo root)

```bash
# Env / wallet filenames
rg -n --hidden -g '!.git' -e '\.env' -e 'wallets\.txt' -e 'lighter-.*\.env' -e '\.pem$' -e 'private_key' -e 'api_key'

# Secret-looking values
rg -n --hidden -g '!.git' -e 'sk-[A-Za-z0-9]{20,}' -e 'api[_-]?key\s*[:=]' -e 'private[_-]?key\s*[:=]'

# EVM private-key shaped hex
rg -n --hidden -g '!.git' -e '0x[a-fA-F0-9]{64}'

# Solana-ish long base58 (heuristic; review hits)
rg -n --hidden -g '!.git' -e '\b[1-9A-HJ-NP-Za-km-z]{80,}\b'
```

## Gate reminder

Every README must state:

> Hosted tools require holding **~0.5%** of the official coin
> (`YOUR_TOKEN_CA_HERE` — CA added after launch).  
> Public repo = authenticity samples + docs teaser.  
> Full hosted access is gated. Source samples are **NOT** the full product.

## Sign-off

- [ ] Ripgrep scans above return **no secret hits** (false positives reviewed)
- [ ] No `.env` / wallet / pem files in tree
- [ ] Placeholder CA only (`YOUR_TOKEN_CA_HERE`)
- [ ] Gate message present in every README
- [ ] Samples are illustrative stubs, not production brains

Brand: **X [@starkcryptollc](https://x.com/starkcryptollc)** (StaRK Bots) · Personal [@_Starkcrypto](https://x.com/_Starkcrypto) · Org: `stark-tools`
