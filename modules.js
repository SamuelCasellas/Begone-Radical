const thisNumSeconds = async(s) => {
  return new Promise(res => {
    setTimeout(() => res(true), s * 1000);
  });
};

/**
 * selectElementPersist
 * 
 * Select an HTML element persistently based on the provided selector and selector type.
 * If the query element is not provided, the entire document is queried.
 * 
 * @param {string} selector - The selector string used to select the element.
 * @param {string} [selectorType="qS"] - The type of the selector. It can be 'byId', 'byClass', 'qS', 'qSA', or 'byTag'.
 * @param {HTMLElement} [onElement=document] - The element to perform the query on.
 * @param {number} [expectedNumElements=-1] - The minimum number of elements to wait for before returning the list. -1 = retrieve all regardless of result, with a 0.1 second pause.
 * @param {boolean} [firstElementOnly=false] - Set to true to always return the first element
 * @param {boolean} [asList=false] - Set to true to return list
 * @param {boolean} [exactlyNum=true] - Promise only resolves when the exact number of elements is queried.
 * @param {string | RegExp} [targetsInnerText=null] - The desired inner text for the elements returned. Regex is supported.
 * @param {number} [timeoutSeconds=10] - The maximum number of seconds to wait for the element to appear in seconds.
 * @param {number} [millisPerAttempt=50] - The number of milliseconds per query attempt.
 * 
 * @returns {Promise<HTMLElement>} - Returns a promise that resolves to the selected HTML element.
 */
async function selectElementPersist(selector, {
  selectorType, onElement, expectedNumElements, 
  firstElementOnly, asList, exactlyNum, targetsInnerText, 
  timeoutSeconds, millisPerAttempt
} = {}
) {
  selectorType = selectorType || 'qS';
  onElement = onElement || document;
  expectedNumElements = expectedNumElements === undefined ? -1 : expectedNumElements;
  firstElementOnly = firstElementOnly || false;
  asList = asList || false;
  exactlyNum = exactlyNum === undefined ? true : exactlyNum;
  targetsInnerText = targetsInnerText || null;
  timeoutSeconds = timeoutSeconds || 10;
  millisPerAttempt = millisPerAttempt || 5;

  const maxNumAttempts = timeoutSeconds / (millisPerAttempt / 1000);
  const selectorTypes = { 
    byId: 'getElementById', 
    byClass: 'getElementsByClassName', 
    qS: 'querySelector', 
    qSA: 'querySelectorAll', 
    byTag: 'getElementsByTagName',
  };

  let selectorName = selectorTypes[selectorType];
  let isSingleElementQuery = ['byId', 'qS'].includes(selectorType);

  if (isSingleElementQuery && expectedNumElements > 1) {
    selectorName = 'querySelectorAll';
    isSingleElementQuery = false;
  }
  
  return new Promise(async(res, rej) => {
    if (!selectorName) {
      rej(`Invalid selector type: ${selectorType}`);
    }
    expectedNumElements = isSingleElementQuery ? 1 : expectedNumElements;

    const selectorFunc = onElement[selectorName].bind(onElement);
    // Recursive search function
    function attemptQuery_(numAttempts = 1) {
      let elementsQueried = selectorFunc.call(onElement, selector);

      if (elementsQueried != null) {
        // Single queries will not return a list
        if (typeof elementsQueried.length !== 'number') {
          elementsQueried = [elementsQueried];
        }

        if (targetsInnerText) {
          elementsQueried = Array.from(elementsQueried).filter(element => element.innerText.match(targetsInnerText));
        }

        if (elementsQueried.length &&
              (elementsQueried.length === expectedNumElements || 
               (elementsQueried.length > expectedNumElements && !exactlyNum) ||
                (expectedNumElements <= 1)
              )
           ) 
        {
          res(
            ((isSingleElementQuery || expectedNumElements === 1 || firstElementOnly) && 
              !asList)
              ? elementsQueried[0] 
              : elementsQueried
          );
          return;
        }
      }

      if (numAttempts < maxNumAttempts) {
        setTimeout(() => attemptQuery_(++numAttempts), millisPerAttempt);
      } else {
        rej(`Searching for ${expectedNumElements} element(s) with selector "${selector}" using document.${selectorName} not found within ${timeoutSeconds} seconds.`);
        return;
      }
    }

    if (expectedNumElements === -1) {
      await thisNumSeconds(0.1);
    }
    else if (expectedNumElements === 0) {
      res(null);
      return;
    }

    attemptQuery_();
  });
}