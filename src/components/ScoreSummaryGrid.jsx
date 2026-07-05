import ScoreCard from './ScoreCard';
import { getScoreColor } from '../utils/colors';
import { calendarDates } from '../utils/dateService';

export default function ScoreSummaryGrid({ appData, selectedDate, dateWindow, onSelectDate }) {
  const getTrendBars = (category) => dateWindow.map((date) => {
    const record = appData[category]?.[date]?.[0];
    const hasScore = record?.score !== null
      && record?.score !== undefined
      && record?.score !== ''
      && Number.isFinite(Number(record.score));
    const score = hasScore ? Number(record.score) : null;
    const height = hasScore ? Math.max(8, Math.round(score * 0.32)) : 4;
    const color = hasScore ? getScoreColor(score) : 'rgba(255,255,255,0.1)';
    const isActive = date === selectedDate;

    return (
      <div
        key={date}
        className={`flex flex-1 cursor-pointer flex-col items-end justify-end ${isActive ? 'active' : ''}`}
        onClick={() => onSelectDate(date)}
      >
        <div
          className="w-full rounded-t-sm transition-opacity"
          style={{ height: `${height}px`, backgroundColor: color, opacity: isActive ? 1 : 0.35 }}
        />
        <div className="mt-0.5 text-[8px] text-slate-500">{calendarDates.getDatePresentation(date).dayOfMonth}</div>
      </div>
    );
  });

  const getWeeklyScores = (category) => dateWindow.map((date) => ({
    date,
    score: appData[category]?.[date]?.[0]?.score ?? null,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <ScoreCard
        label="Readiness"
        data={appData.readiness?.[selectedDate]?.[0]}
        trendBars={getTrendBars('readiness')}
        weeklyScores={getWeeklyScores('readiness')}
      />
      <ScoreCard
        label="Sleep"
        data={appData.sleep?.[selectedDate]?.[0]}
        trendBars={getTrendBars('sleep')}
        weeklyScores={getWeeklyScores('sleep')}
      />
      <ScoreCard
        label="Activity"
        data={appData.activity?.[selectedDate]?.[0]}
        trendBars={getTrendBars('activity')}
        weeklyScores={getWeeklyScores('activity')}
      />
    </div>
  );
}
