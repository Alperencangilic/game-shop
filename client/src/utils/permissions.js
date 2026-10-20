// Same texts as server/src/permissions.js
export const DENIED_MESSAGES = {
  'store.purchase': "Staff accounts can't buy games. Sign in with a customer account to shop.",
  'backoffice.access': 'The admin panel is only for store managers and administrators.',
  'games.manage': 'Only store managers and administrators can change the catalog.',
  'promotions.manage': 'Only store managers and administrators can manage promotions.',
  'orders.view': 'Only staff can see all orders.',
  'orders.refund': 'Only administrators can refund orders.',
  'reports.view': 'Only staff can see sales reports.',
  'users.manage': 'Only administrators can manage user accounts.',
  'logs.view': 'Only administrators can see the logs.',
};

export const ROLE_DESCRIPTIONS = {
  customer: 'Can buy games and codes, download them and write reviews.',
  manager: 'Can manage products, prices, stock and promotions, and see orders and reports.',
  admin: 'Can do everything a manager can, plus refunds, user accounts and logs.',
};
