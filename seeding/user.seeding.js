/* eslint-disable import/no-extraneous-dependencies */
import faker from 'faker';
import UserFactory from '../test/factories/user.factory';
import VendorFactory from '../test/factories/vendor.factory';
import AddressFactory from '../test/factories/address.factory';
import User from '../server/models/user.model';
import { USER_ROLE } from '../server/helpers/constants';
import { logLoading, logError, logTable } from './seed-helpers';
import { ROLE, DEFAULT_PASSWORD } from './seed-constants';
import { hashPassword, generateReferralCode } from '../server/services/user.service';
import { USER_DEFAULTS } from './defaults.seeding';

export const seedUsers = async (limit, role, customValues = {}) => {
  const userDefaults = { ...customValues, ...USER_DEFAULTS };
  const roleValue = Object.keys(ROLE).find((key) => ROLE[key] === (userDefaults?.role || role));

  const password = userDefaults?.password || DEFAULT_PASSWORD;
  const hashedPassword = await hashPassword(password);
  const getFirstName = () => faker.name.firstName();

  const getVendorInfo = () =>
    VendorFactory.build({
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
      ...userDefaults?.vendor,
    });

  const users = await Promise.all(
    [...new Array(parseInt(limit, 10))].map(async () => {
      const firstName = getFirstName();
      const referralCode = await generateReferralCode(firstName);

      return UserFactory.build({
        role: roleValue,
        activated: true,
        activationDate: new Date(),
        firstName,
        lastName: faker.name.lastName(),
        email: faker.internet.email(),
        phone: faker.phone.phoneNumber(),
        referralCode,
        profileImage: faker.image.avatar(),
        address: AddressFactory.build({
          city: faker.address.city(),
          country: faker.address.country(),
          state: faker.address.state(),
          street1: faker.address.streetName(),
          street2: faker.address.streetName(),
        }),
        ...userDefaults,
        vendor: parseInt(roleValue, 10) === USER_ROLE.VENDOR ? getVendorInfo() : {},
        password: hashedPassword,
      });
    }),
  );

  try {
    if (!roleValue) {
      logError(`Invalid role input. Available roles are: ${Object.values(ROLE)}`);
    } else {
      await User.insertMany(users);
      logLoading(`${limit} ${parseInt(limit, 10) === 1 ? role : `${role}s`} created`);

      const table = [];
      users.forEach((user) => {
        table.push({
          Email: user.email,
          Password: password,
        });
      });
      logTable(table);
    }
  } catch (error) {
    logError(error);
  }
};

export const addDefaultUsers = async () => {
  await Promise.all(
    Object.values(ROLE).map(async (role) => {
      await seedUsers(1, role, { email: `${role}1@highrachy.com` });
    }),
  );
};
