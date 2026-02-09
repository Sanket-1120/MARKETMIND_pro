# 🧠 MarketMind: Real-Time Explainable Market Intelligence
### *Transparent AI-Based Decision Support for the Modern Investor*

[![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?logo=react)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Version_2.0-blue)](https://github.com/)

> **"AI should assist human decision-making, not replace it."**

---

## 📋 Table of Contents
- [📖 Introduction](#-introduction)
- [🚀 Key Features](#-key-features)
- [🛠️ Tech Stack](#-tech-stack)
- [🏗️ System Architecture](#-system-architecture)
- [🧠 How It Works (The Logic)](#-how-it-works-the-logic)
- [📸 Screenshots](#-screenshots)
- [⚙️ Installation & Setup](#-installation--setup)
- [🔮 Future Scope](#-future-scope)
- [🤝 Contributing](#-contributing)

---

## 📖 Introduction

**MarketMind** is a web-based **Explainable AI (XAI)** platform designed to bridge the trust gap between algorithmic trading and human understanding. Unlike traditional "Black Box" systems that simply output a BUY or SELL signal, MarketMind provides a **transparent reasoning engine**.

It analyzes real-time stock data (Indian & Global markets), applies technical indicators, evaluates news sentiment, and—most importantly—**explains simply "Why"** a recommendation was made.

**USP:** We don't just predict; we educate. MarketMind transforms complex market data into actionable, interpretable insights.

---

## 🚀 Key Features

* **🔍 Explainable Signals:** Every BUY/SELL/HOLD signal comes with a bullet-point explanation (e.g., *"RSI < 30 indicates oversold conditions"*).
* **📈 Real-Time Data:** Fetches live OHLCV data for any ticker (e.g., `TCS.NS`, `AAPL`) via Yahoo Finance.
* **🧠 Hybrid Intelligence:** Combines quantitative Technical Analysis (RSI, MACD, SMA) with qualitative Sentiment Analysis (News Headlines).
* **📊 Interactive Dashboard:** Professional-grade charts with zoom, time filters (1W, 1M, 1Y), and moving average overlays.
* **📰 Global News Feed:** Integrated news panel to track macro-economic drivers affecting the stock.
* **🛡️ Confidence Scoring:** A dynamic score (0-100%) that reflects the agreement level between technicals and sentiment.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | **React.js** | Component-based UI architecture. |
| **UI Library** | **Material UI (MUI)** | Professional Dark Mode aesthetic. |
| **Charting** | **Recharts / Lightweight Charts** | High-performance financial visualization. |
| **Backend** | **FastAPI** | High-performance, async Python web framework. |
| **Data Processing** | **Pandas & NumPy** | Financial data manipulation and indicator calculation. |
| **Market Data** | **yfinance** | Real-time stock market data ingestion. |
| **AI/Logic** | **Rule-Based XAI** | Transparent decision trees for explainability. |

---

## 🏗️ System Architecture

MarketMind follows a modern **Client-Server Architecture**:

```mermaid
graph LR
  User -->|Request (Ticker)| Frontend[React Dashboard]
  Frontend -->|API Call| Backend[FastAPI Server]
  Backend -->|Fetch| YahooFinance[Live Market Data]
  Backend -->|Fetch| NewsAPI[Global News]
  Backend -->|Process| LogicEngine[XAI & Indicators]
  LogicEngine -->|JSON Response| Frontend
