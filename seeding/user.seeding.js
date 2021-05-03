// eslint-disable-next-line import/no-extraneous-dependencies
import faker from 'faker';
import UserFactory from '../test/factories/user.factory';
import VendorFactory from '../test/factories/vendor.factory';
import AddressFactory from '../test/factories/address.factory';
import User from '../server/models/user.model';
import { USER_ROLE } from '../server/helpers/constants';
import { logLoading, logError } from './seed-helpers';
import { ROLE } from './seed-constants';

const seedUsers = async (limit, role, defaultValues = {}) => {
  const roleValue = Object.keys(ROLE).find((key) => ROLE[key] === role);

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
    role: roleValue,
    activated: true,
    activationDate: new Date(),
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: defaultValues.email || faker.internet.email(),
    password: 'passworded',
    confirmPassword: 'passworded',
    phone: faker.phone.phoneNumber(),
    referralCode: faker.lorem.word(),
    profileImage: faker.image.avatar(),
    address: AddressFactory.build({
      city: faker.address.city(),
      country: faker.address.country(),
      state: faker.address.state(),
      street1: faker.address.streetName(),
      street2: faker.address.streetName(),
    }),
    vendor: parseInt(roleValue, 10) === USER_ROLE.VENDOR ? vendor : {},
  });

  try {
    if (!roleValue) {
      logError(`Invalid role input. Available roles are: ${Object.values(ROLE)}`);
    } else {
      await User.insertMany(users);
      logLoading(`${limit} ${parseInt(limit, 10) === 1 ? role : `${role}s`} created`);
    }
  } catch (error) {
    logError(error);
  }
};

export default seedUsers;
