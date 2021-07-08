import { slugify } from './funtions';
import { BADGE_ACCESS_LEVEL } from './constants';

const badgeNames = {
  ACTIVATED_USER: 'Activated User Badge',
  USER_FIRST_PAYMENT: 'First Payment User Badge',
  VENDOR_CERTIFIED: 'Certified Vendor Badge',
  VENDOR_FIRST_SALE: 'First Sale Vendor Badge',
  VENDOR_VERIFIED: 'Verified Vendor Badge',
};

const AUTOMATED_BADGES = {
  ACTIVATED_USER: {
    name: badgeNames.ACTIVATED_USER,
    slug: slugify(badgeNames.ACTIVATED_USER),
    assignedRole: BADGE_ACCESS_LEVEL.ALL,
    icon: { name: 'default', color: '#000000' },
  },
  USER_FIRST_PAYMENT: {
    name: badgeNames.USER_FIRST_PAYMENT,
    slug: slugify(badgeNames.USER_FIRST_PAYMENT),
    assignedRole: BADGE_ACCESS_LEVEL.USER,
    icon: { name: 'default', color: '#000000' },
  },
  VENDOR_CERTIFIED: {
    name: badgeNames.VENDOR_CERTIFIED,
    slug: slugify(badgeNames.VENDOR_CERTIFIED),
    assignedRole: BADGE_ACCESS_LEVEL.VENDOR,
    icon: { name: 'default', color: '#000000' },
  },
  VENDOR_FIRST_SALE: {
    name: badgeNames.VENDOR_FIRST_SALE,
    slug: slugify(badgeNames.VENDOR_FIRST_SALE),
    assignedRole: BADGE_ACCESS_LEVEL.VENDOR,
    icon: { name: 'default', color: '#000000' },
  },
  VENDOR_VERIFIED: {
    name: badgeNames.VENDOR_VERIFIED,
    slug: slugify(badgeNames.VENDOR_VERIFIED),
    assignedRole: BADGE_ACCESS_LEVEL.VENDOR,
    icon: { name: 'default', color: '#000000' },
  },
};

export default AUTOMATED_BADGES;
