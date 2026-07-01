import { ORES, FLOOR_ORES, normalizeOreName } from '../data/ores.js';
import { STATUES } from '../data/statues.js';
import { VEINS } from '../data/veins.js';
import { calculateVeinIncome } from './veinCalculator.js';
import { DroneEngine } from './DroneEngine.js';
import { FloorMultiplierCalculator } from './FloorMultiplierCalculator.js';
import { BombCalculator } from './BombCalculator.js';
import { BarCraftCalculator } from './BarCraftCalculator.js';

/**
 * Plat Optimizer Calculator Engine (OOP Refactored).
 * Calculates optimal floors, hourly rates, and times to platinize all 9 statues.
 */
export function calculatePlatTime(globalStats, veinConfig, platStats, runSims = true) {
  // --- 1. Basic Speed and Offline Multipliers ---
  const gameSpeed = platStats.gameSpeedOverride ? (platStats.gameSpeed || 1.0) : (globalStats.gameSpeed || 1.0);
  const offlineMult = globalStats.offlineMode ? 0.85 : 1.0;
  
  // Floors per hour from global calculation
  const floorsPerHour = 48 * gameSpeed * 60 * offlineMult;

  // --- 2. Instantiate OOP Calculators & Engines ---
  const droneEngine = new DroneEngine({
    voidDroneEquipped: !!platStats.voidDroneEquipped,
    voidDroneLevel: platStats.voidDroneLevel || 0,
    voidDroneGrade: platStats.voidDroneGrade !== undefined ? platStats.voidDroneGrade : 15,
    voidPortalChance: platStats.voidPortalChance,
    goldenVoidPortalChance: platStats.goldenVoidPortalChance || 0,
    rainbowVoidPortalChance: platStats.rainbowVoidPortalChance || 0,
    baseVoidPortalMulti: platStats.baseVoidPortalMulti || 1.0,
    goldenVoidMulti: platStats.goldenVoidMulti || 1.0,
    rainbowVoidMulti: platStats.rainbowVoidMulti || 1.0,

    chainDroneEquipped: !!platStats.chainDroneEquipped,
    chainDroneGrade: platStats.chainDroneGrade || 0,

    veinDroneFueled: !!veinConfig.veinDroneFueled,
    veinDroneLevel: veinConfig.veinDroneLevel || 0,
    veinDroneGrade: veinConfig.veinDroneGrade || 0
  });

  const floorCalc = new FloorMultiplierCalculator({
    goldenFloorChance: platStats.goldenFloorChance || 0,
    rainbowFloorChance: platStats.rainbowFloorChance || 0,
    galacticFloorChance: platStats.galacticFloorChance || 0,
    prismaticFloorChance: platStats.prismaticFloorChance || 0,
    goldenFloorMulti: platStats.goldenFloorMulti || 1.0,
    rainbowFloorMulti: platStats.rainbowFloorMulti || 1.0,
    galacticFloorMulti: platStats.galacticFloorMulti || 1.0,
    prismaticFloorMulti: platStats.prismaticFloorMulti || 1.0,
    chainDroneMulti: droneEngine.getChainDroneMulti()
  });

  const bombCalc = new BombCalculator({
    bopMulti: platStats.bopMulti || 1.0,
    transmuterMulti: platStats.transmuterMulti || 1.0,
    transmuterBopMarkChance: platStats.transmuterBopMarkChance || 0,
    goldenOreChance: platStats.goldenOreChance || 0,
    bopGoldOreChance: platStats.bopGoldOreChance || 0,
    goldenOreMulti: platStats.goldenOreMulti || 1.0,
    tripleOreChance: platStats.tripleOreChance || 0,
    oreIncomeMulti: platStats.oreIncomeMulti || 1.0,
    oreCardMulti: platStats.oreCardMulti !== undefined ? platStats.oreCardMulti : 2.0
  });

  const barCalc = new BarCraftCalculator({
    barOutputMulti: platStats.barOutputMulti || 1.0,
    freeCraftChance: platStats.freeCraftChance || 0,
    doubleCraftChance: platStats.doubleCraftChance || 0,
    tripleCraftChance: platStats.tripleCraftChance || 0,
    craft5xChance: platStats.craft5xChance || 0,
    craft10xChance: platStats.craft10xChance || 0,
    craft20xChance: platStats.craft20xChance || 0,
    craft100xChance: platStats.craft100xChance || 0,
    barCraftCost: platStats.barCraftCost || 1.0,
    barCardMulti: platStats.barCardMulti !== undefined ? platStats.barCardMulti : 2.0
  });

  // --- 3. Delegate Vein Calculation to veinCalculator ---
  const veinStats = calculateVeinIncome({
    veinSpawnRateMulti: veinConfig.veinSpawnRateMulti || 1.0,
    veinIncomeMulti: veinConfig.veinIncomeMulti || 1.0,
    goldenVeinChance: veinConfig.goldenVeinChance || 0,
    goldenVeinMulti: veinConfig.goldenVeinMulti || 1.0,
    rainbowVeinChance: veinConfig.rainbowVeinChance || 0,
    rainbowVeinMulti: veinConfig.rainbowVeinMulti || 1.0,
    gleamingVeinChance: veinConfig.gleamingVeinChance || 0,
    gleamingVeinMulti: veinConfig.gleamingVeinMulti || 1.0,
    veinResearch2x: !!veinConfig.veinResearch2x,
    oresPerFloor: veinConfig.oresPerFloor || 12,
    veinDroneFueled: droneEngine.isVeinDroneFueled(),
    veinDroneLevel: veinConfig.veinDroneLevel || 0,
    veinDroneGrade: veinConfig.veinDroneGrade || 0,
    veinmorpherBomb: false,
    floorsPerHour: floorsPerHour,
    cardMultiplier: globalStats.cardMultiplier || 1.0,
    contractLevels: { veinIncomeMultiplier: globalStats.contractLevel || 0 },
    offlineMode: false
  });

  // --- 4. Expected Ore Yield Map & Vein Yield for all floors ---
  const floorYields = [];
  const oresPerFloor = veinConfig.oresPerFloor || 12;

  const expectedFloorMulti = floorCalc.getExpectedFloorMulti();
  const voidDroneEquipped = droneEngine.isVoidDroneEquipped();
  const pVoidPortal = droneEngine.getVoidPortalChance();
  const expectedPortalMulti = droneEngine.getExpectedPortalMulti();
  const oreMultiplierChain = bombCalc.getOreMultiplierChain(expectedFloorMulti);

  // Helper to get vein info on a floor
  function getVeinInfo(floorNum) {
    const vein = VEINS.find(v => floorNum >= v.floors[0] && floorNum <= v.floors[1]);
    return vein || { name: "Unknown Vein", rarity: 50 };
  }

  for (let f = 1; f <= 60; f++) {
    const floorInfo = FLOOR_ORES.find(fo => fo.floor === f);
    if (!floorInfo) continue;

    const primaryName = normalizeOreName(floorInfo.primary);
    const secondaryName = normalizeOreName(floorInfo.secondary);

    const primaryIdx = ORES.findIndex(o => o.name === primaryName) + 1; // 1-based index
    const secondaryIdx = ORES.findIndex(o => o.name === secondaryName) + 1;

    // Vein yield calculation delegated to veinCalculator
    const veinInfo = getVeinInfo(f);
    const baseVeinsPerHour = veinStats.incomeByVeinNameFullTime[veinInfo.name] || 0;
    const veinDronePortalMulti = voidDroneEquipped ? expectedPortalMulti : 1.0;
    const veinsPerHour = baseVeinsPerHour * veinDronePortalMulti;

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

      // Multiply by all general multipliers
      // Bomb of Plenty clears the whole floor and benefits from Triple Ore Chance
      const oresPerHour = floorsPerHour * oresPerFloor * expectedSpawnsPerNode * oreMultiplierChain;
      const barsPerHour = barCalc.getBarsPerHour(oresPerHour, oreObj.craftCostBase);

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

  // --- 5. Optimization Simulation ---
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

  // --- 6. Simulations for Incremental Gains ---
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
      { key: "gameSpeed", nameKey: "Game Speed", addition: platStats.simIncr_gameSpeed !== undefined ? platStats.simIncr_gameSpeed : 0.05, suffix: "x" },
      { key: "rainbowFloorMulti", nameKey: "Rainbow Floor Multi", addition: platStats.simIncr_rainbowFloorMulti !== undefined ? platStats.simIncr_rainbowFloorMulti : 1.0, suffix: "x" }
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
