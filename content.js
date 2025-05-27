let translationPopup = null;
let currentTimeout = null;
let isEnabled = true;

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

// Create popup element
function createPopup() {
  const popup = document.createElement('div');
  popup.className = 'swedish-translator-popup';
  popup.style.cssText = `
    position: absolute;
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
    display: none;
  `;
  document.body.appendChild(popup);
  return popup;
}

function removePopup() {
  if (translationPopup) {
    translationPopup.remove();
    translationPopup = null;
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
  
  // Position popup
  translationPopup.style.left = x + 'px';
  translationPopup.style.top = (y + 20) + 'px';
  translationPopup.style.display = 'block';
  
  // Adjust position if popup goes off screen
  const rect = translationPopup.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    translationPopup.style.left = (window.innerWidth - rect.width - 10) + 'px';
  }
  if (rect.bottom > window.innerHeight) {
    translationPopup.style.top = (y - rect.height - 10) + 'px';
  }
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
  
  // Remove popup if mouse moved away
  if (translationPopup && !translationPopup.contains(event.target)) {
    const rect = translationPopup.getBoundingClientRect();
    const buffer = 10;
    if (event.clientX < rect.left - buffer || 
        event.clientX > rect.right + buffer || 
        event.clientY < rect.top - buffer || 
        event.clientY > rect.bottom + buffer) {
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
  if (translationPopup && !translationPopup.contains(event.target)) {
    removePopup();
  }
});