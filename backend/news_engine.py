import feedparser
import urllib.parse

class NewsAggregator:
    def __init__(self):
        # Base URL for Google News RSS
        self.base_url = "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

    def get_global_news(self, ticker: str, company_name: str, limit=5):
        """
        Fetches global news for a company using Google News RSS.
        """
        # Create a smart query (e.g., "Apple Inc stock finance")
        query = f"{company_name} stock finance"
        encoded_query = urllib.parse.quote(query)
        feed_url = self.base_url.format(query=encoded_query)

        # Parse the feed
        feed = feedparser.parse(feed_url)
        
        news_items = []
        for entry in feed.entries[:limit]:
            news_items.append({
                "title": entry.title,
                "link": entry.link,
                "source": entry.source.title if 'source' in entry else "Google News",
                "published": getattr(entry, "published", "")
            })
            
        return news_items