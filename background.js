// Handle DeepL API calls
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    translateText(request.text)
      .then(translation => sendResponse({ success: true, translation }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }
});

async function translateText(text) {
  // Get API key from storage
  const result = await chrome.storage.sync.get(['deeplApiKey']);
  const apiKey = result.deeplApiKey;
  
  if (!apiKey) {
    throw new Error('DeepL API key not set. Please configure in extension options.');
  }

  const response = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Authorization': `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      'text': text,
      'source_lang': 'SV',
      'target_lang': 'EN'
    })
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.translations[0].text;
}