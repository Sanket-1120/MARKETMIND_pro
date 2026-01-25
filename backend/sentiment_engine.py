import feedparser
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from datetime import datetime, timedelta
import requests
from bs4 import BeautifulSoup
import re


class SentimentEngine:
    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()

    def fetch_news(self, ticker: str, limit=12):
        """
        Multi-source news aggregator with fallback mechanisms
        Sources: Google News, Yahoo Finance RSS, Bing News
        """
        all_news = []
        
        # Extract company name from ticker (remove .NS, .BO suffixes)
        clean_ticker = ticker.replace('.NS', '').replace('.BO', '').replace('.', ' ')
        
        # SOURCE 1: Google News RSS (Primary)
        try:
            all_news.extend(self._fetch_google_news(clean_ticker, limit=6))
        except Exception as e:
            print(f"Google News fetch failed: {e}")
        
        # SOURCE 2: Yahoo Finance RSS (Secondary)
        try:
            all_news.extend(self._fetch_yahoo_news(ticker, limit=4))
        except Exception as e:
            print(f"Yahoo Finance fetch failed: {e}")
        
        # SOURCE 3: Bing News RSS (Tertiary)
        try:
            all_news.extend(self._fetch_bing_news(clean_ticker, limit=4))
        except Exception as e:
            print(f"Bing News fetch failed: {e}")
        
        # Remove duplicates based on title similarity
        unique_news = self._deduplicate_news(all_news)
        
        # Sort by published date (most recent first)
        unique_news.sort(key=lambda x: x.get('published_timestamp', 0), reverse=True)
        
        return unique_news[:limit]

    def _fetch_google_news(self, query: str, limit=6):
        """Fetch from Google News RSS"""
        import urllib.parse
        
        search_query = f"{query} stock market news"
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
        
        feed = feedparser.parse(url)
        news = []
        
        for entry in feed.entries[:limit]:
            # Parse published date
            pub_date = entry.get('published', '')
            timestamp = self._parse_date(pub_date)
            
            # Extract source from title (Google News format: "Title - Source")
            title = entry.get('title', '')
            source = "Google News"
            
            if ' - ' in title:
                parts = title.rsplit(' - ', 1)
                title = parts[0]
                source = parts[1] if len(parts) > 1 else source
            
            news.append({
                "title": title,
                "link": entry.get('link', ''),
                "published": self._format_relative_time(timestamp),
                "published_timestamp": timestamp,
                "source": source
            })
        
        return news

    def _fetch_yahoo_news(self, ticker: str, limit=4):
        """Fetch from Yahoo Finance RSS"""
        # Yahoo Finance RSS format
        url = f"https://finance.yahoo.com/rss/headline?s={ticker}"
        
        feed = feedparser.parse(url)
        news = []
        
        for entry in feed.entries[:limit]:
            pub_date = entry.get('published', '')
            timestamp = self._parse_date(pub_date)
            
            news.append({
                "title": entry.get('title', ''),
                "link": entry.get('link', ''),
                "published": self._format_relative_time(timestamp),
                "published_timestamp": timestamp,
                "source": "Yahoo Finance"
            })
        
        return news

    def _fetch_bing_news(self, query: str, limit=4):
        """Fetch from Bing News RSS"""
        import urllib.parse
        
        search_query = f"{query} stock market"
        encoded_query = urllib.parse.quote(search_query)
        url = f"https://www.bing.com/news/search?q={encoded_query}&format=rss"
        
        feed = feedparser.parse(url)
        news = []
        
        for entry in feed.entries[:limit]:
            pub_date = entry.get('published', '')
            timestamp = self._parse_date(pub_date)
            
            # Extract source from description if available
            source = "Bing News"
            if hasattr(entry, 'source') and hasattr(entry.source, 'title'):
                source = entry.source.title
            
            news.append({
                "title": entry.get('title', ''),
                "link": entry.get('link', ''),
                "published": self._format_relative_time(timestamp),
                "published_timestamp": timestamp,
                "source": source
            })
        
        return news

    def _parse_date(self, date_str: str) -> float:
        """Parse various date formats to timestamp"""
        if not date_str:
            return datetime.now().timestamp()
        
        try:
            # Try parsing RFC 2822 format (common in RSS)
            from email.utils import parsedate_to_datetime
            dt = parsedate_to_datetime(date_str)
            return dt.timestamp()
        except:
            pass
        
        try:
            # Try ISO format
            dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            return dt.timestamp()
        except:
            pass
        
        # Default to now if parsing fails
        return datetime.now().timestamp()

    def _format_relative_time(self, timestamp: float) -> str:
        """Format timestamp as relative time (e.g., '2h ago', '3d ago')"""
        now = datetime.now().timestamp()
        diff = now - timestamp
        
        if diff < 0:
            return "Just now"
        
        minutes = diff / 60
        hours = minutes / 60
        days = hours / 24
        
        if minutes < 1:
            return "Just now"
        elif minutes < 60:
            return f"{int(minutes)}m ago"
        elif hours < 24:
            return f"{int(hours)}h ago"
        elif days < 7:
            return f"{int(days)}d ago"
        else:
            # Return actual date for older news
            dt = datetime.fromtimestamp(timestamp)
            return dt.strftime("%b %d, %Y")

    def _deduplicate_news(self, news_list):
        """Remove duplicate news based on title similarity"""
        unique = []
        seen_titles = set()
        
        for item in news_list:
            # Normalize title for comparison
            normalized = re.sub(r'[^\w\s]', '', item['title'].lower())
            normalized = ' '.join(normalized.split()[:10])  # First 10 words
            
            if normalized not in seen_titles:
                seen_titles.add(normalized)
                unique.append(item)
        
        return unique

    def analyze_sentiment(self, news):
        if not news:
            return {
                "score": 0,
                "label": "Neutral",
                "explanation": "No recent impactful news detected, assuming neutral market sentiment."
            }

        scores = []
        for item in news:
            # VADER compound score is -1.0 to 1.0
            score = self.analyzer.polarity_scores(item["title"])["compound"]
            scores.append(score)

        avg_score = sum(scores) / len(scores)
        scaled_score = round(avg_score * 100)  # Convert to -100 to +100

        # Categorization
        if scaled_score >= 40:
            label = "Very Positive"
            explanation = "Strong positive sentiment detected in recent headlines; market outlook is bullish."
        elif 10 <= scaled_score < 40:
            label = "Positive"
            explanation = "Moderately positive news flow suggests cautious optimism."
        elif -10 < scaled_score < 10:
            label = "Neutral"
            explanation = "News sentiment is balanced; no strong directional bias from media."
        elif -40 < scaled_score <= -10:
            label = "Negative"
            explanation = "Negative headlines are surfacing, suggesting potential downside pressure."
        else:
            label = "Very Negative"
            explanation = "Strong negative sentiment dominates; high risk of bearish movement."

        return {
            "score": scaled_score,
            "label": label,
            "explanation": explanation
        }
