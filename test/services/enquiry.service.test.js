import mongoose from 'mongoose';
import { expect, sinon, useDatabase } from '../config';
import {
  getEnquiryById,
  addEnquiry,
  approveEnquiry,
  getAllEnquiries,
} from '../../server/services/enquiry.service';
import EnquiryFactory from '../factories/enquiry.factory';
import Enquiry from '../../server/models/enquiry.model';

useDatabase();

describe('Enquiry Service', () => {
  describe('#getEnquiryById', () => {
    const id = mongoose.Types.ObjectId();

    before(async () => {
      await Enquiry.create(EnquiryFactory.build({ _id: id, userId: id }));
    });

    it('returns a valid enquiry by Id', async () => {
      const enquiry = await getEnquiryById(id);
      expect(id.equals(enquiry.id)).to.be.eql(true);
    });
  });

  describe('#addEnquiry', () => {
    let countedEnquiries;
    const id = mongoose.Types.ObjectId();
    const enquiry = EnquiryFactory.build({ userId: id });

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
    });

    context('when an invalid data is entered', () => {
      it('throws an error', async () => {
        try {
          const InvalidEnquiry = EnquiryFactory.build({ title: '' });
          await addEnquiry(InvalidEnquiry);
        } catch (err) {
          const currentCountedEnquiries = await Enquiry.countDocuments({});
          expect(err.statusCode).to.eql(400);
          expect(err.error.name).to.be.eql('ValidationError');
          expect(err.message).to.be.eql('Error adding enquiry');
          expect(currentCountedEnquiries).to.eql(countedEnquiries);
        }
      });
    });
  });

  describe('#approveEnquiry', () => {
    const id = mongoose.Types.ObjectId();
    const updatedEnquiry = {
      enquiryId: id,
      adminId: id,
    };
    beforeEach(async () => {
      await addEnquiry(EnquiryFactory.build({ _id: id, userId: id, approved: false }));
    });

    context('when enquiry is approved', () => {
      it('returns a valid approved enquiry', async () => {
        const approvedEnquiry = await approveEnquiry(updatedEnquiry);
        const enquiry = await getEnquiryById(id);
        expect(enquiry.id).to.eql(approvedEnquiry.id);
        expect(updatedEnquiry.adminId.equals(enquiry.approvedBy)).to.eql(true);
        expect(enquiry.approved).to.eql(true);
      });
    });

    context('when getEnquiryById fails', () => {
      it('throws an error', async () => {
        sinon.stub(Enquiry, 'findById').throws(new Error('error msg'));
        try {
          await approveEnquiry(updatedEnquiry);
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
          await approveEnquiry(updatedEnquiry);
        } catch (err) {
          expect(err.statusCode).to.eql(400);
          expect(err.error).to.be.an('Error');
          expect(err.message).to.be.eql('Error approving enquiry');
        }
        Enquiry.findOneAndUpdate.restore();
      });
    });
  });

  describe('#getAllEnquiries', () => {
    const id = mongoose.Types.ObjectId();
    const enquiryToAdd = EnquiryFactory.build({ userId: id });

    beforeEach(async () => {
      await Enquiry.create(enquiryToAdd);
      await Enquiry.create(enquiryToAdd);
    });
    context('when enquiry added is valid', () => {
      it('returns 2 enquiries', async () => {
        const enquiry = await getAllEnquiries();
        expect(enquiry).to.be.an('array');
        expect(enquiry.length).to.be.eql(2);
      });
    });
    context('when new enquiry is added', () => {
      before(async () => {
        await Enquiry.create(enquiryToAdd);
      });
      it('returns 3 enquiries', async () => {
        const enquiry = await getAllEnquiries();
        expect(enquiry).to.be.an('array');
        expect(enquiry.length).to.be.eql(3);
      });
    });
  });
});
