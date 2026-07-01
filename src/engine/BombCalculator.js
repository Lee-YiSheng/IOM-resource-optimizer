/**
 * BombCalculator encapsulates the calculations for Bomb of Plenty,
 * Transmuter Bomb, Golden Ore multipliers, and Triple Ore chance.
 */
export class BombCalculator {
  constructor({
    bopMulti = 1.0,
    transmuterMulti = 1.0,
    transmuterBopMarkChance = 0,
    goldenOreChance = 0,
    bopGoldOreChance = 0,
    goldenOreMulti = 1.0,
    tripleOreChance = 0,
    oreIncomeMulti = 1.0,
    oreCardMulti = 2.0
  } = {}) {
    this._bopMulti = bopMulti;
    this._transmuterMulti = transmuterMulti;
    this._transmuterBopMarkChance = transmuterBopMarkChance / 100;
    this._goldenOreChance = goldenOreChance / 100;
    this._bopGoldOreChance = bopGoldOreChance / 100;
    this._goldenOreMulti = goldenOreMulti;
    this._tripleOreChance = tripleOreChance;
    this._oreIncomeMulti = oreIncomeMulti;
    this._oreCardMulti = oreCardMulti;
  }

  getExpectedBombMulti() {
    return this._bopMulti * (this._transmuterBopMarkChance * this._transmuterMulti + (1 - this._transmuterBopMarkChance) * 1.0);
  }

  getExpectedGoldenOreMulti() {
    const totalGoldenOreChance = Math.min(1.0, this._goldenOreChance + this._bopGoldOreChance);
    return (1 - totalGoldenOreChance) * 1.0 + totalGoldenOreChance * this._goldenOreMulti;
  }

  getExpectedTripleOreMulti() {
    return 1 + 2 * (Math.min(100, this._tripleOreChance) / 100);
  }

  getOreMultiplierChain(expectedFloorMulti) {
    return expectedFloorMulti * 
      this.getExpectedGoldenOreMulti() * 
      this.getExpectedBombMulti() * 
      this._oreIncomeMulti * 
      this.getExpectedTripleOreMulti() * 
      this._oreCardMulti;
  }
}
