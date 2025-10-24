import { Request, Response } from 'express';
import { PurchaseDB } from '../models/purchaseModel';

class PurchaseController {
    static async getAllPurchases(req: Request, res: Response) {
        try {
            const purchaseDB = new PurchaseDB();
            const purchases = await purchaseDB.getAllPurchases();
            res.status(200).json(purchases);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching purchases', error });
        }
    }

    static async getPurchaseById(req: Request, res: Response) {
        try {
            const purchaseDB = new PurchaseDB();
            const purchase = await purchaseDB.getPurchase(req.params.id);
            if (!purchase) {
                return res.status(404).json({ message: 'Purchase not found' });
            }
            res.status(200).json(purchase);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching purchase', error });
        }
    }

    static async createPurchase(req: Request, res: Response) {
        try {
            const purchaseDB = new PurchaseDB();
            const savedPurchase = purchaseDB.addPurchase(req.body);
            res.status(201).json(savedPurchase);
        } catch (error) {
            res.status(500).json({ message: 'Error creating purchase', error });
        }
    }

    static async updatePurchase(req: Request, res: Response) {
        try {
            const purchaseDB = new PurchaseDB();
            const updatedPurchase = await purchaseDB.updatePurchase(req.body);
            if (!updatedPurchase) {
                return res.status(404).json({ message: 'Purchase not found' });
            }
            res.status(200).json(updatedPurchase);
        } catch (error) {
            res.status(500).json({ message: 'Error updating purchase', error });
        }
    }

    static async deletePurchase(req: Request, res: Response) {
        try {
            const purchaseDB = new PurchaseDB();
            const deletedPurchase = await purchaseDB.deletePurchase(req.params.id, req.params.revision);
            if (!deletedPurchase) {
                return res.status(404).json({ message: 'Purchase not found' });
            }
            res.status(200).json({ message: 'Purchase deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting purchase', error });
        }
    }
}

export default PurchaseController;
