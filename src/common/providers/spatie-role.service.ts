import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * The API shares its MySQL database with the Laravel admin panel
 * (school-erp-admin), which uses spatie/laravel-permission for role
 * storage (`roles` + `model_has_roles`, morph type `App\Models\User`).
 * The API's own auth flow (see AuthService.login/getProfile) resolves a
 * user's `role` claim by reading those same tables, so any user created
 * here (student, teacher, etc.) must get a matching model_has_roles row
 * or they'll silently fall back to the 'student' role at login.
 */
@Injectable()
export class SpatieRoleService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async assignRole(userId: number, roleName: string): Promise<void> {
    const roleRows = await this.dataSource.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [roleName]);
    if (!roleRows || roleRows.length === 0) return;

    const roleId = roleRows[0].id;
    await this.dataSource.query(
      'INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?, ?, ?)',
      [roleId, 'App\\Models\\User', userId],
    );
  }
}
