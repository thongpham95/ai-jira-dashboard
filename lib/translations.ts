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

            // Connection
            jiraConnection: 'Kết nối Jira',
            connectionStatus: 'Trạng thái kết nối API Jira của bạn.',
            checkConnection: 'Kiểm tra kết nối',
            connected: 'Đã kết nối',
            disconnected: 'Mất kết nối',
            jiraHost: 'Jira Host',
            email: 'Email',
            apiToken: 'API Token',
            credentialsNote: 'Để cập nhật thông tin đăng nhập, chỉnh sửa tệp',
            restartNote: 'trong thư mục gốc dự án và khởi động lại máy chủ.',

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

            // Connection
            jiraConnection: 'Jira Connection',
            connectionStatus: 'Status of your connection to the Jira API.',
            checkConnection: 'Check Connection',
            connected: 'Connected',
            disconnected: 'Disconnected',
            jiraHost: 'Jira Host',
            email: 'Email',
            apiToken: 'API Token',
            credentialsNote: 'To update credentials, edit the',
            restartNote: 'file in your project root and restart the server.',

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
