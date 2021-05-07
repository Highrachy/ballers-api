export const getUserName = (user) =>
  user.vendor.companyName ? user.vendor.companyName : `${user.firstName} ${user.lastName}`;

export const getMoneyFormat = (number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(number);

export const getFormattedPropertyName = (property) => `"${property.name}"`;
