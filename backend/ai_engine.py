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

    def analyze_news_factors(self, headlines):
        # 1. Safety checks
        if not self.model:
            return {
                "primary_factor": "Unknown",
                "analyst_summary": "AI analysis unavailable (API key missing)."
            }

        if not headlines:
            return {
                "primary_factor": "None",
                "analyst_summary": "No recent news available for analysis."
            }

        # 2. Prepare headlines text
        news_text = "\n".join([f"- {h['title']}" for h in headlines])

        # 3. Prompt
        prompt = f"""
        Act as a Senior Market Analyst.

        Analyze the following news headlines:
        {news_text}

        Rules:
        - Pick ONLY ONE primary factor
        - Write ONLY ONE short sentence
        - Respond ONLY in valid JSON

        JSON FORMAT:
        {{
          "primary_factor": "Earnings | Macro Economy | Geopolitics | Product Launch | Legal/Regulation | Mergers",
          "analyst_summary": "One sentence impact on stock price"
        }}
        """

        try:
            response = self.model.generate_content(prompt, timeout=4)

            # 4. Convert text → JSON
            ai_output = response.text.strip().replace("```json", "").replace("```", "")

            parsed = json.loads(ai_output)

            return {
                "primary_factor": parsed.get("primary_factor", "Unknown"),
                "analyst_summary": parsed.get("analyst_summary", "No summary generated.")
            }

        except Exception as e:
            return {
                "primary_factor": "Error",
                "analyst_summary": f"AI analysis failed: {str(e)}"
            }
