import PaymentPlan from '../models/paymentPlan.model';
import { ErrorHandler } from '../helpers/errorHandler';
import httpStatus from '../helpers/httpStatus';
import { getPropertiesWithPaymentPlanId } from './property.service';

export const getPaymentPlanById = async (id) => PaymentPlan.findById(id).select();

export const addPaymentPlan = async (plan) => {
  try {
    const addedPlan = await new PaymentPlan(plan).save();
    return addedPlan;
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error adding payment plan', error);
  }
};

export const deletePaymentPlan = async (id) => {
  const plan = await getPaymentPlanById(id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  const propertiesAssignedTo = await getPropertiesWithPaymentPlanId(id);
  if (propertiesAssignedTo.length > 0) {
    throw new ErrorHandler(
      httpStatus.PRECONDITION_FAILED,
      'Cannot delete payment plan with properties assigned',
    );
  }
  try {
    return PaymentPlan.findByIdAndDelete(plan.id);
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error deleting payment plan', error);
  }
};

export const getAllPaymentPlans = async () => PaymentPlan.find({});

export const updatePaymentPlan = async (updatedPaymentPlan) => {
  const plan = await getPaymentPlanById(updatedPaymentPlan.id).catch((error) => {
    throw new ErrorHandler(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error', error);
  });
  try {
    return PaymentPlan.findByIdAndUpdate(plan.id, updatedPaymentPlan, { new: true });
  } catch (error) {
    throw new ErrorHandler(httpStatus.BAD_REQUEST, 'Error updating payment plan', error);
  }
};
