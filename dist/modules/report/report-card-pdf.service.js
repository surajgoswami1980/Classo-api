"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportCardPdfService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ReportCardPdfService = class ReportCardPdfService {
    constructor(configService) {
        this.configService = configService;
    }
    generateReportCardHtml(data) {
        const { student, exam, subjects, summary, school } = data;
        const subjectRows = subjects.map((s, i) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 12px; font-size: 13px; color: #374151;">${i + 1}</td>
        <td style="padding: 10px 12px; font-size: 13px; color: #374151; font-weight: 500;">${s.subject_name}</td>
        <td style="padding: 10px 12px; font-size: 13px; color: #6b7280; text-align: center;">${s.max_marks}</td>
        <td style="padding: 10px 12px; font-size: 13px; color: #374151; text-align: center; font-weight: 600;">${s.marks_obtained ?? '-'}</td>
        <td style="padding: 10px 12px; font-size: 13px; text-align: center;">
          <span style="padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; ${this.getGradeStyle(s.grade)}">${s.grade}</span>
        </td>
        <td style="padding: 10px 12px; font-size: 13px; text-align: center;">
          ${s.passed ? '<span style="color: #059669;">✓</span>' : '<span style="color: #dc2626;">✗</span>'}
        </td>
      </tr>
    `).join('');
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; }
    @page { size: A4; margin: 15mm; }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">

    <!-- Header with School Info -->
    <div style="text-align: center; border-bottom: 3px solid ${school.primary_color || '#2563eb'}; padding-bottom: 20px; margin-bottom: 20px;">
      ${school.logo_url ? `<img src="${school.logo_url}" style="height: 60px; margin-bottom: 8px;" />` : ''}
      <h1 style="font-size: 22px; color: ${school.primary_color || '#2563eb'}; margin-bottom: 4px;">${school.name}</h1>
      <p style="font-size: 12px; color: #6b7280;">${school.address || ''}</p>
      <p style="font-size: 11px; color: #9ca3af; margin-top: 4px;">Affiliated to ${school.board_affiliation || 'CBSE'}</p>
    </div>

    <!-- Report Card Title -->
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="font-size: 18px; color: #1f2937; letter-spacing: 1px;">REPORT CARD</h2>
      <p style="font-size: 14px; color: #4b5563; margin-top: 4px;">${exam.name} (${this.formatExamType(exam.exam_type)})</p>
    </div>

    <!-- Student Details -->
    <div style="display: flex; justify-content: space-between; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <div>
        <table style="border-collapse: collapse;">
          <tr><td style="padding: 4px 12px 4px 0; font-size: 12px; color: #6b7280;">Student Name</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${student.name}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-size: 12px; color: #6b7280;">Admission No.</td><td style="padding: 4px 0; font-size: 13px;">${student.admission_number || '-'}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-size: 12px; color: #6b7280;">Roll Number</td><td style="padding: 4px 0; font-size: 13px;">${student.roll_number || '-'}</td></tr>
        </table>
      </div>
      <div>
        <table style="border-collapse: collapse;">
          <tr><td style="padding: 4px 12px 4px 0; font-size: 12px; color: #6b7280;">Class</td><td style="padding: 4px 0; font-size: 13px; font-weight: 600;">${student.class_name || ''} - ${student.section_name || ''}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-size: 12px; color: #6b7280;">Session</td><td style="padding: 4px 0; font-size: 13px;">${exam.session_name || ''}</td></tr>
          <tr><td style="padding: 4px 12px 4px 0; font-size: 12px; color: #6b7280;">Date</td><td style="padding: 4px 0; font-size: 13px;">${new Date().toLocaleDateString('en-IN')}</td></tr>
        </table>
      </div>
    </div>

    <!-- Marks Table -->
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
      <thead>
        <tr style="background: ${school.primary_color || '#2563eb'};">
          <th style="padding: 12px; font-size: 12px; color: #fff; text-align: left; font-weight: 600;">#</th>
          <th style="padding: 12px; font-size: 12px; color: #fff; text-align: left; font-weight: 600;">Subject</th>
          <th style="padding: 12px; font-size: 12px; color: #fff; text-align: center; font-weight: 600;">Max Marks</th>
          <th style="padding: 12px; font-size: 12px; color: #fff; text-align: center; font-weight: 600;">Obtained</th>
          <th style="padding: 12px; font-size: 12px; color: #fff; text-align: center; font-weight: 600;">Grade</th>
          <th style="padding: 12px; font-size: 12px; color: #fff; text-align: center; font-weight: 600;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${subjectRows}
        <!-- Total Row -->
        <tr style="background: #f3f4f6; border-top: 2px solid ${school.primary_color || '#2563eb'};">
          <td colspan="2" style="padding: 12px; font-size: 13px; font-weight: 700; color: #1f2937;">TOTAL</td>
          <td style="padding: 12px; font-size: 13px; font-weight: 600; text-align: center; color: #374151;">${summary.total_max_marks}</td>
          <td style="padding: 12px; font-size: 13px; font-weight: 700; text-align: center; color: #1f2937;">${summary.total_marks_obtained}</td>
          <td style="padding: 12px; font-size: 13px; font-weight: 700; text-align: center;">
            <span style="padding: 2px 10px; border-radius: 4px; ${this.getGradeStyle(summary.overall_grade)}">${summary.overall_grade}</span>
          </td>
          <td style="padding: 12px; font-size: 13px; font-weight: 700; text-align: center; color: ${summary.result === 'PASS' ? '#059669' : '#dc2626'};">
            ${summary.result}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Summary Stats -->
    <div style="display: flex; gap: 16px; margin-bottom: 30px;">
      <div style="flex: 1; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Percentage</p>
        <p style="font-size: 24px; font-weight: 700; color: #1d4ed8; margin-top: 4px;">${summary.percentage}%</p>
      </div>
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Class Rank</p>
        <p style="font-size: 24px; font-weight: 700; color: #059669; margin-top: 4px;">${summary.rank || '-'}</p>
      </div>
      <div style="flex: 1; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Class Average</p>
        <p style="font-size: 24px; font-weight: 700; color: #7c3aed; margin-top: 4px;">${summary.class_average}%</p>
      </div>
    </div>

    <!-- Grading Scale Reference -->
    <div style="margin-bottom: 30px;">
      <p style="font-size: 11px; color: #6b7280; margin-bottom: 6px; font-weight: 600;">Grading Scale:</p>
      <p style="font-size: 10px; color: #9ca3af;">
        A+ (91-100) | A (81-90) | B+ (71-80) | B (61-70) | C+ (51-60) | C (41-50) | D (33-40) | F (Below 33)
      </p>
    </div>

    <!-- Signatures -->
    <div style="display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px;">
      <div style="text-align: center;">
        <div style="width: 150px; border-top: 1px solid #d1d5db; padding-top: 8px;">
          <p style="font-size: 11px; color: #6b7280;">Class Teacher</p>
        </div>
      </div>
      <div style="text-align: center;">
        <div style="width: 150px; border-top: 1px solid #d1d5db; padding-top: 8px;">
          <p style="font-size: 11px; color: #6b7280;">Exam Controller</p>
        </div>
      </div>
      <div style="text-align: center;">
        <div style="width: 150px; border-top: 1px solid #d1d5db; padding-top: 8px;">
          <p style="font-size: 11px; color: #6b7280;">Principal</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 30px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
      <p style="font-size: 10px; color: #9ca3af;">This is a computer-generated document. No signature is required.</p>
      <p style="font-size: 10px; color: #9ca3af; margin-top: 2px;">Generated on ${new Date().toLocaleString('en-IN')}</p>
    </div>
  </div>
</body>
</html>`;
    }
    getGradeStyle(grade) {
        switch (grade) {
            case 'A+': return 'background: #dcfce7; color: #166534;';
            case 'A': return 'background: #d1fae5; color: #065f46;';
            case 'B+': return 'background: #dbeafe; color: #1e40af;';
            case 'B': return 'background: #e0e7ff; color: #3730a3;';
            case 'C+': return 'background: #fef9c3; color: #854d0e;';
            case 'C': return 'background: #fef3c7; color: #92400e;';
            case 'D': return 'background: #fed7aa; color: #9a3412;';
            case 'F': return 'background: #fecaca; color: #991b1b;';
            default: return 'background: #f3f4f6; color: #6b7280;';
        }
    }
    formatExamType(type) {
        const map = {
            unit_test: 'Unit Test',
            mid_term: 'Mid-Term Examination',
            final: 'Final Examination',
            quarterly: 'Quarterly Examination',
            half_yearly: 'Half-Yearly Examination',
        };
        return map[type] || type;
    }
};
exports.ReportCardPdfService = ReportCardPdfService;
exports.ReportCardPdfService = ReportCardPdfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ReportCardPdfService);
//# sourceMappingURL=report-card-pdf.service.js.map