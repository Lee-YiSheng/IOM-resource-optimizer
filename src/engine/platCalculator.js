import { ORES, FLOOR_ORES, normalizeOreName } from '../data/ores';
import { STATUES } from '../data/statues';
import { VEINS } from '../data/veins';

/**
 * Plat Optimizer Calculator Engine.
 * Calculates optimal floors, hourly rates, and times to platinize all 9 statues.
 */

export function calculatePlatTime(globalStats, veinConfig, platStats, runSims = true) {
  // --- 1. Basic Speed and Offline Multipliers ---
  const gameSpeed = platStats.gameSpeedOverride ? (platStats.gameSpeed || 1.0) : (globalStats.gameSpeed || 1.0);
  const offlineMult = globalStats.offlineMode ? 0.85 : 1.0;
  
  // Floors per hour from global calculation
  const floorsPerHour = 48 * gameSpeed * 60 * (globalStats.offlineMode ? 0.85 : 1.0);

  // --- 2. Ore Yield Multipliers ---
  const oreIncomeMulti = platStats.oreIncomeMulti || 1.0;
  const oreCardMulti = platStats.oreCardMulti !== undefined ? platStats.oreCardMulti : 2.0;
  const barCardMulti = platStats.barCardMulti !== undefined ? platStats.barCardMulti : 2.0;
  const tripleOreChance = platStats.tripleOreChance || 0;
  const expectedTripleOreMulti = 1 + 2 * (Math.min(100, tripleOreChance) / 100);

  // Floor type expected multipliers
  const pGoldenFloor = (platStats.goldenFloorChance || 0) / 100;
  const pRainbowFloor = (platStats.rainbowFloorChance || 0) / 100;
  const pGalacticFloor = (platStats.galacticFloorChance || 0) / 100;
  const pPrismaticFloor = (platStats.prismaticFloorChance || 0) / 100;

  const chainDroneEquipped = !!platStats.chainDroneEquipped;
  const chainDroneGrade = platStats.chainDroneGrade || 0;
  const chainDroneMulti = chainDroneEquipped ? (1.50 + chainDroneGrade * 0.10) : 1.0;
  const mGoldenFloor = (platStats.goldenFloorMulti || 1.0) * chainDroneMulti;
  const mRainbowFloor = platStats.rainbowFloorMulti || 1.0;
  const mGalacticFloor = platStats.galacticFloorMulti || 1.0;
  const mPrismaticFloor = platStats.prismaticFloorMulti || 1.0;

  const prismaticLayer = (1 - pPrismaticFloor) * 1 + pPrismaticFloor * mPrismaticFloor;
  const galacticLayer = (1 - pGalacticFloor) * 1 + pGalacticFloor * mGalacticFloor * prismaticLayer;
  const rainbowLayer = (1 - pRainbowFloor) * 1 + pRainbowFloor * mRainbowFloor * galacticLayer;
  const expectedFloorMulti = (1 - pGoldenFloor) * 1 + pGoldenFloor * mGoldenFloor * rainbowLayer;

  // Golden Ore expected multipliers
  const pGoldenOre = (platStats.goldenOreChance || 0) / 100;
  const pBopGoldOre = (platStats.bopGoldOreChance || 0) / 100;
  const totalGoldenOreChance = Math.min(1.0, pGoldenOre + pBopGoldOre);
  const mGoldenOre = platStats.goldenOreMulti || 1.0;
  const expectedGoldenOreMulti = (1 - totalGoldenOreChance) * 1.0 + totalGoldenOreChance * mGoldenOre;

  // Bomb of Plenty & Transmuter expected multipliers
  const bopMulti = platStats.bopMulti || 1.0;
  const transmuterMulti = platStats.transmuterMulti || 1.0;
  const transmuterBopMarkChance = (platStats.transmuterBopMarkChance || 0) / 100;
  const expectedBombMulti = bopMulti * (transmuterBopMarkChance * transmuterMulti + (1 - transmuterBopMarkChance) * 1.0);

  // --- 3. Void Drone expected portal multiplier ---
  const voidDroneEquipped = !!platStats.voidDroneEquipped;
  
  // Base Void Portal Chance is 10% + 2% per level (0-15)
  const voidDroneLevel = platStats.voidDroneLevel || 0;
  const computedVoidPortalChance = 10 + 2 * voidDroneLevel;
  // If equipped, use manual override or computed chance
  const pVoidPortal = (voidDroneEquipped ? (platStats.voidPortalChance !== undefined ? platStats.voidPortalChance : computedVoidPortalChance) : 0) / 100;

  const pGoldenVoid = (platStats.goldenVoidPortalChance || 0) / 100;
  const pRainbowVoid = (platStats.rainbowVoidPortalChance || 0) / 100;

  const mBaseVoid = platStats.baseVoidPortalMulti || 1.0;
  const voidDroneGrade = platStats.voidDroneGrade !== undefined ? platStats.voidDroneGrade : 15;
  const mVoidDrone = 3.0 + voidDroneGrade * 1.0;
  const mGoldenVoid = platStats.goldenVoidMulti || 1.0;
  const mRainbowVoid = platStats.rainbowVoidMulti || 1.0;

  const vBase = mBaseVoid * mVoidDrone;
  const vGolden = vBase * mGoldenVoid;
  const vRainbow = vGolden * mRainbowVoid;

  const expectedPortalMulti = (1 - pGoldenVoid) * vBase + pGoldenVoid * ((1 - pRainbowVoid) * vGolden + pRainbowVoid * vRainbow);

  // --- 4. Crafting / Bar expected yields ---
  const barOutputMulti = platStats.barOutputMulti || 1.0;
  const freeCraftChance = (platStats.freeCraftChance || 0) / 100;
  const doubleCraftChance = (platStats.doubleCraftChance || 0) / 100;
  const tripleCraftChance = (platStats.tripleCraftChance || 0) / 100;
  const craft5xChance = (platStats.craft5xChance || 0) / 100;
  const craft10xChance = (platStats.craft10xChance || 0) / 100;
  const craft20xChance = (platStats.craft20xChance || 0) / 100;
  const craft100xChance = (platStats.craft100xChance || 0) / 100;
  const barCraftCost = platStats.barCraftCost || 1.0;

  const expectedBarsPerCraft = barOutputMulti *
    (1 + 1 * doubleCraftChance) *
    (1 + 2 * tripleCraftChance) *
    (1 + 4 * craft5xChance) *
    (1 + 9 * craft10xChance) *
    (1 + 19 * craft20xChance) *
    (1 + 99 * craft100xChance);

  // --- 5. Vein Yield Multipliers (From global stats & veinConfig) ---
  const contractVeinIncomeMult = 1 + (globalStats.contractLevel || 0) * 0.04;
  const effectiveVeinIncomeMulti = (veinConfig.veinIncomeMulti || 1.0) * contractVeinIncomeMult;
  const cardMultiplier = globalStats.cardMultiplier || 1.0;
  
  const veinSpawnRateMulti = veinConfig.veinSpawnRateMulti || 1.0;
  const goldenVeinChance = veinConfig.goldenVeinChance || 0;
  const goldenVeinMulti = veinConfig.goldenVeinMulti || 1.0;
  const rainbowVeinChance = veinConfig.rainbowVeinChance || 0;
  const rainbowVeinMulti = veinConfig.rainbowVeinMulti || 1.0;
  const gleamingVeinChance = veinConfig.gleamingVeinChance || 0;
  const gleamingVeinMulti = veinConfig.gleamingVeinMulti || 1.0;

  // Vein Drone effects
  const veinDroneSpawnMulti = veinConfig.veinDroneFueled
    ? (1 + 0.10 + (veinConfig.veinDroneLevel || 0) * 0.02)
    : 1.0;
  const veinDroneGoldenMulti = veinConfig.veinDroneFueled
    ? (1 + 0.50 + (veinConfig.veinDroneGrade || 0) * 0.10)
    : 1.0;
  const researchMulti = veinConfig.veinResearch2x ? 2.0 : 1.0;
  const effectiveVeinSpawnRate = veinSpawnRateMulti * veinDroneSpawnMulti * researchMulti;

  const expectedVeinsPerFloorBase = (rarity, ores) => {
    const spawnProb = Math.min(1, effectiveVeinSpawnRate / (rarity * ores));
    return ores * spawnProb;
  };

  const expectedVeinMultiplier = (() => {
    const effectiveGoldenMulti = goldenVeinMulti * veinDroneGoldenMulti;
    const goldenRainbowLayer = (1 - goldenVeinChance) * 1 + goldenVeinChance * effectiveGoldenMulti * ((1 - rainbowVeinChance) + rainbowVeinChance * rainbowVeinMulti);
    const gleamingLayer = (1 - gleamingVeinChance) * 1 + gleamingVeinChance * gleamingVeinMulti;
    return goldenRainbowLayer * gleamingLayer * effectiveVeinIncomeMulti * cardMultiplier;
  })();

  // --- Helper to get vein info on a floor ---
  function getVeinInfo(floorNum) {
    const vein = VEINS.find(v => floorNum >= v.floors[0] && floorNum <= v.floors[1]);
    return vein || { name: "Unknown Vein", rarity: 50 };
  }

  // --- Expected Ore Yield Map & Vein Yield for all floors ---
  // We precalculate the hourly yield of all ores and veins on each floor 1 to 60.
  const floorYields = [];
  const oresPerFloor = veinConfig.oresPerFloor || 12;

  for (let f = 1; f <= 60; f++) {
    const floorInfo = FLOOR_ORES.find(fo => fo.floor === f);
    if (!floorInfo) continue;

    const primaryName = normalizeOreName(floorInfo.primary);
    const secondaryName = normalizeOreName(floorInfo.secondary);

    const primaryIdx = ORES.findIndex(o => o.name === primaryName) + 1; // 1-based index
    const secondaryIdx = ORES.findIndex(o => o.name === secondaryName) + 1;

    // Vein yield calculation
    const veinInfo = getVeinInfo(f);
    const rawVeinsPerFloor = expectedVeinsPerFloorBase(veinInfo.rarity, oresPerFloor);
    // If Void Drone is equipped, it multiplies vein income by expectedPortalMulti
    const veinDronePortalMulti = voidDroneEquipped ? expectedPortalMulti : 1.0;
    const veinsPerHour = floorsPerHour * rawVeinsPerFloor * expectedVeinMultiplier * veinDronePortalMulti;

    // Calculate yield for all 38 possible required ores
    const oresPerHourMap = {};
    const barsPerHourMap = {};
    for (let oIdx = 1; oIdx <= 38; oIdx++) {
      const oreObj = ORES[oIdx - 1];
      const oreName = oreObj.name;
      let expectedSpawnsPerNode = 0;

      // 1. Primary Spawn
      if (primaryIdx > 0) {
        const pChance = floorInfo.primaryChance;
        if (!voidDroneEquipped) {
          if (oIdx === primaryIdx) expectedSpawnsPerNode += pChance;
        } else {
          // If portaled
          if (oIdx <= primaryIdx) {
            expectedSpawnsPerNode += pChance * pVoidPortal * (1 / primaryIdx) * expectedPortalMulti;
          }
          // If not portaled
          if (oIdx === primaryIdx) {
            expectedSpawnsPerNode += pChance * (1 - pVoidPortal);
          }
        }
      }

      // 2. Secondary Spawn
      if (secondaryIdx > 0) {
        const sChance = floorInfo.secondaryChance;
        if (!voidDroneEquipped) {
          if (oIdx === secondaryIdx) expectedSpawnsPerNode += sChance;
        } else {
          // If portaled
          if (oIdx <= secondaryIdx) {
            expectedSpawnsPerNode += sChance * pVoidPortal * (1 / secondaryIdx) * expectedPortalMulti;
          }
          // If not portaled
          if (oIdx === secondaryIdx) {
            expectedSpawnsPerNode += sChance * (1 - pVoidPortal);
          }
        }
      }

      // Calculate barsPerOre dynamically using oreObj.craftCostBase
      const baseCost = oreObj.craftCostBase;
      const trueCraftCost = Math.max(1, Math.round(baseCost * barCraftCost));
      const effectiveOresPerCraft = trueCraftCost * Math.max(0.001, 1 - freeCraftChance);
      const barsPerOre = expectedBarsPerCraft / effectiveOresPerCraft;

      // Multiply by all general multipliers
      // Bomb of Plenty clears the whole floor and benefits from Triple Ore Chance
      const oresPerHour = floorsPerHour * oresPerFloor * expectedSpawnsPerNode * expectedFloorMulti * expectedGoldenOreMulti * expectedBombMulti * oreIncomeMulti * expectedTripleOreMulti * oreCardMulti;
      const barsPerHour = oresPerHour * barsPerOre * barCardMulti;

       oresPerHourMap[oreName] = oresPerHour;
      barsPerHourMap[oreName] = barsPerHour;
    }

    floorYields.push({
      floor: f,
      veinName: veinInfo.name,
      veinsPerHour,
      oresPerHour: oresPerHourMap,
      barsPerHour: barsPerHourMap
    });
  }

  // --- 6. Optimization Simulation ---
  // Run farming simulation to calculate times and path
  function runSimulation(targetStatues) {
    // Clone requirements
    const remOres = {};
    const remVeins = {};
    
    // Initialize requirements
    ORES.slice(0, 38).forEach(o => { remOres[o.name] = 0; });
    VEINS.forEach(v => { remVeins[v.name] = 0; });

    targetStatues.forEach(s => {
      remVeins[s.veinType] += s.veinAmount;
      Object.entries(s.ores).forEach(([oName, amt]) => {
        const norm = normalizeOreName(oName);
        remOres[norm] = (remOres[norm] || 0) + amt;
      });
    });

    let totalHours = 0;
    const path = [];
    const statueCompletionTimes = Array(9).fill(0);

    // Track original requirements for statue completion detection
    const originalOres = targetStatues.map(s => ({ ...s.ores }));
    const originalVeins = targetStatues.map(s => s.veinAmount);

    let iterations = 0;
    while (true) {
      iterations++;
      if (iterations > 1000) {
        console.warn("Plat Optimizer simulation hit safety limit of 1000 iterations");
        break;
      }

      // Find the highest-index ore that is still needed
      let highestNeededOreIdx = -1;
      for (let oIdx = 38; oIdx >= 1; oIdx--) {
        const oName = ORES[oIdx - 1].name;
        if (remOres[oName] > 0) {
          highestNeededOreIdx = oIdx;
          break;
        }
      }

      // If no ores needed, we are completely finished!
      if (highestNeededOreIdx === -1) {
        break;
      }

      // We have a highest-index ore T that is still needed
      const T_name = ORES[highestNeededOreIdx - 1].name;

      // Find the best floor (<= 60) for T_name.
      // The best floor is the floor where T_name has the highest spawn chance in FLOOR_ORES.
      let bestFloor = 60;
      let highestSpawnChance = 0;
      
      for (let f = 1; f <= 60; f++) {
        const floorInfo = FLOOR_ORES.find(fo => fo.floor === f);
        if (!floorInfo) continue;
        
        let chance = 0;
        if (normalizeOreName(floorInfo.primary) === T_name) {
          chance = floorInfo.primaryChance;
        } else if (normalizeOreName(floorInfo.secondary) === T_name) {
          chance = floorInfo.secondaryChance;
        }

        if (chance > highestSpawnChance) {
          highestSpawnChance = chance;
          bestFloor = f;
        } else if (chance === highestSpawnChance && chance > 0) {
          // Tie-breaker: choose higher floor number
          bestFloor = f;
        }
      }

      const yieldObj = floorYields.find(fy => fy.floor === bestFloor);
      if (!yieldObj || yieldObj.barsPerHour[T_name] <= 0) {
        // Yield is 0, break to avoid infinite loop
        break;
      }

      const hoursNeeded = remOres[T_name] / yieldObj.barsPerHour[T_name];

      // Apply yields to all resources
      for (let oIdx = 1; oIdx <= 38; oIdx++) {
        const oName = ORES[oIdx - 1].name;
        remOres[oName] -= yieldObj.barsPerHour[oName] * hoursNeeded;
        if (remOres[oName] < 1e-3) remOres[oName] = 0;
      }
      
      // Apply to veins
      const currentVeinType = yieldObj.veinName;
      remVeins[currentVeinType] -= yieldObj.veinsPerHour * hoursNeeded;
      if (remVeins[currentVeinType] < 1e-3) remVeins[currentVeinType] = 0;

      // Track how much we farmed
      const oresFarmedMap = {};
      oresFarmedMap[T_name] = yieldObj.barsPerHour[T_name] * hoursNeeded;

      path.push({
        floor: bestFloor,
        veinName: currentVeinType,
        targetResource: T_name,
        hours: hoursNeeded,
        veinsFarmed: yieldObj.veinsPerHour * hoursNeeded,
        oresFarmed: oresFarmedMap
      });

      totalHours += hoursNeeded;
      checkStatueCompletion(targetStatues, remOres, totalHours, statueCompletionTimes);
    }

    // Map statue completion times (fill any unfinished with totalHours)
    for (let i = 0; i < 9; i++) {
      if (statueCompletionTimes[i] === 0) {
        statueCompletionTimes[i] = totalHours;
      }
    }

    return {
      totalHours,
      path,
      statueCompletionTimes
    };
  }

  // Helper to check if a statue is completed and record its time
  function checkStatueCompletion(statuesList, remOres, elapsedHours, completionTimes) {
    statuesList.forEach((s, idx) => {
      if (completionTimes[idx] > 0) return; // Already completed

      // Check all ores
      let oresDone = true;
      for (const [oName, amt] of Object.entries(s.ores)) {
        const norm = normalizeOreName(oName);
        if (remOres[norm] > 0) {
          oresDone = false;
          break;
        }
      }

      if (oresDone) {
        completionTimes[idx] = elapsedHours;
      }
    });
  }

  // Run the base simulation
  const baseResult = runSimulation(STATUES);

  // --- 7. Simulations for Incremental Gains ---
  const simulations = {};

  if (runSims) {
    const statsToSimulate = [
      { key: "rainbowFloorChance", nameKey: "Rainbow Floor Chance", addition: platStats.simIncr_rainbowFloorChance !== undefined ? platStats.simIncr_rainbowFloorChance : 1.0, suffix: "%" },
      { key: "goldenFloorChance", nameKey: "Golden Floor Chance", addition: platStats.simIncr_goldenFloorChance !== undefined ? platStats.simIncr_goldenFloorChance : 1.0, suffix: "%" },
      { key: "goldenFloorMulti", nameKey: "Golden Floor Multi", addition: platStats.simIncr_goldenFloorMulti !== undefined ? platStats.simIncr_goldenFloorMulti : 1.0, suffix: "x" },
      { key: "voidPortalChance", nameKey: "Void Portal Chance", addition: platStats.simIncr_voidPortalChance !== undefined ? platStats.simIncr_voidPortalChance : 1.0, suffix: "%" },
      { key: "goldenVoidPortalChance", nameKey: "Golden Void Portal Chance", addition: platStats.simIncr_goldenVoidPortalChance !== undefined ? platStats.simIncr_goldenVoidPortalChance : 1.0, suffix: "%" },
      { key: "rainbowVoidPortalChance", nameKey: "Rainbow Void Portal Chance", addition: platStats.simIncr_rainbowVoidPortalChance !== undefined ? platStats.simIncr_rainbowVoidPortalChance : 1.0, suffix: "%" },
      { key: "freeCraftChance", nameKey: "Free Craft Chance", addition: platStats.simIncr_freeCraftChance !== undefined ? platStats.simIncr_freeCraftChance : 1.0, suffix: "%" },
      { key: "doubleCraftChance", nameKey: "Double Craft Chance", addition: platStats.simIncr_doubleCraftChance !== undefined ? platStats.simIncr_doubleCraftChance : 1.0, suffix: "%" },
      { key: "tripleCraftChance", nameKey: "Triple Craft Chance", addition: platStats.simIncr_tripleCraftChance !== undefined ? platStats.simIncr_tripleCraftChance : 1.0, suffix: "%" },
      { key: "chainDroneGrade", nameKey: "Chain Drone Grade", addition: platStats.simIncr_chainDroneGrade !== undefined ? platStats.simIncr_chainDroneGrade : 1.0, suffix: " Grade" },
      { key: "voidDroneGrade", nameKey: "Void Drone Grade", addition: platStats.simIncr_voidDroneGrade !== undefined ? platStats.simIncr_voidDroneGrade : 1.0, suffix: " Grade" },
      { key: "gameSpeed", nameKey: "Game Speed", addition: platStats.simIncr_gameSpeed !== undefined ? platStats.simIncr_gameSpeed : 0.05, suffix: "x" }
    ];

    statsToSimulate.forEach(sim => {
      const modPlatStats = { ...platStats };
      if (sim.key === "gameSpeed") {
        modPlatStats.gameSpeedOverride = true;
        modPlatStats.gameSpeed = (platStats.gameSpeedOverride ? (platStats.gameSpeed || 1.0) : (globalStats.gameSpeed || 1.0)) + sim.addition;
      } else {
        modPlatStats[sim.key] = (modPlatStats[sim.key] || 0) + sim.addition;
      }
      
      const simResult = calculatePlatTime(globalStats, veinConfig, modPlatStats, false);
      
      const timeSaved = Math.max(0, baseResult.totalHours - simResult.totalHours);
      const pctGained = baseResult.totalHours > 0 ? (timeSaved / baseResult.totalHours) * 100 : 0;

      simulations[sim.key] = {
        name: `+${sim.addition}${sim.suffix} ${sim.nameKey}`,
        nameKey: sim.nameKey,
        addition: sim.addition,
        suffix: sim.suffix,
        newTotalHours: simResult.totalHours,
        timeSaved,
        pctGained
      };
    });
  }

  return {
    totalHours: baseResult.totalHours,
    path: baseResult.path,
    statueCompletionTimes: baseResult.statueCompletionTimes,
    simulations,
    floorYields
  };
}
