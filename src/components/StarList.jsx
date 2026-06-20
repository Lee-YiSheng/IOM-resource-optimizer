import { useState } from 'react';

export function StarList({ stars, starLevels, starUnlocked, setStarLevel, toggleStarUnlock, starUpgradeCapBonus }) {
  const [hideMaxed, setHideMaxed] = useState(false);

  const filteredStars = hideMaxed 
    ? stars.filter(star => {
        const currentLevel = starLevels[star.id] || 0;
        const maxLevel = star.maxLevel + starUpgradeCapBonus;
        return currentLevel < maxLevel;
      })
    : stars;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 8px' }}>
        <input 
          type="checkbox"
          id="hide-maxed-stars"
          className="star-checkbox"
          checked={hideMaxed}
          onChange={(e) => setHideMaxed(e.target.checked)}
        />
        <label htmlFor="hide-maxed-stars" style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', cursor: 'pointer', userSelect: 'none' }}>
          Hide Maxed Stars
        </label>
      </div>

      <div className="grid-container">
        {filteredStars.map((star) => {
          const isUnlocked = !!starUnlocked[star.id];
          const currentLevel = starLevels[star.id] || 0;
          const maxLevel = star.maxLevel + starUpgradeCapBonus;

          return (
            <div 
              key={star.id} 
              className={`glass-panel glass-card star-card ${isUnlocked ? 'active' : 'disabled'}`}
            >
              <div className="star-header">
                <div className="star-title-row">
                  <input 
                    type="checkbox"
                    id={`unlock-${star.id}`}
                    className="star-checkbox"
                    checked={isUnlocked}
                    onChange={() => toggleStarUnlock(star.id)}
                  />
                  <label htmlFor={`unlock-${star.id}`} className="star-name">
                    {star.name}
                  </label>
                </div>
              </div>

              <div className="perks-list">
                {star.perks.map((perk, idx) => {
                  const totalVal = currentLevel * perk.valuePerLevel;
                  const formattedVal = perk.isMultiplier 
                    ? `${(1 + currentLevel * (perk.valuePerLevel - 1)).toFixed(2)}x`
                    : `${perk.valuePerLevel > 0 && !perk.prefix ? '+' : ''}${totalVal.toFixed(2)}${perk.unit}`;

                  return (
                    <div key={idx} className="perk-item">
                      <span>{perk.name}</span>
                      <span className="perk-val">{formattedVal}</span>
                    </div>
                  );
                })}
              </div>

              <div className="level-controls">
                <button 
                  type="button"
                  className="lvl-btn"
                  onClick={() => setStarLevel(star.id, currentLevel - 1)}
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
                  onClick={() => setStarLevel(star.id, currentLevel + 1)}
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
                  onChange={(e) => setStarLevel(star.id, parseInt(e.target.value) || 0)}
                  className="custom-slider"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
