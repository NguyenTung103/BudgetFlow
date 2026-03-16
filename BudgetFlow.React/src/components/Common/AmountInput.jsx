import React, { useState, useEffect } from 'react';

/** Chuyển số thành chuỗi có dấu chấm phân cách nghìn: 1500000 → "1.500.000" */
function formatNumber(raw) {
  if (!raw && raw !== 0) return '';
  return raw.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Bỏ dấu chấm, lấy số thuần: "1.500.000" → "1500000" */
function parseNumber(str) {
  return str.replace(/\./g, '');
}

/**
 * Input số tiền VND tự động thêm dấu chấm nghìn.
 * Props: value (số hoặc string thuần), onChange(rawString), placeholder, required, min
 */
export default function AmountInput({ value, onChange, placeholder = '0', required = false, min = 0 }) {
  const [display, setDisplay] = useState('');

  // Đồng bộ khi value thay đổi từ bên ngoài (edit mode)
  useEffect(() => {
    const raw = parseNumber(String(value || ''));
    if (raw === '') { setDisplay(''); return; }
    const num = parseInt(raw, 10);
    setDisplay(isNaN(num) ? '' : formatNumber(num));
  }, [value]);

  const handleChange = (e) => {
    const input = e.target.value;
    const raw = parseNumber(input).replace(/[^0-9]/g, '');
    if (raw === '') {
      setDisplay('');
      onChange('');
      return;
    }
    const num = parseInt(raw, 10);
    setDisplay(formatNumber(num));
    onChange(raw); // trả về string thuần không dấu
  };

  const handleKeyDown = (e) => {
    // Cho phép: số, Backspace, Delete, Tab, Arrow, Home, End
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    if (e.key >= '0' && e.key <= '9') return;
    e.preventDefault();
  };

  return (
    <div className="amount-input-wrapper">
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        min={min}
        className="amount-input"
        autoComplete="off"
      />
      <span className="amount-input-unit">₫</span>
    </div>
  );
}
