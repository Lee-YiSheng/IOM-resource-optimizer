/**
 * BarCraftCalculator encapsulates the bar crafting logic,
 * calculating expected bars per craft, dynamic crafting costs,
 * and mapping ores to bars.
 */
export class BarCraftCalculator {
  constructor({
    barOutputMulti = 1.0,
    freeCraftChance = 0,
    doubleCraftChance = 0,
    tripleCraftChance = 0,
    craft5xChance = 0,
    craft10xChance = 0,
    craft20xChance = 0,
    craft100xChance = 0,
    barCraftCost = 1.0,
    barCardMulti = 2.0
  } = {}) {
    this._barOutputMulti = barOutputMulti;
    this._freeCraftChance = freeCraftChance / 100;
    this._doubleCraftChance = doubleCraftChance / 100;
    this._tripleCraftChance = tripleCraftChance / 100;
    this._craft5xChance = craft5xChance / 100;
    this._craft10xChance = craft10xChance / 100;
    this._craft20xChance = craft20xChance / 100;
    this._craft100xChance = craft100xChance / 100;
    this._barCraftCost = barCraftCost;
    this._barCardMulti = barCardMulti;
  }

  getExpectedBarsPerCraft() {
    return this._barOutputMulti *
      (1 + 1 * this._doubleCraftChance) *
      (1 + 2 * this._tripleCraftChance) *
      (1 + 4 * this._craft5xChance) *
      (1 + 9 * this._craft10xChance) *
      (1 + 19 * this._craft20xChance) *
      (1 + 99 * this._craft100xChance);
  }

  getBarsPerOre(craftCostBase) {
    const trueCraftCost = Math.max(1, Math.round(craftCostBase * this._barCraftCost));
    const effectiveOresPerCraft = trueCraftCost * Math.max(0.001, 1 - this._freeCraftChance);
    return this.getExpectedBarsPerCraft() / effectiveOresPerCraft;
  }

  getBarsPerHour(oresPerHour, craftCostBase) {
    return oresPerHour * this.getBarsPerOre(craftCostBase) * this._barCardMulti;
  }
}
