import { Router } from 'express';
import authRouter from './auth.routes.js';
import employeeRouter from './employee.routes.js';
import contactRouter from './contact.routes.js';
import accessControlRouter from './accessControl.routes.js';
import moduleRouter from './module.routes.js';
import leadRouter from './lead.routes.js';
import taskRouter from './task.routes.js';
import crmRouter from './crm.routes.js';

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

