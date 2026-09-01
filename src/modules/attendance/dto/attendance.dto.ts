import { IsNotEmpty, IsArray, IsString, IsOptional, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class StudentAttendanceItemDto {
  @ApiProperty()
  @IsNumber()
  student_id: number;

  @ApiProperty({ enum: ['present', 'absent', 'late', 'half_day'] })
  @IsEnum(['present', 'absent', 'late', 'half_day'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MarkStudentAttendanceDto {
  @ApiProperty()
  @IsNumber()
  class_id: number;

  @ApiProperty()
  @IsNumber()
  section_id: number;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ type: [StudentAttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StudentAttendanceItemDto)
  attendance: StudentAttendanceItemDto[];
}

export class StaffAttendanceItemDto {
  @ApiProperty()
  @IsNumber()
  user_id: number;

  @ApiProperty({ enum: ['present', 'absent', 'leave', 'half_day', 'late'] })
  @IsEnum(['present', 'absent', 'leave', 'half_day', 'late'])
  status: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  check_in_time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  check_out_time?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class MarkStaffAttendanceDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @IsNotEmpty()
  @IsString()
  date: string;

  @ApiProperty({ type: [StaffAttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StaffAttendanceItemDto)
  attendance: StaffAttendanceItemDto[];
}

export class GetAttendanceDto {
  @ApiProperty()
  @IsNumber()
  class_id: number;

  @ApiProperty()
  @IsNumber()
  section_id: number;

  @ApiProperty()
  @IsString()
  date: string;
}

export class AttendanceReportDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  class_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  section_id?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  student_id?: number;

  @ApiProperty()
  @IsString()
  from_date: string;

  @ApiProperty()
  @IsString()
  to_date: string;
}
