import { useState, useEffect } from "react";
import { useSchool } from "../context/SchoolContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import { Users, GraduationCap, BookOpen, Award, Plus, ArrowRight, Library, Presentation, HeartHandshake } from "lucide-react";
import { gradesAPI } from "../services/api";

export default function Dashboard() {
  const { user, classrooms, students, teachers, courses, classCourses, parents } = useSchool();
  const navigate = useNavigate();
  const [studentGrades, setStudentGrades] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);

  useEffect(() => {
    if (user && user.role === "STUDENT") {
      // Find student by username
      const student = students.find(s => s.user?.username === user.username);
      if (student) {
        loadStudentGrades(student.id);
      }
    }
  }, [user, students]);

  const loadStudentGrades = async (studentId) => {
    try {
      const grades = await gradesAPI.getByStudent(studentId);
      setStudentGrades(grades || []);
      // Get recent grades (last 5)
      setRecentGrades((grades || []).slice(-5).reverse());
    } catch (err) {
      console.error("Error loading student grades:", err);
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
        { label: "Students", value: teacherClassrooms.reduce((sum, c) => sum + (c.studentsCount || 0), 0), icon: <Users size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Parents", value: (parents || []).length || 0, icon: <HeartHandshake size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
      ];
    } else if (user?.role === "STUDENT") {
      const student = students.find(s => s.user?.username === user.username);
      const studentClassroom = student ? classrooms.find(c => c.id === student.classroomId) : null;
      const avgGrade = studentGrades.length > 0 
        ? (studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length).toFixed(2)
        : "—";
      return [
        { label: "My Class", value: studentClassroom?.name || "—", icon: <GraduationCap size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Total Grades", value: studentGrades.length || 0, icon: <Award size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Average Grade", value: avgGrade, icon: <Award size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "My Courses", value: studentClassroom ? (classCourses || []).filter(cc => cc.classroom?.id === studentClassroom.id || cc.classroomId === studentClassroom.id).length : 0, icon: <Library size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
      ];
    } else if (user?.role === "PARENT") {
      const parent = parents.find(p => p.user?.username === user.username);
      const child = parent ? students.find(s => s.id === (parent.student?.id || parent.studentId)) : null;
      return [
        { label: "My Child", value: child ? `${child.firstName} ${child.lastName}` : "—", icon: <Users size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Class", value: child ? (classrooms.find(c => c.id === child.classroomId)?.name || "—") : "—", icon: <GraduationCap size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Registration Code", value: child?.registrationCode || "—", icon: <BookOpen size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Status", value: "Active", icon: <Award size={20} />, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
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
          Welcome back, <span className="font-semibold text-blue-600">{user?.name}</span>
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
                {user?.role === "STUDENT" ? "Recent Grades" : "Recent Activity"}
              </h3>
              {user?.role === "STUDENT" && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/grades")}
                  className="text-xs text-blue-600 font-semibold hover:text-blue-700 hover:underline transition-colors"
                >
                  View All →
                </motion.button>
              )}
            </div>
            <div className="space-y-2">
              {user?.role === "STUDENT" ? (
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
                            {course?.course?.name || "Course"}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {new Date(grade.date).toLocaleDateString()} • {course?.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : ""}
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
                    onClick={() => navigate("/grades")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, x: 2 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><ArrowRight size={14}/></motion.div>
                    View My Grades
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/courses")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, x: 2 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><ArrowRight size={14}/></motion.div>
                    View My Courses
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/classrooms")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, x: 2 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><ArrowRight size={14}/></motion.div>
                    My Classroom
                  </motion.button>
                </>
              )}
              {user?.role === "PARENT" && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.03, x: 5, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/students")}
                    className="w-full text-left px-3 py-2.5 rounded-xl border border-blue-200 hover:border-blue-400 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 text-xs font-semibold text-gray-900 flex items-center gap-2.5 group shadow-sm hover:shadow-lg"
                  >
                    <motion.div whileHover={{ scale: 1.15, x: 2 }} transition={{ duration: 0.3 }} className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md"><ArrowRight size={14}/></motion.div>
                    View My Child
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