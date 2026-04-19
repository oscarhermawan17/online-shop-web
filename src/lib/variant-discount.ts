import type { VariantDiscountRule, VariantDiscountCustomerType } from '@/types';
import type { CartItem } from '@/stores/cart-store';

interface VariantDiscountContext {
  quantity: number;
  unitPrice: number;
  customerType: VariantDiscountCustomerType;
}

interface ApplicableRule {
  rule: VariantDiscountRule;
  discountAmount: number;
}

interface ResolvedVariantDiscount {
  rule: VariantDiscountRule | null;
  lineSubtotal: number;
  lineDiscount: number;
  effectiveLineTotal: number;
  effectiveUnitPrice: number;
}

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const isRuleApplicable = (rule: VariantDiscountRule, ctx: VariantDiscountContext): boolean => {
  if (!rule.isActive) {
    return false;
  }

  if (rule.customerType && rule.customerType !== ctx.customerType) {
    return false;
  }

  const lineSubtotal = ctx.unitPrice * ctx.quantity;
  const metric = rule.triggerType === 'quantity' ? ctx.quantity : lineSubtotal;

  if (metric < rule.minThreshold) {
    return false;
  }

  if (rule.maxThreshold !== null && metric > rule.maxThreshold) {
    return false;
  }

  return true;
};

const getRuleDiscountAmount = (rule: VariantDiscountRule, ctx: VariantDiscountContext): number => {
  const lineSubtotal = ctx.unitPrice * ctx.quantity;

  let discount = 0;

  if (rule.valueType === 'percentage') {
    const baseAmount = rule.applyMode === 'per_item'
      ? ctx.unitPrice
      : lineSubtotal;

    const percentageDiscount = Math.round((baseAmount * rule.value) / 100);
    discount = rule.applyMode === 'per_item'
      ? percentageDiscount * ctx.quantity
      : percentageDiscount;
  } else {
    discount = rule.applyMode === 'per_item'
      ? rule.value * ctx.quantity
      : rule.value;
  }

  return clamp(discount, 0, lineSubtotal);
};

export const resolveVariantDiscount = (
  rules: VariantDiscountRule[],
  ctx: VariantDiscountContext,
): ResolvedVariantDiscount => {
  const lineSubtotal = Math.max(0, ctx.unitPrice * ctx.quantity);

  if (ctx.quantity <= 0 || ctx.unitPrice < 0) {
    return {
      rule: null,
      lineSubtotal,
      lineDiscount: 0,
      effectiveLineTotal: lineSubtotal,
      effectiveUnitPrice: ctx.unitPrice,
    };
  }

  const applicableRules: ApplicableRule[] = rules
    .filter((rule) => isRuleApplicable(rule, ctx))
    .map((rule) => ({
      rule,
      discountAmount: getRuleDiscountAmount(rule, ctx),
    }))
    .sort((a, b) => {
      if (b.discountAmount !== a.discountAmount) {
        return b.discountAmount - a.discountAmount;
      }

      if (b.rule.priority !== a.rule.priority) {
        return b.rule.priority - a.rule.priority;
      }

      if (b.rule.minThreshold !== a.rule.minThreshold) {
        return b.rule.minThreshold - a.rule.minThreshold;
      }

      return a.rule.id.localeCompare(b.rule.id);
    });

  const selected = applicableRules[0];

  if (!selected) {
    return {
      rule: null,
      lineSubtotal,
      lineDiscount: 0,
      effectiveLineTotal: lineSubtotal,
      effectiveUnitPrice: ctx.unitPrice,
    };
  }

  const lineDiscount = clamp(selected.discountAmount, 0, lineSubtotal);
  const discountedLine = lineSubtotal - lineDiscount;
  const effectiveUnitPrice = ctx.quantity > 0
    ? Math.max(0, Math.floor(discountedLine / ctx.quantity))
    : ctx.unitPrice;
  const effectiveLineTotal = effectiveUnitPrice * ctx.quantity;

  return {
    rule: selected.rule,
    lineSubtotal,
    lineDiscount: lineSubtotal - effectiveLineTotal,
    effectiveLineTotal,
    effectiveUnitPrice,
  };
};

const inferRawPriceFromPercentageDiscount = (
  resolvedUnitPrice: number,
  percentageValue: number,
): number => {
  if (percentageValue <= 0 || percentageValue >= 100) {
    return resolvedUnitPrice;
  }

  const approx = Math.round((resolvedUnitPrice * 100) / (100 - percentageValue));
  const minCandidate = Math.max(0, approx - 20);
  const maxCandidate = approx + 20;

  for (let candidate = minCandidate; candidate <= maxCandidate; candidate += 1) {
    const discounted = candidate - Math.round((candidate * percentageValue) / 100);
    if (discounted === resolvedUnitPrice) {
      return candidate;
    }
  }

  return approx;
};

export const inferVariantRawUnitPrice = (
  resolvedUnitPrice: number,
  rules: VariantDiscountRule[] | undefined,
  activeDiscountRuleId: string | null | undefined,
): number => {
  if (!Number.isFinite(resolvedUnitPrice) || resolvedUnitPrice < 0) {
    return 0;
  }

  if (!rules || rules.length === 0 || !activeDiscountRuleId) {
    return resolvedUnitPrice;
  }

  const activeRule = rules.find((rule) => rule.id === activeDiscountRuleId);
  if (!activeRule) {
    return resolvedUnitPrice;
  }

  if (activeRule.valueType === 'fixed_amount') {
    return resolvedUnitPrice + activeRule.value;
  }

  return inferRawPriceFromPercentageDiscount(resolvedUnitPrice, activeRule.value);
};

export const resolveCartItemPricing = (
  item: CartItem,
  customerType: VariantDiscountCustomerType,
) => {
  const quantity = Math.max(0, Number(item.quantity) || 0);
  const resolvedUnitPrice = Math.max(0, Number(item.price) || 0);
  const rules = item.discountRules ?? [];
  const baseUnitPrice = item.baseUnitPrice ?? inferVariantRawUnitPrice(
    resolvedUnitPrice,
    rules,
    item.activeDiscountRuleId,
  );

  const pricing = resolveVariantDiscount(rules, {
    quantity,
    unitPrice: baseUnitPrice,
    customerType,
  });

  return {
    unitPrice: pricing.effectiveUnitPrice,
    lineTotal: pricing.effectiveLineTotal,
    lineDiscount: pricing.lineDiscount,
  };
};

export const getCartSubtotal = (
  items: CartItem[],
  customerType: VariantDiscountCustomerType,
): number => (
  items.reduce((total, item) => total + resolveCartItemPricing(item, customerType).lineTotal, 0)
);
