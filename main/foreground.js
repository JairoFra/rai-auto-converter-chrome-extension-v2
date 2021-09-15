RAI = ' RAI';
storedData = {};
enabledCurrencies = [];

/**
 * Gets stored data
 */
chrome.storage.local.get('data', (res) => {
  if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError);
  }

  storedData = res.data;
  enabledCurrencies = storedData.currencies.filter(currency => currency.enabled);
  
  if (storedData.enabled) {
    searchCurrencies(document.body);
    startObserver();
  }
});


/**
 * Listens to preferences and conversion updates sent from the background
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (storedData.enabled && !message.enabled) {
    disconnectObserver();
  } else if (!storedData.enabled && message.enabled) {
    searchCurrencies(document.body);
    startObserver();
  }

  storedData = message;
});


/**
 * Observer to check for changes in the DOM
 */
observer = new MutationObserver(mutations => {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'characterData') {
      searchCurrencies(mutation.target.parentNode);
    } else if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        searchCurrencies(node);
      });
    }
  });
});


/**
 * Starts observer
 */
function startObserver() {
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });
}


/**
 * Disconnects observer
 */
function disconnectObserver() {
  observer.disconnect()
}


avoidedTags = ['html', 'head', 'script', 'noscript', 'style', 'img', 'textarea', 'input','audio', 'video'];
// regExpAmount = '-?\\d+(?:\\.\\d+)?(?:,\\d+(?:\\.\\d+)?)*'; // TODO remove
// regExpAmount = '-?((?:\\d{1,3},(?:\\d{3},)*\\d{3})(\\.\\d+)?|(?:\\d{1,3}\.(?:\\d{3}\\.)*\\d{3})(,\\d+)?|(?:\\d+)((\\.|,)\\d+)?)'; // TODO remove
regExpAmount1 = '-?((?:\\d{1,3},(?:\\d{3},)*\\d{3})(\\.\\d+)?|(?:\\d+)(\\.\\d+)?)';
regExpAmount2 = '-?((?:\\d{1,3}\.(?:\\d{3}\\.)*\\d{3})(,\\d+)?|(?:\\d+)(,\\d+)?)';
regExpAmount = '(' + regExpAmount1 + '|' + regExpAmount2 + ')';
regExpAmountAbbrev = '(\\s?(K|M|million|B|billion|T|trillion)\\b)';

/**
 * Calls search in nodes for every enabled currency
 */
function searchCurrencies(rootNode) {
  enabledCurrencies.forEach(currency => {
    searchCurrency(rootNode, currency);
  });
}


/**
 * Searches nodes for a currency symbol
 */
function searchCurrency(rootNode, currency) {
  const avoidedChars = '[a-zA-Z0-9\$€¥£₩₹₿]';
  const regExpPriceJoined =  '(?<!' + avoidedChars + ')(' + regExpAmount + '((' + currency.regExps[0] + ')(?!' + avoidedChars + ')))|(((?<!' + avoidedChars + ')(' + currency.regExps[0] + '))' + regExpAmount + regExpAmountAbbrev + '?)(?!' + avoidedChars + ')'; // Amount and currency without space
  const regExpCurrencyShort = '(?<!' + avoidedChars + ')(' + currency.regExps[0] + ')(?!' + avoidedChars + ')'; // Currency (amount can be at left or right)
  let regExpCurrencyLong = null;
  if (currency.regExps.length > 1) {
    regExpCurrencyLong = '((^|(?<=\\s))(' + currency.regExps[1] + ')\\b)'; // Currency (amount can be at left)
  }

  const treeWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);

  while (treeWalker.nextNode()) {
    const node = treeWalker.currentNode;
    if (!avoidedTags.includes(node.parentNode.tagName.toLowerCase())) {
      if (new RegExp(regExpPriceJoined, 'gi').test(node.nodeValue)) {
        // Amount and currency without space found (e.g. 11.1USD - $22)
        convertPrice(node, new RegExp(regExpPriceJoined, 'gi'), currency.conversion);
      } else if (new RegExp(regExpCurrencyShort, 'gi').test(node.nodeValue)) {
        // Currency found --> search amount left and right
        const regExpPriceLeft = new RegExp(regExpAmount + regExpAmountAbbrev + '?\\s*' + regExpCurrencyShort, 'gi');
        const regExpPriceRight = new RegExp(regExpCurrencyShort + '\\s*' + regExpAmount + regExpAmountAbbrev + '?', 'gi');
        if (regExpPriceLeft.test(node.nodeValue)) {
          // Amount found at left (e.g. 5.55 $)
          convertPrice(node, regExpPriceLeft, currency.conversion);
        } else if (regExpPriceRight.test(node.nodeValue)) {
          // Amount found at right (e.g. USD 66)
          convertPrice(node, regExpPriceRight, currency.conversion);
        } else if (new RegExp('^(' + regExpCurrencyShort + '|' + regExpCurrencyShort + ')$', 'gi').test(node.nodeValue.trim())) {
          // Currency symbol isolated in node --> search amount in other nodes (e.g. <span>$</span><span>6.66</span>)
          searchAmount(node, regExpCurrencyShort, true, currency.conversion);
        }
      } else if (regExpCurrencyLong && new RegExp(regExpCurrencyLong, 'gi').test(node.nodeValue)) {
        // Currency found --> search amount left
        const regExpPriceLeft = new RegExp(regExpAmount + regExpAmountAbbrev + '?\\s*' + regExpCurrencyLong, 'gi');
        if (regExpPriceLeft.test(node.nodeValue)) {
          // Amount found at left (e.g. 7.77 Dollars)
          convertPrice(node, regExpPriceLeft, currency.conversion);
        } else if (new RegExp('^(' + regExpCurrencyLong + '|' + regExpCurrencyShort + ')$', 'gi').test(node.nodeValue.trim())) {
          // Currency symbol isolated in node --> search amount in other nodes (e.g. <span>8</span><span>US Dollar</span>)
          searchAmount(node, regExpCurrencyLong, false, currency.conversion);
        }
      }
    }
  }
}


/**
 * Searches amounts near to a currency symbol
 */
function searchAmount(currencyNode, regExpDollar, searchBothSides, conversion) {  
  
  //////////////////// Search in right nodes //////////////////

  if (searchBothSides) {
    // Search in 'uncle' right nodes
    const firstRightUncle = getNextSibling(currencyNode.parentNode);
    if (firstRightUncle && firstRightUncle.nodeType === currencyNode.TEXT_NODE && isAmount(firstRightUncle.nodeValue)) {
      const raiAmount = currencyToRai(firstRightUncle.nodeValue.match(new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gi'))[0], conversion);
      firstRightUncle.nodeValue = raiAmount + RAI;
      currencyNode.nodeValue = '';
      return;
    } 


    // Search in 'cousin' right nodes
    if (firstRightUncle && firstRightUncle.firstChild && firstRightUncle.firstChild.nodeType === currencyNode.TEXT_NODE && isAmount(firstRightUncle.firstChild.nodeValue)) {
      const firstRightCousin = firstRightUncle.firstChild;
      currencyNode.nodeValue = '';
      
      if (containsDecimals(firstRightCousin.nodeValue)) {
        const raiAmount = currencyToRai(firstRightCousin.nodeValue.match(new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gi'))[0], conversion);
        firstRightCousin.nodeValue = raiAmount + RAI;
        return;
      }

      const secondRightUncle = getNextSibling(firstRightUncle);
      if (secondRightUncle && secondRightUncle.firstChild && secondRightUncle.firstChild.nodeType === currencyNode.TEXT_NODE && isNumber(secondRightUncle.firstChild.nodeValue, false)) {
        const secondRightCousin = secondRightUncle.firstChild;
        const raiAmount = currencyToRai(firstRightCousin.nodeValue.trim() + '.' + secondRightCousin.nodeValue.trim(), conversion);
        firstRightCousin.nodeValue = raiAmount + RAI;
        secondRightCousin.nodeValue = '';
      } else {
        const raiAmount = currencyToRai(firstRightCousin.nodeValue, conversion);
        firstRightCousin.nodeValue = raiAmount + RAI;
      }

      return
    } 


    // Search in 'nephew' right nodes
    const firstRightBrother = getNextSibling(currencyNode);
    if (firstRightBrother && firstRightBrother.firstChild && firstRightBrother.firstChild.nodeType === currencyNode.TEXT_NODE && isAmount(firstRightBrother.firstChild.nodeValue)) {
      const firstRightNephew = firstRightBrother.firstChild;
      currencyNode.nodeValue = '';
      
      if (containsDecimals(firstRightNephew.nodeValue)) {
        const raiAmount = currencyToRai(firstRightNephew.nodeValue.match(new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gi'))[0], conversion);
        firstRightNephew.nodeValue = raiAmount + RAI;
        return;
      }

      const secondRightBrother = getNextSibling(firstRightBrother);
      if (secondRightBrother && secondRightBrother.firstChild && secondRightBrother.firstChild.nodeType === currencyNode.TEXT_NODE && isNumber(secondRightBrother.firstChild.nodeValue, false)) {
        const secondRightNephew = secondRightBrother.firstChild;
        const raiAmount = currencyToRai(firstRightNephew.nodeValue.trim() + '.' + secondRightNephew.nodeValue.trim(), conversion);
        firstRightNephew.nodeValue = raiAmount + RAI;
        secondRightNephew.nodeValue = '';
      } else {
        const raiAmount = currencyToRai(firstRightNephew.nodeValue, conversion);
        firstRightNephew.nodeValue = raiAmount;
      }

      return
    } 
  }
  

  //////////////////// Search in left nodes //////////////////

  // Search in 'uncle' left nodes
  const firstLeftUncle = getPrevSibling(currencyNode.parentNode);

  if (firstLeftUncle && firstLeftUncle.nodeType === currencyNode.TEXT_NODE && isAmount(firstLeftUncle.nodeValue)) {
    const raiAmount = currencyToRai(firstLeftUncle.nodeValue.match(new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gi'))[0], conversion);
    firstLeftUncle.nodeValue = raiAmount;
    currencyNode.nodeValue = currencyNode.nodeValue.replace(new RegExp(regExpDollar, 'gi'), RAI);
    return;
  }


  // Search in 'cousin' left nodes
  if (firstLeftUncle && firstLeftUncle.firstChild && firstLeftUncle.firstChild.nodeType === currencyNode.TEXT_NODE && isAmount(firstLeftUncle.firstChild.nodeValue)) {
    const firstLeftCousin = firstLeftUncle.firstChild;
    currencyNode.nodeValue = currencyNode.nodeValue.replace(new RegExp(regExpDollar, 'gi'), RAI);

    if (containsDecimals(firstLeftCousin.nodeValue)) {
      const raiAmount = currencyToRai(firstLeftCousin.nodeValue.match(new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gi'))[0], conversion);
      firstLeftCousin.nodeValue = raiAmount;
      return;
    }

    const secondLeftUncle = getPrevSibling(firstLeftUncle);
    if (secondLeftUncle && secondLeftUncle.firstChild && secondLeftUncle.firstChild.nodeType === currencyNode.TEXT_NODE && isNumber(secondLeftUncle.firstChild.nodeValue, true)) {
      const secondLeftCousin = secondLeftUncle.firstChild;
      const raiAmount = currencyToRai(secondLeftCousin.nodeValue.trim() + '.' + firstLeftCousin.nodeValue.trim(), conversion);
      if (raiAmount.split('.').length > 1) {
        firstLeftCousin.nodeValue = raiAmount.split('.')[1];
        secondLeftCousin.nodeValue = raiAmount.split('.')[0];
      } else {
        firstLeftCousin.nodeValue = '';
        secondLeftCousin.nodeValue = raiAmount.split('.')[0];
      }
    } else {
      const raiAmount = currencyToRai(firstLeftCousin.nodeValue.match(new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gi'))[0], conversion);
      firstLeftCousin.nodeValue = raiAmount;
    }
    return;
  }


  // Search in 'nephew' left nodes
  const firstLeftBrother = getPrevSibling(currencyNode);
  if (firstLeftBrother && firstLeftBrother.firstChild && firstLeftBrother.firstChild.nodeType === currencyNode.TEXT_NODE && isAmount(firstLeftBrother.firstChild.nodeValue)) {
    const firstLeftNephew = firstLeftBrother.firstChild;
    currencyNode.nodeValue = currencyNode.nodeValue.replace(new RegExp(regExpDollar, 'gi'), RAI);

    if (containsDecimals(firstLeftNephew.nodeValue)) {
      const raiAmount = currencyToRai(firstLeftNephew.nodeValue.match(new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gi'))[0], conversion);
      firstLeftNephew.nodeValue = raiAmount;
      return;
    }

    const secondLeftBrother = getPrevSibling(firstLeftBrother);
    if (firstLeftBrother && firstLeftBrother.firstChild && firstLeftBrother.firstChild.nodeType === currencyNode.TEXT_NODE && isNumber(secondLeftBrother.firstChild.nodeValue, true)) {
      const secondLeftNephew = secondLeftBrother.firstChild;
      const raiAmount = currencyToRai(secondNephew.nodeValue.trim() + '.' + firstNephew.nodeValue.trim(), conversion);
      if (raiAmount.split('.').length > 1) {
        firstLeftNephew.nodeValue = raiAmount.split('.')[1];
        secondLeftNephew.nodeValue = raiAmount.split('.')[0];
      } else {
        firstLeftNephew.nodeValue = raiAmount.split('.')[0];
        secondLeftNephew.nodeValue = '';
      }
    } else {
      const raiAmount = currencyToRai(firstLeftNephew.nodeValue.match(new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gi'))[0], conversion);
      firstLeftNephew.nodeValue = raiAmount;
    }
    return;
  }
}


/**
 * Checks if value is a valid amount
 */
function isAmount(value) {
  return new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gi').test(value);
}


/**
 * Checks if value is a number
 */
function isNumber(value, allowCommas) {
  if (allowCommas) {
    value = value.replace(/,/g, '');
  }
  return !isNaN(value) && !isNaN(parseFloat(value));
}


/**
 * Checks if amount contains decimal part
 */
function containsDecimals(amount) {
  return amount.split('.').length === 2;
}


/**
 * Transforms price node
 */
function convertPrice(node, regExpPrice, conversion) {
  node.nodeValue.match(regExpPrice).forEach(price => { 
    const raiAmount = currencyToRai(price.match(new RegExp(regExpAmount + regExpAmountAbbrev + '?', 'gmi'))[0], conversion);
    node.nodeValue = node.nodeValue.replace(price, raiAmount + RAI);
  });
}


/**
 * Converts amount to RAI
 */
function currencyToRai(amountString, conversion) {
  let amountAbbrev = amountString.match(new RegExp(regExpAmountAbbrev, 'gmi'));
  if (amountAbbrev) {
    amountString = amountString.replace(amountAbbrev, '');
  } else {
    amountAbbrev = '';
  }

  let thousandsSeparator = ',';
  let decimalSeparator = '.';
  if (!isEnglishNotation(amountString)) {
    thousandsSeparator = '.';
    decimalSeparator = ',';
  }

  const decimals = storedData.decimals < 0 ? numDecimals(amountString, decimalSeparator) : storedData.decimals;
  const amountNumber = Number(amountString.replace(new RegExp(thousandsSeparator, 'g'), ''));
  const minToShow = 1 / Math.pow(10, decimals);
  const raiNumber = Number(amountNumber / conversion);
  if (Math.abs(raiNumber) > 0 && Math.abs(raiNumber) < minToShow) {
    const prev = raiNumber < 0 ? '>-' : '<';
    return prev + minToShow;
  } 
  
  return raiNumber.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + amountAbbrev;
}


/**
 * Gets number of decimals in amount string
 */
function numDecimals(amountString, decimalSeparator) {
  amountParts = amountString.split(decimalSeparator);
  return amountParts.length > 1 ? amountParts[1].length : 0;
}


/**
* Gets next sibling node, skipping space nodes
*/
function getNextSibling(node) {
  nextSibling = node.nextSibling;

  while(nextSibling && nextSibling.nodeType === node.TEXT_NODE && nextSibling.nodeValue.trim() === '') {
    nextSibling = nextSibling.nextSibling;
  }

  return nextSibling;
}

/**
* Gets previous sibling node, skipping space nodes
*/
function getPrevSibling(node) {
  prevSibling = node.previousSibling;

  while(prevSibling && prevSibling.nodeType === node.TEXT_NODE && prevSibling.nodeValue.trim() === '') {
    prevSibling = prevSibling.previousSibling;
  }

  return prevSibling;
}


/**
* Returns true if the amount is in English notation (commas for thousands separators and dot for decimals)
* and false if it is non-English notation (dots for thousands separators and comma for decimals)
*/
function isEnglishNotation(amountString) {
  return new RegExp(regExpAmount1).test(amountString);
}