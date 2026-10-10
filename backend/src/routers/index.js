import { Router } from 'express';
import authRouter from './auth.router.js';
import employeeRouter from './employee.router.js';
import contactRouter from './contact.router.js';
import accessControlRouter from './accessControl.router.js';
import moduleRouter from './module.router.js';
import leadRouter from './lead.router.js';
import taskRouter from './task.router.js';
import crmRouter from './crm.router.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/employees', employeeRouter);
apiRouter.use('/contacts', contactRouter);
apiRouter.use('/access-control', accessControlRouter);
apiRouter.use('/modules', moduleRouter);
apiRouter.use('/leads', leadRouter);
apiRouter.use('/tasks', taskRouter);
apiRouter.use('/', crmRouter);

export default apiRouter;
export {
  authRouter,
  employeeRouter,
  contactRouter,
  accessControlRouter,
  moduleRouter,
  leadRouter,
  taskRouter,
  crmRouter,
};
