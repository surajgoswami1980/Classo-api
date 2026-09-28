import { SetMetadata } from '@nestjs/common';

/**
 * Permission-based access control.
 * Permissions are stored per sub_admin/staff user in the DB.
 * Format: module.action (e.g., 'attendance.mark', 'fee.collect', 'student.create')
 */
export enum Permission {
  // Student
  STUDENT_VIEW = 'student.view',
  STUDENT_CREATE = 'student.create',
  STUDENT_UPDATE = 'student.update',
  STUDENT_DELETE = 'student.delete',
  STUDENT_IMPORT = 'student.import',

  // Teacher
  TEACHER_VIEW = 'teacher.view',
  TEACHER_CREATE = 'teacher.create',
  TEACHER_UPDATE = 'teacher.update',
  TEACHER_DELETE = 'teacher.delete',

  // Attendance
  ATTENDANCE_VIEW = 'attendance.view',
  ATTENDANCE_MARK = 'attendance.mark',
  ATTENDANCE_REPORT = 'attendance.report',
  ATTENDANCE_STAFF_MARK = 'attendance.staff_mark',

  // Fee
  FEE_VIEW = 'fee.view',
  FEE_CREATE = 'fee.create',
  FEE_COLLECT = 'fee.collect',
  FEE_REPORT = 'fee.report',
  FEE_REFUND = 'fee.refund',

  // Exam
  EXAM_VIEW = 'exam.view',
  EXAM_CREATE = 'exam.create',
  EXAM_MARKS_ENTRY = 'exam.marks_entry',
  EXAM_PUBLISH = 'exam.publish',
  EXAM_REPORT = 'exam.report',

  // Timetable
  TIMETABLE_VIEW = 'timetable.view',
  TIMETABLE_MANAGE = 'timetable.manage',

  // Assignment
  ASSIGNMENT_VIEW = 'assignment.view',
  ASSIGNMENT_CREATE = 'assignment.create',
  ASSIGNMENT_GRADE = 'assignment.grade',

  // Notification
  NOTIFICATION_SEND = 'notification.send',
  NOTIFICATION_VIEW = 'notification.view',

  // Transport
  TRANSPORT_VIEW = 'transport.view',
  TRANSPORT_MANAGE = 'transport.manage',

  // Library
  LIBRARY_VIEW = 'library.view',
  LIBRARY_MANAGE = 'library.manage',
  LIBRARY_ISSUE = 'library.issue',

  // Event
  EVENT_VIEW = 'event.view',
  EVENT_MANAGE = 'event.manage',

  // Hostel
  HOSTEL_VIEW = 'hostel.view',
  HOSTEL_MANAGE = 'hostel.manage',

  // Inventory
  INVENTORY_VIEW = 'inventory.view',
  INVENTORY_MANAGE = 'inventory.manage',

  // Payroll
  PAYROLL_VIEW = 'payroll.view',
  PAYROLL_MANAGE = 'payroll.manage',

  // Settings
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_MANAGE = 'settings.manage',

  // Reports
  REPORT_VIEW = 'report.view',
  REPORT_DOWNLOAD = 'report.download',
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
