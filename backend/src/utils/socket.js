/**
 * Centralized Socket.IO Provider to avoid circular dependencies
 */
let ioInstance = null;

export function setIO(io) {
  ioInstance = io;
}

export function getIO() {
  return ioInstance;
}

export const io = new Proxy(
  {},
  {
    get(_target, prop) {
      if (!ioInstance) {
        // Return a no-op function if called before initialization
        return () => {};
      }
      const val = ioInstance[prop];
      if (typeof val === 'function') {
        return val.bind(ioInstance);
      }
      return val;
    },
  }
);

export default {
  setIO,
  getIO,
  io,
};
