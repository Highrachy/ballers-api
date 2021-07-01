export const getUserName = (user) =>
  user.vendor.companyName ? user.vendor.companyName : `${user.firstName} ${user.lastName}`;

export const getMoneyFormat = (number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(number);

export const getFormattedName = (name) => `"${name}"`;

export const slugifyString = (string) =>
  string
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
