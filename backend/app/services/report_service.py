"""
PDF Report Generation Service using ReportLab
Generates: Student Report Cards, Department Analytics, Risk Reports
"""
import io
from datetime import datetime
from typing import Dict, List, Any, Optional

try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch, cm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False

# Color palette
NAVY    = colors.HexColor('#0a1628')
BLUE    = colors.HexColor('#1e3a5f')
ACCENT  = colors.HexColor('#3b82f6')
GREEN   = colors.HexColor('#10b981')
YELLOW  = colors.HexColor('#f59e0b')
RED     = colors.HexColor('#ef4444')
GRAY    = colors.HexColor('#94a3b8')
LGRAY   = colors.HexColor('#f1f5f9')
WHITE   = colors.white
BLACK   = colors.black

RISK_COLORS = {
    'low': GREEN, 'medium': YELLOW, 'high': RED,
    'critical': colors.HexColor('#7c3aed')
}

def generate_student_report_card(student_data: Dict, transcript: Dict, prediction: Optional[Dict] = None) -> bytes:
    """Generate a professional PDF student report card"""
    if not REPORTLAB_AVAILABLE:
        return _generate_fallback_report(student_data)
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = getSampleStyleSheet()
    story = []

    # ─── HEADER ────────────────────────────────────────────────
    header_style = ParagraphStyle('Header', parent=styles['Normal'],
        fontSize=22, textColor=WHITE, alignment=TA_CENTER, fontName='Helvetica-Bold')
    sub_style = ParagraphStyle('Sub', parent=styles['Normal'],
        fontSize=11, textColor=colors.HexColor('#bfdbfe'), alignment=TA_CENTER)

    header_table = Table([[
        Paragraph("🎓 SMART ACADEMIC PERFORMANCE FORECASTING SYSTEM", header_style),
        Paragraph("STUDENT ACADEMIC REPORT CARD", sub_style),
    ]], colWidths=[doc.width])
    header_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), NAVY),
        ('PADDING', (0,0), (-1,-1), 18),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [NAVY]),
        ('SPAN', (0,0), (-1,0)),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.4*cm))

    # ─── STUDENT INFO ───────────────────────────────────────────
    risk = student_data.get('risk_level', 'low')
    risk_color = RISK_COLORS.get(risk, GREEN)
    
    info_data = [
        ['Student Name', f"{student_data.get('first_name','')} {student_data.get('last_name','')}",
         'Student ID', student_data.get('student_id', 'N/A')],
        ['Department', student_data.get('department', 'N/A'),
         'Batch Year', str(student_data.get('batch_year', ''))],
        ['Current Semester', f"Semester {student_data.get('current_semester', '')}",
         'CGPA', f"{float(student_data.get('cgpa', 0)):.2f} / 10.00"],
        ['Risk Level', risk.upper(), 'Generated', datetime.now().strftime('%d %b %Y')],
    ]
    
    info_table = Table(info_data, colWidths=[3.5*cm, 7*cm, 3.5*cm, 4.5*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica'),
        ('FONTSIZE', (0,0), (-1,-1), 10),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,0), (0,-1), BLUE),
        ('TEXTCOLOR', (2,0), (2,-1), BLUE),
        ('BACKGROUND', (0,0), (-1,-1), LGRAY),
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#dbeafe')),
        ('BACKGROUND', (2,0), (2,-1), colors.HexColor('#dbeafe')),
        ('ROWBACKGROUNDS', (0,0), (-1,-1), [LGRAY, WHITE]),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TEXTCOLOR', (1,3), (1,3), risk_color),
        ('FONTNAME', (1,3), (1,3), 'Helvetica-Bold'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.5*cm))

    # ─── SEMESTER ACADEMIC RECORDS ──────────────────────────────
    title_style = ParagraphStyle('Title', parent=styles['Normal'],
        fontSize=13, textColor=NAVY, fontName='Helvetica-Bold',
        spaceBefore=10, spaceAfter=6)
    story.append(Paragraph("📚 ACADEMIC PERFORMANCE RECORD", title_style))

    semesters = transcript.get('semesters', [])
    for sem_data in semesters:
        story.append(Paragraph(
            f"Semester {sem_data['semester']} — {sem_data.get('academic_year', '')} | "
            f"SGPA: {sem_data.get('sgpa', 0):.2f} | Credits: {sem_data.get('credits', 0)}",
            ParagraphStyle('SemTitle', parent=styles['Normal'],
                fontSize=10, textColor=WHITE, fontName='Helvetica-Bold',
                backColor=BLUE, leftIndent=0, borderPad=6)
        ))
        
        courses = sem_data.get('courses', [])
        if courses:
            course_data = [['Course Code', 'Course Name', 'Internal', 'External', 'Total', 'Grade', 'GP', 'Status']]
            for c in courses:
                status = '✓ PASS' if c.get('passed') else '✗ FAIL'
                course_data.append([
                    c['course_code'], c['course_name'],
                    f"{c.get('internal', 0):.0f}", f"{c.get('external', 0):.0f}",
                    f"{c.get('total', 0):.0f}", c.get('grade', '-'),
                    f"{c.get('grade_points', 0):.1f}", status
                ])
            
            ct = Table(course_data, colWidths=[2.2*cm, 5.5*cm, 1.5*cm, 1.8*cm, 1.5*cm, 1.5*cm, 1.2*cm, 1.8*cm])
            ct.setStyle(TableStyle([
                ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                ('FONTSIZE', (0,0), (-1,-1), 8.5),
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0,0), (-1,0), WHITE),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [WHITE, LGRAY]),
                ('GRID', (0,0), (-1,-1), 0.3, colors.HexColor('#e2e8f0')),
                ('PADDING', (0,0), (-1,-1), 5),
                ('ALIGN', (2,0), (-1,-1), 'CENTER'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                # Color pass/fail
                *[('TEXTCOLOR', (7, i+1), (7, i+1), GREEN if courses[i].get('passed') else RED)
                  for i in range(len(courses))],
            ]))
            story.append(ct)
        story.append(Spacer(1, 0.3*cm))

    # ─── AI PREDICTION ──────────────────────────────────────────
    if prediction:
        story.append(Paragraph("🤖 AI PERFORMANCE PREDICTION (Next Semester)", title_style))
        pred_gpa = prediction.get('predicted_gpa', 0)
        pred_risk = prediction.get('predicted_risk_level', 'medium')
        conf = float(prediction.get('confidence_score', 0)) * 100
        
        pred_data = [
            ['Predicted GPA', f"{pred_gpa:.2f} / 10.00", 'Confidence', f"{conf:.1f}%"],
            ['Predicted Risk', pred_risk.upper(), 'Model', 'XGBoost+LSTM Hybrid'],
        ]
        pt = Table(pred_data, colWidths=[3.5*cm, 7*cm, 3.5*cm, 4.5*cm])
        pt.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 10),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#bfdbfe')),
            ('PADDING', (0,0), (-1,-1), 8),
            ('TEXTCOLOR', (0,0), (0,-1), ACCENT),
            ('TEXTCOLOR', (2,0), (2,-1), ACCENT),
            ('TEXTCOLOR', (1,1), (1,1), RISK_COLORS.get(pred_risk, YELLOW)),
            ('FONTNAME', (1,1), (1,1), 'Helvetica-Bold'),
        ]))
        story.append(pt)
        
        recs = prediction.get('recommendations', {})
        all_recs = []
        for key in ['priority', 'study_tips', 'attendance', 'assignments']:
            all_recs.extend(recs.get(key, []))
        
        if all_recs:
            story.append(Spacer(1, 0.3*cm))
            story.append(Paragraph("💡 Personalized Recommendations:", 
                ParagraphStyle('RecTitle', parent=styles['Normal'], fontSize=10,
                    fontName='Helvetica-Bold', textColor=BLUE)))
            for rec in all_recs[:6]:
                clean = rec.replace('⚠️','').replace('🚨','').replace('📚','').replace('📖','').strip()
                story.append(Paragraph(f"• {clean}",
                    ParagraphStyle('Rec', parent=styles['Normal'], fontSize=9,
                        textColor=colors.HexColor('#374151'), leftIndent=20, spaceBefore=2)))

    # ─── FOOTER ─────────────────────────────────────────────────
    story.append(Spacer(1, 0.8*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
    story.append(Paragraph(
        f"Generated by SAPFS v1.0 | {datetime.now().strftime('%d %B %Y %H:%M')} | "
        "Smart Academic Performance Forecasting System — Confidential Document",
        ParagraphStyle('Footer', parent=styles['Normal'],
            fontSize=8, textColor=GRAY, alignment=TA_CENTER, spaceBefore=6)
    ))

    doc.build(story)
    return buffer.getvalue()

def _generate_fallback_report(student_data: Dict) -> bytes:
    """Simple text fallback when ReportLab not available"""
    content = f"""STUDENT REPORT CARD
==================
Name: {student_data.get('first_name','')} {student_data.get('last_name','')}
ID: {student_data.get('student_id','')}
CGPA: {student_data.get('cgpa',0):.2f}
Risk Level: {student_data.get('risk_level','').upper()}
Generated: {datetime.now().strftime('%d %b %Y')}
"""
    return content.encode('utf-8')


def generate_department_report(dept_data: Dict, students: List[Dict]) -> bytes:
    """Generate department analytics PDF report"""
    if not REPORTLAB_AVAILABLE:
        return b"ReportLab not available"
    
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=1.5*cm, leftMargin=1.5*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []
    
    title_style = ParagraphStyle('Title', fontSize=20, fontName='Helvetica-Bold',
                                  textColor=NAVY, alignment=TA_CENTER)
    story.append(Paragraph(f"Department Analytics Report", title_style))
    story.append(Paragraph(f"{dept_data.get('name', 'Department')} — {datetime.now().strftime('%B %Y')}",
        ParagraphStyle('Sub', fontSize=12, textColor=GRAY, alignment=TA_CENTER)))
    story.append(Spacer(1, 0.5*cm))
    
    # Summary stats
    total = len(students)
    if total:
        avg_cgpa = sum(float(s.get('cgpa', 0)) for s in students) / total
        risk_counts = {}
        for s in students:
            r = s.get('risk_level', 'low')
            risk_counts[r] = risk_counts.get(r, 0) + 1
        
        stats_data = [
            ['Total Students', str(total), 'Average CGPA', f"{avg_cgpa:.2f}"],
            ['Low Risk', str(risk_counts.get('low', 0)),
             'High Risk', str(risk_counts.get('high', 0) + risk_counts.get('critical', 0))],
        ]
        st = Table(stats_data, colWidths=[3.5*cm, 4*cm, 3.5*cm, 4*cm])
        st.setStyle(TableStyle([
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 11),
            ('BACKGROUND', (0,0), (-1,-1), LGRAY),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(st)
    
    doc.build(story)
    return buffer.getvalue()
