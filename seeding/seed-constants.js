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
    mapLocation: {
      latitude: 6.488739,
      longitude: 3.348708,
    },
  },
  {
    city: 'Surulere',
    state: 'Lagos',
    street1: 'Adeniran Ogunsanya Street',
    mapLocation: {
      latitude: 6.494342,
      longitude: 3.357373,
    },
  },
  {
    city: 'Surulere',
    state: 'Lagos',
    street1: 'Ogunlana Drive',
    mapLocation: {
      latitude: 6.506744,
      longitude: 3.352491,
    },
  },
  {
    city: 'Ikeja',
    state: 'Lagos',
    street1: 'Toyin Street',
    street2: 'Isaac John Street',
    mapLocation: {
      latitude: 6.596069,
      longitude: 3.350972,
    },
  },
  {
    city: 'Ikeja',
    state: 'Lagos',
    street1: 'Allen Avenue',
    street2: 'Opebi',
    mapLocation: {
      latitude: 6.601577,
      longitude: 3.352116,
    },
  },
  {
    city: 'Victoria Island',
    state: 'Lagos',
    street1: 'Ademola Adetokunbo Street',
    mapLocation: {
      latitude: 6.430774,
      longitude: 3.430106,
    },
  },
  {
    city: 'Victoria Island',
    state: 'Lagos',
    street1: 'Ozumba Mbadiwe Avenue',
    street2: 'Adeola Odeku street',
    mapLocation: {
      latitude: 6.436297,
      longitude: 3.416084,
    },
  },
  {
    city: 'Lekki Phase 1',
    state: 'Lagos',
    street1: 'Admiralty way',
    mapLocation: {
      latitude: 6.44672,
      longitude: 3.461404,
    },
  },
  {
    city: 'Ikoyi',
    state: 'Lagos',
    street1: 'Banana Island',
    mapLocation: {
      latitude: 6.466667,
      longitude: 3.45,
    },
  },
  {
    city: 'Mabushi',
    state: 'Abuja',
    street1: 'Crown Court',
    mapLocation: {
      latitude: 9.083086,
      longitude: 7.448157,
    },
  },
  {
    city: 'Maitama District',
    state: 'Abuja',
    street1: `Peggy’s Pointee`,
    mapLocation: {
      latitude: 9.085198,
      longitude: 7.497654,
    },
  },
  {
    city: 'Lokogoma',
    state: 'Abuja',
    street1: 'Efab Estate',
    mapLocation: {
      latitude: 8.978616,
      longitude: 7.458203,
    },
  },
  {
    city: 'Dakwo District',
    state: 'Abuja',
    street1: 'Sunny Vale Homes',
    mapLocation: {
      latitude: 8.985342,
      longitude: 7.445247,
    },
  },
  {
    city: 'Port-Harcourt',
    state: 'Rivers',
    street1: 'Lekki Gardens, Airport Road',
    mapLocation: {
      latitude: 4.892629,
      longitude: 7.002306,
    },
  },
  {
    city: 'Port-Harcourt',
    state: 'Rivers',
    street1: 'RIVTAF Golf Estate',
    mapLocation: {
      latitude: 4.798382,
      longitude: 7.057375,
    },
  },
  {
    city: 'Nasarawa GRA',
    state: 'Kano',
    street1: 'Sanni Abacha way',
    mapLocation: {
      latitude: 12.019849,
      longitude: 8.544486,
    },
  },
  {
    city: 'Rukayya Bayero Gwale',
    state: 'Kano',
    street1: 'Tudun Yola',
    mapLocation: {
      latitude: 11.994897,
      longitude: 8.478684,
    },
  },
];

export const NEIGHBORHOODS = {
  entertainments: [
    {
      name: 'iFitness',
      distance: 10,
      mapLocation: {
        longitude: 1.234555,
        latitude: 1.234555,
      },
    },
  ],
  hospitals: [
    {
      name: 'Reddington Hospital',
      distance: 10,
      mapLocation: {
        longitude: 1.234555,
        latitude: 1.234555,
      },
    },
  ],
  pointsOfInterest: [
    {
      name: 'Genesis Cinema',
      distance: 10,
      mapLocation: {
        longitude: 1.234555,
        latitude: 1.234555,
      },
    },
  ],
  restaurantsAndBars: [
    {
      name: 'Cut steak house',
      distance: 10,
      mapLocation: {
        longitude: 1.234555,
        latitude: 1.234555,
      },
    },
  ],
  schools: [
    {
      name: 'British International School',
      distance: 10,
      mapLocation: {
        longitude: 1.234555,
        latitude: 1.234555,
      },
    },
  ],
  shoppingMalls: [
    {
      name: 'Shoprite',
      distance: 10,
      mapLocation: {
        longitude: 1.234555,
        latitude: 1.234555,
      },
    },
  ],
};
