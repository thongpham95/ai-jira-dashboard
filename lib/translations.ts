// Translations for Vietnamese and English

export type Language = 'vi' | 'en';

export const translations = {
    vi: {
        // Common
        common: {
            loading: 'Đang tải...',
            error: 'Lỗi',
            save: 'Lưu',
            cancel: 'Hủy',
            search: 'Tìm kiếm',
            all: 'Tất cả',
            filter: 'Lọc',
            refresh: 'Làm mới',
            back: 'Quay lại',
            viewDetails: 'Xem chi tiết',
            viewReport: 'Xem báo cáo',
            clearFilter: 'Xóa bộ lọc',
        },

        // Navigation
        nav: {
            dashboard: 'Tổng quan',
            projects: 'Dự án',
            resources: 'Nhân sự',
            performance: 'Hiệu suất',
            activeTasks: 'Công việc',
            reports: 'Báo cáo',
            settings: 'Cài đặt',
        },

        // Header
        header: {
            searchPlaceholder: 'Tìm kiếm công việc, dự án hoặc JQL...',
            toggleTheme: 'Chuyển đổi giao diện',
            light: 'Sáng',
            dark: 'Tối',
            system: 'Hệ thống',
            language: 'Ngôn ngữ',
            login: 'Đăng nhập',
            logout: 'Đăng xuất',
            loginWithJira: 'Đăng nhập với Jira',
        },

        // Dashboard
        dashboard: {
            title: 'Tổng quan',
            selectProject: 'Chọn dự án',
            allProjects: 'Tất cả dự án (Tổng quan)',
            activeProjects: 'Dự án đang hoạt động',
            projectsFromJira: 'Dự án từ Jira',
            openIssues: 'Công việc mở',
            unresolvedIssues: 'Công việc chưa giải quyết',
            criticalBugs: 'Lỗi nghiêm trọng',
            highPriorityBugs: 'Bug ưu tiên cao chưa xử lý',
            weeklyHours: 'Giờ làm tuần này',
            totalWeeklyHours: 'Tổng giờ ghi nhận trong tuần',
            loadError: 'Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.',
            activeTasks: 'Công việc Đang thực hiện',
            issuesInProgress: 'công việc đang xử lý',
            noActiveTasks: 'Hiện không có công việc nào đang xử lý.',
        },

        // Projects
        projects: {
            title: 'Dự án',
            description: 'Danh sách các dự án từ Jira',
            noProjects: 'Không có dự án nào',
            currentSprint: 'Sprint hiện tại',
            totalIssues: 'Tổng công việc',
            bugs: 'Lỗi',
            totalHours: 'Tổng giờ',
            statusDistribution: 'Phân bổ trạng thái',
            teamWorkload: 'Khối lượng nhóm',
            filterByStatus: 'Lọc theo trạng thái',
            tasks: 'Công việc',
            noSprint: 'Không có Sprint',
        },

        // Resources
        resources: {
            title: 'Nhân sự',
            description: 'Danh sách thành viên trong dự án',
            allProjects: 'Tất cả dự án',
            noMembers: 'Không có thành viên nào',
            name: 'Họ và tên',
            email: 'Email',
            avatar: 'Ảnh đại diện',
            actions: 'Hành động',
        },

        // Member Report
        memberReport: {
            title: 'Báo cáo thành viên',
            backToResources: 'Quay lại Nhân sự',
            totalHoursLogged: 'Tổng giờ ghi nhận',
            avgTimePerTask: 'Thời gian TB mỗi việc',
            bugFixTime: 'Thời gian sửa lỗi',
            punctuality: 'Đúng hạn',
            tasksCompleted: 'Việc hoàn thành',
            assignedTasks: 'Công việc được giao',
            weeklyCompletions: 'Hoàn thành trong tuần',
            weeklyHours: 'Giờ làm trong tuần',
            performanceRadar: 'Biểu đồ hiệu suất',
        },

        // Search
        search: {
            title: 'Tìm kiếm',
            placeholder: 'Nhập truy vấn JQL...',
            searchButton: 'Tìm kiếm',
            noResults: 'Không có kết quả',
            results: 'Kết quả',
            enterQuery: 'Nhập truy vấn JQL để tìm kiếm',
        },

        // Settings
        settings: {
            title: 'Cài đặt',
            description: 'Vui lòng đăng nhập để xem bảng điều khiển và báo cáo của bạn.',

            // Appearance
            appearance: 'Giao diện',
            appearanceDesc: 'Tùy chỉnh giao diện của bảng điều khiển.',
            light: 'Sáng',
            dark: 'Tối',
            system: 'Hệ thống',

            // Language
            language: 'Ngôn ngữ',
            languageDesc: 'Chọn ngôn ngữ hiển thị cho ứng dụng.',
            vietnamese: 'Tiếng Việt',
            english: 'Tiếng Anh',
        },

        // Tables
        table: {
            id: 'Mã',
            type: 'Loại',
            summary: 'Tóm tắt',
            status: 'Trạng thái',
            priority: 'Ưu tiên',
            assignee: 'Người thực hiện',
            epic: 'Epic',
            logged: 'Đã ghi',
            noData: 'Không có dữ liệu',
        },

        // Charts
        charts: {
            workload: 'Khối lượng công việc',
            recentActivity: 'Hoạt động gần đây',
            noActivity: 'Không có hoạt động gần đây',
            hours: 'giờ',
            completion: 'Hoàn thành',
            efficiency: 'Hiệu quả',
            quality: 'Chất lượng',
            speed: 'Tốc độ',
            consistency: 'Ổn định',
        },

        // Sidebar
        sidebar: {
            user: 'Người dùng',
            projectManager: 'Quản lý DA',
        },

        // Active Tasks
        activeTasks: {
            title: 'Công việc Đang thực hiện',
            description: 'Xem tổng quan công việc đang được xử lý theo thời gian thực',
            pageTitle: 'Tổng quan Công việc Đang thực hiện',
            totalActive: 'Tổng đang thực hiện',
            overdue: 'Quá hạn',
            highPriority: 'Ưu tiên cao',
            avgTimeInStatus: 'TB thời gian trong trạng thái',
            hours: 'giờ',
            byStatus: 'Theo trạng thái',
            byPriority: 'Theo độ ưu tiên',
            byProject: 'Theo dự án',
            byAssignee: 'Theo người thực hiện',
            filterByUser: 'Lọc theo người dùng',
            filterByProject: 'Lọc theo dự án',
            allUsers: 'Tất cả người dùng',
            allProjects: 'Tất cả dự án',
            noTasks: 'Không có công việc nào đang thực hiện',
            lastUpdated: 'Cập nhật lần cuối',
            timeInStatus: 'Trong trạng thái',
            generateAIReview: 'Tạo báo cáo AI',
            aiReviewTitle: 'Đánh giá Công việc bằng AI',
            generating: 'Đang phân tích...',
            tasks: 'công việc',
            refreshData: 'Làm mới dữ liệu',
            autoRefresh: 'Tự động làm mới',
            viewAll: 'Xem tất cả',
        },

        // Advanced Reporting
        reporting: {
            timeRange: 'Khoảng thời gian',
            today: 'Hôm nay',
            yesterday: 'Hôm qua',
            lastWeek: '7 ngày qua',
            lastMonth: '30 ngày qua',
            lastQuarter: '90 ngày qua',
            custom: 'Tùy chỉnh',
            apply: 'Áp dụng',
            teamComparison: 'So sánh Nhóm',
            teamComparisonDesc: 'So sánh hiệu suất giữa các thành viên',
            exportReport: 'Xuất báo cáo',
            exportCSV: 'Xuất CSV (Excel)',
            exportPDF: 'Xuất PDF',
            print: 'In báo cáo',
            avgIssues: 'TB Issues',
            avgHours: 'TB Giờ',
            avgCycle: 'TB Cycle',
            avgQuality: 'TB Chất lượng',
            issuesCompleted: 'Issues hoàn thành',
            hoursLogged: 'Giờ ghi nhận',
            cycleTime: 'Cycle Time',
            qualityScore: 'Điểm chất lượng',
            barChart: 'Biểu đồ cột',
            radar: 'Radar',
            selectMetric: 'Chọn metric',
            noTeamData: 'Không có dữ liệu nhóm',
            summary: 'Tổng kết',
            generatedAt: 'Ngày tạo',
            autoGenerated: 'Báo cáo được tạo tự động',
        },
    },

    en: {
        // Common
        common: {
            loading: 'Loading...',
            error: 'Error',
            save: 'Save',
            cancel: 'Cancel',
            search: 'Search',
            all: 'All',
            filter: 'Filter',
            refresh: 'Refresh',
            back: 'Back',
            viewDetails: 'View Details',
            viewReport: 'View Report',
            clearFilter: 'Clear Filter',
        },

        // Navigation
        nav: {
            dashboard: 'Dashboard',
            projects: 'Projects',
            resources: 'Resources',
            performance: 'Performance',
            activeTasks: 'Active Tasks',
            reports: 'Reports',
            settings: 'Settings',
        },

        // Header
        header: {
            searchPlaceholder: 'Search tasks, projects or JQL...',
            toggleTheme: 'Toggle theme',
            light: 'Light',
            dark: 'Dark',
            system: 'System',
            language: 'Language',
            login: 'Login',
            logout: 'Logout',
            loginWithJira: 'Login with Jira',
        },

        // Dashboard
        dashboard: {
            title: 'Dashboard',
            selectProject: 'Select project',
            allProjects: 'All Projects (Overview)',
            activeProjects: 'Active Projects',
            projectsFromJira: 'Projects from Jira',
            openIssues: 'Open Issues',
            unresolvedIssues: 'Unresolved issues',
            criticalBugs: 'Critical Bugs',
            highPriorityBugs: 'High priority unresolved bugs',
            weeklyHours: 'Weekly Hours',
            totalWeeklyHours: 'Total hours logged this week',
            loadError: 'Failed to load data. Please check your connection.',
            activeTasks: 'Real-time Active Tasks',
            issuesInProgress: 'issues currently in progress',
            noActiveTasks: 'No tasks currently in progress.',
        },

        // Projects
        projects: {
            title: 'Projects',
            description: 'List of projects from Jira',
            noProjects: 'No projects found',
            currentSprint: 'Current Sprint',
            totalIssues: 'Total Issues',
            bugs: 'Bugs',
            totalHours: 'Total Hours',
            statusDistribution: 'Status Distribution',
            teamWorkload: 'Team Workload',
            filterByStatus: 'Filter by Status',
            tasks: 'Tasks',
            noSprint: 'No Sprint',
        },

        // Resources
        resources: {
            title: 'Resources',
            description: 'Team members in the project',
            allProjects: 'All Projects',
            noMembers: 'No members found',
            name: 'Name',
            email: 'Email',
            avatar: 'Avatar',
            actions: 'Actions',
        },

        // Member Report
        memberReport: {
            title: 'Member Report',
            backToResources: 'Back to Resources',
            totalHoursLogged: 'Total Hours Logged',
            avgTimePerTask: 'Avg Time per Task',
            bugFixTime: 'Bug Fix Time',
            punctuality: 'Punctuality',
            tasksCompleted: 'Tasks Completed',
            assignedTasks: 'Assigned Tasks',
            weeklyCompletions: 'Weekly Completions',
            weeklyHours: 'Weekly Hours',
            performanceRadar: 'Performance Radar',
        },

        // Search
        search: {
            title: 'Search',
            placeholder: 'Enter JQL query...',
            searchButton: 'Search',
            noResults: 'No results found',
            results: 'Results',
            enterQuery: 'Enter a JQL query to search',
        },

        // Settings
        settings: {
            title: 'Settings',
            description: 'Please login to view your dashboard and reports.',

            // Appearance
            appearance: 'Appearance',
            appearanceDesc: 'Customize the look and feel of the dashboard.',
            light: 'Light',
            dark: 'Dark',
            system: 'System',

            // Language
            language: 'Language',
            languageDesc: 'Choose the display language for the application.',
            vietnamese: 'Vietnamese',
            english: 'English',
        },

        // Tables
        table: {
            id: 'ID',
            type: 'Type',
            summary: 'Summary',
            status: 'Status',
            priority: 'Priority',
            assignee: 'Assignee',
            epic: 'Epic',
            logged: 'Logged',
            noData: 'No data',
        },

        // Charts
        charts: {
            workload: 'Workload',
            recentActivity: 'Recent Activity',
            noActivity: 'No recent activity',
            hours: 'hours',
            completion: 'Completion',
            efficiency: 'Efficiency',
            quality: 'Quality',
            speed: 'Speed',
            consistency: 'Consistency',
        },

        // Sidebar
        sidebar: {
            user: 'User',
            projectManager: 'Project Manager',
        },

        // Active Tasks
        activeTasks: {
            title: 'Active Tasks',
            description: 'Real-time overview of tasks currently in progress',
            pageTitle: 'Active Tasks Overview',
            totalActive: 'Total Active',
            overdue: 'Overdue',
            highPriority: 'High Priority',
            avgTimeInStatus: 'Avg Time in Status',
            hours: 'hours',
            byStatus: 'By Status',
            byPriority: 'By Priority',
            byProject: 'By Project',
            byAssignee: 'By Assignee',
            filterByUser: 'Filter by user',
            filterByProject: 'Filter by project',
            allUsers: 'All users',
            allProjects: 'All projects',
            noTasks: 'No tasks currently in progress',
            lastUpdated: 'Last updated',
            timeInStatus: 'In status',
            generateAIReview: 'Generate AI Review',
            aiReviewTitle: 'AI Task Review',
            generating: 'Analyzing...',
            tasks: 'tasks',
            refreshData: 'Refresh data',
            autoRefresh: 'Auto refresh',
            viewAll: 'View all',
        },

        // Advanced Reporting
        reporting: {
            timeRange: 'Time Range',
            today: 'Today',
            yesterday: 'Yesterday',
            lastWeek: 'Last 7 days',
            lastMonth: 'Last 30 days',
            lastQuarter: 'Last 90 days',
            custom: 'Custom',
            apply: 'Apply',
            teamComparison: 'Team Comparison',
            teamComparisonDesc: 'Compare performance across team members',
            exportReport: 'Export',
            exportCSV: 'Export CSV (Excel)',
            exportPDF: 'Export PDF',
            print: 'Print',
            avgIssues: 'Avg Issues',
            avgHours: 'Avg Hours',
            avgCycle: 'Avg Cycle',
            avgQuality: 'Avg Quality',
            issuesCompleted: 'Issues Completed',
            hoursLogged: 'Hours Logged',
            cycleTime: 'Cycle Time',
            qualityScore: 'Quality Score',
            barChart: 'Bar Chart',
            radar: 'Radar',
            selectMetric: 'Select metric',
            noTeamData: 'No team data available',
            summary: 'Summary',
            generatedAt: 'Generated',
            autoGenerated: 'Auto-generated report',
        },
    },
} as const;

export type Translations = typeof translations.vi;

// Helper function to get nested translation key
export function getTranslation(lang: Language, key: string): string {
    const keys = key.split('.');
    let result: any = translations[lang];

    for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
            result = result[k];
        } else {
            return key; // Return key if translation not found
        }
    }

    return typeof result === 'string' ? result : key;
}
