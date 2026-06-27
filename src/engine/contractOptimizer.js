import { getContractCost, CONTRACTS } from "../data/contracts.js";
import { calculateStats } from "./calculator.js";
import { calculateVeinIncome } from "./veinCalculator.js";

/**
 * Calculates the expected Contract Points per contract completed.
 */
export function calculateExpectedCPPerContract({
  cpRewarded,
  doubleChance,
  tripleChance,
  fivexChance,
  tenxChance
}) {
  const baseReward = 10 + (cpRewarded || 0);
  
  // Independent rolls:
  // Expected value of double is (1 + doubleChance)
  // Expected value of triple is (1 + 2 * tripleChance)
  // Expected value of 5x is (1 + 4 * fivexChance)
  // Expected value of 10x is (1 + 9 * tenxChance)
  const p2 = (doubleChance || 0) / 100;
  const p3 = (tripleChance || 0) / 100;
  const p5 = (fivexChance || 0) / 100;
  const p10 = (tenxChance || 0) / 100;
  
  const expectedMultiplier = (1 + p2) * (1 + 2 * p3) * (1 + 4 * p5) * (1 + 9 * p10);
  return baseReward * expectedMultiplier;
}

/**
 * Helper to compute vein income with current config and contract levels.
 */
function getVeinIncomeForOptimizer({ veinConfig, stats, cLevels, globalStats = {} }) {
  if (!veinConfig || Object.keys(veinConfig).length === 0) return 0;
  
  const contractVeinIncomeLevel = cLevels.veinIncomeMultiplier || 0;
  const contractVeinIncomeMult = 1 + contractVeinIncomeLevel * 0.04;
  
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
    contractLevels: cLevels,
    elixirDroneUptimeVeinSpawn: stats.elixirDroneUptimes?.veinspawn || 0,
    elixirDroneUptimeOre: stats.elixirDroneUptimes?.ore || 0,
    offlineMode: globalStats.offlineMode
  });
  return vStats.totalIncomePerHour;
}

/**
 * Optimizes contract points distribution using a greedy search.
 */
export function optimizeContracts({
  totalCP,
  starLevels,
  starUnlocked,
  upgradeLevels,
  globalStats,
  veinConfig,
  costReduction, // Cancer star or other reduction (as percentage, e.g. 15 for 15% reduction)
  capIncrease,   // flat cap increase
  ssWeight,
  veinWeight,
  fromScratch = true,
  currentContractLevels = {}
}) {
  const reductionFactor = 1 - (costReduction || 0) / 100;
  
  // 1. Initialize levels
  const cLevels = {};
  CONTRACTS.forEach(c => {
    cLevels[c.id] = fromScratch ? 0 : (currentContractLevels[c.id] || 0);
  });

  // Calculate baseline yields (pre-contract or at start levels)
  const baseStats = calculateStats({ starLevels, starUnlocked, upgradeLevels, globalStats, contractLevels: cLevels });
  const baseSSYield = baseStats.superStarYieldPerHour || 1.0;
  const baseVeinYield = getVeinIncomeForOptimizer({ veinConfig, stats: baseStats, cLevels, globalStats }) || 1.0;

  const getScore = (levels) => {
    const stats = calculateStats({ starLevels, starUnlocked, upgradeLevels, globalStats, contractLevels: levels });
    const veinYield = getVeinIncomeForOptimizer({ veinConfig, stats, cLevels: levels, globalStats });
    
    const ssGain = stats.superStarYieldPerHour / baseSSYield;
    const veinGain = veinYield / baseVeinYield;
    
    return ssGain * (ssWeight / 100) + veinGain * (veinWeight / 100);
  };

  let remainingCP = totalCP;
  let spentCP = 0;
  
  const upgradePath = [];
  
  // Yield-boosting contracts list + bombRechargeRate
  const YIELD_BOOSTING_CONTRACTS = [
    'veinIncomeMultiplier',
    'goldenFloorMultiplier',
    'goldenVeinChance',
    'superStarSpawnRate',
    'baseGameSpeed',
    'rainbowFloorMulti',
    'supernovaChance',
    'bombRechargeRate'
  ];

  const getContractMaxAllowed = (contract) => {
    const isYieldBooster = YIELD_BOOSTING_CONTRACTS.includes(contract.id);
    if (isYieldBooster) {
      return contract.maxLevel + (capIncrease || 0);
    }
    
    // Check if there is any yield booster downstream in the entire contract list
    const idx = CONTRACTS.findIndex(c => c.id === contract.id);
    const hasDownstreamYieldBooster = CONTRACTS.slice(idx + 1).some(c => YIELD_BOOSTING_CONTRACTS.includes(c.id));
    
    return hasDownstreamYieldBooster ? 1 : 0;
  };

  while (remainingCP > 0) {
    let bestChoice = null;
    let bestEfficiency = -1;
    let bestCost = 0;

    // Evaluate all contracts
    for (let i = 0; i < CONTRACTS.length; i++) {
      const contract = CONTRACTS[i];
      const currentLvl = cLevels[contract.id];
      const maxLvl = getContractMaxAllowed(contract);

      if (currentLvl >= maxLvl) continue;

      // Sequential lock check across the entire continuous list
      let isLocked = false;
      const idx = CONTRACTS.findIndex(c => c.id === contract.id);
      if (idx > 0) {
        const prev = CONTRACTS[idx - 1];
        if (cLevels[prev.id] < 1) {
          isLocked = true;
        }
      }

      if (isLocked) continue;

      // Simulate upgrade cost
      const rawCost = getContractCost(contract.id, currentLvl + 1);
      const cost = Math.max(1, Math.round(rawCost * reductionFactor));

      if (cost > remainingCP) continue;

      // Calculate score delta
      const tempLevels = { ...cLevels, [contract.id]: currentLvl + 1 };
      const newScore = getScore(tempLevels);
      const scoreDelta = newScore - getScore(cLevels);
      
      // If a contract is level 0 and we are allowed to upgrade it, we prioritize unlocking it
      // so the optimizer can "see" the downstream contracts.
      let efficiency;
      if (currentLvl === 0) {
        efficiency = 1e9 / cost; // Massive priority to unlock
      } else {
        efficiency = (scoreDelta + 1e-9) / cost;
      }

      if (efficiency > bestEfficiency || (efficiency === bestEfficiency && cost < bestCost)) {
        bestChoice = contract;
        bestEfficiency = efficiency;
        bestCost = cost;
      }
    }

    // If we can't afford anything or no valid choices, break
    if (!bestChoice) break;

    // Apply the upgrade
    cLevels[bestChoice.id]++;
    remainingCP -= bestCost;
    spentCP += bestCost;

    upgradePath.push({
      contractId: bestChoice.id,
      name: bestChoice.name,
      world: bestChoice.world,
      fromLevel: cLevels[bestChoice.id] - 1,
      toLevel: cLevels[bestChoice.id],
      cost: bestCost,
      remainingCP
    });
  }

  // Calculate final gains
  const finalStats = calculateStats({ starLevels, starUnlocked, upgradeLevels, globalStats, contractLevels: cLevels });
  const finalSSYield = finalStats.superStarYieldPerHour;
  const finalVeinYield = getVeinIncomeForOptimizer({ veinConfig, stats: finalStats, cLevels, globalStats });

  return {
    recommendedLevels: cLevels,
    upgradePath,
    spentCP,
    remainingCP,
    finalSSYield,
    finalVeinYield,
    baseSSYield,
    baseVeinYield
  };
}
