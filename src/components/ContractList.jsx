import { useState, useEffect } from 'react';
import { getContractCost } from '../data/contracts';
import { calculateExpectedCPPerContract, optimizeContracts } from '../engine/contractOptimizer';

export function ContractList({
  contracts,
  contractLevels,
  setContractLevel,
  setContractLevels,
  recommendations,
  optTarget,
  contractUpgradeCapIncrease = 0,
  currentReg = 0,
  currentSuper = 0,
  currentVein = 0,
  starLevels = {},
  starUnlocked = {},
  upgradeLevels = {},
  globalStats = {},
  veinConfig = {},
  setGlobalStat
}) {
  const [activeWorld, setActiveWorld] = useState('all');
  const [hideMaxed, setHideMaxed] = useState(() => {
    const saved = localStorage.getItem('iom_contracts_hide_maxed');
    return saved ? saved === 'true' : false;
  });

  // Optimizer Inputs State
  const [showOptimizer, setShowOptimizer] = useState(() => {
    const saved = localStorage.getItem('iom_opt_show_optimizer');
    return saved ? saved === 'true' : true;
  });
  const [contractsDone, setContractsDone] = useState(() => {
    const saved = localStorage.getItem('iom_opt_contracts_done');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [cpRewarded, setCpRewarded] = useState(() => {
    const saved = localStorage.getItem('iom_opt_cp_rewarded');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [extraDoubleChance, setExtraDoubleChance] = useState(() => {
    const saved = localStorage.getItem('iom_opt_extra_double_chance');
    return saved ? parseFloat(saved) : 0;
  });
  const [tripleChance, setTripleChance] = useState(() => {
    const saved = localStorage.getItem('iom_opt_triple_chance');
    return saved ? parseFloat(saved) : 0;
  });
  const [fivexChance, setFivexChance] = useState(() => {
    const saved = localStorage.getItem('iom_opt_fivex_chance');
    return saved ? parseFloat(saved) : 0;
  });
  const [tenxChance, setTenxChance] = useState(() => {
    const saved = localStorage.getItem('iom_opt_tenx_chance');
    return saved ? parseFloat(saved) : 0;
  });
  const [ssWeight, setSsWeight] = useState(() => {
    const saved = localStorage.getItem('iom_opt_ss_weight');
    return saved ? parseInt(saved, 10) : 60;
  });
  const [veinWeight, setVeinWeight] = useState(() => {
    const saved = localStorage.getItem('iom_opt_vein_weight');
    return saved ? parseInt(saved, 10) : 40;
  });
  const [fromScratch, setFromScratch] = useState(() => {
    const saved = localStorage.getItem('iom_opt_from_scratch');
    return saved ? saved === 'true' : true;
  });
  const [syncStats, setSyncStats] = useState(() => {
    const saved = localStorage.getItem('iom_opt_sync_stats');
    return saved ? saved === 'true' : true;
  });
  const [extraCostRed, setExtraCostRed] = useState(() => {
    const saved = localStorage.getItem('iom_opt_extra_cost_reduction');
    return saved ? parseFloat(saved) : 0;
  });

  const [contractOptTarget, setContractOptTarget] = useState(() => {
    const saved = localStorage.getItem('iom_opt_contract_opt_target');
    return saved || 'balanced';
  });
  const [goldenFloorChance, setGoldenFloorChance] = useState(() => {
    const saved = localStorage.getItem('iom_opt_golden_floor_chance');
    return saved ? parseFloat(saved) : 0;
  });
  const [rainbowFloorChance, setRainbowFloorChance] = useState(() => {
    const saved = localStorage.getItem('iom_opt_rainbow_floor_chance');
    return saved ? parseFloat(saved) : 0;
  });

  const [lockedContracts, setLockedContracts] = useState(() => {
    const saved = localStorage.getItem('iom_locked_contracts');
    return saved ? JSON.parse(saved) : {};
  });

  const [optResult, setOptResult] = useState(null);

  useEffect(() => {
    localStorage.setItem('iom_locked_contracts', JSON.stringify(lockedContracts));
  }, [lockedContracts]);

  useEffect(() => {
    localStorage.setItem('iom_contracts_hide_maxed', hideMaxed);
  }, [hideMaxed]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('iom_opt_contract_opt_target', contractOptTarget);
  }, [contractOptTarget]);
  useEffect(() => {
    localStorage.setItem('iom_opt_golden_floor_chance', goldenFloorChance);
  }, [goldenFloorChance]);
  useEffect(() => {
    localStorage.setItem('iom_opt_rainbow_floor_chance', rainbowFloorChance);
  }, [rainbowFloorChance]);

  useEffect(() => {
    localStorage.setItem('iom_opt_show_optimizer', showOptimizer);
  }, [showOptimizer]);
  useEffect(() => {
    localStorage.setItem('iom_opt_contracts_done', contractsDone);
  }, [contractsDone]);
  useEffect(() => {
    localStorage.setItem('iom_opt_cp_rewarded', cpRewarded);
  }, [cpRewarded]);
  useEffect(() => {
    localStorage.setItem('iom_opt_extra_double_chance', extraDoubleChance);
  }, [extraDoubleChance]);
  useEffect(() => {
    localStorage.setItem('iom_opt_triple_chance', tripleChance);
  }, [tripleChance]);
  useEffect(() => {
    localStorage.setItem('iom_opt_fivex_chance', fivexChance);
  }, [fivexChance]);
  useEffect(() => {
    localStorage.setItem('iom_opt_tenx_chance', tenxChance);
  }, [tenxChance]);
  useEffect(() => {
    localStorage.setItem('iom_opt_ss_weight', ssWeight);
  }, [ssWeight]);
  useEffect(() => {
    localStorage.setItem('iom_opt_vein_weight', veinWeight);
  }, [veinWeight]);
  useEffect(() => {
    localStorage.setItem('iom_opt_from_scratch', fromScratch);
  }, [fromScratch]);
  useEffect(() => {
    localStorage.setItem('iom_opt_sync_stats', syncStats);
  }, [syncStats]);
  useEffect(() => {
    localStorage.setItem('iom_opt_extra_cost_reduction', extraCostRed);
  }, [extraCostRed]);


  // Derived effective values based on sync toggle
  const syncedDoubleChance = (starLevels?.cancer || 0) * 1;
  const syncedCostRed = (starLevels?.cancer || 0) * 1;
  const effectiveDouble = (syncStats ? syncedDoubleChance : 0) + extraDoubleChance;
  const effectiveCostRed = (syncStats ? syncedCostRed : 0) + extraCostRed;
  const effectiveCapInc = contractUpgradeCapIncrease;

  const expectedCPPerContract = calculateExpectedCPPerContract({
    cpRewarded,
    doubleChance: effectiveDouble,
    tripleChance,
    fivexChance,
    tenxChance
  });

  const estimatedTotalCP = Math.floor(contractsDone * expectedCPPerContract);

  // Helper to compute cumulative cost for a contract at a specific level
  const getContractCumulativeCost = (contractId, level) => {
    let total = 0;
    for (let lvl = 1; lvl <= level; lvl++) {
      const rawCost = getContractCost(contractId, lvl);
      const reducedCost = Math.max(1, Math.round(rawCost * (1 - effectiveCostRed / 100)));
      total += reducedCost;
    }
    return total;
  };

  const totalSpentCP = Object.entries(contractLevels).reduce((sum, [id, lvl]) => {
    return sum + getContractCumulativeCost(id, lvl);
  }, 0);

  const handleOptimize = () => {
    const result = optimizeContracts({
      totalCP: estimatedTotalCP,
      starLevels,
      starUnlocked,
      upgradeLevels,
      globalStats,
      veinConfig,
      costReduction: effectiveCostRed,
      capIncrease: effectiveCapInc,
      ssWeight,
      veinWeight,
      fromScratch,
      currentContractLevels: contractLevels,
      optTarget: contractOptTarget,
      goldenFloorChance,
      rainbowFloorChance,
      lockedContracts
    });
    setOptResult(result);
    setContractLevels(result.recommendedLevels);
  };

  // Group recommendations by contract ID for quick access
  const contractRecsMap = new Map();
  if (recommendations && recommendations.contractRecs) {
    recommendations.contractRecs.forEach(rec => {
      contractRecsMap.set(rec.id, rec);
    });
  }

  const filteredContracts = contracts.filter(contract => {
    const maxLevel = contract.maxLevel + effectiveCapInc;
    // Hide maxed
    if (hideMaxed) {
      const currentLevel = contractLevels[contract.id] || 0;
      if (currentLevel >= maxLevel) return false;
    }
    // Filter by world
    if (activeWorld === 'all') return true;
    return contract.world === parseInt(activeWorld);
  });

  // Format Helper
  const formatNum = (num) => {
    if (num === undefined || isNaN(num)) return '0.00';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Format Efficiency Helper
  const formatEfficiency = (num) => {
    if (num === undefined || isNaN(num) || num <= 1e-15) return '-';
    if (num >= 100) return `${num.toFixed(1)}%`;
    if (num >= 1) return `${num.toFixed(2)}%`;
    if (num < 0.0001) {
      return `${num.toExponential(2)}%`;
    }
    const prec = num.toPrecision(3);
    if (prec.includes('e')) {
      return `${num.toExponential(2)}%`;
    }
    return `${prec.replace(/0+$/, '').replace(/\.$/, '')}%`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Contract Optimizer Dashboard */}
      <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '10px',
          marginBottom: '15px'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📝 Contract Point & Upgrade Optimizer
          </h2>
          <button
            type="button"
            className="tab-btn"
            onClick={() => setShowOptimizer(!showOptimizer)}
            style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '15px' }}
          >
            {showOptimizer ? 'Collapse' : 'Expand'}
          </button>
        </div>

        {showOptimizer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Input fields grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Optimization Target
                </label>
                <select
                  value={contractOptTarget}
                  onChange={(e) => setContractOptTarget(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                >
                  <option value="balanced" style={{ background: '#222' }}>Balanced (SS & Vein)</option>
                  <option value="ore_sell_price" style={{ background: '#222' }}>Ore Sell Price</option>
                  <option value="ore_crafting" style={{ background: '#222' }}>Ore & Crafting</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Contracts Completed
                </label>
                <input
                  type="number"
                  value={contractsDone}
                  onChange={(e) => setContractsDone(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Extra CP Rewarded
                </label>
                <input
                  type="number"
                  value={cpRewarded}
                  onChange={(e) => setCpRewarded(Math.max(0, parseInt(e.target.value) || 0))}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.9rem'
                  }}
                  title="Flat bonus to contract points base reward (starts at base 10)"
                />
              </div>

              {contractOptTarget === 'balanced' ? (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Target SS Weight (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={ssWeight}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        setSsWeight(val);
                        setVeinWeight(100 - val);
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Target Vein Weight (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={veinWeight}
                      onChange={(e) => {
                        const val = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                        setVeinWeight(val);
                        setSsWeight(100 - val);
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Golden Floor Chance (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={goldenFloorChance}
                      onChange={(e) => setGoldenFloorChance(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      Rainbow Floor Chance (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={rainbowFloorChance}
                      onChange={(e) => setRainbowFloorChance(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      style={{
                        width: '100%',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#fff',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Chances grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '12px',
              background: 'rgba(255,255,255,0.02)',
              padding: '12px',
              borderRadius: '8px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Double Chance (%){syncStats ? ` (Synced: ${syncedDoubleChance}%)` : ''}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {syncStats && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>+</span>}
                  <input
                    type="number"
                    value={extraDoubleChance}
                    onChange={(e) => setExtraDoubleChance(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                    placeholder="Other sources"
                    title={syncStats ? "Manually add additional Double Chance from other sources" : "Double Chance %"}
                  />
                </div>
                {syncStats && extraDoubleChance > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-teal)', marginTop: '2px' }}>
                    Total: {effectiveDouble}%
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Triple Chance (%)
                </label>
                <input
                  type="number"
                  value={tripleChance}
                  onChange={(e) => setTripleChance(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  5x Chance (%)
                </label>
                <input
                  type="number"
                  value={fivexChance}
                  onChange={(e) => setFivexChance(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  10x Chance (%)
                </label>
                <input
                  type="number"
                  value={tenxChance}
                  onChange={(e) => setTenxChance(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={{
                    width: '100%',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Cost Reduction (%){syncStats ? ` (Synced: ${syncedCostRed}%)` : ''}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {syncStats && <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>+</span>}
                  <input
                    type="number"
                    value={extraCostRed}
                    onChange={(e) => setExtraCostRed(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{
                      flex: 1,
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.85rem'
                    }}
                    placeholder="Other sources"
                    title={syncStats ? "Manually add additional Cost Reduction from other sources" : "Cost Reduction %"}
                  />
                </div>
                {syncStats && extraCostRed > 0 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-accent-teal)', marginTop: '2px' }}>
                    Total: {effectiveCostRed}%
                  </div>
                )}
              </div>


            </div>

            {/* Checkboxes Row */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  className="star-checkbox"
                  checked={syncStats}
                  onChange={(e) => setSyncStats(e.target.checked)}
                />
                Auto-sync Stats from constellations & settings
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  className="star-checkbox"
                  checked={fromScratch}
                  onChange={(e) => setFromScratch(e.target.checked)}
                />
                Optimize from Level 0 (assuming reset)
              </label>
            </div>

            {/* Calculation Outputs Panel */}
            <div style={{
              background: 'hsla(228, 20%, 6%, 0.4)',
              padding: '12px 18px',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Expected CP / Contract: </span>
                <span style={{ color: 'var(--color-accent-teal)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>
                  {expectedCPPerContract.toFixed(2)} CP
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Estimated Total CP: </span>
                <span style={{ color: 'var(--color-superstar)', fontWeight: 'bold', fontFamily: 'var(--font-mono)', fontSize: '1.1rem' }}>
                  {estimatedTotalCP.toLocaleString()} CP
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Checklist Spent: </span>
                <span style={{
                  color: totalSpentCP > estimatedTotalCP ? '#ff5555' : 'var(--color-accent-teal)',
                  fontWeight: 'bold',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '1.1rem'
                }}>
                  {totalSpentCP.toLocaleString()} CP
                </span>
                {totalSpentCP > estimatedTotalCP && (
                  <span style={{
                    color: '#ff5555',
                    marginLeft: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: 'rgba(255, 85, 85, 0.1)',
                    border: '1px solid rgba(255, 85, 85, 0.2)',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    ⚠️ Exceeded Budget!
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleOptimize}
                className="tab-btn active"
                style={{ padding: '8px 24px', fontSize: '0.9rem', borderRadius: '8px', background: 'var(--color-accent-teal)', color: '#000', border: 'none' }}
              >
                Calculate & Optimize Build
              </button>
            </div>

            {/* Recommendations Output */}
            {optResult && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '8px',
                padding: '16px',
                marginTop: '4px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  paddingBottom: '10px',
                  marginBottom: '12px'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-accent-emerald)' }}>
                      🏆 Recommended Optimization Result
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                      Spent {optResult.spentCP.toLocaleString()} CP / Remaining {optResult.remainingCP.toLocaleString()} CP
                    </span>
                  </div>

                  <span
                    style={{ 
                      fontSize: '0.8rem', 
                      background: 'hsla(145, 75%, 50%, 0.15)', 
                      color: 'hsl(145, 70%, 75%)', 
                      border: '1px solid hsla(145, 75%, 50%, 0.3)',
                      padding: '4px 12px', 
                      borderRadius: '15px', 
                      fontWeight: '600' 
                    }}
                  >
                    ✅ Applied
                  </span>
                </div>

                {/* Simulated Changes */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '15px'
                }}>
                  {optResult.optTarget === 'balanced' ? (
                    <>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Super Star Yield / Hr</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '4px 0' }}>
                          {formatNum(optResult.finalSSYield)}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-emerald)' }}>
                          {optResult.baseSSYield > 0 ? `+${((optResult.finalSSYield / optResult.baseSSYield - 1) * 100).toFixed(1)}%` : '+0%'} from base
                        </span>
                      </div>

                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Vein Income / Hr</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '4px 0' }}>
                          {formatNum(optResult.finalVeinYield)}
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-emerald)' }}>
                          {optResult.baseVeinYield > 0 ? `+${((optResult.finalVeinYield / optResult.baseVeinYield - 1) * 100).toFixed(1)}%` : '+0%'} from base
                        </span>
                      </div>
                    </>
                  ) : (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                        {optResult.optTarget === 'ore_sell_price' ? '🏆 Expected Ore Sell Price Value Rate' : '🏆 Expected Ore & Crafting Value Rate'}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: '4px 0' }}>
                        {formatNum(optResult.finalScore)}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-accent-emerald)' }}>
                        {optResult.baseScore > 0 ? `+${((optResult.finalScore / optResult.baseScore - 1) * 100).toFixed(1)}%` : '+0%'} from base
                      </span>
                    </div>
                  )}
                </div>

                {/* Upgrade Path details */}
                <details>
                  <summary style={{ cursor: 'pointer', fontSize: '0.85rem', color: 'var(--color-accent-teal)', userSelect: 'none' }}>
                    View Step-by-Step Upgrade Order ({optResult.upgradePath.length} steps)
                  </summary>
                  <div style={{
                    marginTop: '10px',
                    maxHeight: '180px',
                    overflowY: 'auto',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '10px',
                    borderRadius: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {optResult.upgradePath.map((step, idx) => (
                      <div key={idx} style={{ color: 'var(--color-text-secondary)' }}>
                        <span style={{ color: 'var(--color-accent-violet)' }}>{idx + 1}.</span> {step.name}: Lvl {step.fromLevel} → <span style={{ color: '#fff', fontWeight: 'bold' }}>{step.toLevel}</span> <span style={{ color: 'var(--color-superstar)' }}>(-{step.cost} CP)</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls Row */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '0 8px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`tab-btn ${activeWorld === 'all' ? 'active' : ''}`}
            onClick={() => setActiveWorld('all')}
            style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: '20px' }}
          >
            All Worlds
          </button>
          <button
            type="button"
            className={`tab-btn ${activeWorld === '1' ? 'active' : ''}`}
            onClick={() => setActiveWorld('1')}
            style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: '20px' }}
          >
            World 1
          </button>
          <button
            type="button"
            className={`tab-btn ${activeWorld === '2' ? 'active' : ''}`}
            onClick={() => setActiveWorld('2')}
            style={{ padding: '6px 16px', fontSize: '0.8rem', borderRadius: '20px' }}
          >
            World 2
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
              Contract Cap Increase:
            </label>
            <input
              type="number"
              min="0"
              value={contractUpgradeCapIncrease}
              onChange={(e) => setGlobalStat('contractUpgradeCapIncrease', Math.max(0, parseInt(e.target.value) || 0))}
              style={{
                width: '60px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.85rem',
                textAlign: 'center'
              }}
              title="Increases the base cap of all Contract Upgrades (e.g. +2 levels)"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="hide-maxed-contracts"
              className="star-checkbox"
              checked={hideMaxed}
              onChange={(e) => setHideMaxed(e.target.checked)}
            />
            <label htmlFor="hide-maxed-contracts" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
              Hide Maxed Contracts
            </label>
          </div>
        </div>
      </div>

      {/* Grid of Contracts */}
      <div className="grid-container">
        {filteredContracts.map((contract) => {
          const currentLevel = contractLevels[contract.id] || 0;
          const maxLevel = contract.maxLevel + effectiveCapInc;
          const rec = contractRecsMap.get(contract.id);

          // Optimizer recommended target badge
          const recommendedLvl = optResult ? optResult.recommendedLevels[contract.id] : null;
          const showRecBadge = recommendedLvl !== null && recommendedLvl !== currentLevel;

          // Calculate current bonus value
          const totalBonus = currentLevel * contract.valuePerLevel;
          let formattedBonus = `${totalBonus > 0 ? '+' : ''}${totalBonus.toFixed(2).replace(/\.00$/, '')}${contract.unit}`;
          if (contract.id === "upgradeBarCost") {
            formattedBonus = `${totalBonus}%`;
          }

          // Calculate next level cost
          const nextCost = currentLevel < maxLevel ? getContractCost(contract.id, currentLevel + 1) : 0;

          // Apply cost reduction to card display
          const nextCostReduced = Math.max(1, Math.round(nextCost * (1 - effectiveCostRed / 100)));

          // Efficiency logic
          let efficiencyLabel = null;
          if (rec && nextCost > 0) {
            const isVeinContract = ['veinIncomeMultiplier', 'goldenVeinChance'].includes(contract.id);
            const isSuperStarContract = ['superStarSpawnRate', 'supernovaChance'].includes(contract.id);

            if (isVeinContract && rec.deltaVein > 0 && currentVein > 0) {
              const effVein = ((rec.deltaVein / currentVein) * 100) / nextCostReduced;
              efficiencyLabel = `+${formatEfficiency(effVein)} Veins/CP`;
            } else if (isSuperStarContract && rec.deltaSuper > 0 && currentSuper > 0) {
              const effSuper = ((rec.deltaSuper / currentSuper) * 100) / nextCostReduced;
              efficiencyLabel = `+${formatEfficiency(effSuper)} S.Stars/CP`;
            } else {
              // Game speed or general contracts affect multiple things
              if (optTarget === 'super' && rec.deltaSuper > 0 && currentSuper > 0) {
                const effSuper = ((rec.deltaSuper / currentSuper) * 100) / nextCostReduced;
                efficiencyLabel = `+${formatEfficiency(effSuper)} S.Stars/CP`;
              } else if (rec.deltaReg > 0 && currentReg > 0) {
                const effReg = ((rec.deltaReg / currentReg) * 100) / nextCostReduced;
                efficiencyLabel = `+${formatEfficiency(effReg)} Stars/CP`;
              } else if (rec.deltaVein > 0 && currentVein > 0) {
                const effVein = ((rec.deltaVein / currentVein) * 100) / nextCostReduced;
                efficiencyLabel = `+${formatEfficiency(effVein)} Veins/CP`;
              }
            }
          }

          return (
            <div
              key={contract.id}
              className={`glass-panel glass-card star-card ${currentLevel > 0 ? 'active' : ''}`}
              style={{
                padding: '16px',
                border: showRecBadge ? '1px solid hsla(145, 75%, 50%, 0.35)' : '1px solid hsla(230, 20%, 30%, 0.2)',
                boxShadow: showRecBadge ? '0 0 10px hsla(145, 75%, 50%, 0.1)' : 'none'
              }}
            >
              <div className="upgrade-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                {/* Header */}
                <div className="star-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="star-name" style={{ fontSize: '1rem', lineHeight: '1.2', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                      <span>{contract.name}</span>
                      {showRecBadge && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            background: 'hsla(145, 75%, 50%, 0.15)',
                            color: 'hsl(145, 70%, 75%)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: '600'
                          }}
                          title={`Optimizer recommends target level ${recommendedLvl}`}
                        >
                          → Lvl {recommendedLvl} (Rec)
                        </span>
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-text-secondary)', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px', fontWeight: 'normal' }}>
                        <input 
                          type="checkbox"
                          className="star-checkbox"
                          style={{ margin: 0 }}
                          checked={!!lockedContracts[contract.id]}
                          onChange={(e) => {
                            setLockedContracts(prev => ({
                              ...prev,
                              [contract.id]: e.target.checked
                            }));
                          }}
                        />
                        Lock
                      </label>
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      color: contract.world === 1 ? 'var(--color-accent-teal)' : 'var(--color-accent-violet)',
                      textTransform: 'uppercase',
                      fontWeight: '600',
                      letterSpacing: '1px',
                      background: contract.world === 1 ? 'hsla(170, 75%, 45%, 0.1)' : 'hsla(265, 85%, 65%, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      marginTop: '4px',
                      display: 'inline-block'
                    }}>
                      W{contract.world} Contract
                    </span>
                  </div>

                  {efficiencyLabel && (
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--color-accent-emerald)',
                      fontWeight: '600',
                      background: 'hsla(145, 75%, 50%, 0.1)',
                      border: '1px solid hsla(145, 75%, 50%, 0.2)',
                      padding: '2px 6px',
                      borderRadius: '6px'
                    }} title="Yield increase per Contract Point spent (reduced cost)">
                      ⚡ {efficiencyLabel}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="upgrade-desc" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '8px 0', minHeight: '34px' }}>
                  {contract.description}
                  {contract.obMin && (
                    <div style={{ color: 'var(--color-accent-violet)', fontSize: '0.7rem', marginTop: '2px', fontWeight: '500' }}>
                      Requires Obelisk Level {contract.obMin}
                    </div>
                  )}
                </div>

                {/* Info block */}
                <div style={{
                  margin: '8px 0',
                  fontSize: '0.85rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  background: 'hsla(228, 20%, 6%, 0.2)',
                  padding: '6px 10px',
                  borderRadius: '6px'
                }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Current Bonus:</span>
                  <span style={{ color: 'var(--color-accent-teal)', fontWeight: '600' }}>{formattedBonus}</span>
                </div>

                {/* Levels Slider */}
                <div style={{ marginTop: '10px' }}>
                  <input
                    type="range"
                    min="0"
                    max={maxLevel}
                    value={currentLevel}
                    onChange={(e) => setContractLevel(contract.id, parseInt(e.target.value) || 0)}
                    className="custom-slider"
                    style={{ width: '100%' }}
                  />
                </div>

                {/* Controls & Cost */}
                <div className="level-controls" style={{ marginTop: '14px', paddingTop: '10px' }}>
                  <button
                    type="button"
                    className="lvl-btn"
                    onClick={() => setContractLevel(contract.id, currentLevel - 1)}
                    disabled={currentLevel <= 0}
                  >
                    -
                  </button>
                  <div style={{ textAlign: 'center' }}>
                    <div className="lvl-value" style={{ fontSize: '1rem' }}>
                      Lvl {currentLevel}
                    </div>
                    <span className="lvl-max-label" style={{ fontSize: '0.7rem' }}>
                      Max: {maxLevel}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="lvl-btn"
                    onClick={() => setContractLevel(contract.id, currentLevel + 1)}
                    disabled={currentLevel >= maxLevel}
                  >
                    +
                  </button>
                </div>

                {/* Cost Display */}
                {currentLevel < maxLevel ? (
                  <div style={{
                    marginTop: '10px',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Next Cost:</span>
                    <span style={{ color: 'var(--color-superstar)', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
                      {nextCostReduced.toLocaleString()} CP
                      {effectiveCostRed > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--color-accent-teal)', marginLeft: '4px' }}>(-{effectiveCostRed}%)</span>}
                    </span>
                  </div>
                ) : (
                  <div style={{
                    marginTop: '10px',
                    fontSize: '0.75rem',
                    color: 'var(--color-accent-emerald)',
                    textAlign: 'right',
                    fontWeight: '600'
                  }}>
                    MAXED
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
