"""
Data models and initial seed state for College Course Registration System.
"""

from typing import Dict, List, Set, Any, Tuple
import copy

COURSES_DATA: Dict[str, Dict[str, Any]] = {
    "C1": {
        "code": "C1",
        "name": "C Programming",
        "credits": 4,
        "department": "Computer Science & Engineering",
        "level": 1,
        "prerequisites": [],
        "description": "Foundational course introducing procedural programming principles, structured programming, data types, control flow, functions, memory pointers, dynamic allocation, structures, and file I/O operations.",
        "topics": [
            "Data types & control structures",
            "Functions & modular design",
            "Pointers & dynamic memory allocation",
            "Structs, unions & typedefs",
            "File handling & debugging with GDB"
        ],
        "instructor": "Dr. Arvind Raman",
        "category": "Core Foundation"
    },
    "C2": {
        "code": "C2",
        "name": "Data Structures",
        "credits": 4,
        "department": "Computer Science & Engineering",
        "level": 2,
        "prerequisites": ["C1"],
        "description": "Explores fundamental abstract data types and concrete implementations. Covers algorithmic complexity (Big-O), linear structures, trees, priority queues, and hash tables with hands-on C implementations.",
        "topics": [
            "Asymptotic analysis (Big-O notation)",
            "Singly and doubly linked lists",
            "Stacks, queues & circular buffers",
            "Binary search trees & AVL balancing",
            "Heaps, priority queues & hash tables"
        ],
        "instructor": "Prof. Meera Kulkarni",
        "category": "Core Computer Science"
    },
    "C3": {
        "code": "C3",
        "name": "Database Management Systems",
        "credits": 3,
        "department": "Computer Science & Engineering",
        "level": 3,
        "prerequisites": ["C2"],
        "description": "Comprehensive study of relational databases, relational algebra, SQL querying, normalization (1NF-BCNF), transaction concurrency (ACID), B-Trees, and crash recovery techniques.",
        "topics": [
            "ER modeling & relational algebra",
            "Advanced SQL queries & aggregations",
            "Database normalization & functional dependencies",
            "Indexing, B+ Trees & query optimization",
            "Transactions, ACID & concurrency control"
        ],
        "instructor": "Dr. Rajeshwar Rao",
        "category": "Systems & Data"
    },
    "C4": {
        "code": "C4",
        "name": "Advanced Algorithms",
        "credits": 4,
        "department": "Computer Science & Engineering",
        "level": 3,
        "prerequisites": ["C2"],
        "description": "Advanced problem solving techniques including greedy heuristics, dynamic programming, network max-flow, randomized algorithms, NP-completeness reductions, and approximation algorithms.",
        "topics": [
            "Greedy strategies & Matroids",
            "Dynamic programming state equations",
            "Network flows (Ford-Fulkerson)",
            "Graph algorithms (Dijkstra, Bellman-Ford)",
            "NP-Completeness & polynomial reductions"
        ],
        "instructor": "Prof. Sneha Iyer",
        "category": "Theoretical Computer Science"
    },
    "C5": {
        "code": "C5",
        "name": "Operating Systems",
        "credits": 3,
        "department": "Computer Science & Engineering",
        "level": 3,
        "prerequisites": ["C2"],
        "description": "Examines computer system organization, process virtualization, thread synchronization, deadlocks, paging and virtual memory architecture, and POSIX file system interfaces.",
        "topics": [
            "Processes, threads & context switching",
            "Synchronization primitives & semaphores",
            "Deadlock prevention, avoidance & detection",
            "Virtual memory, paging & page replacement",
            "File system implementation & disk scheduling"
        ],
        "instructor": "Dr. Vikram Seth",
        "category": "Systems & Data"
    },
    "C6": {
        "code": "C6",
        "name": "Computer Networks",
        "credits": 3,
        "department": "Computer Science & Engineering",
        "level": 4,
        "prerequisites": ["C5"],
        "description": "Principles and protocols of networked computer communication: OSI & TCP/IP architectures, packet switching, routing algorithms, reliable transport (TCP), and socket programming.",
        "topics": [
            "Physical and data link layer framing",
            "IP addressing, subnetting & routing protocols",
            "TCP sliding window & congestion control",
            "DNS, HTTP/3, TLS & socket programming",
            "Network security & packet inspection"
        ],
        "instructor": "Prof. Harish Nair",
        "category": "Networking & Infrastructure"
    },
    "C7": {
        "code": "C7",
        "name": "Web Technologies",
        "credits": 3,
        "department": "Computer Science & Engineering",
        "level": 4,
        "prerequisites": ["C3"],
        "description": "Modern full-stack web software engineering: client-side interactivity, responsive layouts, asynchronous state management, RESTful API design, database ORMs, and cloud deployments.",
        "topics": [
            "Modern JavaScript/TypeScript & DOM manipulation",
            "RESTful API architectures & JSON endpoints",
            "State management & component lifecycle",
            "Authentication, JWT & session management",
            "Cloud containerization & CI/CD workflows"
        ],
        "instructor": "Prof. Tanya Verma",
        "category": "Applied Software Engineering"
    },
    "C8": {
        "code": "C8",
        "name": "Artificial Intelligence & Machine Learning",
        "credits": 4,
        "department": "Computer Science & Engineering",
        "level": 4,
        "prerequisites": ["C4"],
        "description": "Fundamental principles of machine learning and probabilistic reasoning: gradient descent optimization, linear/logistic regression, decision trees, neural networks, and model evaluation metrics.",
        "topics": [
            "Supervised vs unsupervised learning paradigms",
            "Linear & logistic regression with gradient descent",
            "Decision trees, random forests & bagging",
            "Multilayer perceptrons & backpropagation",
            "Cross-validation & performance metrics"
        ],
        "instructor": "Dr. Rohit Deshmukh",
        "category": "Intelligent Systems"
    }
}

STUDENT_PERSONAS = {
    "sophomore": {
        "id": "STU-2024-042",
        "name": "Prataparao Dhanush",
        "role": "Student (Sophomore)",
        "roll_number": "CS24B042",
        "department": "Computer Science & Engineering",
        "semester": 3,
        "cgpa": 3.84,
        "degree": "B.Tech in Computer Science",
        "completed_courses": ["C1"],
        "registered_courses": ["C2"],
        "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80",
        "email": "prataparao.dhanush@college.edu"
    },
    "freshman": {
        "id": "STU-2025-011",
        "name": "Priya Nair",
        "role": "Freshman (New Student)",
        "roll_number": "CS25B011",
        "department": "Computer Science & Engineering",
        "semester": 1,
        "cgpa": 0.0,
        "degree": "B.Tech in Computer Science",
        "completed_courses": [],
        "registered_courses": [],
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80",
        "email": "priya.nair@college.edu"
    },
    "junior": {
        "id": "STU-2023-018",
        "name": "Devin Chen",
        "role": "Junior (Year 3)",
        "roll_number": "CS23B018",
        "department": "Computer Science & Engineering",
        "semester": 5,
        "cgpa": 3.91,
        "degree": "B.Tech in Computer Science",
        "completed_courses": ["C1", "C2"],
        "registered_courses": ["C3", "C4"],
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80",
        "email": "devin.chen@college.edu"
    },
    "senior": {
        "id": "STU-2022-005",
        "name": "Aisha Patel",
        "role": "Senior (Final Year)",
        "roll_number": "CS22B005",
        "department": "Computer Science & Engineering",
        "semester": 7,
        "cgpa": 3.96,
        "degree": "B.Tech in Computer Science",
        "completed_courses": ["C1", "C2", "C3", "C4", "C5"],
        "registered_courses": ["C6", "C7"],
        "avatar": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80",
        "email": "aisha.patel@college.edu"
    }
}


class CourseManager:
    """Manages student state and in-memory persistence during the session."""

    def __init__(self):
        self.courses = copy.deepcopy(COURSES_DATA)
        self.current_student = copy.deepcopy(STUDENT_PERSONAS["sophomore"])

    def set_persona(self, persona_key: str) -> Dict[str, Any]:
        if persona_key in STUDENT_PERSONAS:
            self.current_student = copy.deepcopy(STUDENT_PERSONAS[persona_key])
        return self.current_student

    def get_student(self) -> Dict[str, Any]:
        return self.current_student

    def register_course(self, course_code: str) -> Tuple[bool, str]:
        if course_code not in self.courses:
            return False, f"Course '{course_code}' does not exist."

        if course_code in self.current_student["completed_courses"]:
            return False, f"Course '{course_code}' has already been completed."

        if course_code in self.current_student["registered_courses"]:
            return False, f"Course '{course_code}' is already registered."

        prereqs = self.courses[course_code]["prerequisites"]
        missing = [p for p in prereqs if p not in self.current_student["completed_courses"]]
        if missing:
            missing_names = [f"{p} ({self.courses[p]['name']})" for p in missing]
            return False, f"Prerequisite violation: You must complete {', '.join(missing_names)} before registering."

        self.current_student["registered_courses"].append(course_code)
        return True, f"Successfully registered for {course_code} - {self.courses[course_code]['name']}!"

    def drop_course(self, course_code: str) -> Tuple[bool, str]:
        if course_code in self.current_student["registered_courses"]:
            self.current_student["registered_courses"].remove(course_code)
            return True, f"Course '{course_code}' dropped successfully."
        return False, f"Course '{course_code}' is not currently registered."

    def toggle_completed_course(self, course_code: str) -> Tuple[bool, str]:
        """Toggles a course as completed/uncompleted to let user interactively simulate progression."""
        if course_code not in self.courses:
            return False, f"Course '{course_code}' does not exist."

        completed = self.current_student["completed_courses"]
        registered = self.current_student["registered_courses"]

        if course_code in completed:
            completed.remove(course_code)
            # If removing a prereq that other registered courses depend on, clean them up or leave note
            msg = f"Marked '{course_code}' as NOT completed."
        else:
            completed.append(course_code)
            if course_code in registered:
                registered.remove(course_code)
            msg = f"Marked '{course_code}' as COMPLETED."

        return True, msg

    def reset_student(self) -> None:
        self.current_student = copy.deepcopy(STUDENT_PERSONAS["sophomore"])
