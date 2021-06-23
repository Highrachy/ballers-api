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

export const ADDRESSES = [
  {
    city: 'Surulere',
    state: 'Lagos',
    street1: 'Bode Thomas Street',
    street2: 'Adeniran Ogunsanya Street',
  },
  {
    city: 'Surulere',
    state: 'Lagos',
    street1: 'Adeniran Ogunsanya Street',
  },
  {
    city: 'Surulere',
    state: 'Lagos',
    street1: 'Ogunlana Drive',
  },
  {
    city: 'Ikeja',
    state: 'Lagos',
    street1: 'Toyin Street',
    street2: 'Isaac John Street',
  },
  {
    city: 'Ikeja',
    state: 'Lagos',
    street1: 'Allen Avenue',
    street2: 'Opebi',
  },
  {
    city: 'Victoria Island',
    state: 'Lagos',
    street1: 'Broad Street',
  },
  {
    city: 'Victoria Island',
    state: 'Lagos',
    street1: 'Ademola Adetokunbo Street',
  },
  {
    city: 'Victoria Island',
    state: 'Lagos',
    street1: 'Ozumba Mbadiwe Avenue',
    street2: 'Adeola Odeku street',
  },
  {
    city: 'Lekki Phase 1',
    state: 'Lagos',
    street1: 'Admiralty way',
  },
  {
    city: 'Ikoyi',
    state: 'Lagos',
    street1: 'Banana Island',
  },
];
