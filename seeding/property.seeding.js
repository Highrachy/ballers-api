import PropertyFactory from '../test/factories/property.factory';
import Property from '../server/models/property.model';
import User from '../server/models/user.model';
import { USER_ROLE } from '../server/helpers/constants';
import {
  logLoading,
  logError,
  logTable,
  returnOneItemFromArray,
  returnMultipleItemsFromArray,
  generateNumberWithinRange,
} from './seed-helpers';
import { HOUSE_TYPES, DEFAULT_PROPERTY_FEATURES, ADDRESSES } from './seed-constants';
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
    const rooms = generateNumberWithinRange(2, 4);
    const houseType = HOUSE_TYPES[Math.floor(Math.random() * HOUSE_TYPES.length)];

    return PropertyFactory.build({
      address: {
        country: 'Nigeria',
        ...returnOneItemFromArray(ADDRESSES),
      },
      flagged: { status: false, requestUnflag: false },
      approved: { status: true },
      addedBy: vendor._id,
      bathrooms: rooms,
      bedrooms: rooms,
      description: `Newly built ${houseType}`,
      features: returnMultipleItemsFromArray(DEFAULT_PROPERTY_FEATURES, 3),
      houseType,
      name: `Newly built ${houseType}`,
      price: generateNumberWithinRange(10_000_000, 50_000_000, 1_000_000),
      toilets: rooms + 1,
      units: generateNumberWithinRange(1, 10),
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
