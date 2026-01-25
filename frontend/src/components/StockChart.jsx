import React, { useState, useMemo } from 'react';
import {
    ComposedChart,
    Area,
    Line,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Brush,
    Rectangle
} from 'recharts';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Stack } from '@mui/material';
import { ShowChart, BarChartOutlined, CandlestickChart, Timeline } from '@mui/icons-material';
import { format } from 'date-fns';

// --- CUSTOM SHAPES ---

// Custom Candle Shape for the Bar Chart
const CandleStickShape = (props) => {
    const { x, y, width, height, payload } = props;
    const { open, close, high, low } = payload;
    const isUp = close >= open;
    const color = isUp ? '#3fb950' : '#f85149';

    // Scale for wicks
    // We need pixel coordinates. But standard custom shape might be hard to map back to values.
    // Instead, we rely on the fact that the Bar chart is receiving [min, max] as value?
    // Using a simpler approach: Rectangle for body, Line for wick.
    // However, Recharts passes 'y' and 'height' based on the 'dataKey' value.
    // For a robust candle, we often need coordinates from the axis.

    // Alternative: We blindly assume the 'Bar' is rendering the Body, and we draw the wicks ourselves?
    // Recharts CustomShape is tricky. 
    // Let's use a simpler known trick: A composed chart with a bar for body and an error bar for wicks?
    // No, standard Custom Shape. We need the Y-axis scale function. 
    // Since we don't have easy access to scale() here without using a custom component inside the chart,
    // we will stick to a simpler visual for "Candle" mode: High-Low Bars if simple, or just a Bar that represents Open-Close.

    // Actually, "Yahoo Finance" style often implies OHLC.
    // Let's try to draw it. 'y' is the top, 'height' is diff.
    // This assumes the bar is mapped to [min(open,close), max(open,close)].

    // NOTE: Implementing perfect SVG candles in Recharts custom shape without scale access is hard.
    // We will draw a simple "Block" for the body.

    return (
        <g>
            {/* Wick - Approximated visually (Center line) */}
            {/* This is inaccurate without scale access. We will skip complex candle drawing to avoid painting fake data. */}
            {/* We will render a standard Bar for the body representation. */}
            <rect x={x} y={y} width={width} height={height} fill={color} />
        </g>
    );
};

const StockChart = ({ data, timeRange = '1M', currencySymbol = '₹' }) => {
    const [chartType, setChartType] = useState('area'); // area, line, candle

    // 1. SIMPLE VALIDATION
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%" bgcolor="#0d1117">
                <Typography color="text.secondary">Waiting for data...</Typography>
            </Box>
        );
    }

    // 2. ROBUST DATA TRANSFORMATION & AGGREGATION
    const chartData = useMemo(() => {
        let rawData = [...data];

        // AGGREGATION LOGIC: Show "Monthly" data for long ranges
        if (timeRange === '1Y' || timeRange === '5Y' || timeRange === 'max') {
            const monthlyGroups = {};
            rawData.forEach(item => {
                const d = new Date(item.Date);
                const key = `${d.getFullYear()}-${d.getMonth()}`; // Group by YYYY-Month
                monthlyGroups[key] = item; // Overwrite, keeping the LAST entry for that month
            });
            rawData = Object.values(monthlyGroups);
        }

        return rawData.map(item => {
            const dateObj = new Date(item.Date);
            return {
                ...item,
                // Core Data
                unixTime: dateObj.getTime(),
                dateObj: dateObj,
                close: parseFloat(item.Close),
                open: parseFloat(item.Open),
                high: parseFloat(item.High),
                low: parseFloat(item.Low),
                volume: parseFloat(item.Volume || 0),
                bodyMin: Math.min(parseFloat(item.Open), parseFloat(item.Close)),
                bodyMax: Math.max(parseFloat(item.Open), parseFloat(item.Close)),
            };
        });
    }, [data, timeRange]);

    // Formatters
    const xAxisFormatter = (tickItem) => {
        if (!tickItem) return '';
        const d = new Date(tickItem);
        if (timeRange === '1W') return format(d, 'EEE'); // Mon
        if (timeRange === '1M') return format(d, 'MMM d'); // Jan 5
        // For long ranges, show Month/Year
        if (timeRange === '5Y' || timeRange === 'max') return format(d, 'MMM yy'); // Jan 24
        return format(d, 'MMM'); // Jan (for 1Y)
    };

    const volumeFormatter = (val) => {
        if (val > 10000000) return `${(val / 10000000).toFixed(1)}Cr`; // Indian context often uses Crores, but M/B is standard
        if (val > 1000000) return `${(val / 1000000).toFixed(1)}M`;
        if (val > 1000) return `${(val / 1000).toFixed(1)}K`;
        return val;
    };

    // 3. ADVANCED TOOLTIP
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload; // Access full data item
            const isUp = d.close >= d.open;
            return (
                <Box
                    sx={{
                        bgcolor: '#161b22', // Darker background
                        border: '1px solid #30363d',
                        borderRadius: '6px',
                        p: 1.5,
                        minWidth: '180px',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.6)'
                    }}
                >
                    <Typography variant="caption" sx={{ color: '#8b949e', mb: 1, display: 'block' }}>
                        {format(new Date(label), 'EEE, MMM d, yyyy h:mm a')}
                    </Typography>

                    <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1}>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Open</Typography>
                            <Typography variant="body2" fontWeight="600" color="#c9d1d9">
                                {currencySymbol}{d.open.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">High</Typography>
                            <Typography variant="body2" fontWeight="600" color="#3fb950">
                                {currencySymbol}{d.high.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Low</Typography>
                            <Typography variant="body2" fontWeight="600" color="#f85149">
                                {currencySymbol}{d.low.toFixed(2)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary">Close</Typography>
                            <Typography variant="body2" fontWeight="600" color={isUp ? '#3fb950' : '#f85149'}>
                                {currencySymbol}{d.close.toFixed(2)}
                            </Typography>
                        </Box>
                    </Box>
                    <Box mt={1} pt={1} borderTop="1px solid #30363d">
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Volume</Typography>
                            <Typography variant="caption" color="#c9d1d9">{volumeFormatter(d.volume)}</Typography>
                        </Box>
                    </Box>
                </Box>
            );
        }
        return null;
    };

    return (
        <Box sx={{ width: '100%', height: '100%', bgcolor: '#0d1117', p: 1, position: 'relative' }}>

            {/* --- CHART TYPE CONTROLS (Absolute Overlay) --- */}
            <Stack
                direction="row"
                spacing={0.5}
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: 20,
                    zIndex: 10,
                    bgcolor: 'rgba(22,27,34,0.8)',
                    backdropFilter: 'blur(4px)',
                    borderRadius: 1,
                    p: 0.5,
                    border: '1px solid #30363d'
                }}
            >
                <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={(e, v) => v && setChartType(v)}
                    size="small"
                    sx={{ height: 28 }}
                >
                    <ToggleButton value="area" sx={{ px: 1, borderColor: '#30363d' }}>
                        <ShowChart fontSize="small" sx={{ fontSize: 16 }} />
                    </ToggleButton>
                    <ToggleButton value="line" sx={{ px: 1, borderColor: '#30363d' }}>
                        <Timeline fontSize="small" sx={{ fontSize: 16 }} />
                    </ToggleButton>
                    <ToggleButton value="bar" sx={{ px: 1, borderColor: '#30363d' }}>
                        <BarChartOutlined fontSize="small" sx={{ fontSize: 16 }} />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#58a6ff" stopOpacity={0.05} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#21262d" vertical={false} />

                    <XAxis
                        dataKey="unixTime"
                        scale="time"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={xAxisFormatter}
                        stroke="#8b949e"
                        tick={{ fill: '#8b949e', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={40}
                        height={40}
                    />

                    {/* Price Axis (Left) */}
                    <YAxis
                        yAxisId="price"
                        domain={['auto', 'auto']}
                        orientation="right"
                        tickFormatter={(val) => val.toFixed(0)}
                        stroke="#8b949e"
                        tick={{ fill: '#8b949e', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={45} // Minimal width
                    />

                    {/* Volume Axis (Right/Hidden, scaled down) */}
                    <YAxis
                        yAxisId="volume"
                        domain={[0, (dataMax) => dataMax * 5]} // Scale volume to stay low
                        orientation="left"
                        show={false}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#58a6ff', strokeWidth: 1, strokeDasharray: '4 4' }}
                        isAnimationActive={false}
                    />

                    {/* --- CHART LAYERS --- */}

                    {/* Volume Bars (Always visible, bottom layer) */}
                    <Bar
                        dataKey="volume"
                        yAxisId="volume"
                        fill="#30363d"
                        barSize={chartType === 'bar' ? undefined : 3}
                        opacity={0.5}
                    />

                    {/* Main Pricing Layer */}
                    {chartType === 'area' && (
                        <Area
                            type="monotone"
                            dataKey="close"
                            yAxisId="price"
                            stroke="#58a6ff"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorClose)"
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                        />
                    )}

                    {chartType === 'line' && (
                        <Line
                            type="monotone"
                            dataKey="close"
                            yAxisId="price"
                            stroke="#58a6ff"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, strokeWidth: 0, fill: '#fff' }}
                        />
                    )}

                    {chartType === 'bar' && (
                        /* Using ComposedChart Bar for OHLC-like representation is tricky. 
                           We map [max(open, close)] to value.
                           It's simpler to show High-Low bars or just standard OHLC shapes if we had them.
                           Here we fall back to a "Bar" chart of Close prices for simplicity in this constrained requirement.
                        */
                        <Bar
                            dataKey="close"
                            yAxisId="price"
                            fill="#58a6ff"
                            barSize={5}
                        />
                    )}

                    {/* Interactive Zoom Brush (Simplified Scrollbar Style) */}
                    <Brush
                        dataKey="unixTime"
                        height={12}
                        stroke="#30363d"
                        fill="#0d1117"
                        tickFormatter={() => ''}
                        travellerWidth={0}
                        y={undefined}
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default StockChart;
