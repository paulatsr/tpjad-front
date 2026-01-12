import { useState, useEffect } from "react";
import { useSchool } from "../context/SchoolContext";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Edit, Trash2, Plus, HeartHandshake, Users, GraduationCap, Download, RefreshCw } from "lucide-react";
import { exportAPI } from "../services/api";
import { parentsAPI, classroomsAPI, studentsAPI } from "../services/api";

export default function Parents() {
  const { parents, students, addParent, updateParent, deleteParent, refreshData, user, classCourses, classrooms, teachers } = useSchool();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    registrationCode: "",
    studentId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [loadedParents, setLoadedParents] = useState([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [allStudents, setAllStudents] = useState([]);

  useEffect(() => {
    refreshData();
    // Load all students for the create parent modal
    const loadAllStudents = async () => {
      try {
        const allStudentsData = await studentsAPI.getAll();
        setAllStudents(allStudentsData || []);
      } catch (err) {
        console.error("Error loading all students:", err);
        setAllStudents([]);
      }
    };
    loadAllStudents();
  }, []);

  useEffect(() => {
    if (user && user.role === "TEACHER" && teachers && teachers.length > 0) {
      const teacher = teachers.find(t => t.user?.username === user.username);
      if (teacher) {
        setTeacherId(teacher.id);
      }
    }
  }, [user, teachers]);

  const handleExportParents = async () => {
    if (!teacherId) return;
    try {
      await exportAPI.exportParentsByHomeroomTeacher(teacherId);
    } catch (err) {
      setError(err.message || "Failed to export parents");
    }
  };

  // Helper function to reload parents for homeroom teacher
  const reloadParentsForHomeroomTeacher = async () => {
    if (user && user.role === "TEACHER" && teachers && teachers.length > 0) {
      try {
        const teacher = teachers.find(t => t.user?.username === user.username);
        if (teacher) {
          // Get homeroom classroom for this teacher
          const homeroomClassroom = await classroomsAPI.getByHomeroomTeacher(teacher.id).catch(() => null);
          if (homeroomClassroom) {
            // Get parents for the homeroom classroom only
            const parents = await parentsAPI.getByClassroom(homeroomClassroom.id).catch(() => []);
            setLoadedParents(parents);
          } else {
            setLoadedParents([]);
          }
        } else {
          setLoadedParents([]);
        }
      } catch (err) {
        console.error("Error loading parents:", err);
        setLoadedParents([]);
      }
    }
  };

  // Load parents for teacher's homeroom classroom
  useEffect(() => {
    const loadParentsForHomeroomTeacher = async () => {
      if (user && user.role === "TEACHER" && teachers && teachers.length > 0) {
        setLoadingParents(true);
        try {
          await reloadParentsForHomeroomTeacher();
        } finally {
          setLoadingParents(false);
        }
      } else {
        setLoadedParents([]);
      }
    };

    loadParentsForHomeroomTeacher();
  }, [user, teachers]);

  // Filter parents - for teachers, use loaded parents from homeroom classroom
  let filteredParents = [];
  if (user && user.role === "TEACHER") {
    filteredParents = loadedParents || [];
    // Sort by student name (all parents are from the same homeroom classroom)
    filteredParents.sort((a, b) => {
      const studentA = a.student;
      const studentB = b.student;
      if (!studentA || !studentB) return 0;
      const nameA = `${studentA.firstName} ${studentA.lastName}`;
      const nameB = `${studentB.firstName} ${studentB.lastName}`;
      return nameA.localeCompare(nameB);
    });
  } else if (user && user.role === "PARENT") {
    filteredParents = (parents || []).filter(p => p.user?.username === user.username);
  } else if (user && user.role === "ADMIN") {
    filteredParents = parents || [];
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await addParent({
        ...formData,
        studentId: formData.studentId ? Number(formData.studentId) : null,
      });
      if (result.success) {
        setIsCreateModalOpen(false);
        setFormData({ firstName: "", lastName: "", registrationCode: "", studentId: "" });
        await refreshData(); // Refresh to show the new parent
        // Reload parents for homeroom teacher
        if (user && user.role === "TEACHER") {
          await reloadParentsForHomeroomTeacher();
        }
      } else {
        setError(result.error || "Failed to create parent");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (parent) => {
    setSelectedParent(parent);
    setFormData({
      firstName: parent.firstName || "",
      lastName: parent.lastName || "",
      registrationCode: parent.registrationCode || "",
      studentId: parent.student?.id || parent.studentId || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await updateParent(selectedParent.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentId: formData.studentId ? Number(formData.studentId) : null,
      });
      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedParent(null);
        setFormData({ firstName: "", lastName: "", registrationCode: "", studentId: "" });
        await refreshData(); // Refresh to show the updated parent
        // Reload parents for homeroom teacher
        if (user && user.role === "TEACHER") {
          await reloadParentsForHomeroomTeacher();
        }
      } else {
        setError(result.error || "Failed to update parent");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this parent?")) return;

    try {
      const result = await deleteParent(id);
      if (result.success) {
        await refreshData(); // Refresh to show the deleted parent
        // Reload parents for homeroom teacher
        if (user && user.role === "TEACHER") {
          await reloadParentsForHomeroomTeacher();
        }
      } else {
        alert(result.error || "Failed to delete parent");
      }
    } catch (err) {
      alert(err.message || "An error occurred");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3"
      >
        <div>
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.15, rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.4 }}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40"
            >
              <HeartHandshake size={20} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Parents Directory</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {user && user.role === "TEACHER" ? "My Classroom - " : ""}
                {filteredParents.length} parent{filteredParents.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            {user && user.role === "TEACHER" && teacherId && (
              <Button onClick={handleExportParents} className="flex items-center gap-2">
                <Download size={16} />
                Export Parents
              </Button>
            )}
            {user && user.role === "ADMIN" && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={() => setIsCreateModalOpen(true)} className="text-xs px-4 py-2">
                  <Plus size={14} className="mr-1.5" /> Add Parent
                </Button>
              </motion.div>
            )}
          </div>
        </div>
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
              <thead className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-b border-blue-100">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700">Parent</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Student</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Registration Code</th>
                  {user && user.role === "ADMIN" && (
                    <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <AnimatePresence>
                  {filteredParents.length === 0 ? (
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <td colSpan={user && user.role === "ADMIN" ? 4 : 3} className="px-4 py-8 text-center text-gray-400 text-xs">
                        No parents found
                      </td>
                    </motion.tr>
                  ) : (
                    filteredParents.map((p, idx) => {
                      // Student is already included in parent object from API
                      const student = p.student;
                      return (
                        <motion.tr
                          key={p.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          className="hover:bg-gradient-to-r hover:from-blue-50/70 hover:to-blue-100/50 transition-all duration-300 group"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <motion.div
                                whileHover={{ scale: 1.1, rotate: 360 }}
                                transition={{ duration: 0.5 }}
                                className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0"
                              >
                                <HeartHandshake size={14} className="text-blue-600" />
                              </motion.div>
                              <span className="font-semibold text-gray-900 text-xs">
                                {p.firstName} {p.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {student ? (
                                <>
                                  <GraduationCap size={12} className="text-gray-400" />
                                  <span className="text-gray-600 text-xs">
                                    {student.firstName} {student.lastName}
                                  </span>
                                  {user && user.role === "TEACHER" && (
                                    <span className="ml-1.5 text-xs text-gray-400">
                                      ({classrooms.find(c => c.id === student.classroomId)?.name || "—"})
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-gray-400 text-xs">No student assigned</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{p.registrationCode || "—"}</td>
                          {user && user.role === "ADMIN" && (
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleEdit(p)}
                                  className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                  <Edit size={14} />
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleDelete(p.id)}
                                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 size={14} />
                                </motion.button>
                              </div>
                            </td>
                          )}
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setFormData({ firstName: "", lastName: "", registrationCode: "", studentId: "" });
          setError("");
        }}
        title="Add New Parent"
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
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
            <input
              type="text"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
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
                className="flex-1 p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
                value={formData.registrationCode}
                onChange={(e) => setFormData({ ...formData, registrationCode: e.target.value })}
                required
              />
              <Button
                type="button"
                onClick={async () => {
                  setGeneratingCode(true);
                  try {
                    const code = await parentsAPI.generateRegCode();
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
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Student</label>
            <select
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
            >
              <option value="">Select a student</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Creating..." : "Create Parent"}
          </Button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedParent(null);
          setFormData({ firstName: "", lastName: "", registrationCode: "", studentId: "" });
          setError("");
        }}
        title="Edit Parent"
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
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Last Name</label>
            <input
              type="text"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Student</label>
            <select
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.studentId}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              required
            >
              <option value="">Select a student</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Updating..." : "Update Parent"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
