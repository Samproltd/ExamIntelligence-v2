// Role-based redirect utility
export const getDashboardPath = (role: string): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'college_admin':
      return '/college-admin';
    case 'college_staff':
      return '/college-staff';
    case 'student':
      return '/student';
    default:
      return '/login';
  }
};

export const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'System Administrator';
    case 'college_admin':
      return 'College Administrator';
    case 'college_staff':
      return 'College Staff';
    case 'student':
      return 'Student';
    default:
      return 'User';
  }
};

export const getRolePermissions = (role: string): string[] => {
  switch (role) {
    case 'admin':
      return [
        'manage_colleges',
        'manage_subscription_plans',
        'manage_college_staff',
        'view_all_data',
        'manage_system_settings',
        'view_security_incidents',
        'manage_exam_suspensions'
      ];
    case 'college_admin':
      return [
        'manage_students',
        'create_exams',
        'manage_courses',
        'manage_subjects',
        'manage_batches',
        'view_results',
        'manage_college_settings'
      ];
    case 'college_staff':
      return [
        'view_students',
        'view_exams',
        'view_courses',
        'view_subjects',
        'view_batches',
        'view_results'
      ];
    case 'student':
      return [
        'take_exams',
        'view_results',
        'view_certificates',
        'manage_profile'
      ];
    default:
      return [];
  }
};

export const hasPermission = (userRole: string, requiredPermission: string): boolean => {
  const permissions = getRolePermissions(userRole);
  return permissions.includes(requiredPermission);
};

export const canAccessRoute = (userRole: string, route: string): boolean => {
  // Define route access rules
  const routePermissions: { [key: string]: string[] } = {
    '/admin': ['admin'],
    '/admin/colleges': ['admin'],
    '/admin/subscription-plans': ['admin'],
    '/admin/college-staff': ['admin'],
    '/college-admin': ['college_admin'],
    '/college-admin/students': ['college_admin'],
    '/college-admin/exams': ['college_admin'],
    '/college-admin/courses': ['college_admin'],
    '/college-admin/subjects': ['college_admin'],
    '/college-admin/batches': ['college_admin'],
    '/college-admin/results': ['college_admin'],
    '/college-staff': ['college_staff'],
    '/college-staff/students': ['college_staff'],
    '/college-staff/exams': ['college_staff'],
    '/college-staff/courses': ['college_staff'],
    '/college-staff/subjects': ['college_staff'],
    '/college-staff/batches': ['college_staff'],
    '/college-staff/results': ['college_staff'],
    '/student': ['student'],
    '/student/exams': ['student'],
    '/student/results': ['student'],
    '/student/certificates': ['student'],
    '/student/profile': ['student'],
  };

  const allowedRoles = routePermissions[route];
  if (!allowedRoles) {
    return true; // Allow access to routes not defined in permissions
  }

  return allowedRoles.includes(userRole);
};
