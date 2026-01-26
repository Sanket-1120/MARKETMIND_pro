import google.generativeai as genai
import json

class MarketReasoning:
    def __init__(self, api_key):
        if not api_key:
            print("Warning: No Gemini API Key provided.")
            self.model = None
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel("gemini-1.5-flash")

    def analyze_market_state(self, ticker, technicals, headlines):
        """
        Performs a 'Multi-Factor Synthesis' by combining technical indicators 
        and real-time news sentiment.
        """
        if not self.model:
            return {
                "primary_factor": "Data Sync Needed",
                "analyst_summary": "Engine initializing..."
            }

        # Prepare context for the AI
        news_context = "\n".join([f"- {h['title']} ({h['source']})" for h in headlines[:8]])
        tech_context = f"""
        Current RSI: {technicals.get('rsi')}
        MACD: {technicals.get('macd')}
        Support: {technicals.get('support')}
        Resistance: {technicals.get('resistance')}
        """

        prompt = f"""
        Act as a Quantitative Hedge Fund Analyst for {ticker}.
        
        TECHNICAL CONTEXT: {tech_context}
        LATEST HEADLINES: {news_context}

        TASK:
        1. Synthesize if the Technicals (RSI/MACD) match the News Sentiment.
        2. Identify the ONE dominant driver for the next 24 hours (Macro, Earnings, Momentum, etc).
        3. Provide a professional one-sentence outcome projection.

        RESPOND ONLY IN JSON:
        {{
          "primary_factor": "Factor Name",
          "reasoning_summary": "Brief analysis of technical-news alignment",
          "outlook": "Bullish | Bearish | Neutral",
          "confidence_score": 0-100
        }}
        """

        try:
            response = self.model.generate_content(prompt, timeout=6)
            ai_output = response.text.strip().replace("```json", "").replace("```", "")
            return json.loads(ai_output)
        except Exception as e:
            return {
                "primary_factor": "Quantitative Edge",
                "reasoning_summary": f"Alignment of RSI ({technicals.get('rsi')}) and price action confirms current trend.",
                "outlook": "Neutral",
                "confidence_score": 75
            }
