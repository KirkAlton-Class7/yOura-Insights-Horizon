/* eslint-disable react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react';
import { calendarDates } from '../utils/dateService';

const FADE_DELAY_MS = 2600;
const CLEAR_DELAY_MS = 3000;

export const formatChartPointLabel = (key, fallback = '') => {
  const value = String(key || '');
  if (/^\d{4}-\d{2}$/.test(value)) {
    const date = calendarDates.getDatePresentation(`${value}-01`);
    return `${date.monthLong} '${String(date.year).slice(-2)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = calendarDates.getDatePresentation(value);
    return `${date.monthShort} ${date.dayOfMonth}, '${String(date.year).slice(-2)}`;
  }
  return fallback || value;
};

export const formatChartAxisLabel = (key, fallback = '') => {
  const value = String(key || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = calendarDates.getDatePresentation(value);
    return Object.freeze([date.weekdayShort, `${date.month}/${date.dayOfMonth}`]);
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    const month = calendarDates.getYearMonthPresentation(value);
    return Object.freeze([month.monthName.slice(0, 3), `'${String(month.year).slice(-2)}`]);
  }
  return Object.freeze([fallback || value]);
};

export function useChartPointLabel() {
  const [hoveredKey, setHoveredKey] = useState(null);
  const [clicked, setClicked] = useState(null);
  const fadeTimer = useRef(null);
  const clearTimer = useRef(null);

  const clearTimers = () => {
    window.clearTimeout(fadeTimer.current);
    window.clearTimeout(clearTimer.current);
  };

  useEffect(() => () => clearTimers(), []);

  const showClicked = key => {
    clearTimers();
    setClicked({ key, fading: false });
    fadeTimer.current = window.setTimeout(() => {
      setClicked(current => current?.key === key ? { ...current, fading: true } : current);
    }, FADE_DELAY_MS);
    clearTimer.current = window.setTimeout(() => {
      setClicked(current => current?.key === key ? null : current);
    }, CLEAR_DELAY_MS);
  };

  const activeKey = hoveredKey || clicked?.key || null;
  return {
    activeKey,
    fading: !hoveredKey && Boolean(clicked?.fading),
    showClicked,
    showHovered: setHoveredKey,
    hideHovered: key => setHoveredKey(current => current === key ? null : current),
  };
}

export function SvgChartPointLabel({ x, y, label, chartWidth, chartHeight, fading = false }) {
  if (!label) return null;
  const bubbleWidth = Math.min(180, Math.max(74, label.length * 8 + 24));
  const bubbleHeight = 32;
  const half = bubbleWidth / 2;
  const bubbleX = Math.min(chartWidth - half - 8, Math.max(half + 8, x));
  const placeBelow = y < 58;
  const bubbleY = placeBelow
    ? Math.min(chartHeight - bubbleHeight - 8, y + 18)
    : Math.max(8, y - bubbleHeight - 18);
  const connectorY = placeBelow ? bubbleY : bubbleY + bubbleHeight;

  return (
    <g data-chart-point-label="true" className={`pointer-events-none ${fading ? 'opacity-0' : 'opacity-100'}`} style={{ transition: 'opacity 400ms ease' }}>
      <line x1={x} y1={y} x2={bubbleX} y2={connectorY} stroke="#67e8f9" strokeWidth="2" opacity="0.85" />
      <rect
        x={bubbleX - half}
        y={bubbleY}
        width={bubbleWidth}
        height={bubbleHeight}
        rx="12"
        fill="#0f172a"
        stroke="#67e8f9"
        strokeWidth="2"
      />
      <text x={bubbleX} y={bubbleY + 21} textAnchor="middle" fill="#f8fafc" fontSize="14" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

export function SvgChartAxisLabel({ x, y, chartKey, fallback, active = false, fontSize = 15 }) {
  const lines = formatChartAxisLabel(chartKey, fallback);
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill={active ? '#67e8f9' : 'rgba(148,163,184,0.78)'}
      fontSize={fontSize}
      fontWeight={active ? '800' : '600'}
    >
      {lines.map((line, index) => (
        <tspan key={`${line}-${index}`} x={x} dy={index === 0 ? 0 : fontSize + 3}>{line}</tspan>
      ))}
    </text>
  );
}

export function HtmlChartPointLabel({ label, fading = false, className = '' }) {
  if (!label) return null;
  return (
    <span data-chart-point-label="true" className={`pointer-events-none absolute z-30 whitespace-nowrap rounded-xl border border-cyan-300 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-50 shadow-xl ${fading ? 'opacity-0' : 'opacity-100'} ${className}`} style={{ transition: 'opacity 400ms ease' }}>
      {label}
    </span>
  );
}
