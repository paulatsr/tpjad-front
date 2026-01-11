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
    'Content-Type': 'application/json',
    ...options.headers,
  };

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
    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      // If response is not JSON (e.g., "Unauthorized" text), handle it
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || `Error: ${response.status}`);
      }
      throw jsonError;
    }
    
    if (!response.ok) {
      throw new Error(data.message || `Error: ${response.status}`);
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
};

// ==================== STUDENTS API ====================
export const studentsAPI = {
  getAll: async () => {
    return apiRequest('/students');
  },
  
  getById: async (id) => {
    return apiRequest(`/students/${id}`);
  },
  
  getByClassroom: async (classroomId) => {
    return apiRequest(`/students/classroom/${classroomId}`);
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
};

// ==================== TEACHERS API ====================
export const teachersAPI = {
  getAll: async () => {
    return apiRequest('/teachers');
  },
  
  getById: async (id) => {
    return apiRequest(`/teachers/${id}`);
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
};

// ==================== PARENTS API ====================
export const parentsAPI = {
  getAll: async () => {
    return apiRequest('/parents');
  },
  
  getById: async (id) => {
    return apiRequest(`/parents/${id}`);
  },
  
  getByStudent: async (studentId) => {
    return apiRequest(`/parents/student/${studentId}`);
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
};

// ==================== CLASSROOMS API ====================
export const classroomsAPI = {
  getAll: async () => {
    return apiRequest('/classrooms');
  },
  
  getById: async (id) => {
    return apiRequest(`/classrooms/${id}`);
  },
  
  getByTeacher: async (teacherId) => {
    return apiRequest(`/classrooms/teacher/${teacherId}`);
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
    return apiRequest(`/api/absences/${id}?date=${date}&excused=${excused}`, {
      method: 'PUT',
    });
  },
  
  delete: async (id) => {
    return apiRequest(`/api/absences/${id}`, {
      method: 'DELETE',
    });
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

