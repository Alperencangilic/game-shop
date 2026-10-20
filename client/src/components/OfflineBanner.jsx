import { useLiveStatus } from '../context/LiveContext.jsx';
import { useOnlineStatus } from '../hooks/useBrowser.js';

// Warning bar when there is no internet or the server is down
export default function OfflineBanner() {
  const online = useOnlineStatus();
  const live = useLiveStatus();
  if (online && live !== 'offline') return null;
  return (
    <div className="offline-banner">
      {!online ? 'You are offline. Changes cannot be saved right now.' : 'Cannot connect to the server. Trying again...'}
    </div>
  );
}
