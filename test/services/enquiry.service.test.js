import mongoose from 'mongoose';
import { expect, sinon } from '../config';
import {
  getEnquiryById,
  addEnquiry,
  getEnquiry,
  approveEnquiry,
  getAllEnquiries,
} from '../../server/services/enquiry.service';
import { addProperty } from '../../server/services/property.service';
import EnquiryFactory from '../factories/enquiry.factory';
import PropertyFactory from '../factories/property.factory';
import Enquiry from '../../server/models/enquiry.model';
import { addUser } from '../../server/services/user.service';
import UserFactory from '../factories/user.factory';
import { USER_ROLE } from '../../server/helpers/constants';
import NOTIFICATIONS from '../../server/helpers/notifications';
import { expectNewNotificationToBeAdded } from '../helpers';
import { getFormattedName } from '../../server/helpers/funtions';

describe('Enquiry Service', () => {
  const vendor = UserFactory.build({ role: USER_ROLE.VENDOR }, { generateId: true });
  const admin = UserFactory.build({ role: USER_ROLE.ADMIN }, { generateId: true });
  const user = UserFactory.build({ role: USER_ROLE.USER }, { generateId: true });
  const property = PropertyFactory.build(
    { addedBy: vendor._id, updatedBy: vendor._id },
    { generateId: true },
  );

  beforeEach(async () => {
    await addUser(vendor);
    await addUser(admin);
    await addUser(user);
    await addProperty(property);
  });

  describe('#getEnquiryById', () => {
    const enquiry = EnquiryFactory.build(
      {
        userId: user._id,
        propertyId: property._id,
        vendorId: vendor._id,
        addedBy: user._id,
        updatedBy: user._id,
      },
      { generateId: true },
    );

    before(async () => {
      await Enquiry.create(enquiry);
    });

    it('returns a valid enquiry by Id', async () => {
      const enq = await getEnquiryById(enquiry._id);
      expect(enq._id).to.be.eql(enquiry._id);
    });
  });

  describe('#addEnquiry', () => {
    let countedEnquiries;
    const enquiry = EnquiryFactory.build(
      { userId: user._id, propertyId: property._id, addedBy: user._id, updatedBy: user._id },
      { generateId: true },
    );

    beforeEach(async () => {
      countedEnquiries = await Enquiry.countDocuments({});
    });

    context('when a valid enquiry is entered', () => {
      beforeEach(async () => {
        await addEnquiry(enquiry);
      });

      it('adds a new enquiry', async () => {
        const currentCountedEnquiries = await Enquiry.countDocuments({});
        expect(currentCountedEnquiries).to.eql(countedEnquiries + 1);
      });
      const description = `You have received a new enquiry for ${getFormattedName(property.name)}`;
      expectNewNotificationToBeAdded(NOTIFICATIONS.ENQUIRY_ADDED, property.addedBy, {
        description,
      });
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const InvalidEnquiry = EnquiryFactory.build({ title: '' });
          await addEnquiry(InvalidEnquiry);
        } catch (err) {
          const currentCountedEnquiries = await Enquiry.countDocuments({});
          expect(err.statusCode).to.eql(412);
          expect(err.message).to.be.eql('Invalid property');
          expect(currentCountedEnquiries).to.eql(countedEnquiries);
        }
      });
    });
  });

  describe('#approveEnquiry', () => {
    const enquiry = EnquiryFactory.build(
      { userId: user._id, propertyId: property._id, addedBy: user._id, updatedBy: user._id },
      { generateId: true },
    );
    beforeEach(async () => {
      await addEnquiry(enquiry);
    });

    context('when enquiry is approved', () => {
      it('returns a valid approved enquiry', async () => {
        const approvedEnquiry = await approveEnquiry({ enquiryId: enquiry._id, vendor });
        const validEnquiry = await getEnquiryById(enquiry._id);
        expect(validEnquiry._id).to.eql(approvedEnquiry._id);
        expect(validEnquiry.approvedBy).to.eql(approvedEnquiry.vendorId);
        expect(validEnquiry.approved).to.eql(true);
      });
    });

    context('when getEnquiryById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Enquiry, 'findById').throws(new Error('error msg'));
        try {
          await approveEnquiry({ enquiryId: enquiry._id, vendor });
        } catch (err) {
          expect(err.statusCode).to.eql(500);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Internal Server Error');
        }
        Enquiry.findById.restore();
      });
    });

    context('when findOneAndUpdate fails', () => {
      it('throws an error', async () => {
        sinon.stub(Enquiry, 'findOneAndUpdate').throws(new Error('error msg'));
        try {
          await approveEnquiry({ enquiryId: enquiry._id, vendor });
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error approving enquiry');
        }
        Enquiry.findOneAndUpdate.restore();
      });
    });
  });

  describe('#getEnquiry', () => {
    const enquiry = EnquiryFactory.build(
      { userId: user._id, propertyId: property._id, addedBy: user._id, updatedBy: user._id },
      { generateId: true },
    );

    beforeEach(async () => {
      await addEnquiry(enquiry);
    });

    context('when enquiry exists', () => {
      it('returns a valid enquiry', async () => {
        const gottenEnquiry = await getEnquiry({ enquiryId: enquiry._id, user });
        expect(gottenEnquiry[0]._id).to.eql(enquiry._id);
        expect(gottenEnquiry[0].propertyId).to.eql(property._id);
      });
    });

    context('when an invalid id is used', () => {
      it('returns an error', async () => {
        const invalidEnquiryId = mongoose.Types.ObjectId();
        const gottenEnquiry = await getEnquiry({ enquiryId: invalidEnquiryId, user });
        expect(gottenEnquiry.length).to.eql(0);
      });
    });
  });

  describe('#getAllEnquiries', () => {
    const multipleEnquiries = EnquiryFactory.buildList(18, {
      userId: user._id,
      propertyId: property._id,
      vendorId: vendor._id,
    });
    const enquiryToAdd = EnquiryFactory.build({
      userId: user._id,
      propertyId: property._id,
      vendorId: vendor._id,
    });

    beforeEach(async () => {
      await Enquiry.insertMany(multipleEnquiries);
    });
    context('when enquiry added is valid', () => {
      it('returns 18 enquiries', async () => {
        const enquiries = await getAllEnquiries(user);
        expect(enquiries.pagination.currentPage).to.be.eql(1);
        expect(enquiries.pagination.total).to.be.eql(18);
        expect(enquiries.result.length).to.be.eql(10);
        expect(enquiries.result[0].userId).to.be.eql(user._id);
      });
    });
    context('when new enquiry is added', () => {
      before(async () => {
        await Enquiry.create(enquiryToAdd);
      });
      it('returns 19 enquiries', async () => {
        const enquiries = await getAllEnquiries(user);
        expect(enquiries.pagination.currentPage).to.be.eql(1);
        expect(enquiries.pagination.total).to.be.eql(19);
        expect(enquiries.result.length).to.be.eql(10);
        expect(enquiries.result[0].userId).to.be.eql(user._id);
      });
    });
  });
});
