import { useState } from 'react';

export function StatDashboard({ 
  stats, 
  globalStats, 
  setGlobalStat, 
  recommendations,
  onUpgradeStar,
  onUpgradeShop
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showOtherPerks, setShowOtherPerks] = useState(false);
  const [showDroneRelic, setShowDroneRelic] = useState(false);
  const [optTarget, setOptTarget] = useState('regular');

  // Format Helper
  const formatNum = (num) => {
    if (num === undefined || isNaN(num)) return '0.00';
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
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
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
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

        {/* Stars Recommendations */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
            Best Stars upgrades
          </div>
          {(() => {
            const isRegular = optTarget === 'regular';
            const sortedStars = [...(recommendations?.starRecs || [])]
              .sort((a, b) => isRegular ? b.deltaReg - a.deltaReg : b.deltaSuper - a.deltaSuper)
              .filter(r => isRegular ? r.deltaReg > 0.0001 : r.deltaSuper > 0.0001)
              .slice(0, 3);

            if (sortedStars.length > 0) {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sortedStars.map(rec => (
                    <button 
                      key={rec.id} 
                      type="button"
                      className="suggestion-btn" 
                      onClick={() => onUpgradeStar(rec.id, rec.nextLevel)}
                      title={`Click to upgrade ${rec.name} to Lvl ${rec.nextLevel}`}
                    >
                      <div>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: '500' }}>
                          {!rec.unlocked && <span style={{ marginRight: '4px' }}>🔒</span>}
                          {rec.name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                          ({rec.currentLevel}→{rec.nextLevel})
                        </span>
                      </div>
                      <span className="suggestion-delta" style={{ color: isRegular ? 'var(--color-star)' : 'var(--color-superstar)' }}>
                        +{formatNum(isRegular ? rec.deltaReg : rec.deltaSuper)}/hr
                      </span>
                    </button>
                  ))}
                </div>
              );
            }
            return (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                No active upgrades improve this stat.
              </div>
            );
          })()}
        </div>

        {/* Shop Upgrades Recommendations */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>
            Best Shop upgrades
          </div>
          {(() => {
            const isRegular = optTarget === 'regular';
            const sortedUpgrades = [...(recommendations?.upgradeRecs || [])]
              .sort((a, b) => isRegular ? b.deltaReg - a.deltaReg : b.deltaSuper - a.deltaSuper)
              .filter(r => isRegular ? r.deltaReg > 0.0001 : r.deltaSuper > 0.0001)
              .slice(0, 3);

            if (sortedUpgrades.length > 0) {
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {sortedUpgrades.map(rec => (
                    <button 
                      key={rec.id} 
                      type="button"
                      className="suggestion-btn" 
                      onClick={() => onUpgradeShop(rec.id, rec.nextLevel)}
                      title={`Click to upgrade ${rec.name} to Lvl ${rec.nextLevel}`}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                        <span style={{ color: 'var(--color-text-primary)', fontWeight: '500' }}>{rec.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginLeft: '4px' }}>
                          ({rec.currentLevel}→{rec.nextLevel})
                        </span>
                      </div>
                      <span className="suggestion-delta" style={{ color: isRegular ? 'var(--color-star)' : 'var(--color-superstar)' }}>
                        +{formatNum(isRegular ? rec.deltaReg : rec.deltaSuper)}/hr
                      </span>
                    </button>
                  ))}
                </div>
              );
            }
            return (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                No active upgrades improve this stat.
              </div>
            );
          })()}
        </div>
      </div>

      <div>
        <h2 className="dashboard-section-title">Active Buffs</h2>
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
          <span className="stat-label">CTRL-F Unlocked:</span>
          <input 
            type="checkbox" 
            className="star-checkbox"
            checked={!!globalStats.ctrlFUnlocked}
            onChange={(e) => setGlobalStat('ctrlFUnlocked', e.target.checked)}
          />
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

              {/* Fueled Checkbox */}
              <div className="stat-row" style={{ padding: '4px 0' }}>
                <span className="stat-label">Fueled:</span>
                <input 
                  type="checkbox" 
                  className="star-checkbox"
                  checked={!!globalStats.droneFueled}
                  onChange={(e) => setGlobalStat('droneFueled', e.target.checked)}
                />
              </div>

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
              } else if (key === "goldenFloorMulti" || key === "rainbowFloorMulti" || key === "polychromeOreCardMulti") {
                suffix = "x";
              }

              const displayVal = key === "goldenFloorMulti" 
                ? `${val.toFixed(2)}x`
                : `${val > 0 && suffix !== "x" ? '+' : ''}${val.toFixed(2).replace(/\.00$/, '')}${suffix}`;

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
