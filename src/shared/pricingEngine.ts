import { Product, ProductOption, PriceTier, CrmSettings } from '../types/crm';

export interface PriceEstimateInput {
  product: Product;
  quantity: number;
  optionsSelected?: { optionId: string; quantity?: number }[];
  allOptions?: ProductOption[];
  tiers?: PriceTier[];
  discountPct?: number; // 0 to 100
  actorType?: 'human' | 'agent';
  settings: CrmSettings;
}

export interface PriceBreakdown {
  sku: string;
  productName: string;
  pricingModel: string;
  quantity: number;
  unitPrice: number;
  unitPriceRule: string;
  optionsTotal: number;
  optionsBreakdown: { name: string; amount: number; mode: 'add' | 'multiply'; subtotal: number }[];
  grossSubtotal: number;
  discountPct: number;
  discountAmount: number;
  lineTotal: number;
  isUnpriced: boolean;
  unpricedReason?: string;
  approvalRequired: boolean;
  approvalReason?: string;
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function computeLinePrice(input: PriceEstimateInput): PriceBreakdown {
  const {
    product,
    quantity,
    optionsSelected = [],
    allOptions = [],
    tiers = [],
    discountPct = 0,
    actorType = 'human',
    settings,
  } = input;

  if (product.needs_price || product.base_price === null) {
    return {
      sku: product.sku,
      productName: product.name,
      pricingModel: product.pricing_model,
      quantity,
      unitPrice: 0,
      unitPriceRule: 'NEEDS PRICE (Unpriced)',
      optionsTotal: 0,
      optionsBreakdown: [],
      grossSubtotal: 0,
      discountPct,
      discountAmount: 0,
      lineTotal: 0,
      isUnpriced: true,
      unpricedReason: `Product ${product.sku} has no base price set. Price must be configured in Price Book.`,
      approvalRequired: false,
    };
  }

  let effectiveUnitPrice = product.base_price;
  let unitPriceRule = `Base price (${product.base_price} ${product.currency})`;

  // Tiered pricing
  if (product.pricing_model === 'tiered' && tiers.length > 0) {
    const sortedTiers = [...tiers].sort((a, b) => a.min_qty - b.min_qty);
    const matchedTier = sortedTiers
      .reverse()
      .find((t) => quantity >= t.min_qty && (t.max_qty === null || quantity <= t.max_qty));

    if (matchedTier) {
      effectiveUnitPrice = matchedTier.unit_price;
      unitPriceRule = `Tier: ${matchedTier.label} (${matchedTier.unit_price} ${product.currency} for qty >= ${matchedTier.min_qty})`;
    }
  }

  // Base gross amount for line
  let gross = effectiveUnitPrice * quantity;

  // Add-on options
  const optionsBreakdown: PriceBreakdown['optionsBreakdown'] = [];
  let optionsAddition = 0;
  let multiplierAccumulator = 1;

  for (const optSel of optionsSelected) {
    const optDef = allOptions.find((o) => o.id === optSel.optionId);
    if (!optDef) continue;
    const optQty = optSel.quantity ?? 1;

    if (optDef.price_mode === 'add') {
      const optCost = optDef.amount * optQty;
      optionsAddition += optCost;
      optionsBreakdown.push({
        name: optDef.name,
        amount: optDef.amount,
        mode: 'add',
        subtotal: roundMoney(optCost),
      });
    } else if (optDef.price_mode === 'multiply') {
      multiplierAccumulator *= (1 + optDef.amount);
      optionsBreakdown.push({
        name: optDef.name,
        amount: optDef.amount,
        mode: 'multiply',
        subtotal: roundMoney(gross * optDef.amount),
      });
    }
  }

  let grossSubtotal = roundMoney((gross + optionsAddition) * multiplierAccumulator);

  // Discount
  const clampedDiscountPct = Math.max(0, Math.min(100, discountPct));
  const discountAmount = roundMoney(grossSubtotal * (clampedDiscountPct / 100));
  let lineTotal = roundMoney(grossSubtotal - discountAmount);

  // Minimum price safeguard
  if (product.min_price && lineTotal < product.min_price) {
    lineTotal = product.min_price;
  }

  // Discount Governance & Approvals
  let approvalRequired = false;
  let approvalReason: string | undefined;

  const agentCap = settings.agent_discount_cap_pct ?? 10;
  const humanThreshold = settings.approval_threshold_pct ?? 20;

  if (actorType === 'agent' && clampedDiscountPct > agentCap) {
    approvalRequired = true;
    approvalReason = `Agent discount (${clampedDiscountPct}%) exceeds agent cap (${agentCap}%). Owner approval required.`;
  } else if (actorType === 'human' && clampedDiscountPct > humanThreshold) {
    approvalRequired = true;
    approvalReason = `Discount (${clampedDiscountPct}%) exceeds approval threshold (${humanThreshold}%). Owner approval required.`;
  }

  return {
    sku: product.sku,
    productName: product.name,
    pricingModel: product.pricing_model,
    quantity,
    unitPrice: roundMoney(effectiveUnitPrice),
    unitPriceRule,
    optionsTotal: roundMoney(optionsAddition),
    optionsBreakdown,
    grossSubtotal,
    discountPct: clampedDiscountPct,
    discountAmount,
    lineTotal,
    isUnpriced: false,
    approvalRequired,
    approvalReason,
  };
}

export function computeQuoteTotals(
  lines: { lineTotal?: number; line_total?: number; discountAmount?: number; isRecurring?: boolean; is_recurring?: boolean }[],
  taxRate: number
) {
  const subtotal = roundMoney(lines.reduce((acc, l) => acc + (l.lineTotal ?? l.line_total ?? 0), 0));
  const discountTotal = roundMoney(lines.reduce((acc, l) => acc + (l.discountAmount || 0), 0));
  const taxTotal = roundMoney(subtotal * taxRate);
  const total = roundMoney(subtotal + taxTotal);

  return {
    subtotal,
    discountTotal,
    taxRate,
    taxTotal,
    total,
  };
}
