import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  studentsAPI,
  teachersAPI,
  parentsAPI,
  classroomsAPI,
  coursesAPI,
  classCoursesAPI,
  gradesAPI,
  absencesAPI,
  absenceGradesAPI,
  catalogAPI,
} from "../services/api";

const SchoolContext = createContext();

// Helper function to decode JWT token
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export function SchoolProvider({ children }) {
  const { user: authUser, logout: authLogout } = useAuth();
  const [user, setUser] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [parents, setParents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classCourses, setClassCourses] = useState([]);
  const [studentGradesAndAbsences, setStudentGradesAndAbsences] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial data only if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        loadInitialData(parsed.role, parsed.userId);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    } else {
      setClassrooms([]);
      setStudents([]);
      setTeachers([]);
      setParents([]);
      setCourses([]);
      setClassCourses([]);
      setLoading(false);
    }
  }, [authUser]);

  const loadInitialData = async (role, userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('[SchoolContext] Loading data for role:', role, 'userId:', userId);

      if (role === 'ADMIN') {
        // ADMIN can access all data
        const [classroomsData, studentsData, teachersData, parentsData, coursesData, classCoursesData] = await Promise.all([
          classroomsAPI.getAll().catch(() => []),
          studentsAPI.getAll().catch(() => []),
          teachersAPI.getAll().catch(() => []),
          parentsAPI.getAll().catch(() => []),
          coursesAPI.getAll().catch(() => []),
          classCoursesAPI.getAll().catch(() => []),
        ]);

        setClassrooms(classroomsData || []);
        setStudents(studentsData || []);
        setTeachers(teachersData || []);
        setParents(parentsData || []);
        setCourses(coursesData || []);
        setClassCourses(classCoursesData || []);
        setStudentGradesAndAbsences(null);
      } else if (role === 'STUDENT') {
        // STUDENT: Get student by userId, then load their grades and absences
        // getByStudent returns all courses with grades and absences for this student
        const currentStudent = await studentsAPI.getByUserId(userId).catch(() => null);
        
        if (currentStudent) {
          const studentId = currentStudent.id;
          const classroomId = currentStudent.classroomId;
          
          // Load classroom and grades/absences (which contains all courses for this student)
          const [classroomsData, gradesAndAbsencesData] = await Promise.all([
            classroomId ? classroomsAPI.getById(classroomId).then(c => [c]).catch(() => []) : Promise.resolve([]),
            absenceGradesAPI.getByStudent(studentId).catch(() => null),
          ]);

          setStudents([currentStudent]);
          setClassrooms(classroomsData);
          setStudentGradesAndAbsences(gradesAndAbsencesData);
          
          // Extract ClassCourses and Courses from gradesByCourse
          if (gradesAndAbsencesData && gradesAndAbsencesData.gradesByCourse && gradesAndAbsencesData.gradesByCourse.length > 0) {
            // Get all ClassCourse IDs from gradesByCourse
            const classCourseIds = gradesAndAbsencesData.gradesByCourse.map(cg => cg.classCourseId);
            
            // Fetch complete ClassCourse objects for each ID
            const classCoursesPromises = classCourseIds.map(id => 
              classCoursesAPI.getById(id).catch(() => null)
            );
            const classCoursesData = (await Promise.all(classCoursesPromises)).filter(cc => cc !== null);
            
            setClassCourses(classCoursesData);
            
            // Extract unique courses from ClassCourses
            const uniqueCoursesMap = new Map();
            classCoursesData.forEach(cc => {
              if (cc.course && !uniqueCoursesMap.has(cc.course.id)) {
                uniqueCoursesMap.set(cc.course.id, cc.course);
              }
            });
            setCourses(Array.from(uniqueCoursesMap.values()));
          } else {
            setClassCourses([]);
            setCourses([]);
          }
        } else {
          setStudents([]);
          setClassrooms([]);
          setCourses([]);
          setClassCourses([]);
          setStudentGradesAndAbsences(null);
        }
        setTeachers([]);
        setParents([]);
      } else if (role === 'TEACHER') {
        // TEACHER: Get teacher by userId, then load their data
        const currentTeacher = await teachersAPI.getByUserId(userId).catch(() => null);
        
        if (currentTeacher) {
          const teacherId = currentTeacher.id;
          const [classCoursesData, coursesData] = await Promise.all([
            classCoursesAPI.getByTeacher(teacherId).catch(() => []),
            coursesAPI.getAll().catch(() => []), // Teachers can see all courses
          ]);

          // Extract unique classroom IDs from class courses
          const uniqueClassroomIds = [...new Set(
            (classCoursesData || [])
              .map(cc => cc.classroomId || cc.classroom?.id)
              .filter(id => id != null)
          )];

          // Get classrooms by ID for each unique classroom ID
          const classroomsPromises = uniqueClassroomIds.map(id => 
            classroomsAPI.getById(id).catch(() => null)
          );
          const classroomsData = (await Promise.all(classroomsPromises))
            .filter(c => c != null);

          // Get homeroom classroom if exists (separate from class courses classrooms)
          const homeroomClassroom = await classroomsAPI.getByHomeroomTeacher(teacherId).catch(() => null);
          
          // Combine classrooms: homeroom classroom (if exists and not already in list) + classrooms from class courses
          let allClassrooms = [...classroomsData];
          if (homeroomClassroom && !classroomsData.find(c => c.id === homeroomClassroom.id)) {
            allClassrooms = [homeroomClassroom, ...classroomsData];
          }

          setTeachers([currentTeacher]);
          setClassrooms(allClassrooms);
          setClassCourses(classCoursesData || []);
          setCourses(coursesData || []);

          // Load students and parents for teacher's classrooms
          const studentsPromises = allClassrooms.map(classroom => 
            studentsAPI.getByClassroom(classroom.id).catch(() => [])
          );
          const studentsArrays = await Promise.all(studentsPromises);
          const studentsData = studentsArrays.flat();

          // Get all parents for teacher's classrooms using the new API
          const parentsPromises = allClassrooms.map(classroom => 
            parentsAPI.getByClassroom(classroom.id).catch(() => [])
          );
          const parentsArrays = await Promise.all(parentsPromises);
          const parentsData = parentsArrays.flat();

          setStudents(studentsData);
          setParents(parentsData);
        } else {
          setTeachers([]);
          setClassrooms([]);
          setClassCourses([]);
          setCourses([]);
          setStudents([]);
          setParents([]);
        }
        setStudentGradesAndAbsences(null);
      } else if (role === 'PARENT') {
        // PARENT: Get parent by userId, then get student by parent ID (like student does)
        const currentParent = await parentsAPI.getByUserId(userId).catch(() => null);
        
        if (currentParent && currentParent.id) {
          // Get student by parent ID (same pattern as student)
          const student = await studentsAPI.getByParentId(currentParent.id).catch(() => null);
          
          if (student) {
            const classroomId = student.classroomId;
            
            // Load classroom and grades/absences (which contains all courses for this student)
            const [classroomsData, gradesAndAbsencesData] = await Promise.all([
              classroomId ? classroomsAPI.getById(classroomId).then(c => [c]).catch(() => []) : Promise.resolve([]),
              absenceGradesAPI.getByStudent(student.id).catch(() => null),
            ]);

            setParents([currentParent]);
            setStudents([student]);
            setClassrooms(classroomsData);
            setStudentGradesAndAbsences(gradesAndAbsencesData);
            
            // Extract ClassCourses and Courses from gradesByCourse
            if (gradesAndAbsencesData && gradesAndAbsencesData.gradesByCourse && gradesAndAbsencesData.gradesByCourse.length > 0) {
              // Get all ClassCourse IDs from gradesByCourse
              const classCourseIds = gradesAndAbsencesData.gradesByCourse.map(cg => cg.classCourseId);
              
              // Fetch complete ClassCourse objects for each ID
              const classCoursesPromises = classCourseIds.map(id => 
                classCoursesAPI.getById(id).catch(() => null)
              );
              const classCoursesData = (await Promise.all(classCoursesPromises)).filter(cc => cc !== null);
              
              setClassCourses(classCoursesData);
              
              // Extract unique courses from ClassCourses
              const uniqueCoursesMap = new Map();
              classCoursesData.forEach(cc => {
                if (cc.course && !uniqueCoursesMap.has(cc.course.id)) {
                  uniqueCoursesMap.set(cc.course.id, cc.course);
                }
              });
              setCourses(Array.from(uniqueCoursesMap.values()));
            } else {
              setClassCourses([]);
              setCourses([]);
            }
          } else {
            setParents([currentParent]);
            setStudents([]);
            setClassrooms([]);
            setCourses([]);
            setClassCourses([]);
            setStudentGradesAndAbsences(null);
          }
        } else {
          setParents(currentParent ? [currentParent] : []);
          setStudents([]);
          setClassrooms([]);
          setCourses([]);
          setClassCourses([]);
          setStudentGradesAndAbsences(null);
        }
        setTeachers([]);
      }

      console.log('[SchoolContext] Data loaded successfully');
    } catch (err) {
      console.error('[SchoolContext] Error loading initial data:', err);
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
      const classStudents = await studentsAPI.getByClassroom(classId).catch(() => []);
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

  // ==================== COURSES ====================
  const addCourse = async (courseData) => {
    try {
      const newCourse = await coursesAPI.create(courseData);
      setCourses([...courses, newCourse]);
      return { success: true, data: newCourse };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const updateCourse = async (id, courseData) => {
    try {
      const updated = await coursesAPI.update(id, courseData);
      setCourses(courses.map(c => c.id === id ? updated : c));
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const deleteCourse = async (id) => {
    try {
      await coursesAPI.delete(id);
      setCourses(courses.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // ==================== CLASS COURSES ====================
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

  // Helper functions for user display
  const roleToDisplayName = (role, username) => {
    switch (role) {
      case "ADMIN":
        return "Principal";
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
          userId: parsed.userId,
          avatar: roleToAvatar(parsed.role),
        });
      } catch (e) {
        console.error('Error loading user from localStorage:', e);
      }
    }
  }, []);

  // Update user name with firstName and lastName after data is loaded
  useEffect(() => {
    if (user && user.userId && !loading) {
      let fullName = null;
      
      if (user.role === "TEACHER" && teachers.length > 0) {
        // Find teacher by matching user.id from teacher.user
        const teacher = teachers.find(t => t.user?.id === user.userId);
        if (teacher && teacher.firstName && teacher.lastName) {
          fullName = `${teacher.firstName} ${teacher.lastName}`;
        }
      } else if (user.role === "STUDENT" && students.length > 0) {
        // Find student by matching user.id from student.user
        const student = students.find(s => s.user?.id === user.userId);
        if (student && student.firstName && student.lastName) {
          fullName = `${student.firstName} ${student.lastName}`;
        }
      } else if (user.role === "PARENT" && parents.length > 0) {
        // Find parent by matching user.id from parent.user
        const parent = parents.find(p => p.user?.id === user.userId);
        if (parent && parent.firstName && parent.lastName) {
          fullName = `${parent.firstName} ${parent.lastName}`;
        }
      }
      
      if (fullName && user.name !== fullName) {
        setUser(prev => ({
          ...prev,
          name: fullName
        }));
        // Update localStorage as well
        const userData = localStorage.getItem('user');
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            const schoolUser = {
              name: fullName,
              role: parsed.role,
              username: parsed.username,
              userId: parsed.userId,
              avatar: roleToAvatar(parsed.role),
            };
            localStorage.setItem('schoolUser', JSON.stringify(schoolUser));
          } catch (e) {
            console.error('Error updating user in localStorage:', e);
          }
        }
      }
    }
  }, [user, teachers, students, parents, loading]);

  const login = (roleOrUser) => {
    // Support both demo mode (string role) and real login (user object)
    if (typeof roleOrUser === "string") {
      // Demo mode
      if (roleOrUser === "ADMIN") {
        const userObj = { name: "Principal Ionescu", role: "ADMIN", avatar: "👨‍💼" };
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
        userId: roleOrUser.userId,
        avatar: roleToAvatar(roleOrUser.role),
      };
      setUser(userObj);
      localStorage.setItem('schoolUser', JSON.stringify(userObj));
    }
  };

  // Add refreshData function for backward compatibility with pages
  const refreshData = () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        loadInitialData(parsed.role, parsed.userId);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  };

  // Logout function that clears everything and redirects to login
  const logout = () => {
    // Clear auth context (token and user from localStorage)
    authLogout();
    // Clear school context user state
    setUser(null);
    // Clear any school-related localStorage items
    localStorage.removeItem('schoolUser');
    // Clear all school data
    setClassrooms([]);
    setStudents([]);
    setTeachers([]);
    setParents([]);
    setCourses([]);
    setClassCourses([]);
    setStudentGradesAndAbsences(null);
  };

  const value = {
    user,
    classrooms,
    students,
    teachers,
    parents,
    courses,
    classCourses,
    studentGradesAndAbsences,
    loading,
    error,
    login,
    logout,
    refreshData,
    // Classroom methods
    getClassroomsWithCounts,
    getClassDetails,
    addClassroom,
    updateClassroom,
    deleteClassroom,
    // Student methods
    addStudent,
    updateStudent,
    deleteStudent,
    // Teacher methods
    addTeacher,
    updateTeacher,
    deleteTeacher,
    // Parent methods
    addParent,
    updateParent,
    deleteParent,
    // Course methods
    addCourse,
    updateCourse,
    deleteCourse,
    // ClassCourse methods
    addClassCourse,
    deleteClassCourse,
  };

  return (
    <SchoolContext.Provider value={value}>
      {children}
    </SchoolContext.Provider>
  );
}

export const useSchool = () => useContext(SchoolContext);