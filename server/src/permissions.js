export const ROLES = ['customer', 'manager', 'admin'];

export const ROLE_LABELS = {
  customer: 'Customer',
  manager: 'Store manager',
  admin: 'Administrator',
};

const PERMISSIONS = {
  customer: ['store.purchase'],
  manager: ['backoffice.access', 'games.manage', 'promotions.manage', 'orders.view', 'reports.view', 'reviews.moderate'],
  admin: [
    'backoffice.access',
    'games.manage',
    'promotions.manage',
    'orders.view',
    'orders.refund',
    'reports.view',
    'reviews.moderate',
    'users.manage',
    'logs.view',
  ],
};

export const DENIED_MESSAGES = {
  'store.purchase': "Staff accounts can't buy games. Sign in with a customer account to shop.",
  'backoffice.access': 'The admin panel is only for store managers and administrators.',
  'games.manage': 'Only store managers and administrators can change the catalog.',
  'promotions.manage': 'Only store managers and administrators can manage promotions.',
  'orders.view': 'Only staff can see all orders.',
  'orders.refund': 'Only administrators can refund orders.',
  'reports.view': 'Only staff can see sales reports.',
  'reviews.moderate': 'You can only delete your own reviews.',
  'users.manage': 'Only administrators can manage user accounts.',
  'logs.view': 'Only administrators can see the logs.',
};

export function permissionsFor(role) {
  return PERMISSIONS[role] ?? [];
}

export function hasPermission(user, permission) {
  return Boolean(user) && permissionsFor(user.role).includes(permission);
}
