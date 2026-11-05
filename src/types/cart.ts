import { PricedWine } from './wine';
import { CartonValidationResult } from '../utils/cartonRule';

export interface CartItem {
  wine: PricedWine;
  quantity: number; // total number of bottles
}

export interface CartSummary {
  totalBottles: number;
  totalCases: number; // integer 6-packs
  singleBottlesRemainder: number;
  rawSubtotalCHF: number;
  rawSubtotalRappen: number;
  cartonDiscountCHF: number;
  cartonDiscountRappen: number;
  netTotalCHF: number;
  netTotalRappen: number;
  mwstCHF: number;
  mwstRappen: number;
  finalTotalCHF: number;
  finalTotalRappen: number;
  cartonValidation: CartonValidationResult;
}
