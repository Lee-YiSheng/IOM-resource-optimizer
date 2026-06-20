export function UpgradeList({ upgrades, upgradeLevels, setUpgradeLevel }) {
  const telescopeLevel = upgradeLevels.upgradeTelescope || 0;
  const capperUpperLevel = upgradeLevels.capperUpper || 0;

  return (
    <div className="grid-container">
      {upgrades.map((upgrade) => {
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
              <div className="star-header">
                <div className="star-name">{upgrade.name}</div>
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
  );
}
