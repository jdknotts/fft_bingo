/**
 * Google Form connection for bingo item suggestions.
 *
 * Setup (one time):
 * 1. Create a Google Form with one question: "Suggest a bingo item" (short answer).
 * 2. Click Send → link icon → copy the form URL.
 *    Example: https://docs.google.com/forms/d/e/1FAIpQLSf.../viewform
 * 3. Set actionUrl below by replacing "viewform" with "formResponse".
 * 4. In the form editor: ⋮ → Get pre-filled link → type "test" in the question →
 *    copy the URL and find entry.1234567890=test → set entryField below.
 */
export const GOOGLE_FORM = {
  actionUrl: 'https://docs.google.com/forms/d/e/1FAIpQLScrFbWMR_3vEmHDdhqRqQQJKPVx3OC2XuqUIbwPFIxu57FDFA/formResponse',
  entryField: 'entry.1918645085',
};

export function isGoogleFormConfigured() {
  return Boolean(GOOGLE_FORM.actionUrl && GOOGLE_FORM.entryField);
}
