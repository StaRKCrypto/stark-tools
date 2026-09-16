# Nado farm / MM — strategy notes (teaser)

Paper thinking only. Not executable.

## Intent

- Two-sided quotes on a liquid perp when equity supports venue min notional
- Inventory-first: after a fill, cover toward flat before restoring two-sided size
- Prefer heartbeat / routine health checks over silent fire-and-forget

## Nado MCP (conceptual)

Hosted StaRK desks may talk to Nado through an **MCP tool surface** (account stats,
books, orders, funding). Public teasers never ship MCP keys or env files.

## Risk checklist (paper)

- [ ] Min notional vs available equity
- [ ] Leverage / isolation caps understood
- [ ] Cancel / flatten path rehearsed on paper
- [ ] No live keys in this repo
