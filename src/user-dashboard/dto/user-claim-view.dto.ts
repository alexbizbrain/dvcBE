import { ClaimStatus, ClaimFlow } from '@prisma/client';
import { DocumentDto } from './document.dto';

export type UserClaimViewDto = {
  id: string;
  currentStep: number;
  status: ClaimStatus;
  flow: ClaimFlow;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  vehicleInfo: {
    year?: number | string;
    make?: string;
    model?: string;
    vin?: string;
    mileage?: number | string;
    repairCost?: number | null;
    approximateCarPrice?: number | string;
    isCommercialVehicle?: boolean;
  };
  accidentInfo: {
    accidentDate?: string | Date;
    isAtFault?: boolean;
    isRepaired?: boolean;
    repairInvoiceFileName?: string;
    repairInvoiceFileUrl?: string;
    nextAction?: string;
    hitAndRun?: boolean;
  };
  insuranceInfo: {
    yourInsurance?: string;
    claimNumber?: string;
    atFaultInsurance?: string;
    adjusterName?: string;
    adjusterEmail?: string;
    adjusterPhone?: string;
    adjusterCountryCode?: string;
    driverName?: string;
    driverEmail?: string;
    driverPhone?: string;
    driverCountryCode?: string;
    autoInsuranceCardFileName?: string;
    autoInsuranceCardFileUrl?: string;
    driverLicenseFrontFileName?: string;
    driverLicenseFrontFileUrl?: string;
    driverLicenseBackFileName?: string;
    driverLicenseBackFileUrl?: string;
  };
  pricingPlan: {
    selectedPlan?: string;
    agreedToTerms?: boolean;
    signatureDataUrl?: string | null;
    estimatedAmount?: number | null;
  };
  liabilityInfo: {
    isAtFault?: boolean;
    state?: string;
    accidentState?: string;
  };
  documents: DocumentDto[];
};
