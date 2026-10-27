# College Course Registration and Prerequisite Management System

A modern, professional SaaS-style college academic portal UI and backend engine designed for college students to register for courses while strictly adhering to prerequisite rules. 

Built with **Python (Flask)** and **Modern Responsive Frontend (Tailwind CSS, Vis.js DAG Network, Lucide Icons)**.

---

## 🎓 Academic Foundations: Discrete Mathematics Concepts

This system implements fundamental concepts from **Discrete Mathematics & Graph Theory**:

| Concept | Mathematical Formulation | System Implementation |
| :--- | :--- | :--- |
| **Set Theory** | $C = \{c_1, c_2, \dots, c_n\}$, $S \subseteq C$ | The course catalog set $C$, completed course subset $S$, and eligible subset $E = \{c \in C \setminus S \mid \text{Prereqs}(c) \subseteq S\}$. |
| **Binary Relations** | $R \subseteq C \times C$ where $(u, v) \in R$ | Directed prerequisite relation: course $u$ is an immediate prerequisite for course $v$ ($u \to v$). |
| **Strict Partial Order (Poset)** | $(C, \prec)$ | Prerequisite dependency network satisfying **Irreflexivity** ($\neg (x \prec x)$), **Asymmetry** ($u \prec v \implies \neg(v \prec u)$), and **Transitivity**. |
| **Directed Acyclic Graph (DAG)** | $G = (V, E)$ | Course dependency graph where nodes are courses and directed edges are prerequisite requirements. |
| **Topological Sorting** | Linear ordering $\sigma$ of $V$ | **Kahn's Algorithm** (in-degree reduction) computes valid multi-semester graduation schedules. |
| **Antichains & Concurrency** | Incomparable elements $u \parallel v$ | Identifies courses that can be taken in parallel (e.g., DBMS and Advanced Algorithms after Data Structures). |
| **Transitive Closure** | $R^+ = \bigcup_{k=1}^n R^k$ | **Warshall's Algorithm** calculates the reachability matrix showing all direct and indirect prerequisites. |
| **Cycle Detection** | Detection of circular loops $v_1 \to \dots \to v_1$ | DFS 3-Coloring and Kahn's algorithm flag circular prerequisite loops as strict axiom violations. |

---

## 📌 Prerequisite Rules Implemented

- **C1 (C Programming)**: Foundational course with **no prerequisites** (In-degree = 0).
- **C2 (Data Structures)**: Requires **C1 (C Programming)**.
- **C3 (Database Management Systems)**: Requires **C2 (Data Structures)**.
- **C4 (Advanced Algorithms)**: Requires **C2 (Data Structures)**.
- **C5 (Operating Systems)**: Requires **C2 (Data Structures)**.
- **C6 (Computer Networks)**: Requires **C5 (Operating Systems)**.
- **C7 (Web Technologies)**: Requires **C3 (DBMS)**.
- **C8 (Artificial Intelligence & ML)**: Requires **C4 (Advanced Algorithms)**.
- **Parallel Antichains**: Once `C2 (Data Structures)` is completed, `C3 (DBMS)` and `C4 (Advanced Algorithms)` can be taken in **either order or concurrently**.
- **Eligibility Rule**: A student is eligible for course $c$ if and only if:
  $$\text{Prerequisites}(c) \subseteq \text{CompletedCourses}$$
- **Circular Dependency Guard**: Circular references (e.g., $C4 \to C1$ creating $C1 \to C2 \to C4 \to C1$) are prevented and rejected.

---

## 🚀 Key Pages and Components

1. **Student Dashboard**:
   - Welcome banner with student profile (`Prataparao Dhanush`, Sophomore).
   - Summary metric cards: Total Courses, Completed Courses, Eligible Courses, and Pending/Locked Courses.
   - Degree completion progress bar (Credits completed / Total credits).
   - "Recently Recommended for You" unlocked courses list.

2. **Course Catalog**:
   - Grid and Table view toggles.
   - Filter by status (**All**, **Eligible**, **Blocked**, **Registered**, **Completed**).
   - Search by course code or title, and sort by code, name, credits, or curriculum level.
   - Green badge for **Eligible**, Red badge for **Prerequisite Required**, Indigo for **Registered**, Slate for **Completed**.
   - Interactive **Register** button enabled exclusively for eligible courses.

3. **Prerequisite Checker**:
   - Dropdown course selector.
   - Visual inspection of satisfied prerequisites (with green checkmarks) and missing prerequisites (with warning icons).
   - Clear academic status messages (e.g., *"You are eligible to register for Data Structures"* or *"Complete C Programming before registering for Data Structures"*).
   - Displays the full transitive dependency chain.

4. **Course Dependency Visualization (DAG)**:
   - Interactive, draggable **Vis.js Network Graph**.
   - Color-coded nodes (Completed: Green, Registered: Indigo, Eligible: Mint, Locked: Rose).
   - Click-to-inspect sidebar showing in-degree, out-degree, direct prereqs, and dependents.
   - Reset zoom, physics toggle, and auto-hierarchical layout.

5. **Course Sequence Planner**:
   - Computes valid multi-semester course registration sequences using **Kahn's Topological Sorting**.
   - Explains parallel course options (antichains) for courses like DBMS and Advanced Algorithms.
   - "Generate Valid Sequence" button with stage-by-stage and linear views.

6. **My Courses**:
   - Tabs for **Currently Registered**, **Completed**, and **Remaining to Graduate**.
   - **Interactive Simulation Tool**: "Mark Passed / Mark Incomplete" buttons allow teachers/students to toggle course completion live and watch downstream courses unlock in real time!

7. **Discrete Math Lab (Academic Presentation Tool)**:
   - Formal verification of Poset axioms: Irreflexive, Asymmetric, Transitive, and Acyclic.
   - **Adjacency Matrix** $A[i][j]$ and **Reachability Matrix** $R[i][j]$ (computed with Warshall's Algorithm).
   - In-degree & Out-degree node classification table (Sources, Intermediate, Sinks).
   - **Interactive Cycle Detection Sandbox**: Simulate circular dependencies (e.g. $C4 \to C1$) to watch Kahn's algorithm catch the cycle.

---

## 🛠️ Project Directory Structure

```
course_registration_system/
├── app.py                      # Flask Backend REST API & Server
├── models.py                   # Data models, courses dataset, student personas
├── run.bat                     # Windows one-click startup batch script
├── requirements.txt            # Python dependencies (flask)
├── README.md                   # Complete documentation
├── discrete_math/
│   ├── __init__.py
│   └── graph.py                # Graph DAG, Kahn's Topo Sort, Warshall's algorithm
├── static/
│   ├── css/
│   │   └── styles.css          # SaaS typography, animations, badge styles
│   └── js/
│       └── app.js              # Frontend UI controller, Vis.js graph, modals
└── templates/
    └── index.html              # Responsive SaaS Dashboard HTML template
```

---

## 💻 How to Run the Application

### Option 1: One-Click Startup (Windows)
Double-click `run.bat` in the project directory.

### Option 2: Command Line
1. Open PowerShell or Command Prompt in the project folder:
   ```powershell
   cd C:\Users\dhanu\.gemini\antigravity\scratch\course_registration_system
   ```
2. Install dependencies:
   ```powershell
   python -m pip install -r requirements.txt
   ```
3. Run the application:
   ```powershell
   python app.py
   ```
4. Open your web browser and navigate to:
   ```
   http://127.0.0.1:5000
   ```

---

## 🎙️ Suggested Academic Presentation Demo Script

When presenting this project to a professor or evaluation committee:

1. **Dashboard & Problem Statement**:
   - Open `http://127.0.0.1:5000`. Show the summary cards. Point out that Prataparao Dhanush has completed `C1 (C Programming)` and is currently registered for `C2 (Data Structures)`.
2. **Course Catalog & Color Badges**:
   - Navigate to **Course Catalog**. Filter by "Eligible" (green badge) and "Prerequisite Required" (red badge).
   - Explain that `C3 (DBMS)` and `C4 (Advanced Algorithms)` are locked because they require `C2`.
3. **Interactive Simulation (Live Unlock)**:
   - Go to **My Courses** -> **Currently Registered**. Click **"Mark Passed"** on `C2 (Data Structures)`.
   - Return to **Course Catalog**: Both `C3 (DBMS)` and `C4 (Advanced Algorithms)` have now immediately unlocked to **Eligible (Green)**!
4. **Interactive Directed Graph**:
   - Open **Dependency Graph**. Drag the nodes and show the directed edges: $C1 \to C2 \to C3$ and $C1 \to C2 \to C4$.
   - Highlight how colors correspond to the student's live academic state.
5. **Topological Sort & Antichains**:
   - Open **Sequence Planner**. Point out Stage 3 where DBMS, Advanced Algorithms, and Operating Systems form an **antichain** in the partial order and can be taken in parallel.
6. **Cycle Prevention Sandbox**:
   - Open **Discrete Math Lab**. In the Cycle Prevention Sandbox, select Source: `C4` and Target: `C1`. Click "Simulate Proposed Dependency".
   - Show how Kahn's algorithm and DFS cycle detection flag the loop $[C1 \to C2 \to C4 \to C1]$ and explain the axiom violation.
