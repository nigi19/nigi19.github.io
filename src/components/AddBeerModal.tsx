import { useState, FormEvent } from 'react';
import { Database } from 'sql.js';
import { Beer } from '../types';
import { addCustomBeer, getDistinctStyles, getDistinctCountries } from '../lib/beerDb';

interface Props {
  db: Database;
  onClose: () => void;
  onAdded: (beer: Beer) => void;
}

const NEW_VALUE_SENTINEL = '__new__';

interface ComboFieldProps {
  id: string;
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  newLabel: string;
  required?: boolean;
}

function ComboField({ id, label, options, value, onChange, newLabel, required }: ComboFieldProps) {
  const isCustom = value === NEW_VALUE_SENTINEL || (value !== '' && !options.includes(value));
  const [custom, setCustom] = useState('');

  function handleSelect(v: string) {
    if (v === NEW_VALUE_SENTINEL) {
      onChange(NEW_VALUE_SENTINEL);
    } else {
      onChange(v);
    }
  }

  function handleCustomChange(v: string) {
    setCustom(v);
    onChange(v);
  }

  const selectValue = isCustom ? NEW_VALUE_SENTINEL : value;

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}{required ? ' *' : ''}</label>
      <select
        id={id}
        value={selectValue}
        onChange={(e) => handleSelect(e.target.value)}
      >
        {!required && <option value="">— Any —</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
        <option value={NEW_VALUE_SENTINEL}>{newLabel}</option>
      </select>
      {isCustom && (
        <input
          type="text"
          placeholder={`Enter ${label.toLowerCase()}…`}
          value={custom}
          onChange={(e) => handleCustomChange(e.target.value)}
          style={{ marginTop: 6 }}
          autoFocus
          required={required}
        />
      )}
    </div>
  );
}

export default function AddBeerModal({ db, onClose, onAdded }: Props) {
  const styles = getDistinctStyles(db);
  const countries = getDistinctCountries(db);

  const [name, setName] = useState('');
  const [brewery, setBrewery] = useState('');
  const [style, setStyle] = useState('');
  const [country, setCountry] = useState('');
  const [abv, setAbv] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const abvNum = parseFloat(abv);
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!brewery.trim()) { setError('Brewery is required.'); return; }
    if (isNaN(abvNum) || abvNum < 0 || abvNum > 99) {
      setError('ABV must be between 0 and 99.');
      return;
    }
    const resolvedStyle = style === NEW_VALUE_SENTINEL ? '' : style.trim();
    const resolvedCountry = country === NEW_VALUE_SENTINEL ? '' : country.trim();
    const beer = addCustomBeer(db, {
      name: name.trim(),
      brewery: brewery.trim(),
      style: resolvedStyle,
      abv: abvNum,
      country: resolvedCountry,
    });
    onAdded(beer);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add new beer</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="beer-name">Name *</label>
            <input
              id="beer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="beer-brewery">Brewery *</label>
            <input
              id="beer-brewery"
              type="text"
              value={brewery}
              onChange={(e) => setBrewery(e.target.value)}
              required
            />
          </div>

          <ComboField
            id="beer-style"
            label="Style"
            options={styles}
            value={style}
            onChange={setStyle}
            newLabel="+ Add new style…"
          />

          <div className="form-group">
            <label htmlFor="beer-abv">ABV (%) *</label>
            <input
              id="beer-abv"
              type="number"
              value={abv}
              min={0}
              max={99}
              step={0.1}
              onChange={(e) => setAbv(e.target.value)}
              required
            />
          </div>

          <ComboField
            id="beer-country"
            label="Country"
            options={countries}
            value={country}
            onChange={setCountry}
            newLabel="+ Add new country…"
          />

          <div className="modal-actions">
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Add beer
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
