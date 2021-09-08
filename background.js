const initialData = {
  decimals: -1,
  refreshInterval: 300,
  enabled: true,
  currencies: currencies
}


let storedData;
let conversionInterval;
let raiUsdConversion;

/**
 * Stores default initial data on extension intalled
 */
chrome.runtime.onInstalled.addListener(reason => {
  if (reason !== chrome.runtime.OnInstalledReason.INSTALL) { return }
  chrome.storage.local.set({ data: initialData });
});


/**
 * Gets stored data
 */
chrome.storage.local.get('data', (res) => {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }

  if (res.data) {
    storedData = res.data;
  } else {
    storedData = initialData;
  }

  updateConversions();
  conversionInterval = setInterval(async () => {
    updateConversions();
  }, storedData.refreshInterval * 1000);
});


/**
 * Runs foreground script on page loaded
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && /^(http|file)/.test(tab.url)) {    
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['./foreground.js']
    })
    .catch(err => console.log(err)); 
  }
});


/**
 * Listens to stored data updates sent from the popup and options
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'enabled': 
      storedData.enabled = message.value;
      break;

    case 'interval': 
      clearInterval(conversionInterval);
      conversionInterval = setInterval(async () => {
        updateConversions();
      }, message.value * 1000);
      storedData.enabled = message.value;
      break;

    case 'decimals': 
      storedData.decimals = message.value;
      break;

    case 'currencies': 
      storedData.currencies = message.value;
      break;
  }

  // Forward changes to the foreground
  chrome.tabs.query({}, tabs => {
    for (let i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, storedData);
    }
  });
});


/**
 * Updates the conversion rates for RAI
 */
async function updateConversions() {
  const directConversions = await getDirectConversions();

  if (directConversions) {
    for(let id in directConversions) {
      let currency = storedData.currencies.find(c => c.id == id);
      currency.conversion = directConversions[id];
      
      // Send new USD conversion to the popup
      if (id == 'usd') {
        raiUsdConversion = currency.conversion;
        chrome.runtime.sendMessage({ type: 'conversion', value: raiUsdConversion });
      }
    }
  }

  const indirectConversions = await getIndirectConversions();

  if (indirectConversions) {
    for(let id in indirectConversions) {
      let currency = storedData.currencies.find(c => c.id == id);
      currency.conversion = raiUsdConversion / indirectConversions[id]['usd'];
    }
  }

  // Store current conversions
  chrome.storage.local.set({ data: storedData });

  // Send new conversions to the foreground
  chrome.tabs.query({}, tabs => {
    for (let i = 0; i < tabs.length; ++i) {
      chrome.tabs.sendMessage(tabs[i].id, storedData)
    }
  });
}


/**
 * Gets current market prices form CoinGecko API 
 * https://www.coingecko.com/api/documentations/v3
 */
async function getDirectConversions() {
  let currencyList = '';

  const currencies = storedData.currencies.filter(currency => currency.directConversion && currency.enabled);

  if (!currencies.length) {
    currencyList = 'usd';
  } else {
    currencies.forEach(currency => currencyList += (currency.id + ','));
  }

  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=rai&vs_currencies=' + currencyList)
  .catch(err => { 
    console.log(err);
    return null;
  });

  if (response.ok) {
    const json = await response.json();
    return json.rai ? json.rai : null;
  } else {
    return null;
  }
}

/**
 * Gets current market prices form CoinGecko API 
 * https://www.coingecko.com/api/documentations/v3
 */
 async function getIndirectConversions() {
  let currencyList = '';

  const currencies = storedData.currencies.filter(currency => !currency.directConversion && currency.enabled);

  if (!currencies.length) {
    return null;
  }
  
  currencies.forEach(currency => currencyList += (currency.id + ','));

  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=' + currencyList + '&vs_currencies=usd')
  .catch(err => { 
    console.log(err);
    return null;
  });

  if (response.ok) {
    const json = await response.json();
    return json;
  } else {
    return null;
  }
}