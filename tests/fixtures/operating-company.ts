import { DEFAULT_RECIPE } from '../../src/game/data';
import { agedFlavor, predictFlavor, qualityScore } from '../../src/game/flavor';
import { createGame } from '../../src/game/state';

// 模拟已有品牌与成品的 v1 存量档案，继续覆盖原有经营规则与兼容性。
export function operatingCompany(seed = 20261111) {
  const s = createGame({ name: '测试酒业', logo: '酱', direction: '科技研发' }, seed);
  const recipe = { ...DEFAULT_RECIPE, name: '测试一号', brand: '测试品牌' };
  const flavor = agedFlavor(predictFlavor(recipe), 12);
  s.company.brand = recipe.brand;
  s.company.product = recipe.name;
  s.recipes = [recipe];
  s.products = [
    {
      id: 'product-1',
      recipe: { ...recipe },
      flavor,
      quality: qualityScore(flavor),
      stock: 3200,
      unitCost: 58,
      sold: 0,
      feedback: 72,
      lastAge: 12,
      lastSold: 0,
      lastRepeat: 0,
      repeatRate: 0,
    },
  ];
  s.batches.forEach((batch) => {
    batch.recipeId = recipe.id;
  });
  s.dealers.forEach((dealer, i) => {
    dealer.lots = [
      {
        productId: 'product-1',
        bottles: i === 0 ? 1000 : 600,
        unitCost: 110.88,
        price: 168,
        quality: 72,
      },
    ];
    dealer.soldLast = i === 0 ? 620 : 380;
    dealer.priceFactor = 0.98;
  });
  return s;
}
