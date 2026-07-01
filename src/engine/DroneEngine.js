/**
 * DroneEngine encapsulates the calculation logic for all drones:
 * Void Drone, Chain Drone, and Vein Drone.
 */
export class DroneEngine {
  constructor({
    voidDroneEquipped = false,
    voidDroneLevel = 0,
    voidDroneGrade = 15,
    voidPortalChance = undefined,
    goldenVoidPortalChance = 0,
    rainbowVoidPortalChance = 0,
    baseVoidPortalMulti = 1.0,
    goldenVoidMulti = 1.0,
    rainbowVoidMulti = 1.0,

    chainDroneEquipped = false,
    chainDroneGrade = 0,

    veinDroneFueled = false,
    veinDroneLevel = 0,
    veinDroneGrade = 0
  } = {}) {
    this._voidDroneEquipped = voidDroneEquipped;
    this._voidDroneLevel = voidDroneLevel;
    this._voidDroneGrade = voidDroneGrade;
    this._voidPortalChanceOverride = voidPortalChance;
    this._goldenVoidPortalChance = goldenVoidPortalChance;
    this._rainbowVoidPortalChance = rainbowVoidPortalChance;
    this._baseVoidPortalMulti = baseVoidPortalMulti;
    this._goldenVoidMulti = goldenVoidMulti;
    this._rainbowVoidMulti = rainbowVoidMulti;

    this._chainDroneEquipped = chainDroneEquipped;
    this._chainDroneGrade = chainDroneGrade;

    this._veinDroneFueled = veinDroneFueled;
    this._veinDroneLevel = veinDroneLevel;
    this._veinDroneGrade = veinDroneGrade;
  }

  // --- Void Drone Methods ---
  isVoidDroneEquipped() {
    return this._voidDroneEquipped;
  }

  getVoidPortalChance() {
    if (!this._voidDroneEquipped) return 0;
    const computedChance = 10 + 2 * this._voidDroneLevel;
    const chancePercent = this._voidPortalChanceOverride !== undefined 
      ? this._voidPortalChanceOverride 
      : computedChance;
    return chancePercent / 100;
  }

  getExpectedPortalMulti() {
    const pGoldenVoid = this._goldenVoidPortalChance / 100;
    const pRainbowVoid = this._rainbowVoidPortalChance / 100;
    const mVoidDrone = 3.0 + this._voidDroneGrade * 1.0;

    const vBase = this._baseVoidPortalMulti * mVoidDrone;
    const vGolden = vBase * this._goldenVoidMulti;
    const vRainbow = vGolden * this._rainbowVoidMulti;

    return (1 - pGoldenVoid) * vBase + pGoldenVoid * ((1 - pRainbowVoid) * vGolden + pRainbowVoid * vRainbow);
  }

  // --- Chain Drone Methods ---
  isChainDroneEquipped() {
    return this._chainDroneEquipped;
  }

  getChainDroneMulti() {
    return this._chainDroneEquipped 
      ? (1.50 + this._chainDroneGrade * 0.10) 
      : 1.0;
  }

  // --- Vein Drone Methods ---
  isVeinDroneFueled() {
    return this._veinDroneFueled;
  }

  getVeinDroneSpawnMulti() {
    return this._veinDroneFueled 
      ? (1 + 0.10 + this._veinDroneLevel * 0.02) 
      : 1.0;
  }

  getVeinDroneGoldenMulti() {
    return this._veinDroneFueled 
      ? (1 + 0.50 + this._veinDroneGrade * 0.10) 
      : 1.0;
  }
}
