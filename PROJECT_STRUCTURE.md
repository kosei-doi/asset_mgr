# Project Structure

This document describes the directory structure and file organization of the Financial Asset Management Web Application.

## Directory Structure

```
asset_admin/
├── index.html              # Main HTML file
├── css/
│   └── styles.css          # Main stylesheet
├── js/
│   ├── app.js              # Main application logic
│   ├── firebase-config.js  # Firebase configuration
│   ├── account-manager.js  # Account management functions
│   ├── balance-manager.js  # Balance management functions
│   ├── dashboard.js        # Dashboard display logic
│   ├── charts.js           # Chart rendering functions
│   └── history.js          # History management functions
├── README.md               # Project overview
├── PROJECT_STRUCTURE.md    # This file
├── FEATURES.md             # Feature specifications
├── SETUP.md                # Setup instructions
└── ARCHITECTURE.md         # Architecture documentation
```

## File Descriptions

### Root Files

- **index.html**: Main entry point of the application. Contains the HTML structure, includes all necessary scripts and stylesheets.

### CSS Directory

- **css/styles.css**: Contains all styling for the application including:
  - Layout styles
  - Component styles
  - Responsive design
  - Theme colors and typography

### JavaScript Directory

- **js/app.js**: Main application entry point. Initializes the application, handles routing, and coordinates between different modules.

- **js/firebase-config.js**: Firebase Realtime Database configuration and initialization. Contains Firebase credentials and database reference setup.

- **js/account-manager.js**: Handles all account-related operations:
  - Creating new accounts
  - Updating account information
  - Deleting accounts
  - Fetching account list

- **js/balance-manager.js**: Manages balance operations:
  - Recording new balance entries
  - Updating account balances
  - Retrieving balance history

- **js/dashboard.js**: Dashboard functionality:
  - Calculating total assets
  - Displaying account summaries
  - Real-time updates

- **js/charts.js**: Chart rendering and visualization:
  - Pie chart for asset distribution
  - Line chart for balance trends
  - Chart.js integration

- **js/history.js**: History management:
  - Displaying balance change history
  - Filtering history by account or date
  - History data formatting

## Data Flow

1. User interactions trigger functions in respective manager modules
2. Manager modules interact with Firebase Realtime Database
3. Data changes trigger real-time listeners
4. Dashboard and charts update automatically
5. History is recorded and displayed

## External Dependencies

- **Firebase SDK**: For Realtime Database and Authentication (if used)
- **Chart.js**: For rendering charts and graphs
- **CDN Links**: All external libraries are loaded via CDN in `index.html`

