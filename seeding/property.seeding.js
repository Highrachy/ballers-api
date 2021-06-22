import PropertyFactory from '../test/factories/property.factory';
import AddressFactory from '../test/factories/address.factory';
import Property from '../server/models/property.model';
import User from '../server/models/user.model';
import { USER_ROLE } from '../server/helpers/constants';
import { logLoading, logError, logTable } from './seed-helpers';
import { HOUSE_TYPES, DEFAULT_PROPERTY_FEATURES, CITIES, STATES, STREETS } from './seed-constants';
import { seedUsers } from './user.seeding';

const seedProperties = async (limit, customValues = {}) => {
  let vendor;

  [vendor] = await User.find({ role: USER_ROLE.VENDOR }).sort({ _id: -1 }).limit(1);

  if (!vendor) {
    try {
      await seedUsers(1, 'vendor');
      [vendor] = await User.find({ role: USER_ROLE.VENDOR }).sort({ _id: -1 }).limit(1);
    } catch (error) {
      logError(error);
    }
  }

  const properties = [...new Array(parseInt(limit, 10))].map(() => {
    const rooms = Math.floor(Math.random() * (4 - 2 + 1)) + 2;
    const houseType = HOUSE_TYPES[Math.floor(Math.random() * HOUSE_TYPES.length)];

    return PropertyFactory.build({
      address: AddressFactory.build({
        city: CITIES[Math.floor(Math.random() * CITIES.length)],
        country: 'Nigeria',
        state: STATES[Math.floor(Math.random() * STATES.length)],
        street1: STREETS[Math.floor(Math.random() * STREETS.length)],
        street2: STREETS[Math.floor(Math.random() * STREETS.length)],
      }),
      flagged: { status: false, requestUnflag: false },
      approved: { status: true },
      addedBy: vendor._id,
      bathrooms: rooms,
      bedrooms: rooms,
      description: `Newly built ${houseType}`,
      features: DEFAULT_PROPERTY_FEATURES.sort(() => Math.random() - Math.random()).slice(0, 3),
      houseType,
      name: `Newly built ${houseType}`,
      price:
        Math.round(
          (Math.floor(Math.random() * (50_000_000 - 10_000_000 + 1)) + 10_000_000) / 1_000_000,
        ) * 1_000_000,
      toilets: rooms + 1,
      units: Math.ceil(Math.random() * 10),
      ...customValues,
    });
  });

  try {
    await Property.insertMany(properties);
    logLoading(`${limit} ${parseInt(limit, 10) === 1 ? 'property' : 'properties'} created`);

    const table = [{ vendorEmail: vendor.email, noOfProperties: limit }];
    logTable(table);
  } catch (error) {
    logError(error);
  }
};

export default seedProperties;
