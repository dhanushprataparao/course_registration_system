"""
Discrete Mathematics Graph & Relation Engine
============================================
Implements Set Theory, Relations, Posets (Partially Ordered Sets),
Directed Acyclic Graphs (DAG), Kahn's Topological Sort, Warshall's Algorithm,
and Cycle Detection for Course Prerequisite Management.
"""

from typing import Dict, List, Set, Tuple, Optional, Any
from collections import defaultdict, deque


class CourseGraph:
    """
    Represents the Course Dependency Network as a Directed Graph G = (V, E).
    
    Discrete Mathematics Concepts:
    - Set of Vertices V: Courses
    - Set of Directed Edges E: (u, v) where u is a prerequisite for v (u -> v)
    - Strict Partial Order (V, <): Irreflexive, Asymmetric, Transitive
    - Antichains: Courses that have no prerequisite dependency between them
    """

    def __init__(self):
        self.nodes: Dict[str, Dict[str, Any]] = {}
        # adjacency list: u -> list of courses that depend on u
        self.adj: Dict[str, List[str]] = defaultdict(list)
        # reverse adjacency list: v -> list of prerequisites of v
        self.rev_adj: Dict[str, List[str]] = defaultdict(list)

    def add_course(self, code: str, name: str, credits: int, **kwargs) -> None:
        """Adds a course vertex to the graph."""
        self.nodes[code] = {
            "code": code,
            "name": name,
            "credits": credits,
            **kwargs
        }
        if code not in self.adj:
            self.adj[code] = []
        if code not in self.rev_adj:
            self.rev_adj[code] = []

    def add_prerequisite(self, prereq_code: str, course_code: str) -> None:
        """
        Adds directed edge (prereq_code -> course_code).
        Meaning: prereq_code must be completed before taking course_code.
        """
        if prereq_code not in self.nodes or course_code not in self.nodes:
            raise ValueError(f"Both {prereq_code} and {course_code} must exist in graph.")
        if course_code not in self.adj[prereq_code]:
            self.adj[prereq_code].append(course_code)
        if prereq_code not in self.rev_adj[course_code]:
            self.rev_adj[course_code].append(prereq_code)

    def get_prerequisites(self, course_code: str) -> List[str]:
        """Returns immediate prerequisites (in-edges) of a course."""
        return list(self.rev_adj.get(course_code, []))

    def get_dependents(self, course_code: str) -> List[str]:
        """Returns courses that immediately depend on this course (out-edges)."""
        return list(self.adj.get(course_code, []))

    def in_degree(self, course_code: str) -> int:
        """In-degree: count of direct prerequisites required."""
        return len(self.rev_adj.get(course_code, []))

    def out_degree(self, course_code: str) -> int:
        """Out-degree: count of courses directly unlocked by this course."""
        return len(self.adj.get(course_code, []))

    def get_all_ancestors(self, course_code: str) -> Set[str]:
        """
        Computes all transitive prerequisites (ancestors in DAG) using BFS.
        Reflects transitive closure: if A -> B and B -> C, then A is an ancestor of C.
        """
        ancestors = set()
        queue = deque(self.get_prerequisites(course_code))
        while queue:
            curr = queue.popleft()
            if curr not in ancestors:
                ancestors.add(curr)
                for p in self.get_prerequisites(curr):
                    if p not in ancestors:
                        queue.append(p)
        return ancestors

    def get_all_descendants(self, course_code: str) -> Set[str]:
        """
        Computes all transitive unlockable courses (descendants in DAG) using BFS.
        """
        descendants = set()
        queue = deque(self.get_dependents(course_code))
        while queue:
            curr = queue.popleft()
            if curr not in descendants:
                descendants.add(curr)
                for d in self.get_dependents(curr):
                    if d not in descendants:
                        queue.append(d)
        return descendants

    def detect_cycles(self) -> Tuple[bool, List[str]]:
        """
        Detects cycles in the directed graph using DFS 3-color marking.
        Returns (has_cycle, cycle_path).
        White = 0 (unvisited), Gray = 1 (visiting / on current recursion stack), Black = 2 (visited).
        """
        visited = {code: 0 for code in self.nodes}
        parent = {}
        cycle_nodes: List[str] = []

        def dfs(u: str) -> bool:
            visited[u] = 1
            for v in self.adj.get(u, []):
                if visited[v] == 1:
                    # Cycle detected: backtrack from u to v
                    curr = u
                    cycle = [v, curr]
                    while curr != v and curr in parent:
                        curr = parent[curr]
                        cycle.append(curr)
                    cycle.reverse()
                    cycle_nodes.extend(cycle)
                    return True
                elif visited[v] == 0:
                    parent[v] = u
                    if dfs(v):
                        return True
            visited[u] = 2
            return False

        for node in self.nodes:
            if visited[node] == 0:
                if dfs(node):
                    return True, cycle_nodes

        return False, []

    def topological_sort_kahn(self) -> Tuple[List[str], bool]:
        """
        Computes a valid linear ordering of courses using Kahn's Algorithm.
        
        Kahn's Algorithm Steps:
        1. Calculate in-degree of all vertices.
        2. Put vertices with in-degree 0 into a queue Q.
        3. While Q is not empty:
           a. Remove u from Q and append to topological order.
           b. For each neighbor v of u, decrement in-degree of v.
           c. If in-degree of v becomes 0, append v to Q.
        4. If length of order != |V|, a cycle exists!
        
        Returns:
            (topological_order, is_valid_dag)
        """
        in_degrees = {code: self.in_degree(code) for code in self.nodes}
        # In-degree 0 vertices (no prerequisites)
        queue = deque([code for code, deg in in_degrees.items() if deg == 0])
        # Sort queue alphabetically for deterministic output
        queue = deque(sorted(list(queue)))
        
        topo_order: List[str] = []
        
        while queue:
            u = queue.popleft()
            topo_order.append(u)
            
            for v in sorted(self.adj.get(u, [])):
                in_degrees[v] -= 1
                if in_degrees[v] == 0:
                    queue.append(v)
                    
        is_dag = (len(topo_order) == len(self.nodes))
        return topo_order, is_dag

    def level_order_schedule(self) -> List[Dict[str, Any]]:
        """
        Computes courses grouped by academic stages/semesters (antichains).
        Courses in the same step have their prerequisites satisfied by earlier steps
        and can be taken in parallel or in arbitrary order!
        """
        # Calculate level/stage (longest path from any root)
        in_degrees = {code: self.in_degree(code) for code in self.nodes}
        levels: Dict[str, int] = {code: 1 for code in self.nodes}
        
        # Using topological sort to compute longest path levels
        topo_order, is_dag = self.topological_sort_kahn()
        if not is_dag:
            return []
            
        for u in topo_order:
            for v in self.adj.get(u, []):
                if levels[v] < levels[u] + 1:
                    levels[v] = levels[u] + 1
                    
        # Group courses by level
        grouped = defaultdict(list)
        for code, lvl in levels.items():
            course_data = self.nodes[code]
            grouped[lvl].append({
                "code": code,
                "name": course_data["name"],
                "credits": course_data["credits"],
                "prerequisites": self.get_prerequisites(code),
                "dependents": self.get_dependents(code)
            })
            
        schedule = []
        for lvl in sorted(grouped.keys()):
            courses = grouped[lvl]
            explanation = ""
            if lvl == 1:
                explanation = "Foundational courses with zero prerequisites (In-degree = 0). Can be taken immediately in Semester 1."
            else:
                names = [c["code"] for c in courses]
                if len(courses) > 1:
                    explanation = f"Courses [{', '.join(names)}] can be taken concurrently or in any relative order once prior stage prerequisites are completed."
                else:
                    explanation = f"Requires completion of preceding prerequisite level."
                    
            schedule.append({
                "step": lvl,
                "title": f"Stage {lvl} (Semester {lvl})",
                "courses": courses,
                "total_credits": sum(c["credits"] for c in courses),
                "explanation": explanation
            })
            
        return schedule

    def get_adjacency_matrix(self) -> Tuple[List[str], List[List[int]]]:
        """
        Generates the standard Discrete Mathematics Adjacency Matrix A.
        A[i][j] = 1 if (node_i -> node_j) is an edge, else 0.
        """
        codes = sorted(list(self.nodes.keys()))
        idx = {code: i for i, code in enumerate(codes)}
        n = len(codes)
        matrix = [[0] * n for _ in range(n)]
        
        for u, neighbors in self.adj.items():
            if u in idx:
                for v in neighbors:
                    if v in idx:
                        matrix[idx[u]][idx[v]] = 1
                        
        return codes, matrix

    def get_reachability_matrix(self) -> Tuple[List[str], List[List[int]]]:
        """
        Computes the Reachability Matrix (Transitive Closure) using Warshall's Algorithm.
        R[i][j] = 1 if there is a directed path of any length from node_i to node_j.
        """
        codes, matrix = self.get_adjacency_matrix()
        n = len(codes)
        # Deep copy
        reach = [row[:] for row in matrix]
        
        # Warshall's Algorithm
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    reach[i][j] = reach[i][j] or (reach[i][k] and reach[k][j])
                    
        return codes, reach

    def check_student_eligibility(self, course_code: str, completed_courses: Set[str]) -> Dict[str, Any]:
        """
        Evaluates eligibility of a student to register for course_code:
        Rule: student is eligible iff Prerequisites(course_code) is a subset of completed_courses
              AND course_code is not already completed.
        """
        if course_code not in self.nodes:
            return {"eligible": False, "reason": "Course not found"}
            
        prereqs = set(self.get_prerequisites(course_code))
        is_completed = course_code in completed_courses
        
        missing_prereqs = list(prereqs - completed_courses)
        satisfied_prereqs = list(prereqs.intersection(completed_courses))
        
        is_eligible = (len(missing_prereqs) == 0) and not is_completed
        
        status = "ELIGIBLE"
        if is_completed:
            status = "COMPLETED"
        elif len(missing_prereqs) > 0:
            status = "PREREQUISITE_REQUIRED"
            
        return {
            "course_code": course_code,
            "status": status,
            "is_eligible": is_eligible,
            "is_completed": is_completed,
            "total_prerequisites": len(prereqs),
            "satisfied_prerequisites": satisfied_prereqs,
            "missing_prerequisites": missing_prereqs,
            "prerequisites_names": {p: self.nodes[p]["name"] for p in prereqs if p in self.nodes}
        }
