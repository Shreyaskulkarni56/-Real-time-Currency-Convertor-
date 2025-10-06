class CurrencyConverter {
  constructor() {
    this.exchangeRates = {};
    this.lastUpdate = null;
    this.isLoading = false;
    this.conversionHistory = JSON.parse(
      localStorage.getItem("conversionHistory") || "[]"
    );
    this.chart = null;
    this.currencies = {
      USD: { name: "US Dollar", flag: "🇺🇸" },
      EUR: { name: "Euro", flag: "🇪🇺" },
      GBP: { name: "British Pound", flag: "🇬🇧" },
      JPY: { name: "Japanese Yen", flag: "🇯🇵" },
      AUD: { name: "Australian Dollar", flag: "🇦🇺" },
      CAD: { name: "Canadian Dollar", flag: "🇨🇦" },
      CHF: { name: "Swiss Franc", flag: "🇨🇭" },
      CNY: { name: "Chinese Yuan", flag: "🇨🇳" },
      INR: { name: "Indian Rupee", flag: "🇮🇳" },
      KRW: { name: "South Korean Won", flag: "🇰🇷" },
      SGD: { name: "Singapore Dollar", flag: "🇸🇬" },
      NZD: { name: "New Zealand Dollar", flag: "🇳🇿" },
      MXN: { name: "Mexican Peso", flag: "🇲🇽" },
      BRL: { name: "Brazilian Real", flag: "🇧🇷" },
      RUB: { name: "Russian Ruble", flag: "🇷🇺" },
      ZAR: { name: "South African Rand", flag: "🇿🇦" },
      NOK: { name: "Norwegian Krone", flag: "🇳🇴" },
      SEK: { name: "Swedish Krona", flag: "🇸🇪" },
      DKK: { name: "Danish Krone", flag: "🇩🇰" },
      PLN: { name: "Polish Zloty", flag: "🇵🇱" },
    };
    this.initializeElements();
    this.bindEvents();
    this.loadExchangeRates();
    this.renderHistory();
    // this.initializeChart();
    // Make instance globally available
    window.app = this;
  }

  initializeElements() {
    this.fromAmount = document.getElementById("fromAmount");
    this.fromCurrency = document.getElementById("fromCurrency");
    this.toAmount = document.getElementById("toAmount");
    this.toCurrency = document.getElementById("toCurrency");
    this.swapBtn = document.getElementById("swapBtn");
    this.result = document.getElementById("result");
    this.rateInfo = document.getElementById("rateInfo");
    this.historyList = document.getElementById("historyList");
    this.clearHistoryBtn = document.getElementById("clearHistory");
  }

  bindEvents() {
    this.fromAmount.addEventListener("input", () => this.convert());
    this.fromCurrency.addEventListener("change", () => {
      this.loadExchangeRates();
      this.convert();
      this.updateChart();
    });
    this.toCurrency.addEventListener("change", () => {
      this.loadExchangeRates();
      this.convert();
      this.updateChart();
    });
    this.swapBtn.addEventListener("click", () => this.swapCurrencies());

    // Chart period buttons
    document.querySelectorAll(".chart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document
          .querySelectorAll(".chart-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");
        this.updateChart(e.target.dataset.period);
      });
    });
    // Auto-refresh rates every 5 minutes
    setInterval(() => {
      this.loadExchangeRates();
    }, 300000);

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "r") {
          e.preventDefault();
          this.refreshRates();
        } else if (e.key === "s") {
          e.preventDefault();
          this.swapCurrencies();
        }
      }
    });
    // Convert on page load
    setTimeout(() => this.convert(), 1000);
  }
  async loadExchangeRates() {
    try {
      this.showLoading("Fetching live rates...");

      // Primary API - Free with good rate limits
      let response = await fetch("https://api.fxratesapi.com/latest");

      if (!response.ok) {
        // Fallback to secondary API
        response = await fetch(
          "https://api.exchangerate-api.com/v4/latest/USD"
        );
      }

      if (!response.ok) {
        throw new Error("Failed to fetch from all APIs");
      }

      const data = await response.json();
      this.exchangeRates = data.rates;
      this.lastUpdate = new Date();

      this.result.innerHTML =
        '<span style="color: var(--success-color);">✅ Live rates loaded successfully!</span>';
      setTimeout(() => this.convert(), 1000);

      // Update chart with new data
      this.updateChart();
    } catch (Error) {
      if (typeof console !== "undefined" && console.Error) {
        console.Error("Error loading exchange rates:", Error);
      }
      await this.loadBackupRates();
    }
  }

  async loadBackupRates() {
    try {
      // Try alternative free APIs
      const apis = [
        "https://open.er-api.com/v6/latest/USD",
        "https://api.currencyapi.com/v3/latest?apikey=cur_live_free&base_currency=USD",
      ];

      for (const apiUrl of apis) {
        try {
          const response = await fetch(apiUrl);
          if (response.ok) {
            const data = await response.json();
            this.exchangeRates = data.rates || data.data;
            this.lastUpdate = new Date();
            this.result.innerHTML =
              '<span style="color: var(--warning-color);">⚠️ Using backup API</span>';
            setTimeout(() => this.convert(), 1000);
            return;
          }
        } catch (e) {
          console.warn("Backup API failed:", apiUrl, e);
        }
      }

      throw new Error("All APIs failed");
    } catch (error) {
      // Ultimate fallback with recent realistic rates
      this.exchangeRates = {
        USD: 1,
        EUR: 0.9234,
        GBP: 0.7918,
        JPY: 149.85,
        AUD: 1.5124,
        CAD: 1.3642,
        CHF: 0.8798,
        CNY: 7.2456,
        INR: 83.15,
        KRW: 1327.5,
        SGD: 1.3456,
        NZD: 1.6234,
        MXN: 17.89,
        BRL: 4.95,
        RUB: 92.5,
        ZAR: 18.75,
        NOK: 10.85,
        SEK: 10.45,
        DKK: 6.88,
        PLN: 4.05,
      };
      this.lastUpdate = new Date("2025-01-15");
      this.showError("⚠️ Using cached rates - Check internet connection");
    }
  }

  async loadSpecificRate() {
    const from = this.fromCurrency.value;
    const to = this.toCurrency.value;

    try {
      const response = await fetch(
        `https://api.fxratesapi.com/latest?base=${from}&symbols=${to}`
      );

      if (response.ok) {
        const data = await response.json();
        Object.assign(this.exchangeRates, data.rates);
        this.lastUpdate = new Date();
      }
    } catch (error) {
      console.log("Specific rate update failed, using existing rates");
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

    const fromCurrency = this.currencies[from];
    const toCurrency = this.currencies[to];
    const fromFlag = fromCurrency?.flag || "💱";
    const toFlag = toCurrency?.flag || "💱";

    this.result.innerHTML = `
   <div class="result-amount">
    ${toFlag} ${convertedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${to}
    </div>
    <div class="result-details">
    ${fromFlag} ${amount} ${from} = ${toFlag} ${convertedAmount.toFixed(
      2
    )} ${to}
    </div>
  `;

    // Add to history with proper values
    this.addToHistory(amount, from, to, convertedAmount, rate);

    // Update rate info
    this.updateRateInfo(from, to, rate);
  }

// Add to history method as a class method
  addToHistory(amount, from, to, convertedAmount, rate) {
    const entry = {
      fromAmount: Number(amount),
      fromCurrency: from,
      toAmount: Number(convertedAmount),
      toCurrency: to,
      rate: Number(rate),
      timestamp: new Date().toISOString()
    };

    this.conversionHistory.push(entry);
    localStorage.setItem("conversionHistory", JSON.stringify(this.conversionHistory));
    this.renderHistory();
  }

  updateRateInfo(from = null, to = null, rate = null) {
    if (!from || !to || !rate) {
      this.rateInfo.innerHTML = `
                        <div style="margin-bottom: 10px;">Ready to convert</div>
                        <button onclick="app.refreshRates()" class="refresh-btn">
                            🔄 Refresh Rates
                        </button>
                    `;
      return;
    }

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
                    </div>
                    <button onclick="app.refreshRates()" class="refresh-btn">
                        🔄 Refresh Rates
                    </button>
                `;
  }
  swapCurrencies() {
    const tempCurrency = this.fromCurrency.value;
    this.fromCurrency.value = this.toCurrency.value;
    this.toCurrency.value = tempCurrency;

    // Also swap amounts
    const tempAmount = this.fromAmount.value;
    this.fromAmount.value = this.toAmount.value || tempAmount;

    // Update chart and convert
                this.generateMockHistoricalData();
                this.updateChart();
                this.convert();
  }

  showError(message) {
                this.result.className = 'result error';
                this.result.innerHTML = `<div>❌ ${message}</div>`;
                this.rateInfo.innerHTML = `
                    <button onclick="app.refreshRates()" class="refresh-btn">
                        🔄 Refresh Rates
                    </button>
                `;
            }

 renderHistory() {
    if (!this.historyList) return;
    this.historyList.innerHTML = "";

    if (!this.conversionHistory || this.conversionHistory.length === 0) {
        this.historyList.innerHTML = "<li>No conversion history yet.</li>";
        document.getElementById("clear-history");
        return;
    }

    this.conversionHistory.slice().reverse().forEach((item) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span>${item.fromAmount} ${item.fromCurrency} ➡️ ${item.toAmount.toFixed(2)} ${item.toCurrency}</span>
            <span style="font-size: 11px; color: #888;">Rate: ${item.rate.toFixed(4)}</span>
        `;
        this.historyList.appendChild(li);
        document.getElementById("clearHistory").style.display = "inline-block";

    });

    // show button only if history exists
    document.getElementById("clearHistory").style.display = "inline-block";
}

   clearHistory() {
    this.conversionHistory = [];
    localStorage.removeItem("conversionHistory");
                  this.renderHistory();
              }

  toggleClearHistoryButton() {
    const btn = document.getElementById("clearHistory");
    if (!btn) return;

    if (this.conversionHistory.length === 0) {
      btn.style.display = "none";
    } else {
      btn.style.display = "inline-block";
    }
  }
}

// Attach clear history event and initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  const app = new CurrencyConverter();
  document.getElementById("clearHistory")
    .addEventListener("click", () => app.clearHistory());

  app.loadExchangeRates();
});
