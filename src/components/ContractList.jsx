import { useState } from 'react';
import { getContractCost } from '../data/contracts';

export function ContractList({ 
  contracts, 
  contractLevels, 
  setContractLevel, 
  recommendations, 
  optTarget,
  contractUpgradeCapIncrease = 0,
  currentReg = 0,
  currentSuper = 0,
  currentVein = 0
}) {
  const [activeWorld, setActiveWorld] = useState('all');
  const [hideMaxed, setHideMaxed] = useState(false);

  // Group recommendations by contract ID for quick access
  const contractRecsMap = new Map();
  if (recommendations && recommendations.contractRecs) {
    recommendations.contractRecs.forEach(rec => {
      contractRecsMap.set(rec.id, rec);
    });
  }

  const filteredContracts = contracts.filter(contract => {
    const maxLevel = contract.maxLevel + contractUpgradeCapIncrease;
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

  // Format Efficiency Helper (formats as percentage increase/CP)
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="checkbox"
            id="hide-maxed-contracts"
            className="star-checkbox"
            checked={hideMaxed}
            onChange={(e) => setHideMaxed(e.target.checked)}
          />
          <label htmlFor="hide-maxed-contracts" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
            Hide Maxed Contracts
          </label>
        </div>
      </div>

      {/* Grid of Contracts */}
      <div className="grid-container">
        {filteredContracts.map((contract) => {
          const currentLevel = contractLevels[contract.id] || 0;
          const maxLevel = contract.maxLevel + contractUpgradeCapIncrease;
          const rec = contractRecsMap.get(contract.id);

          // Calculate current bonus value
          const totalBonus = currentLevel * contract.valuePerLevel;
          let formattedBonus = `${totalBonus > 0 ? '+' : ''}${totalBonus.toFixed(2).replace(/\.00$/, '')}${contract.unit}`;
          if (contract.id === "upgradeBarCost") {
            formattedBonus = `${totalBonus}%`;
          }

          // Calculate next level cost
          const nextCost = currentLevel < maxLevel ? getContractCost(contract.id, currentLevel + 1) : 0;

          // Efficiency logic
          let efficiencyLabel = null;
          if (rec && nextCost > 0) {
            const isVeinContract = ['veinIncomeMultiplier', 'goldenVeinChance'].includes(contract.id);
            const isSuperStarContract = ['superStarSpawnRate', 'supernovaChance'].includes(contract.id);
            
            if (isVeinContract && rec.deltaVein > 0 && currentVein > 0) {
              const effVein = ((rec.deltaVein / currentVein) * 100) / nextCost;
              efficiencyLabel = `+${formatEfficiency(effVein)} Veins/CP`;
            } else if (isSuperStarContract && rec.deltaSuper > 0 && currentSuper > 0) {
              const effSuper = ((rec.deltaSuper / currentSuper) * 100) / nextCost;
              efficiencyLabel = `+${formatEfficiency(effSuper)} S.Stars/CP`;
            } else {
              // Game speed or general contracts affect multiple things
              if (optTarget === 'super' && rec.deltaSuper > 0 && currentSuper > 0) {
                const effSuper = ((rec.deltaSuper / currentSuper) * 100) / nextCost;
                efficiencyLabel = `+${formatEfficiency(effSuper)} S.Stars/CP`;
              } else if (rec.deltaReg > 0 && currentReg > 0) {
                const effReg = ((rec.deltaReg / currentReg) * 100) / nextCost;
                efficiencyLabel = `+${formatEfficiency(effReg)} Stars/CP`;
              } else if (rec.deltaVein > 0 && currentVein > 0) {
                const effVein = ((rec.deltaVein / currentVein) * 100) / nextCost;
                efficiencyLabel = `+${formatEfficiency(effVein)} Veins/CP`;
              }
            }
          }

          return (
            <div 
              key={contract.id} 
              className={`glass-panel glass-card star-card ${currentLevel > 0 ? 'active' : ''}`}
              style={{ padding: '16px' }}
            >
              <div className="upgrade-body" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Header */}
                <div className="star-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="star-name" style={{ fontSize: '1rem', lineHeight: '1.2' }}>{contract.name}</div>
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
                    }} title="Yield increase per Contract Point spent">
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
                    <span>Next Upgrade Cost:</span>
                    <span style={{ color: 'var(--color-superstar)', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
                      {nextCost.toLocaleString()} CP
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
