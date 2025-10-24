import { Router } from 'express';
import { createUser, getUser, updateUser, deleteUser, getAllUsers, createUserAsaas, deleteAllNonAdminUsers, sendEmail, upload, uploadFile, getStatus } from '../controllers/userController';

const router = Router();

router.get('/status', getStatus);
router.post('/', createUser);
router.get('/:id', getUser);
router.put('/:id', updateUser);
router.put('/asaas/:id', createUserAsaas);
router.delete('/:id/:rev/:customerId', deleteUser);
router.get('/', getAllUsers);
router.delete('/special/users/non-admins', deleteAllNonAdminUsers);
router.post('/api/send-email', sendEmail);

export default router;
