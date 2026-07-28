export interface IUnitofWork{
    runInTransaction<T>(work:(tx:any)=> Promise<T>): Promise<T>
}