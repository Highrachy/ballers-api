import PropertyFactory from '../test/factories/property.factory';
import Property from '../server/models/property.model';
import User from '../server/models/user.model';
import { USER_ROLE } from '../server/helpers/constants';
import {
  logLoading,
  logError,
  logTable,
  getOneRandomItem,
  getMultipleRandomItems,
  getNumberWithinRange,
} from './seed-helpers';
import { HOUSE_TYPES, DEFAULT_PROPERTY_FEATURES, ADDRESSES } from './seed-constants';
import { seedUsers } from './user.seeding';
import { USER_DEFAULTS } from './defaults.seeding';

const seedProperties = async (limit, customValues = {}) => {
  let vendor;

  const parsedLimit = parseInt(limit, 10);

  [vendor] = await User.find({ ...USER_DEFAULTS, role: USER_ROLE.VENDOR })
    .sort({ _id: -1 })
    .limit(1);

  if (!vendor) {
    try {
      await seedUsers(1, 'vendor');
      [vendor] = await User.find({ role: USER_ROLE.VENDOR }).sort({ _id: -1 }).limit(1);
    } catch (error) {
      logError(error);
    }
  }

  const properties = [...new Array(parsedLimit)].map(() => {
    const rooms = getNumberWithinRange(2, 4);
    const houseType = getOneRandomItem(HOUSE_TYPES);
    const numberOfFeatures = getNumberWithinRange(1, 6);

    const features = getMultipleRandomItems(DEFAULT_PROPERTY_FEATURES, numberOfFeatures);

    return PropertyFactory.build({
      address: {
        country: 'Nigeria',
        ...getOneRandomItem(ADDRESSES),
      },
      flagged: { status: false, requestUnflag: false },
      approved: { status: true },
      addedBy: vendor._id,
      bathrooms: rooms,
      bedrooms: rooms,
      description: `Newly built ${houseType} with ${features.join(',')}.`,
      features,
      houseType,
      name: `Newly built ${houseType}`,
      price: getNumberWithinRange(10_000_000, 50_000_000, 1_000_000),
      toilets: rooms + 1,
      units: getNumberWithinRange(1, 10),
      ...customValues,
    });
  });

  try {
    await Property.insertMany(properties);
    logLoading(`${limit} ${parsedLimit === 1 ? 'property' : 'properties'} created`);

    const table = [{ vendorEmail: vendor.email, noOfProperties: limit }];
    logTable(table);
  } catch (error) {
    logError(error);
  }
};

export default seedProperties;
