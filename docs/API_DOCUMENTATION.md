# NexaChain – API Documentation

## Overview

This document specifies the complete API contracts for the **NexaChain Investment & Referral Platform**, covering Authentication, Investment Management, and Dashboard Analytics.

### Base URL
```
http://localhost:5000/api
```

### Standard Response Envelope
All API responses adhere to a consistent contract:

**Success Response Envelope (`HTTP 200 / 201`):**
```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": {}
}
```

**Error Response Envelope (`HTTP 400 / 401 / 403 / 404 / 409 / 500`):**
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    {
      "field": "optional_field_name",
      "message": "Specific validation or error detail"
    }
  ]
}
```

---

## 1. Authentication Endpoints

### 1.1 Register User
- **Method:** `POST`
- **Route:** `/api/auth/register`
- **Access:** Public
- **Description:** Creates a new user account, assigns a collision-tested unique referral code, hashes password via bcryptjs, links optional sponsor upline, and issues a signed JWT access token.

#### Request Body
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "password": "SecurePassword123",
  "referralCode": "NEXA7K92P4"
}
```

#### Success Response (`HTTP 201 Created`)
```json
{
  "success": true,
  "message": "Account registered successfully.",
  "data": {
    "user": {
      "id": "660d1b2f4f1a2b001a111111",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "referralCode": "NEXAM5B89Q",
      "referredBy": "660d1b2f4f1a2b001a000000",
      "role": "user",
      "walletBalancePaise": 0,
      "isActive": true,
      "createdAt": "2026-11-03T10:00:00.000Z",
      "updatedAt": "2026-11-03T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.2 Login User
- **Method:** `POST`
- **Route:** `/api/auth/login`
- **Access:** Public
- **Description:** Verifies credentials against the bcrypt password hash, verifies account active status, and returns a signed JWT access token. Generic failure responses prevent account enumeration.

#### Request Body
```json
{
  "email": "jane.doe@example.com",
  "password": "SecurePassword123"
}
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "660d1b2f4f1a2b001a111111",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "referralCode": "NEXAM5B89Q",
      "role": "user",
      "walletBalancePaise": 0,
      "isActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### 1.3 Get Current User Profile
- **Method:** `GET`
- **Route:** `/api/auth/me`
- **Access:** Private (Bearer Token required)

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "User profile retrieved successfully.",
  "data": {
    "user": {
      "id": "660d1b2f4f1a2b001a111111",
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "referralCode": "NEXAM5B89Q",
      "role": "user",
      "walletBalancePaise": 0,
      "isActive": true
    }
  }
}
```

---

## 2. Investment Management Endpoints

All investment endpoints require an authenticated user session via `Authorization: Bearer <JWT_TOKEN>`.

### Authorized Investment Plans
| Plan ID | Plan Name | ROI Rate | Duration |
|---|---|---|---|
| `STARTER` | Starter Plan | 1.0% | 30 Days |
| `GROWTH` | Growth Plan | 1.5% | 60 Days |
| `PREMIUM` | Premium Plan | 2.0% | 90 Days |

---

### 2.1 Create Investment
- **Method:** `POST`
- **Route:** `/api/investments`
- **Access:** Private (Bearer Token required)

#### Request Body
```json
{
  "principalAmountPaise": 1000000,
  "planName": "Growth Plan"
}
```

#### Success Response (`HTTP 201 Created`)
```json
{
  "success": true,
  "message": "Investment created successfully",
  "data": {
    "investment": {
      "_id": "67273934338947fbb3000001",
      "user": "660d1b2f4f1a2b001a111111",
      "principalAmountPaise": 1000000,
      "planName": "Growth Plan",
      "roiPercentage": 1.5,
      "startDate": "2026-11-03T10:00:00.000Z",
      "endDate": "2027-01-02T10:00:00.000Z",
      "status": "pending",
      "totalRoiEarnedPaise": 0,
      "createdAt": "2026-11-03T10:00:00.000Z",
      "updatedAt": "2026-11-03T10:00:00.000Z"
    }
  }
}
```

---

### 2.2 List My Investments
- **Method:** `GET`
- **Route:** `/api/investments`
- **Access:** Private (Bearer Token required)
- **Query Parameters:** `page` (default: 1), `limit` (default: 10, max: 100), `status` (`pending`, `active`, `completed`, `cancelled`).

---

### 2.3 Get Investment Details
- **Method:** `GET`
- **Route:** `/api/investments/:id`
- **Access:** Private (Bearer Token required)

---

### 2.4 Get Available Investment Plans
- **Method:** `GET`
- **Route:** `/api/investments/plans`
- **Access:** Private (Bearer Token required)
- **Description:** Returns server-authoritative investment packages with illustrative return rates, duration, and demonstration markers.

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Available investment plans retrieved successfully",
  "data": {
    "plans": [
      {
        "id": "STARTER",
        "name": "Starter Plan",
        "roiPercentage": 1.0,
        "durationDays": 30,
        "description": "Entry-level investment plan with 1.0% daily return for 30 days",
        "isDemonstration": true
      },
      {
        "id": "GROWTH",
        "name": "Growth Plan",
        "roiPercentage": 1.5,
        "durationDays": 60,
        "description": "Mid-tier investment plan with 1.5% daily return for 60 days",
        "isDemonstration": true
      },
      {
        "id": "PREMIUM",
        "name": "Premium Plan",
        "roiPercentage": 2.0,
        "durationDays": 90,
        "description": "High-tier investment plan with 2.0% daily return for 90 days",
        "isDemonstration": true
      }
    ]
  }
}
```

---

### 2.5 List Pending Investments (Administrative)
- **Method:** `GET`
- **Route:** `/api/investments/admin/pending`
- **Access:** Admin Only (`role: 'admin'`)
- **Query Parameters:** `page` (default: 1), `limit` (default: 10, max: 100)
- **Description:** Returns pending investment packages across all platform users with populated applicant contact details for administrative review.

---

### 2.6 Activate Investment (Administrative)
- **Method:** `PATCH`
- **Route:** `/api/investments/:id/activate`
- **Access:** Admin Only (`role: 'admin'`)
- **Security Guard:** `INVESTMENT_ACTIVATION_ENABLED=true` required. Rejects self-activation by admin.
- **Description:** Transitions a pending investment contract to `active`, calculating start and end dates and logging administrative audit metadata.

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Investment activated successfully",
  "data": {
    "investment": {
      "_id": "67273934338947fbb3000001",
      "user": "660d1b2f4f1a2b001a111111",
      "status": "active",
      "startDate": "2026-11-06T15:00:00.000Z",
      "endDate": "2026-12-06T15:00:00.000Z",
      "actionedBy": "660d1b2f4f1a2b001a999999",
      "actionedAt": "2026-11-06T15:00:00.000Z"
    }
  }
}
```

---

### 2.7 Reject Investment (Administrative)
- **Method:** `PATCH`
- **Route:** `/api/investments/:id/reject`
- **Access:** Admin Only (`role: 'admin'`)
- **Request Body:** `{ "reason": "KYC documentation mismatch" }`
- **Description:** Rejects a pending investment contract, transitions status to `cancelled`, and records the rejection reason and administrative audit metadata.

---

## 3. Dashboard & Statistics Endpoint

### 3.1 Get Dashboard Statistics
- **Method:** `GET`
- **Route:** `/api/dashboard`
- **Access:** Private (Bearer Token required)
- **Description:** Returns aggregated financial metrics, investment breakdown, ROI performance history, and direct referral statistics for the currently authenticated user.

#### Headers
| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <JWT_TOKEN>` | Yes |

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `startDate` | ISO Date String | No | None | Filter ROI chart series starting from this business date |
| `endDate` | ISO Date String | No | None | Filter ROI chart series up to this business date |
| `limit` | Integer | No | `30` | Maximum number of data points returned in the chart array (1-100) |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/dashboard?startDate=2026-11-01&endDate=2026-11-30&limit=30" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Dashboard data retrieved successfully",
  "data": {
    "summary": {
      "totalInvestmentPaise": 750000,
      "activeInvestmentPaise": 500000,
      "totalRoiPaise": 12000,
      "walletBalancePaise": 450000,
      "totalDirectReferrals": 2,
      "activeDirectReferrals": 1,
      "processedReferralIncomePaise": 25000
    },
    "investments": {
      "totalCount": 4,
      "activeCount": 2,
      "pendingCount": 1,
      "completedCount": 1,
      "cancelledCount": 0,
      "amountByStatus": [
        {
          "status": "pending",
          "count": 1,
          "amountPaise": 100000
        },
        {
          "status": "active",
          "count": 2,
          "amountPaise": 500000
        },
        {
          "status": "completed",
          "count": 1,
          "amountPaise": 150000
        },
        {
          "status": "cancelled",
          "count": 0,
          "amountPaise": 0
        }
      ]
    },
    "roi": {
      "totalProcessedRoiPaise": 12000,
      "processedRecordCount": 2,
      "chartData": [
        {
          "businessDate": "2026-11-01T00:00:00.000Z",
          "amountPaise": 5000,
          "count": 1
        },
        {
          "businessDate": "2026-11-02T00:00:00.000Z",
          "amountPaise": 7000,
          "count": 1
        }
      ]
    },
    "referrals": {
      "totalDirectReferrals": 2,
      "activeDirectReferrals": 1,
      "processedReferralIncomePaise": 25000
    }
  }
}
```

#### Response Field Reference
| Field | Type | Unit | Description |
|---|---|---|---|
| `summary.totalInvestmentPaise` | Integer | Paise | Sum of `principalAmountPaise` across all user investments |
| `summary.activeInvestmentPaise` | Integer | Paise | Sum of `principalAmountPaise` for active investments only |
| `summary.totalRoiPaise` | Integer | Paise | Sum of processed ROI earned by the user (pending/failed excluded) |
| `summary.walletBalancePaise` | Integer | Paise | Current user wallet balance stored in the database |
| `summary.totalDirectReferrals` | Integer | Count | Users whose `referredBy` matches current user ID (indirect excluded) |
| `summary.activeDirectReferrals` | Integer | Count | Direct referrals with `isActive: true` |
| `summary.processedReferralIncomePaise` | Integer | Paise | Sum of processed referral commissions earned by user |
| `investments.amountByStatus` | Array | Objects | Breakdown of investment volume and counts per schema status |
| `roi.chartData` | Array | Objects | Grouped processed ROI by businessDate (ascending) for line charts |

#### Empty Dataset Behavior
For new accounts with zero investments, referrals, or earnings, the endpoint gracefully returns `0` for all monetary totals, counts, and empty arrays `[]` for chart points without throwing errors or returning `null`.

---

## 4. Referral Management Endpoints

### 4.1 List Direct Referrals
- **Method:** `GET`
- **Route:** `/api/referrals/direct`
- **Access:** Private (Bearer Token required)
- **Description:** Returns paginated list of level-1 direct referrals registered with the authenticated user's referral code. Excludes indirect referrals and strips all sensitive credentials (passwords, hashes).

#### Headers
| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <JWT_TOKEN>` | Yes |

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | Integer | No | `1` | Page number (min: 1) |
| `limit` | Integer | No | `10` | Records per page (min: 1, max: 100) |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/referrals/direct?page=1&limit=10" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Direct referrals retrieved successfully",
  "data": {
    "referrals": [
      {
        "_id": "660d1b2f4f1a2b001a222222",
        "name": "Bob Smith",
        "email": "bob@example.com",
        "referralCode": "BOB456",
        "isActive": true,
        "createdAt": "2026-11-03T11:00:00.000Z"
      }
    ],
    "pagination": {
      "totalRecords": 1,
      "currentPage": 1,
      "totalPages": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 4.2 Get Referral Hierarchy Tree
- **Method:** `GET`
- **Route:** `/api/referrals/tree`
- **Access:** Private (Bearer Token required)
- **Description:** Traverses the authenticated user's downline hierarchy level-by-level using batch breadth-first queries. Assembles an interactive multi-level tree with cycle protection, downline counts, and depth markers.

#### Headers
| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <JWT_TOKEN>` | Yes |

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `maxDepth` | Integer | No | `5` | Maximum safety traversal depth (1 to 10). Controls response payload limits without modifying business logic |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/referrals/tree?maxDepth=5" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Referral tree retrieved successfully",
  "data": {
    "tree": {
      "user": {
        "_id": "660d1b2f4f1a2b001a111111",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "referralCode": "ALICE123",
        "isActive": true,
        "createdAt": "2026-11-01T08:00:00.000Z"
      },
      "level": 0,
      "children": [
        {
          "user": {
            "_id": "660d1b2f4f1a2b001a222222",
            "name": "Bob Smith",
            "email": "bob@example.com",
            "referralCode": "BOB456",
            "isActive": true,
            "createdAt": "2026-11-02T09:00:00.000Z"
          },
          "level": 1,
          "children": [
            {
              "user": {
                "_id": "660d1b2f4f1a2b001a333333",
                "name": "Charlie Davis",
                "email": "charlie@example.com",
                "referralCode": "CHARLIE789",
                "isActive": true,
                "createdAt": "2026-11-03T10:00:00.000Z"
              },
              "level": 2,
              "children": []
            }
          ]
        }
      ]
    },
    "metadata": {
      "maxDepthEnforced": 5,
      "totalDownlineCount": 2,
      "hasMoreLevels": false
    }
  }
}
```

#### Traversal & Safety Architecture:
- **Zero N+1 Traversal:** Executes 1 single indexed batch query per tree depth level (`User.find({ referredBy: { $in: parentIds } })`) using `{ referredBy: 1 }`.
- **Cycle Immunity:** Maintains an internal visited set (`new Set([rootId])`) to skip redundant or cyclic references in legacy or corrupted data.
- **Payload Protection:** `maxDepth` bounds response payload size and memory consumption. If nodes exist beyond `maxDepth`, `metadata.hasMoreLevels` is flagged `true`.

---

### 4.3 Get Referral Income History
- **Method:** `GET`
- **Route:** `/api/referrals/income`
- **Access:** Private (Bearer Token required)
- **Description:** Returns paginated audit log of referral commission records where the authenticated user is the beneficiary, alongside total earnings broken down by processing status (`processed`, `pending`, `failed`).

#### Headers
| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <JWT_TOKEN>` | Yes |

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | Integer | No | `1` | Page number (min: 1) |
| `limit` | Integer | No | `10` | Records per page (min: 1, max: 100) |
| `status` | String | No | None | Filter by status (`pending`, `processed`, `failed`) |
| `startDate` | ISO Date String | No | None | Filter earnings created on or after this timestamp |
| `endDate` | ISO Date String | No | None | Filter earnings created on or before this timestamp |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/referrals/income?status=processed&page=1&limit=10" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Referral income retrieved successfully",
  "data": {
    "summary": {
      "processedIncomePaise": 50000,
      "pendingIncomePaise": 15000,
      "failedIncomePaise": 0,
      "totalIncomePaise": 65000
    },
    "incomeRecords": [
      {
        "_id": "67273934338947fbb3111111",
        "beneficiary": "660d1b2f4f1a2b001a111111",
        "sourceUser": {
          "_id": "660d1b2f4f1a2b001a222222",
          "name": "Bob Smith",
          "email": "bob@example.com",
          "referralCode": "BOB456"
        },
        "investment": "67273934338947fbb3000001",
        "level": 1,
        "commissionPercentage": 5,
        "amountPaise": 50000,
        "status": "processed",
        "processedAt": "2026-11-03T10:30:00.000Z",
        "createdAt": "2026-11-03T10:30:00.000Z"
      }
    ],
    "pagination": {
      "totalRecords": 1,
      "currentPage": 1,
      "totalPages": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

#### Field Reference:
- `summary.processedIncomePaise`: Total commission successfully credited.
- `summary.pendingIncomePaise`: Total commission awaiting batch processing.
- `summary.failedIncomePaise`: Total commission that failed transaction execution.
- `summary.totalIncomePaise`: Aggregate sum across all three commission statuses.
- `amountPaise`: Commission amounts strictly in integer paise (₹1.00 = 100 paise).

---

### 4.4 Trigger Multi-Level Referral Commission Processing
- **Method:** `POST`
- **Route:** `/api/referrals/process`
- **Access:** Private (Admin Role required)
- **Description:** Administratively triggers multi-level upline referral commission evaluation and distribution for a specific verified database event. Resolves event parameters and calculates commissions in integer paise across all eligible ancestors within an atomic transaction.

#### Headers
| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <ADMIN_JWT_TOKEN>` | Yes |
| `Content-Type` | `application/json` | Yes |

#### Request Body
```json
{
  "sourceType": "investment",
  "sourceId": "67273934338947fbb3000001"
}
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `sourceType` | String | Yes | Type of source event: `"investment"` (investment activation) or `"roi"` (ROI distribution) |
| `sourceId` | String | Yes | 24-character hexadecimal MongoDB ObjectId of the originating record |

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Referral commission processing completed successfully",
  "data": {
    "sourceEventId": "67273934338947fbb3000001",
    "sourceUserId": "660d1b2f4f1a2b001a111111",
    "sourceInvestmentId": "67273934338947fbb3000001",
    "triggerEvent": "INVESTMENT_ACTIVATION",
    "calculationBasis": "INVESTMENT_PRINCIPAL",
    "basisAmountPaise": 1000000,
    "ancestorsEvaluated": 3,
    "commissionsGenerated": 3,
    "commissionsSkipped": 0,
    "commissionsFailed": 0,
    "totalCommissionPaise": 90000,
    "commissions": [
      {
        "referralIncomeId": "67273934338947fbb3111111",
        "beneficiaryId": "660d1b2f4f1a2b001a222222",
        "level": 1,
        "rateBps": 500,
        "percentageApplied": 5,
        "amountPaise": 50000,
        "status": "processed"
      },
      {
        "referralIncomeId": "67273934338947fbb3222222",
        "beneficiaryId": "660d1b2f4f1a2b001a333333",
        "level": 2,
        "rateBps": 300,
        "percentageApplied": 3,
        "amountPaise": 30000,
        "status": "processed"
      },
      {
        "referralIncomeId": "67273934338947fbb3333333",
        "beneficiaryId": "660d1b2f4f1a2b001a444444",
        "level": 3,
        "rateBps": 100,
        "percentageApplied": 1,
        "amountPaise": 10000,
        "status": "processed"
      }
    ],
    "failures": []
  }
}
```

---

## 5. Return on Investment (ROI) Endpoints

### 5.1 List Personal ROI History
- **Method:** `GET`
- **Route:** `/api/roi/history`
- **Access:** Private (Bearer Token required)
- **Description:** Returns paginated daily ROI distribution records belonging to the authenticated user. Excludes records of other users and populates safe investment contract summaries.

#### Headers
| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <JWT_TOKEN>` | Yes |

#### Query Parameters
| Parameter | Type | Required | Default | Description |
|---|---|---|---|---|
| `page` | Integer | No | `1` | Page number (min: 1) |
| `limit` | Integer | No | `10` | Records per page (min: 1, max: 100) |
| `status` | String | No | None | Filter by payout status (`pending`, `processed`, `failed`) |
| `investmentId` | String | No | None | Filter payouts originating from a specific 24-char ObjectId |
| `startDate` | ISO Date String | No | None | Filter business dates starting on or after this timestamp |
| `endDate` | ISO Date String | No | None | Filter business dates up to this timestamp |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/roi/history?page=1&limit=10&status=processed" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "ROI history retrieved successfully",
  "data": {
    "roiRecords": [
      {
        "_id": "67273934338947fbb3000002",
        "user": "660d1b2f4f1a2b001a111111",
        "investment": {
          "_id": "67273934338947fbb3000001",
          "planName": "Growth Plan",
          "principalAmountPaise": 100000,
          "status": "active",
          "startDate": "2026-11-01T00:00:00.000Z",
          "endDate": "2027-01-01T00:00:00.000Z"
        },
        "amountPaise": 1500,
        "roiPercentageApplied": 1.5,
        "businessDate": "2026-11-03T00:00:00.000Z",
        "status": "processed",
        "transactionKey": "roi_67273934338947fbb3000001_2026-11-03",
        "createdAt": "2026-11-03T00:00:00.000Z"
      }
    ],
    "pagination": {
      "totalRecords": 1,
      "currentPage": 1,
      "totalPages": 1,
      "limit": 10,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 5.2 Get Personal ROI Summary
- **Method:** `GET`
- **Route:** `/api/roi/summary`
- **Access:** Private (Bearer Token required)
- **Description:** Returns aggregated ROI earnings statistics for the authenticated user, counting processed payouts only and displaying the latest payout timestamp and amount.

#### Headers
| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <JWT_TOKEN>` | Yes |

#### Example Request
```bash
curl -X GET "http://localhost:5000/api/roi/summary" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "ROI summary retrieved successfully",
  "data": {
    "summary": {
      "totalProcessedRoiPaise": 4500,
      "processedCount": 3,
      "pendingCount": 0,
      "failedCount": 0,
      "totalRecords": 3,
      "latestPayout": {
        "businessDate": "2026-11-03T00:00:00.000Z",
        "amountPaise": 1500
      }
    }
  }
}
```

---

### 5.3 Administrative Daily ROI Processing Trigger
- **Method:** `POST`
- **Route:** `/api/roi/process`
- **Access:** Private (Admin Role required)
- **Description:** Triggers the daily ROI batch processing engine for the specified business date. Executes transactional financial accruals, cumulative investment updates, and wallet crediting.

#### Headers
| Header | Value | Required |
|---|---|---|
| `Authorization` | `Bearer <ADMIN_JWT_TOKEN>` | Yes |
| `Content-Type` | `application/json` | Yes |

#### Request Body
```json
{
  "businessDate": "2026-11-03"
}
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "success": true,
  "message": "Daily ROI processing completed",
  "data": {
    "jobName": "DAILY_ROI_PROCESSING",
    "businessDate": "2026-11-03",
    "instanceId": "server-node-1-8492-4f3b1a2c",
    "startTimestamp": "2026-11-03T18:30:00.000Z",
    "completionTimestamp": "2026-11-03T18:30:01.240Z",
    "durationMs": 1240,
    "jobStatus": "SUCCESS",
    "eligibleInvestments": 10,
    "processedInvestments": 10,
    "skippedInvestments": 0,
    "failedInvestments": 0,
    "totalRoiGeneratedPaise": 15000,
    "failures": []
  }
}
```

#### Conflict Response (`HTTP 409 Conflict`)
Returned when another cluster node or background scheduler job is actively holding the distributed lock or executing ROI processing:
```json
{
  "success": false,
  "message": "Daily ROI processing job is currently running or locked by another instance. Please wait for completion.",
  "errors": [
    {
      "field": "jobStatus",
      "message": "SKIPPED_LOCK_HELD_BY_ANOTHER_INSTANCE",
      "instanceId": "server-node-2-1204-8b1e4a11"
    }
  ]
}
```
