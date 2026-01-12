import { useState, useEffect } from "react";
import { useSchool } from "../context/SchoolContext";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { MoreHorizontal, Eye, Edit, Trash2, Plus, School, GraduationCap, User, RefreshCw } from "lucide-react";
import { studentsAPI, teachersAPI, classroomsAPI } from "../services/api";

export default function Students() {
  const { students, classrooms, addStudent, updateStudent, deleteStudent, refreshData, user, parents, teachers } = useSchool();
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0 });
  const [selectedStudentForDropdown, setSelectedStudentForDropdown] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    registrationCode: "",
    classroomId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [loadedStudents, setLoadedStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [teacherId, setTeacherId] = useState(null);

  useEffect(() => {
    refreshData();
  }, []);

  // Load teacher ID for teachers
  useEffect(() => {
    if (user && user.role === "TEACHER" && teachers && teachers.length > 0) {
      const teacher = teachers.find(t => t.user?.username === user.username);
      if (teacher) {
        setTeacherId(teacher.id);
      }
    }
  }, [user, teachers]);

  // Load students for teacher's homeroom classroom
  useEffect(() => {
    const loadStudentsForHomeroomTeacher = async () => {
      if (user && user.role === "TEACHER" && teacherId) {
        setLoadingStudents(true);
        try {
          const homeroomClassroom = await classroomsAPI.getByHomeroomTeacher(teacherId).catch(() => null);
          if (homeroomClassroom) {
            const students = await studentsAPI.getByClassroom(homeroomClassroom.id).catch(() => []);
            setLoadedStudents(students);
          } else {
            setLoadedStudents([]);
          }
        } catch (err) {
          console.error("Error loading students:", err);
          setLoadedStudents([]);
        } finally {
          setLoadingStudents(false);
        }
      } else {
        setLoadedStudents([]);
      }
    };
    loadStudentsForHomeroomTeacher();
  }, [user, teacherId]);

  // Filter students based on user role
  let filtered = students || [];
  if (user && user.role === "STUDENT") {
    filtered = students.filter(s => s.user?.username === user.username);
  } else if (user && user.role === "PARENT") {
    const parent = parents?.find(p => p.user?.username === user.username);
    if (parent && parent.student) {
      filtered = students.filter(s => s.id === (parent.student.id || parent.studentId));
    } else {
      filtered = [];
    }
  } else if (user && user.role === "TEACHER") {
    filtered = loadedStudents || [];
  }

  const toggleDropdown = (id, event) => {
    if (activeDropdown === id) {
      setActiveDropdown(null);
      setSelectedStudentForDropdown(null);
    } else {
      if (event) {
        const rect = event.currentTarget.getBoundingClientRect();
        setDropdownPosition({ x: rect.right - 144, y: rect.bottom + 4 });
      }
      const student = students.find(s => s.id === id);
      setSelectedStudentForDropdown(student);
      setActiveDropdown(id);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Ensure classroomId is a number, not a string
      if (!formData.classroomId) {
        setError("Please select a classroom");
        setLoading(false);
        return;
      }

      const studentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        registrationCode: formData.registrationCode,
        classroomId: Number(formData.classroomId)
      };
      
      console.log("Creating student with data:", studentData);
      
      const result = await addStudent(studentData);
      if (result.success) {
        setIsCreateModalOpen(false);
        setFormData({ firstName: "", lastName: "", registrationCode: "", classroomId: "" });
        await refreshData(); // Refresh to show the new student
      } else {
        setError(result.error || "Failed to create student");
      }
    } catch (err) {
      console.error("Error creating student:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      registrationCode: student.registrationCode || "",
      classroomId: student.classroomId || "",
    });
    setIsEditModalOpen(true);
    setActiveDropdown(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Ensure classroomId is a number, not a string
      if (!formData.classroomId) {
        setError("Please select a classroom");
        setLoading(false);
        return;
      }

      const studentData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        registrationCode: formData.registrationCode,
        classroomId: Number(formData.classroomId)
      };
      
      console.log("Updating student with data:", studentData);
      
      const result = await updateStudent(selectedStudent.id, studentData);
      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedStudent(null);
        setFormData({ firstName: "", lastName: "", registrationCode: "", classroomId: "" });
        await refreshData(); // Refresh to show the updated student
      } else {
        setError(result.error || "Failed to update student");
      }
    } catch (err) {
      console.error("Error updating student:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;

    try {
      const result = await deleteStudent(id);
      if (!result.success) {
        alert(result.error || "Failed to delete student");
      }
      setActiveDropdown(null);
    } catch (err) {
      alert(err.message || "An error occurred");
    }
  };

  return (
    <div className="space-y-4" onClick={() => {
      setActiveDropdown(null);
      setSelectedStudentForDropdown(null);
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
      >
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.4 }}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40"
          >
            <GraduationCap size={20} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Student Directory</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {user && user.role === "TEACHER" ? "My Classroom - " : ""}
              {filtered.length} student{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {user && user.role === "ADMIN" && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => setIsCreateModalOpen(true)} className="text-xs px-4 py-2">
              <Plus size={14} className="mr-1.5" /> Add Student
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Table Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="p-0 shadow-sm border border-gray-100">
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full text-left text-xs">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Student</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Class</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Registration Code</th>
                  {user && user.role === "ADMIN" && (
                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={user && user.role === "ADMIN" ? 4 : 3} className="px-4 py-8 text-center text-gray-400 text-xs">
                        No students found
                      </td>
                    </motion.tr>
                  ) : (
                    filtered.map((s, idx) => (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-cyan-50/30 transition-all duration-300 group relative"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 360 }}
                              transition={{ duration: 0.5 }}
                              className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0"
                            >
                              <GraduationCap size={14} className="text-blue-600" />
                            </motion.div>
                            <span className="font-semibold text-gray-900 text-xs">
                              {s.firstName} {s.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 rounded-md text-xs font-semibold border border-blue-100">
                            {s.classroom ? s.classroom.name : (s.classroomId ? (classrooms.find(c => c.id === s.classroomId)?.name || "Unassigned") : "Unassigned")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{s.registrationCode || "—"}</td>

                        {user && user.role === "ADMIN" && (
                          <td className="px-4 py-3 text-right">
                            <div className="relative inline-block">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(s.id, e);
                                }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                              >
                                <MoreHorizontal size={16} />
                              </motion.button>
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Dropdown Menu - Fixed Position */}
      <AnimatePresence>
        {activeDropdown && selectedStudentForDropdown && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed w-36 bg-white border border-gray-200 shadow-xl rounded-xl z-[100] py-1"
            style={{
              left: `${dropdownPosition.x}px`,
              top: `${dropdownPosition.y}px`
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.button
              whileHover={{ backgroundColor: "#f3f4f6" }}
              onClick={() => {
                handleEdit(selectedStudentForDropdown);
                setActiveDropdown(null);
                setSelectedStudentForDropdown(null);
              }}
              className="w-full px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <Edit size={12} /> Edit
            </motion.button>
            <div className="h-px bg-gray-100 my-1"></div>
            <motion.button
              whileHover={{ backgroundColor: "#fef2f2" }}
              onClick={() => {
                handleDelete(selectedStudentForDropdown.id);
                setActiveDropdown(null);
                setSelectedStudentForDropdown(null);
              }}
              className="w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({ firstName: "", lastName: "", registrationCode: "", classroomId: "" });
          setError("");
        }}
        title="Add New Student"
      >
        <form onSubmit={handleCreate} className="space-y-3">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs"
            >
              {error}
            </motion.div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registration Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
                value={formData.registrationCode}
                onChange={(e) => setFormData({ ...formData, registrationCode: e.target.value })}
                required
              />
              <Button
                type="button"
                onClick={async () => {
                  setGeneratingCode(true);
                  try {
                    const code = await studentsAPI.generateRegCode();
                    setFormData({ ...formData, registrationCode: code });
                  } catch (err) {
                    alert(err.message || "Failed to generate registration code");
                  } finally {
                    setGeneratingCode(false);
                  }
                }}
                disabled={generatingCode}
                className="px-3 text-xs"
              >
                <RefreshCw size={14} className={generatingCode ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Classroom</label>
            <select
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.classroomId || ""}
              onChange={(e) => setFormData({ ...formData, classroomId: e.target.value ? Number(e.target.value) : "" })}
              required
            >
              <option value="">Select a classroom</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Creating..." : "Create Student"}
          </Button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStudent(null);
          setFormData({ firstName: "", lastName: "", registrationCode: "", classroomId: "" });
          setError("");
        }}
        title="Edit Student"
      >
        <form onSubmit={handleUpdate} className="space-y-3">
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs"
            >
              {error}
            </motion.div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Name</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Registration Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
                value={formData.registrationCode}
                onChange={(e) => setFormData({ ...formData, registrationCode: e.target.value })}
                required
              />
              <Button
                type="button"
                onClick={async () => {
                  setGeneratingCode(true);
                  try {
                    const code = await studentsAPI.generateRegCode();
                    setFormData({ ...formData, registrationCode: code });
                  } catch (err) {
                    alert(err.message || "Failed to generate registration code");
                  } finally {
                    setGeneratingCode(false);
                  }
                }}
                disabled={generatingCode}
                className="px-3 text-xs"
              >
                <RefreshCw size={14} className={generatingCode ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Classroom</label>
            <select
              className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.classroomId || ""}
              onChange={(e) => setFormData({ ...formData, classroomId: e.target.value ? Number(e.target.value) : "" })}
              required
            >
              <option value="">Select a classroom</option>
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Updating..." : "Update Student"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
