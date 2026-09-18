import { VENUE } from '../lib/venues/links'

export function VenueDock({
  name,
  href,
  marketsHref,
}: {
  name: string
  href: string
  marketsHref?: string
}) {
  return (
    <section className="dock">
      <div className="dock-k">TRADING UI · REAL VENUE</div>
      <h2>{name}</h2>
      <p>
        Execution, books, and charts live on the venue site. This companion does not clone
        that UI. Venues send <span className="mono">X-Frame-Options: DENY</span> so they
        cannot be embedded — keep the real desk in another window.
      </p>
      <div className="dock-url mono">{href}</div>
      <div className="row">
        <a className="btn btn-buy" href={href} target="_blank" rel="noreferrer">
          Open {name}
        </a>
        {marketsHref && (
          <a className="btn" href={marketsHref} target="_blank" rel="noreferrer">
            Markets
          </a>
        )}
        <button
          className="btn"
          type="button"
          onClick={() => void navigator.clipboard.writeText(href)}
        >
          Copy URL
        </button>
      </div>
      {name.toLowerCase().includes('lighter') && (
        <p className="tiny">Markets table: {VENUE.lighterMarkets}</p>
      )}
    </section>
  )
}
