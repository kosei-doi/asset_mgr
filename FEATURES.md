# Features Documentation

This document provides detailed specifications for all features in the Financial Asset Management Web Application.

## 1. Account Management

### 1.1 Add Account

**Description**: Allows users to create new accounts for tracking balances.

**User Flow**:
1. User clicks "Add Account" button
2. Modal/form appears with input fields
3. User enters:
   - Account Name (required, e.g., "Mitsubishi UFJ Bank", "Rakuten Securities")
   - Account Type (required, e.g., "Savings", "Time Deposit", "Securities Account")
   - Optional: Initial balance
4. User submits the form
5. Account is saved to Firebase Realtime Database
6. Account list updates automatically

**Data Structure**:
```javascript
{
  accountId: "auto-generated-id",
  accountName: "string",
  accountType: "string",
  createdAt: "timestamp",
  latestBalance: number
}
```

### 1.2 Edit Account

**Description**: Allows users to modify account information.

**User Flow**:
1. User clicks "Edit" button on an account card
2. Form pre-populated with current account data
3. User modifies account name or type
4. Changes are saved to Firebase
5. UI updates reflect changes

**Note**: Editing does not affect balance history.

### 1.3 Delete Account

**Description**: Removes an account and optionally its history.

**User Flow**:
1. User clicks "Delete" button on an account card
2. Confirmation dialog appears
3. User confirms deletion
4. Account and associated balance history are removed from Firebase
5. Account disappears from the list

### 1.4 Display Account List

**Description**: Shows all accounts with their current balances.

**Display Elements**:
- Account name
- Account type
- Latest balance
- Last updated date
- Edit/Delete buttons

## 2. Balance Management

### 2.1 Input/Update Balance

**Description**: Record a new balance for an account.

**User Flow**:
1. User clicks "Update Balance" on an account card
2. Form appears with:
   - Current balance (pre-filled)
   - New balance input field
   - Date picker (defaults to today)
   - Memo field (optional)
3. User enters new balance and optional memo
4. Balance is saved to Firebase
5. Account's latest balance is updated
6. Balance history entry is created
7. Dashboard and charts update automatically

**Data Structure**:
```javascript
{
  historyId: "auto-generated-id",
  accountId: "reference-to-account",
  balance: number,
  inputDate: "timestamp",
  memo: "string (optional)"
}
```

### 2.2 Display Latest Balance

**Description**: Shows the most recent balance for each account.

**Display**:
- Prominently displayed on account cards
- Formatted as currency (¥)
- Updated in real-time when new balance is entered

## 3. Dashboard

### 3.1 Total Balance Display

**Description**: Shows the sum of all account balances.

**Features**:
- Large, prominent display
- Real-time updates when any balance changes
- Formatted as currency
- Optional: Percentage change indicator

### 3.2 Account Balance List

**Description**: Displays all accounts with their balances in a list or grid.

**Display Format**:
- Account name
- Account type
- Current balance
- Visual indicator (color coding, icons)
- Quick access to update balance

### 3.3 Real-time Updates

**Description**: Dashboard automatically updates when data changes in Firebase.

**Implementation**:
- Uses Firebase Realtime Database listeners
- No page refresh required
- Smooth UI updates

## 4. Charts and Graphs

### 4.1 Asset Distribution (Pie Chart)

**Description**: Visual representation of how assets are distributed across accounts.

**Features**:
- Pie chart showing percentage of total assets per account
- Interactive: hover to see account name and amount
- Click to filter/view account details
- Color-coded by account type

**Chart Library**: Chart.js

### 4.2 Balance Trend (Line Chart)

**Description**: Shows balance changes over time for selected account(s).

**Features**:
- Line chart with time on X-axis, balance on Y-axis
- Can display single account or all accounts
- Date range selector
- Tooltip showing exact values on hover
- Multiple lines for comparing accounts

**Chart Library**: Chart.js

## 5. History Management

### 5.1 Display Balance History

**Description**: Shows chronological list of balance changes for an account.

**Display Elements**:
- Date and time of entry
- Balance amount
- Memo (if provided)
- Change indicator (increase/decrease from previous entry)
- Optional: Visual timeline

**Filtering Options**:
- Filter by account
- Filter by date range
- Sort by date (ascending/descending)

### 5.2 Record Balance Changes

**Description**: Automatically records each balance update.

**Data Captured**:
- Account ID
- Balance amount
- Timestamp
- Optional memo
- Auto-incremented history ID

**Storage**: All history entries stored in Firebase Realtime Database under `/balanceHistory/{accountId}/{historyId}`

## User Interface Requirements

### Responsive Design
- Works on desktop, tablet, and mobile devices
- Touch-friendly buttons and inputs
- Adaptive layout

### Accessibility
- Semantic HTML
- Keyboard navigation support
- Screen reader friendly

### Visual Design
- Clean, modern interface
- Clear visual hierarchy
- Intuitive icons and buttons
- Consistent color scheme

