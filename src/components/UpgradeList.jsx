import { useState, useEffect } from 'react';

export function UpgradeList({ upgrades, upgradeLevels, setUpgradeLevel, trackedUpgrades, toggleTrackUpgrade }) {
  const [hideMaxed, setHideMaxed] = useState(() => {
    const saved = localStorage.getItem('iom_upgrades_hide_maxed');
    return saved ? saved === 'true' : false;
  });
  const telescopeLevel = upgradeLevels.upgradeTelescope || 0;
  const capperUpperLevel = upgradeLevels.capperUpper || 0;

  useEffect(() => {
    localStorage.setItem('iom_upgrades_hide_maxed', hideMaxed);
  }, [hideMaxed]);

  const filteredUpgrades = hideMaxed 
    ? upgrades.filter(upgrade => {
        const currentLevel = upgradeLevels[upgrade.id] || 0;
        const maxLevel = upgrade.affectedByCapperUpper 
          ? upgrade.maxLevel + (capperUpperLevel * 5) 
          : upgrade.maxLevel;
        return currentLevel < maxLevel;
      })
    : upgrades;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
        <input 
          type="checkbox"
          id="hide-maxed-upgrades"
          className="star-checkbox"
          checked={hideMaxed}
          onChange={(e) => setHideMaxed(e.target.checked)}
        />
        <label htmlFor="hide-maxed-upgrades" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
          Hide Maxed Upgrades
        </label>
      </div>

      <div className="grid-container">
        {filteredUpgrades.map((upgrade) => {
          const isLocked = upgrade.telescopeReq !== null && telescopeLevel < upgrade.telescopeReq;
          const currentLevel = upgradeLevels[upgrade.id] || 0;
          
          // Calculate dynamic max level based on Capper Upper level
          const baseMax = upgrade.maxLevel;
          const maxLevel = upgrade.affectedByCapperUpper 
            ? baseMax + (capperUpperLevel * 5) 
            : baseMax;

          const totalBonus = currentLevel * upgrade.valuePerLevel;
          const formattedBonus = upgrade.id === "allStarMultiplier"
            ? `+${totalBonus.toFixed(2)}x`
            : `+${totalBonus.toFixed(2).replace(/\.00$/, '')}${upgrade.unit}`;

          return (
            <div 
              key={upgrade.id} 
              className={`glass-panel glass-card upgrade-card ${isLocked ? 'locked' : ''}`}
            >
              {isLocked && (
                <div className="lock-overlay">
                  <div className="lock-icon">🔒</div>
                  <div className="lock-text">
                    Requires Telescope Level {upgrade.telescopeReq}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    (Current: {telescopeLevel})
                  </div>
                </div>
              )}

              <div className="upgrade-body">
                <div className="star-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="star-name">{upgrade.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input 
                      type="checkbox"
                      id={`track-${upgrade.id}`}
                      className="star-checkbox"
                      checked={!!trackedUpgrades[upgrade.id]}
                      onChange={() => toggleTrackUpgrade(upgrade.id)}
                    />
                    <label htmlFor={`track-${upgrade.id}`} style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                      Track
                    </label>
                  </div>
                </div>
                
                <div className="upgrade-desc">
                  {upgrade.description}
                </div>

                <div style={{ margin: '8px 0', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Current Effect:</span>
                  <span style={{ color: 'var(--color-accent-teal)', fontWeight: '600' }}>{formattedBonus}</span>
                </div>

                <div className="level-controls">
                  <button 
                    type="button"
                    className="lvl-btn"
                    onClick={() => setUpgradeLevel(upgrade.id, currentLevel - 1)}
                    disabled={currentLevel <= 0}
                  >
                    -
                  </button>
                  <div>
                    <div className="lvl-value">
                      Lvl {currentLevel}
                    </div>
                    <span className="lvl-max-label">
                      Max: {maxLevel}
                    </span>
                  </div>
                  <button 
                    type="button"
                    className="lvl-btn"
                    onClick={() => setUpgradeLevel(upgrade.id, currentLevel + 1)}
                    disabled={currentLevel >= maxLevel}
                  >
                    +
                  </button>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <input
                    type="range"
                    min="0"
                    max={maxLevel}
                    value={currentLevel}
                    onChange={(e) => setUpgradeLevel(upgrade.id, parseInt(e.target.value) || 0)}
                    className="custom-slider"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
