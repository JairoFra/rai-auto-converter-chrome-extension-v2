let storedData;

const minDecimals = -1; // TODO change to 0
const maxDecimals = 18;
const minInterval = 3;
const maxInterval = 3600;

const decimalsInput = document.getElementById('decimals');
const intervalInput = document.getElementById('interval');
const enabledInput = document.getElementById('enabledOpt');
const darkModeInput = document.getElementById('darkMode');
const showBadgeInput = document.getElementById('showBadgeOpt');
const priceTypeInput = document.getElementById('priceType');
const selectAllFiatBtn = document.getElementById('selectAllFiat');
const unselectAllFiatBtn = document.getElementById('unselectAllFiat');
const selectAllCryptoBtn = document.getElementById('selectAllCrypto');
const unselectAllCryptoBtn = document.getElementById('unselectAllCrypto');


/**
 * Gets stored data
 */
chrome.storage.local.get('data', (res) => {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }

  storedData = res.data;

  renderCurrencyOptions();
  renderBlacklist();

  decimalsInput.value = storedData.decimals;
  intervalInput.value = storedData.refreshInterval;
  enabledInput.checked = storedData.enabled;
  darkModeInput.checked = storedData.darkMode;
  showBadgeInput.checked = storedData.showBadge;

  if (storedData.darkMode) {
    document.body.classList.add('dark');
  }
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
let decimalsChanges = e => {
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
    chrome.storage.local.set({ data: storedData });
      
    // Sends message to the background and popup
    chrome.runtime.sendMessage({ type: 'decimals', value: storedData.decimals });
};

decimalsInput.addEventListener('change', decimalsChanges);
decimalsInput.addEventListener('keyup', decimalsChanges);


/**
 * Manages changes in interval input
 */
let intervalChanges = e => {
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
  chrome.storage.local.set({ data: storedData });
  
  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'interval', value: storedData.refreshInterval });
};

intervalInput.addEventListener('change', intervalChanges);
intervalInput.addEventListener('keyup', intervalChanges);


/**
 * Manages changes in enabled switch
 */
enabledInput.addEventListener('change', e => {
  storedData.enabled = e.target.checked;

  // Updates preferences
  chrome.storage.local.set({ data: storedData });

  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'enabled', value: storedData.enabled });
});


/**
 * Manages changes in dark mode switch
 */
darkModeInput.addEventListener('change', e => {
  storedData.darkMode = e.target.checked;

  if (storedData.darkMode) {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }

  // Updates preferences
  chrome.storage.local.set({ data: storedData });

  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'darkMode', value: storedData.darkMode });
});


/**
 * Manages changes in show badge switch
 */
showBadgeInput.addEventListener('change', e => {
  storedData.showBadge = e.target.checked;

  // Updates preferences
  chrome.storage.local.set({ data: storedData });

  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'showBadge', value: storedData.showBadge });
});


/**
 * Renders available currencies
 */
function renderCurrencyOptions() {
  let fiatContainer = document.getElementById('fiatCurrencies');
  let cryptoContainer = document.getElementById('cryptoCurrencies');

  storedData.currencies.forEach(currency => {
    let checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = currency.id;
    checkbox.value = currency.id;
    checkbox.id = currency.id;
    checkbox.checked = currency.enabled;  

    let label = document.createElement('label');
    label.htmlFor = 'id';
    label.appendChild(document.createTextNode(currency.ticker));

    if (currency.fiat) {
      fiatContainer.appendChild(checkbox);
      fiatContainer.appendChild(label);
    } else {
      cryptoContainer.appendChild(checkbox);
      cryptoContainer.appendChild(label);
    }
  });

  startCurrencyListeners();
}


/**
 * Starts listeners for currency inputs
 * They cannot be started until they have been rendered
 */
function startCurrencyListeners() {
  const currenciesInputs = document.getElementById('currencies').querySelectorAll('input');
  const fiatCurrenciesInputs = document.getElementById('fiatCurrencies').querySelectorAll('input');
  const cryptoCurrenciesInputs = document.getElementById('cryptoCurrencies').querySelectorAll('input');

  currenciesInputs.forEach(element => {
    element.addEventListener('change', e => {
      let changedCurrency = storedData.currencies.find(currency => currency.id == e.target.id);
      changedCurrency.enabled = e.target.checked;
    
      updateCurrencies();
    });
  });

  selectAllFiatBtn.addEventListener('click', e => {
    fiatCurrenciesInputs.forEach(element => {
      element.checked = true;
    });

    storedData.currencies.filter(currency => currency.fiat).forEach(currency => currency.enabled = true);

    updateCurrencies();
  });

  unselectAllFiatBtn.addEventListener('click', e => {
    fiatCurrenciesInputs.forEach(element => {
      element.checked = false;
    });

    storedData.currencies.filter(currency => currency.fiat).forEach(currency => currency.enabled = false);

    updateCurrencies();
  });

  selectAllCryptoBtn.addEventListener('click', e => {
    cryptoCurrenciesInputs.forEach(element => {
      element.checked = true;
    });

    storedData.currencies.filter(currency => !currency.fiat).forEach(currency => currency.enabled = true);

    updateCurrencies();
  });

  unselectAllCryptoBtn.addEventListener('click', e => {
    cryptoCurrenciesInputs.forEach(element => {
      element.checked = false;
    });

    storedData.currencies.filter(currency => !currency.fiat).forEach(currency => currency.enabled = false);

    updateCurrencies();
  });
}


/**
 * Updates currencies preferences
 */
function updateCurrencies() {
  // Updates preferences
  chrome.storage.local.set({ data: storedData });

  // Sends message to the background and popup
  chrome.runtime.sendMessage({ type: 'currencies', value: storedData.currencies });
}


/**
 * Renders available currencies
 */
function renderBlacklist() {
  let blacklistContainer = document.getElementById('blacklist');
  
  storedData.blacklist.forEach(hostname => {
    let div = document.createElement('div');

    let span = document.createElement('span');
    span.innerText = hostname;

    let removeImg = document.createElement('img');
    removeImg.src = './images/delete.png';
    removeImg.classList = 'icon';

    div.appendChild(span);
    div.appendChild(removeImg);

    blacklistContainer.appendChild(div);
  });

  startCurrencyListeners();
}


/**
 * Starts listeners for blacklist items
 * They cannot be started until they have been rendered
 */
function startCurrencyListeners() {
  const blacklistButtons = document.getElementById('blacklist').querySelectorAll('img');

  blacklistButtons.forEach(element => {
    element.addEventListener('click', e => {
      const index = storedData.blacklist.indexOf(e.target.previousSibling.innerText);
      if (index > -1) {
        storedData.blacklist.splice(index, 1);
  
        // Stores updated data
        chrome.storage.local.set({ data: storedData });
      
        // Sends message to the background
        chrome.runtime.sendMessage({ type: 'blacklist', value: storedData.blacklist });
      }
      
      e.target.parentNode.remove();
    });
  });
}




// TODO remove
document.getElementById('test1').addEventListener('click', e => {

});
