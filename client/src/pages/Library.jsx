import { useState } from 'react';
import { Link } from 'react-router-dom';
import DownloadButton from '../components/DownloadButton.jsx';
import GameCard from '../components/GameCard.jsx';
import GameImage from '../components/GameImage.jsx';
import LicenseKey from '../components/LicenseKey.jsx';
import { EmptyState, ErrorBox, Loading } from '../components/Loading.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useBrowser.js';
import { formatDate, plural } from '../utils/format.js';

export default function Library() {
  useDocumentTitle('Library');
  const { data, error, loading, reload } = useApi('/library');
  const recommendations = useApi('/recommendations');
  const [search, setSearch] = useState('');
  const [show, setShow] = useState('all');

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox error={error} onRetry={reload} />;

  const items = data.items
    .filter((i) => show === 'all' || i.type === show)
    .filter((i) => i.title.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div>
      <div className="page-head">
        <h1>My library</h1>
        <Link to="/downloads">Download history</Link>
      </div>

      {data.items.length === 0 ? (
        <EmptyState title="Your library is empty" action={<Link to="/" className="btn btn-primary">Go to store</Link>}>
          Products you buy will appear here with their keys.
        </EmptyState>
      ) : (
        <>
          <div className="toolbar">
            <input className="search" type="search" placeholder="Search in library..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={show} onChange={(e) => setShow(e.target.value)}>
              <option value="all">All ({data.items.length})</option>
              <option value="game">Games</option>
              <option value="epin">Codes</option>
            </select>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th />
                <th>Product</th>
                <th>Key / code</th>
                <th>Downloads</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.entryId}>
                  <td style={{ width: 110 }}>
                    <GameImage game={item} className="thumb" />
                  </td>
                  <td>
                    <Link to={`/games/${item.id}`}>
                      <b>{item.title}</b>
                    </Link>
                    <div className="muted small">
                      Bought {formatDate(item.acquiredAt)} (order #{item.orderId})
                    </div>
                  </td>
                  <td>
                    <LicenseKey value={item.licenseKey} />
                  </td>
                  <td>{item.downloadCount > 0 ? plural(item.downloadCount, 'time') : <span className="warning-text">Not downloaded</span>}</td>
                  <td>
                    <div className="buttons">
                      <DownloadButton item={item} small onDone={() => reload({ quiet: true })} />
                      {item.type === 'game' && !item.myRating && <Link to={`/games/${item.id}`}>Rate</Link>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {recommendations.data?.games.length > 0 && (
        <>
          <h2>You may also like</h2>
          <div className="grid">
            {recommendations.data.games.slice(0, 4).map((g) => (
              <GameCard key={g.id} game={g} reason={g.reason} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
