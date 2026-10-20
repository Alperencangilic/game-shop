import { api } from '../api.js';
import { useLiveEvent } from '../context/LiveContext.jsx';
import { useApi } from './useApi.js';

// All products, updated live when stock or prices change
export function useGamesFeed() {
  const { data, error, loading, reload, setData } = useApi('/games');

  useLiveEvent(async (event) => {
    if (event.type === 'catalog-changed') {
      reload({ quiet: true });
    } else if (event.type === 'game-updated' && event.gameId) {
      try {
        const { game } = await api.get(`/games/${event.gameId}`);
        setData((current) => current && { games: current.games.map((g) => (g.id === game.id ? game : g)) });
      } catch {
        reload({ quiet: true });
      }
    }
  });

  return { games: data?.games ?? [], error, loading, reload };
}
