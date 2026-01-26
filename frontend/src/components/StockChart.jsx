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
    ReferenceLine
} from 'recharts';
import { Box, Typography, ToggleButton, ToggleButtonGroup, Stack } from '@mui/material';
import { ShowChart, BarChartOutlined, Timeline } from '@mui/icons-material';
import { format } from 'date-fns';

const StockChart = ({ data, timeRange = '1M', currencySymbol = '₹' }) => {
    const [chartType, setChartType] = useState('area');

    // 1. SIMPLE VALIDATION
    if (!data || !Array.isArray(data) || data.length === 0) {
        return (
            <Box display="flex" alignItems="center" justifyContent="center" height="100%" bgcolor="#0d1117">
                <Typography color="text.secondary" variant="body2">Waiting for market data...</Typography>
            </Box>
        );
    }

    // 2. DATA PREPARATION (No Aggregation - Full Fidelity for Zoom)
    const chartData = useMemo(() => {
        return data.map(item => {
            const d = new Date(item.Date);
            return {
                ...item,
                unixTime: d.getTime(),
                dateStr: d.toISOString(),
                close: parseFloat(item.Close),
                open: parseFloat(item.Open),
                high: parseFloat(item.High),
                low: parseFloat(item.Low),
                volume: parseFloat(item.Volume || 0),
                // Helper for color coding volume if needed (optional)
                isUp: parseFloat(item.Close) >= parseFloat(item.Open)
            };
        });
    }, [data]);

    // Formatters
    const xAxisFormatter = (tickItem) => {
        if (!tickItem) return '';
        const d = new Date(tickItem);
        // Smart Formatting based on Range
        if (timeRange === '1W') return format(d, 'EEE');
        if (timeRange === '1M') return format(d, 'dd MMM');
        if (timeRange === '1Y') return format(d, 'MMM');
        if (timeRange === '5Y' || timeRange === 'max') return format(d, 'yyyy');
        return format(d, 'dd MMM');
    };

    const volumeFormatter = (val) => {
        if (val > 10000000) return `${(val / 10000000).toFixed(2)}Cr`;
        if (val > 1000000) return `${(val / 1000000).toFixed(2)}M`;
        if (val > 1000) return `${(val / 1000).toFixed(2)}K`;
        return val;
    };

    // 3. PROFESSIONAL TOOLTIP
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const d = payload[0].payload;
            const isUp = d.close >= d.open;
            const color = isUp ? '#00C805' : '#FF333A'; // Yahoo Finance style colors

            return (
                <Box
                    sx={{
                        bgcolor: 'rgba(13, 17, 23, 0.95)',
                        border: '1px solid #30363d',
                        borderRadius: '4px',
                        p: 1.5,
                        minWidth: '200px',
                        backdropFilter: 'blur(4px)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}
                >
                    <Typography variant="caption" sx={{ color: '#8b949e', mb: 1, display: 'block', fontSize: '11px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {format(new Date(label), 'EEE, MMM dd, yyyy')}
                    </Typography>

                    <Box display="grid" gridTemplateColumns="1fr 1fr" columnGap={3} rowGap={0.5}>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Open</Typography>
                            <Typography variant="body2" fontWeight="600" color="text.primary">{currencySymbol}{d.open.toFixed(2)}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">High</Typography>
                            <Typography variant="body2" fontWeight="600" color="#00C805">{currencySymbol}{d.high.toFixed(2)}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Low</Typography>
                            <Typography variant="body2" fontWeight="600" color="#FF333A">{currencySymbol}{d.low.toFixed(2)}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Close</Typography>
                            <Typography variant="body2" fontWeight="600" color={color}>{currencySymbol}{d.close.toFixed(2)}</Typography>
                        </Box>
                    </Box>

                    <Box mt={1.5} pt={1} borderTop="1px solid rgba(48, 54, 61, 0.5)" display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">Vol</Typography>
                        <Typography variant="caption" fontWeight="600" color="#c9d1d9">{volumeFormatter(d.volume)}</Typography>
                    </Box>
                </Box>
            );
        }
        return null;
    };

    return (
        <Box sx={{ width: '100%', height: '100%', bgcolor: '#0d1117', p: 0, position: 'relative' }}>

            {/* --- CONTROLS OVERLAY --- */}
            <Stack
                direction="row"
                spacing={0.5}
                sx={{
                    position: 'absolute',
                    top: 10,
                    right: 20,
                    zIndex: 20,
                }}
            >
                <ToggleButtonGroup
                    value={chartType}
                    exclusive
                    onChange={(e, v) => v && setChartType(v)}
                    size="small"
                    sx={{
                        height: 24,
                        bgcolor: 'rgba(22,27,34,0.6)',
                        backdropFilter: 'blur(2px)',
                        border: '1px solid #30363d'
                    }}
                >
                    <ToggleButton value="area" sx={{ px: 1, border: 'none', color: '#8b949e', '&.Mui-selected': { color: '#58a6ff', bgcolor: 'rgba(56,139,253,0.1)' } }}>
                        <ShowChart sx={{ fontSize: 16 }} />
                    </ToggleButton>
                    <ToggleButton value="line" sx={{ px: 1, border: 'none', color: '#8b949e', '&.Mui-selected': { color: '#58a6ff', bgcolor: 'rgba(56,139,253,0.1)' } }}>
                        <Timeline sx={{ fontSize: 16 }} />
                    </ToggleButton>
                    <ToggleButton value="bar" sx={{ px: 1, border: 'none', color: '#8b949e', '&.Mui-selected': { color: '#58a6ff', bgcolor: 'rgba(56,139,253,0.1)' } }}>
                        <BarChartOutlined sx={{ fontSize: 16 }} />
                    </ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        {/* Professional Gradient for Area Chart */}
                        <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#2962FF" stopOpacity={0.0} />
                        </linearGradient>
                        {/* Gradient for Volume */}
                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#30363d" stopOpacity={0.7} />
                            <stop offset="95%" stopColor="#30363d" stopOpacity={0.1} />
                        </linearGradient>
                    </defs>

                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#21262d"
                        vertical={false}
                        opacity={0.5}
                    />

                    <XAxis
                        dataKey="unixTime"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        scale="time"
                        tickFormatter={xAxisFormatter}
                        stroke="#30363d"
                        tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'sans-serif' }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={50}
                        dy={5}
                    />

                    <YAxis
                        yAxisId="price"
                        domain={['auto', 'auto']}
                        orientation="right"
                        tickFormatter={(val) => val.toFixed(0)}
                        stroke="#30363d"
                        tick={{ fill: '#8b949e', fontSize: 10, fontFamily: 'sans-serif' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                        dx={-5}
                    />

                    {/* Secondary Axis for Volume - Scaled to push bars down (High Max Domain) */}
                    <YAxis
                        yAxisId="volume"
                        domain={[0, (dataMax) => dataMax * 4]} // Multiply by 4 to squash bars to bottom 25%
                        orientation="left"
                        show={false}
                    />

                    <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ stroke: '#58a6ff', strokeWidth: 1, strokeDasharray: '3 3' }}
                        isAnimationActive={true}
                        animationDuration={200}
                    />

                    {/* LAYERS */}

                    {/* 1. Volume Bars (Background, Squashed) */}
                    <Bar
                        dataKey="volume"
                        yAxisId="volume"
                        fill="url(#colorVolume)"
                        barSize={chartType === 'bar' ? undefined : 4} // Thin bars
                        opacity={0.8}
                        isAnimationActive={false}
                    />

                    {/* 2. Main Price Line/Area */}
                    {chartType === 'area' && (
                        <Area
                            type="monotone"
                            dataKey="close"
                            yAxisId="price"
                            stroke="#2962FF" // TradingView Blue
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorClose)"
                            activeDot={{ r: 4, stroke: '#2962FF', strokeWidth: 2, fill: '#0d1117' }}
                            isAnimationActive={true}
                            animationDuration={500}
                        />
                    )}

                    {chartType === 'line' && (
                        <Line
                            type="monotone"
                            dataKey="close"
                            yAxisId="price"
                            stroke="#2962FF"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4, stroke: '#2962FF', strokeWidth: 2, fill: '#0d1117' }}
                            isAnimationActive={true}
                            animationDuration={500}
                        />
                    )}

                    {chartType === 'bar' && (
                        <Bar
                            dataKey="close"
                            yAxisId="price"
                            fill="#2962FF"
                            barSize={6} // Slightly thicker for main view
                            opacity={0.9}
                            isAnimationActive={true}
                        />
                    )}

                    {/* 3. Interactive Brush (Zoom/Scroll) */}
                    <Brush
                        dataKey="unixTime"
                        height={20}
                        stroke="#30363d"
                        fill="#0d1117" // Dark background
                        tickFormatter={() => ''}
                        travellerWidth={10}
                        gap={1}
                        opacity={0.5}
                        y={chartType === 'area' ? 570 : undefined} // Adjust position slightly
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default StockChart;
