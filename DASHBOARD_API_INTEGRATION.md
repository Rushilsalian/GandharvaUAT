# Dashboard API Integration

## Overview
This document outlines the changes made to replace static dashboard data with dynamic API integration.

## Changes Made

### 1. Server-Side Changes

#### New API Endpoints (`server/routes.ts`)
- **GET `/api/dashboard/stats`** - Returns dashboard statistics based on user role
  - Query parameters: `userRole` (admin|leader|client), `clientId` (optional)
  - Returns different stats based on role:
    - **Admin**: totalClients, totalInvestments, activeWithdrawals, thisMonthPayouts
    - **Leader**: myClients, teamInvestments, referralsThisMonth, commissionEarned
    - **Client**: totalInvestment, totalPayout, activeReferrals, pendingWithdrawals

- **GET `/api/dashboard/trends`** - Returns trend data for charts
  - Query parameters: `userRole` (admin|leader|client), `clientId` (optional)
  - Returns different trend data based on role:
    - **Admin**: clientTrend, investmentTrend
    - **Leader**: teamTrend, referralTrend
    - **Client**: investmentTrend, payoutTrend

### 2. Client-Side Changes

#### New API Client (`client/src/lib/dashboardApi.ts`)
- Created dedicated API client for dashboard endpoints
- Defined TypeScript interfaces for API responses
- Handles role-based parameter passing

#### Updated Components

##### DashboardStats Component (`client/src/components/DashboardStats.tsx`)
- **Before**: Used static mock data
- **After**: Fetches real data from `/api/dashboard/stats`
- Added loading states
- Improved number formatting (K, L suffixes)
- Uses session data to get clientId for client role

##### TrendChart Component (`client/src/components/TrendChart.tsx`)
- **Before**: Used static mock data with random values
- **After**: Fetches real data from `/api/dashboard/trends`
- Added loading states
- Uses session data to get clientId for client role

## Data Sources

### Statistics Data
- **Total Clients**: Count from `mst_client` table
- **Total Investments**: Sum of transactions with `indicator_id = 1`
- **Active Withdrawals**: Count of transactions with `indicator_id = 3`
- **Monthly Payouts**: Sum of transactions with `indicator_id = 2` for current month
- **Team Performance**: Calculated based on leader's portion of total data
- **Client Data**: Filtered by specific `clientId`

### Trend Data
- **Client Acquisition**: Monthly count of new clients from `mst_client.created_date`
- **Investment Volume**: Monthly sum of investment transactions
- **Team Performance**: Leader's share of monthly investments
- **Client Growth**: Cumulative investment growth over time
- **Payout History**: Monthly payout amounts per client

## API Response Examples

### Admin Stats Response
```json
{
  "totalClients": 1247,
  "totalInvestments": 2400000,
  "activeWithdrawals": 23,
  "thisMonthPayouts": 45000
}
```

### Client Trends Response
```json
{
  "investmentTrend": [
    {"month": "Jan", "value": 10000},
    {"month": "Feb", "value": 12000},
    ...
  ],
  "payoutTrend": [
    {"month": "Jan", "value": 500},
    {"month": "Feb", "value": 600},
    ...
  ]
}
```

## Benefits

1. **Real-time Data**: Dashboard now shows actual data from the database
2. **Role-based Views**: Different users see relevant data for their role
3. **Performance**: Efficient queries with proper filtering
4. **Scalability**: API can be extended for additional metrics
5. **Maintainability**: Centralized data logic in API endpoints

## Testing

A test script (`test-dashboard-api.js`) has been created to verify API endpoints:
```bash
node test-dashboard-api.js
```

## Future Enhancements

1. **Caching**: Add Redis caching for frequently accessed dashboard data
2. **Real-time Updates**: Implement WebSocket connections for live data updates
3. **Advanced Metrics**: Add more sophisticated analytics and KPIs
4. **Date Filtering**: Allow custom date ranges for trend analysis
5. **Export Features**: Add data export capabilities for reports

## Migration Notes

- Old static data has been completely replaced
- Components now handle loading states gracefully
- Error handling added for API failures
- Backward compatibility maintained for existing user sessions