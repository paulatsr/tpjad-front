import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Plus, ArrowLeft, Calendar, BookOpen, Edit, X, FileText } from "lucide-react";
import { useSchool } from "../context/SchoolContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { gradesAPI, absencesAPI, studentsAPI, classCoursesAPI, coursesAPI, teachersAPI } from "../services/api";

export default function ClassroomDetails() {
  const { id } = useParams();
  const { getClassDetails, teachers, classCourses, courses, refreshData, user } = useSchool();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSubjectAbsences, setSelectedSubjectAbsences] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gradesData, setGradesData] = useState(null);
  const [absencesData, setAbsencesData] = useState(null);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingAbsences, setLoadingAbsences] = useState(false);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [gradeFormData, setGradeFormData] = useState({ value: "", date: "" });
  const [absenceFormData, setAbsenceFormData] = useState({ date: "", excused: false });
  const [editingAbsenceId, setEditingAbsenceId] = useState(null);
  const [error, setError] = useState("");
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkFormData, setBulkFormData] = useState({
    classCourseId: "",
    testDate: "",
    entries: [] // Array of {studentId, grade: null|number, absent: false}
  });
  const [allStudents, setAllStudents] = useState([]);
  const [loadingBulk, setLoadingBulk] = useState(false);
  const [isCreateClassCourseModalOpen, setIsCreateClassCourseModalOpen] = useState(false);
  const [classCourseFormData, setClassCourseFormData] = useState({ courseId: "", teacherId: "" });
  const [loadingClassCourse, setLoadingClassCourse] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);

  useEffect(() => {
    loadClassData();
  }, [id]);

  useEffect(() => {
    if (selectedSubject) {
      loadGradesData();
    } else {
      setGradesData(null);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubjectAbsences) {
      loadAbsencesData();
    } else {
      setAbsencesData(null);
    }
  }, [selectedSubjectAbsences]);

  // Load students when bulk modal opens
  useEffect(() => {
    if (isBulkModalOpen && id) {
      loadStudentsForBulk();
    }
  }, [isBulkModalOpen, id]);

  const loadStudentsForBulk = async () => {
    try {
      const students = await studentsAPI.getByClassroom(parseInt(id));
      setAllStudents(students);
      // Initialize entries for all students
      const initialEntries = students.map(s => ({
        studentId: s.id,
        grade: null,
        absent: false
      }));
      setBulkFormData(prev => ({
        ...prev,
        entries: initialEntries
      }));
    } catch (err) {
      console.error("Error loading students:", err);
      setAllStudents([]);
    }
  };

  const handleOpenBulkModal = () => {
    setIsBulkModalOpen(true);
    // Set default classCourseId to first available if exists
    if (classCoursesForClass && classCoursesForClass.length > 0) {
      setBulkFormData(prev => ({
        ...prev,
        classCourseId: classCoursesForClass[0].id.toString()
      }));
    }
  };

  const handleBulkEntryChange = (studentId, field, value) => {
    setBulkFormData(prev => {
      const newEntries = prev.entries.map(entry => {
        if (entry.studentId === studentId) {
          const updated = { ...entry };
          if (field === 'grade') {
            // If setting grade, clear absent
            updated.grade = value ? parseInt(value) : null;
            if (value) updated.absent = false;
          } else if (field === 'absent') {
            // If setting absent, clear grade
            updated.absent = value;
            if (value) updated.grade = null;
          }
          return updated;
        }
        return entry;
      });
      return { ...prev, entries: newEntries };
    });
  };

  const handleSubmitBulk = async (e) => {
    e.preventDefault();
    if (loadingBulk) return;
    setError("");
    
    if (!bulkFormData.classCourseId || !bulkFormData.testDate) {
      setError("Please select a subject and date");
      return;
    }

    // Filter entries to only include those with grade or absent
    const validEntries = bulkFormData.entries.filter(
      entry => entry.grade !== null || entry.absent === true
    );

    if (validEntries.length === 0) {
      setError("Please add at least one grade or absence");
      return;
    }

    setLoadingBulk(true);
    try {
      const bulkData = {
        classroomId: parseInt(id),
        classCourseId: parseInt(bulkFormData.classCourseId),
        testDate: formatDateForBackend(bulkFormData.testDate),
        entries: validEntries.map(entry => ({
          studentId: entry.studentId,
          grade: entry.grade || null,
          absent: entry.absent || false
        }))
      };

      await gradesAPI.bulkCreate(bulkData);
      setIsBulkModalOpen(false);
      setBulkFormData({
        classCourseId: "",
        testDate: "",
        entries: []
      });
      // Reload grades and absences data
      if (selectedSubject) {
        await loadGradesData();
      }
      if (selectedSubjectAbsences) {
        await loadAbsencesData();
      }
      await refreshData();
    } catch (err) {
      setError(err.message || "Failed to save bulk evaluation");
    } finally {
      setLoadingBulk(false);
    }
  };

  const loadCoursesAndTeachers = async () => {
    try {
      const [coursesList, teachersList] = await Promise.all([
        coursesAPI.getAll().catch(() => []),
        teachersAPI.getAll().catch(() => [])
      ]);
      setAllCourses(coursesList);
      setAllTeachers(teachersList);
    } catch (err) {
      console.error("Error loading courses and teachers:", err);
    }
  };

  const handleCreateClassCourse = async (e) => {
    e.preventDefault();
    if (loadingClassCourse) return;
    setError("");
    
    if (!classCourseFormData.courseId || !classCourseFormData.teacherId) {
      setError("Please select a course and a teacher");
      return;
    }

    // Check if course is already assigned to this classroom
    const existingClassCourse = classCoursesForClass.find(
      cc => cc.course?.id === parseInt(classCourseFormData.courseId) || cc.courseId === parseInt(classCourseFormData.courseId)
    );
    if (existingClassCourse) {
      setError("This course is already assigned to this classroom");
      return;
    }

    setLoadingClassCourse(true);
    try {
      await classCoursesAPI.create({
        classroomId: parseInt(id),
        courseId: parseInt(classCourseFormData.courseId),
        teacherId: parseInt(classCourseFormData.teacherId)
      });
      setIsCreateClassCourseModalOpen(false);
      setClassCourseFormData({ courseId: "", teacherId: "" });
      await refreshData();
      // Reload class data to get updated class courses
      await loadClassData();
    } catch (err) {
      setError(err.message || "Failed to create class course");
    } finally {
      setLoadingClassCourse(false);
    }
  };

  const handleDeleteClassCourse = async (classCourseId) => {
    if (!window.confirm("Are you sure you want to remove this course from the classroom?")) return;
    try {
      await classCoursesAPI.delete(classCourseId);
      await refreshData();
      await loadClassData();
    } catch (err) {
      alert(err.message || "Failed to delete class course");
    }
  };

  const loadClassData = async () => {
    setLoading(true);
    try {
      const data = await getClassDetails(id);
      setClassData(data);
      if (data && classCourses && classCourses.length > 0) {
        // Set first class course as default selected subject
        const firstClassCourse = classCourses.find(cc => cc.classroom?.id === parseInt(id) || cc.classroomId === parseInt(id));
        if (firstClassCourse) {
          setSelectedSubject(firstClassCourse.id);
          setSelectedSubjectAbsences(firstClassCourse.id);
        }
      }
    } catch (err) {
      console.error("Error loading class details:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadGradesData = async () => {
    if (!selectedSubject) return;
    setLoadingGrades(true);
    try {
      const data = await gradesAPI.getByCourse(selectedSubject);
      setGradesData(data);
    } catch (err) {
      console.error("Error loading grades:", err);
      setGradesData(null);
    } finally {
      setLoadingGrades(false);
    }
  };

  const loadAbsencesData = async () => {
    if (!selectedSubjectAbsences) return;
    setLoadingAbsences(true);
    try {
      const data = await absencesAPI.getByCourse(selectedSubjectAbsences);
      setAbsencesData(data);
    } catch (err) {
      console.error("Error loading absences:", err);
      setAbsencesData(null);
    } finally {
      setLoadingAbsences(false);
    }
  };

  // Format date for backend (dd-MM-yyyy)
  // Input is yyyy-MM-dd from date input, output should be dd-MM-yyyy
  const formatDateForBackend = (dateString) => {
    if (!dateString) return "";
    // If already in dd-MM-yyyy format, return as is
    if (dateString.includes('-') && dateString.split('-')[0].length === 2) {
      return dateString;
    }
    // Convert from yyyy-MM-dd to dd-MM-yyyy
    const parts = dateString.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      // yyyy-MM-dd format
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    // Fallback: try to parse as date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleAddGrade = (student) => {
    setSelectedStudent(student);
    setGradeFormData({ value: "", date: "" });
    setIsGradeModalOpen(true);
  };

  const handleEditGrade = (student, grade) => {
    setSelectedStudent(student);
    const dateStr = grade.date instanceof Date 
      ? grade.date.toISOString().split('T')[0]
      : grade.date?.split('T')[0] || grade.date;
    setGradeFormData({ id: grade.id, value: grade.value.toString(), date: dateStr });
    setIsGradeModalOpen(true);
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm("Are you sure you want to delete this grade?")) return;
    try {
      await gradesAPI.delete(gradeId);
      await loadGradesData();
      await refreshData();
    } catch (err) {
      alert(err.message || "Failed to delete grade");
    }
  };

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    if (loadingGrades) return; // Prevent double submit
    setError("");
    setLoadingGrades(true);
    try {
      if (gradeFormData.id) {
        // Update existing grade
        await gradesAPI.update(gradeFormData.id, {
          value: parseInt(gradeFormData.value),
          date: formatDateForBackend(gradeFormData.date),
        });
      } else {
        // Create new grade
        await gradesAPI.create({
          studentId: selectedStudent.studentId,
          classCourseId: selectedSubject,
          value: parseInt(gradeFormData.value),
          date: formatDateForBackend(gradeFormData.date),
        });
      }
      setIsGradeModalOpen(false);
      await loadGradesData();
      await refreshData();
    } catch (err) {
      setError(err.message || "Failed to save grade");
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleAddAbsence = (student) => {
    setSelectedStudent(student);
    setAbsenceFormData({ date: "", excused: false });
    setEditingAbsenceId(null);
    setIsAbsenceModalOpen(true);
  };

  const handleMotivateAbsence = async (absenceId) => {
    try {
      await absencesAPI.toggleExcused(absenceId);
      await loadAbsencesData();
      await refreshData();
    } catch (err) {
      alert(err.message || "Failed to toggle absence status");
    }
  };

  const handleDeleteAbsence = async (absenceId) => {
    if (!window.confirm("Are you sure you want to delete this absence?")) return;
    try {
      await absencesAPI.delete(absenceId);
      await loadAbsencesData();
      await refreshData();
    } catch (err) {
      alert(err.message || "Failed to delete absence");
    }
  };

  const handleSubmitAbsence = async (e) => {
    e.preventDefault();
    if (loadingAbsences) return; // Prevent double submit
    setError("");
    setLoadingAbsences(true);
    try {
      if (editingAbsenceId) {
        // Update existing absence
        await absencesAPI.update(editingAbsenceId, formatDateForBackend(absenceFormData.date), absenceFormData.excused);
      } else {
        // Create new absence
        await absencesAPI.create({
          studentId: selectedStudent.studentId,
          classCourseId: selectedSubjectAbsences,
          date: formatDateForBackend(absenceFormData.date),
        });
      }
      setIsAbsenceModalOpen(false);
      setEditingAbsenceId(null);
      await loadAbsencesData();
      await refreshData();
    } catch (err) {
      setError(err.message || "Failed to save absence");
    } finally {
      setLoadingAbsences(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Loading class details...</p>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-gray-100 mt-8">
        <p className="text-gray-500 mb-4">Class not found or data missing.</p>
        <Link to="/classrooms" className="text-brand-electric font-medium hover:underline">
          Go back to Classrooms
        </Link>
      </div>
    );
  }

  // Use homeroomTeacher from classroom object if available, otherwise fallback to finding in teachers list
  const teacher = classData.homeroomTeacher || (classData.homeroomTeacherId ? teachers.find(t => t.id === classData.homeroomTeacherId) : null);
  const totalStudents = classData.students?.length || 0;
  const classCoursesForClass = classCourses.filter(cc => cc.classroom?.id === parseInt(id) || cc.classroomId === parseInt(id));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <Link to="/classrooms" className="text-sm text-brand-muted hover:text-brand-electric flex items-center gap-1 mb-2">
            <ArrowLeft size={14} /> Back to Classrooms
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-brand-text">Class {classData.name}</h1>
            <span className="px-3 py-1 bg-brand-electric/10 text-brand-electric rounded-full text-sm font-bold">General</span>
          </div>
          <p className="text-brand-muted flex items-center gap-2">
            <User size={18} /> Homeroom Teacher: <span className="font-semibold text-brand-text">
              {teacher ? `${teacher.firstName} ${teacher.lastName}` : "Not assigned"}
            </span>
          </p>
        </div>
        {user && user.role === "TEACHER" && (
          <Button onClick={handleOpenBulkModal} className="flex items-center gap-2">
            <FileText size={16} />
            Bulk Evaluation
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 overflow-x-auto">
        {["overview", "students", "grades", "absences"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium capitalize transition-all relative whitespace-nowrap ${
              activeTab === tab ? "text-brand-electric" : "text-brand-muted hover:text-brand-text"
            }`}
          >
            {tab === "overview" ? "Overview" : tab === "students" ? "Students" : tab === "grades" ? "Grade Catalog" : "Absence Catalog"}
            {activeTab === tab && (
              <motion.div layoutId="tabLine" className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-electric" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {/* Tab Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-blue-50 border-blue-100">
                <h3 className="text-blue-900 font-bold mb-1">Total Students</h3>
                <p className="text-3xl font-bold text-brand-electric">{totalStudents}</p>
              </Card>
              <Card className="bg-green-50 border-green-100">
                <h3 className="text-green-900 font-bold mb-1">Courses</h3>
                <p className="text-3xl font-bold text-green-600">{classCoursesForClass.length}</p>
              </Card>
            </div>
            
            {/* Courses List */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Courses</h3>
                {user && user.role === "ADMIN" && (
                  <Button onClick={() => {
                    setIsCreateClassCourseModalOpen(true);
                    loadCoursesAndTeachers();
                  }} className="flex items-center gap-2">
                    <Plus size={16} />
                    Add Course
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {classCoursesForClass.length > 0 ? (
                  classCoursesForClass.map((cc) => (
                    <div key={cc.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                      <div className="flex items-center gap-3">
                        <BookOpen className="text-brand-electric" size={18} />
                        <div>
                          <span className="font-medium text-brand-text block">{cc.course?.name || `Course ${cc.id}`}</span>
                          <span className="text-sm text-gray-500">
                            Teacher: {cc.teacher ? `${cc.teacher.firstName} ${cc.teacher.lastName}` : "Not assigned"}
                          </span>
                        </div>
                      </div>
                      {user && user.role === "ADMIN" && (
                        <button
                          onClick={() => handleDeleteClassCourse(cc.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete course"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No courses assigned to this class
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Tab Students */}
        {activeTab === "students" && (
          <Card>
            <div className="flex justify-between mb-6">
              <h3 className="font-bold text-lg">Student List</h3>
            </div>
            <div className="space-y-1">
              {classData.students && classData.students.length > 0 ? (
                classData.students.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-electric/10 text-brand-electric flex items-center justify-center font-bold text-xs">
                        {i + 1}
                      </div>
                      <div>
                        <span className="font-medium text-brand-text block">{s.firstName} {s.lastName}</span>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-xs">View Profile</Button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No students in this class
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tab Grade Catalog */}
        {activeTab === "grades" && (
          <Card className="border-t-4 border-t-brand-electric shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b-2 border-gray-200 gap-4 bg-white/50 p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <BookOpen className="text-brand-electric" />
                <h3 className="font-bold text-xl text-gray-900">Grade Catalog</h3>
              </div>

              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border-2 border-gray-300 shadow-sm">
                <span className="text-xs font-bold text-gray-600 uppercase px-2">Course:</span>
                <select
                  className="bg-transparent text-gray-900 text-sm font-bold focus:outline-none cursor-pointer"
                  value={selectedSubject || ""}
                  onChange={(e) => setSelectedSubject(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Select a course</option>
                  {classCoursesForClass.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.course?.name || "Course"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto p-2">
              {loadingGrades ? (
                <div className="p-8 text-center text-gray-500">
                  Loading grades...
                </div>
              ) : selectedSubject && gradesData ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse border-2 border-gray-800/50">
                    <thead className="bg-gray-800/10 text-gray-900 uppercase text-xs font-bold tracking-wider">
                      <tr>
                        <th className="p-3 border-2 border-gray-800/30 w-64">Student</th>
                        <th className="p-3 border-2 border-gray-800/30">Grades</th>
                      </tr>
                    </thead>
                    <tbody className="font-hand text-lg">
                      {gradesData.students && gradesData.students.length > 0 ? (
                        gradesData.students.map((student) => (
                          <tr key={student.studentId} className="hover:bg-blue-800/5 transition-colors border-b-2 border-gray-800/20">
                            <td className="p-3 border-r-2 border-gray-800/30 font-bold text-gray-900">
                              {student.studentName}
                            </td>
                            <td className="p-2 border-r-2 border-gray-800/30">
                              <div className="flex flex-wrap gap-3 items-center">
                                {student.grades && student.grades.length > 0 ? (
                                  student.grades.map((grade, i) => (
                                    <div 
                                      key={grade.id || i} 
                                      className="flex flex-col items-center justify-center w-12 h-12 border-2 border-gray-800/60 bg-white shadow-sm rounded-sm transform rotate-[-1deg] relative group"
                                    >
                                      <span className={`text-2xl font-bold leading-none ${grade.value < 5 ? 'text-red-700' : 'text-blue-900'}`}>
                                        {grade.value}
                                      </span>
                                      <div className="w-full h-px bg-gray-800/40 my-0.5"></div>
                                      <span className="text-[11px] text-gray-600 leading-none font-bold">
                                        {new Date(grade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                      {user && (user.role === "ADMIN" || user.role === "TEACHER") && (
                                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                          <button
                                            onClick={() => handleEditGrade(student, grade)}
                                            className="p-1 bg-blue-100 hover:bg-blue-200 rounded text-blue-800"
                                            title="Edit grade"
                                          >
                                            <Edit size={10} />
                                          </button>
                                          <button
                                            onClick={() => handleDeleteGrade(grade.id)}
                                            className="p-1 bg-red-100 hover:bg-red-200 rounded text-red-800"
                                            title="Delete grade"
                                          >
                                            <X size={10} />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-sm text-gray-500 italic p-2 opacity-70">No grades</span>
                                )}
                                {user && (user.role === "ADMIN" || user.role === "TEACHER") && (
                                  <button
                                    onClick={() => handleAddGrade(student)}
                                    className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs border-2 border-dashed border-gray-300"
                                    title="Add grade"
                                  >
                                    <Plus size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-8 text-center text-gray-500">
                            No grades found for this course
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Please select a course to view grades
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Tab Absence Catalog */}
        {activeTab === "absences" && (
          <Card className="border-t-4 border-t-red-500 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-4 border-b-2 border-gray-200 gap-4 bg-white/50 p-4 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Calendar className="text-red-600" />
                <h3 className="font-bold text-xl text-gray-900">Absence Catalog</h3>
              </div>

              <div className="flex items-center gap-2 bg-white p-1 rounded-lg border-2 border-gray-300 shadow-sm">
                <span className="text-xs font-bold text-gray-600 uppercase px-2">Course:</span>
                <select
                  className="bg-transparent text-gray-900 text-sm font-bold focus:outline-none cursor-pointer"
                  value={selectedSubjectAbsences || ""}
                  onChange={(e) => setSelectedSubjectAbsences(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Select a course</option>
                  {classCoursesForClass.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.course?.name || "Course"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto p-2">
              {loadingAbsences ? (
                <div className="p-8 text-center text-gray-500">
                  Loading absences...
                </div>
              ) : selectedSubjectAbsences && absencesData ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse border-2 border-gray-800/50">
                    <thead className="bg-gray-800/10 text-gray-900 uppercase text-xs font-bold tracking-wider">
                      <tr>
                        <th className="p-3 border-2 border-gray-800/30 w-64">Student</th>
                        <th className="p-3 border-2 border-gray-800/30">Absences</th>
                      </tr>
                    </thead>
                    <tbody className="font-hand text-lg">
                      {absencesData.students && absencesData.students.length > 0 ? (
                        absencesData.students.map((student) => (
                          <tr key={student.studentId} className="hover:bg-blue-800/5 transition-colors border-b-2 border-gray-800/20">
                            <td className="p-3 border-r-2 border-gray-800/30 font-bold text-gray-900">
                              {student.studentName}
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-x-6 gap-y-4 items-center py-2">
                                {student.absences && student.absences.length > 0 ? (
                                  student.absences.map((absence, i) => (
                                    <div key={absence.id || i} className="relative inline-block group cursor-default z-10">
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
                                      
                                      {/* Action buttons on hover */}
                                      {user && (user.role === "ADMIN" || user.role === "TEACHER") && (
                                        <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-30">
                                          <button
                                            onClick={() => handleMotivateAbsence(absence.id)}
                                            className={`p-1 rounded ${
                                              absence.excused 
                                                ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800' 
                                                : 'bg-green-100 hover:bg-green-200 text-green-800'
                                            }`}
                                            title={absence.excused ? "Mark as unexcused" : "Mark as excused"}
                                          >
                                            {absence.excused ? '✗' : '✓'}
                                          </button>
                                          <button
                                            onClick={() => handleDeleteAbsence(absence.id)}
                                            className="p-1 bg-red-100 hover:bg-red-200 rounded text-red-800"
                                            title="Delete absence"
                                          >
                                            <X size={10} />
                                          </button>
                                        </div>
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
                                {user && (user.role === "ADMIN" || user.role === "TEACHER") && (
                                  <button
                                    onClick={() => handleAddAbsence(student)}
                                    className="inline-flex items-center justify-center w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs border-2 border-dashed border-gray-300"
                                    title="Add absence"
                                  >
                                    <Plus size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="p-8 text-center text-gray-500">
                            No absences found for this course
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  Please select a course to view absences
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Grade Modal */}
      {user && (user.role === "ADMIN" || user.role === "TEACHER") && (
        <Modal
          isOpen={isGradeModalOpen}
          onClose={() => {
            setIsGradeModalOpen(false);
            setSelectedStudent(null);
            setGradeFormData({ value: "", date: "" });
            setError("");
          }}
          title={gradeFormData.id ? "Edit Grade" : "Add Grade"}
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
            <Button type="submit" className="w-full mt-2" disabled={loadingGrades}>
              {loadingGrades ? "Saving..." : gradeFormData.id ? "Update Grade" : "Add Grade"}
            </Button>
          </form>
        </Modal>
      )}

      {/* Absence Modal */}
      {user && (user.role === "ADMIN" || user.role === "TEACHER") && (
        <Modal
          isOpen={isAbsenceModalOpen}
          onClose={() => {
            setIsAbsenceModalOpen(false);
            setSelectedStudent(null);
            setAbsenceFormData({ date: "", excused: false });
            setEditingAbsenceId(null);
            setError("");
          }}
          title={editingAbsenceId ? "Edit Absence" : "Add Absence"}
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
            {editingAbsenceId && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={absenceFormData.excused}
                    onChange={(e) => setAbsenceFormData({ ...absenceFormData, excused: e.target.checked })}
                    className="w-4 h-4 text-brand-electric focus:ring-brand-electric border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Excused</span>
                </label>
              </div>
            )}
            <Button type="submit" className="w-full mt-2" disabled={loadingAbsences}>
              {loadingAbsences ? "Saving..." : editingAbsenceId ? "Update Absence" : "Add Absence"}
            </Button>
          </form>
        </Modal>
      )}

      {/* Bulk Evaluation Modal */}
      {isBulkModalOpen && (
        <Modal
          isOpen={isBulkModalOpen}
          onClose={() => {
            setIsBulkModalOpen(false);
            setBulkFormData({
              classCourseId: "",
              testDate: "",
              entries: []
            });
            setError("");
          }}
          title="Bulk Evaluation"
        >
          <form onSubmit={handleSubmitBulk} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-lg outline-none bg-gray-50"
                value={classData?.name || ""}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
                value={bulkFormData.classCourseId}
                onChange={(e) => setBulkFormData({ ...bulkFormData, classCourseId: e.target.value })}
                required
              >
                <option value="">Select a subject</option>
                {classCoursesForClass.map(cc => (
                  <option key={cc.id} value={cc.id}>
                    {cc.course?.name || `Course ${cc.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Date</label>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
                value={bulkFormData.testDate}
                onChange={(e) => setBulkFormData({ ...bulkFormData, testDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Students</label>
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-2">
                {allStudents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Loading students...</p>
                ) : (
                  allStudents.map((student) => {
                    const entry = bulkFormData.entries.find(e => e.studentId === student.id) || {
                      studentId: student.id,
                      grade: null,
                      absent: false
                    };
                    return (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.firstName} {student.lastName}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            placeholder="Grade"
                            className="w-16 p-1.5 border border-gray-300 rounded text-sm outline-none focus:border-brand-electric"
                            value={entry.grade || ""}
                            onChange={(e) => {
                              const value = e.target.value === "" ? null : parseInt(e.target.value);
                              handleBulkEntryChange(student.id, 'grade', value);
                            }}
                            disabled={entry.absent}
                          />
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={entry.absent || false}
                              onChange={(e) => handleBulkEntryChange(student.id, 'absent', e.target.checked)}
                              className="w-4 h-4 text-brand-electric focus:ring-brand-electric border-gray-300 rounded"
                            />
                            <span className="text-xs text-gray-600">Absent</span>
                          </label>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loadingBulk}>
              {loadingBulk ? "Saving..." : "Save Bulk Evaluation"}
            </Button>
          </form>
        </Modal>
      )}

      {/* Create Class Course Modal */}
      {isCreateClassCourseModalOpen && (
        <Modal
          isOpen={isCreateClassCourseModalOpen}
          onClose={() => {
            setIsCreateClassCourseModalOpen(false);
            setClassCourseFormData({ courseId: "", teacherId: "" });
            setError("");
          }}
          title="Add Course to Classroom"
        >
          <form onSubmit={handleCreateClassCourse} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
                value={classCourseFormData.courseId}
                onChange={(e) => setClassCourseFormData({ ...classCourseFormData, courseId: e.target.value })}
                required
              >
                <option value="">Select a course</option>
                {allCourses
                  .filter(course => !classCoursesForClass.some(cc => cc.course?.id === course.id || cc.courseId === course.id))
                  .map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-brand-electric"
                value={classCourseFormData.teacherId}
                onChange={(e) => setClassCourseFormData({ ...classCourseFormData, teacherId: e.target.value })}
                required
              >
                <option value="">Select a teacher</option>
                {allTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loadingClassCourse}>
              {loadingClassCourse ? "Adding..." : "Add Course"}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
