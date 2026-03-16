import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './CustomSelect.css';

/**
 * CustomSelect – dropdown đẹp thay thế <select> native
 * Props:
 *   value        – giá trị đang chọn
 *   onChange     – callback(newValue)
 *   options      – [{ value, label, icon?, color? }]
 *   placeholder  – text khi chưa chọn
 *   className    – class bổ sung wrapper
 */
export default function CustomSelect({ value, onChange, options = [], placeholder = 'Chọn...', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (opt) => {
    onChange(opt.value);
    setOpen(false);
  };

  return (
    <div className={`cselect ${className} ${open ? 'cselect--open' : ''}`} ref={ref}>
      <button type="button" className="cselect__trigger" onClick={() => setOpen(!open)}>
        <span className="cselect__value">
          {selected ? (
            <>
              {selected.icon && (
                <span className="cselect__icon" style={selected.color ? { background: selected.color + '25' } : {}}>
                  {selected.icon}
                </span>
              )}
              <span>{selected.label}</span>
            </>
          ) : (
            <span className="cselect__placeholder">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={16} className="cselect__chevron" />
      </button>

      {open && (
        <div className="cselect__dropdown">
          {options.map((opt) => {
            const isActive = String(opt.value) === String(value);
            return (
              <div
                key={opt.value}
                className={`cselect__option ${isActive ? 'cselect__option--active' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                {opt.icon && (
                  <span className="cselect__icon" style={opt.color ? { background: opt.color + '25' } : {}}>
                    {opt.icon}
                  </span>
                )}
                <span className="cselect__option-label">{opt.label}</span>
                {isActive && <Check size={14} className="cselect__check" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
