import { useState, useEffect } from "react";
import { useSchool } from "../context/SchoolContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import { Users, GraduationCap, BookOpen, Award, Plus, ArrowRight, Library, Presentation, HeartHandshake, AlertCircle } from "lucide-react";
import { gradesAPI, teachersAPI, classroomsAPI, studentsAPI, parentsAPI, absencesAPI } from "../services/api";

export default function Dashboard() {
  const { user, classrooms, students, teachers, courses, classCourses, parents } = useSchool();
  const navigate = useNavigate();
  const [studentGrades, setStudentGrades] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [homeroomClassroom, setHomeroomClassroom] = useState(null);
  const [homeroomStudents, setHomeroomStudents] = useState([]);
  const [homeroomParents, setHomeroomParents] = useState([]);
  const [teacherId, setTeacherId] = useState(null);
  const [unexcusedAbsences, setUnexcusedAbsences] = useState(0);
  const [studentClassroomName, setStudentClassroomName] = useState("—");
  const [childName, setChildName] = useState("");
  const [childClassroomName, setChildClassroomName] = useState("—");
  const [childUnexcusedAbsences, setChildUnexcusedAbsences] = useState(0);
  const [childGrades, setChildGrades] = useState([]);

  useEffect(() => {
    if (user && user.role === "STUDENT") {
      // Get student by userId (like admin does)
      const loadStudentData = async () => {
        try {
          const student = await studentsAPI.getByUserId(user.userId);
          if (student) {
            loadStudentGrades(student.id);
            // Set classroom name
            setStudentClassroomName(student?.classroom?.name || "—");
            // Load unexcused absences
            const unexcusedData = await absencesAPI.getUnexcusedByStudent(student.id);
            setUnexcusedAbsences(unexcusedData?.unexcusedAbsences || 0);
          }
        } catch (err) {
          console.error("Error loading student data:", err);
        }
      };
      loadStudentData();
    } else if (user && user.role === "PARENT") {
      // Get parent by userId first to get parent ID, then get student by parent ID (like student does)
      const loadParentData = async () => {
        try {
          const parent = await parentsAPI.getByUserId(user.userId);
          if (parent && parent.id) {
            // Get student by parent ID (same pattern as student)
            const child = await studentsAPI.getByParentId(parent.id);
            if (child) {
              setChildName(`${child.firstName} ${child.lastName}`);
              setChildClassroomName(child?.classroom?.name || "—");
              // Load child's grades (same as student)
              loadStudentGrades(child.id);
              // Load child's unexcused absences
              const unexcusedData = await absencesAPI.getUnexcusedByStudent(child.id);
              setChildUnexcusedAbsences(unexcusedData?.unexcusedAbsences || 0);
            }
          }
        } catch (err) {
          console.error("Error loading parent data:", err);
        }
      };
      loadParentData();
    }
  }, [user]);

  // Load homeroom classroom data for teacher
  useEffect(() => {
    const loadHomeroomData = async () => {
      if (user && user.role === "TEACHER" && user.userId) {
        try {
          const teacher = await teachersAPI.getByUserId(user.userId);
          if (teacher && teacher.id) {
            setTeacherId(teacher.id);
            const homeroom = await classroomsAPI.getByHomeroomTeacher(teacher.id).catch(() => null);
            if (homeroom) {
              setHomeroomClassroom(homeroom);
              // Load students from homeroom classroom
              const studentsList = await studentsAPI.getByClassroom(homeroom.id).catch(() => []);
              setHomeroomStudents(studentsList);
              // Load parents from homeroom classroom
              const parentsList = await parentsAPI.getByClassroom(homeroom.id).catch(() => []);
              setHomeroomParents(parentsList);
            } else {
              setHomeroomClassroom(null);
              setHomeroomStudents([]);
              setHomeroomParents([]);
            }
          }
        } catch (err) {
          console.error("Error loading homeroom data:", err);
          setHomeroomClassroom(null);
          setHomeroomStudents([]);
          setHomeroomParents([]);
        }
      }
    };
    loadHomeroomData();
  }, [user]);

  const loadStudentGrades = async (studentId) => {
    try {
      const gradesResponse = await gradesAPI.getByStudent(studentId);
      // gradesResponse is StudentGradesResponse with { student, gradesByCourse }
      // Extract all grades from all courses
      const allGrades = gradesResponse?.gradesByCourse?.flatMap(course => 
        (course.grades || []).map(grade => ({
          ...grade,
          classCourseId: course.classCourseId,
          courseName: course.course,
          teacherName: course.teacher
        }))
      ) || [];
      
      // Set grades based on user role
      if (user?.role === "STUDENT") {
        setStudentGrades(allGrades);
        // Get recent grades (last 5) - sort by date descending
        const sortedGrades = [...allGrades].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentGrades(sortedGrades.slice(0, 5));
      } else if (user?.role === "PARENT") {
        // For parent, set child grades
        setChildGrades(allGrades);
        // Get recent grades (last 5) - sort by date descending
        const sortedGrades = [...allGrades].sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentGrades(sortedGrades.slice(0, 5));
      }
    } catch (err) {
      console.error("Error loading student grades:", err);
      if (user?.role === "STUDENT") {
        setStudentGrades([]);
        setRecentGrades([]);
      } else if (user?.role === "PARENT") {
        setChildGrades([]);
        setRecentGrades([]);
      }
    }
  };

  // Calculate stats based on user role
  const getStats = () => {
    if (user?.role === "ADMIN") {
      return [
        { label: "Total Students", value: students.length || 0, icon: <Users size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Active Classes", value: classrooms.length || 0, icon: <GraduationCap size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Teachers", value: teachers.length || 0, icon: <Presentation size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Courses", value: courses.length || 0, icon: <Library size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
      ];
    } else if (user?.role === "TEACHER") {
      const teacher = teachers?.find(t => t.user?.username === user.username);
      const teacherClassrooms = teacher ? (classrooms || []).filter(c => 
        (classCourses || []).some(cc => 
          (cc.teacher?.id === teacher.id || cc.teacherId === teacher.id) && 
          (cc.classroom?.id === c.id || cc.classroomId === c.id)
        )
      ) : [];
      return [
        { label: "My Classes", value: teacherClassrooms.length || 0, icon: <GraduationCap size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "My Courses", value: (classCourses || []).filter(cc => cc.teacher?.id === teacher?.id || cc.teacherId === teacher?.id).length || 0, icon: <Library size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Students", value: homeroomStudents.length || 0, icon: <Users size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Parents", value: homeroomParents.length || 0, icon: <HeartHandshake size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
      ];
    } else if (user?.role === "STUDENT") {
      const avgGrade = studentGrades.length > 0 
        ? (studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length).toFixed(2)
        : "—";
      return [
        { label: "My Class", value: studentClassroomName, icon: <GraduationCap size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Total Grades", value: studentGrades.length || 0, icon: <Award size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Average Grade", value: avgGrade, icon: <Award size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Unexcused Absents", value: unexcusedAbsences, icon: <AlertCircle size={20} />, iconBg: "bg-red-100", iconColor: "text-red-600" },
      ];
    } else if (user?.role === "PARENT") {
      const avgGrade = childGrades.length > 0 
        ? (childGrades.reduce((sum, g) => sum + g.value, 0) / childGrades.length).toFixed(2)
        : "—";
      return [
        { label: "My Class", value: childClassroomName, icon: <GraduationCap size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Total Grades", value: childGrades.length || 0, icon: <Award size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Average Grade", value: avgGrade, icon: <Award size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Unexcused Absents", value: childUnexcusedAbsences, icon: <AlertCircle size={20} />, iconBg: "bg-red-100", iconColor: "text-red-600" },
      ];
    }
    return [];
  };

  const stats = getStats();

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Dashboard
        </h1>
        <p className="text-xs text-gray-600">
          {user?.role === "PARENT" && childName ? (
            <>You are the parent of <span className="font-semibold text-blue-600">{childName}</span></>
          ) : (
            <>Welcome back, <span className="font-semibold text-blue-600">{user?.name}</span></>
          )}
        </p>
      </motion.div>

      {/* Grid Statistici */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="group cursor-pointer"
          >
            <Card className="flex items-center gap-3 p-3 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-100 hover:border-blue-300 bg-gradient-to-br from-white to-blue-50/30 hover:from-blue-50 hover:to-blue-100/50">
              <motion.div
                whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
                className={`w-9 h-9 ${stat.iconBg} ${stat.iconColor} rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg`}
              >
                {stat.icon}
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 mb-0.5 truncate">{stat.label}</p>
                <h3 className="text-lg font-bold text-gray-900 truncate">{stat.value}</h3>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity / Recent Grades */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200/50">
              <h3 className="text-lg font-bold text-gray-900">
                {(user?.role === "STUDENT" || user?.role === "PARENT") ? "Recent Grades" : "Recent Activity"}
              </h3>
              {(user?.role === "STUDENT" || user?.role === "PARENT") && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/courses")}
                  className="text-xs text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                >
                  View Catalog →
                </motion.button>
              )}
            </div>
            <div className="space-y-2">
              {(user?.role === "STUDENT" || user?.role === "PARENT") ? (
                recentGrades.length > 0 ? (
                  recentGrades.map((grade, idx) => {
                    const course = classCourses.find(cc => cc.id === grade.classCourse?.id || cc.id === grade.classCourseId);
                    return (
                      <motion.div
                        key={grade.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.1 }}
                        whileHover={{ scale: 1.03, x: 6, y: -2 }}
                        className="flex items-center gap-3 p-3 hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-blue-100/50 rounded-xl transition-all duration-300 border border-blue-100 hover:border-blue-300 hover:shadow-md group"
                      >
                        <motion.div
                          whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                          transition={{ duration: 0.4 }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-xs ${
                            grade.value >= 9 ? "bg-gradient-to-br from-blue-600 to-blue-700" : grade.value >= 7 ? "bg-gradient-to-br from-blue-500 to-blue-600" : "bg-gradient-to-br from-blue-400 to-blue-500"
                          }`}
                        >
                          {grade.value}
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">
                            {grade.courseName || course?.course?.name || "Course"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {new Date(grade.date).toLocaleDateString()} • {grade.teacherName || (course?.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : "")}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 text-center py-6">No grades yet</p>
                )
              ) : user?.role === "ADMIN" ? (
                <div className="space-y-2">
                  {students.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      whileHover={{ scale: 1.02, x: 5, y: -1 }}
                      className="flex items-center gap-3 p-3 hover:bg-blue-50/70 rounded-xl transition-all duration-300 border border-blue-100 hover:border-blue-300 hover:shadow-sm"
                    >
                      <motion.div 
                        whileHover={{ scale: 1.3 }}
                        className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md"></motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">Total students: {students.length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Last updated: {new Date().toLocaleDateString()}</p>
                      </div>
                    </motion.div>
                  )}
                  {classrooms.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      whileHover={{ scale: 1.02, x: 5, y: -1 }}
                      className="flex items-center gap-3 p-3 hover:bg-blue-50/70 rounded-xl transition-all duration-300 border border-blue-100 hover:border-blue-300 hover:shadow-sm"
                    >
                      <motion.div 
                        whileHover={{ scale: 1.3 }}
                        className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md"></motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">Active classrooms: {classrooms.length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Last updated: {new Date().toLocaleDateString()}</p>
                      </div>
                    </motion.div>
                  )}
                  {teachers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ scale: 1.02, x: 5, y: -1 }}
                      className="flex items-center gap-3 p-3 hover:bg-blue-50/70 rounded-xl transition-all duration-300 border border-blue-100 hover:border-blue-300 hover:shadow-sm"
                    >
                      <motion.div 
                        whileHover={{ scale: 1.3 }}
                        className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-md"></motion.div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">Total teachers: {teachers.length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Last updated: {new Date().toLocaleDateString()}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">No recent activity</p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200/50">Quick Actions</h3>
            <div className="space-y-2">
              {user?.role === "ADMIN" && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/students")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, rotate: 90 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><Plus size={14}/></motion.div>
                    Add New Student
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/classrooms")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, rotate: 90 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><Plus size={14}/></motion.div>
                    Create Classroom
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/courses")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, rotate: 90 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><Plus size={14}/></motion.div>
                    Add Course
                  </motion.button>
                </>
              )}
              {user?.role === "TEACHER" && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/my-classroom")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, x: 2 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><ArrowRight size={14}/></motion.div>
                    My Classroom
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/classrooms")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, x: 2 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><ArrowRight size={14}/></motion.div>
                    View Classes
                  </motion.button>
                </>
              )}
              {user?.role === "STUDENT" && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/courses")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, x: 2 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><ArrowRight size={14}/></motion.div>
                    View Catalog
                  </motion.button>
                </>
              )}
              {user?.role === "PARENT" && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/courses")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, x: 2 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><ArrowRight size={14}/></motion.div>
                    View Catalog
                  </motion.button>
                </>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}