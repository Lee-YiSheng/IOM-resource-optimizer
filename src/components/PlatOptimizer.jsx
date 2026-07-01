import { useState, useEffect, useMemo } from 'react';
import { calculatePlatTime } from '../engine/platCalculator';
import { STATUES } from '../data/statues';
import { ORES, normalizeOreName } from '../data/ores';

// Helper to format hours into days, hours, minutes
function formatDuration(totalHours) {
  if (totalHours === undefined || isNaN(totalHours)) return '0m';
  if (totalHours === 0) return '0m';

  const d = Math.floor(totalHours / 24);
  const h = Math.floor(totalHours % 24);
  const m = Math.round((totalHours % 1) * 60);

  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0 || d > 0) parts.push(`${h}h`);
  if (m > 0 || (d === 0 && h === 0)) parts.push(`${m}m`);

  return parts.join(' ');
}

// Format numbers to clean readable format
function formatNum(num) {
  if (num === undefined || isNaN(num)) return '0.00';
  if (num >= 1e15) return `${(num / 1e15).toFixed(2)}Qa`;
  if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(2);
}

export function PlatOptimizer({ globalStats, veinConfig, setGlobalStat }) {
  const [selectedSimFloor, setSelectedSimFloor] = useState(60);

  // --- 1. State for Plat Specific Stats ---
  const [platStats, setPlatStats] = useState(() => {
    try {
      const saved = localStorage.getItem('iom_plat_optimizer_stats');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultPlatStats, ...parsed };
        }
      }
    } catch (e) {
      // Ignore local storage errors
    }
    return defaultPlatStats;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('iom_plat_optimizer_stats', JSON.stringify(platStats));
    } catch (e) {
      // Ignore local storage errors
    }
  }, [platStats]);

  const updateStat = (key, val) => {
    setPlatStats(prev => ({ ...prev, [key]: val }));
  };

  // Run calculation
  const result = useMemo(() => {
    return calculatePlatTime(globalStats, veinConfig, platStats);
  }, [globalStats, veinConfig, platStats]);

  // Total gems cost
  const totalGems = STATUES.reduce((sum, s) => sum + s.gems, 0);

  return (
    <div className="plat-optimizer-tab" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '20px', alignItems: 'start' }}>

      {/* ===== LEFT PANEL: STATS & CONTROLS ===== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Sync Info Banner */}
        <div className="glass-panel" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, rgba(0, 0, 0, 0.4) 100%)', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🪙</span>
            <div>
              <h3 style={{ margin: 0, color: 'var(--color-star)', fontSize: '1rem', fontWeight: 600 }}>Plat Optimizer</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.3' }}>
                Simulates platinizing statues 1-9 starting from floor 60 downwards, using Void Drone portals and bar crafting calculations.
              </p>
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '12px', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.7rem' }}>
              <span style={{ color: 'var(--color-accent-emerald)' }}>⚡ Game Speed: <strong>{platStats.gameSpeedOverride ? `${platStats.gameSpeed}x (Overridden)` : `${globalStats.gameSpeed}x (Synced)`}</strong></span>
              <span style={{ color: 'var(--color-accent-teal)' }}>💤 Offline: <strong>{globalStats.offlineMode ? 'ON (0.85x)' : 'OFF'}</strong> (Synced)</span>
              <span style={{ color: 'var(--color-superstar)' }}>⛏️ Ores/Floor: <strong>{veinConfig.oresPerFloor}</strong> (Synced)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '8px' }}>
              <label className="vein-toggle-item" style={{ margin: 0, padding: 0 }}>
                <input
                  type="checkbox"
                  className="star-checkbox"
                  checked={!!platStats.gameSpeedOverride}
                  onChange={e => updateStat('gameSpeedOverride', e.target.checked)}
                />
                <span style={{ fontWeight: '500', color: platStats.gameSpeedOverride ? '#fff' : 'var(--color-text-muted)' }}>Override Game Speed</span>
              </label>

              {platStats.gameSpeedOverride && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="10"
                    value={platStats.gameSpeed}
                    onChange={e => updateStat('gameSpeed', parseFloat(e.target.value) || 1.0)}
                    className="custom-number-input"
                    style={{ width: '60px', padding: '2px 4px', fontSize: '0.75rem' }}
                  />
                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem' }}>x</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Void Drone Settings Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="dashboard-section-title" style={{ color: 'var(--color-accent-teal)', marginBottom: '16px' }}>🛸 Void Drone Configuration</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <label className="vein-toggle-item" style={{ margin: 0 }}>
              <input
                type="checkbox"
                className="star-checkbox"
                checked={!!platStats.voidDroneEquipped}
                onChange={e => updateStat('voidDroneEquipped', e.target.checked)}
              />
              <span style={{ fontWeight: '600', color: platStats.voidDroneEquipped ? '#fff' : 'var(--color-text-muted)' }}>Void Drone Equipped</span>
            </label>
          </div>

          {platStats.voidDroneEquipped && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="config-group">
                <div className="config-label-row">
                  <span>Suit Level (0-15):</span>
                  <span className="stat-value highlight">Lv {platStats.voidDroneLevel}</span>
                </div>
                <div className="input-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={platStats.voidDroneLevel}
                    onChange={e => updateStat('voidDroneLevel', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={platStats.voidDroneLevel}
                    onChange={e => updateStat('voidDroneLevel', Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Base Portal Chance: 10% + 2% per level (Currently: <strong>{10 + 2 * (platStats.voidDroneLevel || 0)}%</strong>)
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="config-group">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Portal Chance (%):</span>
                  <input
                    type="number"
                    step="0.1"
                    value={platStats.voidPortalChance}
                    onChange={e => updateStat('voidPortalChance', parseFloat(e.target.value) || 0)}
                    className="custom-number-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Base VP Multiplier:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={platStats.baseVoidPortalMulti}
                    onChange={e => updateStat('baseVoidPortalMulti', parseFloat(e.target.value) || 0)}
                    className="custom-number-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="config-group">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Golden VP Chance (%):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={platStats.goldenVoidPortalChance}
                    onChange={e => updateStat('goldenVoidPortalChance', parseFloat(e.target.value) || 0)}
                    className="custom-number-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Golden VP Multi:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={platStats.goldenVoidMulti}
                    onChange={e => updateStat('goldenVoidMulti', parseFloat(e.target.value) || 0)}
                    className="custom-number-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="config-group">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Rainbow VP Chance (%):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={platStats.rainbowVoidPortalChance}
                    onChange={e => updateStat('rainbowVoidPortalChance', parseFloat(e.target.value) || 0)}
                    className="custom-number-input"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Rainbow VP Multi:</span>
                  <input
                    type="number"
                    step="0.1"
                    value={platStats.rainbowVoidMulti}
                    onChange={e => updateStat('rainbowVoidMulti', parseFloat(e.target.value) || 0)}
                    className="custom-number-input"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div className="config-group">
                <div className="config-label-row">
                  <span>Void Drone Grade (0-15):</span>
                  <span className="stat-value highlight" style={{ color: 'var(--color-accent-teal)' }}>Grade {platStats.voidDroneGrade !== undefined ? platStats.voidDroneGrade : 15}</span>
                </div>
                <div className="input-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={platStats.voidDroneGrade !== undefined ? platStats.voidDroneGrade : 15}
                    onChange={e => updateStat('voidDroneGrade', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={platStats.voidDroneGrade !== undefined ? platStats.voidDroneGrade : 15}
                    onChange={e => updateStat('voidDroneGrade', Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Calculated Portal Multiplier: 3.0 + (Grade × 1.0) = <strong>{(3.0 + (platStats.voidDroneGrade !== undefined ? platStats.voidDroneGrade : 15) * 1.0).toFixed(2)}x</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chain Drone Settings Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="dashboard-section-title" style={{ color: 'var(--color-star)', marginBottom: '16px' }}>⛓️ Chain Drone Configuration</h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <label className="vein-toggle-item" style={{ margin: 0 }}>
              <input
                type="checkbox"
                className="star-checkbox"
                checked={!!platStats.chainDroneEquipped}
                onChange={e => updateStat('chainDroneEquipped', e.target.checked)}
              />
              <span style={{ fontWeight: '600', color: platStats.chainDroneEquipped ? '#fff' : 'var(--color-text-muted)' }}>Chain Drone Equipped</span>
            </label>
          </div>

          {platStats.chainDroneEquipped && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="config-group">
                <div className="config-label-row">
                  <span>Chain Drone Grade (0-15):</span>
                  <span className="stat-value highlight">Grade {platStats.chainDroneGrade}</span>
                </div>
                <div className="input-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={platStats.chainDroneGrade}
                    onChange={e => updateStat('chainDroneGrade', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input
                    type="number"
                    min="0"
                    max="15"
                    value={platStats.chainDroneGrade}
                    onChange={e => updateStat('chainDroneGrade', Math.max(0, Math.min(15, parseInt(e.target.value) || 0)))}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Golden Floor Multiplier boost: <strong>×{(1.50 + (platStats.chainDroneGrade || 0) * 0.10).toFixed(2)}</strong> (+50% base, +10% per grade)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Floor Multipliers & Chance Settings */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="dashboard-section-title" style={{ color: 'var(--color-accent-violet)', marginBottom: '16px' }}>✨ Floor Modifiers</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Floor Type</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>Chance (%) / Multiplier</span>
            </div>

            {/* Golden Floor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: '500' }}>Golden Floor</span>
              <input
                type="number"
                step="0.1"
                value={platStats.goldenFloorChance}
                onChange={e => updateStat('goldenFloorChance', parseFloat(e.target.value) || 0)}
                className="custom-number-input"
                style={{ width: '100%' }}
                title="Golden Floor Chance (%)"
              />
              <input
                type="number"
                step="0.01"
                value={platStats.goldenFloorMulti}
                onChange={e => updateStat('goldenFloorMulti', parseFloat(e.target.value) || 0)}
                className="custom-number-input"
                style={{ width: '100%' }}
                title="Golden Floor Multiplier"
              />
            </div>

            {/* Rainbow Floor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-star)', fontWeight: '500' }}>Rainbow Floor</span>
              <input
                type="number"
                step="0.1"
                value={platStats.rainbowFloorChance}
                onChange={e => updateStat('rainbowFloorChance', parseFloat(e.target.value) || 0)}
                className="custom-number-input"
                style={{ width: '100%' }}
                title="Rainbow Floor Chance (%)"
              />
              <input
                type="number"
                step="0.01"
                value={platStats.rainbowFloorMulti}
                onChange={e => updateStat('rainbowFloorMulti', parseFloat(e.target.value) || 0)}
                className="custom-number-input"
                style={{ width: '100%' }}
                title="Rainbow Floor Multiplier"
              />
            </div>

            {/* Galactic Floor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-accent-teal)', fontWeight: '500' }}>Galactic Floor</span>
              <input
                type="number"
                step="0.1"
                value={platStats.galacticFloorChance}
                onChange={e => updateStat('galacticFloorChance', parseFloat(e.target.value) || 0)}
                className="custom-number-input"
                style={{ width: '100%' }}
                title="Galactic Floor Chance (%)"
              />
              <input
                type="number"
                step="0.01"
                value={platStats.galacticFloorMulti}
                onChange={e => updateStat('galacticFloorMulti', parseFloat(e.target.value) || 0)}
                className="custom-number-input"
                style={{ width: '100%' }}
                title="Galactic Floor Multiplier"
              />
            </div>

            {/* Prismatic Floor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-superstar)', fontWeight: '500' }}>Prismatic Floor</span>
              <input
                type="number"
                step="0.1"
                value={platStats.prismaticFloorChance}
                onChange={e => updateStat('prismaticFloorChance', parseFloat(e.target.value) || 0)}
                className="custom-number-input"
                style={{ width: '100%' }}
                title="Prismatic Floor Chance (%)"
              />
              <input
                type="number"
                step="0.01"
                value={platStats.prismaticFloorMulti}
                onChange={e => updateStat('prismaticFloorMulti', parseFloat(e.target.value) || 0)}
                className="custom-number-input"
                style={{ width: '100%' }}
                title="Prismatic Floor Multiplier"
              />
            </div>
          </div>
        </div>

        {/* Bomb, Transmuter, Ore & Crafting Options */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="dashboard-section-title" style={{ color: 'var(--color-star)', marginBottom: '16px' }}>💣 Bomb & Crafting Options</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Ores and General */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="config-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Triple Ore Chance (%):</span>
                <input
                  type="number"
                  step="1"
                  value={platStats.tripleOreChance}
                  onChange={e => updateStat('tripleOreChance', parseFloat(e.target.value) || 0)}
                  className="custom-number-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="config-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Ore Income Multi:</span>
                <input
                  type="number"
                  step="0.01"
                  value={platStats.oreIncomeMulti}
                  onChange={e => updateStat('oreIncomeMulti', parseFloat(e.target.value) || 0)}
                  className="custom-number-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="config-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Ore Card Multi:</span>
                <input
                  type="number"
                  step="0.01"
                  value={platStats.oreCardMulti !== undefined ? platStats.oreCardMulti : 2.0}
                  onChange={e => updateStat('oreCardMulti', parseFloat(e.target.value) || 0)}
                  className="custom-number-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* BoP and Transmuter */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="config-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>BoP Multiplier:</span>
                <input
                  type="number"
                  step="0.1"
                  value={platStats.bopMulti}
                  onChange={e => updateStat('bopMulti', parseFloat(e.target.value) || 0)}
                  className="custom-number-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="config-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>BoP Gold Ore Chance (%):</span>
                <input
                  type="number"
                  step="0.1"
                  value={platStats.bopGoldOreChance}
                  onChange={e => updateStat('bopGoldOreChance', parseFloat(e.target.value) || 0)}
                  className="custom-number-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="config-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Transmuter Multiplier:</span>
                <input
                  type="number"
                  step="1"
                  value={platStats.transmuterMulti}
                  onChange={e => updateStat('transmuterMulti', parseFloat(e.target.value) || 0)}
                  className="custom-number-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="config-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Transmuter Mark Chance (%):</span>
                <input
                  type="number"
                  step="0.1"
                  value={platStats.transmuterBopMarkChance}
                  onChange={e => updateStat('transmuterBopMarkChance', parseFloat(e.target.value) || 0)}
                  className="custom-number-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="config-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Golden Ore Chance (%):</span>
                <input
                  type="number"
                  step="0.1"
                  value={platStats.goldenOreChance}
                  onChange={e => updateStat('goldenOreChance', parseFloat(e.target.value) || 0)}
                  className="custom-number-input"
                  style={{ width: '100%' }}
                />
              </div>
              <div className="config-group">
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Golden Ore Multiplier:</span>
                <input
                  type="number"
                  step="0.1"
                  value={platStats.goldenOreMulti}
                  onChange={e => updateStat('goldenOreMulti', parseFloat(e.target.value) || 0)}
                  className="custom-number-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', marginTop: '10px', paddingTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '8px', color: 'var(--color-accent-emerald)' }}>Crafting Chances (%)</span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Free Craft:</span>
                  <input type="number" step="0.1" value={platStats.freeCraftChance} onChange={e => updateStat('freeCraftChance', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Double Craft:</span>
                  <input type="number" step="1" value={platStats.doubleCraftChance} onChange={e => updateStat('doubleCraftChance', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Triple Craft:</span>
                  <input type="number" step="1" value={platStats.tripleCraftChance} onChange={e => updateStat('tripleCraftChance', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>5x Craft:</span>
                  <input type="number" step="1" value={platStats.craft5xChance} onChange={e => updateStat('craft5xChance', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>10x Craft:</span>
                  <input type="number" step="0.1" value={platStats.craft10xChance} onChange={e => updateStat('craft10xChance', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>20x Craft:</span>
                  <input type="number" step="1" value={platStats.craft20xChance} onChange={e => updateStat('craft20xChance', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>100x Craft:</span>
                  <input type="number" step="0.1" value={platStats.craft100xChance} onChange={e => updateStat('craft100xChance', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Bar Output Multi:</span>
                  <input type="number" step="0.01" value={platStats.barOutputMulti} onChange={e => updateStat('barOutputMulti', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Bar Card Multi:</span>
                  <input type="number" step="0.01" value={platStats.barCardMulti !== undefined ? platStats.barCardMulti : 2.0} onChange={e => updateStat('barCardMulti', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px', marginTop: '12px' }}>
                <div className="config-group">
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Bar Craft Cost Multi:</span>
                  <input type="number" step="0.01" value={platStats.barCraftCost} onChange={e => updateStat('barCraftCost', parseFloat(e.target.value) || 0)} className="custom-number-input" style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Effective ores per craft:</span>
                  <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 'bold' }}>
                    {formatNum(100 * platStats.barCraftCost * Math.max(0, 1 - platStats.freeCraftChance / 100))} Ores
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ===== FLOOR FARMING SIMULATOR ===== */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="dashboard-section-title" style={{ color: 'var(--color-accent-emerald)', marginBottom: '12px' }}>📊 Floor Farming Simulator</h3>
          <p style={{ margin: '-6px 0 16px 0', fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
            Simulate and preview the exact hourly and daily yields for a specific floor with all current multipliers and Bomb of Plenty active.
          </p>

          <div className="config-group" style={{ marginBottom: '16px' }}>
            <div className="config-label-row">
              <span>Select Floor (1-60):</span>
              <span className="stat-value highlight" style={{ color: 'var(--color-accent-emerald)' }}>Floor {selectedSimFloor}</span>
            </div>
            <div className="input-slider-container">
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={selectedSimFloor}
                onChange={e => setSelectedSimFloor(parseInt(e.target.value) || 1)}
                className="custom-slider"
              />
              <input
                type="number"
                min="1"
                max="60"
                value={selectedSimFloor}
                onChange={e => setSelectedSimFloor(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
                className="custom-number-input"
              />
            </div>
          </div>

          {/* Yield calculations list */}
          {(() => {
            const yieldObj = result.floorYields && result.floorYields.find(fy => fy.floor === selectedSimFloor);
            if (!yieldObj) return <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No data for this floor.</div>;

            // Find which ores have non-zero yield on this floor
            const activeOres = ORES.filter(ore => {
              const oreName = ore.name;
              return yieldObj.oresPerHour && yieldObj.oresPerHour[oreName] > 0;
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  🗺️ <strong>Vein Type:</strong> <span style={{ color: 'var(--color-star)' }}>{yieldObj.veinName}</span>
                  <br />
                  ⛏️ <strong>Vein Yield:</strong> <span style={{ color: 'var(--color-accent-teal)' }}>{formatNum(yieldObj.veinsPerHour)}/hr</span> ({formatNum(yieldObj.veinsPerHour * 24)}/day)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeOres.map(ore => {
                    const oreName = ore.name;
                    const oreHr = yieldObj.oresPerHour[oreName] || 0;
                    const barHr = yieldObj.barsPerHour[oreName] || 0;

                    return (
                      <div key={oreName} style={{
                        padding: '12px',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '6px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px', marginBottom: '8px' }}>
                          <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>{oreName}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Cost: {ore.craftCostBase} base</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                          <div>
                            <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.65rem' }}>Ore Gains:</span>
                            <span style={{ color: 'var(--color-accent-teal)', fontWeight: '600' }}>{formatNum(oreHr)}/hr</span>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>{formatNum(oreHr * 24)}/day</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '0.65rem' }}>Bar Gains:</span>
                            <span style={{ color: 'var(--color-accent-emerald)', fontWeight: '600' }}>{formatNum(barHr)}/hr</span>
                            <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '0.65rem' }}>{formatNum(barHr * 24)}/day</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

      </div>

      {/* ===== RIGHT PANEL: RESULTS & SIMULATIONS ===== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Total Time & Gems Summary Panel */}
        <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(62, 184, 131, 0.08) 0%, rgba(212, 175, 55, 0.05) 50%, rgba(0,0,0,0.5) 100%)', border: '1px solid rgba(62, 184, 131, 0.15)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'center' }}>
            <div style={{ borderRight: '1px dashed rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Total Completion Time</div>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--color-accent-emerald)', marginTop: '8px', textShadow: '0 0 15px rgba(62, 184, 131, 0.3)' }}>
                {formatDuration(result.totalHours)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                ({(result.totalHours || 0).toFixed(1)} hours)
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Gems Cost</div>
              <div style={{ fontSize: '2.0rem', fontWeight: '800', color: '#ffd700', marginTop: '8px', textShadow: '0 0 15px rgba(255, 215, 0, 0.3)' }}>
                {totalGems.toLocaleString()} 💎
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                (9 Statues Completed)
              </div>
            </div>
          </div>
        </div>

        {/* Statue List Breakdown */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="dashboard-section-title" style={{ marginBottom: '16px' }}>🏆 Statue Completion Progress</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {STATUES.map((statue, idx) => {
              const compTime = result.statueCompletionTimes[idx];
              const isFirstOrLast = idx === 0 || idx === 8;

              return (
                <div key={statue.id} style={{
                  padding: '14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff' }}>{statue.name}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                      Cost: <span style={{ color: '#ffd700', fontWeight: '600' }}>{statue.gems} 💎</span>
                    </div>
                  </div>

                  {/* Requirements List tooltip-like expander or row */}
                  <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', flex: 1, minWidth: '240px', justifyContent: 'center' }}>
                    <div style={{ color: 'var(--color-text-muted)', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {Object.entries(statue.ores).map(([name, amt]) => (
                        <span key={name}>• {formatNum(amt)} {name}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', minWidth: '110px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Completed At</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-accent-emerald)' }}>
                      {formatDuration(compTime)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Simulated Gains Dashboard Card */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="dashboard-section-title" style={{ color: '#ffd700', marginBottom: '16px' }}>📊 Simulations & Stat Gains</h3>
          <p style={{ margin: '-10px 0 16px 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Configure individual custom increments to simulate the platinization time saved for each stat upgrade.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            {result.simulations && Object.entries(result.simulations).map(([key, sim]) => {
              const stateKey = `simIncr_${key}`;
              const val = platStats[stateKey] !== undefined ? platStats[stateKey] : 1.0;
              const stepVal = (key === 'goldenFloorMulti' || key === 'rainbowFloorMulti') ? 0.5 : (key === 'chainDroneGrade' || key === 'voidDroneGrade' ? 1 : (key === 'gameSpeed' ? 0.01 : 0.1));

              return (
                <div key={key} style={{
                  padding: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#fff' }}>{sim.nameKey}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>+</span>
                      <input
                        type="number"
                        step={stepVal}
                        value={val}
                        onChange={e => updateStat(stateKey, parseFloat(e.target.value) || 0)}
                        style={{
                          width: '52px',
                          padding: '2px 4px',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '4px',
                          color: '#fff',
                          fontSize: '0.75rem',
                          textAlign: 'center'
                        }}
                      />
                      <span style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)' }}>{sim.suffix}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Time Saved:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-accent-emerald)' }}>
                      -{formatDuration(sim.timeSaved)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Yield/Hr Gain:</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--color-star)' }}>
                      +{sim.pctGained.toFixed(2)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Farming Path Timeline */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 className="dashboard-section-title" style={{ marginBottom: '16px' }}>📍 Optimal Farming Route Timeline</h3>
          <p style={{ margin: '-10px 0 16px 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            The order of floors sat on and resources targeted to complete all statues in the minimum possible time.
          </p>

          <table className="vein-table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>Floor</th>
                <th>Target Resource</th>
                <th>Time Spent</th>
              </tr>
            </thead>
            <tbody>
              {result.path && result.path.map((step, idx) => (
                <tr key={idx} className="vein-data-row">
                  <td style={{ fontWeight: 'bold', color: 'var(--color-accent-teal)' }}>Floor {step.floor}</td>
                  <td style={{ color: 'var(--color-star)', fontWeight: '500' }}>{step.targetResource}</td>
                  <td style={{ fontWeight: '600', color: 'var(--color-accent-emerald)' }}>{formatDuration(step.hours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

// Default parameters based on user's prompt values
const defaultPlatStats = {
  voidDroneEquipped: false,
  voidDroneLevel: 0,
  chainDroneEquipped: false,
  chainDroneGrade: 0,
  simIncr_rainbowFloorChance: 1.0,
  simIncr_goldenFloorChance: 1.0,
  simIncr_goldenFloorMulti: 1.0,
  simIncr_voidPortalChance: 1.0,
  simIncr_goldenVoidPortalChance: 1.0,
  simIncr_rainbowVoidPortalChance: 1.0,
  simIncr_freeCraftChance: 1.0,
  simIncr_doubleCraftChance: 1.0,
  simIncr_tripleCraftChance: 1.0,
  simIncr_chainDroneGrade: 1,
  simIncr_voidDroneGrade: 1,
  simIncr_gameSpeed: 0.05,
  simIncr_rainbowFloorMulti: 1.0,
  voidPortalChance: 40.0,
  goldenVoidPortalChance: 10.50,
  rainbowVoidPortalChance: 5.00,
  baseVoidPortalMulti: 1.38,
  voidDroneGrade: 15,
  goldenVoidMulti: 92.57,
  rainbowVoidMulti: 5.00,

  tripleOreChance: 116.0,
  goldenOreChance: 0.0,
  goldenOreMulti: 0.0,
  oreIncomeMulti: 1.0,

  goldenFloorChance: 70.0,
  rainbowFloorChance: 2.0,
  galacticFloorChance: 0.0,
  prismaticFloorChance: 0.0,

  goldenFloorMulti: 20.77,
  rainbowFloorMulti: 53.00,
  galacticFloorMulti: 0.0,
  prismaticFloorMulti: 0.0,

  bopMulti: 12.50,
  bopGoldOreChance: 0.0,
  transmuterMulti: 266.00,
  transmuterBopMarkChance: 90.0,

  freeCraftChance: 36.0,
  doubleCraftChance: 107.0,
  tripleCraftChance: 145.0,
  craft5xChance: 100.0,
  craft10xChance: 39.5,
  craft20xChance: 100.0,
  craft100xChance: 10.3,
  barCraftCost: 0.39,
  barOutputMulti: 1.22,
  oreCardMulti: 2.0,
  barCardMulti: 2.0,
  gameSpeedOverride: false,
  gameSpeed: 2.14
};
