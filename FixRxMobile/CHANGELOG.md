# Changelog

## [1.0.0] - 2025-10-14

### Fixed
- Phone number validation now enforces US format (XXX) XXX-XXXX with exactly 10 digits
- Button states properly disabled until valid phone number is entered
- Package version conflicts resolved (react-native-reanimated, cross-env)
- PlatformConstants error fixed by adding babel.config.js and metro.config.js

### Changed
- Updated react-native-reanimated from 3.3.0 to 3.5.4
- Updated cross-env from 10.1.0 to 7.0.3
- Updated expo from 49.0.15 to 49.0.21
- Moved @types/react-native to devDependencies
- Phone login button moved below Facebook button on welcome screen

### Added
- Real-time phone number formatting as user types
- Visual feedback for disabled button states
- babel.config.js configuration file
- metro.config.js configuration file
- Comprehensive README documentation

### Removed
- Emojis from production code for professional appearance
- Temporary debugging files

## Setup Instructions

After pulling these changes:

```bash
npm install
npm start
```

Or use the reset script:

```bash
npm run reset
```

## Known Issues

None. All critical issues have been resolved.
