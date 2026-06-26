/**
 * Calculations for Idle Obelisk Miner Stargazing Optimizer.
 * 
 * Computes all cumulative perks, upgrade levels, and final star yield rates.
 */
import { getStarCost } from "../data/starCosts.js";
import { getUpgradeCost, getUpgradeVein } from "../data/upgradeCosts.js";
import { getContractCost, CONTRACTS } from "../data/contracts.js";
import { calculateVeinIncome } from "./veinCalculator.js";

export function calculateStats({ starLevels, starUnlocked, upgradeLevels, globalStats, contractLevels = {} }) {
  // 1. Helper to get levels safely
  const getStarLvl = (id) => starLevels[id] || 0;
  const getUpgradeLvl = (id) => upgradeLevels[id] || 0;
  const getContractLvl = (id) => contractLevels[id] || 0;

  // 2. Telescope Unlock Logic (check which stars are unlocked based on telescope and checklist)
  const enabledStarsList = Object.keys(starUnlocked).filter(id => starUnlocked[id]);
  const numEnabledStars = enabledStarsList.length;

  // 3. Speed & Floor Calculations
  const baseGameSpeed = globalStats.gameSpeed || 1.0;
  const contractGameSpeedLevel = getContractLvl("baseGameSpeed");
  const contractGameSpeedMult = 1 + contractGameSpeedLevel * 0.01;
  const gameSpeed = baseGameSpeed * contractGameSpeedMult;
  
  const cardMultiplier = globalStats.cardMultiplier || 1.0;
  const manualCatchRate = globalStats.manualCatchRate !== undefined ? globalStats.manualCatchRate : 1.0;
  
  const baseFloorsPerMinute = 48;
  const floorsPerMinute = baseFloorsPerMinute * gameSpeed;
  const floorsPerHour = floorsPerMinute * 60;

  // 4. Star Spawn Rates & Drone / Relic Modifiers
  const starSpawnRatePerk = getStarLvl("gemini") * 0.02;
  const starSpawnRateUpgrade = getUpgradeLvl("starSpawnRate") * 0.05;
  const stargazingStarSpawnMult = 1 + starSpawnRatePerk + starSpawnRateUpgrade;
  
  const droneFueled = !!globalStats.droneFueled;
  const droneGrade = globalStats.droneGrade || 0;
  const droneSpawnMult = droneFueled ? (1 + 0.15 + droneGrade * 0.03) : 1.0;
  
  const relicLevel = globalStats.relicLevel || 0;
  const relicSpawnMult = 1 + relicLevel * 0.001;

  const starSpawnBuff2x = !!globalStats.starSpawnBuff2x;
  const starSpawnBuffMult = starSpawnBuff2x ? 2.0 : 1.0;

  const starSpawnRateMult = stargazingStarSpawnMult * droneSpawnMult * relicSpawnMult * starSpawnBuffMult;
  const starSpawnChance = 0.02 * starSpawnRateMult;

  // Super Star Spawn Rates & Contract Modifiers
  const superStarSpawnRatePerk = getStarLvl("virgo") * 0.01;
  const superStarSpawnRateUpgrade = getUpgradeLvl("superStarSpawnRate") * 0.02;
  const stargazingSuperStarSpawnMult = 1 + superStarSpawnRatePerk + superStarSpawnRateUpgrade;

  // Use superStarSpawnRate contract level if available, otherwise fallback to old globalStats.contractLevel
  const contractLevel = contractLevels.superStarSpawnRate !== undefined 
    ? getContractLvl("superStarSpawnRate") 
    : (globalStats.contractLevel || 0);
  const contractSuperStarMult = 1 + contractLevel * 0.03;
  
  const superStarSpawnBuff3x = !!globalStats.superStarSpawnBuff3x;
  const superStarSpawnBuffMult = superStarSpawnBuff3x ? 3.0 : 1.0;

  const superStarSpawnRateMult = stargazingSuperStarSpawnMult * contractSuperStarMult * superStarSpawnBuffMult;
  
  const primalMeatActive = !!globalStats.primalMeatActive;
  const athenaIdolLevel = globalStats.athenaIdolLevel || 0;
  const primalMeatAddend = primalMeatActive ? athenaIdolLevel * 0.0005 : 0.0;
  
  const superStarRollChance = 0.01 * superStarSpawnRateMult + primalMeatAddend;
  const superStarSpawnChance = starSpawnChance * superStarRollChance;

  // 5. Catch Rate
  const autoCatchPerk = getStarLvl("taurus") * 0.02;
  const autoCatchUpgrade = getUpgradeLvl("autoCatchStars") * 0.04;
  const totalAutoCatchChance = Math.min(1.0, autoCatchPerk + autoCatchUpgrade);
  const totalCatchRate = droneFueled ? 1.0 : (totalAutoCatchChance + (1.0 - totalAutoCatchChance) * manualCatchRate);

  // 6. Expected Multi-Spawns
  const doubleStarChance = getUpgradeLvl("doubleStarChance") * 0.05;
  const droneLevelActive = !!globalStats.droneLevelActive;
  const droneLevel = globalStats.droneLevel || 0;
  const droneTripleChanceAddend = droneLevelActive ? (0.06 + droneLevel * 0.01) : 0.0;
  
  const tripleStarChance = (getStarLvl("sagittarius") * 0.01) + droneTripleChanceAddend;
  const expectedRegularStarsPerSpawn = 1 + (doubleStarChance * 1) + (tripleStarChance * 2);

  // Super Stars: Triple and 10x
  const tripleSuperStarChance = getStarLvl("leo") * 0.04;
  const superStar10xChance = getUpgradeLvl("superStar10xChance") * 0.005;
  const expectedSuperStarsPerSpawn = 1 + (tripleSuperStarChance * 2) + (superStar10xChance * 9);

  // 7. Multiplier Scaling
  const novagiantComboMultiplier = globalStats.novagiantComboMultiplier || 1.0;
  
  // Custom modifiers
  const starSNMod = globalStats.starSupernovaMultiplier || 0.0;
  const superSNMod = globalStats.superStarSupernovaMultiplier || 0.0;
  const starSGMod = globalStats.starSupergiantMultiplier || 0.0;
  const superSGMod = globalStats.superStarSupergiantMultiplier || 0.0;
  const starRMod = globalStats.starRadiantMultiplier || 0.0;
  const superRMod = globalStats.superStarRadiantMultiplier || 0.0;

  // Expected Multipliers for Regular Stars
  const ctrlFUnlocked = !!globalStats.ctrlFUnlocked;
  const ctrlFMult = ctrlFUnlocked ? 1.20 : 1.0;
  
  const starSNChance = getUpgradeLvl("starSupernovaChance") * 0.005 + getStarLvl("hercules") * 0.0015;
  const starSNMulti = 10 * (1 + starSNMod) * ctrlFMult;

  const starSGChance = getUpgradeLvl("starSupergiantChance") * 0.002;
  const starSGMulti = 3 * (1 + starSGMod);

  const starRChance = globalStats.starRadiantChance || 0.0;
  const starRMulti = 10 * (1 + starRMod);

  const expectedSN_SG_Star = 
    (1 - starSNChance) * (1 - starSGChance) * 1 +
    starSNChance * (1 - starSGChance) * starSNMulti +
    (1 - starSNChance) * starSGChance * starSGMulti +
    starSNChance * starSGChance * starSNMulti * starSGMulti * novagiantComboMultiplier;
  
  const expectedTotalStarMulti = expectedSN_SG_Star * (1 - starRChance + starRChance * starRMulti);

  // Expected Multipliers for Super Stars (Supernova chance contract increases chance additively)
  const contractSupernovaLvl = getContractLvl("supernovaChance");
  const superSNChance = (globalStats.superStarSupernovaChance || 0.0) + (contractSupernovaLvl * 0.0015);
  const superSNMulti = 10 * (1 + superSNMod) * ctrlFMult;

  const superSGChance = getUpgradeLvl("superStarSupergiantChance") * 0.0015;
  const superSGMulti = 3 * (1 + superSGMod);

  const superRChance = getUpgradeLvl("superStarRadiantChance") * 0.0015;
  const superRMulti = 10 * (1 + superRMod);

  const expectedSN_SG_Super = 
    (1 - superSNChance) * (1 - superSGChance) * 1 +
    superSNChance * (1 - superSGChance) * superSNMulti +
    (1 - superSNChance) * superSGChance * superSGMulti +
    superSNChance * superSGChance * superSNMulti * superSGMulti * novagiantComboMultiplier;

  const expectedTotalSuperMulti = expectedSN_SG_Super * (1 - superRChance + superRChance * superRMulti);

  // 8. Global Income Multipliers
  const allStarMultiPerk = getStarLvl("scorpio") * 0.005;
  const allStarMultiUpgrade = getUpgradeLvl("allStarMultiplier") * 0.01;
  const totalAllStarMulti = 1 + allStarMultiPerk + allStarMultiUpgrade;

  // 9. Final Hourly Yields
  const baseRegularYield = floorsPerHour * starSpawnChance * expectedRegularStarsPerSpawn * expectedTotalStarMulti * totalCatchRate * totalAllStarMulti * cardMultiplier;
  const baseSuperYield = floorsPerHour * superStarSpawnChance * expectedSuperStarsPerSpawn * expectedTotalSuperMulti * totalCatchRate * totalAllStarMulti * cardMultiplier;

  const regularStarYieldPerHour = baseRegularYield;
  const superStarYieldPerHour = baseSuperYield;

  const yieldPerStarType = regularStarYieldPerHour;

  // 10. Secondary Perks Display Data
  const activeOtherPerks = {
    veinSpawnRate: getStarLvl("aries") * 3,
    goldenVeinChance: getStarLvl("aries") * 1 + getContractLvl("goldenVeinChance") * 1,
    pickaxeDamage: getStarLvl("taurus") * 12 + getStarLvl("scorpio") * 15 + getContractLvl("pickaxeDamage") * 15 + getContractLvl("pickaxeDamagePerContract") * 1,
    goldenFloorMulti: (1 + getStarLvl("gemini") * 0.02) * (1 + getContractLvl("goldenFloorMultiplier") * 0.03),
    doubleContractPointChance: getStarLvl("cancer") * 1,
    contractUpgradeCost: getStarLvl("cancer") * -1,
    workshopCap: getStarLvl("leo") * 1,
    bombRechargeRate: getStarLvl("virgo") * 1 + getContractLvl("bombRechargeRate") * 3,
    prestigePointsGain: getStarLvl("libra") * 5 + getContractLvl("prestigePointGain") * 10,
    tripleLootbugChance: getStarLvl("libra") * 1,
    lootbugSpawnRate: getStarLvl("sagittarius") * 2,
    experienceGain: getStarLvl("capricorn") * 15 + getContractLvl("expGain") * 10,
    itemDuration: getStarLvl("capricorn") * 1,
    barCraftCosts: getStarLvl("aquarius") * -1,
    goldenLootbugChance: getStarLvl("aquarius") * 1,
    petLevelCap: getStarLvl("pisces") * 1,
    rainbowFloorMulti: (getStarLvl("pisces") * 10) * (1 + getContractLvl("rainbowFloorMulti") * 0.02),
    bankedFreebieCap: getStarLvl("ophiuchus") * 1,
    bankedLootbugCap: getStarLvl("ophiuchus") * 1,
    craft100xChance: getStarLvl("orion") * 0.10,
    goldenOreChance: getStarLvl("orion") * 0.25,
    goldenOreMulti: getStarLvl("hercules") * 8,
    galacticRainbowChance: getStarLvl("draco") * 0.25,
    galacticRainbowMulti: getStarLvl("draco") * 10,
    polychromeOreCardMulti: getStarLvl("cetus") * 0.15,
    fishIncomeMulti: getStarLvl("cetus") * 2,
    cardGradeCaps: getStarLvl("phoenix") * 1,
    allFloorMulti: getStarLvl("eridanus") * 2,
    stonksMulti: getStarLvl("eridanus") * 2,
    superStonksChance: getStarLvl("eridanus") * 0.10,

    tripleCraftChance: getContractLvl("tripleCraftChance") * 1,
    pickaxeSuperCritChance: getContractLvl("pickaxeSuperCritChance") * 2,
    pickaxeCritDamage: getContractLvl("pickaxeCritDamage") * 10,
    upgradeBarCost: getContractLvl("upgradeBarCost") * -5,
    x10CraftChance: getContractLvl("x10CraftChance") * 1,
    bombDamagePerContract: getContractLvl("bombDamagePerContract") * 1,
    oreSellPrice: getContractLvl("oreSellPrice") * 15,
    veinIncomeMultiplier: getContractLvl("veinIncomeMultiplier") * 4,
    ultraCritChance: getContractLvl("ultraCritChance") * 1,
  };

  return {
    gameSpeed,
    floorsPerHour,
    starSpawnRateMult,
    superStarSpawnRateMult,
    starSpawnChance,
    superStarSpawnChance,
    totalAutoCatchChance,
    totalCatchRate,
    expectedRegularStarsPerSpawn,
    expectedSuperStarsPerSpawn,
    starSNChance,
    starSGChance,
    superSGChance,
    superRChance,
    expectedTotalStarMulti,
    expectedTotalSuperMulti,
    totalAllStarMulti,
    regularStarYieldPerHour,
    superStarYieldPerHour,
    yieldPerStarType,
    numEnabledStars,
    activeOtherPerks
  };
}

export function getRecommendations({ 
  starLevels, 
  starUnlocked, 
  upgradeLevels, 
  globalStats, 
  contractLevels = {}, 
  veinConfig = {}, 
  stars, 
  upgrades,
  contracts = CONTRACTS 
}) {
  const current = calculateStats({ starLevels, starUnlocked, upgradeLevels, globalStats, contractLevels });
  const currentReg = current.regularStarYieldPerHour;
  const currentSuper = current.superStarYieldPerHour;
  const currentTotal = currentReg + currentSuper;

  // Helper to compute vein income using current config and computed stats
  const getVeinIncome = (stats, cLevels) => {
    if (!veinConfig || Object.keys(veinConfig).length === 0) return 0;
    
    // W2 veinIncomeMultiplier
    const contractVeinIncomeLevel = cLevels.veinIncomeMultiplier || 0;
    const contractVeinIncomeMult = 1 + contractVeinIncomeLevel * 0.04;
    
    // W2 goldenVeinChance
    const contractGoldenVeinLevel = cLevels.goldenVeinChance || 0;
    const contractGoldenVeinAdd = contractGoldenVeinLevel * 0.01;
    
    const baseVeinIncomeMulti = veinConfig.veinIncomeMulti || 1.0;
    const effectiveVeinIncomeMulti = baseVeinIncomeMulti * contractVeinIncomeMult;
    
    const baseGoldenChance = veinConfig.goldenVeinChance || 0;
    const effectiveGoldenChance = Math.min(1.0, baseGoldenChance + contractGoldenVeinAdd);

    const vStats = calculateVeinIncome({
      ...veinConfig,
      veinIncomeMulti: effectiveVeinIncomeMulti,
      goldenVeinChance: effectiveGoldenChance,
      floorsPerHour: stats.floorsPerHour,
      cardMultiplier: veinConfig.veinCardMultiplier || 1.0,
    });
    return vStats.totalIncomePerHour;
  };

  const currentVein = getVeinIncome(current, contractLevels);

  const starRecs = [];
  const upgradeRecs = [];
  const contractRecs = [];

  // Helper to compute time to upgrade using current effective yield (regular stars only)
  const computeTime = (cost, yieldPerHour) => {
    if (yieldPerHour <= 0) return "N/A";
    const hours = cost / yieldPerHour;
    const minutes = Math.ceil(hours * 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} h ${m} m`;
  };

  // Simulate Star upgrades (+1 level)
  stars.forEach(star => {
    const currentLvl = starLevels[star.id] || 0;
    const maxLvl = star.maxLevel + (globalStats.starUpgradeCapBonus || 0);
    if (currentLvl < maxLvl) {
      const tempLevels = { ...starLevels, [star.id]: currentLvl + 1 };
      const simulated = calculateStats({ starLevels: tempLevels, starUnlocked, upgradeLevels, globalStats, contractLevels });
      const deltaReg = simulated.regularStarYieldPerHour - currentReg;
      const deltaSuper = simulated.superStarYieldPerHour - currentSuper;
      const deltaTotal = (simulated.regularStarYieldPerHour + simulated.superStarYieldPerHour) - currentTotal;
      const cost = getStarCost(star.id, currentLvl + 1);
      const timeToUpgrade = computeTime(cost, currentReg);
      starRecs.push({
        id: star.id,
        name: star.name,
        currentLevel: currentLvl,
        nextLevel: currentLvl + 1,
        deltaReg,
        deltaSuper,
        deltaTotal,
        unlocked: !!starUnlocked[star.id],
        cost,
        timeToUpgrade
      });
    }
  });

  // Simulate Upgrade upgrades (+1 level)
  upgrades.forEach(upgrade => {
    const telescopeLvl = upgradeLevels.upgradeTelescope || 0;
    const isLocked = upgrade.telescopeReq !== null && telescopeLvl < upgrade.telescopeReq;

    const currentLvl = upgradeLevels[upgrade.id] || 0;
    const capperUpperLvl = upgradeLevels.capperUpper || 0;
    const maxLvl = upgrade.affectedByCapperUpper 
      ? upgrade.maxLevel + (capperUpperLvl * 5) 
      : upgrade.maxLevel;

    if (!isLocked && currentLvl < maxLvl) {
      const tempUpgrades = { ...upgradeLevels, [upgrade.id]: currentLvl + 1 };
      const simulated = calculateStats({ starLevels, starUnlocked, upgradeLevels: tempUpgrades, globalStats, contractLevels });
      const deltaReg = simulated.regularStarYieldPerHour - currentReg;
      const deltaSuper = simulated.superStarYieldPerHour - currentSuper;
      const deltaTotal = (simulated.regularStarYieldPerHour + simulated.superStarYieldPerHour) - currentTotal;
      const cost = getUpgradeCost(upgrade.id, currentLvl + 1);
      const veinType = getUpgradeVein(upgrade.id, currentLvl + 1);
      const timeToUpgrade = computeTime(cost, currentReg);
      upgradeRecs.push({
        id: upgrade.id,
        name: upgrade.name,
        currentLevel: currentLvl,
        nextLevel: currentLvl + 1,
        deltaReg,
        deltaSuper,
        deltaTotal,
        cost,
        vein: veinType,
        timeToUpgrade
      });
    }
  });

  // Simulate Contract upgrades (+1 level)
  const contractUpgradeCapIncrease = globalStats.contractUpgradeCapIncrease || 0;
  contracts.forEach(contract => {
    const currentLvl = contractLevels[contract.id] || 0;
    const maxLvl = contract.maxLevel + contractUpgradeCapIncrease;
    if (currentLvl < maxLvl) {
      const tempLevels = { ...contractLevels, [contract.id]: currentLvl + 1 };
      const simulated = calculateStats({ starLevels, starUnlocked, upgradeLevels, globalStats, contractLevels: tempLevels });
      const deltaReg = simulated.regularStarYieldPerHour - currentReg;
      const deltaSuper = simulated.superStarYieldPerHour - currentSuper;
      const deltaTotal = (simulated.regularStarYieldPerHour + simulated.superStarYieldPerHour) - currentTotal;
      
      const simulatedVein = getVeinIncome(simulated, tempLevels);
      const deltaVein = simulatedVein - currentVein;
      
      const cost = getContractCost(contract.id, currentLvl + 1);
      contractRecs.push({
        id: contract.id,
        name: contract.name,
        world: contract.world,
        currentLevel: currentLvl,
        nextLevel: currentLvl + 1,
        deltaReg,
        deltaSuper,
        deltaTotal,
        deltaVein,
        cost,
      });
    }
  });

  return {
    starRecs,
    upgradeRecs,
    contractRecs
  };
}
