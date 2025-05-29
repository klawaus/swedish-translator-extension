let translationPopup = null;
let currentTimeout = null;
let isEnabled = true;
let shadowRoot = null;

// Initialize
chrome.storage.sync.get(['enabled'], (result) => {
  isEnabled = result.enabled !== false;
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
    if (!isEnabled && translationPopup) {
      removePopup();
    }
  }
});

// Create popup element with Shadow DOM to prevent CSS conflicts
function createPopup() {
  // Create a container that won't affect page layout
  const container = document.createElement('div');
  container.id = 'swedish-translator-container';
  container.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 0 !important;
    height: 0 !important;
    overflow: visible !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
  `;
  
  // Attach shadow DOM to isolate styles
  shadowRoot = container.attachShadow({ mode: 'closed' });
  
  // Create the actual popup inside shadow DOM
  const popup = document.createElement('div');
  popup.className = 'swedish-translator-popup';
  
  // Add styles to shadow DOM
  const style = document.createElement('style');
  style.textContent = `
    .swedish-translator-popup {
      position: fixed;
      z-index: 999999;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      max-width: 400px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: black;
      pointer-events: auto;
      display: none;
    }
    .swedish-translator-popup div {
      margin: 0;
      padding: 0;
    }
  `;
  
  shadowRoot.appendChild(style);
  shadowRoot.appendChild(popup);
  document.documentElement.appendChild(container);
  
  return popup;
}

function removePopup() {
  const container = document.getElementById('swedish-translator-container');
  if (container) {
    container.remove();
    translationPopup = null;
    shadowRoot = null;
  }
}

function showPopup(x, y, text, translation) {
  if (!translationPopup) {
    translationPopup = createPopup();
  }
  
  translationPopup.innerHTML = `
    <div style="margin-bottom: 5px; color: #666; font-size: 12px;">Swedish:</div>
    <div style="margin-bottom: 10px; font-style: italic;">${escapeHtml(text)}</div>
    <div style="margin-bottom: 5px; color: #666; font-size: 12px;">English:</div>
    <div style="font-weight: bold;">${escapeHtml(translation)}</div>
  `;
  
  // Position popup using fixed positioning
  translationPopup.style.left = x + 'px';
  translationPopup.style.top = (y + 20) + 'px';
  translationPopup.style.display = 'block';
  
  // Adjust position if popup goes off screen
  setTimeout(() => {
    const rect = translationPopup.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      translationPopup.style.left = (window.innerWidth - rect.width - 10) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      translationPopup.style.top = (y - rect.height - 10) + 'px';
    }
  }, 0);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Get text under mouse or selected text
function getTextToTranslate(event) {
  // First check if there's selected text
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();
  
  if (selectedText && selectedText.length > 0) {
    return selectedText;
  }
  
  // Otherwise, get sentence under cursor
  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (!element || !element.textContent) return null;
  
  // Get the text content and find sentence boundaries
  const text = element.textContent;
  const range = document.caretRangeFromPoint(event.clientX, event.clientY);
  
  if (!range) return null;
  
  const offset = range.startOffset;
  
  // Find sentence boundaries (. ! ? or newline)
  const sentenceEnders = /[.!?\n]/g;
  let start = 0;
  let end = text.length;
  
  // Find start of sentence
  for (let i = offset - 1; i >= 0; i--) {
    if (sentenceEnders.test(text[i])) {
      start = i + 1;
      break;
    }
  }
  
  // Find end of sentence
  for (let i = offset; i < text.length; i++) {
    if (sentenceEnders.test(text[i])) {
      end = i + 1;
      break;
    }
  }
  
  const sentence = text.substring(start, end).trim();
  
  // Only return if it looks like Swedish text (contains common Swedish characters or words)
  const swedishPattern = /[åäöÅÄÖ]|och|att|det|som|för|med|har|kan|ska|vill|den|ett/;
  if (sentence.length > 5 && swedishPattern.test(sentence)) {
    return sentence;
  }
  
  return null;
}

// Handle mouse movement
document.addEventListener('mousemove', (event) => {
  if (!isEnabled) return;
  
  // Clear any existing timeout
  if (currentTimeout) {
    clearTimeout(currentTimeout);
    currentTimeout = null;
  }
  
  // Check if mouse is over the popup
  if (translationPopup) {
    const rect = translationPopup.getBoundingClientRect();
    const buffer = 10;
    const isOverPopup = event.clientX >= rect.left - buffer && 
                       event.clientX <= rect.right + buffer && 
                       event.clientY >= rect.top - buffer && 
                       event.clientY <= rect.bottom + buffer;
    
    if (!isOverPopup) {
      removePopup();
    }
  }
  
  // Set timeout to check for translation
  currentTimeout = setTimeout(() => {
    const text = getTextToTranslate(event);
    if (text) {
      chrome.runtime.sendMessage(
        { action: 'translate', text: text },
        (response) => {
          if (response && response.success) {
            showPopup(event.pageX, event.pageY, text, response.translation);
          }
        }
      );
    }
  }, 500); // Wait 500ms before translating
});

// Handle text selection
document.addEventListener('mouseup', (event) => {
  if (!isEnabled) return;
  
  // Don't trigger if clicking on the popup container
  if (event.target.id === 'swedish-translator-container') return;
  
  setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText && selectedText.length > 0) {
      chrome.runtime.sendMessage(
        { action: 'translate', text: selectedText },
        (response) => {
          if (response && response.success) {
            showPopup(event.pageX, event.pageY, selectedText, response.translation);
          }
        }
      );
    }
  }, 10);
});

// Remove popup on click outside
document.addEventListener('click', (event) => {
  if (event.target.id !== 'swedish-translator-container') {
    removePopup();
  }
});