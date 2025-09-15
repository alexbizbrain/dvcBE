export type CustomerQuery = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  countryCode: string; // default +1 at creation if not provided
  message: string;
  createdAt: Date;
  updatedAt: Date;
};
