import { useState, useEffect } from "react";
import { useSchool } from "../context/SchoolContext";
import { motion } from "framer-motion";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Library, Clock, Plus, Edit, Trash2, GraduationCap, Calendar, BookOpen } from "lucide-react";
import { classCoursesAPI } from "../services/api";

export default function Courses() {
  const { courses, addCourse, updateCourse, deleteCourse, refreshData, classrooms, teachers, user, students, classCourses, studentGradesAndAbsences } = useSchool();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [formData, setFormData] = useState({ name: "", classroomId: "", teacherId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    refreshData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // First create the course
      const courseResult = await addCourse({ name: formData.name });
      if (!courseResult.success) {
        setError(courseResult.error || "Failed to create course");
        setLoading(false);
        return;
      }

      // Then create the class-course association
      const classCourseResult = await classCoursesAPI.create({
        classroomId: parseInt(formData.classroomId),
        courseId: courseResult.data.id,
        teacherId: parseInt(formData.teacherId),
      });

      if (classCourseResult) {
        setIsModalOpen(false);
        setFormData({ name: "", classroomId: "", teacherId: "" });
        await refreshData();
      } else {
        setError("Course created but failed to assign to class");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({ name: course.name || "" });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await updateCourse(selectedCourse.id, formData);
      if (result.success) {
        setIsEditModalOpen(false);
        setSelectedCourse(null);
        setFormData({ name: "" });
      } else {
        setError(result.error || "Failed to update course");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    try {
      const result = await deleteCourse(id);
      if (!result.success) {
        alert(result.error || "Failed to delete course");
      }
    } catch (err) {
      alert(err.message || "An error occurred");
    }
  };


  return (
    <div className="space-y-4">
      {(() => {
        // Filter courses for students - show only courses from their classroom
        let filteredCourses = courses || [];
        if (user && user.role === "STUDENT") {
          const student = students.find(s => s.user?.username === user.username);
          if (student) {
            const studentClassroomId = student.classroomId;
            const studentClassCourseIds = (classCourses || [])
              .filter(cc => cc.classroom?.id === studentClassroomId || cc.classroomId === studentClassroomId)
              .map(cc => cc.course?.id || cc.courseId);
            filteredCourses = courses.filter(c => studentClassCourseIds.includes(c.id));
          } else {
            filteredCourses = [];
          }
        } else {
          filteredCourses = courses || [];
        }

        return (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.15, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/40"
                >
                  <Library size={20} className="text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {user?.role === "STUDENT" ? "My Courses" : "Curriculum"}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {user?.role === "STUDENT" ? "View all your subjects." : "Manage all subjects available."}
                  </p>
                </div>
              </div>
              {user && user.role === "ADMIN" && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus size={18} /> Add Course
                </Button>
              )}
            </motion.div>

            {user?.role === "STUDENT" ? (
              // Catalog view for students
              studentGradesAndAbsences && studentGradesAndAbsences.gradesByCourse && studentGradesAndAbsences.gradesByCourse.length > 0 ? (
                <Card className="border-t-4 border-t-brand-electric shadow-xl paper-lined overflow-hidden">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-gray-800/20 bg-white/50 p-4 rounded-t-lg">
                    <BookOpen className="text-brand-electric" />
                    <h3 className="font-bold text-xl text-gray-900">Grade Catalog</h3>
                  </div>

                  <div className="overflow-x-auto p-2">
                    <table className="w-full text-left text-sm border-collapse border-2 border-gray-800/50">
                      <thead className="bg-gray-800/10 text-gray-900 uppercase text-xs font-bold tracking-wider">
                        <tr>
                          <th className="p-3 border-2 border-gray-800/30 w-64">Subject</th>
                          <th className="p-3 border-2 border-gray-800/30">Grades / Date</th>
                          <th className="p-3 border-2 border-gray-800/30">Absences</th>
                        </tr>
                      </thead>
                      <tbody className="font-hand text-lg">
                        {studentGradesAndAbsences.gradesByCourse.map((courseGrade) => {
                          const average = courseGrade.grades && courseGrade.grades.length > 0 
                            ? (courseGrade.grades.reduce((sum, g) => sum + g.value, 0) / courseGrade.grades.length).toFixed(2)
                            : "";

                          return (
                            <tr key={courseGrade.classCourseId} className="hover:bg-blue-800/5 transition-colors border-b-2 border-gray-800/20">
                              <td className="p-3 border-r-2 border-gray-800/30 font-bold text-gray-900">
                                <div className="flex flex-col">
                                  <span>{courseGrade.course}</span>
                                  <span className="text-sm text-gray-600 font-normal mt-0.5">{courseGrade.teacher}</span>
                                </div>
                              </td>
                              
                              {/* Grades Grid - Handwritten Style */}
                              <td className="p-2 border-r-2 border-gray-800/30">
                                <div className="flex flex-wrap gap-3 items-center">
                                  {courseGrade.grades && courseGrade.grades.length > 0 ? (
                                    courseGrade.grades.map((grade, i) => (
                                      <div 
                                        key={i} 
                                        className="flex flex-col items-center justify-center w-12 h-12 border-2 border-gray-800/60 bg-white shadow-sm rounded-sm transform rotate-[-1deg]"
                                      >
                                        <span className={`text-2xl font-bold leading-none ${grade.value < 5 ? 'text-red-700' : 'text-blue-900'}`}>
                                          {grade.value}
                                        </span>
                                        {/* Line between grade and date */}
                                        <div className="w-full h-px bg-gray-800/40 my-0.5"></div>
                                        <span className="text-[11px] text-gray-600 leading-none font-bold">
                                          {new Date(grade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-sm text-gray-500 italic p-2 opacity-70">—</span>
                                  )}
                                </div>
                              </td>

                              {/* Absences with Green Circle for Excused */}
                              <td className="p-3">
                                <div className="flex flex-wrap gap-x-6 gap-y-4 items-center py-2">
                                  {courseGrade.absences && courseGrade.absences.length > 0 ? (
                                    courseGrade.absences.map((absence, i) => (
                                      <div key={i} className="relative inline-block group cursor-default z-10">
                                        {/* Date Text */}
                                        <span className={`text-xl font-bold px-2 relative z-20 ${absence.excused ? 'text-green-800' : 'text-red-700'}`}>
                                          {new Date(absence.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>

                                        {/* GREEN CIRCLE for Excused Absences */}
                                        {absence.excused && (
                                          <svg 
                                            className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible" 
                                            viewBox="0 0 100 100" 
                                            preserveAspectRatio="none"
                                          >
                                            <path 
                                              d="M5,50 C5,25 25,5 50,5 C75,5 95,25 95,50 C95,75 75,95 50,95 C25,95 5,75 5,50 Z"
                                              fill="none" 
                                              stroke="#16a34a"
                                              strokeWidth="8"
                                              strokeLinecap="round" 
                                              strokeLinejoin="round"
                                              vectorEffect="non-scaling-stroke"
                                              opacity="0.7"
                                              style={{ filter: 'blur(0.5px)' }}
                                            />
                                          </svg>
                                        )}
                                        
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-xs font-sans rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none">
                                          {absence.excused ? "Excused" : "Unexcused"}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <span className="text-gray-500 italic text-base px-2 opacity-70">No absences</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ) : (
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-blue-200">
                  <p className="text-gray-500 text-xs">No courses with grades or absences yet.</p>
                </div>
              )
            ) : filteredCourses.length === 0 ? (
              <div className="text-center p-12 bg-white rounded-xl border border-dashed border-blue-200">
                <p className="text-gray-500 text-xs">No courses defined yet.</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {filteredCourses.map((c) => {
                  const classCourse = classCourses.find(cc => cc.course?.id === c.id || cc.courseId === c.id);
                  return (
                    <motion.div
                      key={c.id}
                      whileHover={{ scale: 1.02, y: -3 }}
                      transition={{ duration: 0.2 }}
                    >
                    <Card className="hover:border-blue-400 hover:shadow-lg transition-all group relative border-blue-100 bg-gradient-to-br from-white to-blue-50/20">
                      {user && user.role === "ADMIN" && (
                        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleEdit(c)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 rounded-lg shadow-sm border border-blue-200 hover:border-blue-300 transition-all"
                          >
                            <Edit size={14} />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg shadow-sm border border-red-200 hover:border-red-300 transition-all"
                          >
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      )}

              <div className="flex justify-between items-start mb-4">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-3 bg-blue-100 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg"
                >
                  <Library size={20} />
                </motion.div>
              </div>
                      <h3 className="text-base font-bold text-gray-900 mb-2">{c.name}</h3>
                      {user?.role === "STUDENT" && classCourse && (
                        <p className="text-xs text-gray-500 mt-2">
                          Teacher: {classCourse.teacher ? `${classCourse.teacher.firstName} ${classCourse.teacher.lastName}` : "—"}
                        </p>
                      )}
                    </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </>
        );
      })()}

      {/* Create Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData({ name: "", classroomId: "", teacherId: "" });
          setError("");
        }}
        title="Create New Course"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Course Name</label>
            <input
              type="text"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              placeholder="e.g. Advanced Physics"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Classroom</label>
            <select
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              value={formData.classroomId}
              onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
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
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Teacher</label>
            <select
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              value={formData.teacherId}
              onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
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
          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Creating..." : "Save Course"}
          </Button>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCourse(null);
          setFormData({ name: "" });
          setError("");
        }}
        title="Edit Course"
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Course Name</label>
            <input
              type="text"
              className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-xs"
              placeholder="e.g. Advanced Physics"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full mt-3 text-xs py-2" disabled={loading}>
            {loading ? "Updating..." : "Update Course"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
