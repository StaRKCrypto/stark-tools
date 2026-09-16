# Lighter (RH) desk — docs teaser

Illustrative only. No live send.

## Posture

- Separate RH Lighter instance vs core Lighter — treat books, fees, and points as venue-specific
- Paper MM: quote both sides with a fixed toy spread; never ship live keys here
- S/R directional desk (hosted): scan → decide → optional arm — public sample stops at synthetic quotes

## Safety

- Live keys private — never commit `lighter-*.env`
- Prefer dry-run / disarmed defaults on any hosted build
- Flatten path rehearsed before arming
