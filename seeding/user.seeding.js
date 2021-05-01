// eslint-disable-next-line import/no-extraneous-dependencies
import faker from 'faker';
import UserFactory from '../test/factories/user.factory';
import VendorFactory from '../test/factories/vendor.factory';
import AddressFactory from '../test/factories/address.factory';
import User from '../server/models/user.model';
import { USER_ROLE } from '../server/helpers/constants';
// eslint-disable-next-line import/no-cycle
import { logLoading, logError } from './index';

const seedUsers = async (limit, role) => {
  const vendor = VendorFactory.build({
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
  });

  const users = UserFactory.buildList(limit, {
    role: USER_ROLE[role.toUpperCase()],
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
    vendor: role === 'vendor' ? vendor : {},
  });

  try {
    await User.insertMany(users);
    logLoading(`${limit} ${parseInt(limit, 10) === 1 ? role : `${role}s`} created`);
  } catch (error) {
    logError(error);
  }
};

export default seedUsers;
