# $BOTS launch parameters — ideas & recommendation

**Platform:** Solana · pump.fun (primary)  
**Name:** StaRK Bots · **Ticker:** $BOTS  
**Status:** Draft only — not launched  

---

## Reality check (pump.fun)

You do **not** freely set classic “BSC-style” tax/supply on pump.fun:

| Parameter | Who controls it |
|-----------|-----------------|
| **Supply** | Platform — typically **1,000,000,000** ($BOTS) · 6 decimals |
| **Mint authority** | Platform (you can’t mint more later) |
| **Trade “tax”** | Platform fee schedule (bonding curve + after graduate) |
| **Creator take** | **Creator fee** share of trade fees (claimable) — not a custom 5% sell tax |
| **You set** | Name, ticker, image, description, socials, **how much you buy**, messaging |

So “tax = 5% buy / 5% sell” is the wrong mental model here. Think **creator fee + how you buy at launch**.

---

## Recommended setup for StaRK (tools access pass)

### A) Supply
- **Accept 1B $BOTS** (pump.fun default).  
- Hold math reserved for **later premium**: **~0.5% ≈ 5,000,000 $BOTS**.  
- Publish after CA exists — **not** as a launch unlock wall.

### B) Tax / fees (what to tell the market)
- **Do not promise custom taxes.**  
- Say: *“Trading uses pump.fun / PumpSwap fees; creators earn a small creator-fee share to fund tools.”*  
- Rough ballpark (platform-set, can change): ~**1–1.25%** total per trade on curve; creator gets a **slice** (often ~0.3% tier early — verify on pump.fun UI day-of).  
- After graduation: fee tiers by mcap; creator fee often **drops** as mcap rises.

**Brand line:**  
> No arbitrary sell tax. Platform fees only. Creator fees fund StaRK desks.

### C) Dev / creator buy (3 options)

| Plan | Creator buy at launch | Pros | Cons |
|------|------------------------|------|------|
| **1 · Clean (recommended)** | **0–2 SOL** first buy (or none) | Looks legit, fits “tools not sniper” brand | Less early bag |
| **2 · Builder bag** | **3–8 SOL** single wallet, disclosed | Runway for fees/hosting | Must disclose; snipers still compete |
| **3 · Aggressive** | **10+ SOL** / multi-wallet | Bigger bag | Looks like bundle; kills trust for access-pass story |

**Recommendation: Plan 1 or light Plan 2 (≤5 SOL), one wallet, disclosed in launch tweet.**  
No multi-wallet bundle. Matches your “no fake launch volume” rule.

### D) Creator fee use (after claims)
Suggested split (policy, not on-chain unless you use fee-share):
- **50%** hosted infra / APIs  
- **30%** new desks / demos  
- **20%** liquidity top-ups / contingency  

Optional later: pump.fun **fee share** to team wallets (up to 10) if you add partners.

### E) Graduation / LP
- Aim to **graduate** (~platform threshold, often ~$69k mcap / ~85 SOL buy volume — confirm UI).  
- LP on PumpSwap is platform-handled (often burned) — you don’t “own LP” like old launches.  
- Don’t promise “locked LP we control” unless true.

### F) Access model (product, not token tax)
- **Launch:** desks open to everyone (try first).  
- **Later premium:** ~0.5% of supply = **5M $BOTS** may unlock new paid/premium modules.  
- Do **not** market a hold wall on day one.

### G) What to put on the coin page
- Image: official orange/purple hollow hexagon S — `BOTS-logo-official.png` (locked)  
- Description: access pass + GitHub + X + YouTube + landing  
- Website: landing  
- X: @StaRKCryptoBots  
- YouTube: @starksystems-y2r  
- GitHub: StaRKCrypto / stark-tools  
- **No APR language**

---

## Suggested “launch tweet” economics blurb

```
$BOTS — StaRK Bots access pass

Supply: 1B (pump.fun)
No custom tax — platform fees only
Creator fees → fund desks
Desks open at launch · later premium may need ~0.5% hold (5M $BOTS)

Code: github.com/StaRKCrypto/stark-tools
Site: starkcrypto.github.io/stark-tools
NFA
```

---

## Anti-patterns (skip)

- Fake multi-wallet “dev buy”  
- Hidden tax claims that aren’t true on Solana pump  
- Huge first buy that rugs trust  
- CA only in replies  

---

## Decision checklist for you

- [ ] Confirm Plan **1** (0–2 SOL) or **2** (≤5 SOL) creator buy  
- [x] Access model: **open at launch** · ~0.5% = 5M reserved for **later premium**  
- [x] Logo locked: hexagon official mark (`BOTS-logo-official.png`)  
- [ ] Say **launch** only when ready — pack stays draft until then  
