import { saveBlob } from '../api.js';

export function toCsv(rows, columns) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = rows.map((row) => columns.map((c) => escape(c.value(row))).join(','));
  return [columns.map((c) => escape(c.label)).join(','), ...lines].join('\r\n');
}

export function downloadCsv(fileName, rows, columns) {
  saveBlob(new Blob(['﻿', toCsv(rows, columns)], { type: 'text/csv;charset=utf-8' }), fileName);
}
