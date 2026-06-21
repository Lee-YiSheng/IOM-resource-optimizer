/**
 * Vein Income Calculator Engine for Idle Obelisk Miner.
 *
 * Computes per-vein-type spawn rates, income multipliers (golden/rainbow/gleaming),
 * Veinmorpher Bomb expected values, and hourly income.
 *
 * Key formula notes:
 * - Golden Vein Multi is the TOTAL multiplier (base x5 is just the default starting value)
 * - Rainbow stacks on top of golden: rainbow income = goldenMulti * rainbowMulti
 * - Gleaming is independent: gleaming income = gleamingMulti
 * - Income per vein = [golden/rainbow layer] × [gleaming layer] × veinIncomeMulti × cardMultiplier
 * - Each vein type shows income as if farming it full-time
 */
import { VEINS } from '../data/veins.js';

/**
 * Calculate full vein income stats for all vein types.
 *
 * @param {object} params
 * @param {number} params.veinSpawnRateMulti    - Vein Spawn Rate Multiplier (e.g. 3.0)
 * @param {number} params.veinIncomeMulti       - Vein Income Multiplier (e.g. 1.33)
 * @param {number} params.goldenVeinChance      - Golden Vein Chance as decimal (e.g. 0.30 = 30%)
 * @param {number} params.goldenVeinMulti       - Golden Vein Multiplier total (e.g. 12.65, base is 5)
 * @param {number} params.rainbowVeinChance     - Rainbow Vein Chance as decimal (e.g. 0.01 = 1%)
 * @param {number} params.rainbowVeinMulti      - Rainbow Vein Multiplier total (e.g. 10.0, base is 20)
 * @param {number} params.gleamingVeinChance    - Gleaming Vein Chance as decimal (e.g. 0.0)
 * @param {number} params.gleamingVeinMulti     - Gleaming Vein Multiplier total (e.g. 1.0, base is 5)
 * @param {boolean} params.veinResearch2x       - 2x Vein Research toggle
 * @param {number} params.oresPerFloor          - Ores per floor (10 or 12)
 * @param {boolean} params.veinDroneFueled      - Whether the vein drone is fueled
 * @param {number} params.veinDroneLevel        - Vein drone level (0–15)
 * @param {number} params.veinDroneGrade        - Vein drone grade (0–125)
 * @param {boolean} params.veinmorpherBomb      - Whether Veinmorpher Bomb is active
 * @param {number} params.floorsPerHour         - Floors cleared per hour (from game speed)
 * @param {number} params.cardMultiplier        - Card multiplier (e.g. 1.50)
 * @returns {object} Per-vein breakdown + totals
 */
export function calculateVeinIncome({
  veinSpawnRateMulti = 1.0,
  veinIncomeMulti = 1.0,
  goldenVeinChance = 0,
  goldenVeinMulti = 1.0,
  rainbowVeinChance = 0,
  rainbowVeinMulti = 1.0,
  gleamingVeinChance = 0,
  gleamingVeinMulti = 1.0,
  veinResearch2x = false,
  oresPerFloor = 10,
  veinDroneFueled = false,
  veinDroneLevel = 0,
  veinDroneGrade = 0,
  veinmorpherBomb = false,
  floorsPerHour = 172800,
  cardMultiplier = 1.0,
}) {
  // === Drone Effects ===
  // Vein Drone: +10% vein spawn rate base, +2% per level (up to 15)
  const droneSpawnMulti = veinDroneFueled
    ? (1 + 0.10 + veinDroneLevel * 0.02)
    : 1.0;

  // Vein Drone Grade: +50% golden vein multi at grade 0, +10% per grade (up to 125)
  // When fueled, multiplies the user's golden vein multi input
  const droneGoldenMulti = veinDroneFueled
    ? (1 + 0.50 + veinDroneGrade * 0.10)
    : 1.0;

  // === Research ===
  const researchMulti = veinResearch2x ? 2.0 : 1.0;

  // === Effective spawn rate (before dividing by rarity) ===
  const effectiveSpawnRate = veinSpawnRateMulti * droneSpawnMulti * researchMulti;

  // === Effective golden vein multiplier (drone grade boosts golden multi) ===
  const effectiveGoldenMulti = goldenVeinMulti * droneGoldenMulti;

  // === Total floors for proportional income ===
  const totalFloors = 120;

  // === Per-vein-type calculations ===
  const veinResults = VEINS.map(vein => {
    const ores = oresPerFloor;
    const numFloorsForVein = vein.floors[1] - vein.floors[0] + 1;

    // --- Vein spawn probability per ore node ---
    const spawnProb = Math.min(1, effectiveSpawnRate / (vein.rarity * ores));

    // --- Expected veins per floor (without bomb) ---
    const veinsPerFloorNoBomb = ores * spawnProb;

    // --- Veinmorpher Bomb expected value ---
    // Bomb: 10% chance to morph ALL ores to veins, 10% chance to make ALL veins golden
    // Both rolls independent. 1 bomb per floor.
    let expectedVeinsPerFloor;
    let expectedGoldenFractionPerFloor;

    if (veinmorpherBomb) {
      const bombMorphChance = 0.10;
      const bombGoldenChance = 0.10;

      // Expected veins: 90% normal + 10% all ores become veins
      expectedVeinsPerFloor = (1 - bombMorphChance) * veinsPerFloorNoBomb + bombMorphChance * ores;

      // Golden fraction:
      // 90% normal golden chance + 10% all veins golden
      expectedGoldenFractionPerFloor = (1 - bombGoldenChance) * goldenVeinChance + bombGoldenChance * 1.0;
    } else {
      expectedVeinsPerFloor = veinsPerFloorNoBomb;
      expectedGoldenFractionPerFloor = goldenVeinChance;
    }

    // --- Income calculation per vein ---
    // The user inputs are TOTAL multipliers (not additional on top of base):
    //   - goldenVeinMulti: total golden vein income multiplier (default/base = 5)
    //   - rainbowVeinMulti: stacks ON TOP of golden (rainbow income = golden × rainbow)
    //   - gleamingVeinMulti: independent layer (default/base = 5)
    //
    // Golden/Rainbow layer (exclusive states per vein):
    //   Normal (no golden): income = 1
    //   Golden (not rainbow): income = effectiveGoldenMulti
    //   Golden+Rainbow: income = effectiveGoldenMulti × rainbowVeinMulti
    //
    // Gleaming layer (independent roll, multiplicative):
    //   Non-gleaming: ×1
    //   Gleaming: × gleamingVeinMulti

    const goldenFrac = expectedGoldenFractionPerFloor;

    // Golden/Rainbow expected multiplier
    const goldenRainbowLayer =
      (1 - goldenFrac) * 1 +
      goldenFrac * effectiveGoldenMulti * ((1 - rainbowVeinChance) + rainbowVeinChance * rainbowVeinMulti);

    // Gleaming expected multiplier (independent)
    const gleamingLayer =
      (1 - gleamingVeinChance) * 1 +
      gleamingVeinChance * gleamingVeinMulti;

    // Total expected income per vein
    const expectedIncomePerVein = goldenRainbowLayer * gleamingLayer * veinIncomeMulti * cardMultiplier;

    // --- Income per floor ---
    const incomePerFloor = expectedVeinsPerFloor * expectedIncomePerVein;

    // --- Income per hour (full-time farming this vein) ---
    const incomePerHourFullTime = incomePerFloor * floorsPerHour;

    // --- Proportional income per hour (cycling through all 120 floors) ---
    const floorFraction = numFloorsForVein / totalFloors;
    const incomePerHourProportional = incomePerFloor * floorsPerHour * floorFraction;

    return {
      ...vein,
      spawnProb,
      veinsPerFloor: expectedVeinsPerFloor,
      incomePerFloor,
      incomePerHour: incomePerHourFullTime,
      incomePerHourProportional,
      numFloors: numFloorsForVein,
    };
  });

  // === Totals ===
  // Total if cycling through all floors (proportional)
  const totalIncomePerHour = veinResults.reduce((sum, v) => sum + v.incomePerHourProportional, 0);

  // Build a map of vein name → income/hr (proportional and full-time)
  const incomeByVeinName = {};
  const incomeByVeinNameFullTime = {};
  veinResults.forEach(v => {
    incomeByVeinName[v.name] = v.incomePerHourProportional;
    incomeByVeinNameFullTime[v.name] = v.incomePerHour;
  });

  return {
    veinResults,
    totalIncomePerHour,
    incomeByVeinName,
    incomeByVeinNameFullTime,
    effectiveSpawnRate,
    droneSpawnMulti,
    droneGoldenMulti,
  };
}
