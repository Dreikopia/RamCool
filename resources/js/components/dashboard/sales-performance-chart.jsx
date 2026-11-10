import { useId, useState } from 'react';
import { cn } from 'cn';

const WIDTH = 720;
const HEIGHT = 268;
const PADDING = { top: 20, right: 16, bottom: 34, left: 68 };
const INNER_WIDTH = WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;
const TICK_COUNT = 4;

const compactCurrency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    notation: 'compact',
    maximumFractionDigits: 1,
});

const fullCurrency = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
});

const niceCeiling = (value) => {
    if (!Number.isFinite(value) || value <= 0) {
        return 1;
    }

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;

    const step =
        normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;

    return step * magnitude;
};

const buildPoints = (data, max) =>
    data.map((item, index) => ({
        ...item,
        x:
            data.length === 1
                ? PADDING.left + INNER_WIDTH / 2
                : PADDING.left + (index / (data.length - 1)) * INNER_WIDTH,
        y: PADDING.top + (1 - Number(item.revenue) / max) * INNER_HEIGHT,
    }));

const buildLine = (points) =>
    points.reduce((path, point, index, all) => {
        if (index === 0) {
            return `M ${point.x} ${point.y}`;
        }

        const previous = all[index - 1];
        const beforePrevious = all[index - 2] ?? previous;
        const next = all[index + 1] ?? point;

        const control1X = previous.x + (point.x - beforePrevious.x) / 6;
        const control1Y = previous.y + (point.y - beforePrevious.y) / 6;
        const control2X = point.x - (next.x - previous.x) / 6;
        const control2Y = point.y - (next.y - previous.y) / 6;

        return `${path} C ${control1X} ${control1Y}, ${control2X} ${control2Y}, ${point.x} ${point.y}`;
    }, '');

const RANGE_META = {
    hourly: { summary: 'the last 24 hours', step: 3, text: (label) => label },
    days7: { summary: 'the last 7 days', step: 1, text: (label) => label },
    days30: { summary: 'the last 30 days', step: 5, text: (label) => label },
    months6: {
        summary: 'the last 6 months',
        step: 1,
        text: (label) => label.split(' ')[0],
    },
};

const SalesPerformanceChart = ({
    data = [],
    granularity = 'months6',
    className,
}) => {
    const meta = RANGE_META[granularity] ?? RANGE_META.months6;
    const gradientId = useId();
    const [hovered, setHovered] = useState(null);

    const maxRevenue = Math.max(
        0,
        ...data.map((item) => Number(item.revenue) || 0),
    );
    const max = niceCeiling(maxRevenue);
    const points = buildPoints(data, max);
    const line = buildLine(points);
    const baseline = PADDING.top + INNER_HEIGHT;
    const area =
        points.length > 0
            ? `${line} L ${points.at(-1).x} ${baseline} L ${points[0].x} ${baseline} Z`
            : '';

    const ticks = Array.from(
        { length: TICK_COUNT + 1 },
        (_, index) => (max / TICK_COUNT) * index,
    );

    const hoveredPoint = hovered === null ? null : points[hovered];
    const tooltipBelow = hoveredPoint ? hoveredPoint.y < 64 : false;

    return (
        <div
            className={cn('relative w-full', className)}
            onMouseLeave={() => setHovered(null)}
        >
            <svg
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="h-auto w-full"
                role="img"
                aria-label={`Sales performance over ${meta.summary}`}
            >
                <title>Sales performance</title>

                <defs>
                    <linearGradient
                        id={gradientId}
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="var(--color-chart-2)"
                            stopOpacity="0.24"
                        />
                        <stop
                            offset="100%"
                            stopColor="var(--color-chart-2)"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>

                {ticks.map((tick) => {
                    const y = PADDING.top + (1 - tick / max) * INNER_HEIGHT;

                    return (
                        <g key={tick}>
                            <line
                                x1={PADDING.left}
                                x2={WIDTH - PADDING.right}
                                y1={y}
                                y2={y}
                                className="stroke-border"
                                strokeDasharray="3 6"
                            />
                            <text
                                x={PADDING.left - 12}
                                y={y + 4}
                                textAnchor="end"
                                className="fill-muted-foreground text-[11px] tabular-nums"
                            >
                                {compactCurrency.format(tick)}
                            </text>
                        </g>
                    );
                })}

                {points.length > 1 && (
                    <path d={area} fill={`url(#${gradientId})`} />
                )}

                {points.length > 1 && (
                    <path
                        d={line}
                        fill="none"
                        className="stroke-chart-2"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {hoveredPoint && (
                    <line
                        x1={hoveredPoint.x}
                        x2={hoveredPoint.x}
                        y1={PADDING.top}
                        y2={baseline}
                        className="stroke-chart-2/40"
                        strokeDasharray="3 4"
                    />
                )}

                {points.map((point, index) => (
                    <g key={point.period}>
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r={hovered === index ? 5 : 3.5}
                            className="fill-background stroke-chart-2 transition-[r] duration-150"
                            strokeWidth="2.5"
                        />
                        <circle
                            cx={point.x}
                            cy={point.y}
                            r="18"
                            fill="transparent"
                            onMouseEnter={() => setHovered(index)}
                            onFocus={() => setHovered(index)}
                            tabIndex={0}
                            className="cursor-pointer outline-none"
                            aria-label={`${point.label}: ${fullCurrency.format(Number(point.revenue))}, ${point.orders} orders`}
                        />
                    </g>
                ))}

                {points.map((point, index) =>
                    index % meta.step === 0 || index === points.length - 1 ? (
                        <text
                            key={`label-${point.period}`}
                            x={point.x}
                            y={HEIGHT - 9}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[11px]"
                        >
                            {meta.text(point.label)}
                        </text>
                    ) : null,
                )}
            </svg>

            {hoveredPoint && (
                <div
                    className={cn(
                        'pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-popover px-3 py-2 text-popover-foreground shadow-md ring-1 ring-foreground/10',
                        tooltipBelow
                            ? 'translate-y-3'
                            : '-translate-y-[calc(100%+10px)]',
                    )}
                    style={{
                        left: `${(hoveredPoint.x / WIDTH) * 100}%`,
                        top: `${(hoveredPoint.y / HEIGHT) * 100}%`,
                    }}
                >
                    <div className="text-xs text-muted-foreground">
                        {hoveredPoint.label}
                    </div>
                    <div className="font-semibold tabular-nums">
                        {fullCurrency.format(Number(hoveredPoint.revenue))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {hoveredPoint.orders}{' '}
                        {hoveredPoint.orders === 1 ? 'order' : 'orders'}
                    </div>
                </div>
            )}

            {maxRevenue === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <p className="rounded-md bg-background/80 px-3 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
                        No completed sales in this period yet.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SalesPerformanceChart;
