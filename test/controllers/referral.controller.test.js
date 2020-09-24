// import mongoose from 'mongoose';
// import { expect, request, sinon, useDatabase } from '../config';
// import Referral from '../../server/models/referral.model';
// import User from '../../server/models/user.model';
// import ReferralFactory from '../factories/referral.factory';
// import UserFactory from '../factories/user.factory';
// import { addUser } from '../../server/services/user.service';
// import { addReferral } from '../../server/services/referral.service';

// useDatabase();

// let adminToken;
// let userToken;
// const _id = mongoose.Types.ObjectId();
// const adminUser = UserFactory.build({ role: 0, activated: true });
// const regularUser = UserFactory.build({ _id, role: 1, activated: true });

// beforeEach(async () => {
//   adminToken = await addUser(adminUser);
//   userToken = await addUser(regularUser);
// });
