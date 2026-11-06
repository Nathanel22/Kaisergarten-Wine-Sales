export const CART_STORAGE_KEY = 'kaisergarten_cart_items';
export const SELLER_STORAGE_KEY = 'kaisergarten_active_seller_id';
export const ORDERS_STORAGE_KEY = 'kaisergarten_demo_orders_v1';

export function resetDemoData(storage: Storage) {
  for (const key of [CART_STORAGE_KEY, SELLER_STORAGE_KEY, ORDERS_STORAGE_KEY]) {
    storage.removeItem(key);
    if (storage.getItem(key) !== null) throw new Error('Demo-Daten konnten nicht vollständig entfernt werden.');
  }
}
