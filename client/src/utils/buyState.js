// What the buy button shows, and why buying is not possible
export function getBuyState(game, { user, shop }) {
  const ownsGame = game.type === 'game' && (shop.owned.has(game.id) || game.owned);
  if (!user) return { kind: 'guest', label: 'Login to buy' };
  if (!user.permissions.includes('store.purchase')) {
    return { kind: 'staff', label: 'Staff account', reason: "Staff accounts can't buy games. Log in with a customer account." };
  }
  if (ownsGame) return { kind: 'owned', label: 'In library' };
  if (!game.isActive) return { kind: 'hidden', label: 'Not for sale', reason: 'This product is not sold anymore.' };
  if (game.stock <= 0) {
    return { kind: 'soldout', label: 'Sold out', reason: 'All keys are sold. Add it to your wishlist to get a notification when it is back.' };
  }
  if (shop.cart.has(game.id)) return { kind: 'incart', label: 'In cart' };
  return { kind: 'buy', label: 'Add to cart' };
}
