import { useState, useEffect, useMemo, Fragment } from 'react';
import { calculateVeinIncome } from '../engine/veinCalculator';
import { WORLD_NAMES } from '../data/veins';

/**
 * VeinCalculator — Tab UI for computing vein income.
 * Inputs: vein multipliers, drone, bomb, ores/floor.
 * Output: per-vein-type income table grouped by world.
 */
export function VeinCalculator({ veinConfig, setVeinConfig, floorsPerHour }) {
  const [showDrone, setShowDrone] = useState(false);
  const [statIncrements, setStatIncrements] = useState(() => {
    try {
      const saved = localStorage.getItem('iom_vein_stat_incr');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      veinSpawnRateMulti: 5,
      veinIncomeMulti: 5,
      goldenVeinChance: 5,
      goldenVeinMulti: 5,
      rainbowVeinChance: 5,
      rainbowVeinMulti: 5,
      gleamingVeinChance: 5,
      gleamingVeinMulti: 5,
      veinCardMultiplier: 5,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('iom_vein_stat_incr', JSON.stringify(statIncrements));
    } catch (e) {}
  }, [statIncrements]);

  const handleStatIncrementChange = (key, value, isChance) => {
    let finalValue = value;
    if (isChance) {
      finalValue = Math.round(value);
    }
    setStatIncrements(prev => ({
      ...prev,
      [key]: finalValue
    }));
  };

  // Helper to update a single vein config key
  const setField = (key, val) => setVeinConfig(prev => ({ ...prev, [key]: val }));

  // Compute vein stats
  const veinStats = useMemo(() => {
    return calculateVeinIncome({
      ...veinConfig,
      floorsPerHour,
      cardMultiplier: veinConfig.veinCardMultiplier || 1.0,
    });
  }, [veinConfig, floorsPerHour]);

  const getIncrementGain = (key) => {
    const incrementValue = statIncrements[key] ?? 5;
    const factor = 1 + (incrementValue / 100);
    const addition = incrementValue / 100;

    let modifiedConfig = { ...veinConfig };

    if (
      key === 'veinSpawnRateMulti' ||
      key === 'veinIncomeMulti' ||
      key === 'goldenVeinMulti' ||
      key === 'rainbowVeinMulti' ||
      key === 'gleamingVeinMulti' ||
      key === 'veinCardMultiplier'
    ) {
      const currentVal = veinConfig[key] || 1.0;
      modifiedConfig[key] = currentVal * factor;
    } else if (
      key === 'goldenVeinChance' ||
      key === 'rainbowVeinChance' ||
      key === 'gleamingVeinChance'
    ) {
      const currentVal = veinConfig[key] || 0.0;
      modifiedConfig[key] = Math.min(1.0, currentVal + addition);
    } else {
      return null;
    }

    const modifiedStats = calculateVeinIncome({
      ...modifiedConfig,
      floorsPerHour,
      cardMultiplier: modifiedConfig.veinCardMultiplier || 1.0,
    });

    return modifiedStats.totalIncomePerHour - veinStats.totalIncomePerHour;
  };

  const renderIncrementRow = (key, isChance) => {
    const incrementValue = statIncrements[key] ?? 5;
    const gain = getIncrementGain(key);
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginTop: '8px', 
        fontSize: '0.8rem', 
        borderTop: '1px dashed var(--border-light)', 
        paddingTop: '8px' 
      }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>Gain if +</span>
        <input
          type="number"
          step={isChance ? "1" : "0.1"}
          min="0"
          value={incrementValue}
          onChange={e => handleStatIncrementChange(key, parseFloat(e.target.value) || 0, isChance)}
          className="custom-number-input"
          style={{ width: '60px', padding: '2px 4px', fontSize: '0.75rem', height: '24px' }}
        />
        <span style={{ color: 'var(--color-text-muted)' }}>
          {isChance ? '%' : '% (multi)'}
        </span>
        {gain !== null && gain > 0.0001 && (
          <span style={{ marginLeft: 'auto', color: 'var(--color-accent-emerald)', fontWeight: '600' }}>
            +{formatNum(gain)}/hr
          </span>
        )}
      </div>
    );
  };

  // Format numbers nicely
  const formatNum = (num) => {
    if (num === undefined || isNaN(num)) return '0.00';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  // Group results by world
  const groupedResults = useMemo(() => {
    const groups = {};
    veinStats.veinResults.forEach(v => {
      if (!groups[v.world]) groups[v.world] = [];
      groups[v.world].push(v);
    });
    return groups;
  }, [veinStats]);

  return (
    <div className="vein-calculator">
      {/* ===== Input Section ===== */}
      <div className="glass-panel vein-inputs-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <h2 className="dashboard-section-title" style={{ marginBottom: '16px' }}>
          ⛏️ Vein Calculator — Inputs
        </h2>

        <div className="vein-input-grid">
          {/* Vein Spawn Rate Multi */}
          <div className="vein-input-item">
            <label className="vein-input-label">
              Vein Spawn Rate Multi
            </label>
            <div className="input-slider-container">
              <input
                type="range"
                min="0.5"
                max="50"
                step="0.1"
                value={veinConfig.veinSpawnRateMulti}
                onChange={e => setField('veinSpawnRateMulti', parseFloat(e.target.value) || 1)}
                className="custom-slider"
              />
              <input
                type="number"
                step="0.01"
                value={veinConfig.veinSpawnRateMulti}
                onChange={e => setField('veinSpawnRateMulti', parseFloat(e.target.value) || 1)}
                className="custom-number-input"
              />
            </div>
            {renderIncrementRow('veinSpawnRateMulti', false)}
          </div>

          {/* Vein Income Multi */}
          <div className="vein-input-item">
            <label className="vein-input-label">
              Vein Income Multi
            </label>
            <div className="input-slider-container">
              <input
                type="range"
                min="1.0"
                max="50"
                step="0.01"
                value={veinConfig.veinIncomeMulti}
                onChange={e => setField('veinIncomeMulti', parseFloat(e.target.value) || 1)}
                className="custom-slider"
              />
              <input
                type="number"
                step="0.01"
                value={veinConfig.veinIncomeMulti}
                onChange={e => setField('veinIncomeMulti', parseFloat(e.target.value) || 1)}
                className="custom-number-input"
              />
            </div>
            {renderIncrementRow('veinIncomeMulti', false)}
          </div>

          {/* Golden Vein Chance */}
          <div className="vein-input-item">
            <label className="vein-input-label">
              Golden Vein Chance (%)
            </label>
            <div className="input-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={(veinConfig.goldenVeinChance * 100)}
                onChange={e => setField('goldenVeinChance', (parseFloat(e.target.value) || 0) / 100)}
                className="custom-slider"
              />
              <input
                type="number"
                step="0.1"
                value={parseFloat((veinConfig.goldenVeinChance * 100).toFixed(2))}
                onChange={e => setField('goldenVeinChance', (parseFloat(e.target.value) || 0) / 100)}
                className="custom-number-input"
              />
            </div>
            {renderIncrementRow('goldenVeinChance', true)}
          </div>

          {/* Golden Vein Multi */}
          <div className="vein-input-item">
            <label className="vein-input-label">
              Golden Vein Multi
            </label>
            <div className="input-slider-container">
              <input
                type="range"
                min="1.0"
                max="100"
                step="0.01"
                value={veinConfig.goldenVeinMulti}
                onChange={e => setField('goldenVeinMulti', parseFloat(e.target.value) || 1)}
                className="custom-slider"
              />
              <input
                type="number"
                step="0.01"
                value={veinConfig.goldenVeinMulti}
                onChange={e => setField('goldenVeinMulti', parseFloat(e.target.value) || 1)}
                className="custom-number-input"
              />
            </div>
            {renderIncrementRow('goldenVeinMulti', false)}
          </div>

          {/* Rainbow Vein Chance */}
          <div className="vein-input-item">
            <label className="vein-input-label">
              Rainbow Vein Chance (%)
            </label>
            <div className="input-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={(veinConfig.rainbowVeinChance * 100)}
                onChange={e => setField('rainbowVeinChance', (parseFloat(e.target.value) || 0) / 100)}
                className="custom-slider"
              />
              <input
                type="number"
                step="0.1"
                value={parseFloat((veinConfig.rainbowVeinChance * 100).toFixed(2))}
                onChange={e => setField('rainbowVeinChance', (parseFloat(e.target.value) || 0) / 100)}
                className="custom-number-input"
              />
            </div>
            {renderIncrementRow('rainbowVeinChance', true)}
          </div>

          {/* Rainbow Vein Multi */}
          <div className="vein-input-item">
            <label className="vein-input-label">
              Rainbow Vein Multi
            </label>
            <div className="input-slider-container">
              <input
                type="range"
                min="1.0"
                max="100"
                step="0.01"
                value={veinConfig.rainbowVeinMulti}
                onChange={e => setField('rainbowVeinMulti', parseFloat(e.target.value) || 1)}
                className="custom-slider"
              />
              <input
                type="number"
                step="0.01"
                value={veinConfig.rainbowVeinMulti}
                onChange={e => setField('rainbowVeinMulti', parseFloat(e.target.value) || 1)}
                className="custom-number-input"
              />
            </div>
            {renderIncrementRow('rainbowVeinMulti', false)}
          </div>

          {/* Gleaming Vein Chance */}
          <div className="vein-input-item">
            <label className="vein-input-label">
              Gleaming Vein Chance (%)
            </label>
            <div className="input-slider-container">
              <input
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={(veinConfig.gleamingVeinChance * 100)}
                onChange={e => setField('gleamingVeinChance', (parseFloat(e.target.value) || 0) / 100)}
                className="custom-slider"
              />
              <input
                type="number"
                step="0.1"
                value={parseFloat((veinConfig.gleamingVeinChance * 100).toFixed(2))}
                onChange={e => setField('gleamingVeinChance', (parseFloat(e.target.value) || 0) / 100)}
                className="custom-number-input"
              />
            </div>
            {renderIncrementRow('gleamingVeinChance', true)}
          </div>

          {/* Gleaming Vein Multi */}
          <div className="vein-input-item">
            <label className="vein-input-label">
              Gleaming Vein Multi
            </label>
            <div className="input-slider-container">
              <input
                type="range"
                min="1.0"
                max="50"
                step="0.01"
                value={veinConfig.gleamingVeinMulti}
                onChange={e => setField('gleamingVeinMulti', parseFloat(e.target.value) || 1)}
                className="custom-slider"
              />
              <input
                type="number"
                step="0.01"
                value={veinConfig.gleamingVeinMulti}
                onChange={e => setField('gleamingVeinMulti', parseFloat(e.target.value) || 1)}
                className="custom-number-input"
              />
            </div>
            {renderIncrementRow('gleamingVeinMulti', false)}
          </div>

          {/* Vein Card Multiplier */}
          <div className="vein-input-item">
            <label className="vein-input-label">
              Vein Card Multiplier
            </label>
            <div className="input-slider-container">
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.01"
                value={veinConfig.veinCardMultiplier || 1.0}
                onChange={e => setField('veinCardMultiplier', parseFloat(e.target.value) || 1)}
                className="custom-slider"
              />
              <input
                type="number"
                step="0.01"
                value={veinConfig.veinCardMultiplier || 1.0}
                onChange={e => setField('veinCardMultiplier', parseFloat(e.target.value) || 1)}
                className="custom-number-input"
              />
            </div>
            {renderIncrementRow('veinCardMultiplier', false)}
          </div>
        </div>

        {/* Toggles Row */}
        <div className="vein-toggles-row">
          <label className="vein-toggle-item">
            <input
              type="checkbox"
              className="star-checkbox"
              checked={!!veinConfig.veinResearch2x}
              onChange={e => setField('veinResearch2x', e.target.checked)}
            />
            <span>2x Vein Research</span>
          </label>

          <label className="vein-toggle-item">
            <input
              type="checkbox"
              className="star-checkbox"
              checked={!!veinConfig.veinmorpherBomb}
              onChange={e => setField('veinmorpherBomb', e.target.checked)}
            />
            <span>Veinmorpher Bomb</span>
          </label>

          <div className="vein-toggle-item">
            <span style={{ marginRight: '8px', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Ores/Floor:</span>
            <button
              type="button"
              className={`tab-btn ${veinConfig.oresPerFloor === 10 ? 'active' : ''}`}
              onClick={() => setField('oresPerFloor', 10)}
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px' }}
            >
              10
            </button>
            <button
              type="button"
              className={`tab-btn ${veinConfig.oresPerFloor === 12 ? 'active' : ''}`}
              onClick={() => setField('oresPerFloor', 12)}
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '4px', marginLeft: '4px' }}
            >
              12
            </button>
          </div>
        </div>

        {/* Drone Section (Collapsible) */}
        <div style={{ marginTop: '12px' }}>
          <div
            className={`dashboard-section-title collapsible-header ${!showDrone ? 'collapsed' : ''}`}
            onClick={() => setShowDrone(!showDrone)}
            style={{ fontSize: '0.9rem', paddingBottom: '6px', marginBottom: showDrone ? '12px' : '0' }}
          >
            🛸 Vein Drone
          </div>

          {showDrone && (
            <div className="vein-drone-section">
              <label className="vein-toggle-item" style={{ marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  className="star-checkbox"
                  checked={!!veinConfig.veinDroneFueled}
                  onChange={e => setField('veinDroneFueled', e.target.checked)}
                />
                <span>Drone Fueled</span>
              </label>

              <div className="vein-input-item">
                <label className="vein-input-label">
                  Drone Level (0–15)
                  <span style={{ marginLeft: '8px', color: 'var(--color-accent-teal)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    Lv {veinConfig.veinDroneLevel}
                  </span>
                </label>
                <div className="input-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={veinConfig.veinDroneLevel}
                    onChange={e => setField('veinDroneLevel', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="15"
                    value={veinConfig.veinDroneLevel}
                    onChange={e => setField('veinDroneLevel', Math.min(15, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  +10% base spawn rate, +2% per level
                </div>
              </div>

              <div className="vein-input-item" style={{ marginTop: '10px' }}>
                <label className="vein-input-label">
                  Drone Grade (0–125)
                  <span style={{ marginLeft: '8px', color: 'var(--color-star)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    G{veinConfig.veinDroneGrade}
                  </span>
                </label>
                <div className="input-slider-container">
                  <input
                    type="range"
                    min="0"
                    max="125"
                    step="1"
                    value={veinConfig.veinDroneGrade}
                    onChange={e => setField('veinDroneGrade', parseInt(e.target.value) || 0)}
                    className="custom-slider"
                  />
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="125"
                    value={veinConfig.veinDroneGrade}
                    onChange={e => setField('veinDroneGrade', Math.min(125, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="custom-number-input"
                  />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  +50% golden vein multi at G0, +10% per grade (multiplies your Golden Vein Multi when fueled)
                </div>
              </div>

              {veinConfig.veinDroneFueled && (
                <div className="vein-drone-summary">
                  <div className="stat-row" style={{ padding: '4px 0' }}>
                    <span className="stat-label" style={{ fontSize: '0.8rem' }}>Spawn Rate Bonus:</span>
                    <span className="stat-value highlight" style={{ fontSize: '0.8rem' }}>
                      +{((veinStats.droneSpawnMulti - 1) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="stat-row" style={{ padding: '4px 0' }}>
                    <span className="stat-label" style={{ fontSize: '0.8rem' }}>Golden Multi Bonus:</span>
                    <span className="stat-value" style={{ fontSize: '0.8rem', color: 'var(--color-star)' }}>
                      ×{veinStats.droneGoldenMulti.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Effective Stats Summary */}
        <div className="vein-effective-summary">
          <div className="stat-row" style={{ padding: '4px 0' }}>
            <span className="stat-label">Effective Spawn Rate:</span>
            <span className="stat-value highlight">{veinStats.effectiveSpawnRate.toFixed(2)}×</span>
          </div>
          <div className="stat-row" style={{ padding: '4px 0' }}>
            <span className="stat-label">Total Vein Income/Hr:</span>
            <span className="stat-value" style={{ color: 'var(--color-accent-emerald)', textShadow: '0 0 8px hsla(145, 75%, 50%, 0.3)' }}>
              {formatNum(veinStats.totalIncomePerHour)}
            </span>
          </div>
          <div className="stat-row" style={{ padding: '4px 0' }}>
            <span className="stat-label">Floors/Hr:</span>
            <span className="stat-value">{Math.round(floorsPerHour).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* ===== Results Table ===== */}
      <div className="glass-panel" style={{ padding: '20px', overflow: 'auto' }}>
        <h2 className="dashboard-section-title" style={{ marginBottom: '16px' }}>
          📊 Vein Income Breakdown
        </h2>

        <table className="vein-table">
          <thead>
            <tr>
              <th>Vein</th>
              <th>Floors</th>
              <th>Rarity</th>
              <th>Spawn %</th>
              <th>Veins/Floor</th>
              <th>Income/Floor</th>
              <th>Income/Hr</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedResults).map(([worldNum, veins]) => (
              <Fragment key={`world-group-${worldNum}`}> 
                <tr className="vein-world-header-row">
                  <td colSpan={7}>
                    {WORLD_NAMES[worldNum] || `World ${worldNum}`}
                  </td>
                </tr>
                {veins.map(v => (
                  <tr key={v.id} className="vein-data-row">
                    <td className="vein-name-cell">{v.name}</td>
                    <td>{v.floors[0]}–{v.floors[1]}</td>
                    <td>{v.rarity}</td>
                    <td>{(v.spawnProb * 100).toFixed(2)}%</td>
                    <td>{v.veinsPerFloor.toFixed(2)}</td>
                    <td>{formatNum(v.incomePerFloor)}</td>
                    <td className="vein-income-cell">{formatNum(v.incomePerHour)}</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
          <tfoot>
            <tr className="vein-total-row">
              <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700 }}>
                Total Income/Hr:
              </td>
              <td className="vein-income-cell" style={{ fontWeight: 700, fontSize: '1rem' }}>
                {formatNum(veinStats.totalIncomePerHour)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
