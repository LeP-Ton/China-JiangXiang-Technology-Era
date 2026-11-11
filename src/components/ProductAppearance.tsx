import { PACKAGING } from '../game/data';
import type { Company, Recipe } from '../game/types';
import WineBottle from './WineBottle';

export default function ProductAppearance({
  recipe,
  company,
  note,
  compact = false,
}: {
  recipe: Pick<Recipe, 'name' | 'brand' | 'packaging'>;
  company: Pick<Company, 'name' | 'logo'>;
  note?: string;
  compact?: boolean;
}) {
  return (
    <div className={`product-appearance ${compact ? 'appearance-compact' : ''}`}>
      <div className={`appearance-bottle-scene packaging-${recipe.packaging}`}>
        <WineBottle
          brand={recipe.brand}
          product={recipe.name}
          company={company.name}
          logo={company.logo}
          packaging={recipe.packaging}
        />
      </div>
      <div className="appearance-details">
        <small>
          {recipe.brand} / {recipe.packaging}包装
        </small>
        <strong>{recipe.name}</strong>
        {!compact && <span>{PACKAGING[recipe.packaging].description}</span>}
        {note && <em>{note}</em>}
      </div>
    </div>
  );
}
