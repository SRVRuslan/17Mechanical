import olegPhoto from '../assets/review-authors/oleg-komarovskyi.png';
import mikePhoto from '../assets/review-authors/mike-kripak.png';
import viktoriaPhoto from '../assets/review-authors/viktoria-boiko.png';

/** Manually verified against the company's public Google Maps profile.
 * Not a live API response. Update the values, excerpts and date after verification.
 */
export const googleReviewsSnapshot = {
  rating: 5,
  reviewCount: 5,
  asOf: '2026-10-21',
};

/** Short, unedited excerpts from separate customer reviews, in their original English. */
export const googleReviewExcerpts = [
  {
    author: 'Oleg Komarovskyi',
    photo: olegPhoto,
    rating: 5,
    text: 'I highly recommend 17 Mechanical HVAC/R Ltd. They were professional, punctual, and delivered outstanding quality from start to finish.',
    url: 'https://maps.app.goo.gl/xHZrGEYaNcPDGsBbA',
  },
  {
    author: 'Mike Kripak',
    photo: mikePhoto,
    rating: 5,
    text: 'Professional, efficient, and clean. The crew showed up on time, installed our AC without any hassle, and left the house spotless.',
    url: 'https://maps.app.goo.gl/SfJXxHZ1jqHWXmo96',
  },
  {
    author: 'Viktoria Boiko',
    photo: viktoriaPhoto,
    rating: 5,
    text: 'We had an amazing experience from start to finish! The whole team was friendly, professional, and truly cared about doing a great job.',
    url: 'https://maps.app.goo.gl/My5mQNKa9cXC1J3L9',
  },
] as const;
