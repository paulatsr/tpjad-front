import { useState, useEffect } from "react";
import { useSchool } from "../context/SchoolContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { BookOpen, Calendar, X, Download } from "lucide-react";
import { classroomsAPI, classCoursesAPI, absenceGradesAPI, gradesAPI, absencesAPI, teachersAPI, parentsAPI, studentsAPI, exportAPI } from "../services/api";

export default function MyClassroom() {
  const { user, refreshData } = useSchool();
  const [classroom, setClassroom] = useState(null);
  const [classroomId, setClassroomId] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [catalogData, setCatalogData] = useState(null);
  const [studentsWithParents, setStudentsWithParents] = useState(new Map()); // Map<studentId, {registrationCode, parents: [{registrationCode}]}>
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [teacherId, setTeacherId] = useState(null);
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedClassCourse, setSelectedClassCourse] = useState(null);
  const [gradeFormData, setGradeFormData] = useState({ value: "", date: "" });
  const [absenceFormData, setAbsenceFormData] = useState({ date: "", excused: false });

  useEffect(() => {
    // Get classroom by teacher ID
    if (user && user.role === "TEACHER" && user.userId) {
      loadClassroom();
    }
  }, [user]);

  const loadClassroom = async () => {
    setLoading(true);
    setError("");
    try {
      // Get teacher by userId
      const teacher = await teachersAPI.getByUserId(user.userId);
      if (!teacher || !teacher.id) {
        setError("Teacher not found");
        return;
      }

      setTeacherId(teacher.id);

      // Get classroom by homeroom teacher
      const homeroomClassroom = await classroomsAPI.getByHomeroomTeacher(teacher.id);
      if (!homeroomClassroom) {
        setError("You are not assigned as a homeroom teacher for any classroom.");
        return;
      }

      setClassroom(homeroomClassroom);
      setClassroomId(homeroomClassroom.id);
      
      // Load catalog data
      await loadCatalog(homeroomClassroom.id);
    } catch (err) {
      setError(err.message || "Failed to load classroom");
    } finally {
      setLoading(false);
    }
  };

  const handleExportStudents = async () => {
    if (!teacherId) return;
    try {
      await exportAPI.exportStudentsByHomeroomTeacher(teacherId);
    } catch (err) {
      setError(err.message || "Failed to export students");
    }
  };

  const loadStudentsWithParents = async (classroomId, studentIds) => {
    try {
      // Get all students from classroom to get registration codes
      const allStudents = await studentsAPI.getByClassroom(classroomId);
      const newMap = new Map();
      
      // Store only registration codes for students
      allStudents.forEach(student => {
        if (studentIds.includes(student.id)) {
          newMap.set(student.id, {
            studentId: student.id,
            registrationCode: student.registrationCode || ""
          });
        }
      });
      
      setStudentsWithParents(newMap);
    } catch (err) {
    }
  };

  const loadCatalog = async (id) => {
    setLoading(true);
    setError("");
    try {
      // Get courses for this classroom
      const classCourses = await classCoursesAPI.getByClassroom(id);
      setCourses(classCourses || []);

      // Get grades and absences by classroom
      const classroomData = await absenceGradesAPI.getByClassroom(id);
      
      if (!classroomData || !classroomData.students) {
        setCatalogData(null);
        return;
      }

      // Get grades/absences by course for each course to organize data properly
      const courseDataPromises = classCourses.map(async (cc) => {
        try {
          const courseData = await absenceGradesAPI.getByCourse(cc.id);
          return { classCourse: cc, courseData };
        } catch (err) {
          return { classCourse: cc, courseData: null };
        }
      });

      const allCourseData = await Promise.all(courseDataPromises);

      // Transform data: students on rows, courses on columns
      const studentsMap = new Map();
      
      // Initialize students map from classroom data
      classroomData.students.forEach(student => {
        studentsMap.set(student.studentId, {
          studentId: student.studentId,
          studentName: student.studentName,
          courses: new Map()
        });
      });

      // Fill in course data for each student
      allCourseData.forEach(({ classCourse, courseData }) => {
        if (!courseData || !courseData.students) return;

        courseData.students.forEach(courseStudent => {
          const student = studentsMap.get(courseStudent.studentId);
          if (student) {
            student.courses.set(classCourse.id, {
              classCourseId: classCourse.id,
              courseName: courseData.courseName || classCourse.course?.name || "Course",
              teacherName: courseData.teacherName || 
                (classCourse.teacher ? `${classCourse.teacher.firstName} ${classCourse.teacher.lastName}` : ""),
              grades: courseStudent.grades || [],
              absences: courseStudent.absences || []
            });
          }
        });
      });

      // Convert to array format
      const studentsArray = Array.from(studentsMap.values()).map(student => ({
        studentId: student.studentId,
        studentName: student.studentName,
        courses: classCourses.map(cc => 
          student.courses.get(cc.id) || {
            classCourseId: cc.id,
            courseName: cc.course?.name || "Course",
            teacherName: cc.teacher ? `${cc.teacher.firstName} ${cc.teacher.lastName}` : "",
            grades: [],
            absences: []
          }
        )
      }));

      setStudents(studentsArray);
      setCatalogData({
        classroomName: classroomData.classroom || classroom?.name || "Classroom",
        courses: classCourses.map(cc => ({
          classCourseId: cc.id,
          courseName: cc.course?.name || "Course",
          teacherName: cc.teacher ? `${cc.teacher.firstName} ${cc.teacher.lastName}` : ""
        })),
        students: studentsArray
      });

      // Load students with their registration codes and parents
      await loadStudentsWithParents(id, studentsArray.map(s => s.studentId));
    } catch (err) {
      setError(err.message || "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGrade = (student, course) => {
    setSelectedStudent(student);
    setSelectedClassCourse({
      classCourseId: course.classCourseId,
      courseName: course.courseName
    });
    setGradeFormData({ value: "", date: "" });
    setIsGradeModalOpen(true);
  };

  const handleEditGrade = (student, course, grade) => {
    setSelectedStudent(student);
    setSelectedClassCourse({
      classCourseId: course.classCourseId,
      courseName: course.courseName
    });
    // Format date for input field (YYYY-MM-DD)
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

  const handleAddAbsence = (student, course) => {
    setSelectedStudent(student);
    setSelectedClassCourse({
      classCourseId: course.classCourseId,
      courseName: course.courseName
    });
    setAbsenceFormData({ date: "", excused: false });
    setIsAbsenceModalOpen(true);
  };

  const handleMotivateAbsence = async (absenceId) => {
    try {
      await absencesAPI.toggleExcused(absenceId);
      await loadCatalog(classroomId);
      await refreshData();
    } catch (err) {
      alert(err.message || "Failed to toggle absence status");
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

  if (!classroomId || !catalogData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">You are not assigned as a homeroom teacher for any classroom.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-text">My Classroom</h1>
        <p className="text-brand-muted">Class {catalogData?.classroomName} - Catalog</p>
        {teacherId && (
          <div className="mt-4">
            <Button onClick={handleExportStudents} className="flex items-center gap-2">
              <Download size={16} />
              Export Students
            </Button>
          </div>
        )}
      </div>

      {catalogData && catalogData.students && catalogData.students.length > 0 && (
        <Card className="border-t-4 border-t-brand-electric shadow-xl paper-lined overflow-hidden">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b-2 border-gray-800/20 bg-white/50 p-4 rounded-t-lg">
            <BookOpen className="text-brand-electric" />
            <h3 className="font-bold text-xl text-gray-900">Grade Catalog</h3>
          </div>

          <div className="overflow-x-auto p-2">
            <table className="w-full text-left text-sm border-collapse border-2 border-gray-800/50">
              <thead className="bg-gray-800/10 text-gray-900 uppercase text-xs font-bold tracking-wider">
                <tr>
                  <th className="p-3 border-2 border-gray-800/30 w-64 sticky left-0 bg-gray-800/10 z-10">Student</th>
                  {catalogData.courses?.map((course) => (
                    <th key={course.classCourseId} className="p-3 border-2 border-gray-800/30 min-w-[300px]">
                      <div className="flex flex-col">
                        <span>{course.courseName}</span>
                        <span className="text-xs font-normal text-gray-600 mt-0.5">{course.teacherName}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-hand text-lg">
                {catalogData.students?.map((student) => (
                  <tr key={student.studentId} className="hover:bg-blue-800/5 transition-colors border-b-2 border-gray-800/20">
                    <td className="p-3 border-r-2 border-gray-800/30 font-bold text-gray-900 sticky left-0 bg-white z-10">
                      <div className="flex flex-col">
                        <span>{student.studentName}</span>
                        {studentsWithParents.has(student.studentId) && studentsWithParents.get(student.studentId).registrationCode && (
                          <span className="mt-1 text-xs font-normal text-gray-600">
                            {studentsWithParents.get(student.studentId).registrationCode}
                          </span>
                        )}
                      </div>
                    </td>
                    {student.courses?.map((course, idx) => (
                      <td key={idx} className="p-3 border-r-2 border-gray-800/30">
                        <div className="space-y-4">
                          {/* Grades Section */}
                          <div>
                            <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Grades</div>
                            <div className="flex flex-wrap gap-3 items-center">
                              {course.grades && course.grades.length > 0 ? (
                                course.grades.map((grade, i) => (
                                  <div 
                                    key={i} 
                                    className="flex flex-col items-center justify-center w-12 h-12 border-2 border-gray-800/60 bg-white shadow-sm rounded-sm transform rotate-[-1deg] relative group"
                                  >
                                    <span className={`text-2xl font-bold leading-none ${grade.value < 5 ? 'text-red-700' : 'text-blue-900'}`}>
                                      {grade.value}
                                    </span>
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
                          </div>

                          {/* Absences Section */}
                          <div>
                            <div className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Absences</div>
                            <div className="flex flex-wrap gap-x-6 gap-y-4 items-center py-2">
                              {course.absences && course.absences.length > 0 ? (
                                course.absences.map((absence, i) => (
                                  <div key={i} className="relative inline-block group cursor-default z-10">
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
                                    
                                    {/* Action buttons on hover - only toggle excused */}
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
                                    </div>

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

