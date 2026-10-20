import { useEffect, useRef, useState } from 'react';

// Stock text; blinks when the number changes (live update)
export default function StockLabel({ stock, lowLimit = 5 }) {
  const previous = useRef(stock);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    if (previous.current === stock) return undefined;
    previous.current = stock;
    setChanged(true);
    const timer = setTimeout(() => setChanged(false), 1500);
    return () => clearTimeout(timer);
  }, [stock]);

  let text = `In stock (${stock})`;
  let cls = 'stock-ok';
  if (stock <= 0) {
    text = 'Sold out';
    cls = 'stock-out';
  } else if (stock <= lowLimit) {
    text = `Only ${stock} left!`;
    cls = 'stock-low';
  }
  return <span className={`stock ${cls} ${changed ? 'stock-changed' : ''}`}>{text}</span>;
}
