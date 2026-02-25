export interface BaseRepository<T> {
  findAll?(): Promise<T[]>;
  save(entity: T): Promise<T>;
  update(id: number, entity: T): Promise<T>;
  delete(id: number): Promise<void>;
}
