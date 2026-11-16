"""
Agent 8 — Academic Advisor Agent
Virtual AI Mentor using LLM (Gemini/OpenAI/fallback rule-based)
"""
import os, json, logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


FAQ_KNOWLEDGE_BASE = {
    "improve gpa": [
        "Focus on high-weightage subjects first.",
        "Maintain >85% attendance — strong attendance correlates with 1.2 higher GPA.",
        "Submit assignments on time — late submissions can cut your internal marks by 30%.",
        "Practice previous year papers 2 weeks before exams.",
        "Form study groups for difficult subjects.",
    ],
    "weak subjects": [
        "Check your subject-wise score breakdown in your SAPFS profile.",
        "Identify subjects where your score is below 60% — prioritise those.",
        "Request extra practice material from faculty.",
        "Use online resources (NPTEL, Coursera) to supplement classroom learning.",
    ],
    "performance decreasing": [
        "Review your last 3-semester trend in the Analytics dashboard.",
        "Common reasons: reduced study hours, declining attendance, accumulating backlogs.",
        "Book a counselling session with your faculty advisor immediately.",
        "Check if personal issues are affecting focus — reach out to the student welfare cell.",
    ],
    "next semester": [
        "Based on your current trajectory, focus on clearing any backlogs first.",
        "Plan your elective selection to balance core and lighter subjects.",
        "Start revision 4 weeks before exams rather than 1 week.",
        "Set a weekly study schedule and stick to it.",
    ],
    "attendance": [
        "Minimum 75% attendance is required for exam eligibility.",
        "Each missed class increases your risk level.",
        "If medically absent, apply for medical leave within 7 days.",
        "Prioritise morning classes — they tend to have lower attendance.",
    ],
    "backlog": [
        "Register for supplementary exams as soon as they are announced.",
        "Dedicate 1 hour/day per backlog subject.",
        "Solve last 5 years of question papers for backlog subjects.",
        "Seek help from faculty or senior students who have cleared the same subject.",
    ],
}


class AcademicAdvisorAgent:
    def __init__(self, use_llm: bool = False, api_key: Optional[str] = None):
        self.use_llm  = use_llm and api_key is not None
        self.api_key  = api_key
        self.provider = "rule_based"

        if self.use_llm:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self.genai_model = genai.GenerativeModel("gemini-pro")
                self.provider = "gemini"
                logger.info("[AdvisorAgent] Gemini API connected")
            except ImportError:
                try:
                    import openai
                    openai.api_key = api_key
                    self.provider = "openai"
                    logger.info("[AdvisorAgent] OpenAI API connected")
                except ImportError:
                    logger.warning("[AdvisorAgent] No LLM library found — using rule-based")

    def _build_context(self, student_context: Dict) -> str:
        return (
            f"Student: {student_context.get('name', 'Student')}\n"
            f"CGPA: {student_context.get('cgpa', 'N/A')}\n"
            f"Semester: {student_context.get('semester', 'N/A')}\n"
            f"Risk Level: {student_context.get('risk_level', 'N/A')}\n"
            f"Attendance: {student_context.get('attendance_pct', 'N/A')}%\n"
            f"Backlogs: {student_context.get('backlog_count', 0)}\n"
            f"Predicted GPA: {student_context.get('predicted_gpa', 'N/A')}\n"
        )

    def _rule_based_response(self, query: str, student_context: Dict) -> str:
        q_lower = query.lower()
        for key, answers in FAQ_KNOWLEDGE_BASE.items():
            if any(kw in q_lower for kw in key.split()):
                response = "\n".join(f"• {a}" for a in answers)
                return f"Based on your profile:\n\n{response}"

        # Generic contextual response
        cgpa = float(student_context.get("cgpa", 7.0))
        risk = student_context.get("risk_level", "medium")
        if cgpa >= 8.5:
            return ("You're performing excellently! Consider research projects, internships, "
                    "or competitive programming to further strengthen your profile.")
        if risk in ["high", "critical"]:
            return ("Your current risk level requires immediate attention. "
                    "Focus on: (1) Increasing attendance above 75%, "
                    "(2) Submitting all pending assignments, "
                    "(3) Clearing backlogs. Book a counselling session today.")
        return ("Keep working consistently. Review your weak subjects, "
                "maintain attendance, and submit assignments on time to improve your GPA.")

    def _gemini_response(self, query: str, student_context: Dict) -> str:
        try:
            prompt = (
                f"You are a compassionate academic advisor at a college.\n"
                f"Student context:\n{self._build_context(student_context)}\n\n"
                f"Student question: {query}\n\n"
                "Give concrete, actionable advice in 3-5 bullet points. "
                "Be empathetic but practical. Keep it under 150 words."
            )
            response = self.genai_model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"[AdvisorAgent] Gemini failed: {e}")
            return self._rule_based_response(query, student_context)

    def _openai_response(self, query: str, student_context: Dict) -> str:
        try:
            import openai
            resp = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content":
                        "You are a compassionate academic advisor. Give practical advice."},
                    {"role": "user", "content":
                        f"Student context:\n{self._build_context(student_context)}\n\nQuestion: {query}"},
                ],
                max_tokens=200, temperature=0.7,
            )
            return resp.choices[0].message.content
        except Exception as e:
            logger.error(f"[AdvisorAgent] OpenAI failed: {e}")
            return self._rule_based_response(query, student_context)

    def chat(
        self,
        query: str,
        student_context: Dict,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict[str, Any]:
        if self.provider == "gemini":
            answer = self._gemini_response(query, student_context)
        elif self.provider == "openai":
            answer = self._openai_response(query, student_context)
        else:
            answer = self._rule_based_response(query, student_context)

        suggested_qs = self._suggest_followup(query, student_context)

        return {
            "query":              query,
            "response":           answer,
            "provider":           self.provider,
            "suggested_questions": suggested_qs,
            "context_used":       {k: student_context.get(k) for k in ["cgpa","risk_level","semester"]},
        }

    @staticmethod
    def _suggest_followup(query: str, ctx: Dict) -> List[str]:
        suggestions = [
            "How can I improve my GPA this semester?",
            "Which subjects should I focus on?",
            "What is my attendance risk level?",
            "How to prepare for supplementary exams?",
            "What study plan should I follow?",
        ]
        return [s for s in suggestions if s.lower() not in query.lower()][:3]
