import { USER_ROLE } from '../server/helpers/constants';

export const MODEL = {
  USER: 'USER',
  RESET: 'RESET',
  PROPERTY: 'PROPERTY',
};

export const ROLE = {
  [USER_ROLE.ADMIN]: 'admin',
  [USER_ROLE.USER]: 'user',
  [USER_ROLE.VENDOR]: 'vendor',
  [USER_ROLE.EDITOR]: 'editor',
};

export const DEFAULT_PASSWORD = 'passworded';

export const HOUSE_TYPES = [
  'Bungalow',
  'Detached Duplex',
  'Flat',
  'Maisonette',
  'Penthouse',
  'Semi-detached Bungalow',
  'Semi-detached Duplex',
  'Studio Apartment',
  'Terraced Bungalow',
  'Terraced Duplex',
];

export const DEFAULT_PROPERTY_FEATURES = [
  'Car Parking',
  'Guest Toilet',
  'Guest Room',
  "Governor's Consent",
  'Electricity',
  'Paved Roads',
  'Perimeter Fence',
  'Portable Water',
  'Fully Tiled',
  'Ensuite Rooms',
  'Easy Access to Roads',
  'Cable TV Distibution',
  'Core Fiber Internet',
  'Inverter System',
  'Security Fence',
  'Parking Lot',
  'Dedicated Car Port',
  'Maid Room',
  'Surveillance System',
  'Smart Solar System',
  'Panic Alarm',
  'Intercom System',
  'Spacious Kitchen',
  'Video door phone',
  'Fire detection',
  'Swimming Pool',
  'Rooftop Gym',
  'Garage',
  'Free WiFi',
  'Peaceful Environment',
  'Fitted Kitchen',
];

export const CITIES = [
  'Ajah',
  'Epe',
  'Ibeju Lekki',
  'Ikate',
  'Ikoyi',
  'Lekki Phase 1',
  'VGC',
  'Victoria Island',
];

export const STATES = ['Lagos', 'Ogun', 'Oyo'];

export const STREETS = [
  'Ademola Adetokunbo Street',
  'Adeniran Ogunsanya Street',
  'Adeola Odeku Street',
  'Allen Avenue',
  'Bode Thomas Street',
  'Broad Street',
  'Isaac John Street',
  'Ogunlana Drive',
  'Ozumba Mbadiwe Avenue',
  'Toyin Street',
];
