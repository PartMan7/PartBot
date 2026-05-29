import { type ReactElement, memo, useEffect, useMemo, useState } from 'react';
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	Brush,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import type { GamesChartDay, GamesChartResponse } from '@/database/games';

type ChartMode = 'individual' | 'cumulative';

type ChartRow = {
	date: string;
	total: number;
	[gameType: string]: string | number;
};

function formatDate(date: string): string {
	return date.slice(5);
}

function collectGameTypes(data: GamesChartDay[]): string[] {
	const types = new Set<string>();
	for (const day of data) {
		for (const game of Object.keys(day.games)) types.add(game);
	}
	return [...types].sort();
}

function toChartRows(data: GamesChartDay[], gameTypes: string[]): ChartRow[] {
	return data.map(day => {
		const row: ChartRow = { date: day.date, total: day.total };
		for (const type of gameTypes) row[type] = day.games[type] ?? 0;
		return row;
	});
}

function toCumulative(rows: ChartRow[], gameTypes: string[]): ChartRow[] {
	const totals: Record<string, number> = { total: 0 };
	for (const type of gameTypes) totals[type] = 0;

	return rows.map(row => {
		totals.total += row.total;
		const next: ChartRow = { date: row.date, total: totals.total };
		for (const type of gameTypes) {
			totals[type] += row[type] as number;
			next[type] = totals[type];
		}
		return next;
	});
}

function rebaseFromStart(rows: ChartRow[], gameTypes: string[]): ChartRow[] {
	if (!rows.length) return rows;
	const baseline = rows[0];
	return rows.map(row => {
		const rebased: ChartRow = { date: row.date, total: (row.total as number) - (baseline.total as number) };
		for (const type of gameTypes) rebased[type] = (row[type] as number) - (baseline[type] as number);
		return rebased;
	});
}

function maxInSlice(rows: ChartRow[], gameTypes: string[], includeTotal: boolean): number {
	let max = 0;
	for (const row of rows) {
		if (includeTotal) max = Math.max(max, row.total);
		for (const type of gameTypes) max = Math.max(max, row[type] as number);
	}
	return max;
}

export const GamesChart = memo(({ days, colors, room }: GamesChartResponse & { room: string }): ReactElement => {
	const [mode, setMode] = useState<ChartMode>('individual');
	const [stacked, setStacked] = useState(true);
	const [showTotal, setShowTotal] = useState(true);
	const [lineFilter, setLineFilter] = useState<'all' | string>('all');
	const [brushRange, setBrushRange] = useState<[number, number] | null>(null);

	const gameTypes = useMemo(() => collectGameTypes(days), [days]);
	const chartData = useMemo(() => {
		const rows = toChartRows(days, gameTypes);
		return mode === 'cumulative' ? toCumulative(rows, gameTypes) : rows;
	}, [days, gameTypes, mode]);

	useEffect(() => setBrushRange(null), [chartData]);

	useEffect(() => {
		if (lineFilter !== 'all' && !gameTypes.includes(lineFilter)) setLineFilter('all');
	}, [gameTypes, lineFilter]);

	const lineTypes = lineFilter === 'all' ? gameTypes : [lineFilter];

	const fullEnd = Math.max(0, chartData.length - 1);
	const brushStart = brushRange?.[0] ?? 0;
	const brushEnd = brushRange?.[1] ?? fullEnd;
	const isZoomed = brushStart > 0 || brushEnd < fullEnd;

	const visibleSlice = useMemo(() => {
		const slice = chartData.slice(brushStart, brushEnd + 1);
		if (mode === 'cumulative' && brushStart > 0) return rebaseFromStart(slice, gameTypes);
		return slice;
	}, [chartData, brushStart, brushEnd, mode, gameTypes]);

	const yMax = useMemo(() => {
		if (stacked) return maxInSlice(visibleSlice, gameTypes, false);
		return maxInSlice(visibleSlice, lineTypes, lineFilter === 'all' && showTotal);
	}, [visibleSlice, gameTypes, lineTypes, stacked, lineFilter, showTotal]);

	return (
		<div className="p-4 max-w-6xl mx-auto">
			<h1 className="text-2xl font-bold mb-1">Games in {room}</h1>
			<p className="text-secondary mb-4">Daily game counts over the past 365 days</p>

			<div className="flex flex-wrap items-center gap-2 mb-6">
				<label className="flex items-center gap-2 m-2">
					<input
						type="checkbox"
						checked={mode === 'cumulative'}
						onChange={e => setMode(e.target.checked ? 'cumulative' : 'individual')}
					/>
					Cumulative
				</label>
				<label className="flex items-center gap-2 m-2">
					<input type="checkbox" checked={stacked} onChange={e => setStacked(e.target.checked)} />
					Stacked
				</label>
				{!stacked && (
					<label className="flex items-center gap-2 m-2">
						<select className="m-0" value={lineFilter} onChange={e => setLineFilter(e.target.value)}>
							<option value="all">All</option>
							{gameTypes.map(type => (
								<option key={type} value={type}>
									{type}
								</option>
							))}
						</select>
					</label>
				)}
				{!stacked && lineFilter === 'all' && (
					<label className="flex items-center gap-2 m-2">
						<input type="checkbox" checked={showTotal} onChange={e => setShowTotal(e.target.checked)} />
						Show total
					</label>
				)}
				{isZoomed && (
					<button type="button" onClick={() => setBrushRange(null)}>
						Reset zoom
					</button>
				)}
			</div>

			{chartData.length === 0 ? (
				<p className="text-secondary">No games recorded in this room over the past 365 days.</p>
			) : (
				<div className="w-full">
					<ResponsiveContainer width="100%" height={440}>
						{stacked ? (
							<BarChart data={visibleSlice} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" tickFormatter={formatDate} minTickGap={24} />
								<YAxis allowDecimals={false} domain={[0, yMax || 1]} />
								<Tooltip labelFormatter={date => date as string} />
								<Legend />
								{gameTypes.map(type => (
									<Bar key={type} dataKey={type} stackId="games" fill={colors[type]} name={type} />
								))}
							</BarChart>
						) : lineFilter === 'all' ? (
							<LineChart data={visibleSlice} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" tickFormatter={formatDate} minTickGap={24} />
								<YAxis allowDecimals={false} domain={[0, yMax || 1]} />
								<Tooltip labelFormatter={date => date as string} />
								<Legend />
								{gameTypes.map(type => (
									<Line key={type} type="monotone" dataKey={type} stroke={colors[type]} dot={false} name={type} />
								))}
								{showTotal && <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} dot={false} name="total" />}
							</LineChart>
						) : (
							<AreaChart data={visibleSlice} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" tickFormatter={formatDate} minTickGap={24} />
								<YAxis allowDecimals={false} domain={[0, yMax || 1]} />
								<Tooltip labelFormatter={date => date as string} />
								<Legend />
								<Area
									type="monotone"
									dataKey={lineFilter}
									stroke={colors[lineFilter]}
									fill={colors[lineFilter]}
									fillOpacity={1}
									name={lineFilter}
								/>
							</AreaChart>
						)}
					</ResponsiveContainer>
					<ResponsiveContainer width="100%" height={48}>
						<BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
							<XAxis dataKey="date" tickFormatter={formatDate} hide />
							<YAxis hide />
							<Brush
								dataKey="date"
								height={36}
								stroke="#8884d8"
								tickFormatter={formatDate}
								startIndex={brushStart}
								endIndex={brushEnd}
								onChange={brush => {
									if (brush.startIndex === null || brush.endIndex === null) return;
									setBrushRange([brush.startIndex, brush.endIndex]);
								}}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			)}
		</div>
	);
});
