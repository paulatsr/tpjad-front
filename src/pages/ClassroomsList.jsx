import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSchool } from "../context/SchoolContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Users, GraduationCap, ArrowRight, Plus, BookOpen } from "lucide-react";
import { studentsAPI } from "../services/api";

export default function ClassroomsList() {
  const { classrooms, teachers, addClassroom, updateClassroom, deleteClassroom, refreshData, user, classCourses, students } = useSchool();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [formData, setFormData] = useState({ name: "", homeroomTeacherId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [studentsCount, setStudentsCount] = useState({});

  useEffect(() => {
    refreshData();
  }, []);

  // Load students count for each classroom
  useEffect(() => {
    const loadStudentsCount = async () => {
      if (!classrooms || classrooms.length === 0) return;
      
      const counts = {};
      const promises = classrooms.map(async (c) => {
        try {
          const count = await studentsAPI.getNumberOfStudentsByClassroom(c.id);
          counts[c.id] = count;
        } catch (err) {
          console.error(`Error loading student count for classroom ${c.id}:`, err);
          counts[c.id] = 0;
        }
      });
      
      await Promise.all(promises);
      setStudentsCount(counts);
    };

    loadStudentsCount();
  }, [classrooms]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await addClassroom({
        name: formData.name,
        homeroomTeacherId: parseInt(formData.homeroomTeacherId),
      });
      if (result.success) {
        setIsModalOpen(false);
        setFormData({ name: "", homeroomTeacherId: "" });
      } else {
        setError(result.error || "Failed to create classroom");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classroom) => {
    setSelectedClassroom(classroom);
    setFormData({
      name: classroom.name || "",
      homeroomTeacherId: classroom.homeroomTeacherId || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await updateClassroom(selectedClassroom.id, {
        name: formData.name,
        homeroomTeacherId: parseInt(formData.homeroomTeacherId),
      });
      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedClassroom(null);
        setFormData({ name: "", homeroomTeacherId: "" });
      } else {
        setError(result.error || "Failed to update classroom");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this classroom?")) return;

    try {
      const result = await deleteClassroom(id);
      if (!result.success) {
        alert(result.error || "Failed to delete classroom");
      }
    } catch (err) {
      alert(err.message || "An error occurred");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-brand-text">Classrooms</h1>
          <p className="text-brand-muted">Active classes management.</p>
        </div>
        {user && user.role === "ADMIN" && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Create Class
          </Button>
        )}
      </div>

      {(() => {
        // Filter classrooms based on user role
        let filteredClassrooms = classrooms || [];
        if (user && user.role === "TEACHER" && teachers && classCourses) {
          // Find teacher by username
          const teacher = teachers.find(t => t.user?.username === user.username);
          if (teacher) {
            // Get unique classroom IDs from class-courses where this teacher teaches
            const teacherClassroomIds = new Set(
              (classCourses || [])
                .filter(cc => {
                  const ccTeacherId = cc.teacher?.id || cc.teacherId;
                  return ccTeacherId === teacher.id;
                })
                .map(cc => cc.classroom?.id || cc.classroomId)
                .filter(id => id != null)
            );
            filteredClassrooms = (classrooms || []).filter(c => teacherClassroomIds.has(c.id));
          } else {
            // Teacher not found, show empty list
            filteredClassrooms = [];
          }
        } else if (user && user.role === "STUDENT" && students) {
          // Student sees only their own classroom
          const student = students.find(s => s.user?.username === user.username);
          if (student && student.classroomId) {
            filteredClassrooms = (classrooms || []).filter(c => c.id === student.classroomId);
          } else {
            filteredClassrooms = [];
          }
        }

        return filteredClassrooms.length === 0 ? (
          <div className="p-10 text-center border-2 border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-400 font-medium">No classes found.</p>
            <p className="text-sm text-gray-300">Try refreshing the page.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClassrooms.map((c) => {
            // Use homeroomTeacher from classroom object if available, otherwise fallback to finding in teachers list
            const teacher = c.homeroomTeacher || (c.homeroomTeacherId ? teachers.find(t => t.id === c.homeroomTeacherId) : null);
            return (
              <Card
                key={c.id}
                className="group hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-brand-electric flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-brand-text mb-1">{c.name}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 text-brand-electric rounded-lg">
                      <GraduationCap size={24} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                    <BookOpen size={16} className="text-gray-400" />
                    <span>
                      {teacher
                        ? `Homeroom Teacher: ${teacher.firstName} ${teacher.lastName}`
                        : "No homeroom teacher assigned"}
                    </span>
                  </div>
                </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Users size={16} />
                    {studentsCount[c.id] !== undefined ? studentsCount[c.id] : (c.studentsCount || 0)} Students
                  </div>
                  <div className="flex gap-2">
                    {user && user.role === "ADMIN" && (
                      <>
                        <button
                          onClick={() => handleEdit(c)}
                          className="text-sm text-gray-600 hover:text-brand-electric"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => navigate(`/classrooms/${c.id}`)}
                      className="text-brand-electric font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                    >
                      Details <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
          </div>
        );
      })()}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ name: "", homeroomTeacherId: "" });
          setError("");
        }}
        title="Create New Class"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              type="text"
              placeholder="e.g. 10B"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homeroom Teacher</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
              value={formData.homeroomTeacherId}
              onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
              required
            >
              <option value="">Select a teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedClassroom(null);
          setFormData({ name: "", homeroomTeacherId: "" });
          setError("");
        }}
        title="Edit Class"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              type="text"
              placeholder="e.g. 10B"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homeroom Teacher</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
              value={formData.homeroomTeacherId}
              onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
              required
            >
              <option value="">Select a teacher</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Updating..." : "Update"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
