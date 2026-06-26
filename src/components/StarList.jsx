import { useState, useMemo, useCallback } from 'react';
import { VEINS } from '../data/veins';

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

export function StarList({ 
  stars, 
  starLevels, 
  starUnlocked, 
  desiredStars, 
  setStarLevel, 
  toggleStarUnlock, 
  toggleDesiredStar, 
  starUpgradeCapBonus, 
  starFloors,
  recommendations,
  optTarget,
  veinsNeeded = {},
  hiddenVeins = {},
  toggleHiddenVein
}) {
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

  const isRegular = optTarget === 'regular';
  const top5Upgrades = useMemo(() => {
    if (!recommendations?.upgradeRecs) return [];
    return [...recommendations.upgradeRecs]
      .sort((a, b) => isRegular ? b.deltaReg - a.deltaReg : b.deltaSuper - a.deltaSuper)
      .filter(r => isRegular ? r.deltaReg > 0.0001 : r.deltaSuper > 0.0001)
      .slice(0, 5);
  }, [recommendations, isRegular]);

  const top5VeinNamesNormalized = useMemo(() => {
    return top5Upgrades.map(rec => {
      if (!rec.vein) return '';
      return rec.vein.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
    }).filter(Boolean);
  }, [top5Upgrades]);

  const isVeinNeededInTracked = useCallback((veinKey) => {
    if (!veinKey || !veinsNeeded) return false;
    const norm = veinKey.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
    return Object.entries(veinsNeeded).some(([key, amount]) => {
      if (amount <= 0) return false;
      const normKey = key.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
      return normKey === norm;
    });
  }, [veinsNeeded]);

  const getVeinDisplayName = (veinKey) => {
    if (!veinKey) return '';
    const searchId = veinKey.toLowerCase() + 'vein';
    const match = VEINS.find(v => v.id.toLowerCase() === searchId);
    return match ? match.name : (veinKey.charAt(0).toUpperCase() + veinKey.slice(1) + ' Vein');
  };

  const floorsByVein = useMemo(() => {
    const groups = {};
    (starFloors || []).forEach(floorData => {
      const normFVein = floorData.vein.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
      const isVeinInTop5 = top5VeinNamesNormalized.includes(normFVein);
      const isVeinInTracked = isVeinNeededInTracked(floorData.vein);

      const floorDesiredStars = floorData.stars.filter(s => desiredStars && desiredStars[s]);
      const floorUnlockedStars = floorData.stars.filter(s => starUnlocked && starUnlocked[s]);

      const shouldInclude = floorDesiredStars.length > 0 || ((isVeinInTop5 || isVeinInTracked) && floorUnlockedStars.length > 0);

      if (shouldInclude) {
        const veinName = getVeinDisplayName(floorData.vein);
        if (!groups[veinName]) {
          groups[veinName] = [];
        }
        groups[veinName].push({
          ...floorData,
          desiredStarsOnFloor: floorDesiredStars,
          unlockedStarsOnFloor: floorUnlockedStars,
          isForTop5UpgradeVein: isVeinInTop5,
          isForTrackedUpgradeVein: isVeinInTracked
        });
      }
    });
    return groups;
  }, [starFloors, desiredStars, starUnlocked, top5VeinNamesNormalized, isVeinNeededInTracked]);

  const sortedVeins = useMemo(() => {
    return Object.keys(floorsByVein).sort((a, b) => {
      const indexA = VEINS.findIndex(v => v.name === a);
      const indexB = VEINS.findIndex(v => v.name === b);
      return indexA - indexB;
    });
  }, [floorsByVein]);

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

      {sortedVeins.length > 0 && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="dashboard-section-title" style={{ fontSize: '1rem', marginBottom: '16px', borderBottom: '1px dashed var(--border-light)', paddingBottom: '8px' }}>
            ⛏️ Vein Floors
          </h3>

          {/* Hidden Veins Control Bar */}
          {(() => {
            const currentHiddenVeins = Object.keys(hiddenVeins).filter(k => hiddenVeins[k] && sortedVeins.includes(k));
            if (currentHiddenVeins.length === 0) return null;
            return (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px', 
                marginBottom: '16px', 
                padding: '8px 12px', 
                backgroundColor: 'rgba(255,255,255,0.02)', 
                borderRadius: '6px', 
                border: '1px solid rgba(255,255,255,0.05)', 
                alignItems: 'center' 
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Hidden Veins:</span>
                {currentHiddenVeins.map(vn => (
                  <button
                    key={vn}
                    type="button"
                    onClick={() => toggleHiddenVein(vn)}
                    style={{ 
                      padding: '2px 8px', 
                      fontSize: '0.7rem', 
                      borderRadius: '4px', 
                      backgroundColor: 'rgba(255,255,255,0.04)', 
                      border: '1px solid var(--border-light)', 
                      color: 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {vn} ➕
                  </button>
                ))}
              </div>
            );
          })()}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {sortedVeins
              .filter(vn => !hiddenVeins[vn])
              .map(veinName => {
                const floors = floorsByVein[veinName];
                const hasAnyDesiredStarsInVein = floors.some(f => f.desiredStarsOnFloor.length > 0);

                // Graded highlight based on tracked vein requirements
                const getVeinNeededAmount = (vName) => {
                  if (!vName || !veinsNeeded) return 0;
                  const norm = vName.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
                  const foundEntry = Object.entries(veinsNeeded).find(([key]) => {
                    const normKey = key.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
                    return normKey === norm;
                  });
                  return foundEntry ? foundEntry[1] : 0;
                };

                const neededAmt = getVeinNeededAmount(veinName);
                const isNeededVein = neededAmt > 0;

                let highlightBorder = hasAnyDesiredStarsInVein ? '1px solid rgba(255,255,255,0.05)' : '1px dashed rgba(255,255,255,0.15)';
                let highlightBg = 'transparent';
                let highlightShadow = 'none';
                let priorityBadgeText = '';
                let isHighPriority = false;

                if (isNeededVein) {
                  if (neededAmt < 100000) {
                    highlightBorder = '1px solid rgba(255, 179, 0, 0.25)';
                    highlightBg = 'rgba(255, 179, 0, 0.02)';
                    priorityBadgeText = '📌';
                  } else if (neededAmt < 5000000) {
                    highlightBorder = '1px solid rgba(255, 179, 0, 0.5)';
                    highlightBg = 'rgba(255, 179, 0, 0.04)';
                    priorityBadgeText = '📌📌';
                  } else {
                    highlightBorder = '1px solid rgba(255, 179, 0, 0.85)';
                    highlightBg = 'rgba(255, 179, 0, 0.08)';
                    highlightShadow = '0 0 6px rgba(255, 179, 0, 0.25)';
                    priorityBadgeText = '🔥 Priority 📌';
                    isHighPriority = true;
                  }
                }

                // Check if any recommended top 5 upgrades require this vein
                const matchingRecs = top5Upgrades.filter(rec => {
                  if (!rec.vein) return false;
                  const normRec = rec.vein.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
                  const normV = veinName.toLowerCase().replace(/\s*vein\s*/g, "").replace(/\s+/g, "").trim();
                  return normRec === normV;
                });

                let top5UpgradeLabel = '';
                if (matchingRecs.length > 0) {
                  const names = matchingRecs.map(rec => {
                    if (rec.id === 'starSpawnRate') return 'star spawn';
                    if (rec.id === 'superStarSpawnRate') return 'super star spawn';
                    if (rec.id === 'doubleStarChance') return 'double star';
                    return rec.name.toLowerCase();
                  });
                  top5UpgradeLabel = names.join(', ');
                }

                return (
                  <div 
                    key={veinName} 
                    className="vein-segment" 
                    style={{ 
                      borderLeft: isNeededVein 
                        ? (isHighPriority ? '3px solid rgba(255, 179, 0, 0.85)' : '3px solid rgba(255, 179, 0, 0.5)')
                        : (hasAnyDesiredStarsInVein ? '3px solid var(--color-accent-teal)' : '3px dashed rgba(255,255,255,0.2)'),
                      borderTop: highlightBorder,
                      borderRight: highlightBorder,
                      borderBottom: highlightBorder,
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: highlightBg,
                      boxShadow: highlightShadow,
                      opacity: hasAnyDesiredStarsInVein ? 1.0 : 0.6,
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold', 
                        color: hasAnyDesiredStarsInVein ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.5px',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        ⛏️ {veinName}
                        {top5UpgradeLabel && (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            fontWeight: '600', 
                            color: 'var(--color-accent-teal)', 
                            textTransform: 'lowercase',
                            backgroundColor: 'rgba(20, 184, 166, 0.1)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}>
                            {top5UpgradeLabel}
                          </span>
                        )}
                        {priorityBadgeText && (
                          <span style={{ fontSize: '0.7rem' }}>
                            {priorityBadgeText}
                          </span>
                        )}
                        {!hasAnyDesiredStarsInVein && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 'normal', fontStyle: 'italic', textTransform: 'none', color: 'var(--color-text-muted)' }}>
                            (No Desired Stars)
                          </span>
                        )}
                      </h4>
                      <button
                        type="button"
                        onClick={() => toggleHiddenVein(veinName)}
                        title={`Hide ${veinName}`}
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'var(--color-text-muted)', 
                          fontSize: '0.7rem', 
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                        onMouseOver={(e) => e.target.style.color = 'var(--color-text-primary)'}
                        onMouseOut={(e) => e.target.style.color = 'var(--color-text-muted)'}
                      >
                        ✕ Hide
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                      {floors.map(floorData => (
                        <div key={floorData.floor} style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-accent-teal)' }}>
                            Floor {floorData.floor}
                          </div>
                          <div style={{ fontSize: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                            {floorData.stars.map((s, idx) => {
                              const starName = stars.find(st => st.id === s)?.name || s;
                              const isDesired = !!(desiredStars && desiredStars[s]);
                              const isUnlocked = !!(starUnlocked && starUnlocked[s]);

                              let starColor = 'var(--color-text-muted)';
                              let starWeight = 'normal';
                              if (isDesired) {
                                starColor = 'var(--color-star)';
                                starWeight = '600';
                              } else if (isUnlocked) {
                                starColor = 'var(--color-accent-teal)';
                              }

                              return (
                                <span key={s} style={{ color: starColor, fontWeight: starWeight }}>
                                  {starName}{isDesired ? '★' : ''}{idx < floorData.stars.length - 1 ? ',' : ''}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

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
                  <label htmlFor={`unlock-${star.id}`} className="star-name" style={{ cursor: 'pointer', marginRight: '8px' }}>
                    {star.name}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-text-secondary)', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                    <input 
                      type="checkbox"
                      checked={!!(desiredStars && desiredStars[star.id])}
                      onChange={() => toggleDesiredStar(star.id)}
                    />
                    Desire
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
