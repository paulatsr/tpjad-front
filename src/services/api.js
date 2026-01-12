// API Base URL
const API_BASE_URL = 'http://localhost:8080';

// Helper function to get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  // Only add Content-Type for requests that have a body
  if (options.body !== undefined && options.body !== null) {
    headers['Content-Type'] = 'application/json';
  }

  // Always add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle text/plain responses (like login token or error messages)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/plain')) {
      const text = await response.text();
      if (!response.ok) {
        // For login endpoint, return the error message from backend
        if (endpoint.includes('/auth/login')) {
          throw new Error(text || 'Invalid credentials');
        }
        throw new Error(text || 'Request failed');
      }
      return text;
    }

    // Handle 401 Unauthorized for non-login endpoints
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Clear token if it exists but is invalid
      if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw new Error('Unauthorized - Please login');
    }

    // Handle JSON responses
    // For DELETE requests (204 No Content or 200 with empty body), return null
    if (options.method === 'DELETE' && (response.status === 204 || response.status === 200)) {
      const text = await response.text().catch(() => '');
      if (!text || text.trim() === '') {
        return null;
      }
      // If there's content, try to parse it
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    }
    
    let data;
    try {
      const text = await response.text();
      if (!text || text.trim() === '') {
        // Empty response is valid for some endpoints
        if (response.ok) {
          return null;
        }
        throw new Error(`Error: ${response.status}`);
      }
      data = JSON.parse(text);
    } catch (jsonError) {
      // If response is not JSON (e.g., "Unauthorized" text), handle it
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      throw jsonError;
    }
    
    if (!response.ok) {
      throw new Error(data?.message || data?.error || `Error: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    // Only log non-401 errors to avoid console spam
    if (!error.message.includes('Unauthorized') && !error.message.includes('Invalid credentials')) {
      console.error('API Error:', error);
    }
    throw error;
  }
};

// ==================== AUTH API ====================
export const authAPI = {
  login: async (username, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },
};

// ==================== USERS API ====================
export const usersAPI = {
  register: async (userData) => {
    return apiRequest('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  registerWithCode: async (userData) => {
    return apiRequest('/users/register-code', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

// ==================== STUDENTS API ====================
export const studentsAPI = {
  getAll: async () => {
    return apiRequest('/students');
  },
  
  getById: async (id) => {
    return apiRequest(`/students/${id}`);
  },
  
  getByUserId: async (userId) => {
    return apiRequest(`/students/user/${userId}`);
  },
  
  getByParentId: async (parentId) => {
    return apiRequest(`/students/parent/${parentId}`);
  },
  
  getByClassroom: async (classroomId) => {
    return apiRequest(`/students/classroom/${classroomId}`);
  },
  
  getNumberOfStudentsByClassroom: async (classroomId) => {
    return apiRequest(`/students/classroom/${classroomId}/count`);
  },
  
  create: async (studentData) => {
    return apiRequest('/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    });
  },
  
  update: async (id, studentData) => {
    return apiRequest(`/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/students/${id}`, {
      method: 'DELETE',
    });
  },
  
  generateRegCode: async () => {
    return apiRequest('/students/generateRegCode');
  },
};

// ==================== TEACHERS API ====================
export const teachersAPI = {
  getAll: async () => {
    return apiRequest('/teachers');
  },
  
  getById: async (id) => {
    return apiRequest(`/teachers/${id}`);
  },
  
  getByUserId: async (userId) => {
    return apiRequest(`/teachers/user/${userId}`);
  },
  
  create: async (teacherData) => {
    return apiRequest('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    });
  },
  
  update: async (id, teacherData) => {
    return apiRequest(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacherData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/teachers/${id}`, {
      method: 'DELETE',
    });
  },
  
  generateRegCode: async () => {
    return apiRequest('/teachers/generateRegCode');
  },
};

// ==================== PARENTS API ====================
export const parentsAPI = {
  getAll: async () => {
    return apiRequest('/parents');
  },
  
  getById: async (id) => {
    return apiRequest(`/parents/${id}`);
  },
  
  getByUserId: async (userId) => {
    return apiRequest(`/parents/user/${userId}`);
  },
  
  getByStudent: async (studentId) => {
    return apiRequest(`/parents/student/${studentId}`);
  },

  getByClassroom: async (classroomId) => {
    return apiRequest(`/parents/classroom/${classroomId}`);
  },
  
  create: async (parentData) => {
    return apiRequest('/parents', {
      method: 'POST',
      body: JSON.stringify(parentData),
    });
  },
  
  update: async (id, parentData) => {
    return apiRequest(`/parents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(parentData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/parents/${id}`, {
      method: 'DELETE',
    });
  },
  
  generateRegCode: async () => {
    return apiRequest('/parents/generateRegCode');
  },
};

// ==================== CLASSROOMS API ====================
export const classroomsAPI = {
  getAll: async () => {
    return apiRequest('/classrooms');
  },
  
  getById: async (id) => {
    return apiRequest(`/classrooms/${id}`);
  },
  
  getByHomeroomTeacher: async (teacherId) => {
    return apiRequest(`/classrooms/teacher/${teacherId}`);
  },
  
  getHomeroomTeacher: async (classroomId) => {
    return apiRequest(`/classrooms/${classroomId}/homeroom-teacher`);
  },
  
  create: async (classroomData) => {
    return apiRequest('/classrooms', {
      method: 'POST',
      body: JSON.stringify(classroomData),
    });
  },
  
  update: async (id, classroomData) => {
    return apiRequest(`/classrooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classroomData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/classrooms/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== COURSES API ====================
export const coursesAPI = {
  getAll: async () => {
    return apiRequest('/courses');
  },
  
  getById: async (id) => {
    return apiRequest(`/courses/${id}`);
  },
  
  create: async (courseData) => {
    return apiRequest('/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  },
  
  update: async (id, courseData) => {
    return apiRequest(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/courses/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== CLASS-COURSES API ====================
export const classCoursesAPI = {
  getAll: async () => {
    return apiRequest('/class-courses');
  },
  
  getById: async (id) => {
    return apiRequest(`/class-courses/${id}`);
  },
  
  getByClassroom: async (classroomId) => {
    return apiRequest(`/class-courses/classroom/${classroomId}`);
  },
  
  getByTeacher: async (teacherId) => {
    return apiRequest(`/class-courses/teacher/${teacherId}`);
  },
  
  create: async (classCourseData) => {
    return apiRequest('/class-courses', {
      method: 'POST',
      body: JSON.stringify(classCourseData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/class-courses/${id}`, {
      method: 'DELETE',
    });
  },
};

// ==================== GRADES API ====================
export const gradesAPI = {
  create: async (gradeData) => {
    return apiRequest('/api/grades', {
      method: 'POST',
      body: JSON.stringify(gradeData),
    });
  },
  
  getById: async (id) => {
    return apiRequest(`/api/grades/${id}`);
  },
  
  update: async (id, gradeData) => {
    return apiRequest(`/api/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gradeData),
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/api/grades/${id}`, {
      method: 'DELETE',
    });
  },
  
  bulkCreate: async (bulkData) => {
    return apiRequest('/api/grades/bulk', {
      method: 'POST',
      body: JSON.stringify(bulkData),
    });
  },
  
  getByStudent: async (studentId) => {
    return apiRequest(`/api/grades/student/${studentId}`);
  },
  
  getByCourse: async (classCourseId) => {
    return apiRequest(`/api/grades/course/${classCourseId}`);
  },
};

// ==================== ABSENCES API ====================
export const absencesAPI = {
  create: async (absenceData) => {
    return apiRequest('/api/absences', {
      method: 'POST',
      body: JSON.stringify(absenceData),
    });
  },
  
  getById: async (id) => {
    return apiRequest(`/api/absences/${id}`);
  },
  
  update: async (id, date, excused) => {
    return apiRequest(`/api/absences/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ date, excused }),
    });
  },
  
  toggleExcused: async (id) => {
    return apiRequest(`/api/absences/${id}/toggle-excused`, {
      method: 'PATCH',
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/api/absences/${id}`, {
      method: 'DELETE',
    });
  },
  
  getByCourse: async (classCourseId) => {
    return apiRequest(`/api/absences/course/${classCourseId}`);
  },
  
  getTotalByStudent: async (studentId) => {
    return apiRequest(`/api/absences/student/${studentId}/total`);
  },
  
  getUnexcusedByStudent: async (studentId) => {
    return apiRequest(`/api/absences/student/${studentId}/unexcused`);
  },
};

// ==================== ABSENCE-GRADES API ====================
export const absenceGradesAPI = {
  getByStudent: async (studentId) => {
    return apiRequest(`/api/absence-grades/student/${studentId}`);
  },
  
  getByStudentAndCourse: async (studentId, classCourseId) => {
    return apiRequest(`/api/absence-grades/student/${studentId}/course/${classCourseId}`);
  },
  
  getByCourse: async (classCourseId) => {
    return apiRequest(`/api/absence-grades/course/${classCourseId}`);
  },
  
  getByClassroom: async (classroomId) => {
    return apiRequest(`/api/absence-grades/classroom/${classroomId}`);
  },
};

// ==================== EXPORT API ====================
export const exportAPI = {
  exportParentsByHomeroomTeacher: async (teacherId) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/export/parents/homeroom-teacher/${teacherId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const contentDisposition = response.headers.get('content-disposition');
    const fileName = contentDisposition ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') : 'Parents registration_codes.xlsx';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  exportStudentsByHomeroomTeacher: async (teacherId) => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/export/students/homeroom-teacher/${teacherId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const contentDisposition = response.headers.get('content-disposition');
    const fileName = contentDisposition ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') : 'Students registration_codes.xlsx';
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  exportTeachers: async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/export/teachers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Teachers.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// ==================== CATALOG API ====================
export const catalogAPI = {
  getClassroomCatalog: async (classroomId) => {
    return apiRequest(`/api/catalog/classroom/${classroomId}`);
  },
  
  getCourseCatalog: async (classroomId, classCourseId) => {
    return apiRequest(`/api/catalog/classroom/${classroomId}/course/${classCourseId}`);
  },
};

