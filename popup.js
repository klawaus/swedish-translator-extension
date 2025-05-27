document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('enableToggle');
  const statusText = document.getElementById('statusText');
  const optionsBtn = document.getElementById('optionsBtn');
  
  // Load current status
  chrome.storage.sync.get(['enabled'], (result) => {
    const enabled = result.enabled !== false;
    toggle.checked = enabled;
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
  });
  
  // Handle toggle
  toggle.addEventListener('change', () => {
    const enabled = toggle.checked;
    chrome.storage.sync.set({ enabled: enabled });
    statusText.textContent = enabled ? 'Enabled' : 'Disabled';
  });
  
  // Handle options button
  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
});