from fastapi import FastAPI, HTTPException
from trade_engine import TradeSignalGenerator
from sentiment_engine import SentimentEngine

from fastapi.middleware.cors import CORSMiddleware

import os
from dotenv import load_dotenv
from ai_engine import MarketReasoning

load_dotenv()

app = FastAPI(
    title="MarketMind Professional",
    version="2.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engines
engine = TradeSignalGenerator()
sentiment_engine = SentimentEngine()
ai_hub = MarketReasoning(api_key=os.getenv("GEMINI_API_KEY"))


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "message": "Backend running clean"
    }


@app.get("/api/analyze/{ticker}")
def analyze_stock(ticker: str, range: str = "1M"):
    try:
        # STEP 1: News & Sentiment
        news_items = sentiment_engine.fetch_news(ticker.upper())
        sentiment_data = sentiment_engine.analyze_sentiment(news_items)

        # STEP 2: Technical + Prediction (with timeframe)
        analysis_result = engine.get_signal(ticker.upper(), sentiment_score=sentiment_data["score"], timeframe=range)

        if "error" in analysis_result:
             raise HTTPException(status_code=404, detail="Ticker not found or data unavailable")

        # STEP 3: AI Market Synthesis (The Intelligence Layer)
        ai_analysis = ai_hub.analyze_market_state(
            ticker=ticker.upper(),
            technicals=analysis_result["technical_analysis"],
            headlines=news_items
        )

        # STEP 4: Assemble Final Response
        return {
            "ticker": ticker.upper(),
            "price": analysis_result["price"],
            "change_percent": analysis_result.get("change_percent", 0),
            "volume": analysis_result.get("volume", 0),
            "mode": analysis_result["mode"],
            "market_bias": analysis_result["market_bias"],
            "technical_analysis": analysis_result["technical_analysis"],
            "prediction": analysis_result["prediction"],
            "sentiment": {
                "score": sentiment_data["score"],
                "label": sentiment_data["label"],
                "summary": sentiment_data["explanation"],
                "components": analysis_result.get("sentiment_breakdown", {}),
                "news": news_items
            },
            "charts": analysis_result["charts"],
            "ai_analysis": ai_analysis, # New Synergistic Analysis
            "ai_explanation": analysis_result["ai_explanation"]
        }

    except Exception as e:
        print(f"Server Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )
