import { useState } from 'react';

export function StatDashboard({ 
  stats, 
  globalStats, 
  setGlobalStat, 
  recommendations,
  onUpgradeStar,
  onUpgradeShop,
  onUpgradeContract,
  veinStats,
  veinsNeeded,
  starFloors,
  desiredStars = {},
  starUnlocked = {},
  veinConfig = {}
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showOtherPerks, setShowOtherPerks] = useState(false);
  const [showDroneRelic, setShowDroneRelic] = useState(false);
  const [optTarget, setOptTarget] = useState('regular');
  const [hideLocked, setHideLocked] = useState(false);
  const [contractFilter, setContractFilter] = useState('all');

  // Format Helper
  const formatNum = (num) => {
    if (num === undefined || isNaN(num)) return '0.00';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

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
    <div className="dashboard-sidebar glass-panel" style={{ padding: '20px' }}>
      <div>
        <h2 className="dashboard-section-title">Yield Rates</h2>
        
        <div className="stat-row">
          <span className="stat-label">Regular Stars / Hr:</span>
          <span className="stat-value star">
            {formatNum(stats.regularStarYieldPerHour)}
          </span>
        </div>

        <div className="stat-row" style={{ marginTop: '4px' }}>
          <span className="stat-label">Super Stars / Hr:</span>
          <span className="stat-value superstar">
            {formatNum(stats.superStarYieldPerHour)}
          </span>
        </div>
      </div>

      <div>
        <h2 className="dashboard-section-title">Best Upgrades</h2>
        
        {/* Toggle Target */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <button
            type="button"
            className={`tab-btn ${optTarget === 'regular' ? 'active' : ''}`}
            onClick={() => setOptTarget('regular')}
            style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
          >
            ⭐ Stars Yield
          </button>
          <button
            type="button"
            className={`tab-btn ${optTarget === 'super' ? 'active' : ''}`}
            onClick={() => setOptTarget('super')}
            style={{ flex: 1, padding: '6px 12px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
          >
            🔮 Super Stars
          </button>
        </div>

        {/* Hide Locked Stars Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <input 
            type="checkbox"
            id="hide-locked-stars-rec"
            className="star-checkbox"
            checked={hideLocked}
            onChange={(e) => setHideLocked(e.target.checked)}
          />
          <label htmlFor="hide-locked-stars-rec" style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
            Hide Locked Stars
          </label>
        </div>

        {/* Side-by-side Columns */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Stars Column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
              Best Stars (Top 5)
            </div>
            {(() => {
              const isRegular = optTarget === 'regular';
              const sortedStars = [...(recommendations?.starRecs || [])]
                .filter(r => !hideLocked || r.unlocked)
                .sort((a, b) => isRegular ? b.deltaReg - a.deltaReg : b.deltaSuper - a.deltaSuper)
                .filter(r => isRegular ? r.deltaReg > 0.0001 : r.deltaSuper > 0.0001)
                .slice(0, 5);

              if (sortedStars.length > 0) {
                const currentYield = isRegular ? stats.regularStarYieldPerHour : stats.superStarYieldPerHour;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sortedStars.map(rec => {
                      const delta = isRegular ? rec.deltaReg : rec.deltaSuper;
                      const pct = currentYield > 0 ? (delta / currentYield) * 100 : 0;
                      return (
                        <button 
                          key={rec.id} 
                          type="button"
                          className="suggestion-btn" 
                          onClick={() => onUpgradeStar(rec.id, rec.nextLevel)}
                          title={`Click to upgrade ${rec.name} to Lvl ${rec.nextLevel}`}
                          style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px', padding: '6px 8px' }}
                        >
                          <div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--color-text-primary)', fontWeight: '500', fontSize: '0.75rem' }}>
                              {!rec.unlocked && <span style={{ marginRight: '2px' }}>🔒</span>}
                              {rec.name}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: '2px' }}>
                              ({rec.currentLevel}→{rec.nextLevel})
                            </span>
                          </div>
                          <span className="cost-badge" style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                            {rec.cost} shards
                          </span>
                          <span className="suggestion-delta" style={{ color: isRegular ? 'var(--color-star)' : 'var(--color-superstar)', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                            +{formatNum(delta)} ({pct.toFixed(1)}%)
                          </span>
                          <span className="time-to-upgrade" style={{ fontSize: '0.55rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                            {rec.timeToUpgrade}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              }
              return (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No active upgrades.
                </div>
              );
            })()}
          </div>

          {/* Shop Column */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
              Best Shop (Top 5)
            </div>
            {(() => {
              const isRegular = optTarget === 'regular';
              const sortedUpgrades = [...(recommendations?.upgradeRecs || [])]
                .sort((a, b) => isRegular ? b.deltaReg - a.deltaReg : b.deltaSuper - a.deltaSuper)
                .filter(r => isRegular ? r.deltaReg > 0.0001 : r.deltaSuper > 0.0001)
                .slice(0, 5);

              if (sortedUpgrades.length > 0) {
                const currentYield = isRegular ? stats.regularStarYieldPerHour : stats.superStarYieldPerHour;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sortedUpgrades.map(rec => {
                      const delta = isRegular ? rec.deltaReg : rec.deltaSuper;
                      const pct = currentYield > 0 ? (delta / currentYield) * 100 : 0;
                      
                      // Helper to lookup vein income case/space-insensitively
                      const getVeinIncomeFullTime = (veinName) => {
                        if (!veinName || !veinStats?.incomeByVeinNameFullTime) return 0;
                        const norm = veinName.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
                        const foundEntry = Object.entries(veinStats.incomeByVeinNameFullTime).find(([key]) => {
                          const normKey = key.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
                          return normKey === norm;
                        });
                        return foundEntry ? foundEntry[1] : 0;
                      };

                      // Compute time-to-upgrade using vein income or super star yield
                      let veinTime = 'N/A';
                      if (rec.vein === 'Super Star') {
                        const ssYield = stats.superStarYieldPerHour || 0;
                        if (ssYield > 0 && rec.cost > 0) {
                          const hrs = rec.cost / ssYield;
                          const mins = Math.ceil(hrs * 60);
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          veinTime = `${h} h ${m} m`;
                        }
                      } else {
                        const veinIncomeHr = getVeinIncomeFullTime(rec.vein);
                        if (veinIncomeHr > 0 && rec.cost > 0) {
                          const hrs = rec.cost / veinIncomeHr;
                          const mins = Math.ceil(hrs * 60);
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          veinTime = `${h} h ${m} m`;
                        }
                      }


                      // Find camping advice (desired/unlocked star fallbacks)
                      let adviceTitle = '';
                      let adviceType = 'none';
                      if (rec.vein && starFloors) {
                        const normRec = rec.vein.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
                        const floorsForVein = starFloors.filter(f => {
                          if (!f.vein) return false;
                          const normF = f.vein.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
                          return normF === normRec;
                        });

                        const uniqueStars = [];
                        floorsForVein.forEach(f => {
                          f.stars.forEach(s => {
                            if (!uniqueStars.includes(s)) {
                              uniqueStars.push(s);
                            }
                          });
                        });

                        if (uniqueStars.length > 0) {
                          const desiredOnVein = uniqueStars.filter(s => desiredStars && desiredStars[s]);
                          if (desiredOnVein.length > 0) {
                            const names = desiredOnVein.map(s => s.charAt(0).toUpperCase() + s.slice(1));
                            adviceTitle = `⭐ Desired: ${names.join(', ')}`;
                            adviceType = 'desired';
                          } else {
                            const unlockedOnVein = uniqueStars.filter(s => starUnlocked && starUnlocked[s]);
                            if (unlockedOnVein.length > 0) {
                              const names = unlockedOnVein.map(s => s.charAt(0).toUpperCase() + s.slice(1));
                              adviceTitle = `🔓 Unlocked: ${names.join(', ')}`;
                              adviceType = 'unlocked';
                            } else {
                              const names = uniqueStars.map(s => s.charAt(0).toUpperCase() + s.slice(1));
                              adviceTitle = `🔒 Locked: ${names.join(', ')}`;
                              adviceType = 'locked';
                            }
                          }
                        }
                      }

                      return (
                        <button 
                          key={rec.id} 
                          type="button"
                          className="suggestion-btn" 
                          onClick={() => onUpgradeShop(rec.id, rec.nextLevel)}
                          title={`Click to upgrade ${rec.name} to Lvl ${rec.nextLevel}`}
                          style={{ 
                            flexDirection: 'column', 
                            alignItems: 'flex-start', 
                            gap: '2px', 
                            padding: '6px 8px'
                          }}
                        >
                          <div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ color: 'var(--color-text-primary)', fontWeight: '500', fontSize: '0.75rem' }}>{rec.name}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: '2px' }}>
                              ({rec.currentLevel}→{rec.nextLevel})
                            </span>
                          </div>
                          <span className="cost-badge" style={{ 
                            fontSize: '0.55rem', 
                            color: 'var(--color-text-muted)', 
                            marginLeft: '4px'
                          }}>
                            {formatNum(rec.cost)} {rec.vein}
                          </span>
                          {veinTime !== 'N/A' && (
                            <span className="time-to-upgrade" style={{ fontSize: '0.55rem', color: 'var(--color-accent-emerald)', marginLeft: '4px' }}>
                              ⏱ {veinTime}
                            </span>
                          )}
                          <span className="suggestion-delta" style={{ color: isRegular ? 'var(--color-star)' : 'var(--color-superstar)', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>
                            +{formatNum(delta)} ({pct.toFixed(1)}%)
                          </span>
                          {adviceTitle && (
                            <span 
                              style={{ 
                                fontSize: '0.55rem', 
                                color: adviceType === 'desired' ? 'var(--color-star)' : adviceType === 'unlocked' ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', 
                                fontWeight: adviceType === 'desired' ? '600' : 'normal',
                                marginLeft: '4px', 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                width: '100%', 
                                display: 'inline-block' 
                              }} 
                              title={adviceTitle}
                            >
                              {adviceTitle}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              }
              return (
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  No active upgrades.
                </div>
              );
            })()}
          </div>
        </div>

        {/* Best Contracts Section */}
        <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border-light)', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
            Best Contracts (Top 4)
          </div>

          {/* Resource Filter Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <button
              type="button"
              className={`tab-btn ${contractFilter === 'all' ? 'active' : ''}`}
              onClick={() => setContractFilter('all')}
              style={{ flex: 1, padding: '4px 2px', fontSize: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
            >
              All
            </button>
            <button
              type="button"
              className={`tab-btn ${contractFilter === 'veins' ? 'active' : ''}`}
              onClick={() => setContractFilter('veins')}
              style={{ flex: 1, padding: '4px 2px', fontSize: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
            >
              Veins
            </button>
            <button
              type="button"
              className={`tab-btn ${contractFilter === 'stars' ? 'active' : ''}`}
              onClick={() => setContractFilter('stars')}
              style={{ flex: 1, padding: '4px 2px', fontSize: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
            >
              Stars
            </button>
            <button
              type="button"
              className={`tab-btn ${contractFilter === 'superStars' ? 'active' : ''}`}
              onClick={() => setContractFilter('superStars')}
              style={{ flex: 1, padding: '4px 2px', fontSize: '0.65rem', borderRadius: '4px', border: '1px solid var(--border-light)' }}
            >
              S.Stars
            </button>
          </div>

          {(() => {
            const currentReg = stats.regularStarYieldPerHour || 0;
            const currentSuper = stats.superStarYieldPerHour || 0;
            const currentVein = veinStats?.totalIncomePerHour || 0;

            const isRegular = optTarget === 'regular';
            const sortedContracts = [...(recommendations?.contractRecs || [])]
              .sort((a, b) => {
                const aCost = a.cost || 1;
                const bCost = b.cost || 1;

                if (contractFilter === 'veins') {
                  const aVal = currentVein > 0 ? (a.deltaVein / currentVein) / aCost : 0;
                  const bVal = currentVein > 0 ? (b.deltaVein / currentVein) / bCost : 0;
                  return bVal - aVal;
                } else if (contractFilter === 'stars') {
                  const aVal = currentReg > 0 ? (a.deltaReg / currentReg) / aCost : 0;
                  const bVal = currentReg > 0 ? (b.deltaReg / currentReg) / bCost : 0;
                  return bVal - aVal;
                } else if (contractFilter === 'superStars') {
                  const aVal = currentSuper > 0 ? (a.deltaSuper / currentSuper) / aCost : 0;
                  const bVal = currentSuper > 0 ? (b.deltaSuper / currentSuper) / bCost : 0;
                  return bVal - aVal;
                } else {
                  if (isRegular) {
                    const aVal = currentReg > 0 ? (a.deltaReg / currentReg) / aCost : 0;
                    const bVal = currentReg > 0 ? (b.deltaReg / currentReg) / bCost : 0;
                    if (bVal !== aVal) return bVal - aVal;
                    return (currentVein > 0 ? (b.deltaVein / currentVein) / bCost : 0) - (currentVein > 0 ? (a.deltaVein / currentVein) / aCost : 0);
                  } else {
                    const aVal = currentSuper > 0 ? (a.deltaSuper / currentSuper) / aCost : 0;
                    const bVal = currentSuper > 0 ? (b.deltaSuper / currentSuper) / bCost : 0;
                    if (bVal !== aVal) return bVal - aVal;
                    return (currentVein > 0 ? (b.deltaVein / currentVein) / bCost : 0) - (currentVein > 0 ? (a.deltaVein / currentVein) / aCost : 0);
                  }
                }
              })
              .filter(r => {
                if (contractFilter === 'veins') return r.deltaVein > 0.0001;
                if (contractFilter === 'stars') return r.deltaReg > 0.0001;
                if (contractFilter === 'superStars') return r.deltaSuper > 0.0001;
                return r.deltaReg > 0.0001 || r.deltaSuper > 0.0001 || r.deltaVein > 0.0001;
              })
              .slice(0, 4);

            const showVeins = contractFilter === 'all' || contractFilter === 'veins';
            const showStars = contractFilter === 'all' || contractFilter === 'stars';
            const showSuperStars = contractFilter === 'all' || contractFilter === 'superStars';
            const gridCols = contractFilter === 'all' ? '1.2fr 1fr 1fr 1fr' : '1.5fr 1fr';

            return (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: gridCols,
                  gap: '4px',
                  fontSize: '0.65rem',
                  color: 'var(--color-text-muted)',
                  fontWeight: 'bold',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '4px',
                  marginBottom: '6px',
                  textAlign: 'center'
                }}>
                  <span style={{ textAlign: 'left' }}>Contract (CP)</span>
                  {showVeins && <span>% Veins/CP</span>}
                  {showStars && <span>% Stars/CP</span>}
                  {showSuperStars && <span>% S.Stars/CP</span>}
                </div>

                {sortedContracts.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sortedContracts.map(rec => {
                      const aCost = rec.cost || 1;
                      const veinEff = currentVein > 0 ? ((rec.deltaVein / currentVein) * 100) / aCost : 0;
                      const regEff = currentReg > 0 ? ((rec.deltaReg / currentReg) * 100) / aCost : 0;
                      const superEff = currentSuper > 0 ? ((rec.deltaSuper / currentSuper) * 100) / aCost : 0;

                      return (
                        <button 
                          key={rec.id} 
                          type="button"
                          className="suggestion-btn" 
                          onClick={() => onUpgradeContract(rec.id, rec.nextLevel)}
                          title={`Click to upgrade ${rec.name} to Lvl ${rec.nextLevel}`}
                          style={{ 
                            padding: '6px 4px', 
                            display: 'grid', 
                            gridTemplateColumns: gridCols, 
                            gap: '4px',
                            alignItems: 'center',
                            textAlign: 'center',
                            fontSize: '0.7rem',
                            border: '1px solid var(--border-light)',
                            width: '100%'
                          }}
                        >
                          <div style={{ textAlign: 'left', minWidth: 0 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500', color: 'var(--color-text-primary)' }}>
                              {rec.name}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>
                              Lvl {rec.currentLevel}→{rec.nextLevel} ({rec.cost} CP)
                            </div>
                          </div>
                          
                          {/* Veins/CP */}
                          {showVeins && (
                            <span style={{ color: veinEff > 0 ? 'var(--color-accent-emerald)' : 'var(--color-text-muted)', fontWeight: veinEff > 0 ? '600' : 'normal' }}>
                              {formatEfficiency(veinEff)}
                            </span>
                          )}

                          {/* Stars/CP */}
                          {showStars && (
                            <span style={{ color: regEff > 0 ? 'var(--color-star)' : 'var(--color-text-muted)', fontWeight: regEff > 0 ? '600' : 'normal' }}>
                              {formatEfficiency(regEff)}
                            </span>
                          )}

                          {/* Super Stars/CP */}
                          {showSuperStars && (
                            <span style={{ color: superEff > 0 ? 'var(--color-superstar)' : 'var(--color-text-muted)', fontWeight: superEff > 0 ? '600' : 'normal' }}>
                              {formatEfficiency(superEff)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                    No contract upgrades available for this resource target.
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </div>

      <div>
        <h2 className="dashboard-section-title">Tracked Upgrade Costs</h2>
        {veinsNeeded && Object.keys(veinsNeeded).length > 0 ? (
          <div className="active-stats-grid" style={{ marginTop: '8px', marginBottom: '16px' }}>
            {Object.entries(veinsNeeded).sort((a,b) => b[1] - a[1]).map(([vein, amount]) => (
              <div key={vein} className="active-stat-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px' }}>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>{vein}:</span>
                <span style={{ color: 'var(--color-accent-teal)', fontWeight: '600' }}>
                  {formatNum(amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '8px', paddingBottom: '12px' }}>
            No upgrades tracked. Check 'Track' on an upgrade to see total costs to max level.
          </div>
        )}
      </div>

      <div>
        <h2 className="dashboard-section-title">Active Buffs</h2>
        <div className="stat-row" style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '6px', marginBottom: '6px' }}>
          <span className="stat-label" style={{ color: 'var(--color-accent-violet)' }}>Offline Mode (0.85x):</span>
          <input 
            type="checkbox" 
            className="star-checkbox"
            checked={!!globalStats.offlineMode}
            onChange={(e) => setGlobalStat('offlineMode', e.target.checked)}
          />
        </div>
        <div className="stat-row" style={{ padding: '4px 0' }}>
          <span className="stat-label">2x Star Spawn Buff:</span>
          <input 
            type="checkbox" 
            className="star-checkbox"
            checked={!!globalStats.starSpawnBuff2x}
            onChange={(e) => setGlobalStat('starSpawnBuff2x', e.target.checked)}
          />
        </div>
        <div className="stat-row" style={{ padding: '4px 0' }}>
          <span className="stat-label">3x Super Star Buff:</span>
          <input 
            type="checkbox" 
            className="star-checkbox"
            checked={!!globalStats.superStarSpawnBuff3x}
            onChange={(e) => setGlobalStat('superStarSpawnBuff3x', e.target.checked)}
          />
        </div>
        <div className="stat-row" style={{ padding: '4px 0' }}>
          <span className="stat-label">Drone Fueled (100% Catch):</span>
          <input 
            type="checkbox" 
            className="star-checkbox"
            checked={!!globalStats.droneFueled}
            onChange={(e) => setGlobalStat('droneFueled', e.target.checked)}
          />
        </div>
        <div className="stat-row" style={{ padding: '4px 0' }}>
          <span className="stat-label">CTRL-F Unlocked:</span>
          <input 
            type="checkbox" 
            className="star-checkbox"
            checked={!!globalStats.ctrlFUnlocked}
            onChange={(e) => setGlobalStat('ctrlFUnlocked', e.target.checked)}
          />
        </div>
        <div className="stat-row" style={{ padding: '4px 0' }}>
          <span className="stat-label">Fuel Elixir Drone:</span>
          <input 
            type="checkbox" 
            className="star-checkbox"
            checked={!!globalStats.elixirDroneFueled}
            onChange={(e) => setGlobalStat('elixirDroneFueled', e.target.checked)}
          />
        </div>

        {/* Global Drone Fuel configuration */}
        <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Drone Fuel Settings</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Fuel Amount:</label>
              <input 
                type="number" 
                min="1" 
                value={globalStats.droneFuelAmount || 1}
                onChange={(e) => setGlobalStat('droneFuelAmount', Math.max(1, parseInt(e.target.value) || 1))}
                className="custom-number-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '2px' }}>Fuel Dur Lvl (0-100):</label>
              <input 
                type="number" 
                min="0" 
                max="100"
                value={globalStats.droneFuelDurationMultiplierLevel || 0}
                onChange={(e) => setGlobalStat('droneFuelDurationMultiplierLevel', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                className="custom-number-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Fuel calculations */}
          {(() => {
            const activeDrones = (globalStats.droneFueled ? 1 : 0) + 
                                 (veinConfig?.veinDroneFueled ? 1 : 0) + 
                                 (globalStats.elixirDroneFueled ? 1 : 0);
            const fuelAmount = globalStats.droneFuelAmount || 1;
            const fuelDurLvl = globalStats.droneFuelDurationMultiplierLevel || 0;
            const elixirDroneGrade = globalStats.elixirDroneGrade || 0;

            const baseDurationHrs = fuelAmount * (1 + fuelDurLvl * 0.1);
            
            const elixirDurationPerFuel = (210 + 10.5 * elixirDroneGrade) * (1.6 + 0.06 * elixirDroneGrade);
            const elixirDurationSecs = elixirDurationPerFuel * fuelAmount * (1 + fuelDurLvl * 0.1);
            
            const formatElixirDuration = (secs) => {
              if (secs < 3600) {
                const m = Math.floor(secs / 60);
                const s = Math.round(secs % 60);
                return `${m}m ${s}s`;
              }
              return `${(secs / 3600).toFixed(1)} hrs`;
            };

            const gemCost = activeDrones * fuelAmount * 5;

            return (
              <div style={{ fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Active Drones:</span>
                  <span style={{ color: '#fff', fontWeight: 'bold' }}>{activeDrones}</span>
                </div>
                {globalStats.droneFueled && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Starburst Drone:</span>
                    <span style={{ color: 'var(--color-accent-teal)', fontWeight: 'bold' }}>{baseDurationHrs.toFixed(1)} hrs</span>
                  </div>
                )}
                {veinConfig?.veinDroneFueled && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Vein Drone:</span>
                    <span style={{ color: 'var(--color-accent-teal)', fontWeight: 'bold' }}>{baseDurationHrs.toFixed(1)} hrs</span>
                  </div>
                )}
                {globalStats.elixirDroneFueled && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Elixir Drone:</span>
                    <span style={{ color: 'var(--color-accent-teal)', fontWeight: 'bold' }}>{formatElixirDuration(elixirDurationSecs)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '4px', marginTop: '2px' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Gem Cost:</span>
                  <span style={{ color: 'var(--color-superstar)', fontWeight: 'bold' }}>{gemCost} 💎</span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <div>
        <h2 className="dashboard-section-title">Speed & Clears</h2>
        
        <div className="config-group">
          <div className="config-label-row">
            <span>Game Speed Modifier:</span>
            <span className="stat-value highlight">{globalStats.gameSpeed}x</span>
          </div>
          <div className="input-slider-container">
            <input 
              type="range" 
              min="1.0" 
              max="5.0" 
              step="0.01" 
              value={globalStats.gameSpeed}
              onChange={(e) => setGlobalStat('gameSpeed', parseFloat(e.target.value) || 1.0)}
              className="custom-slider"
            />
            <input 
              type="number" 
              step="0.01"
              value={globalStats.gameSpeed}
              onChange={(e) => setGlobalStat('gameSpeed', parseFloat(e.target.value) || 1.0)}
              className="custom-number-input"
            />
          </div>
        </div>

        <div className="config-group">
          <div className="config-label-row">
            <span>Card Multiplier:</span>
            <span className="stat-value highlight">{globalStats.cardMultiplier}x</span>
          </div>
          <div className="input-slider-container">
            <input 
              type="range" 
              min="1.0" 
              max="10.0" 
              step="0.1" 
              value={globalStats.cardMultiplier}
              onChange={(e) => setGlobalStat('cardMultiplier', parseFloat(e.target.value) || 1.0)}
              className="custom-slider"
            />
            <input 
              type="number" 
              step="0.1"
              value={globalStats.cardMultiplier}
              onChange={(e) => setGlobalStat('cardMultiplier', parseFloat(e.target.value) || 1.0)}
              className="custom-number-input"
            />
          </div>
        </div>

        <div className="config-group">
          <div className="config-label-row">
            <span>Manual Catch Rate:</span>
            <span className="stat-value highlight">{Math.round(globalStats.manualCatchRate * 100)}%</span>
          </div>
          <div className="input-slider-container">
            <input 
              type="range" 
              min="0.0" 
              max="1.0" 
              step="0.01" 
              value={globalStats.manualCatchRate}
              onChange={(e) => setGlobalStat('manualCatchRate', parseFloat(e.target.value) || 0.0)}
              className="custom-slider"
            />
            <input 
              type="number" 
              step="1"
              value={Math.round(globalStats.manualCatchRate * 100)}
              onChange={(e) => setGlobalStat('manualCatchRate', (parseFloat(e.target.value) || 0) / 100)}
              className="custom-number-input"
            />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Catch rate of stars not automatically caught.
          </div>
        </div>

        <div className="config-group" style={{ marginTop: '8px', marginBottom: '8px' }}>
          <div className="config-label-row">
            <span>Obelisk Level:</span>
            <span className="stat-value highlight">Lvl {globalStats.obeliskLevel || 1}</span>
          </div>
          <div className="input-slider-container">
            <input 
              type="range" 
              min="1" 
              max="100" 
              step="1" 
              value={globalStats.obeliskLevel || 1}
              onChange={(e) => setGlobalStat('obeliskLevel', parseInt(e.target.value) || 1)}
              className="custom-slider"
            />
            <input 
              type="number" 
              min="1"
              value={globalStats.obeliskLevel || 1}
              onChange={(e) => setGlobalStat('obeliskLevel', parseInt(e.target.value) || 1)}
              className="custom-number-input"
            />
          </div>
        </div>

        <div className="stat-row">
          <span className="stat-label">Floors / Hr:</span>
          <span className="stat-value">{Math.round(stats.floorsPerHour)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Catch Chance (Auto):</span>
          <span className="stat-value">{Math.round(stats.totalAutoCatchChance * 100)}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Catch Rate (Total):</span>
          <span className="stat-value">{Math.round(stats.totalCatchRate * 100)}%</span>
        </div>
        <div className="stat-row" style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '6px', marginTop: '6px' }}>
          <span className="stat-label">Star Spawn Mult:</span>
          <span className="stat-value highlight">x{stats.starSpawnRateMult.toFixed(2)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Star Spawn Chance:</span>
          <span className="stat-value">{(stats.starSpawnChance * 100).toFixed(2)}%</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Super Star Spawn Mult:</span>
          <span className="stat-value highlight">x{stats.superStarSpawnRateMult.toFixed(2)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Super Star Chance:</span>
          <span className="stat-value">{(stats.superStarSpawnChance * 100).toFixed(4)}%</span>
        </div>
      </div>

      {/* Advanced configuration */}
      <div>
        <div 
          className={`dashboard-section-title collapsible-header ${!showAdvanced ? 'collapsed' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Custom Modifiers
        </div>
        
        {showAdvanced && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <div className="config-group">
              <div className="config-label-row">
                <span>Star Upgrade Cap Bonus:</span>
                <span className="stat-value">+{globalStats.starUpgradeCapBonus}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="10" 
                step="1" 
                value={globalStats.starUpgradeCapBonus}
                onChange={(e) => setGlobalStat('starUpgradeCapBonus', parseInt(e.target.value) || 0)}
                className="custom-slider"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Star SN Multi (+%):
                </label>
                <input 
                  type="number"
                  step="0.1"
                  value={globalStats.starSupernovaMultiplier}
                  onChange={(e) => setGlobalStat('starSupernovaMultiplier', parseFloat(e.target.value) || 0.0)}
                  className="custom-number-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Super Star SN (+%):
                </label>
                <input 
                  type="number"
                  step="0.1"
                  value={globalStats.superStarSupernovaMultiplier}
                  onChange={(e) => setGlobalStat('superStarSupernovaMultiplier', parseFloat(e.target.value) || 0.0)}
                  className="custom-number-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Star SG Multi (+%):
                </label>
                <input 
                  type="number"
                  step="0.1"
                  value={globalStats.starSupergiantMultiplier}
                  onChange={(e) => setGlobalStat('starSupergiantMultiplier', parseFloat(e.target.value) || 0.0)}
                  className="custom-number-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Super Star SG (+%):
                </label>
                <input 
                  type="number"
                  step="0.1"
                  value={globalStats.superStarSupergiantMultiplier}
                  onChange={(e) => setGlobalStat('superStarSupergiantMultiplier', parseFloat(e.target.value) || 0.0)}
                  className="custom-number-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Star Radiant Ch. (%):
                </label>
                <input 
                  type="number"
                  step="0.01"
                  value={(globalStats.starRadiantChance * 100).toFixed(2)}
                  onChange={(e) => setGlobalStat('starRadiantChance', (parseFloat(e.target.value) || 0.0) / 100)}
                  className="custom-number-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                  Super SN Ch. (%):
                </label>
                <input 
                  type="number"
                  step="0.01"
                  value={(globalStats.superStarSupernovaChance * 100).toFixed(2)}
                  onChange={(e) => setGlobalStat('superStarSupernovaChance', (parseFloat(e.target.value) || 0.0) / 100)}
                  className="custom-number-input"
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                Novagiant Combo Multi:
              </label>
              <input 
                type="number"
                step="0.1"
                value={globalStats.novagiantComboMultiplier}
                onChange={(e) => setGlobalStat('novagiantComboMultiplier', parseFloat(e.target.value) || 1.0)}
                className="custom-number-input"
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Drones & Relics collapsible block */}
      <div>
        <div 
          className={`dashboard-section-title collapsible-header ${!showDroneRelic ? 'collapsed' : ''}`}
          onClick={() => setShowDroneRelic(!showDroneRelic)}
        >
          Drones, Relics, Contracts & Items
        </div>

        {showDroneRelic && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            
            {/* Relic configuration */}
            <div className="config-group" style={{ marginBottom: '6px' }}>
              <div className="config-label-row">
                <span>Relic Level:</span>
                <span className="stat-value highlight">Lvl {globalStats.relicLevel} (+{(globalStats.relicLevel * 0.1).toFixed(1)}%)</span>
              </div>
              <div className="input-slider-container">
                <input 
                  type="range" 
                  min="0" 
                  max="300" 
                  step="1" 
                  value={globalStats.relicLevel}
                  onChange={(e) => setGlobalStat('relicLevel', parseInt(e.target.value) || 0)}
                  className="custom-slider"
                />
                <input 
                  type="number"
                  value={globalStats.relicLevel}
                  onChange={(e) => setGlobalStat('relicLevel', parseInt(e.target.value) || 0)}
                  className="custom-number-input"
                />
              </div>
            </div>

            {/* Contract Level configuration */}
            <div className="config-group" style={{ marginBottom: '6px', borderTop: '1px dashed var(--border-light)', paddingTop: '8px' }}>
              <div className="config-label-row">
                <span>Contract Level (Super Star Rate):</span>
                <span className="stat-value highlight">Lvl {globalStats.contractLevel} (+{(globalStats.contractLevel * 3)}%)</span>
              </div>
              <div className="input-slider-container">
                <input 
                  type="range" 
                  min="0" 
                  max="19" 
                  step="1" 
                  value={globalStats.contractLevel}
                  onChange={(e) => setGlobalStat('contractLevel', parseInt(e.target.value) || 0)}
                  className="custom-slider"
                />
                <input 
                  type="number"
                  value={globalStats.contractLevel}
                  onChange={(e) => setGlobalStat('contractLevel', parseInt(e.target.value) || 0)}
                  className="custom-number-input"
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                Starburst Drone
              </span>

              {/* Drone Grade */}
              <div className="config-group" style={{ opacity: globalStats.droneFueled ? 1.0 : 0.4, transition: 'opacity var(--transition-fast)' }}>
                <div className="config-label-row">
                  <span>Drone Grade:</span>
                  <span className="stat-value">Grade {globalStats.droneGrade}</span>
                </div>
                <div className="input-slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="60" 
                    step="1" 
                    value={globalStats.droneGrade}
                    disabled={!globalStats.droneFueled}
                    onChange={(e) => setGlobalStat('droneGrade', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input 
                    type="number"
                    value={globalStats.droneGrade}
                    disabled={!globalStats.droneFueled}
                    onChange={(e) => setGlobalStat('droneGrade', parseInt(e.target.value) || 0)}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  +{globalStats.droneFueled ? 15 + globalStats.droneGrade * 3 : 0}% Star Spawn Rate
                </div>
              </div>

              {/* Drone Level Active */}
              <div className="stat-row" style={{ padding: '4px 0', borderTop: '1px dashed var(--border-light)', marginTop: '8px', paddingTop: '8px' }}>
                <span className="stat-label">Enable Drone Level:</span>
                <input 
                  type="checkbox" 
                  className="star-checkbox"
                  checked={!!globalStats.droneLevelActive}
                  onChange={(e) => setGlobalStat('droneLevelActive', e.target.checked)}
                />
              </div>

              {/* Drone Level */}
              <div className="config-group" style={{ opacity: globalStats.droneLevelActive ? 1.0 : 0.4, transition: 'opacity var(--transition-fast)' }}>
                <div className="config-label-row">
                  <span>Drone Level:</span>
                  <span className="stat-value">Level {globalStats.droneLevel}</span>
                </div>
                <div className="input-slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="15" 
                    step="1" 
                    value={globalStats.droneLevel}
                    disabled={!globalStats.droneLevelActive}
                    onChange={(e) => setGlobalStat('droneLevel', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input 
                    type="number"
                    value={globalStats.droneLevel}
                    disabled={!globalStats.droneLevelActive}
                    onChange={(e) => setGlobalStat('droneLevel', parseInt(e.target.value) || 0)}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  +{globalStats.droneLevelActive ? 6 + globalStats.droneLevel : 0}% Triple Star Chance
                </div>
              </div>

            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                Elixir Drone
              </span>

              {/* Elixir Drone Level */}
              <div className="config-group">
                <div className="config-label-row">
                  <span>Elixir Drone Level:</span>
                  <span className="stat-value">Level {globalStats.elixirDroneLevel || 0}</span>
                </div>
                <div className="input-slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="15" 
                    step="1" 
                    value={globalStats.elixirDroneLevel || 0}
                    onChange={(e) => setGlobalStat('elixirDroneLevel', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input 
                    type="number"
                    value={globalStats.elixirDroneLevel || 0}
                    onChange={(e) => setGlobalStat('elixirDroneLevel', parseInt(e.target.value) || 0)}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  Buff Cooldown: {360 - 15 * (globalStats.elixirDroneLevel || 0)}s (Max Level: 15)
                </div>
              </div>

              {/* Elixir Drone Grade */}
              <div className="config-group" style={{ marginTop: '8px' }}>
                <div className="config-label-row">
                  <span>Elixir Drone Grade:</span>
                  <span className="stat-value">Grade {globalStats.elixirDroneGrade || 0}</span>
                </div>
                <div className="input-slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    step="1" 
                    value={globalStats.elixirDroneGrade || 0}
                    onChange={(e) => setGlobalStat('elixirDroneGrade', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input 
                    type="number"
                    value={globalStats.elixirDroneGrade || 0}
                    onChange={(e) => setGlobalStat('elixirDroneGrade', parseInt(e.target.value) || 0)}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  +{60 + 6 * (globalStats.elixirDroneGrade || 0)}% Duration, +{210 + 10.5 * (globalStats.elixirDroneGrade || 0)}s per fuel
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>
                Primal Meat Item
              </span>

              {/* Primal Meat Active Checkbox */}
              <div className="stat-row" style={{ padding: '4px 0' }}>
                <span className="stat-label">Active:</span>
                <input 
                  type="checkbox" 
                  className="star-checkbox"
                  checked={!!globalStats.primalMeatActive}
                  onChange={(e) => setGlobalStat('primalMeatActive', e.target.checked)}
                />
              </div>

              {/* Athena Idol Level */}
              <div className="config-group" style={{ opacity: globalStats.primalMeatActive ? 1.0 : 0.4, transition: 'opacity var(--transition-fast)' }}>
                <div className="config-label-row">
                  <span>Athena Idol Level:</span>
                  <span className="stat-value">Lvl {globalStats.athenaIdolLevel}</span>
                </div>
                <div className="input-slider-container">
                  <input 
                    type="range" 
                    min="0" 
                    max="500" 
                    step="1" 
                    value={globalStats.athenaIdolLevel}
                    disabled={!globalStats.primalMeatActive}
                    onChange={(e) => setGlobalStat('athenaIdolLevel', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input 
                    type="number"
                    value={globalStats.athenaIdolLevel}
                    disabled={!globalStats.primalMeatActive}
                    onChange={(e) => setGlobalStat('athenaIdolLevel', parseInt(e.target.value) || 0)}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                  +{globalStats.primalMeatActive ? (globalStats.athenaIdolLevel * 0.05).toFixed(2) : 0}% Super Star Spawn Chance
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Non-stargazing active perks dashboard */}
      <div>
        <div 
          className={`dashboard-section-title collapsible-header ${!showOtherPerks ? 'collapsed' : ''}`}
          onClick={() => setShowOtherPerks(!showOtherPerks)}
        >
          Other Active Perks
        </div>

        {showOtherPerks && (
          <div className="active-stats-grid" style={{ marginTop: '8px' }}>
            {Object.keys(stats.activeOtherPerks).map((key) => {
              const val = stats.activeOtherPerks[key];
              if (val === 0 || val === 1) return null; // Hide if not active
              
              // Format descriptions
              let label = key.replace(/([A-Z])/g, ' $1');
              label = label.charAt(0).toUpperCase() + label.slice(1);
              
              let suffix = "%";
              if (key === "workshopCap" || key === "petLevelCap" || key === "bankedFreebieCap" || key === "bankedLootbugCap" || key === "cardGradeCaps") {
                suffix = "";
              } else if (
                key === "goldenFloorMulti" || 
                key === "rainbowFloorMulti" || 
                key === "polychromeOreCardMulti" ||
                key === "coalProductionSpeedMultiplier" ||
                key === "fishingTickSpeedMultiplier" ||
                key === "oreMultiplier" ||
                key === "averageGameSpeedBuff"
              ) {
                suffix = "x";
              }

              const isMult = suffix === "x";
              const displayVal = isMult
                ? `${val.toFixed(2)}x`
                : `${val > 0 ? '+' : ''}${val.toFixed(2).replace(/\.00$/, '')}${suffix}`;

              return (
                <div key={key} className="active-stat-item">
                  <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                  <span style={{ color: 'var(--color-accent-teal)', fontWeight: '600' }}>{displayVal}</span>
                </div>
              );
            })}
            {Object.values(stats.activeOtherPerks).every(v => v === 0 || v === 1) && (
              <div style={{ gridColumn: 'span 2', color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                No external perks currently active. Upgrade stars to see bonuses here!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
