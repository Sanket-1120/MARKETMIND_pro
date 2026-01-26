import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    Paper,
    Tabs,
    Tab,
    useTheme
} from '@mui/material';
import { TrendingUp, TrendingDown, AccessTime } from '@mui/icons-material';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

// Mock data generator for sparklines
const generateSparkData = (isPositive) => {
    const data = [];
    let val = 50;
    for (let i = 0; i < 20; i++) {
        val += (Math.random() - 0.5) * 10 + (isPositive ? 1 : -1);
        data.push({ val });
    }
    return data;
};

const MarketItem = ({ ticker, name, price, change, changePercent, onClick }) => {
    const theme = useTheme();
    const isPositive = change >= 0;
    const color = isPositive ? theme.palette.success.main : theme.palette.error.main;
    const sparkData = generateSparkData(isPositive);

    return (
        <ListItem
            button
            onClick={() => onClick(ticker)}
            sx={{
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                py: 1.5,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
            }}
        >
            <Box width="100%">
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" fontWeight="700">{ticker}</Typography>
                    <Typography variant="body2" fontWeight="600">{price}</Typography>
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" flexDirection="column">
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 80 }}>
                            {name}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            {isPositive ? <TrendingUp sx={{ fontSize: 12, color }} /> : <TrendingDown sx={{ fontSize: 12, color }} />}
                            <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
                                {isPositive ? '+' : ''}{changePercent}%
                            </Typography>
                        </Box>
                    </Box>

                    {/* Sparkline */}
                    <Box width={60} height={30}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparkData}>
                                <Line
                                    type="monotone"
                                    dataKey="val"
                                    stroke={color}
                                    strokeWidth={2}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                                <YAxis domain={['dataMin', 'dataMax']} hide />
                            </LineChart>
                        </ResponsiveContainer>
                    </Box>
                </Box>
            </Box>
        </ListItem>
    );
};

export default function MarketWatchPanel({ onSelectTicker, recentlyViewed = [] }) {
    const [tabValue, setTabValue] = React.useState(0);

    // Mock Data for Top Gainers/Losers
    // Mock Data for Top Gainers/Losers
    const marketMovers = [
        { ticker: 'TCS.NS', name: 'Tata Consultancy', price: '4,250.00', change: 120.00, changePercent: 2.8 },
        { ticker: 'RELIANCE.NS', name: 'Reliance Ind', price: '2,980.50', change: -15.40, changePercent: -0.5 },
        { ticker: 'INFY.NS', name: 'Infosys Ltd', price: '1,650.20', change: 45.10, changePercent: 2.8 },
        { ticker: 'HDFCBANK.NS', name: 'HDFC Bank', price: '1,450.00', change: -22.00, changePercent: -1.5 },
        { ticker: 'AAPL', name: 'Apple Inc', price: '185.90', change: 1.20, changePercent: 0.65 },
        { ticker: 'NVDA', name: 'Nvidia Corp', price: '720.50', change: 15.30, changePercent: 2.1 },
        { ticker: 'TSLA', name: 'Tesla Inc', price: '190.50', change: -4.80, changePercent: -2.4 },
        { ticker: 'GOOGL', name: 'Alphabet Inc', price: '142.30', change: -1.60, changePercent: -1.1 },
    ];

    const sortedGainers = marketMovers.filter(item => item.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
    const sortedLosers = marketMovers.filter(item => item.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);

    return (
        <Paper sx={{
            height: '100%',
            bgcolor: 'background.paper',
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 0
        }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth" textColor="inherit" indicatorColor="primary">
                    <Tab label="Watchlist" sx={{ fontSize: '0.8rem', fontWeight: 600 }} />
                    <Tab label="Movers" sx={{ fontSize: '0.8rem', fontWeight: 600 }} />
                </Tabs>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {tabValue === 0 && (
                    <List disablePadding>
                        <Box px={2} py={1} bgcolor="rgba(255,255,255,0.02)">
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                RECENTLY VIEWED
                            </Typography>
                        </Box>
                        {recentlyViewed.length > 0 ? recentlyViewed.map((item, idx) => (
                            <MarketItem
                                key={idx}
                                ticker={item.ticker}
                                name={item.name || 'Stock'}
                                price={item.price || '0.00'}
                                change={item.change || 0}
                                changePercent={item.changePercent || 0}
                                onClick={onSelectTicker}
                            />
                        )) : (
                            <Box p={2} textAlign="center">
                                <Typography variant="caption" color="text.secondary">
                                    Search for stocks to build your watchlist
                                </Typography>
                            </Box>
                        )}
                    </List>
                )}

                {tabValue === 1 && (
                    <List disablePadding>
                        <Box px={2} py={1} bgcolor="rgba(255,255,255,0.02)">
                            <Typography variant="caption" color="success.main" fontWeight={600}>
                                TOP GAINERS
                            </Typography>
                        </Box>
                        {sortedGainers.slice(0, 3).map((item, idx) => (
                            <MarketItem key={`gain-${idx}`} {...item} onClick={onSelectTicker} />
                        ))}

                        <Divider sx={{ my: 1 }} />

                        <Box px={2} py={1} bgcolor="rgba(255,255,255,0.02)">
                            <Typography variant="caption" color="error.main" fontWeight={600}>
                                TOP LOSERS
                            </Typography>
                        </Box>
                        {sortedLosers.slice(0, 3).map((item, idx) => (
                            <MarketItem key={`lose-${idx}`} {...item} onClick={onSelectTicker} />
                        ))}
                    </List>
                )}
            </Box>
        </Paper>
    );
}
