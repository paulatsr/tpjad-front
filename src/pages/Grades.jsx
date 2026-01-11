import { useState, useEffect } from "react";
import { useSchool } from "../context/SchoolContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Plus, Edit, Trash2, Award, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { gradesAPI } from "../services/api";

export default function Grades() {
  const {
    students,
    classCourses,
    classrooms,
    addGrade,
    updateGrade,
    deleteGrade,
    refreshData,
    user,
  } = useSchool();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [studentGrades, setStudentGrades] = useState([]);
  const [formData, setFormData] = useState({
    studentId: "",
    classCourseId: "",
    date: "",
    value: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshData();
    if (user && user.role === "STUDENT") {
      loadStudentGrades();
    }
  }, [user, students]);

  const loadStudentGrades = async () => {
    const student = students.find(s => s.user?.username === user.username);
    if (student) {
      try {
        const grades = await gradesAPI.getByStudent(student.id);
        setStudentGrades(grades || []);
      } catch (err) {
        console.error("Error loading student grades:", err);
      }
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await addGrade({
        ...formData,
        studentId: parseInt(formData.studentId),
        classCourseId: parseInt(formData.classCourseId),
        value: parseInt(formData.value),
      });
      if (result.success) {
        setIsCreateModalOpen(false);
        setFormData({ studentId: "", classCourseId: "", date: "", value: "" });
      } else {
        setError(result.error || "Failed to create grade");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.15, rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.4 }}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40"
          >
            <Award size={20} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {user?.role === "STUDENT" ? "My Grades" : "Grades Management"}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {user?.role === "STUDENT" ? "View your grades and evaluations." : "Manage student grades and evaluations."}
            </p>
          </div>
        </div>
        {user && user.role === "ADMIN" && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="text-xs">
            <Plus size={16} className="mr-2" /> Add Grade
          </Button>
        )}
      </motion.div>

      {user?.role === "STUDENT" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/20">
          <div className="space-y-3">
            {studentGrades.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-blue-50 text-gray-700 font-semibold border-b border-blue-100">
                  <tr>
                    <th className="px-4 py-3">Course</th>
                    <th className="px-4 py-3">Teacher</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  <AnimatePresence>
                  {studentGrades.map((grade, idx) => {
                    const course = classCourses.find(cc => cc.id === grade.classCourse?.id || cc.id === grade.classCourseId);
                    return (
                      <motion.tr 
                        key={grade.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.01, x: 4, backgroundColor: "rgba(219, 234, 254, 0.5)" }}
                        className="transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          {course?.course?.name || "Course"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {course?.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <motion.span 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${
                              grade.value >= 9 ? "bg-blue-600 text-white" : 
                              grade.value >= 7 ? "bg-blue-500 text-white" : 
                              "bg-blue-400 text-white"
                            }`}
                          >
                            {grade.value}
                          </motion.span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(grade.date).toLocaleDateString()}
                        </td>
                      </motion.tr>
                    );
                  })}
                  </AnimatePresence>
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <Award size={40} className="mx-auto mb-3 text-blue-300" />
                </motion.div>
                <p className="text-sm font-semibold mb-1 text-gray-700">No grades yet</p>
                <p className="text-xs text-gray-500">Your grades will appear here once they are added.</p>
              </div>
            )}
          </div>
        </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
        <Card className="border-blue-100 bg-gradient-to-br from-white to-blue-50/20">
          <div className="p-8 text-center text-gray-500">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <Trophy size={40} className="mx-auto mb-3 text-blue-300" />
            </motion.div>
            <p className="text-sm font-semibold mb-1 text-gray-700">Grade Management</p>
            <p className="text-xs text-gray-500">
              Use the button above to add individual grades.
            </p>
          </div>
        </Card>
        </motion.div>
      )}

      {/* Create Grade Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({ studentId: "", classCourseId: "", date: "", value: "" });
          setError("");
        }}
        title="Add New Grade"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Student</label>
            <select
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
            >
              <option value="">Select a student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Class Course</label>
            <select
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              value={formData.classCourseId}
              onChange={(e) => setFormData({ ...formData, classCourseId: e.target.value })}
              required
            >
              <option value="">Select a class course</option>
              {classCourses.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.course?.name || "Course"} - {cc.classroom?.name || "Class"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Grade (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Creating..." : "Create Grade"}
          </Button>
        </form>
      </Modal>

    </div>
  );
}



