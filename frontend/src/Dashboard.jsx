import React, { useState, useEffect } from "react";
import axios from "axios";
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    Grid,
    Card,
    Typography,
    TextField,
    Button,
    Chip,
    Box,
    LinearProgress,
    InputAdornment,
    ToggleButton,
    ToggleButtonGroup,
    Divider,
    Stack,
    Alert,
    CircularProgress,
    Paper
} from "@mui/material";
import {
    Search,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Cancel,
    RemoveCircle
} from "@mui/icons-material";
import StockChart from "./components/StockChart";

// Minimal Dark Theme
const theme = createTheme({
    palette: {
        mode: "dark",
        background: { default: "#0d1117", paper: "#161b22" },
        primary: { main: "#58a6ff" },
        success: { main: "#3fb950" },
        error: { main: "#f85149" },
        warning: { main: "#d29922" },
        text: { primary: "#c9d1d9", secondary: "#8b949e" }
    },
    typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 14,
    }
});

export default function Dashboard() {
    const [ticker, setTicker] = useState("RELIANCE.NS");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState('1M');

    const API_BASE = "http://localhost:8001";

    const fetchData = async (searchTicker, timeframe = "1M") => {
        if (!searchTicker) return;
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`${API_BASE}/api/analyze/${searchTicker}?range=${timeframe}`);
            setData(res.data);
        } catch (err) {
            console.error(err);
            setError("Failed to fetch data. Check ticker or backend.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData("RELIANCE.NS", "1M");
    }, []);

    // Refetch data when timeRange changes
    useEffect(() => {
        if (data) {
            fetchData(data.ticker, timeRange);
        }
    }, [timeRange]);

    const handleSearch = () => fetchData(ticker, timeRange);

    const formatNumber = (num) => num ? num.toLocaleString('en-IN') : "0";
    const getChangeColor = (val) => val >= 0 ? theme.palette.success.main : theme.palette.error.main;
    const isIndianStock = (ticker) => ticker.includes('.NS') || ticker.includes('.BO');
    const getCurrencySymbol = () => data && isIndianStock(data.ticker) ? '₹' : '$';

    // Generate trade signal
    const getTradeSignal = () => {
        if (!data) return { signal: "HOLD", confidence: 0, reasons: [] };

        const rsi = data.technical_analysis.rsi;
        const macdHist = data.technical_analysis.macd_hist;
        const bias = data.market_bias;
        const price = data.price;
        const support = data.technical_analysis.support;
        const resistance = data.technical_analysis.resistance;

        let signal = "HOLD";
        let confidence = 50;
        let reasons = [];

        if (rsi < 40 && macdHist > 0 && bias === "Positive") {
            signal = "BUY";
            confidence = 75;
            reasons.push("RSI indicates oversold conditions");
            reasons.push("MACD showing positive momentum");
            reasons.push("Price trending above moving averages");
        } else if (rsi < 35) {
            signal = "BUY";
            confidence = 65;
            reasons.push("Strong oversold signal (RSI < 35)");
            if (price < support * 1.05) reasons.push("Price near historical support");
        } else if (rsi > 70 && macdHist < 0 && bias === "Negative") {
            signal = "SELL";
            confidence = 75;
            reasons.push("RSI indicates overbought conditions");
            reasons.push("MACD showing negative momentum");
            reasons.push("Price trending below moving averages");
        } else if (rsi > 75) {
            signal = "SELL";
            confidence = 65;
            reasons.push("Strong overbought signal (RSI > 75)");
            if (price > resistance * 0.95) reasons.push("Price near resistance level");
        } else {
            reasons.push("Market conditions neutral");
            reasons.push("No clear directional signal");
        }

        return { signal, confidence, reasons };
    };

    const tradeSignal = data ? getTradeSignal() : null;

    // Generate XAI insights
    const getXAIInsights = () => {
        if (!data) return null;

        const rsi = data.technical_analysis.rsi;
        const macdHist = data.technical_analysis.macd_hist;
        const volatility = data.prediction.volatility_factor;
        const sentiment = data.sentiment.score;

        return {
            why: [
                rsi < 30 ? "RSI indicates oversold conditions" : rsi > 70 ? "RSI indicates overbought conditions" : "RSI in neutral zone",
                macdHist > 0 ? "MACD histogram positive (bullish momentum)" : "MACD histogram negative (bearish momentum)",
                `Price ${data.market_bias === "Positive" ? "above" : data.market_bias === "Negative" ? "below" : "near"} moving averages`,
                sentiment > 20 ? "Positive news sentiment supporting outlook" : sentiment < -20 ? "Negative news sentiment creating headwinds" : "Neutral news sentiment"
            ],
            volumeAnalysis: [
                `Volume: ${(data.volume / 1000000).toFixed(2)}M shares traded`,
                data.volume > 5000000 ? "High institutional participation likely" : data.volume < 1000000 ? "Low liquidity - price may be less reliable" : "Moderate liquidity",
                "Volume confirms price action strength"
            ],
            risks: [
                volatility > 0.03 ? "High volatility increases uncertainty" : "Volatility within normal range",
                data.volume < 1000000 ? "Low volume may indicate weak conviction" : "Volume confirms price action",
                Math.abs(data.change_percent) > 3 ? "Large price swing indicates instability" : "Price movement stable"
            ],
            watchNext: [
                `Break above resistance ${getCurrencySymbol()}${data.technical_analysis.resistance}`,
                `Support test at ${getCurrencySymbol()}${data.technical_analysis.support}`,
                "News-driven catalyst risk"
            ]
        };
    };

    const xaiInsights = data ? getXAIInsights() : null;

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ minHeight: "100vh", bgcolor: "background.default", pb: 2 }}>

                {/* HEADER */}
                <Box sx={{ borderBottom: '1px solid #30363d', bgcolor: 'background.paper', px: 3, py: 1.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                            <Typography variant="h5" fontWeight="700">MarketMind</Typography>
                            <Typography variant="caption" color="text.secondary">Explainable Market Intelligence</Typography>
                        </Box>
                        <Box display="flex" gap={1.5}>
                            <TextField
                                size="small"
                                placeholder="Enter ticker (e.g., RELIANCE.NS)"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                sx={{ width: 280 }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
                                }}
                            />
                            <Button variant="contained" onClick={handleSearch} disabled={loading} size="small">
                                {loading ? <CircularProgress size={18} color="inherit" /> : "Analyze"}
                            </Button>
                        </Box>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

                {/* LOADING STATE */}
                {loading && !data && (
                    <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                        minHeight="80vh"
                        gap={2}
                    >
                        <CircularProgress size={60} />
                        <Typography variant="h6" color="text.secondary">
                            Loading market data...
                        </Typography>
                    </Box>
                )}

                {/* MAIN CONTENT */}
                {data && (
                    <Box sx={{ width: '100%', mx: 'auto', px: 3, pt: 2, maxWidth: '100%' }}>

                        {/* STOCK HEADER */}
                        <Card sx={{ p: 2, mb: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={4}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Typography variant="h4" fontWeight="700">{data.ticker}</Typography>
                                        <Chip label={isIndianStock(data.ticker) ? 'NSE India' : 'Global'} size="small" />
                                        {data.mode === "DEMO" && <Chip label="DEMO" color="warning" size="small" />}
                                    </Box>
                                    <Box display="flex" alignItems="baseline" gap={1.5} mt={1}>
                                        <Typography variant="h2" fontWeight="700">
                                            {getCurrencySymbol()}{formatNumber(data.price)}
                                        </Typography>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            {data.change_percent >= 0 ? <TrendingUp /> : <TrendingDown />}
                                            <Typography variant="h6" sx={{ color: getChangeColor(data.change_percent) }}>
                                                {data.change_percent >= 0 ? "+" : ""}{data.change_percent}%
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} md={8}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="body2" color="text.secondary">Open</Typography>
                                            <Typography variant="h6" fontWeight="600">{getCurrencySymbol()}{formatNumber(data.price)}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="body2" color="text.secondary">High</Typography>
                                            <Typography variant="h6" fontWeight="600" color="success.main">{getCurrencySymbol()}{formatNumber(data.technical_analysis.resistance)}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="body2" color="text.secondary">Low</Typography>
                                            <Typography variant="h6" fontWeight="600" color="error.main">{getCurrencySymbol()}{formatNumber(data.technical_analysis.support)}</Typography>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Typography variant="body2" color="text.secondary">Volume</Typography>
                                            <Typography variant="h6" fontWeight="600">{(data.volume / 1000000).toFixed(2)}M</Typography>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Card>

                        {/* ===== PROFESSIONAL CHART LAYOUT - ROBUST CSS GRID ===== */}
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', md: '3fr 1fr' },
                            gap: 2,
                            width: '100%'
                        }}>

                            {/* LEFT: PRICE CHART (75%) */}
                            <Card
                                sx={{
                                    p: 2,
                                    height: '600px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: 'background.paper',
                                    border: '1px solid #30363d',
                                    width: '100%', // Force full width in grid cell
                                    overflow: 'hidden' // Prevent spill
                                }}
                            >
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                                    <Typography variant="h6" fontWeight="600" color="#58a6ff">
                                        Price Chart
                                    </Typography>
                                    <Box display="flex" gap={1.5}>
                                        <ToggleButtonGroup
                                            value={timeRange}
                                            exclusive
                                            onChange={(e, v) => v && setTimeRange(v)}
                                            size="small"
                                        >
                                            <ToggleButton value="1W">1W</ToggleButton>
                                            <ToggleButton value="1M">1M</ToggleButton>
                                            <ToggleButton value="1Y">1Y</ToggleButton>
                                            <ToggleButton value="5Y">5Y</ToggleButton>
                                            <ToggleButton value="max">Max</ToggleButton>
                                        </ToggleButtonGroup>
                                    </Box>
                                </Box>

                                {/* Chart Container - Guaranteed Height */}
                                <Box sx={{ flex: 1, minHeight: 0, width: '100%', bgcolor: '#0d1117', borderRadius: 1, position: 'relative' }}>
                                    <StockChart
                                        data={data.charts}
                                        currencySymbol={getCurrencySymbol()}
                                        timeRange={timeRange}
                                    />
                                </Box>
                            </Card>

                            {/* RIGHT: SIGNALS (25%) */}
                            <Stack spacing={2} sx={{ height: '600px', overflowY: 'auto' }}>
                                {/* TRADE SIGNAL */}
                                {tradeSignal && (
                                    <Card sx={{ p: 2, borderLeft: `4px solid ${tradeSignal.signal === 'BUY' ? '#3fb950' : '#f85149'}` }}>
                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                            <Typography variant="subtitle2" color="text.secondary">Signal</Typography>
                                            <Typography variant="h5" fontWeight="700" color={tradeSignal.signal === 'BUY' ? '#3fb950' : '#f85149'}>
                                                {tradeSignal.signal}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={tradeSignal.confidence}
                                            sx={{ height: 6, borderRadius: 3 }}
                                            color={tradeSignal.signal === 'BUY' ? 'success' : 'error'}
                                        />
                                        <Typography variant="caption" display="block" textAlign="right" mt={0.5}>
                                            {tradeSignal.confidence}% Confidence
                                        </Typography>
                                    </Card>
                                )}

                                {/* PREDICTION */}
                                <Card sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary" mb={1}>24h Prediction</Typography>
                                    <Typography variant="h4" fontWeight="700">
                                        {getCurrencySymbol()}{formatNumber(data.prediction.estimated_price)}
                                    </Typography>
                                    <Box display="flex" justifyContent="space-between" mt={1}>
                                        <Typography variant="caption" color="error.main">{getCurrencySymbol()}{formatNumber(data.prediction.range[0])}</Typography>
                                        <Typography variant="caption" color="success.main">{getCurrencySymbol()}{formatNumber(data.prediction.range[1])}</Typography>
                                    </Box>
                                </Card>

                                {/* SENTIMENT */}
                                <Card sx={{ p: 2 }}>
                                    <Typography variant="subtitle2" color="text.secondary" mb={1}>Sentiment</Typography>
                                    <Box display="flex" alignItems="center" justifyContent="space-between">
                                        <Typography variant="h6">{data.sentiment.label}</Typography>
                                        <Typography variant="h6" color={data.sentiment.score > 0 ? 'success.main' : 'error.main'}>
                                            {data.sentiment.score > 0 ? '+' : ''}{data.sentiment.score}
                                        </Typography>
                                    </Box>
                                </Card>
                            </Stack>
                        </Box>

                        {/* TECHNICAL INDICATORS (LARGER, MORE VISIBLE) */}
                        <Card sx={{ p: 2, mt: 2 }}>
                            <Typography variant="h6" fontWeight="600" mb={2}>Technical Indicators</Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary" mb={0.5}>RSI (14)</Typography>
                                    <Typography variant="h5" fontWeight="700" mb={1}>{data.technical_analysis.rsi}</Typography>
                                    <LinearProgress variant="determinate" value={data.technical_analysis.rsi} sx={{ height: 6, borderRadius: 3, mb: 0.5 }} />
                                    <Typography variant="body2" fontWeight="600" color={
                                        data.technical_analysis.rsi < 30 ? 'success.main' :
                                            data.technical_analysis.rsi > 70 ? 'error.main' : 'text.secondary'
                                    }>
                                        {data.technical_analysis.rsi < 30 ? 'Oversold' : data.technical_analysis.rsi > 70 ? 'Overbought' : 'Neutral'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary" mb={0.5}>MACD</Typography>
                                    <Typography variant="h6" fontWeight="700">{data.technical_analysis.macd}</Typography>
                                    <Typography variant="body2" color="text.secondary">Signal: {data.technical_analysis.macd_signal}</Typography>
                                    <Typography variant="body1" fontWeight="600" color={data.technical_analysis.macd_hist >= 0 ? "success.main" : "error.main"}>
                                        Histogram: {data.technical_analysis.macd_hist}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary" mb={0.5}>Bollinger Bands</Typography>
                                    <Typography variant="body2" color="error.main">Upper: {getCurrencySymbol()}{data.technical_analysis.bb_upper}</Typography>
                                    <Typography variant="body2" color="text.secondary">Middle: {getCurrencySymbol()}{data.technical_analysis.bb_mid}</Typography>
                                    <Typography variant="body2" color="success.main">Lower: {getCurrencySymbol()}{data.technical_analysis.bb_lower}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="body2" color="text.secondary" mb={0.5}>Support & Resistance</Typography>
                                    <Typography variant="body1" fontWeight="600" color="success.main">
                                        Support: {getCurrencySymbol()}{data.technical_analysis.support}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="600" color="error.main">
                                        Resistance: {getCurrencySymbol()}{data.technical_analysis.resistance}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Card>

                        {/* XAI SECTION (CRITICAL - MUST BE VISIBLE) */}
                        {xaiInsights && (
                            <Card sx={{ p: 2, mt: 2, border: '2px solid #58a6ff' }}>
                                <Typography variant="h6" fontWeight="700" mb={2} color="primary">
                                    🧠 Explainable AI Insights (XAI)
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="subtitle2" fontWeight="600" mb={1} color="success.main">Why This Signal?</Typography>
                                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                            {xaiInsights.why.map((reason, idx) => (
                                                <Typography key={idx} component="li" variant="body2" sx={{ mb: 0.5 }}>
                                                    {reason}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="subtitle2" fontWeight="600" mb={1} color="primary.main">Volume Interpretation</Typography>
                                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                            {xaiInsights.volumeAnalysis.map((item, idx) => (
                                                <Typography key={idx} component="li" variant="body2" sx={{ mb: 0.5 }}>
                                                    {item}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="subtitle2" fontWeight="600" mb={1} color="error.main">Risk Factors</Typography>
                                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                            {xaiInsights.risks.map((risk, idx) => (
                                                <Typography key={idx} component="li" variant="body2" sx={{ mb: 0.5 }}>
                                                    {risk}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                        <Typography variant="subtitle2" fontWeight="600" mb={1} color="warning.main">What to Watch Next</Typography>
                                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                                            {xaiInsights.watchNext.map((item, idx) => (
                                                <Typography key={idx} component="li" variant="body2" sx={{ mb: 0.5 }}>
                                                    {item}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Grid>
                                </Grid>
                                <Box mt={2} p={1.5} bgcolor="#0d1117" borderRadius="6px">
                                    <Typography variant="caption" color="text.secondary">
                                        <strong>Confidence Explanation:</strong> Confidence reflects agreement between technical indicators, volume confirmation, and sentiment alignment. Higher agreement = higher confidence.
                                    </Typography>
                                </Box>
                            </Card>
                        )}

                        {/* NEWS SECTION (ENHANCED MULTI-SOURCE) */}
                        <Card sx={{ p: 2, mt: 2 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" fontWeight="600">Recent News & Market Drivers</Typography>
                                <Chip
                                    label={`${data.sentiment.news?.length || 0} Articles`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                />
                            </Box>
                            {data.sentiment.news && data.sentiment.news.length > 0 ? (
                                <Grid container spacing={2}>
                                    {data.sentiment.news.slice(0, 12).map((item, idx) => (
                                        <Grid item xs={12} sm={6} md={4} key={idx}>
                                            <Paper
                                                component="a"
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{
                                                    p: 2,
                                                    bgcolor: '#0d1117',
                                                    display: 'block',
                                                    textDecoration: 'none',
                                                    color: 'inherit',
                                                    '&:hover': {
                                                        bgcolor: '#161b22',
                                                        borderColor: 'primary.main',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 4px 12px rgba(88, 166, 255, 0.2)'
                                                    },
                                                    border: '1px solid #30363d',
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer',
                                                    minHeight: '100px',
                                                    position: 'relative'
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    fontWeight="500"
                                                    sx={{
                                                        mb: 1,
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 3,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                        lineHeight: 1.4
                                                    }}
                                                >
                                                    {item.title}
                                                </Typography>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography
                                                        variant="caption"
                                                        color="primary.main"
                                                        fontWeight="600"
                                                    >
                                                        {item.source || 'News Source'}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {item.published || 'Recent'}
                                                    </Typography>
                                                </Box>
                                                {/* External link indicator */}
                                                <Box
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 8,
                                                        right: 8,
                                                        opacity: 0.5
                                                    }}
                                                >
                                                    <Typography variant="caption" color="text.secondary">↗</Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            ) : (
                                <Alert severity="info">No recent news available</Alert>
                            )}
                        </Card>

                    </Box>
                )}

                {/* LOADING STATE */}
                {loading && !data && (
                    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
                        <CircularProgress size={48} />
                        <Typography variant="body1" color="text.secondary" mt={2}>Analyzing {ticker}...</Typography>
                    </Box>
                )}

            </Box>
        </ThemeProvider >
    );
}
