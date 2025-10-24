import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

PouchDB.plugin(PouchDBFind);

interface Plan {
    _id: string;
    _rev?: string;
    collection: string;
    title: string;
    subtitle: string;
    price: number;
    features: string[];
    promotionDays: number;
    credits?: number;
    partnerId?: string; // ID of the partner who created this plan
    createdAt?: string;
    updatedAt?: string;
}

class PlanDB {
    private collection = 'plan';
    private db: PouchDB.Database;

    // URL do CouchDB (remoto via ngrok ou local)
    private remoteDbUrl = `https://couch.srv784276.hstgr.cloud/deal-value-local`; //`${process.env.COUCHDB_URL}/deal-value-local`

    // Configurações de autenticação (Basic Auth)
    private remoteDbOptions = {
        auth: {
            username: 'admin',
            password: 'deal-value',
        },
    };

    constructor() {
        this.db = new PouchDB(this.remoteDbUrl, this.remoteDbOptions);
        this.createIndexes();
    }

    private async createIndexes() {
        await this.db.createIndex({
            index: {
                fields: ['collection']
            }
        });
    }

    async addPlan(Plan: Plan): Promise<PouchDB.Core.Response> {
        Plan.collection = this.collection;
        return this.db.post(Plan);
    }

    async getPlan(id: string): Promise<PouchDB.Core.Document<Plan>> {
        return this.db.get(id);
    }

    async updatePlan(Plan: Plan): Promise<PouchDB.Core.Response> {
        if (!Plan._id || !Plan._rev) {
            throw new Error('Plan must have an _id and _rev to be updated');
        }
        return this.db.put(Plan);
    }

    async deletePlan(id: string, rev: string): Promise<PouchDB.Core.Response> {
        return this.db.remove(id, rev);
    }

    async getAllPlans(): Promise<any> {
        return this.db.find({
            selector: {
                collection: this.collection
            }
        }) as any;
    }
}

export { Plan, PlanDB };