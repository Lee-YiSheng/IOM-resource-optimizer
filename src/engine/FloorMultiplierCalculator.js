/**
 * FloorMultiplierCalculator encapsulates the stacked expected multiplier
 * when entering a floor (Golden -> Rainbow -> Galactic -> Prismatic layers).
 */
export class FloorMultiplierCalculator {
  constructor({
    goldenFloorChance = 0,
    rainbowFloorChance = 0,
    galacticFloorChance = 0,
    prismaticFloorChance = 0,
    goldenFloorMulti = 1.0,
    rainbowFloorMulti = 1.0,
    galacticFloorMulti = 1.0,
    prismaticFloorMulti = 1.0,
    chainDroneMulti = 1.0
  } = {}) {
    this._pGoldenFloor = goldenFloorChance / 100;
    this._pRainbowFloor = rainbowFloorChance / 100;
    this._pGalacticFloor = galacticFloorChance / 100;
    this._pPrismaticFloor = prismaticFloorChance / 100;

    // Chain Drone boosts the golden floor multiplier directly
    this._mGoldenFloor = goldenFloorMulti * chainDroneMulti;
    this._mRainbowFloor = rainbowFloorMulti;
    this._mGalacticFloor = galacticFloorMulti;
    this._mPrismaticFloor = prismaticFloorMulti;
  }

  getExpectedFloorMulti() {
    const prismaticLayer = (1 - this._pPrismaticFloor) * 1.0 + this._pPrismaticFloor * this._mPrismaticFloor;
    const galacticLayer = (1 - this._pGalacticFloor) * 1.0 + this._pGalacticFloor * this._mGalacticFloor * prismaticLayer;
    const rainbowLayer = (1 - this._pRainbowFloor) * 1.0 + this._pRainbowFloor * this._mRainbowFloor * galacticLayer;
    const expectedFloorMulti = (1 - this._pGoldenFloor) * 1.0 + this._pGoldenFloor * this._mGoldenFloor * rainbowLayer;

    return expectedFloorMulti;
  }
}
