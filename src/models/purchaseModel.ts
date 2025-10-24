import PouchDB from 'pouchdb';

interface Purchase {
    _id?: string;
    _rev?: string;
    collection: string;
    description: string;
    quantity: number;
    price: number;
    date: Date;
}

class PurchaseDB {
    private collection = 'purchases';
    private db: PouchDB.Database<Purchase>;

    constructor() {
        this.db = new PouchDB<Purchase>(this.collection);
    }

    async addPurchase(purchase: Purchase): Promise<PouchDB.Core.Response> {
        purchase.collection = this.collection;
        return this.db.post(purchase);
    }

    async getPurchase(id: string): Promise<PouchDB.Core.Document<Purchase>> {
        return this.db.get(id);
    }

    async updatePurchase(purchase: Purchase): Promise<PouchDB.Core.Response> {
        if (!purchase._id || !purchase._rev) {
            throw new Error('Purchase must have an _id and _rev to be updated');
        }
        return this.db.put(purchase);
    }

    async deletePurchase(id: string, rev: string): Promise<PouchDB.Core.Response> {
        return this.db.remove(id, rev);
    }

    async getAllPurchases(): Promise<PouchDB.Core.AllDocsResponse<Purchase>> {
        return this.db.allDocs({ include_docs: true });
    }
}

export { Purchase, PurchaseDB };