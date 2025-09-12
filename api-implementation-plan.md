# DVCC Calculator Progress API Implementation Plan

## 1. API Endpoints Structure

```typescript
// Base route: /calculator-progress

GET    /calculator-progress           - Get user's current progress
POST   /calculator-progress           - Save/update progress  
DELETE /calculator-progress           - Clear user's progress
POST   /calculator-progress/submit    - Mark calculator as submitted
```

## 2. Request/Response Schemas

### GET /calculator-progress
```typescript
// Response
{
  "success": true,
  "data": {
    "id": "clx123...",
    "currentStep": 2,
    "isSubmitted": false,
    "lastAccessedAt": "2024-01-15T10:30:00Z",
    "vehicleInfo": {
      "year": "2020",
      "make": "Toyota",
      "model": "Camry",
      "vin": "1234567890",
      "mileage": "50000"
    },
    "accidentInfo": {
      "accidentDate": "2024-01-10",
      "isAtFault": "no",
      "isRepaired": "yes",
      "repairCost": "5000",
      // ... other fields
    },
    // ... other steps
  }
} | { "success": true, "data": null } // No progress found
```

### POST /calculator-progress
```typescript
// Request Body
{
  "currentStep": 2,
  "vehicleInfo": { /* partial vehicle data */ },
  "accidentInfo": { /* partial accident data */ },
  // ... other step data
}

// Response
{
  "success": true,
  "message": "Progress saved successfully",
  "data": { /* updated progress */ }
}
```

## 3. Service Layer Methods

```typescript
class CalculatorProgressService {
  async getProgress(userId: string): Promise<CalculatorProgressDto | null>
  async saveProgress(userId: string, data: SaveProgressDto): Promise<CalculatorProgressDto>
  async clearProgress(userId: string): Promise<void>
  async submitCalculator(userId: string): Promise<void>
  async getProgressStats(): Promise<ProgressStatsDto> // Admin analytics
}
```

## 4. DTOs

### SaveProgressDto
```typescript
export class SaveProgressDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  currentStep?: number;

  @IsOptional()
  @IsBoolean()
  isSubmitted?: boolean;

  // Vehicle Info
  @IsOptional()
  @IsString()
  vehicleYear?: string;
  
  @IsOptional()
  @IsString()
  vehicleMake?: string;
  
  // ... all other fields as optional
}
```

### CalculatorProgressResponseDto
```typescript
export class CalculatorProgressResponseDto {
  id: string;
  currentStep: number;
  isSubmitted: boolean;
  lastAccessedAt: Date;
  
  vehicleInfo: VehicleInfoDto;
  accidentInfo: AccidentInfoDto;
  insuranceInfo: InsuranceInfoDto;
  pricingPlan: PricingPlanDto;
  
  createdAt: Date;
  updatedAt: Date;
}
```

## 5. Frontend Integration

### Zustand Store Modifications
```typescript
interface DVCCActions {
  // ... existing actions
  loadProgress: () => Promise<void>
  saveProgress: () => Promise<void>
  clearServerProgress: () => Promise<void>
  syncWithServer: () => Promise<void>
}

// Auto-save implementation
const useDVCCStore = create<DVCCState & DVCCActions>()(
  persist(
    (set, get) => ({
      // ... existing implementation
      
      loadProgress: async () => {
        try {
          const response = await fetch('/api/calculator-progress')
          const { data } = await response.json()
          if (data) {
            set(() => ({
              currentStep: data.currentStep,
              isSubmitted: data.isSubmitted,
              vehicleInfo: data.vehicleInfo || initialState.vehicleInfo,
              accidentInfo: data.accidentInfo || initialState.accidentInfo,
              insuranceInfo: data.insuranceInfo || initialState.insuranceInfo,
              pricingPlan: data.pricingPlan || initialState.pricingPlan,
            }))
          }
        } catch (error) {
          console.error('Failed to load progress:', error)
        }
      },

      saveProgress: async () => {
        const state = get()
        try {
          await fetch('/api/calculator-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              currentStep: state.currentStep,
              vehicleInfo: state.vehicleInfo,
              accidentInfo: state.accidentInfo,
              insuranceInfo: state.insuranceInfo,
              pricingPlan: state.pricingPlan,
            })
          })
        } catch (error) {
          console.error('Failed to save progress:', error)
        }
      }
    })
  )
)
```

### Auto-Save Strategy
```typescript
// Debounced auto-save
import { debounce } from 'lodash'

const debouncedSave = debounce(() => {
  useDVCCStore.getState().saveProgress()
}, 1000)

// Call after any state update
updateVehicleInfo: (data) => {
  set((state) => ({ vehicleInfo: { ...state.vehicleInfo, ...data } }))
  debouncedSave() // Auto-save after 1 second
}
```

## 6. Implementation Phases

### Phase 1: Basic Progress Storage
- Create database model
- Implement GET/POST endpoints
- Basic save/load functionality

### Phase 2: Auto-Save Integration
- Frontend auto-save on field changes
- Debounced API calls
- Error handling and retry logic

### Phase 3: Advanced Features
- Progress analytics dashboard
- Abandoned form follow-up
- Multi-device sync
- Progress cleanup jobs

## 7. Security Considerations

### Authentication
- All endpoints require valid JWT token
- Progress tied to authenticated user ID
- No cross-user access to progress data

### Data Validation
- Validate all input data on backend
- Sanitize before database storage
- Rate limiting on save operations

### Privacy
- Auto-delete progress after submission (configurable)
- Cleanup abandoned progress after 30 days
- Option for user to manually clear progress

## 8. Monitoring & Analytics

### User Metrics
- Step completion rates
- Average time per step  
- Drop-off points
- Device/browser analytics

### System Metrics
- API response times
- Database query performance
- Auto-save frequency
- Error rates

This implementation will provide seamless progress persistence across devices while maintaining good performance and user experience.