# Architecture Documentation

This document describes the architecture, data model, and technical design of the Financial Asset Management Web Application.

## Architecture Overview

The application follows a client-side architecture with Firebase Realtime Database as the backend service. All business logic runs in the browser using vanilla JavaScript.

```
┌─────────────────────────────────────┐
│         Web Browser (Client)        │
│  ┌───────────────────────────────┐  │
│  │      HTML/CSS/JavaScript       │  │
│  │  ┌─────────────────────────┐   │  │
│  │  │   UI Components         │   │  │
│  │  └─────────────────────────┘   │  │
│  │  ┌─────────────────────────┐   │  │
│  │  │   Business Logic        │   │  │
│  │  │  - Account Manager      │   │  │
│  │  │  - Balance Manager      │   │  │
│  │  │  - Dashboard            │   │  │
│  │  │  - Charts               │   │  │
│  │  └─────────────────────────┘   │  │
│  └───────────────────────────────┘  │
│              │                        │
│              │ Firebase SDK           │
└──────────────┼────────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   Firebase Realtime Database        │
│  ┌───────────────────────────────┐  │
│  │      Data Storage             │  │
│  │  - Accounts                   │  │
│  │  - Balance History            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Technology Stack

### Frontend

- **HTML5**: Semantic markup for structure
- **CSS3**: Styling and responsive design
- **Vanilla JavaScript (ES6+)**: 
  - No frameworks or build tools
  - Modern JavaScript features (arrow functions, async/await, destructuring)
  - Modular code organization

### Backend Services

- **Firebase Realtime Database**:
  - NoSQL database
  - Real-time synchronization
  - RESTful API access
  - JSON data format

### External Libraries

- **Firebase SDK**: Client library for Firebase services
- **Chart.js**: Chart rendering library for data visualization

## Data Model

### Account Schema

```javascript
{
  accountId: string,           // Auto-generated unique identifier
  accountName: string,          // User-defined account name
  accountType: string,          // Account category/type
  createdAt: timestamp,         // Account creation date/time
  latestBalance: number         // Most recent balance value
}
```

**Example**:
```json
{
  "accountId": "acc_1234567890",
  "accountName": "Mitsubishi UFJ Bank",
  "accountType": "Savings",
  "createdAt": "2024-01-15T10:30:00Z",
  "latestBalance": 1500000
}
```

### Balance History Schema

```javascript
{
  historyId: string,            // Auto-generated unique identifier
  accountId: string,            // Reference to parent account
  balance: number,              // Balance amount at this point
  inputDate: timestamp,         // Date/time when balance was recorded
  memo: string                  // Optional note/description
}
```

**Example**:
```json
{
  "historyId": "hist_9876543210",
  "accountId": "acc_1234567890",
  "balance": 1500000,
  "inputDate": "2024-01-20T14:45:00Z",
  "memo": "Monthly update"
}
```

## Database Structure

Firebase Realtime Database uses a JSON tree structure:

```
root
├── accounts
│   ├── {accountId1}
│   │   ├── accountName: "Mitsubishi UFJ Bank"
│   │   ├── accountType: "Savings"
│   │   ├── createdAt: "2024-01-15T10:30:00Z"
│   │   └── latestBalance: 1500000
│   ├── {accountId2}
│   │   └── ...
│   └── ...
└── balanceHistory
    ├── {accountId1}
    │   ├── {historyId1}
    │   │   ├── balance: 1000000
    │   │   ├── inputDate: "2024-01-15T10:30:00Z"
    │   │   └── memo: "Initial balance"
    │   ├── {historyId2}
    │   │   └── ...
    │   └── ...
    ├── {accountId2}
    │   └── ...
    └── ...
```

## Module Organization

### app.js
- Application initialization
- Event listener setup
- Module coordination
- Global state management

### firebase-config.js
- Firebase SDK initialization
- Database reference setup
- Configuration management

### account-manager.js
- Account CRUD operations
- Account data validation
- Account list management

### balance-manager.js
- Balance entry creation
- Balance update logic
- Latest balance calculation

### dashboard.js
- Total balance calculation
- Account summary generation
- Real-time data binding

### charts.js
- Chart initialization
- Data transformation for charts
- Chart update logic
- Chart.js integration

### history.js
- History retrieval
- History filtering and sorting
- History display formatting

## Data Flow

### Creating an Account

1. User fills form → `account-manager.js`
2. Validate input → `account-manager.js`
3. Generate account ID → `account-manager.js`
4. Push to Firebase → `firebase-config.js` → Firebase Realtime Database
5. Firebase listener triggers → `dashboard.js` updates UI
6. Account list refreshes → UI update

### Updating Balance

1. User enters new balance → `balance-manager.js`
2. Create history entry → `balance-manager.js`
3. Update account's latestBalance → `account-manager.js`
4. Push to Firebase → Firebase Realtime Database
5. Real-time listeners trigger → Multiple modules update:
   - `dashboard.js` updates total
   - `charts.js` updates charts
   - `history.js` updates history display

## Real-time Synchronization

Firebase Realtime Database provides automatic synchronization:

- **Listeners**: Set up with `on()` method
- **Automatic Updates**: UI updates when data changes
- **Offline Support**: Firebase caches data locally
- **Conflict Resolution**: Last write wins (for this application)

## Security Considerations

### Current Implementation
- Basic security rules (read/write for all)
- Suitable for personal use
- No authentication required

### Production Recommendations
- Implement Firebase Authentication
- User-specific data isolation
- Role-based access control
- Input validation and sanitization
- Rate limiting

## Performance Considerations

### Data Loading
- Lazy loading of history data
- Pagination for large history sets
- Efficient Firebase queries

### UI Updates
- Debouncing for rapid updates
- Batch operations where possible
- Efficient DOM manipulation

### Chart Rendering
- Chart.js optimization
- Data aggregation for large datasets
- Selective chart updates

## Scalability

### Current Limitations
- Single-user application
- No data partitioning
- All data in one database

### Future Enhancements
- Multi-user support with authentication
- Data export/import functionality
- Backup and restore capabilities
- Data archiving for old history

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support required
- LocalStorage for caching (optional)
- WebSocket support for Firebase (automatic)

## Error Handling

- Try-catch blocks for async operations
- Firebase error callbacks
- User-friendly error messages
- Console logging for debugging

## Testing Strategy

### Manual Testing
- Account CRUD operations
- Balance updates
- Chart rendering
- History display
- Real-time updates

### Future Testing
- Unit tests for business logic
- Integration tests for Firebase operations
- UI testing
- Cross-browser testing

