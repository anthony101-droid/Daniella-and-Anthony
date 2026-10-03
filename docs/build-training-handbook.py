"""Rebuild the public handbook from the application's canonical lesson data."""
from pathlib import Path
import json
from html import escape
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
root=Path(__file__).resolve().parents[1]
s=(root/'lib/platform.ts').read_text()
lessons=json.loads(s.split('export const modules:TrainingModule[]=')[1].split(';\nexport function gradeTraining')[0])
out=root/'public/training/phishaware-training-handbook.pdf'
styles={
 'title':ParagraphStyle('title',fontName='Helvetica-Bold',fontSize=30,leading=35,textColor=HexColor('#244b39'),spaceAfter=20),
 'heading':ParagraphStyle('heading',fontName='Helvetica-Bold',fontSize=20,leading=24,textColor=HexColor('#244b39'),spaceAfter=12),
 'sub':ParagraphStyle('sub',fontName='Helvetica-Bold',fontSize=11,leading=15,textColor=HexColor('#244b39'),spaceBefore=10,spaceAfter=5),
 'body':ParagraphStyle('body',fontName='Helvetica',fontSize=10,leading=14,textColor=HexColor('#35483c'),spaceAfter=6),
 'small':ParagraphStyle('small',fontName='Helvetica',fontSize=8,leading=11,textColor=HexColor('#536558'),spaceAfter=4),
}
def para(text,style='body'):return Paragraph(escape(text),styles[style])
def footer(c,d):
 c.saveState();c.setStrokeColor(HexColor('#d6dfd1'));c.line(42,40,A4[0]-42,40);c.setFillColor(HexColor('#536558'));c.setFont('Helvetica',8);c.drawString(42,27,'PhishAware | Employee awareness');c.drawRightString(A4[0]-42,27,str(d.page));c.restoreState()
story=[Spacer(1,70),para('PHISHAWARE / EMPLOYEE LEARNING','small'),para('Email safety\ntraining handbook','title'),para('Practical lessons for safer workplace decisions','heading'),para('Read the lessons, assess the practice examples, and keep the checklists beside your inbox. Complete the five-question knowledge checks inside the platform. A score of 80% or higher passes a lesson.'),Spacer(1,18),para('Your learning path','sub')]
for i,m in enumerate(lessons):story.append(para(f'{i+1:02d}. {m["title"]} - {m["minutes"]} minutes'))
story += [Spacer(1,20),para('Reporting at work','sub'),para('Follow your company procedures. For an urgent incident, contact your security team directly as well as reporting through PhishAware. Keep passwords, approval codes, and confidential attachments out of support messages.'),para('Edition: 3 October 2026. Original workplace scenarios. Official further-reading links appear under each lesson.','small')]
for i,m in enumerate(lessons):
 story += [PageBreak(),para(f'LESSON {i+1:02d} / {m["category"].upper()}','small'),para(m['title'],'heading'),para(m['description']),para('Learning goals','sub')]
 for t in m['objectives']:story.append(para('- '+t))
 for section in m['sections']:story += [para(section['title'],'sub'),para(section['text'])]
 case=m['scenario'];story += [para('Practice example: '+case['subject'],'sub'),para(case['sender'],'small'),para(case['message']),para('Points to check: '+'; '.join(case['flags'])),para('Suggested response: '+case['action']),para('Workplace checklist','sub')]
 for t in m['checklist']:story.append(para('- '+t))
 story.append(para('Further reading','sub'))
 for r in m['resources']:story.append(Paragraph('<link href="'+escape(r['url'],quote=True)+'" color="#285a45">'+escape(r['label'])+'</link>',styles['small']))
 story.append(para('Complete this lesson\'s knowledge check inside PhishAware.','small'))
SimpleDocTemplate(str(out),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=40,bottomMargin=52,title='PhishAware Employee Email Safety Training',author='PhishAware').build(story,onFirstPage=footer,onLaterPages=footer)
print(out)
