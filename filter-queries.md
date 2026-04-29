# Filter Queries Reference

---

## Transaction Pages (Investment / Withdrawal / Payout / Closure)

### API: GET /api/transactions
**File:** server/routes.ts:2395 | **Auth:** Required

**Query params:** `type`, `clientId`, `status`, `startDate`, `endDate`

#### 1. Fetch all transactions (getAllTransactions — storage.ts:419)

```sql
SELECT *
FROM transaction
ORDER BY transaction_id DESC;
```

#### 2. Filter by type (applied in JS after fetch)

```sql
-- Investment
WHERE indicator_id = 1

-- Withdrawal
WHERE indicator_id = 3

-- Payout
WHERE indicator_id = 2

-- Closure
WHERE indicator_id = 4
```

#### 3. Role-based client filter (applied in JS after fetch)

```sql
-- Admin: no filter

-- Leader / Manager
WHERE client_id IN (
    SELECT client_id FROM mst_client
    WHERE reference_id = :userClientId
) OR client_id = :userClientId

-- Client
WHERE client_id = :userClientId
```

#### 4. Optional clientId filter from query param

```sql
WHERE client_id = :clientId
```

#### 5. Enrich each transaction with client details (getMstClient — storage.ts:280)

```sql
SELECT *
FROM mst_client
WHERE client_id = :clientId;
```

#### 6. Enrich client with user name/contact (getAllMstUsers — storage.ts:248)

```sql
SELECT *
FROM mst_user
ORDER BY created_date DESC;
```

---

### API: GET /api/clients
**File:** server/routes.ts:1782 | **Auth:** Required
**Purpose:** Client dropdown on transaction filter bar

#### 1. Fetch clients (getAllMstClients — storage.ts:302)

```sql
SELECT *
FROM mst_client
ORDER BY created_date DESC;
```

#### 2. Role-based filter (applied in JS)

```sql
-- Admin: no filter

-- Leader / Manager
WHERE reference_id = :userClientId OR client_id = :userClientId

-- Client
WHERE client_id = :userClientId
```

#### 3. Join user details (getAllMstUsers — storage.ts:248)

```sql
SELECT *
FROM mst_user
ORDER BY created_date DESC;
```

---

### API: GET /api/clients/opening-investments
**File:** server/routes.ts:1850 | **Auth:** Required

```sql
SELECT client_id, code, name, opening_investment
FROM mst_client
ORDER BY created_date DESC;
```
> Role-based WHERE applied in JS (same as above)

---

### API: GET /api/clients/opening-withdrawals
**File:** server/routes.ts:1895 | **Auth:** Required

```sql
SELECT client_id, code, name, opening_withdrawl
FROM mst_client
ORDER BY created_date DESC;
```
> Role-based WHERE applied in JS

---

### API: GET /api/clients/opening-payouts
**File:** server/routes.ts:1940 | **Auth:** Required

```sql
SELECT client_id, code, name, opening_payout
FROM mst_client
ORDER BY created_date DESC;
```
> Role-based WHERE applied in JS

---

### API: GET /api/clients/opening-closures
**File:** server/routes.ts:1999 | **Auth:** Required

```sql
SELECT client_id, code, name, opening_closure
FROM mst_client
ORDER BY created_date DESC;
```
> Role-based WHERE applied in JS

---

## Client Page

### API: GET /api/mst/clients
**File:** server/routes.ts:320 | **Auth:** None

```sql
SELECT *
FROM mst_client
ORDER BY created_date DESC;
```
> Client-side search filter on: code, name, email, mobile

---

## User Page

### API: GET /api/users
**File:** server/routes.ts:1410 | **Auth:** None

```sql
SELECT *
FROM mst_user
ORDER BY created_date DESC;
```

```sql
-- Joined in JS to resolve name when user.client_id is set
SELECT *
FROM mst_client
ORDER BY created_date DESC;
```
> Client-side filter on: firstName, lastName, email, mobile, role, is_active = 1

---

## Master Dropdown Endpoints

### API: GET /api/mst/roles
**File:** server/routes.ts:105

```sql
SELECT *
FROM mst_role;
```

---

### API: GET /api/mst/branches
**File:** server/routes.ts:272

```sql
SELECT *
FROM mst_branch;
```

---

### API: GET /api/mst/indicators
**File:** server/routes.ts:375

```sql
SELECT *
FROM mst_indicator;
```
> indicator_id values: 1 = investment, 2 = payout, 3 = withdrawal, 4 = closure

---

## Summary

| API Endpoint | Table | WHERE | ORDER BY |
|---|---|---|---|
| GET /api/transactions?type=investment | transaction | indicator_id = 1 + role filter | transaction_id DESC |
| GET /api/transactions?type=withdrawal | transaction | indicator_id = 3 + role filter | transaction_id DESC |
| GET /api/transactions?type=payout | transaction | indicator_id = 2 + role filter | transaction_id DESC |
| GET /api/transactions?type=closure | transaction | indicator_id = 4 + role filter | transaction_id DESC |
| GET /api/clients | mst_client | role filter | created_date DESC |
| GET /api/clients/opening-investments | mst_client | role filter | created_date DESC |
| GET /api/clients/opening-withdrawals | mst_client | role filter | created_date DESC |
| GET /api/clients/opening-payouts | mst_client | role filter | created_date DESC |
| GET /api/clients/opening-closures | mst_client | role filter | created_date DESC |
| GET /api/mst/clients | mst_client | none | created_date DESC |
| GET /api/users | mst_user | none | created_date DESC |
| GET /api/mst/roles | mst_role | none | none |
| GET /api/mst/branches | mst_branch | none | none |
| GET /api/mst/indicators | mst_indicator | none | none |
