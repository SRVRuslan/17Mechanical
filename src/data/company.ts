/** Contact details stay unset until the company supplies them. */
export const company = {
  name: '17 Mechanical HVAC/R Ltd.',
  shortName: '17',
  logo: '/company-logo.jpeg',
  email: import.meta.env.PUBLIC_CONTACT_EMAIL || '',
  phone: import.meta.env.PUBLIC_CONTACT_PHONE || '',
  city: 'Calgary',
  region: 'AB',
  country: 'CA',
};
