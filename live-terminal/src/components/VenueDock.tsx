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
    <div className="venuebar">
      <div>
        <div className="dock-k">REAL VENUE · CHART / BOOK / TICKET</div>
        <div className="mono">{href.replace(/^https:\/\//, '')}</div>
      </div>
      <div className="row">
        <a className="btn btn-buy" href={href} target="_blank" rel="noreferrer">
          Open {name}
        </a>
        {marketsHref && (
          <a className="btn" href={marketsHref} target="_blank" rel="noreferrer">
            Markets
          </a>
        )}
      </div>
    </div>
  )
}
