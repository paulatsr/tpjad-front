import { createContext, useContext, useState, useEffect } from "react";
import {
  studentsAPI,
  teachersAPI,
  parentsAPI,
  classroomsAPI,
  coursesAPI,
  classCoursesAPI,
  gradesAPI,
  absencesAPI,
  catalogAPI,
} from "../services/api";

const SchoolContext = createContext();

export function SchoolProvider({ children }) {
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classCourses, setClassCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data only if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadInitialData();
    } else {
      // If no token, set empty data and stop loading
      setClassrooms([]);
      setStudents([]);
      setTeachers([]);
      setParents([]);
      setCourses([]);
      setClassCourses([]);
      setLoading(false);
    }
  }, []);

  const loadInitialData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Don't load data if user is not authenticated
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Load data based on user role/permissions
      // Silently catch 401 errors (user not authenticated)
      const [classroomsData, studentsData, teachersData, parentsData, coursesData, classCoursesData] = await Promise.all([
        classroomsAPI.getAll().catch(err => {
          if (err.message.includes('Unauthorized')) return [];
          throw err;
        }),
        studentsAPI.getAll().catch(err => {
          if (err.message.includes('Unauthorized')) return [];
          throw err;
        }),
        teachersAPI.getAll().catch(err => {
          if (err.message.includes('Unauthorized')) return [];
          throw err;
        }),
        parentsAPI.getAll().catch(err => {
          if (err.message.includes('Unauthorized')) return [];
          throw err;
        }),
        coursesAPI.getAll().catch(err => {
          if (err.message.includes('Unauthorized')) return [];
          throw err;
        }),
        classCoursesAPI.getAll().catch(err => {
          if (err.message.includes('Unauthorized')) return [];
          throw err;
        }),
      ]);

      setClassrooms(classroomsData || []);
      setStudents(studentsData || []);
      setTeachers(teachersData || []);
      setParents(parentsData || []);
      setCourses(coursesData || []);
      setClassCourses(classCoursesData || []);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ==================== CLASSROOMS ====================
  const getClassroomsWithCounts = () => {
    return classrooms.map(cls => ({
      ...cls,
      studentsCount: students.filter(s => s.classroomId === cls.id).length,
    }));
  };

  const getClassDetails = async (classId) => {
    try {
      const classroom = await classroomsAPI.getById(classId);
      const classStudents = await studentsAPI.getByClassroom(classId);
      return { ...classroom, students: classStudents || [] };
    } catch (err) {
      console.error('Error loading class details:', err);
      return null;
    }
  };

  const addClassroom = async (classroomData) => {
    try {
      const newClassroom = await classroomsAPI.create(classroomData);
      setClassrooms([...classrooms, newClassroom]);
      return { success: true, data: newClassroom };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateClassroom = async (id, classroomData) => {
    try {
      const updated = await classroomsAPI.update(id, classroomData);
      setClassrooms(classrooms.map(c => c.id === id ? updated : c));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteClassroom = async (id) => {
    try {
      await classroomsAPI.delete(id);
      setClassrooms(classrooms.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==================== STUDENTS ====================
  const addStudent = async (studentData) => {
    try {
      const newStudent = await studentsAPI.create(studentData);
      setStudents([...students, newStudent]);
      return { success: true, data: newStudent };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateStudent = async (id, studentData) => {
    try {
      const updated = await studentsAPI.update(id, studentData);
      setStudents(students.map(s => s.id === id ? updated : s));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteStudent = async (id) => {
    try {
      await studentsAPI.delete(id);
      setStudents(students.filter(s => s.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==================== TEACHERS ====================
  const addTeacher = async (teacherData) => {
    try {
      const newTeacher = await teachersAPI.create(teacherData);
      setTeachers([...teachers, newTeacher]);
      return { success: true, data: newTeacher };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateTeacher = async (id, teacherData) => {
    try {
      const updated = await teachersAPI.update(id, teacherData);
      setTeachers(teachers.map(t => t.id === id ? updated : t));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteTeacher = async (id) => {
    try {
      await teachersAPI.delete(id);
      setTeachers(teachers.filter(t => t.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==================== PARENTS ====================
  const addParent = async (parentData) => {
    try {
      const newParent = await parentsAPI.create(parentData);
      setParents([...parents, newParent]);
      return { success: true, data: newParent };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateParent = async (id, parentData) => {
    try {
      const updated = await parentsAPI.update(id, parentData);
      setParents(parents.map(p => p.id === id ? updated : p));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteParent = async (id) => {
    try {
      await parentsAPI.delete(id);
      setParents(parents.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==================== CLASS-COURSES ====================
  const addClassCourse = async (classCourseData) => {
    try {
      const newClassCourse = await classCoursesAPI.create(classCourseData);
      setClassCourses([...classCourses, newClassCourse]);
      return { success: true, data: newClassCourse };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteClassCourse = async (id) => {
    try {
      await classCoursesAPI.delete(id);
      setClassCourses(classCourses.filter(cc => cc.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==================== GRADES ====================
  const addGrade = async (gradeData) => {
    try {
      const newGrade = await gradesAPI.create(gradeData);
      await loadInitialData(); // Reload to get updated data
      return { success: true, data: newGrade };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateGrade = async (id, gradeData) => {
    try {
      const updated = await gradesAPI.update(id, gradeData);
      await loadInitialData();
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteGrade = async (id) => {
    try {
      await gradesAPI.delete(id);
      await loadInitialData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const bulkCreateGrades = async (bulkData) => {
    try {
      await gradesAPI.bulkCreate(bulkData);
      await loadInitialData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==================== ABSENCES ====================
  const addAbsence = async (absenceData) => {
    try {
      const newAbsence = await absencesAPI.create(absenceData);
      await loadInitialData();
      return { success: true, data: newAbsence };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateAbsence = async (id, date, excused) => {
    try {
      const updated = await absencesAPI.update(id, date, excused);
      await loadInitialData();
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteAbsence = async (id) => {
    try {
      await absencesAPI.delete(id);
      await loadInitialData();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==================== CATALOG ====================
  const getClassroomCatalog = async (classroomId) => {
    try {
      return await catalogAPI.getClassroomCatalog(classroomId);
    } catch (err) {
      console.error('Error loading classroom catalog:', err);
      return null;
    }
  };

  const getCourseCatalog = async (classroomId, classCourseId) => {
    try {
      return await catalogAPI.getCourseCatalog(classroomId, classCourseId);
    } catch (err) {
      console.error('Error loading course catalog:', err);
      return null;
    }
  };

  // Helper functions for user display
  const roleToDisplayName = (role, username) => {
    switch (role) {
      case "ADMIN":
        return "Director";
      case "TEACHER":
        return `Prof. ${username}`;
      case "STUDENT":
        return `Elev ${username}`;
      case "PARENT":
        return `Părinte ${username}`;
      default:
        return username;
    }
  };

  const roleToAvatar = (role) => {
    switch (role) {
      case "ADMIN":
        return "👨‍💼";
      case "TEACHER":
        return "👨‍🏫";
      case "STUDENT":
        return "🎓";
      case "PARENT":
        return "👨‍👩‍👧";
      default:
        return "👤";
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        // Create user object with display name based on role
        const displayName = roleToDisplayName(parsed.role, parsed.username);
        setUser({
          name: displayName,
          role: parsed.role,
          username: parsed.username,
          avatar: roleToAvatar(parsed.role),
        });
      } catch (e) {
        console.error('Error loading user from localStorage:', e);
      }
    }
  }, []);

  const login = (roleOrUser) => {
    // Support both demo mode (string role) and real login (user object)
    if (typeof roleOrUser === "string") {
      // Demo mode
      if (roleOrUser === "ADMIN") {
        const userObj = { name: "Director Ionescu", role: "ADMIN", avatar: "👨‍💼" };
        setUser(userObj);
        localStorage.setItem('schoolUser', JSON.stringify(userObj));
      } else if (roleOrUser === "TEACHER") {
        const userObj = { name: "Prof. Popescu", role: "TEACHER", avatar: "👨‍🏫" };
        setUser(userObj);
        localStorage.setItem('schoolUser', JSON.stringify(userObj));
      } else if (roleOrUser === "STUDENT") {
        const userObj = { name: "Elev Andrei", role: "STUDENT", avatar: "🎓" };
        setUser(userObj);
        localStorage.setItem('schoolUser', JSON.stringify(userObj));
      }
    } else {
      // Real login - user object from AuthContext
      const userObj = {
        name: roleToDisplayName(roleOrUser.role, roleOrUser.username),
        role: roleOrUser.role,
        username: roleOrUser.username,
        avatar: roleToAvatar(roleOrUser.role),
      };
      setUser(userObj);
      localStorage.setItem('schoolUser', JSON.stringify(userObj));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('schoolUser');
  };

  return (
    <SchoolContext.Provider
      value={{
        // User
        user,
        login,
        logout,
        loading,
        error,

        // Classrooms
        classrooms: getClassroomsWithCounts(),
        getClassDetails,
        addClassroom,
        updateClassroom,
        deleteClassroom,

        // Students
        students: students.map(s => {
          const cls = classrooms.find(c => c.id === s.classroomId);
          return { ...s, class: cls ? cls.name : "Unassigned" };
        }),
        addStudent,
        updateStudent,
        deleteStudent,

        // Teachers
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,

        // Parents
        parents,
        addParent,
        updateParent,
        deleteParent,

        // Courses
        courses,
        addCourse: async (courseData) => {
          try {
            const newCourse = await coursesAPI.create(courseData);
            setCourses([...courses, newCourse]);
            return { success: true, data: newCourse };
          } catch (err) {
            return { success: false, error: err.message };
          }
        },
        updateCourse: async (id, courseData) => {
          try {
            const updated = await coursesAPI.update(id, courseData);
            setCourses(courses.map(c => c.id === id ? updated : c));
            return { success: true, data: updated };
          } catch (err) {
            return { success: false, error: err.message };
          }
        },
        deleteCourse: async (id) => {
          try {
            await coursesAPI.delete(id);
            setCourses(courses.filter(c => c.id !== id));
            return { success: true };
          } catch (err) {
            return { success: false, error: err.message };
          }
        },

        // Class-Courses
        classCourses,
        addClassCourse,
        deleteClassCourse,

        // Grades
        addGrade,
        updateGrade,
        deleteGrade,
        bulkCreateGrades,

        // Absences
        addAbsence,
        updateAbsence,
        deleteAbsence,

        // Catalog
        getClassroomCatalog,
        getCourseCatalog,

        // Refresh
        refreshData: loadInitialData,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export const useSchool = () => useContext(SchoolContext);
