# Swedish Sentence Translator Extension

A Chrome extension that translates Swedish text to English using the DeepL API when you hover over it.

## Features

- Hover over any Swedish text to see the English translation
- Supports full sentence translation (not just individual words)
- Clean, unobtrusive tooltip interface
- Toggle the extension on/off with a single click
- Right-click context menu for quick toggling

## Installation

1. **Get a DeepL API Key**
   - Sign up for a free account at [DeepL](https://www.deepl.com/pro#developer) if you don't have one
   - Navigate to the [DeepL API Dashboard](https://www.deepl.com/pro-account/summary)
   - Find your API key in the "Authentication Key for DeepL API" section

2. **Load the Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the `swedish-translator-extension` folder

3. **Configure the Extension**
   - Click on the extension icon in your toolbar
   - Enter your DeepL API key in the input field
   - Click "Enable" to activate the translator

## Usage

- **Hover** over any Swedish text to see the translation
- **Right-click** anywhere and select "Toggle Swedish Translator" to enable/disable
- Click the extension icon to access settings and view the current status

## Privacy

- The extension only sends the text you hover over to the DeepL API
- Your API key is stored locally in Chrome's storage and is only sent to DeepL's servers
- No data is collected or stored by this extension

## Development

To modify or build upon this extension:

1. Clone this repository
2. Make your changes
3. Go to `chrome://extensions/`
4. Click the refresh icon on the extension card to reload your changes

## License

MIT

## Credits

- Uses the [DeepL API](https://www.deepl.com/pro#developer) for translations
- Inspired by Rikaikun and other hover dictionary extensions
