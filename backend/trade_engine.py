import pandas as pd
import yfinance as yf
import numpy as np
import random
from datetime import datetime, timedelta

class TradeSignalGenerator:
    def __init__(self):
        self.demo_mode = False

    def fetch_data(self, ticker: str, timeframe: str = "1M") -> pd.DataFrame:
        try:
            # Map timeframe to yfinance parameters
            timeframe_map = {
                "1W": {"period": "7d", "interval": "30m"},
                "1M": {"period": "1mo", "interval": "1d"},
                "1Y": {"period": "1y", "interval": "1d"}
            }
            
            tf_params = timeframe_map.get(timeframe, {"period": "1mo", "interval": "1d"})
            
            # Live Mode
            df = yf.download(
                ticker,
                period=tf_params["period"],
                interval=tf_params["interval"],
                progress=False,
                threads=False,
                auto_adjust=True
            )

            # Fix for yfinance returning MultiIndex columns
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            if df is None or df.empty or len(df) < 10:
                print("⚠ Live data failed or insufficient, switching to DEMO MODE.")
                self.demo_mode = True
                return self.generate_demo_data(ticker)

            self.demo_mode = False
            return df

        except Exception as e:
            print(f"⚠ DATA FETCH ERROR: {e}, switching to DEMO MODE.")
            self.demo_mode = True
            return self.generate_demo_data(ticker)

    def generate_demo_data(self, ticker: str) -> pd.DataFrame:
        """Generates realistic synthetic OHLC data for demo purposes."""
        dates = pd.date_range(end=datetime.now(), periods=60, freq="D")
        base_price = 150.0 + random.uniform(-20, 20)
        data = []
        
        price = base_price
        for d in dates:
            change = random.uniform(-2, 2)
            price += change
            # Create synthetic OHLC
            low = price - random.uniform(0.5, 1.5)
            high = price + random.uniform(0.5, 1.5)
            open_p = (low + high) / 2 + random.uniform(-0.5, 0.5)
            close_p = price
            
            data.append({
                "Date": d,
                "Open": round(open_p, 2),
                "High": round(high, 2),
                "Low": round(low, 2),
                "Close": round(close_p, 2),
                "Volume": int(random.uniform(1000000, 5000000))
            })
            
        df = pd.DataFrame(data)
        df.set_index("Date", inplace=True)
        return df

    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        if df.empty:
            return df

        # Ensure numeric
        for col in ["Close", "Open", "High", "Low"]:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        # SMA
        df["SMA_20"] = df["Close"].rolling(20).mean()
        df["SMA_50"] = df["Close"].rolling(50).mean()

        # RSI
        delta = df["Close"].diff()
        gain = delta.clip(lower=0).rolling(14).mean()
        loss = (-delta.clip(upper=0)).rolling(14).mean()
        rs = gain / loss.replace(0, 0.001)
        df["RSI"] = 100 - (100 / (1 + rs))

        # MACD
        exp12 = df["Close"].ewm(span=12, adjust=False).mean()
        exp26 = df["Close"].ewm(span=26, adjust=False).mean()
        df["MACD"] = exp12 - exp26
        df["Signal_Line"] = df["MACD"].ewm(span=9, adjust=False).mean()
        df["MACD_Hist"] = df["MACD"] - df["Signal_Line"]

        # Bollinger Bands
        df["BB_Middle"] = df["Close"].rolling(20).mean()
        df["BB_Std"] = df["Close"].rolling(20).std()
        df["BB_Upper"] = df["BB_Middle"] + (df["BB_Std"] * 2)
        df["BB_Lower"] = df["BB_Middle"] - (df["BB_Std"] * 2)

        # Volatility & Momentum
        df["returns"] = df["Close"].pct_change()
        df["volatility"] = df["returns"].rolling(14).std()
        df["momentum"] = df["Close"] - df["Close"].shift(5)

        return df.fillna(0)

    def estimate_next_24h(self, df: pd.DataFrame, sentiment_score: float = 0) -> dict:
        latest = df.iloc[-1]
        price_now = float(latest["Close"])
        vol = float(latest["volatility"]) if latest["volatility"] > 0 else 0.015
        momentum = float(latest["momentum"])

        # Hybrid Prediction Logic
        one_sigma_move = price_now * vol
        
        # Sentiment weight (-1 to 1)
        sent_weight = (sentiment_score / 100.0) * 0.5
        mom_weight = 0.5 if momentum > 0 else -0.5
        
        total_bias = sent_weight + (mom_weight * 0.5)
        
        expected_change = one_sigma_move * total_bias
        estimated_price = price_now + expected_change
        
        low_est = estimated_price - one_sigma_move
        high_est = estimated_price + one_sigma_move
        
        confidence = 70
        if (momentum > 0 and sentiment_score > 0) or (momentum < 0 and sentiment_score < 0):
            confidence += 10
        if vol > 0.03: 
            confidence -= 15
            
        return {
            "estimated_price": round(estimated_price, 2),
            "range": [round(low_est, 2), round(high_est, 2)],
            "prediction_confidence": min(max(confidence, 40), 95),
            "volatility_factor": round(vol, 4)
        }

    def get_signal(self, ticker: str, sentiment_score: float = 0, timeframe: str = "1M") -> dict:
        df = self.fetch_data(ticker, timeframe)
        
        if df.empty:
             return { "error": "No data found" }

        df = self.calculate_indicators(df)
        latest = df.iloc[-1]
        
        # Values
        price = float(latest["Close"])
        rsi = float(latest["RSI"]) if not pd.isna(latest["RSI"]) else 50
        macd = float(latest["MACD"])
        macd_signal = float(latest["Signal_Line"])
        macd_hist = float(latest["MACD_Hist"])
        
        bb_upper = float(latest["BB_Upper"])
        bb_lower = float(latest["BB_Lower"])
        bb_mid = float(latest["BB_Middle"])

        # Support & Resistance (Simple: 3 month Min/Max)
        support = float(df["Low"].tail(60).min())
        resistance = float(df["High"].tail(60).max())

        # Determine Market Bias
        sma_50 = float(latest["SMA_50"])
        sma_20 = float(latest["SMA_20"])
        
        bias = "Neutral"
        if price > sma_50 and sma_20 > sma_50:
            bias = "Positive"
        elif price < sma_50 and sma_20 < sma_50:
            bias = "Negative"
            
        if 45 <= rsi <= 55:
            bias = "Neutral"

        # Prediction
        prediction = self.estimate_next_24h(df, sentiment_score)
        
        # Charts Data
        chart_data = df.tail(100).reset_index()
        if "Date" not in chart_data.columns:
             chart_data["Date"] = chart_data.index
        
        chart_output = []
        for _, row in chart_data.iterrows():
            chart_output.append({
                "Date": row["Date"].strftime("%Y-%m-%d"),
                "Open": row["Open"],
                "High": row["High"],
                "Low": row["Low"],
                "Close": row["Close"],
                "Volume": row.get("Volume", 0),
                "SMA_50": row["SMA_50"] if row["SMA_50"] != 0 else None
            })

        return {
            "mode": "DEMO" if self.demo_mode else "LIVE",
            "price": round(price, 2),
            "change_percent": round(latest["returns"] * 100, 2),
            "volume": int(latest.get("Volume", 0)),
            "market_bias": bias,
            "technical_analysis": {
                "rsi": round(rsi, 2),
                "macd": round(macd, 2),
                "macd_signal": round(macd_signal, 2),
                "macd_hist": round(macd_hist, 2),
                "bb_upper": round(bb_upper, 2),
                "bb_lower": round(bb_lower, 2),
                "bb_mid": round(bb_mid, 2),
                "support": round(support, 2),
                "resistance": round(resistance, 2),
                "summary": f"RSI is {round(rsi, 1)}. Bollinger Bands squeeze indicates potential breakout."
            },
            "prediction": prediction,
            "charts": chart_output,
            "ai_explanation": {
                "summary": f"Model predicts {prediction['estimated_price']} based on {bias.lower()} trend.",
                "drivers": ["Momentum", "Volatility", "Technical Support"]
            },
            "sentiment_breakdown": {
                "price_momentum": round(latest["momentum"], 2),
                "technical_indicators": round(rsi - 50, 1),
                "volume_activity": 0.0, # Placeholder
                "volatility_adj": round(prediction["volatility_factor"] * -100, 1)
            }
        }
