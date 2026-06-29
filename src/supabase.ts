import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = getAuth();
  let errorMessage = '';
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (error && typeof error === 'object') {
    try {
      errorMessage = (error as any).message || (error as any).code || JSON.stringify(error);
    } catch (e) {
      errorMessage = String(error);
    }
  } else {
    errorMessage = String(error);
  }
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function cleanUndefined(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        res[key] = cleanUndefined(val);
      }
    }
    return res;
  }
  return obj;
}

class FirestoreQueryBuilder {
  private colName: string;
  private filters: Array<{ field: string; op: string; value: any }> = [];
  private limitCount: number | null = null;
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private countMode: boolean = false;

  private updateData: any = null;
  private isDelete: boolean = false;
  private insertData: any[] | null = null;
  private upsertData: any = null;

  constructor(colName: string) {
    this.colName = colName;
  }

  select(columns?: string, options?: any) {
    if (options && (options.count === 'exact' || options.count)) {
      this.countMode = true;
    }
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: '==', value });
    return this;
  }

  ilike(field: string, value: any) {
    this.filters.push({ field, op: 'ilike', value });
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  insert(dataArray: any[]) {
    this.insertData = cleanUndefined(dataArray);
    return this;
  }

  update(updateData: any) {
    this.updateData = cleanUndefined(updateData);
    return this;
  }

  upsert(data: any) {
    this.upsertData = cleanUndefined(data);
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      let res: any;
      const stored = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
      const currentUser = stored ? JSON.parse(stored) : null;

      if (this.insertData) {
        for (const item of this.insertData) {
          const id = item.id || item.uuid || doc(collection(db, this.colName)).id;
          const cleanItem = { ...item };
          if (!cleanItem.id) cleanItem.id = id;
          if (currentUser && currentUser.tenantId && !cleanItem.tenantId && this.colName !== 'tenants') {
            cleanItem.tenantId = currentUser.tenantId;
          }
          await setDoc(doc(db, this.colName, id), cleanItem);
        }
        res = { data: this.insertData, error: null };
      }
      else if (this.upsertData) {
        const item = Array.isArray(this.upsertData) ? this.upsertData[0] : this.upsertData;
        const id = item.id;
        if (!id) {
          throw new Error("Upsert operation requires an 'id' field");
        }
        const cleanItem = { ...item };
        if (currentUser && currentUser.tenantId && !cleanItem.tenantId && this.colName !== 'tenants') {
          cleanItem.tenantId = currentUser.tenantId;
        }
        await setDoc(doc(db, this.colName, id), cleanItem, { merge: true });
        res = { data: cleanItem, error: null };
      }
      else if (this.updateData) {
        const docsToUpdate = await this.executeGet();
        for (const d of docsToUpdate) {
          await updateDoc(doc(db, this.colName, d.id), this.updateData);
        }
        res = { data: docsToUpdate, error: null };
      }
      else if (this.isDelete) {
        const docsToDelete = await this.executeGet();
        for (const d of docsToDelete) {
          await deleteDoc(doc(db, this.colName, d.id));
        }
        res = { data: docsToDelete, error: null };
      }
      else {
        if (this.countMode) {
          const docs = await this.executeGet();
          res = { count: docs.length, data: docs, error: null };
        } else {
          const docs = await this.executeGet();
          let resultData: any = docs;

          if (this.isSingle || this.isMaybeSingle) {
            resultData = docs.length > 0 ? docs[0] : null;
            if (this.isSingle && !resultData) {
              throw { message: "Document not found", code: "PGRST116" };
            }
          }
          res = { data: resultData, error: null };
        }
      }

      return onfulfilled ? onfulfilled(res) : res;
    } catch (error: any) {
      console.error(`Error executing Firestore operation on ${this.colName}:`, error);
      
      let opType = OperationType.GET;
      if (this.insertData) opType = OperationType.CREATE;
      else if (this.upsertData) opType = OperationType.WRITE;
      else if (this.updateData) opType = OperationType.UPDATE;
      else if (this.isDelete) opType = OperationType.DELETE;
      else if (this.countMode) opType = OperationType.LIST;

      try {
        handleFirestoreError(error, opType, this.colName);
      } catch (formattedErr: any) {
        const res = { data: null, error: formattedErr };
        if (onrejected) {
          return onrejected(formattedErr);
        }
        return onfulfilled ? onfulfilled(res) : res;
      }
    }
  }

  private async executeGet(): Promise<any[]> {
    const colRef = collection(db, this.colName);
    const stored = typeof window !== 'undefined' ? localStorage.getItem('currentUser') : null;
    const currentUser = stored ? JSON.parse(stored) : null;
    
    // Optimizador para busca direta por ID
    const idFilter = this.filters.find(f => f.field === 'id' && f.op === '==');
    if (idFilter) {
      const docSnap = await getDoc(doc(db, this.colName, idFilter.value));
      if (docSnap.exists()) {
        const item = { id: docSnap.id, ...docSnap.data() };
        
        // Apply tenant-level filter on single fetches if the collection is scoped
        if (currentUser && currentUser.tenantId && this.colName !== 'tenants' && currentUser.role !== 'admin') {
          if ((item as any).tenantId && (item as any).tenantId !== currentUser.tenantId) {
            return [];
          }
        }

        const match = this.matchFilters(item, this.filters.filter(f => f !== idFilter));
        return match ? [item] : [];
      }
      return [];
    }

    const querySnapshot = await getDocs(colRef);
    const items: any[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });

    let filtered = items.filter(item => this.matchFilters(item, this.filters));

    // Multi-tenant and role-based SaaS scoping logic
    if (currentUser && this.colName !== 'tenants' && currentUser.role !== 'admin') {
      filtered = filtered.filter(item => {
        // 1. Tenant separation
        if (currentUser.tenantId && item.tenantId && item.tenantId !== currentUser.tenantId) {
          return false;
        }

        // 2. Role hierarchies (Supervisor sees everything inside their tenant)
        if (currentUser.role === 'supervisor') {
          return true;
        }

        // 3. Gerente (Manager) - sees only their store inside their tenant
        if (currentUser.role === 'gerente') {
          if (this.colName === 'users') {
            return item.store === currentUser.store || item.id === currentUser.id;
          }
          if (['sales', 'customers', 'opportunities'].includes(this.colName)) {
            return item.store === currentUser.store;
          }
        }

        // 4. Vendedor (Seller) - sees only their own data
        if (currentUser.role === 'vendedor') {
          if (this.colName === 'users') {
            return item.id === currentUser.id;
          }
          if (['sales', 'customers', 'opportunities'].includes(this.colName)) {
            return item.vendedorId === currentUser.id || item.vendedor_id === currentUser.id || item.vendedorid === currentUser.id;
          }
        }

        return true;
      });
    }

    if (this.limitCount !== null) {
      filtered = filtered.slice(0, this.limitCount);
    }

    return filtered;
  }

  private matchFilters(item: any, filters: any[]): boolean {
    for (const filter of filters) {
      const itemVal = item[filter.field];
      const targetVal = filter.value;

      if (filter.op === '==') {
        if (itemVal !== targetVal) return false;
      } else if (filter.op === 'ilike') {
        if (!itemVal || !targetVal) return false;
        if (!String(itemVal).toLowerCase().includes(String(targetVal).toLowerCase())) {
          return false;
        }
      }
    }
    return true;
  }
}

export const supabase = {
  from(collectionName: string) {
    return new FirestoreQueryBuilder(collectionName);
  }
};
