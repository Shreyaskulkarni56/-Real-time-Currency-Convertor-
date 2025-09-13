class CurrencyConverter {
  constructor() {
    this.exchangeRates = {};
    this.lastUpdate = null;
    this.initializeElements();
    this.bindEvents();
    this.loadExchangeRates();
  }

  initializeElements() {
    this.fromAmount = document.getElementById("fromAmount");
    this.fromCurrency = document.getElementById("fromCurrency");
    this.toAmount = document.getElementById("toAmount");
    this.toCurrency = document.getElementById("toCurrency");
    this.swapBtn = document.getElementById("swapBtn");
    this.result = document.getElementById("result");
    this.rateInfo = document.getElementById("rateInfo");
  }

  bindEvents() {
    this.fromAmount.addEventListener("input", () => this.convert());
    this.fromCurrency.addEventListener("change", () => this.convert());
    this.toCurrency.addEventListener("change", () => this.convert());
    this.swapBtn.addEventListener("click", () => this.swapCurrencies());

    // Convert on page load
    setTimeout(() => this.convert(), 1000);
  }
  async loadExchangeRates() {
    try {
      // Using a free API that doesn't require API key
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch exchange rates");
      }
      const data = await response.json();
      this.exchangeRates = data.rates;
      this.lastUpdate = new Date(data.date);
      this.convert();
    } catch (error) {
      console.error("Error loading exchange rates:", error);
      // Fallback rates for offline functionality
      this.exchangeRates = {
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.12,
        AUD: 1.35,
        CAD: 1.25,
        CHF: 0.92,
        CNY: 6.45,
        INR: 74.5,
        KRW: 1180.5,
        SGD: 1.35,
        NZD: 1.42,
        MXN: 20.15,
        BRL: 5.2,
        RUB: 73.25,
        ZAR: 14.75,
      };
      this.showError(
        "Using offline rates. Connect to internet for live rates."
      );
    }
  }

  convert() {
    const amount = parseFloat(this.fromAmount.value);
    const from = this.fromCurrency.value;
    const to = this.toCurrency.value;

    if (!amount || amount <= 0) {
      this.result.innerHTML =
        '<span class="loading">Enter an amount to convert</span>';
      this.result.className = "result";
      this.rateInfo.textContent = "";
      return;
    }

    if (!this.exchangeRates[from] || !this.exchangeRates[to]) {
      this.showError("Currency not supported");
      return;
    }

    // Convert via USD as base currency
    const usdAmount = amount / this.exchangeRates[from];
    const convertedAmount = usdAmount * this.exchangeRates[to];

    this.toAmount.value = convertedAmount.toFixed(2);

    // Display result
    const rate = this.exchangeRates[to] / this.exchangeRates[from];
    this.result.className = "result";
    this.result.innerHTML = `
                    <div>
                        <div style="font-size: 28px; margin-bottom: 5px;">
                            ${convertedAmount.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })} ${to}
                        </div>
                        <div style="font-size: 16px; opacity: 0.9;">
                            ${amount} ${from} = ${convertedAmount.toFixed(
      2
    )} ${to}
                        </div>
                    </div>
                `;

    // Show exchange rate info with real-time status
    const rateAge = this.lastUpdate
      ? Math.floor((new Date() - this.lastUpdate) / 1000 / 60)
      : null;
    const statusColor =
      rateAge < 10 ? "#4CAF50" : rateAge < 60 ? "#FF9800" : "#f44336";

    this.rateInfo.innerHTML = `
                    <div style="margin-bottom: 10px;">
                        1 ${from} = ${rate.toFixed(4)} ${to} • 
                        1 ${to} = ${(1 / rate).toFixed(4)} ${from}
                    </div>
                    <div style="color: ${statusColor}; font-size: 11px;">
                        ${
                          this.lastUpdate
                            ? `📡 Live rates • Updated ${
                                rateAge < 1 ? "just now" : rateAge + " min ago"
                              }`
                            : "⚠️ Using cached rates"
                        }
                   
                `;
  }

  swapCurrencies() {
    const tempCurrency = this.fromCurrency.value;
    this.fromCurrency.value = this.toCurrency.value;
    this.toCurrency.value = tempCurrency;

    // Also swap amounts
    const tempAmount = this.fromAmount.value;
    this.fromAmount.value = this.toAmount.value || tempAmount;

    this.convert();
  }

  showError(message) {
    this.result.className = "result error";
    this.result.innerHTML = `<div>❌ ${message}</div>`;
    this.rateInfo.textContent = "";
  }
}

// Initialize the converter when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new CurrencyConverter();
});
