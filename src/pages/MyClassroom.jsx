import { useState, useEffect } from "react";
import { useSchool } from "../context/SchoolContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { BookOpen, Calendar, Plus, Edit, Trash2, X } from "lucide-react";
import { catalogAPI, gradesAPI, absencesAPI } from "../services/api";

export default function MyClassroom() {
  const { user, classrooms, refreshData, teachers } = useSchool();
  const [classroomId, setClassroomId] = useState(null);
  const [catalogData, setCatalogData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClassCourse, setSelectedClassCourse] = useState(null);
  const [gradeFormData, setGradeFormData] = useState({ value: "", date: "" });
  const [absenceFormData, setAbsenceFormData] = useState({ date: "", excused: false });

  useEffect(() => {
    // Find the classroom where this teacher is homeroom teacher
    if (user && user.role === "TEACHER" && classrooms && teachers) {
      // Find teacher by username
      const teacher = teachers.find(t => t.user?.username === user.username);
      if (teacher) {
        const homeroomClassroom = classrooms.find(c => c.homeroomTeacherId === teacher.id);
        if (homeroomClassroom) {
          setClassroomId(homeroomClassroom.id);
          loadCatalog(homeroomClassroom.id);
        }
      }
    }
  }, [user, classrooms, teachers]);

  const loadCatalog = async (id) => {
    setLoading(true);
    setError("");
    try {
      const data = await catalogAPI.getClassroomCatalog(id);
      setCatalogData(data);
    } catch (err) {
      setError(err.message || "Failed to load catalog");
      console.error("Error loading catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGrade = (student, classCourse) => {
    setSelectedStudent(student);
    setSelectedClassCourse(classCourse);
    setGradeFormData({ value: "", date: "" });
    setIsGradeModalOpen(true);
  };

  const handleEditGrade = (student, classCourse, grade) => {
    setSelectedStudent(student);
    setSelectedClassCourse(classCourse);
    setGradeFormData({ value: grade.value.toString(), date: grade.date });
    setIsGradeModalOpen(true);
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm("Are you sure you want to delete this grade?")) return;
    try {
      await gradesAPI.delete(gradeId);
      await loadCatalog(classroomId);
      await refreshData();
    } catch (err) {
      alert(err.message || "Failed to delete grade");
    }
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (gradeFormData.id) {
        // Update existing grade
        await gradesAPI.update(gradeFormData.id, {
          value: parseInt(gradeFormData.value),
          date: gradeFormData.date,
        });
      } else {
        // Create new grade
        await gradesAPI.create({
          studentId: selectedStudent.studentId,
          classCourseId: selectedClassCourse.classCourseId,
          value: parseInt(gradeFormData.value),
          date: gradeFormData.date,
        });
      }
      setIsGradeModalOpen(false);
      await loadCatalog(classroomId);
      await refreshData();
    } catch (err) {
      setError(err.message || "Failed to save grade");
    } finally {
      setLoading(false);
    }
  };

  const handleAddAbsence = (student, classCourse) => {
    setSelectedStudent(student);
    setSelectedClassCourse(classCourse);
    setAbsenceFormData({ date: "", excused: false });
    setIsAbsenceModalOpen(true);
  };

  const handleMotivateAbsence = async (absenceId, excused) => {
    try {
      // Find the absence date from catalog data
      const student = catalogData?.students?.find(s => 
        s.courses?.some(c => c.absences?.some(a => a.id === absenceId))
      );
      const course = student?.courses?.find(c => 
        c.absences?.some(a => a.id === absenceId)
      );
      const absence = course?.absences?.find(a => a.id === absenceId);
      
      if (absence) {
        await absencesAPI.update(absenceId, absence.date, excused);
        await loadCatalog(classroomId);
        await refreshData();
      }
    } catch (err) {
      alert(err.message || "Failed to update absence");
    }
  };

  const handleDeleteAbsence = async (absenceId) => {
    if (!window.confirm("Are you sure you want to delete this absence?")) return;
    try {
      await absencesAPI.delete(absenceId);
      await loadCatalog(classroomId);
      await refreshData();
    } catch (err) {
      alert(err.message || "Failed to delete absence");
    }
  };

  const handleSubmitAbsence = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await absencesAPI.create({
        studentId: selectedStudent.studentId,
        classCourseId: selectedClassCourse.classCourseId,
        date: absenceFormData.date,
        excused: absenceFormData.excused,
      });
      setIsAbsenceModalOpen(false);
      await loadCatalog(classroomId);
      await refreshData();
    } catch (err) {
      setError(err.message || "Failed to save absence");
    } finally {
      setLoading(false);
    }
  };

  if (!classroomId) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">You are not assigned as a homeroom teacher for any classroom.</p>
      </div>
    );
  }

  if (loading && !catalogData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Loading catalog...</p>
      </div>
    );
  }

  if (error && !catalogData) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-text">My Classroom</h1>
        <p className="text-brand-muted">Class {catalogData?.classroomName} - Catalog</p>
      </div>

      {catalogData && (
        <Card className="overflow-x-auto">
          <div className="min-w-full">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b-2 border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-gray-700 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                    Student
                  </th>
                  {catalogData.courses?.map((course) => (
                    <th key={course.classCourseId} className="px-4 py-3 text-center font-bold text-gray-700 min-w-[200px]">
                      <div className="flex flex-col">
                        <span>{course.courseName}</span>
                        <span className="text-xs font-normal text-gray-500">{course.teacherName}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {catalogData.students?.map((student) => (
                  <tr key={student.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-brand-text sticky left-0 bg-white z-10 border-r border-gray-200">
                      {student.studentName}
                    </td>
                    {student.courses?.map((course, idx) => (
                      <td key={idx} className="px-4 py-3 text-center">
                        <div className="space-y-2">
                          {/* Grades */}
                          <div className="flex flex-wrap gap-1 justify-center">
                            {course.grades?.map((grade, gIdx) => (
                              <span
                                key={gIdx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                              >
                                {grade.value}
                                <button
                                  onClick={() => handleEditGrade(student, course, grade)}
                                  className="hover:text-blue-600"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteGrade(grade.id)}
                                  className="hover:text-red-600"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                            <button
                              onClick={() => handleAddGrade(student, course)}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          {/* Absences */}
                          <div className="flex flex-wrap gap-1 justify-center">
                            {course.absences?.map((absence, aIdx) => (
                              <span
                                key={aIdx}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                  absence.excused
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                <Calendar size={12} />
                                {new Date(absence.date).toLocaleDateString()}
                                {!absence.excused && (
                                  <button
                                    onClick={() => handleMotivateAbsence(absence.id, true)}
                                    className="hover:text-green-600"
                                    title="Mark as excused"
                                  >
                                    ✓
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteAbsence(absence.id)}
                                  className="hover:text-red-600"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                            <button
                              onClick={() => handleAddAbsence(student, course)}
                              className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Grade Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => {
          setIsGradeModalOpen(false);
          setSelectedStudent(null);
          setSelectedClassCourse(null);
          setGradeFormData({ value: "", date: "" });
          setError("");
        }}
        title="Add/Edit Grade"
      >
        <form onSubmit={handleSubmitGrade} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-gray-50"
              value={selectedStudent?.studentName || ""}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade (1-10)</label>
            <input
              type="number"
              min="1"
              max="10"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
              value={gradeFormData.value}
              onChange={(e) => setGradeFormData({ ...gradeFormData, value: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
              value={gradeFormData.date}
              onChange={(e) => setGradeFormData({ ...gradeFormData, date: e.target.value })}
              required
            />
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Saving..." : "Save Grade"}
          </Button>
        </form>
      </Modal>

      {/* Absence Modal */}
      <Modal
        isOpen={isAbsenceModalOpen}
        onClose={() => {
          setIsAbsenceModalOpen(false);
          setSelectedStudent(null);
          setSelectedClassCourse(null);
          setAbsenceFormData({ date: "", excused: false });
          setError("");
        }}
        title="Add Absence"
      >
        <form onSubmit={handleSubmitAbsence} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-gray-50"
              value={selectedStudent?.studentName || ""}
              disabled
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
              value={absenceFormData.date}
              onChange={(e) => setAbsenceFormData({ ...absenceFormData, date: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={absenceFormData.excused}
                onChange={(e) => setAbsenceFormData({ ...absenceFormData, excused: e.target.checked })}
              />
              <span className="text-sm font-medium text-gray-700">Excused</span>
            </label>
          </div>
          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Saving..." : "Save Absence"}
          </Button>
        </form>
      </Modal>
    </div>
  );
}

