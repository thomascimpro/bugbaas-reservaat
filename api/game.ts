export const config = { maxDuration: 30 };
// Built before Vercel traces the function; includes the unchanged Three.js replay maths.
export default require('../server/cloudRuntime.cjs').default;
