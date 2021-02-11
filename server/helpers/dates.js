import format from 'date-fns/format';
import formatISO from 'date-fns/formatISO';

export const getTodaysDateInWords = () => format(new Date(), 'd MMM yyyy');

export const getTodaysDateShortCode = () => format(new Date(), 'ddMMyyyy');

export const getTodaysDateStandard = () => format(new Date(), 'yyyy-MM-dd');

export const getDateWithTimestamp = () => formatISO(new Date());

export const convertDateToLongHumanFormat = (date) => format(date, `EEEE, do 'of' MMMM yyyy`);

export const convertDateToShortHumanFormat = (date) => format(date, 'EEE MMM d, yyyy');
