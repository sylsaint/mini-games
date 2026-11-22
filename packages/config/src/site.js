/** Shared build and route contract. URL and storage compatibility must be deliberate. */
export const businessRoutes = ['', 'learning', 'learning/chinese', 'learning/math', 'learning/english', 'learning/science', 'learning/computing', 'learning/chinese/report', 'learning/chinese/practice', 'learning/math/report', 'learning/math/practice', 'learning/math/grade-four-fall', 'learning/math/lines-and-angles', 'travel/hunan', 'games/twenty-four', 'games/escape-mawangdui'];
export const legacyAliases = ['chinese', 'math'].flatMap(subject => ['report', 'practice'].map(page => ({from: `/learning/${subject}/${page}.html`, to: `/learning/${subject}/${page}/`})));
export const securityHeaders = {'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=()'};
export const maxPageBytes = 300000;
