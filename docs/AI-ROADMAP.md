# Taleem — AI modules (future)

These modules are **not in the current product**. Core school operations (admissions, attendance, fees, exams, payroll, portals) already run without AI. Each item below can be added later on top of the existing data and notification/report interfaces, without rebuilding the school.

Positioning for clients: *Taleem runs your school today. These AI tools are the next layer — English and Urdu, for Pakistan schools.*

---

## 1. School AI assistant (chatbot)

A chat box inside Taleem for admin, teachers, and (limited) parents.

- Admin: “How many fee dues in Class 8?” / “Who was absent this week?”
- Teacher: “Show my section’s weak students in Maths.”
- Parent: “When is the next challan due?” / “What was last exam percentage?”

Answers only from **that school’s** data. Greenwood never sees Happy Home.

---

## 2. AI exam / paper generator

Teachers pick class, subject, chapter, and difficulty. Taleem drafts a paper (MCQs, short, long) in English and Urdu, aligned to the school’s subjects.

Staff always review and edit before print. Marks still go into the existing Exams module.

---

## 3. AI report generation

One-click drafts for:

- Principal monthly report (enrollment, attendance %, fee collection)
- Class performance summary after an exam
- Super Admin platform digest (for Taleem, not for a school)

Numbers stay exact from the database. AI only writes the narrative.

---

## 4. Smart WhatsApp / SMS / email drafts

Absence alerts, fee reminders, and announcements already have a send path. AI would **write the message** in EN/UR (polite, short, school-branded). Staff approve before send.

Same for password-reset / fee-receipt wording later.

---

## 5. Social post writer

The Social posts composer already stores caption, Urdu caption, hashtags, and images. AI would suggest:

- Facebook / Instagram / WhatsApp / TikTok / X captions
- Hashtags
- Urdu + English versions of the same update (sports day, result day, fee last date)

Publish to live apps still depends on those platform integrations.

---

## 6. Report-card remarks

After marks are entered, AI suggests a short remark per student (strengths, improvement) in English and Urdu. Teacher edits, then it prints on the existing report card.

---

## 7. Attendance & dropout early warning

Flags students with rising absences or sudden fee default. Suggests which parents to call this week. Uses existing attendance and fee history — no extra data entry.

---

## 8. Fee recovery assistant

Suggests reminder schedule (day 3 / day 7 / overdue), tone, and who is most at risk. Accountant still confirms send and records JazzCash / EasyPaisa / cash.

---

## 9. Timetable helper

Drafts a weekly timetable from classes, sections, subjects, and staff. Warns on clashes (same teacher, same room). Admin accepts or edits in the current Timetable screen.

---

## 10. Lesson plans & homework (teacher copilot)

From the subject and class, draft a week’s lesson outline and homework. Teacher copies into announcements or WhatsApp.

---

## 11. Bilingual content helper

Rewrite any notice, certificate text, or social caption EN ↔ UR in school tone (not raw machine translation). Fits Settings header/footer and certificate branding.

---

## 12. Parent portal Q&A

Parents ask in Urdu or English: fees, results, timetable, holidays. Answers only from that child’s records. Escalates to the school office when the bot is unsure.

---

## 13. Admissions enquiry assistant (optional)

On the school’s public page: answer “fee structure?”, “Montessori seats?”, “documents required?” from school-configured FAQs. Capture the lead into admissions.

---

## Guardrails (tell the client this)

- Each school’s data stays isolated (`schoolId`). No cross-school learning that exposes student names.
- Staff remain in control: **draft → review → send/print**.
- Marks, money (paisa), and attendance are never invented by AI.
- Works in **English and Urdu**.
- Can be a paid add-on (Standard / AI pack) so Starter stays cheaper.

---

## Suggested order to build

1. Message drafts (WhatsApp / announcements) — fastest win  
2. Social caption writer  
3. Report-card remarks  
4. Exam paper generator  
5. School chatbot (admin first, then parent)  
6. Attendance early warning + fee recovery  
7. Timetable helper  
8. Lesson plans / admissions bot
