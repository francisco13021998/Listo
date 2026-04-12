function getReferenceUnit(unit: string | null) {
  if (unit === 'g' || unit === 'kg') return 'kg';
  if (unit === 'ml' || unit === 'l') return 'l';
  if (unit === 'u') return 'unidad';
  return null;
}

function getQuantityInReferenceUnit(quantity: number | null, unit: string | null) {
  if (quantity === null || quantity === undefined || quantity <= 0 || !unit) return null;
  if (unit === 'kg') return quantity;
  if (unit === 'g') return quantity / 1000;
  if (unit === 'l') return quantity;
  if (unit === 'ml') return quantity / 1000;
  if (unit === 'u') return quantity;
  return null;
}

export function formatMeasure(quantity: number | null, unit: string | null) {
  if (quantity === null || quantity === undefined || !unit) return null;
  const quantityLabel = Number.isInteger(quantity) ? String(quantity) : String(quantity).replace('.', ',');
  return `${quantityLabel} ${unit}`;
}

export function formatUnitPrice(cents: number, quantity: number | null, unit: string | null) {
  const referenceUnit = getReferenceUnit(unit);
  const normalizedQuantity = getQuantityInReferenceUnit(quantity, unit);

  if (!referenceUnit || !normalizedQuantity) return null;

  const value = (cents / normalizedQuantity / 100).toFixed(2).replace('.', ',');
  return `${value} €/${referenceUnit}`;
}

export function formatPrice(cents: number) {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

export function formatHistoryDate(value: string) {
  return new Date(value).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}