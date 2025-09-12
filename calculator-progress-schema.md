# DVCC Calculator Progress Schema Design

## Database Schema

### Table: `calculator_progress`

```prisma
model CalculatorProgress {
  id          String   @id @default(cuid())
  userId      String   
  
  // Progress tracking
  currentStep     Int      @default(1)
  isSubmitted     Boolean  @default(false)
  lastAccessedAt  DateTime @default(now())
  
  // Step 1: Vehicle Information
  vehicleYear      String?
  vehicleMake      String?
  vehicleModel     String?
  vehicleVin       String?
  vehicleMileage   String?
  
  // Step 2: Accident Information
  accidentDate            String?
  isAtFault              String?   // 'yes' | 'no'
  isRepaired             String?   // 'yes' | 'no'
  repairCost             String?
  approximateCarPrice    String?
  nextAction             String?   // 'file-claim' | other options
  
  // Step 3: Insurance Information
  yourInsurance         String?
  claimNumber          String?
  atFaultInsurance     String?
  adjusterName         String?
  adjusterEmail        String?
  adjusterPhone        String?
  adjusterCountryCode  String?   @default("us")
  driverName           String?
  driverEmail          String?
  driverPhone          String?
  driverCountryCode    String?   @default("us")
  
  // Step 4: Pricing Plan
  selectedPlan      String?      // 'contingency' | other plans
  agreedToTerms     Boolean      @default(false)
  signatureDataUrl  String?      // Base64 signature
  
  // Metadata
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Constraints
  @@unique([userId]) // One progress per user
  @@map("calculator_progress")
}
```

## Key Design Decisions

### 1. **Single Progress Per User**
- `@@unique([userId])` ensures one active calculator session per user
- When user starts new calculation, it updates existing record

### 2. **Step-by-Step Data Storage**
- All form fields stored as optional strings/booleans
- Mirrors the exact structure from Zustand store
- Allows partial completion at any step

### 3. **Progress Tracking**
- `currentStep`: Which step user is currently on (1-4)
- `isSubmitted`: Whether user completed all 4 steps
- `lastAccessedAt`: For cleanup of stale progress

### 4. **File Handling**
- `signatureDataUrl`: Store base64 signature data
- Repair invoices: Store separately in file storage (not in progress)

## API Endpoints Design

### Progress Management
```
GET    /api/calculator/progress     - Get user's saved progress
POST   /api/calculator/progress     - Save/update progress
DELETE /api/calculator/progress     - Clear user's progress
POST   /api/calculator/submit       - Submit completed calculator
```

### Usage Flow
1. **User starts calculator**: Check for existing progress
2. **User fills forms**: Auto-save progress after each step
3. **User leaves/returns**: Restore from saved progress
4. **User completes**: Mark as submitted, optionally clear progress

## Benefits

### For Users
- ✅ Resume calculator from any device
- ✅ No data loss if browser crashes
- ✅ Can review and modify previous steps

### For Business
- ✅ Track completion rates by step
- ✅ Identify where users drop off
- ✅ Follow up with incomplete calculators
- ✅ Analytics on form abandonment

## Implementation Notes

### Auto-Save Strategy
- Save progress after each field update (debounced)
- Save on step navigation
- Save on browser unload

### Data Validation
- Validate data before saving to database
- Mirror frontend validation on backend
- Store validation state separately if needed

### Performance
- Index on `userId` for fast lookups
- Consider archiving old completed progress
- Implement cleanup for abandoned progress (30+ days)