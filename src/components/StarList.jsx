import { useState } from 'react';

const STAR_ORDER_INFO = [
  { index: 1, name: "Aries (1st)" },
  { index: 2, name: "Taurus (2nd)" },
  { index: 3, name: "Gemini (3rd)" },
  { index: 4, name: "Cancer - Aquarius (4th)" },
  { index: 5, name: "Cancer - Aquarius (5th)" },
  { index: 6, name: "Cancer - Aquarius (6th)" },
  { index: 7, name: "Cancer - Aquarius (7th)" },
  { index: 8, name: "Cancer - Aquarius (8th)" },
  { index: 9, name: "Cancer - Aquarius (9th)" },
  { index: 10, name: "Cancer - Aquarius (10th)" },
  { index: 11, name: "Cancer - Aquarius (11th)" },
  { index: 12, name: "Pisces (12th)" },
  { index: 13, name: "Ophiuchus (13th)" },
  { index: 14, name: "Orion (14th)" },
  { index: 15, name: "Hercules (15th)" },
  { index: 16, name: "Draco (16th)" },
  { index: 17, name: "Cetus (17th)" },
  { index: 18, name: "Phoenix (18th)" },
  { index: 19, name: "Eridanus (19th)" },
];

const getGemsNeeded = (current, target) => {
  let gems = 0;
  for (let n = current; n < target; n++) {
    if (n === 0) {
      gems += 1;
    } else {
      gems += 250 * (n + 1);
    }
  }
  return gems;
};

const getStarOrderLabel = (stars, starId) => {
  const idx = stars.findIndex(s => s.id === starId);
  if (idx === 0) return "1st Star";
  if (idx === 1) return "2nd Star";
  if (idx === 2) return "3rd Star";
  if (idx >= 3 && idx <= 10) return "4th - 11th (Random)";
  if (idx >= 11) return `${idx + 1}th Star`;
  return "";
};

export function StarList({ stars, starLevels, starUnlocked, setStarLevel, toggleStarUnlock, starUpgradeCapBonus }) {
  const [hideMaxed, setHideMaxed] = useState(false);
  const [targetStarIndex, setTargetStarIndex] = useState(12);

  const filteredStars = hideMaxed 
    ? stars.filter(star => {
        const currentLevel = starLevels[star.id] || 0;
        const maxLevel = star.maxLevel + starUpgradeCapBonus;
        return currentLevel < maxLevel;
      })
    : stars;

  const currentUnlockedCount = Object.values(starUnlocked).filter(Boolean).length;
  const nextStarCost = currentUnlockedCount === 0 ? 1 : 250 * (currentUnlockedCount + 1);
  const gemsNeeded = getGemsNeeded(currentUnlockedCount, targetStarIndex);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Gem Unlock Calculator Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 className="dashboard-section-title" style={{ fontSize: '1rem', marginBottom: '12px', borderBottom: '1px dashed var(--border-light)', paddingBottom: '8px' }}>
          💎 Star Unlock & Gem Calculator
        </h3>
        
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Current Stars Unlocked:</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--color-accent-teal)', fontFamily: 'var(--font-mono)' }}>
              {currentUnlockedCount} / 19
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              Next Star Cost: {nextStarCost.toLocaleString()} gems
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Target Star Unlock Level:</div>
            <select
              value={targetStarIndex}
              onChange={(e) => setTargetStarIndex(parseInt(e.target.value))}
              className="custom-number-input"
              style={{ width: '220px', textAlign: 'left', padding: '6px', height: '36px', borderRadius: '6px' }}
            >
              {STAR_ORDER_INFO.map(item => (
                <option key={item.index} value={item.index}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            {targetStarIndex > currentUnlockedCount ? (
              <>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                  Gems needed to reach target ({targetStarIndex - currentUnlockedCount} more):
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--color-star)', textShadow: '0 0 8px var(--color-star-glow)', fontFamily: 'var(--font-mono)' }}>
                  💎 {gemsNeeded.toLocaleString()}
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.95rem', color: 'var(--color-accent-emerald)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}>
                <span>🎉 Target reached!</span>
              </div>
            )}
          </div>
        </div>
      </div>

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
              <div className="star-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div className="star-title-row">
                  <input 
                    type="checkbox"
                    id={`unlock-${star.id}`}
                    className="star-checkbox"
                    checked={isUnlocked}
                    onChange={() => toggleStarUnlock(star.id)}
                  />
                  <label htmlFor={`unlock-${star.id}`} className="star-name" style={{ cursor: 'pointer' }}>
                    {star.name}
                  </label>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  {getStarOrderLabel(stars, star.id)}
                </span>
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
