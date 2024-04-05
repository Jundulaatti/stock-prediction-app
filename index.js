import { dates } from "/utils/dates";

const tickersArr = [];

const generateReportBtn = document.querySelector(".generate-report-btn");

generateReportBtn.addEventListener("click", fetchStockData);

document.getElementById("ticker-input-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const tickerInput = document.getElementById("ticker-input");
  if (tickerInput.value.length > 2) {
    generateReportBtn.disabled = false;
    const newTickerStr = tickerInput.value;
    tickersArr.push(newTickerStr.toUpperCase());
    tickerInput.value = "";
    renderTickers();
  } else {
    const label = document.getElementsByTagName("label")[0];
    label.style.color = "red";
    label.textContent =
      "You must add at least one ticker. A ticker is a unique code for a crypto token. E.g., BTC for Bitcoin.";
  }
});

function renderTickers() {
  const tickersDiv = document.querySelector(".ticker-choice-display");
  tickersDiv.innerHTML = "";
  tickersArr.forEach((ticker) => {
    const newTickerSpan = document.createElement("span");
    newTickerSpan.textContent = ticker;
    newTickerSpan.classList.add("ticker");
    tickersDiv.appendChild(newTickerSpan);
  });
}

const loadingArea = document.querySelector(".loading-panel");
const apiMessage = document.getElementById("api-message");

/* 
  Challenge: Update the `fetch` request
   - Make a request to the Polygon API via your new Worker
   - Catch and log any errors returned by the Worker
*/

async function fetchStockData() {
  document.querySelector(".action-panel").style.display = "none";
  loadingArea.style.display = "flex";
  try {
    const stockData = await Promise.all(
      tickersArr.map(async (ticker) => {
        const url = `https://polygon-api-worker.junnusalovaara.workers.dev//?ticker=${ticker}&startDate=${dates.startDate}&endDate=${dates.endDate}`;
        const response = await fetch(url);
        if (!response.ok) {
          const errMsg = await response.text();
          throw new Error("Worker error: " + errMsg);
        }
        apiMessage.innerText = "Creating report...";
        return response.text();
      })
    );
    fetchReport(stockData.join(""));
  } catch (err) {
    loadingArea.innerText = "There was an error fetching crypto token data.";
    console.error(err.message);
  }
}

async function fetchReport(data) {
  const messages = [
    {
      role: "system",
      content:
        "You are a crypto trading guru. Given data on token prices over the past 3 days, write a report of no more than 150 words describing the tokens' performance and recommending whether to buy, hold, or sell. Use the examples provided between ### to set the style of your response.",
    },
    {
      role: "user",
      content: `${data}
      ###
      Buckle up, because the crypto market has been a wild ride! Over the past three days, Bitcoin (BTC) saw significant volatility. The token opened at $45,000 and dipped to $42,000 before rallying to $47,000 on the third day. This turbulence presents a prime buying opportunity for those brave enough to navigate the stormy seas of crypto trading. Meanwhile, Ethereum (ETH) showcased its resilience, climbing from $3,000 to $3,500. This steady ascent signals a strong buy for long-term holders seeking substantial growth. 

      On the flip side, Ripple (XRP) experienced a slight decline, moving from $0.75 to $0.70. While some may see this as a chance to buy at a lower price, caution is advised due to its unpredictable nature.

      In summary, if you have BTC or ETH, holding or buying more could be wise, given their potential for recovery and growth. XRP holders might want to stay vigilant and consider diversifying to mitigate risks. The crypto market is famed for its volatility, making it essential to stay informed and prepared for sudden changes.
      ###
            `,
    },
  ];

  try {
    const url = "https://ai-app-cloudflare.junnusalovaara.workers.dev/";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Worker Error: ${data.error}`);
    }
    renderReport(data.content);
  } catch (err) {
    console.error(err.message);
    loadingArea.innerText = "Unable to access AI. Please refresh and try again";
  }
}

function renderReport(output) {
  loadingArea.style.display = "none";
  const outputArea = document.querySelector(".output-panel");
  const report = document.createElement("p");
  outputArea.appendChild(report);
  report.textContent = output;
  outputArea.style.display = "flex";
}
