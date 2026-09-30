import { Injectable, Inject } from '@nestjs/common';
import {
  StorageAdapter,
  STORAGE_ADAPTER,
  StoragePutInput,
  StorageGetOutput,
} from './storage.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_ADAPTER) private readonly adapter: StorageAdapter,
  ) {}

  async put(input: StoragePutInput): Promise<void> {
    return this.adapter.put(input);
  }

  async get(key: string): Promise<StorageGetOutput> {
    return this.adapter.get(key);
  }

  async delete(key: string): Promise<void> {
    return this.adapter.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.adapter.exists(key);
  }
}
