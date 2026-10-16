import { catalogCategories, objectCatalog, type CatalogCategory } from '../data/objectCatalog';

interface PalettePanelProps {
  activeCategory: CatalogCategory;
  activeItemId: string | null;
  onCategoryChange: (category: CatalogCategory) => void;
  onItemChange: (itemId: string) => void;
}

const categoryLabels: Record<CatalogCategory, string> = {
  terrain: 'Terrain',
  platforms: 'Platforms',
  items: 'Items',
  enemies: 'Enemies',
  hazards: 'Hazards',
  utilities: 'Utilities',
  decorations: 'Decorations'
};

export function PalettePanel({
  activeCategory,
  activeItemId,
  onCategoryChange,
  onItemChange
}: PalettePanelProps) {
  const items = objectCatalog.filter((item) => item.category === activeCategory);

  return (
    <nav className="palette-panel" aria-label="Object palette">
      <div className="palette-tabs" role="tablist" aria-label="Palette categories">
        {catalogCategories.map((category) => (
          <button
            key={category}
            type="button"
            aria-label={`${categoryLabels[category]} category`}
            className={category === activeCategory ? 'is-active' : ''}
            onClick={() => onCategoryChange(category)}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>
      <div className="palette-items">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.label}
            className={item.id === activeItemId ? 'is-selected' : ''}
            onClick={() => onItemChange(item.id)}
          >
            <span className={`palette-swatch palette-swatch--${item.category}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
