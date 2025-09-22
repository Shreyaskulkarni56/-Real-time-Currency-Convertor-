# Currency Converter – Phase 1: UI Design & API Integration

## 📌 Project Overview
This project is a **responsive currency converter web application**.  
In **Phase 1**, the focus is on:
- Designing a simple, intuitive **User Interface**.
- Integrating a **public currency exchange API** to fetch real-time exchange rates.
- Implementing conversion logic to calculate and display results instantly.
- Validating user input to ensure smooth and error-free interaction.
- Testing conversion across **major currencies** (e.g., USD, EUR, INR, GBP, JPY).

---

## 🚀 Features
- **Responsive UI** with clean design.
- Input fields for:
  - Amount
  - From Currency
  - To Currency
- **Real-time conversion** using live exchange rates.
- **Input validation** to prevent errors.
- Basic **cross-currency testing** support.

---

## 🛠️ Tech Stack
- **Frontend**: HTML, CSS, JavaScript  
- **API**: [ExchangeRate API](https://api.exchangerate-api.com) (free, public)  
- **Tools**: Git, VS Code (recommended)

---
Clone the Repository
bash
git clone https://github.com/your-username/currency-converter.git
cd currency-converter

🌍 API Integration

We are using ExchangeRate API to fetch the latest currency rates.

Base URL:

https://api.exchangerate-api.com/v4/latest/USD


Returns exchange rates relative to USD.

The app uses these rates to perform conversion calculations.
    
