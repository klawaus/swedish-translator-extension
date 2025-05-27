document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const messageDiv = document.getElementById('message');
  
  // Load saved API key
  chrome.storage.sync.get(['deeplApiKey'], (result) => {
    if (result.deeplApiKey) {
      apiKeyInput.value = result.deeplApiKey;
    }
  });
  
  // Save settings
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      showMessage('Please enter an API key', 'error');
      return;
    }
    
    chrome.storage.sync.set({ deeplApiKey: apiKey }, () => {
      showMessage('Settings saved successfully!', 'success');
    });
  });
  
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
      messageDiv.style.display = 'none';
    }, 3000);
  }
});