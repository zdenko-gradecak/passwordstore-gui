import { app } from 'electron';

const getPath = () => {
  return app.getPath('userData');
};

export { getPath };
