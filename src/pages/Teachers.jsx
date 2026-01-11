import { useState, useEffect } from "react";
import { useSchool } from "../context/SchoolContext";
import { motion, AnimatePresence } from "framer-motion";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Edit, Trash2, Plus, Presentation } from "lucide-react";

export default function Teachers() {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, refreshData } = useSchool();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    registrationCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshData();
  }, []);

  const filtered = teachers || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await addTeacher(formData);
      if (result.success) {
        setIsCreateModalOpen(false);
        setFormData({ firstName: "", lastName: "", registrationCode: "" });
        await refreshData(); // Refresh to show the new teacher
      } else {
        setError(result.error || "Failed to create teacher");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      registrationCode: teacher.registrationCode || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await updateTeacher(selectedTeacher.id, formData);
      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedTeacher(null);
        setFormData({ firstName: "", lastName: "", registrationCode: "" });
        await refreshData(); // Refresh to show the updated teacher
      } else {
        setError(result.error || "Failed to update teacher");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this teacher?")) return;

    try {
      const result = await deleteTeacher(id);
      if (!result.success) {
        alert(result.error || "Failed to delete teacher");
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
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.15, rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.4 }}
            className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40"
          >
            <Presentation size={20} className="text-white" />
          </motion.div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Teachers Directory</h1>
            <p className="text-xs text-gray-500 mt-0.5">{filtered.length} teacher{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={() => setIsCreateModalOpen(true)} className="text-xs px-4 py-2">
            <Plus size={14} className="mr-1.5" /> Add Teacher
          </Button>
        </motion.div>
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
                  <th className="px-4 py-3 font-semibold text-gray-700">Teacher</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Registration Code</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-right">Actions</th>
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
                      <td colSpan="3" className="px-4 py-8 text-center text-gray-400 text-xs">
                        No teachers found
                      </td>
                    </motion.tr>
                  ) : (
                    filtered.map((t, idx) => (
                      <motion.tr
                        key={t.id}
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
                              <Presentation size={14} className="text-blue-600" />
                            </motion.div>
                            <span className="font-semibold text-gray-900 text-xs">
                              {t.firstName} {t.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{t.registrationCode || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleEdit(t)}
                              className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <Edit size={14} />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDelete(t.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
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
          setFormData({ firstName: "", lastName: "", registrationCode: "" });
          setError("");
        }}
        title="Add New Teacher"
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
            <input
              type="text"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs bg-white"
              value={formData.registrationCode}
              onChange={(e) => setFormData({ ...formData, registrationCode: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Creating..." : "Create Teacher"}
          </Button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTeacher(null);
          setFormData({ firstName: "", lastName: "", registrationCode: "" });
          setError("");
        }}
        title="Edit Teacher"
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
          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Updating..." : "Update Teacher"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
