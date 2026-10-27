"""
College Course Registration & Prerequisite Management System
===========================================================
Flask Backend Application powered by Discrete Mathematics Graph Theory
"""

import os
from flask import Flask, render_template, jsonify, request
from discrete_math.graph import CourseGraph
from models import COURSES_DATA, STUDENT_PERSONAS, CourseManager

app = Flask(__name__, static_folder="static", template_folder="templates")
app.secret_key = "discrete_math_college_registration_secret_key"

course_mgr = CourseManager()


def build_system_graph() -> CourseGraph:
    """Builds and populates the CourseGraph DAG from COURSES_DATA."""
    g = CourseGraph()
    for code, data in COURSES_DATA.items():
        g.add_course(
            code=code,
            name=data["name"],
            credits=data["credits"],
            department=data["department"],
            level=data["level"],
            category=data["category"]
        )
    for code, data in COURSES_DATA.items():
        for prereq in data["prerequisites"]:
            g.add_prerequisite(prereq, code)
    return g


def get_student_stats():
    student = course_mgr.get_student()
    completed_codes = set(student["completed_courses"])
    registered_codes = set(student["registered_courses"])

    completed_credits = sum(COURSES_DATA[c]["credits"] for c in completed_codes if c in COURSES_DATA)
    registered_credits = sum(COURSES_DATA[c]["credits"] for c in registered_codes if c in COURSES_DATA)
    total_curriculum_credits = sum(c["credits"] for c in COURSES_DATA.values())

    g = build_system_graph()
    eligible_count = 0
    blocked_count = 0

    for code in COURSES_DATA:
        if code in completed_codes or code in registered_codes:
            continue
        eval_res = g.check_student_eligibility(code, completed_codes)
        if eval_res["is_eligible"]:
            eligible_count += 1
        else:
            blocked_count += 1

    progress_percent = round((completed_credits / total_curriculum_credits) * 100, 1) if total_curriculum_credits else 0

    return {
        "student": student,
        "completed_count": len(completed_codes),
        "registered_count": len(registered_codes),
        "eligible_count": eligible_count,
        "blocked_count": blocked_count,
        "total_courses": len(COURSES_DATA),
        "completed_credits": completed_credits,
        "registered_credits": registered_credits,
        "total_curriculum_credits": total_curriculum_credits,
        "progress_percent": progress_percent
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/student", methods=["GET"])
def get_student_info():
    stats = get_student_stats()
    return jsonify({
        "success": True,
        "data": stats
    })


@app.route("/api/student/persona", methods=["POST"])
def switch_persona():
    payload = request.get_json(silent=True) or {}
    persona_key = payload.get("persona", "sophomore")
    if persona_key not in STUDENT_PERSONAS:
        return jsonify({"success": False, "error": f"Invalid persona '{persona_key}'"}), 400
    student = course_mgr.set_persona(persona_key)
    return jsonify({
        "success": True,
        "message": f"Switched persona to {student['name']} ({student['role']})",
        "data": get_student_stats()
    })


@app.route("/api/student/reset", methods=["POST"])
def reset_student():
    course_mgr.reset_student()
    return jsonify({
        "success": True,
        "message": "Student profile reset to default (Prataparao Dhanush, Sophomore).",
        "data": get_student_stats()
    })


@app.route("/api/courses", methods=["GET"])
def list_courses():
    student = course_mgr.get_student()
    completed_codes = set(student["completed_courses"])
    registered_codes = set(student["registered_courses"])

    g = build_system_graph()
    courses_list = []

    for code, data in COURSES_DATA.items():
        is_completed = code in completed_codes
        is_registered = code in registered_codes
        
        prereqs = data["prerequisites"]
        missing_prereqs = [p for p in prereqs if p not in completed_codes]
        satisfied_prereqs = [p for p in prereqs if p in completed_codes]

        if is_completed:
            status = "COMPLETED"
            status_badge = "Completed"
            badge_color = "slate"
        elif is_registered:
            status = "REGISTERED"
            status_badge = "Registered"
            badge_color = "indigo"
        elif len(missing_prereqs) == 0:
            status = "ELIGIBLE"
            status_badge = "Eligible"
            badge_color = "emerald"
        else:
            status = "BLOCKED"
            status_badge = "Prerequisite Required"
            badge_color = "rose"

        courses_list.append({
            "code": code,
            "name": data["name"],
            "credits": data["credits"],
            "department": data["department"],
            "level": data["level"],
            "category": data["category"],
            "description": data["description"],
            "instructor": data["instructor"],
            "topics": data["topics"],
            "prerequisites": prereqs,
            "prerequisites_names": [COURSES_DATA[p]["name"] for p in prereqs if p in COURSES_DATA],
            "missing_prerequisites": missing_prereqs,
            "missing_prerequisites_names": [COURSES_DATA[p]["name"] for p in missing_prereqs if p in COURSES_DATA],
            "satisfied_prerequisites": satisfied_prereqs,
            "dependents": g.get_dependents(code),
            "in_degree": g.in_degree(code),
            "out_degree": g.out_degree(code),
            "status": status,
            "status_badge": status_badge,
            "badge_color": badge_color,
            "can_register": (status == "ELIGIBLE"),
            "can_drop": (status == "REGISTERED")
        })

    return jsonify({
        "success": True,
        "courses": courses_list
    })


@app.route("/api/courses/<course_code>", methods=["GET"])
def get_course_detail(course_code):
    if course_code not in COURSES_DATA:
        return jsonify({"success": False, "error": f"Course '{course_code}' not found."}), 404

    data = COURSES_DATA[course_code]
    student = course_mgr.get_student()
    completed_codes = set(student["completed_courses"])
    registered_codes = set(student["registered_courses"])

    g = build_system_graph()
    prereqs = data["prerequisites"]
    missing = [p for p in prereqs if p not in completed_codes]
    satisfied = [p for p in prereqs if p in completed_codes]

    ancestors = sorted(list(g.get_all_ancestors(course_code)))
    descendants = sorted(list(g.get_all_descendants(course_code)))

    if course_code in completed_codes:
        status = "COMPLETED"
    elif course_code in registered_codes:
        status = "REGISTERED"
    elif len(missing) == 0:
        status = "ELIGIBLE"
    else:
        status = "BLOCKED"

    return jsonify({
        "success": True,
        "course": {
            **data,
            "status": status,
            "is_completed": course_code in completed_codes,
            "is_registered": course_code in registered_codes,
            "is_eligible": (status == "ELIGIBLE"),
            "satisfied_prerequisites": satisfied,
            "missing_prerequisites": missing,
            "prerequisites_info": [{
                "code": p,
                "name": COURSES_DATA[p]["name"],
                "completed": p in completed_codes
            } for p in prereqs if p in COURSES_DATA],
            "ancestors": [{"code": a, "name": COURSES_DATA[a]["name"]} for a in ancestors if a in COURSES_DATA],
            "descendants": [{"code": d, "name": COURSES_DATA[d]["name"]} for d in descendants if d in COURSES_DATA],
            "in_degree": g.in_degree(course_code),
            "out_degree": g.out_degree(course_code)
        }
    })


@app.route("/api/student/register", methods=["POST"])
def register_course():
    payload = request.get_json(silent=True) or {}
    course_code = payload.get("course_code")
    if not course_code:
        return jsonify({"success": False, "error": "course_code is required"}), 400

    success, message = course_mgr.register_course(course_code)
    if not success:
        return jsonify({"success": False, "error": message}), 400

    return jsonify({
        "success": True,
        "message": message,
        "data": get_student_stats()
    })


@app.route("/api/student/drop", methods=["POST"])
def drop_course():
    payload = request.get_json(silent=True) or {}
    course_code = payload.get("course_code")
    if not course_code:
        return jsonify({"success": False, "error": "course_code is required"}), 400

    success, message = course_mgr.drop_course(course_code)
    if not success:
        return jsonify({"success": False, "error": message}), 400

    return jsonify({
        "success": True,
        "message": message,
        "data": get_student_stats()
    })


@app.route("/api/student/toggle-complete", methods=["POST"])
def toggle_completed():
    payload = request.get_json(silent=True) or {}
    course_code = payload.get("course_code")
    if not course_code:
        return jsonify({"success": False, "error": "course_code is required"}), 400

    success, message = course_mgr.toggle_completed_course(course_code)
    if not success:
        return jsonify({"success": False, "error": message}), 400

    return jsonify({
        "success": True,
        "message": message,
        "data": get_student_stats()
    })


@app.route("/api/prerequisites/check/<course_code>", methods=["GET"])
def check_prerequisites(course_code):
    if course_code not in COURSES_DATA:
        return jsonify({"success": False, "error": f"Course '{course_code}' does not exist"}), 404

    student = course_mgr.get_student()
    completed_codes = set(student["completed_courses"])
    g = build_system_graph()

    eval_res = g.check_student_eligibility(course_code, completed_codes)
    course_info = COURSES_DATA[course_code]

    prereqs = course_info["prerequisites"]
    completed_prereqs_info = [
        {"code": p, "name": COURSES_DATA[p]["name"]} for p in prereqs if p in completed_codes and p in COURSES_DATA
    ]
    missing_prereqs_info = [
        {"code": p, "name": COURSES_DATA[p]["name"]} for p in prereqs if p not in completed_codes and p in COURSES_DATA
    ]

    is_already_completed = course_code in completed_codes
    is_registered = course_code in set(student["registered_courses"])

    if is_already_completed:
        message = f"You have already completed {course_code} - {course_info['name']}."
        alert_type = "info"
    elif is_registered:
        message = f"You are currently registered for {course_code} - {course_info['name']}."
        alert_type = "primary"
    elif len(missing_prereqs_info) == 0:
        if len(prereqs) == 0:
            message = f"You are eligible to register for {course_info['name']}. This course has NO prerequisites."
        else:
            message = f"You are eligible to register for {course_info['name']}. All prerequisites satisfied!"
        alert_type = "success"
    else:
        req_names = ", ".join([f"{m['code']} ({m['name']})" for m in missing_prereqs_info])
        message = f"Complete {req_names} before registering for {course_info['name']}."
        alert_type = "warning"

    return jsonify({
        "success": True,
        "course_code": course_code,
        "course_name": course_info["name"],
        "credits": course_info["credits"],
        "is_eligible": eval_res["is_eligible"],
        "status": eval_res["status"],
        "is_already_completed": is_already_completed,
        "is_registered": is_registered,
        "message": message,
        "alert_type": alert_type,
        "completed_prerequisites": completed_prereqs_info,
        "missing_prerequisites": missing_prereqs_info,
        "all_ancestors": sorted(list(g.get_all_ancestors(course_code))),
        "in_degree": g.in_degree(course_code),
        "out_degree": g.out_degree(course_code)
    })


@app.route("/api/graph", methods=["GET"])
def get_graph_data():
    """Returns nodes and edges formatted for Vis.js Network rendering."""
    student = course_mgr.get_student()
    completed = set(student["completed_courses"])
    registered = set(student["registered_courses"])
    g = build_system_graph()

    nodes = []
    edges = []

    # Color palette
    colors = {
        "completed": {
            "background": "#dcfce7", # emerald-100
            "border": "#16a34a",     # emerald-600
            "highlight": {"background": "#bbf7d0", "border": "#15803d"}
        },
        "registered": {
            "background": "#e0e7ff", # indigo-100
            "border": "#4f46e5",     # indigo-600
            "highlight": {"background": "#c7d2fe", "border": "#4338ca"}
        },
        "eligible": {
            "background": "#f0fdf4", # green-50
            "border": "#22c55e",     # green-500
            "highlight": {"background": "#dcfce7", "border": "#16a34a"}
        },
        "locked": {
            "background": "#ffe4e6", # rose-100
            "border": "#e11d48",     # rose-600
            "highlight": {"background": "#fecdd3", "border": "#be123c"}
        }
    }

    for code, data in COURSES_DATA.items():
        prereqs = data["prerequisites"]
        missing = [p for p in prereqs if p not in completed]

        if code in completed:
            st = "completed"
            status_text = "Completed"
        elif code in registered:
            st = "registered"
            status_text = "Registered"
        elif len(missing) == 0:
            st = "eligible"
            status_text = "Eligible to Register"
        else:
            st = "locked"
            status_text = f"Locked ({len(missing)} prereq missing)"

        nodes.append({
            "id": code,
            "label": f"{code}\n{data['name']}",
            "title": f"<b>{code}: {data['name']}</b><br>Credits: {data['credits']}<br>Status: {status_text}<br>Prereqs: {', '.join(prereqs) if prereqs else 'None'}",
            "color": colors[st],
            "status": st,
            "status_text": status_text,
            "level": data["level"],
            "font": {"color": "#0f172a", "face": "Inter, system-ui", "size": 13, "bold": True},
            "shape": "box",
            "margin": 12,
            "borderWidth": 2,
            "shadow": {"enabled": True, "color": "rgba(0,0,0,0.06)", "size": 5, "x": 0, "y": 3}
        })

        for p in prereqs:
            edges.append({
                "from": p,
                "to": code,
                "arrows": "to",
                "color": {"color": "#94a3b8", "highlight": "#4f46e5"},
                "width": 2,
                "smooth": {"type": "cubicBezier", "roundness": 0.3}
            })

    return jsonify({
        "success": True,
        "nodes": nodes,
        "edges": edges
    })


@app.route("/api/sequence", methods=["GET"])
def get_sequence_plan():
    """Generates valid course sequences via Kahn's Topological Sorting algorithm."""
    g = build_system_graph()
    linear_order, is_dag = g.topological_sort_kahn()
    level_schedule = g.level_order_schedule()

    # Detailed linear steps
    linear_steps = []
    for idx, code in enumerate(linear_order, start=1):
        c = COURSES_DATA[code]
        linear_steps.append({
            "step": idx,
            "code": code,
            "name": c["name"],
            "credits": c["credits"],
            "prerequisites": c["prerequisites"],
            "level": c["level"]
        })

    explanation = (
        "This topological ordering satisfies all prerequisite partial order constraints. "
        "Notice that courses at the same stage (such as DBMS and Advanced Algorithms after Data Structures) "
        "are an antichain in the partial order and can be taken in either relative order or simultaneously."
    )

    return jsonify({
        "success": True,
        "is_valid_dag": is_dag,
        "linear_sequence": linear_steps,
        "parallel_stages": level_schedule,
        "discrete_math_explanation": explanation
    })


@app.route("/api/graph/test-cycle", methods=["POST"])
def test_cycle_simulation():
    """
    Academic presentation tool: lets students or professors inject a temporary prerequisite
    to test circular dependency prevention.
    Example: Adding edge C4 -> C1 or C3 -> C1 will create a cycle!
    """
    payload = request.get_json(silent=True) or {}
    source = payload.get("source") # e.g. "C4"
    target = payload.get("target") # e.g. "C1"

    if not source or not target:
        return jsonify({"success": False, "error": "Both 'source' and 'target' course codes required."}), 400

    if source not in COURSES_DATA or target not in COURSES_DATA:
        return jsonify({"success": False, "error": "Both courses must exist in the catalog."}), 400

    if source == target:
        return jsonify({
            "success": False,
            "has_cycle": True,
            "cycle_detected": True,
            "message": f"Self-loop cycle detected: {source} cannot be a prerequisite of itself! (Violates Irreflexivity: ∀x, ¬(x < x)).",
            "cycle_path": [source, source]
        })

    # Build graph with this proposed edge
    g = build_system_graph()
    try:
        g.add_prerequisite(source, target)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 400

    has_cycle, cycle_path = g.detect_cycles()
    topo_order, is_dag = g.topological_sort_kahn()

    if has_cycle or not is_dag:
        path_str = " -> ".join(cycle_path) if cycle_path else f"{source} -> ... -> {target} -> {source}"
        return jsonify({
            "success": False,
            "has_cycle": True,
            "cycle_detected": True,
            "message": (
                f"PREREQUISITE CYCLE DETECTED! Adding edge ({source} -> {target}) forms circular dependency loop: [{path_str}]. "
                f"A student could never graduate because each course waits for the other! Kahn's Topological Sort fails."
            ),
            "cycle_path": cycle_path,
            "discrete_math_rule": "In Discrete Mathematics, prerequisite systems must form a Strict Partial Order / Directed Acyclic Graph (DAG). Circular relations violate the asymmetry and irreflexivity properties."
        })
    else:
        return jsonify({
            "success": True,
            "has_cycle": False,
            "cycle_detected": False,
            "message": f"Safe dependency: Adding ({source} -> {target}) is valid and maintains the Directed Acyclic Graph (DAG) property. No cycles detected.",
            "new_topological_order": topo_order
        })


@app.route("/api/discrete-math/analysis", methods=["GET"])
def get_discrete_math_analysis():
    """Generates detailed discrete mathematics analysis: matrices, sets, relations, posets."""
    g = build_system_graph()
    codes, adj_matrix = g.get_adjacency_matrix()
    _, reach_matrix = g.get_reachability_matrix()

    has_cycle, cycle_path = g.detect_cycles()
    topo_order, is_dag = g.topological_sort_kahn()

    relations = []
    for code, data in COURSES_DATA.items():
        for p in data["prerequisites"]:
            relations.append((p, code))

    degree_table = []
    for code in sorted(COURSES_DATA.keys()):
        degree_table.append({
            "code": code,
            "name": COURSES_DATA[code]["name"],
            "in_degree": g.in_degree(code),
            "out_degree": g.out_degree(code),
            "is_source": g.in_degree(code) == 0,
            "is_sink": g.out_degree(code) == 0
        })

    return jsonify({
        "success": True,
        "vertex_set": codes,
        "total_vertices": len(codes),
        "relation_edges": relations,
        "total_edges": len(relations),
        "adjacency_matrix": {
            "headers": codes,
            "rows": adj_matrix
        },
        "reachability_matrix": {
            "headers": codes,
            "rows": reach_matrix
        },
        "poset_properties": {
            "is_irreflexive": True,
            "is_asymmetric": not has_cycle,
            "is_transitive_closure_dag": is_dag,
            "is_dag": is_dag,
            "has_cycle": has_cycle
        },
        "degree_table": degree_table
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting College Course Registration System on http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
