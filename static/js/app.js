/**
 * College Course Registration and Prerequisite Management System
 * Frontend Application Controller
 * Handles UI State, Vis.js DAG Network, Topological Sort, and REST API calls.
 */

// Global Application State
const state = {
    activeTab: 'dashboard',
    student: null,
    courses: [],
    catalogFilter: 'ALL',
    catalogSearch: '',
    catalogSort: 'code_asc',
    catalogView: 'grid',
    myCoursesSubtab: 'registered',
    network: null,
    networkPhysics: true,
    pendingRegistrationCourse: null
};

// Document Ready Initialization
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initEventListeners();
    refreshAllData();

    // Re-render icons on start
    if (window.lucide) {
        lucide.createIcons();
    }
});

// ==================== CORE API & DATA FETCHING ====================

async function refreshAllData() {
    await fetchStudentInfo();
    await fetchCourses();
    
    // If on active tabs that need specific data, refresh them
    if (state.activeTab === 'graph-visualizer') {
        renderGraph();
    } else if (state.activeTab === 'sequence-planner') {
        fetchSequence();
    } else if (state.activeTab === 'prereq-checker') {
        populateCheckerDropdown();
    } else if (state.activeTab === 'discrete-math') {
        fetchDiscreteMathAnalysis();
    }
}

async function fetchStudentInfo() {
    try {
        const res = await fetch('/api/student');
        const json = await res.json();
        if (json.success) {
            state.student = json.data.student;
            updateDashboardStats(json.data);
            updateProfileUI(json.data.student, json.data);
        }
    } catch (err) {
        console.error('Error fetching student info:', err);
        showToast('Failed to load student profile', 'error');
    }
}

async function fetchCourses() {
    try {
        const res = await fetch('/api/courses');
        const json = await res.json();
        if (json.success) {
            state.courses = json.courses;
            renderCatalog();
            renderDashboardRecommended();
            renderMyCoursesTab();
            populateCheckerDropdown();
        }
    } catch (err) {
        console.error('Error fetching courses:', err);
        showToast('Failed to load course catalog', 'error');
    }
}

// ==================== UI NAVIGATION & TABS ====================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const tabId = item.getAttribute('data-tab');
            switchTab(tabId);
            
            // Close mobile menu if open
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('translate-x-0')) {
                sidebar.classList.remove('translate-x-0');
                sidebar.classList.add('-translate-x-full');
            }
        });
    });

    // Mobile Hamburger button
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const closeMobileBtn = document.getElementById('closeMobileMenuBtn');
    const sidebar = document.getElementById('sidebar');

    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
            sidebar.classList.toggle('translate-x-0');
        });
    }
    if (closeMobileBtn && sidebar) {
        closeMobileBtn.addEventListener('click', () => {
            sidebar.classList.add('-translate-x-full');
            sidebar.classList.remove('translate-x-0');
        });
    }
}

function switchTab(tabId) {
    state.activeTab = tabId;

    // Update nav item active classes
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.getAttribute('data-tab') === tabId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.add('hidden');
    });

    // Show target tab pane
    const targetPane = document.getElementById(`tab-${tabId}`);
    if (targetPane) {
        targetPane.classList.remove('hidden');
    }

    // Lazy load or refresh data when opening specific tab
    if (tabId === 'graph-visualizer') {
        setTimeout(renderGraph, 50);
    } else if (tabId === 'sequence-planner') {
        fetchSequence();
    } else if (tabId === 'prereq-checker') {
        populateCheckerDropdown();
    } else if (tabId === 'discrete-math') {
        fetchDiscreteMathAnalysis();
    } else if (tabId === 'my-courses') {
        renderMyCoursesTab();
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==================== EVENT LISTENERS ====================

function initEventListeners() {
    // Demo persona switch
    const personaSelector = document.getElementById('personaSelector');
    if (personaSelector) {
        personaSelector.addEventListener('change', async (e) => {
            const persona = e.target.value;
            try {
                const res = await fetch('/api/student/persona', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ persona })
                });
                const json = await res.json();
                if (json.success) {
                    showToast(json.message, 'success');
                    await refreshAllData();
                }
            } catch (err) {
                showToast('Failed to switch persona', 'error');
            }
        });
    }

    // Reset demo button
    const resetBtn = document.getElementById('resetDemoBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            try {
                const res = await fetch('/api/student/reset', { method: 'POST' });
                const json = await res.json();
                if (json.success) {
                    showToast('Demo data reset to default!', 'info');
                    if (personaSelector) personaSelector.value = 'sophomore';
                    await refreshAllData();
                }
            } catch (err) {
                showToast('Failed to reset demo data', 'error');
            }
        });
    }

    // Global Search Bar
    const globalSearch = document.getElementById('globalCourseSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', (e) => {
            state.catalogSearch = e.target.value.trim().toLowerCase();
            const catalogInput = document.getElementById('catalogSearchInput');
            if (catalogInput) catalogInput.value = e.target.value;
            renderCatalog();
            if (state.activeTab !== 'catalog' && e.target.value.length > 1) {
                switchTab('catalog');
            }
        });

        // Keyboard shortcut ⌘K / Ctrl+K
        window.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                globalSearch.focus();
            }
        });
    }

    // Catalog Filter & Search inputs
    const catalogSearchInput = document.getElementById('catalogSearchInput');
    if (catalogSearchInput) {
        catalogSearchInput.addEventListener('input', (e) => {
            state.catalogSearch = e.target.value.trim().toLowerCase();
            renderCatalog();
        });
    }

    const catalogStatusFilter = document.getElementById('catalogStatusFilter');
    if (catalogStatusFilter) {
        catalogStatusFilter.addEventListener('change', (e) => {
            state.catalogFilter = e.target.value;
            renderCatalog();
        });
    }

    const catalogSortBy = document.getElementById('catalogSortBy');
    if (catalogSortBy) {
        catalogSortBy.addEventListener('change', (e) => {
            state.catalogSort = e.target.value;
            renderCatalog();
        });
    }

    // Grid vs Table view toggle
    const viewGridBtn = document.getElementById('viewGridBtn');
    const viewTableBtn = document.getElementById('viewTableBtn');
    if (viewGridBtn && viewTableBtn) {
        viewGridBtn.addEventListener('click', () => {
            state.catalogView = 'grid';
            viewGridBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-800 shadow-sm flex items-center gap-1.5 transition-all';
            viewTableBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-all';
            renderCatalog();
        });
        viewTableBtn.addEventListener('click', () => {
            state.catalogView = 'table';
            viewTableBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-800 shadow-sm flex items-center gap-1.5 transition-all';
            viewGridBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-all';
            renderCatalog();
        });
    }

    // Prerequisite Checker run button
    const runCheckBtn = document.getElementById('runCheckBtn');
    if (runCheckBtn) {
        runCheckBtn.addEventListener('click', () => {
            const select = document.getElementById('checkerCourseSelect');
            if (select && select.value) {
                runPrerequisiteCheck(select.value);
            }
        });
    }

    const checkerCourseSelect = document.getElementById('checkerCourseSelect');
    if (checkerCourseSelect) {
        checkerCourseSelect.addEventListener('change', (e) => {
            runPrerequisiteCheck(e.target.value);
        });
    }

    // Generate Sequence Button
    const generateSequenceBtn = document.getElementById('generateSequenceBtn');
    if (generateSequenceBtn) {
        generateSequenceBtn.addEventListener('click', () => {
            fetchSequence();
            showToast('Topological order re-calculated with Kahn\'s algorithm!', 'success');
        });
    }

    // Notification dropdown toggle
    const notificationBtn = document.getElementById('notificationBtn');
    const notificationMenu = document.getElementById('notificationMenu');
    if (notificationBtn && notificationMenu) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationMenu.classList.toggle('hidden');
        });
        document.addEventListener('click', (e) => {
            if (!notificationMenu.contains(e.target) && e.target !== notificationBtn) {
                notificationMenu.classList.add('hidden');
            }
        });
    }

    // Graph Toolbar Buttons
    const graphResetZoomBtn = document.getElementById('graphResetZoomBtn');
    if (graphResetZoomBtn) {
        graphResetZoomBtn.addEventListener('click', () => {
            if (state.network) {
                state.network.fit({ animation: { duration: 500, easingFunction: 'easeInOutQuad' } });
            }
        });
    }

    const graphPhysicsToggleBtn = document.getElementById('graphPhysicsToggleBtn');
    if (graphPhysicsToggleBtn) {
        graphPhysicsToggleBtn.addEventListener('click', () => {
            state.networkPhysics = !state.networkPhysics;
            if (state.network) {
                state.network.setOptions({ physics: { enabled: state.networkPhysics } });
            }
            const statusSpan = document.getElementById('physicsStatusText');
            if (statusSpan) {
                statusSpan.textContent = `Physics: ${state.networkPhysics ? 'On' : 'Off'}`;
            }
        });
    }

    // Test Cycle Simulator button
    const testCycleBtn = document.getElementById('testCycleBtn');
    if (testCycleBtn) {
        testCycleBtn.addEventListener('click', handleTestCycle);
    }

    // Execute Registration in Modal
    const executeRegistrationBtn = document.getElementById('executeRegistrationBtn');
    if (executeRegistrationBtn) {
        executeRegistrationBtn.addEventListener('click', async () => {
            if (state.pendingRegistrationCourse) {
                await executeRegisterCourse(state.pendingRegistrationCourse);
                closeConfirmModal();
            }
        });
    }
}

// ==================== DASHBOARD STATS & PROGRESS ====================

function updateDashboardStats(data) {
    document.getElementById('statTotalCourses').textContent = data.total_courses || 8;
    document.getElementById('statCompletedCourses').textContent = data.completed_count || 0;
    document.getElementById('statCompletedCredits').textContent = `(${data.completed_credits || 0} Credits)`;
    document.getElementById('statEligibleCourses').textContent = data.eligible_count || 0;
    document.getElementById('statBlockedCourses').textContent = data.blocked_count || 0;

    // Progress Bar
    const percent = data.progress_percent || 0;
    const barFill = document.getElementById('progressBarFill');
    if (barFill) {
        barFill.style.width = `${percent}%`;
    }
    const percentBadge = document.getElementById('progressPercentBadge');
    if (percentBadge) {
        percentBadge.textContent = `${percent}%`;
    }
    const creditsText = document.getElementById('progressCreditsText');
    if (creditsText) {
        creditsText.textContent = `${data.completed_credits || 0} / ${data.total_curriculum_credits || 28} Credits`;
    }

    // Nav Badge updates
    const navMyCoursesBadge = document.getElementById('navMyCoursesBadge');
    if (navMyCoursesBadge) {
        navMyCoursesBadge.textContent = `${data.registered_count || 0} Reg`;
    }
}

function updateProfileUI(student, stats) {
    if (!student) return;

    // Welcome banner
    const welcomeName = document.getElementById('dashWelcomeName');
    if (welcomeName) {
        const firstName = student.name.split(' ')[0] || 'Student';
        welcomeName.textContent = firstName;
    }

    // Sidebar Profile
    const sidebarAvatar = document.getElementById('sidebarStudentAvatar');
    const sidebarName = document.getElementById('sidebarStudentName');
    const sidebarRoll = document.getElementById('sidebarStudentRoll');
    if (sidebarAvatar) sidebarAvatar.src = student.avatar;
    if (sidebarName) sidebarName.textContent = student.name;
    if (sidebarRoll) sidebarRoll.textContent = `${student.roll_number} • Sem ${student.semester}`;

    // Top Bar Profile
    const topBarAvatar = document.getElementById('topBarAvatar');
    const topBarName = document.getElementById('topBarName');
    const topBarRole = document.getElementById('topBarRole');
    if (topBarAvatar) topBarAvatar.src = student.avatar;
    if (topBarName) topBarName.textContent = student.name;
    if (topBarRole) topBarRole.textContent = `${student.role.split(' ')[0]} • CSE`;

    // Student Profile Tab
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileRoleBadge = document.getElementById('profileRoleBadge');
    const profileRollDegree = document.getElementById('profileRollDegree');
    const profileEmail = document.getElementById('profileEmail');
    const profileCGPA = document.getElementById('profileCGPA');
    const profileSemester = document.getElementById('profileSemester');
    const profileCreditsEarned = document.getElementById('profileCreditsEarned');

    if (profileAvatar) profileAvatar.src = student.avatar;
    if (profileName) profileName.textContent = student.name;
    if (profileRoleBadge) profileRoleBadge.textContent = student.role;
    if (profileRollDegree) profileRollDegree.textContent = `${student.roll_number} • ${student.degree}`;
    if (profileEmail) profileEmail.textContent = student.email;
    if (profileCGPA) profileCGPA.textContent = `${student.cgpa} / 4.0`;
    if (profileSemester) profileSemester.textContent = `Semester ${student.semester}`;
    if (profileCreditsEarned && stats) {
        profileCreditsEarned.textContent = `${stats.completed_credits || 0} / ${stats.total_curriculum_credits || 28}`;
    }
}

function renderDashboardRecommended() {
    const list = document.getElementById('dashboardRecommendedList');
    if (!list) return;

    // Filter courses that are ELIGIBLE first, then REGISTERED
    const eligibleCourses = state.courses.filter(c => c.status === 'ELIGIBLE');
    const displayCourses = eligibleCourses.length > 0 ? eligibleCourses.slice(0, 3) : state.courses.slice(0, 3);

    if (displayCourses.length === 0) {
        list.innerHTML = `<p class="text-xs text-slate-400 py-3 text-center">No current recommendations available.</p>`;
        return;
    }

    list.innerHTML = displayCourses.map(course => {
        return `
            <div class="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center font-mono font-bold text-slate-800 text-xs shadow-xs">
                        ${course.code}
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h4 class="text-xs font-bold text-slate-900">${course.name}</h4>
                            <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${getBadgeClasses(course.status)}">
                                ${course.status_badge}
                            </span>
                        </div>
                        <p class="text-[11px] text-slate-500 mt-0.5">
                            ${course.credits} Credits • Prerequisites: ${course.prerequisites.length > 0 ? course.prerequisites.join(', ') : 'None (Foundation)'}
                        </p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="openCourseModal('${course.code}')" class="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                        Details
                    </button>
                    ${course.can_register ? `
                        <button onclick="promptRegisterCourse('${course.code}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1">
                            <i data-lucide="plus" class="w-3.5 h-3.5"></i> Register
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==================== COURSE CATALOG RENDERING ====================

function renderCatalog() {
    const gridContainer = document.getElementById('catalogGridContainer');
    const tableContainer = document.getElementById('catalogTableContainer');
    const tableBody = document.getElementById('catalogTableBody');
    const emptyState = document.getElementById('catalogEmptyState');

    // Filter courses
    let filtered = [...state.courses];

    // Status filter
    if (state.catalogFilter !== 'ALL') {
        filtered = filtered.filter(c => c.status === state.catalogFilter);
    }

    // Search query
    if (state.catalogSearch) {
        filtered = filtered.filter(c => 
            c.code.toLowerCase().includes(state.catalogSearch) ||
            c.name.toLowerCase().includes(state.catalogSearch) ||
            c.description.toLowerCase().includes(state.catalogSearch)
        );
    }

    // Sort
    filtered.sort((a, b) => {
        if (state.catalogSort === 'code_asc') return a.code.localeCompare(b.code);
        if (state.catalogSort === 'name_asc') return a.name.localeCompare(b.name);
        if (state.catalogSort === 'credits_desc') return b.credits - a.credits;
        if (state.catalogSort === 'level_asc') return a.level - b.level;
        return 0;
    });

    // Check empty state
    if (filtered.length === 0) {
        if (gridContainer) gridContainer.classList.add('hidden');
        if (tableContainer) tableContainer.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    } else {
        if (emptyState) emptyState.classList.add('hidden');
    }

    if (state.catalogView === 'grid') {
        if (gridContainer) gridContainer.classList.remove('hidden');
        if (tableContainer) tableContainer.classList.add('hidden');
        renderCatalogGrid(filtered, gridContainer);
    } else {
        if (gridContainer) gridContainer.classList.add('hidden');
        if (tableContainer) tableContainer.classList.remove('hidden');
        renderCatalogTable(filtered, tableBody);
    }

    if (window.lucide) {
        lucide.createIcons();
    }
}

function renderCatalogGrid(courses, container) {
    container.innerHTML = courses.map(course => {
        const badgeClass = getBadgeClasses(course.status);
        const prereqText = course.prerequisites.length > 0 
            ? course.prerequisites.join(', ')
            : 'None (Direct Entry)';

        return `
            <div class="course-card-hover bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between relative">
                <div>
                    <!-- Top Row: Code & Eligibility Badge -->
                    <div class="flex items-start justify-between gap-2">
                        <div class="flex items-center space-x-2">
                            <span class="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                                ${course.code}
                            </span>
                            <span class="text-xs font-medium text-slate-500">${course.credits} Credits</span>
                        </div>
                        <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}">
                            ${course.status_badge}
                        </span>
                    </div>

                    <!-- Course Title & Category -->
                    <h3 class="text-base font-bold text-slate-900 mt-3 leading-snug">${course.name}</h3>
                    <p class="text-[11px] text-indigo-600 font-medium mt-0.5">${course.category}</p>

                    <!-- Course Description snippet -->
                    <p class="text-xs text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
                        ${course.description}
                    </p>

                    <!-- Prerequisites Section -->
                    <div class="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                        <div class="flex items-center justify-between text-slate-500">
                            <span class="text-[11px] font-medium flex items-center gap-1">
                                <i data-lucide="git-branch" class="w-3.5 h-3.5 text-slate-400"></i> Prerequisites:
                            </span>
                            <span class="font-mono text-[11px] font-semibold text-slate-700">${prereqText}</span>
                        </div>
                        
                        ${course.missing_prerequisites && course.missing_prerequisites.length > 0 ? `
                            <div class="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium bg-rose-50/70 p-1.5 rounded-lg border border-rose-100">
                                <i data-lucide="alert-circle" class="w-3.5 h-3.5 flex-shrink-0"></i>
                                <span>Missing: ${course.missing_prerequisites.join(', ')}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Action Buttons Footer -->
                <div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button onclick="openCourseModal('${course.code}')" class="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                        <i data-lucide="info" class="w-3.5 h-3.5"></i>
                        <span>View Details</span>
                    </button>

                    ${course.can_register ? `
                        <button onclick="promptRegisterCourse('${course.code}')" class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5">
                            <i data-lucide="check" class="w-3.5 h-3.5"></i>
                            <span>Register</span>
                        </button>
                    ` : ''}

                    ${course.can_drop ? `
                        <button onclick="dropCourse('${course.code}')" class="py-2 px-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-colors">
                            Drop
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function renderCatalogTable(courses, tbody) {
    tbody.innerHTML = courses.map(course => {
        const badgeClass = getBadgeClasses(course.status);
        const prereqText = course.prerequisites.length > 0 
            ? course.prerequisites.join(', ')
            : 'None';

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-5 py-3.5">
                    <div class="flex items-center space-x-3">
                        <span class="w-8 h-8 rounded-lg bg-slate-100 font-mono font-bold text-xs flex items-center justify-center text-slate-800 border border-slate-200">
                            ${course.code}
                        </span>
                        <div>
                            <p class="font-bold text-slate-900">${course.name}</p>
                            <p class="text-[11px] text-slate-500">${course.category}</p>
                        </div>
                    </div>
                </td>
                <td class="px-4 py-3.5 font-medium text-slate-700">
                    ${course.credits} Cr
                </td>
                <td class="px-4 py-3.5 font-mono text-slate-600">
                    ${prereqText}
                </td>
                <td class="px-4 py-3.5">
                    <span class="text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}">
                        ${course.status_badge}
                    </span>
                </td>
                <td class="px-5 py-3.5 text-right space-x-1.5">
                    <button onclick="openCourseModal('${course.code}')" class="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                        Details
                    </button>
                    ${course.can_register ? `
                        <button onclick="promptRegisterCourse('${course.code}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors">
                            Register
                        </button>
                    ` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function getBadgeClasses(status) {
    switch (status) {
        case 'ELIGIBLE':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';
        case 'BLOCKED':
            return 'bg-rose-50 text-rose-700 border-rose-200';
        case 'REGISTERED':
            return 'bg-indigo-50 text-indigo-700 border-indigo-200';
        case 'COMPLETED':
            return 'bg-slate-100 text-slate-700 border-slate-200';
        default:
            return 'bg-amber-50 text-amber-700 border-amber-200';
    }
}

function resetCatalogFilters() {
    state.catalogFilter = 'ALL';
    state.catalogSearch = '';
    const statusSelect = document.getElementById('catalogStatusFilter');
    const searchInput = document.getElementById('catalogSearchInput');
    if (statusSelect) statusSelect.value = 'ALL';
    if (searchInput) searchInput.value = '';
    renderCatalog();
}

// ==================== PREREQUISITE CHECKER ====================

function populateCheckerDropdown() {
    const select = document.getElementById('checkerCourseSelect');
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = state.courses.map(c => {
        return `<option value="${c.code}">${c.code} — ${c.name} (${c.credits} Credits)</option>`;
    }).join('');

    if (currentVal && state.courses.some(c => c.code === currentVal)) {
        select.value = currentVal;
    } else if (state.courses.length > 1) {
        select.value = 'C2'; // Default to Data Structures for clear demonstration!
    }

    if (select.value) {
        runPrerequisiteCheck(select.value);
    }
}

async function runPrerequisiteCheck(courseCode) {
    try {
        const res = await fetch(`/api/prerequisites/check/${courseCode}`);
        const data = await res.json();
        if (!data.success) {
            showToast(data.error || 'Check failed', 'error');
            return;
        }

        // Update Checker Title & Status
        const titleEl = document.getElementById('checkerCourseTitle');
        const badgeEl = document.getElementById('checkerStatusBadge');
        const messageEl = document.getElementById('checkerStatusMessage');
        const bannerBox = document.getElementById('checkerStatusBanner');
        const iconBox = document.getElementById('checkerStatusIconBox');

        titleEl.textContent = `${data.course_name} (${data.course_code})`;
        badgeEl.textContent = data.status;
        messageEl.textContent = data.message;

        // Styling based on alert_type
        if (data.alert_type === 'success') {
            bannerBox.className = 'p-4 md:p-5 rounded-2xl flex items-start space-x-4 border border-emerald-200 bg-emerald-50/70 transition-all';
            iconBox.className = 'w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm';
            iconBox.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i>';
            badgeEl.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300';
        } else if (data.alert_type === 'warning') {
            bannerBox.className = 'p-4 md:p-5 rounded-2xl flex items-start space-x-4 border border-rose-200 bg-rose-50/70 transition-all';
            iconBox.className = 'w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm';
            iconBox.innerHTML = '<i data-lucide="alert-triangle" class="w-5 h-5"></i>';
            badgeEl.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300';
        } else if (data.alert_type === 'primary') {
            bannerBox.className = 'p-4 md:p-5 rounded-2xl flex items-start space-x-4 border border-indigo-200 bg-indigo-50/70 transition-all';
            iconBox.className = 'w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm';
            iconBox.innerHTML = '<i data-lucide="bookmark-check" class="w-5 h-5"></i>';
            badgeEl.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-300';
        } else {
            bannerBox.className = 'p-4 md:p-5 rounded-2xl flex items-start space-x-4 border border-slate-200 bg-slate-50 transition-all';
            iconBox.className = 'w-10 h-10 rounded-xl bg-slate-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm';
            iconBox.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5"></i>';
            badgeEl.className = 'text-xs px-2.5 py-1 rounded-full font-bold bg-slate-100 text-slate-800 border border-slate-300';
        }

        // Satisfied Prerequisites List
        const satList = document.getElementById('checkerSatisfiedList');
        const satCount = document.getElementById('checkerSatisfiedCount');
        satCount.textContent = `${data.completed_prerequisites.length} Completed`;

        if (data.completed_prerequisites.length === 0) {
            satList.innerHTML = `<p class="text-slate-400 italic">None completed or required.</p>`;
        } else {
            satList.innerHTML = data.completed_prerequisites.map(p => `
                <div class="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-100 text-emerald-900 font-medium">
                    <span class="flex items-center gap-1.5">
                        <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-600"></i>
                        <span>${p.code} — ${p.name}</span>
                    </span>
                    <span class="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">Passed</span>
                </div>
            `).join('');
        }

        // Missing Prerequisites List
        const missList = document.getElementById('checkerMissingList');
        const missCount = document.getElementById('checkerMissingCount');
        missCount.textContent = `${data.missing_prerequisites.length} Missing`;

        if (data.missing_prerequisites.length === 0) {
            missList.innerHTML = `<p class="text-emerald-700 font-medium">✓ No missing prerequisites!</p>`;
        } else {
            missList.innerHTML = data.missing_prerequisites.map(p => `
                <div class="flex items-center justify-between p-2 rounded-lg bg-white border border-rose-100 text-rose-900 font-medium">
                    <span class="flex items-center gap-1.5">
                        <i data-lucide="x" class="w-3.5 h-3.5 text-rose-600"></i>
                        <span>${p.code} — ${p.name}</span>
                    </span>
                    <span class="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono font-bold">Required</span>
                </div>
            `).join('');
        }

        // Ancestor Path Chain
        const chainBox = document.getElementById('checkerAncestorChain');
        if (data.all_ancestors && data.all_ancestors.length > 0) {
            const chainHtml = data.all_ancestors.map(a => `
                <span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono text-xs font-bold shadow-xs">
                    ${a}
                </span>
            `).join('<span class="text-slate-400 text-xs">→</span>');
            chainBox.innerHTML = chainHtml + `<span class="text-slate-400 text-xs">→</span><span class="inline-flex items-center px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold shadow-xs">${data.course_code}</span>`;
        } else {
            chainBox.innerHTML = `<span class="text-slate-500 italic text-xs">Root node in DAG (In-degree = 0). No ancestor courses.</span>`;
        }

        // Action Buttons Row
        const actionButtons = document.getElementById('checkerActionButtons');
        if (data.is_eligible) {
            actionButtons.innerHTML = `
                <button onclick="promptRegisterCourse('${data.course_code}')" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i> Register for Course
                </button>
            `;
        } else if (data.is_already_completed) {
            actionButtons.innerHTML = `<span class="text-xs text-slate-500 font-medium">Already completed with passing grade.</span>`;
        } else if (data.is_registered) {
            actionButtons.innerHTML = `
                <button onclick="dropCourse('${data.course_code}')" class="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-colors">
                    Drop Course
                </button>
            `;
        } else {
            actionButtons.innerHTML = `<span class="text-xs text-rose-600 font-medium">Registration blocked until prerequisites are completed.</span>`;
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    } catch (err) {
        console.error('Error running check:', err);
        showToast('Error validating course prerequisites', 'error');
    }
}

// ==================== VIS.JS INTERACTIVE DAG NETWORK ====================

async function renderGraph() {
    const container = document.getElementById('visNetworkContainer');
    if (!container) return;

    try {
        const res = await fetch('/api/graph');
        const json = await res.json();
        if (!json.success) return;

        const nodes = new vis.DataSet(json.nodes);
        const edges = new vis.DataSet(json.edges);

        const data = { nodes, edges };

        const options = {
            layout: {
                hierarchical: {
                    direction: 'UD', // Up to Down directed DAG flow
                    sortMethod: 'directed',
                    levelSeparation: 120,
                    nodeSpacing: 180,
                    treeSpacing: 180,
                    blockShifting: true,
                    edgeMinimization: true
                }
            },
            physics: {
                enabled: state.networkPhysics,
                hierarchicalRepulsion: {
                    nodeDistance: 160
                }
            },
            interaction: {
                hover: true,
                navigationButtons: false,
                keyboard: true,
                zoomView: true
            },
            edges: {
                arrows: {
                    to: { enabled: true, scaleFactor: 1.1 }
                },
                color: {
                    color: '#94a3b8',
                    highlight: '#4f46e5',
                    hover: '#6366f1'
                },
                width: 2.2
            }
        };

        if (state.network) {
            state.network.destroy();
        }

        state.network = new vis.Network(container, data, options);

        // Click Event on Node
        state.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const selectedId = params.nodes[0];
                inspectGraphNode(selectedId);
            }
        });

    } catch (err) {
        console.error('Error rendering graph:', err);
    }
}

function inspectGraphNode(courseCode) {
    const course = state.courses.find(c => c.code === courseCode);
    if (!course) return;

    const nameEl = document.getElementById('inspectorCourseName');
    const codeEl = document.getElementById('inspectorCourseCode');
    const detailsEl = document.getElementById('inspectorDetails');

    nameEl.textContent = course.name;
    codeEl.textContent = `${course.code} • ${course.credits} Credits`;

    const badgeClass = getBadgeClasses(course.status);

    detailsEl.innerHTML = `
        <div class="space-y-3">
            <div>
                <span class="text-[10px] uppercase font-bold text-slate-400">Current Status</span>
                <div class="mt-1">
                    <span class="text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}">
                        ${course.status_badge}
                    </span>
                </div>
            </div>

            <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div class="flex justify-between">
                    <span class="text-slate-500">In-Degree (Prereqs):</span>
                    <span class="font-bold font-mono text-slate-900">${course.in_degree}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-500">Out-Degree (Dependents):</span>
                    <span class="font-bold font-mono text-slate-900">${course.out_degree}</span>
                </div>
            </div>

            <div>
                <span class="text-[10px] uppercase font-bold text-slate-400">Direct Prerequisites</span>
                <p class="text-xs text-slate-700 mt-1 font-medium">
                    ${course.prerequisites.length > 0 ? course.prerequisites.join(', ') : 'None (Foundation Course)'}
                </p>
            </div>

            <div>
                <span class="text-[10px] uppercase font-bold text-slate-400">Courses Unlocked (Dependents)</span>
                <p class="text-xs text-slate-700 mt-1 font-medium">
                    ${course.dependents.length > 0 ? course.dependents.join(', ') : 'None (Capstone course)'}
                </p>
            </div>

            <div class="pt-2">
                <button onclick="openCourseModal('${course.code}')" class="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                    <i data-lucide="info" class="w-3.5 h-3.5"></i> Full Syllabus & Register
                </button>
            </div>
        </div>
    `;

    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==================== SEQUENCE PLANNER (TOPOLOGICAL SORT) ====================

async function fetchSequence() {
    try {
        const res = await fetch('/api/sequence');
        const json = await res.json();
        if (!json.success) return;

        // Render Stage-by-Stage (Parallel / Antichain stages)
        const stageContainer = document.getElementById('sequenceTimelineStages');
        if (stageContainer) {
            stageContainer.innerHTML = json.parallel_stages.map(stage => {
                return `
                    <div class="relative pl-6 pb-6 border-l-2 border-indigo-200 last:border-l-0 last:pb-0">
                        <!-- Step circle dot -->
                        <div class="absolute -left-3 top-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                            ${stage.step}
                        </div>
                        <div class="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <h4 class="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <span>${stage.title}</span>
                                    <span class="text-[11px] font-mono text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                                        ${stage.total_credits} Credits
                                    </span>
                                </h4>
                                <span class="text-xs text-slate-400">${stage.courses.length} Course${stage.courses.length > 1 ? 's' : ''}</span>
                            </div>

                            <p class="text-xs text-slate-600 leading-relaxed italic">
                                ${stage.explanation}
                            </p>

                            <!-- Courses in this stage -->
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                                ${stage.courses.map(c => `
                                    <div class="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between shadow-xs">
                                        <div>
                                            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                                ${c.code}
                                            </span>
                                            <p class="text-xs font-bold text-slate-800 mt-1">${c.name}</p>
                                        </div>
                                        <button onclick="openCourseModal('${c.code}')" class="text-indigo-600 hover:text-indigo-800 text-xs font-semibold p-1">
                                            <i data-lucide="chevron-right" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Render Linear Topological Order List
        const linearList = document.getElementById('sequenceLinearList');
        if (linearList) {
            linearList.innerHTML = json.linear_sequence.map(step => {
                return `
                    <div class="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center space-x-3">
                        <div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                            ${step.step}
                        </div>
                        <div class="min-w-0 flex-1">
                            <span class="text-[10px] font-mono text-indigo-600 font-bold">${step.code}</span>
                            <p class="text-xs font-bold text-slate-800 truncate">${step.name}</p>
                            <span class="text-[10px] text-slate-400 block">${step.credits} Credits</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    } catch (err) {
        console.error('Error fetching sequence:', err);
    }
}

// ==================== MY COURSES TAB ====================

function switchMyCoursesSubtab(subtab) {
    state.myCoursesSubtab = subtab;

    // Subtab button styles
    const btnReg = document.getElementById('myCoursesSubtabRegistered');
    const btnComp = document.getElementById('myCoursesSubtabCompleted');
    const btnRem = document.getElementById('myCoursesSubtabRemaining');

    [btnReg, btnComp, btnRem].forEach(b => {
        b.className = 'px-4 py-2.5 font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-2';
    });

    if (subtab === 'registered') {
        btnReg.className = 'px-4 py-2.5 font-bold text-indigo-600 border-b-2 border-indigo-600 transition-colors flex items-center gap-2';
    } else if (subtab === 'completed') {
        btnComp.className = 'px-4 py-2.5 font-bold text-indigo-600 border-b-2 border-indigo-600 transition-colors flex items-center gap-2';
    } else {
        btnRem.className = 'px-4 py-2.5 font-bold text-indigo-600 border-b-2 border-indigo-600 transition-colors flex items-center gap-2';
    }

    renderMyCoursesTab();
}

function renderMyCoursesTab() {
    const container = document.getElementById('myCoursesContentContainer');
    if (!container || !state.student) return;

    const registeredCodes = new Set(state.student.registered_courses);
    const completedCodes = new Set(state.student.completed_courses);

    const registeredList = state.courses.filter(c => registeredCodes.has(c.code));
    const completedList = state.courses.filter(c => completedCodes.has(c.code));
    const remainingList = state.courses.filter(c => !completedCodes.has(c.code));

    // Update counts on subtabs
    const countReg = document.getElementById('subtabCountRegistered');
    const countComp = document.getElementById('subtabCountCompleted');
    const countRem = document.getElementById('subtabCountRemaining');
    if (countReg) countReg.textContent = registeredList.length;
    if (countComp) countComp.textContent = completedList.length;
    if (countRem) countRem.textContent = remainingList.length;

    let displayList = [];
    let emptyMessage = '';

    if (state.myCoursesSubtab === 'registered') {
        displayList = registeredList;
        emptyMessage = 'You do not have any registered courses for this semester yet. Check the Course Catalog to register for eligible courses.';
    } else if (state.myCoursesSubtab === 'completed') {
        displayList = completedList;
        emptyMessage = 'No completed courses recorded in this persona yet. Toggle courses as completed to test prerequisite unlocking!';
    } else {
        displayList = remainingList;
        emptyMessage = 'Congratulations! All curriculum courses have been completed!';
    }

    if (displayList.length === 0) {
        container.innerHTML = `
            <div class="bg-white rounded-2xl p-10 text-center border border-slate-200/80 shadow-sm">
                <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <i data-lucide="inbox" class="w-5 h-5"></i>
                </div>
                <p class="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">${emptyMessage}</p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    container.innerHTML = displayList.map(course => {
        const isCompleted = completedCodes.has(course.code);
        const isRegistered = registeredCodes.has(course.code);

        return `
            <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div class="flex items-start space-x-4">
                    <div class="w-11 h-11 rounded-xl ${isCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'} font-mono font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                        ${course.code}
                    </div>
                    <div>
                        <div class="flex items-center space-x-2">
                            <h4 class="text-sm font-bold text-slate-900">${course.name}</h4>
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full border ${getBadgeClasses(course.status)}">
                                ${course.status_badge}
                            </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1">
                            ${course.credits} Credits • ${course.category} • Instructor: ${course.instructor}
                        </p>
                        <p class="text-[11px] text-slate-400 mt-0.5">
                            Prerequisites: ${course.prerequisites.length > 0 ? course.prerequisites.join(', ') : 'None'}
                        </p>
                    </div>
                </div>

                <!-- Action Controls: Drop or Toggle Complete for Interactive Demo -->
                <div class="flex items-center space-x-2 self-end md:self-auto">
                    <button onclick="openCourseModal('${course.code}')" class="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors">
                        Details
                    </button>

                    ${isRegistered ? `
                        <button onclick="dropCourse('${course.code}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-colors">
                            Drop
                        </button>
                    ` : ''}

                    <button onclick="toggleCourseCompleted('${course.code}')" class="px-3.5 py-1.5 ${isCompleted ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800' : 'bg-emerald-600 hover:bg-emerald-700 text-white'} border text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5">
                        <i data-lucide="${isCompleted ? 'rotate-ccw' : 'check-circle'}" class="w-3.5 h-3.5"></i>
                        <span>${isCompleted ? 'Mark Incomplete' : 'Mark Passed'}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    if (window.lucide) {
        lucide.createIcons();
    }
}

// ==================== DISCRETE MATH LAB & CYCLE DETECTOR ====================

async function fetchDiscreteMathAnalysis() {
    try {
        const res = await fetch('/api/discrete-math/analysis');
        const json = await res.json();
        if (!json.success) return;

        // Render Adjacency Matrix
        renderMatrixTable('adjacencyMatrixContainer', json.adjacency_matrix);

        // Render Reachability Matrix (Warshall's algorithm)
        renderMatrixTable('reachabilityMatrixContainer', json.reachability_matrix);

        // Render Degree Table
        const tbody = document.getElementById('degreeTableBody');
        if (tbody) {
            tbody.innerHTML = json.degree_table.map(row => {
                let role = '<span class="text-slate-600">Intermediate Node</span>';
                if (row.is_source) {
                    role = '<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">Source (In-degree 0)</span>';
                } else if (row.is_sink) {
                    role = '<span class="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-200">Sink (Out-degree 0)</span>';
                }

                return `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                        <td class="px-4 py-3 font-mono font-bold text-slate-800">${row.code}</td>
                        <td class="px-4 py-3 font-medium text-slate-900">${row.name}</td>
                        <td class="px-4 py-3 font-mono text-slate-700">${row.in_degree}</td>
                        <td class="px-4 py-3 font-mono text-slate-700">${row.out_degree}</td>
                        <td class="px-4 py-3 text-xs">${role}</td>
                    </tr>
                `;
            }).join('');
        }

    } catch (err) {
        console.error('Error fetching math analysis:', err);
    }
}

function renderMatrixTable(containerId, matrixData) {
    const container = document.getElementById(containerId);
    if (!container || !matrixData) return;

    const headers = matrixData.headers;
    const rows = matrixData.rows;

    let html = `<table class="math-matrix-table text-xs w-full">`;
    html += `<thead><tr><th></th>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    html += `<tbody>`;

    for (let i = 0; i < headers.length; i++) {
        html += `<tr><th>${headers[i]}</th>`;
        for (let j = 0; j < headers.length; j++) {
            const val = rows[i][j];
            const cls = val === 1 ? 'cell-one' : 'cell-zero';
            html += `<td class="${cls}">${val}</td>`;
        }
        html += `</tr>`;
    }

    html += `</tbody></table>`;
    container.innerHTML = html;
}

async function handleTestCycle() {
    const source = document.getElementById('cycleSourceSelect').value;
    const target = document.getElementById('cycleTargetSelect').value;
    const alertBox = document.getElementById('cycleSimulationAlert');

    try {
        const res = await fetch('/api/graph/test-cycle', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source, target })
        });
        const json = await res.json();

        alertBox.classList.remove('hidden');

        if (json.has_cycle || json.cycle_detected) {
            alertBox.className = 'p-4 rounded-xl text-xs leading-relaxed transition-all bg-rose-500/20 border border-rose-400 text-rose-200';
            alertBox.innerHTML = `
                <div class="flex items-start space-x-3">
                    <i data-lucide="alert-octagon" class="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5"></i>
                    <div>
                        <strong class="font-bold text-white uppercase tracking-wider block text-xs">Axiom Violation: Cycle Detected!</strong>
                        <p class="mt-1">${json.message}</p>
                        ${json.discrete_math_rule ? `<p class="mt-2 text-rose-300 font-mono text-[11px]">${json.discrete_math_rule}</p>` : ''}
                    </div>
                </div>
            `;
            showToast('Circular Dependency Blocked!', 'error');
        } else {
            alertBox.className = 'p-4 rounded-xl text-xs leading-relaxed transition-all bg-emerald-500/20 border border-emerald-400 text-emerald-200';
            alertBox.innerHTML = `
                <div class="flex items-start space-x-3">
                    <i data-lucide="check-circle" class="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5"></i>
                    <div>
                        <strong class="font-bold text-white uppercase tracking-wider block text-xs">Valid Prerequisite Edge</strong>
                        <p class="mt-1">${json.message}</p>
                    </div>
                </div>
            `;
            showToast('Dependency maintains DAG property!', 'success');
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    } catch (err) {
        showToast('Error testing cycle simulation', 'error');
    }
}

// ==================== ACTIONS: REGISTER & DROP COURSES ====================

function promptRegisterCourse(courseCode) {
    const course = state.courses.find(c => c.code === courseCode);
    if (!course) return;

    if (!course.can_register) {
        showToast(`Cannot register: Prerequisites not satisfied for ${course.name}.`, 'warning');
        return;
    }

    state.pendingRegistrationCourse = courseCode;
    const confirmModalText = document.getElementById('confirmModalText');
    if (confirmModalText) {
        confirmModalText.innerHTML = `
            Are you sure you want to register for <strong class="text-slate-900">${course.code} — ${course.name}</strong> (${course.credits} Credits)?
            <br><span class="text-emerald-600 font-medium mt-1 inline-block">✓ All prerequisite requirements verified.</span>
        `;
    }

    const modal = document.getElementById('registrationConfirmModal');
    if (modal) modal.classList.remove('hidden');
}

function closeConfirmModal() {
    const modal = document.getElementById('registrationConfirmModal');
    if (modal) modal.classList.add('hidden');
    state.pendingRegistrationCourse = null;
}

async function executeRegisterCourse(courseCode) {
    try {
        const res = await fetch('/api/student/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: courseCode })
        });
        const json = await res.json();
        if (json.success) {
            showToast(json.message, 'success');
            // Confetti celebration!
            if (window.confetti) {
                confetti({
                    particleCount: 80,
                    spread: 60,
                    origin: { y: 0.6 }
                });
            }
            await refreshAllData();
            closeCourseModal();
        } else {
            showToast(json.error || 'Registration failed', 'error');
        }
    } catch (err) {
        showToast('Network error while registering', 'error');
    }
}

async function dropCourse(courseCode) {
    if (!confirm(`Are you sure you want to drop ${courseCode}?`)) return;

    try {
        const res = await fetch('/api/student/drop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: courseCode })
        });
        const json = await res.json();
        if (json.success) {
            showToast(json.message, 'info');
            await refreshAllData();
            closeCourseModal();
        } else {
            showToast(json.error || 'Drop failed', 'error');
        }
    } catch (err) {
        showToast('Error dropping course', 'error');
    }
}

async function toggleCourseCompleted(courseCode) {
    try {
        const res = await fetch('/api/student/toggle-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_code: courseCode })
        });
        const json = await res.json();
        if (json.success) {
            showToast(json.message, 'success');
            await refreshAllData();
        } else {
            showToast(json.error || 'Toggle failed', 'error');
        }
    } catch (err) {
        showToast('Error toggling course status', 'error');
    }
}

// ==================== COURSE DETAILS MODAL ====================

async function openCourseModal(courseCode) {
    try {
        const res = await fetch(`/api/courses/${courseCode}`);
        const json = await res.json();
        if (!json.success) return;

        const c = json.course;

        document.getElementById('modalCourseCode').textContent = c.code;
        document.getElementById('modalCourseName').textContent = c.name;
        document.getElementById('modalCourseCredits').textContent = `${c.credits} Credits`;
        document.getElementById('modalCourseDept').textContent = c.department;
        document.getElementById('modalCourseDesc').textContent = c.description;
        document.getElementById('modalCourseInstructor').textContent = c.instructor;
        document.getElementById('modalCourseCategory').textContent = c.category;

        // Status Badge
        const badgeEl = document.getElementById('modalCourseStatusBadge');
        badgeEl.className = `text-xs font-bold px-2.5 py-0.5 rounded-full border ${getBadgeClasses(c.status)}`;
        badgeEl.textContent = c.status === 'ELIGIBLE' ? 'Eligible' : (c.status === 'COMPLETED' ? 'Completed' : (c.status === 'REGISTERED' ? 'Registered' : 'Prereq Required'));

        // Topics Syllabus
        const topicsList = document.getElementById('modalCourseTopics');
        if (c.topics && c.topics.length > 0) {
            topicsList.innerHTML = c.topics.map(t => `<li>${t}</li>`).join('');
        } else {
            topicsList.innerHTML = `<li>Foundational syllabus modules</li>`;
        }

        // Prerequisites Breakdown
        const prereqList = document.getElementById('modalPrereqList');
        if (c.prerequisites_info && c.prerequisites_info.length > 0) {
            prereqList.innerHTML = c.prerequisites_info.map(p => `
                <div class="flex items-center justify-between p-2 rounded-lg ${p.completed ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}">
                    <span class="flex items-center gap-1.5 font-medium ${p.completed ? 'text-emerald-900' : 'text-rose-900'}">
                        <i data-lucide="${p.completed ? 'check-circle' : 'alert-circle'}" class="w-4 h-4 ${p.completed ? 'text-emerald-600' : 'text-rose-600'}"></i>
                        <span>${p.code} — ${p.name}</span>
                    </span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${p.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                        ${p.completed ? 'Satisfied' : 'Pending'}
                    </span>
                </div>
            `).join('');
        } else {
            prereqList.innerHTML = `<p class="text-slate-500 italic">None. This is an introductory course with zero prerequisites.</p>`;
        }

        // Action button in footer
        const footerActions = document.getElementById('modalFooterActions');
        if (c.is_eligible) {
            footerActions.innerHTML = `
                <button onclick="promptRegisterCourse('${c.code}')" class="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i> Register Now
                </button>
            `;
        } else if (c.is_registered) {
            footerActions.innerHTML = `
                <button onclick="dropCourse('${c.code}')" class="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl transition-colors">
                    Drop Course
                </button>
            `;
        } else if (c.is_completed) {
            footerActions.innerHTML = `
                <span class="text-xs text-slate-500 font-medium">Course already completed</span>
            `;
        } else {
            footerActions.innerHTML = `
                <button disabled class="px-4 py-2 bg-slate-200 text-slate-400 text-xs font-semibold rounded-xl cursor-not-allowed">
                    Prerequisite Required
                </button>
            `;
        }

        const modal = document.getElementById('courseDetailsModal');
        if (modal) modal.classList.remove('hidden');

        if (window.lucide) {
            lucide.createIcons();
        }
    } catch (err) {
        console.error('Error opening course modal:', err);
    }
}

function closeCourseModal() {
    const modal = document.getElementById('courseDetailsModal');
    if (modal) modal.classList.add('hidden');
}

// ==================== TOAST NOTIFICATIONS ====================

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200';

    if (type === 'success') {
        toast.className += ' bg-slate-900 text-white border-slate-700';
        toast.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 flex-shrink-0"></i><span>${message}</span>`;
    } else if (type === 'error') {
        toast.className += ' bg-rose-900 text-white border-rose-700';
        toast.innerHTML = `<i data-lucide="alert-octagon" class="w-4 h-4 text-rose-300 flex-shrink-0"></i><span>${message}</span>`;
    } else if (type === 'warning') {
        toast.className += ' bg-amber-900 text-white border-amber-700';
        toast.innerHTML = `<i data-lucide="alert-triangle" class="w-4 h-4 text-amber-300 flex-shrink-0"></i><span>${message}</span>`;
    } else {
        toast.className += ' bg-slate-800 text-white border-slate-700';
        toast.innerHTML = `<i data-lucide="info" class="w-4 h-4 text-indigo-400 flex-shrink-0"></i><span>${message}</span>`;
    }

    container.appendChild(toast);
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
