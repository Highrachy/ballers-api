import format from 'date-fns/format';

export const TODAY_WORDS = format(new Date(), 'd MMM yyyy');

export const TODAY_DDMMYY = format(new Date(), 'ddMMyyyy');
