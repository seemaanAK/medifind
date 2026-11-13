export const APP_CONFIG = {
  country: 'IN',
  countryCode: '+91',
  currency: 'INR',
  locale: 'en-IN',
  timeZone: 'Asia/Kolkata',
  defaultLanguage: 'en',
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL as string) || 'http://localhost:3001',
} as const;

export const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
];
