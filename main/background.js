const initialData = {
  enabled: true,
  darkMode: false,
  showBadge: true,
  customDecimals: false,
  decimals: 2,
  refreshInterval: 300,
  currencies: currencies,
  blacklist: []
}

var storedData = initialData;
var conversionInterval;
var raiUsdConversion;

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
  }

  updateConversions();
  conversionInterval = setInterval(async () => {
    updateConversions();
  }, storedData.refreshInterval * 1000);

  updateIcon();
});


/**
 * Runs foreground script on page loaded
 */
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' && /^(http|file)/.test(tab.url) 
      && !storedData.blacklist.includes(new URL(tab.url).hostname)) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['/main/foreground.js']
    })
    .catch(err => console.log(err)); 
  }
});


/**
 * Listens to changes in active tab
 */
chrome.tabs.onActivated.addListener(activeInfo => {
  updateIcon();
});


/**
 * Sets background color for price badge
 */
chrome.action.setBadgeBackgroundColor(
  { color: '#19898a'}
);

/**
 * Listens to stored data updates sent from the popup and options
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'enabled': 
      storedData.enabled = message.value;
      updateIcon();
      break;

    case 'showBadge':
      storedData.showBadge = message.value;
      if (!storedData.showBadge) {
        chrome.action.setBadgeText({ text: '' });
      } else {
        chrome.action.setBadgeText({ text: '$' + Number(raiUsdConversion).toFixed(2) });
      }
      break;

    case 'interval': 
      clearInterval(conversionInterval);
      conversionInterval = setInterval(async () => {
        updateConversions();
      }, message.value * 1000);
      storedData.enabled = message.value;
      break;

    case 'currencies': 
      storedData.currencies = message.value;
      break;

    case 'blacklist': 
      storedData.blacklist = message.value;
      updateIcon()
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
  // Direct conversions
  const directConversions = await getDirectConversions();

  if (directConversions) {
    for(let id in directConversions) {
      let currency = storedData.currencies.find(c => c.id == id);
      currency.conversion = directConversions[id];
      
      // Send new USD conversion to the popup and update badge
      if (id == 'usd') {
        raiUsdConversion = currency.conversion;
        chrome.runtime.sendMessage({ type: 'conversion', value: raiUsdConversion });

        if (storedData.showBadge) {
          chrome.action.setBadgeText({ text: '$' + Number(raiUsdConversion).toFixed(2) });
        }
      }
    }
  }

  // Indirect conversions
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
 * Gets direct market prices form CoinGecko API 
 * https://www.coingecko.com/api/documentations/v3
 */
async function getDirectConversions() {
  let currencyList = 'usd,';

  const currencies = storedData.currencies.filter(
    currency => currency.directConversion && currency.enabled && currency.id != 'usd');
  currencies.forEach(currency => currencyList += (currency.id + ','));
  
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=rai&vs_currencies=' + currencyList)
  .catch(err => { 
    console.log(err);
    return null;
  });

  if (response && response.ok) {
    const json = await response.json();
    return json.rai ? json.rai : null;
  } else {
    return null;
  }
}

/**
 * Gets indirect market prices form CoinGecko API 
 * https://www.coingecko.com/api/documentations/v3
 */
async function getIndirectConversions() {
  let currencyList = '';

  const currencies = storedData.currencies.filter(currency => !currency.directConversion && currency.enabled);

  if (!currencies.length) {
    return null;
  }
  
  currencies.forEach(currency => currencyList += (currency.id + ','));

  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + currencyList + '&vs_currencies=usd')
  .catch(err => { 
    console.log(err);
    return null;
  });

  if (response && response.ok) {
    const json = await response.json();
    return json;
  } else {
    return null;
  }
}


/**
 * Updaes the icon of the extension accourding to the state
 */
function updateIcon() {
  if (!storedData.enabled) {
    chrome.action.setIcon({
      path: {
        16: "/assets/icons/icon_16_disabled.png",
        32: "/assets/icons/icon_32_disabled.png",
        48: "/assets/icons/icon_48_disabled.png",
        128: "/assets/icons/icon_128_disabled.png"
      }
    });

    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0] || !tabs[0].url) {
      return;
    }

    const hostname = new URL(tabs[0].url).hostname;
    if (storedData.blacklist.includes(hostname)) {
      chrome.action.setIcon({
        path: {
          16: "/assets/icons/icon_16_blocked.png",
          32: "/assets/icons/icon_32_blocked.png",
          48: "/assets/icons/icon_48_blocked.png",
          128: "/assets/icons/icon_128_blocked.png"
        }
      });
    } else {
      chrome.action.setIcon({
        path: {
          16: "/assets/icons/icon_16.png",
          32: "/assets/icons/icon_32.png",
          48: "/assets/icons/icon_48.png",
          128: "/assets/icons/icon_128.png"
        }
      });
    }
  });
}