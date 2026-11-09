import { Cell, Pie, PieChart } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';

const COLORS = [
    'oklch(0.541 0.281 293.541)',
    'oklch(0.70 0.14 195)',
    'oklch(0.78 0.15 82)',
    'oklch(0.60 0.20 300)',
    'oklch(0.68 0.19 20)',
    'oklch(0.55 0.03 250)',
    'oklch(0.66 0.16 140)',
    'oklch(0.72 0.13 320)',
    'oklch(0.64 0.17 60)',
    'oklch(0.58 0.15 200)',
];

const numberFormat = new Intl.NumberFormat('en-PH');

const SalesByCategoryChart = ({ data = [] }) => {
    const total = data.reduce(
        (sum, item) => sum + Number(item.sales_count),
        0,
    );

    if (total === 0) {
        return (
            <p className="py-10 text-center text-sm text-muted-foreground">
                No completed sales to break down by category yet.
            </p>
        );
    }

    const config = Object.fromEntries(
        data.map((item, index) => [
            String(item.category_id),
            {
                label: item.name,
                color: COLORS[index % COLORS.length],
            },
        ]),
    );

    const colorAt = (index) => COLORS[index % COLORS.length];

    return (
        <div className="flex w-full flex-col items-center gap-5">
            <div className="relative shrink-0">
                <ChartContainer
                    config={config}
                    className="aspect-square h-40 w-40 sm:h-44 sm:w-44"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={
                                <ChartTooltipContent
                                    hideLabel
                                    nameKey="category_id"
                                    formatter={(value, name, item) => (
                                        <div className="flex w-full items-center justify-between gap-4">
                                            <span className="text-muted-foreground">
                                                {item.payload.name}
                                            </span>
                                            <span className="font-medium tabular-nums">
                                                {numberFormat.format(
                                                    Number(value),
                                                )}{' '}
                                                sales
                                            </span>
                                        </div>
                                    )}
                                />
                            }
                        />
                        <Pie
                            data={data}
                            dataKey="sales_count"
                            nameKey="category_id"
                            innerRadius={52}
                            outerRadius={78}
                            paddingAngle={2}
                            strokeWidth={0}
                            isAnimationActive={false}
                        >
                            {data.map((item, index) => (
                                <Cell
                                    key={item.category_id}
                                    fill={colorAt(index)}
                                />
                            ))}
                        </Pie>
                    </PieChart>
                </ChartContainer>

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-semibold tracking-tight tabular-nums sm:text-xl">
                        {numberFormat.format(total)}
                    </span>
                    <span className="text-[10px] text-muted-foreground sm:text-xs">
                        Sales
                    </span>
                </div>
            </div>

            <ul className="grid max-h-40 w-full grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto pr-1 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]">
                {data.map((item, index) => (
                    <li
                        key={item.category_id}
                        className="flex min-w-0 items-center gap-1.5 text-xs"
                        title={`${item.name} (${item.percentage}%)`}
                    >
                        <span
                            className="size-2 shrink-0 rounded-[3px]"
                            style={{ backgroundColor: colorAt(index) }}
                        />
                        <span className="truncate">
                            {item.name} ({item.percentage}%)
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SalesByCategoryChart;
