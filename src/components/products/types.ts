import { VisualBadge } from '../../theme/visuals';

export type CatalogProductItem = {
  id: string;
  name: string;
  categoryLabel: string | null;
  latestPriceLabel: string;
  latestMeasureLabel: string | null;
  unitPriceLabel: string | null;
  secondaryMetaLabel: string;
  visual: VisualBadge;
  hasPrice: boolean;
};