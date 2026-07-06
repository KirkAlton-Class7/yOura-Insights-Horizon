import ScoreCard from './ScoreCard';
import { getScoreColor } from '../utils/colors';
import { calendarDates } from '../utils/dateService';
import { formatChartPointLabel, HtmlChartPointLabel, useChartPointLabel } from './ChartPointLabel';

function ScoreTrendBars({ category, appData, dateWindow, selectedDate, onSelectDate }) {
  const labelState = useChartPointLabel();
  return dateWindow.map((date, index) => {
    const record = appData[category]?.[date]?.[0];
    const hasScore = record?.score !== null
      && record?.score !== undefined
      && record?.score !== ''
      && Number.isFinite(Number(record.score));
    const score = hasScore ? Number(record.score) : null;
    const height = hasScore ? Math.max(8, Math.round(score * 0.32)) : 4;
    const color = hasScore ? getScoreColor(score) : 'rgba(255,255,255,0.1)';
    const isActive = date === selectedDate;
    const select = () => {
      onSelectDate(date);
      labelState.showClicked(date);
    };

    return (
      <div
        key={date}
        role="button"
        tabIndex="0"
        className={`relative flex flex-1 cursor-pointer flex-col items-end justify-end outline-none ${isActive ? 'active' : ''}`}
        onClick={event => { event.stopPropagation(); select(); }}
        onMouseEnter={() => labelState.showHovered(date)}
        onMouseLeave={() => labelState.hideHovered(date)}
        onFocus={() => labelState.showHovered(date)}
        onBlur={() => labelState.hideHovered(date)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            select();
          }
        }}
        aria-label={`${formatChartPointLabel(date)}, ${score ?? 'no score'}`}
      >
        {date === labelState.activeKey && (
          <HtmlChartPointLabel
            label={formatChartPointLabel(date)}
            fading={labelState.fading}
            className={`bottom-[calc(100%+0.35rem)] ${index === 0 ? 'left-0' : index === dateWindow.length - 1 ? 'right-0' : 'left-1/2 -translate-x-1/2'}`}
          />
        )}
        <div className="w-full rounded-t-sm transition-opacity" style={{ height: `${height}px`, backgroundColor: color, opacity: isActive ? 1 : 0.35 }} />
        <div className="mt-0.5 text-[8px] text-slate-500">{calendarDates.getDatePresentation(date).dayOfMonth}</div>
      </div>
    );
  });
}

export default function ScoreSummaryGrid({
  appData,
  selectedDate,
  dateWindow,
  onSelectDate,
  onOpenReadiness,
  onOpenSleep,
  onOpenActivity,
}) {
  const getTrendBars = category => (
    <ScoreTrendBars category={category} appData={appData} dateWindow={dateWindow} selectedDate={selectedDate} onSelectDate={onSelectDate} />
  );

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
        onOpen={onOpenReadiness}
      />
      <ScoreCard
        label="Sleep"
        data={appData.sleep?.[selectedDate]?.[0]}
        trendBars={getTrendBars('sleep')}
        weeklyScores={getWeeklyScores('sleep')}
        onOpen={onOpenSleep}
      />
      <ScoreCard
        label="Activity"
        data={appData.activity?.[selectedDate]?.[0]}
        trendBars={getTrendBars('activity')}
        weeklyScores={getWeeklyScores('activity')}
        onOpen={onOpenActivity}
      />
    </div>
  );
}
