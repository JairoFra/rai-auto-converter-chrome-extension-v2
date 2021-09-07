let storedData;

const minDecimals = -1; // TODO change to 0
const maxDecimals = 18;
const minInterval = 3;
const maxInterval = 3600;

const decimalsInput = document.getElementById('decimals');
const intervalInput = document.getElementById('interval');
const enabledInput = document.getElementById('enabledOpt');
const priceTypeInput = document.getElementById('priceType');

/**
 * Gets stored data
 */
chrome.storage.sync.get('data', (res) => {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }

  storedData = res.data;

  storedData.currencies.forEach(currency => {
    renderCurrencyOptions(currency);
  });
  decimalsInput.value = storedData.decimals;
  intervalInput.value = storedData.refreshInterval;
  enabledInput.checked = storedData.enabled;
});


/**
 * Listens to updates sent from popup
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type && message.type == 'enabled') {
    enabledInput.checked = message.value;
  }
});


/**
 * Manages changes in decimals input
 */
decimalsInput.addEventListener('change', e => {
  let value = e.target.value;

  if (value < minDecimals) {
    value = minDecimals;
    decimalsInput.value = value;
  } else if (value > maxDecimals) {
    value = maxDecimals;
    decimalsInput.value = value;
  }

  storedData.decimals = value;

  // Updates preferences
  chrome.storage.sync.set({ data: storedData });
    
  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'decimals', value: storedData.decimals });

});


/**
 * Manages changes in interval input
 */
intervalInput.addEventListener('change', e => {
  let value = e.target.value;

  if (value < minInterval) {
    value = minInterval;
    intervalInput.value = value;
  } else if (value > maxInterval) {
    value = maxInterval;
    intervalInput.value = value;
  }

  storedData.refreshInterval = value;

  // Updates preferences
  chrome.storage.sync.set({ data: storedData });
  
  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'interval', value: storedData.refreshInterval });
});


/**
 * Manages changes in enabled switch
 */
enabledInput.addEventListener('change', e => {
  storedData.enabled = e.target.checked;

  // Updates preferences
  chrome.storage.sync.set({ data: storedData });

  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'enabled', value: storedData.enabled });
});


function renderCurrencyOptions(currency) {
  let container = document.getElementById('currencies');

  let checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.name = currency.id;
  checkbox.value = currency.id;
  checkbox.id = currency.id;
  checkbox.checked = currency.enabled;  

  let label = document.createElement('label');
  label.htmlFor = 'id';
  label.appendChild(document.createTextNode(currency.ticker));

  container.appendChild(checkbox);
  container.appendChild(label);

  listenCurrenciesChange();
}


/**
 * Manages changes in currencies selection
 */
function listenCurrenciesChange() {
  const currenciesInputs = document.getElementById('currencies').querySelectorAll('input');

  currenciesInputs.forEach(element => {
    element.addEventListener('change', e => {
      console.log(e.target.id, e.target.checked);
      // storedData.currencies = e.target.checked;
    
      // // Updates preferences
      // chrome.storage.sync.set({ data: storedData });
    
      // // Sends message to the background and popup
      // chrome.runtime.sendMessage({ type: 'currencies', value: storedData.currencies });
    });
  });
}