const getUserName = (user) =>
  user.vendor.companyName ? user.vendor.companyName : `${user.firstName} ${user.lastName}`;

export default getUserName;
