import { Router } from 'express';
import PurchaseController from '../controllers/purchaseController';

const purchaseRoutes = Router();

purchaseRoutes.get('/', PurchaseController.getAllPurchases);
purchaseRoutes.get('/:id', PurchaseController.getPurchaseById);
purchaseRoutes.post('/', PurchaseController.createPurchase);
purchaseRoutes.put('/:id', PurchaseController.updatePurchase);
purchaseRoutes.delete('/:id', PurchaseController.deletePurchase);

export default purchaseRoutes;
