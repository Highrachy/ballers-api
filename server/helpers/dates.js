import format from 'date-fns/format';

export const getTodaysDateInWords = () => format(new Date(), 'd MMM yyyy');

export const getTodaysDateShortCode = () => format(new Date(), 'ddMMyyyy');

export const getTodaysDateStandard = () => format(new Date(), 'yyyy-MM-dd');