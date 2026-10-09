import { useEffect, useState } from 'react'
import { listTape, type TapeEntry } from '../lib/activity'

export function Tape({ desk }: { desk?: string }) {
  const [rows, setRows] = useState<TapeEntry[]>([])
  useEffect(() => {
    const tick = () => setRows(listTape(desk).slice(0, 80))
    tick()
    const id = setInterval(tick, 1500)
    return () => clearInterval(id)
  }, [desk])

  return (
    <div className="panel">
      <h2>Activity tape{desk ? ` · ${desk}` : ''}</h2>
      <div className="log">
        <table className="term">
          <thead>
            <tr>
              <th>Time</th>
              <th>Kind</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="muted">
                  empty
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="mono tiny">{r.at.slice(11, 19)}</td>
                <td className={r.kind === 'error' ? 'bad' : r.kind === 'paper' ? 'warn' : 'ok'}>
                  {r.kind}
                </td>
                <td>{r.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
