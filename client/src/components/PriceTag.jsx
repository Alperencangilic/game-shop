import { formatMoney } from '../utils/format.js';

export default function PriceTag({ game, big = false }) {
  const onSale = game.discountPercent > 0;
  return (
    <span className={`price ${big ? 'price-big' : ''}`}>
      {onSale && <span className="badge badge-red">-{game.discountPercent}%</span>}
      {onSale && <s className="old-price">{formatMoney(game.priceCents)}</s>}
      <b>{game.finalPriceCents === 0 ? 'Free' : formatMoney(game.finalPriceCents)}</b>
    </span>
  );
}
