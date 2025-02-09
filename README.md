# Open-With

**Open-With** is a Node.js package designed to help you find applications that can open a given file on macOS. It leverages macOS's `mdls` and `mdfind` commands, as well as the CoreServices and CoreFoundation frameworks, to determine the appropriate apps that support a specific file type. 

## Features
- Determine the UTI (Uniform Type Identifier) for a file.
- Find applications that can open a file based on its UTI.
- Retrieve detailed information about the applications, including the app name, path, and icon.
- Designed for macOS and supports `.app` bundle-based applications.

## Installation

```bash
npm install open-with
```

# Usage

## Example
To find the applications that can open a specific file, you can use the getApplications function. The function accepts the file path and returns a list of applications that can open the file.

```js
import { Mac } from 'open-with';

const filePath = '/path/to/your/file.txt';

const applications = Mac.getApplications(filePath);
console.log(applications);
```

## Example Output
```js
[
  {
    name: 'TextEdit',
    path: '/Applications/TextEdit.app',
    iconPath: '/Applications/TextEdit.app/Contents/Resources/TextEdit.icns',
  },
  {
    name: 'Sublime Text',
    path: '/Applications/Sublime Text.app',
    iconPath: '/Applications/Sublime Text.app/Contents/Resources/Sublime Text.icns',
  }
]
```

