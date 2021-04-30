import faker from 'faker';
import UserFactory from '../test/factories/user.factory';
import VendorFactory from '../test/factories/vendor.factory';
import AddressFactory from '../test/factories/address.factory';
import User from '../server/models/user.model';
import { USER_ROLE } from '../server/helpers/constants';
import logger from '../server/config/winston';

export const seedUsers = async (number = 1) => {
  const users = UserFactory.buildList(number, {
    role: USER_ROLE.USER,
    activated: true,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber(),
    referralCode: faker.random.alphaNumeric(),
  });

  try {
    await User.insertMany(users);
    logger.info(`${number} users created`);
  } catch (error) {
    logger.error(error);
  }
};

export const seedVendors = async (number = 1) => {
  const vendors = UserFactory.buildList(number, {
    role: USER_ROLE.VENDOR,
    activated: true,
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber(),
    referralCode: faker.random.alphaNumeric(),
    address: AddressFactory.build({
      city: faker.address.city(),
      country: faker.address.country(),
      state: faker.address.state(),
      street1: faker.address.streetName(),
      street2: faker.address.streetName(),
    }),
    vendor: VendorFactory.build({
      companyName: faker.company.companyName(),
      companyLogo: faker.image.abstract(),
      verified: true,
      phone: faker.phone.phoneNumber(),
      bankInfo: {
        accountName: faker.finance.accountName(),
        accountNumber: faker.finance.routingNumber(),
        bankName: faker.company.companyName(),
      },
      directors: [
        {
          name: faker.name.findName(),
          isSignatory: true,
          signature: faker.image.abstract(),
          phone: faker.phone.phoneNumber(),
        },
      ],
    }),
  });

  try {
    await User.insertMany(vendors);
    logger.info(`${number} vendors created`);
  } catch (error) {
    logger.error(error);
  }
};
