import { useState, useEffect, useMemo } from 'react';
import { STARS } from './data/stars';
import { UPGRADES } from './data/upgrades';
import { CONTRACTS } from './data/contracts';
import { getUpgradeCost, getUpgradeVein } from './data/upgradeCosts';
import { calculateStats, getRecommendations } from './engine/calculator';
import { calculateVeinIncome } from './engine/veinCalculator';
import { StarList } from './components/StarList';
import { UpgradeList } from './components/UpgradeList';
import { ContractList } from './components/ContractList';
import { StatDashboard } from './components/StatDashboard';
import { VeinCalculator } from './components/VeinCalculator';

// Helper to load state from localStorage or use defaults
const getInitialState = (key, defaults) => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return defaults;
    const parsed = JSON.parse(saved);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { ...defaults, ...parsed };
    }
    return parsed;
  } catch {
    return defaults;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('stars');

  // Star Unlock Checklist State (Default first few unlocked to show usage)
  const defaultUnlocks = STARS.reduce((acc, star) => {
    // Let's unlock a few stars initially
    acc[star.id] = ['aries', 'taurus', 'gemini', 'cancer'].includes(star.id);
    return acc;
  }, {});
  const [starUnlocked, setStarUnlocked] = useState(() => 
    getInitialState('iom_star_unlocked', defaultUnlocks)
  );

  // Star Levels State
  const defaultStarLevels = STARS.reduce((acc, star) => {
    acc[star.id] = 0;
    return acc;
  }, {});
  const [starLevels, setStarLevels] = useState(() => 
    getInitialState('iom_star_levels', defaultStarLevels)
  );

  // Upgrades Levels State
  const defaultUpgradeLevels = UPGRADES.reduce((acc, upgrade) => {
    acc[upgrade.id] = 0;
    return acc;
  }, {});
  const [upgradeLevels, setUpgradeLevels] = useState(() => 
    getInitialState('iom_upgrade_levels', defaultUpgradeLevels)
  );

  // Contracts Levels State
  const defaultContractLevels = CONTRACTS.reduce((acc, contract) => {
    acc[contract.id] = 0;
    return acc;
  }, {});
  const [contractLevels, setContractLevels] = useState(() =>
    getInitialState('iom_contract_levels', defaultContractLevels)
  );

  // Recommendation Optimization Target State
  const [optTarget, setOptTarget] = useState('regular');

  // Global Config Stats State
  const defaultGlobalStats = {
    gameSpeed: 1.0,
    cardMultiplier: 1.0,
    manualCatchRate: 1.0,
    starUpgradeCapBonus: 0,
    contractUpgradeCapIncrease: 0,
    starSupernovaMultiplier: 0.0,
    superStarSupernovaMultiplier: 0.0,
    starSupergiantMultiplier: 0.0,
    superStarSupergiantMultiplier: 0.0,
    starRadiantChance: 0.0,
    starRadiantMultiplier: 0.0,
    superStarRadiantMultiplier: 0.0,
    superStarSupernovaChance: 0.0,
    novagiantComboMultiplier: 1.0,
    droneFueled: false,
    droneGrade: 0,
    droneLevelActive: false,
    droneLevel: 0,
    relicLevel: 0,
    starSpawnBuff2x: false,
    superStarSpawnBuff3x: false,
    primalMeatActive: false,
    athenaIdolLevel: 0,
    contractLevel: 0,
    ctrlFUnlocked: false,
  };
  const [globalStats, setGlobalStats] = useState(() => 
    getInitialState('iom_global_stats', defaultGlobalStats)
  );

  // Vein Config State
  const defaultVeinConfig = {
    veinSpawnRateMulti: 1.0,
    veinIncomeMulti: 1.0,
    goldenVeinChance: 0,
    goldenVeinMulti: 1.0,
    rainbowVeinChance: 0,
    rainbowVeinMulti: 1.0,
    gleamingVeinChance: 0,
    gleamingVeinMulti: 1.0,
    veinResearch2x: false,
    oresPerFloor: 10,
    veinDroneFueled: false,
    veinDroneLevel: 0,
    veinDroneGrade: 0,
    veinmorpherBomb: false,
    veinCardMultiplier: 1.5,
  };
  const [veinConfig, setVeinConfig] = useState(() =>
    getInitialState('iom_vein_config', defaultVeinConfig)
  );

  // Tracked Upgrades State
  const defaultTrackedUpgrades = UPGRADES.reduce((acc, upgrade) => {
    acc[upgrade.id] = false;
    return acc;
  }, {});
  const [trackedUpgrades, setTrackedUpgrades] = useState(() => 
    getInitialState('iom_tracked_upgrades', defaultTrackedUpgrades)
  );

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('iom_star_unlocked', JSON.stringify(starUnlocked));
  }, [starUnlocked]);

  useEffect(() => {
    localStorage.setItem('iom_star_levels', JSON.stringify(starLevels));
  }, [starLevels]);

  useEffect(() => {
    localStorage.setItem('iom_upgrade_levels', JSON.stringify(upgradeLevels));
  }, [upgradeLevels]);

  useEffect(() => {
    localStorage.setItem('iom_global_stats', JSON.stringify(globalStats));
  }, [globalStats]);

  useEffect(() => {
    localStorage.setItem('iom_vein_config', JSON.stringify(veinConfig));
  }, [veinConfig]);

  useEffect(() => {
    localStorage.setItem('iom_tracked_upgrades', JSON.stringify(trackedUpgrades));
  }, [trackedUpgrades]);

  useEffect(() => {
    localStorage.setItem('iom_contract_levels', JSON.stringify(contractLevels));
  }, [contractLevels]);

  // Setters
  const handleSetStarLevel = (id, lvl) => {
    const star = STARS.find(s => s.id === id);
    const maxVal = star.maxLevel + globalStats.starUpgradeCapBonus;
    const bounded = Math.max(0, Math.min(maxVal, lvl));
    setStarLevels(prev => ({ ...prev, [id]: bounded }));
  };

  const handleToggleStarUnlock = (id) => {
    setStarUnlocked(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSetUpgradeLevel = (id, lvl) => {
    const upgrade = UPGRADES.find(u => u.id === id);
    const capperUpperLvl = upgradeLevels.capperUpper || 0;
    const maxVal = upgrade.affectedByCapperUpper 
      ? upgrade.maxLevel + (capperUpperLvl * 5) 
      : upgrade.maxLevel;
    const bounded = Math.max(0, Math.min(maxVal, lvl));
    setUpgradeLevels(prev => ({ ...prev, [id]: bounded }));
  };

  const handleToggleTrackUpgrade = (id) => {
    setTrackedUpgrades(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSetGlobalStat = (key, val) => {
    setGlobalStats(prev => ({ ...prev, [key]: val }));
  };

  const handleSetContractLevel = (id, lvl) => {
    const contract = CONTRACTS.find(c => c.id === id);
    if (!contract) return;
    const bounded = Math.max(0, Math.min(contract.maxLevel, lvl));
    setContractLevels(prev => ({ ...prev, [id]: bounded }));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all levels and stats?")) {
      setStarUnlocked(defaultUnlocks);
      setStarLevels(defaultStarLevels);
      setUpgradeLevels(defaultUpgradeLevels);
      setTrackedUpgrades(defaultTrackedUpgrades);
      setGlobalStats(defaultGlobalStats);
      setVeinConfig(defaultVeinConfig);
      setContractLevels(defaultContractLevels);
    }
  };

  const handleExportSetup = () => {
    const exportData = {
      starUnlocked,
      starLevels,
      upgradeLevels,
      trackedUpgrades,
      globalStats,
      veinConfig,
      contractLevels,
      exportedAt: new Date().toISOString(),
      version: "1.2.0"
    };
    
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", "iom_stargazing_optimizer_setup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportSetup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object') {
          alert("Invalid file format. Please upload a valid exported setup JSON.");
          return;
        }

        if (!parsed.starUnlocked && !parsed.starLevels && !parsed.upgradeLevels && !parsed.globalStats) {
          alert("Invalid file structure. This does not appear to be a Stargazing Optimizer setup file.");
          return;
        }

        if (parsed.starUnlocked) {
          setStarUnlocked(prev => ({ ...prev, ...parsed.starUnlocked }));
        }
        if (parsed.starLevels) {
          setStarLevels(prev => ({ ...prev, ...parsed.starLevels }));
        }
        if (parsed.upgradeLevels) {
          setUpgradeLevels(prev => ({ ...prev, ...parsed.upgradeLevels }));
        }
        if (parsed.trackedUpgrades) {
          setTrackedUpgrades(prev => ({ ...prev, ...parsed.trackedUpgrades }));
        }
        if (parsed.globalStats) {
          setGlobalStats(prev => ({ ...prev, ...parsed.globalStats }));
        }
        if (parsed.veinConfig) {
          setVeinConfig(prev => ({ ...prev, ...parsed.veinConfig }));
        }
        if (parsed.contractLevels) {
          setContractLevels(prev => ({ ...prev, ...parsed.contractLevels }));
        }
        
        alert("Setup imported successfully!");
      } catch (err) {
        alert("Failed to parse JSON file: " + err.message);
      }
    };
    
    reader.readAsText(file);
    e.target.value = '';
  };

  // Perform Calculations
  const calculatedStats = calculateStats({
    starLevels,
    starUnlocked,
    upgradeLevels,
    globalStats,
    contractLevels
  });

  const recommendations = getRecommendations({
    starLevels,
    starUnlocked,
    upgradeLevels,
    globalStats,
    contractLevels,
    veinConfig,
    stars: STARS,
    upgrades: UPGRADES,
    contracts: CONTRACTS
  });

  // Vein income calculations (memoized)
  const veinStats = useMemo(() => {
    return calculateVeinIncome({
      ...veinConfig,
      floorsPerHour: calculatedStats.floorsPerHour,
      cardMultiplier: veinConfig.veinCardMultiplier || 1.0,
      contractLevels,
    });
  }, [veinConfig, calculatedStats.floorsPerHour, contractLevels]);

  const veinsNeeded = useMemo(() => {
    const needed = {};
    Object.entries(trackedUpgrades).forEach(([upgradeId, isTracked]) => {
      if (!isTracked) return;
      const upgrade = UPGRADES.find(u => u.id === upgradeId);
      if (!upgrade) return;

      const currentLevel = upgradeLevels[upgradeId] || 0;
      const capperUpperLvl = upgradeLevels.capperUpper || 0;
      const maxVal = upgrade.affectedByCapperUpper 
        ? upgrade.maxLevel + (capperUpperLvl * 5) 
        : upgrade.maxLevel;

      for (let lvl = currentLevel + 1; lvl <= maxVal; lvl++) {
        const cost = getUpgradeCost(upgradeId, lvl);
        const vein = getUpgradeVein(upgradeId, lvl);
        needed[vein] = (needed[vein] || 0) + cost;
      }
    });
    return needed;
  }, [trackedUpgrades, upgradeLevels]);

  return (
    <>
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">🔭</div>
          <div>
            <h1>Obelisk Miner</h1>
            <span className="logo-subtitle">Stargazing Optimizer</span>
          </div>
        </div>

        <nav className="tabs-nav">
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'stars' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('stars');
              setTimeout(() => {
                document.getElementById('tab-content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
          >
            ✨ Constellation Stars
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'upgrades' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('upgrades');
              setTimeout(() => {
                document.getElementById('tab-content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
          >
            ⚙️ Upgrades Tab
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'contracts' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('contracts');
              setTimeout(() => {
                document.getElementById('tab-content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
          >
            📜 Contracts
          </button>
          <button 
            type="button"
            className={`tab-btn ${activeTab === 'veins' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('veins');
              setTimeout(() => {
                document.getElementById('tab-content-area')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
            }}
          >
            ⛏️ Vein Calculator
          </button>

          <input 
            type="file"
            id="import-setup-file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleImportSetup}
          />
          
          <button
            type="button"
            className="tab-btn"
            style={{ borderColor: 'hsla(150, 60%, 50%, 0.3)', color: 'hsl(150, 70%, 70%)' }}
            onClick={() => document.getElementById('import-setup-file')?.click()}
          >
            📥 Import
          </button>

          <button
            type="button"
            className="tab-btn"
            style={{ borderColor: 'hsla(210, 60%, 50%, 0.3)', color: 'hsl(210, 70%, 70%)' }}
            onClick={handleExportSetup}
          >
            📤 Export
          </button>
          
          <button 
            type="button"
            className="tab-btn"
            style={{ borderColor: 'hsla(0, 80%, 60%, 0.3)', color: 'hsl(0, 80%, 70%)' }}
            onClick={handleReset}
          >
            Reset All
          </button>
        </nav>
      </header>

      <main className="app-container">
        {/* Left persistent stats summary & settings dashboard */}
        <StatDashboard 
          stats={calculatedStats}
          globalStats={globalStats}
          setGlobalStat={handleSetGlobalStat}
          recommendations={recommendations}
          onUpgradeStar={handleSetStarLevel}
          onUpgradeShop={handleSetUpgradeLevel}
          onUpgradeContract={handleSetContractLevel}
          veinStats={veinStats}
          veinsNeeded={veinsNeeded}
          optTarget={optTarget}
          setOptTarget={setOptTarget}
        />

        {/* Right Active configuration view */}
        <div id="tab-content-area" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {activeTab === 'stars' && (
            <StarList 
              stars={STARS}
              starLevels={starLevels}
              starUnlocked={starUnlocked}
              setStarLevel={handleSetStarLevel}
              toggleStarUnlock={handleToggleStarUnlock}
              starUpgradeCapBonus={globalStats.starUpgradeCapBonus}
            />
          )}
          {activeTab === 'upgrades' && (
            <UpgradeList 
              upgrades={UPGRADES}
              upgradeLevels={upgradeLevels}
              setUpgradeLevel={handleSetUpgradeLevel}
              trackedUpgrades={trackedUpgrades}
              toggleTrackUpgrade={handleToggleTrackUpgrade}
            />
          )}
          {activeTab === 'contracts' && (
            <ContractList 
              contracts={CONTRACTS}
              contractLevels={contractLevels}
              setContractLevel={handleSetContractLevel}
              recommendations={recommendations}
              optTarget={optTarget}
              contractUpgradeCapIncrease={globalStats.contractUpgradeCapIncrease || 0}
              currentReg={calculatedStats.regularStarYieldPerHour}
              currentSuper={calculatedStats.superStarYieldPerHour}
              currentVein={veinStats?.totalIncomePerHour || 0}
            />
          )}
          {activeTab === 'veins' && (
            <VeinCalculator
              veinConfig={veinConfig}
              setVeinConfig={setVeinConfig}
              floorsPerHour={calculatedStats.floorsPerHour}
              contractLevels={contractLevels}
            />
          )}
        </div>
      </main>
    </>
  );
}

export default App;
