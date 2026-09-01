import { DataSource } from 'typeorm';
export declare class SpatieRoleService {
    private dataSource;
    constructor(dataSource: DataSource);
    assignRole(userId: number, roleName: string): Promise<void>;
}
