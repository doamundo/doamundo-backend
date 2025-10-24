import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';

PouchDB.plugin(PouchDBFind);

interface User {
    _id: string;
    _rev?: string;
    collection: string;
    email: string;
    document: string;
    name: string;
    birthDate?: string;
    documentType: 'CPF' | 'CNPJ';
    companyType?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION';
    personType?: 'FISICA';
    role: string;
    password: string; // In a real app, this would be hashed
    phone?: string;
    url?: string;
    createdAt?: string;
    partnerId?: string; // ID of the partner who created this user (for clients)
    credits?: number;
    address_data?: {
        street: string;
        number: string;
        complement?: string;
        neighborhood: string;
        city: string;
        state: string;
        zipcode: string;
        country: string;
    };
    payment_data?: {
        planId?: string;
        card_number?: string;
        card_holder_name?: string;
        expiration_date?: string;
        cvv?: string;
        gateway_user_data?: any;
        gateway_card_data?: any;
        gateway_plan_data?: any;
        gateway_subaccount_data?: {
            "id": string;
            "personType"?: 'FISICA';
            "companyType"?: 'MEI' | 'LIMITED' | 'INDIVIDUAL' | 'ASSOCIATION';
            "city": number;
            "state": string;
            "country": string;
            "site": null;
            "walletId": string;
            "apiKey": string;
            "accountNumber": {
                "agency": string;
                "account": string;
                "accountDigit": string;
            },
            "incomeValue": number;
        };
    };
    personalization_data?: {
        primary_color: string;
        secondary_color: string;
        page_title: string;
        page_subtitle: string;
        page_description: string;
        image_url: string;
        social_media: {
            facebook?: string;
            instagram?: string;
            twitter?: string;
            linkedin?: string;
            youtube?: string;
        };
        contact_info: {
            email?: string;
            whatsapp?: string;
            location?: string;
        };
    };
}

class UserDB {
    private collection = 'user';
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

    async addUser(User: User): Promise<PouchDB.Core.Response> {
        User.collection = this.collection;
        return this.db.post(User);
    }

    async getUser(id: string): Promise<PouchDB.Core.Document<User>> {
        return this.db.get(id);
    }

    async updateUser(User: User): Promise<PouchDB.Core.Response> {
        if (!User._id || !User._rev) {
            throw new Error('User must have an _id and _rev to be updated');
        }
        return this.db.put(User);
    }

    async deleteUser(id: string, rev: string): Promise<PouchDB.Core.Response> {
        return this.db.remove(id, rev);
    }

    async getAllUsers(): Promise<any> {
        return this.db.find({
            selector: {
                collection: 'user'
            }
        }) as any;
    }

    async deleteAllNonAdminUsers(): Promise<void> {
        const result = await this.db.find({
            selector: {
                collection: 'user',
                role: { $ne: 'admin' }
            }
        });

        const deletePromises = (result.docs as User[]).map((user: User) => {
            return this.db.remove(user._id, user._rev!);
        });

        await Promise.all(deletePromises);
    }
}

export { User, UserDB };