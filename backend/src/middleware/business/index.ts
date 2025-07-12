// Business middleware exports
export { 
  checkInventoryMiddleware, 
  updateInventoryAfterSale, 
  reserveInventory, 
  releaseInventoryReservation 
} from './inventoryMiddleware';

export { 
  taxMiddleware, 
  calculateTax, 
  getTaxSettings, 
  isProductTaxExempt,
  calculateItemTax,
  generateTaxReport 
} from './taxMiddleware';

export { 
  loyaltyMiddleware, 
  calculateLoyaltyPoints, 
  awardLoyaltyPoints, 
  getLoyaltySettings,
  getTierById,
  checkTierUpgrade 
} from './loyaltyMiddleware';
