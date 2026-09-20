# $BOTS advanced create parameters — LOCKED (user confirmed SOL)

**Locked 2026-09-20:** Path **A · SOL pair**. Custom/Cashcat rejected. Typed 2% fee N/A on SOL UI.

## Create form

| Field | Value |
|-------|-------|
| Name | StaRK Bots |
| Ticker | BOTS |
| Description | from PUMPFUN-LISTING-PACK.md |
| Website | https://starkcrypto.github.io/stark-tools/ |
| X | https://x.com/StaRKCryptoBots |
| Telegram | empty |
| Pool pair | **SOL** |
| Send creator rewards to | **Creator** |
| Mayhem | **OFF** |
| Creator fee (%) | not shown on SOL — do not market a 2% tax |
| Media | BOTS-logo-official.png (1000×1000) |
| Banner | skip |
| Initial buy | not on create screen — optional 2 SOL buy after mint |

## Wallet

| Item | Value |
|------|-------|
| Creator | `5nx3MqMonC1bAsBv43ZjPDCmZsxKhBcSwW23Ujd12QWh` |
| Balance | 0 SOL |
| Fund before launch | ~2.2 SOL |
| Gate | wait for explicit `launch` |

## Post-create fee routing (locked)

Goal: creator fees land in **admin/creator Solana wallet**, not a GitHub PDA.

| Step | Action |
|------|--------|
| Create | Send creator rewards → **Creator** |
| After mint | Coin admin → fee recipients = **100%** creator/admin wallet |
| GitHub | Repo URL in **description** + landing only |
| GitHub fee recipient | **Skip** unless admin will claim via GH login into the same admin wallet |
| Orgs | Never use GitHub **org** as fee recipient (fees can be lost) |

Admin/creator wallet: see CREATOR-ADDRESS.txt


## Access model (2026-09-20)
- Launch: **open to everyone** — no 0.5% wall on day one.
- Later: new premium tools may require ~0.5% (5M $BOTS) hold.
